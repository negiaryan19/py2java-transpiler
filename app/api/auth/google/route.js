import { NextResponse } from 'next/server.js';
import {
  OAUTH_TX_COOKIE_NAME,
  OAUTH_TX_TTL_SECONDS,
  buildGoogleAuthUrl,
  createOAuthTransaction,
  isGoogleOAuthConfigured,
  resolvePublicOrigin,
  sanitizeReturnPath,
} from '../../../../lib/session.js';
import { checkRateLimit } from '../../../../lib/rate-limit.js';

/**
 * GET /api/auth/google
 * Initiates Google OAuth 2.0 + PKCE (S256) login flow.
 */
export async function GET(request) {
  const rateLimit = checkRateLimit(request, { limit: 20, windowMs: 5 * 60 * 1000, keyPrefix: 'oauth_init:' });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const origin = resolvePublicOrigin(request.headers, request.url);
  const { searchParams } = new URL(request.url);
  const returnTo = sanitizeReturnPath(searchParams.get('returnTo') || '/');

  if (!isGoogleOAuthConfigured()) {
    const errUrl = new URL(returnTo, origin);
    errUrl.searchParams.set('auth_error', 'oauth_not_configured');
    return NextResponse.redirect(errUrl);
  }

  try {
    const { state, codeChallenge, txToken } = createOAuthTransaction({ returnTo });
    const googleUrl = buildGoogleAuthUrl({ origin, state, codeChallenge });

    const response = NextResponse.redirect(googleUrl);
    response.cookies.set(OAUTH_TX_COOKIE_NAME, txToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/auth/google/callback',
      maxAge: OAUTH_TX_TTL_SECONDS,
    });
    return response;
  } catch {
    const errUrl = new URL(returnTo, origin);
    errUrl.searchParams.set('auth_error', 'oauth_init_failed');
    return NextResponse.redirect(errUrl);
  }
}
