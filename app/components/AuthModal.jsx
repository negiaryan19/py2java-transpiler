'use client';

import React from 'react';
import { Lock, ShieldCheck, X, AlertCircle, Mail } from 'lucide-react';

export default function AuthModal({
  open,
  onClose,
  oauthConfigured = true,
  returnTo = '/',
  reason = '',
}) {
  if (!open) return null;

  const loginHref = `/login?returnTo=${encodeURIComponent(returnTo)}`;
  const googleHref = `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="t-surface w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between t-border-b pb-3">
          <h3 className="font-bold text-sm heading-font flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-500" />
            <span>Sign in to J-Forge</span>
          </h3>
          <button
            onClick={onClose}
            className="text-sm font-mono px-2 py-0.5 t-subtle cursor-pointer"
            aria-label="Close sign in dialog"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          {reason && (
            <div className="p-2.5 rounded border border-amber-500/30 bg-amber-500/10 font-mono text-[11px] flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span>{reason}</span>
            </div>
          )}

          <p style={{ color: 'var(--text-secondary)' }}>
            Sign in or create your J-Forge account to run live Gemini 2.5 Flash compilation,
            AI diagnostics, AST Diff, and Webhook dispatches with per-user quota protection.
          </p>

          <div className="p-3 t-subtle space-y-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 font-mono font-semibold text-emerald-600">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Secure PBKDF2-SHA512 + HttpOnly Session</span>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Passwords are hashed with 120k-iteration PBKDF2-SHA512. Session uses an HMAC-SHA256
              signed <code className="font-mono">HttpOnly</code> cookie. No secrets reach browser JS.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-3 t-border-t">
          <a
            href={loginHref}
            className="t-btn-primary px-4 py-2.5 text-xs font-mono flex items-center justify-center gap-2 cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Sign In or Create Account (Email)</span>
          </a>
          {oauthConfigured && (
            <a
              href={googleHref}
              className="t-btn-secondary px-4 py-2 text-xs font-mono flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
                />
              </svg>
              <span>Continue with Google (Gmail)</span>
            </a>
          )}
          <button
            onClick={onClose}
            className="t-btn-secondary px-3 py-2 text-xs font-mono cursor-pointer"
          >
            Continue Browsing
          </button>
        </div>
      </div>
    </div>
  );
}
