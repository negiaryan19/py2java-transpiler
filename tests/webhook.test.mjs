import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { dispatchWebhook, computeWebhookSignature } from '../lib/webhook.js';
import { POST as verifyPost } from '../app/api/v1/webhook-verify/route.js';
import { POST as convertPost } from '../app/api/v1/convert/route.js';

test('Webhook Dispatcher: Computes valid HMAC SHA-256 signature and passes verification', async () => {
  const secret = 'whsec_btin337_ciap_99481a';
  const origFetch = globalThis.fetch;
  let capturedInit = null;

  globalThis.fetch = async (_url, init) => {
    capturedInit = init;
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  };

  try {
    const report = await dispatchWebhook({
      webhookUrl: 'http://localhost:3000/api/v1/webhook-demo',
      payload: { event: 'code.conversion.completed', test: true },
      signingSecret: secret,
    });

    assert.equal(report.dispatched, true);
    assert.equal(report.statusCode, 200);
    assert.equal(report.ok, true);

    const payloadStr = JSON.stringify(report.payload);
    assert.equal(capturedInit.body, payloadStr);

    const expectedHex = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
    assert.equal(computeWebhookSignature(report.payload, secret), expectedHex);
    assert.equal(report.headers['X-Signature-SHA256'], `sha256=${expectedHex}`);
    assert.ok(report.headers['X-JForge-Signature'].endsWith(`v1=${expectedHex}`));

    // Ensure raw secret base64 is NOT leaked in signature header
    const leakedPrefix = Buffer.from(secret).toString('base64').slice(0, 12);
    assert.equal(report.headers['X-JForge-Signature'].includes(leakedPrefix), false);

    // End-to-end check against POST /api/v1/webhook-verify
    const verifyRes = await verifyPost({
      json: async () => ({
        payload: report.payload,
        signature: report.headers['X-Signature-SHA256'],
        secret,
      }),
    });
    assert.equal(verifyRes.status, 200);
    const verifyJson = await verifyRes.json();
    assert.equal(verifyJson.verified, true);
    assert.equal(verifyJson.computed_signature, expectedHex);

    // Also verify v1= format from X-JForge-Signature works
    const verifyV1Res = await verifyPost({
      json: async () => ({
        payload: report.payload,
        signature: report.headers['X-JForge-Signature'],
        secret,
      }),
    });
    const verifyV1Json = await verifyV1Res.json();
    assert.equal(verifyV1Json.verified, true);
  } finally {
    globalThis.fetch = origFetch;
  }
});

test('Webhook Dispatcher: Fails gracefully without throwing on invalid URL', async () => {
  const report = await dispatchWebhook({
    webhookUrl: 'http://localhost:9999/non-existent-port',
    payload: { event: 'code.conversion.completed' },
  });

  assert.equal(report.dispatched, false);
  assert.ok(report.deliveryId);
  assert.ok(report.error);
});

test('Convert Route: Dispatches relative webhook_url and returns verifiable HMAC headers', async () => {
  process.env.APP_API_KEY = 'ciap-secret-key-2026';
  const origGeminiKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const origFetch = globalThis.fetch;
  let capturedUrl = '';

  globalThis.fetch = async (url, init) => {
    if (String(url).includes('/api/v1/webhook-demo')) {
      capturedUrl = String(url);
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }
    return origFetch(url, init);
  };

  try {
    const req = new Request('http://localhost:3000/api/v1/convert', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 'ciap-secret-key-2026',
      },
      body: JSON.stringify({
        python_code: 'print(42)',
        java_version: '17',
        webhook_url: '/api/v1/webhook-demo',
      }),
    });

    const res = await convertPost(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(capturedUrl, 'http://localhost:3000/api/v1/webhook-demo');
    assert.equal(data.webhook_delivery.dispatched, true);
    assert.equal(data.webhook_delivery.status_code, 200);
    assert.ok(data.webhook_delivery.headers['X-Signature-SHA256'].startsWith('sha256='));

    const verifyRes = await verifyPost({
      json: async () => ({
        payload: data.webhook_delivery.payload,
        signature: data.webhook_delivery.headers['X-Signature-SHA256'],
      }),
    });
    const verifyJson = await verifyRes.json();
    assert.equal(verifyJson.verified, true);
  } finally {
    globalThis.fetch = origFetch;
    if (origGeminiKey !== undefined) {
      process.env.GEMINI_API_KEY = origGeminiKey;
    }
  }
});
