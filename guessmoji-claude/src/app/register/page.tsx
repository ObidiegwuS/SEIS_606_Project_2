import type { Metadata } from "next";
import { AuthCard } from "@/components/AuthCard";
import { AuthPageShell } from "@/components/AuthPageShell";
import { RegisterForm } from "@/components/RegisterForm";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <AuthPageShell>
      <AuthCard
        eyebrow="New player"
        title="Create a new account"
        titleId="register-title"
        description="We only ask for an email and password. We'll send you a link to verify your email."
      >
        <RegisterForm />
      </AuthCard>
    </AuthPageShell>
  );
}
