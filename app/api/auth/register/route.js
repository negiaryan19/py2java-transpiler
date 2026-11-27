import { NextResponse } from 'next/server.js';
import { createUser, isDatabaseConfigured } from '../../../../lib/db.js';
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from '../../../../lib/session.js';
import { checkRateLimit } from '../../../../lib/rate-limit.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register
 * Creates a new user account with email + password and issues a session cookie.
 */
export async function POST(request) {
  const rateLimit = checkRateLimit(request, { limit: 10, windowMs: 5 * 60 * 1000, keyPrefix: 'register:' });
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

  const { email, password, name, organization, role } = body || {};

  // Validate email
  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim()) || email.trim().length > 254) {
    return NextResponse.json({ ok: false, error: 'Please enter a valid email address.' }, { status: 400 });
  }

  // Validate password
  if (!password || typeof password !== 'string' || password.length < 6 || password.length > 128) {
    return NextResponse.json(
      { ok: false, error: 'Password must be between 6 and 128 characters.' },
      { status: 400 }
    );
  }

  // Validate name
  if (!name || typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 120) {
    return NextResponse.json({ ok: false, error: 'Please enter your full name.' }, { status: 400 });
  }

  try {
    const result = await createUser({
      email: email.trim(),
      password,
      name: name.trim().slice(0, 120),
      organization: typeof organization === 'string' ? organization.trim().slice(0, 120) : '',
      role: typeof role === 'string' ? role.trim().slice(0, 60) : 'student',
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 409 });
    }

    // Issue session cookie
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
      { ok: false, error: isConfigErr ? msg : 'Unable to create account right now. Please retry.' },
      { status: isConfigErr ? 503 : 500 }
    );
  }
}
