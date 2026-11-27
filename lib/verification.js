import { runPythonInSandbox } from './python-sandbox.js';
import { runJavaInSandbox } from './java-sandbox.js';

/**
 * Evaluates behavioral equivalence between Python and generated Java
 * using real isolated CPython 3.13 and OpenJDK 21 runtimes.
 */
export function classifyVerification(pyRes, javaRes) {
  if (pyRes.sandboxUnavailable || javaRes.sandboxUnavailable) {
    return {
      status: 'inconclusive',
      compilationPassed: !javaRes.sandboxUnavailable && !javaRes.compilerError,
      pythonPassed: !pyRes.sandboxUnavailable && pyRes.ok,
      javaPassed: !javaRes.sandboxUnavailable && javaRes.ok,
      outputMatch: false,
      passedCases: 0,
      totalCases: 1,
      summary: 'Sandbox execution timed out or was unreachable. Verification is inconclusive.',
    };
  }

  const compilationPassed = !javaRes.compilerError;
  if (!compilationPassed) {
    return {
      status: 'compilation_failed',
      compilationPassed: false,
      pythonPassed: pyRes.ok,
      javaPassed: false,
      outputMatch: false,
      passedCases: 0,
      totalCases: 1,
      summary: 'Java compilation failed (javac reported errors).',
    };
  }

  if (!pyRes.ok || !javaRes.ok) {
    return {
      status: 'execution_failed',
      compilationPassed: true,
      pythonPassed: pyRes.ok,
      javaPassed: javaRes.ok,
      outputMatch: false,
      passedCases: 0,
      totalCases: 1,
      summary: !pyRes.ok
        ? `Python runtime failed (exit ${pyRes.exitCode}).`
        : `Java runtime failed (exit ${javaRes.exitCode}).`,
    };
  }

  const pyOut = (pyRes.stdout || '').trim();
  const javaOut = (javaRes.stdout || '').trim();
  const outputMatch = pyOut === javaOut && pyRes.exitCode === javaRes.exitCode;

  return {
    status: outputMatch ? 'behavioral_match' : 'behavioral_mismatch',
    compilationPassed: true,
    pythonPassed: true,
    javaPassed: true,
    outputMatch,
    passedCases: outputMatch ? 1 : 0,
    totalCases: 1,
    summary: outputMatch
      ? 'Compilation passed and real Python vs Java outputs match.'
      : 'Compilation passed, but Python and Java outputs differ.',
  };
}

export async function verifyConversionBehavior({ pythonCode, javaCode, stdin = '', fetchImpl = fetch }) {
  const [pyRes, javaRes] = await Promise.all([
    runPythonInSandbox(pythonCode, { stdin, fetchImpl }),
    runJavaInSandbox(javaCode, { stdin, fetchImpl }),
  ]);

  const verdict = classifyVerification(pyRes, javaRes);

  return {
    ok: true,
    ...verdict,
    python: pyRes,
    java: javaRes,
  };
}
