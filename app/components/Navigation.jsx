'use client';

import React from 'react';
import {
  Code2,
  Terminal,
  Webhook,
  BookOpen,
  Sliders,
  Plug,
  Sun,
  Flame,
  Moon,
} from 'lucide-react';

export default function Navigation({
  theme,
  setTheme,
  activeView,
  setActiveView,
  onOpenEngineModal,
  liveGeminiKey,
  activeEngine = 'Gemini Live',
  latency,
  webhookCount,
  showToast,
}) {
  return (
    <>
      {/* ====================================================================
          TOP GLOBAL APPLICATION HEADER
          ==================================================================== */}
      <header
        className="h-14 px-4 lg:px-6 t-border-b flex items-center justify-between sticky top-0 z-30"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        {/* Left: Brand Identity & Course Tag */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center font-mono font-bold text-sm t-btn-primary">
            JF
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-bold tracking-tight text-sm sm:text-base heading-font">J-Forge</span>
            <span
              className="text-xs px-2 py-0.5 font-mono t-subtle hidden sm:inline-block"
              style={{ color: 'var(--text-secondary)' }}
            >
              Py3.11 → Java 17 AST
            </span>
            <span
              className="text-[11px] font-mono px-2 py-0.5 rounded font-semibold hidden md:inline-block"
              style={{
                backgroundColor: 'var(--accent-badge-bg)',
                color: 'var(--accent-badge-text)',
                border: '1px solid var(--border-color)',
              }}
            >
              BTIN337 CIA-P (20M)
            </span>
          </div>
        </div>

        {/* Center: 3-Theme Live Switcher System */}
        <div className="flex items-center gap-1 p-1 t-subtle">
          <button
            onClick={() => {
              setTheme('cupertino');
              showToast('Switched theme to CUPERTINO LIGHT');
            }}
            className={`theme-pill px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition cursor-pointer ${
              theme === 'cupertino' ? 'font-bold' : 'opacity-85'
            }`}
            style={{ backgroundColor: theme === 'cupertino' ? 'var(--bg-surface)' : 'transparent' }}
          >
            <span className="w-2 h-2 rounded-full bg-zinc-900 border border-zinc-400"></span>
            <span className="hidden sm:inline">Cupertino Light</span>
            <Sun className="w-3.5 h-3.5 sm:hidden" />
          </button>

          <button
            onClick={() => {
              setTheme('brutalist');
              showToast('Switched theme to NEO-BRUTALIST');
            }}
            className={`theme-pill px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition cursor-pointer ${
              theme === 'brutalist' ? 'font-bold' : 'opacity-85'
            }`}
            style={{ backgroundColor: theme === 'brutalist' ? 'var(--bg-surface)' : 'transparent' }}
          >
            <span className="w-2 h-2 rounded-full bg-[#FF4F00] border border-black"></span>
            <span className="hidden sm:inline">Neo-Brutalist</span>
            <Flame className="w-3.5 h-3.5 sm:hidden" />
          </button>

          <button
            onClick={() => {
              setTheme('carbon');
              showToast('Switched theme to OLED CARBON');
            }}
            className={`theme-pill px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition cursor-pointer ${
              theme === 'carbon' ? 'font-bold' : 'opacity-85'
            }`}
            style={{ backgroundColor: theme === 'carbon' ? 'var(--bg-surface)' : 'transparent' }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="hidden sm:inline">OLED Carbon</span>
            <Moon className="w-3.5 h-3.5 sm:hidden" />
          </button>
        </div>

        {/* Right: Engine Status & Gateway Switcher */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenEngineModal}
            className="t-btn-secondary px-3 py-1.5 text-xs font-mono flex items-center gap-2 cursor-pointer"
          >
            <span className={`w-2 h-2 rounded-full ${activeEngine.toLowerCase().includes('gemini') || liveGeminiKey ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></span>
            <span className="hidden sm:inline">
              Engine: {activeEngine || (liveGeminiKey ? 'Gemini Live' : 'Smart AST')}
            </span>
            <Sliders className="w-3 h-3 opacity-75" />
          </button>

          <button
            onClick={() => setActiveView('playground')}
            className="t-btn-primary px-3 py-1.5 text-xs font-mono hidden sm:flex items-center gap-1.5 cursor-pointer"
          >
            <Plug className="w-3 h-3" />
            <span>POST /api/v1/convert</span>
          </button>
        </div>
      </header>
    </>
  );
}

export function SidebarRail({
  activeView,
  setActiveView,
  latency,
  webhookCount,
}) {
  return (
    <aside
      className="w-full lg:w-64 t-border-r p-3 flex flex-col justify-between shrink-0"
      style={{ backgroundColor: 'var(--bg-app)' }}
    >
      <div className="space-y-4">
        {/* Section Label */}
        <div className="px-2 pt-1">
          <p className="text-[11px] font-mono uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>
            Workspace Views
          </p>
        </div>

        {/* 4 Core Navigation Views */}
        <nav className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
          <button
            onClick={() => setActiveView('studio')}
            className={`nav-item w-full px-3 py-2.5 text-xs flex items-center justify-between text-left cursor-pointer ${
              activeView === 'studio' ? 'active' : ''
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Code2 className="w-4 h-4 shrink-0" />
              <span>Transpiler Studio</span>
            </span>
            <span className="text-[10px] font-mono opacity-60">01</span>
          </button>

          <button
            onClick={() => setActiveView('playground')}
            className={`nav-item w-full px-3 py-2.5 text-xs flex items-center justify-between text-left cursor-pointer ${
              activeView === 'playground' ? 'active' : ''
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Terminal className="w-4 h-4 shrink-0" />
              <span>API Playground</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-semibold">
              POST
            </span>
          </button>

          <button
            onClick={() => setActiveView('webhooks')}
            className={`nav-item w-full px-3 py-2.5 text-xs flex items-center justify-between text-left cursor-pointer ${
              activeView === 'webhooks' ? 'active' : ''
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Webhook className="w-4 h-4 shrink-0" />
              <span>Webhook Dispatcher</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded t-subtle">
              {webhookCount}
            </span>
          </button>

          <button
            onClick={() => setActiveView('docs')}
            className={`nav-item w-full px-3 py-2.5 text-xs flex items-center justify-between text-left cursor-pointer ${
              activeView === 'docs' ? 'active' : ''
            }`}
          >
            <span className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>API Docs & CIA-P</span>
            </span>
            <span className="text-[10px] font-mono opacity-60">20M</span>
          </button>
        </nav>

        {/* Active API Telemetry Card */}
        <div className="t-surface p-3 space-y-2.5 hidden lg:block">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold">Gateway Telemetry</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 font-semibold">
              200 OK
            </span>
          </div>
          <div className="space-y-1.5 text-[11px] font-mono" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex justify-between">
              <span>Auth Header:</span>
              <span className="font-semibold" style={{ color: 'var(--text-main)' }}>x-api-key</span>
            </div>
            <div className="flex justify-between">
              <span>Last Latency:</span>
              <span className="font-semibold" style={{ color: 'var(--text-main)' }}>{latency} ms</span>
            </div>
            <div className="flex justify-between">
              <span>Webhook Mode:</span>
              <span className="font-semibold text-emerald-600">Async JSON</span>
            </div>
          </div>
        </div>
      </div>

      {/* Student & Course Academic Metadata */}
      <div className="hidden lg:block pt-4 t-border-t space-y-2 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
        <div className="flex items-center justify-between font-mono">
          <span className="font-semibold" style={{ color: 'var(--text-main)' }}>CSE (AI & ML)</span>
          <span>2025-29</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Individual Practical Project • Python to Java Code Converter with REST API, Auth & Webhooks.
        </p>
      </div>
    </aside>
  );
}
