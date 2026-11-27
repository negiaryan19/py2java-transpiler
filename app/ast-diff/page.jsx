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
} from 'lucide-react';
import ASTDiffViewer from '../../components/ASTDiffViewer.jsx';

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

  const analyzeCode = useCallback(async (codeToAnalyze) => {
    if (!codeToAnalyze || !codeToAnalyze.trim()) {
      setErrorMessage('Please enter valid Python code to analyze.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setStatusMessage('Step 1/2: Synthesizing Java code via Gemini 2.5 Flash API...');

    try {
      const apiKey = process.env.NEXT_PUBLIC_APP_API_KEY || 'ciap-secret-key-2026';

      // 1. Call POST /api/v1/convert to get transpiled Java code
      const convertRes = await fetch('/api/v1/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          python_code: codeToAnalyze,
          java_version: '17',
          bypass_cache: false,
        }),
      });

      if (!convertRes.ok) {
        const errJson = await convertRes.json().catch(() => ({}));
        throw new Error(errJson.message || `Transpilation failed with HTTP ${convertRes.status}`);
      }

      const convertData = await convertRes.json();
      const synthesizedJava = convertData?.data?.java_code || '';
      setJavaCode(synthesizedJava);

      // 2. Call POST /api/v1/ast-diff with both Python and Java source codes
      setStatusMessage('Step 2/2: Parsing cross-language AST & computing alignments...');
      const diffRes = await fetch('/api/v1/ast-diff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          python_code: codeToAnalyze,
          java_code: synthesizedJava,
        }),
      });

      if (!diffRes.ok) {
        const diffErr = await diffRes.json().catch(() => ({}));
        throw new Error(diffErr.message || `AST Diff failed with HTTP ${diffRes.status}`);
      }

      const diffData = await diffRes.json();
      setAlignmentPairs(diffData.alignment_pairs || []);
      setStats(diffData.summary || null);
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
      void analyzeCode(preset.code);
    }
  };

  // Run initial analysis asynchronously after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      void analyzeCode(SAMPLE_PRESETS.fastapi.code);
    }, 0);
    return () => clearTimeout(timer);
  }, [analyzeCode]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to J-Forge Studio</span>
          </Link>
          <div className="h-4 w-px bg-slate-800"></div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
              <Code2 className="w-4 h-4" />
            </span>
            <span className="font-bold text-sm tracking-tight">AST Differential Inspector</span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
            Java 17 LTS / Spring Boot 3
          </span>
          <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30 font-semibold">
            Tree-Sitter AST
          </span>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header Hero Banner */}
        <div className="p-6 rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-950 shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-sky-400 font-mono text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Interactive Cross-Language Syntax Mapping</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
            AST Differential Inspector
          </h1>
          <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
            Hover over Python types, decorators, or class models to see their corresponding Java 17 constructs,
            CPython-to-JVM memory allocations, and strict type safety invariants.
          </p>
        </div>

        {/* Input Configuration & Preset Selection */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Source Python 3.11 Code:
              </span>
              <span className="text-[11px] text-slate-500">Edit or select an enterprise preset</span>
            </div>

            {/* Preset Selector Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              <span className="text-slate-500 text-[11px] mr-1">Presets:</span>
              {Object.entries(SAMPLE_PRESETS).map(([k, p]) => (
                <button
                  key={k}
                  onClick={() => handleSelectPreset(k)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded border border-slate-800 bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px]"
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
            className="w-full p-3.5 rounded-lg border border-slate-800 bg-slate-950 font-mono text-xs text-sky-200 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all leading-relaxed"
            placeholder="Type or paste Python code here..."
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-xs font-mono text-slate-400">
              {statusMessage ? (
                <span className="flex items-center gap-2 text-sky-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{statusMessage}</span>
                </span>
              ) : stats ? (
                <span className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    Aligned {stats.total_alignments} nodes ({stats.exact_matches} exact,{' '}
                    {stats.inferred_matches} inferred, {stats.healed_matches} healed)
                  </span>
                </span>
              ) : (
                <span>Click Analyze to parse and correlate AST tokens</span>
              )}
            </div>

            <button
              onClick={() => handleAnalyze()}
              disabled={isLoading}
              className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-500/20 disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing AST...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Analyze AST Diff</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 font-mono text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Analysis Failed</span>
              <p className="text-rose-200/90">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* AST Diff Viewer Component */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Interactive Dual-Editor AST Diff</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Hover Python identifiers or click syntax tokens below
            </span>
          </div>

          <ASTDiffViewer
            pythonCode={pythonCode}
            javaCode={javaCode}
            alignmentPairs={alignmentPairs}
          />
        </section>
      </div>
    </main>
  );
}
