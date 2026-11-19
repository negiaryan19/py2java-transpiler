import test from 'node:test';
import assert from 'node:assert/strict';
import {
  stripCommentsAndLiterals,
  analyzeJavaSyntax,
  repairWithAstHeuristics,
  healJavaCode,
} from '../lib/self-healing.js';
import { POST } from '../app/api/v1/convert/route.js';

test('Self-Healing: Strips comments and string literals without affecting lexical tokens', () => {
  const javaCode = `
  // Line comment with { unbalanced brace
  /* Multi-line
     comment with } */
  public class Test {
      String msg = "String literal with { and } and \\"escaped quotes\\"";
  }
  `;
  const stripped = stripCommentsAndLiterals(javaCode);
  assert.ok(!stripped.includes('unbalanced brace'), 'Should strip line comment content');
  assert.ok(!stripped.includes('Multi-line'), 'Should strip block comment content');
  assert.ok(!stripped.includes('String literal with'), 'Should strip string literal content');
  assert.ok(stripped.includes('public class Test'), 'Should keep class declaration');
});

test('Self-Healing: Static analyzer detects clean code as 100% valid with score 100', () => {
  const validJava = `package com.jforge.ciap;

import java.util.*;

public class Solution {
    public static void main(String[] args) {
        List<String> items = new ArrayList<>();
        items.add("FAANG");
        System.out.println(items.size());
    }
}`;

  const analysis = analyzeJavaSyntax(validJava);
  assert.equal(analysis.isValid, true, 'Clean code should be marked valid');
  assert.equal(analysis.issues.length, 0, 'Clean code should have zero issues');
  assert.equal(analysis.braceDelta, 0, 'Braces must be balanced');
  assert.equal(analysis.hasPackage, true, 'Package must be detected');
  assert.equal(analysis.hasClass, true, 'Class must be detected');
  assert.equal(analysis.qualityScore, 100, 'Quality score must be 100');
});

test('Self-Healing: Static analyzer detects unbalanced braces, missing package, and missing imports', () => {
  const faultyJava = `
public class Solution {
    public static void main(String[] args) {
        Map<String, Object> map = new HashMap<>();
        System.out.println("Missing closing brace, package, and imports");
`;

  const analysis = analyzeJavaSyntax(faultyJava);
  assert.equal(analysis.isValid, false, 'Faulty code should be marked invalid');
  assert.equal(analysis.braceDelta, 2, 'Should detect 2 unclosed curly braces');
  assert.equal(analysis.hasPackage, false, 'Should flag missing package');
  assert.ok(
    analysis.missingImports.includes('java.util.*'),
    'Should flag missing java.util.* import for Map/HashMap'
  );
  assert.ok(analysis.qualityScore < 70, 'Quality score should be penalized for issues');
});

test('Self-Healing: Deterministic heuristic auto-repairs truncated braces, missing package, and missing imports', () => {
  const brokenJava = `\`\`\`java
public class Solution {
    public static void main(String[] args) {
        List<Integer> list = new ArrayList<>();
        System.out.println(list);
`;

  const initialAnalysis = analyzeJavaSyntax(brokenJava);
  assert.equal(initialAnalysis.isValid, false);

  const repair = repairWithAstHeuristics(brokenJava, initialAnalysis);
  assert.equal(repair.isFullyRepaired, true, 'Should be 100% repaired by heuristic pass');
  assert.ok(repair.repairedCode.startsWith('package com.jforge.ciap;'), 'Injected package');
  assert.ok(repair.repairedCode.includes('import java.util.*;'), 'Injected java.util.*');
  assert.ok(!repair.repairedCode.includes('```'), 'Stripped markdown backticks');
  assert.equal(repair.analysis.braceDelta, 0, 'Auto-balanced all braces');
  assert.equal(repair.analysis.qualityScore, 100, 'Post-repair score must be 100');
});

test('Self-Healing: healJavaCode pipeline returns passes: 0 for clean code and passes: 1 for repaired code', async () => {
  const clean = `package com.jforge.ciap;
public class Solution {
    public static void main(String[] args) {
        System.out.println("Clean");
    }
}`;
  const resClean = await healJavaCode({ javaCode: clean });
  assert.equal(resClean.self_healing.passes, 0);
  assert.equal(resClean.self_healing.repaired, false);
  assert.equal(resClean.self_healing.syntax_valid, true);
  assert.equal(resClean.self_healing.diagnostics.brace_balance, 'BALANCED');

  const flawed = `
public class Solution {
    public static void main(String[] args) {
        List<String> names = new ArrayList<>();
`;
  const resRepaired = await healJavaCode({ javaCode: flawed });
  assert.equal(resRepaired.self_healing.passes, 1);
  assert.equal(resRepaired.self_healing.repaired, true);
  assert.equal(resRepaired.self_healing.repaired_by, 'ast_heuristics');
  assert.equal(resRepaired.self_healing.syntax_valid, true);
  assert.ok(resRepaired.self_healing.corrections_applied.length >= 2);
});

test('Self-Healing: POST /api/v1/convert returns self_healing contract and HTTP response headers', async () => {
  const req = new Request('http://localhost:3000/api/v1/convert', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': 'ciap-secret-key-2026',
      'x-bypass-cache': 'true',
    },
    body: JSON.stringify({
      python_code: 'def compute(n: int):\n    return n * 10\nprint(compute(5))',
      java_version: '17',
    }),
  });

  const res = await POST(req);
  assert.equal(res.status, 200);

  // Headers check
  const passesHeader = res.headers.get('X-Self-Healing-Passes');
  const qualityHeader = res.headers.get('X-Self-Healing-Quality');
  assert.ok(passesHeader !== null, 'X-Self-Healing-Passes header must be present');
  assert.ok(qualityHeader !== null, 'X-Self-Healing-Quality header must be present');

  // JSON Contract check
  const json = await res.json();
  assert.equal(json.status, 'success');
  assert.ok(json.self_healing, 'Response must include self_healing metadata');
  assert.equal(json.self_healing.performed, true);
  assert.equal(typeof json.self_healing.passes, 'number');
  assert.equal(typeof json.self_healing.syntax_valid, 'boolean');
  assert.ok(json.self_healing.diagnostics, 'Diagnostics object must exist');
  assert.equal(json.self_healing.diagnostics.brace_balance, 'BALANCED');
  assert.equal(json.self_healing.diagnostics.import_resolution, 'COMPLETE');
});
