/**
 * Deterministic JUnit 5 test suite generator grounded in verified execution outputs
 * and Java Solution class structure.
 */

function escapeJavaString(str) {
  return String(str || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
}

export function generateJUnitTestSuite({ javaCode = '', verificationReport = null }) {
  const pkgMatch = javaCode.match(/^\s*package\s+([\w.]+)\s*;/m);
  const pkg = pkgMatch ? pkgMatch[1] : 'com.jforge.ciap';
  const clsMatch = javaCode.match(/\bpublic\s+class\s+([A-Z]\w*)/);
  const className = clsMatch ? clsMatch[1] : 'Solution';

  const cases = Array.isArray(verificationReport?.cases) && verificationReport.cases.length > 0
    ? verificationReport.cases
    : verificationReport?.python
    ? [
        {
          name: 'VerifiedCase1',
          stdin: '',
          pythonStdout: verificationReport.python.stdout || '',
          matched: Boolean(verificationReport.outputMatch),
        },
      ]
    : [];

  const testMethods = [];
  if (cases.length > 0) {
    cases.forEach((tc, idx) => {
      const methodSuffix = String(tc.name || `Case${idx + 1}`).replace(/[^a-zA-Z0-9_]/g, '') || `Case${idx + 1}`;
      const expected = escapeJavaString(String(tc.pythonStdout || '').trim());
      const stdinVal = escapeJavaString(String(tc.stdin || ''));

      testMethods.push(`    @Test
    @DisplayName("${escapeJavaString(tc.name || `Case ${idx + 1}`)}")
    void test${methodSuffix}_${idx + 1}() {
        ByteArrayOutputStream outBuf = new ByteArrayOutputStream();
        PrintStream origOut = System.out;
        java.io.InputStream origIn = System.in;
        try {
            System.setOut(new PrintStream(outBuf));
            System.setIn(new ByteArrayInputStream("${stdinVal}".getBytes(StandardCharsets.UTF_8)));
            ${className}.main(new String[0]);
            String actual = outBuf.toString(StandardCharsets.UTF_8).replace("\\r\\n", "\\n").trim();
            assertEquals("${expected}", actual);
        } finally {
            System.setOut(origOut);
            System.setIn(origIn);
        }
    }`);
    });
  } else {
    testMethods.push(`    @Test
    @DisplayName("Main executes without uncaught exception")
    void testMainExecutesSafely() {
        assertDoesNotThrow(() -> ${className}.main(new String[0]));
    }`);
  }

  return `package ${pkg};

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

public class ${className}Test {

${testMethods.join('\n\n')}
}
`;
}
