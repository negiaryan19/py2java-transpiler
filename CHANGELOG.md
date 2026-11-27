# Changelog

## V2.0.0 (2026-11-27)

### Added
- **Forge Dark V2 Interface**: Unified Deep Navy Obsidian (`#080C14`), Forge Orange (`#F97316`), Python Cyan (`#38BDF8`), and Emerald (`#10B981`) visual system with vector Python & Java logos (`LanguageLogos.jsx`), Anvil V2 brand identity (`BrandMark.jsx`), Overview KPI sparklines (`ShowcaseViews.jsx`), and dual-pane **Semantic Verification Engine** stdout comparison table (`TranspilerStudio.jsx`).
- **Learning Studio (`LearningWorkspaceView`)**: Interactive side-by-side Python-to-Java semantic guide covering Floor Division, Null Identity, Dictionaries, Stream Comprehensions, and Exception semantics.
- **Multi-File Project Migrator**: `POST /api/v1/projects/migrate` plus frontend uploader & Maven ZIP export in `FilesWorkspaceView` (`WorkspaceViews.jsx`).
- **Static Compatibility & Analysis API**: `POST /api/v1/analyze` exposing construct compatibility, dependency mapping, code quality heuristics, and AST node counts.
- **SEO & Hardened Security**: `app/robots.js`, `app/sitemap.js`, and strict `Content-Security-Policy` headers in `next.config.mjs`.
- **100-Case Benchmark & V2 Security Suites**: `tests/benchmark-100.test.mjs` across 15 categories and `tests/api-v2-security.test.mjs`.

### Fixed
- **Spring Boot Compilation Failure (`javac`)**: Stopped Gemini and fallback paths from emitting `import org.springframework.*;` on standard Python scripts without web routes, and taught `lib/compiler-repair.js` to strip unused Spring imports when `javac` reports `package org.springframework... does not exist`.
- **11 Deterministic AST Leaks**: Fixed `deterministicAstFallback` (`lib/gemini.js`) for Python `import` statements, `var x = null;`, `is None` / `is not None`, `pass`, decorators (`@dataclass`, `@staticmethod`), `raise`, `with` context managers, negative `range` steps, single-arg lambdas, nested classes (`__init__`, `self.*`), and multi-argument `print()`.
- **OpenAPI v2 & Health Route Alignment**: Expanded `/api/v1/openapi.json` and `/api/v1/health` to report all 15 API routes cleanly.
