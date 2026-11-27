import test from 'node:test';
import assert from 'node:assert/strict';
import { astCache } from '../lib/cache.js';
import { POST } from '../app/api/v1/convert/route.js';

test('AST Cache: Canonicalize strips comments and trailing spaces while preserving semantics', () => {
  const py1 = `def add(a, b):
    # This is a comment
    return a + b  
`;
  const py2 = `def add(a, b):

    return a + b`;

  const canonical1 = astCache.canonicalize(py1);
  const canonical2 = astCache.canonicalize(py2);

  assert.equal(canonical1, canonical2);
});

test('AST Cache: Computes identical SHA-256 key for semantically identical Python code', () => {
  const codeA = 'def square(x):\n    # square function\n    return x * x';
  const codeB = 'def square(x):\n\n    return x * x   ';

  const keyA = astCache.computeKey(codeA, '17');
  const keyB = astCache.computeKey(codeB, '17');

  assert.equal(keyA, keyB);
  assert.equal(keyA.length, 64);
});

test('AST Cache: Cache Miss returns null and records metric; Cache Hit returns payload in sub-5ms', () => {
  // Warm V8 Map lookup & timer path on a throwaway key before strict sub-5ms benchmark
  astCache.set('__warmup__', { javaCode: 'class Warmup {}' });
  astCache.get('__warmup__');

  const uniqueCode = `def unique_func_${Date.now()}(): return "test"`;
  const key = astCache.computeKey(uniqueCode, '17');

  // 1. Initial cache miss
  const miss = astCache.get(key);
  assert.equal(miss, null);

  // 2. Set cache payload
  astCache.set(key, {
    javaCode: 'public class Solution { public static String test() { return "test"; } }',
    engine: 'gemini-2.5-flash',
    summary: 'Synthesized via Gemini',
  });

  // 3. Cache hit benchmark
  const start = performance.now();
  const hit = astCache.get(key);
  const durationMs = performance.now() - start;

  assert.ok(hit !== null);
  assert.equal(hit.engine, 'gemini-2.5-flash');
  assert.equal(hit.hits, 1);
  assert.ok(durationMs < 5, `Cache lookup should be sub-5ms, took ${durationMs}ms`);
});

test('AST Cache: POST /api/v1/convert returns X-Cache: MISS on 1st call and X-Cache: HIT on 2nd call', async () => {
  process.env.APP_API_KEY = 'ciap-secret-key-2026';
  const uniqueCode = `def compute_val_${Date.now()}(x: int) -> int:\n    return x * 10`;

  const makeReq = (bypass = false) => ({
    headers: {
      get: (h) => {
        const lower = h.toLowerCase();
        if (lower === 'x-api-key') return 'ciap-secret-key-2026';
        if (lower === 'content-type') return 'application/json';
        return null;
      },
    },
    json: async () => ({
      python_code: uniqueCode,
      java_version: '17',
      bypass_cache: bypass,
    }),
  });

  // 1st request -> Cache Miss
  const res1 = await POST(makeReq(false));
  assert.equal(res1.status, 200);
  assert.equal(res1.headers.get('X-Cache'), 'MISS');
  const data1 = await res1.json();
  assert.equal(data1.cache.hit, false);

  // 2nd request -> Cache Hit (Sub-5ms)
  const res2 = await POST(makeReq(false));
  assert.equal(res2.status, 200);
  assert.equal(res2.headers.get('X-Cache'), 'HIT');
  const data2 = await res2.json();
  assert.equal(data2.cache.hit, true);
  assert.ok(data2.cache.latency_ms <= 10);

  // 3rd request with bypass_cache: true -> Forced Miss
  const res3 = await POST(makeReq(true));
  assert.equal(res3.status, 200);
  assert.equal(res3.headers.get('X-Cache'), 'MISS');
  const data3 = await res3.json();
  assert.equal(data3.cache.hit, false);
});
