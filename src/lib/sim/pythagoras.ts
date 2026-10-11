/**
 * The Baudhayana-Pythagoras theorem (NCERT Class 8 Ganita Prakash Part 2).
 * Pure functions for the SquareLab sim: squares on the sides of a triangle,
 * whole-number (Baudhayana) triples and a ladder leaning on a wall.
 */

const RAD = Math.PI / 180;

/** Third side c of a triangle with sides a and b and the angle between them (degrees), by the cosine rule. */
export function thirdSide(a: number, b: number, angleDeg: number) {
  return Math.sqrt(Math.max(0, a * a + b * b - 2 * a * b * Math.cos(angleDeg * RAD)));
}

/** Hypotenuse of a right triangle: c = √(a² + b²). */
export function hypotenuse(a: number, b: number) {
  return Math.sqrt(a * a + b * b);
}

/** The other short side of a right triangle: b = √(c² − a²), or NaN when a is not shorter than c. */
export function leg(c: number, a: number) {
  return a < c ? Math.sqrt(c * c - a * a) : NaN;
}

/** How the square on the long side compares with the two squares together. */
export type SquareCompare = "equal" | "less" | "more";

/** Compare c² with a² + b², rounding away floating-point dust. */
export function compareSquares(a: number, b: number, c: number, tol = 1e-6): SquareCompare {
  const d = c * c - (a * a + b * b);
  return Math.abs(d) <= tol * Math.max(1, c * c) ? "equal" : d < 0 ? "less" : "more";
}

/** A whole-number right triangle (a Baudhayana or Pythagorean triple). */
export function isTriple(a: number, b: number, c: number) {
  return [a, b, c].every(Number.isInteger) && a > 0 && b > 0 && a * a + b * b === c * c;
}

/** True when c is a whole number (to within rounding) for whole-number legs a and b. */
export function wholeHypotenuse(a: number, b: number) {
  const c = hypotenuse(a, b);
  return Number.isInteger(a) && Number.isInteger(b) && Math.abs(c - Math.round(c)) < 1e-9;
}

/** Highest point a ladder of length L reaches when its foot is d from the wall (0 if it cannot stand). */
export function ladderTop(L: number, d: number) {
  return d < L ? Math.sqrt(L * L - d * d) : 0;
}

/** Angle the ladder makes with the ground, in degrees. */
export function ladderAngle(L: number, d: number) {
  return d < L ? Math.acos(d / L) / RAD : 0;
}

/** Challenge: fire-brigade rescues. The ladder's top must rest exactly on the window sill. */
export interface Rescue {
  name: string;
  brief: string;
  /** Height of the window sill (m) and the distance the ladder's foot must stand from the wall (m). */
  h: number;
  d: number;
}

/** The ladder lengths the fire engine carries, in metres. */
export const LADDERS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

/** How close (m) the top must come to the sill. */
export const SILL_TOL = 0.05;

export function reachesSill(L: number, r: Rescue, tol = SILL_TOL) {
  return Math.abs(ladderTop(L, r.d) - r.h) <= tol;
}
