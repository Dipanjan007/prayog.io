/**
 * Force physics for the Class 8 "Exploring Forces" lesson.
 * Pure functions, so they can be unit tested.
 */

/** Acceleration due to gravity near the Earth's surface, m/s². */
export const G_EARTH = 9.8;
/** On the Moon gravity is about one sixth as strong. */
export const G_MOON = 1.6;

export type SurfaceId = "ice" | "wood" | "carpet" | "sand";

/**
 * Typical friction coefficients for a wooden crate on each floor.
 * muS: static (before it slides), muK: kinetic (while sliding). muK is always below muS.
 * These are rounded, textbook-style values; real floors vary.
 */
export const SURFACES: Record<SurfaceId, { label: string; muS: number; muK: number; color: string }> = {
  ice: { label: "Ice", muS: 0.1, muK: 0.05, color: "#bae6fd" },
  wood: { label: "Wood", muS: 0.5, muK: 0.3, color: "#b45309" },
  carpet: { label: "Carpet", muS: 0.6, muK: 0.45, color: "#9f1239" },
  sand: { label: "Sand", muS: 0.8, muK: 0.6, color: "#d6b370" },
};

/** The crate: 20 kg, 0.6 m wide. Track: a 6 m floor with a wall at the end. */
export const CRATE_MASS = 20;
export const CRATE_WIDTH = 0.6;
export const TRACK_LENGTH = 6;
export const MAX_PUSH = 300;

export type FrictionKind = "none" | "static" | "kinetic";

/** Weight in newtons: W = m × g. */
export function weight(massKg: number, g = G_EARTH) {
  return massKg * g;
}

/** Biggest static friction the floor can give before the crate starts to slide. */
export function maxStatic(surface: SurfaceId, mass = CRATE_MASS) {
  return SURFACES[surface].muS * weight(mass);
}

/** Sliding (kinetic) friction while the crate moves. */
export function kinetic(surface: SurfaceId, mass = CRATE_MASS) {
  return SURFACES[surface].muK * weight(mass);
}

/**
 * Friction on the crate (a size in newtons, always pointing backwards, against the push or motion).
 * The push is forwards and never negative.
 */
export function frictionOn(push: number, v: number, surface: SurfaceId, mass = CRATE_MASS): { friction: number; kind: FrictionKind } {
  if (v > 0) return { friction: kinetic(surface, mass), kind: "kinetic" };
  if (push <= 0) return { friction: 0, kind: "none" };
  // At rest, static friction matches the push exactly, up to its limit.
  if (push <= maxStatic(surface, mass)) return { friction: push, kind: "static" };
  return { friction: kinetic(surface, mass), kind: "kinetic" };
}

export interface CrateState {
  /** Position of the crate's back (left) edge, metres from the start line. */
  x: number;
  /** Speed in m/s (only forwards). */
  v: number;
}

/**
 * Advance the crate by dt seconds with a steady push.
 * Friction can slow the crate to a stop but never pushes it backwards.
 * The wall at the end of the floor stops the crate dead.
 */
export function stepCrate(s: CrateState, push: number, surface: SurfaceId, dt: number, mass = CRATE_MASS): CrateState & { hitWall: boolean } {
  const { friction } = frictionOn(push, s.v, surface, mass);
  const a = (push - friction) / mass;
  if (s.v === 0 && a <= 0) return { x: s.x, v: 0, hitWall: false };
  let v = s.v + a * dt;
  let x: number;
  if (v <= 0) {
    // Stopped part-way through the step: travel only until the speed reaches zero.
    const t0 = -s.v / a;
    x = s.x + (s.v * t0) / 2;
    v = 0;
  } else {
    x = s.x + ((s.v + v) / 2) * dt;
  }
  const end = TRACK_LENGTH - CRATE_WIDTH;
  if (x >= end) return { x: end, v: 0, hitWall: true };
  return { x, v, hitWall: false };
}

/** How far a sliding crate goes after you let go: v² ÷ (2 μk g). */
export function slideDistance(v: number, surface: SurfaceId) {
  return (v * v) / (2 * SURFACES[surface].muK * G_EARTH);
}

/* ---------- Spring balance ---------- */

export const ITEMS = [
  { id: "apple", label: "Apple", emoji: "🍎", mass: 0.2 },
  { id: "ball", label: "Cricket ball", emoji: "🏏", mass: 0.16 },
  { id: "bottle", label: "Water bottle", emoji: "🧴", mass: 1 },
  { id: "bag", label: "School bag", emoji: "🎒", mass: 3 },
  { id: "rice", label: "Rice bag", emoji: "🌾", mass: 5 },
] as const;
export type ItemId = (typeof ITEMS)[number]["id"];

/** The spring balance reads 0 to 50 N. */
export const BALANCE_MAX = 50;

/** Stretch of the spring as a fraction of its full-scale stretch. The stretch grows in step with the weight. */
export function springStretch(weightN: number) {
  return Math.min(1, Math.max(0, weightN / BALANCE_MAX));
}

/* ---------- Non-contact forces ---------- */

export type SourceId = "magnet" | "rubbed" | "plain";
export type PieceId = "pins" | "paper";

export const SOURCES: Record<SourceId, { label: string }> = {
  magnet: { label: "Bar magnet" },
  rubbed: { label: "Rubbed comb" },
  plain: { label: "Plain comb" },
};
export const PIECES: Record<PieceId, { label: string }> = {
  pins: { label: "Steel pins" },
  paper: { label: "Paper bits" },
};

/**
 * Distance (cm) at which each source can just lift each kind of piece.
 * Illustrative values: a magnet pulls iron and steel, not paper. A comb rubbed in dry hair
 * picks up light paper bits, but its pull is far too weak to lift steel pins.
 * A plain comb has no charge, so it pulls nothing.
 */
const LIFT_RANGE: Record<SourceId, Record<PieceId, number>> = {
  magnet: { pins: 3, paper: 0 },
  rubbed: { pins: 0, paper: 2 },
  plain: { pins: 0, paper: 0 },
};

/**
 * Pull on the pieces compared with their weight, at a gap of d cm.
 * The pull grows quickly as the gap shrinks (modelled as 1/d²), so it is 1 exactly at the lift range.
 * A ratio of 1 or more means the pull beats gravity and the pieces jump up.
 */
export function pullRatio(source: SourceId, piece: PieceId, d: number) {
  const r = LIFT_RANGE[source][piece];
  if (r === 0) return 0;
  return (r * r) / (d * d);
}

export function lifts(source: SourceId, piece: PieceId, d: number) {
  return pullRatio(source, piece, d) >= 1;
}
