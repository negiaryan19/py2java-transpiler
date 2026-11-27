import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareJavaForSandbox, runJavaInSandbox } from '../lib/java-sandbox.js';
import { POST as runJavaPost } from '../app/api/v1/run-java/route.js';

test('Java Sandbox: prepareJavaForSandbox strips package and public class modifier', () => {
  const input = `package com.jforge.ciap;\n\nimport java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        System.out.println(30);\n    }\n}`;
  const prepared = prepareJavaForSandbox(input);
  assert.equal(prepared.includes('package com.jforge.ciap;'), false);
  assert.equal(prepared.includes('public class Solution'), false);
  assert.equal(prepared.includes('class Solution {'), true);
  assert.equal(prepared.includes('public static void main'), true);
});

test('Java Sandbox: runJavaInSandbox handles successful OpenJDK execution', async () => {
  const mockFetch = async () => ({
    ok: true,
    json: async () => ({
      status: '0',
      program_output: '30\n',
      program_error: '',
      compiler_error: '',
    }),
  });
  const res = await runJavaInSandbox('public class Solution { public static void main(String[] a) { System.out.println(30); } }', {
    fetchImpl: mockFetch,
  });
  assert.equal(res.ok, true);
  assert.equal(res.exitCode, 0);
  assert.equal(res.stdout, '30');
});

test('Java Sandbox Route: POST /api/v1/run-java rejects empty java_code with 400', async () => {
  const req = new Request('http://localhost/api/v1/run-java', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ java_code: '   ' }),
  });
  const res = await runJavaPost(req);
  assert.equal(res.status, 400);
});
