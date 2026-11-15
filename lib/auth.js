import { NextResponse } from 'next/server.js';
import crypto from 'crypto';

/**
 * Enterprise Authentication Middleware for J-Forge API Gateway
 * Validates 'x-api-key' or 'Authorization: Bearer <token>' headers
 * using constant-time cryptographic comparison (crypto.timingSafeEqual)
 * to prevent side-channel timing attacks.
 * 
 * @param {Request} request - Next.js Request object
 * @returns {{ isValid: boolean, response?: NextResponse }}
 */
export function validateApiKey(request) {
  const expectedKey = process.env.APP_API_KEY || 'ciap-secret-key-2026';
  const xApiKey = request.headers.get('x-api-key');
  const authHeader = request.headers.get('authorization');
  let bearerToken = null;

  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    bearerToken = authHeader.substring(7).trim();
  }

  const providedKey = xApiKey || bearerToken;

  if (!providedKey) {
    return {
      isValid: false,
      response: NextResponse.json(
        {
          status: 'error',
          http_code: 401,
          error: 'Unauthorized',
          message: "Missing 'x-api-key' or 'Authorization: Bearer <token>' authentication header.",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      ),
    };
  }

  // Constant-time timing-safe comparison
  const expectedBuf = Buffer.from(expectedKey, 'utf8');
  const providedBuf = Buffer.from(providedKey, 'utf8');
  const isValid =
    expectedBuf.length === providedBuf.length &&
    crypto.timingSafeEqual(expectedBuf, providedBuf);

  if (!isValid) {
    return {
      isValid: false,
      response: NextResponse.json(
        {
          status: 'error',
          http_code: 401,
          error: 'Unauthorized',
          message: "Invalid 'x-api-key' or 'Authorization: Bearer <token>' credential.",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      ),
    };
  }

  return { isValid: true };
}
