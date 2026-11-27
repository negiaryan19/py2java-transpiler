'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Play,
  Loader2,
  AlertCircle,
  Code2,
  ArrowLeft,
  CheckCircle2,
  LogIn,
  LogOut,
  Lock,
} from 'lucide-react';
import ASTDiffViewer from '../../components/ASTDiffViewer.jsx';
import AuthModal from '../components/AuthModal.jsx';
import { studioAstDiffAction } from '../actions.js';

const SAMPLE_PRESETS = {
  fastapi: {
    label: 'FastAPI & Pydantic User Service',
    code: `from pydantic import BaseModel
from typing import List, Optional, Any

class UserDTO(BaseModel):
    id: int
    name: str
    metadata: dict[str, Any]

@app.get("/users")
def get_users(query: Optional[str] = None) -> List[dict[str, Any]]:
    return [{"id": 1, "name": "Aryan", "role": "admin"}]

@app.post("/users")
def create_user(user: UserDTO) -> dict[str, str]:
    return {"status": "created"}`,
  },
  collections: {
    label: 'Typed Collections & Generics',
    code: `from typing import List, Set, tuple, Optional

def process_records(
    items: List[str],
    unique_tags: Set[str],
    pair: tuple[int, str]
) -> Optional[int]:
    if not items:
        return None
    return len(items) + len(unique_tags)`,
  },
  primitives: {
    label: 'Scalars & Memory Allocations',
    code: `def calculate_metrics(
    raw_bytes: bytes,
    scale: float,
    flag: bool
) -> str:
    count: int = len(raw_bytes)
    score: float = count * scale
    return f"Processed {count} bytes with score {score}"`,
  },
};

export default function ASTDiffPage() {
  const [pythonCode, setPythonCode] = useState(SAMPLE_PRESETS.fastapi.code);
  const [javaCode, setJavaCode] = useState('');
  const [alignmentPairs, setAlignmentPairs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [stats, setStats] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [oauthConfigured, setOauthConfigured] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authReason, setAuthReason] = useState('');
  const [theme, setTheme] = useState('cupertino');

  const analyzeCode = useCallback(async (codeToAnalyze) => {
    if (!codeToAnalyze || !codeToAnalyze.trim()) {
      setErrorMessage('Please enter valid Python code to analyze.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setStatusMessage('Analyzing Python syntax, synthesizing Java 17 LTS & aligning AST nodes...');

    try {
      const result = await studioAstDiffAction({ pythonCode: codeToAnalyze });
      if (result?.status === 401 || result?.code === 'AUTH_REQUIRED') {
        setAuthReason(result?.error || 'Sign in with Google (Gmail) to run live AST Diff analysis.');
        setAuthModalOpen(true);
        setStatusMessage('');
        return;
      }
      if (!result?.ok) {
        throw new Error(result?.error || 'AST differential analysis failed.');
      }

      setJavaCode(result.java_code || '');
      setAlignmentPairs(result.alignment_pairs || []);
      setStats(result.summary || null);
      setStatusMessage('');
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred during AST differential analysis.');
      setStatusMessage('');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAnalyze = (overrideCode) => analyzeCode(overrideCode ?? pythonCode);

  const handleSelectPreset = (key) => {
    const preset = SAMPLE_PRESETS[key];
    if (preset) {
      setPythonCode(preset.code);
      if (authUser) {
        void analyzeCode(preset.code);
      } else {
        setAuthReason('Sign in with Google (Gmail) to run live AST analysis on presets.');
        setAuthModalOpen(true);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore
    }
    setAuthUser(null);
  };

  // Check session on mount and run initial analysis automatically if authenticated
  useEffect(() => {
    let active = true;
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((res) => res.json())
      .then((sess) => {
        if (!active) return;
        try {
          const savedTheme = localStorage.getItem('jforge_theme');
          if (savedTheme && ['cupertino', 'brutalist', 'carbon'].includes(savedTheme)) {
            setTheme(savedTheme);
          }
        } catch {
          // Ignore storage errors
        }
        setOauthConfigured(Boolean(sess?.oauthConfigured));
        const user = sess?.authenticated ? sess.user : null;
        setAuthUser(user);
        setAuthChecked(true);
        if (user) {
          void analyzeCode(SAMPLE_PRESETS.fastapi.code);
        }
      })
      .catch(() => {
        if (active) setAuthChecked(true);
      });
    return () => {
      active = false;
    };
  }, [analyzeCode]);

  return (
    <main
      data-theme={theme}
      className="min-h-screen flex flex-col font-sans"
      style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}
    >
      {/* Top Navigation Bar */}
      <header
        className="h-14 px-4 lg:px-6 t-border-b flex items-center justify-between sticky top-0 z-40"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="t-btn-secondary px-2.5 py-1.5 text-xs font-mono flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center font-mono font-bold text-sm t-btn-primary">
              JF
            </div>
            <span className="font-bold tracking-tight text-sm sm:text-base heading-font">Code Comparison</span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          {authUser ? (
            <div className="flex items-center gap-1.5">
              <span className="hidden sm:inline-block px-2.5 py-1.5 t-subtle max-w-[140px] truncate">
                {authUser.name || authUser.email}
              </span>
              <button
                onClick={handleLogout}
                className="t-btn-secondary px-2.5 py-1.5 text-xs flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <a
              href="/login?returnTo=/ast-diff"
              className="t-btn-primary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </a>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {authChecked && !authUser && (
          <div className="t-surface p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
              <Lock className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                Sign in to analyze custom Python code with live AI comparison.
              </span>
            </div>
            <a
              href="/login?returnTo=/ast-diff"
              className="t-btn-primary px-3.5 py-1.5 text-xs font-mono font-bold cursor-pointer"
            >
              Sign In / Create Account
            </a>
          </div>
        )}
        {/* Header Hero Banner */}
        <div className="t-surface p-5 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-600 font-mono text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Side-by-Side Mapping</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight heading-font">
            Code Comparison
          </h1>
          <p className="text-xs sm:text-sm max-w-3xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Hover over Python types, decorators, or classes to see how each construct converts to Java.
          </p>
        </div>

        {/* Input Configuration & Preset Selection */}
        <div className="t-surface p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider">
                Python Code
              </span>
              <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Edit or choose an example</span>
            </div>

            {/* Preset Selector Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              <span className="text-[11px] mr-1" style={{ color: 'var(--text-secondary)' }}>Examples:</span>
              {Object.entries(SAMPLE_PRESETS).map(([k, p]) => (
                <button
                  key={k}
                  onClick={() => handleSelectPreset(k)}
                  disabled={isLoading}
                  className="t-btn-secondary px-2.5 py-1 transition-colors cursor-pointer text-[11px]"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            rows={6}
            value={pythonCode}
            onChange={(e) => setPythonCode(e.target.value)}
            spellCheck={false}
            className="w-full p-3.5 t-surface font-mono text-xs focus:outline-none leading-relaxed"
            style={{ backgroundColor: 'var(--bg-editor)', color: 'var(--text-main)' }}
            placeholder="Type or paste Python code here..."
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
              {statusMessage ? (
                <span className="flex items-center gap-2 text-sky-600">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{statusMessage}</span>
                </span>
              ) : stats ? (
                <span className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    Matched {stats.total_alignments} constructs ({stats.exact_matches} exact,{' '}
                    {stats.inferred_matches} inferred, {stats.healed_matches} healed)
                  </span>
                </span>
              ) : (
                <span>Click Compare Code to analyze Python → Java mapping</span>
              )}
            </div>

            <button
              onClick={() => handleAnalyze()}
              disabled={isLoading}
              className="t-btn-primary px-5 py-2 font-mono font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Comparing...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Compare Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 font-mono text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Comparison Failed</span>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* AST Diff Viewer Component */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-mono uppercase tracking-wider flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-500" />
              <span>Side-by-Side Comparison</span>
            </h2>
            <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
              Hover or click highlighted tokens
            </span>
          </div>

          <ASTDiffViewer
            pythonCode={pythonCode}
            javaCode={javaCode}
            alignmentPairs={alignmentPairs}
          />
        </section>
      </div>

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        oauthConfigured={oauthConfigured}
        returnTo="/ast-diff"
        reason={authReason}
      />
    </main>
  );
}
