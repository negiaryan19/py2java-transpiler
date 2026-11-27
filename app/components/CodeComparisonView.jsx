'use client';

import React, { useMemo, useState } from 'react';
import { Code2, Sparkles, CheckCircle2, Layers, Cpu, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { TYPE_MAP } from '../../lib/type-mapping';

const SYNTAX_RULES = [
  {
    test: (py) => /\bfor\s+\w+\s+in\s+range\s*\(/.test(py),
    py: 'for i in range(...)',
    java: 'for (int i = 0; i < n; i++)',
    confidence: 'exact',
    reason: 'Python range iterator lowers to a zero-overhead JVM primitive integer counter loop.',
    memory: 'Stack-allocated primitive int loop variable instead of heap iterator objects.',
    safety: 'Loop bounds checked at runtime with deterministic termination.',
  },
  {
    test: (py) => /\[.+?\s+for\s+\w+\s+in\s+.+?\]/.test(py),
    py: '[expr for x in items]',
    java: 'items.stream()...toList()',
    confidence: 'inferred',
    reason: 'Python list comprehension transforms into a declarative Java Stream pipeline.',
    memory: 'Lazy stream stages fused in JVM before allocating immutable/list collection.',
    safety: 'Lambda parameter and return types statically checked at compile time.',
  },
  {
    test: (py) => /\bprint\s*\(/.test(py),
    py: 'print(...)',
    java: 'System.out.println(...)',
    confidence: 'exact',
    reason: 'Python stdout print function maps to Java PrintStream println on System.out.',
    memory: 'Buffered byte output written via JVM PrintStream without extra string list copies.',
    safety: 'Automatically invokes String.valueOf / toString safely on null and primitive values.',
  },
  {
    test: (py) => /\bdef\s+\w+\s*\(/.test(py),
    py: 'def fn(...):',
    java: 'public static ... fn(...)',
    confidence: 'inferred',
    reason: 'Top-level Python function maps to a static typed method inside class Solution.',
    memory: 'Compiled to a static JVM method frame callable without instantiating Solution.',
    safety: 'Parameter count and return types enforced strictly at compile time.',
  },
  {
    test: (py) => /\binput\s*\(/.test(py),
    py: 'input(...)',
    java: 'new Scanner(System.in).nextLine()',
    confidence: 'inferred',
    reason: 'Interactive stdin reading maps to java.util.Scanner token/line reader.',
    memory: 'Scanner buffers System.in bytes rather than allocating intermediate Python strings.',
    safety: 'Requires explicit parsing (Integer.parseInt) instead of dynamic eval.',
  },
  {
    test: (py) => /\bwhile\s+.+:/.test(py),
    py: 'while cond:',
    java: 'while (cond) { ... }',
    confidence: 'exact',
    reason: 'Indentation-delimited loop maps to brace-scoped Java while loop.',
    memory: 'Identical stack-frame execution with JVM JIT loop unrolling.',
    safety: 'Java enforces a strict boolean condition expression (no truthy ints).',
  },
  {
    test: (py) => /^\s*if\s+.+:/m.test(py),
    py: 'if / elif / else',
    java: 'if / else if / else',
    confidence: 'exact',
    reason: 'Conditional branches map directly using parenthesized boolean predicates.',
    memory: 'Direct JVM bytecode branching instructions (ifeq/ifne).',
    safety: 'Parentheses and braces eliminate indentation ambiguity.',
  },
  {
    test: (py) => /\bclass\s+\w+/.test(py),
    py: 'class Model:',
    java: 'public class / record Model',
    confidence: 'healed',
    reason: 'Python class definition translates to a strongly typed Java class or Java 17 record.',
    memory: 'JVM compressed object header + contiguous typed fields replace PyObject __dict__.',
    safety: 'Field access is resolved statically at compile time.',
  },
];

export default function CodeComparisonView({
  pythonCode = '',
  javaCode = '',
  onEditPython,
  onRunConvert,
  isTranspiling = false,
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const mappings = useMemo(() => {
    const found = [];
    const py = pythonCode || '';

    for (const rule of SYNTAX_RULES) {
      if (rule.test(py)) {
        found.push(rule);
      }
    }

    for (const [pyKey, entry] of Object.entries(TYPE_MAP)) {
      if (py.includes(pyKey)) {
        found.push({
          py: pyKey,
          java: entry.java,
          confidence: pyKey.includes('Optional') || pyKey.includes('BaseModel') ? 'healed' : 'exact',
          reason: entry.reason,
          memory: entry.memory,
          safety: entry.safety,
        });
      }
    }

    if (found.length === 0 && py.trim()) {
      found.push({
        py: 'Dynamic Python Script',
        java: 'public class Solution',
        confidence: 'inferred',
        reason: 'Dynamic top-level statements are wrapped inside a type-safe Java main() entrypoint.',
        memory: 'CPython reference-counted objects move to stack primitives and JVM G1 GC heap.',
        safety: 'Static declarations prevent runtime NameError and implicit type coercion bugs.',
      });
    }
    return found;
  }, [pythonCode]);

  const activeMapping = mappings[selectedIdx] || mappings[0] || null;
  const pyLines = (pythonCode || '').split('\n');
  const javaLines = (javaCode || '').split('\n');

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="t-surface p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight heading-font flex items-center gap-2">
            <Code2 className="w-4 h-4 text-emerald-500" />
            <span>Code Comparison</span>
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Side-by-side view of your Python source and generated Java code with line and construct explanations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 t-subtle flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{mappings.length} constructs matched</span>
          </span>
          {onRunConvert && (
            <button
              onClick={onRunConvert}
              disabled={isTranspiling}
              className="t-btn-primary px-3.5 py-1.5 text-xs font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTranspiling ? 'animate-spin' : ''}`} />
              <span>{isTranspiling ? 'Updating...' : 'Refresh Comparison'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Construct Mapping Pills */}
      {mappings.length > 0 && (
        <div className="t-surface p-3.5 space-y-2.5">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Click any construct to inspect how Python converted to Java
          </p>
          <div className="flex flex-wrap gap-2">
            {mappings.map((m, idx) => {
              const isSelected = idx === (selectedIdx < mappings.length ? selectedIdx : 0);
              return (
                <button
                  key={`${m.py}-${idx}`}
                  onClick={() => setSelectedIdx(idx)}
                  className={`px-2.5 py-1.5 text-xs font-mono flex items-center gap-1.5 cursor-pointer transition ${
                    isSelected ? 't-btn-primary' : 't-btn-secondary'
                  }`}
                >
                  <span className="font-semibold">{m.py}</span>
                  <ArrowRight className="w-3 h-3 opacity-70" />
                  <span>{m.java}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Construct Explanation Card */}
      {activeMapping && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="t-surface p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-sky-600">
              <Layers className="w-3.5 h-3.5" />
              <span>Type & Syntax Mapping</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {activeMapping.reason}
            </p>
          </div>

          <div className="t-surface p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-purple-600">
              <Cpu className="w-3.5 h-3.5" />
              <span>Memory Model (Python → JVM)</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {activeMapping.memory}
            </p>
          </div>

          <div className="t-surface p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-600">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Compile-Time Safety</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {activeMapping.safety}
            </p>
          </div>
        </div>
      )}

      {/* Side-by-Side Code Panes (Matches Converter Studio Look) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Python Pane */}
        <div className="t-surface overflow-hidden flex flex-col h-[420px]">
          <div
            className="px-3.5 py-2.5 t-border-b flex items-center justify-between"
            style={{ backgroundColor: 'var(--bg-subtle)' }}
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] inline-block border border-black/10"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] inline-block border border-black/10"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] inline-block border border-black/10"></span>
              </div>
              <span className="font-mono text-xs font-semibold ml-1">Python Source</span>
            </div>
            <span className="text-[11px] font-mono" style={{ color: 'var(--text-secondary)' }}>
              {pyLines.length} lines
            </span>
          </div>
          {onEditPython ? (
            <textarea
              value={pythonCode}
              onChange={(e) => onEditPython(e.target.value)}
              spellCheck={false}
              className="editor-area flex-1 p-3.5 font-mono text-xs focus:outline-none resize-none overflow-y-auto"
            />
          ) : (
            <pre
              className="flex-1 p-3.5 font-mono text-xs overflow-auto leading-relaxed"
              style={{ backgroundColor: 'var(--bg-editor)', color: 'var(--code-py)' }}
            >
              {pythonCode}
            </pre>
          )}
        </div>

        {/* Java Pane */}
        <div className="t-surface overflow-hidden flex flex-col h-[420px]">
          <div
            className="px-3.5 py-2.5 t-border-b flex items-center justify-between"
            style={{ backgroundColor: 'var(--bg-subtle)' }}
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] inline-block border border-black/10"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] inline-block border border-black/10"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] inline-block border border-black/10"></span>
              </div>
              <span className="font-mono text-xs font-semibold ml-1">Java Output</span>
            </div>
            <span className="text-[11px] font-mono flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
              <Sparkles className="w-3 h-3 text-emerald-500" />
              <span>{javaLines.length} lines</span>
            </span>
          </div>
          <pre
            className="flex-1 p-3.5 font-mono text-xs overflow-auto leading-relaxed"
            style={{ backgroundColor: 'var(--bg-editor)', color: 'var(--code-java)' }}
          >
            {javaCode}
          </pre>
        </div>
      </div>
    </div>
  );
}
