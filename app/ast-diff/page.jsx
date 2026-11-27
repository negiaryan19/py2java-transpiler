'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, LogIn, LogOut } from 'lucide-react';
import CodeComparisonView from '../components/CodeComparisonView';

const DEFAULT_PY = `numbers = [1, 2, 3, 4, 5, 6]
squares = [x**2 for x in numbers if x % 2 == 0]
print(squares)`;

const DEFAULT_JAVA = `package com.jforge.ciap;

import java.util.*;

public class Solution {
    public static void main(String[] args) {
        List<Integer> numbers = new ArrayList<>(List.of(1, 2, 3, 4, 5, 6));
        List<Integer> squares = numbers.stream().filter(x -> x % 2 == 0).map(x -> (int) Math.pow(x, 2)).toList();
        System.out.println(squares);
    }
}`;

export default function CodeComparisonPage() {
  const [pythonCode, setPythonCode] = useState(DEFAULT_PY);
  const [authUser, setAuthUser] = useState(null);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    let active = true;
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((res) => res.json())
      .then((sess) => {
        if (!active) return;
        try {
          const savedTheme = localStorage.getItem('jforge_theme');
          if (savedTheme && ['dark', 'light'].includes(savedTheme)) {
            setTheme(savedTheme);
          }
        } catch {
          // Ignore storage errors
        }
        setAuthUser(sess?.authenticated ? sess.user : null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthUser(null);
  };

  return (
    <main
      data-theme={theme}
      className="min-h-screen flex flex-col font-sans"
      style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}
    >
      <header
        className="h-14 px-4 lg:px-6 t-border-b flex items-center justify-between sticky top-0 z-40"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <div className="flex items-center gap-3">
          <Link href="/" className="t-btn-secondary px-2.5 py-1.5 text-xs font-mono flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center font-mono font-bold text-sm t-btn-primary">
              JF
            </div>
            <span className="font-bold tracking-tight text-sm sm:text-base heading-font">J-Forge</span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          {authUser ? (
            <button onClick={handleLogout} className="t-btn-secondary px-2.5 py-1.5 text-xs flex items-center gap-1 cursor-pointer">
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <a href="/login?returnTo=/ast-diff" className="t-btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5">
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </a>
          )}
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        <CodeComparisonView pythonCode={pythonCode} javaCode={DEFAULT_JAVA} onEditPython={setPythonCode} />
      </div>
    </main>
  );
}
