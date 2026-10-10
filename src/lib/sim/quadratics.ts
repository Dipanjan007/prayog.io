/**
 * Quadratic equations (NCERT Class 10 Mathematics, Chapter 4 "Quadratic Equations").
 * Pure functions for the QuadraticLab sim: the curve y = ax² + bx + c, its roots,
 * the discriminant b² − 4ac, Sridharacharya's formula and the fenced-garden area puzzle.
 */

/** Slider settings. a skips 0, because then the equation is not quadratic. */
export const A_VALUES = [-3, -2.5, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5, 3];
export const B_RANGE = { min: -10, max: 10, step: 1 };
export const C_RANGE = { min: -20, max: 20, step: 1 };

/** y = ax² + bx + c. */
export function evalQ(a: number, b: number, c: number, x: number) {
  return a * x * x + b * x + c;
}

/** The discriminant b² − 4ac. */
export function discriminant(a: number, b: number, c: number) {
  return b * b - 4 * a * c;
}

/** How many real roots: 2 when b² − 4ac > 0, 1 (two equal roots) when it is 0, 0 when it is negative. */
export function rootCount(a: number, b: number, c: number): 0 | 1 | 2 {
  const d = discriminant(a, b, c);
  return Math.abs(d) < 1e-9 ? 1 : d > 0 ? 2 : 0;
}

/** Real roots by Sridharacharya's formula x = (−b ± √(b² − 4ac)) ÷ (2a), smallest first. */
export function roots(a: number, b: number, c: number): number[] {
  const n = rootCount(a, b, c);
  if (n === 0) return [];
  if (n === 1) return [-b / (2 * a)];
  const s = Math.sqrt(discriminant(a, b, c));
  const r = [(-b - s) / (2 * a), (-b + s) / (2 * a)];
  return r.sort((p, q) => p - q);
}

/** The turning point (vertex) of the curve. */
export function vertex(a: number, b: number, c: number) {
  const x = -b / (2 * a);
  return { x, y: evalQ(a, b, c, x) };
}

/** Coefficients of a(x − p)(x − q) = ax² − a(p + q)x + apq. */
export function fromRoots(p: number, q: number, a = 1) {
  return { a, b: -a * (p + q), c: a * p * q };
}

/** True when the curve y = ax² + bx + c has exactly the roots p and q (p = q means it just touches). */
export function hasRoots(a: number, b: number, c: number, p: number, q: number, tol = 1e-9) {
  const want = [p, q].sort((x, y) => x - y);
  const got = roots(a, b, c);
  if (p === q) return got.length === 1 && Math.abs(got[0] - p) < tol;
  return got.length === 2 && Math.abs(got[0] - want[0]) < tol && Math.abs(got[1] - want[1]) < tol;
}

const num = (v: number) => (v < 0 ? `−${Math.abs(v)}` : `${v}`);

/** "x² − 5x + 6" with a real minus sign; terms with a 0 coefficient are left out. */
export function formatQuadratic(a: number, b: number, c: number) {
  const first = a === 1 ? "x²" : a === -1 ? "−x²" : `${num(a)}x²`;
  const term = (k: number, v: string) => {
    if (k === 0) return "";
    const mag = Math.abs(k) === 1 && v ? v : `${Math.abs(k)}${v}`;
    return ` ${k < 0 ? "−" : "+"} ${mag}`;
  };
  return first + term(b, "x") + term(c, "");
}

/** The garden puzzle: a fixed fence round a rectangle. Half of it is breadth + length. */
export const FENCE = 40;
export const HALF = FENCE / 2;
export const BREADTH = { min: 0.5, max: 19.5, step: 0.5 };
/** Target areas the student can ask for (m²). */
export const TARGETS = [64, 96, 100, 110];

/** Area of the rectangle with breadth x and length (20 − x). */
export function gardenArea(x: number) {
  return x * (HALF - x);
}

/** x(20 − x) = A is the same as x² − 20x + A = 0. */
export function gardenEquation(A: number) {
  return { a: 1, b: -HALF, c: A };
}

/** Breadths that give area A, from the equation's roots (only lengths between 0 and 20 count). */
export function gardenBreadths(A: number) {
  const { a, b, c } = gardenEquation(A);
  return roots(a, b, c).filter((x) => x > 0 && x < HALF);
}

/** Challenge: build the curve whose roots are given. `a` is fixed when set. */
export interface RootRound {
  name: string;
  brief: string;
  roots: [number, number];
  a?: number;
}

export function meetsRound(a: number, b: number, c: number, r: RootRound) {
  if (r.a !== undefined && a !== r.a) return false;
  return hasRoots(a, b, c, r.roots[0], r.roots[1]);
}
