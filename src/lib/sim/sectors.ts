/**
 * Areas related to circles (NCERT Class 10 Mathematics, "Areas Related to Circles").
 * Pure functions for the SectorLab sim: arc length (θ ÷ 360) × 2πr, sector area
 * (θ ÷ 360) × πr², and a minor segment as sector − triangle.
 */

const RAD = Math.PI / 180;

/** Angle at the centre (degrees). A pizza slice can be anything up to the whole pizza. */
export const THETA = { min: 1, max: 360, step: 1 };
/** In Segment the angle stops at 180°, where the chord becomes a diameter. */
export const SEG_THETA = { min: 1, max: 180, step: 1 };
/** Radius slider. */
export const RADIUS = { min: 1, max: 14, step: 1 };

/** Arc length: (θ ÷ 360) × 2πr. */
export function arcLength(thetaDeg: number, r: number) {
  return (thetaDeg / 360) * 2 * Math.PI * r;
}

/** Sector area: (θ ÷ 360) × πr². */
export function sectorArea(thetaDeg: number, r: number) {
  return (thetaDeg / 360) * Math.PI * r * r;
}

/** Area of the triangle made by the two radii and the chord: (1 ÷ 2) × r² × sin θ. */
export function triangleArea(thetaDeg: number, r: number) {
  return 0.5 * r * r * Math.sin(thetaDeg * RAD);
}

/** Area of the minor segment (θ up to 180°): sector − triangle. */
export function segmentArea(thetaDeg: number, r: number) {
  return sectorArea(thetaDeg, r) - triangleArea(thetaDeg, r);
}

/** Length of the chord: 2r × sin(θ ÷ 2). */
export function chordLength(thetaDeg: number, r: number) {
  return 2 * r * Math.sin((thetaDeg / 2) * RAD);
}

/** Two decimal places, the way the sim shows areas and lengths. */
export function to2(v: number) {
  return Math.round(v * 100) / 100;
}

/** Challenge: cut a slice to order. The radius is given; the student sets the angle. */
export interface SliceRound {
  name: string;
  brief: string;
  r: number;
  unit: "cm" | "m";
  /** What has to match: the angle itself, the arc length or the sector area. */
  kind: "theta" | "arc" | "area";
  target: number;
  /** How close the arc or area must be. */
  tol: number;
}

export function sliceValue(thetaDeg: number, round: SliceRound) {
  if (round.kind === "theta") return thetaDeg;
  if (round.kind === "arc") return arcLength(thetaDeg, round.r);
  return sectorArea(thetaDeg, round.r);
}

export function meetsSliceRound(thetaDeg: number, round: SliceRound) {
  return Math.abs(sliceValue(thetaDeg, round) - round.target) <= round.tol + 1e-9;
}

/** Every angle on the slider that passes a round. */
export function sliceSolutions(round: SliceRound) {
  const out: number[] = [];
  for (let t = THETA.min; t <= THETA.max; t += THETA.step) if (meetsSliceRound(t, round)) out.push(t);
  return out;
}
