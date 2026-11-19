import { GoogleGenAI } from '@google/genai';

/**
 * Strips comments (// and /*...* /) and string/char literals from Java source
 * to allow accurate AST lexical scanning of syntax tokens (braces, brackets, keywords).
 */
export function stripCommentsAndLiterals(code) {
  if (!code || typeof code !== 'string') return '';
  let inString = false;
  let inChar = false;
  let inLineComment = false;
  let inBlockComment = false;
  let out = '';

  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    const next = code[i + 1];

    if (inLineComment) {
      if (c === '\n') {
        inLineComment = false;
        out += '\n';
      }
      continue;
    }

    if (inBlockComment) {
      if (c === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (inString) {
      if (c === '\\' && next) {
        i++;
        continue;
      }
      if (c === '"') {
        inString = false;
      }
      continue;
    }

    if (inChar) {
      if (c === '\\' && next) {
        i++;
        continue;
      }
      if (c === "'") {
        inChar = false;
      }
      continue;
    }

    // Enter comment or literal
    if (c === '/' && next === '/') {
      inLineComment = true;
      i++;
      continue;
    }
    if (c === '/' && next === '*') {
      inBlockComment = true;
      i++;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "'") {
      inChar = true;
      continue;
    }

    out += c;
  }

  return out;
}

/**
 * Static AST Syntax & Compilation Rule Validator.
 * Verifies brace balancing, package encapsulation, class declarations, and import completeness.
 *
 * @param {string} javaCode
 * @returns {object} Analysis result
 */
export function analyzeJavaSyntax(javaCode) {
  if (!javaCode || typeof javaCode !== 'string' || !javaCode.trim()) {
    return {
      isValid: false,
      issues: ['Empty or undefined Java code.'],
      missingImports: [],
      braceDelta: 0,
      parenDelta: 0,
      bracketDelta: 0,
      hasPackage: false,
      hasClass: false,
      hasMarkdownArtifacts: false,
      qualityScore: 0,
    };
  }

  const issues = [];
  const missingImports = [];

  // 1. Check for markdown fence artifacts
  const hasMarkdownArtifacts =
    /```(?:java)?/i.test(javaCode) || /```\s*$/i.test(javaCode);
  if (hasMarkdownArtifacts) {
    issues.push('Residual markdown code fence detected.');
  }

  // 2. Strip comments and literals for lexical analysis
  const stripped = stripCommentsAndLiterals(javaCode);

  // 3. Brace & delimiter balancing
  let curlyOpen = 0;
  let curlyClose = 0;
  let parenOpen = 0;
  let parenClose = 0;
  let bracketOpen = 0;
  let bracketClose = 0;

  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i];
    if (ch === '{') curlyOpen++;
    else if (ch === '}') curlyClose++;
    else if (ch === '(') parenOpen++;
    else if (ch === ')') parenClose++;
    else if (ch === '[') bracketOpen++;
    else if (ch === ']') bracketClose++;
  }

  const braceDelta = curlyOpen - curlyClose;
  const parenDelta = parenOpen - parenClose;
  const bracketDelta = bracketOpen - bracketClose;

  if (braceDelta !== 0) {
    issues.push(
      braceDelta > 0
        ? `Unclosed curly braces: ${braceDelta} missing '}'`
        : `Unexpected extra closing curly braces: ${Math.abs(braceDelta)} extra '}'`
    );
  }

  if (parenDelta !== 0) {
    issues.push(
      parenDelta > 0
        ? `Unclosed parentheses: ${parenDelta} missing ')'`
        : `Unexpected extra closing parentheses: ${Math.abs(parenDelta)} extra ')'`
    );
  }

  if (bracketDelta !== 0) {
    issues.push(
      bracketDelta > 0
        ? `Unclosed square brackets: ${bracketDelta} missing ']'`
        : `Unexpected extra closing square brackets: ${Math.abs(bracketDelta)} extra ']'`
    );
  }

  // 4. Package declaration check
  const hasPackage = /^\s*package\s+[\w.]+;/m.test(javaCode);
  if (!hasPackage) {
    issues.push('Missing package declaration (expected: package com.jforge.ciap;)');
  }

  // 5. Class / Record / Interface structure check
  const hasClass = /\b(class|record|interface|enum)\s+[A-Z]\w*/.test(stripped);
  if (!hasClass) {
    issues.push('Missing top-level class, record, or interface declaration.');
  }

  // 6. Import resolution audit
  const hasJavaUtilImport = /import\s+java\.util\.\*;/.test(javaCode);

  // Check Collections / Lists / Maps
  if (
    /\b(List|ArrayList|LinkedList|Map|HashMap|LinkedHashMap|TreeMap|Set|HashSet|TreeSet|Arrays|Collections|Optional)\b/.test(
      stripped
    )
  ) {
    if (
      !hasJavaUtilImport &&
      !/import\s+java\.util\.(List|ArrayList|LinkedList|Map|HashMap|LinkedHashMap|TreeMap|Set|HashSet|TreeSet|Arrays|Collections|Optional);/.test(
        javaCode
      )
    ) {
      missingImports.push('java.util.*');
      issues.push('Missing import for Java Collections framework (java.util.*).');
    }
  }

  // Check java.util.Objects
  if (/\bObjects\.requireNonNull\b/.test(stripped)) {
    if (!hasJavaUtilImport && !/import\s+java\.util\.Objects;/.test(javaCode)) {
      if (!missingImports.includes('java.util.*') && !missingImports.includes('java.util.Objects')) {
        missingImports.push('java.util.Objects');
        issues.push('Missing import for java.util.Objects.');
      }
    }
  }

  // Check java.util.stream
  if (/\b(Stream|Collectors)\b/.test(stripped)) {
    if (!/import\s+java\.util\.stream\.\*;/.test(javaCode) && !/import\s+java\.util\.stream\.(Stream|Collectors);/.test(javaCode)) {
      missingImports.push('java.util.stream.*');
      issues.push('Missing import for Java Streams API (java.util.stream.*).');
    }
  }

  // Check Spring Boot Web Annotations
  if (
    /@(RestController|GetMapping|PostMapping|PutMapping|DeleteMapping|RequestMapping|RequestBody|PathVariable|RequestParam)\b/.test(
      stripped
    )
  ) {
    if (!/import\s+org\.springframework\.web\.bind\.annotation\.\*;/.test(javaCode)) {
      missingImports.push('org.springframework.web.bind.annotation.*');
      issues.push('Missing import for Spring Boot REST Web annotations (org.springframework.web.bind.annotation.*).');
    }
  }

  // Check Spring Boot HTTP Entities
  if (/\b(ResponseEntity|HttpStatus)\b/.test(stripped)) {
    if (!/import\s+org\.springframework\.http\.\*;/.test(javaCode) && !/import\s+org\.springframework\.http\.(ResponseEntity|HttpStatus);/.test(javaCode)) {
      missingImports.push('org.springframework.http.*');
      issues.push('Missing import for Spring Boot HTTP components (org.springframework.http.*).');
    }
  }

  // 7. Quality Score calculation (100 is flawless)
  let qualityScore = 100;
  if (!hasPackage) qualityScore -= 20;
  if (!hasClass) qualityScore -= 30;
  if (braceDelta !== 0) qualityScore -= 25;
  if (parenDelta !== 0 || bracketDelta !== 0) qualityScore -= 15;
  if (hasMarkdownArtifacts) qualityScore -= 10;
  qualityScore -= missingImports.length * 10;
  qualityScore = Math.max(0, Math.min(100, qualityScore));

  return {
    isValid: issues.length === 0,
    issues,
    missingImports,
    braceDelta,
    parenDelta,
    bracketDelta,
    hasPackage,
    hasClass,
    hasMarkdownArtifacts,
    qualityScore,
  };
}

/**
 * Deterministic AST Heuristic Auto-Repair (Pass 1).
 * Fast, zero-token correction for common syntax imperfections.
 *
 * @param {string} javaCode
 * @param {object} analysis - Output from analyzeJavaSyntax
 * @returns {object} Repaired code and diagnostics
 */
export function repairWithAstHeuristics(javaCode, analysis) {
  let repaired = javaCode;
  const corrections = [];

  // 1. Strip markdown fences if present
  if (analysis.hasMarkdownArtifacts) {
    repaired = repaired
      .replace(/^```(?:java)?\s*/im, '')
      .replace(/```\s*$/m, '')
      .trim();
    corrections.push('Stripped enclosing markdown code fences');
  }

  // 2. Prepend package declaration if missing
  if (!analysis.hasPackage) {
    repaired = `package com.jforge.ciap;\n\n${repaired.trim()}`;
    corrections.push('Injected package declaration: package com.jforge.ciap;');
  }

  // 3. Inject missing standard imports
  if (analysis.missingImports.length > 0) {
    const importStatements = analysis.missingImports
      .map((imp) => `import ${imp};`)
      .join('\n');

    // Place imports immediately after package declaration
    const pkgMatch = repaired.match(/^(package\s+[\w.]+;\s*)/m);
    if (pkgMatch) {
      const idx = pkgMatch.index + pkgMatch[0].length;
      repaired = repaired.slice(0, idx).trimEnd() + '\n\n' + importStatements + '\n\n' + repaired.slice(idx).trimStart();
    } else {
      repaired = `${importStatements}\n\n${repaired.trimStart()}`;
    }
    corrections.push(`Injected missing imports: ${analysis.missingImports.join(', ')}`);
  }

  // 4. Balance missing closing delimiters (if truncated at end)
  if (analysis.braceDelta > 0) {
    const closingBraces = Array(analysis.braceDelta).fill('}').join('\n');
    repaired = repaired.trimEnd() + '\n' + closingBraces + '\n';
    corrections.push(`Auto-balanced ${analysis.braceDelta} missing closing curly brace(s) '}'`);
  }

  if (analysis.parenDelta > 0) {
    repaired = repaired.trimEnd() + ')'.repeat(analysis.parenDelta) + '\n';
    corrections.push(`Auto-balanced ${analysis.parenDelta} missing closing parentheses ')'`);
  }

  if (analysis.bracketDelta > 0) {
    repaired = repaired.trimEnd() + ']'.repeat(analysis.bracketDelta) + '\n';
    corrections.push(`Auto-balanced ${analysis.bracketDelta} missing closing bracket(s) ']'`);
  }

  // Re-verify repaired code
  const reAnalysis = analyzeJavaSyntax(repaired);

  return {
    repairedCode: repaired,
    analysis: reAnalysis,
    corrections,
    isFullyRepaired: reAnalysis.isValid,
  };
}

/**
 * Autonomous Gemini Reflection Pass (Pass 2).
 * Triggers an LLM reflection cycle with targeted compiler feedback
 * if deterministic heuristics could not fully resolve structural anomalies.
 *
 * @param {object} params
 * @returns {Promise<object>}
 */
export async function repairWithGeminiReflection({
  javaCode,
  pythonCode,
  targetVersion = 'Java 17 LTS',
  issues = [],
  apiKey = null,
}) {
  const activeKey = apiKey?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (!activeKey || activeKey === 'AIzaSy_YOUR_GOOGLE_AI_STUDIO_KEY') {
    return {
      success: false,
      repairedCode: javaCode,
      reason: 'No Gemini API key available for reflection pass.',
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: activeKey, apiVersion: 'v1beta' });
    const reflectionPrompt = `You are an Autonomous Java Compiler Diagnostics & Self-Healing Agent.
The previously generated Java code failed static AST verification with the following compiler issues:
${issues.map((iss, i) => `${i + 1}. ${iss}`).join('\n')}

Original Python Source:
${pythonCode}

Faulty Java Code:
${javaCode}

YOUR MISSION:
1. Fix all syntax, missing braces, incomplete class declarations, and unresolved imports.
2. Ensure the code begins with 'package com.jforge.ciap;' and encapsulates everything inside 'public class Solution'.
3. Maintain exact semantics for ${targetVersion}.
4. Return ONLY the clean, pure, corrected Java code without markdown fences, explanation, or backticks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: reflectionPrompt }] }],
      config: {
        temperature: 0.0, // Fully deterministic correction
      },
    });

    const rawOutput = response?.text || '';
    const cleanJava = rawOutput
      .replace(/^```(?:java)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    if (cleanJava && cleanJava.length > 20) {
      const verified = analyzeJavaSyntax(cleanJava);
      return {
        success: verified.isValid,
        repairedCode: cleanJava,
        analysis: verified,
        reason: verified.isValid ? 'Repaired via Gemini Reflection Agent' : 'Partial repair via Reflection Agent',
      };
    }
  } catch (err) {
    console.warn('[Self-Healing Reflection] Gemini reflection failed:', err.message);
  }

  return {
    success: false,
    repairedCode: javaCode,
    reason: 'Gemini reflection pass encountered API error.',
  };
}

/**
 * Orchestrates the full Agentic Self-Correction Pipeline:
 * Pass 0: Static AST Syntax Analysis
 * Pass 1: Deterministic Heuristic Auto-Repair (0ms, 0 tokens)
 * Pass 2: Autonomous Reflection Loop (via Gemini API if needed)
 *
 * @param {object} options
 * @returns {Promise<{ javaCode: string, self_healing: object }>}
 */
export async function healJavaCode({
  javaCode,
  pythonCode = '',
  targetVersion = 'Java 17 LTS',
  apiKey = null,
}) {
  // Pass 0: Static Analysis
  const initialAnalysis = analyzeJavaSyntax(javaCode);

  // If initial code is 100% clean, return immediately with zero latency/token overhead
  if (initialAnalysis.isValid) {
    return {
      javaCode,
      self_healing: {
        performed: true,
        passes: 0,
        repaired: false,
        repaired_by: 'clean_ast',
        syntax_valid: true,
        original_issues: [],
        corrections_applied: [],
        diagnostics: {
          brace_balance: 'BALANCED',
          import_resolution: 'COMPLETE',
          structure_check: 'VALID',
          quality_score: initialAnalysis.qualityScore,
        },
      },
    };
  }

  // Pass 1: Deterministic AST Heuristic Auto-Repair
  const heuristicResult = repairWithAstHeuristics(javaCode, initialAnalysis);

  if (heuristicResult.isFullyRepaired) {
    return {
      javaCode: heuristicResult.repairedCode,
      self_healing: {
        performed: true,
        passes: 1,
        repaired: true,
        repaired_by: 'ast_heuristics',
        syntax_valid: true,
        original_issues: initialAnalysis.issues,
        corrections_applied: heuristicResult.corrections,
        diagnostics: {
          brace_balance: 'BALANCED',
          import_resolution: 'COMPLETE',
          structure_check: 'VALID',
          quality_score: heuristicResult.analysis.qualityScore,
        },
      },
    };
  }

  // Pass 2: Gemini Reflection Loop (if structural errors persist and API key is present)
  let finalCode = heuristicResult.repairedCode;
  let finalAnalysis = heuristicResult.analysis;
  let passCount = 1;
  let repairedBy = 'ast_heuristics';
  const allCorrections = [...heuristicResult.corrections];

  if (!heuristicResult.isFullyRepaired && apiKey) {
    const reflectionResult = await repairWithGeminiReflection({
      javaCode: heuristicResult.repairedCode,
      pythonCode,
      targetVersion,
      issues: heuristicResult.analysis.issues,
      apiKey,
    });

    if (reflectionResult.success) {
      passCount = 2;
      finalCode = reflectionResult.repairedCode;
      finalAnalysis = reflectionResult.analysis;
      repairedBy = 'gemini_reflection';
      allCorrections.push('Repaired structural AST integrity via Gemini Reflection Feedback Loop');
    }
  }

  return {
    javaCode: finalCode,
    self_healing: {
      performed: true,
      passes: passCount,
      repaired: finalAnalysis.isValid,
      repaired_by: repairedBy,
      syntax_valid: finalAnalysis.isValid,
      original_issues: initialAnalysis.issues,
      corrections_applied: allCorrections,
      diagnostics: {
        brace_balance: finalAnalysis.braceDelta === 0 ? 'BALANCED' : 'UNBALANCED',
        import_resolution: finalAnalysis.missingImports.length === 0 ? 'COMPLETE' : 'MISSING',
        structure_check: finalAnalysis.hasClass ? 'VALID' : 'ANOMALY',
        quality_score: finalAnalysis.qualityScore,
      },
    },
  };
}
