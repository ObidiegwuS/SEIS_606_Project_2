import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { AuthPageShell } from "@/components/AuthPageShell";
import { FormAlert } from "@/components/FormAlert";

export const metadata: Metadata = { title: "Check your email" };

export default function CheckEmailPage() {
  return (
    <AuthPageShell>
      <AuthCard
        eyebrow="Account created"
        title="Check your email"
        titleId="check-email-title"
        footer={
          <>
            Already verified? <Link href="/login">Log in</Link>
          </>
        }
      >
        <FormAlert tone="success">We sent a verification link to your email address.</FormAlert>
        <p>Open the link within 24 hours to verify your account. If you don&apos;t see the email, check your spam folder.</p>
        <p>
          Didn&apos;t get it? <Link href="/verify-email/resend">Resend verification email</Link>
        </p>
      </AuthCard>
    </AuthPageShell>
  );
}
