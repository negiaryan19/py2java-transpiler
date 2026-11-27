import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Neon Serverless Postgres connection (uses DATABASE_URL env var)
// ---------------------------------------------------------------------------

let _sql = null;
let _sqlUrl = '';
let _schemaReady = false;
const ALLOWED_ROLES = new Set(['student', 'faculty', 'developer', 'researcher']);

function sql() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error('DATABASE_URL is not configured. Connect a Neon Postgres database in Vercel Storage.');
  }
  if (!_sql || _sqlUrl !== url) {
    _sql = neon(url);
    _sqlUrl = url;
    _schemaReady = false;
  }
  return _sql;
}

// ---------------------------------------------------------------------------
// Schema bootstrap — idempotent, runs once per cold-start
// ---------------------------------------------------------------------------

export async function ensureSchema() {
  if (_schemaReady) return;
  await sql()`
    CREATE TABLE IF NOT EXISTS jforge_users (
      id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name          TEXT NOT NULL DEFAULT '',
      organization  TEXT NOT NULL DEFAULT '',
      role          TEXT NOT NULL DEFAULT 'student',
      provider      TEXT NOT NULL DEFAULT 'email',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql()`
    CREATE TABLE IF NOT EXISTS jforge_history (
      id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id       TEXT NOT NULL,
      label         TEXT NOT NULL DEFAULT '',
      python_code   TEXT NOT NULL,
      java_code     TEXT NOT NULL,
      java_version  TEXT NOT NULL DEFAULT 'Java 17 LTS',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql()`
    CREATE TABLE IF NOT EXISTS jforge_password_resets (
      id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      email         TEXT NOT NULL,
      code_hash     TEXT NOT NULL,
      expires_at    TIMESTAMPTZ NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  _schemaReady = true;
}

// ---------------------------------------------------------------------------
// Password hashing — pure Node.js crypto (no native addons)
// Uses PBKDF2 with 120 000 iterations, SHA-512, 32-byte salt, 64-byte key.
// ---------------------------------------------------------------------------

const PBKDF2_ITERATIONS = 120_000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';
const SALT_BYTES = 32;

export function hashPassword(plaintext) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_BYTES);
    crypto.pbkdf2(plaintext, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST, (err, derivedKey) => {
      if (err) return reject(err);
      // Format: iterations.digest.salt_hex.key_hex
      resolve(`${PBKDF2_ITERATIONS}.${PBKDF2_DIGEST}.${salt.toString('hex')}.${derivedKey.toString('hex')}`);
    });
  });
}

export function verifyPassword(plaintext, stored) {
  return new Promise((resolve, reject) => {
    const parts = stored.split('.');
    if (parts.length !== 4) return resolve(false);
    const [iterStr, digest, saltHex, keyHex] = parts;
    const iterations = parseInt(iterStr, 10);
    if (!iterations || iterations < 1000) return resolve(false);
    const salt = Buffer.from(saltHex, 'hex');
    const storedKey = Buffer.from(keyHex, 'hex');
    crypto.pbkdf2(plaintext, salt, iterations, storedKey.length, digest, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(crypto.timingSafeEqual(derivedKey, storedKey));
    });
  });
}

// ---------------------------------------------------------------------------
// User CRUD
// ---------------------------------------------------------------------------

export async function createUser({ email, password, name, organization, role }) {
  await ensureSchema();
  const passwordHash = await hashPassword(password);
  const normalizedEmail = email.trim().toLowerCase();
  const cleanRole = ALLOWED_ROLES.has(String(role || '').trim().toLowerCase())
    ? String(role).trim().toLowerCase()
    : 'student';

  // Check if email already exists
  const existing = await sql()`
    SELECT id FROM jforge_users WHERE email = ${normalizedEmail} LIMIT 1
  `;
  if (existing.length > 0) {
    return { ok: false, error: 'An account with this email already exists. Please sign in instead.' };
  }

  try {
    const rows = await sql()`
      INSERT INTO jforge_users (email, password_hash, name, organization, role)
      VALUES (${normalizedEmail}, ${passwordHash}, ${(name || '').trim()}, ${(organization || '').trim()}, ${cleanRole})
      RETURNING id, email, name, organization, role, provider, created_at
    `;
    return { ok: true, user: rows[0] };
  } catch (err) {
    if (err?.code === '23505') {
      return { ok: false, error: 'An account with this email already exists. Please sign in instead.' };
    }
    throw err;
  }
}

export async function authenticateUser({ email, password }) {
  await ensureSchema();
  const normalizedEmail = email.trim().toLowerCase();

  const rows = await sql()`
    SELECT id, email, password_hash, name, organization, role, provider
    FROM jforge_users
    WHERE email = ${normalizedEmail}
    LIMIT 1
  `;
  if (rows.length === 0) {
    return { ok: false, error: 'No account found with this email. Please create an account first.' };
  }

  const user = rows[0];
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return { ok: false, error: 'Incorrect password. Please try again.' };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      organization: user.organization,
      role: user.role,
      provider: user.provider,
    },
  };
}

export async function getUserById(id) {
  await ensureSchema();
  const rows = await sql()`
    SELECT id, email, name, organization, role, provider, created_at
    FROM jforge_users
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows.length > 0 ? rows[0] : null;
}

export async function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export async function listUserHistory(userId, limit = 10) {
  await ensureSchema();
  const safeLimit = Math.min(20, Math.max(1, Number(limit) || 10));
  return sql()`
    SELECT id, label, python_code, java_code, java_version, created_at
    FROM jforge_history
    WHERE user_id = ${String(userId)}
    ORDER BY created_at DESC
    LIMIT ${safeLimit}
  `;
}

export async function saveUserHistory({ userId, label, pythonCode, javaCode, javaVersion = 'Java 17 LTS' }) {
  await ensureSchema();
  const rows = await sql()`
    INSERT INTO jforge_history (user_id, label, python_code, java_code, java_version)
    VALUES (${String(userId)}, ${String(label || 'Python Snippet').slice(0, 80)}, ${pythonCode}, ${javaCode}, ${javaVersion})
    RETURNING id, label, python_code, java_code, java_version, created_at
  `;
  return rows[0];
}

function sha256Hex(val) {
  return crypto.createHash('sha256').update(String(val)).digest('hex');
}

export async function createPasswordResetCode(email) {
  await ensureSchema();
  const normalized = email.trim().toLowerCase();
  const users = await sql()`SELECT id FROM jforge_users WHERE email = ${normalized} LIMIT 1`;
  if (users.length === 0) {
    return { found: false };
  }
  const code = String(crypto.randomInt(100000, 999999));
  const codeHash = sha256Hex(code);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await sql()`DELETE FROM jforge_password_resets WHERE email = ${normalized}`;
  await sql()`
    INSERT INTO jforge_password_resets (email, code_hash, expires_at)
    VALUES (${normalized}, ${codeHash}, ${expiresAt})
  `;
  return { found: true, code };
}

export async function resetPasswordWithCode(email, code, newPassword) {
  await ensureSchema();
  const normalized = email.trim().toLowerCase();
  const codeHash = sha256Hex(String(code || '').trim());
  const rows = await sql()`
    SELECT id, expires_at
    FROM jforge_password_resets
    WHERE email = ${normalized} AND code_hash = ${codeHash}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (rows.length === 0 || new Date(rows[0].expires_at).getTime() < Date.now()) {
    return { ok: false, error: 'Invalid or expired reset code.' };
  }
  const passwordHash = await hashPassword(newPassword);
  await sql()`
    UPDATE jforge_users
    SET password_hash = ${passwordHash}, updated_at = now()
    WHERE email = ${normalized}
  `;
  await sql()`DELETE FROM jforge_password_resets WHERE email = ${normalized}`;
  return { ok: true };
}
