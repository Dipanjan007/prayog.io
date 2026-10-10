/**
 * Maths Olympiad: right triangles, Pythagoras, coordinates and heights. Pure functions shared by
 * the OlyTriangle sim and the problem answers. Lengths in metres or km, angles in degrees.
 */

const rad = (d: number) => (d * Math.PI) / 180;

/** Ladder with its foot `foot` from the wall, reaching `height` up the wall: √(foot² + height²). */
export function hypot2(a: number, b: number) {
  return Math.sqrt(a * a + b * b);
}

/** Distance between two map points. */
export function distance(a: [number, number], b: [number, number]) {
  return hypot2(b[0] - a[0], b[1] - a[1]);
}

/** A pole of length `total` snaps at height x and its top lands `reach` from the foot: x = (total² − reach²) ÷ (2 × total). */
export function breakHeight(total: number, reach: number) {
  return (total * total - reach * reach) / (2 * total);
}

/** Where the snapped top lands, for a break at height x. NaN if the top part is too short to reach the ground. */
export function landingDistance(total: number, x: number) {
  const top = total - x;
  return top >= x ? Math.sqrt(top * top - x * x) : NaN;
}

/** Height where the two cross-wires between poles h1 and h2 meet: (h1 × h2) ÷ (h1 + h2), whatever the gap. */
export function crossHeight(h1: number, h2: number) {
  return (h1 * h2) / (h1 + h2);
}

/** Height of a tower seen at angle θ from `dist` away, with the eye `eye` above the ground: eye + (dist × tan θ). */
export function towerHeight(dist: number, angleDeg: number, eye = 0) {
  return eye + dist * Math.tan(rad(angleDeg));
}

/** Tower height when walking `gap` towards it changes the angle of elevation from a1 to a2 (a1 < a2). */
export function towerFromTwoAngles(a1: number, a2: number, gap: number) {
  return gap / (1 / Math.tan(rad(a1)) - 1 / Math.tan(rad(a2)));
}

/** Distance from a tower of height h at which its top is seen at angle a: h ÷ tan a. */
export function distanceForAngle(h: number, a: number) {
  return h / Math.tan(rad(a));
}

export interface LadderScene {
  kind: "tri-ladder";
  /** Foot of the ladder from the wall. */
  foot: number;
  /** Height the top must reach. */
  target: number;
  /** The student's ladder length. */
  L: number;
}

export interface MapScene {
  kind: "tri-map";
  from: { name: string; at: [number, number] };
  to: { name: string; at: [number, number] };
  /** The student's straight-line distance, laid out from `from` towards `to`. */
  L: number;
  unit: string;
}

export interface BambooScene {
  kind: "tri-bamboo";
  total: number;
  /** Where the top must touch the ground, measured from the foot. */
  mark: number;
  /** The student's break height. */
  x: number;
}

export interface CrossScene {
  kind: "tri-cross";
  h1: number;
  h2: number;
  gap: number;
  /** The student's prop height. */
  y: number;
}

export interface TowerScene {
  kind: "tri-tower";
  dist: number;
  eye: number;
  angle: number;
  /** The student's tower height. */
  h: number;
  what: string;
}

export interface Tower2Scene {
  kind: "tri-tower2";
  a1: number;
  a2: number;
  gap: number;
  /** The student's tower height. */
  h: number;
  what: string;
}

export type TriangleScene = LadderScene | MapScene | BambooScene | CrossScene | TowerScene | Tower2Scene;

export function isTriangleScene(s: { kind: string }): s is TriangleScene {
  return s.kind.startsWith("tri-");
}

/** Relative error that still counts as a perfect fit in the picture. */
export const FIT = 0.003;
export const RUN_S = 2.6;
export const END_S = 0.8;

const f2 = (x: number) => String(Number(x.toFixed(2)));
const close = (a: number, b: number) => Math.abs(a - b) <= FIT * Math.abs(b);

export function planTriangle(s: TriangleScene): { outcome: { ok: boolean; text: string }; duration: number } {
  const duration = RUN_S + END_S;
  const done = (ok: boolean, text: string) => ({ outcome: { ok, text }, duration });
  switch (s.kind) {
    case "tri-ladder": {
      if (s.L <= s.foot) return done(false, `A ${f2(s.L)} m ladder is no longer than the ${f2(s.foot)} m gap, so it lies flat on the ground.`);
      const top = Math.sqrt(s.L * s.L - s.foot * s.foot);
      if (close(top, s.target)) return done(true, `The top rests at ${f2(top)} m, right at the window sill!`);
      return done(false, `The top rests at ${f2(top)} m, ${f2(Math.abs(top - s.target))} m ${top > s.target ? "above" : "below"} the sill.`);
    }
    case "tri-map": {
      const D = distance(s.from.at, s.to.at);
      if (close(s.L, D)) return done(true, `A ${f2(s.L)} ${s.unit} line from ${s.from.name} ends exactly at ${s.to.name}!`);
      return done(false, `A ${f2(s.L)} ${s.unit} line from ${s.from.name} ${s.L < D ? "stops" : "runs"} ${f2(Math.abs(D - s.L))} ${s.unit} ${s.L < D ? "short of" : "past"} ${s.to.name}.`);
    }
    case "tri-bamboo": {
      if (s.x <= 0 || s.x >= s.total) return done(false, `The break must be somewhere on the ${f2(s.total)} m pole.`);
      const d = landingDistance(s.total, s.x);
      if (Number.isNaN(d)) return done(false, `Snapped at ${f2(s.x)} m, the top part is only ${f2(s.total - s.x)} m long and dangles without touching the ground.`);
      if (close(d, s.mark)) return done(true, `The top touches the ground ${f2(d)} m from the foot, right on the mark!`);
      return done(false, `The top touches the ground ${f2(d)} m from the foot, ${d > s.mark ? "beyond" : "short of"} the ${f2(s.mark)} m mark.`);
    }
    case "tri-cross": {
      const c = crossHeight(s.h1, s.h2);
      if (close(s.y, c)) return done(true, `The ${f2(s.y)} m prop meets the crossing exactly!`);
      return done(false, `The wires cross at ${f2(c)} m, so the ${f2(s.y)} m prop ${s.y < c ? "falls short by" : "would poke up by"} ${f2(Math.abs(c - s.y))} m.`);
    }
    case "tri-tower": {
      const top = towerHeight(s.dist, s.angle, s.eye);
      if (close(s.h, top)) return done(true, `The ${s.angle}° sight line grazes the very top of the ${f2(s.h)} m ${s.what}!`);
      return done(false, `The ${s.angle}° sight line reaches the ${s.what} at ${f2(top)} m, so a ${f2(s.h)} m ${s.what} is ${s.h < top ? "too short" : "too tall"}.`);
    }
    case "tri-tower2": {
      const sep = distanceForAngle(s.h, s.a1) - distanceForAngle(s.h, s.a2);
      if (close(sep, s.gap)) return done(true, `The ${s.a1}° and ${s.a2}° spots are exactly ${f2(sep)} m apart!`);
      return done(false, `For a ${f2(s.h)} m ${s.what}, the ${s.a1}° and ${s.a2}° spots are ${f2(sep)} m apart, not ${f2(s.gap)} m.`);
    }
  }
}
