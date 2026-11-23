import "server-only";
import { randomBytes } from "node:crypto";
import { normalizeEmail, validateEmail, validateNewPassword, type FieldErrors } from "@/lib/validation";
import { getDb, transaction } from "./db";
import { sendPasswordResetEmail } from "./mailer";
import { hashPassword } from "./password";
import { findUserByEmail, hashToken } from "./users";

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
export const RESET_COOLDOWN_MS = 60 * 1000;

type ResetRow = { user_id: string; expires_at: number; used_at: number | null };

function lookup(token: string): ResetRow | undefined {
  if (!token) return undefined;
  return getDb()
    .prepare("SELECT user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = ?")
    .get(hashToken(token)) as ResetRow | undefined;
}

export type ResetTokenState = "valid" | "invalid" | "expired";

/** Checks a reset link without using it up (for showing the form or an error). */
export function checkResetToken(token: string, now = Date.now()): ResetTokenState {
  const row = lookup(token);
  if (!row || row.used_at !== null) return "invalid";
  return row.expires_at < now ? "expired" : "valid";
}

export type ForgotOutcome = { status: "accepted" } | { status: "invalid"; fieldErrors: FieldErrors<"email"> } | { status: "email_failed" };

/**
 * Emails a password-reset link. Returns "accepted" whether or not the email is
 * registered (or is in the cooldown window), so the response doesn't reveal accounts.
 */
export async function requestPasswordReset(input: unknown, appUrl: string, now = Date.now()): Promise<ForgotOutcome> {
  const body = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const rawEmail = typeof body.email === "string" ? body.email : "";
  const emailError = validateEmail(rawEmail);
  if (emailError) return { status: "invalid", fieldErrors: { email: emailError } };

  const user = findUserByEmail(normalizeEmail(rawEmail));
  if (!user) return { status: "accepted" };

  const db = getDb();
  const { latest } = db
    .prepare("SELECT MAX(expires_at) AS latest FROM password_reset_tokens WHERE user_id = ?")
    .get(user.id) as { latest: number | null };
  if (latest !== null && now - (latest - RESET_TOKEN_TTL_MS) < RESET_COOLDOWN_MS) return { status: "accepted" };

  const token = randomBytes(32).toString("base64url");
  transaction((tx) => {
    // Only the newest link works.
    tx.prepare("DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL").run(user.id);
    tx.prepare("INSERT INTO password_reset_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(
      hashToken(token),
      user.id,
      now + RESET_TOKEN_TTL_MS,
    );
  });

  const url = new URL("/reset-password", appUrl);
  url.searchParams.set("token", token);
  try {
    await sendPasswordResetEmail(user.email, url.toString());
  } catch (err) {
    console.error("Failed to send password reset email", err);
    db.prepare("DELETE FROM password_reset_tokens WHERE token_hash = ?").run(hashToken(token));
    return { status: "email_failed" };
  }
  return { status: "accepted" };
}

export type ResetOutcome =
  | { status: "reset" }
  | { status: "invalid"; fieldErrors: FieldErrors<"password"> }
  | { status: "invalid_token" }
  | { status: "expired_token" };

/**
 * Sets a new password using a reset link. Because the link proves the user
 * controls the email address, it also marks the email verified and lifts any
 * login lockout. All existing sessions are ended.
 */
export async function resetPassword(input: unknown, now = Date.now()): Promise<ResetOutcome> {
  const body = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";

  const state = checkResetToken(token, now);
  if (state === "invalid") return { status: "invalid_token" };
  if (state === "expired") return { status: "expired_token" };

  const passwordError = validateNewPassword(password);
  if (passwordError) return { status: "invalid", fieldErrors: { password: passwordError } };

  const passwordHash = await hashPassword(password);
  return transaction((db) => {
    // Re-check inside the transaction so a link can't be used twice by parallel requests.
    const row = db
      .prepare("SELECT user_id FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at >= ?")
      .get(hashToken(token), now) as { user_id: string } | undefined;
    if (!row) return { status: "invalid_token" } as const;

    db.prepare("UPDATE password_reset_tokens SET used_at = ? WHERE token_hash = ?").run(now, hashToken(token));
    db.prepare("DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL").run(row.user_id);
    db.prepare(
      `UPDATE users SET password_hash = ?, email_verified = 1, failed_login_count = 0, locked_until = NULL
       WHERE id = ?`,
    ).run(passwordHash, row.user_id);
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(row.user_id);
    return { status: "reset" } as const;
  });
}
