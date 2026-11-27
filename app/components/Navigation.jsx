'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Sparkles,
  ShieldCheck,
  BarChart3,
  FolderKanban,
  FolderCode,
  GitCompare,
  FlaskConical,
  Settings,
  Terminal,
  Search,
  Sun,
  Moon,
  LogIn,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  GraduationCap,
} from 'lucide-react';
import BrandMark from './BrandMark';

export default function Navigation({
  theme = 'dark',
  onToggleTheme = () => {},
  onOpenHome = () => {},
  onOpenCommandPalette = () => {},
  onOpenSettings = () => {},
  onOpenVerification = () => {},
  verificationReport = null,
  authUser = null,
  onLogout = () => {},
}) {
  return (
    <header
      className="h-12 px-3 sm:px-4 t-border-b flex items-center justify-between sticky top-0 z-30 shrink-0 backdrop-blur-md"
      style={{ backgroundColor: 'color-mix(in srgb, var(--bg-surface) 92%, transparent)' }}
    >
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenHome}
          className="flex items-center cursor-pointer hover:opacity-90 transition shrink-0"
          title="J-Forge V2 Home"
        >
          <BrandMark size="md" showV2 />
        </button>
        <span className="hidden md:inline text-xs font-mono truncate pl-3 t-border-l" style={{ color: 'var(--text-secondary)' }}>
          Dual-Pane Code Migration &amp; Verification Workspace
        </span>
      </div>

      {/* Right: Utility Controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenCommandPalette}
          className="t-btn-secondary px-2.5 py-1 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
          title="Command Palette (Cmd/Ctrl + K)"
          aria-label="Command Palette"
        >
          <Search className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
          <span className="hidden md:inline text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            Commands
          </span>
          <kbd className="hidden lg:inline text-[10px] px-1 rounded opacity-70 t-subtle">⌘K</kbd>
        </button>

        <button
          onClick={onOpenVerification}
          className="relative p-1.5 t-btn-secondary cursor-pointer hidden sm:flex items-center justify-center"
          title={verificationReport ? `Verification: ${verificationReport.status}` : 'Verification Studio'}
          aria-label="Verification Status"
        >
          <Bell className="w-3.5 h-3.5" />
          {verificationReport && (
            <span
              className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                verificationReport.outputMatch ? 'bg-emerald-400' : 'bg-orange-400'
              }`}
            />
          )}
        </button>

        <a
          href="https://github.com/negiaryan19/py2java-transpiler"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 t-btn-secondary cursor-pointer hidden sm:flex items-center justify-center"
          title="J-Forge on GitHub"
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
          aria-label="Toggle Theme"
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
              style={{ backgroundImage: 'linear-gradient(135deg, var(--primary-bg), var(--primary-hover))' }}
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
            className="t-btn-primary px-3 py-1 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
          >
            <LogIn className="w-3 h-3" />
            <span>Sign In</span>
          </a>
        )}
      </div>
    </header>
  );
}

const WORKSPACE_NAV = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, tip: 'Project Migration Dashboard' },
  { id: 'studio', label: 'Converter', icon: ArrowLeftRight, tip: 'Dual-Pane Code Migration' },
  { id: 'files', label: 'Projects', icon: FolderCode, tip: 'Workspace Buffers' },
  { id: 'verification', label: 'Verification', icon: ShieldCheck, tip: 'Semantic Verification Engine' },
  { id: 'tests', label: 'Unit Tests', icon: FlaskConical, tip: 'JUnit 5 Generator' },
  { id: 'comparison', label: 'AST Explorer', icon: GitCompare, tip: 'AST Diff & Mapping' },
  { id: 'analysis', label: 'Code Analysis', icon: BarChart3, tip: 'Compatibility & Quality' },
  { id: 'history', label: 'History', icon: FolderKanban, tip: 'Saved History & Versions' },
];

const INTELLIGENCE_NAV = [
  { id: 'assistant', label: 'AI Assistant', icon: Sparkles, tip: 'Context-Aware AI Assistant' },
  { id: 'learning', label: 'Learning Studio', icon: GraduationCap, tip: 'Python-to-Java Concept Guide & Practice' },
];

const DEVELOPER_NAV = [
  { id: 'playground', label: 'API Gateway', icon: Terminal, tip: 'REST API & Webhooks' },
  { id: 'settings', label: 'Settings', icon: Settings, tip: 'Appearance & Defaults' },
];

export function SidebarRail({
  activeView,
  setActiveView,
  collapsed = false,
  onToggleCollapse = () => {},
}) {
  const [hoverLabel, setHoverLabel] = useState(null);

  const renderGroup = (items) =>
    items.map((item) => {
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
            <span className="hidden lg:block absolute left-14 z-50 px-2.5 py-1 text-[11px] font-mono rounded t-surface whitespace-nowrap shadow-xl pointer-events-none">
              {item.label}
            </span>
          )}
        </button>
      );
    });

  return (
    <aside
      className={`t-border-r shrink-0 flex flex-row lg:flex-col justify-between transition-all duration-150 ${
        collapsed ? 'lg:w-14' : 'lg:w-52'
      }`}
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      <div className="p-2 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible flex-1">
        <div className="flex lg:flex-col gap-1">
          {!collapsed && (
            <div className="px-2.5 pb-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider opacity-50 hidden lg:block">
              Workspace
            </div>
          )}
          {renderGroup(WORKSPACE_NAV)}
        </div>

        <div className="flex lg:flex-col gap-1">
          {!collapsed && (
            <div className="px-2.5 pb-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider opacity-50 hidden lg:block">
              Intelligence
            </div>
          )}
          {renderGroup(INTELLIGENCE_NAV)}
        </div>
      </div>

      {/* Bottom Developer / Account Group & Collapse Toggle */}
      <div className="p-2 hidden lg:flex flex-col gap-1 t-border-t">
        {!collapsed && (
          <div className="px-2.5 pb-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider opacity-50">
            Developer
          </div>
        )}
        {renderGroup(DEVELOPER_NAV)}

        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className={`nav-item px-2.5 py-1.5 text-xs flex items-center gap-2.5 cursor-pointer ${
            collapsed ? 'justify-center px-0' : ''
          }`}
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4 shrink-0" /> : <PanelLeftClose className="w-4 h-4 shrink-0" />}
          {!collapsed && <span className="text-[11px] opacity-75">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
