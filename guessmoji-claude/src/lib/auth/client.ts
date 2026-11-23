/**
 * Browser-side client for the authentication API.
 *
 * Contract (see guessmoji-claude/README.md):
 *   POST /api/auth/register  { email, password }  -> 201 | 400 | 409
 *   POST /api/auth/login     { email, password }  -> 200 (sets HttpOnly session cookie) | 400 | 401
 *
 * This module never fakes success: any response other than a 2xx is reported
 * as a failure, including 501 from the not-yet-implemented backend.
 */
import { normalizeEmail, type FieldErrors } from "@/lib/validation";

export type Credentials = { email: string; password: string };

export type AuthResult<F extends string = string> =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: FieldErrors<F> };

const UNAVAILABLE = "Sign-in is not available right now. Please try again later.";

async function post<F extends string>(
  path: string,
  body: Credentials,
  messages: Partial<Record<number, string>>,
): Promise<AuthResult<F>> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ ...body, email: normalizeEmail(body.email) }),
    });
  } catch {
    return { ok: false, message: "Could not reach the server. Check your connection and try again." };
  }

  if (res.ok) return { ok: true };

  let payload: { message?: string; fieldErrors?: FieldErrors<F> } = {};
  try {
    payload = await res.json();
  } catch {
    /* non-JSON error body */
  }

  let message = messages[res.status];
  if (!message) {
    message =
      res.status >= 500
        ? UNAVAILABLE
        : payload.message || "Something went wrong. Please try again.";
  }

  return { ok: false, message, fieldErrors: payload.fieldErrors };
}

export function login(credentials: Credentials) {
  return post<"email" | "password">("/api/auth/login", credentials, {
    401: "Incorrect email or password.",
    429: "Too many attempts. Please wait a moment and try again.",
  });
}

export function register(credentials: Credentials) {
  return post<"email" | "password">("/api/auth/register", credentials, {
    409: "An account with this email already exists. Try logging in instead.",
    429: "Too many attempts. Please wait a moment and try again.",
  });
}
