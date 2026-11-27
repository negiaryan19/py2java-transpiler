'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, X } from 'lucide-react';

export default function CommandPalette({
  open = false,
  onClose = () => {},
  commands = [],
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open]);

  if (!open) return null;

  const filtered = commands.filter((cmd) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return cmd.label.toLowerCase().includes(q) || (cmd.category || '').toLowerCase().includes(q);
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4"
      onClick={handleClose}
    >
      <div
        className="t-surface max-w-lg w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3.5 py-2.5 t-border-b flex items-center gap-2">
          <Search className="w-4 h-4 opacity-60 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or action (e.g., Convert, Export, Assistant, Dark)..."
            className="flex-1 bg-transparent text-xs font-mono focus:outline-none"
          />
          <button onClick={handleClose} className="p-1 opacity-60 hover:opacity-100 cursor-pointer" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-xs font-mono opacity-60">No matching commands.</div>
          ) : (
            filtered.map((cmd) => (
              <button
                key={cmd.id}
                disabled={cmd.disabled}
                onClick={() => {
                  handleClose();
                  cmd.run();
                }}
                className="w-full px-3 py-2 rounded text-left text-xs font-mono flex items-center justify-between gap-2 hover:bg-white/5 cursor-pointer disabled:opacity-40"
              >
                <span className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded t-subtle opacity-80">{cmd.category || 'Action'}</span>
                  <span className="font-medium">{cmd.label}</span>
                </span>
                <span className="flex items-center gap-2 opacity-60 text-[10px]">
                  {cmd.shortcut && <kbd className="px-1.5 py-0.5 rounded t-subtle">{cmd.shortcut}</kbd>}
                  <ArrowRight className="w-3 h-3" />
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
