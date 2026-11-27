import test from 'node:test';
import assert from 'node:assert/strict';
import { buildZipBytes, buildJavaProjectFiles } from '../lib/zip-export.js';
import { generateJUnitTestSuite } from '../lib/junit-generator.js';
import { verifyConversionBehavior } from '../lib/verification.js';

test('ZIP Exporter: creates valid PK ZIP archive containing pom.xml, Solution.java, SolutionTest.java', () => {
  const junitCode = generateJUnitTestSuite({
    javaCode: 'package com.jforge.ciap;\npublic class Solution { public static void main(String[] a){ System.out.println(25); } }',
    verificationReport: {
      outputMatch: true,
      cases: [{ name: 'Square5', stdin: '', pythonStdout: '25', matched: true }],
    },
  });

  const files = buildJavaProjectFiles({
    javaCode: 'package com.jforge.ciap;\npublic class Solution {}',
    junitCode,
    pythonCode: 'print(25)',
    javaVersion: '21',
  });

  const bytes = buildZipBytes(files);
  assert.equal(bytes[0], 0x50); // 'P'
  assert.equal(bytes[1], 0x4b); // 'K'
  assert.equal(bytes[2], 0x03);
  assert.equal(bytes[3], 0x04);
  assert.equal(junitCode.includes('@Test'), true);
  assert.equal(junitCode.includes('assertEquals("25", actual);'), true);
});

test('Multi-Test Verification (mocked): runs multiple stdin test cases and computes real pass/fail counts', async () => {
  const mockFetch = async (_url, opts) => {
    const body = JSON.parse(opts.body);
    const val = Number((body.stdin || '0').trim()) * 2;
    return {
      ok: true,
      json: async () => ({
        status: '0',
        compiler_error: '',
        program_output: `${val}\n`,
        program_error: '',
      }),
    };
  };

  const report = await verifyConversionBehavior({
    pythonCode: 'x = int(input())\nprint(x * 2)',
    javaCode: 'public class Solution { public static void main(String[] a){ } }',
    testCases: [
      { name: 'Case 5', stdin: '5' },
      { name: 'Case 12', stdin: '12' },
    ],
    fetchImpl: mockFetch,
  });

  assert.equal(report.status, 'behavioral_match');
  assert.equal(report.passedCases, 2);
  assert.equal(report.totalCases, 2);
  assert.equal(report.cases.length, 2);
  assert.equal(report.cases[1].javaStdout, '24');
});
