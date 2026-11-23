// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/mailer", () => ({ sendVerificationEmail: vi.fn(), sendPasswordResetEmail: vi.fn() }));

const { closeDb, getDb } = await import("@/server/db");
const { hashPassword } = await import("@/server/password");
const { createSession } = await import("@/server/sessions");
const { getClientPuzzles, getProgress, submitAnswer } = await import("@/server/progress");
const { getCollection } = await import("@/server/puzzles");
const { POST } = await import("@/app/api/game/answer/route");

async function makeUser(email: string) {
  const id = crypto.randomUUID();
  getDb()
    .prepare("INSERT INTO users (id, email, password_hash, email_verified) VALUES (?, ?, ?, 1)")
    .run(id, email, await hashPassword("Emoji#2026"));
  return { id, token: createSession(id).token };
}

function post(body: unknown, token?: string) {
  return POST(
    new NextRequest("http://localhost:3000/api/game/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { cookie: `guessmoji_session=${token}` } : {}) },
      body: JSON.stringify(body),
    }),
  );
}

const lionKing = () => getCollection("movies").find((p) => p.id === "movie-001")!;

beforeEach(() => {
  process.env.DATABASE_PATH = ":memory:";
});
afterEach(() => closeDb());

describe("separate collections (AT-05, AT-06)", () => {
  it("movies and countries load different puzzles", () => {
    const movies = getCollection("movies").map((p) => p.id);
    const countries = getCollection("countries").map((p) => p.id);
    expect(movies.every((id) => id.startsWith("movie-"))).toBe(true);
    expect(countries.every((id) => id.startsWith("country-"))).toBe(true);
  });

  it("never sends unsolved answers to the browser", async () => {
    const { id } = await makeUser("a@example.com");
    const puzzles = getClientPuzzles(id, "movies");
    expect(puzzles.every((p) => !("answer" in p))).toBe(true);
    expect(JSON.stringify(puzzles)).not.toContain("Lion King");
    expect(JSON.stringify(puzzles)).not.toContain('"accepted"');
  });
});

describe("submitAnswer", () => {
  it("awards points for a correct answer (AT-07) and reveals it after solving", async () => {
    const { id } = await makeUser("a@example.com");
    expect(submitAnswer(id, { puzzleId: "movie-001", answer: "the lion king" })).toMatchObject({
      status: "correct",
      pointsAwarded: 10,
      alreadySolved: false,
      score: 10,
    });
    expect(getClientPuzzles(id, "movies")[0]).toMatchObject({ solved: true, answer: lionKing().answer });
  });

  it("gives no points for an incorrect answer (AT-08)", async () => {
    const { id } = await makeUser("a@example.com");
    expect(submitAnswer(id, { puzzleId: "movie-001", answer: "Bambi" })).toEqual({ status: "incorrect", score: 0 });
    expect(getProgress(id).score).toBe(0);
  });

  it("rejects blank answers (AT-10)", async () => {
    const { id } = await makeUser("a@example.com");
    expect(submitAnswer(id, { puzzleId: "movie-001", answer: "   " })).toEqual({ status: "blank" });
    expect(submitAnswer(id, { puzzleId: "movie-001" })).toEqual({ status: "blank" });
  });

  it("never awards duplicate points (AT-11)", async () => {
    const { id } = await makeUser("a@example.com");
    submitAnswer(id, { puzzleId: "country-002", answer: "France" });
    expect(submitAnswer(id, { puzzleId: "country-002", answer: "FRANCE" })).toMatchObject({
      status: "correct",
      pointsAwarded: 0,
      alreadySolved: true,
      score: 10,
    });
    expect(getDb().prepare("SELECT COUNT(*) AS n FROM puzzle_completions").get()).toEqual({ n: 1 });
  });

  it("tracks progress per category and keeps players separate (AT-13)", async () => {
    const a = await makeUser("a@example.com");
    const b = await makeUser("b@example.com");
    submitAnswer(a.id, { puzzleId: "movie-001", answer: "Lion King" });
    submitAnswer(a.id, { puzzleId: "country-001", answer: "Canada" });
    expect(getProgress(a.id)).toMatchObject({
      score: 20,
      categories: { movies: { solved: 1, total: 10 }, countries: { solved: 1, total: 10 } },
    });
    expect(getProgress(b.id).score).toBe(0);
    expect(getClientPuzzles(b.id, "movies")[0].solved).toBe(false);
  });

  it("rejects unknown puzzles and over-long answers", async () => {
    const { id } = await makeUser("a@example.com");
    expect(submitAnswer(id, { puzzleId: "movie-999", answer: "x" })).toEqual({ status: "unknown_puzzle" });
    expect(submitAnswer(id, { puzzleId: "movie-001", answer: "a".repeat(101) })).toEqual({ status: "too_long" });
  });
});

describe("POST /api/game/answer", () => {
  it("requires a logged-in, verified user", async () => {
    expect((await post({ puzzleId: "movie-001", answer: "Lion King" })).status).toBe(401);
    expect((await post({ puzzleId: "movie-001", answer: "Lion King" }, "forged")).status).toBe(401);
  });

  it("records points for the session's user only, ignoring any userId in the body", async () => {
    const a = await makeUser("a@example.com");
    const b = await makeUser("b@example.com");
    const res = await post({ puzzleId: "movie-001", answer: "Lion King", userId: b.id }, a.token);
    expect(await res.json()).toMatchObject({ result: "correct", pointsAwarded: 10, score: 10 });
    expect(getProgress(a.id).score).toBe(10);
    expect(getProgress(b.id).score).toBe(0);
  });

  it("returns already_solved with 0 points on repeat, 400 on blank, and no-store", async () => {
    const a = await makeUser("a@example.com");
    await post({ puzzleId: "movie-002", answer: "titanic" }, a.token);
    const again = await post({ puzzleId: "movie-002", answer: "Titanic" }, a.token);
    expect(await again.json()).toMatchObject({ result: "already_solved", pointsAwarded: 0, score: 10 });
    expect(again.headers.get("cache-control")).toBe("no-store");
    expect((await post({ puzzleId: "movie-002", answer: " " }, a.token)).status).toBe(400);
  });
});
