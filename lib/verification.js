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

export async function verifyConversionBehavior({
  pythonCode,
  javaCode,
  stdin = '',
  testCases = null,
  fetchImpl = fetch,
}) {
  const normalizedCases =
    Array.isArray(testCases) && testCases.length > 0
      ? testCases.slice(0, 4).map((tc, i) => ({
          name: typeof tc?.name === 'string' && tc.name.trim() ? tc.name.trim().slice(0, 40) : `Case ${i + 1}`,
          stdin: typeof tc?.stdin === 'string' ? tc.stdin.slice(0, 1024) : '',
        }))
      : null;

  if (!normalizedCases) {
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
      cases: [
        {
          name: 'Default Run',
          stdin,
          pythonStdout: pyRes.stdout || '',
          javaStdout: javaRes.stdout || '',
          matched: verdict.outputMatch,
        },
      ],
    };
  }

  const caseResults = [];
  let firstPy = null;
  let firstJava = null;

  for (const tc of normalizedCases) {
    const [pyRes, javaRes] = await Promise.all([
      runPythonInSandbox(pythonCode, { stdin: tc.stdin, fetchImpl }),
      runJavaInSandbox(javaCode, { stdin: tc.stdin, fetchImpl }),
    ]);
    if (!firstPy) firstPy = pyRes;
    if (!firstJava) firstJava = javaRes;
    const verdict = classifyVerification(pyRes, javaRes);
    caseResults.push({
      name: tc.name,
      stdin: tc.stdin,
      pythonStdout: pyRes.stdout || '',
      javaStdout: javaRes.stdout || '',
      matched: verdict.outputMatch,
      status: verdict.status,
      compilerError: javaRes.compilerError || '',
    });
    if (verdict.status === 'compilation_failed' || verdict.status === 'inconclusive') {
      break;
    }
  }

  const baseVerdict = classifyVerification(firstPy, firstJava);
  if (baseVerdict.status === 'compilation_failed' || baseVerdict.status === 'inconclusive') {
    return {
      ok: true,
      ...baseVerdict,
      passedCases: 0,
      totalCases: normalizedCases.length,
      python: firstPy,
      java: firstJava,
      cases: caseResults,
    };
  }

  const passedCases = caseResults.filter((c) => c.matched).length;
  const totalCases = caseResults.length;
  const allMatch = passedCases === totalCases;

  return {
    ok: true,
    status: allMatch ? 'behavioral_match' : 'behavioral_mismatch',
    compilationPassed: true,
    pythonPassed: caseResults.every((c) => c.status !== 'execution_failed'),
    javaPassed: true,
    outputMatch: allMatch,
    passedCases,
    totalCases,
    summary: allMatch
      ? `All ${passedCases}/${totalCases} test case(s) compiled and matched.`
      : `${passedCases}/${totalCases} test case(s) matched; ${totalCases - passedCases} differed.`,
    python: firstPy,
    java: firstJava,
    cases: caseResults,
  };
}
