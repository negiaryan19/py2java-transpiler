import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePythonStdout } from '../lib/stdout-eval.js';

test('Stdout Evaluator: evaluates variables and arithmetic print(a+b) to 30', () => {
  const code = `a=10\nb=20\nprint(a+b)`;
  assert.deepEqual(evaluatePythonStdout(code), ['30']);
});

test('Stdout Evaluator: supports f-strings, multi-arg print, and augmented assignment', () => {
  const code = [
    'x = 5',
    'x += 7',
    'y = x * 2',
    'print("Sum:", x + y)',
    'print(f"Total={y - 4}")',
  ].join('\n');
  assert.deepEqual(evaluatePythonStdout(code), ['Sum: 36', 'Total=20']);
});

test('Stdout Evaluator: supports for-range loops and if/else blocks', () => {
  const code = [
    'n = 4',
    'for i in range(1, n):',
    '    if i % 2 == 0:',
    '        print(i, "even")',
    '    else:',
    '        print(i, "odd")',
  ].join('\n');
  assert.deepEqual(evaluatePythonStdout(code), ['1 odd', '2 even', '3 odd']);
});

test('Stdout Evaluator: handles input(), break, and for-else without throwing', () => {
  const code = [
    'num = int(input("Enter a number: "))',
    'if num < 2:',
    '    print("Not a prime number")',
    'else:',
    '    for i in range(2, int(num ** 0.5) + 1):',
    '        if num % i == 0:',
    '            print("Not a prime number")',
    '            break',
    '    else:',
    '        print("Prime number")',
  ].join('\n');
  assert.deepEqual(evaluatePythonStdout(code), ['Prime number']);
});

test('Stdout Evaluator: evaluates list comprehensions with filter condition', () => {
  const code = [
    'numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]',
    'squares = [x**2 for x in numbers if x % 2 == 0]',
    'print(squares)',
  ].join('\n');
  assert.deepEqual(evaluatePythonStdout(code), ['[4, 16, 36, 64, 100]']);
});
