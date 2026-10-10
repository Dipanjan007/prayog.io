/**
 * Linear equations in two variables (NCERT Class 9 Ganita Manjari Part 2, "Two Variables, One Line").
 * Pure functions for the SolutionLine sim: ax + by = c, its solution pairs, its intercepts,
 * and two equations that must both be true (two shop or cricket conditions).
 */

export interface Eq {
  a: number;
  b: number;
  c: number;
}

export interface Pt {
  x: number;
  y: number;
}

/** The left side ax + by at a point. */
export function lhs(e: Eq, p: Pt) {
  return e.a * p.x + e.b * p.y;
}

/** Is (x, y) a solution of ax + by = c? */
export function isSolution(e: Eq, p: Pt, tol = 1e-9) {
  return Math.abs(lhs(e, p) - e.c) <= tol;
}

/** Where the line meets the x-axis (y = 0): (c ÷ a, 0). Null when a = 0. */
export function xIntercept(e: Eq): Pt | null {
  return e.a === 0 ? null : { x: e.c / e.a + 0, y: 0 };
}

/** Where the line meets the y-axis (x = 0): (0, c ÷ b). Null when b = 0. */
export function yIntercept(e: Eq): Pt | null {
  return e.b === 0 ? null : { x: 0, y: e.c / e.b + 0 };
}

/** y for a given x: (c − ax) ÷ b. Null when b = 0 (then the line is upright). */
export function yAt(e: Eq, x: number) {
  return e.b === 0 ? null : (e.c - e.a * x) / e.b + 0;
}

/** A number with a real minus sign, up to 2 decimal places. */
export function num(v: number) {
  const r = Math.round(v * 100) / 100;
  return r < 0 ? `−${Math.abs(r)}` : `${r}`;
}

/** A point written (x, y) with real minus signs. */
export function ptText(p: Pt) {
  return `(${num(p.x)}, ${num(p.y)})`;
}

function term(k: number, v: string, first: boolean) {
  const mag = Math.abs(k) === 1 ? v : `${Math.abs(k)}${v}`;
  if (first) return k < 0 ? `−${mag}` : mag;
  return `${k < 0 ? "−" : "+"} ${mag}`;
}

/** ax + by = c as the book writes it: 2x + 3y = 12, x − y = 2, 3y = 12. */
export function eqText(e: Eq) {
  const parts: string[] = [];
  if (e.a !== 0) parts.push(term(e.a, "x", true));
  if (e.b !== 0) parts.push(term(e.b, "y", parts.length === 0));
  return `${parts.join(" ") || "0"} = ${num(e.c)}`;
}

/** ax + by worked out at a point, with brackets round negatives: (2 × 3) + (3 × 2). */
export function workText(e: Eq, p: Pt) {
  const br = (v: number) => (v < 0 ? `(${num(v)})` : num(v));
  const bits: string[] = [];
  if (e.a !== 0) bits.push(`(${num(e.a)} × ${br(p.x)})`);
  if (e.b !== 0) bits.push(`(${num(e.b)} × ${br(p.y)})`);
  return bits.join(" + ");
}

/** The grid runs from GRID.min to GRID.max on both axes; the point snaps to whole numbers. */
export const GRID = { min: -2, max: 12 };
/** Slider ranges for the free equation ax + by = c. */
export const COEF = { min: 0, max: 6, step: 1 };
export const TOTAL = { min: 0, max: 24, step: 1 };

export function onGrid(p: Pt) {
  return p.x >= GRID.min && p.x <= GRID.max && p.y >= GRID.min && p.y <= GRID.max;
}

/** Every whole-number point on the grid that solves the equation. */
export function gridSolutions(e: Eq) {
  const out: Pt[] = [];
  for (let x = GRID.min; x <= GRID.max; x++) for (let y = GRID.min; y <= GRID.max; y++) if (isSolution(e, { x, y })) out.push({ x, y });
  return out;
}

/** Whole-number solutions with x ≥ 0 and y ≥ 0: the ways that make sense for counting things. */
export function countingSolutions(e: Eq) {
  return gridSolutions(e).filter((p) => p.x >= 0 && p.y >= 0);
}

/** The one point on both lines, or null when they are parallel (or the same line). */
export function crossing(e1: Eq, e2: Eq): Pt | null {
  const det = e1.a * e2.b - e2.a * e1.b;
  if (det === 0) return null;
  return { x: (e1.c * e2.b - e2.c * e1.b) / det + 0, y: (e1.a * e2.c - e2.a * e1.c) / det + 0 };
}

/** Clamp and round to a whole grid point. */
export function snap(x: number, y: number): Pt {
  const c = (v: number) => Math.max(GRID.min, Math.min(GRID.max, Math.round(v))) + 0;
  return { x: c(x), y: c(y) };
}

/** Challenge: two conditions, two lines. Find the one point that makes both true. */
export interface Puzzle {
  name: string;
  brief: string;
  /** What x and y count, for the readout. */
  xName: string;
  yName: string;
  eqs: [Eq, Eq];
}
