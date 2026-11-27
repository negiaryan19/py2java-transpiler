# Python-to-Java Conversion Support Matrix

J-Forge V2 classifies Python constructs transparently (`lib/compatibility.js` + `lib/gemini.js`) and never silently presents unsupported semantics as verified.

## Support Classification

| Category | Construct | Status | Deterministic / AI Translation |
|---|---|---|---|
| **Arithmetic** | `//` floor division, `%` modulo | **Fully Supported** | Maps to `Math.floorDiv(a, b)` & Java `%`; note negative operand behavior differs unless using `Math.floorMod`. |
| **Control Flow** | `if` / `elif` / `else`, `while`, `for range(start, stop, step)`, negative step | **Fully Supported** | Maps to `if / else if / else`, `while`, and directional `for` loops (`<` or `>`). |
| **Functions** | `def`, recursion, type hints, default parameter stripping | **Fully Supported** | Static methods on `Solution` (or instance methods inside classes). |
| **Strings** | Concatenation, f-strings `f"{var}"`, `None` checks (`is None` / `is not None`) | **Fully Supported** | String concatenation & `== null` / `!= null` checks. |
| **Collections** | `list`, `list.append`, `dict` / `.get(k, d)`, `set()`, tuples, simple comprehensions | **Fully Supported** | `ArrayList`, `HashMap.getOrDefault`, `HashSet`, `List.of`, Java Streams `.filter().map().toList()`. |
| **OOP** | `class Foo(Base)`, `def __init__`, methods, `@dataclass` annotations | **Supported / Adapted** | Nested `public static class` with Java constructors (`this.*` mapping). |
| **Exceptions** | `try` / `except` / `finally`, `raise ValueError/RuntimeError/...` | **Fully Supported** | Maps Python exceptions to `IllegalArgumentException`, `NoSuchElementException`, `RuntimeException`. |
| **Context Managers** | `with open(...) as f:` | **Requires Adaptation** | Wrapped in structured `try { // Context manager ... }`; real sandbox FS is ephemeral. |
| **Lambdas** | `fn = lambda x: ...` | **Supported (Single-arg)** | Mapped to `UnaryOperator<Object>` with `java.util.function.*` import. |
| **Generators / Async** | `yield`, `async def`, `await` | **Requires Adaptation** | Flagged in compatibility report; manual adaptation to `Stream`/`CompletableFuture` advised. |
| **Dynamic Code Exec** | `eval()`, `exec()`, metaprogramming | **Unsupported** | Explicitly classified as `Unsupported` by `analyzePythonCompatibility`; blocked/flagged for manual rewrite. |
| **Web Frameworks** | FastAPI / Flask routes, Pydantic `BaseModel` | **AI-Assisted (Compilation Note)** | Gemini converts routes to Spring Boot annotations **only** when Flask/FastAPI syntax is detected; remote Wandbox OpenJDK 21 compiles standard JDK without Spring/Maven JARs on classpath. |

## Supported Compiler Targets
- **Allowed & Advertised**: `Java 11`, `Java 17 LTS`, `Java 21 LTS` (enforced by `ALLOWED_JAVA_VERSIONS` in `lib/security.js`).
- **Live Verification Sandbox**: `OpenJDK 21` vs `CPython 3.13` via Wandbox.
