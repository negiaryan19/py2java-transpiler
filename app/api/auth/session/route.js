import { NextResponse } from 'next/server.js';
import { cookies } from 'next/headers';
import {
  SESSION_COOKIE_NAME,
  isGoogleOAuthConfigured,
  verifySessionToken,
} from '../../../../lib/session.js';
import { isDatabaseConfigured } from '../../../../lib/db.js';

/**
 * GET /api/auth/session
 * Returns sanitized current authenticated session status without leaking tokens or secrets.
 */
export async function GET() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(rawToken);

  return NextResponse.json(
    {
      authenticated: Boolean(session),
      oauthConfigured: isGoogleOAuthConfigured(),
      dbConfigured: await isDatabaseConfigured(),
      user: session
        ? {
            sub: session.sub,
            email: session.email,
            name: session.name,
            provider: session.provider,
          }
        : null,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
