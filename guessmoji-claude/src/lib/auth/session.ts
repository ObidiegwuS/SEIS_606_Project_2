/**
 * Server-only session lookup for Server Components and Server Actions.
 * Do not import from client components.
 */
import "server-only";
import { cookies } from "next/headers";
import { findSessionUser, type SessionUser } from "@/server/sessions";
import { SESSION_COOKIE } from "./constants";

export type { SessionUser };

/**
 * Returns the logged-in user, or null if there is no valid session.
 * This is the authoritative check — the proxy's cookie check is only an
 * early redirect and can be bypassed by setting a fake cookie.
 * Sessions belonging to unverified accounts are never accepted.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return findSessionUser(token);
}
