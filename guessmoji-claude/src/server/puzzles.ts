import "server-only";
import countriesData from "@/data/puzzles/countries.json";
import moviesData from "@/data/puzzles/movies.json";
import { CATEGORY_SLUGS, type CategorySlug } from "@/lib/game/categories";

/**
 * Puzzle collections — one separate file per category. Answers stay on the
 * server; clients only ever receive the emojis and hint (see toClientPuzzle).
 */
export type Puzzle = {
  id: string;
  category: CategorySlug;
  emojis: string;
  answer: string;
  accepted: string[];
  hint: string;
};

type RawCollection = { category: string; puzzles: Omit<Puzzle, "category">[] };

function load(raw: RawCollection, category: CategorySlug): Puzzle[] {
  if (raw.category !== category) throw new Error(`Puzzle file for ${category} has category ${raw.category}`);
  return raw.puzzles.map((p) => ({ ...p, category }));
}

const COLLECTIONS: Record<CategorySlug, Puzzle[]> = {
  movies: load(moviesData, "movies"),
  countries: load(countriesData, "countries"),
};

const BY_ID = new Map<string, Puzzle>();
for (const slug of CATEGORY_SLUGS) {
  for (const puzzle of COLLECTIONS[slug]) {
    if (BY_ID.has(puzzle.id)) throw new Error(`Duplicate puzzle id ${puzzle.id}`);
    BY_ID.set(puzzle.id, puzzle);
  }
}

export function getCollection(category: CategorySlug): Puzzle[] {
  return COLLECTIONS[category];
}

export function findPuzzle(id: string): Puzzle | undefined {
  return BY_ID.get(id);
}
