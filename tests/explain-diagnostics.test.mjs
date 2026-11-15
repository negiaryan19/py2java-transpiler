import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../app/api/v1/explain/route.js';

test('Diagnostics Route: Returns 401 when x-api-key is missing', async () => {
  const req = {
    headers: {
      get: () => null,
    },
    json: async () => ({ python_code: 'print(1)' }),
  };

  const res = await POST(req);
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.status, 'error');
  assert.equal(data.http_code, 401);
});

test('Diagnostics Route: Returns 400 when python_code is empty', async () => {
  process.env.APP_API_KEY = 'ciap-secret-key-2026';
  const req = {
    headers: {
      get: (h) => (h.toLowerCase() === 'x-api-key' ? 'ciap-secret-key-2026' : null),
    },
    json: async () => ({ python_code: '   ' }),
  };

  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.http_code, 400);
});

test('Diagnostics Route: Returns 200 with Big-O complexity & memory model analysis', async () => {
  process.env.APP_API_KEY = 'ciap-secret-key-2026';
  const req = {
    headers: {
      get: (h) => (h.toLowerCase() === 'x-api-key' ? 'ciap-secret-key-2026' : null),
    },
    json: async () => ({
      python_code: 'for i in range(10):\n    print(i)',
      java_version: '17',
    }),
  };

  const res = await POST(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'success');
  assert.equal(data.http_code, 200);
  assert.ok(data.data.time_complexity);
  assert.ok(data.data.space_complexity);
  assert.ok(data.data.type_safety_score);
  assert.ok(data.data.memory_model);
});
