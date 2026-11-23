/**
 * Answer comparison rules (spec §4):
 * - capitalization and extra spaces don't matter
 * - accents and punctuation don't matter ("Spider-Man" = "spider man" = "SPIDERMAN")
 * - only the listed answer and accepted alternatives are correct
 */
export function normalizeAnswer(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "") // strip accents
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^\p{L}\p{N}]/gu, ""); // drop spaces and punctuation
}

export function isBlankAnswer(value: string): boolean {
  return value.trim().length === 0;
}

export function matchesAnswer(guess: string, answer: string, accepted: readonly string[]): boolean {
  const normalized = normalizeAnswer(guess);
  if (!normalized) return false;
  return [answer, ...accepted].some((candidate) => normalizeAnswer(candidate) === normalized);
}

export const MAX_ANSWER_LENGTH = 100;
