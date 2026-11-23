import { NextResponse, type NextRequest } from "next/server";
import { resetPassword } from "@/server/passwordReset";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const outcome = await resetPassword(body);
  switch (outcome.status) {
    case "reset":
      return NextResponse.json({ message: "Password updated." }, { status: 200 });
    case "invalid":
      return NextResponse.json(
        { message: "Please fix the highlighted fields.", fieldErrors: outcome.fieldErrors },
        { status: 400 },
      );
    case "invalid_token":
      return NextResponse.json(
        { error: "invalid_token", message: "This password reset link is invalid or has already been used." },
        { status: 400 },
      );
    case "expired_token":
      return NextResponse.json(
        { error: "expired_token", message: "This password reset link has expired." },
        { status: 400 },
      );
  }
}
