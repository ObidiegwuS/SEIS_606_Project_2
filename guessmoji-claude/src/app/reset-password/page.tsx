import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { AuthPageShell } from "@/components/AuthPageShell";
import { FormAlert } from "@/components/FormAlert";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { checkResetToken } from "@/server/passwordReset";

export const metadata: Metadata = { title: "Reset password" };

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token = "" } = await searchParams;
  const state = checkResetToken(token);

  return (
    <AuthPageShell>
      <AuthCard
        eyebrow="Account help"
        title="Choose a new password"
        titleId="reset-title"
        footer={<Link href="/login">Back to log in</Link>}
      >
        {state === "valid" ? (
          <ResetPasswordForm token={token} />
        ) : (
          <>
            <FormAlert tone="error">
              {state === "expired"
                ? "This password reset link has expired."
                : "This password reset link is invalid or has already been used."}
            </FormAlert>
            <p>
              <Link href="/forgot-password">Request a new reset link</Link>
            </p>
          </>
        )}
      </AuthCard>
    </AuthPageShell>
  );
}
