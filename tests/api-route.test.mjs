import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../app/api/v1/convert/route.js';

test('API Route: Returns 401 when x-api-key is missing', async () => {
  const req = {
    headers: {
      get: (h) => null,
    },
    json: async () => ({ python_code: 'print(1)' }),
  };

  const res = await POST(req);
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.status, 'error');
  assert.equal(data.http_code, 401);
});

test('API Route: Returns 400 when python_code is empty', async () => {
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
  assert.ok(data.message.includes('python_code'));
});

test('API Route: Returns 200 OK with valid contract on valid Python input', async () => {
  process.env.APP_API_KEY = 'ciap-secret-key-2026';
  const req = {
    headers: {
      get: (h) => (h.toLowerCase() === 'x-api-key' ? 'ciap-secret-key-2026' : null),
    },
    json: async () => ({
      python_code: 'def add(a: int, b: int) -> int:\n    return a + b',
      java_version: '17',
    }),
  };

  const res = await POST(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'success');
  assert.equal(data.http_code, 200);
  assert.equal(data.event, 'code.conversion.completed');
  assert.ok(data.data.java_code);
  assert.ok(data.data.execution_time_ms >= 0);
  assert.ok(data.engine);
});
