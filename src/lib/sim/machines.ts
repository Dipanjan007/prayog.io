/**
 * Work, power, pulleys and the inclined plane (NCERT Class 9 Exploration, chapter 7).
 * Pure functions for the MachineBench sim. Strings and pulleys are light; loads move at a
 * steady (very slow) speed, so the applied force just balances the forces against it.
 */

/** Acceleration due to gravity near the Earth's surface (m/s²), as NCERT uses. */
export const G = 9.8;
const RAD = Math.PI / 180;

/** Weight in newtons of a mass in kg. */
export function weight(m: number) {
  return m * G;
}

/** W = F d cos θ, where θ is the angle between the force and the displacement. */
export function work(F: number, d: number, thetaDeg: number) {
  const w = F * d * Math.cos(thetaDeg * RAD);
  // cos 90° is not exactly 0 in floating point: snap tiny values to a clean zero.
  return Math.abs(w) < 1e-9 * Math.max(1, Math.abs(F * d)) ? 0 : w;
}

export type WorkSign = "positive" | "negative" | "zero";

export function workSign(W: number): WorkSign {
  return W > 1e-9 ? "positive" : W < -1e-9 ? "negative" : "zero";
}

/* ---------- Work meter ---------- */

export type WorkAction = "lift" | "lower" | "carry" | "push";

/** Kinetic friction between a box and a floor, for the push action. */
export const FLOOR_MU = 0.3;

export const WORK_ACTIONS: Record<WorkAction, { label: string; theta: number; text: string }> = {
  lift: { label: "Lift", theta: 0, text: "Your hand pulls up and the bag moves up." },
  lower: { label: "Lower", theta: 180, text: "Your hand still holds up, but the bag moves down." },
  carry: { label: "Carry level", theta: 90, text: "Your hand holds up while you walk sideways." },
  push: { label: "Push a box", theta: 0, text: "You push the box along the floor in the direction it moves." },
};

export interface WorkRun {
  action: WorkAction;
  /** Your force (N) and its angle to the displacement (degrees). */
  F: number;
  theta: number;
  d: number;
  /** Work done by you, by gravity and by friction (J). */
  W: number;
  Wg: number;
  Wf: number;
}

/**
 * One slow, steady move of distance d (m) with a mass m (kg). You hold the bag up with a force
 * equal to its weight, or push the box with a force equal to the floor's friction.
 */
export function workMeterRun(action: WorkAction, m: number, d: number, mu = FLOOR_MU): WorkRun {
  const mg = weight(m);
  const theta = WORK_ACTIONS[action].theta;
  if (action === "push") {
    const F = mu * mg;
    return { action, F, theta, d, W: work(F, d, 0), Wg: work(mg, d, 90), Wf: work(F, d, 180) };
  }
  // Gravity acts down. It is opposite to your upward hold, so its angle is 180° − θ.
  return { action, F: mg, theta, d, W: work(mg, d, theta), Wg: work(mg, d, 180 - theta), Wf: 0 };
}

/* ---------- Pulleys ---------- */

export type PulleyId = "fixed" | "movable" | "pair" | "tackle3" | "tackle4";

export interface PulleySetup {
  id: PulleyId;
  label: string;
  /** Rope strands holding up the moving load: the ideal mechanical advantage. */
  n: number;
  /** Number of pulleys (each adds a little friction). */
  k: number;
  /** True when the effort pulls up rather than down. */
  effortUp: boolean;
}

export const PULLEYS: PulleySetup[] = [
  { id: "fixed", label: "1 fixed", n: 1, k: 1, effortUp: false },
  { id: "movable", label: "1 movable", n: 2, k: 1, effortUp: true },
  { id: "pair", label: "Fixed + movable", n: 2, k: 2, effortUp: false },
  { id: "tackle3", label: "Block and tackle (3)", n: 3, k: 3, effortUp: false },
  { id: "tackle4", label: "Block and tackle (4)", n: 4, k: 4, effortUp: false },
];

/** Small-friction model: each pulley passes on this fraction of the rope force. */
export const PULLEY_EFFICIENCY = 0.97;

export function pulleySetup(id: PulleyId) {
  return PULLEYS.find((p) => p.id === id)!;
}

/** Effort (N) needed to raise a load (N) slowly with n strands over k pulleys. */
export function pulleyEffort(load: number, n: number, k: number, friction: boolean) {
  return load / (n * (friction ? PULLEY_EFFICIENCY ** k : 1));
}

/** Rope you must pull (m) to lift the load by h: each of the n strands shortens by h. */
export function ropePulled(h: number, n: number) {
  return n * h;
}

/** Mechanical advantage = load ÷ effort. */
export function mechanicalAdvantage(load: number, effort: number) {
  return load / effort;
}

/** Efficiency = work out ÷ work in = (load × load distance) ÷ (effort × effort distance). */
export function efficiency(load: number, loadDistance: number, effort: number, effortDistance: number) {
  return (load * loadDistance) / (effort * effortDistance);
}

/* ---------- Inclined plane ---------- */

/** Rolling friction coefficient for a hand cart's wheels on a plank ramp. */
export const RAMP_MU = 0.05;

/** Slope angle (degrees) of a ramp of length L reaching height h. */
export function rampAngle(h: number, L: number) {
  return Math.asin(Math.min(1, h / L)) / RAD;
}

/** Spring balance reading (N) pulling mass m slowly up a ramp of length L to height h, along the ramp. */
export function rampForce(m: number, h: number, L: number, mu = 0) {
  const s = Math.min(1, h / L);
  const c = Math.sqrt(1 - s * s);
  return weight(m) * (s + mu * c);
}

/** Shortest ramp (m) that keeps the pull at or below maxF, or null if no ramp up to maxL works. */
export function shortestRamp(m: number, h: number, maxF: number, mu: number, maxL = 100) {
  if (rampForce(m, h, maxL, mu) > maxF) return null;
  let lo = h;
  let hi = maxL;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (rampForce(m, h, mid, mu) <= maxF) hi = mid;
    else lo = mid;
  }
  return hi;
}

/* ---------- Power ---------- */

/** P = W ÷ t, in watts. */
export function power(W: number, t: number) {
  return W / t;
}

/** Time (s) for a motor of power P to lift m kg through h m at a steady speed. */
export function liftTime(m: number, h: number, P: number) {
  return (weight(m) * h) / P;
}

/** kg-force to newtons: a 60 kg-force limit is 60 × 9.8 N. */
export function kgf(kg: number) {
  return weight(kg);
}
