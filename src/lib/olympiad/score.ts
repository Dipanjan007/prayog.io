/**
 * Olympiad track scoring. Pure functions so they can be tested.
 * Start with 3 stars; each hint costs one. Opening the full solution before solving means 0 stars.
 */

export type Level = "warm-up" | "standard" | "olympiad";

/** Answers within ±2% of the true value count as correct. */
export const TOLERANCE = 0.02;
export const MAX_HINTS = 2;

/** XP for each star, by level. */
export const XP_PER_STAR: Record<Level, number> = { "warm-up": 10, standard: 20, olympiad: 35 };

export const LEVEL_LABEL: Record<Level, string> = { "warm-up": "Warm-up", standard: "Standard", olympiad: "Olympiad" };

/** Reads what a student typed: allows spaces, a comma as the decimal mark and a leading plus sign. */
export function parseAnswer(raw: string): number | null {
  const s = raw.trim().replace(/\s+/g, "").replace(",", ".").replace(/^\+/, "").replace(/^−/, "-");
  if (!/^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/i.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function isCorrect(value: number, answer: number) {
  return Math.abs(value - answer) <= TOLERANCE * Math.abs(answer) + 1e-12;
}

/**
 * The value the sim runs with. Within tolerance the sim plays the exact answer, so a correct
 * answer always shows the "just right" result. Otherwise it plays the student's own number.
 */
export function simValue(value: number, answer: number) {
  return isCorrect(value, answer) ? answer : value;
}

export function starsFor(hintsUsed: number, sawSolution: boolean) {
  if (sawSolution) return 0;
  return Math.max(0, 3 - Math.min(hintsUsed, MAX_HINTS));
}

export function xpFor(level: Level, stars: number) {
  return XP_PER_STAR[level] * stars;
}

/** Format a number for display with a fixed number of significant figures. */
export function fmt(n: number, sig = 3) {
  if (!Number.isFinite(n)) return "?";
  const abs = Math.abs(n);
  if (abs >= 10 ** sig) return Math.round(n).toString();
  return Number(n.toPrecision(sig)).toString();
}
