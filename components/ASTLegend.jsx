'use client';

import React from 'react';

/**
 * ASTLegend Component
 *
 * Displays visual confidence badge indicators for cross-language AST alignments:
 * - 🟢 Exact Conversion (Green)
 * - 🟣 Inferred Type (Purple)
 * - 🟡 Self-Healed Syntax (Amber)
 *
 * @param {Object} props
 * @param {number} [props.exactCount=0]
 * @param {number} [props.inferredCount=0]
 * @param {number} [props.healedCount=0]
 * @param {number} [props.totalAlignments=0]
 */
export default function ASTLegend({
  exactCount = 0,
  inferredCount = 0,
  healedCount = 0,
  totalAlignments = 0,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-lg border border-slate-700/60 bg-slate-900/80 backdrop-blur-sm text-xs font-mono">
      <div className="flex flex-wrap items-center gap-4">
        {/* Exact Match Badge */}
        <div className="flex items-center gap-1.5" title="Strict 1:1 Type Mapping Match">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
          <span className="font-semibold text-emerald-400">🟢 Exact Conversion</span>
          {exactCount > 0 && (
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
              {exactCount}
            </span>
          )}
        </div>

        {/* Inferred Type Badge */}
        <div className="flex items-center gap-1.5" title="Structural or Closely Approximated Type Mapping">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50"></span>
          <span className="font-semibold text-purple-400">🟣 Inferred Type</span>
          {inferredCount > 0 && (
            <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px]">
              {inferredCount}
            </span>
          )}
        </div>

        {/* Self-Healed Syntax Badge */}
        <div className="flex items-center gap-1.5" title="Heuristically Repaired or Synthesized Construct">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
          <span className="font-semibold text-amber-400">🟡 Self-Healed Syntax</span>
          {healedCount > 0 && (
            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px]">
              {healedCount}
            </span>
          )}
        </div>
      </div>

      {totalAlignments > 0 && (
        <div className="text-slate-400 text-[11px]">
          <span className="font-bold text-slate-200">{totalAlignments}</span> AST Nodes Aligned
        </div>
      )}
    </div>
  );
}
