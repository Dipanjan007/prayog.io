/**
 * Fractals (Maths Outliers). Pure functions for the FractalLab sim: the Sierpinski triangle
 * (3ⁿ pieces, shaded area (3/4)ⁿ, holes (3ⁿ − 1) ÷ 2) and the Koch snowflake (3 × 4ⁿ sides,
 * perimeter 3s × (4/3)ⁿ growing without limit, area settling at 8/5 of the start).
 * Shapes are built in maths coordinates (y up) for a starting triangle of side 1.
 */

export type Pt = [number, number];

/** Steps the sim allows, and the deepest step it actually draws (finer pieces are too small to see). */
export const STEPS = { min: 0, max: 10 };
export const DRAW_MAX = { sier: 7, koch: 6 };

/** Side of the snowflake's starting triangle, in cm. 27 = 3³, so the first sides come out whole. */
export const KOCH_SIDE = 27;

/** Area of an equilateral triangle with side s: (√3 ÷ 4) × s². */
export function triArea(s: number) {
  return (Math.sqrt(3) / 4) * s * s;
}

// ---------- Sierpinski ----------

/** Shaded triangles after n steps: 3ⁿ. */
export function sierTriangles(n: number) {
  return 3 ** n;
}

/** Holes cut out after n steps: 1 + 3 + 9 + ... + 3ⁿ⁻¹ = (3ⁿ − 1) ÷ 2. */
export function sierHoles(n: number) {
  return (3 ** n - 1) / 2;
}

/** Fraction of the starting triangle still shaded after n steps: (3/4)ⁿ. */
export function sierArea(n: number) {
  return (3 / 4) ** n;
}

/** Side of each small triangle as a fraction of the start: (1/2)ⁿ. */
export function sierSide(n: number) {
  return (1 / 2) ** n;
}

/** Total edge of all shaded triangles, starting side s: 3ⁿ × 3 × (s ÷ 2ⁿ) = 3s × (3/2)ⁿ. */
export function sierPerimeter(n: number, s = 1) {
  return 3 * s * (3 / 2) ** n;
}

/** The shaded triangles after n steps, for a starting triangle of side 1 with its base on y = 0. */
export function sierpinski(n: number): [Pt, Pt, Pt][] {
  let tris: [Pt, Pt, Pt][] = [
    [
      [0, 0],
      [1, 0],
      [0.5, Math.sqrt(3) / 2],
    ],
  ];
  for (let k = 0; k < n; k++) {
    const next: [Pt, Pt, Pt][] = [];
    for (const [a, b, c] of tris) {
      const ab = mid(a, b);
      const bc = mid(b, c);
      const ca = mid(c, a);
      next.push([a, ab, ca], [ab, b, bc], [ca, bc, c]);
    }
    tris = next;
  }
  return tris;
}

const mid = (p: Pt, q: Pt): Pt => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];

// ---------- Koch ----------

/** Sides of the snowflake after n steps: 3 × 4ⁿ. */
export function kochSides(n: number) {
  return 3 * 4 ** n;
}

/** Length of each side after n steps, starting side s: s ÷ 3ⁿ. */
export function kochSide(n: number, s = KOCH_SIDE) {
  return s / 3 ** n;
}

/** Perimeter after n steps: 3s × (4/3)ⁿ. */
export function kochPerimeter(n: number, s = KOCH_SIDE) {
  return (3 * s * 4 ** n) / 3 ** n;
}

/** Area after n steps: A × (1 + (3/5) × (1 − (4/9)ⁿ)), where A is the starting triangle's area. */
export function kochArea(n: number, s = KOCH_SIDE) {
  return triArea(s) * (1 + (3 / 5) * (1 - (4 / 9) ** n));
}

/** The area the snowflake never passes: (8/5) × A. */
export function kochAreaLimit(s = KOCH_SIDE) {
  return (8 / 5) * triArea(s);
}

/** First step at which the perimeter is more than `cm`. */
export function kochStepOver(cm: number, s = KOCH_SIDE) {
  let n = 0;
  while (kochPerimeter(n, s) <= cm) n++;
  return n;
}

/**
 * Corners of the snowflake after n steps, side 1, going anticlockwise round the starting
 * triangle (base on y = 0). Each side becomes 4 sides with a bump pointing outwards.
 */
export function koch(n: number): Pt[] {
  let pts: Pt[] = [
    [0, 0],
    [1, 0],
    [0.5, Math.sqrt(3) / 2],
  ];
  const c = Math.cos(-Math.PI / 3);
  const s = Math.sin(-Math.PI / 3);
  for (let k = 0; k < n; k++) {
    const next: Pt[] = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const q = pts[(i + 1) % pts.length];
      const dx = (q[0] - p[0]) / 3;
      const dy = (q[1] - p[1]) / 3;
      const a: Pt = [p[0] + dx, p[1] + dy];
      const b: Pt = [p[0] + 2 * dx, p[1] + 2 * dy];
      // Turn the middle third by 60° clockwise: outwards for an anticlockwise loop.
      const peak: Pt = [a[0] + dx * c - dy * s, a[1] + dx * s + dy * c];
      next.push(p, a, peak, b);
    }
    pts = next;
  }
  return pts;
}

/** Area of a closed polygon (shoelace formula). Positive when the corners go anticlockwise. */
export function polygonArea(pts: Pt[]) {
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    sum += x1 * y2 - x2 * y1;
  }
  return sum / 2;
}

/** Length all the way round a closed polygon. */
export function polygonPerimeter(pts: Pt[]) {
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    sum += Math.hypot(q[0] - p[0], q[1] - p[1]);
  }
  return sum;
}

// ---------- Challenge ----------

export type CountKind = "sier-triangles" | "sier-holes" | "koch-sides";

/** Challenge: predict a count at a step that is not drawn yet. */
export interface FractalRound {
  name: string;
  brief: string;
  kind: CountKind;
  step: number;
}

export function countAt(kind: CountKind, n: number) {
  if (kind === "sier-triangles") return sierTriangles(n);
  if (kind === "sier-holes") return sierHoles(n);
  return kochSides(n);
}

/** Which shape a count belongs to. */
export function shapeOf(kind: CountKind): "sier" | "koch" {
  return kind === "koch-sides" ? "koch" : "sier";
}

/** A typed whole number, allowing Indian or international commas and spaces; NaN if not a whole number. */
export function parseCount(text: string) {
  const t = text.replace(/[,\s]/g, "");
  return /^\d+$/.test(t) ? Number(t) : NaN;
}

export function checkCount(text: string, r: FractalRound) {
  return parseCount(text) === countAt(r.kind, r.step);
}
