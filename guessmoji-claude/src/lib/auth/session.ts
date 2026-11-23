/**
 * Server-only session lookup. Do not import from client components.
 */
import "server-only";
import { cookies } from "next/headers";
import { findSessionUser } from "@/server/sessions";
import { SESSION_COOKIE } from "./constants";

export type SessionUser = { id: string; email: string };

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
