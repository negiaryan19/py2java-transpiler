import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGoogleAuthUrl,
  consumeUserGeminiQuota,
  createOAuthTransaction,
  createSessionToken,
  getAuthSecret,
  isGoogleOAuthConfigured,
  resolvePublicOrigin,
  sanitizeReturnPath,
  verifyOAuthTransaction,
  verifySessionToken,
} from '../lib/session.js';
import { GET as googleAuthGet } from '../app/api/auth/google/route.js';
import { GET as googleCallbackGet } from '../app/api/auth/google/callback/route.js';
import { POST as logoutPost } from '../app/api/auth/logout/route.js';

test('OAuth Session Security: Fails closed when AUTH_SECRET is missing or too short', () => {
  const prevSecret = process.env.AUTH_SECRET;
  const prevId = process.env.GOOGLE_CLIENT_ID;
  const prevClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  delete process.env.AUTH_SECRET;
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;

  try {
    assert.equal(getAuthSecret(), null);
    assert.equal(isGoogleOAuthConfigured(), false);
    assert.throws(() => createSessionToken({ sub: '123', email: 'test@gmail.com' }));
    assert.equal(verifySessionToken('invalid.token'), null);

    process.env.AUTH_SECRET = 'short';
    assert.equal(getAuthSecret(), null);
  } finally {
    if (prevSecret !== undefined) process.env.AUTH_SECRET = prevSecret;
    else delete process.env.AUTH_SECRET;
    if (prevId !== undefined) process.env.GOOGLE_CLIENT_ID = prevId;
    if (prevClientSecret !== undefined) process.env.GOOGLE_CLIENT_SECRET = prevClientSecret;
  }
});

test('OAuth PKCE & Session Signing: Issues and verifies signed cookies safely', () => {
  const prevSecret = process.env.AUTH_SECRET;
  const prevId = process.env.GOOGLE_CLIENT_ID;
  const prevClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  process.env.AUTH_SECRET = 'a'.repeat(64);
  process.env.GOOGLE_CLIENT_ID = '1234567890.apps.googleusercontent.com';
  process.env.GOOGLE_CLIENT_SECRET = 'GOCSPX-test-secret';

  try {
    assert.equal(isGoogleOAuthConfigured(), true);

    // Open redirect sanitizer
    assert.equal(sanitizeReturnPath('/ast-diff'), '/ast-diff');
    assert.equal(sanitizeReturnPath('//evil.com'), '/');
    assert.equal(sanitizeReturnPath('https://evil.com'), '/');

    // OAuth PKCE transaction
    const tx = createOAuthTransaction({ returnTo: '/ast-diff' });
    assert.ok(tx.state.length === 48);
    assert.ok(tx.codeChallenge.length > 20);
    const verifiedTx = verifyOAuthTransaction(tx.txToken, tx.state);
    assert.equal(verifiedTx.returnTo, '/ast-diff');
    assert.equal(verifyOAuthTransaction(tx.txToken, 'wrong-state'), null);

    // Build Google Auth URL
    const url = buildGoogleAuthUrl({
      origin: 'https://py2java-transpiler.vercel.app',
      state: tx.state,
      codeChallenge: tx.codeChallenge,
    });
    assert.ok(url.startsWith('https://accounts.google.com/o/oauth2/v2/auth?'));
    assert.ok(url.includes('code_challenge_method=S256'));

    // Session cookie verify & tamper rejection
    const token = createSessionToken({
      sub: 'google-sub-001',
      email: 'student@gmail.com',
      name: 'Student',
    });
    const session = verifySessionToken(token);
    assert.equal(session.sub, 'google-sub-001');
    assert.equal(session.email, 'student@gmail.com');

    const tampered = token.slice(0, -4) + 'zzzz';
    assert.equal(verifySessionToken(tampered), null);
  } finally {
    if (prevSecret !== undefined) process.env.AUTH_SECRET = prevSecret;
    else delete process.env.AUTH_SECRET;
    if (prevId !== undefined) process.env.GOOGLE_CLIENT_ID = prevId;
    else delete process.env.GOOGLE_CLIENT_ID;
    if (prevClientSecret !== undefined) process.env.GOOGLE_CLIENT_SECRET = prevClientSecret;
    else delete process.env.GOOGLE_CLIENT_SECRET;
  }
});

test('Per-User Gemini Quota: Isolates hourly budgets cleanly per authenticated user ID', () => {
  globalThis.__jforgeUserGeminiBudgets = new Map();

  for (let i = 1; i <= 3; i++) {
    const q = consumeUserGeminiQuota('user_a', 3);
    assert.equal(q.allowed, true);
  }
  const blocked = consumeUserGeminiQuota('user_a', 3);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);

  // Separate user remains completely unaffected
  const userB = consumeUserGeminiQuota('user_b', 3);
  assert.equal(userB.allowed, true);
  assert.equal(userB.remaining, 2);
});

test('OAuth Route Handlers: Rejects unconfigured OAuth, validates callback state, and clears cookie on logout', async () => {
  const prevSecret = process.env.AUTH_SECRET;
  const prevId = process.env.GOOGLE_CLIENT_ID;
  const prevClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  delete process.env.GOOGLE_CLIENT_ID;
  const unconfRes = await googleAuthGet(new Request('http://localhost:3000/api/auth/google?returnTo=/ast-diff'));
  assert.equal(unconfRes.status, 307);
  assert.ok(unconfRes.headers.get('location').includes('auth_error=oauth_not_configured'));

  process.env.AUTH_SECRET = 'b'.repeat(64);
  process.env.GOOGLE_CLIENT_ID = 'client-id';
  process.env.GOOGLE_CLIENT_SECRET = 'client-secret';

  try {
    assert.equal(
      resolvePublicOrigin(new Headers({ host: 'py2java-transpiler.vercel.app' })),
      'https://py2java-transpiler.vercel.app'
    );

    const badCbRes = await googleCallbackGet({
      url: 'https://py2java-transpiler.vercel.app/api/auth/google/callback?state=forged&code=123',
      headers: new Headers({ host: 'py2java-transpiler.vercel.app' }),
      cookies: { get: () => null },
    });
    assert.equal(badCbRes.status, 307);
    assert.ok(badCbRes.headers.get('location').includes('auth_error=invalid_oauth_state'));

    const outRes = await logoutPost();
    assert.equal(outRes.status, 200);
    const outJson = await outRes.json();
    assert.equal(outJson.ok, true);
  } finally {
    if (prevSecret !== undefined) process.env.AUTH_SECRET = prevSecret;
    else delete process.env.AUTH_SECRET;
    if (prevId !== undefined) process.env.GOOGLE_CLIENT_ID = prevId;
    else delete process.env.GOOGLE_CLIENT_ID;
    if (prevClientSecret !== undefined) process.env.GOOGLE_CLIENT_SECRET = prevClientSecret;
    else delete process.env.GOOGLE_CLIENT_SECRET;
  }
});
