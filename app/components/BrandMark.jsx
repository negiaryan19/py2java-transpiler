'use client';

import React from 'react';

export default function BrandMark({ size = 'md', showWordmark = true, subtitle = '' }) {
  const dim = size === 'lg' ? 'w-9 h-9' : size === 'sm' ? 'w-6 h-6' : 'w-7 h-7';
  const textSz = size === 'lg' ? 'text-lg' : 'text-sm';

  return (
    <span className="inline-flex items-center gap-2 select-none">
      <span
        className={`${dim} rounded-lg flex items-center justify-center shrink-0 border border-white/15`}
        style={{
          backgroundImage: 'linear-gradient(135deg, var(--primary-bg), var(--primary-hover))',
          boxShadow: '0 2px 12px var(--primary-glow)',
        }}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" aria-hidden="true">
          <path d="M9.2 4.5 5.4 18.8a1.2 1.2 0 0 0 2.3.6L11.5 5.1a1.2 1.2 0 0 0-2.3-.6Zm6.6 0-3.8 14.3a1.2 1.2 0 0 0 2.3.6l3.8-14.3a1.2 1.2 0 0 0-2.3-.6Z" />
        </svg>
      </span>
      {showWordmark && (
        <span className="inline-flex items-baseline gap-1.5">
          <span className={`font-bold tracking-tight ${textSz} heading-font`}>J-Forge</span>
          {subtitle && (
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              {subtitle}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
