'use client';

import React, { useState } from 'react';
import {
  FileCode2,
  Plus,
  Trash2,
  Star,
  Copy,
  Pencil,
  Check,
  X,
  ArrowRight,
  Search,
  ShieldCheck,
  Package,
  BarChart3,
  Download,
  Sliders,
  AlertTriangle,
  FlaskConical,
  GitCompare,
} from 'lucide-react';
import { analyzePythonCompatibility, detectPythonDependencies, analyzeCodeQuality } from '../../lib/compatibility';

export function FilesWorkspaceView({
  files = [],
  activeFileId,
  onSelectFile = () => {},
  onCreateFile = () => {},
  onDeleteFile = () => {},
  onOpenConverter = () => {},
}) {
  return (
    <div className="space-y-4">
      <div className="t-surface p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold heading-font">Workspace Files</h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Manage multiple Python scripts and conversion buffers on this device.
          </p>
        </div>
        <button
          onClick={onCreateFile}
          className="t-btn-primary px-3 py-1.5 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Conversion Tab</span>
        </button>
      </div>

      <div className="t-surface p-3 space-y-2">
        {files.map((f) => {
          const active = f.id === activeFileId;
          const lineCount = f.pythonCode ? f.pythonCode.split('\n').length : 0;
          return (
            <div
              key={f.id}
              className={`p-3 rounded flex flex-wrap items-center justify-between gap-2 text-xs font-mono border ${
                active ? 'border-indigo-500/60 bg-indigo-500/5' : 't-subtle'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FileCode2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold truncate">{f.title || 'Untitled conversion'}</div>
                  <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                    {f.filename || 'main.py'} · {lineCount} lines · {f.javaTargetVersion || 'Java 21 LTS'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {files.length > 1 && (
                  <button
                    onClick={() => onDeleteFile(f.id)}
                    className="t-btn-secondary p-1.5 text-rose-400 cursor-pointer"
                    title="Close file tab"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => {
                    onSelectFile(f.id);
                    onOpenConverter();
                  }}
                  className="t-btn-primary px-2.5 py-1 text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <span>{active ? 'Open in Studio' : 'Switch & Edit'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HistoryWorkspaceView({
  authUser = null,
  history = [],
  onOpenStudio = () => {},
  onRestoreHistory = () => {},
  onRenameHistory = () => {},
  onDeleteHistory = () => {},
  onDuplicateHistory = () => {},
  onToggleFavorite = () => {},
}) {
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [compareIds, setCompareIds] = useState([]);

  const filtered = history.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (item.label || '').toLowerCase().includes(q) ||
      (item.pythonCode || '').toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)));
  const comparedItems = compareIds.map((id) => history.find((h) => h.id === id)).filter(Boolean);

  const handleDownloadJava = (item) => {
    const blob = new Blob([item.javaCode || '// Empty'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Solution.java';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="t-surface p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold heading-font">Conversion History &amp; Versions</h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {authUser ? 'Synced to authenticated Neon Postgres account & cached locally.' : 'Stored locally on this device (sign in to sync across devices).'}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 opacity-60" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversions..."
            className="w-full pl-8 pr-3 py-1.5 t-subtle text-xs font-mono focus:outline-none"
          />
        </div>
      </div>

      {comparedItems.length === 2 && (
        <div className="t-surface p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-semibold flex items-center gap-1.5">
              <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Version Diff: {comparedItems[0].label} vs {comparedItems[1].label}</span>
            </span>
            <button onClick={() => setCompareIds([])} className="t-btn-secondary px-2 py-0.5 text-[11px] cursor-pointer">
              Close Diff
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
            <pre className="p-2.5 rounded t-subtle overflow-auto max-h-48 whitespace-pre-wrap">{comparedItems[0].javaCode}</pre>
            <pre className="p-2.5 rounded t-subtle overflow-auto max-h-48 whitespace-pre-wrap">{comparedItems[1].javaCode}</pre>
          </div>
        </div>
      )}

      <div className="t-surface p-3 space-y-2">
        {sorted.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            No saved conversions match yet. Convert code in the workspace to save history entries.
          </div>
        ) : (
          sorted.map((item) => {
            const isSelectedForDiff = compareIds.includes(item.id);
            return (
              <div
                key={item.id}
                className="p-3 t-subtle flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
              >
                <div className="min-w-0 flex-1 flex items-start gap-2">
                  <button
                    onClick={() => onToggleFavorite(item.id)}
                    className={`mt-0.5 cursor-pointer ${item.favorite ? 'text-amber-400' : 'opacity-40 hover:opacity-80'}`}
                    title={item.favorite ? 'Unfavorite' : 'Mark favorite'}
                  >
                    <Star className="w-3.5 h-3.5" fill={item.favorite ? 'currentColor' : 'none'} />
                  </button>
                  <div className="min-w-0 flex-1">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={draftLabel}
                          onChange={(e) => setDraftLabel(e.target.value)}
                          maxLength={80}
                          className="px-2 py-1 t-surface text-xs focus:outline-none w-56"
                        />
                        <button
                          onClick={() => {
                            onRenameHistory(item.id, draftLabel);
                            setEditingId(null);
                          }}
                          className="p-1 text-emerald-400 cursor-pointer"
                          aria-label="Save name"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 opacity-60 cursor-pointer"
                          aria-label="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="font-semibold truncate">{item.label}</div>
                    )}
                    <div className="text-[11px] flex flex-wrap items-center gap-2 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      <span>{item.javaTargetVersion || 'Java 21 LTS'}</span>
                      <span>·</span>
                      <span>{item.time}</span>
                      {item.verifiedStatus && (
                        <>
                          <span>·</span>
                          <span className={item.verifiedStatus === 'behavioral_match' ? 'text-emerald-400' : 'text-amber-400'}>
                            {item.verifiedStatus}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() =>
                      setCompareIds((prev) =>
                        prev.includes(item.id)
                          ? prev.filter((x) => x !== item.id)
                          : [...prev.slice(-1), item.id]
                      )
                    }
                    className={`px-2 py-1 text-[11px] rounded cursor-pointer ${
                      isSelectedForDiff ? 't-btn-primary' : 't-btn-secondary'
                    }`}
                    title="Select 2 versions to compare"
                  >
                    Compare
                  </button>
                  <button
                    onClick={() => onDuplicateHistory(item)}
                    className="t-btn-secondary px-2 py-1 text-[11px] cursor-pointer"
                    title="Duplicate conversion"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(item.id);
                      setDraftLabel(item.label || '');
                    }}
                    className="t-btn-secondary px-2 py-1 text-[11px] cursor-pointer"
                    title="Rename"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDownloadJava(item)}
                    className="t-btn-secondary px-2 py-1 text-[11px] cursor-pointer"
                    title="Download Java"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onDeleteHistory(item.id)}
                    className="t-btn-secondary px-2 py-1 text-[11px] text-rose-400 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      onRestoreHistory(item);
                      onOpenStudio();
                    }}
                    className="t-btn-primary px-2.5 py-1 text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <span>Reopen</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function AnalysisWorkspaceView({ pythonCode = '', javaCode = '' }) {
  const compat = analyzePythonCompatibility(pythonCode);
  const deps = detectPythonDependencies(pythonCode);
  const quality = analyzeCodeQuality({ pythonCode, javaCode });

  return (
    <div className="space-y-4">
      <div className="t-surface p-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-semibold heading-font">Compatibility, Dependencies &amp; Quality Analysis</h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Deterministic pre-conversion scanner and static code inspection. Complexities are static heuristics, never runtime benchmarks.
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 t-subtle">
          Status: <strong>{compat.status}</strong>
        </span>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-mono">
        <div className="t-surface p-3"><div className="opacity-60 text-[11px]">Lines</div><div className="text-lg font-bold">{compat.metrics.lines}</div></div>
        <div className="t-surface p-3"><div className="opacity-60 text-[11px]">Functions</div><div className="text-lg font-bold">{compat.metrics.functions}</div></div>
        <div className="t-surface p-3"><div className="opacity-60 text-[11px]">Classes</div><div className="text-lg font-bold">{compat.metrics.classes}</div></div>
        <div className="t-surface p-3"><div className="opacity-60 text-[11px]">Imports</div><div className="text-lg font-bold">{compat.metrics.imports}</div></div>
        <div className="t-surface p-3"><div className="opacity-60 text-[11px]">Loops</div><div className="text-lg font-bold">{compat.metrics.loops}</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Compatibility Findings */}
        <div className="t-surface p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Python Construct Compatibility</span>
          </div>
          {compat.findings.length === 0 ? (
            <p className="text-xs opacity-70">Enter Python source code to scan construct compatibility.</p>
          ) : (
            <div className="space-y-2 text-xs">
              {compat.findings.map((f, idx) => (
                <div key={idx} className="p-2.5 rounded t-subtle space-y-0.5">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="font-semibold">{f.category}</span>
                    <span className={
                      f.classification === 'Supported'
                        ? 'text-emerald-400'
                        : f.classification === 'Unsupported'
                        ? 'text-rose-400'
                        : 'text-amber-400'
                    }>
                      {f.classification}
                    </span>
                  </div>
                  <p className="opacity-85">{f.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Code Quality Inspector */}
        <div className="t-surface p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono font-semibold">
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span>Code Quality &amp; Complexity</span>
            </span>
            <span className="text-[10px] opacity-60">{quality.basis}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded t-subtle"><div className="opacity-60 text-[10px]">Est. Time</div><div>{quality.estimatedTimeComplexity}</div></div>
            <div className="p-2 rounded t-subtle"><div className="opacity-60 text-[10px]">Est. Space</div><div>{quality.estimatedSpaceComplexity}</div></div>
          </div>
          <div className="space-y-2 text-xs">
            {quality.items.map((item, idx) => (
              <div key={idx} className="p-2.5 rounded t-subtle space-y-0.5">
                <div className="font-mono text-[11px] font-semibold flex items-center justify-between">
                  <span>{item.category}</span>
                  <span className="opacity-60 uppercase">{item.kind}</span>
                </div>
                <p className="opacity-85">{item.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dependency Intelligence */}
      <div className="t-surface p-4 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold">
          <Package className="w-4 h-4 text-sky-400" />
          <span>Detected Python Imports &amp; Java Equivalents</span>
        </div>
        {deps.length === 0 ? (
          <p className="text-xs font-mono opacity-70">No `import` statements detected in the current Python file.</p>
        ) : (
          <div className="space-y-2">
            {deps.map((d, idx) => (
              <div key={idx} className="p-3 rounded t-subtle text-xs space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono">
                  <span>
                    <strong className="text-amber-400">{d.pythonPkg}</strong> → <strong className="text-emerald-400">{d.javaEquivalent}</strong>
                  </span>
                  <span className="text-[11px] opacity-80">{d.classification}</span>
                </div>
                <p className="opacity-85">{d.compatibilityNote}</p>
                {d.manualMigration && (
                  <p className="text-amber-400/90 text-[11px] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>{d.manualMigration}</span>
                  </p>
                )}
                {d.mavenSnippet && (
                  <pre className="p-2 rounded text-[11px] font-mono overflow-x-auto" style={{ backgroundColor: 'var(--bg-editor)' }}>
                    {d.mavenSnippet}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TestsWorkspaceView({
  javaCode = '',
  generatedUnitTest = '',
  verificationReport = null,
  onGenerateTests = () => {},
  isGenerating = false,
  onDownloadJUnit = () => {},
  onBackToStudio = () => {},
}) {
  return (
    <div className="space-y-4">
      <div className="t-surface p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold heading-font flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-indigo-400" />
            <span>JUnit 5 Unit Test Generator</span>
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Generates JUnit 5 suites from Python source and verified runtime cases. Note: suites here are statically generated, not executed inside Maven.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onGenerateTests} disabled={isGenerating} className="t-btn-primary px-3 py-1.5 text-xs font-mono cursor-pointer disabled:opacity-50">
            {isGenerating ? 'Generating...' : 'Generate JUnit 5 Suite'}
          </button>
          <button onClick={onDownloadJUnit} className="t-btn-secondary px-3 py-1.5 text-xs font-mono flex items-center gap-1 cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            <span>SolutionTest.java</span>
          </button>
          <button onClick={onBackToStudio} className="t-btn-secondary px-3 py-1.5 text-xs font-mono cursor-pointer">
            Converter
          </button>
        </div>
      </div>

      <div className="t-surface p-4">
        <pre className="p-3.5 rounded font-mono text-xs overflow-auto max-h-[540px] whitespace-pre-wrap" style={{ backgroundColor: 'var(--bg-editor)' }}>
          {generatedUnitTest || `// Click "Generate JUnit 5 Suite" above after converting Python code (${verificationReport ? `${verificationReport.passedCases}/${verificationReport.totalCases} verified cases ready` : 'no verification run yet'}).`}
        </pre>
      </div>
    </div>
  );
}

export function SettingsWorkspaceView({
  settings,
  onUpdateSetting = () => {},
  onClearLocalData = () => {},
}) {
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="t-surface p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <div>
            <h1 className="text-base font-semibold heading-font">Studio Settings</h1>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Preferences apply immediately and are saved only on this browser (zero secrets or API keys stored locally).
            </p>
          </div>
        </div>
      </div>

      <div className="t-surface p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <label className="space-y-1.5">
          <span className="font-mono font-semibold block">Color Theme</span>
          <select
            value={settings.theme}
            onChange={(e) => onUpdateSetting('theme', e.target.value)}
            className="w-full p-2 t-subtle font-mono focus:outline-none"
          >
            <option value="dark">Studio Dark</option>
            <option value="light">Studio Light</option>
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="font-mono font-semibold block">Default Java Version</span>
          <select
            value={settings.defaultJavaVersion}
            onChange={(e) => onUpdateSetting('defaultJavaVersion', e.target.value)}
            className="w-full p-2 t-subtle font-mono focus:outline-none"
          >
            <option value="Java 21 LTS">Java 21 LTS</option>
            <option value="Java 17 LTS">Java 17 LTS</option>
            <option value="Java 11 LTS">Java 11 LTS</option>
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="font-mono font-semibold block">Default Conversion Mode</span>
          <select
            value={settings.defaultMode}
            onChange={(e) => onUpdateSetting('defaultMode', e.target.value)}
            className="w-full p-2 t-subtle font-mono focus:outline-none"
          >
            <option value="strict">Strict Behavior Preservation</option>
            <option value="idiomatic">Idiomatic Java</option>
            <option value="beginner">Beginner-Friendly</option>
            <option value="oop">Object-Oriented Java</option>
            <option value="performance">Performance-Oriented</option>
            <option value="streams">Java Streams</option>
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="font-mono font-semibold block">Editor Font Size ({settings.fontSize}px)</span>
          <input
            type="range"
            min={11}
            max={18}
            value={settings.fontSize}
            onChange={(e) => onUpdateSetting('fontSize', Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </label>

        <label className="flex items-center justify-between p-2.5 t-subtle cursor-pointer">
          <span className="font-mono">Word Wrapping</span>
          <input type="checkbox" checked={settings.wordWrap} onChange={(e) => onUpdateSetting('wordWrap', e.target.checked)} />
        </label>

        <label className="flex items-center justify-between p-2.5 t-subtle cursor-pointer">
          <span className="font-mono">Show Line Numbers</span>
          <input type="checkbox" checked={settings.showLineNumbers} onChange={(e) => onUpdateSetting('showLineNumbers', e.target.checked)} />
        </label>

        <label className="flex items-center justify-between p-2.5 t-subtle cursor-pointer">
          <span className="font-mono">Auto-Save Local Drafts</span>
          <input type="checkbox" checked={settings.autoSaveDraft} onChange={(e) => onUpdateSetting('autoSaveDraft', e.target.checked)} />
        </label>

        <label className="flex items-center justify-between p-2.5 t-subtle cursor-pointer">
          <span className="font-mono">Reduced Motion</span>
          <input type="checkbox" checked={settings.reducedMotion} onChange={(e) => onUpdateSetting('reducedMotion', e.target.checked)} />
        </label>
      </div>

      <div className="t-surface p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-mono font-semibold">Clear Local Browser Drafts &amp; History</div>
          <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            Removes draft code and cached local history from this browser. Does not affect server account history.
          </p>
        </div>
        <button
          onClick={onClearLocalData}
          className="t-btn-secondary px-3 py-1.5 text-xs font-mono text-rose-400 cursor-pointer"
        >
          Clear Local Data
        </button>
      </div>
    </div>
  );
}
