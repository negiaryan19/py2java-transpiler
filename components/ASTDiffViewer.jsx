'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import ASTLegend from './ASTLegend.jsx';
import ExplanationDrawer from './ExplanationDrawer.jsx';

// Dynamically import Monaco Editor to avoid SSR window errors
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] flex items-center justify-center bg-slate-950 text-slate-400 font-mono text-xs">
      Loading Monaco Editor Engine...
    </div>
  ),
});

/**
 * ASTDiffViewer Component
 *
 * Side-by-side interactive Monaco code diff viewer for Python and Java AST nodes.
 * Features synchronized hover decorations, cross-language token linking,
 * and semantic architecture explanation drawer.
 *
 * @param {Object} props
 * @param {string} props.pythonCode - Source Python code
 * @param {string} props.javaCode - Transpiled Java code
 * @param {Array<Object>} [props.alignmentPairs=[]] - Aligned AST node pairs
 */
export default function ASTDiffViewer({
  pythonCode = '',
  javaCode = '',
  alignmentPairs = [],
}) {
  const [activeExplanation, setActiveExplanation] = useState(null);
  const [activePairId, setActivePairId] = useState(null);

  const pyEditorRef = useRef(null);
  const javaEditorRef = useRef(null);
  const monacoRef = useRef(null);
  const pairsRef = useRef(alignmentPairs);
  const hoverProviderRef = useRef(null);

  // Track decoration IDs for clean updates without stacking
  const pyDecorationsRef = useRef([]);
  const javaDecorationsRef = useRef([]);

  useEffect(() => {
    pairsRef.current = alignmentPairs;
    if (pyEditorRef.current) {
      pyDecorationsRef.current = pyEditorRef.current.deltaDecorations(pyDecorationsRef.current, []);
    }
    if (javaEditorRef.current) {
      javaDecorationsRef.current = javaEditorRef.current.deltaDecorations(javaDecorationsRef.current, []);
    }
  }, [alignmentPairs]);

  useEffect(() => {
    return () => {
      hoverProviderRef.current?.dispose();
    };
  }, []);

  const findPairAtPosition = useCallback((lineNumber, column) => {
    const targetLine = lineNumber - 1;
    const targetCol = column - 1;
    return pairsRef.current.find((pair) => {
      const r = pair?.python?.range;
      if (!r) return false;
      if (targetLine < r.startLine || targetLine > r.endLine) return false;
      if (targetLine === r.startLine && targetCol < r.startCol) return false;
      if (targetLine === r.endLine && targetCol > r.endCol) return false;
      return true;
    });
  }, []);

  // Calculate legend counters
  const exactCount = alignmentPairs.filter((p) => p.color === 'green').length;
  const inferredCount = alignmentPairs.filter((p) => p.color === 'purple').length;
  const healedCount = alignmentPairs.filter((p) => p.color === 'amber').length;

  /**
   * Highlights matching node ranges in both Monaco editors
   */
  const highlightPair = useCallback((pair) => {
    if (!pair) {
      if (pyEditorRef.current) {
        pyDecorationsRef.current = pyEditorRef.current.deltaDecorations(pyDecorationsRef.current, []);
      }
      if (javaEditorRef.current) {
        javaDecorationsRef.current = javaEditorRef.current.deltaDecorations(javaDecorationsRef.current, []);
      }
      setActivePairId(null);
      return;
    }

    setActivePairId(`${pair.python.id}_${pair.java.id}`);
    setActiveExplanation({
      pythonText: pair.python.text,
      javaText: pair.java.text,
      confidence: pair.confidence,
      color: pair.color,
      explanation: pair.explanation,
      pairsSnapshot: pairsRef.current,
    });

    const monaco = monacoRef.current;
    if (!monaco) return;

    // Convert 0-indexed tree-sitter range to 1-indexed Monaco Range
    const pyRange = new monaco.Range(
      pair.python.range.startLine + 1,
      pair.python.range.startCol + 1,
      pair.python.range.endLine + 1,
      pair.python.range.endCol + 1
    );

    const javaRange = new monaco.Range(
      pair.java.range.startLine + 1,
      pair.java.range.startCol + 1,
      pair.java.range.endLine + 1,
      pair.java.range.endCol + 1
    );

    // Apply Python decoration
    if (pyEditorRef.current) {
      pyDecorationsRef.current = pyEditorRef.current.deltaDecorations(
        pyDecorationsRef.current,
        [
          {
            range: pyRange,
            options: {
              inlineClassName: 'ast-python-active',
              isWholeLine: false,
            },
          },
        ]
      );
    }

    // Apply Java decoration matching confidence color
    if (javaEditorRef.current) {
      javaDecorationsRef.current = javaEditorRef.current.deltaDecorations(
        javaDecorationsRef.current,
        [
          {
            range: javaRange,
            options: {
              inlineClassName: `ast-java-active-${pair.color}`,
              isWholeLine: false,
            },
          },
        ]
      );
    }
  }, []);

  /**
   * Handle Python editor mount and register HoverProvider
   */
  const handlePythonEditorDidMount = (editor, monaco) => {
    pyEditorRef.current = editor;
    monacoRef.current = monaco;

    hoverProviderRef.current?.dispose();

    // Register hover provider reading latest pairsRef so async fetches & preset switches work
    hoverProviderRef.current = monaco.languages.registerHoverProvider('python', {
      provideHover: (_model, position) => {
        const matchedPair = findPairAtPosition(position.lineNumber, position.column);

        if (matchedPair) {
          highlightPair(matchedPair);

          return {
            range: new monaco.Range(
              matchedPair.python.range.startLine + 1,
              matchedPair.python.range.startCol + 1,
              matchedPair.python.range.endLine + 1,
              matchedPair.python.range.endCol + 1
            ),
            contents: [
              { value: `**J-Forge AST Mapping:** \`${matchedPair.python.text}\` ➔ \`${matchedPair.java.text}\`` },
              { value: `**Confidence:** ${matchedPair.confidence.toUpperCase()} (${matchedPair.color})` },
              { value: `*${matchedPair.explanation.type_system}*` },
            ],
          };
        }

        return null;
      },
    });

    // Also handle cursor position changes / mouse clicks
    editor.onDidChangeCursorPosition((e) => {
      const matchedPair = findPairAtPosition(e.position.lineNumber, e.position.column);
      if (matchedPair) {
        highlightPair(matchedPair);
      }
    });
  };

  /**
   * Handle Java editor mount
   */
  const handleJavaEditorDidMount = (editor, monaco) => {
    javaEditorRef.current = editor;
    if (!monacoRef.current) {
      monacoRef.current = monaco;
    }
  };

  // Close drawer and clear highlights
  const handleCloseDrawer = () => {
    setActiveExplanation(null);
    highlightPair(null);
  };

  // Scope active selection to the current alignmentPairs array without setState in useEffect
  const visibleExplanation =
    activeExplanation?.pairsSnapshot === alignmentPairs ? activeExplanation : null;
  const visiblePairId = visibleExplanation ? activePairId : null;

  return (
    <div className="space-y-4 font-sans relative">
      {/* Dynamic CSS styles for Monaco syntax decoration overlays */}
      <style jsx global>{`
        .ast-python-active {
          background: rgba(59, 130, 246, 0.35) !important;
          border-bottom: 2px solid #38bdf8 !important;
          border-radius: 3px !important;
        }
        .ast-java-active-green {
          background: rgba(16, 185, 129, 0.35) !important;
          border-bottom: 2px solid #10b981 !important;
          border-radius: 3px !important;
        }
        .ast-java-active-purple {
          background: rgba(168, 85, 247, 0.35) !important;
          border-bottom: 2px solid #a855f7 !important;
          border-radius: 3px !important;
        }
        .ast-java-active-amber {
          background: rgba(245, 158, 11, 0.35) !important;
          border-bottom: 2px solid #f59e0b !important;
          border-radius: 3px !important;
        }
      `}</style>

      {/* Top Legend Bar */}
      <ASTLegend
        exactCount={exactCount}
        inferredCount={inferredCount}
        healedCount={healedCount}
        totalAlignments={alignmentPairs.length}
      />

      {/* Side-by-side Monaco Editors (Stacked on mobile < 768px) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Pane: Python Source */}
        <div className="flex flex-col rounded-lg border border-slate-800 bg-slate-950 overflow-hidden shadow-lg">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/90 font-mono text-xs text-slate-300">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              <span className="font-bold text-sky-400">Python 3.11 AST</span>
            </span>
            <span className="text-[11px] text-slate-500">Hover types to inspect</span>
          </div>
          <div className="h-[500px] w-full">
            <MonacoEditor
              height="500px"
              language="python"
              theme="vs-dark"
              value={pythonCode}
              onMount={handlePythonEditorDidMount}
              options={{
                readOnly: true,
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'on',
                renderLineHighlight: 'none',
                scrollbar: { vertical: 'visible', horizontal: 'auto' },
              }}
            />
          </div>
        </div>

        {/* Right Pane: Java Transpiled Target */}
        <div className="flex flex-col rounded-lg border border-slate-800 bg-slate-950 overflow-hidden shadow-lg">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/90 font-mono text-xs text-slate-300">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-bold text-emerald-400">Java 17 LTS AST</span>
            </span>
            <span className="text-[11px] text-slate-500">Target Representation</span>
          </div>
          <div className="h-[500px] w-full">
            <MonacoEditor
              height="500px"
              language="java"
              theme="vs-dark"
              value={javaCode}
              onMount={handleJavaEditorDidMount}
              options={{
                readOnly: true,
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'on',
                renderLineHighlight: 'none',
                scrollbar: { vertical: 'visible', horizontal: 'auto' },
              }}
            />
          </div>
        </div>
      </div>

      {/* Quick-Click Alignment Tokens Pill Bar */}
      {alignmentPairs.length > 0 && (
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/70 space-y-2">
          <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Aligned Syntax Nodes (Click any token to inspect)</span>
            <span className="text-slate-500">{alignmentPairs.length} detected</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {alignmentPairs.map((pair, idx) => {
              const pairKey = `${pair.python.id}_${pair.java.id}`;
              const isActive = visiblePairId === pairKey;

              let pillBorder = 'border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300';
              if (isActive) {
                pillBorder = 'border-sky-500 bg-sky-950/40 text-sky-200 ring-1 ring-sky-500';
              } else if (pair.color === 'green') {
                pillBorder = 'border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-950/20 text-emerald-300';
              } else if (pair.color === 'purple') {
                pillBorder = 'border-purple-500/30 hover:border-purple-500/60 bg-purple-950/20 text-purple-300';
              } else if (pair.color === 'amber') {
                pillBorder = 'border-amber-500/30 hover:border-amber-500/60 bg-amber-950/20 text-amber-300';
              }

              // Scope active selection to the current alignmentPairs array without setState in useEffect
  const visibleExplanation =
    activeExplanation?.pairsSnapshot === alignmentPairs ? activeExplanation : null;
  const visiblePairId = visibleExplanation ? activePairId : null;

  return (
                <button
                  key={idx}
                  onClick={() => highlightPair(pair)}
                  className={`px-2.5 py-1 rounded text-xs font-mono border transition-all cursor-pointer flex items-center gap-1.5 ${pillBorder}`}
                >
                  <span className="font-semibold">{pair.python.text}</span>
                  <span className="opacity-40">➔</span>
                  <span>{pair.java.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Slide-in Semantic Explanation Drawer */}
      <ExplanationDrawer
        activeExplanation={visibleExplanation}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
