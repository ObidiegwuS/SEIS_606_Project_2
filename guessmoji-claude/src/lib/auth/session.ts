/**
 * Server-only session lookup. Do not import from client components.
 */
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./constants";

export type SessionUser = { id: string; email: string };

/**
 * Returns the logged-in user, or null if there is no valid session.
 * This is the authoritative check — the proxy's cookie check is only an
 * early redirect and can be bypassed by setting a fake cookie.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * BACKEND INTEGRATION POINT.
 * Look the token up in the session store (or verify its signature) and return
 * the matching user. Until a backend exists, no token is trusted, so the
 * authenticated home screen is unreachable — by design.
 */
async function verifySessionToken(_token: string): Promise<SessionUser | null> {
  return null;
}
