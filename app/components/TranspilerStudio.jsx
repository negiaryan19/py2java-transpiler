'use client';

import React, { useRef, useMemo, useState } from 'react';
import {
  Zap,
  Loader2,
  Copy,
  Check,
  Download,
  AlignLeft,
  Terminal,
  GitCompare,
  Sparkles,
  Keyboard,
  X,
  Upload,
  Maximize2,
  Minimize2,
  Play,
  Link2,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Undo2,
  Wrench,
  FileCode2,
  BookOpen,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Package,
  ShieldCheck,
  FileText,
  Square,
} from 'lucide-react';
import AstTypeBar from './AstTypeBar';
import { generateJUnitTestSuite } from '../../lib/junit-generator';
import { buildJavaProjectFiles, buildZipBytes } from '../../lib/zip-export';
import {
  analyzePythonCompatibility,
  detectPythonDependencies,
  analyzeCodeQuality,
  buildConversionPassport,
} from '../../lib/compatibility';

export default function TranspilerStudio({
  conversionTitle = 'Untitled conversion',
  onChangeTitle = () => {},
  pythonCode = '',
  setPythonCode = () => {},
  javaCode = '',
  setJavaCode = () => {},
  javaTargetVersion = 'Java 21 LTS',
  setJavaTargetVersion = () => {},
  conversionMode = 'strict',
  setConversionMode = () => {},
  conversionConfig = {},
  setConversionConfig = () => {},
  additionalInstructions = '',
  setAdditionalInstructions = () => {},
  isTranspiling = false,
  onTranspile = () => {},
  onCancelTranspile = () => {},
  onNewConversion = () => {},
  onClearEditor = () => {},
  executionStdout = '',
  onDownloadJava = () => {},
  copyToClipboard = () => {},
  copiedId = null,
  bypassCache = false,
  setBypassCache = () => {},
  selfHealing = null,
  verificationReport = null,
  isVerifying = false,
  isRepairing = false,
  onRepairJava = () => {},
  onApplyJavaEdit = () => {},
  canUndoJava = false,
  onUndoJava = () => {},
  programStdin = '',
  setProgramStdin = () => {},
  multiTestCases = [],
  setMultiTestCases = () => {},
  onVerifyOnly = () => {},
  selectedPython = '',
  onSelectPython = () => {},
  settings = {
    fontSize: 13,
    wordWrap: false,
    showLineNumbers: true,
    autoSaveDraft: true,
  },
  autoSaveStatus = 'Auto-saved locally',
  history = [],
  onRestoreHistory = () => {},
  onToggleAssistant = () => {},
}) {
  const [drawerTab, setDrawerTab] = useState('console');
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);
  const [drawerExpanded, setDrawerExpanded] = useState(false);
  const [mobilePane, setMobilePane] = useState('python');
  const [splitPercent, setSplitPercent] = useState(50);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [runMenuOpen, setRunMenuOpen] = useState(false);
  const [recentMenuOpen, setRecentMenuOpen] = useState(false);
  const [githubInputOpen, setGithubInputOpen] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [isImportingGithub, setIsImportingGithub] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [problemFilter, setProblemFilter] = useState('');
  const [stdinOpen, setStdinOpen] = useState(false);
  const [testCasesOpen, setTestCasesOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  // Runtime execution & intelligence state
  const [pythonRunResult, setPythonRunResult] = useState(null);
  const [isRunningPython, setIsRunningPython] = useState(false);
  const [javaRunResult, setJavaRunResult] = useState(null);
  const [isRunningJava, setIsRunningJava] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [generatedUnitTest, setGeneratedUnitTest] = useState('');
  const [intelLoadingAction, setIntelLoadingAction] = useState('');
  const [pendingAiJavaPatch, setPendingAiJavaPatch] = useState(null);
  const [selectionJavaResult, setSelectionJavaResult] = useState(null);
  const [isConvertingSelection, setIsConvertingSelection] = useState(false);

  // Hover & selection AST highlight state
  const [hoveredPyLine, setHoveredPyLine] = useState(null);
  const [hoveredJavaLine, setHoveredJavaLine] = useState(null);
  const [selectedAstRule, setSelectedAstRule] = useState(null);

  const fileInputRef = useRef(null);
  const pyTextareaRef = useRef(null);
  const pyGutterRef = useRef(null);
  const javaTextareaRef = useRef(null);
  const javaGutterRef = useRef(null);
  const splitContainerRef = useRef(null);

  // Derived compatibility, dependency, and static quality analyses
  const compatibilityReport = useMemo(() => analyzePythonCompatibility(pythonCode), [pythonCode]);
  const dependencyMappings = useMemo(() => detectPythonDependencies(pythonCode), [pythonCode]);
  const qualityReport = useMemo(
    () => analyzeCodeQuality({ pythonCode, javaCode }),
    [pythonCode, javaCode]
  );

  // Compiler error line numbers parsed from javac diagnostics
  const compilerErrorLines = useMemo(() => {
    const err = verificationReport?.java?.compilerError || javaRunResult?.compilerError || '';
    const lineSet = new Set();
    const matches = err.matchAll(/(?:\.java|Solution\.java):(\d+):/g);
    for (const m of matches) {
      lineSet.add(Number(m[1]));
    }
    return lineSet;
  }, [verificationReport, javaRunResult]);

  // Unified Problems list (compatibility + javac diagnostics + quality)
  const problemItems = useMemo(() => {
    const list = [];
    compatibilityReport.findings.forEach((f) => {
      if (f.classification !== 'Supported') {
        list.push({
          source: 'Compatibility',
          severity: f.classification === 'Unsupported' ? 'error' : 'warning',
          message: `[${f.classification}] ${f.message}`,
          line: null,
        });
      }
    });
    const rawJavac = verificationReport?.java?.compilerError || javaRunResult?.compilerError || '';
    if (rawJavac.trim()) {
      rawJavac
        .split('\n')
        .filter((l) => /error:/i.test(l))
        .forEach((errLine) => {
          const ln = errLine.match(/:(\d+):/)?.[1];
          list.push({
            source: 'javac',
            severity: 'error',
            message: errLine.trim(),
            line: ln ? Number(ln) : null,
          });
        });
    }
    qualityReport.items.forEach((q) => {
      if (q.severity === 'warning') {
        list.push({
          source: 'Quality',
          severity: 'warning',
          message: `${q.category}: ${q.message}`,
          line: null,
        });
      }
    });
    return list;
  }, [compatibilityReport, verificationReport, javaRunResult, qualityReport]);

  // Reliable AST Line Mapping (never invents lines)
  const astLineMap = useMemo(() => {
    const pyArr = (pythonCode || '').split('\n');
    const javaArr = (javaCode || '').split('\n');
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
        matchIdx = javaArr.findIndex((jl) => jl.includes('public ') && jl.includes('(') && !jl.includes('void '));
      } else if (trimmed.startsWith('def ')) {
        const fnName = trimmed.match(/def\s+(\w+)/)?.[1];
        if (fnName) {
          const camelName = fnName.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
          matchIdx = javaArr.findIndex((jl) => jl.includes(` ${fnName}(`) || jl.includes(` ${camelName}(`));
        }
      } else if (trimmed.startsWith('for ') && trimmed.includes('in range(')) {
        const varName = trimmed.match(/for\s+(\w+)\s+in/)?.[1];
        matchIdx = javaArr.findIndex((jl) => jl.includes(`for (int ${varName}`));
      } else if (trimmed.startsWith('while ')) {
        matchIdx = javaArr.findIndex((jl) => jl.includes('while ('));
      } else if (trimmed.startsWith('print(')) {
        matchIdx = javaArr.findIndex((jl) => jl.includes('System.out.print'));
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

  // Execution & Verification Status classification (Section 12)
  const verificationBadge = useMemo(() => {
    if (verificationReport) {
      if (verificationReport.status === 'behavioral_match') return { label: 'Behavioral tests passed', tone: 'text-emerald-400' };
      if (verificationReport.status === 'behavioral_mismatch') return { label: 'Behavioral mismatch', tone: 'text-amber-400' };
      if (verificationReport.status === 'compilation_failed') return { label: 'Compilation failed', tone: 'text-rose-400' };
      if (verificationReport.status === 'execution_failed') return { label: 'Executed (runtime error)', tone: 'text-rose-400' };
      return { label: 'Inconclusive', tone: 'text-amber-400' };
    }
    if (javaRunResult) {
      if (javaRunResult.compilerError) return { label: 'Compilation failed', tone: 'text-rose-400' };
      return { label: javaRunResult.ok ? 'Executed (Java only)' : 'Compiled (runtime error)', tone: javaRunResult.ok ? 'text-sky-400' : 'text-amber-400' };
    }
    if (javaCode.trim()) return { label: 'Static analysis only (not verified)', tone: 'text-slate-400' };
    return { label: 'Not verified', tone: 'text-slate-500' };
  }, [verificationReport, javaRunResult, javaCode]);

  // Handlers
  const handleRunPython = async () => {
    if (!pythonCode?.trim() || isRunningPython) return;
    setIsRunningPython(true);
    setDrawerCollapsed(false);
    setDrawerTab('console');
    try {
      const res = await fetch('/api/v1/run-python', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ python_code: pythonCode, stdin: programStdin }),
      });
      const data = await res.json();
      setPythonRunResult(data);
    } catch {
      setPythonRunResult({ ok: false, exitCode: 1, stdout: '', stderr: 'Failed to contact Python sandbox.' });
    } finally {
      setIsRunningPython(false);
    }
  };

  const handleRunJava = async () => {
    if (!javaCode?.trim() || isRunningJava) return;
    setIsRunningJava(true);
    setDrawerCollapsed(false);
    setDrawerTab('console');
    try {
      const res = await fetch('/api/v1/run-java', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ java_code: javaCode, stdin: programStdin }),
      });
      const data = await res.json();
      setJavaRunResult(data);
    } catch {
      setJavaRunResult({ ok: false, exitCode: 1, stdout: '', stderr: 'Failed to contact OpenJDK 21 sandbox.', compilerError: '' });
    } finally {
      setIsRunningJava(false);
    }
  };

  const handleRunIntelligence = async (action) => {
    if (!pythonCode?.trim() || intelLoadingAction) return;
    setIntelLoadingAction(action);
    setAiMenuOpen(false);
    setPendingAiJavaPatch(null);
    try {
      const res = await fetch('/api/v1/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          python_code: pythonCode,
          java_code: javaCode || '// empty',
          selected_code: selectedPython || '',
          compiler_error: verificationReport?.java?.compilerError || javaRunResult?.compilerError || '',
          verification_report: verificationReport,
          compatibility_report: compatibilityReport,
          java_version: javaTargetVersion.replace(/[^0-9]/g, '') || '21',
        }),
      });
      const data = await res.json();
      if (data?.ok) {
        setDrawerCollapsed(false);
        if (data.explanation) {
          setAiExplanation(data.explanation);
          setDrawerTab('explanation');
        } else if (action === 'generate-tests' && data.testCode) {
          setGeneratedUnitTest(data.testCode);
          setDrawerTab('tests');
        } else if (data.javaCode) {
          // Preview/Apply/Reject workflow instead of opaque silent overwrite
          setPendingAiJavaPatch({ action, javaCode: data.javaCode });
        }
      }
    } finally {
      setIntelLoadingAction('');
    }
  };

  const handleConvertSelection = async () => {
    const sel = selectedPython.trim();
    if (!sel || isConvertingSelection) return;
    setIsConvertingSelection(true);
    setSelectionJavaResult(null);
    try {
      const res = await fetch('/api/v1/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'explain-selection',
          python_code: pythonCode,
          java_code: javaCode || '// selection',
          selected_code: sel,
          java_version: javaTargetVersion.replace(/[^0-9]/g, '') || '21',
        }),
      });
      const intelData = await res.json();
      // Also run dedicated partial conversion via transpile endpoint
      const actionRes = await fetch('/api/v1/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'to-oop',
          python_code: sel,
          java_code: `// Standalone fragment requested for:\n// ${sel.split('\n')[0]}`,
          selected_code: sel,
          java_version: javaTargetVersion.replace(/[^0-9]/g, '') || '21',
        }),
      });
      const codeData = await actionRes.json();
      setSelectionJavaResult({
        selectedPython: sel,
        explanation: intelData?.explanation || '',
        javaFragment: codeData?.javaCode || '// Enable GEMINI_API_KEY for full selection conversion.',
        standaloneNote: /^import\s+/m.test(pythonCode) ? 'Requires enclosing file imports/context.' : 'Self-contained block.',
      });
    } catch {
      setSelectionJavaResult({
        selectedPython: sel,
        explanation: 'Selection conversion failed.',
        javaFragment: '',
        standaloneNote: 'Error',
      });
    } finally {
      setIsConvertingSelection(false);
    }
  };

  const handleImportGithubUrl = async () => {
    const clean = githubUrl.trim();
    if (!clean) return;
    setIsImportingGithub(true);
    try {
      const res = await fetch('/api/v1/import-github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: clean }),
      });
      const data = await res.json();
      if (data?.ok && data.code) {
        setPythonCode(data.code);
        setGithubInputOpen(false);
        setGithubUrl('');
      }
    } finally {
      setIsImportingGithub(false);
    }
  };

  const loadPythonFileObject = async (file) => {
    if (!file) return;
    const text = await file.text();
    setPythonCode(text.slice(0, 60000));
    if (conversionTitle === 'Untitled conversion' && file.name) {
      onChangeTitle(file.name.replace(/\.py$/i, ''));
    }
  };

  const handleFormatPython = () => {
    const formatted = pythonCode
      .split('\n')
      .map((line) => line.replace(/\t/g, '    ').replace(/\s+$/, ''))
      .join('\n')
      .trimEnd();
    setPythonCode(formatted);
  };

  const handleReplaceInPython = () => {
    if (!findQuery) return;
    setPythonCode((prev) => prev.split(findQuery).join(replaceQuery));
  };

  const handleDownloadPython = () => {
    const blob = new Blob([pythonCode || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'main.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJUnitTest = () => {
    const content = generatedUnitTest || generateJUnitTestSuite({ javaCode, verificationReport });
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SolutionTest.java';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPassport = (format = 'md') => {
    const { passportJson, passportMarkdown } = buildConversionPassport({
      title: conversionTitle,
      pythonCode,
      javaCode,
      javaVersion: javaTargetVersion,
      conversionMode,
      compatibilityReport,
      dependencyMappings,
      verificationReport,
      qualityReport,
    });
    const content = format === 'json' ? JSON.stringify(passportJson, null, 2) : passportMarkdown;
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = format === 'json' ? 'conversion-passport.json' : 'conversion-passport.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadProjectZip = () => {
    const junitCode = generatedUnitTest || generateJUnitTestSuite({ javaCode, verificationReport });
    const files = buildJavaProjectFiles({
      javaCode,
      junitCode,
      pythonCode,
      javaVersion: javaTargetVersion,
      verificationReport,
    });
    const zipBytes = buildZipBytes(files);
    const blob = new Blob([zipBytes], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jforge-java-project.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Resizable split drag handler
  const handleStartSplitDrag = (e) => {
    e.preventDefault();
    const container = splitContainerRef.current;
    if (!container) return;
    const onMove = (moveEvent) => {
      const rect = container.getBoundingClientRect();
      const pct = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.min(72, Math.max(28, pct)));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Auto-indent & Bracket Matching KeyDown handler in Python editor
  const handlePythonKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      setSearchOpen((v) => !v);
      return;
    }
    const textarea = e.target;
    const { selectionStart, selectionEnd, value } = textarea;
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextVal = value.slice(0, selectionStart) + '    ' + value.slice(selectionEnd);
      setPythonCode(nextVal);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 4;
      });
      return;
    }
    if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      const before = value.slice(0, selectionStart);
      const currentLine = before.split('\n').pop() || '';
      const indentMatch = currentLine.match(/^(\s*)/);
      const baseIndent = indentMatch ? indentMatch[1] : '';
      const extra = currentLine.trimEnd().endsWith(':') ? '    ' : '';
      const insertText = `\n${baseIndent}${extra}`;
      const nextVal = before + insertText + value.slice(selectionEnd);
      setPythonCode(nextVal);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + insertText.length;
      });
      return;
    }
    const pairs = { '(': ')', '[': ']', '{': '}' };
    if (pairs[e.key] && selectionStart === selectionEnd) {
      e.preventDefault();
      const nextVal = value.slice(0, selectionStart) + e.key + pairs[e.key] + value.slice(selectionEnd);
      setPythonCode(nextVal);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
      });
    }
  };

  const capturePythonSelection = () => {
    const el = pyTextareaRef.current;
    if (!el) return;
    const sel = el.value.slice(el.selectionStart, el.selectionEnd);
    if (sel !== selectedPython) {
      onSelectPython(sel);
    }
  };

  const focusJavaLine = (lineNum) => {
    const targetEl = document.querySelector('textarea[aria-label="Java Output Editor"]');
    if (!targetEl || !lineNum) return;
    const lines = javaCode.split('\n');
    const offset = lines.slice(0, Math.max(0, lineNum - 1)).reduce((acc, l) => acc + l.length + 1, 0);
    targetEl.focus();
    targetEl.setSelectionRange(offset, offset + (lines[lineNum - 1]?.length || 0));
  };

  const pyLines = pythonCode ? pythonCode.split('\n') : [''];
  const javaLines = javaCode ? javaCode.split('\n') : [''];
  const className = (conversionConfig?.className || 'Solution').trim() || 'Solution';
  const filteredProblems = problemItems.filter(
    (p) => !problemFilter.trim() || p.message.toLowerCase().includes(problemFilter.toLowerCase()) || p.source.toLowerCase().includes(problemFilter.toLowerCase())
  );
  const errorCount = problemItems.filter((p) => p.severity === 'error').length;
  const warningCount = problemItems.filter((p) => p.severity === 'warning').length;

  return (
    <section
      className={`flex flex-col gap-3 ${
        isFullscreen ? 'fixed inset-0 z-40 p-3 sm:p-4 overflow-y-auto' : ''
      }`}
      style={isFullscreen ? { backgroundColor: 'var(--bg-app)' } : undefined}
    >
      {/* Top Studio Bar: Editable Conversion Title + Status + Export */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <input
            type="text"
            value={conversionTitle}
            onChange={(e) => onChangeTitle(e.target.value)}
            maxLength={72}
            className="bg-transparent text-sm sm:text-base font-semibold heading-font focus:outline-none focus:underline truncate max-w-[240px] sm:max-w-xs"
            aria-label="Conversion Title"
          />
          <button
            onClick={onNewConversion}
            className="t-btn-secondary px-2 py-0.5 text-[11px] font-mono cursor-pointer"
            title="Start a blank new conversion"
          >
            + New
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            {settings.autoSaveDraft ? autoSaveStatus : 'Draft saving off'}
          </span>

          <div className="relative">
            <button
              onClick={() => setExportMenuOpen((v) => !v)}
              className="t-btn-secondary px-2.5 py-1 text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
            {exportMenuOpen && (
              <div
                className="absolute right-0 mt-1 w-56 t-surface p-1.5 z-40 shadow-xl space-y-0.5 text-xs font-mono"
                onMouseLeave={() => setExportMenuOpen(false)}
              >
                <button onClick={() => { setExportMenuOpen(false); onDownloadJava(); }} className="w-full text-left px-2.5 py-1.5 rounded hover:bg-white/5 cursor-pointer flex items-center justify-between">
                  <span>{className}.java</span><span className="opacity-50">.java</span>
                </button>
                <button onClick={() => { setExportMenuOpen(false); handleDownloadPython(); }} className="w-full text-left px-2.5 py-1.5 rounded hover:bg-white/5 cursor-pointer flex items-center justify-between">
                  <span>main.py</span><span className="opacity-50">.py</span>
                </button>
                <button onClick={() => { setExportMenuOpen(false); handleDownloadJUnitTest(); }} className="w-full text-left px-2.5 py-1.5 rounded hover:bg-white/5 cursor-pointer flex items-center justify-between">
                  <span>SolutionTest.java</span><span className="opacity-50">JUnit 5</span>
                </button>
                <button onClick={() => { setExportMenuOpen(false); handleDownloadPassport('md'); }} className="w-full text-left px-2.5 py-1.5 rounded hover:bg-white/5 cursor-pointer flex items-center justify-between">
                  <span>Conversion Passport</span><span className="opacity-50">.md</span>
                </button>
                <button onClick={() => { setExportMenuOpen(false); handleDownloadPassport('json'); }} className="w-full text-left px-2.5 py-1.5 rounded hover:bg-white/5 cursor-pointer flex items-center justify-between">
                  <span>Conversion Passport</span><span className="opacity-50">.json</span>
                </button>
                <button onClick={() => { setExportMenuOpen(false); handleDownloadProjectZip(); }} className="w-full text-left px-2.5 py-1.5 rounded hover:bg-white/5 cursor-pointer flex items-center justify-between">
                  <span>Maven Project Archive</span><span className="opacity-50">.zip</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compact Toolbar Row (Matching Mockup: Python 3 -> Java 21 · Mode · Configure) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span className="t-subtle px-2.5 py-1 flex items-center gap-1.5 font-medium">
            <span>Python 3</span>
          </span>
          <span className="opacity-60 px-0.5">→</span>
          <select
            value={javaTargetVersion}
            onChange={(e) => setJavaTargetVersion(e.target.value)}
            className="t-btn-secondary px-2.5 py-1 text-xs font-mono focus:outline-none cursor-pointer"
            aria-label="Target Java Version"
          >
            <option value="Java 21 LTS">Java 21 LTS</option>
            <option value="Java 17 LTS">Java 17 LTS</option>
            <option value="Java 11 LTS">Java 11 LTS</option>
          </select>

          <select
            value={conversionMode}
            onChange={(e) => setConversionMode(e.target.value)}
            className="t-btn-secondary px-2.5 py-1 text-xs font-mono focus:outline-none cursor-pointer"
            aria-label="Conversion Mode"
            title="Conversion Strategy Mode"
          >
            <option value="strict">Mode: Strict Behavior</option>
            <option value="idiomatic">Mode: Idiomatic Java</option>
            <option value="beginner">Mode: Beginner-Friendly</option>
            <option value="oop">Mode: OOP Java</option>
            <option value="performance">Mode: Performance</option>
            <option value="streams">Mode: Java Streams</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono">
          <button
            onClick={() => setConfigOpen((v) => !v)}
            className={`px-2.5 py-1 text-xs flex items-center gap-1.5 cursor-pointer ${
              configOpen ? 't-btn-primary' : 't-btn-secondary'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Configure</span>
          </button>

          <button
            onClick={() => setShortcutsModalOpen(true)}
            className="t-btn-secondary p-1.5 cursor-pointer"
            title="Keyboard Shortcuts"
            aria-label="Keyboard Shortcuts"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsFullscreen((v) => !v)}
            className="t-btn-secondary p-1.5 cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Workspace'}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Collapsible Conversion Configuration Drawer */}
      {configOpen && (
        <div className="t-surface p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <label className="space-y-1">
            <span className="text-[11px] opacity-70 block">Package Name</span>
            <input
              type="text"
              value={conversionConfig.packageName || 'com.jforge.ciap'}
              onChange={(e) => setConversionConfig((c) => ({ ...c, packageName: e.target.value }))}
              className="w-full px-2.5 py-1 t-subtle focus:outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] opacity-70 block">Main Class Name</span>
            <input
              type="text"
              value={conversionConfig.className || 'Solution'}
              onChange={(e) => setConversionConfig((c) => ({ ...c, className: e.target.value }))}
              className="w-full px-2.5 py-1 t-subtle focus:outline-none"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={conversionConfig.includeComments !== false}
                onChange={(e) => setConversionConfig((c) => ({ ...c, includeComments: e.target.checked }))}
              />
              <span>Comments</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(conversionConfig.includeJavadoc)}
                onChange={(e) => setConversionConfig((c) => ({ ...c, includeJavadoc: e.target.checked }))}
              />
              <span>JavaDoc</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={conversionConfig.includeMain !== false}
                onChange={(e) => setConversionConfig((c) => ({ ...c, includeMain: e.target.checked }))}
              />
              <span>main()</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={bypassCache}
                onChange={(e) => setBypassCache(e.target.checked)}
              />
              <span>Bypass Cache</span>
            </label>
          </div>
          <label className="space-y-1">
            <span className="text-[11px] opacity-70 block">Custom Instructions</span>
            <input
              type="text"
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              maxLength={250}
              placeholder="e.g., use BigInteger for factorials..."
              className="w-full px-2.5 py-1 t-subtle focus:outline-none"
            />
          </label>
        </div>
      )}

      {/* Search & Replace Bar (Cmd/Ctrl + F) */}
      {searchOpen && (
        <div className="t-surface px-3 py-2 flex flex-wrap items-center gap-2 text-xs font-mono">
          <Search className="w-3.5 h-3.5 opacity-60" />
          <input
            type="text"
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            placeholder="Find in Python..."
            className="px-2 py-1 t-subtle focus:outline-none w-40"
          />
          <input
            type="text"
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            placeholder="Replace with..."
            className="px-2 py-1 t-subtle focus:outline-none w-40"
          />
          <button onClick={handleReplaceInPython} className="t-btn-primary px-2.5 py-1 text-[11px] cursor-pointer">
            Replace All
          </button>
          <button onClick={() => setSearchOpen(false)} className="ml-auto p-1 opacity-60 hover:opacity-100 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Pending AI Edit Preview Banner */}
      {pendingAiJavaPatch && (
        <div className="t-surface p-3 border border-indigo-500/40 space-y-2 text-xs font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-indigo-400">Preview AI Change ({pendingAiJavaPatch.action})</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  onApplyJavaEdit(pendingAiJavaPatch.javaCode);
                  setPendingAiJavaPatch(null);
                }}
                className="t-btn-primary px-2.5 py-1 text-[11px] cursor-pointer"
              >
                Apply Change
              </button>
              <button
                onClick={() => setPendingAiJavaPatch(null)}
                className="t-btn-secondary px-2.5 py-1 text-[11px] cursor-pointer"
              >
                Reject
              </button>
            </div>
          </div>
          <pre className="p-2 rounded max-h-40 overflow-auto text-[11px]" style={{ backgroundColor: 'var(--bg-editor)' }}>
            {pendingAiJavaPatch.javaCode}
          </pre>
        </div>
      )}

      {/* Selection Conversion Separate Result Panel */}
      {selectionJavaResult && (
        <div className="t-surface p-3 border border-emerald-500/35 space-y-2 text-xs font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-emerald-400">
              Selection Conversion Output · <span className="opacity-75 font-normal">{selectionJavaResult.standaloneNote}</span>
            </span>
            <div className="flex items-center gap-1.5">
              {selectionJavaResult.javaFragment && (
                <button
                  onClick={() => copyToClipboard(selectionJavaResult.javaFragment, 'sel-java', 'Selection output copied')}
                  className="t-btn-secondary px-2 py-0.5 text-[11px] cursor-pointer"
                >
                  Copy Output
                </button>
              )}
              <button onClick={() => setSelectionJavaResult(null)} className="p-1 opacity-60 hover:opacity-100 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {selectionJavaResult.explanation && (
            <p className="text-[11px] opacity-85 whitespace-pre-wrap">{selectionJavaResult.explanation}</p>
          )}
          <pre className="p-2 rounded max-h-40 overflow-auto text-[11px]" style={{ backgroundColor: 'var(--bg-editor)' }}>
            {selectionJavaResult.javaFragment}
          </pre>
        </div>
      )}

      {/* Mobile Pane Switcher (Prevents horizontal overflow on narrow screens) */}
      <div className="flex lg:hidden items-center gap-1 p-1 t-subtle text-xs font-mono">
        <button
          onClick={() => setMobilePane('python')}
          className={`flex-1 py-1.5 rounded cursor-pointer ${mobilePane === 'python' ? 't-btn-primary' : ''}`}
        >
          main.py ({pyLines.length}L)
        </button>
        <button
          onClick={() => setMobilePane('java')}
          className={`flex-1 py-1.5 rounded cursor-pointer ${mobilePane === 'java' ? 't-btn-primary' : ''}`}
        >
          {className}.java ({javaLines.length}L)
        </button>
      </div>

      {/* Dual Resizable Code Editors */}
      <div
        ref={splitContainerRef}
        className="flex flex-col lg:flex-row t-surface overflow-hidden"
        style={{ height: isFullscreen ? 'calc(100vh - 340px)' : '370px', minHeight: '280px' }}
      >
        {/* LEFT PANE: Python Source */}
        <div
          className={`flex flex-col min-w-0 h-full ${mobilePane === 'java' ? 'hidden lg:flex' : 'flex'}`}
          style={{ width: undefined, flexBasis: `${splitPercent}%`, flexGrow: 1 }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDragActive(false);
            const file = e.dataTransfer?.files?.[0];
            if (file) await loadPythonFileObject(file);
          }}
        >
          {/* Pane Header */}
          <div className="px-3 py-2 t-border-b flex items-center justify-between gap-2 text-xs font-mono" style={{ backgroundColor: 'var(--bg-subtle)' }}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
              <span className="font-semibold truncate">main.py</span>
              {selectedPython.trim() && (
                <button
                  onClick={handleConvertSelection}
                  disabled={isConvertingSelection}
                  className="px-2 py-0.5 text-[10px] rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 cursor-pointer"
                >
                  {isConvertingSelection ? 'Converting...' : 'Convert Selection'}
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".py,.txt"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) await loadPythonFileObject(file);
                  e.target.value = '';
                }}
              />
              <button onClick={() => fileInputRef.current?.click()} className="p-1 opacity-75 hover:opacity-100 cursor-pointer" title="Upload .py file">
                <Upload className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setGithubInputOpen((v) => !v)} className="p-1 opacity-75 hover:opacity-100 cursor-pointer" title="Import from GitHub">
                <Link2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleFormatPython} className="p-1 opacity-75 hover:opacity-100 cursor-pointer" title="Format Python">
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => copyToClipboard(pythonCode, 'py', 'Python code copied')} className="p-1 opacity-75 hover:opacity-100 cursor-pointer" title="Copy Python">
                {copiedId === 'py' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button onClick={onClearEditor} className="p-1 opacity-75 hover:text-rose-400 cursor-pointer" title="Clear Editor">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {githubInputOpen && (
            <div className="px-3 py-1.5 t-border-b flex items-center gap-1.5 text-xs font-mono" style={{ backgroundColor: 'var(--bg-subtle)' }}>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/user/repo/blob/main/script.py"
                className="flex-1 px-2 py-1 t-surface focus:outline-none"
              />
              <button onClick={handleImportGithubUrl} disabled={isImportingGithub} className="t-btn-primary px-2.5 py-1 text-[11px] cursor-pointer">
                {isImportingGithub ? '...' : 'Import'}
              </button>
              <button onClick={() => setGithubInputOpen(false)} className="p-1 opacity-60 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Python Code Canvas + Subtle Empty State */}
          <div className={`relative flex-1 flex overflow-hidden ${isDragActive ? 'ring-2 ring-indigo-500' : ''}`}>
            {settings.showLineNumbers && (
              <div
                ref={pyGutterRef}
                className="editor-gutter w-10 py-3 px-2 font-mono overflow-hidden shrink-0"
                style={{ fontSize: `${settings.fontSize}px` }}
              >
                {pyLines.map((_, idx) => {
                  const num = idx + 1;
                  const mapped = hoveredJavaLine && astLineMap.javaToPy[hoveredJavaLine] === num;
                  return (
                    <div
                      key={num}
                      onMouseEnter={() => setHoveredPyLine(num)}
                      onMouseLeave={() => setHoveredPyLine(null)}
                      className={mapped ? 'text-indigo-400 font-bold' : ''}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>
            )}

            <textarea
              ref={pyTextareaRef}
              value={pythonCode}
              onChange={(e) => setPythonCode(e.target.value)}
              onKeyDown={handlePythonKeyDown}
              onSelect={capturePythonSelection}
              onKeyUp={capturePythonSelection}
              onMouseUp={capturePythonSelection}
              onScroll={(e) => {
                if (pyGutterRef.current) pyGutterRef.current.scrollTop = e.target.scrollTop;
              }}
              spellCheck={false}
              aria-label="Python Source Editor"
              className={`editor-area flex-1 p-3 font-mono focus:outline-none resize-none overflow-auto ${
                settings.wordWrap ? '!whitespace-pre-wrap' : ''
              }`}
              style={{ fontSize: `${settings.fontSize}px` }}
            />

            {/* Subtle Empty Workspace Guidance (Zero Preset Cards) */}
            {!pythonCode.trim() && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
                <div className="pointer-events-auto text-center space-y-2.5 max-w-xs">
                  <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                    Empty workspace — start by adding Python 3 code
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-mono">
                    <button
                      onClick={async () => {
                        try {
                          const txt = await navigator.clipboard.readText();
                          if (txt) setPythonCode(txt);
                        } catch {
                          pyTextareaRef.current?.focus();
                        }
                      }}
                      className="t-btn-secondary px-2.5 py-1 cursor-pointer"
                    >
                      Paste Python
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="t-btn-secondary px-2.5 py-1 cursor-pointer">
                      Upload .py
                    </button>
                    <button onClick={() => setGithubInputOpen(true)} className="t-btn-secondary px-2.5 py-1 cursor-pointer">
                      GitHub URL
                    </button>
                    {history.length > 0 && (
                      <div className="relative">
                        <button onClick={() => setRecentMenuOpen((v) => !v)} className="t-btn-secondary px-2.5 py-1 cursor-pointer">
                          Open Recent
                        </button>
                        {recentMenuOpen && (
                          <div className="absolute left-0 mt-1 w-56 t-surface p-1.5 z-40 shadow-xl text-left space-y-0.5">
                            {history.slice(0, 5).map((h) => (
                              <button
                                key={h.id}
                                onClick={() => {
                                  onRestoreHistory(h);
                                  setRecentMenuOpen(false);
                                }}
                                className="w-full text-left px-2 py-1 rounded hover:bg-white/5 truncate cursor-pointer text-[11px]"
                              >
                                {h.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Drag Divider */}
        <div
          onMouseDown={handleStartSplitDrag}
          className="hidden lg:block w-1 cursor-col-resize hover:bg-indigo-500/60 transition shrink-0"
          style={{ backgroundColor: 'var(--border-color)' }}
          title="Drag to resize editors"
        />

        {/* RIGHT PANE: Editable Java Output */}
        <div
          className={`flex flex-col min-w-0 h-full ${mobilePane === 'python' ? 'hidden lg:flex' : 'flex'}`}
          style={{ width: undefined, flexBasis: `${100 - splitPercent}%`, flexGrow: 1 }}
        >
          <div className="px-3 py-2 t-border-b flex items-center justify-between gap-2 text-xs font-mono" style={{ backgroundColor: 'var(--bg-subtle)' }}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
              <span className="font-semibold truncate">{className}.java</span>
              {hoveredPyLine && astLineMap.pyToJava[hoveredPyLine] && (
                <span className="text-[10px] px-1.5 py-0.5 rounded t-surface text-indigo-400">
                  Py L{hoveredPyLine} → L{astLineMap.pyToJava[hoveredPyLine]}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {canUndoJava && (
                <button onClick={onUndoJava} className="p-1 text-amber-400 hover:opacity-80 cursor-pointer" title="Undo Java edit">
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => copyToClipboard(javaCode, 'java', 'Java code copied')} className="p-1 opacity-75 hover:opacity-100 cursor-pointer" title="Copy Java">
                {copiedId === 'java' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button onClick={onDownloadJava} className="p-1 opacity-75 hover:opacity-100 cursor-pointer" title={`Download ${className}.java`}>
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="relative flex-1 flex overflow-hidden">
            {settings.showLineNumbers && (
              <div
                ref={javaGutterRef}
                className="editor-gutter w-10 py-3 px-2 font-mono overflow-hidden shrink-0"
                style={{ fontSize: `${settings.fontSize}px` }}
              >
                {javaLines.map((_, idx) => {
                  const num = idx + 1;
                  const isErr = compilerErrorLines.has(num);
                  const isMapped = hoveredPyLine && astLineMap.pyToJava[hoveredPyLine] === num;
                  return (
                    <div
                      key={num}
                      onMouseEnter={() => setHoveredJavaLine(num)}
                      onMouseLeave={() => setHoveredJavaLine(null)}
                      className={isErr ? 'text-rose-400 font-bold bg-rose-500/15' : isMapped ? 'text-indigo-400 font-bold' : ''}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>
            )}

            <textarea
              ref={javaTextareaRef}
              value={javaCode}
              onChange={(e) => setJavaCode(e.target.value)}
              onScroll={(e) => {
                if (javaGutterRef.current) javaGutterRef.current.scrollTop = e.target.scrollTop;
              }}
              spellCheck={false}
              aria-label="Java Output Editor"
              placeholder="// Converted Java output appears here (editable)"
              className={`editor-area-java flex-1 p-3 font-mono focus:outline-none resize-none overflow-auto ${
                settings.wordWrap ? '!whitespace-pre-wrap' : ''
              }`}
              style={{ fontSize: `${settings.fontSize}px` }}
            />
          </div>
        </div>
      </div>

      {/* Primary Action Bar (Clean Indigo Primary Action + Run + Explain, matching Mockup) */}
      <div className="flex flex-wrap sm:flex-nowrap items-stretch gap-2">
        <button
          onClick={isTranspiling ? onCancelTranspile : () => onTranspile({ verify: true })}
          disabled={!pythonCode?.trim() && !isTranspiling}
          className="flex-1 py-2.5 px-4 t-btn-primary text-xs sm:text-sm font-mono flex items-center justify-center gap-2 cursor-pointer disabled:opacity-45"
        >
          {isTranspiling || isVerifying ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>{isTranspiling ? 'Cancel Conversion' : 'Verifying Python vs Java...'}</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Convert &amp; Verify</span>
            </>
          )}
        </button>

        {/* Run Menu (Run Python / Run Java / Convert Only / Stdin) */}
        <div className="relative flex">
          <button
            onClick={handleRunJava}
            disabled={isRunningJava || !javaCode?.trim()}
            className="t-btn-secondary px-3.5 py-2 text-xs font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-45 rounded-r-none border-r-0"
            title="Run generated Java in isolated OpenJDK 21 sandbox"
          >
            {isRunningJava ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>Run</span>
          </button>
          <button
            onClick={() => setRunMenuOpen((v) => !v)}
            className="t-btn-secondary px-1.5 py-2 cursor-pointer rounded-l-none"
            title="Execution options (Run Python, Convert Only, Stdin)"
            aria-label="Run Options"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {runMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 t-surface p-1.5 z-40 shadow-xl text-xs font-mono space-y-0.5">
              <button
                disabled={!pythonCode?.trim() || isRunningPython}
                onClick={() => { setRunMenuOpen(false); handleRunPython(); }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-white/5 cursor-pointer disabled:opacity-45"
              >
                {isRunningPython ? 'Running Python...' : 'Run Python (CPython 3.13)'}
              </button>
              <button
                disabled={!javaCode?.trim() || isRunningJava}
                onClick={() => { setRunMenuOpen(false); handleRunJava(); }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-white/5 cursor-pointer disabled:opacity-45"
              >
                Run Java (OpenJDK 21)
              </button>
              <button
                disabled={!pythonCode?.trim() || isTranspiling}
                onClick={() => { setRunMenuOpen(false); onTranspile({ verify: false }); }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-white/5 cursor-pointer disabled:opacity-45"
              >
                Convert Only (No Sandbox)
              </button>
              <button
                disabled={!pythonCode?.trim() || !javaCode?.trim() || isRepairing}
                onClick={() => { setRunMenuOpen(false); onRepairJava(); }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-white/5 cursor-pointer disabled:opacity-45"
              >
                Auto Fix (`javac` up to 3x)
              </button>
              <button
                onClick={() => { setRunMenuOpen(false); setStdinOpen((v) => !v); }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-white/5 cursor-pointer"
              >
                {stdinOpen ? 'Hide Stdin Input' : 'Provide Stdin Input'}
              </button>
            </div>
          )}
        </div>

        {/* Explain & AI Intelligence Menu */}
        <div className="relative flex">
          <button
            onClick={() => handleRunIntelligence('explain')}
            disabled={Boolean(intelLoadingAction) || !pythonCode?.trim()}
            className="t-btn-secondary px-3.5 py-2 text-xs font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-45 rounded-r-none border-r-0"
            title="Explain Python to Java conversion"
          >
            {intelLoadingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
            <span>Explain</span>
          </button>
          <button
            onClick={() => setAiMenuOpen((v) => !v)}
            className="t-btn-secondary px-1.5 py-2 cursor-pointer rounded-l-none"
            title="All AI Code Intelligence Actions"
            aria-label="AI Actions Menu"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {aiMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 t-surface p-1.5 z-40 shadow-xl text-xs font-mono space-y-0.5 max-h-80 overflow-y-auto">
              {[
                ['explain', 'Explain Code'],
                ['explain-selection', 'Explain Selected Code'],
                ['find-bugs', 'Find Bugs'],
                ['fix-errors', 'Fix Errors'],
                ['optimize', 'Optimize Code'],
                ['refactor', 'Refactor Code'],
                ['readability', 'Improve Readability'],
                ['comments', 'Add Comments'],
                ['javadoc', 'Generate JavaDoc'],
                ['to-oop', 'Convert to OOP'],
                ['to-streams', 'Convert to Java Streams'],
                ['diff-explain', 'Explain Python vs Java'],
                ['generate-tests', 'Generate JUnit 5 Tests'],
              ].map(([act, lbl]) => (
                <button
                  key={act}
                  disabled={!pythonCode?.trim() || (act === 'explain-selection' && !selectedPython.trim())}
                  onClick={() => handleRunIntelligence(act)}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-white/5 cursor-pointer disabled:opacity-40"
                >
                  {lbl}
                </button>
              ))}
              <div className="pt-1 mt-1 t-border-t">
                <button
                  onClick={() => { setAiMenuOpen(false); onToggleAssistant(); }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-white/5 text-indigo-400 cursor-pointer"
                >
                  Open AI Assistant Panel →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Optional Custom Stdin & Multi-Case Bar */}
      {stdinOpen && (
        <div className="t-surface p-3 space-y-2.5 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-2">
            <span className="opacity-70">Program Stdin:</span>
            <input
              type="text"
              value={programStdin}
              onChange={(e) => setProgramStdin(e.target.value)}
              placeholder="Optional stdin input (for input() / Scanner)..."
              className="flex-1 min-w-[200px] px-2.5 py-1 t-subtle focus:outline-none"
            />
            <button
              onClick={() => setTestCasesOpen((v) => !v)}
              className="t-btn-secondary px-2.5 py-1 text-[11px] cursor-pointer"
            >
              {testCasesOpen ? 'Hide Cases' : `Test Cases (${multiTestCases.length})`}
            </button>
            <button
              onClick={onVerifyOnly}
              disabled={isVerifying || !pythonCode?.trim() || !javaCode?.trim()}
              className="t-btn-primary px-2.5 py-1 text-[11px] cursor-pointer disabled:opacity-50"
            >
              Verify Cases
            </button>
          </div>

          {testCasesOpen && (
            <div className="space-y-1.5 pt-2 t-border-t">
              <div className="flex items-center justify-between">
                <span className="text-[11px] opacity-70">Compare Python vs Java across stdin test cases (max 4):</span>
                {multiTestCases.length < 4 && (
                  <button
                    onClick={() =>
                      setMultiTestCases((prev) => [...prev, { name: `Case ${prev.length + 1}`, stdin: '' }])
                    }
                    className="t-btn-secondary px-2 py-0.5 text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Case
                  </button>
                )}
              </div>
              {multiTestCases.map((tc, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={tc.name}
                    onChange={(e) =>
                      setMultiTestCases((prev) => prev.map((c, i) => (i === idx ? { ...c, name: e.target.value } : c)))
                    }
                    className="w-28 px-2 py-1 t-subtle text-[11px] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={tc.stdin}
                    onChange={(e) =>
                      setMultiTestCases((prev) => prev.map((c, i) => (i === idx ? { ...c, stdin: e.target.value } : c)))
                    }
                    placeholder="stdin payload..."
                    className="flex-1 px-2 py-1 t-subtle text-[11px] focus:outline-none"
                  />
                  <button
                    onClick={() => setMultiTestCases((prev) => prev.filter((_, i) => i !== idx))}
                    className="p-1 text-rose-400 cursor-pointer"
                    aria-label="Remove test case"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resizable & Collapsible 9-Tab Bottom Developer Console Panel */}
      <div className="t-surface overflow-hidden flex flex-col">
        <div
          className="px-3 py-1.5 t-border-b flex flex-wrap items-center justify-between gap-2"
          style={{ backgroundColor: 'var(--bg-subtle)' }}
        >
          <div className="flex flex-wrap items-center gap-1 text-xs font-mono">
            {[
              { id: 'console', label: 'Console' },
              { id: 'problems', label: `Problems`, count: errorCount + warningCount },
              { id: 'compiler', label: 'Compiler' },
              { id: 'verification', label: 'Verification' },
              { id: 'tests', label: 'Unit Tests' },
              { id: 'compatibility', label: 'Compatibility' },
              { id: 'dependencies', label: 'Dependencies' },
              { id: 'explanation', label: 'Explanation' },
              { id: 'ast', label: 'AST Mapping' },
            ].map((t) => {
              const active = drawerTab === t.id && !drawerCollapsed;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setDrawerTab(t.id);
                    setDrawerCollapsed(false);
                  }}
                  className={`px-2 py-1 rounded text-[11px] flex items-center gap-1 cursor-pointer transition ${
                    active ? 'font-semibold t-surface' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <span>{t.label}</span>
                  {typeof t.count === 'number' && t.count > 0 && (
                    <span className={`px-1 rounded text-[10px] ${errorCount > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <span className={`hidden sm:inline ${verificationBadge.tone}`}>{verificationBadge.label}</span>
            <button
              onClick={() => {
                setPythonRunResult(null);
                setJavaRunResult(null);
              }}
              className="p-1 opacity-70 hover:opacity-100 cursor-pointer"
              title="Clear console output"
            >
              <Trash2 className="w-3 h-3" />
            </button>
            <button
              onClick={() => setDrawerExpanded((v) => !v)}
              className="p-1 opacity-70 hover:opacity-100 cursor-pointer"
              title={drawerExpanded ? 'Restore panel height' : 'Expand panel height'}
            >
              {drawerExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
            <button
              onClick={() => setDrawerCollapsed((v) => !v)}
              className="p-1 opacity-70 hover:opacity-100 cursor-pointer"
              title={drawerCollapsed ? 'Expand console panel' : 'Collapse console panel'}
            >
              {drawerCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {!drawerCollapsed && (
          <div
            className="p-3.5 font-mono text-xs overflow-y-auto leading-relaxed"
            style={{
              backgroundColor: 'var(--bg-editor)',
              minHeight: '130px',
              maxHeight: drawerExpanded ? '380px' : '220px',
            }}
          >
            {drawerTab === 'console' && (
              <div className="space-y-2.5">
                {verificationReport?.compilationPassed ? (
                  <div className="text-emerald-400 flex items-center gap-1.5 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Compilation successful · {verificationReport.summary}</span>
                  </div>
                ) : verificationReport?.java?.compilerError ? (
                  <div className="text-rose-400 flex items-center gap-1.5 text-[11px]">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Compilation failed</span>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-2.5 rounded t-surface space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="opacity-75">Python output ({pythonRunResult?.runtime || 'CPython 3.13'})</span>
                      {(pythonRunResult || verificationReport?.python) && (
                        <span className="opacity-70">
                          Exit {(pythonRunResult || verificationReport?.python).exitCode} · {(pythonRunResult || verificationReport?.python).executionTimeMs}ms
                        </span>
                      )}
                    </div>
                    {(pythonRunResult || verificationReport?.python)?.stderr && (
                      <pre className="text-rose-400 whitespace-pre-wrap">{(pythonRunResult || verificationReport?.python).stderr}</pre>
                    )}
                    <pre className="whitespace-pre-wrap">
                      {(pythonRunResult || verificationReport?.python)?.stdout ||
                        executionStdout ||
                        '[Not executed yet. Click Convert & Verify or Run Python.]'}
                    </pre>
                  </div>

                  <div className="p-2.5 rounded t-surface space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="opacity-75">Java output ({javaRunResult?.compiler || 'OpenJDK 21'})</span>
                      {(javaRunResult || verificationReport?.java) && (
                        <span className="opacity-70">
                          Exit {(javaRunResult || verificationReport?.java).exitCode} · {(javaRunResult || verificationReport?.java).executionTimeMs}ms
                        </span>
                      )}
                    </div>
                    {(javaRunResult || verificationReport?.java)?.compilerError && (
                      <pre className="text-rose-400 whitespace-pre-wrap">{(javaRunResult || verificationReport?.java).compilerError}</pre>
                    )}
                    {(javaRunResult || verificationReport?.java)?.stderr && (
                      <pre className="text-amber-400 whitespace-pre-wrap">{(javaRunResult || verificationReport?.java).stderr}</pre>
                    )}
                    <pre className="whitespace-pre-wrap">
                      {(javaRunResult || verificationReport?.java)?.stdout || '[Not executed yet. Click Convert & Verify or Run Java.]'}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {drawerTab === 'problems' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={problemFilter}
                    onChange={(e) => setProblemFilter(e.target.value)}
                    placeholder="Filter diagnostics (e.g., javac, Compatibility)..."
                    className="px-2 py-1 t-subtle text-[11px] w-72 focus:outline-none"
                  />
                  <span className="text-[11px] opacity-70">
                    {errorCount} error(s) · {warningCount} warning(s)
                  </span>
                </div>
                {filteredProblems.length === 0 ? (
                  <p className="opacity-70 text-[11px]">No compiler errors or compatibility warnings reported.</p>
                ) : (
                  filteredProblems.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => p.line && focusJavaLine(p.line)}
                      className={`w-full text-left p-2 rounded t-surface flex items-center justify-between gap-2 text-[11px] ${
                        p.line ? 'cursor-pointer hover:border-indigo-500/40' : ''
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${p.severity === 'error' ? 'text-rose-400' : 'text-amber-400'}`} />
                        <span>[{p.source}] {p.message}</span>
                      </span>
                      {p.line && <span className="opacity-70 shrink-0">Line {p.line}</span>}
                    </button>
                  ))
                )}
              </div>
            )}

            {drawerTab === 'compiler' && (
              <div className="space-y-2.5 text-[11px]">
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded t-surface">
                  <span>
                    <strong>javac Status: </strong>
                    {verificationReport
                      ? verificationReport.compilationPassed
                        ? 'Passed cleanly'
                        : 'Compilation failed'
                      : javaRunResult
                      ? javaRunResult.compilerError
                        ? 'Compilation failed'
                        : 'Passed cleanly'
                      : 'Not compiled yet'}
                  </span>
                  <button
                    onClick={onRepairJava}
                    disabled={isRepairing || isVerifying || !pythonCode?.trim() || !javaCode?.trim()}
                    className="t-btn-secondary px-2.5 py-1 flex items-center gap-1 cursor-pointer disabled:opacity-45"
                  >
                    <Wrench className="w-3 h-3" />
                    <span>{isRepairing ? 'Repairing...' : 'Auto Fix (Max 3 Attempts)'}</span>
                  </button>
                </div>

                {(verificationReport?.java?.compilerError || javaRunResult?.compilerError) && (
                  <pre className="p-2.5 rounded border border-rose-500/30 bg-rose-500/5 text-rose-400 whitespace-pre-wrap">
                    {verificationReport?.java?.compilerError || javaRunResult?.compilerError}
                  </pre>
                )}

                {Array.isArray(verificationReport?.repairedAttempts) && verificationReport.repairedAttempts.length > 0 && (
                  <div className="space-y-1">
                    <div className="font-semibold flex items-center justify-between">
                      <span>Repair Attempts ({verificationReport.repairedAttempts.length} / 3)</span>
                      {canUndoJava && (
                        <button onClick={onUndoJava} className="text-amber-400 cursor-pointer flex items-center gap-1">
                          <Undo2 className="w-3 h-3" /> Rollback
                        </button>
                      )}
                    </div>
                    {verificationReport.repairedAttempts.map((att, idx) => (
                      <div key={idx} className="p-2 rounded t-surface">
                        <div>Pass #{att.pass} ({att.repairedBy}) → <strong>{att.statusAfter}</strong></div>
                        {att.appliedFixes?.length > 0 && <div className="opacity-75">{att.appliedFixes.join(' · ')}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {drawerTab === 'verification' && (
              <div className="space-y-2.5 text-[11px]">
                {!verificationReport ? (
                  <p className="opacity-75">Run <strong>Convert &amp; Verify</strong> to compare live CPython 3.13 vs OpenJDK 21 outputs.</p>
                ) : (
                  <>
                    <div className="p-2.5 rounded t-surface flex flex-wrap items-center justify-between gap-2">
                      <span><strong>Verdict:</strong> {verificationReport.summary}</span>
                      <span className="font-bold">{verificationReport.passedCases}/{verificationReport.totalCases} Passed</span>
                    </div>
                    {Array.isArray(verificationReport.cases) &&
                      verificationReport.cases.map((c, idx) => (
                        <div key={idx} className="p-2 rounded t-surface grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div><strong>{c.name}</strong> {c.stdin ? `(stdin: ${JSON.stringify(c.stdin)})` : ''}</div>
                          <div>Py: {c.pythonStdout || '(empty)'}</div>
                          <div className="flex items-center justify-between">
                            <span>Java: {c.javaStdout || c.compilerError || '(empty)'}</span>
                            <span className={c.matched ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              {c.matched ? 'PASS' : 'DIFF'}
                            </span>
                          </div>
                        </div>
                      ))}
                    <div className="p-2 rounded border border-amber-500/25 bg-amber-500/5 opacity-85">
                      Limitations: Verification checks tested inputs inside isolated Wandbox containers (25s timeout); it never proves equivalence across untested code branches.
                    </div>
                  </>
                )}
              </div>
            )}

            {drawerTab === 'tests' && (
              <div className="space-y-2 text-[11px]">
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded t-surface">
                  <span>JUnit 5 Suite (Static generation — not executed inside a Maven runner here)</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleRunIntelligence('generate-tests')} className="t-btn-primary px-2 py-0.5 cursor-pointer">
                      Generate Tests
                    </button>
                    <button
                      onClick={() => copyToClipboard(generatedUnitTest || generateJUnitTestSuite({ javaCode, verificationReport }), 'junit', 'JUnit copied')}
                      className="t-btn-secondary px-2 py-0.5 cursor-pointer"
                    >
                      Copy
                    </button>
                    <button onClick={handleDownloadJUnitTest} className="t-btn-secondary px-2 py-0.5 cursor-pointer">
                      Download
                    </button>
                  </div>
                </div>
                <pre className="p-2.5 rounded t-surface whitespace-pre-wrap">
                  {generatedUnitTest || generateJUnitTestSuite({ javaCode, verificationReport })}
                </pre>
              </div>
            )}

            {drawerTab === 'compatibility' && (
              <div className="space-y-1.5 text-[11px]">
                <div className="p-2 rounded t-surface flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> {compatibilityReport.summary}</span>
                  <span>Status: {compatibilityReport.status}</span>
                </div>
                {compatibilityReport.findings.map((f, idx) => (
                  <div key={idx} className="p-2 rounded t-surface flex items-center justify-between gap-2">
                    <span>[{f.category}] {f.message}</span>
                    <span className="shrink-0 font-semibold opacity-80">{f.classification}</span>
                  </div>
                ))}
              </div>
            )}

            {drawerTab === 'dependencies' && (
              <div className="space-y-1.5 text-[11px]">
                {dependencyMappings.length === 0 ? (
                  <p className="opacity-75">No Python import statements detected.</p>
                ) : (
                  dependencyMappings.map((d, idx) => (
                    <div key={idx} className="p-2 rounded t-surface space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-sky-400" /> <strong>{d.pythonPkg}</strong> → {d.javaEquivalent}</span>
                        <span>{d.classification}</span>
                      </div>
                      <p className="opacity-80">{d.compatibilityNote}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {drawerTab === 'explanation' && (
              <div className="space-y-2 text-[11px]">
                {aiExplanation ? (
                  <pre className="p-2.5 rounded t-surface whitespace-pre-wrap font-sans leading-relaxed">{aiExplanation}</pre>
                ) : (
                  <p className="opacity-75">Click <strong>Explain</strong> above to analyze conversion semantics, or inspect static heuristics below.</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2 rounded t-surface">Est. Time: <strong>{qualityReport.estimatedTimeComplexity}</strong></div>
                  <div className="p-2 rounded t-surface">Est. Space: <strong>{qualityReport.estimatedSpaceComplexity}</strong></div>
                </div>
              </div>
            )}

            {drawerTab === 'ast' && (
              <div className="space-y-2.5 text-[11px]">
                <AstTypeBar pythonCode={pythonCode} selectedRule={selectedAstRule} onSelectRule={setSelectedAstRule} />
                {Object.entries(astLineMap.pyToJava).length > 0 ? (
                  <div className="space-y-1">
                    {Object.entries(astLineMap.pyToJava).map(([pyNum, jNum]) => (
                      <div
                        key={pyNum}
                        onMouseEnter={() => setHoveredPyLine(Number(pyNum))}
                        onMouseLeave={() => setHoveredPyLine(null)}
                        className="p-1.5 rounded t-surface grid grid-cols-1 md:grid-cols-2 gap-2 cursor-pointer"
                      >
                        <div className="truncate"><strong className="text-amber-400">Py L{pyNum}:</strong> {(pyLines[Number(pyNum) - 1] || '').trim()}</div>
                        <div className="truncate"><strong className="text-emerald-400">Java L{jNum}:</strong> {(javaLines[Number(jNum) - 1] || '').trim()}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="opacity-70">Convert Python code above to populate reliable line-level mappings.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Crisp Status Bar Footer */}
      <div className="px-2.5 py-1 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono opacity-75">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            {isTranspiling || isVerifying ? <Clock className="w-3 h-3 animate-spin" /> : <Terminal className="w-3 h-3" />}
            <span>{isTranspiling ? 'Converting' : isVerifying ? 'Verifying' : 'Ready'}</span>
          </span>
          <span>Py {pyLines.length}L · {pythonCode.length}C</span>
          <span>Java {javaLines.length}L</span>
        </div>
        <div className="flex items-center gap-3">
          <span>UTF-8</span>
          <span>{javaTargetVersion}</span>
          <span className="capitalize">{conversionMode}</span>
        </div>
      </div>

      {/* Shortcuts Reference Modal */}
      {shortcutsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setShortcutsModalOpen(false)}>
          <div className="t-surface max-w-md w-full p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between t-border-b pb-2.5">
              <div className="font-semibold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Keyboard Shortcuts</span>
              </div>
              <button onClick={() => setShortcutsModalOpen(false)} className="p-1 opacity-70 hover:opacity-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs font-mono">
              {[
                ['Convert & Verify', 'Cmd / Ctrl + Enter'],
                ['Command Palette', 'Cmd / Ctrl + K'],
                ['Find & Replace (Python)', 'Cmd / Ctrl + F'],
                ['Indent Selection / Line', 'Tab (4 spaces)'],
                ['Auto-Indent Colon Blocks', 'Enter after :'],
              ].map(([desc, key]) => (
                <div key={desc} className="flex items-center justify-between py-1">
                  <span style={{ color: 'var(--text-secondary)' }}>{desc}</span>
                  <kbd className="px-2 py-0.5 rounded t-subtle">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
