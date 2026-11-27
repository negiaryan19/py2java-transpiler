import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRawGithubUrl } from '../app/api/v1/import-github/route.js';
import { POST as forgotPost } from '../app/api/auth/forgot-password/route.js';

test('GitHub Importer: converts github.com blob URL to raw.githubusercontent.com', () => {
  const raw = resolveRawGithubUrl('https://github.com/octocat/Hello-World/blob/main/app.py');
  assert.equal(raw, 'https://raw.githubusercontent.com/octocat/Hello-World/main/app.py');
});

test('GitHub Importer: blocks non-GitHub SSRF URLs', () => {
  assert.equal(resolveRawGithubUrl('http://127.0.0.1:8080/secret.py'), null);
  assert.equal(resolveRawGithubUrl('https://169.254.169.254/latest/meta-data'), null);
  assert.equal(resolveRawGithubUrl('https://evil.com/script.py'), null);
});

test('Forgot Password Route: validates email format', async () => {
  const req = new Request('http://localhost/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'request', email: 'not-an-email' }),
  });
  const res = await forgotPost(req);
  assert.ok(res.status === 400 || res.status === 503);
});
