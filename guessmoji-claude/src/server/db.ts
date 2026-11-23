import "server-only";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * SQLite storage using Node's built-in driver (no extra dependency).
 * The file lives at DATABASE_PATH (default: ./data/guessmoji.db, git-ignored).
 */

const SCHEMA = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id             TEXT PRIMARY KEY,
    email          TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash  TEXT NOT NULL,
    email_verified INTEGER NOT NULL DEFAULT 0,
    failed_login_count INTEGER NOT NULL DEFAULT 0,
    locked_until   INTEGER,
    created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  CREATE TABLE IF NOT EXISTS email_verification_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    used_at    INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_evt_user ON email_verification_tokens(user_id);

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    used_at    INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_prt_user ON password_reset_tokens(user_id);
`;

// Cache on globalThis so dev-mode hot reloads don't open a new handle each time.
const globalForDb = globalThis as unknown as { guessmojiDb?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (globalForDb.guessmojiDb) return globalForDb.guessmojiDb;

  const file = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "guessmoji.db");
  if (file !== ":memory:") {
    fs.mkdirSync(path.dirname(file), { recursive: true });
  }
  const db = new DatabaseSync(file);
  if (file !== ":memory:") db.exec("PRAGMA journal_mode = WAL;");
  db.exec(SCHEMA);
  migrate(db);
  globalForDb.guessmojiDb = db;
  return db;
}

/** Test helper: close and forget the current connection. */
export function closeDb() {
  globalForDb.guessmojiDb?.close();
  globalForDb.guessmojiDb = undefined;
}

/** Run fn inside a transaction, rolling back if it throws. */
export function transaction<T>(fn: (db: DatabaseSync) => T): T {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn(db);
    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/** Adds columns introduced after a database file was first created. */
function migrate(db: DatabaseSync) {
  const columns = new Set(
    (db.prepare("PRAGMA table_info(users)").all() as { name: string }[]).map((c) => c.name),
  );
  if (!columns.has("failed_login_count")) {
    db.exec("ALTER TABLE users ADD COLUMN failed_login_count INTEGER NOT NULL DEFAULT 0");
  }
  if (!columns.has("locked_until")) {
    db.exec("ALTER TABLE users ADD COLUMN locked_until INTEGER");
  }
}
