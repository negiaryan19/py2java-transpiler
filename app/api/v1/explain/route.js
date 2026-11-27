import { NextResponse } from 'next/server.js';
import { validateApiKey } from '../../../../lib/auth.js';
import { checkRateLimit } from '../../../../lib/rate-limit.js';
import { metrics } from '../../../../lib/metrics.js';
import { explainPythonToJava } from '../../../../lib/explain.js';
import { MAX_CODE_CHARS, normalizeJavaVersion, validateCodePayload } from '../../../../lib/security.js';

/**
 * POST /api/v1/explain
 * Compiler Diagnostics & AST Transformation Analysis Endpoint
 */
export async function POST(request) {
  metrics.incExplainRequest();
  // 1. Authenticate via x-api-key header (Timing-safe)
  const auth = validateApiKey(request);
  if (!auth.isValid) {
    return auth.response;
  }

  // 2. Abuse Prevention: Rate Limiting Guard
  const rateLimit = checkRateLimit(request, { limit: 60 });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  // 2. Parse request body
  let body;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        http_code: 400,
        error: 'Bad Request',
        message: 'Malformed JSON payload in request body.',
      },
      { status: 400 }
    );
  }

  const { python_code, java_version = '17' } = body || {};
  const codeCheck = validateCodePayload(python_code, 'python_code', MAX_CODE_CHARS);
  if (!codeCheck.valid) {
    return NextResponse.json(
      {
        status: 'error',
        http_code: codeCheck.status,
        error: codeCheck.status === 413 ? 'Payload Too Large' : 'Bad Request',
        message: codeCheck.error,
      },
      { status: codeCheck.status }
    );
  }

  const versionCheck = normalizeJavaVersion(java_version);
  if (!versionCheck.valid) {
    return NextResponse.json(
      {
        status: 'error',
        http_code: 400,
        error: 'Bad Request',
        message: versionCheck.error,
      },
      { status: 400 }
    );
  }
  const data = await explainPythonToJava(python_code, versionCheck.value);
  return NextResponse.json(
    {
      status: 'success',
      http_code: 200,
      data,
    },
    { status: 200 }
  );
}
