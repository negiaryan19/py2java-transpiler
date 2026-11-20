/**
 * J-Forge Cross-Language Type Mapping Dictionary
 *
 * Comprehensive semantic mappings from Python 3.11 type constructs, FastAPI decorators,
 * and Pydantic schemas into Java 17 LTS / Spring Boot 3 equivalents.
 *
 * Each entry provides detailed explanations across:
 * - reason: Type system mapping rationale
 * - memory: Python CPython reference counting vs JVM Garbage Collection
 * - safety: Null safety, strict compile-time invariants, and runtime guarantees
 */

/**
 * @typedef {Object} TypeExplanation
 * @property {string} java - The target Java 17 / Spring Boot representation
 * @property {string} reason - Type system semantic mapping explanation
 * @property {string} memory - CPython vs JVM memory model conversion explanation
 * @property {string} safety - Compile-time and runtime safety guarantees
 */

/** @type {Record<string, TypeExplanation>} */
export const TYPE_MAP = {
  // ── 1. Generic Collections & Containers ────────────────────────────
  'dict[str, Any]': {
    java: 'Map<String, Object>',
    reason: 'Python dynamic heterogeneous dictionary mapped to Java Map with string keys and root Object polymorphism.',
    memory: 'Python PyDictObject with hash table resizing converted to JVM compressed OOP table with open addressing bucket nodes on heap.',
    safety: 'Java requires explicit downcasting or Pattern Matching (instanceof) when accessing values, eliminating unchecked dynamic runtime attribute errors.',
  },
  'dict[str, str]': {
    java: 'Map<String, String>',
    reason: 'Homogeneous key-value pairs map directly to java.util.Map with invariant string generic parameters.',
    memory: 'CPython PyUnicode reference wrappers mapped to JVM Compact Strings (byte array with Latin-1/UTF-16 encoding flags) inside heap map nodes.',
    safety: 'Complete compile-time type invariance guarantees no non-string values can be inserted into the map collection.',
  },
  'List[str]': {
    java: 'List<String>',
    reason: 'Python variable-length mutable array mapped to java.util.List interface backed by ArrayList.',
    memory: 'CPython continuous pointer array of PyObject* mapped to JVM contiguous Object[] references with automatic GC generational promotion (Eden to Tenured).',
    safety: 'Strong static generic parameter checking prevents heterogeneous element contamination at compilation time.',
  },
  'List[int]': {
    java: 'List<Integer>',
    reason: 'Python arbitrary-precision integer list mapped to Java generic collection utilizing Integer boxed wrapper type.',
    memory: 'CPython PyLongObject with variable-length ob_digit limbs converted to JVM java.lang.Integer heap objects (with -128..127 JVM IntegerCache optimization).',
    safety: 'Boxed primitives guarantee immutable numeric instances and prevent non-integral insertions.',
  },
  'tuple[int, str]': {
    java: 'Map.Entry<Integer, String>',
    reason: 'Python fixed-size heterogeneous tuple mapped to Java Map.Entry pair construct or immutable record component.',
    memory: 'CPython contiguous PyTupleObject with pre-allocated PyGC_Head mapped to a two-pointer JVM heap object on young generation.',
    safety: 'Guarantees fixed positional arity and immutable key-value typing across thread boundaries.',
  },
  'Set[str]': {
    java: 'Set<String>',
    reason: 'Python hash-based unique collection mapped to java.util.Set interface (typically HashSet or LinkedHashSet).',
    memory: 'CPython dummy-key hash table mapped to JVM HashMap backed entry table with 0.75 load factor thresholding.',
    safety: 'Guarantees mathematical set uniqueness invariants enforced deterministically by String.hashCode() and equals().',
  },

  // ── 2. Nullability & Optional Types ────────────────────────────────
  'Optional[str]': {
    java: 'String',
    reason: 'Python Union[str, None] mapped to nullable Java String reference or java.util.Optional<String>.',
    memory: 'CPython Py_None singleton pointer checks mapped to native JVM 0x0 null pointer addressable references in 64-bit oops.',
    safety: 'Requires null-check guards or Objects.requireNonNull() / Optional.ofNullable() to eliminate NullPointerExceptions.',
  },
  'Optional[int]': {
    java: 'Integer',
    reason: 'Python nullable integer mapped to boxed Integer reference allowing null representation unlike unboxed primitive int.',
    memory: 'Avoids primitive default initialization (0) by utilizing a heap-allocated Integer reference with null capability.',
    safety: 'Distinguishes between missing value (null) and zero-value (0), preventing uninitialized numerical state corruption.',
  },

  // ── 3. Primitive & Scalar Types ────────────────────────────────────
  'str': {
    java: 'String',
    reason: 'Python unicode text sequence mapped to immutable java.lang.String class.',
    memory: 'CPython PyASCIIObject/PyCompactUnicodeObject mapped to JVM Compact Strings with string deduplication in G1 GC.',
    safety: 'Immutable by design; thread-safe across concurrent reader threads without external synchronization locks.',
  },
  'int': {
    java: 'int',
    reason: 'Python integer mapped to Java 32-bit two\'s complement signed primitive int (or long when exceeding 2^31-1).',
    memory: 'CPython heap PyLongObject with arbitrary precision mapped to 4 bytes on JVM call stack frame or L1 CPU registers.',
    safety: 'Zero pointer indirection overhead; subject to overflow wrap-around requiring Math.addExact for mission-critical math.',
  },
  'float': {
    java: 'double',
    reason: 'Python float (internally C double) mapped to IEEE 754 64-bit double-precision floating point primitive.',
    memory: 'CPython 24-byte PyFloatObject converted to 8-byte primitive stored directly on JVM thread operand stack.',
    safety: 'Strict IEEE 754 arithmetic compliance with NaN and Infinity semantic checking.',
  },
  'bool': {
    java: 'boolean',
    reason: 'Python boolean subtype of int mapped to 1-bit logical primitive boolean in Java.',
    memory: 'CPython Py_True / Py_False singletons mapped to JVM byte representation (1 or 0) in bytecode instructions (iconst_1/iconst_0).',
    safety: 'Strict boolean truth domain; Java rejects truthy/falsy integer implicit casting at compile time.',
  },
  'None': {
    java: 'void',
    reason: 'Python absence of return value (None) mapped to Java return type specifier void for methods.',
    memory: 'CPython Py_None pointer return mapped to JVM return instruction without pushing operand onto method stack.',
    safety: 'Guarantees method call is strictly invoked for side-effects and prevents callers from consuming non-existent values.',
  },
  'Any': {
    java: 'Object',
    reason: 'Python dynamic universal type mapped to java.lang.Object root class in JVM hierarchy.',
    memory: 'Points to any arbitrary JVM heap object conforming to 12-byte Mark/Klass word object header layout.',
    safety: 'Requires runtime type interrogation or pattern-matching instanceof before method invocation.',
  },
  'bytes': {
    java: 'byte[]',
    reason: 'Python immutable raw binary byte sequence mapped to Java primitive byte array.',
    memory: 'CPython contiguous PyBytesObject payload mapped to JVM byte array with flat byte alignment on heap.',
    safety: 'Directly compatible with Java NIO ByteBuffer, cryptographic digests, and TCP stream read buffers.',
  },

  // ── 4. FastAPI & Spring Boot Web Annotations ────────────────────────
  '@app.get': {
    java: '@GetMapping',
    reason: 'FastAPI HTTP GET routing decorator mapped to Spring Boot 3 @GetMapping composite annotation.',
    memory: 'FastAPI starlette route registration handler mapped to Spring HandlerMethod reflection metadata in ApplicationContext heap.',
    safety: 'Spring MVC dispatching verifies HTTP idempotency and method constraints before controller invocation.',
  },
  '@app.post': {
    java: '@PostMapping',
    reason: 'FastAPI HTTP POST request decorator mapped to Spring MVC @PostMapping handler annotation.',
    memory: 'Constructs Spring RequestMappingInfo node in memory with Content-Type header matching algorithms.',
    safety: 'Enforces HTTP POST body parsing and auto-deserialization with Jackson ObjectMapper validator.',
  },
  '@app.put': {
    java: '@PutMapping',
    reason: 'FastAPI HTTP PUT mutation decorator mapped to Spring Boot @PutMapping annotation.',
    memory: 'Registers idempotent resource replacement handler in Spring RequestMappingHandlerMapping table.',
    safety: 'Strict resource update semantics with HTTP 200/204 contract verification.',
  },
  '@app.delete': {
    java: '@DeleteMapping',
    reason: 'FastAPI HTTP DELETE handler mapped to Spring Boot @DeleteMapping annotation.',
    memory: 'Dispatches via Spring DispatcherServlet route lookup with minimal heap allocation.',
    safety: 'Standardized deletion semantics preventing accidental request payload deserialization.',
  },

  // ── 5. Enterprise Framework & Domain Modeling ──────────────────────
  'BaseModel': {
    java: 'record',
    reason: 'Pydantic data validation model mapped to immutable Java 17 LTS record with compact constructor.',
    memory: 'CPython dynamic __dict__ object mapped to JVM final fields with shallow layout and JIT scalar replacement optimization.',
    safety: 'Auto-generates transparent getters, equals(), hashCode(), and immutable state invariants.',
  },
  'async def': {
    java: 'CompletableFuture<T>',
    reason: 'Python asyncio coroutine mapped to Java asynchronous CompletableFuture or Virtual Thread task.',
    memory: 'Python asyncio Task/generator frame mapped to JVM ForkJoinPool worker thread queue with lightweight work-stealing.',
    safety: 'Strongly typed non-blocking pipeline handling with exception completion stages and timeouts.',
  },
  'HTTPException': {
    java: 'ResponseStatusException',
    reason: 'FastAPI HTTP status error mapped to Spring Web ResponseStatusException with explicit HttpStatus enum.',
    memory: 'Allocates standard JVM Throwable stack trace array on young generation heap.',
    safety: 'Prevents internal server exception leaks by sanitizing error message into standardized RFC 7807 Problem Detail.',
  },
  'Depends': {
    java: '@Autowired',
    reason: 'FastAPI dependency injection provider mapped to Spring Core @Autowired or constructor injection.',
    memory: 'FastAPI dependency graph execution mapped to Spring IoC Singleton Bean registry cache in JVM metaspace/heap.',
    safety: 'Guarantees compile-time and boot-time inversion of control lifecycle resolution without runtime lookup errors.',
  },
  'Query(...)': {
    java: '@RequestParam',
    reason: 'FastAPI query parameter extractor mapped to Spring MVC @RequestParam annotation.',
    memory: 'Parsed from URI query string buffer directly into method invocation stack arguments.',
    safety: 'Supports required flags, default values, and automatic primitive parsing with type conversion errors.',
  },
  'Path(...)': {
    java: '@PathVariable',
    reason: 'FastAPI URI path template parameter mapped to Spring Boot @PathVariable annotation.',
    memory: 'Extracted from URI template match segments during Spring routing resolution.',
    safety: 'Guarantees URI path segment exists and conforms to typed parameter requirements before executing method body.',
  },

  // ── 6. Additional Standard Mappings ────────────────────────────────
  'list': {
    java: 'List<Object>',
    reason: 'Untyped Python list mapped to generic Java List containing raw Object references.',
    memory: 'Array of PyObject pointers converted to JVM ArrayList holding Object pointers.',
    safety: 'Requires runtime downcasts; typed List<T> preferred for strict type safety.',
  },
  'dict': {
    java: 'Map<String, Object>',
    reason: 'Untyped Python dictionary mapped to Java Map with string keys and Object values.',
    memory: 'PyDict hash buckets mapped to JVM HashMap table with open addressing.',
    safety: 'Guarantees string key hashing while retaining polymorphous value storage.',
  },
  'set': {
    java: 'Set<Object>',
    reason: 'Untyped Python set mapped to java.util.Set containing Object elements.',
    memory: 'Hash table bucket map representation on JVM heap.',
    safety: 'Enforces element uniqueness via Object.hashCode() and Object.equals().',
  },
  'tuple': {
    java: 'Object[]',
    reason: 'Untyped Python tuple mapped to fixed-size Java array of Objects.',
    memory: 'Fixed-length contiguous array of references on JVM heap.',
    safety: 'Array bounds checked at runtime by JVM opcode iaload/aastore.',
  },
};

/**
 * Normalizes Python type text by removing internal spaces (e.g. "dict[str,  Any]" -> "dict[str, Any]")
 * @param {string} text - Raw Python type string
 * @returns {string} Normalized type string
 */
export function normalizePythonType(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .trim()
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*\[\s*/g, '[')
    .replace(/\s*\]\s*/g, ']');
}

/**
 * Look up a semantic explanation for a Python construct.
 * Supports exact match and prefix/parameterized matching.
 * @param {string} pythonText - The text of the Python AST node
 * @returns {TypeExplanation|null}
 */
export function lookupTypeMapping(pythonText) {
  if (!pythonText || typeof pythonText !== 'string') return null;

  const normalized = normalizePythonType(pythonText);
  if (TYPE_MAP[normalized]) {
    return TYPE_MAP[normalized];
  }

  // Check prefix matches for decorators (e.g. '@app.get("/users")' -> '@app.get')
  for (const key of Object.keys(TYPE_MAP)) {
    if (key.startsWith('@') && normalized.startsWith(key)) {
      return TYPE_MAP[key];
    }
  }

  // Check parameterized calls (e.g. 'Query(None)' -> 'Query(...)')
  if (/^Query\s*\(/.test(normalized)) {
    return TYPE_MAP['Query(...)'];
  }
  if (/^Path\s*\(/.test(normalized)) {
    return TYPE_MAP['Path(...)'];
  }

  // Check class inheritance for BaseModel
  if (normalized.includes('BaseModel')) {
    return TYPE_MAP['BaseModel'];
  }

  // Check async function definition
  if (normalized.startsWith('async def') || normalized.includes('async def')) {
    return TYPE_MAP['async def'];
  }

  // Check exception and dependency injection helpers
  if (normalized.includes('HTTPException')) {
    return TYPE_MAP['HTTPException'];
  }
  if (normalized.includes('Depends')) {
    return TYPE_MAP['Depends'];
  }

  return null;
}
