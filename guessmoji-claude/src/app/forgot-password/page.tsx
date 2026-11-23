import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { AuthPageShell } from "@/components/AuthPageShell";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell>
      <AuthCard
        eyebrow="Account help"
        title="Forgot your password?"
        titleId="forgot-title"
        description="Enter the email you registered with and we'll send you a link to reset your password."
        footer={<Link href="/login">Back to log in</Link>}
      >
        <ForgotPasswordForm />
      </AuthCard>
    </AuthPageShell>
  );
}
