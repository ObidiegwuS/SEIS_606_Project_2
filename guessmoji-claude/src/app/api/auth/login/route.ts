import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { loginUser, MAX_FAILED_LOGINS } from "@/server/login";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const outcome = await loginUser(body);
  switch (outcome.status) {
    case "ok": {
      const res = NextResponse.json({ ok: true }, { status: 200 });
      res.cookies.set(SESSION_COOKIE, outcome.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        expires: new Date(outcome.expiresAt),
      });
      return res;
    }
    case "invalid":
      return NextResponse.json(
        { message: "Please fix the highlighted fields.", fieldErrors: outcome.fieldErrors },
        { status: 400 },
      );
    case "bad_credentials":
      return NextResponse.json(
        {
          message: `Incorrect email or password. After ${MAX_FAILED_LOGINS} failed attempts, the account is locked for 24 hours.`,
        },
        { status: 401 },
      );
    case "locked":
      return NextResponse.json(
        {
          error: "account_locked",
          message: `This account is locked for 24 hours after ${MAX_FAILED_LOGINS} failed login attempts. You can reset your password to unlock it now.`,
          lockedUntil: new Date(outcome.lockedUntil).toISOString(),
        },
        { status: 423 },
      );
    case "unverified":
      return NextResponse.json(
        {
          error: "email_not_verified",
          message: "Please verify your email address before logging in. Check your inbox for the verification link.",
        },
        { status: 403 },
      );
  }
}
