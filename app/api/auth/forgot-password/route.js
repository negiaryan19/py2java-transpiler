import { checkRateLimit } from '../../../../lib/rate-limit.js';
import { isDatabaseConfigured, createPasswordResetCode, resetPasswordWithCode } from '../../../../lib/db.js';

export async function POST(request) {
  const rl = checkRateLimit(request, {
    keyPrefix: 'forgot_pw:',
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!rl.allowed) {
    return Response.json({ ok: false, error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  if (!(await isDatabaseConfigured())) {
    return Response.json({ ok: false, error: 'Database is not configured.' }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const action = body?.action || 'request';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return Response.json({ ok: false, error: 'Please enter a valid email address.' }, { status: 400 });
  }

  if (action === 'request') {
    const resendKey = process.env.RESEND_API_KEY?.trim();
    if (!resendKey) {
      return Response.json(
        {
          ok: false,
          error: 'Email delivery is not configured yet (set RESEND_API_KEY in Vercel env vars to enable password reset emails).',
        },
        { status: 503 }
      );
    }

    const res = await createPasswordResetCode(email);
    if (res.found) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'J-Forge <onboarding@resend.dev>',
          to: [email],
          subject: 'J-Forge Password Reset Code',
          text: `Your J-Forge password reset code is: ${res.code}\n\nThis code expires in 15 minutes.`,
        }),
      });
    }
    return Response.json(
      { ok: true, message: 'If an account exists for that email, a 6-digit reset code has been sent.' },
      { status: 200 }
    );
  }

  if (action === 'reset') {
    const code = typeof body?.code === 'string' ? body.code.trim() : '';
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';
    if (!/^\d{6}$/.test(code)) {
      return Response.json({ ok: false, error: 'Please enter the 6-digit reset code.' }, { status: 400 });
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      return Response.json({ ok: false, error: 'New password must be 8-128 characters.' }, { status: 400 });
    }
    const result = await resetPasswordWithCode(email, code, newPassword);
    if (!result.ok) {
      return Response.json({ ok: false, error: result.error }, { status: 400 });
    }
    return Response.json({ ok: true, message: 'Password updated! You can now sign in.' }, { status: 200 });
  }

  return Response.json({ ok: false, error: 'Unsupported action.' }, { status: 400 });
}
