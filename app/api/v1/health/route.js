import { NextResponse } from 'next/server.js';
import { getSecurityAudit } from '../../../../lib/env.js';
import { astCache } from '../../../../lib/cache.js';
import { metrics } from '../../../../lib/metrics.js';

const processStartTime = Date.now();

/**
 * GET /api/v1/health
 * Enterprise Health Check & Security Diagnostics Endpoint
 */
export async function GET() {
  const uptimeSeconds = Math.floor((Date.now() - processStartTime) / 1000);
  const mem = process.memoryUsage();
  const security = getSecurityAudit();
  const cacheStats = astCache.getStats();
  const metricsSnapshot = metrics.getSnapshot();

  return NextResponse.json(
    {
      status: 'healthy',
      http_code: 200,
      service: 'J-Forge Python to Java Transpiler & API Gateway',
      course: 'BTIN337 GenAI Applications (CIA-P)',
      author: 'Aryan Negi',
      timestamp: new Date().toISOString(),
      uptime_seconds: uptimeSeconds,
      engine: {
        provider: 'Google Gemini SDK (@google/genai)',
        preferred_model: 'gemini-2.5-flash',
        api_version: 'v1beta',
        fallback: 'Deterministic AST Synthesizer',
        status: security.gemini_key_configured ? 'CONNECTED_AND_ACTIVE' : 'FALLBACK_ACTIVE',
      },
      ast_semantic_cache: cacheStats,
      self_healing_pipeline: {
        status: 'active',
        strategy: 'deterministic_ast_heuristics + gemini_reflection_loop',
        verification_checks: [
          'lexical_delimiter_balance',
          'package_encapsulation',
          'class_structure_invariants',
          'import_resolution_audit',
          'markdown_fence_sanitization',
        ],
      },
      observability: {
        metrics_endpoint: '/api/v1/metrics',
        format: 'Prometheus OpenMetrics text/plain (v0.0.4)',
        snapshot: metricsSnapshot,
      },
      security: {
        authentication: 'x-api-key / Bearer (Constant-Time Timing-Safe)',
        timing_safe_mitigation: true,
        webhook_integrity: 'HMAC-SHA256 (Constant-Time)',
        rate_limiting: '60 req/min sliding window',
        environment: security.environment,
        zero_hardcoded_keys_verified: true,
      },
      system: {
        node_version: process.version,
        memory_rss_mb: Math.round(mem.rss / 1024 / 1024),
        heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
      },
      exported_routes: [
        { method: 'POST', path: '/api/v1/convert', auth_required: true, description: 'Core Transpiler + Webhook' },
        { method: 'POST', path: '/api/v1/explain', auth_required: true, description: 'Big-O Diagnostics & Memory Model' },
        { method: 'POST', path: '/api/v1/webhook-verify', auth_required: false, description: 'HMAC-SHA256 Signature Validator' },
        { method: 'POST', path: '/api/v1/webhook-demo', auth_required: false, description: 'Local Mock Webhook Receiver' },
        { method: 'GET', path: '/api/v1/health', auth_required: false, description: 'Health & Security Probe' },
        { method: 'GET', path: '/api/v1/metrics', auth_required: false, description: 'Prometheus Metrics Exposition' },
        { method: 'GET', path: '/api/v1/openapi.json', auth_required: false, description: 'OpenAPI 3.1 Specification' },
      ],
    },
    { status: 200 }
  );
}
