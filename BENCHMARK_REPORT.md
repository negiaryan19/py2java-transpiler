# J-Forge V2 Benchmark Report

*Honest reporting note: Static AST benchmarks check syntax/structural validity offline; live sandbox numbers reflect actual CPython 3.13 + OpenJDK 21 executions via Wandbox (`verifyConversionBehavior`).*

## 1. 100-Case Static AST Conversion Benchmark (`tests/benchmark-100.test.mjs`)
- **Dataset**: 100 representative Python programs across 15 categories (Basic Syntax, Arithmetic, Conditionals, Loops, Strings, Collections, Dictionaries, Functions, OOP/Dataclasses, Exceptions, I/O & Resources, DSA, Edge Cases, Lambdas/Unsupported Flagging, FastAPI/Flask/Pydantic).
- **Engine Tested**: Deterministic AST Engine (`deterministicAstFallback` targeting `Java 21 LTS`).
- **Measured Static Results**:
  - **Valid Java AST Syntax (`analyzeJavaSyntax().isValid`)**: **100 / 100** (100%)
  - **Balanced Delimiters (`braceDelta == 0`)**: **100 / 100**
  - **Leaked Un-transpiled Python Constructs**: **0**

## 2. 20-Case Live Compiler & Behavioral Parity Benchmark (`CPython 3.13` vs `OpenJDK 21`)
Executed against live Wandbox sandboxes after final deterministic AST hardening (`negative indexing`, `true division`, `negative modulo`, `BigInteger` literals, dict literals/`put()`, typed function signatures, nested class constructors, lambdas):

| # | Category | Engine | Compiler (`javac`) | Py Exit | Java Exit | Behavioral Result | RTT | Known Limitations / Notes |
|---:|---|---|---|---|---|---|---:|---|
| 1 | Arithmetic | deterministic-ast-engine | compiled | 0 | 0 | `behavioral_match` (`23\n11`) | 3,487 ms | None |
| 2 | True division (`7 / 2`) | deterministic-ast-engine | compiled | 0 | 0 | `behavioral_match` (`3.5`) | 7,164 ms | Static review flagged float coercion |
| 3 | Negative floor div (`-7 // 2`, `-7 % 2`) | deterministic-ast-engine | compiled | 0 | 0 | `behavioral_match` (`-4\n1`) | 5,736 ms | Uses `Math.floorDiv` & `Math.floorMod` |
| 4 | Negative indexing (`arr[-1]`) | deterministic-ast-engine | compiled | 0 | 0 | `behavioral_match` (`30`) | 3,541 ms | Literal negative indices mapped via `.size()` |
| 5 | Strings (`f"hi {s}"`) | deterministic-ast-engine | compiled | 0 | 0 | `behavioral_match` (`hi jforge`) | 4,399 ms | None |
| 6 | Lists (`append`, `len`) | deterministic-ast-engine | compiled | 0 | 0 | `behavioral_match` (`4`) | 5,017 ms | None |
| 7 | Dictionaries (`{"a":1}`, `get`) | deterministic-ast-engine | compiled | 0 | 0 | `behavioral_match` (`2`) | 14,674 ms | Dict literal <= 10 pairs via `Map.of` |
| 8 | Sets (`set().add`) | deterministic-ast-engine | compiled | 0 | 0 | `behavioral_match` (`1`) | 4,445 ms | None |
| 9 | Functions (`def add(a: int, b: int) -> int`) | deterministic-ast-engine | compiled | 0 | 0 | `behavioral_match` (`7`) | 3,420 ms | Annotated primitive types aid javac |
| 10 | Recursion (`fact(5)`) | deterministic-ast-engine | compiled | 0 | 0 | `behavioral_match` (`120`) | 5,774 ms | None |
| 11 | Classes (`Box.__init__`) | deterministic-ast-engine | compiled | 0 | 0 | `behavioral_match` (`9`) | 5,922 ms | Auto-declares `this.*` fields & `new` |
| 12 | Inheritance (`Dog(Animal)`) | deterministic-ast-engine | compiled | 0 | 0 | `behavioral_match` (`woof`) | 4,721 ms | None |
| 13 | Exceptions (`try/except/finally`) | deterministic-ast-engine | compiled | 0 | 0 | `behavioral_match` (`div zero\ndone`) | 9,269 ms | Exception hierarchy broad catch |
| 14 | Large integers (`> Long.MAX_VALUE`) | deterministic-ast-engine | compiled | 0 | 0 | `behavioral_match` (`12345678901234567891`) | 3,868 ms | Mapped to `BigInteger` |
| 15 | Mutable list aliases | deterministic-ast-engine | compiled | 0 | 0 | `behavioral_match` (`3`) | 4,131 ms | Both Java vars alias same `ArrayList` |
| 16 | List comprehensions (`filter/map`) | deterministic-ast-engine | compiled | 0 | 0 | `behavioral_match` (`2`) | 4,336 ms | Simple single-clause comprehensions |
| 17 | Nested loops | gemini-2.5-flash | compiled | 0 | 0 | `behavioral_match` (`1\n2\n2\n4`) | 6,330 ms | Gemini active when within RPM quota |
| 18 | Multi-argument `print` | deterministic-ast-engine | compiled | 0 | 0 | `behavioral_match` (`val 42 ok`) | 4,377 ms | None |
| 19 | Lambda functions (`lambda x: x * 2`) | deterministic-ast-engine | compiled | 0 | 0 | `behavioral_match` (`12`) | 10,173 ms | Arithmetic single-arg via `IntUnaryOperator` |
| 20 | Unsupported (`eval("1 + 1")`) | deterministic-ast-engine | `compile_error` | 0 | 1 | `compilation_failed` | 2,762 ms | Flagged `has_unsupported` pre-conversion |

### Separate Summary Metrics (20 Live Cases)
- **Static AST Validation (separate 100-case suite)**: **100 / 100** (100%)
- **Live OpenJDK 21 Compilation Success (20 cases)**: **19 / 20** (95.0%; **19 / 19** supported constructs compiled; Case #20 `eval()` legitimately failed)
- **Live Behavioral Parity (`behavioral_match`)**: **19 / 20** (95.0%; **0** silent `behavioral_mismatch`; **0** `sandboxUnavailable` after 3.2s–4s request pacing)
- **Engines Used Across Run**: `deterministic-ast-engine` (19 cases when Gemini RPM limit hit), `gemini-2.5-flash` (1 case)
