"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { deleteSession } from "@/server/sessions";

/**
 * Logs out: deletes the session on the server (so the old cookie can never be
 * reused), clears the cookie in the browser, and sends the user to login.
 */
export async function logoutAction() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) deleteSession(token);
  store.delete(SESSION_COOKIE);
  redirect("/login?loggedOut=1");
}
