'use client';

import React, { useMemo } from 'react';
import { ArrowRightLeft, ArrowRight, Sparkles } from 'lucide-react';

export default function AstTypeBar({ pythonCode, selectedRule, onSelectRule }) {
  const astRules = useMemo(() => {
    const rules = [];
    if (/class\s+\w+/.test(pythonCode)) {
      rules.push({ py: 'class / __init__', java: 'public static class + Constructor', desc: 'Encapsulated OOP class with private fields and constructor initialization' });
    }
    if (/def\s+\w+/.test(pythonCode)) {
      rules.push({ py: 'def func()', java: 'public static Method', desc: 'Static class method with typed parameter signature' });
    }
    if (/list\[|\[.*for.*in.*\]|list\(/.test(pythonCode)) {
      rules.push({ py: 'list[T]', java: 'List<T> / ArrayList<>', desc: 'Dynamic growable list to static java.util.ArrayList collection' });
    }
    if (/dict\[|\{.*:.*\}|dict\(/.test(pythonCode)) {
      rules.push({ py: 'dict[K, V]', java: 'Map<K, V> / HashMap<>', desc: 'Hash-table key-value dictionary to java.util.LinkedHashMap' });
    }
    if (/set\[|set\(/.test(pythonCode)) {
      rules.push({ py: 'set[T]', java: 'Set<T> / HashSet<>', desc: 'Unique element set collection to java.util.HashSet' });
    }
    if (/for\s+\w+\s+in\s+range\(/.test(pythonCode)) {
      rules.push({ py: 'for i in range(N)', java: 'for (int i = 0; i < N; i++)', desc: 'Python range() generator translated into static index-bound for-loop' });
    }
    if (/f["']/.test(pythonCode)) {
      rules.push({ py: 'f-string', java: 'String.format() / "+"', desc: 'Python f-string interpolation translated into Java string concatenation' });
    }
    if (/ValueError/.test(pythonCode)) {
      rules.push({ py: 'ValueError', java: 'IllegalArgumentException', desc: 'Python runtime ValueError mapped to java.lang.IllegalArgumentException' });
    }
    if (/\.get\(/.test(pythonCode)) {
      rules.push({ py: 'dict.get(k, d)', java: 'Map.getOrDefault(k, d)', desc: 'Dictionary safe key lookup mapped to Map.getOrDefault()' });
    }
    if (/if\s+__name__\s*==/.test(pythonCode)) {
      rules.push({ py: '__main__ guard', java: 'public static void main(String[] args)', desc: 'Main script execution guard converted to standard JVM entry point' });
    }

    if (rules.length === 0) {
      rules.push({ py: 'Dynamic Python AST', java: 'Static Java 17 Class Wrapper', desc: 'Encapsulates free statements into Solution.main() entry point' });
    }
    return rules;
  }, [pythonCode]);

  return (
    <div className="t-surface px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="text-[11px] font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-500" />
          <span>AST Syntax Mappings:</span>
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {astRules.map((rule, idx) => {
            const isSelected = selectedRule?.py === rule.py;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectRule && onSelectRule(isSelected ? null : rule)}
                className={`text-[11px] font-mono px-2.5 py-0.5 rounded cursor-pointer transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-emerald-500 text-black font-bold border-emerald-400 shadow-xs'
                    : 't-subtle border-black/10 dark:border-white/10 hover:border-emerald-500'
                }`}
                title={rule.desc}
              >
                <span className="opacity-80">{rule.py}</span>
                <ArrowRight className={`w-2.5 h-2.5 ${isSelected ? 'text-black' : 'text-emerald-500'}`} />
                <span className="font-semibold">{rule.java}</span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedRule && (
        <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          <span>{selectedRule.desc}</span>
        </div>
      )}
    </div>
  );
}
