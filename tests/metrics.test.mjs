import { test } from 'node:test';
import assert from 'node:assert';
import { metrics, HISTOGRAM_BUCKETS } from '../lib/metrics.js';
import { GET as getMetrics } from '../app/api/v1/metrics/route.js';
import { GET as getHealth } from '../app/api/v1/health/route.js';

test('Prometheus Metrics: Collector records counter increments and exposes OpenMetrics format', () => {
  metrics.reset();

  metrics.incTranspile(200);
  metrics.incTranspile(200);
  metrics.incTranspile(400);
  metrics.incTranspile(401);
  metrics.incTranspile(429);
  metrics.incTranspile(500);

  metrics.incCacheHit();
  metrics.incCacheHit();
  metrics.incCacheMiss();

  metrics.incSelfHealingCorrection(3);
  metrics.incRateLimitBlock();
  metrics.incExplainRequest();
  metrics.incWebhookDispatch(true);
  metrics.incWebhookDispatch(false);

  const text = metrics.toPrometheusText();

  // Validate OpenMetrics HELP and TYPE declarations
  assert.ok(text.includes('# HELP jforge_transpile_requests_total'), 'Missing HELP for transpile requests');
  assert.ok(text.includes('# TYPE jforge_transpile_requests_total counter'), 'Missing TYPE for transpile requests');
  assert.ok(text.includes('jforge_transpile_requests_total{status="200"} 2'), 'Status 200 counter mismatch');
  assert.ok(text.includes('jforge_transpile_requests_total{status="400"} 1'), 'Status 400 counter mismatch');
  assert.ok(text.includes('jforge_transpile_requests_total{status="401"} 1'), 'Status 401 counter mismatch');
  assert.ok(text.includes('jforge_transpile_requests_total{status="429"} 1'), 'Status 429 counter mismatch');
  assert.ok(text.includes('jforge_transpile_requests_total{status="500"} 1'), 'Status 500 counter mismatch');

  // Validate Cache & Self-Healing metrics
  assert.ok(text.includes('jforge_cache_hits_total 2'), 'Cache hits total mismatch');
  assert.ok(text.includes('jforge_cache_misses_total 1'), 'Cache misses total mismatch');
  assert.ok(text.includes('jforge_self_healing_corrections_total 3'), 'Self-healing corrections mismatch');
  assert.ok(text.includes('jforge_rate_limit_blocks_total 1'), 'Rate limit blocks mismatch');
  assert.ok(text.includes('jforge_explain_requests_total 1'), 'Explain requests mismatch');
  assert.ok(text.includes('jforge_webhook_dispatches_total{outcome="success"} 1'), 'Webhook success count mismatch');
  assert.ok(text.includes('jforge_webhook_dispatches_total{outcome="failure"} 1'), 'Webhook failure count mismatch');
  assert.ok(text.includes('# TYPE jforge_uptime_seconds gauge'), 'Missing uptime gauge');
});

test('Prometheus Metrics: Histogram observes request duration across buckets', () => {
  metrics.reset();

  metrics.observeDuration(0.003); // falls in 0.005 bucket and up
  metrics.observeDuration(0.045); // falls in 0.05 bucket and up
  metrics.observeDuration(1.2);   // falls in 2.5 bucket and up

  const text = metrics.toPrometheusText();

  assert.ok(text.includes('# TYPE jforge_request_duration_seconds histogram'), 'Missing histogram TYPE declaration');
  assert.ok(text.includes('jforge_request_duration_seconds_count 3'), 'Histogram count must be 3');
  assert.ok(text.includes('jforge_request_duration_seconds_bucket{le="+Inf"} 3'), '+Inf bucket must match count');

  // 0.003 is <= 0.005, so bucket 0.005 must be at least 1
  assert.ok(text.includes('jforge_request_duration_seconds_bucket{le="0.005"} 1'), 'Bucket 0.005 mismatch');
});

test('Prometheus Metrics: getSnapshot returns operational JSON summary for health check', () => {
  metrics.reset();
  metrics.incTranspile(200);
  metrics.incCacheHit();
  metrics.incCacheMiss();
  metrics.observeDuration(0.05);

  const snapshot = metrics.getSnapshot();

  assert.strictEqual(snapshot.total_transpile_requests, 1);
  assert.strictEqual(snapshot.cache_hit_rate_percent, '50.0%');
  assert.strictEqual(snapshot.histogram_observations, 1);
  assert.ok(typeof snapshot.uptime_seconds === 'number');
});

test('Prometheus Route: GET /api/v1/metrics returns text/plain v0.0.4 with 200 OK', async () => {
  metrics.reset();
  metrics.incTranspile(200);

  const response = await getMetrics();
  assert.strictEqual(response.status, 200);

  const contentType = response.headers.get('content-type');
  assert.ok(contentType.includes('text/plain; version=0.0.4'), `Expected text/plain v0.0.4, got: ${contentType}`);

  const body = await response.text();
  assert.ok(body.includes('jforge_transpile_requests_total{status="200"} 1'));
  assert.ok(body.includes('# HELP jforge_uptime_seconds'));
});

test('Prometheus Route: GET /api/v1/health exposes observability section and route catalog entry', async () => {
  const response = await getHealth();
  assert.strictEqual(response.status, 200);

  const data = await response.json();
  assert.ok(data.observability, 'Expected observability section in health response');
  assert.strictEqual(data.observability.metrics_endpoint, '/api/v1/metrics');
  assert.ok(data.observability.snapshot, 'Expected snapshot object');

  const metricsRoute = data.exported_routes.find((r) => r.path === '/api/v1/metrics');
  assert.ok(metricsRoute, 'Expected /api/v1/metrics in exported_routes');
  assert.strictEqual(metricsRoute.method, 'GET');
});
