'use client';

import React, { useState } from 'react';
import {
  ArrowLeftRight,
  FolderCode,
  History,
  FlaskConical,
  GitCompare,
  BarChart3,
  Sparkles,
  Settings,
  BookOpen,
  Terminal,
  Search,
  Sun,
  Moon,
  LogIn,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  User,
} from 'lucide-react';

export default function Navigation({
  theme = 'dark',
  onToggleTheme = () => {},
  onOpenCommandPalette = () => {},
  onOpenSettings = () => {},
  onToggleAssistant = () => {},
  assistantOpen = false,
  authUser = null,
  onLogout = () => {},
}) {
  return (
    <header
      className="h-12 px-3 sm:px-4 t-border-b flex items-center justify-between sticky top-0 z-30 shrink-0"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center font-mono font-bold text-xs tracking-tight text-white shrink-0"
          style={{ backgroundColor: 'var(--primary-bg)' }}
        >
          JF
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-semibold tracking-tight text-sm heading-font">J-Forge</span>
          <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>
            Studio
          </span>
        </div>
      </div>

      {/* Right: Compact IDE Utility Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenCommandPalette}
          className="t-btn-secondary px-2 py-1 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
          title="Open Command Palette (Cmd/Ctrl + K)"
          aria-label="Command Palette"
        >
          <Search className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
          <span className="hidden md:inline text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            Commands
          </span>
          <kbd className="hidden lg:inline text-[10px] px-1 rounded opacity-70 t-subtle">⌘K</kbd>
        </button>

        <button
          onClick={onToggleAssistant}
          className={`px-2 py-1 text-xs font-mono rounded flex items-center gap-1 cursor-pointer transition border ${
            assistantOpen ? 't-btn-primary' : 't-btn-secondary'
          }`}
          title="Toggle Context-Aware AI Assistant"
          aria-label="AI Assistant"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Assistant</span>
        </button>

        <a
          href="https://github.com/negiaryan19/py2java-transpiler"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 t-btn-secondary cursor-pointer hidden sm:flex items-center justify-center"
          title="J-Forge Repository on GitHub"
          aria-label="GitHub Repository"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.11.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.76 0c2.19-1.49 3.16-1.18 3.16-1.18.62 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14 0 1.54-.01 2.78-.01 3.16 0 .3.21.66.79.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
          </svg>
        </a>

        <button
          onClick={onToggleTheme}
          className="p-1.5 t-btn-secondary cursor-pointer flex items-center justify-center"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Color Theme"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={onOpenSettings}
          className="p-1.5 t-btn-secondary cursor-pointer flex items-center justify-center"
          title="Studio Settings"
          aria-label="Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {authUser ? (
          <div className="flex items-center gap-1">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white cursor-default"
              style={{ backgroundColor: 'var(--primary-bg)' }}
              title={[authUser.name, authUser.email, authUser.role].filter(Boolean).join(' · ')}
            >
              {(authUser.name || authUser.email || 'U').charAt(0).toUpperCase()}
            </span>
            <button
              onClick={onLogout}
              className="p-1.5 t-btn-secondary cursor-pointer"
              title={`Sign out (${authUser.email})`}
              aria-label="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <a
            href="/login"
            className="t-btn-primary px-2.5 py-1 text-xs font-mono flex items-center gap-1 cursor-pointer"
            title="Sign in or create account"
          >
            <LogIn className="w-3 h-3 sm:hidden" />
            <User className="w-3 h-3 hidden sm:inline" />
            <span className="hidden sm:inline">Sign In</span>
          </a>
        )}
      </div>
    </header>
  );
}

const PRIMARY_NAV = [
  { id: 'studio', label: 'Converter', icon: ArrowLeftRight, tip: 'Python to Java Workspace' },
  { id: 'files', label: 'Files', icon: FolderCode, tip: 'Workspace Source Tabs' },
  { id: 'history', label: 'History', icon: History, tip: 'Saved Conversions & Versions' },
  { id: 'tests', label: 'Unit Tests', icon: FlaskConical, tip: 'JUnit 5 Generation' },
  { id: 'comparison', label: 'AST Diff', icon: GitCompare, tip: 'Python vs Java Structural Comparison' },
  { id: 'analysis', label: 'Analysis', icon: BarChart3, tip: 'Compatibility, Dependencies & Quality' },
];

const SECONDARY_NAV = [
  { id: 'playground', label: 'API Gateway', icon: Terminal, tip: 'REST API Playground & Webhooks' },
  { id: 'docs', label: 'Documentation', icon: BookOpen, tip: 'Documentation & Reference' },
  { id: 'settings', label: 'Settings', icon: Settings, tip: 'Editor & Workspace Settings' },
];

export function SidebarRail({
  activeView,
  setActiveView,
  onToggleAssistant = () => {},
  assistantOpen = false,
  collapsed = true,
  onToggleCollapse = () => {},
}) {
  const [hoverLabel, setHoverLabel] = useState(null);

  return (
    <aside
      className={`t-border-r shrink-0 flex flex-row lg:flex-col justify-between transition-all duration-150 ${
        collapsed ? 'lg:w-12' : 'lg:w-48'
      }`}
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      {/* Primary Navigation */}
      <div className="p-1.5 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible flex-1">
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              onMouseEnter={() => setHoverLabel(item.id)}
              onMouseLeave={() => setHoverLabel(null)}
              title={item.tip}
              className={`nav-item relative px-2.5 py-2 text-xs flex items-center gap-2.5 shrink-0 cursor-pointer ${
                active ? 'active' : ''
              } ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate font-medium">{item.label}</span>}
              {collapsed && hoverLabel === item.id && (
                <span className="hidden lg:block absolute left-12 z-50 px-2 py-1 text-[11px] font-mono rounded t-surface whitespace-nowrap shadow-lg pointer-events-none">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}

        <button
          onClick={onToggleAssistant}
          title="AI Assistant Panel"
          className={`nav-item px-2.5 py-2 text-xs flex items-center gap-2.5 shrink-0 cursor-pointer ${
            assistantOpen ? 'active' : ''
          } ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
        >
          <Sparkles className="w-4 h-4 shrink-0 text-indigo-400" />
          {!collapsed && <span className="truncate font-medium">AI Assistant</span>}
        </button>
      </div>

      {/* Secondary Navigation + Collapse */}
      <div className="p-1.5 hidden lg:flex flex-col gap-1 t-border-t">
        {SECONDARY_NAV.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              title={item.tip}
              className={`nav-item px-2.5 py-2 text-xs flex items-center gap-2.5 cursor-pointer ${
                active ? 'active' : ''
              } ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate font-medium">{item.label}</span>}
            </button>
          );
        })}

        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className={`nav-item px-2.5 py-1.5 text-xs flex items-center gap-2.5 cursor-pointer ${
            collapsed ? 'justify-center px-0' : ''
          }`}
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4 shrink-0" /> : <PanelLeftClose className="w-4 h-4 shrink-0" />}
          {!collapsed && <span className="text-[11px] opacity-80">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
