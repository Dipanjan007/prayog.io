/**
 * Trigonometric ratios (NCERT Class 10 Mathematics, "Introduction to Trigonometry").
 * Pure functions for the RampLab sim: a slide at angle θ whose length you can change,
 * sin θ, cos θ and tan θ as side ratios, the table for 30°, 45° and 60°,
 * sin²θ + cos²θ = 1, and ramps built from a rise and a run.
 */

const RAD = Math.PI / 180;

/** Angle slider (degrees). The ends, 5° and 85°, show a nearly flat and a nearly upright slide. */
export const ANGLE = { min: 5, max: 85, step: 1 };
/** Slide length slider (m). */
export const LEN = { min: 1, max: 5, step: 0.5 };
/** Build mode: rise and run in tenths of a metre (0.1 m to 1.2 m up, 0.1 m to 3.6 m along). */
export const RISE = { min: 1, max: 12, step: 1 };
export const RUN = { min: 1, max: 36, step: 1 };

export interface Ratios {
  sin: number;
  cos: number;
  tan: number;
}

export function ratios(thetaDeg: number): Ratios {
  const t = thetaDeg * RAD;
  return { sin: Math.sin(t), cos: Math.cos(t), tan: Math.tan(t) };
}

/** Sides of a right triangle whose hypotenuse (the slide) is L long and makes θ with the ground. */
export function slideSides(thetaDeg: number, L: number) {
  const r = ratios(thetaDeg);
  return { opp: L * r.sin, adj: L * r.cos, hyp: L };
}

/** The ratios worked out from the sides themselves, the way a student measures them. */
export function sideRatios(opp: number, adj: number, hyp: number): Ratios {
  return { sin: opp / hyp, cos: adj / hyp, tan: opp / adj };
}

/** sin²θ + cos²θ, which is always 1. */
export function identity(thetaDeg: number) {
  const r = ratios(thetaDeg);
  return r.sin ** 2 + r.cos ** 2;
}

/** A ramp built from a rise and a run given in tenths of a metre. Lengths come back in metres. */
export function buildRamp(riseDm: number, runDm: number) {
  const hypDm = Math.hypot(riseDm, runDm);
  return {
    rise: riseDm / 10,
    run: runDm / 10,
    hyp: hypDm / 10,
    sin: riseDm / hypDm,
    cos: runDm / hypDm,
    tan: riseDm / runDm,
    theta: Math.atan2(riseDm, runDm) / RAD,
  };
}

/** The exact values from the NCERT table, as text and as numbers. */
export const TABLE: { deg: 30 | 45 | 60; sin: [string, number]; cos: [string, number]; tan: [string, number] }[] = [
  { deg: 30, sin: ["1 ÷ 2", 1 / 2], cos: ["√3 ÷ 2", Math.sqrt(3) / 2], tan: ["1 ÷ √3", 1 / Math.sqrt(3)] },
  { deg: 45, sin: ["1 ÷ √2", 1 / Math.SQRT2], cos: ["1 ÷ √2", 1 / Math.SQRT2], tan: ["1", 1] },
  { deg: 60, sin: ["√3 ÷ 2", Math.sqrt(3) / 2], cos: ["1 ÷ 2", 1 / 2], tan: ["√3", Math.sqrt(3)] },
];

/** True when the rise and run are in the ratio 3 : 4, which makes a 3-4-5 triangle. */
export function is345(riseDm: number, runDm: number) {
  return riseDm * 4 === runDm * 3;
}

/** Challenge: build a ramp whose sin, cos or tan is a given fraction. */
export interface RampRound {
  name: string;
  brief: string;
  ratio: "sin" | "cos" | "tan";
  num: number;
  den: number;
}

export function meetsRampRound(riseDm: number, runDm: number, round: RampRound) {
  const r = buildRamp(riseDm, runDm);
  return Math.abs(r[round.ratio] - round.num / round.den) < 1e-9;
}

/** Every (rise, run) on the sliders that passes a round. */
export function rampSolutions(round: RampRound) {
  const out: [number, number][] = [];
  for (let rise = RISE.min; rise <= RISE.max; rise += RISE.step)
    for (let run = RUN.min; run <= RUN.max; run += RUN.step) if (meetsRampRound(rise, run, round)) out.push([rise, run]);
  return out;
}

/** Show a ratio to 3 decimal places, without a stray "−0". */
export function ratioText(v: number) {
  if (!Number.isFinite(v)) return "∞";
  return v.toFixed(3);
}
