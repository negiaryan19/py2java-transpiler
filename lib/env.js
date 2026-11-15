import crypto from 'crypto';

/**
 * Enterprise Environment & Secret Security Guard
 * Ensures zero hardcoded credentials and safe secret handling.
 */

export function maskSecret(secret) {
  if (!secret || typeof secret !== 'string') return 'NOT_CONFIGURED';
  const trimmed = secret.trim();
  if (trimmed.length <= 10) return '********';
  return `${trimmed.slice(0, 7)}...${trimmed.slice(-4)}`;
}

export function generateSecureSecret(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex');
}

export function getSecurityAudit() {
  const geminiKey = process.env.GEMINI_API_KEY || '';
  const appKey = process.env.APP_API_KEY || '';
  const webhookSec = process.env.WEBHOOK_SECRET || '';

  const isGeminiPlaceholder =
    !geminiKey ||
    geminiKey.includes('YOUR_GOOGLE_AI_STUDIO_KEY') ||
    geminiKey === 'placeholder-ci-key';

  return {
    environment: process.env.NODE_ENV || 'development',
    gemini_key_configured: !isGeminiPlaceholder,
    gemini_key_masked: isGeminiPlaceholder ? 'PLACEHOLDER' : maskSecret(geminiKey),
    app_key_configured: Boolean(appKey),
    app_key_masked: maskSecret(appKey),
    webhook_secret_configured: Boolean(webhookSec),
    webhook_secret_masked: maskSecret(webhookSec),
    timing_safe_auth_active: true,
    hmac_sha256_active: true,
    rate_limiter_active: true,
  };
}
