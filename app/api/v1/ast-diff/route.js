import { NextResponse } from 'next/server.js';
import { validateApiKey } from '../../../../lib/auth.js';
import { checkRateLimit } from '../../../../lib/rate-limit.js';
import { parsePython, parseJava } from '../../../../lib/ast-parser.js';
import { alignNodes } from '../../../../lib/ast-aligner.js';
import { MAX_CODE_CHARS, validateCodePayload } from '../../../../lib/security.js';

/**
 * POST /api/v1/ast-diff
 * Cross-Language AST Differential Analysis & Syntax Mapping Endpoint
 *
 * Ingests source Python code and transpiled Java code, extracts semantic AST
 * nodes using tree-sitter grammars, and aligns corresponding language constructs
 * with confidence levels and type system explanations.
 */
export async function POST(request) {
  // 1. Constant-Time API Key Authentication Guard
  const auth = validateApiKey(request);
  if (!auth.isValid) {
    return auth.response;
  }

  // 2. Sliding-Window Rate Limiter
  const rateLimit = checkRateLimit(request, { limit: 60 });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  // 3. Parse and validate JSON request body
  let body;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        http_code: 400,
        error: 'Bad Request',
        message: 'Malformed or unparseable JSON payload in request body.',
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  const { python_code, java_code } = body || {};

  // 4. Validate presence and bounded size of code inputs
  const pyValidation = validateCodePayload(python_code, 'python_code', MAX_CODE_CHARS);
  if (!pyValidation.valid) {
    return NextResponse.json(
      {
        status: 'error',
        http_code: pyValidation.status,
        error: pyValidation.status === 413 ? 'Payload Too Large' : 'Bad Request',
        message: pyValidation.error,
        timestamp: new Date().toISOString(),
      },
      { status: pyValidation.status }
    );
  }

  const javaValidation = validateCodePayload(java_code, 'java_code', MAX_CODE_CHARS);
  if (!javaValidation.valid) {
    return NextResponse.json(
      {
        status: 'error',
        http_code: javaValidation.status,
        error: javaValidation.status === 413 ? 'Payload Too Large' : 'Bad Request',
        message: javaValidation.error,
        timestamp: new Date().toISOString(),
      },
      { status: javaValidation.status }
    );
  }

  // 5. Parse AST nodes and compute alignment pairs
  try {
    const pythonNodes = parsePython(python_code);
    const javaNodes = parseJava(java_code);
    const alignmentPairs = alignNodes(pythonNodes, javaNodes);

    const exactCount = alignmentPairs.filter((p) => p.confidence === 'exact').length;
    const inferredCount = alignmentPairs.filter((p) => p.confidence === 'inferred').length;
    const healedCount = alignmentPairs.filter((p) => p.confidence === 'healed').length;

    return NextResponse.json(
      {
        status: 'success',
        http_code: 200,
        event: 'ast.diff.computed',
        timestamp: new Date().toISOString(),
        summary: {
          total_python_nodes: pythonNodes.length,
          total_java_nodes: javaNodes.length,
          total_alignments: alignmentPairs.length,
          exact_matches: exactCount,
          inferred_matches: inferredCount,
          healed_matches: healedCount,
        },
        python_nodes: pythonNodes,
        java_nodes: javaNodes,
        alignment_pairs: alignmentPairs,
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-AST-Alignments': String(alignmentPairs.length),
          ...rateLimit.headers,
        },
      }
    );
  } catch (_error) {
    return NextResponse.json(
      {
        status: 'error',
        http_code: 500,
        error: 'Internal Server Error',
        message: 'AST differential engine encountered an unexpected internal error.',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
