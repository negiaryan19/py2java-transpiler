import test from 'node:test';
import assert from 'node:assert/strict';
import { runCodeIntelligence } from '../lib/intelligence.js';
import { POST as intelligencePost } from '../app/api/v1/intelligence/route.js';
import { POST as runPythonPost } from '../app/api/v1/run-python/route.js';
import { runPythonInSandbox } from '../lib/python-sandbox.js';
import { repairWithJavacLoop } from '../lib/compiler-repair.js';

test('Code Intelligence Engine: deterministic actions return structured honest outputs', async () => {
  const samplePy = 'for i in range(3):\n    print(i * 2)';
  const sampleJava = 'package com.jforge.ciap;\npublic class Solution {\n  public static void main(String[] args) {\n    for (int i = 0; i < 3; i++) System.out.println(i * 2);\n  }\n}';

  const explainRes = await runCodeIntelligence({
    action: 'explain',
    pythonCode: samplePy,
    javaCode: sampleJava,
    javaVersion: '21',
    apiKey: '',
  });
  assert.equal(explainRes.ok, true);
  assert.equal(explainRes.mode, 'deterministic');
  assert.ok(explainRes.explanation.includes('Java 21'));

  const docRes = await runCodeIntelligence({
    action: 'javadoc',
    pythonCode: samplePy,
    javaCode: sampleJava,
    apiKey: '',
  });
  assert.equal(docRes.ok, true);
  assert.ok(docRes.javaCode.includes('/**'));

  const optRes = await runCodeIntelligence({
    action: 'optimize',
    pythonCode: samplePy,
    javaCode: `${sampleJava}\n\n\n`,
    apiKey: '',
  });
  assert.equal(optRes.ok, true);
  assert.ok(optRes.javaCode.includes('public class Solution'));

  const testRes = await runCodeIntelligence({
    action: 'generate-tests',
    pythonCode: samplePy,
    javaCode: sampleJava,
    verificationReport: {
      outputMatch: true,
      cases: [{ name: 'LoopTest', stdin: '', pythonStdout: '0\n2\n4', matched: true }],
    },
    apiKey: '',
  });
  assert.equal(testRes.ok, true);
  assert.equal(testRes.executed, false);
  assert.ok(testRes.testCode.includes('@Test'));
  assert.ok(testRes.testCode.includes('assertEquals'));

  await assert.rejects(() =>
    runCodeIntelligence({ action: 'unknown-action', pythonCode: samplePy, javaCode: sampleJava })
  );
});

test('Intelligence API Route: validates payload and serves deterministic tests cleanly', async () => {
  const prevKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const badActionReq = new Request('http://localhost/api/v1/intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete-db', python_code: 'print(1)' }),
    });
    const badRes = await intelligencePost(badActionReq);
    assert.equal(badRes.status, 400);

    const emptyPyReq = new Request('http://localhost/api/v1/intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'explain', python_code: '' }),
    });
    const emptyRes = await intelligencePost(emptyPyReq);
    assert.equal(emptyRes.status, 400);

    const okReq = new Request('http://localhost/api/v1/intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate-tests',
        python_code: 'print(42)',
        java_code: 'package com.jforge.ciap;\npublic class Solution {}',
        java_version: '21',
      }),
    });
    const okRes = await intelligencePost(okReq);
    assert.equal(okRes.status, 200);
    const data = await okRes.json();
    assert.equal(data.ok, true);
    assert.equal(data.executed, false);
    assert.ok(data.testCode.includes('SolutionTest'));
  } finally {
    if (prevKey !== undefined) process.env.GEMINI_API_KEY = prevKey;
  }
});

test('Run-Python Route & Sandbox (mocked): validates empty payload and handles CPython execution + HTTP errors', async () => {
  const badReq = new Request('http://localhost/api/v1/run-python', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ python_code: '   ' }),
  });
  const badRes = await runPythonPost(badReq);
  assert.equal(badRes.status, 400);

  const mockOk = await runPythonInSandbox('x = input()\nprint(int(x) + 1)', {
    stdin: '9',
    fetchImpl: async (_url, opts) => {
      const payload = JSON.parse(opts.body);
      assert.equal(payload.stdin, '9');
      assert.ok(payload.compiler.includes('cpython'));
      return {
        ok: true,
        json: async () => ({ status: '0', program_output: '10\n', program_error: '' }),
      };
    },
  });
  assert.equal(mockOk.ok, true);
  assert.equal(mockOk.stdout, '10');
  assert.equal(mockOk.exitCode, 0);

  const mockDown = await runPythonInSandbox('print(1)', {
    fetchImpl: async () => ({ ok: false, status: 503 }),
  });
  assert.equal(mockDown.ok, false);
  assert.equal(mockDown.sandboxUnavailable, true);
});

test('Compiler Auto-Repair Loop: enforces up to 3 iterations ceiling', async () => {
  let passesSeen = 0;
  const result = await repairWithJavacLoop({
    pythonCode: 'flag = True\nprint(flag)',
    javaCode: 'public class Solution { public static void main(String[] a){ boolean b = True; List<Integer> l = new ArrayList<>(); System.out.println(b); } }',
    compilerError: 'error: cannot find symbol',
    maxIterations: 5, // Must clamp to 3 max
    fetchImpl: async (_url, opts) => {
      const body = JSON.parse(opts.body);
      if (body.compiler.includes('cpython')) {
        return { ok: true, json: async () => ({ status: '0', program_output: 'True\n' }) };
      }
      passesSeen += 1;
      return {
        ok: true,
        json: async () => ({ status: '0', compiler_error: '', program_output: 'true\n' }),
      };
    },
  });
  assert.equal(result.ok, true);
  assert.ok(passesSeen <= 3);
  assert.equal(result.attempts.length, 1);
  assert.equal(result.attempts[0].compilationPassedAfter, true);
});
