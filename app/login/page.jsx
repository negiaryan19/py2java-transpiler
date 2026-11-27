'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  User,
  Building2,
  GraduationCap,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import BrandMark from '../components/BrandMark';

function sanitizeReturnPath(raw = '/') {
  if (typeof raw !== 'string') return '/';
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return '/';
  }
  return trimmed.length <= 200 ? trimmed : '/';
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('developer');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [returnTo, setReturnTo] = useState('/');
  const [dbConfigured, setDbConfigured] = useState(true);
  const [oauthConfigured, setOauthConfigured] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [accent, setAccent] = useState('violet');

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload = resetSent
        ? { action: 'reset', email: email.trim(), code: resetCode.trim(), newPassword }
        : { action: 'request', email: email.trim() };
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Password reset failed.');
      } else if (!resetSent) {
        setResetSent(true);
        setSuccess(data.message || 'Reset code sent! Check your email.');
      } else {
        setSuccess(data.message || 'Password updated! You can now sign in.');
        setForgotOpen(false);
        setResetSent(false);
        setResetCode('');
        setNewPassword('');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const nextPath = sanitizeReturnPath(params.get('returnTo') || '/');
    const authErr = params.get('auth_error');

    fetch('/api/auth/session', { cache: 'no-store' })
      .then((r) => r.json())
      .then((s) => {
        if (!active) return;
        try {
          const savedTheme = localStorage.getItem('jforge_theme');
          if (savedTheme && ['dark', 'light'].includes(savedTheme)) setTheme(savedTheme);
          const savedAccent = localStorage.getItem('jforge_accent');
          if (savedAccent && ['violet', 'emerald', 'sky', 'amber', 'rose'].includes(savedAccent)) {
            setAccent(savedAccent);
          }
        } catch {
          // Ignore storage errors
        }
        setReturnTo(nextPath);
        if (authErr) setError(`Sign-in did not complete (${authErr}).`);
        setDbConfigured(s?.dbConfigured !== false);
        setOauthConfigured(Boolean(s?.oauthConfigured));
        if (s?.authenticated) {
          router.replace(nextPath);
        }
      })
      .catch(() => {
        if (!active) return;
        setReturnTo(nextPath);
        if (authErr) setError(`Sign-in did not complete (${authErr}).`);
      });

    return () => {
      active = false;
    };
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const payload =
      mode === 'register'
        ? { email, password, name, organization, role }
        : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error || 'Authentication failed. Please check credentials.');
        setLoading(false);
        return;
      }

      setSuccess(
        mode === 'register'
          ? `Welcome to J-Forge, ${data.user?.name || 'Developer'}!`
          : `Welcome back, ${data.user?.name || 'Developer'}!`
      );

      setTimeout(() => {
        router.replace(returnTo);
        router.refresh();
      }, 500);
    } catch {
      setError('Network error. Please retry.');
      setLoading(false);
    }
  };

  return (
    <main
      data-theme={theme}
      data-accent={accent}
      className="min-h-screen cosmic-backdrop relative flex flex-col items-center justify-center p-4 overflow-hidden"
      style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}
    >
      {/* Top Back Link */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between relative z-10">
        <Link href="/" className="t-btn-secondary px-3 py-1.5 text-xs font-mono inline-flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Studio</span>
        </Link>
      </div>

      {/* Centered Cosmic Obsidian Auth Card matching Reference Screen */}
      <div className="w-full max-w-md t-surface p-6 sm:p-7 space-y-5 relative z-10 backdrop-blur-xl">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <BrandMark size="lg" />
          </div>
          <h1 className="text-xl font-bold tracking-tight heading-font">
            {mode === 'register' ? 'Create Account' : 'Welcome back!'}
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {mode === 'register'
              ? 'Create your workspace account to sync conversion history'
              : 'Sign in to continue your Python-to-Java workspace'}
          </p>
        </div>

        {/* Sign In / Create Account Pill Switcher */}
        <div className="flex p-1 t-subtle gap-1">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 text-xs font-mono rounded-md transition cursor-pointer ${
              mode === 'login' ? 't-btn-primary' : 'opacity-70 hover:opacity-100'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 text-xs font-mono rounded-md transition cursor-pointer ${
              mode === 'register' ? 't-btn-primary' : 'opacity-70 hover:opacity-100'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Real Google OAuth (Rendered only when GOOGLE_CLIENT_ID & SECRET are configured) */}
        {oauthConfigured && (
          <div className="space-y-3">
            <a
              href={`/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`}
              className="w-full py-2.5 t-btn-secondary font-mono text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z" />
                <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
              </svg>
              <span>Continue with Google</span>
            </a>
            <div className="flex items-center gap-2 text-[11px] opacity-50 font-mono">
              <div className="flex-1 t-border-t" />
              <span>or</span>
              <div className="flex-1 t-border-t" />
            </div>
          </div>
        )}

        {!dbConfigured && (
          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs font-mono flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>Database (`DATABASE_URL`) is not configured yet in this environment.</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-mono flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-mono flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-mono font-semibold mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Developer Name"
                  required
                  maxLength={120}
                  className="w-full pl-10 pr-3 py-2.5 t-subtle font-mono text-xs focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono font-semibold mb-1.5">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                required
                className="w-full pl-10 pr-3 py-2.5 t-subtle font-mono text-xs focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                maxLength={128}
                className="w-full pl-10 pr-10 py-2.5 t-subtle font-mono text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 cursor-pointer"
                aria-label="Toggle Password Visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {mode === 'login' && (
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={() => { setForgotOpen((v) => !v); setError(''); setSuccess(''); }}
                  className="text-[11px] font-mono text-indigo-400 hover:underline cursor-pointer"
                >
                  {forgotOpen ? 'Back to Sign In' : 'Forgot password?'}
                </button>
              </div>
            )}
          </div>

          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-semibold mb-1.5">Organization</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Organization"
                    maxLength={120}
                    className="w-full pl-10 pr-3 py-2.5 t-subtle font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono font-semibold mb-1.5">Role</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 t-subtle font-mono text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="developer">Developer</option>
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="researcher">Researcher</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 t-btn-primary font-mono text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{mode === 'register' ? 'Creating Account...' : 'Signing In...'}</span>
              </>
            ) : (
              <span>{mode === 'register' ? 'Create Account' : 'Sign In'}</span>
            )}
          </button>
        </form>

        {forgotOpen && (
          <form onSubmit={handleForgotSubmit} className="p-3.5 t-subtle space-y-3">
            <p className="text-xs font-mono font-semibold">
              {resetSent ? 'Enter 6-digit Reset Code & New Password' : 'Reset your password via email'}
            </p>
            {resetSent && (
              <>
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="6-digit code"
                  required
                  maxLength={6}
                  className="w-full px-3 py-2 t-surface font-mono text-xs focus:outline-none"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 8 chars)"
                  required
                  minLength={8}
                  maxLength={128}
                  className="w-full px-3 py-2 t-surface font-mono text-xs focus:outline-none"
                />
              </>
            )}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-2 t-btn-primary font-mono text-xs cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Please wait...' : resetSent ? 'Update Password' : 'Send Reset Code'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
