import { checkRateLimit } from '../../../../lib/rate-limit.js';
import { validateCodePayload, MAX_CODE_CHARS, normalizeJavaVersion } from '../../../../lib/security.js';
import { repairWithJavacLoop } from '../../../../lib/compiler-repair.js';

export const maxDuration = 30;

export async function POST(request) {
  const rl = checkRateLimit(request, {
    keyPrefix: 'repair_javac:',
    limit: 8,
    windowMs: 60 * 1000,
  });

  if (!rl.allowed) {
    return Response.json(
      { ok: false, error: 'Rate limit exceeded (8 repairs/minute). Please retry shortly.' },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const pyVal = validateCodePayload(body?.python_code, 'python_code', MAX_CODE_CHARS);
  if (!pyVal.valid) {
    return Response.json({ ok: false, error: pyVal.error }, { status: pyVal.status });
  }
  const javaVal = validateCodePayload(body?.java_code, 'java_code', MAX_CODE_CHARS);
  if (!javaVal.valid) {
    return Response.json({ ok: false, error: javaVal.error }, { status: javaVal.status });
  }

  const verCheck = normalizeJavaVersion(body?.java_version || '17');
  const safeVer = verCheck.valid ? verCheck.value : '17';
  const serverApiKey = process.env.GEMINI_API_KEY?.trim() || '';

  const result = await repairWithJavacLoop({
    pythonCode: body.python_code,
    javaCode: body.java_code,
    compilerError: typeof body?.compiler_error === 'string' ? body.compiler_error.slice(0, 2000) : '',
    mismatchNote: typeof body?.mismatch_note === 'string' ? body.mismatch_note.slice(0, 600) : '',
    stdin: typeof body?.stdin === 'string' ? body.stdin.slice(0, 4096) : '',
    targetVersion: safeVer,
    apiKey: serverApiKey,
    maxIterations: 2,
  });

  return Response.json(result, { status: 200 });
}
