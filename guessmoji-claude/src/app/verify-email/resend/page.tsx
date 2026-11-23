import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { AuthPageShell } from "@/components/AuthPageShell";
import { ResendVerificationForm } from "@/components/ResendVerificationForm";

export const metadata: Metadata = { title: "Resend verification email" };

export default function ResendVerificationPage() {
  return (
    <AuthPageShell>
      <AuthCard
        eyebrow="Verify your email"
        title="Resend verification email"
        titleId="resend-title"
        description="Enter the email you registered with and we'll send a new verification link."
        footer={<Link href="/login">Back to log in</Link>}
      >
        <ResendVerificationForm />
      </AuthCard>
    </AuthPageShell>
  );
}
