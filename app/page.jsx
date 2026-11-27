'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Navigation, { SidebarRail } from './components/Navigation';
import TranspilerStudio from './components/TranspilerStudio';
import CommandPalette from './components/CommandPalette';
import ApiPlayground from './components/ApiPlayground';
import WebhookInspector from './components/WebhookInspector';
import DocumentationView from './components/DocumentationView';
import CodeComparisonView from './components/CodeComparisonView';
import AuthModal from './components/AuthModal';
import {
  LandingHeroView,
  DashboardWorkspaceView,
  VerificationStudioView,
  AssistantWorkspaceView,
} from './components/ShowcaseViews';
import {
  FilesWorkspaceView,
  HistoryWorkspaceView,
  AnalysisWorkspaceView,
  TestsWorkspaceView,
  SettingsWorkspaceView,
} from './components/WorkspaceViews';
import {
  studioTranspileAction,
  studioDispatchWebhookAction,
  studioGetSampleSignatureAction,
} from './actions.js';
import { evaluatePythonStdout } from '../lib/stdout-eval';
import { generateJUnitTestSuite } from '../lib/junit-generator';

const DEFAULT_SETTINGS = {
  theme: 'dark',
  accent: 'violet',
  defaultJavaVersion: 'Java 21 LTS',
  defaultMode: 'strict',
  fontSize: 13,
  wordWrap: false,
  showLineNumbers: true,
  autoSaveDraft: true,
  reducedMotion: false,
};

const INITIAL_SAMPLE_WEBHOOK = {
  id: 'wh_ciap_init99',
  statusCode: 200,
  eventType: 'code.conversion.completed',
  timestamp: '2026-11-15T10:30:00.000Z',
  targetUrl: '/api/v1/webhook-demo',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'JForge-Webhook-Dispatcher/1.0',
    'X-Event-Type': 'code.conversion.completed',
    'X-JForge-Delivery': 'wh_ciap_init99',
    'X-Signature-SHA256': '',
    'X-JForge-Signature': '',
  },
  payload: {
    id: 'wh_ciap_init99',
    event: 'code.conversion.completed',
    status: 'delivered',
    created_at: '2026-11-15T10:30:00.000Z',
    data: {
      source_language: 'python',
      target_language: 'java',
      execution_time_ms: 0,
      python_lines: 0,
      java_preview: '// Ready',
    },
  },
};

function computeProgramStdout(pyCode) {
  if (!pyCode || !pyCode.trim()) return '';
  const outputs = evaluatePythonStdout(pyCode);
  return outputs.length > 0 ? outputs.join('\n') : '';
}

export default function JForgeOrchestrator() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  // Start on Landing Hero showcase ('landing') when empty; restores into 'studio' automatically if user had a saved draft
  const [activeView, setActiveView] = useState('landing');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Clean Empty Studio State (Zero presets auto-loaded)
  const [workspaceFiles, setWorkspaceFiles] = useState([
    {
      id: 'tab_1',
      title: 'Untitled conversion',
      filename: 'main.py',
      pythonCode: '',
      javaCode: '',
      javaTargetVersion: 'Java 21 LTS',
    },
  ]);
  const [activeFileId, setActiveFileId] = useState('tab_1');
  const [conversionTitle, setConversionTitle] = useState('Untitled conversion');
  const [pythonCode, setPythonCode] = useState('');
  const [javaCode, setJavaCode] = useState('');
  const [selectedPython, setSelectedPython] = useState('');
  const [javaTargetVersion, setJavaTargetVersion] = useState('Java 21 LTS');
  const [conversionMode, setConversionMode] = useState('strict');
  const [conversionConfig, setConversionConfig] = useState({
    packageName: 'com.jforge.ciap',
    className: 'Solution',
    includeComments: true,
    includeJavadoc: false,
    includeMain: true,
  });
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  const [executionStdout, setExecutionStdout] = useState('');
  const [isTranspiling, setIsTranspiling] = useState(false);
  const [bypassCache, setBypassCache] = useState(false);
  const [selfHealing, setSelfHealing] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('Auto-saved locally');

  // Auth, History & Verification State
  const [authUser, setAuthUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authPromptReason, setAuthPromptReason] = useState('');
  const [history, setHistory] = useState([]);
  const [verificationReport, setVerificationReport] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [programStdin, setProgramStdin] = useState('');
  const [multiTestCases, setMultiTestCases] = useState([]);
  const [previousJavaCode, setPreviousJavaCode] = useState(null);
  const [generatedUnitTest, setGeneratedUnitTest] = useState('');
  const [isGeneratingTests, setIsGeneratingTests] = useState(false);

  // API Playground & Webhook State
  const [pgApiKey, setPgApiKey] = useState('');
  const [pgRequestBody, setPgRequestBody] = useState(
    JSON.stringify(
      {
        source_language: 'python',
        target_language: 'java',
        java_version: '21',
        python_code: 'def square(x: int) -> int:\n    return x * x\n\nprint(square(9))',
        webhook_url: '/api/v1/webhook-demo',
      },
      null,
      2
    )
  );
  const [pgStatusBadge, setPgStatusBadge] = useState({ code: 200, text: 'Ready', color: 'emerald' });
  const [pgResponseLatency, setPgResponseLatency] = useState(0);
  const [pgResponseHeaders, setPgResponseHeaders] = useState({});
  const [pgResponseBody, setPgResponseBody] = useState('');
  const [isPgLoading, setIsPgLoading] = useState(false);
  const [webhookEndpointUrl, setWebhookEndpointUrl] = useState('/api/v1/webhook-demo');
  const [webhookSigningSecret, setWebhookSigningSecret] = useState('');
  const [webhookEventTopic, setWebhookEventTopic] = useState('code.conversion.completed');
  const [webhookDeliveries, setWebhookDeliveries] = useState([INITIAL_SAMPLE_WEBHOOK]);
  const [selectedWebhookIndex, setSelectedWebhookIndex] = useState(0);

  // Toast State
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [copiedId, setCopiedId] = useState(null);
  const toastTimerRef = useRef(null);
  const cancelRef = useRef({ cancelled: false, abortController: null });

  const showToast = (message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ visible: true, message });
    toastTimerRef.current = setTimeout(() => {
      setToast({ visible: false, message: '' });
    }, 2400);
  };

  const promptSignIn = (reason = '') => {
    setAuthPromptReason(reason);
    setAuthModalOpen(true);
  };

  const copyToClipboard = (text, id, toastMsg) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const temp = document.createElement('textarea');
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
    showToast(toastMsg || 'Copied to clipboard');
  };

  const applyJavaChangeWithUndo = (nextJava) => {
    setPreviousJavaCode(javaCode);
    setJavaCode(nextJava);
  };

  const handleUndoJava = () => {
    if (!previousJavaCode) return;
    setJavaCode(previousJavaCode);
    setPreviousJavaCode(null);
    showToast('Reverted previous Java edit');
  };

  const updateSetting = (key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem('jforge_settings', JSON.stringify(next));
        if (key === 'theme') localStorage.setItem('jforge_theme', value);
        if (key === 'accent') localStorage.setItem('jforge_accent', value);
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const handleClearLocalData = () => {
    try {
      localStorage.removeItem('jforge_draft_v2');
      localStorage.removeItem('jforge_history');
    } catch {
      // Ignore
    }
    if (!authUser) setHistory([]);
    setAutoSaveStatus('Local data cleared');
    showToast('Cleared local drafts & history');
  };

  // Load session, theme/accent settings, local draft, and history asynchronously
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const authErr = params.get('auth_error');
    if (authErr) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    fetch('/api/auth/session', { cache: 'no-store' })
      .then((res) => res.json())
      .then((sess) => {
        if (!active) return;
        const user = sess?.authenticated ? sess.user : null;
        setAuthUser(user);

        try {
          const savedSettingsRaw = localStorage.getItem('jforge_settings');
          const parsedSettings = savedSettingsRaw ? JSON.parse(savedSettingsRaw) : null;
          if (parsedSettings && typeof parsedSettings === 'object') {
            const cleanTheme = ['dark', 'light'].includes(parsedSettings.theme) ? parsedSettings.theme : 'dark';
            const cleanAccent = ['violet', 'emerald', 'sky', 'amber', 'rose'].includes(parsedSettings.accent)
              ? parsedSettings.accent
              : 'violet';
            setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings, theme: cleanTheme, accent: cleanAccent });
            if (parsedSettings.defaultJavaVersion) setJavaTargetVersion(parsedSettings.defaultJavaVersion);
            if (parsedSettings.defaultMode) setConversionMode(parsedSettings.defaultMode);
          }

          if (!parsedSettings || parsedSettings.autoSaveDraft !== false) {
            const savedDraftRaw = localStorage.getItem('jforge_draft_v2');
            if (savedDraftRaw) {
              const draft = JSON.parse(savedDraftRaw);
              if (draft && typeof draft === 'object' && (draft.pythonCode || draft.javaCode)) {
                setConversionTitle(draft.title || 'Untitled conversion');
                setPythonCode(draft.pythonCode || '');
                setJavaCode(draft.javaCode || '');
                if (draft.javaTargetVersion) setJavaTargetVersion(draft.javaTargetVersion);
                setActiveView('studio');
                setAutoSaveStatus('Restored local draft');
              }
            }
          }

          const savedHist = JSON.parse(localStorage.getItem('jforge_history') || '[]');
          if (Array.isArray(savedHist)) setHistory(savedHist.slice(0, 25));
        } catch {
          // Ignore corrupted storage
        }

        if (authErr) {
          setAuthPromptReason(`Sign-in did not complete (${authErr}).`);
          setAuthModalOpen(true);
        }

        if (user) {
          fetch('/api/history', { cache: 'no-store' })
            .then((r) => r.json())
            .then((h) => {
              if (active && h?.ok && Array.isArray(h.items) && h.items.length > 0) {
                setHistory(h.items.slice(0, 25));
              }
            })
            .catch(() => {});
          studioGetSampleSignatureAction()
            .then((res) => {
              if (!active || !res?.ok || !res.headers?.['X-Signature-SHA256']) return;
              setWebhookDeliveries((prev) =>
                prev.map((item, idx) =>
                  idx === 0 && item.id === INITIAL_SAMPLE_WEBHOOK.id && !item.headers?.['X-Signature-SHA256']
                    ? { ...item, headers: { ...item.headers, ...res.headers } }
                    : item
                )
              );
            })
            .catch(() => {});
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  // Debounced auto-save draft (never stores API keys or credentials)
  useEffect(() => {
    if (!settings.autoSaveDraft) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          'jforge_draft_v2',
          JSON.stringify({
            title: conversionTitle,
            pythonCode,
            javaCode,
            javaTargetVersion,
            savedAt: new Date().toISOString(),
          })
        );
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setAutoSaveStatus(`Auto-saved ${nowStr}`);
      } catch {
        setAutoSaveStatus('Draft storage full');
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [pythonCode, javaCode, conversionTitle, javaTargetVersion, settings.autoSaveDraft]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Clear client session cleanly
    }
    setAuthUser(null);
    showToast('Signed out of J-Forge Studio');
  };

  // Workspace multi-tab buffers
  const handleSelectWorkspaceFile = (fileId) => {
    setWorkspaceFiles((prev) =>
      prev.map((f) =>
        f.id === activeFileId ? { ...f, title: conversionTitle, pythonCode, javaCode, javaTargetVersion } : f
      )
    );
    const target = workspaceFiles.find((f) => f.id === fileId);
    if (target) {
      setActiveFileId(target.id);
      setConversionTitle(target.title || 'Untitled conversion');
      setPythonCode(target.pythonCode || '');
      setJavaCode(target.javaCode || '');
      if (target.javaTargetVersion) setJavaTargetVersion(target.javaTargetVersion);
      setVerificationReport(null);
    }
  };

  const handleCreateWorkspaceFile = () => {
    const newId = `tab_${Date.now()}`;
    const savedCurrent = workspaceFiles.map((f) =>
      f.id === activeFileId ? { ...f, title: conversionTitle, pythonCode, javaCode, javaTargetVersion } : f
    );
    const nextFile = {
      id: newId,
      title: `Untitled ${savedCurrent.length + 1}`,
      filename: `script_${savedCurrent.length + 1}.py`,
      pythonCode: '',
      javaCode: '',
      javaTargetVersion: settings.defaultJavaVersion || 'Java 21 LTS',
    };
    setWorkspaceFiles([...savedCurrent, nextFile]);
    setActiveFileId(newId);
    setConversionTitle(nextFile.title);
    setPythonCode('');
    setJavaCode('');
    setExecutionStdout('');
    setVerificationReport(null);
    setActiveView('studio');
    showToast('Created clean conversion workspace');
  };

  const handleDeleteWorkspaceFile = (fileId) => {
    if (workspaceFiles.length <= 1) return;
    const remaining = workspaceFiles.filter((f) => f.id !== fileId);
    setWorkspaceFiles(remaining);
    if (fileId === activeFileId && remaining[0]) {
      setActiveFileId(remaining[0].id);
      setConversionTitle(remaining[0].title);
      setPythonCode(remaining[0].pythonCode);
      setJavaCode(remaining[0].javaCode);
    }
  };

  const saveCurrentSnapshot = (pySrc = pythonCode, jSrc = javaCode, statusLabel = null) => {
    if (!pySrc.trim()) return;
    const newEntry = {
      id: `hist_${Date.now()}`,
      label:
        conversionTitle !== 'Untitled conversion'
          ? conversionTitle
          : pySrc.split('\n').find((l) => l.trim())?.trim().slice(0, 42) || 'Python Script',
      pythonCode: pySrc,
      javaCode: jSrc,
      javaTargetVersion,
      ...(statusLabel ? { verifiedStatus: statusLabel } : {}),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setHistory((prev) => {
      const next = [newEntry, ...prev.filter((h) => h.pythonCode !== pySrc)].slice(0, 25);
      try { localStorage.setItem('jforge_history', JSON.stringify(next)); } catch {}
      return next;
    });
    if (authUser) {
      fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newEntry.label,
          pythonCode: pySrc,
          javaCode: jSrc,
          javaTargetVersion,
        }),
      }).catch(() => {});
    }
    showToast('Saved conversion to history');
  };

  // History CRUD
  const handleRenameHistory = async (id, newLabel) => {
    const clean = String(newLabel || '').trim().slice(0, 80);
    if (!clean) return;
    setHistory((prev) => {
      const updated = prev.map((h) => (h.id === id ? { ...h, label: clean } : h));
      try { localStorage.setItem('jforge_history', JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (authUser && !String(id).startsWith('hist_')) {
      fetch('/api/history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, label: clean }),
      }).catch(() => {});
    }
    showToast('Renamed project');
  };

  const handleDeleteHistory = async (id) => {
    setHistory((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      try { localStorage.setItem('jforge_history', JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (authUser && !String(id).startsWith('hist_')) {
      fetch('/api/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      }).catch(() => {});
    }
    showToast('Deleted project from history');
  };

  const handleDuplicateHistory = (item) => {
    const copy = {
      ...item,
      id: `hist_${Date.now()}`,
      label: `${item.label} (Copy)`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setHistory((prev) => {
      const next = [copy, ...prev].slice(0, 25);
      try { localStorage.setItem('jforge_history', JSON.stringify(next)); } catch {}
      return next;
    });
    showToast('Duplicated snapshot');
  };

  const handleToggleFavorite = (id) => {
    setHistory((prev) => {
      const next = prev.map((h) => (h.id === id ? { ...h, favorite: !h.favorite } : h));
      try { localStorage.setItem('jforge_history', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const recordWebhookDelivery = async (eventType, statusCode, pySnippet, javaSnippet, latencyMs, serverDelivery = null) => {
    if (serverDelivery?.headers && serverDelivery?.payload) {
      const entry = {
        id: serverDelivery.delivery_id || `wh_${Date.now()}`,
        statusCode: serverDelivery.status_code ?? statusCode,
        eventType: serverDelivery.headers['X-Event-Type'] || eventType,
        timestamp: serverDelivery.headers['X-Timestamp'] || new Date().toISOString(),
        targetUrl: serverDelivery.target_url || webhookEndpointUrl,
        headers: serverDelivery.headers,
        payload: serverDelivery.payload,
      };
      setWebhookDeliveries((prev) => [entry, ...prev]);
      setSelectedWebhookIndex(0);
      return entry;
    }

    const result = await studioDispatchWebhookAction({
      webhookUrl: webhookEndpointUrl,
      eventType,
      pythonCode: pySnippet,
      javaCode: javaSnippet,
      latencyMs,
      customSecret: webhookSigningSecret,
    });
    if (result?.status === 401 || result?.code === 'AUTH_REQUIRED') return null;
    if (result?.entry) {
      setWebhookDeliveries((prev) => [result.entry, ...prev]);
      setSelectedWebhookIndex(0);
      return result.entry;
    }
    return null;
  };

  const handleRepairJava = async (
    pyCode = pythonCode,
    jCode = javaCode,
    compilerErr = verificationReport?.java?.compilerError || '',
    mismatchNote = verificationReport?.status === 'behavioral_mismatch'
      ? `Python output: ${verificationReport?.python?.stdout || ''}\nJava output: ${verificationReport?.java?.stdout || ''}`
      : '',
    stdinVal = programStdin
  ) => {
    if (!pyCode?.trim() || !jCode?.trim() || isRepairing) return null;
    setIsRepairing(true);
    try {
      const res = await fetch('/api/v1/repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          python_code: pyCode,
          java_code: jCode,
          compiler_error: compilerErr,
          mismatch_note: mismatchNote,
          stdin: stdinVal,
          java_version: javaTargetVersion.replace(/[^0-9]/g, '') || '21',
        }),
      });
      const rep = await res.json();
      if (rep?.repaired && rep.javaCode) {
        applyJavaChangeWithUndo(rep.javaCode);
        if (rep.verification) {
          setVerificationReport({ ...rep.verification, repairedAttempts: rep.attempts || [] });
          if (rep.verification?.python?.ok) {
            setExecutionStdout(rep.verification.python.stdout || '');
          }
        }
        showToast(`Auto-repaired (${rep.attempts?.length || 1} javac pass)`);
      } else {
        showToast('No automatic patch could fix remaining issue');
      }
      return rep;
    } catch {
      showToast('Repair request failed');
      return null;
    } finally {
      setIsRepairing(false);
    }
  };

  const runVerification = async (pyCode, jCode, stdinVal = '', casesOverride = multiTestCases) => {
    if (!pyCode?.trim() || !jCode?.trim()) return null;
    const ctrl = new AbortController();
    cancelRef.current.abortController = ctrl;
    setIsVerifying(true);
    try {
      const payload = { python_code: pyCode, java_code: jCode, stdin: stdinVal };
      if (Array.isArray(casesOverride) && casesOverride.length > 0) {
        payload.test_cases = casesOverride;
      }
      const res = await fetch('/api/v1/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      if (cancelRef.current.cancelled) return null;
      const data = await res.json();
      setVerificationReport(data);
      if (data?.status) {
        setHistory((prev) => {
          const updated = prev.map((item, i) =>
            i === 0 && item.pythonCode === pyCode ? { ...item, verifiedStatus: data.status } : item
          );
          try { localStorage.setItem('jforge_history', JSON.stringify(updated)); } catch {}
          return updated;
        });
      }
      if (data?.python?.ok && typeof data.python.stdout === 'string') {
        setExecutionStdout(data.python.stdout);
      }
      if (data?.status === 'compilation_failed' && data.java?.compilerError) {
        await handleRepairJava(pyCode, jCode, data.java.compilerError, '', stdinVal);
      }
      return data;
    } catch (err) {
      if (err?.name === 'AbortError') {
        showToast('Verification cancelled');
        return null;
      }
      const fallbackErr = {
        status: 'inconclusive',
        compilationPassed: false,
        outputMatch: false,
        passedCases: 0,
        totalCases: 1,
        summary: 'Unable to reach execution sandbox.',
      };
      setVerificationReport(fallbackErr);
      return fallbackErr;
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancelTranspile = () => {
    cancelRef.current.cancelled = true;
    if (cancelRef.current.abortController) {
      cancelRef.current.abortController.abort();
    }
    setIsTranspiling(false);
    setIsVerifying(false);
    showToast('Conversion cancelled');
  };

  const handleTranspile = async ({ verify = true } = {}) => {
    const trimmed = pythonCode.trim();
    if (!trimmed) {
      showToast('Paste or upload Python code to convert');
      return;
    }

    cancelRef.current = { cancelled: false, abortController: null };
    setIsTranspiling(true);
    const startTime = performance.now();
    const targetJava = javaTargetVersion.replace(/[^0-9]/g, '') || '21';

    try {
      const actionRes = await studioTranspileAction({
        pythonCode,
        javaVersion: targetJava,
        webhookUrl: webhookEndpointUrl,
        bypassCache,
        additionalInstructions,
        conversionMode,
        conversionConfig,
      });

      if (cancelRef.current.cancelled) return;

      if (actionRes?.ok && actionRes?.data?.java_code) {
        const javaResult = actionRes.data.java_code;
        applyJavaChangeWithUndo(javaResult);
        setExecutionStdout(computeProgramStdout(pythonCode));
        setVerificationReport(null);
        if (actionRes.self_healing) setSelfHealing(actionRes.self_healing);

        const elapsedMs = Math.max(10, Math.round(performance.now() - startTime));
        saveCurrentSnapshot(pythonCode, javaResult);
        void recordWebhookDelivery(
          'code.conversion.completed',
          actionRes?.webhook_delivery?.status_code || 200,
          pythonCode,
          javaResult,
          elapsedMs,
          actionRes?.webhook_delivery || null
        );

        showToast(`Converted to ${javaTargetVersion}`);
        setIsTranspiling(false);
        if (verify && !cancelRef.current.cancelled) {
          await runVerification(pythonCode, javaResult, programStdin);
        }
      } else if (actionRes?.status === 401 || actionRes?.code === 'AUTH_REQUIRED') {
        promptSignIn(actionRes?.error || 'Sign in to continue unlimited AI conversions.');
      } else {
        showToast(actionRes?.error || 'Conversion rejected');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsTranspiling(false);
    }
  };

  const handleClearEditor = () => {
    setPythonCode('');
    setJavaCode('');
    setExecutionStdout('');
    setVerificationReport(null);
    showToast('Editors cleared');
  };

  const handleDownloadJava = () => {
    const clsName = (conversionConfig?.className || 'Solution').trim() || 'Solution';
    const blob = new Blob([javaCode || '// Empty'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clsName}.java`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${clsName}.java`);
  };

  const handleGenerateStandaloneTests = async () => {
    if (!pythonCode.trim()) return;
    setIsGeneratingTests(true);
    try {
      const res = await fetch('/api/v1/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-tests',
          python_code: pythonCode,
          java_code: javaCode || '// empty',
          verification_report: verificationReport,
          java_version: javaTargetVersion.replace(/[^0-9]/g, '') || '21',
        }),
      });
      const data = await res.json();
      if (data?.testCode) setGeneratedUnitTest(data.testCode);
    } finally {
      setIsGeneratingTests(false);
    }
  };

  // Keyboard shortcuts
  const actionsRef = useRef({ handleTranspile });
  useEffect(() => {
    actionsRef.current = { handleTranspile };
  });

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        actionsRef.current.handleTranspile({ verify: true });
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const commands = useMemo(
    () => [
      { id: 'dashboard', category: 'View', label: 'Open Dashboard', run: () => setActiveView('dashboard') },
      { id: 'studio', category: 'View', label: 'Open Conversion Studio', run: () => setActiveView('studio') },
      { id: 'convert-verify', category: 'Run', label: 'Convert & Verify Code', shortcut: '⌘↵', disabled: !pythonCode.trim(), run: () => handleTranspile({ verify: true }) },
      { id: 'verification', category: 'View', label: 'Open Verification Studio', run: () => setActiveView('verification') },
      { id: 'assistant', category: 'AI', label: 'Open AI Assistant', run: () => setActiveView('assistant') },
      { id: 'analysis', category: 'View', label: 'Open Code Analysis', run: () => setActiveView('analysis') },
      { id: 'history', category: 'View', label: 'Open Projects & History', run: () => setActiveView('history') },
      { id: 'new-conv', category: 'File', label: 'New Blank Conversion', run: handleCreateWorkspaceFile },
      { id: 'toggle-theme', category: 'Theme', label: settings.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode', run: () => updateSetting('theme', settings.theme === 'dark' ? 'light' : 'dark') },
      { id: 'settings', category: 'View', label: 'Open Settings', run: () => setActiveView('settings') },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pythonCode, settings.theme]
  );

  // API Gateway handlers
  const generatedCurl = useMemo(() => {
    const clean = (pgRequestBody || '').replace(/\n/g, ' ');
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://py2java-transpiler.vercel.app';
    return `curl -X POST ${origin}/api/v1/convert \\\n  -H "Content-Type: application/json" \\\n  -H "x-api-key: ${pgApiKey || '<YOUR_APP_API_KEY>'}" \\\n  -d '${clean}'`;
  }, [pgApiKey, pgRequestBody]);

  const handleLoadScenario = (scenario) => {
    if (scenario === 'valid') {
      setPgRequestBody(JSON.stringify({ source_language: 'python', target_language: 'java', java_version: '21', python_code: 'print(2 + 2)', webhook_url: webhookEndpointUrl }, null, 2));
    } else if (scenario === 'unauthorized') {
      setPgApiKey('invalid-key');
    } else if (scenario === 'badrequest') {
      setPgRequestBody(JSON.stringify({ source_language: 'python', target_language: 'java', python_code: '  ' }, null, 2));
    }
  };

  const handleExecutePlayground = async () => {
    setIsPgLoading(true);
    try {
      let parsedBody;
      try {
        parsedBody = JSON.parse(pgRequestBody);
      } catch (err) {
        setPgStatusBadge({ code: 400, text: '400 Bad Request', color: 'amber' });
        setPgResponseBody(JSON.stringify({ error: 'Malformed JSON', message: err.message }, null, 2));
        return;
      }
      const start = performance.now();
      const res = await fetch('/api/v1/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': pgApiKey },
        body: pgRequestBody,
      });
      const data = await res.json();
      setPgResponseLatency(Math.max(5, Math.round(performance.now() - start)));
      setPgStatusBadge({ code: res.status, text: `${res.status}`, color: res.ok ? 'emerald' : 'rose' });
      setPgResponseHeaders({ 'content-type': 'application/json', 'x-cache': res.headers.get('x-cache') || 'MISS' });
      setPgResponseBody(JSON.stringify(data, null, 2));
      if (res.ok) {
        void recordWebhookDelivery('code.conversion.completed', 200, parsedBody.python_code || '', data?.data?.java_code || '', 20, data?.webhook_delivery || null);
      }
    } finally {
      setIsPgLoading(false);
    }
  };

  const handleDownloadReadme = () => {
    const md = `# J-Forge Studio\nPython 3 to Java LTS Conversion, Verification, Compatibility & Code Analysis Workspace.`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'README.md';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div
      data-theme={settings.theme}
      data-accent={settings.accent || 'violet'}
      className={`min-h-screen flex flex-col antialiased ${settings.reducedMotion ? 'reduced-motion' : ''}`}
      style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}
    >
      {/* Top Bar */}
      <Navigation
        theme={settings.theme}
        onToggleTheme={() => updateSetting('theme', settings.theme === 'dark' ? 'light' : 'dark')}
        onOpenHome={() => setActiveView('landing')}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenSettings={() => setActiveView('settings')}
        onOpenVerification={() => setActiveView('verification')}
        verificationReport={verificationReport}
        authUser={authUser}
        onLogout={handleLogout}
      />

      {activeView === 'landing' ? (
        <LandingHeroView
          authUser={authUser}
          onStartConverting={() => setActiveView('studio')}
          onOpenDashboard={() => setActiveView('dashboard')}
          onOpenDocs={() => setActiveView('docs')}
        />
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-3rem)]">
          <SidebarRail
            activeView={activeView}
            setActiveView={setActiveView}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          />

          <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto min-w-0 max-w-[1600px] w-full mx-auto">
            {activeView === 'dashboard' && (
              <DashboardWorkspaceView
                authUser={authUser}
                history={history}
                workspaceFiles={workspaceFiles}
                verificationReport={verificationReport}
                onNewConversion={handleCreateWorkspaceFile}
                onOpenStudio={() => setActiveView('studio')}
                onOpenAssistant={() => setActiveView('assistant')}
                onOpenHistory={() => setActiveView('history')}
                onOpenAnalysis={() => setActiveView('analysis')}
                onRestoreHistory={(entry) => {
                  setConversionTitle(entry.label || 'Untitled conversion');
                  setPythonCode(entry.pythonCode || '');
                  setJavaCode(entry.javaCode || '');
                  if (entry.javaTargetVersion) setJavaTargetVersion(entry.javaTargetVersion);
                  setExecutionStdout(computeProgramStdout(entry.pythonCode));
                }}
              />
            )}

            {activeView === 'studio' && (
              <TranspilerStudio
                conversionTitle={conversionTitle}
                onChangeTitle={setConversionTitle}
                pythonCode={pythonCode}
                setPythonCode={setPythonCode}
                javaCode={javaCode}
                setJavaCode={setJavaCode}
                javaTargetVersion={javaTargetVersion}
                setJavaTargetVersion={setJavaTargetVersion}
                conversionMode={conversionMode}
                setConversionMode={setConversionMode}
                conversionConfig={conversionConfig}
                setConversionConfig={setConversionConfig}
                additionalInstructions={additionalInstructions}
                setAdditionalInstructions={setAdditionalInstructions}
                isTranspiling={isTranspiling}
                onTranspile={handleTranspile}
                onCancelTranspile={handleCancelTranspile}
                onNewConversion={handleCreateWorkspaceFile}
                onSaveProject={() => saveCurrentSnapshot(pythonCode, javaCode, verificationReport?.status || null)}
                onClearEditor={handleClearEditor}
                executionStdout={executionStdout}
                onDownloadJava={handleDownloadJava}
                copyToClipboard={copyToClipboard}
                copiedId={copiedId}
                bypassCache={bypassCache}
                setBypassCache={setBypassCache}
                selfHealing={selfHealing}
                verificationReport={verificationReport}
                isVerifying={isVerifying}
                isRepairing={isRepairing}
                onRepairJava={() => handleRepairJava()}
                onApplyJavaEdit={applyJavaChangeWithUndo}
                canUndoJava={Boolean(previousJavaCode)}
                onUndoJava={handleUndoJava}
                programStdin={programStdin}
                setProgramStdin={setProgramStdin}
                multiTestCases={multiTestCases}
                setMultiTestCases={setMultiTestCases}
                onVerifyOnly={() => runVerification(pythonCode, javaCode, programStdin, multiTestCases)}
                selectedPython={selectedPython}
                onSelectPython={setSelectedPython}
                settings={settings}
                autoSaveStatus={autoSaveStatus}
                history={history}
                onRestoreHistory={(entry) => {
                  setConversionTitle(entry.label || 'Untitled conversion');
                  setPythonCode(entry.pythonCode || '');
                  setJavaCode(entry.javaCode || '');
                  if (entry.javaTargetVersion) setJavaTargetVersion(entry.javaTargetVersion);
                  setExecutionStdout(computeProgramStdout(entry.pythonCode));
                  setVerificationReport(null);
                  showToast('Restored from history');
                }}
                onToggleAssistant={() => setActiveView('assistant')}
              />
            )}

            {activeView === 'assistant' && (
              <AssistantWorkspaceView
                pythonCode={pythonCode}
                javaCode={javaCode}
                selectedPython={selectedPython}
                javaVersion={javaTargetVersion}
                verificationReport={verificationReport}
                onApplyJavaEdit={(code) => {
                  applyJavaChangeWithUndo(code);
                  showToast('Applied assistant suggestion');
                }}
              />
            )}

            {activeView === 'verification' && (
              <VerificationStudioView
                pythonCode={pythonCode}
                javaCode={javaCode}
                javaVersion={javaTargetVersion}
                verificationReport={verificationReport}
                isVerifying={isVerifying}
                isRepairing={isRepairing}
                onVerify={() => runVerification(pythonCode, javaCode, programStdin, multiTestCases)}
                onRepair={() => handleRepairJava()}
              />
            )}

            {activeView === 'files' && (
              <FilesWorkspaceView
                files={workspaceFiles}
                activeFileId={activeFileId}
                onSelectFile={handleSelectWorkspaceFile}
                onCreateFile={handleCreateWorkspaceFile}
                onDeleteFile={handleDeleteWorkspaceFile}
                onOpenConverter={() => setActiveView('studio')}
              />
            )}

            {activeView === 'history' && (
              <HistoryWorkspaceView
                authUser={authUser}
                history={history}
                workspaceFiles={workspaceFiles}
                activeFileId={activeFileId}
                onSelectFile={handleSelectWorkspaceFile}
                onCreateFile={handleCreateWorkspaceFile}
                onOpenStudio={() => setActiveView('studio')}
                onRestoreHistory={(entry) => {
                  setConversionTitle(entry.label || 'Untitled conversion');
                  setPythonCode(entry.pythonCode || '');
                  setJavaCode(entry.javaCode || '');
                  if (entry.javaTargetVersion) setJavaTargetVersion(entry.javaTargetVersion);
                  setExecutionStdout(computeProgramStdout(entry.pythonCode));
                  showToast('Loaded saved conversion');
                }}
                onRenameHistory={handleRenameHistory}
                onDeleteHistory={handleDeleteHistory}
                onDuplicateHistory={handleDuplicateHistory}
                onToggleFavorite={handleToggleFavorite}
              />
            )}

            {activeView === 'tests' && (
              <TestsWorkspaceView
                javaCode={javaCode}
                generatedUnitTest={generatedUnitTest || (javaCode.trim() ? generateJUnitTestSuite({ javaCode, verificationReport }) : '')}
                verificationReport={verificationReport}
                isGenerating={isGeneratingTests}
                onGenerateTests={handleGenerateStandaloneTests}
                onDownloadJUnit={() => {
                  const content = generatedUnitTest || generateJUnitTestSuite({ javaCode, verificationReport });
                  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = 'SolutionTest.java';
                  a.click();
                  URL.revokeObjectURL(a.href);
                }}
                onBackToStudio={() => setActiveView('studio')}
              />
            )}

            {activeView === 'comparison' && (
              <CodeComparisonView
                pythonCode={pythonCode}
                javaCode={javaCode}
                onEditPython={setPythonCode}
                onRunConvert={() => handleTranspile({ verify: true })}
                isTranspiling={isTranspiling}
              />
            )}

            {activeView === 'analysis' && (
              <AnalysisWorkspaceView pythonCode={pythonCode} javaCode={javaCode} />
            )}

            {activeView === 'playground' && (
              <div className="space-y-5">
                <ApiPlayground
                  pgApiKey={pgApiKey}
                  setPgApiKey={setPgApiKey}
                  pgRequestBody={pgRequestBody}
                  setPgRequestBody={setPgRequestBody}
                  pgStatusBadge={pgStatusBadge}
                  pgResponseLatency={pgResponseLatency}
                  pgResponseHeaders={pgResponseHeaders}
                  pgResponseBody={pgResponseBody}
                  isPgLoading={isPgLoading}
                  onExecuteRequest={handleExecutePlayground}
                  onLoadScenario={handleLoadScenario}
                  generatedCurl={generatedCurl}
                  copyToClipboard={copyToClipboard}
                  copiedId={copiedId}
                />
                <WebhookInspector
                  webhookEndpointUrl={webhookEndpointUrl}
                  setWebhookEndpointUrl={setWebhookEndpointUrl}
                  webhookSigningSecret={webhookSigningSecret}
                  setWebhookSigningSecret={setWebhookSigningSecret}
                  webhookEventTopic={webhookEventTopic}
                  setWebhookEventTopic={setWebhookEventTopic}
                  webhookDeliveries={webhookDeliveries}
                  selectedWebhookIndex={selectedWebhookIndex}
                  setSelectedWebhookIndex={setSelectedWebhookIndex}
                  onTriggerManualWebhook={async () => {
                    const entry = await recordWebhookDelivery(webhookEventTopic, 200, pythonCode, javaCode, 25, null);
                    if (entry) showToast(`Webhook dispatched (HTTP ${entry.statusCode})`);
                  }}
                  onClearLogs={() => {
                    setWebhookDeliveries([]);
                    setSelectedWebhookIndex(0);
                  }}
                  onReplayWebhook={(idx) => {
                    const orig = webhookDeliveries[idx];
                    if (orig) void recordWebhookDelivery(`${orig.eventType}.replay`, 200, pythonCode, javaCode, 20, null);
                  }}
                  copyToClipboard={copyToClipboard}
                  copiedId={copiedId}
                />
              </div>
            )}

            {activeView === 'docs' && (
              <DocumentationView onDownloadReadme={handleDownloadReadme} copyToClipboard={copyToClipboard} copiedId={copiedId} />
            )}

            {activeView === 'settings' && (
              <SettingsWorkspaceView
                settings={settings}
                onUpdateSetting={updateSetting}
                onClearLocalData={handleClearLocalData}
                onSavedToast={() => showToast('Studio settings saved')}
              />
            )}
          </main>
        </div>
      )}

      <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} commands={commands} />
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} returnTo="/" reason={authPromptReason} />

      <div
        className={`fixed bottom-4 right-4 z-50 transition-all duration-150 pointer-events-none t-surface px-3.5 py-2 flex items-center gap-2 text-xs font-mono ${
          toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
