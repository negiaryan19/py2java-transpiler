import test from 'node:test';
import assert from 'node:assert/strict';
import { deterministicAstFallback } from '../lib/gemini.js';
import { analyzeJavaSyntax } from '../lib/self-healing.js';
import { analyzePythonCompatibility } from '../lib/compatibility.js';

export const BENCHMARK_100_CASES = [
  // 1. Basic syntax & print/comments (1-6)
  { id: 1, category: 'Basic Syntax', code: '# simple greeting\nprint("Hello J-Forge")' },
  { id: 2, category: 'Basic Syntax', code: 'x = 10\ny = 20\nprint(x)' },
  { id: 3, category: 'Basic Syntax', code: 'msg = "ready"\nprint(msg)\nprint("done")' },
  { id: 4, category: 'Basic Syntax', code: 'a = 1\nb = 2\nc = 3\nprint(a + b + c)' },
  { id: 5, category: 'Basic Syntax', code: 'flag = True\nprint(flag)' },
  { id: 6, category: 'Basic Syntax', code: 'pi = 3.14159\nprint(pi)' },

  // 2. Arithmetic & Math Semantics (7-14)
  { id: 7, category: 'Arithmetic', code: 'a = 7\nb = 2\nprint(a // b)\nprint(a % b)' },
  { id: 8, category: 'Arithmetic', code: 'x = 7 / 2\nprint(x)' },
  { id: 9, category: 'Arithmetic', code: 'n = -15\nprint(n + 20)' },
  { id: 10, category: 'Arithmetic', code: 'p = 2\nq = 5\nprint(p ** 3)' },
  { id: 11, category: 'Arithmetic', code: 'val = -7 // 2\nprint(val)' },
  { id: 12, category: 'Arithmetic', code: 'rem = -7 % 3\nprint(rem)' },
  { id: 13, category: 'Arithmetic', code: 'total = (10 + 5) * 3 - 4\nprint(total)' },
  { id: 14, category: 'Arithmetic', code: 'import math\nprint(math.sqrt(25))' },

  // 3. Conditionals & Boolean Logic (15-21)
  { id: 15, category: 'Conditionals', code: 'flag = True\nif flag and not False:\n    print("ok")' },
  { id: 16, category: 'Conditionals', code: 'val = None\nif val is None:\n    print("empty")' },
  { id: 17, category: 'Conditionals', code: 'item = "abc"\nif item is not None:\n    print(item)' },
  { id: 18, category: 'Conditionals', code: 'score = 85\nif score >= 90:\n    print("A")\nelif score >= 80:\n    print("B")\nelse:\n    print("C")' },
  { id: 19, category: 'Conditionals', code: 'x = 5\ny = 10\nif x > 0 or y > 0:\n    print("positive")' },
  { id: 20, category: 'Conditionals', code: 'a = 12\nif a % 2 == 0:\n    if a > 10:\n        print("big even")' },
  { id: 21, category: 'Conditionals', code: 'ready = False\nif not ready:\n    print("wait")' },

  // 4. Loops (22-30)
  { id: 22, category: 'Loops', code: 'for i in range(5):\n    print(i)' },
  { id: 23, category: 'Loops', code: 'for i in range(2, 6):\n    print(i)' },
  { id: 24, category: 'Loops', code: 'for k in range(1, 10, 2):\n    print(k)' },
  { id: 25, category: 'Loops', code: 'for k in range(10, 0, -2):\n    print(k)' },
  { id: 26, category: 'Loops', code: 'for i in range(1, 4):\n    for j in range(1, 4):\n        print(i * j)' },
  { id: 27, category: 'Loops', code: 'c = 3\nwhile c > 0:\n    print(c)\n    c = c - 1' },
  { id: 28, category: 'Loops', code: 'for i in range(10):\n    if i == 3:\n        continue\n    if i == 7:\n        break\n    print(i)' },
  { id: 29, category: 'Loops', code: 'items = [10, 20, 30]\nfor item in items:\n    print(item)' },
  { id: 30, category: 'Loops', code: 'while True:\n    print("once")\n    break' },

  // 5. Strings & F-Strings & Methods (31-39)
  { id: 31, category: 'Strings', code: 'name = "JForge"\nprint(f"Hello {name}")' },
  { id: 32, category: 'Strings', code: "s = 'python'\nprint(s.toUpperCase())" },
  { id: 33, category: 'Strings', code: 'text = "  hello  "\nprint(text)' },
  { id: 34, category: 'Strings', code: 'first = "Java"\nsecond = "21"\nprint(first + second)' },
  { id: 35, category: 'Strings', code: 'a = 4\nb = 5\nprint("sum", a + b)' },
  { id: 36, category: 'Strings', code: 'word = "abcdef"\nprint(len(word))' },
  { id: 37, category: 'Strings', code: 'line = "one,two,three"\nprint(line)' },
  { id: 38, category: 'Strings', code: 'city = "Tokyo"\npop = 14\nprint(f"{city}: {pop}")' },
  { id: 39, category: 'Strings', code: 'empty = ""\nif empty == "":\n    print("blank")' },

  // 6. Lists, Tuples, Sets & Comprehensions (40-48)
  { id: 40, category: 'Collections', code: 'nums = [1, 2, 3]\nnums.append(4)\nprint(nums)' },
  { id: 41, category: 'Collections', code: 'arr = [10, 20, 30]\nprint(len(arr))' },
  { id: 42, category: 'Collections', code: 'squares = [x * x for x in range(5)]\nprint(squares)' },
  { id: 43, category: 'Collections', code: 'evens = [x for x in nums if x % 2 == 0]\nprint(evens)' },
  { id: 44, category: 'Collections', code: 'pair = (10, 20)\nprint(pair)' },
  { id: 45, category: 'Collections', code: 'seen = set()\nseen.add(1)\nseen.add(2)\nprint(len(seen))' },
  { id: 46, category: 'Collections', code: 'names = ["alice", "bob", "carol"]\nfor n in names:\n    print(n)' },
  { id: 47, category: 'Collections', code: 'nums = [5, 2, 9, 1]\nprint(nums)' },
  { id: 48, category: 'Collections', code: 'matrix = [1, 2, 3, 4]\nprint(len(matrix))' },

  // 7. Dictionaries & Frequency Maps (49-55)
  { id: 49, category: 'Dictionaries', code: 'ages = {}\nprint(len(ages))' },
  { id: 50, category: 'Dictionaries', code: 'counts = {}\ncounts.put("a", 1)\nprint(counts)' },
  { id: 51, category: 'Dictionaries', code: 'scores = {}\nprint(scores.get("bob", 0))' },
  { id: 52, category: 'Dictionaries', code: 'cfg = {"env": "prod"}\nprint(cfg)' },
  { id: 53, category: 'Dictionaries', code: 'table = {}\nprint(table.containsKey("k"))' },
  { id: 54, category: 'Dictionaries', code: 'cache = {}\ncache.clear()\nprint(len(cache))' },
  { id: 55, category: 'Dictionaries', code: 'buckets = {}\nprint(buckets)' },

  // 8. Functions, Defaults & Recursion (56-63)
  { id: 56, category: 'Functions', code: 'def add(a: int, b: int) -> int:\n    return a + b' },
  { id: 57, category: 'Functions', code: 'def greet(name: str = "world"):\n    print(name)' },
  { id: 58, category: 'Functions', code: 'def fact(n: int) -> int:\n    if n <= 1:\n        return 1\n    return n * fact(n - 1)\nprint(fact(5))' },
  { id: 59, category: 'Functions', code: 'def fib(n: int) -> int:\n    if n <= 1:\n        return n\n    return fib(n - 1) + fib(n - 2)\nprint(fib(6))' },
  { id: 60, category: 'Functions', code: 'def gcd(a: int, b: int) -> int:\n    if b == 0:\n        return a\n    return gcd(b, a % b)\nprint(gcd(48, 18))' },
  { id: 61, category: 'Functions', code: 'def max_two(a: int, b: int) -> int:\n    if a > b:\n        return a\n    return b' },
  { id: 62, category: 'Functions', code: 'def noop():\n    pass' },
  { id: 63, category: 'Functions', code: 'def is_even(n: int) -> bool:\n    return n % 2 == 0' },

  // 9. OOP, Constructors, Inheritance, Polymorphism & Dataclasses (64-73)
  { id: 64, category: 'OOP', code: 'class Box:\n    def __init__(self, w: int):\n        self.w = w' },
  { id: 65, category: 'OOP', code: 'class Counter:\n    def __init__(self, val: int):\n        self.val = val\n    def inc(self) -> int:\n        return self.val + 1' },
  { id: 66, category: 'OOP', code: 'class Animal:\n    def speak(self):\n        print("sound")\nclass Dog(Animal):\n    def bark(self):\n        print("woof")' },
  { id: 67, category: 'OOP', code: 'class Base:\n    def greet(self):\n        return "hi"\nclass Sub(Base):\n    def greet(self):\n        return "hello"' },
  { id: 68, category: 'OOP', code: '@dataclass\nclass Point:\n    def __init__(self, x: int, y: int):\n        self.x = x\n        self.y = y' },
  { id: 69, category: 'OOP', code: 'class MathUtil:\n    @staticmethod\n    def square(x: int) -> int:\n        return x * x' },
  { id: 70, category: 'OOP', code: 'class Node:\n    def __init__(self, val: int):\n        self.val = val' },
  { id: 71, category: 'OOP', code: 'class User:\n    def label(self):\n        return "user"' },
  { id: 72, category: 'OOP', code: 'class Logger:\n    def log(self, msg: str):\n        print(msg)' },
  { id: 73, category: 'OOP', code: 'class Service:\n    def status(self):\n        return True' },

  // 10. Exception Handling (74-79)
  { id: 74, category: 'Exceptions', code: 'try:\n    res = 10 // 0\nexcept ZeroDivisionError:\n    print("div zero")\nfinally:\n    print("done")' },
  { id: 75, category: 'Exceptions', code: 'def check(n: int):\n    if n < 0:\n        raise ValueError("negative")' },
  { id: 76, category: 'Exceptions', code: 'try:\n    print("run")\nexcept Exception as e:\n    print("err")' },
  { id: 77, category: 'Exceptions', code: 'def parse_positive(x: int) -> int:\n    if x == 0:\n        raise RuntimeError("zero")\n    return x' },
  { id: 78, category: 'Exceptions', code: 'class CustomError(Exception):\n    pass' },
  { id: 79, category: 'Exceptions', code: 'try:\n    x = 1\nfinally:\n    print(x)' },

  // 11. Context Managers & Stdin I/O (80-83)
  { id: 80, category: 'I/O & Resources', code: 'raw = input()\nn = int(raw)\nprint(n * 2)' },
  { id: 81, category: 'I/O & Resources', code: 'n = int(input())\nprint(n + 1)' },
  { id: 82, category: 'I/O & Resources', code: 'line = input()\nprint(line)' },
  { id: 83, category: 'I/O & Resources', code: 'with open("data.txt") as f:\n    print("opened")' },

  // 12. Algorithms & Data Structures (84-91)
  { id: 84, category: 'DSA', code: 'def binary_search_step(mid: int) -> int:\n    return mid // 2' },
  { id: 85, category: 'DSA', code: 'stack = [1, 2]\nstack.append(3)\nprint(len(stack))' },
  { id: 86, category: 'DSA', code: 'total = 0\nfor i in range(1, 11):\n    total = total + i\nprint(total)' },
  { id: 87, category: 'DSA', code: 'def fib_iter(n: int) -> int:\n    a = 0\n    b = 1\n    for i in range(n):\n        temp = a + b\n        a = b\n        b = temp\n    return a' },
  { id: 88, category: 'DSA', code: 'def is_prime(n: int) -> bool:\n    if n < 2:\n        return False\n    for i in range(2, n):\n        if n % i == 0:\n            return False\n    return True' },
  { id: 89, category: 'DSA', code: 'def sum_list(nums) -> int:\n    s = 0\n    for x in nums:\n        s = s + x\n    return s' },
  { id: 90, category: 'DSA', code: 'def power(base: int, exp: int) -> int:\n    res = 1\n    for i in range(exp):\n        res = res * base\n    return res' },
  { id: 91, category: 'DSA', code: 'def count_down(n: int):\n    while n > 0:\n        print(n)\n        n = n - 1' },

  // 13. Numeric Edge Cases & Dynamic Typing (92-95)
  { id: 92, category: 'Edge Cases', code: 'x = None\nprint(x)' },
  { id: 93, category: 'Edge Cases', code: 'ratio = 1.0 / 3.0\nprint(ratio)' },
  { id: 94, category: 'Edge Cases', code: 'big = 1000000\nprint(big)' },
  { id: 95, category: 'Edge Cases', code: 'active = True\nif active:\n    x = 1\nelse:\n    x = 2\nprint(x)' },

  // 14. Lambdas & Dynamic/Unsupported Warnings (96-97)
  { id: 96, category: 'Lambdas & Functional', code: 'fn = lambda x: x * 2\nprint("lambda mapped")' },
  { id: 97, category: 'Unsupported Flagging', code: 'async def fetch():\n    yield 1\nres = eval("1+1")' },

  // 15. Enterprise Frameworks (98-100)
  { id: 98, category: 'Frameworks (Pydantic)', code: 'class OrderPayload(BaseModel):\n    order_id: int\n    amount: float' },
  { id: 99, category: 'Frameworks (FastAPI)', code: '@app.get("/health")\ndef health_check():\n    return "ok"' },
  { id: 100, category: 'Frameworks (Flask)', code: '@app.route("/ping")\ndef ping():\n    return "pong"' },
];

test('100-Case Benchmark Suite: structural AST validity across 15 Python-to-Java categories', () => {
  assert.equal(BENCHMARK_100_CASES.length, 100, 'Benchmark suite must contain exactly 100 distinct cases');

  const uniqueCategories = new Set(BENCHMARK_100_CASES.map((c) => c.category));
  assert.ok(uniqueCategories.size >= 14, `Expected >=14 distinct categories, got ${uniqueCategories.size}`);

  const failures = [];
  const leakedPythonConstructs = [];
  let validSyntaxCount = 0;

  for (const tc of BENCHMARK_100_CASES) {
    const javaOut = deterministicAstFallback(tc.code, 'Java 21 LTS');
    const syntax = analyzeJavaSyntax(javaOut);

    if (syntax.isValid) {
      validSyntaxCount += 1;
    } else {
      failures.push({ id: tc.id, category: tc.category, issues: syntax.issues });
    }

    // Strict check: ensure raw un-transpiled Python keywords/statements never leak directly into Java lines
    const nonCommentLines = javaOut
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('//') && !l.startsWith('*') && !l.startsWith('/*'));

    for (const line of nonCommentLines) {
      if (
        /^\s*(def\s+|elif\s+|except\b|finally:|with\s+.+:|\bpass;|@dataclass;|@staticmethod;)/.test(line) ||
        /\bvar\s+\w+\s*=\s*null;/.test(line) ||
        /\bis\s+null\b/.test(line) ||
        /^(import\s+(math|os|sys|json);|raise\s+\w+\()/.test(line)
      ) {
        leakedPythonConstructs.push({ id: tc.id, category: tc.category, line });
      }
    }
  }

  // Ensure unsupported constructs in case 97 are flagged accurately
  const compat97 = analyzePythonCompatibility(BENCHMARK_100_CASES.find((c) => c.id === 97).code);
  assert.equal(compat97.status, 'has_unsupported');

  console.log(
    JSON.stringify({
      benchmarkSuite: 'J-Forge 100-Case Python-to-Java Static AST Benchmark',
      totalCases: BENCHMARK_100_CASES.length,
      validSyntaxCount,
      syntaxFailureCount: failures.length,
      leakedPythonConstructCount: leakedPythonConstructs.length,
    })
  );

  assert.deepEqual(failures, [], `AST syntax failures: ${JSON.stringify(failures)}`);
  assert.deepEqual(
    leakedPythonConstructs,
    [],
    `Un-transpiled Python leaks found: ${JSON.stringify(leakedPythonConstructs)}`
  );
});
