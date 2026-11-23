/**
 * Browser-side client for the authentication API.
 *
 * Contract (see guessmoji-claude/README.md):
 *   POST /api/auth/register  { email, password }  -> 201 | 400 | 409 | 503
 *   POST /api/auth/login     { email, password }  -> 200 (sets HttpOnly session cookie) | 400 | 401 | 403 | 423
 *   POST /api/auth/resend-verification { email }  -> 200 | 400 | 503
 *   POST /api/auth/forgot-password     { email }  -> 200 | 400 | 503
 *   POST /api/auth/reset-password      { token, password } -> 200 | 400
 *
 * This module never fakes success: any response other than a 2xx is reported as a failure.
 */
import { normalizeEmail, type FieldErrors } from "@/lib/validation";

export type Credentials = { email: string; password: string };

export type AuthResult<F extends string = string> =
  | { ok: true }
  | { ok: false; message: string; code?: string; fieldErrors?: FieldErrors<F> };

/** Error code the login API returns for a correct password on an unverified account. */
export const EMAIL_NOT_VERIFIED = "email_not_verified";
/** Error code the login API returns while an account is locked after too many failed attempts. */
export const ACCOUNT_LOCKED = "account_locked";
/** Error codes the reset-password API returns for unusable links. */
export const RESET_LINK_ERRORS = ["invalid_token", "expired_token"];

const UNAVAILABLE = "Sign-in is not available right now. Please try again later.";

async function post<F extends string>(
  path: string,
  body: Record<string, string>,
  messages: Partial<Record<number, string>>,
): Promise<AuthResult<F>> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify("email" in body ? { ...body, email: normalizeEmail(body.email) } : body),
    });
  } catch {
    return { ok: false, message: "Could not reach the server. Check your connection and try again." };
  }

  if (res.ok) return { ok: true };

  let payload: { message?: string; error?: string; fieldErrors?: FieldErrors<F> } = {};
  try {
    payload = await res.json();
  } catch {
    /* non-JSON error body */
  }

  let message = messages[res.status];
  if (!message) {
    // 503 carries a user-facing reason (e.g. verification email failed); other 5xx don't.
    message =
      res.status >= 500 && res.status !== 503
        ? UNAVAILABLE
        : payload.message || "Something went wrong. Please try again.";
  }

  return { ok: false, message, code: payload.error, fieldErrors: payload.fieldErrors };
}

export function login(credentials: Credentials) {
  return post<"email" | "password">("/api/auth/login", credentials, {
    429: "Too many attempts. Please wait a moment and try again.",
  });
}

export function register(credentials: Credentials) {
  return post<"email" | "password">("/api/auth/register", credentials, {
    409: "An account with this email already exists. Try logging in instead.",
    429: "Too many attempts. Please wait a moment and try again.",
  });
}

export function resendVerification(email: string) {
  return post<"email">("/api/auth/resend-verification", { email }, {
    429: "Too many attempts. Please wait a moment and try again.",
  });
}

export function requestPasswordReset(email: string) {
  return post<"email">("/api/auth/forgot-password", { email }, {
    429: "Too many attempts. Please wait a moment and try again.",
  });
}

export function resetPassword(token: string, password: string) {
  return post<"password">("/api/auth/reset-password", { token, password }, {});
}
