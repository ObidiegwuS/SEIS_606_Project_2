import "server-only";
import { normalizeEmail, validateLogin, type FieldErrors } from "@/lib/validation";
import { getDb } from "./db";
import { hashPassword, verifyPassword } from "./password";
import { createSession } from "./sessions";
import { findUserByEmail } from "./users";

/** Failed attempts allowed before the account is locked. */
export const MAX_FAILED_LOGINS = 3;
export const LOCKOUT_MS = 24 * 60 * 60 * 1000;

export type LoginOutcome =
  | { status: "ok"; token: string; expiresAt: number }
  | { status: "invalid"; fieldErrors: FieldErrors<"email" | "password"> }
  | { status: "bad_credentials" }
  | { status: "locked"; lockedUntil: number }
  | { status: "unverified" };

// Hash checked when the email is unknown, so response time doesn't reveal which emails exist.
let dummyHash: Promise<string> | undefined;

/**
 * Records a wrong password. The count increments atomically, so parallel
 * guesses can't slip past the limit. On reaching the limit the account is
 * locked and the counter restarts for after the lock expires.
 */
function recordFailedLogin(userId: string, now: number): number | null {
  const db = getDb();
  const { failed_login_count } = db
    .prepare("UPDATE users SET failed_login_count = failed_login_count + 1 WHERE id = ? RETURNING failed_login_count")
    .get(userId) as { failed_login_count: number };
  if (failed_login_count < MAX_FAILED_LOGINS) return null;
  const lockedUntil = now + LOCKOUT_MS;
  db.prepare("UPDATE users SET failed_login_count = 0, locked_until = ? WHERE id = ?").run(lockedUntil, userId);
  return lockedUntil;
}

function clearFailedLogins(userId: string) {
  getDb().prepare("UPDATE users SET failed_login_count = 0, locked_until = NULL WHERE id = ?").run(userId);
}

export async function loginUser(input: unknown, now = Date.now()): Promise<LoginOutcome> {
  const body = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  const fieldErrors = validateLogin({ email, password });
  if (Object.keys(fieldErrors).length > 0) return { status: "invalid", fieldErrors };

  const user = findUserByEmail(normalizeEmail(email));
  if (!user) {
    dummyHash ??= hashPassword("not-a-real-password");
    await verifyPassword(password, await dummyHash);
    return { status: "bad_credentials" };
  }

  // While locked, even the correct password is refused and nothing is checked.
  if (user.locked_until !== null && user.locked_until > now) {
    return { status: "locked", lockedUntil: user.locked_until };
  }

  if (!(await verifyPassword(password, user.password_hash))) {
    const lockedUntil = recordFailedLogin(user.id, now);
    return lockedUntil ? { status: "locked", lockedUntil } : { status: "bad_credentials" };
  }

  clearFailedLogins(user.id);

  // Only revealed after the correct password, so it can't be used to probe other people's accounts.
  if (user.email_verified !== 1) return { status: "unverified" };

  return { status: "ok", ...createSession(user.id, now) };
}
