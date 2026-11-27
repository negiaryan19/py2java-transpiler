'use client';

import React from 'react';
import {
  FileDown,
  Copy,
  Check,
} from 'lucide-react';

export default function DocumentationView({
  onDownloadReadme,
  copyToClipboard,
  copiedId,
}) {
  const envContent = `# =========================================================
# BTIN337 GenAI Applications (CIA-P) Environment Variables
# Never commit .env.local to Git. Add to .gitignore!
# =========================================================

# 1. Google AI Studio Free-Tier API Key
GEMINI_API_KEY="AIzaSy_YOUR_GOOGLE_AI_STUDIO_KEY"

# 2. External Client Authentication Key (Header: x-api-key)
APP_API_KEY="REPLACE_WITH_YOUR_GENERATED_APP_API_KEY"

# 3. Webhook Signing Secret & Default Receiver
WEBHOOK_SECRET="REPLACE_WITH_YOUR_GENERATED_WEBHOOK_SECRET"
DEFAULT_WEBHOOK_URL="https://webhook.site/your-uuid"`;

  return (
    <section className="space-y-5">
      {/* Rubric Compliance Verification Cards */}
      <div className="t-surface p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 t-border-b pb-3">
          <div>
            <h2 className="font-bold text-base heading-font">
              BTIN337 GenAI Applications — CIA-P (20 Marks) Verification
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Complete checklist mapped directly to the School of Engineering and Technology specification.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onDownloadReadme}
              className="t-btn-primary px-3.5 py-1.5 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download README.md</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 t-subtle space-y-1">
            <div className="flex items-center justify-between font-mono font-bold">
              <span>1. App Development</span>
              <span className="text-emerald-600">READY</span>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Python 3 to Java LTS studio with semantic AST mapping, compatibility checks, and verification.
            </p>
          </div>

          <div className="p-3 t-subtle space-y-1">
            <div className="flex items-center justify-between font-mono font-bold">
              <span>2. Vercel Hosting</span>
              <span className="text-emerald-600">READY</span>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Zero-dependency static & serverless deployment compatible with Vercel edge/Node runtime.
            </p>
          </div>

          <div className="p-3 t-subtle space-y-1">
            <div className="flex items-center justify-between font-mono font-bold">
              <span>3. Direct Gemini API</span>
              <span className="text-emerald-600">READY</span>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Direct <code className="font-mono">gemini-2.5-flash</code> SDK calls via <code className="font-mono">@google/genai</code> + deterministic fallback.
            </p>
          </div>

          <div className="p-3 t-subtle space-y-1">
            <div className="flex items-center justify-between font-mono font-bold">
              <span>4. API Export & Auth</span>
              <span className="text-emerald-600">READY</span>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Exposes <code className="font-mono">POST /api/v1/convert</code> protected by <code className="font-mono">x-api-key</code> middleware.
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Spec: .env Generator & Endpoint Reference */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Secure .env Configuration Template */}
        <div className="t-surface p-4 space-y-3">
          <div className="flex items-center justify-between t-border-b pb-2.5">
            <div>
              <h3 className="font-bold text-sm heading-font">Secure .env Template (Zero Hardcoded Keys)</h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Required before pushing to <code className="font-mono">kamathn-blr/GenAI-CIAP-2025Batch.git</code>
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(envContent, 'env', '.env configuration copied')}
              className="t-btn-secondary px-2.5 py-1 text-xs font-mono flex items-center gap-1 cursor-pointer"
            >
              {copiedId === 'env' ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span>{copiedId === 'env' ? 'Copied!' : 'Copy .env'}</span>
            </button>
          </div>
          <pre className="p-3.5 t-subtle font-mono text-xs overflow-x-auto leading-relaxed">
            {envContent}
          </pre>
        </div>

        {/* Right: HTTP Status Code Contract */}
        <div className="t-surface p-4 space-y-3">
          <div className="t-border-b pb-2.5">
            <h3 className="font-bold text-sm heading-font">Standard HTTP Status Code Contract</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Implemented across the API Gateway & Webhook Dispatcher
            </p>
          </div>
          <div className="space-y-2 font-mono text-xs">
            <div className="p-2.5 t-subtle flex items-center justify-between">
              <span className="font-bold text-emerald-600">200 OK</span>
              <span style={{ color: 'var(--text-secondary)' }}>Python successfully transpiled to Java + webhook sent</span>
            </div>
            <div className="p-2.5 t-subtle flex items-center justify-between">
              <span className="font-bold text-amber-600">400 Bad Request</span>
              <span style={{ color: 'var(--text-secondary)' }}>Missing or empty `python_code` string in JSON body</span>
            </div>
            <div className="p-2.5 t-subtle flex items-center justify-between">
              <span className="font-bold text-rose-600">401 Unauthorized</span>
              <span style={{ color: 'var(--text-secondary)' }}>Missing or invalid `x-api-key` authentication header</span>
            </div>
            <div className="p-2.5 t-subtle flex items-center justify-between">
              <span className="font-bold text-orange-600">429 Too Many Requests</span>
              <span style={{ color: 'var(--text-secondary)' }}>Sliding-window rate limit (60 req/min) exceeded</span>
            </div>
            <div className="p-2.5 t-subtle flex items-center justify-between">
              <span className="font-bold text-purple-600">500 Internal Error</span>
              <span style={{ color: 'var(--text-secondary)' }}>Upstream LLM timeout or unhandled syntax exception</span>
            </div>
          </div>
        </div>
      </div>

      {/* Deliverables Checklist Card */}
      <div className="t-surface p-4 space-y-3">
        <div className="flex items-center justify-between t-border-b pb-2.5">
          <div>
            <h3 className="font-bold text-sm heading-font">API Gateway REST Endpoint Catalog</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Full-stack authenticated endpoints exported by J-Forge
            </p>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 font-semibold">
            8 Production Routes
          </span>
        </div>
        <div className="space-y-2 font-mono text-xs">
          <div className="p-2.5 t-subtle flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/15 text-emerald-600">POST</span>
              <span className="font-bold">/api/v1/convert</span>
              <span className="text-[10px] opacity-70 border border-current px-1 rounded">x-api-key</span>
            </div>
            <span style={{ color: 'var(--text-secondary)' }}>Core Transpiler Engine + Async HMAC Webhook Dispatcher</span>
          </div>

          <div className="p-2.5 t-subtle flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded font-bold bg-amber-500/15 text-amber-600">POST</span>
              <span className="font-bold">/api/v1/explain</span>
              <span className="text-[10px] opacity-70 border border-current px-1 rounded">x-api-key</span>
            </div>
            <span style={{ color: 'var(--text-secondary)' }}>Compiler Diagnostics, Big-O Time/Space Complexity & Type Safety</span>
          </div>

          <div className="p-2.5 t-subtle flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded font-bold bg-sky-500/15 text-sky-600">POST</span>
              <span className="font-bold">/api/v1/ast-diff</span>
              <span className="text-[10px] opacity-70 border border-current px-1 rounded">x-api-key</span>
            </div>
            <span style={{ color: 'var(--text-secondary)' }}>Cross-Language AST Alignment & Type Mapping Inspector</span>
          </div>

          <div className="p-2.5 t-subtle flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded font-bold bg-purple-500/15 text-purple-600">POST</span>
              <span className="font-bold">/api/v1/webhook-verify</span>
              <span className="text-[10px] opacity-70 border border-current px-1 rounded">Public</span>
            </div>
            <span style={{ color: 'var(--text-secondary)' }}>Cryptographic HMAC-SHA256 Signature Validator (Constant-time)</span>
          </div>

          <div className="p-2.5 t-subtle flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded font-bold bg-sky-500/15 text-sky-600">POST</span>
              <span className="font-bold">/api/v1/webhook-demo</span>
              <span className="text-[10px] opacity-70 border border-current px-1 rounded">Mock</span>
            </div>
            <span style={{ color: 'var(--text-secondary)' }}>Local In-App Webhook Listener for Testing</span>
          </div>

          <div className="p-2.5 t-subtle flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded font-bold bg-teal-500/15 text-teal-600">GET</span>
              <span className="font-bold">/api/v1/health</span>
              <span className="text-[10px] opacity-70 border border-current px-1 rounded">Public</span>
            </div>
            <span style={{ color: 'var(--text-secondary)' }}>Gateway Health, Memory & Security Diagnostics Probe</span>
          </div>

          <div className="p-2.5 t-subtle flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded font-bold bg-orange-500/15 text-orange-600">GET</span>
              <span className="font-bold">/api/v1/metrics</span>
              <span className="text-[10px] opacity-70 border border-current px-1 rounded">Public</span>
            </div>
            <span style={{ color: 'var(--text-secondary)' }}>Prometheus / OpenMetrics Production Telemetry Endpoint (Grafana-ready)</span>
          </div>

          <div className="p-2.5 t-subtle flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded font-bold bg-blue-500/15 text-blue-600">GET</span>
              <span className="font-bold">/api/v1/openapi.json</span>
              <span className="text-[10px] opacity-70 border border-current px-1 rounded">Public</span>
            </div>
            <span style={{ color: 'var(--text-secondary)' }}>OpenAPI 3.1.0 Full Specification for Swagger / Postman</span>
          </div>
        </div>
      </div>

      {/* Deliverables Checklist Card */}
      <div className="t-surface p-4 space-y-3">
        <div className="flex items-center justify-between t-border-b pb-2.5">
          <div>
            <h3 className="font-bold text-sm heading-font">BTIN337 Final Submission Deliverables (Deadline: Dec 4, 2026)</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Evaluation criteria for Prof. Navaneeth Kamath (School of Engineering and Technology)
            </p>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 font-semibold">
            Due Dec 4, 2026
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 t-subtle space-y-1">
            <span className="font-bold text-emerald-600">1. Vercel Serverless Deployment</span>
            <p style={{ color: 'var(--text-secondary)' }}>
              Next.js App Router frontend & serverless <code className="font-mono">/api/v1/convert</code> ready for live deployment.
            </p>
          </div>
          <div className="p-3 t-subtle space-y-1">
            <span className="font-bold text-emerald-600">✓ 2. Faculty Review & Approval</span>
            <p style={{ color: 'var(--text-secondary)' }}>
              Live demo of Transpiler Studio, API Playground, and Webhook logs to Prof. Navaneeth Kamath.
            </p>
          </div>
          <div className="p-3 t-subtle space-y-1">
            <span className="font-bold text-emerald-600">✓ 3. Designated GitHub Push</span>
            <p style={{ color: 'var(--text-secondary)' }}>
              Target repository: <code className="font-mono text-[10px]">https://github.com/kamathn-blr/GenAI-CIAP-2025Batch.git</code>
            </p>
          </div>
          <div className="p-3 t-subtle space-y-1">
            <span className="font-bold text-emerald-600">✓ 4. Handwritten Project Report</span>
            <p style={{ color: 'var(--text-secondary)' }}>
              1-page handwritten report on both sides using <code className="font-mono">GenAI - CIA P - Report - Template.docx</code>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
