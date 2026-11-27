'use client';

import React, { useState } from 'react';
import { Sparkles, Send, Loader2, X, Check, RotateCcw } from 'lucide-react';

export default function AssistantPanel({
  open = false,
  onClose = () => {},
  pythonCode = '',
  javaCode = '',
  selectedPython = '',
  javaVersion = 'Java 21 LTS',
  compilerError = '',
  verificationReport = null,
  compatibilityReport = null,
  onApplyJavaEdit = () => {},
  canUndoJava = false,
  onUndoJava = () => {},
}) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [pendingJavaPreview, setPendingJavaPreview] = useState(null);

  if (!open) return null;

  const runActionOrQuestion = async ({ action = 'assistant', promptText = '' }) => {
    if (loading) return;
    if (!pythonCode.trim()) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Add or paste Python code in the editor first so I can analyze your workspace context.' },
      ]);
      return;
    }

    const displayUser = promptText || (action === 'fix-errors' ? 'Fix compiler/runtime issues' : action);
    setMessages((prev) => [...prev, { role: 'user', text: displayUser }]);
    setLoading(true);
    setPendingJavaPreview(null);

    try {
      const res = await fetch('/api/v1/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          python_code: pythonCode,
          java_code: javaCode || '// empty',
          selected_code: selectedPython || '',
          question: promptText,
          compiler_error: compilerError || verificationReport?.java?.compilerError || '',
          verification_report: verificationReport,
          compatibility_report: compatibilityReport,
          java_version: javaVersion.replace(/[^0-9]/g, '') || '21',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setMessages((prev) => [...prev, { role: 'assistant', text: data?.error || 'Request failed.' }]);
      } else if (data.explanation) {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.explanation, mode: data.mode }]);
      } else if (data.javaCode) {
        setPendingJavaPreview({ action, code: data.javaCode });
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: `Generated a Java patch for '${action}'. Preview and Apply below or Reject.` },
        ]);
      } else if (data.testCode) {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.testCode, mode: data.mode }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Unable to reach intelligence endpoint.' }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    ...(compilerError || verificationReport?.java?.compilerError
      ? [{ label: 'Explain/Fix javac error', action: 'fix-errors', text: 'Fix this Java compilation error while preserving Python behavior' }]
      : []),
    ...(selectedPython.trim()
      ? [{ label: 'Explain selection', action: 'explain-selection', text: 'Explain the highlighted Python selection and Java mapping' }]
      : []),
    { label: 'Preserve Python behavior', action: 'diff-explain', text: 'Check semantic differences (division, types, collections)' },
    { label: 'Why these Java types?', action: 'assistant', text: 'Why were these Java variable/collection types chosen for my code?' },
    { label: 'Optimize Java', action: 'optimize', text: 'Optimize generated Java without changing behavior' },
    { label: 'Find potential bugs', action: 'find-bugs', text: 'Inspect for nullability, overflow, or edge-case bugs' },
  ];

  return (
    <aside
      className="w-full lg:w-88 t-border-l flex flex-col shrink-0 h-full max-h-[calc(100vh-3rem)]"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      {/* Header */}
      <div className="px-3.5 py-2.5 t-border-b flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          {canUndoJava && (
            <button
              onClick={onUndoJava}
              className="t-btn-secondary px-2 py-0.5 text-[11px] flex items-center gap-1 cursor-pointer"
              title="Undo last Java edit"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Undo</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 opacity-70 hover:opacity-100 cursor-pointer"
            aria-label="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Context Summary */}
      <div className="px-3.5 py-2 t-border-b text-[11px] font-mono space-y-0.5" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
        <div className="flex items-center justify-between">
          <span>Context Attached:</span>
          <span className="opacity-85">Py {pythonCode ? pythonCode.split('\n').length : 0}L · Java {javaCode ? javaCode.split('\n').length : 0}L</span>
        </div>
        {selectedPython.trim() && (
          <div className="text-indigo-400 truncate">Selection: {selectedPython.split('\n')[0]}</div>
        )}
        {(compilerError || verificationReport?.java?.compilerError) && (
          <div className="text-rose-400 truncate">Compiler diagnostic active</div>
        )}
      </div>

      {/* Suggested Contextual Actions */}
      <div className="px-3 py-2 t-border-b flex flex-wrap gap-1.5">
        {quickPrompts.map((q) => (
          <button
            key={q.label}
            disabled={loading}
            onClick={() => runActionOrQuestion({ action: q.action, promptText: q.text })}
            className="t-btn-secondary px-2 py-1 text-[11px] cursor-pointer disabled:opacity-50"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Pending Patch Preview (Apply / Reject) */}
      {pendingJavaPreview && (
        <div className="m-2.5 p-2.5 rounded t-subtle border border-indigo-500/40 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-indigo-400">
            <span>Preview Proposed Java Change</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  onApplyJavaEdit(pendingJavaPreview.code);
                  setPendingJavaPreview(null);
                }}
                className="t-btn-primary px-2 py-0.5 text-[10px] flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>Apply</span>
              </button>
              <button
                onClick={() => setPendingJavaPreview(null)}
                className="t-btn-secondary px-2 py-0.5 text-[10px] cursor-pointer"
              >
                Reject
              </button>
            </div>
          </div>
          <pre className="text-[11px] font-mono max-h-36 overflow-auto whitespace-pre-wrap p-2 rounded" style={{ backgroundColor: 'var(--bg-editor)' }}>
            {pendingJavaPreview.code}
          </pre>
        </div>
      )}

      {/* Conversation Transcript */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
        {messages.length === 0 ? (
          <div className="text-[11px] leading-relaxed opacity-75 space-y-1.5 pt-2">
            <p className="font-medium">Workspace-Scoped Assistant</p>
            <p>Ask questions about Python-to-Java types, compiler errors, optimization, edge cases, or JUnit test coverage.</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`p-2.5 rounded-md ${
                m.role === 'user'
                  ? 'ml-4 t-subtle font-medium'
                  : 'mr-2 t-surface'
              }`}
            >
              <div className="text-[10px] font-mono uppercase opacity-60 mb-1">
                {m.role === 'user' ? 'You' : `J-Forge (${m.mode || 'workspace'})`}
              </div>
              <pre className="whitespace-pre-wrap font-sans leading-relaxed text-xs">{m.text}</pre>
            </div>
          ))
        )}
        {loading && (
          <div className="flex items-center gap-2 text-[11px] opacity-75 py-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>Analyzing workspace context...</span>
          </div>
        )}
      </div>

      {/* Prompt Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = question.trim();
          if (!trimmed) return;
          setQuestion('');
          runActionOrQuestion({ action: 'assistant', promptText: trimmed });
        }}
        className="p-2.5 t-border-t flex items-center gap-1.5"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about your code, types, errors..."
          className="flex-1 px-2.5 py-1.5 text-xs t-subtle focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="t-btn-primary p-1.5 cursor-pointer disabled:opacity-50"
          aria-label="Send prompt"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </aside>
  );
}
