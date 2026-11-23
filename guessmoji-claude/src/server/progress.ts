import "server-only";
import { matchesAnswer, isBlankAnswer, MAX_ANSWER_LENGTH } from "@/lib/game/answers";
import { CATEGORY_SLUGS, POINTS_PER_PUZZLE, type CategorySlug } from "@/lib/game/categories";
import { getDb } from "./db";
import { findPuzzle, getCollection } from "./puzzles";

/**
 * Player progress. Every function takes the *logged-in* user's id from the
 * session — never from the request body — so players can only read and
 * change their own progress (AT-13).
 */

export type CategoryProgress = { solved: number; total: number; points: number };

export type Progress = {
  score: number;
  categories: Record<CategorySlug, CategoryProgress>;
};

export function getProgress(userId: string): Progress {
  const rows = getDb()
    .prepare("SELECT category, COUNT(*) AS solved, SUM(points) AS points FROM puzzle_completions WHERE user_id = ? GROUP BY category")
    .all(userId) as { category: string; solved: number; points: number }[];

  const categories = {} as Record<CategorySlug, CategoryProgress>;
  for (const slug of CATEGORY_SLUGS) {
    const row = rows.find((r) => r.category === slug);
    categories[slug] = { solved: row?.solved ?? 0, total: getCollection(slug).length, points: row?.points ?? 0 };
  }
  const score = Object.values(categories).reduce((sum, c) => sum + c.points, 0);
  return { score, categories };
}

export function getSolvedIds(userId: string, category: CategorySlug): Set<string> {
  const rows = getDb()
    .prepare("SELECT puzzle_id FROM puzzle_completions WHERE user_id = ? AND category = ?")
    .all(userId, category) as { puzzle_id: string }[];
  return new Set(rows.map((r) => r.puzzle_id));
}

/** What the browser is allowed to know about a puzzle. The answer is only included once solved. */
export type ClientPuzzle = { id: string; emojis: string; hint: string; solved: boolean; answer?: string };

export function getClientPuzzles(userId: string, category: CategorySlug): ClientPuzzle[] {
  const solved = getSolvedIds(userId, category);
  return getCollection(category).map((p) => ({
    id: p.id,
    emojis: p.emojis,
    hint: p.hint,
    solved: solved.has(p.id),
    ...(solved.has(p.id) ? { answer: p.answer } : {}),
  }));
}

export type AnswerOutcome =
  | { status: "blank" }
  | { status: "too_long" }
  | { status: "unknown_puzzle" }
  | { status: "incorrect"; score: number }
  | { status: "correct"; pointsAwarded: number; alreadySolved: boolean; answer: string; score: number };

export function submitAnswer(userId: string, input: unknown, now = Date.now()): AnswerOutcome {
  const body = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const puzzleId = typeof body.puzzleId === "string" ? body.puzzleId : "";
  const guess = typeof body.answer === "string" ? body.answer : "";

  if (isBlankAnswer(guess)) return { status: "blank" };
  if (guess.length > MAX_ANSWER_LENGTH) return { status: "too_long" };
  const puzzle = findPuzzle(puzzleId);
  if (!puzzle) return { status: "unknown_puzzle" };

  if (!matchesAnswer(guess, puzzle.answer, puzzle.accepted)) {
    return { status: "incorrect", score: getProgress(userId).score };
  }

  // INSERT OR IGNORE + primary key: a second correct answer can never add points.
  const { changes } = getDb()
    .prepare(
      `INSERT OR IGNORE INTO puzzle_completions (user_id, puzzle_id, category, points, completed_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(userId, puzzle.id, puzzle.category, POINTS_PER_PUZZLE, now);
  const awarded = Number(changes) === 1;

  return {
    status: "correct",
    pointsAwarded: awarded ? POINTS_PER_PUZZLE : 0,
    alreadySolved: !awarded,
    answer: puzzle.answer,
    score: getProgress(userId).score,
  };
}
