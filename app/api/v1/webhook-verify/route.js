import { NextResponse } from 'next/server.js';
import crypto from 'crypto';

/**
 * POST /api/v1/webhook-verify
 * Cryptographic HMAC SHA-256 Signature Validator
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        http_code: 400,
        error: 'Bad Request',
        message: 'Malformed JSON payload.',
      },
      { status: 400 }
    );
  }

  const { payload, secret, signature } = body || {};

  if (!payload || !signature) {
    return NextResponse.json(
      {
        status: 'error',
        http_code: 400,
        error: 'Bad Request',
        message: "Fields 'payload' and 'signature' are required.",
      },
      { status: 400 }
    );
  }

  const signingSecret = secret || process.env.WEBHOOK_SECRET || 'whsec_btin337_ciap_99481a';
  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);

  const expectedSignature = crypto
    .createHmac('sha256', signingSecret)
    .update(payloadStr)
    .digest('hex');

  const cleanSignature = signature.replace(/^sha256=/, '').trim();
  const cleanBuf = Buffer.from(cleanSignature, 'utf8');
  const expectedBuf = Buffer.from(expectedSignature, 'utf8');
  const isValid =
    cleanBuf.length === expectedBuf.length &&
    crypto.timingSafeEqual(cleanBuf, expectedBuf);

  return NextResponse.json(
    {
      status: 'success',
      http_code: 200,
      verified: isValid,
      algorithm: 'HMAC-SHA256',
      computed_signature: expectedSignature,
      received_signature: cleanSignature,
      message: isValid
        ? 'Cryptographic integrity verified. Webhook payload authentic and untampered.'
        : 'Signature mismatch. Payload may have been tampered or wrong secret supplied.',
    },
    { status: 200 }
  );
}
