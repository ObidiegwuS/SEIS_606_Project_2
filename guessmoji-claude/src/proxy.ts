import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * Optimistic check: send visitors without a session cookie straight to login.
 * This is NOT the security boundary — a cookie can be forged — so every
 * protected page must also call getCurrentUser() on the server.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Keep in sync with PROTECTED_PATHS in src/lib/auth/constants.ts.
export const config = { matcher: ["/home/:path*"] };
