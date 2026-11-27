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
  Palette,
} from 'lucide-react';
import { analyzePythonCompatibility, detectPythonDependencies, analyzeCodeQuality } from '../../lib/compatibility';
import { buildZipBytes } from '../../lib/zip-export';
import { PythonLogo, JavaLogo } from './LanguageLogos';

const ACCENT_OPTIONS = [
  { id: 'orange', label: 'Forge Orange', hex: '#F97316' },
  { id: 'violet', label: 'Cosmic Violet', hex: '#7C3AED' },
  { id: 'emerald', label: 'Emerald', hex: '#10B981' },
  { id: 'sky', label: 'Sky Cyan', hex: '#0EA5E9' },
  { id: 'rose', label: 'Crimson Rose', hex: '#E11D48' },
];

export function FilesWorkspaceView({
  files = [],
  activeFileId,
  onSelectFile = () => {},
  onCreateFile = () => {},
  onDeleteFile = () => {},
  onOpenConverter = () => {},
}) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [targetJavaVersion, setTargetJavaVersion] = useState('21');
  const [migrating, setMigrating] = useState(false);
  const [migrationError, setMigrationError] = useState('');
  const [migrationResult, setMigrationResult] = useState(null);

  const handleUploadProjectFiles = async (event) => {
    const fileList = Array.from(event.target.files || []).slice(0, 15);
    if (!fileList.length) return;
    const loaded = await Promise.all(
      fileList.map(async (f) => ({
        path: (f.webkitRelativePath || f.name || 'module.py').replace(/^\/+/, ''),
        content: await f.text(),
      }))
    );
    setUploadedFiles(loaded);
    setMigrationError('');
  };

  const handleRunProjectMigration = async () => {
    const bufferSources = files
      .filter((f) => typeof f.pythonCode === 'string' && f.pythonCode.trim())
      .map((f, idx) => ({
        path: f.filename || `module_${idx + 1}.py`,
        content: f.pythonCode,
      }));
    const payloadFiles = uploadedFiles.length > 0 ? uploadedFiles : bufferSources;
    if (!payloadFiles.length) {
      setMigrationError('Add at least one non-empty Python buffer or upload .py files first.');
      return;
    }

    setMigrating(true);
    setMigrationError('');
    try {
      const res = await fetch('/api/v1/projects/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: payloadFiles.slice(0, 15),
          java_version: targetJavaVersion,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMigrationError(data.error || 'Project migration failed.');
        setMigrationResult(null);
      } else {
        setMigrationResult(data);
      }
    } catch (err) {
      setMigrationError(err.message || 'Network error running multi-file migration.');
    } finally {
      setMigrating(false);
    }
  };

  const handleDownloadMigratedZip = () => {
    if (!migrationResult?.generatedFiles?.length) return;
    const zipBytes = buildZipBytes(migrationResult.generatedFiles);
    const blob = new Blob([zipBytes], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jforge-migrated-java${targetJavaVersion}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="t-surface p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold heading-font">Workspace Projects &amp; Multi-File Migration</h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Manage Python workspace buffers or migrate up to 15 Python modules into a Maven Java package.
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
                active ? 'border-orange-500/60 bg-orange-500/5' : 't-subtle'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <PythonLogo className="w-4 h-4 shrink-0" />
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

      <div className="t-surface p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-orange-400" />
            <div>
              <h2 className="text-sm font-semibold heading-font">Batch Python → Maven Project Migrator</h2>
              <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                Analyzes entrypoints, internal imports, and unsupported APIs across workspace tabs or uploaded .py files.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <select
              value={targetJavaVersion}
              onChange={(e) => setTargetJavaVersion(e.target.value)}
              className="t-subtle px-2.5 py-1.5 text-xs"
              aria-label="Migration Java LTS target"
            >
              <option value="11">Java 11 LTS</option>
              <option value="17">Java 17 LTS</option>
              <option value="21">Java 21 LTS</option>
            </select>
            <label className="t-btn-secondary px-2.5 py-1.5 cursor-pointer">
              <input
                type="file"
                multiple
                accept=".py,.txt"
                onChange={handleUploadProjectFiles}
                className="hidden"
              />
              <span>{uploadedFiles.length ? `${uploadedFiles.length} Uploaded` : 'Upload .py Files'}</span>
            </label>
            <button
              onClick={handleRunProjectMigration}
              disabled={migrating}
              className="t-btn-primary px-3 py-1.5 cursor-pointer disabled:opacity-60"
            >
              {migrating ? 'Migrating...' : 'Migrate Project → Maven'}
            </button>
          </div>
        </div>

        {migrationError && (
          <div className="p-2.5 rounded border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs font-mono">
            {migrationError}
          </div>
        )}

        {migrationResult && (
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-emerald-400 font-semibold">
                  {migrationResult.plan.pythonModules} module(s) converted → {migrationResult.javaVersion}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Entrypoints: {migrationResult.plan.entrypoints.length ? migrationResult.plan.entrypoints.join(', ') : 'None detected'}
                </span>
              </div>
              <button
                onClick={handleDownloadMigratedZip}
                className="t-btn-secondary px-3 py-1.5 flex items-center gap-1.5 text-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Maven ZIP</span>
              </button>
            </div>

            {migrationResult.plan.manualInterventionRequired?.length > 0 && (
              <div className="p-2.5 rounded border border-amber-500/40 bg-amber-500/10 text-xs font-mono space-y-1">
                <div className="font-semibold text-amber-300">Manual Review Required</div>
                {migrationResult.plan.manualInterventionRequired.map((w, idx) => (
                  <div key={idx} className="text-amber-200/90">
                    {w.file}: {w.reason}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              {migrationResult.modules.map((m) => (
                <div key={m.sourcePath} className="t-subtle p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2 min-w-0">
                    <PythonLogo className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{m.sourcePath}</span>
                    <ArrowRight className="w-3 h-3 opacity-60 shrink-0" />
                    <JavaLogo className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-orange-300 truncate">{m.targetPath}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    {m.isEntrypoint && (
                      <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300">entrypoint</span>
                    )}
                    <span className="px-1.5 py-0.5 rounded bg-white/5" style={{ color: 'var(--text-secondary)' }}>
                      {m.compatibilityStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function HistoryWorkspaceView({
  authUser = null,
  history = [],
  workspaceFiles = [],
  activeFileId = '',
  onSelectFile = () => {},
  onCreateFile = () => {},
  onOpenStudio = () => {},
  onRestoreHistory = () => {},
  onRenameHistory = () => {},
  onDeleteHistory = () => {},
  onDuplicateHistory = () => {},
  onToggleFavorite = () => {},
}) {
  const [filterTab, setFilterTab] = useState('all');
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [compareIds, setCompareIds] = useState([]);

  const baseList =
    filterTab === 'favorites'
      ? history.filter((h) => h.favorite)
      : filterTab === 'recent'
      ? history.slice(0, 8)
      : history;

  const filtered = baseList.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (item.label || '').toLowerCase().includes(q) ||
      (item.pythonCode || '').toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)));
  const comparedItems = compareIds.map((id) => history.find((h) => h.id === id)).filter(Boolean);
  const verifiedTotal = history.filter((h) => h.verifiedStatus).length;
  const matchedTotal = history.filter((h) => h.verifiedStatus === 'behavioral_match').length;

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight heading-font">Projects &amp; History</h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {authUser ? 'Synced to Neon Postgres & cached locally.' : 'Stored locally on this browser (sign in to sync across devices).'}
          </p>
        </div>
        <button
          onClick={onCreateFile}
          className="t-btn-primary px-3.5 py-2 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
        >
          <span>New Project</span>
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 p-1 t-subtle text-xs font-mono">
          {[
            ['all', 'All Projects'],
            ['recent', 'Recent'],
            ['favorites', 'Favorites'],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilterTab(id)}
              className={`px-3 py-1 rounded cursor-pointer transition ${
                filterTab === id ? 't-btn-primary' : 'opacity-75 hover:opacity-100'
              }`}
            >
              {label}
            </button>
          ))}
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
              <GitCompare className="w-3.5 h-3.5 text-orange-400" />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 t-surface p-3 space-y-2">
          {sorted.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
              No conversions saved yet. Convert Python code in Studio to populate your project history.
            </div>
          ) : (
            sorted.map((item) => {
              const isSelectedForDiff = compareIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className="p-3 t-subtle flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
                >
                  <div className="min-w-0 flex-1 flex items-start gap-2.5">
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
                            className="px-2 py-1 t-surface text-xs focus:outline-none w-52"
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
                        <div className="font-semibold truncate flex items-center gap-1.5">
                          <PythonLogo className="w-3.5 h-3.5 shrink-0" />
                          <span>→</span>
                          <JavaLogo className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </div>
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
                          prev.includes(item.id) ? prev.filter((x) => x !== item.id) : [...prev.slice(-1), item.id]
                        )
                      }
                      className={`px-2 py-1 text-[11px] rounded cursor-pointer ${isSelectedForDiff ? 't-btn-primary' : 't-btn-secondary'}`}
                    >
                      Compare
                    </button>
                    <button onClick={() => onDuplicateHistory(item)} className="t-btn-secondary px-2 py-1 text-[11px] cursor-pointer" title="Duplicate">
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
                    <button onClick={() => handleDownloadJava(item)} className="t-btn-secondary px-2 py-1 text-[11px] cursor-pointer" title="Download">
                      <Download className="w-3 h-3" />
                    </button>
                    <button onClick={() => onDeleteHistory(item.id)} className="t-btn-secondary px-2 py-1 text-[11px] text-rose-400 cursor-pointer" title="Delete">
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        onRestoreHistory(item);
                        onOpenStudio();
                      }}
                      className="t-btn-primary px-2.5 py-1 text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-4">
          <div className="t-surface p-4 space-y-1">
            <div className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>Total Saved</div>
            <div className="text-3xl font-bold font-mono text-sky-400">{history.length}</div>
            <div className="text-[11px] opacity-75">Verified matches: {matchedTotal}/{verifiedTotal}</div>
          </div>

          <div className="t-surface p-4 space-y-2.5">
            <div className="text-xs font-mono font-semibold flex items-center gap-1.5">
              <FileCode2 className="w-3.5 h-3.5 text-orange-400" />
              <span>Open Workspace Buffers ({workspaceFiles.length})</span>
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              {workspaceFiles.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    onSelectFile(f.id);
                    onOpenStudio();
                  }}
                  className={`w-full text-left p-2 rounded flex items-center justify-between cursor-pointer ${
                    f.id === activeFileId ? 't-btn-primary' : 't-subtle'
                  }`}
                >
                  <span className="truncate">{f.title || f.filename}</span>
                  <span className="text-[10px] opacity-75">{f.pythonCode ? f.pythonCode.split('\n').length : 0}L</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Code Analysis View with Glowing SVG Radial Arc (Honest Construct Ratio Only)
 */
export function AnalysisWorkspaceView({ pythonCode = '', javaCode = '' }) {
  const [subTab, setSubTab] = useState('overview');
  const compat = analyzePythonCompatibility(pythonCode);
  const deps = detectPythonDependencies(pythonCode);
  const quality = analyzeCodeQuality({ pythonCode, javaCode });

  const supportedCount = compat.findings.filter((f) => f.classification === 'Supported').length;
  const totalFindings = compat.findings.length;
  const ratio = pythonCode.trim() && totalFindings > 0 ? supportedCount / totalFindings : 0;
  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference * (1 - ratio);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight heading-font">Code Analysis</h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Deterministic compatibility, dependency mappings &amp; static quality audit
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 t-subtle">
          Status: <strong>{compat.status}</strong>
        </span>
      </div>

      <div className="flex flex-wrap gap-1 p-1 t-subtle w-fit text-xs font-mono">
        {[
          ['overview', 'Overview'],
          ['dependencies', 'Dependencies'],
          ['suggestions', 'Quality'],
          ['compatibility', 'Compatibility'],
        ].map(([id, lbl]) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            className={`px-3 py-1 rounded cursor-pointer transition ${
              subTab === id ? 't-btn-primary' : 'opacity-75 hover:opacity-100'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {subTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="t-surface p-5 flex flex-col items-center justify-center text-center space-y-2">
            <div className="text-xs font-mono opacity-75">Supported Constructs</div>
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="44" fill="none" stroke="var(--border-color)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold font-mono">
                  {pythonCode.trim() ? `${supportedCount}/${totalFindings}` : '0/0'}
                </span>
                <span className="text-[10px] font-mono opacity-70">Checks</span>
              </div>
            </div>
            <div className="text-xs font-mono font-semibold text-emerald-400">
              {compat.status === 'empty' ? 'Waiting for Code' : compat.status}
            </div>
          </div>

          <div className="t-surface p-4 space-y-2.5">
            <div className="text-xs font-mono font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Key Insights</span>
            </div>
            <div className="space-y-1.5 text-xs">
              {(compat.findings.length > 0 ? compat.findings : [{ category: 'Empty', classification: 'Info', message: 'Paste Python code to run static inspection.' }]).slice(0, 4).map((f, idx) => (
                <div key={idx} className="p-2 rounded t-subtle">
                  <span className="font-mono font-semibold">[{f.classification}] </span>
                  <span className="opacity-85">{f.message}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="t-surface p-4 space-y-2.5">
            <div className="text-xs font-mono font-semibold flex items-center gap-1.5">
              <Package className="w-4 h-4 text-sky-400" />
              <span>Detected Dependencies</span>
            </div>
            {deps.length === 0 ? (
              <p className="text-xs font-mono opacity-70">No external imports detected in current script.</p>
            ) : (
              <div className="space-y-1.5 text-xs font-mono">
                {deps.map((d, i) => (
                  <div key={i} className="p-2 rounded t-subtle flex items-center justify-between gap-2">
                    <span className="truncate">{d.pythonPkg} → {d.javaEquivalent}</span>
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'dependencies' && (
        <div className="t-surface p-4 space-y-2.5">
          {deps.length === 0 ? (
            <p className="text-xs font-mono opacity-70">No `import` statements found.</p>
          ) : (
            deps.map((d, idx) => (
              <div key={idx} className="p-3 rounded t-subtle text-xs space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono">
                  <span><strong className="text-sky-400">{d.pythonPkg}</strong> → <strong className="text-orange-400">{d.javaEquivalent}</strong></span>
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[11px] opacity-85">
                    {d.validationStatusLabel || d.classification}
                  </span>
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
            ))
          )}
        </div>
      )}

      {subTab === 'suggestions' && (
        <div className="t-surface p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-semibold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-orange-400" /> Quality Audit</span>
            <span className="text-[10px] opacity-65">{quality.basis}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
            <div className="p-2.5 rounded t-subtle"><div className="opacity-65 text-[10px]">Est. Time</div><div>{quality.estimatedTimeComplexity}</div></div>
            <div className="p-2.5 rounded t-subtle"><div className="opacity-65 text-[10px]">Est. Space</div><div>{quality.estimatedSpaceComplexity}</div></div>
          </div>
          <div className="space-y-2 text-xs">
            {quality.items.map((item, idx) => (
              <div key={idx} className="p-2.5 rounded t-subtle">
                <div className="font-mono text-[11px] font-semibold">{item.category} · {item.kind}</div>
                <p className="opacity-85">{item.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'compatibility' && (
        <div className="t-surface p-4 space-y-2 text-xs">
          {compat.findings.map((f, idx) => (
            <div key={idx} className="p-2.5 rounded t-subtle flex flex-wrap items-center justify-between gap-2">
              <span><strong>[{f.category}]</strong> {f.message}</span>
              <span className="font-mono font-semibold text-sky-400">{f.classification}</span>
            </div>
          ))}
        </div>
      )}
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
            <FlaskConical className="w-4 h-4 text-orange-400" />
            <span>JUnit 5 Unit Test Generator</span>
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Generates JUnit 5 suites from Python behavior and executed test cases (statically generated; not executed inside Maven here).
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
          {generatedUnitTest || `// Click "Generate JUnit 5 Suite" after converting Python code (${verificationReport ? `${verificationReport.passedCases}/${verificationReport.totalCases} verified cases ready` : 'no verification run yet'}).`}
        </pre>
      </div>
    </div>
  );
}

export function SettingsWorkspaceView({
  settings,
  onUpdateSetting = () => {},
  onClearLocalData = () => {},
  onSavedToast = () => {},
}) {
  const [subTab, setSubTab] = useState('appearance');

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight heading-font flex items-center gap-2">
          <Sliders className="w-4 h-4 text-orange-400" />
          <span>Settings</span>
        </h1>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Customize your J-Forge Studio experience (stored locally in this browser; zero API keys persisted).
        </p>
      </div>

      <div className="flex flex-wrap gap-1 p-1 t-subtle w-fit text-xs font-mono">
        {[
          ['appearance', 'Appearance'],
          ['editor', 'Editor'],
          ['conversion', 'Defaults'],
        ].map(([id, lbl]) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            className={`px-3 py-1 rounded cursor-pointer transition ${
              subTab === id ? 't-btn-primary' : 'opacity-75 hover:opacity-100'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      <div className="t-surface p-5 space-y-5 text-xs">
        {subTab === 'appearance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="font-mono font-semibold block">Theme</span>
                <div className="flex gap-2">
                  {[
                    ['dark', 'Dark'],
                    ['light', 'Light'],
                  ].map(([val, lbl]) => (
                    <button
                      key={val}
                      onClick={() => onUpdateSetting('theme', val)}
                      className={`px-4 py-1.5 font-mono rounded cursor-pointer ${
                        settings.theme === val ? 't-btn-primary' : 't-btn-secondary'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-mono font-semibold flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" /> Accent Color
                </span>
                <div className="flex items-center gap-2.5">
                  {ACCENT_OPTIONS.map((swatch) => (
                    <button
                      key={swatch.id}
                      onClick={() => onUpdateSetting('accent', swatch.id)}
                      className={`w-6 h-6 rounded-full cursor-pointer border-2 transition ${
                        (settings.accent || 'orange') === swatch.id ? 'scale-110 border-white' : 'border-transparent opacity-80'
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                      title={swatch.label}
                      aria-label={`Accent ${swatch.label}`}
                    />
                  ))}
                </div>
              </div>

              <label className="flex items-center justify-between p-2.5 t-subtle cursor-pointer">
                <span className="font-mono">Reduced Motion</span>
                <input type="checkbox" checked={settings.reducedMotion} onChange={(e) => onUpdateSetting('reducedMotion', e.target.checked)} />
              </label>
            </div>

            <div className="space-y-1.5">
              <span className="font-mono font-semibold block">Live Editor Preview ({settings.fontSize}px)</span>
              <pre
                className="p-4 rounded t-subtle font-mono overflow-x-auto leading-relaxed"
                style={{ backgroundColor: 'var(--bg-editor)', fontSize: `${settings.fontSize}px` }}
              >{`def hello():\n    print("Hello, J-Forge V2!")`}</pre>
            </div>
          </div>
        )}

        {subTab === 'editor' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1.5 sm:col-span-2">
              <span className="font-mono font-semibold block">Editor Font Size ({settings.fontSize}px)</span>
              <input
                type="range"
                min={11}
                max={18}
                value={settings.fontSize}
                onChange={(e) => onUpdateSetting('fontSize', Number(e.target.value))}
                className="w-full accent-orange-500"
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
          </div>
        )}

        {subTab === 'conversion' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <label className="flex items-center justify-between p-2.5 t-subtle cursor-pointer sm:col-span-2">
              <span className="font-mono">Auto-Save Local Drafts</span>
              <input type="checkbox" checked={settings.autoSaveDraft} onChange={(e) => onUpdateSetting('autoSaveDraft', e.target.checked)} />
            </label>
            <div className="sm:col-span-2 flex items-center justify-between p-3 t-subtle">
              <div>
                <div className="font-mono font-semibold">Clear Local Browser Drafts &amp; History</div>
                <p className="text-[11px] opacity-70">Does not affect authenticated Neon Postgres history.</p>
              </div>
              <button onClick={onClearLocalData} className="t-btn-secondary px-3 py-1.5 font-mono text-rose-400 cursor-pointer">
                Clear Local Data
              </button>
            </div>
          </div>
        )}

        <div className="pt-2 t-border-t flex justify-end">
          <button onClick={onSavedToast} className="t-btn-primary px-4 py-2 font-mono cursor-pointer">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
