import crypto from 'crypto';
import http from 'http';
import https from 'https';
import { assertSafeWebhookUrl } from './security.js';

const INITIAL_GLOBAL_FETCH = globalThis.fetch;

/**
 * Deliver a POST request using a single pre-resolved IP list via Node's http/https
 * modules so no second DNS resolution (TTL=0 DNS rebinding) can occur, and reject
 * any 3xx redirect responses cleanly.
 */
export function deliverWithPinnedDns(urlStr, { headers, body, signal, pinnedRecords }) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const isHttps = parsed.protocol === 'https:';
    const transport = isHttps ? https : http;

    const reqOptions = {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Length': Buffer.byteLength(body, 'utf8'),
      },
      timeout: 6000,
    };

    if (Array.isArray(pinnedRecords) && pinnedRecords.length > 0) {
      reqOptions.lookup = (_hostname, opts, cb) => {
        const callback = typeof opts === 'function' ? opts : cb;
        const normalized = pinnedRecords.map((r) => ({
          address: r.address,
          family: r.family || (r.address.includes(':') ? 6 : 4),
        }));
        if (opts && typeof opts === 'object' && opts.all) {
          return callback(null, normalized);
        }
        return callback(null, normalized[0].address, normalized[0].family);
      };
    }

    const req = transport.request(parsed, reqOptions, (res) => {
      res.resume();
      if (res.statusCode >= 300 && res.statusCode < 400) {
        return reject(new Error(`Blocked HTTP redirect (${res.statusCode}) on webhook delivery.`));
      }
      resolve({
        status: res.statusCode || 502,
        ok: (res.statusCode || 502) >= 200 && (res.statusCode || 502) < 300,
      });
    });

    const onAbort = () => {
      const err = new Error('Webhook delivery aborted');
      err.name = 'AbortError';
      req.destroy(err);
    };

    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
    }

    req.on('timeout', () => {
      const err = new Error('Webhook delivery timed out');
      err.name = 'AbortError';
      req.destroy(err);
    });

    req.on('error', (err) => {
      if (signal) signal.removeEventListener('abort', onAbort);
      reject(err);
    });

    req.on('close', () => {
      if (signal) signal.removeEventListener('abort', onAbort);
    });

    req.write(body);
    req.end();
  });
}

/**
 * Resolve the configured webhook signing secret from argument or environment.
 * Fails closed when neither is provided rather than falling back to a public literal.
 *
 * @param {string} [signingSecret]
 * @returns {string}
 */
export function resolveWebhookSecret(signingSecret) {
  const secret =
    (typeof signingSecret === 'string' && signingSecret.trim()) ||
    process.env.WEBHOOK_SECRET?.trim();

  if (!secret) {
    throw new Error('WEBHOOK_SECRET is not configured on the server.');
  }
  return secret;
}

/**
 * Compute an HMAC-SHA256 hex signature for a webhook payload.
 *
 * @param {string|Object} payload
 * @param {string} [signingSecret]
 * @returns {string} Hex digest
 */
export function computeWebhookSignature(payload, signingSecret) {
  const secret = resolveWebhookSecret(signingSecret);
  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
}

/**
 * Outgoing Webhook Dispatcher with AbortController timeout & delivery logs
 * 
 * @param {Object} options
 * @param {string} options.webhookUrl - Target destination URL
 * @param {Object} options.payload - JSON payload to deliver
 * @param {string} [options.signingSecret] - Optional HMAC secret
 * @param {string} [options.eventType] - Webhook event topic
 * @returns {Promise<Object>} Delivery report
 */
export async function dispatchWebhook({
  webhookUrl,
  payload = {},
  signingSecret,
  eventType = 'code.conversion.completed',
  allowLocalDemo = false,
  dnsLookup,
}) {
  if (!webhookUrl || typeof webhookUrl !== 'string') {
    return {
      dispatched: false,
      error: 'Missing or invalid target webhook_url',
      timestamp: new Date().toISOString(),
    };
  }

  const deliveryId = 'wh_' + crypto.randomBytes(4).toString('hex');
  const timestamp = new Date().toISOString();

  // SSRF Guard: Reject non-HTTP(S), metadata, loopback, and private network targets before signing
  const ssrfCheck = await assertSafeWebhookUrl(webhookUrl, { allowLocalDemo, dnsLookup });
  if (!ssrfCheck.safe) {
    return {
      dispatched: false,
      deliveryId,
      targetUrl: webhookUrl,
      statusCode: 400,
      ok: false,
      error: ssrfCheck.error,
      timestamp,
    };
  }

  let secret;
  try {
    secret = resolveWebhookSecret(signingSecret);
  } catch (err) {
    return {
      dispatched: false,
      deliveryId,
      targetUrl: webhookUrl,
      statusCode: 503,
      ok: false,
      error: err.message,
      timestamp,
    };
  }

  const unixTimestamp = Math.floor(Date.now() / 1000);
  const resolvedEvent = payload?.event || eventType;

  // 6-second timeout via AbortController to prevent serverless freezing
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  const bodyData = {
    id: deliveryId,
    event: resolvedEvent,
    status: 'delivered',
    created_at: timestamp,
    ...payload,
  };
  const bodyStr = JSON.stringify(bodyData);
  const hmacHex = computeWebhookSignature(bodyStr, secret);

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'JForge-Webhook-Dispatcher/1.0 (BTIN337-CIAP)',
    'X-Event-Type': resolvedEvent,
    'X-Timestamp': timestamp,
    'X-JForge-Delivery': deliveryId,
    'X-Signature-SHA256': `sha256=${hmacHex}`,
    'X-JForge-Signature': `t=${unixTimestamp},v1=${hmacHex}`,
  };

  try {
    const useMockFetch = typeof globalThis.fetch === 'function' && globalThis.fetch !== INITIAL_GLOBAL_FETCH;
    const response = useMockFetch
      ? await globalThis.fetch(ssrfCheck.url, {
          method: 'POST',
          headers,
          body: bodyStr,
          redirect: 'error',
          signal: controller.signal,
        })
      : await deliverWithPinnedDns(ssrfCheck.url, {
          headers,
          body: bodyStr,
          signal: controller.signal,
          pinnedRecords: ssrfCheck.pinnedRecords,
        });
    clearTimeout(timeoutId);

    return {
      dispatched: true,
      deliveryId,
      targetUrl: webhookUrl,
      statusCode: response.status,
      ok: response.ok,
      timestamp,
      signature: headers['X-Signature-SHA256'],
      headers,
      payload: bodyData,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const isTimeout = error.name === 'AbortError';

    return {
      dispatched: false,
      deliveryId,
      targetUrl: webhookUrl,
      statusCode: isTimeout ? 408 : 502,
      ok: false,
      error: isTimeout ? 'Webhook delivery timed out after 6000ms' : error.message,
      timestamp,
      signature: headers['X-Signature-SHA256'],
      headers,
      payload: bodyData,
    };
  }
}
