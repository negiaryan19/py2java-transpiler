import crypto from 'crypto';

/**
 * Resolve the configured webhook signing secret from argument or environment.
 *
 * @param {string} [signingSecret]
 * @returns {string}
 */
export function resolveWebhookSecret(signingSecret) {
  return signingSecret || process.env.WEBHOOK_SECRET || 'whsec_btin337_ciap_99481a';
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
}) {
  if (!webhookUrl || typeof webhookUrl !== 'string') {
    return {
      dispatched: false,
      error: 'Missing or invalid target webhook_url',
      timestamp: new Date().toISOString(),
    };
  }

  const secret = resolveWebhookSecret(signingSecret);
  const deliveryId = 'wh_' + crypto.randomBytes(4).toString('hex');
  const timestamp = new Date().toISOString();
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
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: bodyStr,
      signal: controller.signal,
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
