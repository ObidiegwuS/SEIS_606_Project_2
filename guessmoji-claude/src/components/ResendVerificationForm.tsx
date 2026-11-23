"use client";

import { resendVerification } from "@/lib/auth/client";
import { EmailRequestForm } from "./EmailRequestForm";

export function ResendVerificationForm() {
  return (
    <EmailRequestForm
      label="Resend verification email"
      submitLabel="Resend Verification Email"
      submittingLabel="Sending…"
      submit={resendVerification}
      successMessage={
        <>
          If that email belongs to an account that still needs verifying, we&apos;ve sent a new link. It
          expires in 24 hours, and any earlier links no longer work.
        </>
      }
    />
  );
}
