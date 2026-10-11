/**
 * Chasing π (Maths Outliers). Pure functions for the PiLab sim: Archimedes' polygons inside and
 * outside a circle of diameter 1, Madhava's series π ÷ 4 = 1 − 1/3 + 1/5 − ..., his end
 * correction n ÷ (4n² + 1), and Aryabhata's value 3.1416.
 */

/** Sides the polygon mode allows, and terms the series mode allows. */
export const SIDES = { min: 3, max: 400 };
export const TERMS = { min: 1, max: 500 };

/** Perimeter of a regular n-gon inside a circle of diameter 1 (corners on the circle). */
export function inner(n: number) {
  return n * Math.sin(Math.PI / n);
}

/** Perimeter of a regular n-gon outside a circle of diameter 1 (sides touching the circle). */
export function outer(n: number) {
  return n * Math.tan(Math.PI / n);
}

/**
 * Archimedes' doubling, which needs only square roots: from the n-gon perimeters (outside a, inside b)
 * the 2n-gon has outside 2ab ÷ (a + b) and inside √(that × b). Starts from the hexagon: 2√3 and 3.
 */
export function archimedes(doublings: number) {
  let a = 2 * Math.sqrt(3);
  let b = 3;
  let n = 6;
  for (let k = 0; k < doublings; k++) {
    a = (2 * a * b) / (a + b);
    b = Math.sqrt(a * b);
    n *= 2;
  }
  return { n, outer: a, inner: b };
}

/** 1 − 1/3 + 1/5 − ... to n terms. */
export function madhavaSum(n: number) {
  let s = 0;
  for (let k = 0; k < n; k++) s += (k % 2 ? -1 : 1) / (2 * k + 1);
  return s;
}

/** Madhava's end correction after n terms: n ÷ (4n² + 1), added when the last term was taken away. */
export function correction(n: number) {
  return ((n % 2 ? -1 : 1) * n) / (4 * n * n + 1);
}

/** The series' estimate of π after n terms: 4 × the sum, with or without the end correction. */
export function madhavaPi(n: number, corrected = false) {
  return 4 * (madhavaSum(n) + (corrected ? correction(n) : 0));
}

/** Aryabhata's rule: add 4 to 100, times 8, add 62,000: the circumference of a circle 20,000 across. */
export const ARYABHATA = ((100 + 4) * 8 + 62000) / 20000;

/** x rounded to d decimal places. */
export function roundTo(x: number, d: number) {
  return Math.round(x * 10 ** d) / 10 ** d;
}

/** x written with exactly d decimals, rounded the same way as roundTo. */
export function fixed(x: number, d: number) {
  return roundTo(x, d).toFixed(d);
}

/** True when x and π agree once both are rounded to d decimal places. */
export function agrees(x: number, d: number) {
  return fixed(x, d) === fixed(Math.PI, d);
}

/** True when both polygons give π to d decimal places. */
export function polyPins(n: number, d: number) {
  return agrees(inner(n), d) && agrees(outer(n), d);
}

/** Fewest sides for which both polygons give π to d decimals. */
export function fewestSides(d: number) {
  for (let n = SIDES.min; n <= 100000; n++) if (polyPins(n, d)) return n;
  return Infinity;
}

/** Fewest terms for which the series gives π to d decimals. */
export function fewestTerms(d: number, corrected: boolean) {
  for (let n = 1; n <= 100000; n++) if (agrees(madhavaPi(n, corrected), d)) return n;
  return Infinity;
}

/** Challenge: find the fewest sides or terms that give π to some decimals. */
export interface PiRound {
  name: string;
  brief: string;
  kind: "poly" | "series";
  decimals: number;
  /** Series rounds only: use Madhava's end correction. */
  corrected?: boolean;
}

export function roundAnswer(r: PiRound) {
  return r.kind === "poly" ? fewestSides(r.decimals) : fewestTerms(r.decimals, !!r.corrected);
}

/** Does n (sides or terms) give π to the round's decimals? */
export function roundWorks(n: number, r: PiRound) {
  return r.kind === "poly" ? polyPins(n, r.decimals) : agrees(madhavaPi(n, !!r.corrected), r.decimals);
}
