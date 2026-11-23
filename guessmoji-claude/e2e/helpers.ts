import { expect, type Locator, type Page, type TestInfo } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export const GOOD_PASSWORD = "Emoji#26";

/** A fresh, fictional address per test so tests can run in parallel. */
export function uniqueEmail(info: TestInfo, tag = "user") {
  const id = `${info.project.name}-${info.workerIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return `${tag}-${id}@example.com`;
}

type Mail = { to: string[]; subject: string; body: string };

function mailsTo(email: string): Mail[] {
  const dir = path.join(process.env.E2E_DIR!, "mail");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as Mail)
    .filter((m) => m.to.includes(email));
}

/** Waits for the newest email to `email` whose subject matches, and returns the link in it. */
export async function linkFromEmail(email: string, subject: RegExp, pathPrefix: string): Promise<string> {
  let link: string | undefined;
  await expect
    .poll(
      () => {
        const mail = mailsTo(email).filter((m) => subject.test(m.subject)).at(-1);
        link = mail?.body.match(new RegExp(`https?://[^\\s"<>]+${pathPrefix}\\?token=[A-Za-z0-9_-]+`))?.[0];
        return link;
      },
      { message: `waiting for "${subject}" email to ${email}`, timeout: 10_000 },
    )
    .toBeTruthy();
  return link!;
}

export function mailCount(email: string) {
  return mailsTo(email).length;
}

/** Direct DB access, used only to simulate the passage of time (expired links). */
export function withDb<T>(fn: (db: DatabaseSync) => T): T {
  const db = new DatabaseSync(process.env.E2E_DB!);
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

export async function register(page: Page, email: string, password = GOOD_PASSWORD, confirm = password) {
  await page.goto("/register");
  await page.getByLabel("Email Address", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm Password", { exact: true }).fill(confirm);
  await page.getByRole("button", { name: "Create Account" }).click();
}

export async function registerAndVerify(page: Page, email: string, password = GOOD_PASSWORD) {
  await register(page, email, password);
  await expect(page).toHaveURL(/\/register\/check-email$/);
  const link = await linkFromEmail(email, /verify/i, "/verify-email");
  await page.goto(link);
  await page.getByRole("button", { name: "Verify my email" }).click();
  await expect(page).toHaveURL(/\/login\?verified=1$/);
}

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log In" }).click();
}

/** Fails if the page scrolls sideways (layout broken at this viewport). */
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "page should not scroll horizontally").toBeLessThanOrEqual(0);
}

/** The page's own form alert (excludes Next.js's empty, built-in route announcer). */
export function formAlert(page: Page): Locator {
  return page.locator('[role="alert"]:not(#__next-route-announcer__)');
}
