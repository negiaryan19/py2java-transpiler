'use client';

import React, { useMemo } from 'react';
import { ArrowRightLeft, ArrowRight } from 'lucide-react';

export default function AstTypeBar({ pythonCode }) {
  const astRules = useMemo(() => {
    const rules = [];
    if (/class\s+\w+/.test(pythonCode)) {
      rules.push({ py: 'class / __init__', java: 'public static class + Constructor' });
    }
    if (/def\s+\w+/.test(pythonCode)) {
      rules.push({ py: 'def func()', java: 'public static Method' });
    }
    if (/list\[|\[.*for.*in.*\]/.test(pythonCode)) {
      rules.push({ py: 'list[T]', java: 'List<T> / ArrayList<>' });
    }
    if (/dict\[|\{.*:.*\}/.test(pythonCode)) {
      rules.push({ py: 'dict[K, V]', java: 'Map<K, V> / HashMap<>' });
    }
    if (/set\[|set\(/.test(pythonCode)) {
      rules.push({ py: 'set[T]', java: 'Set<T> / HashSet<>' });
    }
    if (/f["']/.test(pythonCode)) {
      rules.push({ py: 'f-string', java: 'String.format()' });
    }
    if (/ValueError/.test(pythonCode)) {
      rules.push({ py: 'ValueError', java: 'IllegalArgumentException' });
    }
    if (/\.get\(/.test(pythonCode)) {
      rules.push({ py: 'dict.get(k, d)', java: 'Map.getOrDefault(k, d)' });
    }
    if (/if\s+__name__\s*==/.test(pythonCode)) {
      rules.push({ py: '__main__ guard', java: 'public static void main(String[] args)' });
    }

    if (rules.length === 0) {
      rules.push({ py: 'Dynamic Python AST', java: 'Static Java 17 Class Wrapper' });
    }
    return rules;
  }, [pythonCode]);

  return (
    <div className="t-surface px-4 py-2.5 flex flex-wrap items-center gap-2">
      <span
        className="text-[11px] font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-500" />
        <span>AST Type & Syntax Mappings:</span>
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {astRules.map((rule, idx) => (
          <span key={idx} className="text-[11px] font-mono px-2.5 py-0.5 t-subtle flex items-center gap-1.5">
            <span className="opacity-75">{rule.py}</span>
            <ArrowRight className="w-2.5 h-2.5 text-emerald-500" />
            <span className="font-semibold">{rule.java}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
