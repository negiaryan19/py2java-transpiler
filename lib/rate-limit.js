import { NextResponse } from 'next/server.js';
import { extractTrustedClientIp } from './security.js';

// Shared warm-instance store (mitigates per-module drift across Next routes & Server Actions)
// Bounded at MAX_BUCKETS to prevent memory-exhaustion DoS from rotating keys/IPs.
const MAX_BUCKETS = 10000;
const rateLimitMap = globalThis.__jforgeRateLimitStore || new Map();
if (!globalThis.__jforgeRateLimitStore) {
  globalThis.__jforgeRateLimitStore = rateLimitMap;
}

// Periodic cleanup of stale client buckets every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleBuckets() {
  const now = Date.now();
  if (now - lastCleanup >= CLEANUP_INTERVAL) {
    lastCleanup = now;
    for (const [key, bucket] of rateLimitMap.entries()) {
      if (now - bucket.windowStart > bucket.windowMs) {
        rateLimitMap.delete(key);
      }
    }
  }

  // Enforce hard cap if attacker floods distinct identifiers within a single window
  while (rateLimitMap.size >= MAX_BUCKETS) {
    const oldestKey = rateLimitMap.keys().next().value;
    if (oldestKey === undefined) break;
    rateLimitMap.delete(oldestKey);
  }
}

/**
 * Enterprise Rate-Limiting Guard for J-Forge API Gateway
 * Protects Gemini quota and serverless backend against volumetric DDoS/abuse.
 * 
 * @param {Request} request - Incoming request object
 * @param {Object} options - { limit = 60, windowMs = 60000 }
 * @returns {{ allowed: boolean, response?: NextResponse, headers: Record<string, string> }}
 */
export function checkRateLimit(request, options = {}) {
  cleanupStaleBuckets();

  const limit = options.limit || 60; // Max requests per window
  const windowMs = options.windowMs || 60 * 1000; // 1-minute window
  const keyPrefix = options.keyPrefix || '';
  const now = Date.now();

  const clientIp = options.clientId || extractTrustedClientIp(request?.headers);
  const ip = `${keyPrefix}${clientIp}`;

  let bucket = rateLimitMap.get(ip);
  if (!bucket || now - bucket.windowStart >= windowMs) {
    bucket = { count: 1, windowStart: now, windowMs };
    rateLimitMap.set(ip, bucket);
  } else {
    bucket.count += 1;
  }

  const remaining = Math.max(0, limit - bucket.count);
  const resetSeconds = Math.ceil((bucket.windowStart + windowMs - now) / 1000);

  const rateLimitHeaders = {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(resetSeconds),
  };

  if (bucket.count > limit) {
    return {
      allowed: false,
      headers: rateLimitHeaders,
      response: NextResponse.json(
        {
          status: 'error',
          http_code: 429,
          error: 'Too Many Requests',
          message: `API rate limit of ${limit} requests per minute exceeded. Please retry after ${resetSeconds} seconds.`,
          retry_after_seconds: resetSeconds,
          timestamp: new Date().toISOString(),
        },
        {
          status: 429,
          headers: {
            ...rateLimitHeaders,
            'Retry-After': String(resetSeconds),
          },
        }
      ),
    };
  }

  return { allowed: true, headers: rateLimitHeaders };
}
