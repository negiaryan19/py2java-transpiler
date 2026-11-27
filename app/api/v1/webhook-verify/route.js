import { NextResponse } from 'next/server.js';
import crypto from 'crypto';
import { computeWebhookSignature } from '../../../../lib/webhook.js';
import { checkRateLimit } from '../../../../lib/rate-limit.js';
import { MAX_CODE_CHARS } from '../../../../lib/security.js';

/**
 * POST /api/v1/webhook-verify
 * Cryptographic HMAC SHA-256 Signature Validator
 */
export async function POST(request) {
  if (request?.headers?.get) {
    const rateLimit = checkRateLimit(request, { limit: 60, keyPrefix: 'whverify:' });
    if (!rateLimit.allowed) {
      return rateLimit.response;
    }
  }

  let body;
  try {
    body = await request.json();
  } catch {
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

  const serializedSize = JSON.stringify(body || {}).length;
  if (serializedSize > MAX_CODE_CHARS * 2) {
    return NextResponse.json(
      {
        status: 'error',
        http_code: 413,
        error: 'Payload Too Large',
        message: 'Verification request body exceeds maximum allowed size.',
      },
      { status: 413 }
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

  const hasExplicitSecret = typeof secret === 'string' && secret.trim().length > 0;
  let expectedSignature;
  try {
    expectedSignature = computeWebhookSignature(payload, hasExplicitSecret ? secret : undefined);
  } catch {
    return NextResponse.json(
      {
        status: 'error',
        http_code: 503,
        error: 'Service Unavailable',
        message: 'Server webhook verification secret is not configured. Provide a custom secret or configure WEBHOOK_SECRET.',
      },
      { status: 503 }
    );
  }

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
      // Only return computed_signature when caller provided their own explicit secret;
      // never act as a server WEBHOOK_SECRET signing oracle for unauthenticated requests.
      ...(hasExplicitSecret ? { computed_signature: expectedSignature } : {}),
      received_signature: cleanSignature,
      message: isValid
        ? 'Cryptographic integrity verified. Webhook payload authentic and untampered.'
        : 'Signature mismatch. Payload may have been tampered or wrong secret supplied.',
    },
    { status: 200 }
  );
}
