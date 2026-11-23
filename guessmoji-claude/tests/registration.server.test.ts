// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const sendVerificationEmail = vi.fn<(to: string, url: string) => Promise<void>>();
vi.mock("@/server/mailer", () => ({ sendVerificationEmail: (to: string, url: string) => sendVerificationEmail(to, url) }));

const { closeDb, getDb } = await import("@/server/db");
const { registerUser } = await import("@/server/registration");
const { consumeVerificationToken, isEmailVerified, VERIFICATION_TOKEN_TTL_MS } = await import("@/server/users");
const { verifyPassword } = await import("@/server/password");

const APP = "http://localhost:3000";
const valid = { email: "Player@Example.com", password: "Emoji#2026" };

function sentToken(): string {
  const url = new URL(sendVerificationEmail.mock.calls.at(-1)![1]);
  return url.searchParams.get("token")!;
}

beforeEach(() => {
  process.env.DATABASE_PATH = ":memory:";
  sendVerificationEmail.mockReset().mockResolvedValue();
});
afterEach(() => closeDb());

describe("registerUser", () => {
  it("creates an unverified account and emails a verification link", async () => {
    expect(await registerUser(valid, APP)).toEqual({ status: "created" });

    const row = getDb().prepare("SELECT * FROM users").get() as Record<string, unknown>;
    expect(row.email).toBe("player@example.com");
    expect(row.email_verified).toBe(0);
    expect(row.password_hash).not.toContain("Emoji#2026");
    expect(await verifyPassword("Emoji#2026", row.password_hash as string)).toBe(true);
    expect(await verifyPassword("Emoji#2027", row.password_hash as string)).toBe(false);

    expect(sendVerificationEmail).toHaveBeenCalledOnce();
    const [to, link] = sendVerificationEmail.mock.calls[0];
    expect(to).toBe("player@example.com");
    expect(link).toMatch(/^http:\/\/localhost:3000\/verify-email\?token=/);
  });

  it("rejects a duplicate email, regardless of case (AT-02)", async () => {
    await registerUser(valid, APP);
    sendVerificationEmail.mockClear();
    expect(await registerUser({ ...valid, email: "  PLAYER@example.COM " }, APP)).toEqual({ status: "email_taken" });
    expect(sendVerificationEmail).not.toHaveBeenCalled();
    expect(getDb().prepare("SELECT COUNT(*) n FROM users").get()).toEqual({ n: 1 });
  });

  it("re-validates on the server and creates nothing for invalid input", async () => {
    const out = await registerUser({ email: "nope", password: "weak" }, APP);
    expect(out.status).toBe("invalid");
    expect(await registerUser(null, APP)).toMatchObject({ status: "invalid" });
    expect(await registerUser({ email: 5, password: [] }, APP)).toMatchObject({ status: "invalid" });
    expect(getDb().prepare("SELECT COUNT(*) n FROM users").get()).toEqual({ n: 0 });
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("rolls back the account if the verification email cannot be sent", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    sendVerificationEmail.mockRejectedValue(new Error("SMTP down"));
    expect(await registerUser(valid, APP)).toEqual({ status: "email_failed" });
    expect(getDb().prepare("SELECT COUNT(*) n FROM users").get()).toEqual({ n: 0 });

    sendVerificationEmail.mockResolvedValue();
    expect(await registerUser(valid, APP)).toEqual({ status: "created" });
  });
});

describe("email verification", () => {
  it("is not verified until the emailed token is used, and the token is single-use", async () => {
    await registerUser(valid, APP);
    expect(isEmailVerified("player@example.com")).toBe(false);

    const token = sentToken();
    expect(consumeVerificationToken("wrong-token")).toBe("invalid");
    expect(isEmailVerified("player@example.com")).toBe(false);

    expect(consumeVerificationToken(token)).toBe("verified");
    expect(isEmailVerified("player@example.com")).toBe(true);
    expect(consumeVerificationToken(token)).toBe("invalid");
  });

  it("rejects expired tokens", async () => {
    await registerUser(valid, APP);
    const later = Date.now() + VERIFICATION_TOKEN_TTL_MS + 1000;
    expect(consumeVerificationToken(sentToken(), later)).toBe("expired");
    expect(isEmailVerified("player@example.com")).toBe(false);
  });

  it("stores only a hash of the token", async () => {
    await registerUser(valid, APP);
    const rows = getDb().prepare("SELECT token_hash FROM email_verification_tokens").all() as { token_hash: string }[];
    expect(rows[0].token_hash).not.toBe(sentToken());
  });
});
