import { describe, expect, it } from "vitest";
import { isBlankAnswer, matchesAnswer, normalizeAnswer } from "@/lib/game/answers";
import countries from "@/data/puzzles/countries.json";
import movies from "@/data/puzzles/movies.json";

describe("answer matching (spec §4)", () => {
  it("ignores capitalization and extra spaces (AT-09)", () => {
    expect(matchesAnswer("  the LION   king ", "The Lion King", [])).toBe(true);
    expect(matchesAnswer("FRANCE", "France", [])).toBe(true);
  });
  it("ignores punctuation and accents", () => {
    expect(matchesAnswer("spider man", "Spider-Man", [])).toBe(true);
    expect(matchesAnswer("Mexicó", "Mexico", [])).toBe(true);
  });
  it("accepts listed alternatives only", () => {
    expect(matchesAnswer("holland", "Netherlands", ["Holland"])).toBe(true);
    expect(matchesAnswer("Lion", "The Lion King", ["Lion King"])).toBe(false);
    expect(matchesAnswer("Titanc", "Titanic", [])).toBe(false);
  });
  it("never matches blank input (AT-10)", () => {
    expect(isBlankAnswer("   ")).toBe(true);
    expect(matchesAnswer("   ", "Up", [])).toBe(false);
    expect(normalizeAnswer("!!")).toBe("");
  });
});

describe("puzzle collections", () => {
  for (const [name, data, prefix] of [
    ["movies", movies, "movie-"],
    ["countries", countries, "country-"],
  ] as const) {
    it(`${name} is a separate, well-formed collection`, () => {
      expect(data.category).toBe(name);
      expect(data.puzzles.length).toBeGreaterThan(0);
      const ids = new Set<string>();
      for (const p of data.puzzles) {
        expect(p.id.startsWith(prefix), p.id).toBe(true);
        expect(ids.has(p.id), `duplicate ${p.id}`).toBe(false);
        ids.add(p.id);
        expect(p.emojis.trim()).not.toBe("");
        expect(p.hint.trim()).not.toBe("");
        expect(normalizeAnswer(p.answer)).not.toBe("");
        expect(matchesAnswer(p.answer, p.answer, p.accepted)).toBe(true);
      }
    });
  }
  it("no puzzle id is shared between categories", () => {
    const movieIds = new Set(movies.puzzles.map((p) => p.id));
    expect(countries.puzzles.some((p) => movieIds.has(p.id))).toBe(false);
  });
});
