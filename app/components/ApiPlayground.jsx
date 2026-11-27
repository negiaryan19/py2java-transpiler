'use client';

import React from 'react';
import {
  Send,
  Server,
  Play,
  Loader2,
} from 'lucide-react';

export default function ApiPlayground({
  pgApiKey,
  setPgApiKey,
  pgRequestBody,
  setPgRequestBody,
  pgStatusBadge,
  pgResponseLatency,
  pgResponseHeaders = {},
  pgResponseBody,
  isPgLoading,
  onExecuteRequest,
  onLoadScenario,
  generatedCurl,
  copyToClipboard,
  copiedId,
}) {
  const handleJsonKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const { selectionStart, selectionEnd, value } = textarea;
      const nextVal = value.substring(0, selectionStart) + '  ' + value.substring(selectionEnd);
      setPgRequestBody(nextVal);
      requestAnimationFrame(() => {
        if (textarea) {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
        }
      });
    }
  };

  return (
    <section className="space-y-4">
      {/* Header Banner */}
      <div className="t-surface p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-mono font-bold bg-emerald-500/15 text-emerald-600 rounded border border-emerald-500/30">
              POST
            </span>
            <code className="font-mono text-sm font-bold">/api/v1/convert</code>
            <span className="text-xs px-2 py-0.5 t-subtle font-mono">Requirement #4 & #6</span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Interactive REST API tester. Test authenticated requests (<code className="font-mono">200 OK</code>), invalid API keys (<code className="font-mono">401 Unauthorized</code>), and malformed payloads (<code className="font-mono">400 Bad Request</code>).
          </p>
        </div>

        {/* Quick Test Scenario Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onLoadScenario('valid')}
            className="t-btn-secondary px-3 py-1.5 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Scenario: 200 OK</span>
          </button>
          <button
            onClick={() => onLoadScenario('unauthorized')}
            className="t-btn-secondary px-3 py-1.5 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Scenario: 401 Invalid Key</span>
          </button>
          <button
            onClick={() => onLoadScenario('badrequest')}
            className="t-btn-secondary px-3 py-1.5 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Scenario: 400 Empty Code</span>
          </button>
          <button
            onClick={() => onLoadScenario('cachehit')}
            className="t-btn-secondary px-3 py-1.5 text-xs font-mono flex items-center gap-1.5 cursor-pointer text-emerald-600 dark:text-emerald-400 font-bold"
            title="Execute identical request to test Sub-5ms Semantic AST Cache Hit"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Scenario: ⚡ AST Cache Hit</span>
          </button>
          <button
            onClick={() => onLoadScenario('selfhealing')}
            className="t-btn-secondary px-3 py-1.5 text-xs font-mono flex items-center gap-1.5 cursor-pointer text-purple-600 dark:text-purple-400 font-bold"
            title="Test Autonomous Compiler Verification & Self-Correction Pipeline"
          >
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span>Scenario: 🛡️ Self-Healing</span>
          </button>
        </div>
      </div>

      {/* Request Builder & Response Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 6 Cols: HTTP Request Builder */}
        <div className="lg:col-span-6 t-surface p-4 space-y-4 flex flex-col">
          <div className="flex items-center justify-between t-border-b pb-3">
            <h3 className="font-bold text-sm heading-font flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-500" />
              <span>HTTP Request Builder</span>
            </h3>
            <button
              onClick={onExecuteRequest}
              disabled={isPgLoading}
              className="t-btn-primary px-4 py-1.5 text-xs font-mono flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPgLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>Send HTTP Request</span>
            </button>
          </div>

          {/* Headers Configuration */}
          <div className="space-y-2.5 font-mono text-xs">
            <label
              className="block font-semibold text-[11px] uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              Request Headers
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
              <div className="px-3 py-2 t-subtle font-semibold">x-api-key</div>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={pgApiKey}
                  onChange={(e) => setPgApiKey(e.target.value)}
                  className="w-full px-3 py-2 t-surface font-mono text-xs focus:outline-none"
                  placeholder="Enter x-api-key header..."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
              <div className="px-3 py-2 t-subtle font-semibold">Content-Type</div>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value="application/json"
                  readOnly
                  className="w-full px-3 py-2 t-subtle font-mono text-xs opacity-75"
                />
              </div>
            </div>
          </div>

          {/* JSON Request Body */}
          <div className="flex-1 flex flex-col space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <label
                className="font-semibold text-[11px] uppercase tracking-wider"
                style={{ color: 'var(--text-secondary)' }}
              >
                JSON Request Body
              </label>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                application/json
              </span>
            </div>
            <textarea
              rows={10}
              value={pgRequestBody}
              onChange={(e) => setPgRequestBody(e.target.value)}
              onKeyDown={handleJsonKeyDown}
              spellCheck={false}
              className="editor-area w-full flex-1 p-3 t-surface font-mono text-xs focus:outline-none"
            />
          </div>

          {/* Auto-Generated cURL Snippet */}
          <div className="space-y-1.5 pt-2 t-border-t">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Generated cURL Command
              </span>
              <button
                onClick={() => copyToClipboard(generatedCurl, 'curl', 'cURL command copied')}
                className="underline cursor-pointer"
              >
                {copiedId === 'curl' ? 'Copied!' : 'Copy cURL'}
              </button>
            </div>
            <pre className="p-2.5 t-subtle font-mono text-[11px] overflow-x-auto leading-relaxed">
              {generatedCurl}
            </pre>
          </div>
        </div>

        {/* Right 6 Cols: HTTP Response Inspector */}
        <div className="lg:col-span-6 t-surface p-4 space-y-4 flex flex-col">
          <div className="flex items-center justify-between t-border-b pb-3">
            <h3 className="font-bold text-sm heading-font flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-500" />
              <span>HTTP Response Inspector</span>
            </h3>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span
                className={`px-2.5 py-0.5 rounded font-bold ${
                  pgStatusBadge.color === 'emerald'
                    ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                    : pgStatusBadge.color === 'rose'
                    ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                    : 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                }`}
              >
                {pgStatusBadge.text}
              </span>
              <span className="px-2 py-0.5 t-subtle text-[11px]">{pgResponseLatency} ms</span>
            </div>
          </div>

          {/* Response Headers */}
          <div className="space-y-1.5 font-mono text-xs">
            <label
              className="block font-semibold text-[11px] uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              Response Headers
            </label>
            <div className="p-2.5 t-subtle text-[11px] space-y-1">
              {Object.entries(pgResponseHeaders).length > 0 ? (
                Object.entries(pgResponseHeaders).map(([key, value]) => (
                  <div key={key}>
                    <span className="opacity-60">{key}:</span> {value}
                  </div>
                ))
              ) : (
                <div className="opacity-60">Send a request to inspect live HTTP response headers</div>
              )}
            </div>
          </div>

          {/* Formatted JSON Response Body */}
          <div className="flex-1 flex flex-col space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <label
                className="font-semibold text-[11px] uppercase tracking-wider"
                style={{ color: 'var(--text-secondary)' }}
              >
                JSON Response Body
              </label>
              <button
                onClick={() => copyToClipboard(pgResponseBody, 'resp', 'Response JSON copied')}
                className="text-[11px] underline cursor-pointer"
              >
                {copiedId === 'resp' ? 'Copied!' : 'Copy JSON'}
              </button>
            </div>
            <textarea
              readOnly
              rows={14}
              value={pgResponseBody}
              spellCheck={false}
              className="editor-area-java w-full flex-1 p-3 t-surface font-mono text-xs focus:outline-none"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
