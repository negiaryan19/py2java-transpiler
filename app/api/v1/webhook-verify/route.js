import { NextResponse } from 'next/server.js';
import crypto from 'crypto';
import { computeWebhookSignature } from '../../../../lib/webhook.js';

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

  const expectedSignature = computeWebhookSignature(payload, secret);

  const sigStr = String(signature).trim();
  const v1Match = sigStr.match(/(?:^|,)v1=([a-f0-9]+)/i);
  const cleanSignature = (v1Match ? v1Match[1] : sigStr.replace(/^sha256=/i, '')).trim().toLowerCase();
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
