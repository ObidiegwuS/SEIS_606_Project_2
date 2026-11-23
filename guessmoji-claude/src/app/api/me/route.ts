import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/requireUser";

/** The logged-in user's own account information. Protected on the server. */
export function GET(request: NextRequest) {
  const auth = requireUser(request);
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json(
    { email: auth.email, emailVerified: auth.emailVerified, memberSince: auth.createdAt },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
