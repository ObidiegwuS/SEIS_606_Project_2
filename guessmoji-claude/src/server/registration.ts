import "server-only";
import { normalizeEmail, validateEmail, validateNewPassword, type FieldErrors } from "@/lib/validation";
import { sendVerificationEmail } from "./mailer";
import { hashPassword } from "./password";
import {
  createUnverifiedUser,
  deleteUser,
  deleteVerificationToken,
  emailExists,
  EmailTakenError,
  findUserByEmail,
  lastVerificationIssuedAt,
  reissueVerificationToken,
  RESEND_COOLDOWN_MS,
} from "./users";

export type RegisterOutcome =
  | { status: "created" }
  | { status: "invalid"; fieldErrors: FieldErrors<"email" | "password"> }
  | { status: "email_taken" }
  | { status: "email_failed" };

/**
 * Registers a new, unverified account and emails a verification link.
 * Validation is repeated here because client-side checks can be bypassed.
 */
export async function registerUser(input: unknown, appUrl: string): Promise<RegisterOutcome> {
  const body = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const rawEmail = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  const fieldErrors: FieldErrors<"email" | "password"> = {};
  const emailError = validateEmail(rawEmail);
  const passwordError = validateNewPassword(password);
  if (emailError) fieldErrors.email = emailError;
  if (passwordError) fieldErrors.password = passwordError;
  if (emailError || passwordError) return { status: "invalid", fieldErrors };

  const email = normalizeEmail(rawEmail);
  if (emailExists(email)) return { status: "email_taken" };

  const passwordHash = await hashPassword(password);
  let created: { userId: string; token: string };
  try {
    created = createUnverifiedUser(email, passwordHash);
  } catch (err) {
    if (err instanceof EmailTakenError) return { status: "email_taken" };
    throw err;
  }

  try {
    await sendVerificationEmail(email, verificationLink(appUrl, created.token));
  } catch (err) {
    // Without the email the account could never be verified, so undo it and let the user retry.
    console.error("Failed to send verification email", err);
    deleteUser(created.userId);
    return { status: "email_failed" };
  }

  return { status: "created" };
}

function verificationLink(appUrl: string, token: string) {
  const url = new URL("/verify-email", appUrl);
  url.searchParams.set("token", token);
  return url.toString();
}

export type ResendOutcome =
  | { status: "accepted" }
  | { status: "invalid"; fieldErrors: FieldErrors<"email"> }
  | { status: "email_failed" };

/**
 * Sends a new verification link and invalidates older ones.
 * Returns "accepted" whether or not the email belongs to an unverified account
 * (unknown, already verified, or still in the cooldown window), so the response
 * doesn't reveal account details.
 */
export async function resendVerification(input: unknown, appUrl: string, now = Date.now()): Promise<ResendOutcome> {
  const body = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const rawEmail = typeof body.email === "string" ? body.email : "";
  const emailError = validateEmail(rawEmail);
  if (emailError) return { status: "invalid", fieldErrors: { email: emailError } };

  const user = findUserByEmail(normalizeEmail(rawEmail));
  if (!user || user.email_verified === 1) return { status: "accepted" };

  const last = lastVerificationIssuedAt(user.id);
  if (last !== null && now - last < RESEND_COOLDOWN_MS) return { status: "accepted" };

  const token = reissueVerificationToken(user.id, now);
  try {
    await sendVerificationEmail(user.email, verificationLink(appUrl, token));
  } catch (err) {
    console.error("Failed to resend verification email", err);
    deleteVerificationToken(token); // so the cooldown doesn't block an immediate retry
    return { status: "email_failed" };
  }
  return { status: "accepted" };
}
