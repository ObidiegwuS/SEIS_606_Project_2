// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const sendVerificationEmail = vi.fn<(to: string, url: string) => Promise<void>>();
vi.mock("@/server/mailer", () => ({ sendVerificationEmail: (to: string, url: string) => sendVerificationEmail(to, url) }));

const { closeDb } = await import("@/server/db");
const { registerUser, resendVerification } = await import("@/server/registration");
const { loginUser } = await import("@/server/login");
const { consumeVerificationToken, RESEND_COOLDOWN_MS } = await import("@/server/users");
const { findSessionUser, deleteSession, SESSION_TTL_MS } = await import("@/server/sessions");

const APP = "http://localhost:3000";
const EMAIL = "player@example.com";
const PASSWORD = "Emoji#2026";

const tokenFromCall = (i: number) =>
  new URL(sendVerificationEmail.mock.calls[i][1]).searchParams.get("token")!;
const latestToken = () => tokenFromCall(sendVerificationEmail.mock.calls.length - 1);

async function registerAndVerify() {
  await registerUser({ email: EMAIL, password: PASSWORD }, APP);
  expect(consumeVerificationToken(latestToken())).toBe("verified");
}

beforeEach(() => {
  process.env.DATABASE_PATH = ":memory:";
  sendVerificationEmail.mockReset().mockResolvedValue();
});
afterEach(() => closeDb());

describe("loginUser", () => {
  it("rejects unknown emails and wrong passwords the same way (AT-04)", async () => {
    await registerAndVerify();
    expect(await loginUser({ email: "nobody@example.com", password: PASSWORD })).toEqual({ status: "bad_credentials" });
    expect(await loginUser({ email: EMAIL, password: "Emoji#2027" })).toEqual({ status: "bad_credentials" });
  });

  it("rejects blank input", async () => {
    expect(await loginUser({ email: "", password: "" })).toMatchObject({ status: "invalid" });
    expect(await loginUser(null)).toMatchObject({ status: "invalid" });
  });

  it("blocks an unverified account even with the correct password", async () => {
    await registerUser({ email: EMAIL, password: PASSWORD }, APP);
    expect(await loginUser({ email: EMAIL, password: PASSWORD })).toEqual({ status: "unverified" });
  });

  it("does not reveal verification status to someone with the wrong password", async () => {
    await registerUser({ email: EMAIL, password: PASSWORD }, APP);
    expect(await loginUser({ email: EMAIL, password: "Wrong#2026" })).toEqual({ status: "bad_credentials" });
  });

  it("logs in a verified account, case-insensitively, and creates a working session (AT-03)", async () => {
    await registerAndVerify();
    const out = await loginUser({ email: "  PLAYER@example.com ", password: PASSWORD });
    expect(out.status).toBe("ok");
    if (out.status !== "ok") return;
    expect(findSessionUser(out.token)).toMatchObject({ email: EMAIL });
  });
});

describe("sessions", () => {
  it("expire, can be deleted (logout), and reject forged tokens", async () => {
    await registerAndVerify();
    const out = await loginUser({ email: EMAIL, password: PASSWORD });
    if (out.status !== "ok") throw new Error("login failed");

    expect(findSessionUser("forged-token")).toBeNull();
    expect(findSessionUser(out.token, Date.now() + SESSION_TTL_MS + 1)).toBeNull();
    deleteSession(out.token);
    expect(findSessionUser(out.token)).toBeNull();
  });
});

describe("resendVerification", () => {
  it("sends a new link, invalidates the old one, and the new one allows login", async () => {
    await registerUser({ email: EMAIL, password: PASSWORD }, APP);
    const oldToken = latestToken();
    const later = Date.now() + RESEND_COOLDOWN_MS + 1;

    expect(await resendVerification({ email: "Player@Example.com" }, APP, later)).toEqual({ status: "accepted" });
    expect(sendVerificationEmail).toHaveBeenCalledTimes(2);
    const newToken = latestToken();
    expect(newToken).not.toBe(oldToken);

    expect(consumeVerificationToken(oldToken)).toBe("invalid");
    expect(consumeVerificationToken(newToken, later)).toBe("verified");
    expect((await loginUser({ email: EMAIL, password: PASSWORD })).status).toBe("ok");
  });

  it("does not resend within the cooldown window", async () => {
    await registerUser({ email: EMAIL, password: PASSWORD }, APP);
    expect(await resendVerification({ email: EMAIL }, APP)).toEqual({ status: "accepted" });
    expect(sendVerificationEmail).toHaveBeenCalledTimes(1);
  });

  it("gives the same response for unknown and already-verified emails without sending", async () => {
    await registerAndVerify();
    sendVerificationEmail.mockClear();
    const later = Date.now() + RESEND_COOLDOWN_MS + 1;
    expect(await resendVerification({ email: EMAIL }, APP, later)).toEqual({ status: "accepted" });
    expect(await resendVerification({ email: "nobody@example.com" }, APP, later)).toEqual({ status: "accepted" });
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("validates the email", async () => {
    expect(await resendVerification({ email: "nope" }, APP)).toMatchObject({ status: "invalid" });
  });

  it("reports send failures and lets the user retry right away", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await registerUser({ email: EMAIL, password: PASSWORD }, APP);
    const later = Date.now() + RESEND_COOLDOWN_MS + 1;

    sendVerificationEmail.mockRejectedValueOnce(new Error("SMTP down"));
    expect(await resendVerification({ email: EMAIL }, APP, later)).toEqual({ status: "email_failed" });
    expect(await resendVerification({ email: EMAIL }, APP, later + 1)).toEqual({ status: "accepted" });
    expect(consumeVerificationToken(latestToken(), later + 2)).toBe("verified");
  });
});
