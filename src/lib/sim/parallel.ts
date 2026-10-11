/**
 * Parallel and intersecting lines (NCERT Class 7 Ganita Prakash, "Parallel and Intersecting Lines").
 * Pure functions for the RailCrossing sim: two railway lines cut by a road (the transversal),
 * the eight angles it makes, the special pairs among them and the angle test for parallel lines.
 *
 * Directions are in whole degrees, measured anticlockwise from "pointing right".
 * A rail's direction is its tilt (0 = level); the road's direction points up the screen.
 */

/** The eight angles: a, b, c, d where the road crosses the top line, e, f, g, h at the bottom line. */
export type AngleName = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
export const ANGLE_NAMES: AngleName[] = ["a", "b", "c", "d", "e", "f", "g", "h"];

/**
 * At each crossing the four angles go clockwise from the top left:
 * a (above the line, left of the road), b (above, right), c (below, right), d (below, left).
 * The same order gives e, f, g, h at the bottom line.
 */
export type Corner = "upper-left" | "upper-right" | "lower-right" | "lower-left";
export const CORNER: Record<AngleName, { line: "top" | "bottom"; corner: Corner }> = {
  a: { line: "top", corner: "upper-left" },
  b: { line: "top", corner: "upper-right" },
  c: { line: "top", corner: "lower-right" },
  d: { line: "top", corner: "lower-left" },
  e: { line: "bottom", corner: "upper-left" },
  f: { line: "bottom", corner: "upper-right" },
  g: { line: "bottom", corner: "lower-right" },
  h: { line: "bottom", corner: "lower-left" },
};

/** The angle between a rail's right-hand ray and the road's upward ray: θ = road − tilt. */
export function crossingAngle(road: number, tilt: number) {
  return road - tilt;
}

/** The four angles at one crossing, from θ (the upper-right angle). */
export function cornerAngles(theta: number): Record<Corner, number> {
  return { "upper-left": 180 - theta, "upper-right": theta, "lower-right": 180 - theta, "lower-left": theta };
}

/** All eight angles for a road direction and the tilts of the top and bottom lines. */
export function allAngles(road: number, topTilt: number, bottomTilt: number): Record<AngleName, number> {
  const top = cornerAngles(crossingAngle(road, topTilt));
  const bottom = cornerAngles(crossingAngle(road, bottomTilt));
  const out = {} as Record<AngleName, number>;
  for (const n of ANGLE_NAMES) out[n] = (CORNER[n].line === "top" ? top : bottom)[CORNER[n].corner];
  return out;
}

/** Two lines are parallel when they point the same way (same tilt). */
export function isParallel(topTilt: number, bottomTilt: number) {
  return topTilt === bottomTilt;
}

/**
 * Which side two crooked lines meet on, with the bottom line drawn below the top one.
 * Tilting the bottom line anticlockwise lifts its right end towards the top line, so they meet on the right.
 */
export function meetSide(topTilt: number, bottomTilt: number): "left" | "right" | null {
  if (isParallel(topTilt, bottomTilt)) return null;
  return bottomTilt > topTilt ? "right" : "left";
}

/** The two co-interior sums: on the left of the road (∠d + ∠e) and on the right (∠c + ∠f). */
export function interiorSums(road: number, topTilt: number, bottomTilt: number) {
  const ang = allAngles(road, topTilt, bottomTilt);
  return { left: ang.d + ang.e, right: ang.c + ang.f };
}

export type PairKind = "corresponding" | "alternate" | "co-interior" | "vertical" | "linear";
export const PAIR_KINDS: PairKind[] = ["corresponding", "alternate", "co-interior", "vertical", "linear"];

export const PAIR_LABEL: Record<PairKind, string> = {
  corresponding: "Corresponding",
  alternate: "Alternate",
  "co-interior": "Co-interior",
  vertical: "Vertically opposite",
  linear: "Linear pair",
};

/** The pairs of each kind. Alternate and co-interior pairs are the ones between the two lines. */
export const PAIRS: Record<PairKind, [AngleName, AngleName][]> = {
  corresponding: [
    ["a", "e"],
    ["b", "f"],
    ["c", "g"],
    ["d", "h"],
  ],
  alternate: [
    ["d", "f"],
    ["c", "e"],
  ],
  "co-interior": [
    ["d", "e"],
    ["c", "f"],
  ],
  vertical: [
    ["a", "c"],
    ["b", "d"],
    ["e", "g"],
    ["f", "h"],
  ],
  linear: [
    ["a", "b"],
    ["c", "d"],
    ["e", "f"],
    ["g", "h"],
  ],
};

/** What the rule for a pair kind says: equal angles, or angles that add up to 180°. */
export function pairRule(kind: PairKind): "equal" | "sum180" {
  return kind === "co-interior" || kind === "linear" ? "sum180" : "equal";
}

/** Does this pair obey its rule right now? */
export function pairHolds(kind: PairKind, x: number, y: number) {
  return pairRule(kind) === "equal" ? x === y : x + y === 180;
}

/** Does every pair of this kind obey its rule for these lines? */
export function kindHolds(kind: PairKind, road: number, topTilt: number, bottomTilt: number) {
  const ang = allAngles(road, topTilt, bottomTilt);
  return PAIRS[kind].every(([p, q]) => pairHolds(kind, ang[p], ang[q]));
}

/** Rail tilt range (degrees) and road range, chosen so every angle stays between 25° and 155°. */
export const TILT_RANGE = { min: -15, max: 15 };
export const ROAD_RANGE = { min: 40, max: 140 };
/** How far the bottom line can slide up or down, in steps. */
export const SLIDE_RANGE = { min: -2, max: 2 };

/** Keep a value inside a range. */
export function clampTo(v: number, r: { min: number; max: number }) {
  return Math.max(r.min, Math.min(r.max, v));
}

/**
 * The road direction for a drag: the pointer's direction from the pivot (screen y grows downwards),
 * folded onto the upward half of the road and kept in range, in whole degrees.
 */
export function roadFromDrag(dx: number, dy: number) {
  let deg = (Math.atan2(-dy, dx) * 180) / Math.PI;
  if (deg < 0) deg += 180;
  return clampTo(Math.round(deg), ROAD_RANGE);
}

/** Challenge: lay the bottom line parallel to the top one, seeing only two angles. */
export interface AlignRound {
  name: string;
  brief: string;
  /** "rail" draws tracks and a road; "ladder" draws rungs and the ladder's side rail. */
  skin: "rail" | "ladder";
  road: number;
  topTilt: number;
  /** Where the bottom line starts (not parallel). */
  startTilt: number;
  /** The angle shown at the top line, and the angle shown at the bottom line as you turn it. */
  known: AngleName;
  see: AngleName;
}

/** The pair kind that links two angle names, if any. */
export function kindOf(p: AngleName, q: AngleName): PairKind | null {
  for (const k of PAIR_KINDS) if (PAIRS[k].some(([x, y]) => (x === p && y === q) || (x === q && y === p))) return k;
  return null;
}

/** The bottom tilts in range that make the round's lines parallel. */
export function alignSolutions(r: AlignRound) {
  const out: number[] = [];
  for (let t = TILT_RANGE.min; t <= TILT_RANGE.max; t++) if (isParallel(r.topTilt, t)) out.push(t);
  return out;
}

/** The value the "see" angle must show when the lines are parallel. */
export function targetSee(r: AlignRound) {
  return allAngles(r.road, r.topTilt, r.topTilt)[r.see];
}

/** Free play starts with a crooked bottom rail, so lining it up is the student's job. */
export const FREE_START = { road: 65, topTilt: 0, bottomTilt: 8 };

/** Has the student laid the round's new line parallel? */
export function alignOk(r: AlignRound, bottomTilt: number) {
  return isParallel(r.topTilt, bottomTilt);
}
