import test from 'node:test';
import assert from 'node:assert/strict';
import { runPythonInSandbox } from '../lib/python-sandbox.js';
import { verifyConversionBehavior } from '../lib/verification.js';
import { POST as verifyPost } from '../app/api/v1/verify/route.js';

test('Python Sandbox (mocked): executes Python and captures stdout/exitCode', async () => {
  const mockFetch = async () => ({
    ok: true,
    json: async () => ({ status: '0', program_output: '25\n', program_error: '' }),
  });
  const res = await runPythonInSandbox('print(5*5)', { fetchImpl: mockFetch });
  assert.equal(res.ok, true);
  assert.equal(res.stdout, '25');
  assert.equal(res.exitCode, 0);
});

test('Verification Engine (mocked): returns behavioral_match when Python and Java outputs match', async () => {
  const mockFetch = async (_url, opts) => {
    const payload = JSON.parse(opts.body);
    return {
      ok: true,
      json: async () => ({
        status: '0',
        program_output: payload.compiler.includes('cpython') ? '25\n' : '25\n',
        program_error: '',
        compiler_error: '',
      }),
    };
  };
  const report = await verifyConversionBehavior({
    pythonCode: 'print(5*5)',
    javaCode: 'public class Solution { public static void main(String[] a){ System.out.println(25); } }',
    fetchImpl: mockFetch,
  });
  assert.equal(report.status, 'behavioral_match');
  assert.equal(report.compilationPassed, true);
  assert.equal(report.outputMatch, true);
  assert.equal(report.passedCases, 1);
  assert.equal(report.totalCases, 1);
});

test('Verification Engine (mocked): reports compilation_failed truthfully when javac fails', async () => {
  const mockFetch = async (_url, opts) => {
    const payload = JSON.parse(opts.body);
    if (payload.compiler.includes('cpython')) {
      return { ok: true, json: async () => ({ status: '0', program_output: '25\n' }) };
    }
    return {
      ok: true,
      json: async () => ({ status: '1', compiler_error: 'error: incompatible types', program_output: '' }),
    };
  };
  const report = await verifyConversionBehavior({
    pythonCode: 'print(5*5)',
    javaCode: 'public class Solution { broken }',
    fetchImpl: mockFetch,
  });
  assert.equal(report.status, 'compilation_failed');
  assert.equal(report.compilationPassed, false);
  assert.equal(report.passedCases, 0);
});

test('Verification Route: POST /api/v1/verify validates required payloads', async () => {
  const req = new Request('http://localhost/api/v1/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ python_code: 'print(1)', java_code: '' }),
  });
  const res = await verifyPost(req);
  assert.equal(res.status, 400);
});
