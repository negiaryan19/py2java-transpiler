'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
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
  Sparkles,
  Server,
  Layers,
  Cpu,
  FlaskConical,
} from 'lucide-react';
import BrandMark from './BrandMark';
import { PythonLogo, JavaLogo } from './LanguageLogos';
import { buildConversionPassport } from '../../lib/compatibility';

/**
 * Screen 1: Forge Dark Hero View matching Image 1 + Images 5/6 Pipeline
 */
export function LandingHeroView({
  onStartConverting = () => {},
  onOpenDashboard = () => {},
  authUser = null,
}) {
  return (
    <div className="cosmic-backdrop min-h-[calc(100vh-3rem)] flex flex-col justify-between py-8 px-4 sm:px-8">
      <div className="max-w-5xl w-full mx-auto space-y-10 my-auto">
        {/* Top Floating Nav Pill matching Image 1 */}
        <div className="t-surface px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <BrandMark size="md" showV2 />

          <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            <button onClick={onStartConverting} className="hover:text-white cursor-pointer">Converter</button>
            <button onClick={onOpenDashboard} className="hover:text-white cursor-pointer">Dashboard</button>
            <a href="#pipeline-stages" className="hover:text-white">Pipeline</a>
            <a href="https://github.com/negiaryan19/py2java-transpiler" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              GitHub
            </a>
          </div>

          <div className="flex items-center gap-2">
            {!authUser && (
              <a href="/login" className="t-btn-secondary px-3 py-1.5 text-xs font-mono hidden sm:inline-block">
                Sign In
              </a>
            )}
            <button onClick={onStartConverting} className="t-btn-primary px-3.5 py-1.5 text-xs font-mono cursor-pointer">
              Launch Studio
            </button>
          </div>
        </div>

        {/* Centered Headline matching Image 1 */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight heading-font">
            Convert with confidence,
            <br />
            verify with evidence.
          </h1>
          <p className="text-xs sm:text-sm font-mono tracking-wide" style={{ color: 'var(--text-secondary)' }}>
            Convert. Compile. Verify. Debug. Optimize. Learn. Migrate.
          </p>
        </div>

        {/* Dual-Pane Architectural Preview Frame (Illustrative only; Launch Studio opens clean empty workspace) */}
        <div className="t-surface overflow-hidden max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
            {/* Left Python Mock Frame */}
            <div>
              <div className="px-3.5 py-2 t-border-b flex items-center justify-between border-t-2 border-t-sky-400" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <PythonLogo className="w-4 h-4" />
                  <span className="font-semibold">fibonacci.py</span>
                </div>
                <span className="text-[10px] font-mono text-sky-400">Python 3</span>
              </div>
              <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto" style={{ backgroundColor: 'var(--bg-editor)' }}>
                <span className="text-sky-400">def</span> <span className="text-amber-300">fibonacci</span>(n):{'\n'}
                {'    '}<span className="text-sky-400">if</span> n &lt;= 1:{'\n'}
                {'        '}<span className="text-sky-400">return</span> n{'\n'}
                {'    '}<span className="text-sky-400">return</span> fibonacci(n - 1) + fibonacci(n - 2)
              </pre>
            </div>

            {/* Right Java Mock Frame */}
            <div>
              <div className="px-3.5 py-2 t-border-b flex items-center justify-between border-t-2 border-t-orange-500" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <JavaLogo className="w-4 h-4" />
                  <span className="font-semibold">Fibonacci.java</span>
                </div>
                <span className="text-[10px] font-mono text-orange-400">OpenJDK 21</span>
              </div>
              <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto" style={{ backgroundColor: 'var(--bg-editor)' }}>
                <span className="text-orange-400">public class</span> Solution {'{\n'}
                {'    '}<span className="text-orange-400">public static int</span> fib(<span className="text-sky-300">int</span> n) {'{\n'}
                {'        '}<span className="text-orange-400">if</span> (n &lt;= 1) <span className="text-orange-400">return</span> n;{'\n'}
                {'        '}<span className="text-orange-400">return</span> fib(n - 1) + fib(n - 2);{'\n'}
                {'    }\n}'}
              </pre>
            </div>
          </div>

          <div className="px-4 py-2.5 t-border-t flex flex-wrap items-center justify-between gap-2 text-xs font-mono" style={{ backgroundColor: 'var(--bg-subtle)' }}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 inline-flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> OpenJDK 21 Compilation Verified
              </span>
              <span className="px-2.5 py-1 rounded-md border border-sky-500/30 bg-sky-500/10 text-sky-400 inline-flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" /> CPython vs JVM Output Parity
              </span>
            </div>
            <button onClick={onStartConverting} className="t-btn-primary px-4 py-1.5 inline-flex items-center gap-1.5 cursor-pointer">
              <span>Start Empty Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 6-Stage Pipeline Overview inspired by Images 5 & 6 */}
        <div id="pipeline-stages" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
          {[
            { step: 'Stage 1', title: 'Python AST', desc: 'Compatibility & types', icon: Layers },
            { step: 'Stage 2', title: 'AI Engine', desc: 'Mode-guided synthesis', icon: Cpu },
            { step: 'Stage 3', title: 'OpenJDK javac', desc: 'Real byte-code check', icon: Terminal },
            { step: 'Stage 4', title: 'Sandbox Run', desc: 'Isolated CPython & JVM', icon: Play },
            { step: 'Stage 5', title: 'Verification', desc: 'Multi-case output diff', icon: FlaskConical },
            { step: 'Stage 6', title: 'Auto-Repair', desc: 'Up to 3 javac fixes', icon: Wrench },
          ].map((st) => {
            const Icon = st.icon;
            return (
              <div key={st.step} className="t-surface p-3 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-orange-400">
                  <span>{st.step}</span>
                  <Icon className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="text-xs font-semibold">{st.title}</div>
                <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{st.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MiniSparkline({ points = [], stroke = '#38BDF8' }) {
  const safePts = points.length >= 2 ? points : [2, 2];
  const max = Math.max(...safePts, 1);
  const w = 84;
  const h = 28;
  const coords = safePts.map((v, idx) => {
    const x = (idx / Math.max(1, safePts.length - 1)) * w;
    const y = h - 4 - (v / max) * (h - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-20 h-7 overflow-visible" aria-hidden="true">
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords.join(' ')}
      />
    </svg>
  );
}

/**
 * Screen 3: Project Migration Dashboard matching Image 3 (Strict Real Metrics Only)
 */
export function DashboardWorkspaceView({
  authUser = null,
  history = [],
  workspaceFiles = [],
  verificationReport = null,
  guestRemaining = 3,
  onNewConversion = () => {},
  onOpenStudio = () => {},
  onOpenAssistant = () => {},
  onOpenHistory = () => {},
  onRestoreHistory = () => {},
}) {
  const totalSaved = history.length;
  const verifiedEntries = history.filter((h) => h.verifiedStatus);
  const matchedEntries = history.filter((h) => h.verifiedStatus === 'behavioral_match');
  const compiledEntries = history.filter(
    (h) => h.verifiedStatus === 'behavioral_match' || h.verifiedStatus === 'behavioral_mismatch'
  );

  const compilationRate =
    verifiedEntries.length > 0
      ? `${Math.round((compiledEntries.length / verifiedEntries.length) * 100)}%`
      : verificationReport
      ? verificationReport.compilationPassed
        ? '100%'
        : '0%'
      : '—';

  const verifiedRate =
    verifiedEntries.length > 0
      ? `${Math.round((matchedEntries.length / verifiedEntries.length) * 100)}%`
      : verificationReport?.totalCases > 0
      ? `${Math.round((verificationReport.passedCases / verificationReport.totalCases) * 100)}%`
      : '—';

  const sparkData = history.slice(0, 8).reverse().map((h) => Math.max(1, (h.pythonCode || '').split('\n').length));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-mono text-orange-400">J-FORGE V2 / Project Migration Studio</div>
          <h1 className="text-xl font-bold tracking-tight heading-font">Overview Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onOpenAssistant} className="t-btn-secondary px-3 py-1.5 text-xs font-mono cursor-pointer">
            AI Assistant
          </button>
          <button onClick={onNewConversion} className="t-btn-primary px-3.5 py-1.5 text-xs font-mono flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
            <span>New Conversion</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards matching Image 3 Layout + Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="t-surface p-4 flex items-center justify-between gap-2">
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider opacity-65">Total Conversions</div>
            <div className="text-2xl font-bold font-mono text-sky-400">{totalSaved}</div>
            <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded t-subtle opacity-80">
              {workspaceFiles.length} open buffer(s)
            </span>
          </div>
          <MiniSparkline points={sparkData} stroke="#38BDF8" />
        </div>

        <div className="t-surface p-4 flex items-center justify-between gap-2">
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider opacity-65">Compilation Success</div>
            <div className="text-2xl font-bold font-mono text-emerald-400">{compilationRate}</div>
            <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded t-subtle opacity-80">
              OpenJDK 21 javac
            </span>
          </div>
          <MiniSparkline points={sparkData.map((x, i) => (compiledEntries[i] ? 10 : x))} stroke="#34D399" />
        </div>

        <div className="t-surface p-4 flex items-center justify-between gap-2">
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider opacity-65">Verified Output Match</div>
            <div className="text-2xl font-bold font-mono text-sky-400">{verifiedRate}</div>
            <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded t-subtle opacity-80">
              {verifiedEntries.length} verified run(s)
            </span>
          </div>
          <MiniSparkline points={sparkData} stroke="#38BDF8" />
        </div>

        <div className="t-surface p-4 space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider opacity-65">
            {authUser ? 'Account Quota' : 'Guest Trial Quota'}
          </div>
          <div className="text-2xl font-bold font-mono text-orange-400">
            {authUser ? 'Active' : `${guestRemaining} / 3`}
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-orange-500 transition-all"
              style={{ width: authUser ? '100%' : `${Math.round((guestRemaining / 3) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Two Columns matching Image 3: Migration Mapping Matrix + Recent Verification History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Static Structural Migration Architecture Reference */}
        <div className="t-surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Python → Java Architecture Mapping</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded t-subtle opacity-75">Supported Targets</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
            <div className="p-2.5 t-subtle flex items-center gap-2">
              <PythonLogo className="w-4 h-4 shrink-0" />
              <span>Python 3 / FastAPI</span>
            </div>
            <div className="p-2.5 t-subtle flex items-center gap-2">
              <JavaLogo className="w-4 h-4 shrink-0" />
              <span>Java 21 / Spring Boot</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            {[
              ['main.py (script/entry)', 'Solution.java (public static void main)'],
              ['models.py (Pydantic / dataclass)', 'Java Record / Encapsulated POJO'],
              ['routes.py (@app.get / @app.post)', 'Spring @RestController Mapping'],
              ['requirements.txt / imports', 'Dependency Catalog & Maven XML'],
            ].map(([src, dst]) => (
              <div key={src} className="p-2.5 rounded t-subtle grid grid-cols-11 items-center gap-2 text-[11px]">
                <span className="col-span-5 truncate opacity-90">{src}</span>
                <ArrowRight className="w-3.5 h-3.5 text-orange-400 mx-auto" />
                <span className="col-span-5 truncate text-emerald-400">{dst}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent Verification History Table */}
        <div className="t-surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent Verification History</h2>
            <button onClick={onOpenHistory} className="text-xs font-mono text-orange-400 hover:underline cursor-pointer">
              Manage All →
            </button>
          </div>

          {history.length === 0 ? (
            <div className="p-8 text-center t-subtle text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
              No conversions recorded yet. Open Converter to compile &amp; verify your first script.
            </div>
          ) : (
            <div className="space-y-1.5 text-xs font-mono">
              <div className="grid grid-cols-12 px-2 py-1 text-[10px] uppercase opacity-55">
                <span className="col-span-5">Project</span>
                <span className="col-span-3">Time</span>
                <span className="col-span-4 text-right">Status</span>
              </div>
              {history.slice(0, 6).map((item) => {
                const st = item.verifiedStatus;
                const badgeCls =
                  st === 'behavioral_match'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : st === 'behavioral_mismatch'
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    : st
                    ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                    : 'bg-slate-500/15 text-slate-400 border-slate-500/30';
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onRestoreHistory(item);
                      onOpenStudio();
                    }}
                    className="w-full p-2.5 t-subtle grid grid-cols-12 items-center gap-2 text-left hover:border-orange-500/40 cursor-pointer"
                  >
                    <span className="col-span-5 flex items-center gap-1.5 truncate font-medium">
                      <PythonLogo className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    <span className="col-span-3 text-[11px] opacity-70 truncate">{item.time}</span>
                    <span className="col-span-4 text-right">
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${badgeCls}`}>
                        {st === 'behavioral_match' ? 'Verified Match' : st || 'Saved'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Screen 6: Dedicated Verification Studio View
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
            Compile, execute, and compare CPython 3.13 vs OpenJDK 21 behavioral outputs
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
          <button onClick={handleDownloadPassport} className="t-btn-primary px-3 py-1.5 flex items-center gap-1.5 cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

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
                ? `Python sandbox RTT: ${verificationReport.python?.executionTimeMs ?? 0}ms · Java sandbox RTT: ${verificationReport.java?.executionTimeMs ?? 0}ms`
                : 'Convert Python code and click "Run Again" to execute in isolated containers.'}
            </div>
          </div>
        </div>
        {hasReport && !compiledCleanly && (
          <button
            onClick={onRepair}
            disabled={isRepairing}
            className="t-btn-secondary px-3 py-1.5 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5 text-orange-400" />
            <span>{isRepairing ? 'Repairing...' : 'Auto-Repair (Max 3x)'}</span>
          </button>
        )}
      </div>

      {subTab === 'execution' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
          <div className="t-surface p-4 space-y-2">
            <div className="text-xs flex items-center gap-1.5"><PythonLogo className="w-3.5 h-3.5" /> Python Output (CPython 3.13)</div>
            <pre className="text-sm font-semibold whitespace-pre-wrap p-3 rounded t-subtle min-h-[84px]">
              {verificationReport?.python?.stdout || verificationReport?.python?.stderr || 'Not executed'}
            </pre>
          </div>
          <div className="t-surface p-4 space-y-2">
            <div className="text-xs flex items-center gap-1.5"><JavaLogo className="w-3.5 h-3.5" /> Java Output (OpenJDK 21)</div>
            <pre className="text-sm font-semibold whitespace-pre-wrap p-3 rounded t-subtle min-h-[84px]">
              {verificationReport?.java?.stdout || verificationReport?.java?.stderr || 'Not executed'}
            </pre>
          </div>
          <div className="t-surface p-4 space-y-2">
            <div className="text-xs flex items-center gap-1.5"><Server className="w-3.5 h-3.5 text-emerald-400" /> Compilation Log (`javac`)</div>
            <div className="p-3 rounded t-subtle min-h-[84px] text-xs space-y-1.5">
              <div className="font-semibold">
                {compiledCleanly ? (
                  <span className="text-emerald-400">✓ Clean Compilation (0 errors)</span>
                ) : hasReport ? (
                  <span className="text-rose-400">✗ Compilation Failed</span>
                ) : (
                  <span>Pending Execution</span>
                )}
              </div>
              {verificationReport?.repairedAttempts?.length > 0 && (
                <div className="opacity-75">Auto-repair passes: {verificationReport.repairedAttempts.length}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {subTab === 'cases' && (
        <div className="t-surface p-4 space-y-2 text-xs font-mono">
          <div className="grid grid-cols-12 px-2 py-1 text-[10px] uppercase opacity-60 t-border-b">
            <span className="col-span-3">Boundary Test Case</span>
            <span className="col-span-4">Python stdout</span>
            <span className="col-span-4">Java stdout</span>
            <span className="col-span-1 text-right">Status</span>
          </div>
          {Array.isArray(verificationReport?.cases) && verificationReport.cases.length > 0 ? (
            verificationReport.cases.map((c, idx) => (
              <div key={idx} className="p-2.5 t-subtle grid grid-cols-12 items-center gap-2">
                <span className="col-span-3 font-semibold truncate">{c.name}</span>
                <span className="col-span-4 truncate">{c.pythonStdout || '(empty)'}</span>
                <span className="col-span-4 truncate">{c.javaStdout || c.compilerError || '(empty)'}</span>
                <span className="col-span-1 text-right">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${c.matched ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {c.matched ? 'PASS' : 'DIFF'}
                  </span>
                </span>
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
 * Screen 5: Dedicated Full-Workspace AI Assistant View
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
          Context-aware Python-to-Java companion grounded in your current workspace editors
        </p>
      </div>

      <div className="t-surface flex-1 p-4 space-y-4 overflow-y-auto flex flex-col justify-between">
        <div className="space-y-3">
          {!pythonCode.trim() && (
            <div className="p-3 rounded t-subtle text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
              Tip: Add or paste Python code in Converter first so AI Assistant has source context.
            </div>
          )}
          {messages.length === 0 ? (
            <div className="py-10 text-center space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <Sparkles className="w-6 h-6 mx-auto text-orange-400" />
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
              <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
              <span>Analyzing Python &amp; Java context...</span>
            </div>
          )}
        </div>

        {pendingCode && (
          <div className="p-3 rounded t-subtle border border-orange-500/40 flex items-center justify-between text-xs font-mono">
            <span>Apply suggested Java update from `{pendingCode.action}` to Converter?</span>
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

/**
 * Section 25: Student Learning Mode (Concept Explanations + Syntax & Semantic Comparison)
 */
const LEARNING_TOPICS = [
  {
    id: 'division',
    title: 'Integer Division & Modulo Semantics',
    level: 'Fundamentals',
    whyDiffers: 'Python // rounds toward negative infinity (-7 // 2 == -4), whereas Java / truncates toward zero (-7 / 2 == -3). Use Math.floorDiv() and Math.floorMod() when behavior parity matters.',
    pyExample: 'q = -7 // 2\nr = -7 % 2\nprint(q, r)',
    javaExample: 'int q = Math.floorDiv(-7, 2);\nint r = Math.floorMod(-7, 2);\nSystem.out.println(q + " " + r);',
  },
  {
    id: 'types',
    title: 'Dynamic Types vs Static Types & BigInteger',
    level: 'Types & Memory',
    whyDiffers: 'Python ints have arbitrary precision; Java primitive int overflows above 2,147,483,647. Use long or java.math.BigInteger for large factorials and cryptographic arithmetic.',
    pyExample: 'n: int = 30\nfact = 1\nfor i in range(1, n + 1):\n    fact *= i\nprint(fact)',
    javaExample: 'BigInteger fact = BigInteger.ONE;\nfor (int i = 1; i <= 30; i++) {\n    fact = fact.multiply(BigInteger.valueOf(i));\n}\nSystem.out.println(fact);',
  },
  {
    id: 'collections',
    title: 'Lists, Dicts & Java Streams',
    level: 'Data Structures',
    whyDiffers: 'Python list comprehensions map to Java Streams (.stream().filter().map().toList()), and dict lookups with defaults map to Map.getOrDefault().',
    pyExample: 'nums = [1, 2, 3, 4]\nevens = [x * 2 for x in nums if x % 2 == 0]\nprint(evens)',
    javaExample: 'List<Integer> nums = List.of(1, 2, 3, 4);\nList<Integer> evens = nums.stream().filter(x -> x % 2 == 0).map(x -> x * 2).toList();\nSystem.out.println(evens);',
  },
  {
    id: 'oop',
    title: 'Classes, __init__ & Encapsulation',
    level: 'OOP',
    whyDiffers: 'Python constructor parameters on self become private Java class fields initialized inside a strongly typed constructor with explicit visibility modifiers.',
    pyExample: 'class Counter:\n    def __init__(self, start: int = 0):\n        self.value = start\n    def inc(self) -> int:\n        self.value += 1\n        return self.value',
    javaExample: 'public static class Counter {\n    private int value;\n    public Counter(int start) { this.value = start; }\n    public int inc() { return ++this.value; }\n}',
  },
  {
    id: 'exceptions',
    title: 'Exceptions & Input Validation',
    level: 'Error Handling',
    whyDiffers: 'Python try/except ValueError maps to Java try/catch (IllegalArgumentException e), enforcing checked vs unchecked exception contracts at compile time.',
    pyExample: 'def check(age: int):\n    if age < 0:\n        raise ValueError("Invalid age")',
    javaExample: 'public static void check(int age) {\n    if (age < 0) throw new IllegalArgumentException("Invalid age");\n}',
  },
];

export function LearningWorkspaceView({
  onLoadExerciseToStudio = () => {},
}) {
  const [selectedId, setSelectedId] = useState('division');
  const activeTopic = LEARNING_TOPICS.find((t) => t.id === selectedId) || LEARNING_TOPICS[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight heading-font">Learning Studio</h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Interactive Python-to-Java language guide explaining why Java types, operators, and libraries differ
          </p>
        </div>
        <button
          onClick={() => onLoadExerciseToStudio(activeTopic)}
          className="t-btn-primary px-3.5 py-2 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
        >
          <span>Practice in Converter</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Topic Selector */}
        <div className="t-surface p-2.5 space-y-1.5">
          {LEARNING_TOPICS.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={`w-full text-left p-2.5 rounded text-xs cursor-pointer transition ${
                t.id === selectedId ? 'nav-item active' : 'nav-item'
              }`}
            >
              <div className="font-semibold">{t.title}</div>
              <div className="text-[10px] font-mono opacity-75">{t.level}</div>
            </button>
          ))}
        </div>

        {/* Interactive Concept Card */}
        <div className="lg:col-span-3 t-surface p-5 space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded t-subtle text-orange-400">{activeTopic.level}</span>
            <h2 className="text-base font-bold heading-font pt-1">{activeTopic.title}</h2>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {activeTopic.whyDiffers}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div className="t-subtle overflow-hidden">
              <div className="px-3 py-1.5 t-border-b border-t-2 border-t-sky-400 flex items-center gap-1.5">
                <PythonLogo className="w-3.5 h-3.5" />
                <span>Python 3 Equivalent</span>
              </div>
              <pre className="p-3 overflow-x-auto leading-relaxed" style={{ backgroundColor: 'var(--bg-editor)' }}>
                {activeTopic.pyExample}
              </pre>
            </div>

            <div className="t-subtle overflow-hidden">
              <div className="px-3 py-1.5 t-border-b border-t-2 border-t-orange-500 flex items-center gap-1.5">
                <JavaLogo className="w-3.5 h-3.5" />
                <span>Java LTS Target</span>
              </div>
              <pre className="p-3 overflow-x-auto leading-relaxed" style={{ backgroundColor: 'var(--bg-editor)' }}>
                {activeTopic.javaExample}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
