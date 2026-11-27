import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  analyzePythonCompatibility,
  detectPythonDependencies,
  analyzeCodeQuality,
  buildConversionPassport,
} from '../lib/compatibility.js';
import { deterministicAstFallback, transpilePythonToJava } from '../lib/gemini.js';
import { runCodeIntelligence } from '../lib/intelligence.js';
import { POST as intelligencePost } from '../app/api/v1/intelligence/route.js';

test('Compatibility Scanner: classifies constructs accurately without fake percentages', () => {
  const pyCode = `
import requests
async def fetch_data():
    yield 10 // 3
    return eval("1+1")
`;
  const report = analyzePythonCompatibility(pyCode);
  assert.equal(report.status, 'has_unsupported');
  assert.equal(report.dependencies[0].pythonPkg, 'requests');
  assert.ok(report.findings.some((f) => f.classification === 'Unsupported'));
  assert.ok(report.findings.some((f) => f.classification === 'Requires adaptation'));
  assert.equal('accuracyPercent' in report, false);
});

test('Dependency Intelligence: maps Python imports honestly and flags unknown libs', () => {
  const deps = detectPythonDependencies('import pytest\nimport dataclasses\nimport obscure_custom_mod');
  assert.equal(deps.length, 3);
  assert.ok(deps[0].javaEquivalent.includes('JUnit 5'));
  assert.ok(deps[0].mavenSnippet.includes('junit-jupiter'));
  assert.ok(deps[1].javaEquivalent.includes('Java Records'));
  assert.equal(deps[2].classification, 'Unknown');
  assert.equal(deps[2].mavenSnippet, null);
});

test('Code Quality & Passport: labels heuristics clearly and never fakes unexecuted runs', () => {
  const py = 'for i in range(5):\n    print(i)';
  const java = 'package com.jforge.ciap;\nimport java.util.LinkedList;\npublic class Solution { public static void main(String[] a){ Object x = null; } }';
  const quality = analyzeCodeQuality({ pythonCode: py, javaCode: java });
  assert.ok(quality.estimatedTimeComplexity.includes('static heuristic'));
  assert.ok(quality.items.some((i) => i.category === 'Unused Import'));
  assert.ok(quality.items.some((i) => i.category === 'Null Safety'));

  const { passportJson, passportMarkdown } = buildConversionPassport({
    title: 'Loop Check',
    pythonCode: py,
    javaCode: java,
    javaVersion: 'Java 21 LTS',
    conversionMode: 'streams',
    verificationReport: null,
  });
  assert.equal(passportJson.compilerStatus, 'not executed');
  assert.equal(passportJson.executionStatus, 'not executed');
  assert.ok(passportMarkdown.includes('Static generation only') || passportJson.unitTestStatus.includes('Static generation'));
});

test('Conversion Config: honors custom package/class names and sanitizes invalid identifiers', async () => {
  const custom = deterministicAstFallback('print(1)', 'Java 21 LTS', {
    packageName: 'org.acme.converter',
    className: 'PayrollEngine',
    includeMain: true,
  });
  assert.ok(custom.includes('package org.acme.converter;'));
  assert.ok(custom.includes('public class PayrollEngine'));

  const sanitized = await transpilePythonToJava('print(1)', 'Java 21 LTS', null, {
    skipServerKey: true,
    conversionConfig: { packageName: 'DROP TABLE;', className: '123Invalid' },
  });
  assert.ok(sanitized.javaCode.includes('package com.jforge.ciap;'));
  assert.ok(sanitized.javaCode.includes('public class Solution'));
});

test('Expanded Intelligence Actions & Assistant Route: handles selection, find-bugs, assistant context', async () => {
  const prevKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const sel = await runCodeIntelligence({
      action: 'explain-selection',
      pythonCode: 'def f(x):\n    return x * 2',
      selectedCode: 'return x * 2',
      javaCode: 'public class Solution {}',
    });
    assert.equal(sel.ok, true);
    assert.ok(sel.explanation.includes('Selection Analysis'));

    const req = new Request('http://localhost/api/v1/intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'assistant',
        python_code: 'print(10 // 3)',
        java_code: 'public class Solution {}',
        question: 'Why floorDiv?',
      }),
    });
    const res = await intelligencePost(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(data.explanation.includes('Why floorDiv?'));
  } finally {
    if (prevKey !== undefined) process.env.GEMINI_API_KEY = prevKey;
  }
});

test('Sprint UI Cleanup: zero legacy 3-UI themes or UI PRESETS remain in app workspace', () => {
  const css = fs.readFileSync('app/globals.css', 'utf8');
  const pageSrc = fs.readFileSync('app/page.jsx', 'utf8');
  const navSrc = fs.readFileSync('app/components/Navigation.jsx', 'utf8');

  assert.equal(css.includes('cupertino') || css.includes('brutalist') || css.includes('carbon'), false);
  assert.equal(pageSrc.includes('PRESETS'), false);
  assert.equal(navSrc.includes('Cupertino') || navSrc.includes('Brutalist') || navSrc.includes('OLED Carbon'), false);
});
