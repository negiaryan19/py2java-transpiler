import { NextResponse } from 'next/server.js';
import { metrics } from '../../../../lib/metrics.js';

/**
 * GET /api/v1/metrics
 * Prometheus-Compatible Production Metrics Endpoint
 *
 * Returns all JForge operational counters, histograms, and gauges
 * in Prometheus text exposition format (text/plain; version=0.0.4).
 * Designed for Grafana/Prometheus/Datadog scraping at 15s intervals.
 */
export async function GET() {
  const prometheusText = metrics.toPrometheusText();

  return new NextResponse(prometheusText, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
