import { NextResponse } from 'next/server.js';
import { SESSION_COOKIE_NAME } from '../../../../lib/session.js';

/**
 * POST /api/auth/logout
 * Clears the signed HttpOnly session cookie.
 */
export async function POST() {
  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}
