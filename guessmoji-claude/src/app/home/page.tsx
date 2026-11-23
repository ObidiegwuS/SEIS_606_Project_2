import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPageShell } from "@/components/AuthPageShell";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Home" };

// Never cache: the result depends on the requester's session.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/home");

  return (
    <AuthPageShell>
      <h1>Welcome back</h1>
      <p>You are logged in as {user.email}. The game will live here.</p>
    </AuthPageShell>
  );
}
