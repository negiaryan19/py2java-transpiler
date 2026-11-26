import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRateLimit } from '../lib/rate-limit.js';
import { maskSecret, generateSecureSecret, getSecurityAudit } from '../lib/env.js';
import { GET as healthGet } from '../app/api/v1/health/route.js';
import { GET as openapiGet } from '../app/api/v1/openapi.json/route.js';

test('Security Guard: maskSecret correctly obscures credentials', () => {
  const secret = 'AIzaSy_1234567890abcdefghijklmnopqrstuvwxyz';
  const masked = maskSecret(secret);
  assert.ok(masked.startsWith('AIzaSy_'));
  assert.ok(masked.endsWith('wxyz'));
  assert.ok(masked.includes('...'));
  assert.ok(!masked.includes('1234567890'));
});

test('Security Guard: generateSecureSecret generates high-entropy random keys', () => {
  const key1 = generateSecureSecret(24);
  const key2 = generateSecureSecret(24);
  assert.equal(key1.length, 48);
  assert.equal(key2.length, 48);
  assert.notEqual(key1, key2);
});

test('Security Guard: getSecurityAudit reports timing-safe and active protections', () => {
  const audit = getSecurityAudit();
  assert.equal(audit.timing_safe_auth_active, true);
  assert.equal(audit.hmac_sha256_active, true);
  assert.equal(audit.rate_limiter_active, true);
});

test('Rate Limiter: Allows requests under limit and blocks on abuse (429)', () => {
  const mockReq = {
    headers: {
      get: (h) => (h.toLowerCase() === 'x-forwarded-for' ? '192.168.1.100' : null),
    },
  };

  const limit = 3;
  const res1 = checkRateLimit(mockReq, { limit, windowMs: 10000 });
  const res2 = checkRateLimit(mockReq, { limit, windowMs: 10000 });
  const res3 = checkRateLimit(mockReq, { limit, windowMs: 10000 });
  const res4 = checkRateLimit(mockReq, { limit, windowMs: 10000 });

  assert.equal(res1.allowed, true);
  assert.equal(res2.allowed, true);
  assert.equal(res3.allowed, true);
  assert.equal(res4.allowed, false);
  assert.equal(res4.response.status, 429);
});

test('Health Route: Returns 200 OK with security diagnostics and route catalog', async () => {
  const res = await healthGet();
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'healthy');
  assert.ok(data.uptime_seconds >= 0);
  assert.ok(data.security.timing_safe_mitigation);
  assert.equal(data.exported_routes.length, 8);
});

test('OpenAPI Route: Returns valid OpenAPI 3.1.0 document with all 8 endpoints', async () => {
  const res = await openapiGet();
  assert.equal(res.status, 200);
  const spec = await res.json();
  assert.equal(spec.openapi, '3.1.0');
  assert.ok(spec.paths['/api/v1/convert']);
  assert.ok(spec.paths['/api/v1/explain']);
  assert.ok(spec.paths['/api/v1/ast-diff']);
  assert.ok(spec.paths['/api/v1/webhook-verify']);
  assert.ok(spec.paths['/api/v1/webhook-demo']);
  assert.ok(spec.paths['/api/v1/health']);
  assert.ok(spec.paths['/api/v1/metrics']);
  assert.ok(spec.paths['/api/v1/openapi.json']);
  assert.equal(Object.keys(spec.paths).length, 8);
});
