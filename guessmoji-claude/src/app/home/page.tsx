import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { AuthPageShell } from "@/components/AuthPageShell";
import { Button } from "@/components/Button";
import { getCurrentUser } from "@/lib/auth/session";
import { logoutAction } from "./actions";

export const metadata: Metadata = { title: "Home" };

// Never cache: the result depends on the requester's session.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/home");

  return (
    <AuthPageShell>
      <AuthCard eyebrow="Logged in" title="Welcome back!" titleId="home-title" description={`Signed in as ${user.email}`}>
        <p>The game will live here.</p>
        <form action={logoutAction}>
          <Button type="submit" variant="secondary" fullWidth>
            Log Out
          </Button>
        </form>
      </AuthCard>
    </AuthPageShell>
  );
}
