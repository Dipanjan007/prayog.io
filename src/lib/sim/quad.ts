/**
 * Quadrilaterals (NCERT Class 8 Ganita Prakash, "Quadrilaterals").
 * Pure functions for the QuadLab sim: four corners on whole-number pegs, their
 * sides, angles and diagonals, and the name the properties give the shape.
 * Whole-number corners keep every "equal" and "parallel" test exact.
 */

export interface Pt {
  x: number;
  y: number;
}

/** The pegboard: corners can sit at x = 0 … 12, y = 0 … 8. */
export const BOARD = { w: 12, h: 8 };

export const LETTERS = ["A", "B", "C", "D"] as const;

/** Free play starts lopsided, with no special name. */
export const START: Pt[] = [
  { x: 2, y: 1 },
  { x: 9, y: 2 },
  { x: 8, y: 6 },
  { x: 3, y: 7 },
];

export type QuadName = "square" | "rectangle" | "rhombus" | "parallelogram" | "kite" | "trapezium" | "quadrilateral" | "concave" | "crossed" | "flat";

export const NAME_TEXT: Record<QuadName, string> = {
  square: "Square",
  rectangle: "Rectangle",
  rhombus: "Rhombus",
  parallelogram: "Parallelogram",
  kite: "Kite",
  trapezium: "Trapezium",
  quadrilateral: "Quadrilateral",
  concave: "Concave quadrilateral",
  crossed: "Not a quadrilateral: two sides cross",
  flat: "Not a quadrilateral: corners in a line",
};

const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
const cross = (a: Pt, b: Pt) => a.x * b.y - a.y * b.x;
const dot = (a: Pt, b: Pt) => a.x * b.x + a.y * b.y;
const len2 = (a: Pt) => dot(a, a);

/** Side vectors AB, BC, CD, DA. */
function sideVecs(q: Pt[]) {
  return q.map((p, i) => sub(q[(i + 1) % 4], p));
}

/** Squared side lengths AB², BC², CD², DA² (whole numbers). */
export function sides2(q: Pt[]) {
  return sideVecs(q).map(len2);
}

export function sides(q: Pt[]) {
  return sides2(q).map(Math.sqrt);
}

/** Squared diagonals AC² and BD². */
export function diagonals2(q: Pt[]) {
  return [len2(sub(q[2], q[0])), len2(sub(q[3], q[1]))];
}

function segmentsCross(a: Pt, b: Pt, c: Pt, d: Pt) {
  const d1 = cross(sub(b, a), sub(c, a));
  const d2 = cross(sub(b, a), sub(d, a));
  const d3 = cross(sub(d, c), sub(a, c));
  const d4 = cross(sub(d, c), sub(b, c));
  return d1 * d2 < 0 && d3 * d4 < 0;
}

/** Twice the signed area (shoelace); positive when A → B → C → D runs anticlockwise. */
export function signedArea2(q: Pt[]) {
  return q.reduce((s, p, i) => s + cross(p, q[(i + 1) % 4]), 0);
}

/** Some corners repeat or three in a row lie on one line. */
export function isFlat(q: Pt[]) {
  for (let i = 0; i < 4; i++) {
    const p = q[(i + 3) % 4];
    const v = q[i];
    const n = q[(i + 1) % 4];
    if (cross(sub(v, p), sub(n, v)) === 0) return true;
  }
  return false;
}

export function isCrossed(q: Pt[]) {
  return segmentsCross(q[0], q[1], q[2], q[3]) || segmentsCross(q[1], q[2], q[3], q[0]);
}

export function isConvex(q: Pt[]) {
  if (isFlat(q) || isCrossed(q)) return false;
  const turns = q.map((v, i) => cross(sub(v, q[(i + 3) % 4]), sub(q[(i + 1) % 4], v)));
  return turns.every((t) => t > 0) || turns.every((t) => t < 0);
}

/** Inside angles at A, B, C, D in degrees (a dent gives one angle over 180°). Only for a proper quadrilateral. */
export function angles(q: Pt[]) {
  const orient = Math.sign(signedArea2(q));
  return q.map((v, i) => {
    const p = q[(i + 3) % 4];
    const n = q[(i + 1) % 4];
    const a = sub(p, v);
    const b = sub(n, v);
    const deg = (Math.acos(Math.max(-1, Math.min(1, dot(a, b) / Math.sqrt(len2(a) * len2(b))))) * 180) / Math.PI;
    const turn = cross(sub(v, p), sub(n, v));
    return turn * orient > 0 ? deg : 360 - deg;
  });
}

/** Whole-degree angles that still add to exactly 360 (largest remainders get rounded up). */
export function roundAngles(a: number[]) {
  const total = Math.round(a.reduce((s, x) => s + x, 0));
  const fl = a.map(Math.floor);
  let left = total - fl.reduce((s, x) => s + x, 0);
  const order = a.map((x, i) => [x - Math.floor(x), i] as const).sort((p, r) => r[0] - p[0]);
  for (const [, i] of order) {
    if (left <= 0) break;
    fl[i] += 1;
    left -= 1;
  }
  return fl;
}

const parallel = (u: Pt, v: Pt) => cross(u, v) === 0;

export interface Props {
  /** Pairs of opposite sides that are parallel: 0, 1 or 2. */
  parallelPairs: number;
  /** AB ∥ CD, BC ∥ DA. */
  parallel: [boolean, boolean];
  rightAngles: number;
  allSidesEqual: boolean;
  oppositeSidesEqual: boolean;
  /** Two pairs of neighbouring sides equal. */
  kiteSides: boolean;
  diagonalsEqual: boolean;
  diagonalsPerpendicular: boolean;
  diagonalsBisect: boolean;
}

export function properties(q: Pt[]): Props {
  const v = sideVecs(q);
  const s = sides2(q);
  const pa: [boolean, boolean] = [parallel(v[0], v[2]), parallel(v[1], v[3])];
  const rightAngles = q.filter((_, i) => dot(v[(i + 3) % 4], v[i]) === 0).length;
  const [d1, d2] = diagonals2(q);
  const ac = sub(q[2], q[0]);
  const bd = sub(q[3], q[1]);
  return {
    parallelPairs: pa.filter(Boolean).length,
    parallel: pa,
    rightAngles,
    allSidesEqual: s.every((x) => x === s[0]),
    oppositeSidesEqual: s[0] === s[2] && s[1] === s[3],
    kiteSides: (s[0] === s[1] && s[2] === s[3]) || (s[0] === s[3] && s[1] === s[2]),
    diagonalsEqual: d1 === d2,
    diagonalsPerpendicular: dot(ac, bd) === 0,
    diagonalsBisect: q[0].x + q[2].x === q[1].x + q[3].x && q[0].y + q[2].y === q[1].y + q[3].y,
  };
}

/** The most exact name the properties allow. */
export function classify(q: Pt[]): QuadName {
  if (isFlat(q)) return "flat";
  if (isCrossed(q)) return "crossed";
  if (!isConvex(q)) return "concave";
  const p = properties(q);
  if (p.parallelPairs === 2) {
    if (p.rightAngles > 0) return p.allSidesEqual ? "square" : "rectangle";
    return p.allSidesEqual ? "rhombus" : "parallelogram";
  }
  if (p.kiteSides) return "kite";
  if (p.parallelPairs === 1) return "trapezium";
  return "quadrilateral";
}

/** Other names the shape also has (a square is also a rectangle, a rhombus, …). */
export function alsoNames(name: QuadName): QuadName[] {
  if (name === "square") return ["rectangle", "rhombus", "parallelogram", "kite"];
  if (name === "rectangle") return ["parallelogram"];
  if (name === "rhombus") return ["parallelogram", "kite"];
  return [];
}

/** True when the corners make a proper (not crossed, not flat) quadrilateral. */
export function isProper(q: Pt[]) {
  return !isFlat(q) && !isCrossed(q);
}

/** Lengths like 5 or 3.61. */
export function lenText(l2: number) {
  const r = Math.round(Math.sqrt(l2));
  return r * r === l2 ? `${r}` : `${(Math.round(Math.sqrt(l2) * 100) / 100).toFixed(2)}`;
}

/** Brahmagupta: area of a quadrilateral whose corners lie on one circle, from its four sides. */
export function brahmagupta(a: number, b: number, c: number, d: number) {
  const s = (a + b + c + d) / 2;
  return Math.sqrt((s - a) * (s - b) * (s - c) * (s - d));
}

/** Challenge: a shape to make. */
export interface Order {
  name: string;
  brief: string;
  shape: QuadName;
  /** At least one side of this length. */
  side?: number;
  /** Both diagonal lengths, shortest first. */
  diagonals?: [number, number];
}

export function orderOk(o: Order, q: Pt[]) {
  if (classify(q) !== o.shape) return false;
  if (o.side !== undefined && !sides2(q).includes(o.side * o.side)) return false;
  if (o.diagonals) {
    const d = diagonals2(q).sort((x, y) => x - y);
    if (d[0] !== o.diagonals[0] ** 2 || d[1] !== o.diagonals[1] ** 2) return false;
  }
  return true;
}

/** A short hint for a try that misses. */
export function orderHint(o: Order, q: Pt[]) {
  const n = classify(q);
  if (n === "crossed" || n === "flat") return `${NAME_TEXT[n]}.`;
  if (n !== o.shape) return `That is a ${NAME_TEXT[n].toLowerCase()}, not a ${o.shape}.`;
  if (o.side !== undefined && !sides2(q).includes(o.side * o.side)) return `Right shape! Now make one side exactly ${o.side} units.`;
  const d = diagonals2(q).sort((x, y) => x - y);
  return `Right shape! The diagonals are ${lenText(d[0])} and ${lenText(d[1])}; you need ${o.diagonals![0]} and ${o.diagonals![1]}.`;
}

export function onBoard(p: Pt) {
  return p.x >= 0 && p.x <= BOARD.w && p.y >= 0 && p.y <= BOARD.h && Number.isInteger(p.x) && Number.isInteger(p.y);
}
