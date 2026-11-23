import "server-only";
import { randomBytes } from "node:crypto";
import { getDb } from "./db";
import { hashToken } from "./users";

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Creates a session and returns the raw token for the cookie. Only its hash is stored. */
export function createSession(userId: string, now = Date.now()) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = now + SESSION_TTL_MS;
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE user_id = ? AND expires_at <= ?").run(userId, now);
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(
    hashToken(token),
    userId,
    expiresAt,
  );
  return { token, expiresAt };
}

export type SessionUser = { id: string; email: string; emailVerified: true; createdAt: string };

/**
 * Returns the session's user only if the session exists, has not expired,
 * and belongs to an account whose email is verified. Anything else is null.
 */
export function findSessionUser(token: string, now = Date.now()): SessionUser | null {
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT u.id, u.email, u.created_at FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ? AND u.email_verified = 1`,
    )
    .get(hashToken(token), now) as { id: string; email: string; created_at: string } | undefined;
  return row ? { id: row.id, email: row.email, emailVerified: true, createdAt: row.created_at } : null;
}

export function deleteSession(token: string) {
  getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
}
