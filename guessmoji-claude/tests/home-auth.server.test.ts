// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const sendVerificationEmail = vi.fn<(to: string, url: string) => Promise<void>>();
vi.mock("@/server/mailer", () => ({
  sendVerificationEmail: (to: string, url: string) => sendVerificationEmail(to, url),
  sendPasswordResetEmail: vi.fn(),
}));

const { closeDb, getDb } = await import("@/server/db");
const { registerUser } = await import("@/server/registration");
const { loginUser } = await import("@/server/login");
const { consumeVerificationToken } = await import("@/server/users");
const { createSession, deleteSession, findSessionUser } = await import("@/server/sessions");
const { GET: getMe } = await import("@/app/api/me/route");

const APP = "http://localhost:3000";
const CREDS = { email: "player@example.com", password: "Emoji#2026" };

function request(cookie?: string) {
  return new NextRequest("http://localhost:3000/api/me", {
    headers: cookie ? { cookie: `guessmoji_session=${cookie}` } : {},
  });
}

async function verifiedSession() {
  await registerUser(CREDS, APP);
  const token = new URL(sendVerificationEmail.mock.calls.at(-1)![1]).searchParams.get("token")!;
  consumeVerificationToken(token);
  const out = await loginUser(CREDS);
  if (out.status !== "ok") throw new Error(`login failed: ${out.status}`);
  return out.token;
}

beforeEach(() => {
  process.env.DATABASE_PATH = ":memory:";
  sendVerificationEmail.mockReset().mockResolvedValue();
});
afterEach(() => closeDb());

describe("protected backend route /api/me", () => {
  it("returns 401 with no session cookie", async () => {
    const res = getMe(request());
    expect(res.status).toBe(401);
    expect(res.headers.get("cache-control")).toContain("no-store");
  });

  it("returns 401 for a forged session token", async () => {
    await verifiedSession();
    expect(getMe(request("forged-token")).status).toBe(401);
  });

  it("returns the user's own account info for a valid, verified session", async () => {
    const token = await verifiedSession();
    const res = getMe(request(token));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ email: CREDS.email, emailVerified: true });
    expect(new Date(body.memberSince).getTime()).not.toBeNaN();
    expect(body).not.toHaveProperty("password_hash");
  });

  it("rejects a session that belongs to an unverified account", async () => {
    await registerUser(CREDS, APP); // not verified, so login itself is refused...
    expect((await loginUser(CREDS)).status).toBe("unverified");
    // ...and even a session created directly for that user is not accepted.
    const { id } = getDb().prepare("SELECT id FROM users").get() as { id: string };
    const { token } = createSession(id);
    expect(findSessionUser(token)).toBeNull();
    expect(getMe(request(token)).status).toBe(401);
  });

  it("rejects the previous session after logout", async () => {
    const token = await verifiedSession();
    expect(getMe(request(token)).status).toBe(200);
    deleteSession(token);
    expect(getMe(request(token)).status).toBe(401);
  });
});
