# J-Forge V2 Product Roadmap & Baseline Audit

## Initial Codebase Audit Classification (Pre-V2 Baseline vs V2 State)

| Subsystem | Audit Status (V2) | Notes |
|---|---|---|
| Core Transpiler (`lib/gemini.js`, `POST /api/v1/convert`) | **Enhanced** | Added strict Spring import stripping and upgraded `deterministicAstFallback` for classes, `raise`, `with`, `is None`, `lambda`, negative `range` steps, multi-arg `print`, and `pass`. |
| Dual-Sandbox Execution & Verification (`POST /api/v1/verify`) | **Verified** | Live CPython 3.13 + OpenJDK 21 execution via Wandbox (`lib/verification.js`, `lib/python-sandbox.js`, `lib/java-sandbox.js`). |
| Compiler Self-Healing (`POST /api/v1/repair`) | **Enhanced** | Strips spurious `org.springframework.*` package imports on `javac` package-not-found errors (`lib/compiler-repair.js`). |
| Compatibility & Dependency Engine (`POST /api/v1/analyze`) | **New** | Deterministic construct classifier, Maven snippet suggester, code quality heuristics, and Conversion Passport export (`lib/compatibility.js`). |
| Multi-File Project Migration (`POST /api/v1/projects/migrate`) | **New** | Path-sanitized up-to-15-file uploader & API generating `pom.xml` + `src/main/java/com/jforge/migrated/*.java` ZIP archives. |
| Learning Studio (`LearningWorkspaceView`) | **New** | Side-by-side semantic comparison cards (`//`, `is None`, `dict`, Comprehensions, Exception semantics) with direct Studio loading. |
| Forge Dark UI & Authentic Logos | **Rebuilt** | Unified Deep Obsidian (`#080C14`), Forge Orange (`#F97316`), Cyan (`#38BDF8`), Emerald (`#10B981`), Python/Java SVGs, Sparkline Overview Dashboard, and Semantic Verification Engine table. |
| Security & SEO (`next.config.mjs`, `robots.js`, `sitemap.js`) | **Hardened** | Strict `Content-Security-Policy` (supporting Monaco CDN + worker blobs), SSRF CIDR blocklist, pinned DNS webhook delivery, timing-safe auth/HMAC, path traversal checks. |
| Deferred / Out-of-Scope Items | **Documented** | Stripe billing/subscriptions, GitHub OAuth (Google OAuth + Email/Password implemented), Java 8 & 25 compilers (only Java 11, 17, 21 allowlisted and verified). |

## Roadmap Phases
- **P0 — Stability, Compiler Bug Fixes & Visual Parity**: Fix `org.springframework` compilation failures, establish Forge Dark design system + authentic SVG logos, remove fake UI percentages and primary UI presets. *(Completed)*
- **P1 — Multi-File Migration, Analysis API & Learning Studio**: Wire `POST /api/v1/analyze`, `POST /api/v1/projects/migrate` (both API and Files Workspace ZIP UI), interactive `Learning Studio`, and `OpenAPI v2` docs. *(Completed)*
- **P2 — 100-Case Benchmark & Deterministic AST Hardening**: Build `tests/benchmark-100.test.mjs`, eliminate 11 uncovered Python statement/keyword leaks in `deterministicAstFallback`, verify live production SSR + 5 live sandbox cases. *(Completed)*
- **P3 — Enterprise Scale (Future)**: Dedicated isolated Docker/Firecracker runner cluster, multi-tenant organization RBAC, Stripe billing integration, GitHub OAuth provider.
