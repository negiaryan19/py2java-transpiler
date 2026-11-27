import { checkRateLimit } from '../../../../lib/rate-limit.js';
import { validateCodePayload, MAX_CODE_CHARS, normalizeJavaVersion } from '../../../../lib/security.js';
import { ALLOWED_INTELLIGENCE_ACTIONS, runCodeIntelligence } from '../../../../lib/intelligence.js';

export async function POST(request) {
  const rl = checkRateLimit(request, {
    keyPrefix: 'intel:',
    limit: 20,
    windowMs: 60 * 1000,
  });
  if (!rl.allowed) {
    return Response.json({ ok: false, error: 'Rate limit exceeded (20 requests/min).' }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const action = body?.action;
  if (!ALLOWED_INTELLIGENCE_ACTIONS.has(action)) {
    return Response.json({ ok: false, error: 'Invalid intelligence action.' }, { status: 400 });
  }

  const pyVal = validateCodePayload(body?.python_code || '', 'python_code', MAX_CODE_CHARS);
  if (!pyVal.valid) {
    return Response.json({ ok: false, error: pyVal.error }, { status: pyVal.status });
  }
  const javaVal = validateCodePayload(body?.java_code || '// empty', 'java_code', MAX_CODE_CHARS);
  if (!javaVal.valid) {
    return Response.json({ ok: false, error: javaVal.error }, { status: javaVal.status });
  }

  const ver = normalizeJavaVersion(body?.java_version || '17');
  const result = await runCodeIntelligence({
    action,
    pythonCode: body.python_code,
    javaCode: body.java_code || '',
    javaVersion: ver.valid ? ver.value : '17',
    selectedCode: typeof body?.selected_code === 'string' ? body.selected_code : '',
    question: typeof body?.question === 'string' ? body.question : '',
    compilerError: typeof body?.compiler_error === 'string' ? body.compiler_error : '',
    verificationReport: body?.verification_report || null,
    compatibilityReport: body?.compatibility_report || null,
    apiKey: process.env.GEMINI_API_KEY?.trim() || '',
  });

  return Response.json(result, { status: 200 });
}
