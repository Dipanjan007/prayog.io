/**
 * Similar triangles (NCERT Class 10 Mathematics, Chapter 6 "Triangles").
 * Pure functions for the SimilarLab sim: scaling a triangle, the Basic Proportionality Theorem
 * (a line parallel to one side cuts the other two in the same ratio) and its converse, and
 * Thales' shadow trick for finding a height.
 */

export type V = { x: number; y: number };

const dist = (p: V, q: V) => Math.hypot(q.x - p.x, q.y - p.y);
const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/* ---------- Scale ---------- */

/** The starting triangle ABC in the Scale mode (cm): AB = 4, BC = 6, CA = 5. */
export const BASE = { AB: 4, BC: 6, CA: 5 };

/** Scale factor slider. */
export const K = { min: 0.5, max: 2.5, step: 0.25 };

/** Angle (degrees) opposite side `opp`, from the cosine rule. */
export function angleOpposite(opp: number, s1: number, s2: number) {
  return deg(Math.acos((s1 * s1 + s2 * s2 - opp * opp) / (2 * s1 * s2)));
}

/** Angles A, B, C of a triangle with sides AB, BC, CA. */
export function angles(t: { AB: number; BC: number; CA: number }) {
  return { A: angleOpposite(t.BC, t.AB, t.CA), B: angleOpposite(t.CA, t.AB, t.BC), C: angleOpposite(t.AB, t.BC, t.CA) };
}

/** The copy PQR of ABC with every side multiplied by k. */
export function scaled(k: number) {
  return { PQ: BASE.AB * k, QR: BASE.BC * k, RP: BASE.CA * k };
}

/** Corners of a triangle with sides AB, BC, CA: B at the origin, C along the x-axis, A above (maths axes, y up). */
export function corners(AB: number, BC: number, CA: number) {
  const x = (AB * AB + BC * BC - CA * CA) / (2 * BC);
  return { A: { x, y: Math.sqrt(Math.max(0, AB * AB - x * x)) }, B: { x: 0, y: 0 }, C: { x: BC, y: 0 } };
}

/* ---------- Basic Proportionality Theorem ---------- */

/** The BPT triangle (cm): AB = 6.5, BC = 7, CA = 7.5, with B at the origin and C on the x-axis. */
export const BPT_TRI = { A: { x: 2.5, y: 6 }, B: { x: 0, y: 0 }, C: { x: 7, y: 0 } };

/** Where D sits on AB, as AD ÷ AB. */
export const T = { min: 0.1, max: 0.9, step: 0.05 };
/** How far the line through D is turned away from parallel to BC (degrees). */
export const TILT = { min: -15, max: 15, step: 1 };

export interface BptCut {
  D: V;
  /** E on line AC; only a real cut of side AC when onSide is true. */
  E: V;
  onSide: boolean;
  AD: number;
  DB: number;
  AE: number;
  EC: number;
}

/** Draw a line through D (AD = t × AB), turned `tiltDeg` from parallel to BC, and find where it cuts AC. */
export function bptCut(t: number, tiltDeg: number): BptCut {
  const { A, B, C } = BPT_TRI;
  const D = { x: A.x + t * (B.x - A.x), y: A.y + t * (B.y - A.y) };
  const dir = { x: Math.cos(rad(tiltDeg)), y: Math.sin(rad(tiltDeg)) };
  const ac = { x: C.x - A.x, y: C.y - A.y };
  // Solve D + v·dir = A + u·ac for u.
  const den = dir.x * ac.y - dir.y * ac.x;
  const u = (dir.x * (A.y - D.y) - dir.y * (A.x - D.x)) / -den;
  const E = { x: A.x + u * ac.x, y: A.y + u * ac.y };
  const AB = dist(A, B);
  const AC = dist(A, C);
  return { D, E, onSide: u > 0.02 && u < 0.98, AD: t * AB, DB: (1 - t) * AB, AE: u * AC, EC: (1 - u) * AC };
}

/** The two ratios the theorem compares. */
export function bptRatios(c: BptCut) {
  return { left: c.AD / c.DB, right: c.AE / c.EC };
}

/** A ratio as the sim shows it, to 3 decimal places. */
export const ratioText = (r: number) => r.toFixed(3);

/** Whether the two ratios agree as shown on screen (to 3 decimal places). */
export function ratiosMatch(c: BptCut) {
  const { left, right } = bptRatios(c);
  return ratioText(left) === ratioText(right);
}

/* ---------- Shadows ---------- */

/** Length of the shadow of something h tall when the Sun is `elevDeg` above the horizon. */
export function shadowLen(h: number, elevDeg: number) {
  return h / Math.tan(rad(elevDeg));
}

/** Thales' trick: the Sun's rays are parallel, so H ÷ S = h ÷ s and H = h × (S ÷ s). */
export function heightFromShadow(h: number, s: number, S: number) {
  return h * (S / s);
}

/** Sun's elevation (degrees) that makes a stick h tall cast a shadow s long. */
export function sunFor(h: number, s: number) {
  return deg(Math.atan(h / s));
}

/** Free Shadow mode: a 1 m stick next to a 12 m school building; the Sun slider in degrees. */
export const STICK = 1;
export const BUILDING = 12;
export const SUN = { min: 20, max: 70, step: 1 };

export interface ShadowMystery {
  id: string;
  label: string;
  emoji: string;
  brief: string;
  /** Stick height and its shadow (m). */
  h: number;
  s: number;
  /** The object's shadow, measured from where its height stands (m). */
  S: number;
  /** For the pyramid: half the base, part of S hidden under the pyramid (m). */
  halfBase?: number;
  /** The true height (m), which the student works out. */
  H: number;
}

/** How close (m) an answer must be. */
export const ANSWER_TOL = 0.5;

export function closeEnough(guess: number, H: number, tol = ANSWER_TOL) {
  return Number.isFinite(guess) && Math.abs(guess - H) <= tol;
}
