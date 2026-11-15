import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { POST } from '../app/api/v1/webhook-verify/route.js';

test('Webhook Verify Route: Returns 400 when payload or signature is missing', async () => {
  const req = {
    json: async () => ({ secret: 'test_secret' }),
  };

  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.http_code, 400);
});

test('Webhook Verify Route: Returns verified: true for authentic signature', async () => {
  const payload = { event: 'code.conversion.completed', test: 123 };
  const secret = 'whsec_btin337_test_secret';
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  const req = {
    json: async () => ({
      payload,
      secret,
      signature: `sha256=${expectedSig}`,
    }),
  };

  const res = await POST(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'success');
  assert.equal(data.verified, true);
  assert.equal(data.computed_signature, expectedSig);
});

test('Webhook Verify Route: Returns verified: false when payload is tampered', async () => {
  const originalPayload = { event: 'code.conversion.completed', test: 123 };
  const tamperedPayload = { event: 'code.conversion.completed', test: 999 };
  const secret = 'whsec_btin337_test_secret';
  const originalSig = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(originalPayload))
    .digest('hex');

  const req = {
    json: async () => ({
      payload: tamperedPayload,
      secret,
      signature: originalSig,
    }),
  };

  const res = await POST(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.verified, false);
});

test('Webhook Verify Route: Handles mismatched signature length safely without crashing', async () => {
  const req = {
    json: async () => ({
      payload: { hello: 'world' },
      secret: 'whsec_test',
      signature: 'short_invalid_sig',
    }),
  };

  const res = await POST(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.verified, false);
});
