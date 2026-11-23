"use server";

import { redirect } from "next/navigation";
import { consumeVerificationToken } from "@/server/users";

/**
 * Verification happens on an explicit button press (POST), not on page load,
 * so email link scanners that pre-fetch URLs don't consume the token.
 */
export async function verifyEmailAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const result = consumeVerificationToken(token);
  if (result === "verified") redirect("/login?verified=1");
  redirect(`/verify-email?status=${result}`);
}
