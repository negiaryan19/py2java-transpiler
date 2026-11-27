'use client';

import React from 'react';

export default function BrandMark({ size = 'md', showWordmark = true, showV2 = true }) {
  const dim = size === 'lg' ? 'w-9 h-9' : size === 'sm' ? 'w-6 h-6' : 'w-7 h-7';
  const textSz = size === 'lg' ? 'text-lg' : 'text-sm';

  return (
    <span className="inline-flex items-center gap-2 select-none">
      {/* Forge Anvil + Spark Emblem matching Image 1 & 2 */}
      <span
        className={`${dim} rounded-lg flex items-center justify-center shrink-0 border border-orange-500/30`}
        style={{ backgroundColor: 'rgba(249, 115, 22, 0.12)' }}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
          <path fill="#38BDF8" d="M12 2.5 13.3 5.2 16 6.5 13.3 7.8 12 10.5 10.7 7.8 8 6.5 10.7 5.2Z" />
          <path
            fill="#F97316"
            d="M3.5 11.5h15.5l1.8-1.5v3.2c0 .9-.7 1.7-1.6 1.8l-3.4.5.9 2.5H19v2H5v-2h2.3l.9-2.5H6.5c-1.7 0-3-1.4-3-3v-1Z"
          />
        </svg>
      </span>
      {showWordmark && (
        <span className="inline-flex items-center gap-1.5">
          <span className={`font-bold tracking-tight ${textSz} heading-font`}>J-FORGE</span>
          {showV2 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded t-subtle font-semibold opacity-85">
              V2
            </span>
          )}
        </span>
      )}
    </span>
  );
}
