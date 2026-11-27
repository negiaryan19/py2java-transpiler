'use client';

import React from 'react';
import Link from 'next/link';
import {
  Code2,
  Sliders,
  Sun,
  Flame,
  Moon,
  Sparkles,
  LogIn,
  LogOut,
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
  authUser = null,
  onOpenAuthModal = () => {},
  onLogout = () => {},
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
              Python → Java
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

          {authUser ? (
            <div className="flex items-center gap-1.5">
              <span
                className="t-subtle px-2.5 py-1.5 text-xs font-mono hidden sm:flex items-center gap-1.5"
                title={[authUser.name, authUser.email, authUser.organization, authUser.role].filter(Boolean).join(' • ')}
              >
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {(authUser.name || authUser.email || 'U').charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[110px] truncate">{authUser.name || authUser.email}</span>
                {authUser.role && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 font-semibold hidden xl:inline-block uppercase">
                    {authUser.role}
                  </span>
                )}
              </span>
              <button
                onClick={onLogout}
                className="t-btn-secondary px-2.5 py-1.5 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                title={`Sign out (${authUser.email})`}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <a
              href="/login"
              className="t-btn-primary px-3 py-1.5 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </a>
          )}
        </div>
      </header>
    </>
  );
}

export function SidebarRail({
  activeView,
  setActiveView,
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
            Menu
          </p>
        </div>

        {/* Core Navigation Views */}
        <nav className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
          <button
            onClick={() => setActiveView('studio')}
            className={`nav-item w-full px-3 py-2.5 text-xs flex items-center justify-between text-left cursor-pointer ${
              activeView === 'studio' ? 'active' : ''
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Code2 className="w-4 h-4 shrink-0" />
              <span>Code Converter</span>
            </span>
          </button>

          <Link
            href="/ast-diff"
            className="nav-item w-full px-3 py-2.5 text-xs flex items-center justify-between text-left cursor-pointer rounded transition-all"
          >
            <span className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 shrink-0 text-sky-600" />
              <span>Code Comparison</span>
            </span>
          </Link>
        </nav>
      </div>
    </aside>
  );
}
