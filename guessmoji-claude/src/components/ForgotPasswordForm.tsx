"use client";

import { requestPasswordReset } from "@/lib/auth/client";
import { EmailRequestForm } from "./EmailRequestForm";

export function ForgotPasswordForm() {
  return (
    <EmailRequestForm
      label="Forgot password"
      submitLabel="Send Reset Link"
      submittingLabel="Sending…"
      submit={requestPasswordReset}
      successMessage={
        <>
          If an account exists for that email, we&apos;ve sent a password reset link. It expires in 1
          hour. Check your spam folder if you don&apos;t see it.
        </>
      }
    />
  );
}
