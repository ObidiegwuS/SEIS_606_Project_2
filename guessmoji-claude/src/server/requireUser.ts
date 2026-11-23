import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { findSessionUser, type SessionUser } from "./sessions";

/**
 * Authentication guard for protected API route handlers.
 * Returns the verified user, or a 401 response to send back as-is:
 *
 *   const auth = requireUser(request);
 *   if (auth instanceof NextResponse) return auth;
 *   // auth is the logged-in, verified user
 */
export function requireUser(request: NextRequest): SessionUser | NextResponse {
  const token = request.cookies.get(SESSION_COOKIE)?.value ?? "";
  const user = findSessionUser(token);
  if (user) return user;
  return NextResponse.json(
    { error: "unauthenticated", message: "You need to log in to do that." },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}
