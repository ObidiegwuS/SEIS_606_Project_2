import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { getDb, transaction } from "./db";

export const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
/** Minimum time between verification emails for one account. */
export const RESEND_COOLDOWN_MS = 60 * 1000;

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  email_verified: number;
  failed_login_count: number;
  locked_until: number | null;
};

export class EmailTakenError extends Error {
  constructor() {
    super("Email already registered");
  }
}

/** Only the SHA-256 of a token is stored, so a leaked database can't be used to verify accounts. */
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function findUserByEmail(email: string): UserRow | undefined {
  return getDb()
    .prepare("SELECT id, email, password_hash, email_verified, failed_login_count, locked_until FROM users WHERE email = ?")
    .get(email) as UserRow | undefined;
}

function insertVerificationToken(db: DatabaseSync, userId: string, now: number): string {
  const token = randomBytes(32).toString("base64url");
  db.prepare(
    "INSERT INTO email_verification_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
  ).run(hashToken(token), userId, now + VERIFICATION_TOKEN_TTL_MS);
  return token;
}

/** Issues a fresh token and invalidates any earlier unused ones, so only the newest link works. */
export function reissueVerificationToken(userId: string, now = Date.now()): string {
  return transaction((db) => {
    db.prepare("DELETE FROM email_verification_tokens WHERE user_id = ? AND used_at IS NULL").run(userId);
    return insertVerificationToken(db, userId, now);
  });
}

export function deleteVerificationToken(token: string) {
  getDb().prepare("DELETE FROM email_verification_tokens WHERE token_hash = ?").run(hashToken(token));
}

/** When the most recent verification email was issued (derived from its expiry), or null. */
export function lastVerificationIssuedAt(userId: string): number | null {
  const row = getDb()
    .prepare("SELECT MAX(expires_at) AS latest FROM email_verification_tokens WHERE user_id = ?")
    .get(userId) as { latest: number | null };
  return row.latest === null ? null : row.latest - VERIFICATION_TOKEN_TTL_MS;
}

export function emailExists(email: string): boolean {
  return !!getDb().prepare("SELECT 1 FROM users WHERE email = ?").get(email);
}

/**
 * Creates an unverified user and a single-use verification token atomically.
 * Returns the raw token (to email) — it is never stored.
 */
export function createUnverifiedUser(email: string, passwordHash: string, now = Date.now()) {
  const id = randomUUID();
  let token: string;
  try {
    token = transaction((db) => {
      db.prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)").run(id, email, passwordHash);
      return insertVerificationToken(db, id, now);
    });
  } catch (err) {
    // A concurrent registration can slip past the emailExists() pre-check; the UNIQUE index catches it.
    if (err instanceof Error && /UNIQUE constraint failed: users\.email/.test(err.message)) {
      throw new EmailTakenError();
    }
    throw err;
  }
  return { userId: id, token };
}

export function deleteUser(userId: string) {
  getDb().prepare("DELETE FROM users WHERE id = ?").run(userId);
}

export type VerifyResult = "verified" | "invalid" | "expired";

export function consumeVerificationToken(token: string, now = Date.now()): VerifyResult {
  if (!token) return "invalid";
  return transaction((db) => {
    const row = db
      .prepare("SELECT user_id, expires_at, used_at FROM email_verification_tokens WHERE token_hash = ?")
      .get(hashToken(token)) as { user_id: string; expires_at: number; used_at: number | null } | undefined;
    if (!row || row.used_at !== null) return "invalid";
    if (row.expires_at < now) return "expired";
    db.prepare("UPDATE email_verification_tokens SET used_at = ? WHERE token_hash = ?").run(now, hashToken(token));
    db.prepare("UPDATE users SET email_verified = 1 WHERE id = ?").run(row.user_id);
    return "verified";
  });
}

export function isEmailVerified(email: string): boolean {
  const row = getDb().prepare("SELECT email_verified FROM users WHERE email = ?").get(email) as
    | { email_verified: number }
    | undefined;
  return row?.email_verified === 1;
}
