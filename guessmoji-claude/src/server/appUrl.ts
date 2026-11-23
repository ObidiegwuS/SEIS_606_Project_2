import "server-only";
import type { NextRequest } from "next/server";

/**
 * Base URL for links in emails. In production it must come from APP_URL —
 * never from the request's Host header, which a client can spoof to make the
 * verification link point at another site.
 */
export function appUrl(request: NextRequest): string | null {
  if (process.env.APP_URL) return process.env.APP_URL;
  return process.env.NODE_ENV === "production" ? null : request.nextUrl.origin;
}
