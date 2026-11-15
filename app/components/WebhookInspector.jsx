'use client';

import React from 'react';
import {
  Send,
  RefreshCw,
} from 'lucide-react';

export default function WebhookInspector({
  webhookEndpointUrl,
  setWebhookEndpointUrl,
  webhookSigningSecret,
  setWebhookSigningSecret,
  webhookEventTopic,
  setWebhookEventTopic,
  webhookDeliveries,
  selectedWebhookIndex,
  setSelectedWebhookIndex,
  onTriggerManualWebhook,
  onClearLogs,
  onReplayWebhook,
  copyToClipboard,
  copiedId,
}) {
  const selectedWebhook = webhookDeliveries[selectedWebhookIndex] || null;

  return (
    <section className="space-y-4">
      {/* Webhook Configuration Card */}
      <div className="t-surface p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 t-border-b pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base heading-font">Outgoing Webhook Dispatcher</h2>
              <span className="text-xs px-2 py-0.5 t-subtle font-mono">Requirement #5</span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Automatically sends asynchronous <code className="font-mono">POST</code> notifications with structured JSON and HTTP status verification whenever code conversion completes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onTriggerManualWebhook}
              className="t-btn-primary px-3.5 py-1.5 text-xs font-mono flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Trigger Webhook Event</span>
            </button>
            <button
              onClick={onClearLogs}
              className="t-btn-secondary px-3 py-1.5 text-xs font-mono cursor-pointer"
            >
              Clear Logs
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
              Target Webhook Endpoint URL
            </label>
            <input
              type="url"
              value={webhookEndpointUrl}
              onChange={(e) => setWebhookEndpointUrl(e.target.value)}
              className="w-full px-3 py-2 t-surface text-xs focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
              Signing Secret (HMAC-SHA256)
            </label>
            <input
              type="text"
              value={webhookSigningSecret}
              onChange={(e) => setWebhookSigningSecret(e.target.value)}
              className="w-full px-3 py-2 t-surface text-xs focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
              Subscribed Event Topic
            </label>
            <select
              value={webhookEventTopic}
              onChange={(e) => setWebhookEventTopic(e.target.value)}
              className="w-full px-3 py-2 t-surface text-xs focus:outline-none cursor-pointer"
            >
              <option value="code.conversion.completed">code.conversion.completed</option>
              <option value="code.conversion.failed">code.conversion.failed</option>
              <option value="gateway.ping.verified">gateway.ping.verified</option>
            </select>
          </div>
        </div>
      </div>

      {/* Delivery Log Table + Live Payload Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 7 Cols: Delivery Log Table */}
        <div className="lg:col-span-7 t-surface overflow-hidden flex flex-col">
          <div
            className="px-4 py-3 t-border-b flex items-center justify-between"
            style={{ backgroundColor: 'var(--bg-subtle)' }}
          >
            <span className="font-bold text-xs font-mono">Recent Webhook Deliveries</span>
            <span className="text-[11px] font-mono" style={{ color: 'var(--text-secondary)' }}>
              Click row to inspect payload
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr
                  className="t-border-b text-[11px]"
                  style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-app)' }}
                >
                  <th className="py-2.5 px-3">HTTP Status</th>
                  <th className="py-2.5 px-3">Event Type</th>
                  <th className="py-2.5 px-3">Delivery ID</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {webhookDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center opacity-60">
                      No webhook deliveries logged yet.
                    </td>
                  </tr>
                ) : (
                  webhookDeliveries.map((item, idx) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedWebhookIndex(idx)}
                      className={`cursor-pointer hover:opacity-80 transition ${
                        selectedWebhookIndex === idx ? 'bg-black/5 dark:bg-white/5 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-600">
                          HTTP {item.statusCode}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold">{item.eventType}</td>
                      <td className="py-2.5 px-3 opacity-75">{item.id}</td>
                      <td className="py-2.5 px-3 opacity-75">
                        {item.timestamp ? item.timestamp.split('T')[1]?.replace('Z', '') : '10:30:00'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onReplayWebhook(idx);
                          }}
                          className="t-btn-secondary px-2 py-0.5 text-[10px] flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>Replay</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 5 Cols: Selected Webhook Payload Inspector */}
        <div className="lg:col-span-5 t-surface p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between t-border-b pb-2.5">
            <span className="font-bold text-xs font-mono">Webhook Payload & Headers Inspector</span>
            <button
              onClick={() => {
                if (selectedWebhook) {
                  copyToClipboard(JSON.stringify(selectedWebhook.payload, null, 2), 'wh', 'Webhook payload copied');
                }
              }}
              className="text-xs font-mono underline cursor-pointer"
            >
              {copiedId === 'wh' ? 'Copied!' : 'Copy Payload'}
            </button>
          </div>

          {/* Headers View */}
          <div className="p-2.5 t-subtle font-mono text-[11px] space-y-1">
            {selectedWebhook?.headers ? (
              Object.entries(selectedWebhook.headers).map(([k, v]) => (
                <div key={k}>
                  <span className="opacity-60">{k}:</span> {v}
                </div>
              ))
            ) : (
              <div className="opacity-60">Select a delivery to inspect headers</div>
            )}
          </div>

          {/* Payload View */}
          <textarea
            readOnly
            rows={11}
            value={selectedWebhook ? JSON.stringify(selectedWebhook.payload, null, 2) : ''}
            spellCheck={false}
            className="editor-area-java w-full flex-1 p-3 t-surface font-mono text-xs focus:outline-none"
            placeholder="// Select a delivery above to inspect its JSON payload..."
          />
        </div>
      </div>
    </section>
  );
}
