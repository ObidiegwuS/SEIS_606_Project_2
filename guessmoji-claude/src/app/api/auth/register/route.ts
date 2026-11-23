import { NextResponse, type NextRequest } from "next/server";
import { appUrl } from "@/server/appUrl";
import { registerUser } from "@/server/registration";

export async function POST(request: NextRequest) {
  const baseUrl = appUrl(request);
  if (!baseUrl) {
    console.error("APP_URL is not configured");
    return NextResponse.json({ message: "Registration is temporarily unavailable." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const outcome = await registerUser(body, baseUrl);
  switch (outcome.status) {
    case "created":
      return NextResponse.json(
        { message: "Account created. Check your email to verify your address." },
        { status: 201 },
      );
    case "invalid":
      return NextResponse.json(
        { message: "Please fix the highlighted fields.", fieldErrors: outcome.fieldErrors },
        { status: 400 },
      );
    case "email_taken":
      return NextResponse.json(
        { message: "An account with this email already exists.", fieldErrors: { email: "This email is already registered." } },
        { status: 409 },
      );
    case "email_failed":
      return NextResponse.json(
        { message: "We couldn't send the verification email. Please try again." },
        { status: 503 },
      );
  }
}
