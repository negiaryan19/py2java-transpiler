'use server';

import { headers } from 'next/headers';
import { transpilePythonToJava } from '../lib/gemini.js';
import { dispatchWebhook, computeWebhookSignature } from '../lib/webhook.js';
import { checkRateLimit } from '../lib/rate-limit.js';
import { astCache } from '../lib/cache.js';
import { healJavaCode } from '../lib/self-healing.js';
import { metrics } from '../lib/metrics.js';
import { parsePython, parseJava } from '../lib/ast-parser.js';
import { alignNodes } from '../lib/ast-aligner.js';
import { explainPythonToJava } from '../lib/explain.js';
import {
  MAX_CODE_CHARS,
  extractTrustedClientIp,
  normalizeJavaVersion,
  validateCodePayload,
} from '../lib/security.js';

const STATIC_DEMO_SAMPLE_PAYLOAD = {
  id: 'wh_ciap_init99',
  event: 'code.conversion.completed',
  status: 'delivered',
  created_at: '2026-11-15T10:30:00.000Z',
  data: {
    source_language: 'python',
    target_language: 'java',
    execution_time_ms: 38,
    python_lines: 27,
    java_preview: 'package com.jforge.ciap;\n\npublic class Solution {\n    public static class BankAccount {\n// ...',
  },
};

const MAX_UI_GEMINI_CALLS_PER_HOUR = 100;
const UI_BUDGET_WINDOW_MS = 60 * 60 * 1000;

function consumeServerGeminiUiBudget() {
  const now = Date.now();
  const store = globalThis.__jforgeUiGeminiBudget || { count: 0, windowStart: now };
  if (now - store.windowStart >= UI_BUDGET_WINDOW_MS) {
    store.count = 1;
    store.windowStart = now;
  } else {
    store.count += 1;
  }
  globalThis.__jforgeUiGeminiBudget = store;
  return store.count <= MAX_UI_GEMINI_CALLS_PER_HOUR;
}

function sanitizeClientGeminiKey(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 120 || !/^[\x21-\x7E]+$/.test(trimmed)) return null;
  return trimmed;
}

async function getServerActionClientContext() {
  const reqHeaders = await headers();
  const clientId = extractTrustedClientIp(reqHeaders);
  const rawHost = reqHeaders.get('x-forwarded-host') || reqHeaders.get('host') || 'localhost:3000';
  const candidateHost = rawHost.split(',')[0].trim();
  const host = /^[a-zA-Z0-9.-]+(?::\d{1,5})?$/.test(candidateHost) ? candidateHost : 'localhost:3000';
  const proto =
    reqHeaders.get('x-forwarded-proto')?.split(',')[0]?.trim() === 'https'
      ? 'https'
      : host.startsWith('localhost') || host.startsWith('127.0.0.1')
        ? 'http'
        : 'https';

  const secFetchSite = reqHeaders.get('sec-fetch-site');
  const originHeader = reqHeaders.get('origin');
  let originAllowed = secFetchSite !== 'cross-site';
  if (originAllowed && originHeader) {
    try {
      originAllowed = new URL(originHeader).host === host;
    } catch {
      originAllowed = false;
    }
  }

  return {
    clientId,
    origin: `${proto}://${host}`,
    originAllowed,
  };
}

/**
 * Interactive Studio Server Action: executes AST cache, Gemini transpilation,
 * self-healing, and SSRF-safe webhook delivery strictly on the server without
 * exposing APP_API_KEY or GEMINI_API_KEY to the browser bundle.
 */
export async function studioTranspileAction({
  pythonCode,
  javaVersion = '17',
  webhookUrl = '',
  clientGeminiKey = '',
  bypassCache = false,
} = {}) {
  const startTime = performance.now();
  const { clientId, origin, originAllowed } = await getServerActionClientContext();
  if (!originAllowed) {
    metrics.incTranspile(403);
    return { ok: false, status: 403, error: 'Cross-origin Server Action invocation rejected.' };
  }

  const rateLimit = checkRateLimit(null, {
    clientId,
    keyPrefix: 'ui_transpile:',
    limit: 15,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    metrics.incTranspile(429);
    metrics.incRateLimitBlock();
    return {
      ok: false,
      status: 429,
      error: 'UI rate limit exceeded (15 requests/minute). Please retry in a moment.',
    };
  }

  const codeValidation = validateCodePayload(pythonCode, 'python_code', MAX_CODE_CHARS);
  if (!codeValidation.valid) {
    metrics.incTranspile(codeValidation.status);
    return {
      ok: false,
      status: codeValidation.status,
      error: codeValidation.error,
    };
  }

  const versionCheck = normalizeJavaVersion(javaVersion);
  if (!versionCheck.valid) {
    metrics.incTranspile(400);
    return {
      ok: false,
      status: 400,
      error: versionCheck.error,
    };
  }
  const safeJavaVersion = versionCheck.value;
  const safeOverrideKey = sanitizeClientGeminiKey(clientGeminiKey);
  // Ignore cache bypass for anonymous callers using server GEMINI_API_KEY
  const effectiveBypassCache = Boolean(bypassCache && safeOverrideKey);
  const cacheKey = astCache.computeKey(pythonCode, safeJavaVersion);
  const cachedHit = !effectiveBypassCache ? astCache.get(cacheKey) : null;

  try {
    let javaCode = '';
    let engine = '';
    let summary = '';
    let isCacheHit = false;
    let selfHealing = null;

    if (cachedHit) {
      javaCode = cachedHit.javaCode;
      engine = cachedHit.engine;
      summary = `${cachedHit.summary} (Served from Semantic AST Cache)`;
      selfHealing = cachedHit.selfHealing;
      isCacheHit = true;
      metrics.incCacheHit();
    } else {
      metrics.incCacheMiss();
      const skipServerKey = !safeOverrideKey && !consumeServerGeminiUiBudget();

      const transpiled = await transpilePythonToJava(
        pythonCode,
        `Java ${safeJavaVersion} LTS`,
        safeOverrideKey,
        { skipServerKey }
      );

      const healed = await healJavaCode({
        javaCode: transpiled.javaCode,
        pythonCode,
        apiKey: safeOverrideKey || (skipServerKey ? '' : process.env.GEMINI_API_KEY),
        targetVersion: `Java ${safeJavaVersion} LTS`,
      });

      javaCode = healed.javaCode;
      engine = transpiled.engine;
      summary = transpiled.summary;
      selfHealing = healed.self_healing;

      if (selfHealing?.repaired) {
        metrics.incSelfHealingCorrection(selfHealing.corrections_applied?.length || 1);
      }

      if (selfHealing?.syntax_valid !== false) {
        astCache.set(cacheKey, {
          javaCode,
          engine,
          summary,
          selfHealing,
          javaVersion: safeJavaVersion,
        });
      }
    }

    const executionTimeMs = Math.max(1, Math.round(performance.now() - startTime));
    metrics.observeDuration(executionTimeMs / 1000);

    let webhookDelivery = null;
    const rawWebhookUrl = typeof webhookUrl === 'string' ? webhookUrl.trim() : '';
    if (rawWebhookUrl) {
      const resolvedWebhookUrl =
        rawWebhookUrl === '/api/v1/webhook-demo' ? `${origin}/api/v1/webhook-demo` : rawWebhookUrl;

      const report = await dispatchWebhook({
        webhookUrl: resolvedWebhookUrl,
        allowLocalDemo: rawWebhookUrl === '/api/v1/webhook-demo',
        payload: {
          data: {
            source_language: 'python',
            target_language: 'java',
            java_version: safeJavaVersion,
            execution_time_ms: executionTimeMs,
            python_lines: (pythonCode.match(/\n/g) || []).length + 1,
            java_preview: javaCode.split('\n').slice(0, 6).join('\n') + '\n// ...',
            cache_hit: isCacheHit,
          },
        },
      });
      if (report) {
        metrics.incWebhookDispatch(report.ok);
        webhookDelivery = {
          dispatched: report.dispatched,
          target_url: report.targetUrl,
          delivery_id: report.deliveryId,
          status_code: report.statusCode,
          ok: report.ok,
          signature: report.signature,
          headers: report.headers,
          payload: report.payload,
          ...(report.error ? { error: report.error } : {}),
        };
      }
    }

    metrics.incTranspile(200);
    return {
      ok: true,
      status: 200,
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
      webhook_delivery: webhookDelivery,
    };
  } catch {
    metrics.incTranspile(500);
    return {
      ok: false,
      status: 500,
      error: 'Internal server error during studio transpilation.',
    };
  }
}

/**
 * Interactive Studio Server Action: explains Python-to-Java complexity & memory model.
 */
export async function studioExplainAction({ pythonCode, javaVersion = '17' } = {}) {
  metrics.incExplainRequest();
  const { clientId, originAllowed } = await getServerActionClientContext();
  if (!originAllowed) {
    return { ok: false, status: 403, error: 'Cross-origin Server Action invocation rejected.' };
  }
  const rateLimit = checkRateLimit(null, {
    clientId,
    keyPrefix: 'ui_explain:',
    limit: 20,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return {
      ok: false,
      status: 429,
      error: 'Explanation rate limit exceeded. Please retry shortly.',
    };
  }

  const codeValidation = validateCodePayload(pythonCode, 'python_code', MAX_CODE_CHARS);
  if (!codeValidation.valid) {
    return { ok: false, status: codeValidation.status, error: codeValidation.error };
  }

  const versionCheck = normalizeJavaVersion(javaVersion);
  if (!versionCheck.valid) {
    return { ok: false, status: 400, error: versionCheck.error };
  }

  try {
    const skipServerKey = !consumeServerGeminiUiBudget();
    const data = await explainPythonToJava(pythonCode, versionCheck.value, { skipServerKey });
    return { ok: true, status: 200, data };
  } catch {
    return { ok: false, status: 500, error: 'Failed to analyze compiler diagnostics.' };
  }
}

/**
 * AST Diff Inspector Server Action: transpiles (if needed) and runs cross-language
 * AST node alignment without needing APP_API_KEY in the browser.
 */
export async function studioAstDiffAction({ pythonCode } = {}) {
  const { clientId, originAllowed } = await getServerActionClientContext();
  if (!originAllowed) {
    return { ok: false, status: 403, error: 'Cross-origin Server Action invocation rejected.' };
  }
  const rateLimit = checkRateLimit(null, {
    clientId,
    keyPrefix: 'ui_ast:',
    limit: 20,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return {
      ok: false,
      status: 429,
      error: 'AST analysis rate limit exceeded. Please retry shortly.',
    };
  }

  const codeValidation = validateCodePayload(pythonCode, 'python_code', MAX_CODE_CHARS);
  if (!codeValidation.valid) {
    return { ok: false, status: codeValidation.status, error: codeValidation.error };
  }

  try {
    const cacheKey = astCache.computeKey(pythonCode, '17');
    const cachedHit = astCache.get(cacheKey);

    let javaCode = cachedHit?.javaCode || '';
    if (!javaCode) {
      const skipServerKey = !consumeServerGeminiUiBudget();
      const transpiled = await transpilePythonToJava(pythonCode, 'Java 17 LTS', null, { skipServerKey });
      const healed = await healJavaCode({
        javaCode: transpiled.javaCode,
        pythonCode,
        apiKey: skipServerKey ? '' : process.env.GEMINI_API_KEY,
        targetVersion: 'Java 17 LTS',
      });
      javaCode = healed.javaCode;
      if (healed.self_healing?.syntax_valid !== false) {
        astCache.set(cacheKey, {
          javaCode,
          engine: transpiled.engine,
          summary: transpiled.summary,
          selfHealing: healed.self_healing,
          javaVersion: '17',
        });
      }
    }

    const pythonNodes = parsePython(pythonCode);
    const javaNodes = parseJava(javaCode);
    const alignmentPairs = alignNodes(pythonNodes, javaNodes);

    return {
      ok: true,
      status: 200,
      java_code: javaCode,
      alignment_pairs: alignmentPairs,
      summary: {
        total_python_nodes: pythonNodes.length,
        total_java_nodes: javaNodes.length,
        total_alignments: alignmentPairs.length,
        exact_matches: alignmentPairs.filter((p) => p.confidence === 'exact').length,
        inferred_matches: alignmentPairs.filter((p) => p.confidence === 'inferred').length,
        healed_matches: alignmentPairs.filter((p) => p.confidence === 'healed').length,
      },
    };
  } catch {
    return {
      ok: false,
      status: 500,
      error: 'AST differential engine encountered an internal error.',
    };
  }
}

/**
 * Webhook Inspector Server Action: dispatches an SSRF-checked & HMAC-signed webhook
 * using server WEBHOOK_SECRET (or an optional user-provided test secret).
 */
export async function studioDispatchWebhookAction({
  webhookUrl = '/api/v1/webhook-demo',
  eventType = 'code.conversion.completed',
  pythonCode = '',
  javaCode = '',
  latencyMs = 31,
  customSecret = '',
} = {}) {
  const { clientId, origin, originAllowed } = await getServerActionClientContext();
  if (!originAllowed) {
    return { ok: false, status: 403, error: 'Cross-origin Server Action invocation rejected.' };
  }
  const rateLimit = checkRateLimit(null, {
    clientId,
    keyPrefix: 'ui_webhook:',
    limit: 15,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return { ok: false, status: 429, error: 'Webhook test rate limit exceeded.' };
  }

  const rawTarget = (typeof webhookUrl === 'string' && webhookUrl.trim()) || '/api/v1/webhook-demo';
  const resolvedTarget = rawTarget === '/api/v1/webhook-demo' ? `${origin}/api/v1/webhook-demo` : rawTarget;
  const safeCustomSecret =
    typeof customSecret === 'string' && customSecret.trim() ? customSecret.trim() : undefined;

  const report = await dispatchWebhook({
    webhookUrl: resolvedTarget,
    allowLocalDemo: rawTarget === '/api/v1/webhook-demo',
    signingSecret: safeCustomSecret,
    eventType: String(eventType || 'code.conversion.completed').slice(0, 80),
    payload: {
      data: {
        source_language: 'python',
        target_language: 'java',
        execution_time_ms: Number(latencyMs) || 31,
        python_lines: ((pythonCode || '').match(/\n/g) || []).length + 1,
        java_preview: (javaCode || '').split('\n').slice(0, 6).join('\n') + '\n// ...',
      },
    },
  });

  if (report) {
    metrics.incWebhookDispatch(report.ok);
  }

  return {
    ok: Boolean(report?.dispatched),
    status: report?.statusCode ?? 502,
    error: report?.error || null,
    entry: {
      id: report?.deliveryId || 'wh_local_err',
      statusCode: report?.statusCode ?? 502,
      eventType: report?.headers?.['X-Event-Type'] || eventType,
      timestamp: report?.timestamp || new Date().toISOString(),
      targetUrl: rawTarget,
      headers: report?.headers || {
        'Content-Type': 'application/json',
        'X-Event-Type': eventType,
      },
      payload: report?.payload || { error: report?.error || 'Dispatch blocked or failed' },
    },
  };
}

/**
 * Signs ONLY the constant fixed UI preview sample payload on mount so
 * Webhook Inspector can demonstrate real /api/v1/webhook-verify checks
 * without embedding WEBHOOK_SECRET or creating an arbitrary signing oracle.
 */
export async function studioGetSampleSignatureAction() {
  try {
    const hmacHex = computeWebhookSignature(STATIC_DEMO_SAMPLE_PAYLOAD);
    return {
      ok: true,
      headers: {
        'X-Signature-SHA256': `sha256=${hmacHex}`,
        'X-JForge-Signature': `t=1763193000,v1=${hmacHex}`,
      },
    };
  } catch {
    return { ok: false, headers: {} };
  }
}
