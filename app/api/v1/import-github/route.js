import { checkRateLimit } from '../../../../lib/rate-limit.js';
import { MAX_CODE_CHARS } from '../../../../lib/security.js';

export function resolveRawGithubUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(String(rawUrl || '').trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;

  if (parsed.hostname === 'raw.githubusercontent.com') {
    return parsed.toString();
  }
  if (parsed.hostname === 'github.com') {
    // Convert https://github.com/owner/repo/blob/branch/path/file.py -> raw.githubusercontent.com/owner/repo/branch/path/file.py
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length >= 5 && parts[2] === 'blob') {
      const [owner, repo, , branch, ...rest] = parts;
      return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${rest.join('/')}`;
    }
  }
  return null;
}

export async function POST(request) {
  const rl = checkRateLimit(request, {
    keyPrefix: 'import_gh:',
    limit: 15,
    windowMs: 60 * 1000,
  });
  if (!rl.allowed) {
    return Response.json({ ok: false, error: 'Rate limit exceeded.' }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON.' }, { status: 400 });
  }

  const rawUrl = resolveRawGithubUrl(body?.url);
  if (!rawUrl) {
    return Response.json(
      { ok: false, error: 'Enter a valid public GitHub file URL (e.g. https://github.com/user/repo/blob/main/app.py).' },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(rawUrl, {
      redirect: 'error',
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return Response.json({ ok: false, error: `GitHub returned HTTP ${res.status}.` }, { status: 400 });
    }
    const text = await res.text();
    if (!text.trim()) {
      return Response.json({ ok: false, error: 'Imported file is empty.' }, { status: 400 });
    }
    if (text.length > MAX_CODE_CHARS) {
      return Response.json({ ok: false, error: `File exceeds ${MAX_CODE_CHARS} character limit.` }, { status: 413 });
    }
    return Response.json({ ok: true, code: text, sourceUrl: rawUrl }, { status: 200 });
  } catch {
    return Response.json({ ok: false, error: 'Failed to fetch file from GitHub.' }, { status: 502 });
  }
}
