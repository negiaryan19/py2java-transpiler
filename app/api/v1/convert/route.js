import { NextResponse } from 'next/server.js';
import { validateApiKey } from '../../../../lib/auth.js';
import { transpilePythonToJava } from '../../../../lib/gemini.js';
import { dispatchWebhook } from '../../../../lib/webhook.js';
import { checkRateLimit } from '../../../../lib/rate-limit.js';
import { astCache } from '../../../../lib/cache.js';
import { healJavaCode } from '../../../../lib/self-healing.js';
import { metrics } from '../../../../lib/metrics.js';
import { MAX_CODE_CHARS, normalizeJavaVersion, validateCodePayload } from '../../../../lib/security.js';

/**
 * POST /api/v1/convert
 * Primary Transpiler REST Gateway Endpoint (CIA-P Requirements #2, #3, #4)
 * Featuring Sub-5ms Semantic AST Hash Caching and Sliding-Window Rate Limiting.
 */
export async function POST(request) {
  const startTime = performance.now();

  // 1. Authenticate via x-api-key header (Constant-time timing-safe)
  const auth = validateApiKey(request);
  if (!auth.isValid) {
    metrics.incTranspile(401);
    return auth.response;
  }

  // 2. Abuse Prevention: Rate Limiting Guard (60 req/min)
  const rateLimit = checkRateLimit(request, { limit: 60 });
  if (!rateLimit.allowed) {
    metrics.incTranspile(429);
    metrics.incRateLimitBlock();
    return rateLimit.response;
  }

  // 3. Parse and validate JSON request body
  let body;
  try {
    body = await request.json();
  } catch (err) {
    metrics.incTranspile(400);
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

  const {
    python_code,
    java_version = '17',
    webhook_url,
    gemini_api_key,
    bypass_cache = false,
  } = body || {};

  const headerBypass = request.headers.get('x-bypass-cache') === 'true';
  const shouldBypassCache = bypass_cache || headerBypass;
  const headerGeminiKey = request.headers.get('x-gemini-api-key');
  const rawOverrideKey = gemini_api_key || headerGeminiKey;
  const activeGeminiKey =
    typeof rawOverrideKey === 'string' && rawOverrideKey.trim().length > 0 && rawOverrideKey.trim().length <= 120
      ? rawOverrideKey.trim()
      : null;

  // Reject arbitrary relative paths (allow ONLY built-in '/api/v1/webhook-demo' as a relative path)
  const rawWebhookUrl = typeof webhook_url === 'string' ? webhook_url.trim() : '';
  if (rawWebhookUrl.startsWith('/') && rawWebhookUrl !== '/api/v1/webhook-demo') {
    metrics.incTranspile(400);
    return NextResponse.json(
      {
        status: 'error',
        http_code: 400,
        error: 'Bad Request',
        message: "Relative 'webhook_url' is restricted strictly to '/api/v1/webhook-demo'. Provide a full HTTPS URL for external webhooks.",
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  // 4. Validation: python_code size/content and strict java_version allowlist
  const codeValidation = validateCodePayload(python_code, 'python_code', MAX_CODE_CHARS);
  if (!codeValidation.valid) {
    metrics.incTranspile(codeValidation.status);
    return NextResponse.json(
      {
        status: 'error',
        http_code: codeValidation.status,
        error: codeValidation.status === 413 ? 'Payload Too Large' : 'Bad Request',
        message: codeValidation.error,
        timestamp: new Date().toISOString(),
      },
      { status: codeValidation.status }
    );
  }

  const versionCheck = normalizeJavaVersion(java_version);
  if (!versionCheck.valid) {
    metrics.incTranspile(400);
    return NextResponse.json(
      {
        status: 'error',
        http_code: 400,
        error: 'Bad Request',
        message: versionCheck.error,
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }
  const safeJavaVersion = versionCheck.value;

  // 5. Semantic AST Hash Cache Lookup (Sub-5ms response on identical code)
  const cacheKey = astCache.computeKey(python_code, safeJavaVersion);
  const cachedHit = !shouldBypassCache ? astCache.get(cacheKey) : null;

  try {
    let javaCode = '';
    let engine = '';
    let summary = '';
    let isCacheHit = false;
    let selfHealing = null;

    if (cachedHit) {
      isCacheHit = true;
      metrics.incCacheHit();
      javaCode = cachedHit.javaCode;
      engine = `${cachedHit.engine} (AST Cache Hit)`;
      summary = `${cachedHit.summary} [⚡ Sub-5ms Cache Hit: 0 Tokens Consumed]`;
      selfHealing = cachedHit.selfHealing || {
        performed: true,
        passes: 0,
        repaired: false,
        repaired_by: 'clean_ast',
        syntax_valid: true,
        original_issues: [],
        corrections_applied: [],
        diagnostics: {
          brace_balance: 'BALANCED',
          import_resolution: 'COMPLETE',
          structure_check: 'VALID',
          quality_score: 100,
        },
      };
    } else {
      metrics.incCacheMiss();
      // Execute live transpilation
      const result = await transpilePythonToJava(python_code, java_version, activeGeminiKey);

      // Autonomous Compiler Verification & Self-Correction Feedback Loop
      const healingResult = await healJavaCode({
        javaCode: result.javaCode,
        pythonCode: python_code,
        targetVersion: java_version,
        apiKey: activeGeminiKey,
      });

      if (healingResult.self_healing?.repaired) {
        metrics.incSelfHealingCorrection(healingResult.self_healing.corrections_applied?.length || 1);
      }

      javaCode = healingResult.javaCode;
      selfHealing = healingResult.self_healing;
      engine = result.engine;
      summary = healingResult.self_healing.repaired
        ? `${result.summary} [🛡️ Auto-Repaired via Self-Correction: ${healingResult.self_healing.corrections_applied.length} issue(s) resolved]`
        : `${result.summary} [🛡️ AST Verified: Clean Syntax]`;

      // Populate Cache for future identical requests with self-healed payload
      astCache.set(cacheKey, { javaCode, engine, summary, selfHealing });
    }

    const executionTimeMs = Math.max(1, Math.round(performance.now() - startTime));
    metrics.observeDuration(executionTimeMs / 1000);

    // 6. Asynchronous Webhook Dispatch
    let webhookReport = null;
    if (rawWebhookUrl) {
      const resolvedWebhookUrl =
        rawWebhookUrl === '/api/v1/webhook-demo' && request?.url
          ? new URL('/api/v1/webhook-demo', request.url).toString()
          : rawWebhookUrl;

      webhookReport = await dispatchWebhook({
        webhookUrl: resolvedWebhookUrl,
        allowLocalDemo: rawWebhookUrl === '/api/v1/webhook-demo',
        payload: {
          data: {
            source_language: 'python',
            target_language: 'java',
            java_version: safeJavaVersion,
            execution_time_ms: executionTimeMs,
            python_lines: (python_code.match(/\n/g) || []).length + 1,
            java_preview: javaCode.split('\n').slice(0, 6).join('\n') + '\n// ...',
            cache_hit: isCacheHit,
          },
        },
      });
      if (webhookReport) {
        metrics.incWebhookDispatch(webhookReport.ok);
      }
    }

    // 7. Return standard 200 OK Response Contract with Cache & Self-Healing Headers
    const responseHeaders = {
      'X-Cache': isCacheHit ? 'HIT' : 'MISS',
      'X-Cache-Key': cacheKey,
      'X-Execution-Time-Ms': String(executionTimeMs),
      'X-Self-Healing-Passes': String(selfHealing?.passes ?? 0),
      'X-Self-Healing-Repaired': String(Boolean(selfHealing?.repaired)),
      'X-Self-Healing-Quality': `${selfHealing?.diagnostics?.quality_score ?? 100}%`,
      ...rateLimit.headers,
    };

    if (isCacheHit && cachedHit?.hits) {
      responseHeaders['X-Cache-Hits'] = String(cachedHit.hits);
    }

    const response = NextResponse.json(
      {
        status: 'success',
        http_code: 200,
        event: 'code.conversion.completed',
        timestamp: new Date().toISOString(),
        engine,
        summary,
        cache: {
          hit: isCacheHit,
          key: cacheKey,
          hits: isCacheHit ? cachedHit.hits : 0,
          latency_ms: executionTimeMs,
        },
        self_healing: selfHealing,
        data: {
          source_language: 'python',
          target_language: 'java',
          java_version: safeJavaVersion,
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
              signature: webhookReport.signature,
              headers: webhookReport.headers,
              payload: webhookReport.payload,
              ...(webhookReport.error ? { error: webhookReport.error } : {}),
            }
          : {
              dispatched: false,
              target_url: null,
              status_code: null,
            },
      },
      {
        status: 200,
        headers: responseHeaders,
      }
    );
    metrics.incTranspile(200);
    return response;
  } catch (error) {
    metrics.incTranspile(500);
    metrics.observeDuration(Math.max(0.001, (performance.now() - startTime) / 1000));
    return NextResponse.json(
      {
        status: 'error',
        http_code: 500,
        error: 'Internal Server Error',
        message: 'Transpilation pipeline encountered an unexpected internal error.',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
