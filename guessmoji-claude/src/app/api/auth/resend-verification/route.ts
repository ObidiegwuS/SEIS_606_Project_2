import { NextResponse, type NextRequest } from "next/server";
import { appUrl } from "@/server/appUrl";
import { resendVerification } from "@/server/registration";

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

  const outcome = await resendVerification(body, baseUrl);
  switch (outcome.status) {
    case "accepted":
      return NextResponse.json(
        { message: "If that email belongs to an account that still needs verifying, we've sent a new link." },
        { status: 200 },
      );
    case "invalid":
      return NextResponse.json(
        { message: "Please fix the highlighted fields.", fieldErrors: outcome.fieldErrors },
        { status: 400 },
      );
    case "email_failed":
      return NextResponse.json(
        { message: "We couldn't send the verification email. Please try again." },
        { status: 503 },
      );
  }
}
