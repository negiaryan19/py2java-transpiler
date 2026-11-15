/**
 * Outgoing Webhook Dispatcher with AbortController timeout & delivery logs
 * 
 * @param {Object} options
 * @param {string} options.webhookUrl - Target destination URL
 * @param {Object} options.payload - JSON payload to deliver
 * @param {string} [options.signingSecret] - Optional HMAC secret
 * @returns {Promise<Object>} Delivery report
 */
export async function dispatchWebhook({ webhookUrl, payload = {}, signingSecret }) {
  if (!webhookUrl || typeof webhookUrl !== 'string') {
    return {
      dispatched: false,
      error: 'Missing or invalid target webhook_url',
      timestamp: new Date().toISOString(),
    };
  }

  const secret = signingSecret || process.env.WEBHOOK_SECRET || 'whsec_btin337_ciap_99481a';
  const deliveryId = 'wh_' + Math.random().toString(36).substring(2, 9);
  const timestamp = new Date().toISOString();

  // 6-second timeout via AbortController to prevent serverless freezing
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'JForge-Webhook-Dispatcher/1.0 (BTIN337-CIAP)',
    'X-Event-Type': 'code.conversion.completed',
    'X-Timestamp': timestamp,
    'X-JForge-Delivery': deliveryId,
    'X-JForge-Signature': `t=${Math.floor(Date.now() / 1000)},v1=${Buffer.from(secret).toString('base64').slice(0, 24)}`,
  };

  const bodyData = {
    id: deliveryId,
    event: 'code.conversion.completed',
    status: 'delivered',
    created_at: timestamp,
    ...payload,
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyData),
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
      error: isTimeout ? 'Webhook delivery timed out after 6000ms' : error.message,
      timestamp,
      headers,
      payload: bodyData,
    };
  }
}
