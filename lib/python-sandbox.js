/**
 * Real Python 3 Execution Sandbox using CPython 3.13 via isolated Wandbox runtime.
 */

const WANDBOX_URL = 'https://wandbox.org/api/compile.json';
const PYTHON_COMPILER = 'cpython-3.13.18';

export async function runPythonInSandbox(pythonCode, { stdin = '', fetchImpl = fetch, timeoutMs = 15000 } = {}) {
  if (typeof pythonCode !== 'string' || !pythonCode.trim()) {
    return {
      ok: false,
      exitCode: 1,
      stdout: '',
      stderr: 'Python code is empty.',
      sandboxUnavailable: false,
      runtime: 'CPython 3.13',
      executionTimeMs: 0,
    };
  }

  const start = performance.now();
  try {
    const res = await fetchImpl(WANDBOX_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compiler: PYTHON_COMPILER,
        code: pythonCode,
        ...(typeof stdin === 'string' && stdin.length > 0 ? { stdin } : {}),
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    const elapsed = Math.max(1, Math.round(performance.now() - start));
    if (!res.ok) {
      return {
        ok: false,
        exitCode: 1,
        stdout: '',
        stderr: `Python sandbox service returned HTTP ${res.status}`,
        sandboxUnavailable: true,
        runtime: 'CPython 3.13',
        executionTimeMs: elapsed,
      };
    }

    const data = await res.json();
    const exitCode = Number.parseInt(data.status ?? '0', 10);
    const stdout = (data.program_output || '').trimEnd();
    const stderr = (data.program_error || data.compiler_error || '').trimEnd();

    return {
      ok: exitCode === 0,
      exitCode: Number.isNaN(exitCode) ? 1 : exitCode,
      stdout,
      stderr,
      sandboxUnavailable: false,
      runtime: 'CPython 3.13 (Sandbox)',
      executionTimeMs: elapsed,
    };
  } catch (err) {
    const elapsed = Math.max(1, Math.round(performance.now() - start));
    return {
      ok: false,
      exitCode: 1,
      stdout: '',
      stderr: err?.name === 'TimeoutError'
        ? 'Python sandbox execution timed out (15s limit).'
        : `Python sandbox unreachable: ${err?.message || 'Unknown error'}`,
      sandboxUnavailable: true,
      runtime: 'CPython 3.13',
      executionTimeMs: elapsed,
    };
  }
}
