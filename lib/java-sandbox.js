/**
 * Real Java Execution Sandbox using OpenJDK 21 via Wandbox compile & run API.
 */

const WANDBOX_URL = 'https://wandbox.org/api/compile.json';
const DEFAULT_COMPILER = 'openjdk-jdk-21+35';

/**
 * Normalizes generated Java code for single-file execution in Wandbox (prog.java):
 * removes `package ...;` declarations and converts `public class` to package-private `class`
 * so `javac prog.java` succeeds regardless of class name.
 */
export function prepareJavaForSandbox(javaCode) {
  if (typeof javaCode !== 'string') return '';
  return javaCode
    .replace(/^\s*package\s+[a-zA-Z0-9_.]+\s*;\s*\n?/gm, '')
    .replace(/\bpublic\s+(final\s+|abstract\s+)?class\s+/g, '$1class ')
    .trim();
}

export async function runJavaInSandbox(javaCode, { fetchImpl = fetch, timeoutMs = 12000 } = {}) {
  const prepared = prepareJavaForSandbox(javaCode);
  if (!prepared) {
    return {
      ok: false,
      exitCode: 1,
      stdout: '',
      stderr: '',
      compilerError: 'Java code is empty.',
      compiler: 'OpenJDK 21',
      executionTimeMs: 0,
    };
  }

  const start = performance.now();
  try {
    const res = await fetchImpl(WANDBOX_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compiler: DEFAULT_COMPILER,
        code: prepared,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    const elapsed = Math.max(1, Math.round(performance.now() - start));
    if (!res.ok) {
      return {
        ok: false,
        exitCode: 1,
        stdout: '',
        stderr: '',
        compilerError: `Sandbox service returned HTTP ${res.status}`,
        compiler: 'OpenJDK 21',
        executionTimeMs: elapsed,
      };
    }

    const data = await res.json();
    const exitCode = Number.parseInt(data.status ?? '0', 10);
    const compilerError = (data.compiler_error || data.compiler_message || '').trim();
    const stdout = (data.program_output || '').trimEnd();
    const stderr = (data.program_error || '').trimEnd();

    return {
      ok: exitCode === 0 && !compilerError,
      exitCode: Number.isNaN(exitCode) ? 1 : exitCode,
      stdout,
      stderr,
      compilerError,
      compiler: 'OpenJDK 21 (Sandbox)',
      executionTimeMs: elapsed,
    };
  } catch (err) {
    const elapsed = Math.max(1, Math.round(performance.now() - start));
    return {
      ok: false,
      exitCode: 1,
      stdout: '',
      stderr: '',
      compilerError: err?.name === 'TimeoutError'
        ? 'Java sandbox execution timed out (12s limit).'
        : `Sandbox unreachable: ${err?.message || 'Unknown error'}`,
      compiler: 'OpenJDK 21',
      executionTimeMs: elapsed,
    };
  }
}
