import crypto from 'crypto';
import net from 'net';
import { lookup as defaultDnsLookup } from 'dns/promises';

export const MAX_CODE_CHARS = 25000;
export const ALLOWED_JAVA_VERSIONS = ['11', '17', '21'];

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata',
  'instance-data',
]);

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);

/**
 * Normalize and strictly allowlist Java LTS versions to prevent prompt injection.
 *
 * @param {string} [rawVersion='17']
 * @returns {{ valid: boolean, value?: string, error?: string }}
 */
export function normalizeJavaVersion(rawVersion = '17') {
  const str = String(rawVersion ?? '17').trim();
  if (!str) return { valid: true, value: '17' };

  // Support exact version numbers ('11', '17', '21') or standard labels ('Java 17 LTS')
  const match = str.match(/^(?:java\s+)?(11|17|21)(?:\s+lts)?$/i);
  if (!match) {
    return {
      valid: false,
      error: "Invalid 'java_version'. Supported LTS versions are '11', '17', and '21'.",
    };
  }
  return { valid: true, value: match[1] };
}

/**
 * Validate source code length and non-empty string structure.
 *
 * @param {unknown} code
 * @param {string} fieldName
 * @param {number} [maxChars=MAX_CODE_CHARS]
 * @returns {{ valid: boolean, status?: number, error?: string }}
 */
export function validateCodePayload(code, fieldName = 'python_code', maxChars = MAX_CODE_CHARS) {
  if (!code || typeof code !== 'string' || !code.trim()) {
    return {
      valid: false,
      status: 400,
      error: `Field '${fieldName}' is required and must be a non-empty string.`,
    };
  }
  if (code.length > maxChars) {
    return {
      valid: false,
      status: 413,
      error: `Field '${fieldName}' exceeds maximum allowed length of ${maxChars} characters.`,
    };
  }
  return { valid: true };
}

function isPrivateIPv4Octets(octets) {
  if (octets.length !== 4 || octets.some((n) => n < 0 || n > 255)) return true;
  const [a, b, c] = octets;

  return (
    a === 0 || // 0.0.0.0/8 ("this network")
    a === 10 || // 10.0.0.0/8 (RFC 1918)
    (a === 100 && b >= 64 && b <= 127) || // 100.64.0.0/10 (CGNAT RFC 6598)
    a === 127 || // 127.0.0.0/8 (loopback)
    (a === 169 && b === 254) || // 169.254.0.0/16 (link-local & cloud metadata)
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12 (RFC 1918)
    (a === 192 && b === 0 && c === 0) || // 192.0.0.0/24
    (a === 192 && b === 0 && c === 2) || // 192.0.2.0/24 (TEST-NET-1)
    (a === 192 && b === 168) || // 192.168.0.0/16 (RFC 1918)
    (a === 198 && (b === 18 || b === 19)) || // 198.18.0.0/15 (benchmark)
    (a === 198 && b === 51 && c === 100) || // 198.51.100.0/24 (TEST-NET-2)
    (a === 203 && b === 0 && c === 113) || // 203.0.113.0/24 (TEST-NET-3)
    a >= 224 // 224.0.0.0/4 (multicast) & 240.0.0.0/4 (reserved/broadcast)
  );
}

function parseIPv6Words(ip) {
  let clean = ip.replace(/^\[|\]$/g, '').split('%')[0].toLowerCase();

  // Convert trailing embedded IPv4 (e.g., ::ffff:127.0.0.1) to two 16-bit hex groups
  const lastColon = clean.lastIndexOf(':');
  const tail = clean.slice(lastColon + 1);
  if (tail.includes('.')) {
    const octets = tail.split('.').map(Number);
    if (octets.length !== 4 || octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
      return null;
    }
    const hi = ((octets[0] << 8) | octets[1]).toString(16);
    const lo = ((octets[2] << 8) | octets[3]).toString(16);
    clean = `${clean.slice(0, lastColon)}:${hi}:${lo}`;
  }

  const halves = clean.split('::');
  if (halves.length > 2) return null;

  const left = halves[0] ? halves[0].split(':') : [];
  const right = halves[1] ? halves[1].split(':') : [];
  const missing = halves.length === 2 ? 8 - (left.length + right.length) : 0;
  if (missing < 0 || (halves.length === 1 && left.length !== 8)) return null;

  const groups = [
    ...left,
    ...Array.from({ length: missing }, () => '0'),
    ...right,
  ];
  if (groups.length !== 8) return null;

  const words = groups.map((g) => Number.parseInt(g || '0', 16));
  if (words.some((w) => Number.isNaN(w) || w < 0 || w > 0xffff)) return null;
  return words;
}

/**
 * Determine whether an IPv4 or IPv6 address belongs to a private, loopback,
 * link-local, metadata, multicast, or otherwise reserved network range.
 *
 * @param {string} ip
 * @returns {boolean}
 */
export function isPrivateOrReservedIp(ip) {
  if (!ip || typeof ip !== 'string') return true;
  const clean = ip.replace(/^\[|\]$/g, '').split('%')[0].trim();
  const version = net.isIP(clean);

  if (version === 4) {
    return isPrivateIPv4Octets(clean.split('.').map(Number));
  }

  if (version === 6) {
    const words = parseIPv6Words(clean);
    if (!words) return true;

    const allZeroExceptLast =
      words[0] === 0 && words[1] === 0 && words[2] === 0 &&
      words[3] === 0 && words[4] === 0 && words[5] === 0 && words[6] === 0;
    if (allZeroExceptLast && (words[7] === 0 || words[7] === 1)) {
      return true; // :: or ::1
    }

    // IPv4-mapped (::ffff:0:0/96) or IPv4-compatible (::/96)
    const isMappedV4 =
      words[0] === 0 && words[1] === 0 && words[2] === 0 &&
      words[3] === 0 && words[4] === 0 && (words[5] === 0xffff || words[5] === 0);
    if (isMappedV4) {
      const octets = [
        (words[6] >> 8) & 0xff,
        words[6] & 0xff,
        (words[7] >> 8) & 0xff,
        words[7] & 0xff,
      ];
      return isPrivateIPv4Octets(octets);
    }

    // ULA fc00::/7, link-local fe80::/10, multicast ff00::/8, documentation 2001:db8::/32
    if ((words[0] & 0xfe00) === 0xfc00) return true;
    if ((words[0] & 0xffc0) === 0xfe80) return true;
    if ((words[0] & 0xff00) === 0xff00) return true;
    if (words[0] === 0x2001 && words[1] === 0x0db8) return true;

    return false;
  }

  return true;
}

/**
 * Validate an outbound webhook URL against SSRF vectors (schemes, credentials,
 * loopback/private/link-local/metadata ranges, and DNS resolution).
 *
 * @param {string} rawUrl
 * @param {Object} [options]
 * @param {boolean} [options.allowLocalDemo=false] - Allow same-host /api/v1/webhook-demo explicitly
 * @param {Function} [options.dnsLookup] - Optional DNS lookup override for deterministic tests
 * @returns {Promise<{ safe: boolean, url?: string, error?: string }>}
 */
export async function assertSafeWebhookUrl(rawUrl, options = {}) {
  const { allowLocalDemo = false, dnsLookup = defaultDnsLookup } = options;

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { safe: false, error: 'Malformed webhook_url.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { safe: false, error: `Blocked unsafe webhook scheme '${parsed.protocol}'. Only HTTP/HTTPS allowed.` };
  }

  if (parsed.username || parsed.password) {
    return { safe: false, error: 'Webhook URL must not embed credentials.' };
  }

  const host = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();

  // Permit local self-test receiver ONLY when caller explicitly resolves /api/v1/webhook-demo
  if (allowLocalDemo && parsed.pathname === '/api/v1/webhook-demo' && LOOPBACK_HOSTS.has(host)) {
    return { safe: true, url: parsed.toString() };
  }

  if (
    BLOCKED_HOSTNAMES.has(host) ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.localhost') ||
    host.endsWith('.localdomain')
  ) {
    return { safe: false, error: `Blocked internal or reserved webhook host '${host}'.` };
  }

  if (net.isIP(host)) {
    if (isPrivateOrReservedIp(host)) {
      return { safe: false, error: `Blocked private or reserved webhook IP '${host}'.` };
    }
    return { safe: true, url: parsed.toString() };
  }

  try {
    const records = await dnsLookup(host, { all: true });
    const list = Array.isArray(records) ? records : [records];
    if (!list.length) {
      return { safe: false, error: `Unable to resolve webhook hostname '${host}'.` };
    }
    for (const record of list) {
      const addr = record?.address;
      if (!addr || isPrivateOrReservedIp(addr)) {
        return { safe: false, error: `Blocked webhook hostname resolving to private/reserved IP.` };
      }
    }
    return { safe: true, url: parsed.toString() };
  } catch {
    return { safe: false, error: `DNS lookup failed for webhook host '${host}'.` };
  }
}

/**
 * Derive a trustworthy client identifier from proxy headers, prioritizing
 * platform-verified Vercel headers before falling back to x-real-ip / forwarded chain.
 *
 * @param {Headers|{ get?: (name: string) => string|null }} headersLike
 * @returns {string}
 */
export function extractTrustedClientIp(headersLike) {
  const get = (name) => headersLike?.get?.(name) || null;

  const vercelIp = get('x-vercel-forwarded-for')?.split(',')[0]?.trim();
  if (vercelIp) return vercelIp;

  const realIp = get('x-real-ip')?.trim();
  if (realIp) return realIp;

  const forwarded = get('x-forwarded-for');
  if (forwarded) {
    const hops = forwarded.split(',').map((s) => s.trim()).filter(Boolean);
    if (hops.length > 0) {
      // Rightmost hop is appended by the closest proxy and harder to spoof than leftmost hop
      return hops[hops.length - 1];
    }
  }

  const apiKey = get('x-api-key');
  if (apiKey) {
    return 'key_' + crypto.createHash('sha256').update(apiKey).digest('hex').slice(0, 12);
  }

  return 'global_client';
}
