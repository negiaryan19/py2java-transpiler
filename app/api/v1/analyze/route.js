import { checkRateLimit } from '../../../../lib/rate-limit.js';
import { validateCodePayload, MAX_CODE_CHARS } from '../../../../lib/security.js';
import { parsePython } from '../../../../lib/ast-parser.js';
import {
  analyzePythonCompatibility,
  detectPythonDependencies,
  analyzeCodeQuality,
} from '../../../../lib/compatibility.js';

export async function POST(request) {
  const rl = checkRateLimit(request, {
    keyPrefix: 'analyze:',
    limit: 30,
    windowMs: 60 * 1000,
  });
  if (!rl.allowed) {
    return Response.json({ ok: false, error: 'Rate limit exceeded (30 requests/min).' }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const pyVal = validateCodePayload(body?.python_code || '', 'python_code', MAX_CODE_CHARS);
  if (!pyVal.valid) {
    return Response.json({ ok: false, error: pyVal.error }, { status: pyVal.status });
  }

  const javaSrc = typeof body?.java_code === 'string' ? body.java_code.slice(0, MAX_CODE_CHARS) : '';
  const compatibility = analyzePythonCompatibility(body.python_code);
  const dependencies = detectPythonDependencies(body.python_code);
  const quality = analyzeCodeQuality({ pythonCode: body.python_code, javaCode: javaSrc });
  const astNodes = parsePython(body.python_code);

  return Response.json(
    {
      ok: true,
      compatibility,
      dependencies,
      quality,
      astSummary: {
        nodeCount: astNodes.length,
        nodes: astNodes.slice(0, 60),
      },
    },
    { status: 200 }
  );
}
