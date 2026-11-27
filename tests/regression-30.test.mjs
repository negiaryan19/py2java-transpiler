import test from 'node:test';
import assert from 'node:assert/strict';
import { deterministicAstFallback } from '../lib/gemini.js';
import { analyzeJavaSyntax } from '../lib/self-healing.js';
import { analyzePythonStaticStructure } from '../lib/explain.js';

export const BENCHMARK_30_CASES = [
  { id: 1, category: 'Arithmetic & Floor Div', code: 'a = 7\nb = 2\nprint(a // b)\nprint(a % b)' },
  { id: 2, category: 'True Float Division', code: 'x = 7 / 2\nprint(x)' },
  { id: 3, category: 'Negative Literals & Unary', code: 'n = -15\nprint(n + 20)' },
  { id: 4, category: 'Booleans & Logic', code: 'flag = True\nif flag and not False:\n    print("ok")' },
  { id: 5, category: 'None Null Handling', code: 'val = None\nif val is None:\n    print("empty")' },
  { id: 6, category: 'If / Elif / Else', code: 'score = 85\nif score >= 90:\n    print("A")\nelif score >= 80:\n    print("B")\nelse:\n    print("C")' },
  { id: 7, category: 'Single-Arg Range Loop', code: 'for i in range(5):\n    print(i)' },
  { id: 8, category: 'Step Range Loop', code: 'for k in range(1, 10, 2):\n    print(k)' },
  { id: 9, category: 'Nested Multiplication Loop', code: 'for i in range(1, 4):\n    for j in range(1, 4):\n        print(i * j)' },
  { id: 10, category: 'While Loop Counter', code: 'c = 3\nwhile c > 0:\n    print(c)\n    c -= 1' },
  { id: 11, category: 'Recursion Factorial', code: 'def fact(n: int) -> int:\n    if n <= 1:\n        return 1\n    return n * fact(n - 1)\nprint(fact(5))' },
  { id: 12, category: 'Recursion Fibonacci', code: 'def fib(n: int) -> int:\n    if n <= 1:\n        return n\n    return fib(n - 1) + fib(n - 2)\nprint(fib(6))' },
  { id: 13, category: 'Recursive GCD', code: 'def gcd(a: int, b: int) -> int:\n    if b == 0:\n        return a\n    return gcd(b, a % b)\nprint(gcd(48, 18))' },
  { id: 14, category: 'List & Append', code: 'nums = [1, 2, 3]\nnums.append(4)\nfor x in nums:\n    print(x)' },
  { id: 15, category: 'List Length', code: 'arr = [10, 20, 30]\nprint(len(arr))' },
  { id: 16, category: 'List Comprehension', code: 'squares = [x * x for x in range(5)]\nprint(squares)' },
  { id: 17, category: 'Tuple Pair', code: 'pair = (10, 20)\nprint(pair[0])' },
  { id: 18, category: 'Set Operations', code: 'seen = set()\nseen.add(1)\nseen.add(1)\nprint(len(seen))' },
  { id: 19, category: 'Dictionary Lookup', code: 'ages = {"alice": 30}\nprint(ages.get("bob", 0))' },
  { id: 20, category: 'Dictionary Frequency Loop', code: 'counts = {}\nfor ch in ["a", "b", "a"]:\n    counts[ch] = counts.get(ch, 0) + 1\nprint(counts)' },
  { id: 21, category: 'Strings & F-String', code: 'name = "JForge"\nprint(f"Hello {name}")' },
  { id: 22, category: 'Class Constructor OOP', code: 'class Box:\n    def __init__(self, w: int):\n        self.w = w' },
  { id: 23, category: 'Class With Method', code: 'class Counter:\n    def __init__(self, val: int):\n        self.val = val\n    def inc(self) -> int:\n        return self.val + 1' },
  { id: 24, category: 'Inheritance Hierarchy', code: 'class Animal:\n    def speak(self):\n        print("sound")\nclass Dog(Animal):\n    def bark(self):\n        print("woof")' },
  { id: 25, category: 'Polymorphism Override', code: 'class Base:\n    def greet(self):\n        return "hi"\nclass Sub(Base):\n    def greet(self):\n        return "hello"' },
  { id: 26, category: 'Try / Except / Finally', code: 'try:\n    res = 10 // 0\nexcept ZeroDivisionError:\n    print("div zero")\nfinally:\n    print("done")' },
  { id: 27, category: 'Raise Exception', code: 'def check(n: int):\n    if n < 0:\n        raise ValueError("negative")' },
  { id: 28, category: 'Lambda & Sorting', code: 'nums = [5, 2, 9, 1]\nfn = lambda x: x * 2\nprint(fn(4))' },
  { id: 29, category: 'Stdin Input & Int Parse', code: 'raw = input()\nn = int(raw)\nprint(n * 2)' },
  { id: 30, category: 'File I/O & Stdlib Math', code: 'import math\nwith open("data.txt") as f:\n    print(math.sqrt(16))' },
];

test('30-Case Representative Python-to-Java Conversion Benchmark (Deterministic Baseline)', () => {
  assert.equal(BENCHMARK_30_CASES.length, 30);

  let validJavaSyntaxCount = 0;
  let balancedBracesCount = 0;
  let packageWrapperCount = 0;
  const failures = [];
  const staticWarningsByCase = [];

  for (const item of BENCHMARK_30_CASES) {
    const javaOut = deterministicAstFallback(item.code, 'Java 17 LTS');
    const syntax = analyzeJavaSyntax(javaOut);
    const pyAnalysis = analyzePythonStaticStructure(item.code);

    const hasPackage = javaOut.includes('package com.jforge.ciap;');
    const hasSolutionClass = javaOut.includes('public class Solution');
    if (hasPackage && hasSolutionClass) packageWrapperCount += 1;
    if (syntax.braceDelta === 0) balancedBracesCount += 1;
    if (syntax.isValid) {
      validJavaSyntaxCount += 1;
    } else {
      failures.push({ id: item.id, category: item.category, errors: syntax.errors });
    }
    if (pyAnalysis.warnings?.length > 0) {
      staticWarningsByCase.push({ id: item.id, category: item.category, warnings: pyAnalysis.warnings });
    }
  }

  console.log(
    JSON.stringify({
      benchmarkSuite: 'J-Forge 30-Case Python-to-Java Deterministic Fallback Baseline',
      totalCases: BENCHMARK_30_CASES.length,
      packageWrapperCount,
      balancedBracesCount,
      validJavaSyntaxCount,
      syntaxFailureCount: failures.length,
      casesWithStaticCompatibilityWarnings: staticWarningsByCase.length,
    })
  );

  assert.equal(packageWrapperCount, 30, 'All 30 converted snippets should preserve com.jforge.ciap.Solution structure');
  assert.equal(balancedBracesCount, 30, 'All 30 converted snippets should have balanced braces');
  assert.equal(
    validJavaSyntaxCount,
    30,
    `Expected all 30 deterministic outputs to pass analyzeJavaSyntax; failed: ${JSON.stringify(failures)}`
  );
});
