/**
 * Sequences and progressions (NCERT Class 9 Ganita Manjari, "Predicting What Comes Next").
 * Pure functions for the SequenceLab sim: arithmetic progressions a, a + d, a + 2d, ...,
 * their nth term a + (n − 1) × d, their sum by pairing, and a doubling sequence to contrast.
 */

/** Term n of an AP: a + (n − 1) × d. */
export function apTerm(a: number, d: number, n: number) {
  return a + (n - 1) * d;
}

/** The first n terms of an AP. */
export function apTerms(a: number, d: number, n: number) {
  return Array.from({ length: n }, (_, i) => apTerm(a, d, i + 1));
}

/** Sum of the first n terms by pairing first with last: (n × (a + l)) ÷ 2. */
export function apSum(a: number, d: number, n: number) {
  return (n * (a + apTerm(a, d, n))) / 2;
}

/** Term n of a doubling sequence that starts at s: s × 2ⁿ⁻¹. */
export function doubleTerm(s: number, n: number) {
  return s * 2 ** (n - 1);
}

export function doubleTerms(s: number, n: number) {
  return Array.from({ length: n }, (_, i) => doubleTerm(s, i + 1));
}

/** The jar that gets the same amount every week: after week n it holds JAR_STEP × n. */
export const JAR_STEP = 50;
export function jarB(n: number) {
  return apTerm(JAR_STEP, JAR_STEP, n);
}

/** First week in which the doubling jar (starting at s) holds more than the ₹50-a-week jar. */
export function overtakeWeek(s: number) {
  for (let n = 1; n <= 64; n++) if (doubleTerm(s, n) > jarB(n)) return n;
  return null;
}

/** Each term minus the one before it. */
export function differences(xs: number[]) {
  return xs.slice(1).map((x, i) => x - xs[i]);
}

/** An AP has the same difference every time. */
export function isAP(xs: number[]) {
  const ds = differences(xs);
  return ds.every((v) => v === ds[0]);
}

/** A number with a real minus sign. */
export function num(v: number) {
  return v < 0 ? `−${Math.abs(v)}` : `${v}`;
}

const SUB = "₀₁₂₃₄₅₆₇₈₉";
/** A whole number written as a subscript: 12 → ₁₂. */
export function sub(n: number) {
  return `${n}`.replace(/\d/g, (c) => SUB[Number(c)]);
}

/** Slider ranges. Build: first term, difference, number of terms. Doubling: start and weeks. */
export const FIRST = { min: 1, max: 30, step: 1 };
export const DIFF = { min: 0, max: 10, step: 1 };
export const TERMS = { min: 1, max: 15, step: 1 };
export const START = { min: 1, max: 5, step: 1 };
export const WEEKS = { min: 1, max: 12, step: 1 };

/** Challenge: a pattern and a question about it. The student builds it in the lab and answers. */
export interface Forecast {
  name: string;
  brief: string;
  kind: "ap" | "double";
  /** First term (or start of the doubling). */
  a: number;
  /** Common difference; 0 for a doubling sequence. */
  d: number;
  n: number;
  ask: "term" | "sum";
  answer: number;
}

/** The right answer for a forecast, worked out from its pattern. */
export function forecastAnswer(f: Forecast) {
  if (f.kind === "double") return f.ask === "term" ? doubleTerm(f.a, f.n) : doubleTerms(f.a, f.n).reduce((s, x) => s + x, 0);
  return f.ask === "term" ? apTerm(f.a, f.d, f.n) : apSum(f.a, f.d, f.n);
}

/** Read a typed answer: digits, maybe with ₹ or commas or spaces. NaN if it is not a number. */
export function parseAnswer(text: string) {
  const t = text.replace(/[₹,\s]/g, "");
  return /^\d+$/.test(t) ? Number(t) : NaN;
}
