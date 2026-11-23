import { NextResponse, type NextRequest } from "next/server";
import { appUrl } from "@/server/appUrl";
import { requestPasswordReset } from "@/server/passwordReset";

export async function POST(request: NextRequest) {
  const baseUrl = appUrl(request);
  if (!baseUrl) {
    console.error("APP_URL is not configured");
    return NextResponse.json({ message: "This service is temporarily unavailable." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const outcome = await requestPasswordReset(body, baseUrl);
  switch (outcome.status) {
    case "accepted":
      return NextResponse.json(
        { message: "If an account exists for that email, we've sent a password reset link." },
        { status: 200 },
      );
    case "invalid":
      return NextResponse.json(
        { message: "Please fix the highlighted fields.", fieldErrors: outcome.fieldErrors },
        { status: 400 },
      );
    case "email_failed":
      return NextResponse.json(
        { message: "We couldn't send the password reset email. Please try again." },
        { status: 503 },
      );
  }
}
