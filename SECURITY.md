# J-Forge V2 Security Architecture & Verification

## Implemented Controls

### 1. API Authentication, Session Security & Cross-User Isolation (`lib/auth.js`, `lib/session.js`, `lib/db.js`, `app/page.jsx`, `app/api/auth/session/route.js`)
- **Timing-Safe Validation**: `validateApiKey` and webhook HMAC signatures use length checks + `crypto.timingSafeEqual`, failing closed (`503`) if `APP_API_KEY` or `WEBHOOK_SECRET` are absent.
- **Session Signing & Expiration**: Browser sessions use HMAC-SHA256 signed cookies (`SESSION_TTL_SECONDS = 43200` / 12h), `httpOnly`, `sameSite: 'lax'`, `secure` in production, plus 10-minute PKCE (`S256`) state cookies for OAuth.
- **Passwords**: Salted `PBKDF2` (120,000 iterations, SHA-512, 32-byte salt, 64-byte key) in Neon Postgres.
- **Authenticated User Isolation (Verified via Playwright + Neon SQL)**:
  - Every `GET/POST/PATCH/DELETE` query in `/api/history` and `lib/db.js` binds `${String(userId)}` from `session.sub` with parameterized SQL (`neon`). Cross-account `PATCH`/`DELETE` returns `404`.
  - `/api/auth/session` returns both `id` and `sub` (`session.sub`) plus `oauthConfigured` and `emailResetConfigured` so unconfigured OAuth/email reset controls stay disabled cleanly on `/login`.
  - `app/page.jsx` namespaces `localStorage` draft/history keys by `u_<userId>` vs `'guest'`, cancels pending debounced draft writes (`draftTimerRef`) & stale async requests (`authEpochRef`) on logout, broadcasts logout/login state across browser tabs via `BroadcastChannel` + `storage` events, and clears workspace editors on logout.

### 2. SSRF, Path Traversal, XSS & Prompt Injection Guards (`lib/security.js`, `lib/webhook.js`, `next.config.mjs`)
- **SSRF Guard**: `assertSafeWebhookUrl` restricts to `http:` / `https:`, strips/rejects embedded credentials, blocks metadata/internal hostnames & private/loopback/link-local/CGNAT/IPv4-mapped IPv6 CIDRs, pins DNS resolution via `deliverWithPinnedDns`, and rejects HTTP `3xx` redirects.
- **GitHub Import**: `/api/v1/import-github` accepts only `https://github.com/*/blob/*` or `raw.githubusercontent.com` with `redirect: 'error'` and 25,000-char caps.
- **Path & ZipSlip Guards**: `/api/v1/projects/migrate` rejects `..`, `.`, leading `/`, null bytes, duplicate paths, >15 files, and >25,000-char payloads. `sanitizeZipEntryName` prevents ZipSlip archive paths.
- **XSS / DOM Sinks**: Zero `dangerouslySetInnerHTML`, `innerHTML`, or `eval` usage across UI/API files; strict `Content-Security-Policy` allows `'self'`, Monaco CDN (`https://cdn.jsdelivr.net`), `worker-src 'self' blob:`, `frame-ancestors 'none'`, `object-src 'none'`.
- **Prompt Injection Framing**: User code, selections, diagnostics, and questions are wrapped in `<untrusted_python_source>`, `<untrusted_selected_code>`, and `<user_question>` XML delimiters; Java target version is strictly allowlisted (`'11'`, `'17'`, `'21'`).

### 3. Rate Limiting & Serverless Cost Protection Decision (`lib/rate-limit.js`, `app/actions.js`)
- **Implemented Controls**: Bounded sliding-window `Map` (`MAX_BUCKETS = 10000`) per endpoint using platform IP headers (`x-vercel-forwarded-for`, `x-real-ip`, rightmost `x-forwarded-for`), per-user Gemini hourly budget (`MAX_USER_GEMINI_CALLS_PER_HOUR = 40`), server UI Gemini cap (`MAX_UI_GEMINI_CALLS_PER_HOUR = 100`), guest trial counter (`3`), 25,000-char payload limits, Wandbox 15–25s timeouts, and max 3 repair iterations.
- **Architectural Evaluation of Shared Neon Rate Limiter**: Adding synchronous Postgres read/write quota updates per request to `rate-limit.js` would add ~30–100ms latency per API call and trigger Neon compute/row-write churn on burst traffic without adding Redis. We therefore kept the bounded in-memory limiter (conservative per-endpoint RPM + hourly Gemini budgets) and explicitly document that distributed multi-instance Vercel scale would warrant Upstash Redis later.

## Required Environment Variables (`.env.local` / Vercel)
- **Active in current `.env.local`**: `GEMINI_API_KEY`, `DATABASE_URL`, `AUTH_SECRET`, `APP_API_KEY`, `WEBHOOK_SECRET`, `DEFAULT_WEBHOOK_URL`.
- **Optional (Currently Unconfigured in `.env.local`)**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY` (disabled cleanly in `/login` UI until provided).
