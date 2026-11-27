# J-Forge V2 REST API Documentation

Machine-readable specification: `GET /api/v1/openapi.json` (OpenAPI `3.1.0`).

## Gateway Platform Endpoints (15 Routes)

| Method | Path | Auth | Rate Limit | Summary |
|---|---|---|---|---|
| `POST` | `/api/v1/convert` | `x-api-key` / Bearer | 60 req/min | Transpile Python -> Java, AST cache (`X-Cache`), self-healing headers, optional signed webhook |
| `POST` | `/api/v1/explain` | `x-api-key` / Bearer | Rate-limited | Static Big-O heuristics, memory model & control-flow diagnostics |
| `POST` | `/api/v1/ast-diff` | `x-api-key` / Bearer | Rate-limited | Cross-language tree-sitter Python & Java AST alignment pairs |
| `POST` | `/api/v1/analyze` | Public | 30 req/min | Construct compatibility, Python dependency mapping, quality audit & AST node summary |
| `POST` | `/api/v1/verify` | Public | 12 req/min | Executes CPython 3.13 + OpenJDK 21 via Wandbox and compares stdout parity |
| `POST` | `/api/v1/repair` | Public | 8 req/min | Bounded `javac` diagnostic repair loop (max 3 iterations) |
| `POST` | `/api/v1/run-python` | Public | 15 req/min | Isolated CPython 3.13 execution sandbox |
| `POST` | `/api/v1/run-java` | Public | 15 req/min | Isolated OpenJDK 21 compile & execution sandbox |
| `POST` | `/api/v1/intelligence` | Public | 20 req/min | Code Review, Optimizer, Debugger, Javadoc generator, Assistant Q&A |
| `POST` | `/api/v1/projects/migrate` | Public | 10 req/min | Multi-file migration (1–15 files) returning import graph, entrypoints, `pom.xml` & `.java` sources |
| `POST` | `/api/v1/import-github` | Public | Rate-limited | Fetches public GitHub Python files into workspace |
| `POST` | `/api/v1/webhook-verify` | Public | — | Constant-time HMAC-SHA256 signature verification |
| `POST` | `/api/v1/webhook-demo` | Public | — | Local webhook evaluation receiver |
| `GET` | `/api/v1/health` | Public | — | Health check, engine status, security audit & route catalog |
| `GET` | `/api/v1/metrics` | Public | — | Prometheus OpenMetrics (`text/plain`) telemetry |

*(Plus `GET /api/v1/openapi.json` returning the full schema JSON.)*

## Examples

### 1. Analyze Compatibility & Dependencies (`POST /api/v1/analyze`)
```bash
curl -s -X POST http://localhost:3000/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{"python_code":"import math\ndef area(r):\n    return math.pi * r * r\nprint(area(2))"}'
```

### 2. Multi-File Maven Migration (`POST /api/v1/projects/migrate`)
```bash
curl -s -X POST http://localhost:3000/api/v1/projects/migrate \
  -H "Content-Type: application/json" \
  -d '{"java_version":"21","files":[{"path":"main.py","content":"import utils\nprint(utils.add(2,3))"},{"path":"utils.py","content":"def add(a,b):\n return a+b"}]}'
```

### 3. Semantic Verification (`POST /api/v1/verify`)
```bash
curl -s -X POST http://localhost:3000/api/v1/verify \
  -H "Content-Type: application/json" \
  -d '{"python_code":"print(7 // 2)","java_code":"package com.jforge.ciap;\npublic class Solution { public static void main(String[] a){ System.out.println(Math.floorDiv(7, 2)); } }"}'
```
