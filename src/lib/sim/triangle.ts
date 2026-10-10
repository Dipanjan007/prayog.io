/**
 * Triangles (NCERT Class 7 Ganita Prakash, "A Tale of Three Intersecting Lines").
 * Pure functions for the TriangleLab sim: can three sticks make a triangle, the
 * angles at each corner, and naming a triangle by its sides and its angles.
 */

export interface Pt {
  x: number;
  y: number;
}

const DEG = 180 / Math.PI;

/** Distance between two points. */
export function dist(p: Pt, q: Pt) {
  return Math.hypot(q.x - p.x, q.y - p.y);
}

/** The angle at corner P, between the lines to Q and to R, in degrees (0 to 180). */
export function angleAt(p: Pt, q: Pt, r: Pt) {
  const ax = q.x - p.x;
  const ay = q.y - p.y;
  const bx = r.x - p.x;
  const by = r.y - p.y;
  return Math.abs(Math.atan2(ax * by - ay * bx, ax * bx + ay * by)) * DEG;
}

/** The three angles of triangle ABC, at A, B and C. */
export function triangleAngles(a: Pt, b: Pt, c: Pt): [number, number, number] {
  return [angleAt(a, b, c), angleAt(b, c, a), angleAt(c, a, b)];
}

/**
 * What three sticks do when you try to join them end to end:
 * "triangle" when each stick is shorter than the other two together,
 * "flat" when the two short ones add up exactly to the long one (they lie along it),
 * "gap" when the two short ones cannot reach each other.
 */
export type StickResult = "triangle" | "flat" | "gap";

export function sticks(a: number, b: number, c: number, eps = 1e-9): StickResult {
  const [x, y, z] = [a, b, c].sort((p, q) => p - q);
  if (x + y > z + eps) return "triangle";
  if (Math.abs(x + y - z) <= eps) return "flat";
  return "gap";
}

/** How far the two short sticks fall short of meeting (0 when they meet). */
export function stickGap(a: number, b: number, c: number) {
  const [x, y, z] = [a, b, c].sort((p, q) => p - q);
  return Math.max(0, z - (x + y));
}

/** Angles of a triangle from its three sides, by the cosine rule: [opposite a, opposite b, opposite c]. */
export function anglesFromSides(a: number, b: number, c: number): [number, number, number] {
  const clamp = (v: number) => Math.min(1, Math.max(-1, v));
  const A = Math.acos(clamp((b * b + c * c - a * a) / (2 * b * c))) * DEG;
  const B = Math.acos(clamp((a * a + c * c - b * b) / (2 * a * c))) * DEG;
  return [A, B, 180 - A - B];
}

export type SideKind = "equilateral" | "isosceles" | "scalene";
export type AngleKind = "acute" | "right" | "obtuse";

/** Equilateral (3 equal sides), isosceles (2 equal) or scalene (none equal). */
export function sideKind(a: number, b: number, c: number, tol = 1e-9): SideKind {
  const eq = (p: number, q: number) => Math.abs(p - q) <= tol;
  const pairs = [eq(a, b), eq(b, c), eq(a, c)].filter(Boolean).length;
  return pairs === 3 ? "equilateral" : pairs >= 1 ? "isosceles" : "scalene";
}

/** Acute (every angle under 90°), right (one is 90°) or obtuse (one is more than 90°). */
export function angleKind(angles: number[], tol = 0.5): AngleKind {
  const big = Math.max(...angles);
  return Math.abs(big - 90) <= tol ? "right" : big > 90 ? "obtuse" : "acute";
}

/** Challenge: build a triangle to order by dragging its corners. Angles are checked to within TOL degrees. */
export const ORDER_TOL = 2;

export interface TriangleOrder {
  name: string;
  brief: string;
  /** Target angles, smallest first. */
  angles: [number, number, number];
}

/** True when the triangle's angles, sorted, are each within tol of the order's. */
export function matchesOrder(angles: number[], order: TriangleOrder, tol = ORDER_TOL) {
  const got = [...angles].sort((p, q) => p - q);
  return order.angles.every((t, i) => Math.abs(got[i] - t) <= tol);
}

/**
 * Whole-degree angles for display that still add up to exactly 180°, by rounding
 * down and giving the leftover degrees to the angles with the biggest remainders.
 * Rounding each angle on its own could show 179° or 181°, which would mislead.
 */
export function wholeAngles(angles: [number, number, number]): [number, number, number] {
  const floors = angles.map(Math.floor);
  let left = 180 - floors.reduce((s, v) => s + v, 0);
  const order = [0, 1, 2].sort((i, j) => angles[j] - floors[j] - (angles[i] - floors[i]));
  for (const i of order)
    if (left > 0) {
      floors[i]++;
      left--;
    }
  return floors as [number, number, number];
}
