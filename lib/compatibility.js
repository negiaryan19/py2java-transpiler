/**
 * Deterministic Python Pre-Conversion Compatibility Scanner, Dependency Intelligence,
 * Code Quality Inspector, and Conversion Passport Exporter.
 * Never fabricates accuracy percentages or unverified Maven coordinates.
 */

const PYTHON_JAVA_DEPENDENCY_CATALOG = {
  requests: {
    pythonPkg: 'requests',
    javaEquivalent: 'java.net.http.HttpClient (JDK 11+ Standard Library)',
    requiredImports: ['import java.net.URI;', 'import java.net.http.HttpClient;', 'import java.net.http.HttpRequest;', 'import java.net.http.HttpResponse;'],
    classification: 'Supported (Standard Library)',
    compatibilityNote: 'Blocking requests.get/post calls map cleanly to HttpClient.send(request, BodyHandlers.ofString()).',
    manualMigration: 'JSON parsing helpers (response.json()) require a JSON library such as Jackson ObjectMapper or explicit parsing.',
    mavenSnippet: null,
  },
  pytest: {
    pythonPkg: 'pytest',
    javaEquivalent: 'JUnit 5 (org.junit.jupiter)',
    requiredImports: ['import org.junit.jupiter.api.Test;', 'import static org.junit.jupiter.api.Assertions.*;'],
    classification: 'Requires adaptation',
    compatibilityNote: 'Test functions and assert statements map to @Test methods and JUnit Assertions.',
    manualMigration: 'Pytest fixtures (@pytest.fixture) and parametrize decorators should be rewritten to @BeforeEach / @ParameterizedTest.',
    mavenSnippet: `<dependency>\n  <groupId>org.junit.jupiter</groupId>\n  <artifactId>junit-jupiter</artifactId>\n  <version>5.10.2</version>\n  <scope>test</scope>\n</dependency>`,
  },
  dataclasses: {
    pythonPkg: 'dataclasses',
    javaEquivalent: 'Java Records (JDK 16+) / Typed POJO',
    requiredImports: ['import java.util.Objects;'],
    classification: 'Supported (JDK 16+)',
    compatibilityNote: '@dataclass classes map naturally to immutable Java record types or getter/setter classes.',
    manualMigration: 'Mutable dataclass fields (frozen=False) require a standard class instead of a Java record.',
    mavenSnippet: null,
  },
  logging: {
    pythonPkg: 'logging',
    javaEquivalent: 'java.util.logging.Logger (JDK) or SLF4J API',
    requiredImports: ['import java.util.logging.Logger;'],
    classification: 'Supported',
    compatibilityNote: 'Standard logging calls map to java.util.logging with zero external dependencies, or SLF4J in Spring/Maven apps.',
    manualMigration: 'Review log formatting placeholders (%s vs {}) if migrating to SLF4J.',
    mavenSnippet: `<dependency>\n  <groupId>org.slf4j</groupId>\n  <artifactId>slf4j-api</artifactId>\n  <version>2.0.12</version>\n</dependency>`,
  },
  fastapi: {
    pythonPkg: 'fastapi',
    javaEquivalent: 'Spring Boot Web (@RestController)',
    requiredImports: ['import org.springframework.web.bind.annotation.*;', 'import org.springframework.http.ResponseEntity;'],
    classification: 'Requires adaptation',
    compatibilityNote: 'Route decorators (@app.get, @app.post) convert structurally to @RestController controller methods.',
    manualMigration: 'Requires a Spring Boot Web runtime container, dependency injection wiring, and application.properties configuration (cannot run standalone in javac).',
    mavenSnippet: null,
  },
  flask: {
    pythonPkg: 'flask',
    javaEquivalent: 'Spring Boot Web (@RestController)',
    requiredImports: ['import org.springframework.web.bind.annotation.*;'],
    classification: 'Requires adaptation',
    compatibilityNote: 'Flask route handlers translate to Spring Web handler signatures.',
    manualMigration: 'Jinja templates, Flask request globals, and WSGI middleware require full Spring MVC setup.',
    mavenSnippet: null,
  },
  pydantic: {
    pythonPkg: 'pydantic',
    javaEquivalent: 'Java Records + Jakarta Bean Validation',
    requiredImports: ['import java.util.Objects;'],
    classification: 'Requires adaptation',
    compatibilityNote: 'BaseModel schemas convert to Java records or POJOs with constructor validation.',
    manualMigration: 'Custom @field_validator / @model_validator hooks should be checked manually against Jakarta Validation constraints.',
    mavenSnippet: null,
  },
  numpy: {
    pythonPkg: 'numpy',
    javaEquivalent: 'Java arrays / Apache Commons Math / ND4J (Manual Library Setup)',
    requiredImports: ['import java.util.Arrays;'],
    classification: 'Requires adaptation',
    compatibilityNote: 'Simple 1D/2D arrays convert to double[] / double[][]. Vectorized broadcasting has no built-in Java stdlib equivalent.',
    manualMigration: 'Linear algebra, slicing with strides, and broadcasting must be rewritten with explicit loops or an added JVM numerical dependency.',
    mavenSnippet: null,
  },
  json: {
    pythonPkg: 'json',
    javaEquivalent: 'Jackson ObjectMapper (external) or explicit serialization',
    requiredImports: [],
    classification: 'Requires adaptation',
    compatibilityNote: 'Java JDK has no built-in general-purpose JSON parser without an external library like Jackson.',
    manualMigration: 'Add Jackson Databind or parse structured strings explicitly for standalone javac execution.',
    mavenSnippet: null,
  },
  math: {
    pythonPkg: 'math',
    javaEquivalent: 'java.lang.Math (Built-in)',
    requiredImports: [],
    classification: 'Supported',
    compatibilityNote: 'math.sqrt, floor, ceil, pow, abs map directly to java.lang.Math methods.',
    manualMigration: null,
    mavenSnippet: null,
  },
  re: {
    pythonPkg: 're',
    javaEquivalent: 'java.util.regex.Pattern & Matcher',
    requiredImports: ['import java.util.regex.*;'],
    classification: 'Supported',
    compatibilityNote: 'Regex searches and matches translate to Pattern.compile() and Matcher.',
    manualMigration: 'Verify Python named groups or inline flags against Java regex syntax.',
    mavenSnippet: null,
  },
  datetime: {
    pythonPkg: 'datetime',
    javaEquivalent: 'java.time (LocalDate, LocalDateTime, Duration)',
    requiredImports: ['import java.time.*;'],
    classification: 'Supported',
    compatibilityNote: 'Maps cleanly to JDK immutable java.time APIs.',
    manualMigration: 'Check strftime/strptime format patterns against DateTimeFormatter.',
    mavenSnippet: null,
  },
};

export function detectPythonDependencies(pythonCode = '') {
  const src = typeof pythonCode === 'string' ? pythonCode : '';
  const imports = [];
  const seen = new Set();
  const lines = src.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const mImport = trimmed.match(/^import\s+([a-zA-Z_][\w.]*)/);
    const mFrom = trimmed.match(/^from\s+([a-zA-Z_][\w.]*)\s+import\s+/);
    const mod = (mImport?.[1] || mFrom?.[1] || '').split('.')[0];
    if (!mod || seen.has(mod)) continue;
    seen.add(mod);

    const known = PYTHON_JAVA_DEPENDENCY_CATALOG[mod];
    if (known) {
      imports.push({ ...known, line: i + 1 });
    } else {
      imports.push({
        pythonPkg: mod,
        javaEquivalent: 'No verified deterministic mapping in J-Forge catalog',
        requiredImports: [],
        classification: 'Unknown',
        compatibilityNote: `Python module '${mod}' is outside the deterministic dependency catalog.`,
        manualMigration: 'Verify Java library equivalence and Maven coordinates manually before compiling standalone.',
        mavenSnippet: null,
        line: i + 1,
      });
    }
  }
  return imports;
}

export function analyzePythonCompatibility(pythonCode = '') {
  const src = typeof pythonCode === 'string' ? pythonCode : '';
  if (!src.trim()) {
    return {
      status: 'empty',
      summary: 'No Python source provided yet.',
      metrics: { lines: 0, functions: 0, classes: 0, imports: 0, loops: 0 },
      findings: [],
      dependencies: [],
    };
  }

  const lines = src.split('\n');
  const findings = [];
  const dependencies = detectPythonDependencies(src);

  const fnMatches = src.match(/^\s*def\s+\w+/gm) || [];
  const classMatches = src.match(/^\s*class\s+\w+/gm) || [];
  const loopMatches = src.match(/^\s*(for|while)\b/gm) || [];
  const hasTypeHints = /def\s+\w+\([^)]*:\s*\w+|->\s*\w+/.test(src);

  // Basic Python syntax sanity check (unclosed parens/quotes/colons heuristic)
  let parenDelta = 0;
  let bracketDelta = 0;
  for (const ch of src) {
    if (ch === '(') parenDelta++;
    if (ch === ')') parenDelta--;
    if (ch === '[') bracketDelta++;
    if (ch === ']') bracketDelta--;
  }
  if (parenDelta !== 0 || bracketDelta !== 0) {
    findings.push({
      id: 'syntax-delimiters',
      category: 'Syntax',
      severity: 'warning',
      classification: 'Requires adaptation',
      message: `Unbalanced parentheses/brackets detected (parens delta: ${parenDelta}, brackets delta: ${bracketDelta}).`,
    });
  }

  if (fnMatches.length > 0) {
    findings.push({
      id: 'functions',
      category: 'Functions',
      severity: 'info',
      classification: 'Supported',
      message: `${fnMatches.length} function definition(s) detected; ${hasTypeHints ? 'type hints present for stronger Java parameter typing.' : 'no explicit type hints — Java types will be inferred from context/Object.'}`,
    });
  }

  // Recursion check
  for (const fnLine of fnMatches) {
    const fnName = fnLine.trim().replace(/^def\s+/, '');
    if (new RegExp(`def\\s+${fnName}[\\s\\S]*?\\b${fnName}\\s*\\(`).test(src)) {
      findings.push({
        id: `recursion-${fnName}`,
        category: 'Recursion',
        severity: 'info',
        classification: 'Supported',
        message: `Recursive calls detected in '${fnName}()'. Verify base cases and watch stack depth for deep inputs.`,
      });
      break;
    }
  }

  if (classMatches.length > 0) {
    findings.push({
      id: 'classes',
      category: 'OOP',
      severity: 'info',
      classification: 'Supported',
      message: `${classMatches.length} class definition(s) map cleanly to static nested or standalone Java classes.`,
    });
  }

  if (/(^|\s)\/\s*\S|\/\/|(?<![a-zA-Z0-9_])-[0-9]+\s*\]/.test(src)) {
    findings.push({
      id: 'numeric-indexing-semantics',
      category: 'Semantics',
      severity: 'warning',
      classification: 'Potential semantic mismatch',
      message: 'Division (/ vs //) or negative indexing detected — J-Forge preserves Python floor division (Math.floorDiv) and float division where analyzed.',
    });
  }

  if (/\basync\s+def\b|\bawait\b/.test(src)) {
    findings.push({
      id: 'async-await',
      category: 'Concurrency',
      severity: 'warning',
      classification: 'Unsupported',
      message: 'Python async/await coroutines do not directly compile in single-file javac without rewriting to CompletableFuture or threads.',
    });
  }

  if (/\byield\b/.test(src)) {
    findings.push({
      id: 'generators',
      category: 'Generators',
      severity: 'warning',
      classification: 'Requires adaptation',
      message: 'Generator functions using yield require eager List collection or Iterator/Stream adaptation in Java.',
    });
  }

  if (/^\s*@\w+/m.test(src) && !/@dataclass|@app\./.test(src)) {
    findings.push({
      id: 'decorators',
      category: 'Metaprogramming',
      severity: 'warning',
      classification: 'Requires adaptation',
      message: 'Custom Python decorators (@decorator) require manual Java method wrapper or annotation adaptation.',
    });
  }

  if (/\bexec\s*\(|\beval\s*\(|\b__import__\s*\(/.test(src)) {
    findings.push({
      id: 'dynamic-eval',
      category: 'Dynamic Execution',
      severity: 'error',
      classification: 'Unsupported',
      message: 'Dynamic runtime evaluation (eval/exec/__import__) cannot be statically compiled to Java.',
    });
  }

  if (findings.length === 0) {
    findings.push({
      id: 'baseline-supported',
      category: 'Core Python',
      severity: 'info',
      classification: 'Supported',
      message: 'Core Python statements detected with no unsupported language constructs.',
    });
  }

  const unsupportedCount = findings.filter((f) => f.classification === 'Unsupported').length;
  const adaptationCount = findings.filter(
    (f) => f.classification === 'Requires adaptation' || f.classification === 'Potential semantic mismatch'
  ).length;

  return {
    status: unsupportedCount > 0 ? 'has_unsupported' : adaptationCount > 0 ? 'needs_review' : 'ready',
    summary:
      unsupportedCount > 0
        ? `${unsupportedCount} unsupported construct(s) detected; manual adaptation required.`
        : adaptationCount > 0
        ? `${adaptationCount} semantic/adaptation note(s) flagged for review.`
        : 'All detected constructs classify as supported.',
    metrics: {
      lines: lines.length,
      functions: fnMatches.length,
      classes: classMatches.length,
      imports: dependencies.length,
      loops: loopMatches.length,
    },
    findings,
    dependencies,
  };
}

export function analyzeCodeQuality({ pythonCode = '', javaCode = '' } = {}) {
  const pySrc = typeof pythonCode === 'string' ? pythonCode : '';
  const jSrc = typeof javaCode === 'string' ? javaCode : '';
  const items = [];

  if (!pySrc.trim() && !jSrc.trim()) {
    return { items: [], estimatedTimeComplexity: 'N/A', estimatedSpaceComplexity: 'N/A', basis: 'Deterministic static heuristic' };
  }

  // Nesting depth heuristic
  let maxDepth = 0;
  let curDepth = 0;
  for (const ch of jSrc) {
    if (ch === '{') {
      curDepth++;
      if (curDepth > maxDepth) maxDepth = curDepth;
    } else if (ch === '}') {
      curDepth = Math.max(0, curDepth - 1);
    }
  }
  if (maxDepth > 5) {
    items.push({
      kind: 'deterministic',
      category: 'Maintainability',
      severity: 'warning',
      message: `Deep block nesting detected in Java output (depth ${maxDepth}). Consider extracting helper methods.`,
    });
  }

  // Broad catch check
  if (/catch\s*\(\s*Exception\s+\w+\s*\)/.test(jSrc)) {
    items.push({
      kind: 'deterministic',
      category: 'Exception Handling',
      severity: 'info',
      message: 'Catches generic java.lang.Exception; narrow to specific exceptions (e.g., ArithmeticException, IllegalArgumentException) when known.',
    });
  }

  // Unused java.util imports check (rough check for explicit non-wildcard imports)
  const explicitImports = [...jSrc.matchAll(/^\s*import\s+[\w.]+\.([A-Z]\w+)\s*;/gm)];
  for (const imp of explicitImports) {
    const clsName = imp[1];
    const withoutImports = jSrc.replace(/^\s*import\s+.*;$/gm, '');
    if (!new RegExp(`\\b${clsName}\\b`).test(withoutImports)) {
      items.push({
        kind: 'deterministic',
        category: 'Unused Import',
        severity: 'warning',
        message: `Import '${clsName}' appears unused in generated Java code.`,
      });
    }
  }

  // Null safety check
  if (/\bnull\b/.test(jSrc) && !jSrc.includes('Objects.requireNonNull') && !jSrc.includes('!= null')) {
    items.push({
      kind: 'deterministic',
      category: 'Null Safety',
      severity: 'warning',
      message: 'Literal null references exist without explicit null guards; watch for NullPointerException.',
    });
  }

  // Resource closure check
  if (/new\s+Scanner\s*\(/.test(jSrc) && !/try\s*\(\s*Scanner/.test(jSrc) && !/\.close\s*\(\s*\)/.test(jSrc)) {
    items.push({
      kind: 'deterministic',
      category: 'Resource Management',
      severity: 'info',
      message: 'Scanner instantiated without try-with-resources; closing System.in intentionally stays omitted for short CLI runs.',
    });
  }

  // Long method check
  if (jSrc.split('\n').length > 60) {
    items.push({
      kind: 'deterministic',
      category: 'Readability',
      severity: 'info',
      message: `Java output spans ${jSrc.split('\n').length} lines; verify modularity and helper method decomposition.`,
    });
  }

  if (items.length === 0 && jSrc.trim()) {
    items.push({
      kind: 'deterministic',
      category: 'Baseline Clean',
      severity: 'info',
      message: 'Deterministic inspection found no unused explicit imports, deep nesting, or unguarded null issues.',
    });
  }

  // Estimated complexity heuristic cleanly labeled (never claimed as benchmark)
  const loopLines = pySrc.match(/^\s*(for|while)\b/gm) || [];
  let estTime = 'O(1)';
  if (loopLines.length >= 2 && / {4,}(for|while)\b/m.test(pySrc)) {
    estTime = 'O(n^2) [estimated static heuristic]';
  } else if (loopLines.length >= 1) {
    estTime = 'O(n) [estimated static heuristic]';
  }
  const estSpace = /\[.*\]|\{|\bdict\b|\bset\b|\blist\b|ArrayList|HashMap|HashSet/.test(pySrc + jSrc)
    ? 'O(n) [estimated static heuristic]'
    : 'O(1) [estimated static heuristic]';

  return {
    items,
    estimatedTimeComplexity: estTime,
    estimatedSpaceComplexity: estSpace,
    basis: 'Deterministic static inspection (not a runtime benchmark)',
  };
}

export function buildConversionPassport({
  title = 'Untitled conversion',
  pythonCode = '',
  javaCode = '',
  javaVersion = 'Java 21 LTS',
  conversionMode = 'strict',
  compatibilityReport = null,
  dependencyMappings = [],
  verificationReport = null,
  qualityReport = null,
}) {
  const compat = compatibilityReport || analyzePythonCompatibility(pythonCode);
  const deps = dependencyMappings.length > 0 ? dependencyMappings : compat.dependencies || [];
  const quality = qualityReport || analyzeCodeQuality({ pythonCode, javaCode });

  const passportJson = {
    schema: 'jforge.conversion-passport.v1',
    generatedAt: new Date().toISOString(),
    title,
    sourceLanguage: 'Python 3',
    targetLanguage: javaVersion,
    conversionMode,
    detectedConstructs: compat.metrics,
    compatibilityStatus: compat.status,
    compatibilityFindings: compat.findings,
    dependencyMappings: deps,
    compilerStatus: verificationReport
      ? verificationReport.compilationPassed
        ? 'compiled'
        : 'compilation_failed'
      : 'not executed',
    executionStatus: verificationReport
      ? {
          status: verificationReport.status,
          passedCases: verificationReport.passedCases,
          totalCases: verificationReport.totalCases,
          pythonExitCode: verificationReport.python?.exitCode ?? null,
          javaExitCode: verificationReport.java?.exitCode ?? null,
          pythonTimeMs: verificationReport.python?.executionTimeMs ?? null,
          javaTimeMs: verificationReport.java?.executionTimeMs ?? null,
        }
      : 'not executed',
    repairAttempts: verificationReport?.repairedAttempts || [],
    staticQualityChecks: quality,
    unitTestStatus: 'Static generation only (live JUnit runner not invoked)',
    knownLimitations: [
      'Verification covers executed stdin/test cases only and does not formally prove total semantic equivalence across all unexecuted branches.',
      'Generated JUnit 5 suites require a local Maven/Gradle JDK environment to run @Test assertions.',
    ],
  };

  const md = `# J-Forge Conversion Passport
**Conversion:** ${title}
**Generated At:** ${passportJson.generatedAt}
**Source -> Target:** Python 3 -> ${javaVersion} (Mode: \`${conversionMode}\`)

## 1. Compatibility & Constructs
- **Status:** ${compat.status} (${compat.summary})
- **Detected Counts:** ${compat.metrics.lines} lines, ${compat.metrics.functions} functions, ${compat.metrics.classes} classes, ${compat.metrics.loops} loops, ${compat.metrics.imports} imports
${compat.findings.map((f) => `- [${f.classification}] ${f.category}: ${f.message}`).join('\n')}

## 2. Dependency Mappings
${deps.length > 0 ? deps.map((d) => `- \`${d.pythonPkg}\` -> ${d.javaEquivalent} (${d.classification})`).join('\n') : '- No external Python module imports detected.'}

## 3. Compilation & Execution Evidence
- **Compiler Status:** ${passportJson.compilerStatus}
- **Verification Verdict:** ${verificationReport ? `${verificationReport.status} (${verificationReport.passedCases}/${verificationReport.totalCases} test cases passed)` : 'Not executed'}
- **Repair Attempts:** ${passportJson.repairAttempts.length > 0 ? passportJson.repairAttempts.map((a) => `Pass #${a.pass} (${a.repairedBy}): ${a.statusAfter}`).join('; ') : 'None recorded'}

## 4. Code Quality & Limitations
- **Estimated Time Complexity:** ${quality.estimatedTimeComplexity}
- **Estimated Space Complexity:** ${quality.estimatedSpaceComplexity}
- **Limitations:** Semantic equivalence holds only for executed test cases; JUnit suites are statically generated unless run in Maven/Gradle.
`;

  return { passportJson, passportMarkdown: md };
}
