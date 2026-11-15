import test from 'node:test';
import assert from 'node:assert/strict';
import { validateApiKey } from '../lib/auth.js';

test('Auth Middleware: Rejects request with missing API key (401)', () => {
  const mockReq = {
    headers: {
      get: (header) => null,
    },
  };

  const auth = validateApiKey(mockReq);
  assert.equal(auth.isValid, false);
  assert.ok(auth.response);
});

test('Auth Middleware: Rejects request with invalid API key (401)', () => {
  const mockReq = {
    headers: {
      get: (header) => (header.toLowerCase() === 'x-api-key' ? 'wrong-key-xyz' : null),
    },
  };

  const auth = validateApiKey(mockReq);
  assert.equal(auth.isValid, false);
  assert.ok(auth.response);
});

test('Auth Middleware: Authorizes valid x-api-key matching configured key', () => {
  process.env.APP_API_KEY = 'ciap-secret-key-2026';
  const mockReq = {
    headers: {
      get: (header) => (header.toLowerCase() === 'x-api-key' ? 'ciap-secret-key-2026' : null),
    },
  };

  const auth = validateApiKey(mockReq);
  assert.equal(auth.isValid, true);
});

test('Auth Middleware: Authorizes valid Bearer token in Authorization header', () => {
  process.env.APP_API_KEY = 'ciap-secret-key-2026';
  const mockReq = {
    headers: {
      get: (header) => (header.toLowerCase() === 'authorization' ? 'Bearer ciap-secret-key-2026' : null),
    },
  };

  const auth = validateApiKey(mockReq);
  assert.equal(auth.isValid, true);
});
