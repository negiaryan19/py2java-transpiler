import { NextResponse } from 'next/server.js';
import { validateApiKey } from '../../../../lib/auth.js';
import { transpilePythonToJava } from '../../../../lib/gemini.js';
import { dispatchWebhook } from '../../../../lib/webhook.js';

/**
 * POST /api/v1/convert
 * Primary Transpiler REST Gateway Endpoint (CIA-P Requirements #2, #3, #4)
 */
export async function POST(request) {
  const startTime = performance.now();

  // 1. Authenticate via x-api-key header
  const auth = validateApiKey(request);
  if (!auth.isValid) {
    return auth.response;
  }

  // 2. Parse and validate JSON request body
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

  const { python_code, java_version = '17', webhook_url, gemini_api_key } = body || {};
  const headerGeminiKey = request.headers.get('x-gemini-api-key');
  const activeGeminiKey = gemini_api_key || headerGeminiKey;

  // 3. Validation: python_code is required and must not be empty
  if (!python_code || typeof python_code !== 'string' || !python_code.trim()) {
    return NextResponse.json(
      {
        status: 'error',
        http_code: 400,
        error: 'Bad Request',
        message: "Field 'python_code' is required and must be a non-empty string.",
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  // 4. Execute Transpilation (Google Gemini 1.5/2.5 Flash + AST fallback)
  try {
    const { javaCode, engine, summary } = await transpilePythonToJava(python_code, java_version, activeGeminiKey);
    const executionTimeMs = Math.max(18, Math.round(performance.now() - startTime));

    // 5. Asynchronous Webhook Dispatch
    let webhookReport = null;
    if (webhook_url && typeof webhook_url === 'string') {
      webhookReport = await dispatchWebhook({
        webhookUrl: webhook_url,
        payload: {
          data: {
            source_language: 'python',
            target_language: 'java',
            java_version,
            execution_time_ms: executionTimeMs,
            python_lines: (python_code.match(/\n/g) || []).length + 1,
            java_preview: javaCode.split('\n').slice(0, 6).join('\n') + '\n// ...',
          },
        },
      });
    }

    // 6. Return standard 200 OK Response Contract
    return NextResponse.json(
      {
        status: 'success',
        http_code: 200,
        event: 'code.conversion.completed',
        timestamp: new Date().toISOString(),
        engine,
        summary,
        data: {
          source_language: 'python',
          target_language: 'java',
          java_version,
          execution_time_ms: executionTimeMs,
          java_code: javaCode,
        },
        webhook_delivery: webhookReport
          ? {
              dispatched: webhookReport.dispatched,
              target_url: webhookReport.targetUrl,
              delivery_id: webhookReport.deliveryId,
              status_code: webhookReport.statusCode,
              ok: webhookReport.ok,
            }
          : {
              dispatched: false,
              target_url: null,
              status_code: null,
            },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        http_code: 500,
        error: 'Internal Server Error',
        message: error.message || 'Transpilation pipeline encountered an unexpected error.',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
