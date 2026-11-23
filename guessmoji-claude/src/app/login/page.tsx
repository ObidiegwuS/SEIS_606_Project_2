import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { AuthPageShell } from "@/components/AuthPageShell";
import { LoginForm } from "@/components/LoginForm";
import { safeRedirectPath } from "@/lib/validation";

export const metadata: Metadata = { title: "Log in" };

type Props = { searchParams: Promise<{ next?: string; verified?: string; reset?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next, verified, reset } = await searchParams;
  return (
    <AuthPageShell>
      <AuthCard
        eyebrow="Returning player"
        title="Log in"
        titleId="login-title"
        description="Welcome back! Log in to keep playing."
        footer={
          <>
            New to GuessMoji? <Link href="/register">Create a new account</Link>
          </>
        }
      >
        <LoginForm
          redirectTo={safeRedirectPath(next)}
          notice={
            reset === "1"
              ? "Password updated. Log in with your new password."
              : verified === "1"
                ? "Email verified. Log in to start playing."
                : undefined
          }
        />
      </AuthCard>
    </AuthPageShell>
  );
}
