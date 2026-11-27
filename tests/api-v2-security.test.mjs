import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { POST as analyzePost } from '../app/api/v1/analyze/route.js';
import { POST as migratePost } from '../app/api/v1/projects/migrate/route.js';
import { GET as openApiGet } from '../app/api/v1/openapi.json/route.js';
import { runCodeIntelligence } from '../lib/intelligence.js';
import robots from '../app/robots.js';
import sitemap from '../app/sitemap.js';
import nextConfig from '../next.config.mjs';

test('POST /api/v1/analyze: returns compatibility, dependencies, quality, and astSummary', async () => {
  const req = new Request('http://localhost/api/v1/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-real-ip': '198.51.100.10' },
    body: JSON.stringify({
      python_code: 'import math\ndef area(r):\n    return math.pi * r * r\nprint(area(2))',
      java_code: 'package com.jforge.ciap;\npublic class Solution {}',
    }),
  });
  const res = await analyzePost(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.ok(data.compatibility);
  assert.ok(Array.isArray(data.dependencies));
  assert.ok(data.quality);
  assert.ok(data.astSummary && typeof data.astSummary.nodeCount === 'number');
});

test('POST /api/v1/analyze: rejects empty payload with 400', async () => {
  const req = new Request('http://localhost/api/v1/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-real-ip': '198.51.100.11' },
    body: JSON.stringify({ python_code: '   ' }),
  });
  const res = await analyzePost(req);
  assert.equal(res.status, 400);
});

test('POST /api/v1/projects/migrate: migrates multi-file Python project into Maven layout', async () => {
  const req = new Request('http://localhost/api/v1/projects/migrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-real-ip': '198.51.100.12' },
    body: JSON.stringify({
      java_version: '21',
      files: [
        { path: 'main.py', content: 'import helpers\nprint(helpers.greet())\nif __name__ == "__main__":\n    print("ok")' },
        { path: 'helpers.py', content: 'def greet():\n    return "hi"' },
        { path: 'requirements.txt', content: 'fastapi==0.115.0\n' },
      ],
    }),
  });
  const res = await migratePost(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.javaVersion, 'Java 21 LTS');
  assert.equal(data.plan.pythonModules, 2);
  assert.deepEqual(data.plan.entrypoints, ['main.py']);
  assert.ok(data.plan.manualInterventionRequired.some((m) => m.file === 'requirements.txt'));
  assert.ok(data.generatedFiles.some((f) => f.name === 'pom.xml' && f.content.includes('<maven.compiler.source>21</maven.compiler.source>')));
  const mainFile = data.generatedFiles.find((f) => f.name === 'src/main/java/com/jforge/migrated/Main.java');
  assert.ok(mainFile && mainFile.content.includes('Helpers.greet()'));
  assert.ok(data.generatedFiles.some((f) => f.name === 'src/main/java/com/jforge/migrated/Helpers.java'));
});

test('POST /api/v1/projects/migrate: rejects path traversal, absolute paths, and >15 files', async () => {
  const traversalReq = new Request('http://localhost/api/v1/projects/migrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-real-ip': '198.51.100.13' },
    body: JSON.stringify({
      files: [{ path: '../../etc/passwd.py', content: 'print(1)' }],
    }),
  });
  const tRes = await migratePost(traversalReq);
  assert.equal(tRes.status, 400);

  const absReq = new Request('http://localhost/api/v1/projects/migrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-real-ip': '198.51.100.14' },
    body: JSON.stringify({
      files: [{ path: '/etc/main.py', content: 'print(1)' }],
    }),
  });
  const aRes = await migratePost(absReq);
  assert.equal(aRes.status, 400);

  const oversizedReq = new Request('http://localhost/api/v1/projects/migrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-real-ip': '198.51.100.15' },
    body: JSON.stringify({
      files: Array.from({ length: 16 }, (_, i) => ({ path: `m${i}.py`, content: 'print(1)' })),
    }),
  });
  const oRes = await migratePost(oversizedReq);
  assert.equal(oRes.status, 400);

  const dupPathReq = new Request('http://localhost/api/v1/projects/migrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-real-ip': '198.51.100.16' },
    body: JSON.stringify({
      files: [
        { path: 'pkg/utils.py', content: 'def a():\n return 1' },
        { path: 'pkg/utils.py', content: 'def a():\n return 2' },
      ],
    }),
  });
  const dupRes = await migratePost(dupPathReq);
  assert.equal(dupRes.status, 400);

  const sameStemReq = new Request('http://localhost/api/v1/projects/migrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-real-ip': '198.51.100.17' },
    body: JSON.stringify({
      files: [
        { path: 'pkg_a/utils.py', content: 'def f():\n return 1' },
        { path: 'pkg_b/utils.py', content: 'def g():\n return 2' },
      ],
    }),
  });
  const stemRes = await migratePost(sameStemReq);
  assert.equal(stemRes.status, 200);
  const stemJson = await stemRes.json();
  const names = stemJson.modules.map((m) => m.className);
  assert.deepEqual(names, ['Utils', 'Utils2']);
});

test('Selection Conversion & Client Data Isolation: convert-selection produces Java and page clears/scopes storage', async () => {
  const prevKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const convSel = await runCodeIntelligence({
      action: 'convert-selection',
      pythonCode: 'x = 1\ny = 2\nfor i in range(3):\n    print(i)',
      selectedCode: 'for i in range(3):\n    print(i)',
      javaCode: '',
      javaVersion: '21',
    });
    assert.equal(convSel.ok, true);
    assert.ok(convSel.javaCode.includes('for (int i = 0; i < 3; i++)'));
  } finally {
    if (prevKey !== undefined) process.env.GEMINI_API_KEY = prevKey;
  }

  const pageSrc = fs.readFileSync('app/page.jsx', 'utf8');
  assert.ok(pageSrc.includes('draftStorageKey'));
  assert.ok(pageSrc.includes('historyStorageKey'));
  assert.ok(pageSrc.includes('setHistory(h.items.slice(0, 25))'));
});

test('OpenAPI v2, SEO metadata, CSP headers, and Migration UI wiring are intact', async () => {
  const openApiRes = await openApiGet();
  assert.equal(openApiRes.status, 200);
  const spec = await openApiRes.json();
  for (const endpoint of [
    '/api/v1/analyze',
    '/api/v1/projects/migrate',
    '/api/v1/verify',
    '/api/v1/repair',
    '/api/v1/run-python',
    '/api/v1/run-java',
    '/api/v1/intelligence',
  ]) {
    assert.ok(spec.paths[endpoint], `OpenAPI spec missing ${endpoint}`);
  }

  const r = robots();
  assert.equal(r.rules?.userAgent, '*');
  assert.ok(Array.isArray(r.rules?.disallow) && r.rules.disallow.includes('/api/'));
  const sm = sitemap();
  assert.ok(Array.isArray(sm) && sm.length >= 3);

  const hdrRules = await nextConfig.headers();
  const globalHeaders = hdrRules?.[0]?.headers || [];
  assert.ok(globalHeaders.some((h) => h.key === 'Content-Security-Policy' && h.value.includes("frame-ancestors 'none'")));
  assert.ok(globalHeaders.some((h) => h.key === 'X-Frame-Options' && h.value === 'DENY'));

  const wsViews = fs.readFileSync('app/components/WorkspaceViews.jsx', 'utf8');
  assert.ok(wsViews.includes('/api/v1/projects/migrate'));
  assert.ok(wsViews.includes('buildZipBytes'));
});
