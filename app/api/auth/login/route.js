import { NextResponse } from 'next/server.js';
import { authenticateUser, isDatabaseConfigured } from '../../../../lib/db.js';
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from '../../../../lib/session.js';
import { checkRateLimit } from '../../../../lib/rate-limit.js';

/**
 * POST /api/auth/login
 * Authenticates a user with email + password and issues a session cookie.
 */
export async function POST(request) {
  const rateLimit = checkRateLimit(request, { limit: 15, windowMs: 5 * 60 * 1000, keyPrefix: 'login:' });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  if (!(await isDatabaseConfigured())) {
    return NextResponse.json(
      { ok: false, error: 'User database is not configured on this deployment.' },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { email, password } = body || {};

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ ok: false, error: 'Please enter a valid email address.' }, { status: 400 });
  }

  if (!password || typeof password !== 'string') {
    return NextResponse.json({ ok: false, error: 'Please enter your password.' }, { status: 400 });
  }

  try {
    const result = await authenticateUser({ email, password });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 401 });
    }

    const sessionToken = createSessionToken({
      sub: result.user.id,
      email: result.user.email,
      name: result.user.name,
      organization: result.user.organization,
      role: result.user.role,
      provider: 'email',
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        organization: result.user.organization,
        role: result.user.role,
        provider: 'email',
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    });

    return response;
  } catch (err) {
    const msg = String(err?.message || '');
    const isConfigErr = msg.includes('DATABASE_URL') || msg.includes('AUTH_SECRET');
    return NextResponse.json(
      { ok: false, error: isConfigErr ? msg : 'Unable to sign in right now. Please retry.' },
      { status: isConfigErr ? 503 : 500 }
    );
  }
}
