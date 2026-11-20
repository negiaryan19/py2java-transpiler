'use client';

import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight, Layers, Cpu, ShieldAlert, Sparkles } from 'lucide-react';

/**
 * ExplanationDrawer Component
 *
 * Fixed slide-over drawer triggered when hovering or selecting an aligned AST node pair.
 * Breaks down cross-language semantics across:
 * - 🔷 Type System
 * - 🧠 Memory Model (CPython vs JVM GC)
 * - ⚠️ Runtime & Compile-time Safety
 *
 * @param {Object} props
 * @param {Object|null} props.activeExplanation
 * @param {() => void} props.onClose
 */
export default function ExplanationDrawer({ activeExplanation, onClose }) {
  const [openSections, setOpenSections] = useState({
    typeSystem: true,
    memory: true,
    safety: true,
  });

  if (!activeExplanation) {
    return (
      <div
        className="fixed top-0 right-0 h-full w-96 max-w-[90vw] bg-slate-900/95 border-l border-slate-800 shadow-2xl z-50 transform translate-x-full transition-transform duration-300 ease-in-out pointer-events-none"
        aria-hidden="true"
      />
    );
  }

  const {
    pythonText = '',
    javaText = '',
    confidence = 'exact',
    color = 'green',
    explanation = {},
  } = activeExplanation;

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Badge styling based on color
  let badgeClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
  let badgeLabel = '🟢 Exact Conversion';
  if (color === 'purple' || confidence === 'inferred') {
    badgeClass = 'bg-purple-500/20 text-purple-400 border-purple-500/40';
    badgeLabel = '🟣 Inferred Type';
  } else if (color === 'amber' || confidence === 'healed') {
    badgeClass = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    badgeLabel = '🟡 Self-Healed Syntax';
  }

  return (
    <aside
      className="fixed top-0 right-0 h-full w-96 max-w-[92vw] bg-slate-900 border-l border-slate-800 shadow-2xl z-50 transform translate-x-0 transition-transform duration-300 ease-in-out flex flex-col font-sans text-slate-100 overflow-hidden"
      role="dialog"
      aria-label="AST Node Alignment Details"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400 font-bold">
              AST Type Alignment
            </span>
          </div>
          <div className="flex items-baseline gap-2 font-mono text-sm font-bold text-slate-100 break-words">
            <span className="text-sky-300">{pythonText}</span>
            <span className="text-slate-500">→</span>
            <span className="text-emerald-300">{javaText}</span>
          </div>
          <div className="pt-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${badgeClass}`}
            >
              {badgeLabel}
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close explanation drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body: 3 Expandable Sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-xs">
        {/* Section 1: Type System */}
        <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
          <button
            onClick={() => toggleSection('typeSystem')}
            className="w-full flex items-center justify-between p-3 text-left font-semibold text-slate-200 hover:bg-slate-800/50 transition-colors"
          >
            <span className="flex items-center gap-2 text-sky-400">
              <Layers className="w-4 h-4" />
              <span>🔷 Type System</span>
            </span>
            {openSections.typeSystem ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {openSections.typeSystem && (
            <div className="p-3 pt-0 border-t border-slate-800/60 text-slate-300 leading-relaxed">
              {explanation.type_system ||
                'Translates Python dynamic syntactic annotations into strong JVM static type bindings.'}
            </div>
          )}
        </div>

        {/* Section 2: Memory Model */}
        <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
          <button
            onClick={() => toggleSection('memory')}
            className="w-full flex items-center justify-between p-3 text-left font-semibold text-slate-200 hover:bg-slate-800/50 transition-colors"
          >
            <span className="flex items-center gap-2 text-purple-400">
              <Cpu className="w-4 h-4" />
              <span>🧠 Memory Model</span>
            </span>
            {openSections.memory ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {openSections.memory && (
            <div className="p-3 pt-0 border-t border-slate-800/60 text-slate-300 leading-relaxed">
              {explanation.memory ||
                'CPython reference-counted pointers converted to JVM generational garbage collected heap objects.'}
            </div>
          )}
        </div>

        {/* Section 3: Safety Invariants */}
        <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
          <button
            onClick={() => toggleSection('safety')}
            className="w-full flex items-center justify-between p-3 text-left font-semibold text-slate-200 hover:bg-slate-800/50 transition-colors"
          >
            <span className="flex items-center gap-2 text-amber-400">
              <ShieldAlert className="w-4 h-4" />
              <span>⚠️ Safety & Invariants</span>
            </span>
            {openSections.safety ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {openSections.safety && (
            <div className="p-3 pt-0 border-t border-slate-800/60 text-slate-300 leading-relaxed">
              {explanation.safety ||
                'Compile-time type verification eliminates dynamic attribute lookup and TypeError crashes at runtime.'}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>J-Forge Cross-AST Aligner</span>
        <button
          onClick={onClose}
          className="text-sky-400 hover:text-sky-300 underline cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    </aside>
  );
}
