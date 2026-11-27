# J-Forge V2 Architecture

## Overview
J-Forge V2 is a Next.js 16 (App Router + Turbopack) modular monolith combining deterministic Python-to-Java static analysis, Google Gemini 2.5 Flash synthesis (`@google/genai`), real Java/Python isolated sandbox execution via Wandbox (`CPython 3.13` and `OpenJDK 21`), bounded compiler self-healing, and Postgres/local persistence.

## Modular Layers

```
app/                         # Presentation & Next.js Route Handlers
├── page.jsx                 # Workspace state, guest quota tracking, multi-view shell
├── login/page.jsx           # Email/password, Google OAuth, forgot/reset password views
├── ast-diff/page.jsx        # Dedicated cross-language AST diff & alignment view
├── robots.js & sitemap.js   # SEO discovery metadata
├── components/
│   ├── TranspilerStudio.jsx # Dual-pane Python/Java studio + Semantic Verification table
│   ├── ShowcaseViews.jsx    # Landing Hero, Overview Dashboard, Verification Studio, Learning Studio
│   ├── WorkspaceViews.jsx   # Files + Multi-File Maven Migrator, History, Analysis, Tests, Settings
│   ├── Navigation.jsx       # Categorized sidebar (Workspace / Intelligence / Developer)
│   ├── LanguageLogos.jsx    # Vector Python & Java emblems
│   └── BrandMark.jsx        # Forge Anvil V2 identity
└── api/
    ├── auth/*               # Register, Login, Logout, Google OAuth + PKCE, Session, Forgot Password
    ├── history/route.js     # Neon Postgres conversion history sync
    └── v1/*                 # REST & AI Platform (15 documented routes)

lib/                         # Core Engines & Security Primitives
├── gemini.js                # Gemini 2.5 Flash transpiler + deterministicAstFallback
├── ast-parser.js            # Tree-sitter Python/Java parser with lexical fallback
├── ast-aligner.js           # Cross-language semantic alignment pairs
├── type-mapping.js          # 25+ Python -> Java type & memory rules
├── compatibility.js         # Construct classifier, dependency mapper, quality heuristics, Passport
├── self-healing.js          # Static Java AST syntax validator & heuristic repair
├── compiler-repair.js       # Bounded javac error parser & repair loop (max 3 iterations)
├── python-sandbox.js        # CPython 3.13 isolated execution client
├── java-sandbox.js          # OpenJDK 21 compilation & execution client
├── verification.js          # Dual-sandbox stdout normalization & behavioral parity comparator
├── junit-generator.js       # Parameterized JUnit 5 suite generator
├── zip-export.js            # Store-method CRC-32 ZIP & Maven pom.xml builder
├── intelligence.js          # Code Review, Optimizer, Debugger, Javadoc, Assistant Q&A
├── explain.js               # Static Big-O heuristics & control-flow summary
├── metrics.js               # Prometheus OpenMetrics telemetry collector
├── cache.js                 # Canonical SHA-256 AST translation cache
├── webhook.js               # HMAC-SHA256 webhook signer & pinned-DNS dispatcher
├── security.js              # Java version allowlist, SSRF IPv4/IPv6 CIDR guard, IP extractor
├── auth.js & session.js     # Timing-safe API key check, HMAC session cookies, PKCE state
├── db.js                    # Neon Postgres parameterized SQL queries
└── rate-limit.js            # Bounded per-IP/per-key sliding-window rate limiter
```

## 6-Stage Verification Pipeline
1. **Python AST & Compatibility**: Parse structure (`parsePython`), classify supported/adaptation/unsupported constructs (`analyzePythonCompatibility`), and map Python imports (`detectPythonDependencies`).
2. **Conversion Engine**: Canonical SHA-256 AST cache check (`lib/cache.js`) -> Gemini 2.5 Flash synthesis with Spring import guard -> deterministic fallback engine (`deterministicAstFallback`).
3. **Static Java AST Validation & Heuristic Repair**: Delimiter balancing, package/class checks, missing collection/Spring import repair (`lib/self-healing.js`).
4. **Isolated Compilation & Execution**: Remote compilation & execution on OpenJDK 21 (`lib/java-sandbox.js`) alongside CPython 3.13 (`lib/python-sandbox.js`).
5. **Semantic Behavioral Verification**: Normalizes line endings/output streams across stdin boundary cases (`lib/verification.js`).
6. **Bounded Self-Healing Compiler Loop**: Parses `javac` diagnostics (`lib/compiler-repair.js`), applies deterministic patches (such as removing unused `org.springframework.*` imports), and retries up to 3 iterations.
