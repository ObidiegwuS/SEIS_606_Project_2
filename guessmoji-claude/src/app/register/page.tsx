import type { Metadata } from "next";
import Link from "next/link";
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
        description="We only ask for an email and password."
        footer={
          <>
            Already have an account? <Link href="/login">Log in</Link>
          </>
        }
      >
        <RegisterForm />
      </AuthCard>
    </AuthPageShell>
  );
}
