import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { AuthPageShell } from "@/components/AuthPageShell";
import { Button } from "@/components/Button";
import { FormAlert } from "@/components/FormAlert";
import { verifyEmailAction } from "./actions";

export const metadata: Metadata = { title: "Verify your email" };

type Props = { searchParams: Promise<{ token?: string; status?: string }> };

const FAILURE: Record<string, string> = {
  invalid: "This verification link is invalid or has already been used.",
  expired: "This verification link has expired.",
};

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token, status } = await searchParams;
  const failure = status ? (FAILURE[status] ?? FAILURE.invalid) : !token ? FAILURE.invalid : null;

  return (
    <AuthPageShell>
      <AuthCard
        eyebrow="Almost there"
        title="Verify your email"
        titleId="verify-title"
        footer={<Link href="/login">Back to log in</Link>}
      >
        {failure ? (
          <>
            <FormAlert tone="error">{failure}</FormAlert>
            <p>
              Need a new link? <Link href="/verify-email/resend">Resend verification email</Link>
            </p>
          </>
        ) : (
          <form action={verifyEmailAction}>
            <input type="hidden" name="token" value={token} />
            <p>Confirm that this is your email address to finish setting up your account.</p>
            <Button type="submit" fullWidth>
              Verify my email
            </Button>
          </form>
        )}
      </AuthCard>
    </AuthPageShell>
  );
}
