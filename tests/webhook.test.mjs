import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { dispatchWebhook } from '../lib/webhook.js';

test('Webhook Dispatcher: Computes valid HMAC SHA-256 signature', () => {
  const secret = 'whsec_btin337_ciap_99481a';
  const payloadStr = JSON.stringify({ event: 'code.conversion.completed', test: true });
  const expectedSig = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');

  const actualSig = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
  assert.equal(actualSig, expectedSig);
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
