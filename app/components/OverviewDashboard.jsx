'use client';

import React from 'react';
import {
  Activity,
  CheckCircle2,
  Code2,
  History,
  ArrowRight,
  Clock,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

/**
 * Real, honest User Overview Dashboard computed strictly from actual
 * stored conversion history and session verification data (no fake metrics).
 */
export default function OverviewDashboard({
  authUser = null,
  history = [],
  verificationReport = null,
  onOpenStudio = () => {},
  onRestoreHistory = () => {},
  onOpenComparison = () => {},
}) {
  const totalConversions = history.length;
  const verifiedHistoryCount = history.filter((h) => h.verifiedStatus).length;
  const matchedHistoryCount = history.filter((h) => h.verifiedStatus === 'behavioral_match').length;

  const hasCurrentVerified = Boolean(verificationReport);
  const currentPassed = verificationReport?.passedCases ?? 0;
  const currentTotal = verificationReport?.totalCases ?? 0;
  const passRate =
    currentTotal > 0
      ? `${Math.round((currentPassed / currentTotal) * 100)}%`
      : verifiedHistoryCount > 0
      ? `${Math.round((matchedHistoryCount / verifiedHistoryCount) * 100)}%`
      : '—';

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="t-surface p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight heading-font">
            {authUser ? `Welcome, ${authUser.name || authUser.email}` : 'J-Forge Overview'}
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            All metrics below come strictly from your real saved conversions and sandbox runs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenComparison}
            className="t-btn-secondary px-3.5 py-2 text-xs font-mono cursor-pointer"
          >
            Code Comparison
          </button>
          <button
            onClick={onOpenStudio}
            className="t-btn-primary px-4 py-2 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Open Converter</span>
          </button>
        </div>
      </div>

      {/* Real Metrics Row (Zero Fabricated Numbers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="t-surface p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            <span>Saved Conversions</span>
            <History className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold font-mono">{totalConversions}</div>
          <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            {authUser ? 'Synced to Neon Postgres' : 'Stored locally in browser'}
          </p>
        </div>

        <div className="t-surface p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            <span>Latest Compilation</span>
            {verificationReport?.compilationPassed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : verificationReport ? (
              <XCircle className="w-4 h-4 text-rose-500" />
            ) : (
              <Clock className="w-4 h-4 opacity-50" />
            )}
          </div>
          <div className="text-2xl font-bold font-mono">
            {hasCurrentVerified
              ? verificationReport.compilationPassed
                ? 'Passed'
                : 'Failed'
              : 'Not Run'}
          </div>
          <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            OpenJDK 21 javac verification
          </p>
        </div>

        <div className="t-surface p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            <span>Test Pass Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600">{passRate}</div>
          <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            {currentTotal > 0 ? `${currentPassed}/${currentTotal} cases passed` : 'Run Convert & Verify to measure'}
          </p>
        </div>

        <div className="t-surface p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            <span>Account Status</span>
            <Activity className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-lg font-bold font-mono truncate">
            {authUser ? authUser.role || 'Signed In' : 'Guest Mode'}
          </div>
          <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            {authUser ? authUser.organization || 'Personal Workspace' : '3 free guest conversions'}
          </p>
        </div>
      </div>

      {/* Recent Conversion Activity */}
      <div className="t-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-mono">Recent Activity</h2>
          <span className="text-[11px] font-mono" style={{ color: 'var(--text-secondary)' }}>
            {totalConversions} item(s)
          </span>
        </div>

        {history.length === 0 ? (
          <div className="p-6 text-center t-subtle space-y-2">
            <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
              No conversions recorded yet. Convert a Python script to see real activity here.
            </p>
            <button
              onClick={onOpenStudio}
              className="t-btn-primary px-3.5 py-1.5 text-xs font-mono cursor-pointer"
            >
              Start Converting
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-3 t-subtle flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{item.label}</div>
                  <div className="text-[11px] flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <span>{item.javaTargetVersion || 'Java 17 LTS'}</span>
                    <span>•</span>
                    <span>{item.time}</span>
                    {item.verifiedStatus && (
                      <>
                        <span>•</span>
                        <span className={item.verifiedStatus === 'behavioral_match' ? 'text-emerald-600' : 'text-amber-600'}>
                          {item.verifiedStatus === 'behavioral_match' ? 'Verified' : item.verifiedStatus}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    onRestoreHistory(item);
                    onOpenStudio();
                  }}
                  className="t-btn-secondary px-2.5 py-1 text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
