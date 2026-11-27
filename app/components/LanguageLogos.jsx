'use client';

import React from 'react';

export function PythonLogo({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 256 255" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="pyBlue" x1="12.9%" y1="12%" x2="79.6%" y2="78%">
          <stop offset="0%" stopColor="#387EB8" />
          <stop offset="100%" stopColor="#366994" />
        </linearGradient>
        <linearGradient id="pyYellow" x1="19.1%" y1="20.6%" x2="90.7%" y2="88.4%">
          <stop offset="0%" stopColor="#FFE052" />
          <stop offset="100%" stopColor="#FFC331" />
        </linearGradient>
      </defs>
      <path
        fill="url(#pyBlue)"
        d="M126.9 0C62.1 0 66.1 28.1 66.1 28.1l.1 29.1h61.8v8.7H41.6S0 61.2 0 126.8c0 65.5 36.3 63.2 36.3 63.2h21.7v-30.4s-1.2-36.3 35.7-36.3h61.4s34.5.6 34.5-33.4V34.1S194.8 0 126.9 0Zm-34.1 19.6c6.1 0 11 4.9 11 11s-4.9 11-11 11-11-4.9-11-11 4.9-11 11-11Z"
      />
      <path
        fill="url(#pyYellow)"
        d="M128.8 254.1c64.8 0 60.8-28.1 60.8-28.1l-.1-29.1h-61.8v-8.7h86.4s41.6 4.7 41.6-60.9c0-65.5-36.3-63.2-36.3-63.2h-21.7v30.4s1.2 36.3-35.7 36.3h-61.4s-34.5-.6-34.5 33.4v55.8s-5.2 34.1 62.7 34.1Zm34.1-19.6c-6.1 0-11-4.9-11-11s4.9-11 11-11 11 4.9 11 11-4.9 11-11 11Z"
      />
    </svg>
  );
}

export function JavaLogo({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {/* Steam wisps */}
      <path
        fill="#38BDF8"
        d="M12.5 2.2c.9 1.1-.4 2.1-.6 3-.2.8.4 1.4.9 2-1.1-.6-1.9-1.5-1.6-2.5.2-.9 1-1.6 1.3-2.5Zm2.8.8c.7.9-.3 1.7-.5 2.4-.1.6.3 1.1.7 1.6-.9-.5-1.5-1.2-1.3-2 .2-.7.8-1.3 1.1-2Z"
      />
      {/* Coffee cup & handle */}
      <path
        fill="#F97316"
        d="M6.5 9.2h9.8v4.3c0 2.5-2.2 4.5-4.9 4.5s-4.9-2-4.9-4.5V9.2Zm9.8 1h1.5c1.1 0 2 .9 2 2s-.9 2-2 2h-1.5v-1.2h1.3c.5 0 .9-.4.9-.8s-.4-.8-.9-.8h-1.3v-1.2Z"
      />
      {/* Cup saucer rings */}
      <path
        fill="#38BDF8"
        d="M4.5 19.2c4.4.8 9.2.8 13.8 0-.4.9-3.1 1.6-6.9 1.6s-6.5-.7-6.9-1.6Zm1.4 2c3.5.5 7.4.5 10.9 0-.7.7-2.8 1.1-5.4 1.1-2.7 0-4.8-.4-5.5-1.1Z"
      />
    </svg>
  );
}
