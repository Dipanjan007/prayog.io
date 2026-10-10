/**
 * Surface areas and volumes (NCERT Class 10 Mathematics, Chapter 12 "Surface Areas and Volumes").
 * Pure functions for the SolidsLab sim: cylinders, cones, hemispheres and spheres, and solids
 * made by joining them (an ice-cream cone, a capsule, a tent). This lab uses π = 22/7 everywhere.
 */

/** The lab's value of π, as in most NCERT examples. */
export const PI = 22 / 7;

/** Sliders (cm for the cone and capsule, m for the tent). */
export const R_RANGE = { min: 0.5, max: 10, step: 0.1 };
export const H_RANGE = { min: 0.5, max: 20, step: 0.1 };
/** The tent's cone height. */
export const CAP_RANGE = { min: 0.5, max: 6, step: 0.1 };

/** Slant height of a cone: l = √(r² + h²). */
export function slant(r: number, h: number) {
  return Math.sqrt(r * r + h * h);
}

export const cylinder = {
  volume: (r: number, h: number) => PI * r * r * h,
  curved: (r: number, h: number) => 2 * PI * r * h,
};

export const cone = {
  volume: (r: number, h: number) => (PI * r * r * h) / 3,
  curved: (r: number, h: number) => PI * r * slant(r, h),
};

export const hemisphere = {
  volume: (r: number) => (2 * PI * r * r * r) / 3,
  curved: (r: number) => 2 * PI * r * r,
};

export const sphere = {
  volume: (r: number) => (4 * PI * r * r * r) / 3,
  surface: (r: number) => 4 * PI * r * r,
};

export type SolidId = "icecream" | "capsule" | "tent" | "cylinder";

export interface SolidDims {
  r: number;
  /** Cone height (ice cream), cylinder length (capsule, tent, cylinder). */
  h: number;
  /** Cone height on top of the tent. */
  H: number;
}

export const SOLIDS: { id: SolidId; label: string; emoji: string; unit: "cm" | "m"; hLabel: string }[] = [
  { id: "icecream", label: "Ice-cream cone", emoji: "🍦", unit: "cm", hLabel: "Cone height h" },
  { id: "capsule", label: "Capsule", emoji: "💊", unit: "cm", hLabel: "Cylinder length h" },
  { id: "tent", label: "Tent", emoji: "⛺", unit: "m", hLabel: "Wall height h" },
  { id: "cylinder", label: "Cylinder tub", emoji: "🥫", unit: "cm", hLabel: "Height h" },
];

/** Volume of a joined solid: just add the parts. */
export function solidVolume(id: SolidId, { r, h, H }: SolidDims) {
  switch (id) {
    case "icecream":
      return cone.volume(r, h) + hemisphere.volume(r);
    case "capsule":
      return cylinder.volume(r, h) + 2 * hemisphere.volume(r);
    case "tent":
      return cylinder.volume(r, h) + cone.volume(r, H);
    case "cylinder":
      return cylinder.volume(r, h);
  }
}

/**
 * Outside surface you can see (or paint, or sew): only the outer curved parts.
 * Faces where two parts join are hidden, and the tent has no floor. The cylinder tub is
 * closed: two circles and the curved side.
 */
export function solidSurface(id: SolidId, { r, h, H }: SolidDims) {
  switch (id) {
    case "icecream":
      return cone.curved(r, h) + hemisphere.curved(r);
    case "capsule":
      return cylinder.curved(r, h) + 2 * hemisphere.curved(r);
    case "tent":
      return cylinder.curved(r, h) + cone.curved(r, H);
    case "cylinder":
      return cylinder.curved(r, h) + 2 * PI * r * r;
  }
}

/** Pour mode: a glass cylinder with r = 3.5 cm and h = 7 cm, so h = 2r. */
export const GLASS = { r: 3.5, h: 7 };
export type PourSource = "cone" | "ball";

/** What one pour holds: a cone with the glass's base and height, or a ball that just fits in the glass. */
export function pourVolume(src: PourSource) {
  return src === "cone" ? cone.volume(GLASS.r, GLASS.h) : sphere.volume(GLASS.r);
}

export function glassVolume() {
  return cylinder.volume(GLASS.r, GLASS.h);
}

/** Fraction of the glass filled after n pours (can be more than 1: it spills). */
export function fillAfter(src: PourSource, n: number) {
  return (n * pourVolume(src)) / glassVolume();
}

/** Round to 2 decimal places, as the readouts show. */
export function round2(v: number) {
  return Math.round(v * 100) / 100;
}

/** True when the new dimensions are every old one times 2 (the same solid scaled up). */
export function isDoubled(id: SolidId, small: SolidDims, big: SolidDims, tol = 1e-6) {
  const same = (a: number, b: number) => Math.abs(2 * a - b) < tol;
  return same(small.r, big.r) && same(small.h, big.h) && (id !== "tent" || same(small.H, big.H));
}

/** Challenge rounds: work out an answer from the volumes or surface areas the lab shows. */
export interface SolidRound {
  name: string;
  brief: string;
  /** The solid the lab starts on for this round. */
  start: SolidId;
  unit: string;
  answer: number;
  /** Allowed error as a fraction of the answer. */
  tol: number;
}

export function closeEnough(guess: number, r: SolidRound) {
  return Number.isFinite(guess) && Math.abs(guess - r.answer) <= r.tol * Math.abs(r.answer) + 1e-9;
}

/** Number of ice-cream cones (cone + hemisphere) a full cylinder tub fills. */
export function conesFromTub(tub: SolidDims, scoop: SolidDims) {
  return solidVolume("cylinder", tub) / solidVolume("icecream", scoop);
}
