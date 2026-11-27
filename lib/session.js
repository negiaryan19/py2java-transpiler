import crypto from 'crypto';

export const SESSION_COOKIE_NAME = 'jforge_session';
export const OAUTH_TX_COOKIE_NAME = 'jforge_oauth_tx';
export const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours
export const OAUTH_TX_TTL_SECONDS = 60 * 10; // 10 minutes
export const MAX_USER_GEMINI_CALLS_PER_HOUR = 40;

const USER_BUDGET_WINDOW_MS = 60 * 60 * 1000;
const MAX_USER_BUDGET_BUCKETS = 10000;

/**
 * Retrieve server-side HMAC signing secret for auth cookies.
 * Never falls back to hardcoded strings.
 *
 * @returns {string|null}
 */
export function getAuthSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret || secret.length < 16) {
    return null;
  }
  return secret;
}

/**
 * Check whether Google OAuth 2.0 credentials and session signing secret are configured.
 *
 * @returns {boolean}
 */
export function isGoogleOAuthConfigured() {
  return Boolean(
    getAuthSecret() &&
      process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}

/**
 * Restrict post-login redirects strictly to local same-origin app paths.
 *
 * @param {string} [rawPath='/']
 * @returns {string}
 */
export function sanitizeReturnPath(rawPath = '/') {
  if (typeof rawPath !== 'string') return '/';
  const trimmed = rawPath.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return '/';
  }
  return trimmed.length <= 200 ? trimmed : '/';
}

/**
 * Resolve canonical public origin for constructing Google OAuth callback URLs.
 *
 * @param {Headers|{ get?: (name: string) => string|null }} headersLike
 * @param {string} [requestUrl]
 * @returns {string}
 */
export function resolvePublicOrigin(headersLike, requestUrl) {
  const configuredUrl = process.env.AUTH_URL?.trim();
  if (configuredUrl) {
    try {
      return new URL(configuredUrl).origin;
    } catch {
      // Ignore malformed override and fall back cleanly
    }
  }

  const get = (k) => headersLike?.get?.(k) || null;
  const rawHost = get('x-forwarded-host') || get('host');
  if (rawHost) {
    const candidate = rawHost.split(',')[0].trim();
    if (/^[a-zA-Z0-9.-]+(?::\d{1,5})?$/.test(candidate)) {
      const proto =
        get('x-forwarded-proto')?.split(',')[0]?.trim() === 'http' &&
        (candidate.startsWith('localhost') || candidate.startsWith('127.0.0.1'))
          ? 'http'
          : candidate.startsWith('localhost') || candidate.startsWith('127.0.0.1')
            ? 'http'
            : 'https';
      return `${proto}://${candidate}`;
    }
  }

  if (requestUrl) {
    try {
      return new URL(requestUrl).origin;
    } catch {
      // Ignore
    }
  }

  return 'http://localhost:3000';
}

function signSignedPayload(payloadObj, secret) {
  const payloadB64 = Buffer.from(JSON.stringify(payloadObj), 'utf8').toString('base64url');
  const sigB64 = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sigB64}`;
}

function verifySignedPayload(token, secret) {
  if (!token || typeof token !== 'string' || !secret) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return null;

  const expectedSigB64 = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  const sigBuf = Buffer.from(sigB64, 'utf8');
  const expectedBuf = Buffer.from(expectedSigB64, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) return null;
    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof decoded.exp !== 'number' || decoded.exp <= nowSec) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Create a short-lived HMAC-signed PKCE/state OAuth transaction cookie payload.
 *
 * @param {{ returnTo?: string }} [options]
 * @returns {{ state: string, codeChallenge: string, txToken: string, returnTo: string }}
 */
export function createOAuthTransaction({ returnTo = '/' } = {}) {
  const secret = getAuthSecret();
  if (!secret) {
    throw new Error('AUTH_SECRET is not configured on the server.');
  }

  const safeReturnTo = sanitizeReturnPath(returnTo);
  const state = crypto.randomBytes(24).toString('hex');
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  const nowSec = Math.floor(Date.now() / 1000);

  const txToken = signSignedPayload(
    {
      kind: 'oauth_tx',
      state,
      codeVerifier,
      returnTo: safeReturnTo,
      iat: nowSec,
      exp: nowSec + OAUTH_TX_TTL_SECONDS,
    },
    secret
  );

  return { state, codeChallenge, txToken, returnTo: safeReturnTo };
}

/**
 * Validate OAuth callback state against signed PKCE transaction cookie in constant time.
 *
 * @param {string} txToken
 * @param {string} returnedState
 * @returns {{ state: string, codeVerifier: string, returnTo: string }|null}
 */
export function verifyOAuthTransaction(txToken, returnedState) {
  const secret = getAuthSecret();
  if (!secret || !returnedState || typeof returnedState !== 'string') return null;

  const decoded = verifySignedPayload(txToken, secret);
  if (!decoded || decoded.kind !== 'oauth_tx' || !decoded.state || !decoded.codeVerifier) {
    return null;
  }

  const expectedBuf = Buffer.from(decoded.state, 'utf8');
  const providedBuf = Buffer.from(returnedState, 'utf8');
  if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
    return null;
  }

  return {
    state: decoded.state,
    codeVerifier: decoded.codeVerifier,
    returnTo: sanitizeReturnPath(decoded.returnTo),
  };
}

/**
 * Build Google OAuth 2.0 Authorization URL with PKCE S256 & account picker.
 */
export function buildGoogleAuthUrl({ origin, state, codeChallenge }) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured on the server.');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
    access_type: 'online',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Issue a signed session cookie token for a verified Google account.
 *
 * @param {{ sub: string, email: string, name?: string, provider?: string }} user
 * @returns {string}
 */
export function createSessionToken(user) {
  const secret = getAuthSecret();
  if (!secret) {
    throw new Error('AUTH_SECRET is not configured on the server.');
  }
  if (!user?.sub || !user?.email) {
    throw new Error('Authenticated user sub and email are required.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  return signSignedPayload(
    {
      kind: 'session',
      sub: String(user.sub).slice(0, 128),
      email: String(user.email).slice(0, 160),
      name: String(user.name || user.email.split('@')[0]).slice(0, 120),
      provider: String(user.provider || 'google').slice(0, 32),
      iat: nowSec,
      exp: nowSec + SESSION_TTL_SECONDS,
    },
    secret
  );
}

/**
 * Verify signed session cookie token and return user claims or null.
 *
 * @param {string|undefined|null} token
 * @returns {{ sub: string, email: string, name: string, provider: string, iat: number, exp: number }|null}
 */
export function verifySessionToken(token) {
  const secret = getAuthSecret();
  if (!secret) return null;

  const decoded = verifySignedPayload(token, secret);
  if (!decoded || decoded.kind !== 'session' || !decoded.sub || !decoded.email) {
    return null;
  }

  return {
    sub: decoded.sub,
    email: decoded.email,
    name: decoded.name || decoded.email.split('@')[0],
    provider: decoded.provider || 'google',
    iat: decoded.iat,
    exp: decoded.exp,
  };
}

/**
 * Track per-user hourly Gemini quota consumption cleanly in warm serverless memory
 * so no single authenticated user can exhaust shared server quota.
 *
 * @param {string} userId
 * @param {number} [limit=MAX_USER_GEMINI_CALLS_PER_HOUR]
 * @returns {{ allowed: boolean, remaining: number, used: number }}
 */
export function consumeUserGeminiQuota(userId, limit = MAX_USER_GEMINI_CALLS_PER_HOUR) {
  const store = globalThis.__jforgeUserGeminiBudgets || new Map();
  if (!globalThis.__jforgeUserGeminiBudgets) {
    globalThis.__jforgeUserGeminiBudgets = store;
  }

  const now = Date.now();
  const key = String(userId || 'anonymous');
  let entry = store.get(key);

  if (!entry || now - entry.windowStart >= USER_BUDGET_WINDOW_MS) {
    if (store.size >= MAX_USER_BUDGET_BUCKETS) {
      const oldestKey = store.keys().next().value;
      if (oldestKey !== undefined) store.delete(oldestKey);
    }
    entry = { count: 1, windowStart: now };
    store.set(key, entry);
  } else {
    entry.count += 1;
  }

  return {
    allowed: entry.count <= limit,
    used: entry.count,
    remaining: Math.max(0, limit - entry.count),
  };
}
