# J-Forge V2 Testing Methodology & Suite Inventory

## Automated Checks Run
- `npm test` (`node --test tests/*.test.mjs`): **103 / 103 tests passing** (0 failures, 0 skipped) across **24 test files**.
- `npm run lint` (`eslint`): **0 errors, 0 warnings**.
- `npm run build` (`next build` Next.js 16.4.6 Turbopack): **Compiled cleanly (`31/31` routes)**.

## Test Types & Strict Separation
1. **Static AST & Deterministic Tests**:
   - `tests/benchmark-100.test.mjs`: 100 representative Python programs across 15 categories checking structural Java AST validity and zero leaked Python constructs.
   - `tests/regression-30.test.mjs`: 30 core Python-to-Java baseline regression cases.
   - `tests/ast-engine.test.mjs`, `tests/ast-aligner.test.mjs`, `tests/compiler-repair.test.mjs`, `tests/sprint-48h.test.mjs`: Unit checks covering deterministic AST transforms (`__main__`, negative indexing, true division), alignment pairs, Spring import strip repairs, compatibility classifier, and selection conversion (`convert-selection`).
2. **Mocked Offline Unit Tests (Fetch Mocked)**:
   - `tests/verify-engine.test.mjs` and `tests/step3-platform.test.mjs` mock `globalThis.fetch` so Wandbox comparisons, multi-stdin test loops, and ZIP/JUnit builders run deterministically offline in CI.
3. **Security & API Gateway Tests**:
   - `tests/api-v2-security.test.mjs` & `tests/security-gateway.test.mjs`: Path traversal (`../`), duplicate file rejection, cross-file static reference rewriting on `/api/v1/projects/migrate`, payload validation on `/api/v1/analyze`, timing-safe API key verification, rate limiting, SSRF IPv4/IPv6 CIDR & DNS pinning checks, CSP headers, and all 15 OpenAPI endpoints.
4. **Live Sandbox, Maven Build & Playwright Browser Verification**:
   - **20-Case Live Wandbox Sandbox Benchmark**: Direct execution against CPython 3.13 + OpenJDK 21 (`19/20` compiled & `behavioral_match`; `1/20` explicit unsupported `eval()` legitimately failed `javac`; zero silent mismatches).
   - **Local Apache Maven (`3.10.2` / OpenJDK `27.0.1.1`) 5-Fixture Build Verification**: Exported & extracted 5 multi-file/JUnit ZIP fixtures (`cross-file imports`, `multiple classes`, `duplicate filenames`, `OOP inheritance`, and `JUnit 5 suite`) and ran `mvn clean compile` / `mvn clean test` — **5 / 5 passed (`exit 0`)**. *(Note: Vercel Serverless & remote web app still offer Maven Project Export `.zip` only, not hosted `mvn` execution.)*
   - **Playwright Chromium End-to-End & 6-Viewport Responsive Check**: Verified Landing Hero, empty Studio, file upload, live Convert & Verify, Selection conversion, Optimize Preview/Apply/Undo, Verification Studio, AI Assistant, Code Analysis, History, Learning Studio, Batch Multi-File ZIP migration, Settings Dark/Light switch, `/login` (with unavailable Google OAuth/Email Reset notices), `/ast-diff` (`CodeComparisonView`), and zero horizontal overflow (`overflowPx === 0`) across `1920x1080`, `1440x900`, `1280x800`, `1024x768`, `768x1024`, and `390x844`.
   - **Cross-Account Browser Isolation Check (Playwright + Neon Postgres)**: Verified two disposable accounts across page refresh, multi-tab logout broadcast, pending debounced auto-save race before logout, guest-to-auth transition, empty DB history replacement, and cross-user `PATCH`/`DELETE /api/history` (`404`).

## Note on LiveReview `coverage: 0%`
- Running `lrc review --staged --vouch` outputs `LiveReview: vouched (iter:..., coverage: 0%)`. Per `lrc review --help`, `--vouch` records manual attestation without running LiveReview's automated AI hunk review; `coverage: 0%` measures unreviewed diff hunks in LiveReview and does **not** represent test suite code coverage or functional QA proof.
