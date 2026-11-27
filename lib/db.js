import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Neon Serverless Postgres connection (uses DATABASE_URL env var)
// ---------------------------------------------------------------------------

let _sql = null;

function sql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error('DATABASE_URL is not configured. Connect a Neon Postgres database in Vercel Storage.');
    }
    _sql = neon(url);
  }
  return _sql;
}

// ---------------------------------------------------------------------------
// Schema bootstrap — idempotent, runs once per cold-start
// ---------------------------------------------------------------------------

let _schemaReady = false;

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

  // Check if email already exists
  const existing = await sql()`
    SELECT id FROM jforge_users WHERE email = ${normalizedEmail} LIMIT 1
  `;
  if (existing.length > 0) {
    return { ok: false, error: 'An account with this email already exists. Please sign in instead.' };
  }

  const rows = await sql()`
    INSERT INTO jforge_users (email, password_hash, name, organization, role)
    VALUES (${normalizedEmail}, ${passwordHash}, ${(name || '').trim()}, ${(organization || '').trim()}, ${(role || 'student').trim()})
    RETURNING id, email, name, organization, role, provider, created_at
  `;
  return { ok: true, user: rows[0] };
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
