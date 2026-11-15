import { NextResponse } from 'next/server.js';

/**
 * Authentication Middleware for J-Forge API Gateway
 * Validates 'x-api-key' request header against configured APP_API_KEY
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

  if (!providedKey || providedKey !== expectedKey) {
    return {
      isValid: false,
      response: NextResponse.json(
        {
          status: 'error',
          http_code: 401,
          error: 'Unauthorized',
          message: "Invalid or missing 'x-api-key' or 'Authorization: Bearer <token>' authentication header. Please provide a valid key.",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      ),
    };
  }

  return { isValid: true };
}
