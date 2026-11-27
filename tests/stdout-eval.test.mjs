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
