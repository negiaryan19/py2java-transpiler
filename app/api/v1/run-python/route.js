import { checkRateLimit } from '../../../../lib/rate-limit.js';
import { validateCodePayload, MAX_CODE_CHARS } from '../../../../lib/security.js';
import { runPythonInSandbox } from '../../../../lib/python-sandbox.js';

export const maxDuration = 30;

export async function POST(request) {
  const rl = checkRateLimit(request, {
    keyPrefix: 'run_py:',
    limit: 15,
    windowMs: 60 * 1000,
  });
  if (!rl.allowed) {
    return Response.json({ ok: false, error: 'Rate limit exceeded (15 runs/min).' }, { status: 429 });
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

  const stdin = typeof body?.stdin === 'string' ? body.stdin.slice(0, 4096) : '';
  const result = await runPythonInSandbox(body.python_code, { stdin });
  return Response.json(result, { status: 200 });
}
