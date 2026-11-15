import test from 'node:test';
import assert from 'node:assert/strict';
import { deterministicAstFallback } from '../lib/gemini.js';

test('AST Engine: Transpiles for-range loop (single arg range(10))', () => {
  const pyCode = 'for i in range(10):\n    print(i)';
  const javaCode = deterministicAstFallback(pyCode, 'Java 17 LTS');

  assert.ok(javaCode.includes('for (int i = 0; i < 10; i++) {'));
  assert.ok(javaCode.includes('System.out.println(i);'));
  assert.ok(javaCode.includes('public class Solution'));
  assert.ok(javaCode.includes('package com.jforge.ciap;'));
});

test('AST Engine: Transpiles for-range with start, stop, and step', () => {
  const pyCode = 'for k in range(1, 20, 2):\n    print(k)';
  const javaCode = deterministicAstFallback(pyCode, 'Java 17 LTS');

  assert.ok(javaCode.includes('for (int k = 1; k < 20; k += 2) {'));
  assert.ok(javaCode.includes('System.out.println(k);'));
});

test('AST Engine: Transpiles iterable for loop (for item in items)', () => {
  const pyCode = 'items = [10, 20, 30]\nfor item in items:\n    print(item)';
  const javaCode = deterministicAstFallback(pyCode, 'Java 17 LTS');

  assert.ok(javaCode.includes('for (var item : items) {'));
  assert.ok(javaCode.includes('System.out.println(item);'));
});

test('AST Engine: Transpiles while loop and conditionals', () => {
  const pyCode = 'count = 5\nwhile count > 0:\n    print(count)\n    count = count - 1';
  const javaCode = deterministicAstFallback(pyCode, 'Java 17 LTS');

  assert.ok(javaCode.includes('while (count > 0) {'));
  assert.ok(javaCode.includes('System.out.println(count);'));
});

test('AST Engine: Transpiles function definition and return', () => {
  const pyCode = 'def add(a: int, b: int) -> int:\n    return a + b';
  const javaCode = deterministicAstFallback(pyCode, 'Java 17 LTS');

  assert.ok(javaCode.includes('public static Object add('));
  assert.ok(javaCode.includes('return a + b;'));
});
