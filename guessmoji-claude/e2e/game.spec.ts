import { expect, test, type Page } from "@playwright/test";
import { expectNoHorizontalScroll, formAlert, GOOD_PASSWORD, login, registerAndVerify, uniqueEmail } from "./helpers";

/** Category selection and gameplay against the real app (AT-05 to AT-13). */

async function loggedIn(page: Page, info: Parameters<typeof uniqueEmail>[0]) {
  const email = uniqueEmail(info, "player");
  await registerAndVerify(page, email);
  await login(page, email, GOOD_PASSWORD);
  await expect(page).toHaveURL(/\/home$/);
  return email;
}

const score = (page: Page) => page.getByTestId("total-score");

async function answer(page: Page, text: string) {
  await page.getByLabel("Your answer", { exact: true }).fill(text);
  await page.getByRole("button", { name: "Submit Answer" }).click();
}

test("category screen appears right after login with both categories", async ({ page }, info) => {
  await loggedIn(page, info);
  await expect(page.getByRole("heading", { name: "Choose a category" })).toBeVisible();

  const movies = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Movies" }) });
  await expect(movies.getByRole("img", { name: /clapperboard/i })).toBeVisible();
  await expect(movies.getByText("Guess the movie title using emojis.")).toBeVisible();
  await expect(movies.getByRole("link", { name: "Play Movies" })).toBeVisible();

  const countries = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Countries" }) });
  await expect(countries.getByRole("img", { name: /globe/i })).toBeVisible();
  await expect(countries.getByText("Guess the country using emojis.")).toBeVisible();
  await expect(countries.getByRole("link", { name: "Play Countries" })).toBeVisible();

  await expect(page.getByRole("button", { name: "Log Out" })).toBeVisible();
  await expectNoHorizontalScroll(page);
  await page.screenshot({ path: info.outputPath("categories.png"), fullPage: true });
});

test("AT-05/AT-06: each category opens its own game and puzzle collection, with a way back", async ({ page }, info) => {
  await loggedIn(page, info);

  await page.getByRole("link", { name: "Play Movies" }).click();
  await expect(page).toHaveURL(/\/play\/movies$/);
  await expect(page.getByRole("heading", { level: 1, name: "Movies" })).toBeVisible();
  await expect(page.getByTestId("emoji-clue")).toHaveText("🦁👑");
  await expectNoHorizontalScroll(page);
  await page.screenshot({ path: info.outputPath("movies.png"), fullPage: true });

  await page.getByRole("link", { name: "Categories" }).click();
  await expect(page).toHaveURL(/\/home$/);

  await page.getByRole("link", { name: "Play Countries" }).click();
  await expect(page).toHaveURL(/\/play\/countries$/);
  await expect(page.getByRole("heading", { level: 1, name: "Countries" })).toBeVisible();
  await expect(page.getByTestId("emoji-clue")).toHaveText("🍁🏒🫎");
  await expect(page.getByRole("button", { name: "Log Out" })).toBeVisible();
});

test("AT-07 to AT-11: answering, hints, scoring, and no duplicate points", async ({ page }, info) => {
  await loggedIn(page, info);
  await page.goto("/play/movies");
  await expect(score(page)).toHaveText("0");

  // Hint
  await page.getByRole("button", { name: /show hint/i }).click();
  await expect(page.getByText(/young lion prince/)).toBeVisible();

  // AT-10 blank
  await answer(page, "   ");
  await expect(page.getByText("Enter an answer before submitting.")).toBeVisible();

  // AT-08 incorrect
  await answer(page, "Bambi");
  await expect(formAlert(page)).toHaveText("Not quite — try again. No points awarded.");
  await expect(score(page)).toHaveText("0");

  // AT-07 + AT-09 correct, odd capitalization and spacing
  await answer(page, "  tHe   LION king ");
  await expect(page.getByRole("status")).toHaveText("Correct! +10 points. The answer is The Lion King.");
  await expect(score(page)).toHaveText("10");
  await expect(page.getByText("1 of 10 solved")).toBeVisible();

  // AT-11: replaying the answer straight to the API earns nothing extra
  const replay = await page.request.post("/api/game/answer", { data: { puzzleId: "movie-001", answer: "The Lion King" } });
  expect(await replay.json()).toMatchObject({ result: "already_solved", pointsAwarded: 0, score: 10 });
  await page.reload();
  await expect(score(page)).toHaveText("10");

  // Next puzzle
  await expect(page.getByTestId("emoji-clue")).toHaveText("🚢🧊💔");
  await page.getByRole("button", { name: "← Previous" }).click();
  await expect(page.getByText("✓ Solved")).toBeVisible();
  await expect(page.getByLabel("Your answer", { exact: true })).toHaveCount(0);
});

test("AT-12: progress and score persist after logging out and back in", async ({ page }, info) => {
  const email = await loggedIn(page, info);
  await page.goto("/play/countries");
  await answer(page, "canada");
  await expect(score(page)).toHaveText("10");

  await page.getByRole("button", { name: "Log Out" }).click();
  await expect(page).toHaveURL(/\/login\?loggedOut=1$/);
  await login(page, email, GOOD_PASSWORD);
  await expect(page).toHaveURL(/\/home$/);

  await expect(score(page)).toHaveText("10");
  const countries = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Countries" }) });
  await expect(countries.getByText("1 of 10 solved")).toBeVisible();
  await page.getByRole("link", { name: "Play Countries" }).click();
  await expect(page.getByTestId("emoji-clue")).toHaveText("🗼🥐🍷"); // resumes at first unsolved
});

test("AT-13 and auth: game screens and answers need a valid session; progress is private", async ({ page, browser }, info) => {
  // Not logged in
  for (const path of ["/home", "/play/movies", "/play/countries"]) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(path)}$`));
  }
  expect((await page.request.post("/api/game/answer", { data: { puzzleId: "movie-001", answer: "Lion King" } })).status()).toBe(401);

  // Player A scores; player B sees none of it
  await loggedIn(page, info);
  await page.goto("/play/movies");
  await answer(page, "lion king");
  await expect(score(page)).toHaveText("10");

  const other = await browser.newContext();
  const pageB = await other.newPage();
  await loggedIn(pageB, info);
  await expect(score(pageB)).toHaveText("0");
  await pageB.goto("/play/movies");
  await expect(pageB.getByTestId("emoji-clue")).toHaveText("🦁👑");
  await expect(pageB.getByText("0 of 10 solved")).toBeVisible();
  await other.close();

  // Unknown category
  const res = await page.goto("/play/sports");
  expect(res?.status()).toBe(404);
});
