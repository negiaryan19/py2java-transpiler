import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, verifySessionToken } from '../../../lib/session.js';
import { isDatabaseConfigured, listUserHistory, saveUserHistory } from '../../../lib/db.js';
import { MAX_CODE_CHARS } from '../../../lib/security.js';

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function GET() {
  const session = await getAuthenticatedUser();
  if (!session) {
    return Response.json({ ok: false, error: 'Authentication required.' }, { status: 401 });
  }
  if (!(await isDatabaseConfigured())) {
    return Response.json({ ok: true, items: [] }, { status: 200 });
  }
  try {
    const rows = await listUserHistory(session.sub, 10);
    const items = rows.map((r) => ({
      id: r.id,
      label: r.label,
      pythonCode: r.python_code,
      javaCode: r.java_code,
      javaTargetVersion: r.java_version,
      time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
    return Response.json({ ok: true, items }, { status: 200 });
  } catch {
    return Response.json({ ok: false, error: 'Failed to load history.' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getAuthenticatedUser();
  if (!session) {
    return Response.json({ ok: false, error: 'Authentication required.' }, { status: 401 });
  }
  if (!(await isDatabaseConfigured())) {
    return Response.json({ ok: false, error: 'Database not configured.' }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON.' }, { status: 400 });
  }

  const { label, pythonCode, javaCode, javaTargetVersion } = body || {};
  if (typeof pythonCode !== 'string' || typeof javaCode !== 'string' || !pythonCode.trim() || !javaCode.trim()) {
    return Response.json({ ok: false, error: 'pythonCode and javaCode are required.' }, { status: 400 });
  }
  if (pythonCode.length > MAX_CODE_CHARS || javaCode.length > MAX_CODE_CHARS) {
    return Response.json({ ok: false, error: 'Payload too large.' }, { status: 413 });
  }

  try {
    const row = await saveUserHistory({
      userId: session.sub,
      label,
      pythonCode,
      javaCode,
      javaVersion: typeof javaTargetVersion === 'string' ? javaTargetVersion : 'Java 17 LTS',
    });
    return Response.json({ ok: true, id: row.id }, { status: 200 });
  } catch {
    return Response.json({ ok: false, error: 'Failed to save history.' }, { status: 500 });
  }
}
