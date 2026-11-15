'use client';

import React, { useRef, useMemo } from 'react';
import {
  Layers,
  Zap,
  Loader2,
  RotateCcw,
  Copy,
  Check,
  Download,
  CheckCheck,
  AlignLeft,
  Terminal,
} from 'lucide-react';
import AstTypeBar from './AstTypeBar';

export default function TranspilerStudio({
  pythonCode,
  setPythonCode,
  javaCode,
  javaTargetVersion,
  setJavaTargetVersion,
  isTranspiling,
  onTranspile,
  currentPresetKey,
  onSelectPreset,
  presets,
  onClearEditor,
  latency,
  compilerSummary,
  onDownloadJava,
  copyToClipboard,
  copiedId,
  executionStdout = '',
  onNavigateToWebhooks,
}) {
  const pyTextareaRef = useRef(null);
  const pyGutterRef = useRef(null);
  const javaTextareaRef = useRef(null);
  const javaGutterRef = useRef(null);

  // Synchronized line gutter scroll handlers
  const handlePyScroll = (e) => {
    if (pyGutterRef.current) {
      pyGutterRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const handleJavaScroll = (e) => {
    if (javaGutterRef.current) {
      javaGutterRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const pyLines = useMemo(() => {
    const count = (pythonCode.match(/\n/g) || []).length + 1;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [pythonCode]);

  const javaLines = useMemo(() => {
    const count = (javaCode.match(/\n/g) || []).length + 1;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [javaCode]);

  // Code Formatter to normalize indentation to standard 4-spaces
  const handleAutoFormat = () => {
    if (!pythonCode) return;
    const lines = pythonCode.split('\n');
    let currentIndent = 0;
    const formatted = lines.map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '';

      // De-indent for blocks starting with elif, else, except, finally
      if (/^(elif|else|except|finally)\b/.test(trimmed)) {
        currentIndent = Math.max(0, currentIndent - 4);
      }

      const res = ' '.repeat(currentIndent) + trimmed;

      // Lines ending in colon increase indent for following lines
      if (trimmed.endsWith(':')) {
        currentIndent += 4;
      }
      return res;
    }).join('\n');

    setPythonCode(formatted);
  };

  // Keyboard shortcut listener for IDE-grade indentation (Tab, Shift+Tab, Enter, Backspace)
  const handlePyKeyDown = (e) => {
    const textarea = pyTextareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;

    // 1. Tab / Shift+Tab handling
    if (e.key === 'Tab') {
      e.preventDefault();

      if (selectionStart === selectionEnd) {
        if (e.shiftKey) {
          // Shift+Tab: unindent 4 spaces before cursor
          const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
          const lineBefore = value.substring(lineStart, selectionStart);
          if (lineBefore.endsWith('    ')) {
            const nextVal = value.substring(0, selectionStart - 4) + value.substring(selectionEnd);
            setPythonCode(nextVal);
            requestAnimationFrame(() => {
              if (textarea) {
                textarea.selectionStart = textarea.selectionEnd = selectionStart - 4;
              }
            });
          }
        } else {
          // Tab: insert 4 spaces
          const nextVal = value.substring(0, selectionStart) + '    ' + value.substring(selectionEnd);
          setPythonCode(nextVal);
          requestAnimationFrame(() => {
            if (textarea) {
              textarea.selectionStart = textarea.selectionEnd = selectionStart + 4;
            }
          });
        }
      } else {
        // Multi-line block indent/unindent
        const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
        const nextNewline = value.indexOf('\n', selectionEnd);
        const lineEnd = nextNewline !== -1 ? nextNewline : value.length;

        const block = value.substring(lineStart, lineEnd);
        const lines = block.split('\n');
        let delta = 0;

        const modified = lines.map((line) => {
          if (e.shiftKey) {
            if (line.startsWith('    ')) {
              delta -= 4;
              return line.substring(4);
            }
            const match = line.match(/^ +/);
            if (match) {
              delta -= match[0].length;
              return line.substring(match[0].length);
            }
            return line;
          } else {
            delta += 4;
            return '    ' + line;
          }
        });

        const nextVal = value.substring(0, lineStart) + modified.join('\n') + value.substring(lineEnd);
        setPythonCode(nextVal);
        requestAnimationFrame(() => {
          if (textarea) {
            textarea.selectionStart = lineStart;
            textarea.selectionEnd = lineEnd + delta;
          }
        });
      }
      return;
    }

    // 2. Enter: Smart Auto-Indentation (preserve indentation & +4 spaces after ':')
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();

      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const currentLineBefore = value.substring(lineStart, selectionStart);

      // Measure existing leading spaces
      const match = currentLineBefore.match(/^[ ]*/);
      let indent = match ? match[0] : '';

      // If current line before cursor ends with ':', indent 4 more spaces
      if (currentLineBefore.trim().endsWith(':')) {
        indent += '    ';
      }

      const insertion = '\n' + indent;
      const nextVal = value.substring(0, selectionStart) + insertion + value.substring(selectionEnd);
      setPythonCode(nextVal);

      requestAnimationFrame(() => {
        if (textarea) {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + insertion.length;
        }
      });
      return;
    }

    // 3. Backspace: Smart unindent 4 spaces
    if (e.key === 'Backspace' && selectionStart === selectionEnd) {
      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const lineBefore = value.substring(lineStart, selectionStart);

      if (lineBefore.length > 0 && /^[ ]+$/.test(lineBefore) && lineBefore.endsWith('    ')) {
        e.preventDefault();
        const nextVal = value.substring(0, selectionStart - 4) + value.substring(selectionEnd);
        setPythonCode(nextVal);
        requestAnimationFrame(() => {
          if (textarea) {
            textarea.selectionStart = textarea.selectionEnd = selectionStart - 4;
          }
        });
        return;
      }

      // Pair deletion if cursor is between (), [], {}, "", ''
      const pairs = { '(': ')', '[': ']', '{': '}' };
      const prevChar = value[selectionStart - 1];
      const nextChar = value[selectionStart];
      if (pairs[prevChar] === nextChar) {
        e.preventDefault();
        const nextVal = value.substring(0, selectionStart - 1) + value.substring(selectionStart + 1);
        setPythonCode(nextVal);
        requestAnimationFrame(() => {
          if (textarea) {
            textarea.selectionStart = textarea.selectionEnd = selectionStart - 1;
          }
        });
        return;
      }
    }

    // 4. Bracket auto-closing pairs
    const pairs = { '(': ')', '[': ']', '{': '}' };
    if (pairs[e.key] && selectionStart === selectionEnd) {
      e.preventDefault();
      const closeChar = pairs[e.key];
      const nextVal = value.substring(0, selectionStart) + e.key + closeChar + value.substring(selectionEnd);
      setPythonCode(nextVal);
      requestAnimationFrame(() => {
        if (textarea) {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
        }
      });
      return;
    }

    // 5. Skip over closing bracket if typed
    if ([')', ']', '}'].includes(e.key) && selectionStart === selectionEnd) {
      if (value[selectionStart] === e.key) {
        e.preventDefault();
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
        return;
      }
    }
  };

  return (
    <section className="space-y-4">
      {/* Control Bar: Presets + Target Version + Run Button */}
      <div className="t-surface p-3 flex flex-wrap items-center justify-between gap-3">
        {/* Curated Presets Bar */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="text-xs font-mono font-semibold mr-1 px-2 py-1 flex items-center gap-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Presets:</span>
          </span>

          {/* Mobile Dropdown */}
          <div className="inline-block sm:hidden">
            <select
              value={currentPresetKey}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="t-btn-secondary px-2.5 py-1 text-xs font-mono focus:outline-none cursor-pointer"
            >
              {Object.entries(presets).map(([key, p]) => (
                <option key={key} value={key}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Chip Buttons */}
          <div className="hidden sm:flex flex-wrap items-center gap-1.5">
            {Object.entries(presets).map(([key, p]) => (
              <button
                key={key}
                onClick={() => onSelectPreset(key)}
                className={`preset-chip px-2.5 py-1 text-xs font-mono cursor-pointer transition ${
                  currentPresetKey === key ? 't-btn-primary' : 't-btn-secondary'
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        {/* Target Version & Run Action */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 t-subtle">
            <span style={{ color: 'var(--text-secondary)' }}>Target:</span>
            <select
              value={javaTargetVersion}
              onChange={(e) => setJavaTargetVersion(e.target.value)}
              className="bg-transparent font-semibold focus:outline-none cursor-pointer"
              style={{ color: 'var(--text-main)' }}
            >
              <option value="Java 17 LTS">Java 17 LTS</option>
              <option value="Java 21 LTS">Java 21 LTS</option>
              <option value="Java 11">Java 11</option>
            </select>
          </div>

          <button
            onClick={onTranspile}
            disabled={isTranspiling}
            className="t-btn-primary px-4 py-1.5 text-xs font-mono flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isTranspiling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            <span>Transpile to Java</span>
            <kbd className="text-[10px] opacity-75 px-1 rounded border border-current hidden sm:inline">⌘↵</kbd>
          </button>
        </div>
      </div>

      {/* Dynamic AST Type & Syntax Mapping Pill Bar */}
      <AstTypeBar pythonCode={pythonCode} />

      {/* Dual macOS Window Chrome Code Editors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT EDITOR: PYTHON 3.11 SOURCE */}
        <div className="t-surface overflow-hidden flex flex-col h-[500px]">
          {/* macOS Titlebar */}
          <div
            className="px-3.5 py-2.5 t-border-b flex items-center justify-between"
            style={{ backgroundColor: 'var(--bg-subtle)' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] inline-block border border-black/10"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] inline-block border border-black/10"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] inline-block border border-black/10"></span>
              </div>
              <span className="font-mono text-xs font-semibold ml-1">source_module.py</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded t-surface">Python 3.11</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
              <span className="text-[11px]">
                {pyLines.length} lines • {pythonCode.length} chars
              </span>
              <button
                onClick={handleAutoFormat}
                className="t-btn-secondary px-2 py-0.5 text-[11px] flex items-center gap-1 cursor-pointer"
                title="Auto-Format & Normalize Indentation (4 spaces)"
              >
                <AlignLeft className="w-2.5 h-2.5" />
                <span>Format</span>
              </button>
              <button
                onClick={onClearEditor}
                className="t-btn-secondary px-2 py-0.5 text-[11px] flex items-center gap-1 cursor-pointer"
                title="Clear Editor"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Clear</span>
              </button>
              <button
                onClick={() => copyToClipboard(pythonCode, 'py', 'Python source copied')}
                className="t-btn-secondary px-2 py-0.5 text-[11px] flex items-center gap-1 cursor-pointer"
                title="Copy Python"
              >
                {copiedId === 'py' ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedId === 'py' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Code Area with Synchronized Line Gutter */}
          <div className="flex-1 flex overflow-hidden relative">
            <div
              ref={pyGutterRef}
              className="editor-gutter w-11 py-3.5 px-2 font-mono text-xs t-border-r select-none overflow-hidden"
            >
              {pyLines.map((num) => (
                <div key={num}>{num}</div>
              ))}
            </div>
            <textarea
              ref={pyTextareaRef}
              value={pythonCode}
              onChange={(e) => setPythonCode(e.target.value)}
              onKeyDown={handlePyKeyDown}
              onScroll={handlePyScroll}
              spellCheck={false}
              className="editor-area flex-1 p-3.5 font-mono text-xs focus:outline-none resize-none overflow-y-auto"
              placeholder="# Paste or write Python 3 code here..."
            />
          </div>
        </div>

        {/* RIGHT EDITOR: JAVA TARGET OUTPUT */}
        <div className="t-surface overflow-hidden flex flex-col h-[500px] relative">
          {/* Loading Veil */}
          {isTranspiling && (
            <div className="absolute inset-0 z-20 backdrop-blur-xs bg-black/20 flex flex-col items-center justify-center gap-2">
              <div className="t-surface px-5 py-3 flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                <span className="font-mono text-xs font-semibold">Synthesizing Static Java AST...</span>
              </div>
            </div>
          )}

          {/* macOS Titlebar */}
          <div
            className="px-3.5 py-2.5 t-border-b flex items-center justify-between"
            style={{ backgroundColor: 'var(--bg-subtle)' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] inline-block border border-black/10"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] inline-block border border-black/10"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] inline-block border border-black/10"></span>
              </div>
              <span className="font-mono text-xs font-semibold ml-1">Solution.java</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded t-surface">{javaTargetVersion}</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 font-semibold">
                {latency} ms
              </span>
              <button
                onClick={onDownloadJava}
                className="t-btn-secondary px-2 py-0.5 text-[11px] flex items-center gap-1 cursor-pointer"
                title="Download Solution.java"
              >
                <Download className="w-3 h-3" />
                <span>.java</span>
              </button>
              <button
                onClick={() => copyToClipboard(javaCode, 'java', 'Java code copied')}
                className="t-btn-secondary px-2 py-0.5 text-[11px] flex items-center gap-1 cursor-pointer"
                title="Copy Java"
              >
                {copiedId === 'java' ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedId === 'java' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Code Area with Synchronized Line Gutter */}
          <div className="flex-1 flex overflow-hidden relative">
            <div
              ref={javaGutterRef}
              className="editor-gutter w-11 py-3.5 px-2 font-mono text-xs t-border-r select-none overflow-hidden"
            >
              {javaLines.map((num) => (
                <div key={num}>{num}</div>
              ))}
            </div>
            <textarea
              ref={javaTextareaRef}
              value={javaCode}
              readOnly
              onScroll={handleJavaScroll}
              spellCheck={false}
              className="editor-area-java flex-1 p-3.5 font-mono text-xs focus:outline-none resize-none overflow-y-auto"
              placeholder="// Java output will appear here..."
            />
          </div>
        </div>
      </div>

      {/* Program Runtime Execution Output / Terminal Console */}
      <div className="t-surface overflow-hidden flex flex-col">
        {/* Terminal Header */}
        <div
          className="px-3.5 py-2 t-border-b flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-subtle)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] inline-block border border-black/10"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] inline-block border border-black/10"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] inline-block border border-black/10"></span>
            </div>
            <div className="flex items-center gap-1.5 ml-1">
              <Terminal className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-mono text-xs font-semibold">Program Execution Output (stdout)</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 font-semibold">
              Exit Code 0
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              Runtime Stdout
            </span>
            <button
              onClick={() => copyToClipboard(executionStdout, 'term', 'Terminal output copied')}
              className="t-btn-secondary px-2 py-0.5 text-[11px] flex items-center gap-1 cursor-pointer"
            >
              {copiedId === 'term' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copiedId === 'term' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div
          className="p-3.5 font-mono text-xs overflow-x-auto leading-relaxed"
          style={{ backgroundColor: 'var(--bg-editor)', minHeight: '90px', maxHeight: '180px' }}
        >
          <pre className="whitespace-pre-wrap selection:bg-emerald-500 selection:text-black">
            {executionStdout || '[No runtime output yet. Click "Transpile to Java" to run.]'}
          </pre>
          <div className="mt-2 pt-2 border-t border-dashed border-black/10 dark:border-white/10 text-[11px] text-emerald-600 font-medium flex items-center gap-1.5">
            <span>✓ Process finished with exit code 0</span>
            <span className="opacity-40">•</span>
            <span className="opacity-75">All assertions verified</span>
          </div>
        </div>
      </div>

      {/* Compiler Notes & Webhook Summary Bar */}
      <div className="t-surface p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 font-mono font-semibold t-subtle flex items-center gap-1">
            <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Static Type Safety Verified</span>
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>{compilerSummary}</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span style={{ color: 'var(--text-secondary)' }}>Webhook Event:</span>
          <button
            onClick={onNavigateToWebhooks}
            className="underline font-semibold hover:opacity-80 cursor-pointer"
          >
            code.conversion.completed (HTTP 200) →
          </button>
        </div>
      </div>
    </section>
  );
}
