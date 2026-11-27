import { checkRateLimit } from '../../../../../lib/rate-limit.js';
import { normalizeJavaVersion, MAX_CODE_CHARS } from '../../../../../lib/security.js';
import { deterministicAstFallback } from '../../../../../lib/gemini.js';
import { analyzePythonCompatibility, detectPythonDependencies } from '../../../../../lib/compatibility.js';

function sanitizeRelativePath(rawPath) {
  if (typeof rawPath !== 'string') return null;
  const normalized = rawPath.replace(/\\/g, '/').trim();
  if (!normalized || normalized.startsWith('/') || normalized.includes('\0')) return null;
  const segments = normalized.split('/').filter(Boolean);
  if (segments.length === 0 || segments.some((s) => s === '.' || s === '..')) return null;
  return segments.join('/');
}

function toJavaClassName(filePath) {
  const base = filePath.split('/').pop()?.replace(/\.py$/i, '') || 'Module';
  const camel = base
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
  return /^[A-Z]/.test(camel) ? camel : `Py${camel || 'Module'}`;
}

export async function POST(request) {
  const rl = checkRateLimit(request, {
    keyPrefix: 'proj_migrate:',
    limit: 10,
    windowMs: 60 * 1000,
  });
  if (!rl.allowed) {
    return Response.json({ ok: false, error: 'Rate limit exceeded (10 migrations/min).' }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const rawFiles = body?.files;
  if (!Array.isArray(rawFiles) || rawFiles.length === 0 || rawFiles.length > 15) {
    return Response.json(
      { ok: false, error: 'Provide between 1 and 15 project files inside "files".' },
      { status: 400 }
    );
  }

  const ver = normalizeJavaVersion(body?.java_version || '21');
  if (!ver.valid) {
    return Response.json({ ok: false, error: ver.error }, { status: 400 });
  }
  const javaVer = ver.value;

  const projectFiles = [];
  const seenPaths = new Set();
  const moduleNames = new Set();

  for (const f of rawFiles) {
    const safePath = sanitizeRelativePath(f?.path);
    const content = typeof f?.content === 'string' ? f.content : '';
    if (!safePath || content.length > MAX_CODE_CHARS) {
      return Response.json(
        { ok: false, error: `Invalid file path or oversized payload: ${String(f?.path || '')}` },
        { status: 400 }
      );
    }
    if (seenPaths.has(safePath)) {
      return Response.json(
        { ok: false, error: `Duplicate file path in project payload: ${safePath}` },
        { status: 400 }
      );
    }
    seenPaths.add(safePath);
    const baseMod = safePath.replace(/\.py$/i, '').split('/').pop();
    if (safePath.endsWith('.py') && baseMod) moduleNames.add(baseMod);
    projectFiles.push({ path: safePath, content });
  }

  const migrationEntries = [];
  const generatedFiles = [];
  const manualInterventionRequired = [];
  const importGraph = {};
  const usedClassNames = new Set();
  const moduleClassMap = new Map();
  const filePlan = [];

  for (const file of projectFiles) {
    if (!file.path.endsWith('.py')) {
      if (file.path.endsWith('requirements.txt')) {
        manualInterventionRequired.push({
          file: file.path,
          reason: 'Python requirements.txt detected; verify Java Maven/Gradle dependency coordinates in pom.xml.',
        });
      }
      continue;
    }

    const baseClass = toJavaClassName(file.path);
    let className = baseClass;
    let suffix = 2;
    while (usedClassNames.has(className)) {
      className = `${baseClass}${suffix++}`;
    }
    usedClassNames.add(className);
    const stem = file.path.replace(/\.py$/i, '').split('/').pop();
    if (stem && !moduleClassMap.has(stem)) {
      moduleClassMap.set(stem, className);
    }
    filePlan.push({ file, className });
  }

  for (const { file, className } of filePlan) {
    const compat = analyzePythonCompatibility(file.content);
    const deps = detectPythonDependencies(file.content);
    const isEntrypoint = /if\s+__name__\s*==\s*["']__main__["']/.test(file.content) || file.path.endsWith('main.py');

    const internalRefs = deps
      .map((d) => d.pythonPkg)
      .filter((pkg) => moduleNames.has(pkg));
    importGraph[file.path] = internalRefs;

    let convertedJava = deterministicAstFallback(file.content, `Java ${javaVer} LTS`, {
      packageName: 'com.jforge.migrated',
      className,
      includeMain: isEntrypoint || file.content.includes('print('),
    });

    // Resolve cross-module static method references within com.jforge.migrated
    for (const refMod of internalRefs) {
      const targetClass = moduleClassMap.get(refMod);
      if (!targetClass) continue;
      const escapedMod = refMod.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      convertedJava = convertedJava.replace(
        new RegExp(`\\b${escapedMod}\\.([a-zA-Z_]\\w*\\s*\\()`, 'g'),
        `${targetClass}.$1`
      );
      const fromImportRe = new RegExp(`^\\s*from\\s+${escapedMod}\\s+import\\s+(.+)$`, 'gm');
      let mFrom;
      while ((mFrom = fromImportRe.exec(file.content)) !== null) {
        const syms = mFrom[1]
          .split(',')
          .map((s) => s.trim().split(/\s+as\s+/)[0].trim())
          .filter((s) => /^[a-zA-Z_]\w*$/.test(s));
        for (const sym of syms) {
          convertedJava = convertedJava.replace(
            new RegExp(`(?<!\\.)\\b${sym}\\s*\\(`, 'g'),
            `${targetClass}.${sym}(`
          );
        }
      }
    }

    const targetPath = `src/main/java/com/jforge/migrated/${className}.java`;
    generatedFiles.push({ name: targetPath, content: convertedJava });

    const hasUnsupported = compat.status === 'has_unsupported';
    if (hasUnsupported) {
      manualInterventionRequired.push({
        file: file.path,
        reason: compat.summary,
      });
    }

    migrationEntries.push({
      sourcePath: file.path,
      targetPath,
      className,
      isEntrypoint,
      compatibilityStatus: compat.status,
      internalImports: internalRefs,
      externalDependencies: deps.filter((d) => !moduleNames.has(d.pythonPkg)),
    });
  }

  if (generatedFiles.length > 0) {
    generatedFiles.unshift({
      name: 'pom.xml',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.jforge</groupId>
  <artifactId>migrated-project</artifactId>
  <version>1.0.0</version>
  <properties>
    <maven.compiler.source>${javaVer}</maven.compiler.source>
    <maven.compiler.target>${javaVer}</maven.compiler.target>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>
</project>
`,
    });
  }

  return Response.json(
    {
      ok: true,
      javaVersion: `Java ${javaVer} LTS`,
      plan: {
        totalFiles: projectFiles.length,
        pythonModules: migrationEntries.length,
        entrypoints: migrationEntries.filter((e) => e.isEntrypoint).map((e) => e.sourcePath),
        importGraph,
        manualInterventionRequired,
      },
      modules: migrationEntries,
      generatedFiles,
    },
    { status: 200 }
  );
}
