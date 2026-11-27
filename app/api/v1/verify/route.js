import { checkRateLimit } from '../../../../lib/rate-limit.js';
import { validateCodePayload, MAX_CODE_CHARS } from '../../../../lib/security.js';
import { verifyConversionBehavior } from '../../../../lib/verification.js';

export const maxDuration = 30;

export async function POST(request) {
  const rl = checkRateLimit(request, {
    keyPrefix: 'verify:',
    limit: 12,
    windowMs: 60 * 1000,
  });

  if (!rl.allowed) {
    return Response.json(
      { ok: false, error: 'Rate limit exceeded (12 verifications/minute). Please retry shortly.' },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const pyValidation = validateCodePayload(body?.python_code, 'python_code', MAX_CODE_CHARS);
  if (!pyValidation.valid) {
    return Response.json({ ok: false, error: pyValidation.error }, { status: pyValidation.status });
  }

  const javaValidation = validateCodePayload(body?.java_code, 'java_code', MAX_CODE_CHARS);
  if (!javaValidation.valid) {
    return Response.json({ ok: false, error: javaValidation.error }, { status: javaValidation.status });
  }

  const stdin = typeof body?.stdin === 'string' ? body.stdin.slice(0, 4096) : '';
  const testCases = Array.isArray(body?.test_cases) ? body.test_cases.slice(0, 4) : null;
  const result = await verifyConversionBehavior({
    pythonCode: body.python_code,
    javaCode: body.java_code,
    stdin,
    testCases,
  });

  return Response.json(result, { status: 200 });
}
