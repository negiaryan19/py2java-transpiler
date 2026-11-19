/**
 * J-Forge Prometheus Production Metrics Collector
 *
 * Enterprise-grade observability layer exposing OpenMetrics-compatible
 * counters, histograms, and gauges for Grafana/Prometheus scraping.
 *
 * Singleton pattern preserved across serverless hot-reloads via globalThis.
 */

const HISTOGRAM_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

class MetricsCollector {
  constructor() {
    this._startTime = Date.now();

    // ── Counters ──────────────────────────────────────────────────
    this.counters = {
      transpile_requests_total: { '200': 0, '400': 0, '401': 0, '429': 0, '500': 0 },
      cache_hits_total: 0,
      cache_misses_total: 0,
      self_healing_corrections_total: 0,
      rate_limit_blocks_total: 0,
      explain_requests_total: 0,
      webhook_dispatches_total: { success: 0, failure: 0 },
    };

    // ── Histogram: request duration ──────────────────────────────
    this.histograms = {
      request_duration_seconds: {
        buckets: HISTOGRAM_BUCKETS.reduce((acc, b) => { acc[b] = 0; return acc; }, {}),
        sum: 0,
        count: 0,
      },
    };
  }

  // ── Counter Increment Methods ────────────────────────────────

  /** Record a transpile request by HTTP status code */
  incTranspile(statusCode) {
    const key = String(statusCode);
    if (key in this.counters.transpile_requests_total) {
      this.counters.transpile_requests_total[key] += 1;
    }
  }

  incCacheHit() {
    this.counters.cache_hits_total += 1;
  }

  incCacheMiss() {
    this.counters.cache_misses_total += 1;
  }

  incSelfHealingCorrection(count = 1) {
    this.counters.self_healing_corrections_total += count;
  }

  incRateLimitBlock() {
    this.counters.rate_limit_blocks_total += 1;
  }

  incExplainRequest() {
    this.counters.explain_requests_total += 1;
  }

  incWebhookDispatch(success = true) {
    if (success) {
      this.counters.webhook_dispatches_total.success += 1;
    } else {
      this.counters.webhook_dispatches_total.failure += 1;
    }
  }

  // ── Histogram Methods ────────────────────────────────────────

  /** Observe a request duration in seconds */
  observeDuration(durationSeconds) {
    const hist = this.histograms.request_duration_seconds;
    hist.sum += durationSeconds;
    hist.count += 1;
    for (const bucket of HISTOGRAM_BUCKETS) {
      if (durationSeconds <= bucket) {
        hist.buckets[bucket] += 1;
      }
    }
  }

  // ── Prometheus Text Exposition Format ────────────────────────

  /**
   * Render all metrics in Prometheus text exposition format (text/plain; version=0.0.4).
   * Follows OpenMetrics naming conventions with jforge_ prefix.
   */
  toPrometheusText() {
    const lines = [];
    const ts = Date.now();

    // ── jforge_transpile_requests_total ──
    lines.push('# HELP jforge_transpile_requests_total Total transpilation API requests by HTTP status code.');
    lines.push('# TYPE jforge_transpile_requests_total counter');
    for (const [status, count] of Object.entries(this.counters.transpile_requests_total)) {
      lines.push(`jforge_transpile_requests_total{status="${status}"} ${count}`);
    }

    // ── jforge_cache_hits_total ──
    lines.push('# HELP jforge_cache_hits_total Total semantic AST cache hits.');
    lines.push('# TYPE jforge_cache_hits_total counter');
    lines.push(`jforge_cache_hits_total ${this.counters.cache_hits_total}`);

    // ── jforge_cache_misses_total ──
    lines.push('# HELP jforge_cache_misses_total Total semantic AST cache misses.');
    lines.push('# TYPE jforge_cache_misses_total counter');
    lines.push(`jforge_cache_misses_total ${this.counters.cache_misses_total}`);

    // ── jforge_self_healing_corrections_total ──
    lines.push('# HELP jforge_self_healing_corrections_total Total autonomous compiler self-corrections applied.');
    lines.push('# TYPE jforge_self_healing_corrections_total counter');
    lines.push(`jforge_self_healing_corrections_total ${this.counters.self_healing_corrections_total}`);

    // ── jforge_rate_limit_blocks_total ──
    lines.push('# HELP jforge_rate_limit_blocks_total Total requests rejected by rate limiter (HTTP 429).');
    lines.push('# TYPE jforge_rate_limit_blocks_total counter');
    lines.push(`jforge_rate_limit_blocks_total ${this.counters.rate_limit_blocks_total}`);

    // ── jforge_explain_requests_total ──
    lines.push('# HELP jforge_explain_requests_total Total compiler diagnostics requests.');
    lines.push('# TYPE jforge_explain_requests_total counter');
    lines.push(`jforge_explain_requests_total ${this.counters.explain_requests_total}`);

    // ── jforge_webhook_dispatches_total ──
    lines.push('# HELP jforge_webhook_dispatches_total Total webhook delivery attempts by outcome.');
    lines.push('# TYPE jforge_webhook_dispatches_total counter');
    lines.push(`jforge_webhook_dispatches_total{outcome="success"} ${this.counters.webhook_dispatches_total.success}`);
    lines.push(`jforge_webhook_dispatches_total{outcome="failure"} ${this.counters.webhook_dispatches_total.failure}`);

    // ── jforge_request_duration_seconds ──
    const hist = this.histograms.request_duration_seconds;
    lines.push('# HELP jforge_request_duration_seconds Histogram of transpilation request durations in seconds.');
    lines.push('# TYPE jforge_request_duration_seconds histogram');
    let cumulativeCount = 0;
    for (const bucket of HISTOGRAM_BUCKETS) {
      cumulativeCount += hist.buckets[bucket];
      lines.push(`jforge_request_duration_seconds_bucket{le="${bucket}"} ${cumulativeCount}`);
    }
    lines.push(`jforge_request_duration_seconds_bucket{le="+Inf"} ${hist.count}`);
    lines.push(`jforge_request_duration_seconds_sum ${hist.sum.toFixed(6)}`);
    lines.push(`jforge_request_duration_seconds_count ${hist.count}`);

    // ── jforge_uptime_seconds ──
    const uptimeSeconds = Math.floor((ts - this._startTime) / 1000);
    lines.push('# HELP jforge_uptime_seconds Seconds since the metrics collector was initialized.');
    lines.push('# TYPE jforge_uptime_seconds gauge');
    lines.push(`jforge_uptime_seconds ${uptimeSeconds}`);

    return lines.join('\n') + '\n';
  }

  // ── JSON snapshot for health endpoint ────────────────────────

  getSnapshot() {
    const totalTranspile = Object.values(this.counters.transpile_requests_total)
      .reduce((a, b) => a + b, 0);
    const hist = this.histograms.request_duration_seconds;
    const avgDuration = hist.count > 0 ? (hist.sum / hist.count).toFixed(4) : '0.0000';
    const cacheTotal = this.counters.cache_hits_total + this.counters.cache_misses_total;
    const hitRate = cacheTotal > 0
      ? ((this.counters.cache_hits_total / cacheTotal) * 100).toFixed(1)
      : '0.0';

    return {
      total_transpile_requests: totalTranspile,
      cache_hit_rate_percent: `${hitRate}%`,
      self_healing_corrections: this.counters.self_healing_corrections_total,
      rate_limit_blocks: this.counters.rate_limit_blocks_total,
      avg_request_duration_seconds: avgDuration,
      histogram_observations: hist.count,
      uptime_seconds: Math.floor((Date.now() - this._startTime) / 1000),
    };
  }

  /** Reset all counters (useful for testing) */
  reset() {
    this.counters.transpile_requests_total = { '200': 0, '400': 0, '401': 0, '429': 0, '500': 0 };
    this.counters.cache_hits_total = 0;
    this.counters.cache_misses_total = 0;
    this.counters.self_healing_corrections_total = 0;
    this.counters.rate_limit_blocks_total = 0;
    this.counters.explain_requests_total = 0;
    this.counters.webhook_dispatches_total = { success: 0, failure: 0 };
    this.histograms.request_duration_seconds = {
      buckets: HISTOGRAM_BUCKETS.reduce((acc, b) => { acc[b] = 0; return acc; }, {}),
      sum: 0,
      count: 0,
    };
    this._startTime = Date.now();
  }
}

// Global singleton preserved across serverless hot-reloads
export const metrics = globalThis.__jforgeMetrics || new MetricsCollector();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__jforgeMetrics = metrics;
}

export { HISTOGRAM_BUCKETS };
