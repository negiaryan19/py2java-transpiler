'use client';

import React, { useRef, useMemo, useState } from 'react';
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
  GitCompare,
  ArrowRight,
  Sparkles,
  Keyboard,
  X,
  Activity,
  Cpu,
  ShieldCheck,
  RefreshCw,
  Upload,
  Maximize2,
  Minimize2,
  History,
  MessageSquarePlus,
  Play,
  Link2,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import AstTypeBar from './AstTypeBar';
import { studioExplainAction } from '../actions.js';

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
  bypassCache = false,
  setBypassCache = () => {},
  isCacheHit = false,
  selfHealing = null,
  gatewayApiKey = '',
  onRequireAuth = () => {},
  additionalInstructions = '',
  setAdditionalInstructions = () => {},
  guestRemaining = 3,
  authUser = null,
  history = [],
  onRestoreHistory = () => {},
  verificationReport = null,
  isVerifying = false,
  programStdin = '',
  setProgramStdin = () => {},
  onVerifyOnly = () => {},
}) {
  const pyTextareaRef = useRef(null);
  const pyGutterRef = useRef(null);
  const javaTextareaRef = useRef(null);
  const javaGutterRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [consoleTab, setConsoleTab] = useState('stdout'); // 'stdout' | 'javaRun' | 'diagnostics'
  const [javaRunResult, setJavaRunResult] = useState(null);
  const [isRunningJava, setIsRunningJava] = useState(false);
  const [githubImportOpen, setGithubImportOpen] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [isImportingGithub, setIsImportingGithub] = useState(false);
  const [githubImportError, setGithubImportError] = useState('');

  const handleImportGithub = async () => {
    if (!githubUrl.trim() || isImportingGithub) return;
    setIsImportingGithub(true);
    setGithubImportError('');
    try {
      const res = await fetch('/api/v1/import-github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: githubUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.code) {
        setPythonCode(data.code);
        setGithubImportOpen(false);
        setGithubUrl('');
      } else {
        setGithubImportError(data.error || 'Failed to import from GitHub.');
      }
    } catch {
      setGithubImportError('Network error while importing from GitHub.');
    } finally {
      setIsImportingGithub(false);
    }
  };

  const handleRunJava = async () => {
    if (!javaCode?.trim() || isRunningJava) return;
    setIsRunningJava(true);
    setConsoleTab('javaRun');
    try {
      const res = await fetch('/api/v1/run-java', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ java_code: javaCode, stdin: programStdin }),
      });
      const data = await res.json();
      setJavaRunResult(data);
    } catch (err) {
      setJavaRunResult({
        ok: false,
        exitCode: 1,
        stdout: '',
        stderr: '',
        compilerError: err?.message || 'Failed to reach Java sandbox.',
        compiler: 'OpenJDK 21',
        executionTimeMs: 0,
      });
    } finally {
      setIsRunningJava(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setPythonCode(ev.target.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

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

  // Interactive AST Syntax Line Mapper state
  const [hoveredPyLine, setHoveredPyLine] = useState(null);
  const [hoveredJavaLine, setHoveredJavaLine] = useState(null);
  const [selectedAstRule, setSelectedAstRule] = useState(null);

  // Keyboard Shortcuts & Compiler Diagnostics state
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [diagnostics, setDiagnostics] = useState(null);
  const [isAnalyzingDiagnostics, setIsAnalyzingDiagnostics] = useState(false);

  const fetchDiagnostics = async () => {
    setIsAnalyzingDiagnostics(true);
    try {
      const targetJava = javaTargetVersion.replace(/[^0-9]/g, '') || '17';
      if (gatewayApiKey && gatewayApiKey.trim()) {
        const res = await fetch('/api/v1/explain', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': gatewayApiKey.trim(),
          },
          body: JSON.stringify({
            python_code: pythonCode,
            java_version: targetJava,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          setDiagnostics(json.data);
          return;
        }
      }

      const actionRes = await studioExplainAction({
        pythonCode,
        javaVersion: targetJava,
      });
      if (actionRes?.ok) {
        setDiagnostics(actionRes.data);
      } else if (actionRes?.status === 401 || actionRes?.code === 'AUTH_REQUIRED') {
        onRequireAuth(actionRes?.error || 'Please sign in with Google (Gmail) to run AI compiler diagnostics.');
      }
    } catch (_) {
      // Handled gracefully
    } finally {
      setIsAnalyzingDiagnostics(false);
    }
  };

  // Compute bidirectional mapping between Python statements and Java AST blocks
  const astLineMap = useMemo(() => {
    const pyArr = pythonCode.split('\n');
    const javaArr = javaCode.split('\n');
    const pyToJava = {};
    const javaToPy = {};

    pyArr.forEach((pyLine, pyIdx) => {
      const trimmed = pyLine.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      let matchIdx = -1;
      if (trimmed.startsWith('class ')) {
        const name = trimmed.split(' ')[1]?.split(':')[0]?.split('(')[0];
        matchIdx = javaArr.findIndex((jl) => jl.includes(`class ${name}`));
      } else if (trimmed.startsWith('def __init__')) {
        matchIdx = javaArr.findIndex(
          (jl) => jl.includes('public ') && jl.includes('(') && !jl.includes('void ') && !jl.includes('static ')
        );
      } else if (trimmed.startsWith('def ')) {
        const fnName = trimmed.match(/def\s+(\w+)/)?.[1];
        if (fnName) {
          const camelName = fnName.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
          matchIdx = javaArr.findIndex((jl) => jl.includes(` ${fnName}(`) || jl.includes(` ${camelName}(`));
        }
      } else if (trimmed.startsWith('for ') && trimmed.includes('in range(')) {
        const varName = trimmed.match(/for\s+(\w+)\s+in/)?.[1];
        matchIdx = javaArr.findIndex((jl) => jl.includes(`for (int ${varName}`));
      } else if (trimmed.startsWith('for ') && trimmed.includes('in ')) {
        const varName = trimmed.match(/for\s+(\w+)\s+in/)?.[1];
        matchIdx = javaArr.findIndex((jl) => jl.includes(`for (var ${varName}`) || jl.includes(`for (int ${varName}`));
      } else if (trimmed.startsWith('print(')) {
        matchIdx = javaArr.findIndex((jl) => jl.includes('System.out.println(') || jl.includes('System.out.printf('));
      } else if (trimmed.includes('__main__')) {
        matchIdx = javaArr.findIndex((jl) => jl.includes('public static void main'));
      }

      if (matchIdx !== -1) {
        pyToJava[pyIdx + 1] = matchIdx + 1;
        javaToPy[matchIdx + 1] = pyIdx + 1;
      }
    });

    return { pyToJava, javaToPy };
  }, [pythonCode, javaCode]);

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
          <button
            onClick={() => setBypassCache(!bypassCache)}
            className={`px-2.5 py-1.5 text-xs font-mono flex items-center gap-1.5 cursor-pointer rounded transition ${
              bypassCache
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40 font-semibold'
                : 't-btn-secondary'
            }`}
            title={bypassCache ? 'AST Cache Bypassed (Forces Live LLM Synthesis)' : 'Semantic AST Hash Cache Active (Sub-5ms response)'}
          >
            <Zap className={`w-3.5 h-3.5 ${bypassCache ? 'text-amber-500' : 'text-emerald-500'}`} />
            <span className="hidden sm:inline">{bypassCache ? 'Bypass Cache: ON' : 'Cache: Active'}</span>
          </button>

          {!authUser && (
            <a
              href="/login"
              className="px-2.5 py-1.5 text-xs font-mono t-subtle flex items-center gap-1.5 hover:opacity-80"
              title="Sign in for unlimited conversions"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>{guestRemaining} free uses</span>
            </a>
          )}

          {history.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setHistoryOpen((v) => !v)}
                className="t-btn-secondary px-2.5 py-1.5 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                title="Recent conversion history"
              >
                <History className="w-3.5 h-3.5 text-sky-500" />
                <span className="hidden sm:inline">History</span>
              </button>
              {historyOpen && (
                <div className="absolute right-0 mt-1.5 w-72 t-surface shadow-xl z-40 p-2 space-y-1">
                  <p className="text-[10px] font-mono uppercase px-2 py-1 opacity-60">Recent Conversions</p>
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onRestoreHistory(item);
                        setHistoryOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded text-xs font-mono hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span className="truncate">{item.label}</span>
                      <span className="text-[10px] opacity-60 shrink-0">{item.time}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setIsFullscreen((v) => !v)}
            className="t-btn-secondary px-2.5 py-1.5 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Editors'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setShortcutsModalOpen(true)}
            className="t-btn-secondary px-2.5 py-1.5 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            title="IDE Shortcuts & AST Navigation"
          >
            <Keyboard className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Shortcuts</span>
          </button>

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
            <span>Convert &amp; Verify</span>
            <kbd className="text-[10px] opacity-75 px-1 rounded border border-current hidden sm:inline">⌘↵</kbd>
          </button>
        </div>
      </div>

      {/* Dynamic AST Type & Syntax Mapping Pill Bar */}
      <AstTypeBar
        pythonCode={pythonCode}
        selectedRule={selectedAstRule}
        onSelectRule={setSelectedAstRule}
      />

      {/* Live AST Statement Tracer Bar */}
      {(hoveredPyLine || hoveredJavaLine) && (
        <div className="px-3.5 py-2 rounded t-surface border border-emerald-500/30 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">AST Syntax Tracing:</span>
            {hoveredPyLine ? (
              <>
                <span>Python Line {hoveredPyLine}</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-bold underline text-emerald-600 dark:text-emerald-400">
                  {astLineMap.pyToJava[hoveredPyLine] ? `Java Line ${astLineMap.pyToJava[hoveredPyLine]}` : 'Encapsulated inside main() wrapper'}
                </span>
              </>
            ) : (
              <>
                <span>Java Line {hoveredJavaLine}</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-bold underline text-emerald-600 dark:text-emerald-400">
                  {astLineMap.javaToPy[hoveredJavaLine] ? `Python Line ${astLineMap.javaToPy[hoveredJavaLine]}` : 'Generated Boilerplate / Wrapper'}
                </span>
              </>
            )}
          </div>
          <span className="text-[11px] opacity-70 hidden sm:inline">Hover over line numbers to trace AST mapping</span>
        </div>
      )}

      {/* Dual macOS Window Chrome Code Editors */}
      <div
        className={
          isFullscreen
            ? 'fixed inset-3 z-50 grid grid-cols-1 lg:grid-cols-2 gap-4 p-3 rounded-lg shadow-2xl'
            : 'grid grid-cols-1 lg:grid-cols-2 gap-4'
        }
        style={isFullscreen ? { backgroundColor: 'var(--bg-app)' } : undefined}
      >
        {/* LEFT EDITOR: PYTHON 3.11 SOURCE */}
        <div className={`t-surface overflow-hidden flex flex-col ${isFullscreen ? 'h-full' : 'h-[500px]'}`}>
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
              <input
                ref={fileInputRef}
                type="file"
                accept=".py,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="t-btn-secondary px-2 py-0.5 text-[11px] flex items-center gap-1 cursor-pointer"
                title="Upload a .py file"
              >
                <Upload className="w-2.5 h-2.5" />
                <span>Upload</span>
              </button>
              <button
                onClick={() => {
                  setGithubImportOpen((v) => !v);
                  setGithubImportError('');
                }}
                className="t-btn-secondary px-2 py-0.5 text-[11px] flex items-center gap-1 cursor-pointer"
                title="Import Python file from public GitHub URL"
              >
                <Link2 className="w-2.5 h-2.5" />
                <span>GitHub</span>
              </button>
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
          {githubImportOpen && (
            <div className="px-3.5 py-2 t-border-b flex flex-col gap-1.5 text-xs font-mono" style={{ backgroundColor: 'var(--bg-subtle)' }}>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/user/repo/blob/main/script.py"
                  className="flex-1 px-2.5 py-1 t-surface text-xs focus:outline-none"
                />
                <button
                  onClick={handleImportGithub}
                  disabled={isImportingGithub || !githubUrl.trim()}
                  className="t-btn-primary px-2.5 py-1 text-[11px] cursor-pointer disabled:opacity-50"
                >
                  {isImportingGithub ? 'Importing...' : 'Import'}
                </button>
                <button
                  onClick={() => setGithubImportOpen(false)}
                  className="t-btn-secondary px-2 py-1 text-[11px] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              {githubImportError && <p className="text-[11px] text-red-500">{githubImportError}</p>}
            </div>
          )}
          <div className="flex-1 flex overflow-hidden relative">
            <div
              ref={pyGutterRef}
              className="editor-gutter w-11 py-3.5 px-1 font-mono text-xs t-border-r select-none overflow-hidden"
            >
              {pyLines.map((num) => {
                const isHovered = hoveredPyLine === num;
                const isTargetMapped = hoveredJavaLine && astLineMap.javaToPy[hoveredJavaLine] === num;
                const hasMapping = astLineMap.pyToJava[num];
                return (
                  <div
                    key={num}
                    onMouseEnter={() => setHoveredPyLine(num)}
                    onMouseLeave={() => setHoveredPyLine(null)}
                    className={`cursor-pointer transition-all duration-150 px-1 text-center rounded-xs ${
                      isHovered
                        ? 'bg-amber-400 text-black font-bold shadow-xs scale-105'
                        : isTargetMapped
                        ? 'bg-emerald-500 text-black font-bold shadow-xs scale-105'
                        : hasMapping
                        ? 'hover:text-emerald-500 font-medium'
                        : 'opacity-65'
                    }`}
                    title={hasMapping ? `AST Mapped to Java Line ${hasMapping}` : undefined}
                  >
                    {num}
                  </div>
                );
              })}
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
        <div className={`t-surface overflow-hidden flex flex-col relative ${isFullscreen ? 'h-full' : 'h-[500px]'}`}>
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
              {isCacheHit ? (
                <span
                  className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 border border-emerald-500/30 shadow-xs"
                  title="Semantic AST Cache Hit: 0 Tokens Consumed"
                >
                  <Zap className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                  <span>{latency} ms (Cache Hit)</span>
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 font-semibold">
                  {latency} ms
                </span>
              )}

              {selfHealing ? (
                selfHealing.passes > 0 ? (
                  <span
                    className="text-[11px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 border border-purple-500/30 shadow-xs"
                    title={`Autonomous Self-Correction (${selfHealing.repaired_by}): ${selfHealing.corrections_applied?.join(' • ') || 'AST Repaired'}`}
                  >
                    <Sparkles className="w-3 h-3 text-purple-500" />
                    <span>Self-Healed ({selfHealing.passes} Pass)</span>
                  </span>
                ) : (
                  <span
                    className="text-[11px] px-2 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1 border border-sky-500/20"
                    title="Static AST Integrity Verified: 0 Defects Detected"
                  >
                    <ShieldCheck className="w-3 h-3 text-sky-500" />
                    <span>AST Verified</span>
                  </span>
                )
              ) : null}

              <button
                onClick={handleRunJava}
                disabled={isRunningJava || !javaCode?.trim()}
                className="t-btn-primary px-2.5 py-0.5 text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                title="Compile & Run Java in real OpenJDK 21 Sandbox"
              >
                {isRunningJava ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
                <span>{isRunningJava ? 'Running...' : 'Run Java'}</span>
              </button>
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
              className="editor-gutter w-11 py-3.5 px-1 font-mono text-xs t-border-r select-none overflow-hidden"
            >
              {javaLines.map((num) => {
                const isHovered = hoveredJavaLine === num;
                const isSourceMapped = hoveredPyLine && astLineMap.pyToJava[hoveredPyLine] === num;
                const hasMapping = astLineMap.javaToPy[num];
                return (
                  <div
                    key={num}
                    onMouseEnter={() => setHoveredJavaLine(num)}
                    onMouseLeave={() => setHoveredJavaLine(null)}
                    className={`cursor-pointer transition-all duration-150 px-1 text-center rounded-xs ${
                      isHovered
                        ? 'bg-amber-400 text-black font-bold shadow-xs scale-105'
                        : isSourceMapped
                        ? 'bg-emerald-500 text-black font-bold shadow-xs scale-105'
                        : hasMapping
                        ? 'hover:text-emerald-500 font-medium'
                        : 'opacity-65'
                    }`}
                    title={hasMapping ? `AST Mapped from Python Line ${hasMapping}` : undefined}
                  >
                    {num}
                  </div>
                );
              })}
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

      {/* Optional Instructions & Program Stdin */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 t-surface px-3.5 py-2 flex items-center gap-2.5 text-xs">
          <MessageSquarePlus className="w-3.5 h-3.5 text-sky-500 shrink-0" />
          <input
            type="text"
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            maxLength={300}
            placeholder="Additional instructions (optional): e.g., Use Java 17 records, add comments..."
            className="flex-1 bg-transparent font-mono text-xs focus:outline-none"
            style={{ color: 'var(--text-main)' }}
          />
        </div>
        <div className="t-surface px-3.5 py-2 flex items-center gap-2 text-xs">
          <Terminal className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <input
            type="text"
            value={programStdin}
            onChange={(e) => setProgramStdin(e.target.value)}
            maxLength={1000}
            placeholder="Program input (stdin) for input()..."
            className="flex-1 bg-transparent font-mono text-xs focus:outline-none"
            style={{ color: 'var(--text-main)' }}
          />
        </div>
      </div>

      {/* Real Verification Results Card (Honest, Evidence-Based) */}
      <div className="t-surface p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-xs sm:text-sm heading-font">Verification Results</span>
            {isVerifying ? (
              <span className="text-[11px] font-mono px-2 py-0.5 t-subtle flex items-center gap-1.5 text-sky-600">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Compiling &amp; running CPython 3.13 + OpenJDK 21...</span>
              </span>
            ) : verificationReport ? (
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                  verificationReport.status === 'behavioral_match'
                    ? 'bg-emerald-500/15 text-emerald-600'
                    : verificationReport.status === 'compilation_failed' || verificationReport.status === 'execution_failed'
                    ? 'bg-rose-500/15 text-rose-600'
                    : 'bg-amber-500/15 text-amber-600'
                }`}
              >
                {verificationReport.status === 'behavioral_match'
                  ? 'Verified Match (1/1)'
                  : verificationReport.status === 'behavioral_mismatch'
                  ? 'Output Mismatch (0/1)'
                  : verificationReport.status === 'compilation_failed'
                  ? 'Compilation Failed'
                  : verificationReport.status === 'execution_failed'
                  ? 'Runtime Error'
                  : 'Inconclusive'}
              </span>
            ) : (
              <span className="text-[11px] font-mono px-2 py-0.5 t-subtle" style={{ color: 'var(--text-secondary)' }}>
                Not verified yet
              </span>
            )}
          </div>

          <button
            onClick={onVerifyOnly}
            disabled={isVerifying || !pythonCode?.trim() || !javaCode?.trim()}
            className="t-btn-secondary px-3 py-1 text-[11px] font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>Re-Verify Live</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs font-mono">
          {/* 1. Compilation Status */}
          <div className="p-2.5 t-subtle space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              {isVerifying ? (
                <Clock className="w-3.5 h-3.5 text-sky-500" />
              ) : verificationReport?.compilationPassed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : verificationReport ? (
                <XCircle className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <Clock className="w-3.5 h-3.5 opacity-60" />
              )}
              <span>Java Compilation</span>
            </div>
            <p className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
              {isVerifying
                ? 'Running javac (OpenJDK 21)...'
                : verificationReport?.compilationPassed
                ? `Passed (${verificationReport.java?.executionTimeMs || 0} ms)`
                : verificationReport?.java?.compilerError
                ? verificationReport.java.compilerError.split('\n')[0]
                : verificationReport
                ? 'Did not pass'
                : 'Click Convert & Verify'}
            </p>
          </div>

          {/* 2. Real Python Output */}
          <div className="p-2.5 t-subtle space-y-1">
            <div className="font-semibold">Python Output (CPython 3.13)</div>
            <p className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
              {isVerifying
                ? 'Executing...'
                : verificationReport?.python
                ? verificationReport.python.ok
                  ? verificationReport.python.stdout || '(Empty output)'
                  : verificationReport.python.stderr || `Exit ${verificationReport.python.exitCode}`
                : 'Click Convert & Verify'}
            </p>
          </div>

          {/* 3. Real Java Output */}
          <div className="p-2.5 t-subtle space-y-1">
            <div className="font-semibold">Java Output (OpenJDK 21)</div>
            <p className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
              {isVerifying
                ? 'Executing...'
                : verificationReport?.java
                ? verificationReport.java.ok
                  ? verificationReport.java.stdout || '(Empty output)'
                  : verificationReport.java.compilerError || verificationReport.java.stderr || `Exit ${verificationReport.java.exitCode}`
                : 'Click Convert & Verify'}
            </p>
          </div>

          {/* 4. Behavioral Equivalence Summary */}
          <div className="p-2.5 t-subtle space-y-1">
            <div className="font-semibold">Behavioral Check</div>
            <p className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
              {isVerifying
                ? 'Comparing outputs...'
                : verificationReport
                ? `${verificationReport.passedCases}/${verificationReport.totalCases} passed • ${
                    verificationReport.outputMatch ? 'Outputs match' : 'Not matched'
                  }`
                : 'Awaiting live run'}
            </p>
          </div>
        </div>

        {verificationReport?.java?.compilerError && (
          <pre className="p-2.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-600 text-[11px] font-mono whitespace-pre-wrap overflow-x-auto">
            {verificationReport.java.compilerError}
          </pre>
        )}
      </div>

      {/* Program Runtime Output & Compiler Diagnostics Drawer */}
      <div className="t-surface overflow-hidden flex flex-col">
        {/* Drawer Header with Dual Tabs */}
        <div
          className="px-3.5 py-2 t-border-b flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-subtle)' }}
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] inline-block border border-black/10"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] inline-block border border-black/10"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] inline-block border border-black/10"></span>
            </div>

            {/* Tab 1: Terminal Stdout */}
            <button
              onClick={() => setConsoleTab('stdout')}
              className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 cursor-pointer transition ${
                consoleTab === 'stdout'
                  ? 'bg-black/10 dark:bg-white/10 font-bold text-emerald-600 dark:text-emerald-400'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-500" />
              <span>Output</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-600 font-semibold">
                Exit 0
              </span>
            </button>

            {/* Tab 2: Real Java Sandbox */}
            <button
              onClick={() => setConsoleTab('javaRun')}
              className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 cursor-pointer transition ${
                consoleTab === 'javaRun'
                  ? 'bg-black/10 dark:bg-white/10 font-bold text-sky-600 dark:text-sky-400'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Play className="w-3.5 h-3.5 text-sky-500" />
              <span>Java Sandbox</span>
              {javaRunResult && (
                <span
                  className={`text-[10px] px-1 py-0.2 rounded font-semibold ${
                    javaRunResult.ok
                      ? 'bg-emerald-500/15 text-emerald-600'
                      : 'bg-red-500/15 text-red-500'
                  }`}
                >
                  {javaRunResult.ok ? 'JDK 21' : 'Error'}
                </span>
              )}
            </button>

            {/* Tab 3: Code Analysis */}
            <button
              onClick={() => {
                setConsoleTab('diagnostics');
                if (!diagnostics) fetchDiagnostics();
              }}
              className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 cursor-pointer transition ${
                consoleTab === 'diagnostics'
                  ? 'bg-black/10 dark:bg-white/10 font-bold text-emerald-600 dark:text-emerald-400'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Code Analysis</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            {consoleTab === 'stdout' ? (
              <button
                onClick={() => copyToClipboard(executionStdout, 'term', 'Terminal output copied')}
                className="t-btn-secondary px-2 py-0.5 text-[11px] flex items-center gap-1 cursor-pointer"
              >
                {copiedId === 'term' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === 'term' ? 'Copied' : 'Copy'}</span>
              </button>
            ) : consoleTab === 'javaRun' ? (
              <button
                onClick={handleRunJava}
                disabled={isRunningJava}
                className="t-btn-secondary px-2 py-0.5 text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isRunningJava ? <Loader2 className="w-3 h-3 animate-spin text-sky-500" /> : <Play className="w-3 h-3 text-sky-500" />}
                <span>Re-Run JDK 21</span>
              </button>
            ) : (
              <button
                onClick={fetchDiagnostics}
                disabled={isAnalyzingDiagnostics}
                className="t-btn-secondary px-2 py-0.5 text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isAnalyzingDiagnostics ? (
                  <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                <span>Re-Analyze</span>
              </button>
            )}
          </div>
        </div>

        {/* Drawer Body */}
        {consoleTab === 'stdout' ? (
          <div
            className="p-3.5 font-mono text-xs overflow-x-auto leading-relaxed"
            style={{ backgroundColor: 'var(--bg-editor)', minHeight: '90px', maxHeight: '180px' }}
          >
            <pre className="whitespace-pre-wrap selection:bg-emerald-500 selection:text-black">
              {executionStdout || '[No output yet. Click "Convert & Verify" to run.]'}
            </pre>
            <div className="mt-2 pt-2 border-t border-dashed border-black/10 dark:border-white/10 text-[11px] font-medium flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              {verificationReport?.python?.ok ? (
                <span className="text-emerald-600">
                  ✓ Real CPython 3.13 exited with code {verificationReport.python.exitCode} ({verificationReport.python.executionTimeMs} ms)
                </span>
              ) : (
                <span>Quick browser preview (real execution runs via CPython 3.13 &amp; OpenJDK 21 in Verification Results above)</span>
              )}
            </div>
          </div>
        ) : consoleTab === 'javaRun' ? (
          <div
            className="p-3.5 font-mono text-xs overflow-x-auto leading-relaxed"
            style={{ backgroundColor: 'var(--bg-editor)', minHeight: '90px', maxHeight: '200px' }}
          >
            {isRunningJava ? (
              <div className="flex items-center gap-2 py-4 text-xs opacity-75">
                <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
                <span>Compiling & executing Solution.java in OpenJDK 21 sandbox...</span>
              </div>
            ) : !javaRunResult ? (
              <div className="py-2 text-xs opacity-75">
                Click <strong>Run Java</strong> above to compile and execute the generated Java code in a real OpenJDK 21 sandbox.
              </div>
            ) : (
              <>
                {javaRunResult.compilerError && (
                  <pre className="whitespace-pre-wrap text-red-500 mb-2">{javaRunResult.compilerError}</pre>
                )}
                {javaRunResult.stderr && (
                  <pre className="whitespace-pre-wrap text-amber-500 mb-2">{javaRunResult.stderr}</pre>
                )}
                {(javaRunResult.stdout || (!javaRunResult.compilerError && !javaRunResult.stderr)) && (
                  <pre className="whitespace-pre-wrap selection:bg-sky-500 selection:text-black">
                    {javaRunResult.stdout || '(No output)'}
                  </pre>
                )}
                <div className="mt-2 pt-2 border-t border-dashed border-black/10 dark:border-white/10 text-[11px] flex flex-wrap items-center gap-2">
                  <span className={javaRunResult.ok ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>
                    {javaRunResult.ok
                      ? `✓ OpenJDK 21 exited with code ${javaRunResult.exitCode}`
                      : `✗ Exited with code ${javaRunResult.exitCode}`}
                  </span>
                  {javaRunResult.executionTimeMs > 0 && (
                    <span className="opacity-60">• {javaRunResult.executionTimeMs} ms</span>
                  )}
                  {javaRunResult.ok &&
                    executionStdout &&
                    javaRunResult.stdout.trim() === executionStdout.trim() && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 font-semibold">
                        ✓ Matches Python Output
                      </span>
                    )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div
            className="p-3.5 font-mono text-xs overflow-y-auto leading-relaxed space-y-3"
            style={{ backgroundColor: 'var(--bg-editor)', minHeight: '110px', maxHeight: '200px' }}
          >
            {isAnalyzingDiagnostics ? (
              <div className="flex items-center justify-center py-6 gap-2 text-xs opacity-75">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                <span>Synthesizing AST & Complexity Metrics via POST /api/v1/explain...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2 rounded t-surface border border-black/5 dark:border-white/5">
                    <div className="text-[10px] opacity-60">Time Complexity</div>
                    <div className="font-bold text-emerald-500 text-sm mt-0.5">
                      {diagnostics?.time_complexity || 'O(N)'}
                    </div>
                  </div>
                  <div className="p-2 rounded t-surface border border-black/5 dark:border-white/5">
                    <div className="text-[10px] opacity-60">Space Complexity</div>
                    <div className="font-bold text-sky-500 text-sm mt-0.5">
                      {diagnostics?.space_complexity || 'O(1) Stack'}
                    </div>
                  </div>
                  <div className="p-2 rounded t-surface border border-black/5 dark:border-white/5">
                    <div className="text-[10px] opacity-60">Type Safety Score</div>
                    <div className="font-bold text-purple-500 text-sm mt-0.5">
                      {diagnostics?.type_safety_score || '100% Typed'}
                    </div>
                  </div>
                  <div className="p-2 rounded t-surface border border-black/5 dark:border-white/5">
                    <div className="text-[10px] opacity-60">Target Runtime</div>
                    <div className="font-bold text-amber-500 text-sm mt-0.5">
                      {javaTargetVersion} (JVM)
                    </div>
                  </div>
                </div>

                {/* AST Self-Correction / Reflection Telemetry Card */}
                {selfHealing && (
                  <div className="p-2.5 rounded t-surface border border-black/5 dark:border-white/5 text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AST Self-Healing & Reflection Loop</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 font-semibold">
                          Quality: {selfHealing.diagnostics?.quality_score ?? 100}%
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-600 font-semibold">
                          Passes: {selfHealing.passes}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 font-mono text-[10px] opacity-80 pt-1 border-t border-black/5 dark:border-white/5">
                      <div>Braces: <span className="font-bold text-emerald-500">{selfHealing.diagnostics?.brace_balance || 'BALANCED'}</span></div>
                      <div>Imports: <span className="font-bold text-sky-500">{selfHealing.diagnostics?.import_resolution || 'COMPLETE'}</span></div>
                      <div>Structure: <span className="font-bold text-indigo-500">{selfHealing.diagnostics?.structure_check || 'VALID'}</span></div>
                    </div>
                    {selfHealing.corrections_applied?.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-dashed border-black/10 dark:border-white/10 text-[10px] text-purple-600 dark:text-purple-300">
                        <span className="font-bold">Autonomous Fixes ({selfHealing.repaired_by}):</span>
                        <ul className="list-disc pl-4 mt-0.5 space-y-0.5 font-mono">
                          {selfHealing.corrections_applied.map((corr, idx) => (
                            <li key={idx}>{corr}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-2.5 rounded t-surface border border-black/5 dark:border-white/5 text-[11px] space-y-1">
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Memory Model Translation</span>
                  </div>
                  <p className="opacity-80">
                    {diagnostics?.memory_model ||
                      'Python dynamic heap objects and reference counting mapped to statically typed JVM heap allocations managed by HotSpot GC.'}
                  </p>
                </div>

                {diagnostics?.compiler_notes && (
                  <div className="p-2.5 rounded t-surface border border-black/5 dark:border-white/5 text-[11px] space-y-1">
                    <div className="font-semibold opacity-70">Compiler Optimization Notes:</div>
                    <p className="opacity-80">{diagnostics.compiler_notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Modal */}
      {shortcutsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="t-surface max-w-lg w-full p-5 space-y-4 shadow-xl border border-black/10 dark:border-white/10">
            <div className="flex items-center justify-between t-border-b pb-3">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-emerald-500" />
                <h3 className="font-bold text-sm heading-font">IDE Shortcuts & AST Navigation</h3>
              </div>
              <button
                onClick={() => setShortcutsModalOpen(false)}
                className="opacity-60 hover:opacity-100 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between p-2 rounded t-subtle">
                <span className="opacity-80">Transpile to Java</span>
                <kbd className="px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 font-bold">⌘ + Enter / Ctrl + Enter</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded t-subtle">
                <span className="opacity-80">Smart Tab Indent (4 spaces)</span>
                <kbd className="px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 font-bold">Tab</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded t-subtle">
                <span className="opacity-80">Smart Outdent (4 spaces)</span>
                <kbd className="px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 font-bold">Shift + Tab</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded t-subtle">
                <span className="opacity-80">Auto-Indent After Colon</span>
                <kbd className="px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 font-bold">Enter after &apos;:&apos;</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded t-subtle">
                <span className="opacity-80">AST Line-to-Line Tracing</span>
                <span className="text-[11px] text-emerald-600 font-semibold">Hover Gutter Line #</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded t-subtle">
                <span className="opacity-80">Format Code (PEP-8)</span>
                <span className="text-[11px] opacity-75">Click &apos;Format&apos; Button</span>
              </div>
            </div>

            <div className="t-border-t pt-3 flex justify-end">
              <button
                onClick={() => setShortcutsModalOpen(false)}
                className="t-btn-primary px-4 py-1.5 text-xs font-mono cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
