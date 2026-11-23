import { expect, test } from "@playwright/test";
import {
  expectNoHorizontalScroll,
  formAlert,
  GOOD_PASSWORD,
  linkFromEmail,
  login,
  mailCount,
  register,
  registerAndVerify,
  uniqueEmail,
  withDb,
} from "./helpers";

/**
 * Authentication acceptance tests, run against the real app (production build,
 * SQLite database, SMTP email) in desktop and mobile Chrome. No mocks.
 */

test.describe("Registration", () => {
  test("01 successful registration", async ({ page }, info) => {
    const email = uniqueEmail(info);
    await page.goto("/register");
    await expect(page.getByText("Password must include:")).toBeVisible(); // shown before submitting
    await expectNoHorizontalScroll(page);

    await register(page, email);
    await expect(page).toHaveURL(/\/register\/check-email$/);
    await expect(page.getByRole("status")).toContainText("We sent a verification link");
    await expectNoHorizontalScroll(page);

    await linkFromEmail(email, /verify/i, "/verify-email");
    const row = withDb((db) => db.prepare("SELECT email_verified, password_hash FROM users WHERE email = ?").get(email)) as {
      email_verified: number;
      password_hash: string;
    };
    expect(row.email_verified).toBe(0); // not verified just because the format is valid
    expect(row.password_hash).toMatch(/^scrypt\$/);
    expect(row.password_hash).not.toContain(GOOD_PASSWORD);
  });

  test("02 invalid email format", async ({ page, request }, info) => {
    await register(page, "player@example");
    await expect(page.getByText("Enter a valid email address, like name@example.com.")).toBeVisible();
    await expect(page.getByLabel("Email Address", { exact: true })).toHaveAttribute("aria-invalid", "true");
    await expect(page).toHaveURL(/\/register$/);

    // Backend enforces it too, even if the browser check is bypassed.
    const res = await request.post("/api/auth/register", { data: { email: "player@example", password: GOOD_PASSWORD } });
    expect(res.status()).toBe(400);
    expect((await res.json()).fieldErrors.email).toBeTruthy();
    expect(mailCount(uniqueEmail(info))).toBe(0);
  });

  test("03 duplicate email address", async ({ page }, info) => {
    const email = uniqueEmail(info);
    await register(page, email);
    await expect(page).toHaveURL(/\/register\/check-email$/);

    await register(page, email.toUpperCase()); // case doesn't make it a different email
    await expect(formAlert(page)).toContainText("already exists");
    await expect(page.getByText("This email is already registered.")).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
    expect(withDb((db) => db.prepare("SELECT COUNT(*) AS n FROM users WHERE email = ?").get(email))).toEqual({ n: 1 });
  });

  const weakPasswords = [
    { id: "04", name: "shorter than 7 characters", password: "Ab#def", unmet: "At least 7 characters" },
    { id: "05", name: "missing uppercase letter", password: "abcdef#1", unmet: "One uppercase letter (A–Z)" },
    { id: "06", name: "missing lowercase letter", password: "ABCDEF#1", unmet: "One lowercase letter (a–z)" },
    { id: "07", name: "missing special character", password: "Abcdefg1", unmet: "One special character (e.g. ! @ # $ % & *)" },
  ];
  for (const c of weakPasswords) {
    test(`${c.id} password ${c.name}`, async ({ page, request }, info) => {
      const email = uniqueEmail(info);
      await register(page, email, c.password);

      await expect(page.getByText("Password does not meet all of the requirements below.")).toBeVisible();
      const item = page.getByRole("listitem").filter({ hasText: c.unmet });
      await expect(item).toHaveAttribute("data-met", "false");
      await expect(page).toHaveURL(/\/register$/);

      const res = await request.post("/api/auth/register", { data: { email, password: c.password } });
      expect(res.status()).toBe(400);
      expect((await res.json()).fieldErrors.password).toBeTruthy();
      expect(withDb((db) => db.prepare("SELECT COUNT(*) AS n FROM users WHERE email = ?").get(email))).toEqual({ n: 0 });
    });
  }

  test("08 password confirmation mismatch", async ({ page }, info) => {
    const email = uniqueEmail(info);
    await register(page, email, GOOD_PASSWORD, "Emoji#27");
    await expect(page.getByText("Passwords do not match.")).toBeVisible();
    await expect(page.getByLabel("Confirm Password", { exact: true })).toHaveAttribute("aria-invalid", "true");
    await expect(page).toHaveURL(/\/register$/);
    expect(withDb((db) => db.prepare("SELECT COUNT(*) AS n FROM users WHERE email = ?").get(email))).toEqual({ n: 0 });
  });
});

test.describe("Email verification", () => {
  test("09 successful email verification", async ({ page }, info) => {
    const email = uniqueEmail(info);
    await register(page, email);
    const link = await linkFromEmail(email, /verify/i, "/verify-email");

    await page.goto(link);
    await expectNoHorizontalScroll(page);
    await page.getByRole("button", { name: "Verify my email" }).click();
    await expect(page).toHaveURL(/\/login\?verified=1$/);
    await expect(page.getByRole("status")).toHaveText("Email verified. Log in to start playing.");
    expect(withDb((db) => db.prepare("SELECT email_verified AS v FROM users WHERE email = ?").get(email))).toEqual({ v: 1 });
  });

  test("10 invalid verification token", async ({ page }) => {
    await page.goto("/verify-email?token=not-a-real-token");
    await page.getByRole("button", { name: "Verify my email" }).click();
    await expect(formAlert(page)).toHaveText("This verification link is invalid or has already been used.");
    await expect(page.getByRole("link", { name: "Resend verification email" })).toBeVisible();

    await page.goto("/verify-email");
    await expect(formAlert(page)).toContainText("invalid");
  });

  test("11 expired verification token", async ({ page }, info) => {
    const email = uniqueEmail(info);
    await register(page, email);
    const link = await linkFromEmail(email, /verify/i, "/verify-email");

    // Simulate 24+ hours passing.
    withDb((db) =>
      db
        .prepare(
          "UPDATE email_verification_tokens SET expires_at = ? WHERE user_id = (SELECT id FROM users WHERE email = ?)",
        )
        .run(Date.now() - 1000, email),
    );
    await page.goto(link);
    await page.getByRole("button", { name: "Verify my email" }).click();
    await expect(formAlert(page)).toHaveText("This verification link has expired.");
    expect(withDb((db) => db.prepare("SELECT email_verified AS v FROM users WHERE email = ?").get(email))).toEqual({ v: 0 });
  });

  test("12 reused verification token", async ({ page }, info) => {
    const email = uniqueEmail(info);
    await register(page, email);
    const link = await linkFromEmail(email, /verify/i, "/verify-email");
    await page.goto(link);
    await page.getByRole("button", { name: "Verify my email" }).click();
    await expect(page).toHaveURL(/\/login\?verified=1$/);

    await page.goto(link);
    await page.getByRole("button", { name: "Verify my email" }).click();
    await expect(formAlert(page)).toHaveText("This verification link is invalid or has already been used.");
  });
});

test.describe("Login, home screen, and logout", () => {
  test("13 successful login", async ({ page }, info) => {
    const email = uniqueEmail(info);
    await registerAndVerify(page, email);

    await login(page, email, GOOD_PASSWORD);
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByRole("heading", { name: "Choose a category" })).toBeVisible();
    await expect(page.getByText(`Welcome, ${email}!`)).toBeVisible();
    await expect(page.getByRole("button", { name: "Log Out" })).toBeVisible();
    await expectNoHorizontalScroll(page);
    await page.screenshot({ path: info.outputPath("home.png"), fullPage: true });

    const cookie = (await page.context().cookies()).find((c) => c.name === "guessmoji_session");
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("Lax");
    expect(cookie?.secure).toBe(true);
    expect(await page.evaluate(() => document.cookie)).not.toContain("guessmoji_session");

    const me = await page.request.get("/api/me");
    expect(me.status()).toBe(200);
    expect((await me.json()).email).toBe(email);
  });

  test("14 incorrect password", async ({ page }, info) => {
    const email = uniqueEmail(info);
    await registerAndVerify(page, email);

    await login(page, email, "Wrong#26");
    await expect(formAlert(page)).toContainText("Incorrect email or password.");
    await expect(page).toHaveURL(/\/login$/);
    expect((await page.context().cookies()).some((c) => c.name === "guessmoji_session")).toBe(false);

    await login(page, uniqueEmail(info, "nobody"), GOOD_PASSWORD); // unknown email: same message
    await expect(formAlert(page)).toContainText("Incorrect email or password.");
  });

  test("15 unverified account login attempt", async ({ page }, info) => {
    const email = uniqueEmail(info);
    await register(page, email);
    await expect(page).toHaveURL(/\/register\/check-email$/);

    await login(page, email, GOOD_PASSWORD);
    await expect(formAlert(page)).toContainText("Please verify your email address before logging in.");
    await expect(page.getByRole("link", { name: "Resend verification email" })).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
    expect((await page.context().cookies()).some((c) => c.name === "guessmoji_session")).toBe(false);

    await page.goto("/home");
    await expect(page).toHaveURL(/\/login\?next=%2Fhome$/);
  });

  test("16 successful logout", async ({ page, browser }, info) => {
    const email = uniqueEmail(info);
    await registerAndVerify(page, email);
    await login(page, email, GOOD_PASSWORD);
    await expect(page).toHaveURL(/\/home$/);
    const oldCookies = await page.context().cookies();

    await page.getByRole("button", { name: "Log Out" }).click();
    await expect(page).toHaveURL(/\/login\?loggedOut=1$/);
    await expect(page.getByRole("status")).toHaveText("You have been logged out.");
    expect((await page.context().cookies()).some((c) => c.name === "guessmoji_session")).toBe(false);

    // Back button must not show the home screen.
    await page.goBack();
    await expect(page).not.toHaveURL(/\/home$/);
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login\?next=%2Fhome$/);

    // Replaying the old session cookie in a fresh browser is rejected by the page and the API.
    const ctx = await browser.newContext();
    await ctx.addCookies(oldCookies);
    const replay = await ctx.newPage();
    await replay.goto("/home");
    await expect(replay).toHaveURL(/\/login\?next=%2Fhome$/);
    expect((await replay.request.get("/api/me")).status()).toBe(401);
    await ctx.close();
  });

  test("17 home screen without authentication", async ({ page, context }) => {
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login\?next=%2Fhome$/);
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
    expect((await page.request.get("/api/me")).status()).toBe(401);

    // A forged session cookie doesn't get in either.
    await context.addCookies([{ name: "guessmoji_session", value: "forged", url: "http://localhost:3100" }]);
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login\?next=%2Fhome$/);
    expect((await page.request.get("/api/me")).status()).toBe(401);
  });
});

test.describe("Layout", () => {
  for (const route of ["/", "/login", "/register", "/forgot-password", "/verify-email/resend"]) {
    test(`no horizontal scrolling on ${route}`, async ({ page }) => {
      await page.goto(route);
      await expectNoHorizontalScroll(page);
    });
  }
});
