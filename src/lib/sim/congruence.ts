/**
 * Congruent triangles (NCERT Class 7 Ganita Prakash Part 2, "Geometric Twins").
 * Pure functions for the TwinLab sim: given a clue (SSS, SAS, ASA, RHS, SSA or AAA),
 * build every triangle that fits it and count them. One means the clue makes a twin.
 *
 * Names: vertices A, B, C; sides AB, BC, CA; angles ∠A, ∠B, ∠C. Lengths in cm, angles in degrees.
 */

const RAD = Math.PI / 180;
const EPS = 1e-9;

export interface Pt {
  x: number;
  y: number;
}
export interface Tri {
  A: Pt;
  B: Pt;
  C: Pt;
}

export type Clue = "SSS" | "SAS" | "ASA" | "RHS" | "SSA" | "AAA";

/** The values each clue sends. Keys are the parts of △ABC. */
export type ClueValues = Partial<Record<"AB" | "BC" | "CA" | "A" | "B" | "C", number>>;

export interface ClueInfo {
  id: Clue;
  /** What the letters stand for, in words. */
  says: string;
  /** The parts sent, in order. RHS also uses the right angle at C. */
  parts: (keyof ClueValues)[];
  lengths: number;
  angles: number;
}

export const CLUES: ClueInfo[] = [
  { id: "SSS", says: "three sides", parts: ["AB", "BC", "CA"], lengths: 3, angles: 0 },
  { id: "SAS", says: "two sides and the angle between them", parts: ["AB", "A", "CA"], lengths: 2, angles: 1 },
  { id: "ASA", says: "two angles and the side between them", parts: ["B", "BC", "C"], lengths: 1, angles: 2 },
  { id: "RHS", says: "right angle, hypotenuse and one side", parts: ["AB", "BC"], lengths: 2, angles: 1 },
  { id: "SSA", says: "two sides and an angle not between them", parts: ["AB", "BC", "A"], lengths: 2, angles: 1 },
  { id: "AAA", says: "three angles", parts: ["A", "B"], lengths: 0, angles: 3 },
];

export const clueInfo = (c: Clue) => CLUES.find((x) => x.id === c)!;

/** Slider ranges. */
export const SIDE = { min: 1, max: 12, step: 1 };
export const ANG = { min: 20, max: 160, step: 5 };

/** Starting values for each clue. SSS starts with sides that cannot meet. */
export const START: Record<Clue, ClueValues> = {
  SSS: { AB: 8, BC: 3, CA: 4 },
  SAS: { AB: 7, A: 50, CA: 5 },
  ASA: { B: 60, BC: 7, C: 50 },
  RHS: { AB: 10, BC: 6 },
  SSA: { AB: 10, BC: 12, A: 30 },
  AAA: { A: 60, B: 70 },
};

export type FitKind = "none" | "one" | "two" | "many";

export interface Fit {
  kind: FitKind;
  tris: Tri[];
}

const dir = (deg: number) => ({ x: Math.cos(deg * RAD), y: Math.sin(deg * RAD) });

/** The triangle with AB along the x-axis from A = (0, 0), ∠A = A and AC = CA. */
export function triFromSAS(AB: number, A: number, CA: number): Tri {
  const d = dir(A);
  return { A: { x: 0, y: 0 }, B: { x: AB, y: 0 }, C: { x: CA * d.x, y: CA * d.y } };
}

/** Sizes of the triangles drawn for AAA. */
export const AAA_SIZES = [4, 7, 10];

/** Every triangle that fits a clue. */
export function solve(clue: Clue, v: ClueValues): Fit {
  const none: Fit = { kind: "none", tris: [] };
  switch (clue) {
    case "SSS": {
      const c = v.AB!;
      const a = v.BC!;
      const b = v.CA!;
      if (a + b <= c + EPS || b + c <= a + EPS || c + a <= b + EPS) return none;
      const x = (b * b + c * c - a * a) / (2 * c);
      return { kind: "one", tris: [{ A: { x: 0, y: 0 }, B: { x: c, y: 0 }, C: { x, y: Math.sqrt(b * b - x * x) } }] };
    }
    case "SAS":
      return { kind: "one", tris: [triFromSAS(v.AB!, v.A!, v.CA!)] };
    case "ASA": {
      const B = v.B!;
      const C = v.C!;
      const a = v.BC!;
      if (B + C >= 180 - EPS) return none;
      // Sides are in the same ratio as the sines of the angles opposite them.
      const AB = (a * Math.sin(C * RAD)) / Math.sin((180 - B - C) * RAD);
      const d = dir(B);
      return { kind: "one", tris: [{ A: { x: AB * d.x, y: AB * d.y }, B: { x: 0, y: 0 }, C: { x: a, y: 0 } }] };
    }
    case "RHS": {
      const hyp = v.AB!;
      const a = v.BC!;
      if (a >= hyp - EPS) return none;
      return { kind: "one", tris: [{ A: { x: 0, y: Math.sqrt(hyp * hyp - a * a) }, B: { x: a, y: 0 }, C: { x: 0, y: 0 } }] };
    }
    case "SSA": {
      // A = (0, 0), B = (AB, 0). C is on the ray from A at angle ∠A, with BC = a.
      const c = v.AB!;
      const a = v.BC!;
      const d = dir(v.A!);
      const p = c * d.x;
      const disc = a * a - c * c * d.y * d.y;
      if (disc < -EPS) return none;
      const ts = Math.abs(disc) <= EPS ? [p] : [p - Math.sqrt(disc), p + Math.sqrt(disc)];
      const tris = ts.filter((t) => t > EPS).map((t) => ({ A: { x: 0, y: 0 }, B: { x: c, y: 0 }, C: { x: t * d.x, y: t * d.y } }));
      return { kind: tris.length === 2 ? "two" : tris.length === 1 ? "one" : "none", tris };
    }
    case "AAA": {
      const A = v.A!;
      const B = v.B!;
      const C = 180 - A - B;
      if (C <= EPS) return none;
      const tris = AAA_SIZES.map((s) => triFromSAS(s, A, (s * Math.sin(B * RAD)) / Math.sin(C * RAD)));
      return { kind: "many", tris };
    }
  }
}

export function dist(p: Pt, q: Pt) {
  return Math.hypot(p.x - q.x, p.y - q.y);
}

/** Angle at p in triangle p, q, r (degrees). */
export function angleAt(p: Pt, q: Pt, r: Pt) {
  const u = { x: q.x - p.x, y: q.y - p.y };
  const w = { x: r.x - p.x, y: r.y - p.y };
  const cos = (u.x * w.x + u.y * w.y) / (Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y));
  return Math.acos(Math.max(-1, Math.min(1, cos))) / RAD;
}

/** All six measurements of a triangle. */
export function measure(t: Tri) {
  return {
    AB: dist(t.A, t.B),
    BC: dist(t.B, t.C),
    CA: dist(t.C, t.A),
    A: angleAt(t.A, t.B, t.C),
    B: angleAt(t.B, t.C, t.A),
    C: angleAt(t.C, t.A, t.B),
  };
}

/** True when two triangles are twins with matching corners A↔A, B↔B, C↔C. */
export function congruent(s: Tri, t: Tri, tol = 1e-6) {
  const a = measure(s);
  const b = measure(t);
  return Math.abs(a.AB - b.AB) < tol && Math.abs(a.BC - b.BC) < tol && Math.abs(a.CA - b.CA) < tol;
}

/** The values a clue would send about a given triangle, or null when the clue cannot be used (RHS needs ∠C = 90°). */
export function clueFrom(t: Tri, clue: Clue): ClueValues | null {
  const m = measure(t);
  if (clue === "RHS" && Math.abs(m.C - 90) > 1e-6) return null;
  const out: ClueValues = {};
  for (const p of clueInfo(clue).parts) out[p] = m[p];
  return out;
}

/** Challenge rules about what a clue may contain. */
export type ClueRule = "oneLength" | "noAngles" | "twoSidesOneAngle";

export function ruleAllows(rule: ClueRule, clue: Clue) {
  const c = clueInfo(clue);
  if (rule === "oneLength") return c.lengths <= 1;
  if (rule === "noAngles") return c.angles === 0;
  return c.lengths === 2 && c.angles === 1;
}

export interface TwinRound {
  name: string;
  brief: string;
  target: Tri;
  rule: ClueRule;
}

export type RoundVerdict = "ok" | "rule" | "unusable" | FitKind;

/** What happens when this clue is sent about the round's triangle. */
export function judge(round: TwinRound, clue: Clue): { verdict: RoundVerdict; fit: Fit | null } {
  const v = clueFrom(round.target, clue);
  const fit = v ? solve(clue, v) : null;
  if (!ruleAllows(round.rule, clue)) return { verdict: "rule", fit };
  if (!fit) return { verdict: "unusable", fit };
  return { verdict: fit.kind === "one" ? "ok" : fit.kind, fit };
}
