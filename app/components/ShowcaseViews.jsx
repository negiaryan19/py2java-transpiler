'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  Zap,
  ShieldCheck,
  BarChart3,
  Layout,
  Sparkles,
  Play,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Wrench,
  Send,
  Loader2,
  Check,
  Plus,
  History,
  ArrowLeftRight,
} from 'lucide-react';
import BrandMark from './BrandMark';
import { buildConversionPassport } from '../../lib/compatibility';

/**
 * Screen 1: Hero Landing View (zero fake testimonials, zero fake metrics, zero presets)
 */
export function LandingHeroView({
  onStartConverting = () => {},
  onOpenDocs = () => {},
  onOpenDashboard = () => {},
  authUser = null,
}) {
  return (
    <div className="cosmic-backdrop min-h-[calc(100vh-3rem)] flex flex-col justify-between py-10 px-4 sm:px-8">
      <div className="max-w-6xl w-full mx-auto space-y-12 my-auto">
        {/* Sub-nav row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <BrandMark size="lg" />
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-mono">
            <button onClick={onOpenDashboard} className="opacity-80 hover:opacity-100 cursor-pointer">
              Dashboard
            </button>
            <button onClick={onStartConverting} className="opacity-80 hover:opacity-100 cursor-pointer">
              Conversion Studio
            </button>
            <button onClick={onOpenDocs} className="opacity-80 hover:opacity-100 cursor-pointer">
              Docs
            </button>
            <a
              href="https://github.com/negiaryan19/py2java-transpiler"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-80 hover:opacity-100"
            >
              GitHub
            </a>
            {!authUser && (
              <a href="/login" className="t-btn-secondary px-3 py-1.5">
                Sign In
              </a>
            )}
            <button onClick={onStartConverting} className="t-btn-primary px-3.5 py-1.5 cursor-pointer">
              Get Started
            </button>
          </div>
        </div>

        {/* Hero Split Row matching Top-Left Screen */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight heading-font">
              J-Forge
              <br />
              Python to Java,
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #A78BFA, var(--primary-bg), #60A5FA)' }}
              >
                Powered by AI
              </span>
            </h1>
            <p className="text-sm sm:text-base max-w-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Convert, compile, verify, and inspect Python 3 code migrations into Java using deterministic AST rules, live CPython/OpenJDK verification, and AI diagnostics.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={onStartConverting}
                className="t-btn-primary px-5 py-2.5 text-xs sm:text-sm font-mono inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Start Converting</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenDocs}
                className="t-btn-secondary px-5 py-2.5 text-xs sm:text-sm font-mono inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Explore Docs</span>
              </button>
            </div>
          </div>

          {/* Right Visual Diagram Card: Python -> Java Pipeline */}
          <div className="t-surface p-6 sm:p-8 flex items-center justify-center gap-4 sm:gap-6 relative overflow-hidden">
            <div
              className="p-5 rounded-xl t-subtle flex flex-col items-center gap-2 min-w-[115px]"
              style={{ boxShadow: '0 0 28px rgba(245, 158, 11, 0.12)' }}
            >
              <span className="text-2xl font-mono font-bold text-amber-400">Py</span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                Python 3
              </span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                style={{ backgroundImage: 'linear-gradient(135deg, var(--primary-bg), var(--primary-hover))' }}
              >
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider opacity-70">AST + AI</span>
            </div>

            <div
              className="p-5 rounded-xl t-subtle flex flex-col items-center gap-2 min-w-[115px]"
              style={{ boxShadow: '0 0 28px var(--primary-glow)' }}
            >
              <span className="text-2xl font-mono font-bold text-indigo-400">Java</span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                OpenJDK 21
              </span>
            </div>
          </div>
        </div>

        {/* Bottom 4 Real Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
          {[
            {
              icon: Zap,
              title: 'AI-Powered Conversion',
              desc: 'Configurable modes, semantic AST fallbacks, and selection conversion.',
            },
            {
              icon: ShieldCheck,
              title: 'Live Execution & Verify',
              desc: 'Side-by-side CPython 3.13 & OpenJDK 21 verification with max-3 javac repair.',
            },
            {
              icon: BarChart3,
              title: 'Static Analysis',
              desc: 'Pre-conversion compatibility checks, dependency mapping & quality audit.',
            },
            {
              icon: Layout,
              title: 'Developer Studio UI',
              desc: 'Resizable split editor, keyboard shortcuts, command palette & passport export.',
            },
          ].map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.title} className="t-surface p-4 space-y-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundImage: 'linear-gradient(135deg, var(--primary-bg), var(--primary-hover))' }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-semibold">{feat.title}</h3>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Screen 3: Dashboard View matching Top-Right Panel (100% Real Telemetry, Zero Fake KPIs)
 */
export function DashboardWorkspaceView({
  authUser = null,
  history = [],
  workspaceFiles = [],
  verificationReport = null,
  onNewConversion = () => {},
  onOpenStudio = () => {},
  onOpenAssistant = () => {},
  onOpenHistory = () => {},
  onOpenAnalysis = () => {},
  onRestoreHistory = () => {},
}) {
  const totalSaved = history.length;
  const verifiedItems = history.filter((h) => h.verifiedStatus);
  const matchedItems = history.filter((h) => h.verifiedStatus === 'behavioral_match');
  const latestPassLabel = verificationReport
    ? `${verificationReport.passedCases}/${verificationReport.totalCases}`
    : 'Not Run';

  // Plot simple honest SVG points strictly from existing saved history items
  const chartPoints = history.slice(0, 7).reverse();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight heading-font">Dashboard</h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {authUser ? `Welcome back, ${authUser.name || authUser.email}` : 'Workspace metrics computed directly from your saved sessions and sandbox runs'}
          </p>
        </div>
        <button onClick={onNewConversion} className="t-btn-primary px-3.5 py-2 text-xs font-mono flex items-center gap-1.5 cursor-pointer">
          <Plus className="w-3.5 h-3.5" />
          <span>New Conversion</span>
        </button>
      </div>

      {/* 4 Honest KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="t-surface p-4 space-y-1">
          <div className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>Saved Conversions</div>
          <div className="text-2xl font-bold font-mono">{totalSaved}</div>
          <div className="text-[11px] opacity-70">{authUser ? 'Account + local history' : 'Stored locally on device'}</div>
        </div>
        <div className="t-surface p-4 space-y-1">
          <div className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>Verified Matches</div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{matchedItems.length}</div>
          <div className="text-[11px] opacity-70">Out of {verifiedItems.length} verified entry(s)</div>
        </div>
        <div className="t-surface p-4 space-y-1">
          <div className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>Workspace Tabs</div>
          <div className="text-2xl font-bold font-mono">{workspaceFiles.length}</div>
          <div className="text-[11px] opacity-70">Active conversion buffers</div>
        </div>
        <div className="t-surface p-4 space-y-1">
          <div className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>Latest Verification</div>
          <div className="text-2xl font-bold font-mono text-indigo-400">{latestPassLabel}</div>
          <div className="text-[11px] opacity-70">{verificationReport ? verificationReport.status : 'Run Convert & Verify'}</div>
        </div>
      </div>

      {/* Activity Sparkline + Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="t-surface p-4 lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Saved Activity (Latest {chartPoints.length} Runs)</h2>
            <span className="text-[11px] font-mono opacity-65">Line count per conversion</span>
          </div>
          {chartPoints.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-xs font-mono t-subtle" style={{ color: 'var(--text-secondary)' }}>
              No conversions saved yet — convert a Python file to record activity here.
            </div>
          ) : (
            <div className="h-40 p-3 t-subtle flex items-end gap-3">
              {chartPoints.map((pt, idx) => {
                const lines = (pt.pythonCode || '').split('\n').length;
                const heightPct = Math.min(100, Math.max(18, lines * 4));
                return (
                  <div key={pt.id || idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-mono opacity-70">{lines}L</span>
                    <div
                      className="w-full max-w-[36px] rounded-t-md transition-all"
                      style={{
                        height: `${heightPct}%`,
                        backgroundImage: 'linear-gradient(180deg, var(--primary-bg), var(--primary-hover))',
                      }}
                      title={`${pt.label}: ${lines} lines`}
                    />
                    <span className="text-[10px] font-mono truncate max-w-[60px] opacity-75">{pt.time || `#${idx + 1}`}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="t-surface p-4 space-y-2.5">
          <h2 className="text-sm font-semibold">Quick Actions</h2>
          <div className="space-y-2 text-xs font-mono">
            {[
              { label: 'New Conversion', icon: Plus, run: onNewConversion },
              { label: 'Open AI Assistant', icon: Sparkles, run: onOpenAssistant },
              { label: 'View Projects & History', icon: History, run: onOpenHistory },
              { label: 'Analyze Code Quality', icon: BarChart3, run: onOpenAnalysis },
            ].map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.label}
                  onClick={act.run}
                  className="w-full p-2.5 t-btn-secondary flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{act.label}</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Projects Strip */}
      <div className="t-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent Conversions</h2>
          <button onClick={onOpenHistory} className="text-xs font-mono text-indigo-400 hover:underline cursor-pointer">
            View all →
          </button>
        </div>
        {history.length === 0 ? (
          <p className="text-xs font-mono opacity-70">No recent conversions saved yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {history.slice(0, 4).map((item) => (
              <div key={item.id} className="p-3 t-subtle flex items-center justify-between gap-2 text-xs font-mono">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{item.label}</div>
                  <div className="text-[11px] opacity-65">{item.javaTargetVersion || 'Java 21 LTS'} · {item.time}</div>
                </div>
                <button
                  onClick={() => {
                    onRestoreHistory(item);
                    onOpenStudio();
                  }}
                  className="t-btn-primary px-2.5 py-1 text-[11px] cursor-pointer shrink-0"
                >
                  Open
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Screen 6: Dedicated Verification Studio View matching Middle-Right Panel
 */
export function VerificationStudioView({
  pythonCode = '',
  javaCode = '',
  javaVersion = 'Java 21 LTS',
  verificationReport = null,
  isVerifying = false,
  isRepairing = false,
  onVerify = () => {},
  onRepair = () => {},
}) {
  const [subTab, setSubTab] = useState('execution');

  const handleDownloadPassport = () => {
    const { passportMarkdown } = buildConversionPassport({
      pythonCode,
      javaCode,
      javaVersion,
      verificationReport,
    });
    const blob = new Blob([passportMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'verification-passport.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasReport = Boolean(verificationReport);
  const compiledCleanly = Boolean(verificationReport?.compilationPassed);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight heading-font">Verification Studio</h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Compile, run, and compare real CPython 3.13 vs OpenJDK 21 behavioral execution
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={onVerify}
            disabled={isVerifying || !pythonCode.trim() || !javaCode.trim()}
            className="t-btn-secondary px-3 py-1.5 flex items-center gap-1.5 cursor-pointer disabled:opacity-45"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isVerifying ? 'Running...' : 'Run Again'}</span>
          </button>
          <button
            onClick={handleDownloadPassport}
            className="t-btn-primary px-3 py-1.5 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 t-subtle w-fit text-xs font-mono">
        {[
          ['execution', 'Execution'],
          ['cases', 'Test Cases'],
          ['comparison', 'Comparison'],
          ['logs', 'Compiler Logs'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            className={`px-3 py-1 rounded cursor-pointer transition ${
              subTab === id ? 't-btn-primary' : 'opacity-75 hover:opacity-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Execution Summary Banner */}
      <div
        className={`t-surface p-4 flex flex-wrap items-center justify-between gap-3 ${
          !hasReport
            ? ''
            : verificationReport.outputMatch
            ? 'border-emerald-500/40 bg-emerald-500/5'
            : 'border-rose-500/40 bg-rose-500/5'
        }`}
      >
        <div className="flex items-center gap-3">
          {!hasReport ? (
            <Clock className="w-5 h-5 opacity-60" />
          ) : verificationReport.outputMatch ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400" />
          )}
          <div>
            <div className="text-sm font-semibold">
              {!hasReport ? 'Verification Not Executed Yet' : verificationReport.summary}
            </div>
            <div className="text-xs font-mono opacity-75">
              {hasReport
                ? `Python: ${verificationReport.python?.executionTimeMs ?? 0}ms · Java: ${verificationReport.java?.executionTimeMs ?? 0}ms`
                : 'Click "Run Again" after converting Python code to execute in isolated containers.'}
            </div>
          </div>
        </div>
        {hasReport && !compiledCleanly && (
          <button
            onClick={onRepair}
            disabled={isRepairing}
            className="t-btn-secondary px-3 py-1.5 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span>{isRepairing ? 'Repairing...' : 'Auto-Repair (Max 3x)'}</span>
          </button>
        )}
      </div>

      {/* Main Content by Sub-tab */}
      {subTab === 'execution' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
          <div className="t-surface p-4 space-y-2">
            <div className="text-xs opacity-70">Python Output (CPython 3.13)</div>
            <pre className="text-sm font-semibold whitespace-pre-wrap p-3 rounded t-subtle min-h-[84px]">
              {verificationReport?.python?.stdout || verificationReport?.python?.stderr || 'Not executed'}
            </pre>
          </div>
          <div className="t-surface p-4 space-y-2">
            <div className="text-xs opacity-70">Java Output (OpenJDK 21)</div>
            <pre className="text-sm font-semibold whitespace-pre-wrap p-3 rounded t-subtle min-h-[84px]">
              {verificationReport?.java?.stdout || verificationReport?.java?.stderr || 'Not executed'}
            </pre>
          </div>
          <div className="t-surface p-4 space-y-2">
            <div className="text-xs opacity-70">Compilation Status (`javac`)</div>
            <div className="p-3 rounded t-subtle min-h-[84px] text-xs space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5">
                {compiledCleanly ? (
                  <span className="text-emerald-400">✓ Clean Compilation (0 errors)</span>
                ) : hasReport ? (
                  <span className="text-rose-400">✗ Compilation Failed</span>
                ) : (
                  <span>Pending Execution</span>
                )}
              </div>
              {verificationReport?.repairedAttempts?.length > 0 && (
                <div className="opacity-75">
                  Auto-repair attempts: {verificationReport.repairedAttempts.length}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {subTab === 'cases' && (
        <div className="t-surface p-4 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between pb-2 t-border-b">
            <span>Executed Test Cases</span>
            <strong>{verificationReport ? `${verificationReport.passedCases}/${verificationReport.totalCases} Passed` : '0/0'}</strong>
          </div>
          {Array.isArray(verificationReport?.cases) && verificationReport.cases.length > 0 ? (
            verificationReport.cases.map((c, idx) => (
              <div key={idx} className="p-2.5 t-subtle grid grid-cols-1 md:grid-cols-3 gap-2">
                <div><strong>{c.name}</strong> · stdin: {JSON.stringify(c.stdin || '')}</div>
                <div>Python: {c.pythonStdout || '(empty)'}</div>
                <div className="flex items-center justify-between">
                  <span>Java: {c.javaStdout || c.compilerError || '(empty)'}</span>
                  <span className={c.matched ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {c.matched ? 'PASS' : 'DIFF'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="opacity-70 py-3">Run Verification to inspect case-by-case results.</p>
          )}
        </div>
      )}

      {subTab === 'comparison' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="t-surface p-4 space-y-2">
            <div className="font-semibold">Python stdout &amp; stderr</div>
            <pre className="p-3 rounded t-subtle whitespace-pre-wrap">{verificationReport?.python?.stdout || verificationReport?.python?.stderr || 'Not executed'}</pre>
          </div>
          <div className="t-surface p-4 space-y-2">
            <div className="font-semibold">Java stdout &amp; stderr</div>
            <pre className="p-3 rounded t-subtle whitespace-pre-wrap">{verificationReport?.java?.stdout || verificationReport?.java?.stderr || 'Not executed'}</pre>
          </div>
        </div>
      )}

      {subTab === 'logs' && (
        <div className="t-surface p-4 space-y-2 text-xs font-mono">
          <div className="font-semibold flex items-center gap-2"><Terminal className="w-4 h-4" /> Compiler Diagnostics</div>
          <pre className="p-3 rounded t-subtle whitespace-pre-wrap">
            {verificationReport?.java?.compilerError || (hasReport ? 'javac compiled with zero errors.' : 'No compiler run yet.')}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * Screen 5: Dedicated Full-Workspace AI Assistant View matching Middle-Center Panel
 */
export function AssistantWorkspaceView({
  pythonCode = '',
  javaCode = '',
  selectedPython = '',
  javaVersion = 'Java 21 LTS',
  verificationReport = null,
  onApplyJavaEdit = () => {},
}) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [pendingCode, setPendingCode] = useState(null);

  const submitAssistant = async ({ action = 'assistant', text = '' }) => {
    if (loading || !pythonCode.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', text: text || action }]);
    setLoading(true);
    setPendingCode(null);

    try {
      const res = await fetch('/api/v1/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          python_code: pythonCode,
          java_code: javaCode || '// empty',
          selected_code: selectedPython || '',
          question: text,
          compiler_error: verificationReport?.java?.compilerError || '',
          verification_report: verificationReport,
          java_version: javaVersion.replace(/[^0-9]/g, '') || '21',
        }),
      });
      const data = await res.json();
      if (data?.ok) {
        if (data.explanation) {
          setMessages((prev) => [...prev, { role: 'assistant', text: data.explanation, mode: data.mode }]);
        } else if (data.javaCode || data.testCode) {
          const code = data.javaCode || data.testCode;
          setPendingCode({ action, code });
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', text: `Generated updated code for action '${action}':`, code, mode: data.mode },
          ]);
        }
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', text: data?.error || 'Request failed.' }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Failed to connect to intelligence service.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto flex flex-col min-h-[calc(100vh-8.5rem)]">
      <div>
        <h1 className="text-xl font-bold tracking-tight heading-font">AI Assistant</h1>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Context-aware Python-to-Java companion grounded in your current editors &amp; diagnostics
        </p>
      </div>

      {/* Chat Transcript Card */}
      <div className="t-surface flex-1 p-4 space-y-4 overflow-y-auto flex flex-col justify-between">
        <div className="space-y-3">
          {!pythonCode.trim() && (
            <div className="p-3 rounded t-subtle text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
              Tip: Add or paste Python code in Conversion Studio first so AI Assistant has source context.
            </div>
          )}
          {messages.length === 0 ? (
            <div className="py-10 text-center space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <Sparkles className="w-6 h-6 mx-auto text-indigo-400" />
              <p className="font-medium text-sm" style={{ color: 'var(--text-main)' }}>Ask anything about your conversion</p>
              <p>Inspect type decisions, debug `javac` failures, optimize streams, or generate JUnit tests.</p>
            </div>
          ) : (
            messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-2xl rounded-xl p-3.5 text-xs space-y-2 ${
                    m.role === 'user' ? 'text-white' : 't-subtle'
                  }`}
                  style={
                    m.role === 'user'
                      ? { backgroundImage: 'linear-gradient(135deg, var(--primary-bg), var(--primary-hover))' }
                      : undefined
                  }
                >
                  <pre className="whitespace-pre-wrap font-sans leading-relaxed">{m.text}</pre>
                  {m.code && (
                    <pre className="p-3 rounded font-mono text-[11px] overflow-x-auto" style={{ backgroundColor: 'var(--bg-editor)' }}>
                      {m.code}
                    </pre>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex items-center gap-2 text-xs opacity-75">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Analyzing Python &amp; Java context...</span>
            </div>
          )}
        </div>

        {/* Apply Pending Code Bar */}
        {pendingCode && (
          <div className="p-3 rounded t-subtle border border-indigo-500/40 flex items-center justify-between text-xs font-mono">
            <span>Apply suggested Java update from `{pendingCode.action}` to Conversion Studio?</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onApplyJavaEdit(pendingCode.code);
                  setPendingCode(null);
                }}
                className="t-btn-primary px-3 py-1 flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply</span>
              </button>
              <button onClick={() => setPendingCode(null)} className="t-btn-secondary px-2.5 py-1 cursor-pointer">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Contextual Chip Bar + Rounded Composer */}
        <div className="space-y-2.5 pt-3 t-border-t">
          <div className="flex flex-wrap gap-1.5 text-xs font-mono">
            {[
              ['optimize', 'Optimize this code'],
              ['find-bugs', 'Find bugs'],
              ['generate-tests', 'Generate test cases'],
              ['javadoc', 'Add JavaDoc'],
              ['explain', 'Explain conversion'],
            ].map(([act, lbl]) => (
              <button
                key={act}
                disabled={loading || !pythonCode.trim()}
                onClick={() => submitAssistant({ action: act, text: lbl })}
                className="t-btn-secondary px-2.5 py-1 text-[11px] cursor-pointer disabled:opacity-45"
              >
                {lbl}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = question.trim();
              if (!q) return;
              setQuestion('');
              submitAssistant({ action: 'assistant', text: q });
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything about your code, types, errors, or optimizations..."
              className="flex-1 px-3.5 py-2.5 t-subtle text-xs font-mono focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !question.trim() || !pythonCode.trim()}
              className="t-btn-primary p-2.5 cursor-pointer disabled:opacity-45"
              aria-label="Send prompt"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
