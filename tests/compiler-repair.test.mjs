import test from 'node:test';
import assert from 'node:assert/strict';
import { applyJavacDiagnosticRepairs, repairWithJavacLoop } from '../lib/compiler-repair.js';
import { POST as repairPost } from '../app/api/v1/repair/route.js';

test('Compiler Repair: fixes Python booleans and missing imports from javac error', () => {
  const brokenJava = `public class Solution {\n  public static void main(String[] args) {\n    boolean flag = True;\n    List<Integer> nums = new ArrayList<>();\n    System.out.println(flag);\n  }\n}`;
  const res = applyJavacDiagnosticRepairs(brokenJava, 'error: cannot find symbol\n  symbol: class List');
  assert.equal(res.repairedCode.includes('boolean flag = true;'), true);
  assert.equal(res.repairedCode.includes('import java.util.*;'), true);
  assert.equal(res.repairedCode.includes('package com.jforge.ciap;'), true);
  assert.ok(res.applied.length >= 2);
});

test('Compiler Repair Loop (mocked): fixes missing import and verifies behavioral match in 1 pass', async () => {
  let callNum = 0;
  const mockFetch = async (_url, opts) => {
    const body = JSON.parse(opts.body);
    if (body.compiler.includes('cpython')) {
      return { ok: true, json: async () => ({ status: '0', program_output: 'true\n' }) };
    }
    callNum += 1;
    // Simulate javac passing once `import java.util.*;` and `true` are repaired
    const fixed = body.code.includes('import java.util.*;') && body.code.includes('boolean flag = true;');
    return {
      ok: true,
      json: async () => ({
        status: fixed ? '0' : '1',
        compiler_error: fixed ? '' : 'error: cannot find symbol',
        program_output: fixed ? 'true\n' : '',
      }),
    };
  };

  const brokenJava = `public class Solution {\n  public static void main(String[] args) {\n    boolean flag = True;\n    List<String> x = new ArrayList<>();\n    System.out.println(flag);\n  }\n}`;
  const report = await repairWithJavacLoop({
    pythonCode: 'flag = True\nprint("true")',
    javaCode: brokenJava,
    compilerError: 'error: cannot find symbol',
    fetchImpl: mockFetch,
  });

  assert.equal(report.repaired, true);
  assert.equal(report.verification?.status, 'behavioral_match');
  assert.equal(report.attempts.length, 1);
  assert.equal(callNum, 1);
});

test('Repair Route: POST /api/v1/repair rejects missing code with 400', async () => {
  const req = new Request('http://localhost/api/v1/repair', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ python_code: '', java_code: '' }),
  });
  const res = await repairPost(req);
  assert.equal(res.status, 400);
});
