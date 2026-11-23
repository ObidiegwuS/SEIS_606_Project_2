// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const sendVerificationEmail = vi.fn<(to: string, url: string) => Promise<void>>();
const sendPasswordResetEmail = vi.fn<(to: string, url: string) => Promise<void>>();
vi.mock("@/server/mailer", () => ({
  sendVerificationEmail: (to: string, url: string) => sendVerificationEmail(to, url),
  sendPasswordResetEmail: (to: string, url: string) => sendPasswordResetEmail(to, url),
}));

const { closeDb, getDb } = await import("@/server/db");
const { registerUser } = await import("@/server/registration");
const { loginUser, LOCKOUT_MS, MAX_FAILED_LOGINS } = await import("@/server/login");
const { consumeVerificationToken } = await import("@/server/users");
const { findSessionUser } = await import("@/server/sessions");
const { requestPasswordReset, resetPassword, checkResetToken, RESET_TOKEN_TTL_MS, RESET_COOLDOWN_MS } = await import(
  "@/server/passwordReset"
);

const APP = "http://localhost:3000";
const EMAIL = "player@example.com";
const PASSWORD = "Emoji#2026";
const WRONG = { email: EMAIL, password: "Wrong#2026" };
const RIGHT = { email: EMAIL, password: PASSWORD };

const tokenOf = (fn: typeof sendVerificationEmail) =>
  new URL(fn.mock.calls.at(-1)![1]).searchParams.get("token")!;

async function registerAndVerify() {
  await registerUser(RIGHT, APP);
  expect(consumeVerificationToken(tokenOf(sendVerificationEmail))).toBe("verified");
}

beforeEach(() => {
  process.env.DATABASE_PATH = ":memory:";
  sendVerificationEmail.mockReset().mockResolvedValue();
  sendPasswordResetEmail.mockReset().mockResolvedValue();
});
afterEach(() => closeDb());

describe("login lockout", () => {
  it("allows 3 tries, then locks the account for 24 hours even with the right password", async () => {
    await registerAndVerify();
    const t0 = Date.now();
    expect(MAX_FAILED_LOGINS).toBe(3);

    expect((await loginUser(WRONG, t0)).status).toBe("bad_credentials");
    expect((await loginUser(WRONG, t0 + 1)).status).toBe("bad_credentials");
    const third = await loginUser(WRONG, t0 + 2);
    expect(third).toEqual({ status: "locked", lockedUntil: t0 + 2 + LOCKOUT_MS });

    expect((await loginUser(RIGHT, t0 + 3)).status).toBe("locked");
    expect((await loginUser(RIGHT, t0 + 2 + LOCKOUT_MS - 1)).status).toBe("locked");
    expect((await loginUser(RIGHT, t0 + 2 + LOCKOUT_MS + 1)).status).toBe("ok");
  });

  it("does not count further guesses or extend the lock while locked", async () => {
    await registerAndVerify();
    const t0 = Date.now();
    for (let i = 0; i < 3; i++) await loginUser(WRONG, t0);
    await loginUser(WRONG, t0 + 1000);
    const row = getDb().prepare("SELECT locked_until, failed_login_count FROM users").get();
    expect(row).toEqual({ locked_until: t0 + LOCKOUT_MS, failed_login_count: 0 });
  });

  it("resets the count after a successful login", async () => {
    await registerAndVerify();
    await loginUser(WRONG);
    await loginUser(WRONG);
    expect((await loginUser(RIGHT)).status).toBe("ok");
    await loginUser(WRONG);
    await loginUser(WRONG);
    expect((await loginUser(RIGHT)).status).toBe("ok");
  });

  it("counts wrong passwords on unverified accounts too", async () => {
    await registerUser(RIGHT, APP);
    for (let i = 0; i < 2; i++) expect((await loginUser(WRONG)).status).toBe("bad_credentials");
    expect((await loginUser(WRONG)).status).toBe("locked");
    expect((await loginUser(RIGHT)).status).toBe("locked");
  });

  it("gives a fresh set of 3 tries after the lock expires", async () => {
    await registerAndVerify();
    const t0 = Date.now();
    for (let i = 0; i < 3; i++) await loginUser(WRONG, t0);
    const after = t0 + LOCKOUT_MS + 1;
    expect((await loginUser(WRONG, after)).status).toBe("bad_credentials");
    expect((await loginUser(WRONG, after)).status).toBe("bad_credentials");
    expect((await loginUser(WRONG, after)).status).toBe("locked");
  });

  it("unknown emails return bad_credentials and never lock", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await loginUser({ email: "nobody@example.com", password: "x" })).status).toBe("bad_credentials");
    }
  });
});

describe("forgot / reset password", () => {
  it("emails a reset link only for registered addresses, with the same response either way", async () => {
    await registerAndVerify();
    expect(await requestPasswordReset({ email: "nobody@example.com" }, APP)).toEqual({ status: "accepted" });
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();

    expect(await requestPasswordReset({ email: " Player@Example.com" }, APP)).toEqual({ status: "accepted" });
    expect(sendPasswordResetEmail).toHaveBeenCalledOnce();
    const [to, link] = sendPasswordResetEmail.mock.calls[0];
    expect(to).toBe(EMAIL);
    expect(link).toMatch(/^http:\/\/localhost:3000\/reset-password\?token=/);
  });

  it("validates the email", async () => {
    expect(await requestPasswordReset({ email: "nope" }, APP)).toMatchObject({ status: "invalid" });
  });

  it("changes the password, ends existing sessions, and the link is single-use", async () => {
    await registerAndVerify();
    const login = await loginUser(RIGHT);
    if (login.status !== "ok") throw new Error("login failed");

    await requestPasswordReset({ email: EMAIL }, APP);
    const token = tokenOf(sendPasswordResetEmail);
    expect(checkResetToken(token)).toBe("valid");

    expect(await resetPassword({ token, password: "NewPass!1" })).toEqual({ status: "reset" });
    expect(findSessionUser(login.token)).toBeNull();
    expect((await loginUser(RIGHT)).status).toBe("bad_credentials");
    expect((await loginUser({ email: EMAIL, password: "NewPass!1" })).status).toBe("ok");

    expect(checkResetToken(token)).toBe("invalid");
    expect(await resetPassword({ token, password: "Another!1" })).toEqual({ status: "invalid_token" });
  });

  it("enforces the password rules and keeps the link usable after a rejected password", async () => {
    await registerAndVerify();
    await requestPasswordReset({ email: EMAIL }, APP);
    const token = tokenOf(sendPasswordResetEmail);
    expect(await resetPassword({ token, password: "weakpass" })).toMatchObject({ status: "invalid" });
    expect(checkResetToken(token)).toBe("valid");
  });

  it("rejects expired and forged links", async () => {
    await registerAndVerify();
    const t0 = Date.now();
    await requestPasswordReset({ email: EMAIL }, APP, t0);
    const token = tokenOf(sendPasswordResetEmail);
    expect(await resetPassword({ token, password: "NewPass!1" }, t0 + RESET_TOKEN_TTL_MS + 1)).toEqual({
      status: "expired_token",
    });
    expect(await resetPassword({ token: "forged", password: "NewPass!1" })).toEqual({ status: "invalid_token" });
  });

  it("a new request invalidates the earlier link, after a cooldown", async () => {
    await registerAndVerify();
    const t0 = Date.now();
    await requestPasswordReset({ email: EMAIL }, APP, t0);
    const first = tokenOf(sendPasswordResetEmail);

    await requestPasswordReset({ email: EMAIL }, APP, t0 + 1000); // within cooldown: no new email
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);

    await requestPasswordReset({ email: EMAIL }, APP, t0 + RESET_COOLDOWN_MS + 1);
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(2);
    expect(checkResetToken(first, t0 + RESET_COOLDOWN_MS + 2)).toBe("invalid");
    expect(checkResetToken(tokenOf(sendPasswordResetEmail), t0 + RESET_COOLDOWN_MS + 2)).toBe("valid");
  });

  it("unlocks a locked account and verifies an unverified email", async () => {
    await registerUser(RIGHT, APP); // unverified
    for (let i = 0; i < 3; i++) await loginUser(WRONG);
    expect((await loginUser(RIGHT)).status).toBe("locked");

    await requestPasswordReset({ email: EMAIL }, APP);
    await resetPassword({ token: tokenOf(sendPasswordResetEmail), password: "NewPass!1" });
    expect((await loginUser({ email: EMAIL, password: "NewPass!1" })).status).toBe("ok");
  });

  it("reports email failure and allows an immediate retry", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await registerAndVerify();
    sendPasswordResetEmail.mockRejectedValueOnce(new Error("SMTP down"));
    expect(await requestPasswordReset({ email: EMAIL }, APP)).toEqual({ status: "email_failed" });
    expect(await requestPasswordReset({ email: EMAIL }, APP)).toEqual({ status: "accepted" });
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(2);
  });
});
