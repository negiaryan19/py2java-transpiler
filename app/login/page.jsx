'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, Building2, GraduationCap, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

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
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [returnTo, setReturnTo] = useState('/');
  const [dbConfigured, setDbConfigured] = useState(true);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSent, setResetSent] = useState(false);

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

  // Check session + read safe returnTo on mount
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const nextPath = sanitizeReturnPath(params.get('returnTo') || '/');
    const authErr = params.get('auth_error');

    fetch('/api/auth/session', { cache: 'no-store' })
      .then((r) => r.json())
      .then((s) => {
        if (!active) return;
        setReturnTo(nextPath);
        if (authErr) {
          setError(`Sign-in did not complete (${authErr}).`);
        }
        setDbConfigured(s?.dbConfigured !== false);
        if (s?.authenticated) {
          router.replace(nextPath);
        }
      })
      .catch(() => {
        if (!active) return;
        setReturnTo(nextPath);
        if (authErr) {
          setError(`Sign-in did not complete (${authErr}).`);
        }
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
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(
        mode === 'register'
          ? `Welcome to J-Forge, ${data.user?.name || 'User'}! Redirecting...`
          : `Welcome back, ${data.user?.name || 'User'}! Redirecting...`
      );

      setTimeout(() => {
        router.replace(returnTo);
        router.refresh();
      }, 650);
    } catch {
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans">
      {/* Back to J-Forge */}
      <div className="w-full max-w-md mb-6">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to J-Forge Studio</span>
        </Link>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md border border-slate-800 bg-slate-900/80 backdrop-blur-md rounded-xl p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 mb-2">
            <Lock className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            {mode === 'register' ? 'Create Account' : 'Sign In'}
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            {mode === 'register'
              ? 'Create your J-Forge account to access live AI transpilation'
              : 'Sign in to access live Gemini AI transpilation, AST Diff & Webhooks'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border border-slate-800 rounded-lg overflow-hidden">
          <button
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 text-xs font-mono font-semibold transition-colors cursor-pointer ${
              mode === 'login'
                ? 'bg-emerald-500/15 text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 text-xs font-mono font-semibold transition-colors cursor-pointer ${
              mode === 'register'
                ? 'bg-sky-500/15 text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {!dbConfigured && (
          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs font-mono flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>Database connection (`DATABASE_URL`) is not configured yet in this environment.</span>
          </div>
        )}

        {/* Error / Success Messages */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Name (register only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aryan Negi"
                  required
                  maxLength={120}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-800 bg-slate-950 font-mono text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 placeholder:text-slate-600"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
              Email Address <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@gmail.com"
                required
                maxLength={254}
                autoComplete="email"
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-800 bg-slate-950 font-mono text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
              Password <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Min 6 characters' : '••••••••'}
                required
                minLength={6}
                maxLength={128}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-800 bg-slate-950 font-mono text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {mode === 'login' && (
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setForgotOpen((v) => !v);
                    setError('');
                    setSuccess('');
                  }}
                  className="text-[11px] font-mono text-sky-400 hover:text-sky-300 cursor-pointer"
                >
                  {forgotOpen ? 'Back to Sign In' : 'Forgot password?'}
                </button>
              </div>
            )}
          </div>

          {/* Organization & Role (register only) */}
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                  Organization
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Chandigarh Univ."
                    maxLength={120}
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-800 bg-slate-950 font-mono text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 placeholder:text-slate-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                  Role
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-800 bg-slate-950 font-mono text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 appearance-none cursor-pointer"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="developer">Developer</option>
                    <option value="researcher">Researcher</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{mode === 'register' ? 'Creating Account...' : 'Signing In...'}</span>
              </>
            ) : (
              <span>{mode === 'register' ? 'Create Account & Sign In' : 'Sign In to J-Forge'}</span>
            )}
          </button>
        </form>

        {forgotOpen && (
          <form onSubmit={handleForgotSubmit} className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/70 space-y-3">
            <p className="text-xs font-mono font-semibold text-slate-200">
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 font-mono text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 8 chars)"
                  required
                  minLength={8}
                  maxLength={128}
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 font-mono text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </>
            )}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono font-bold text-xs cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Please wait...' : resetSent ? 'Update Password' : 'Send Reset Code to Email'}
            </button>
          </form>
        )}

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-500 font-mono">
          J-Forge • Secure Email Authentication
        </p>
      </div>
    </main>
  );
}
