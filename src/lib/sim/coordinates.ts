/**
 * Coordinates (NCERT Class 9 Ganita Manjari, "Orienting Yourself: The Use of Coordinates").
 * Pure functions for the DroneGrid sim: quadrants, points on the axes, mirror
 * images, the distance between two points and the midpoint.
 */

export interface GridPt {
  x: number;
  y: number;
}

/** The grid runs from −LIMIT to LIMIT on both axes. */
export const LIMIT = 8;

/** Where a point lies: one of the four quadrants, on an axis, or at the origin. */
export type Place = "I" | "II" | "III" | "IV" | "x-axis" | "y-axis" | "origin";

export function place({ x, y }: GridPt): Place {
  if (x === 0 && y === 0) return "origin";
  if (y === 0) return "x-axis";
  if (x === 0) return "y-axis";
  if (x > 0) return y > 0 ? "I" : "IV";
  return y > 0 ? "II" : "III";
}

/** Signs of (x, y) in each quadrant, as the NCERT table gives them. */
export const QUADRANT_SIGNS: Record<"I" | "II" | "III" | "IV", string> = {
  I: "(+, +)",
  II: "(−, +)",
  III: "(−, −)",
  IV: "(+, −)",
};

export type Mirror = "x-axis" | "y-axis" | "origin";

/** Mirror image of a point: in the x-axis y changes sign, in the y-axis x changes sign, through the origin both do. */
export function reflect({ x, y }: GridPt, m: Mirror): GridPt {
  const flip = (v: number) => (v === 0 ? 0 : -v);
  if (m === "x-axis") return { x, y: flip(y) };
  if (m === "y-axis") return { x: flip(x), y };
  return { x: flip(x), y: flip(y) };
}

/** Distance between two points: √((x₂ − x₁)² + (y₂ − y₁)²). */
export function distance(a: GridPt, b: GridPt) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Midpoint of AB: ((x₁ + x₂) ÷ 2, (y₁ + y₂) ÷ 2). */
export function midpoint(a: GridPt, b: GridPt): GridPt {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** A point written the way the book writes it, with a real minus sign: (−3, 4). */
export function fmt({ x, y }: GridPt) {
  const n = (v: number) => (v < 0 ? `−${Math.abs(v)}` : `${v}`);
  return `(${n(x)}, ${n(y)})`;
}

export const same = (a: GridPt, b: GridPt) => a.x === b.x && a.y === b.y;

/** Keep a dragged point on the grid: whole numbers between −LIMIT and LIMIT. */
export function snap(x: number, y: number): GridPt {
  const c = (v: number) => Math.max(-LIMIT, Math.min(LIMIT, Math.round(v))) || 0;
  return { x: c(x), y: c(y) };
}

/** Challenge: drone deliveries. Each one names its target in a different way. */
export interface Delivery {
  name: string;
  brief: string;
  /** Landmarks drawn on the map for this delivery. */
  marks: { label: string; at: GridPt }[];
  target: GridPt;
}
