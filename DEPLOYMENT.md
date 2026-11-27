# J-Forge V2 Deployment & Environment Guide

## Local Development & Verification

```bash
npm install
npm test
npm run lint
npm run build
npm run dev
```

## Production Build & Startup Check

```bash
npm run build
npm run start
```

## Required & Optional Environment Variables (`.env.local` / Vercel Dashboard)

| Variable | Required? | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Recommended | Google AI Studio key for Gemini 2.5 Flash synthesis, compiler repair loop & AI intelligence actions. Without it, the Deterministic AST Engine serves conversions offline. |
| `APP_API_KEY` | Required for external API gateway calls | Shared secret validated via timing-safe comparison (`x-api-key` / Bearer) on `/api/v1/convert`, `/api/v1/explain`, `/api/v1/ast-diff`. |
| `WEBHOOK_SECRET` | Required for outbound signed webhooks | HMAC-SHA256 signing key (`WEBHOOK_SECRET`). |
| `AUTH_SECRET` | Required for browser login sessions | >= 32-char secret signing HTTP-only session cookies and OAuth PKCE state (`lib/session.js`). |
| `DATABASE_URL` | Required for persistent accounts/history | Neon Postgres connection string (`@neondatabase/serverless`). |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional | Enables **Continue with Google** OAuth flow (`/api/auth/google`). |
| `DEFAULT_WEBHOOK_URL` | Optional | Default webhook callback target. |

## Vercel Deployment Notes
- Target Node.js `>= 20.x` (verified in `.github/workflows/ci.yml`).
- Set environment variables in Vercel Project Settings (`Production` & `Preview`), and never commit `.env.local` or secrets to Git.
- Remote CPython 3.13 & OpenJDK 21 execution uses Wandbox HTTPS API (`https://wandbox.org/api/compile.json`) with `maxDuration = 30` on serverless verification routes.
