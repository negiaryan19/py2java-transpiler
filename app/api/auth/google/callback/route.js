import { NextResponse } from 'next/server.js';
import {
  OAUTH_TX_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  createSessionToken,
  isGoogleOAuthConfigured,
  resolvePublicOrigin,
  verifyOAuthTransaction,
} from '../../../../../lib/session.js';
import { checkRateLimit } from '../../../../../lib/rate-limit.js';

function redirectWithAuthError(origin, path, code) {
  const target = new URL(path || '/', origin);
  target.searchParams.set('auth_error', code);
  const res = NextResponse.redirect(target);
  res.cookies.delete({ name: OAUTH_TX_COOKIE_NAME, path: '/api/auth/google/callback' });
  return res;
}

/**
 * GET /api/auth/google/callback
 * Validates state & PKCE transaction, exchanges code with Google OAuth,
 * fetches verified OpenID profile, and issues an HttpOnly signed session cookie.
 */
export async function GET(request) {
  const rateLimit = checkRateLimit(request, { limit: 20, windowMs: 5 * 60 * 1000, keyPrefix: 'oauth_cb:' });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const origin = resolvePublicOrigin(request.headers, request.url);
  if (!isGoogleOAuthConfigured()) {
    return redirectWithAuthError(origin, '/', 'oauth_not_configured');
  }

  const { searchParams } = new URL(request.url);
  const oauthError = searchParams.get('error');
  const code = searchParams.get('code');
  const returnedState = searchParams.get('state');

  const txCookie = request.cookies.get(OAUTH_TX_COOKIE_NAME)?.value;
  const tx = verifyOAuthTransaction(txCookie, returnedState);

  if (!tx) {
    return redirectWithAuthError(origin, '/', 'invalid_oauth_state');
  }

  if (oauthError || !code) {
    return redirectWithAuthError(origin, tx.returnTo, oauthError || 'missing_oauth_code');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID.trim(),
        client_secret: process.env.GOOGLE_CLIENT_SECRET.trim(),
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: 'authorization_code',
        code_verifier: tx.codeVerifier,
      }).toString(),
      signal: controller.signal,
    });

    if (!tokenRes.ok) {
      clearTimeout(timeoutId);
      return redirectWithAuthError(origin, tx.returnTo, 'oauth_token_exchange_failed');
    }

    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson?.access_token;
    if (!accessToken || typeof accessToken !== 'string') {
      clearTimeout(timeoutId);
      return redirectWithAuthError(origin, tx.returnTo, 'missing_access_token');
    }

    const userInfoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!userInfoRes.ok) {
      return redirectWithAuthError(origin, tx.returnTo, 'userinfo_fetch_failed');
    }

    const profile = await userInfoRes.json();
    if (!profile?.sub || !profile?.email || profile?.email_verified !== true) {
      return redirectWithAuthError(origin, tx.returnTo, 'unverified_google_email');
    }

    const sessionToken = createSessionToken({
      sub: profile.sub,
      email: profile.email,
      name: profile.name || profile.email.split('@')[0],
      provider: 'google',
    });

    const redirectUrl = new URL(tx.returnTo, origin);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete({ name: OAUTH_TX_COOKIE_NAME, path: '/api/auth/google/callback' });
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    });
    return response;
  } catch {
    clearTimeout(timeoutId);
    return redirectWithAuthError(origin, tx.returnTo, 'oauth_callback_error');
  }
}
