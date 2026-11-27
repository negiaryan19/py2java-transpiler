import { checkRateLimit } from '../../../../lib/rate-limit.js';
import { validateCodePayload, MAX_CODE_CHARS } from '../../../../lib/security.js';
import { runJavaInSandbox } from '../../../../lib/java-sandbox.js';

export const maxDuration = 30;

export async function POST(request) {
  const rl = checkRateLimit(request, {
    keyPrefix: 'run_java:',
    limit: 15,
    windowMs: 60 * 1000,
  });

  if (!rl.allowed) {
    return Response.json(
      { ok: false, error: 'Rate limit exceeded (15 runs/minute). Please retry shortly.' },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const javaCode = body?.java_code;
  const validation = validateCodePayload(javaCode, 'java_code', MAX_CODE_CHARS);
  if (!validation.valid) {
    return Response.json({ ok: false, error: validation.error }, { status: validation.status });
  }

  const result = await runJavaInSandbox(javaCode);
  return Response.json(result, { status: 200 });
}
