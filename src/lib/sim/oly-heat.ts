/**
 * Olympiad track: heat and temperature (method of mixtures, latent heat of fusion).
 * No heat is lost to the room. Pure functions shared by the OlyHeat sim and the problem answers.
 */

/** Specific heat capacities (J/kg K) and latent heat of fusion of ice (J/kg). */
export const C_WATER = 4186;
export const C_ICE = 2100;
export const C_STEEL = 500;
export const C_GLASS = 840;
export const L_ICE = 334000;

/** Anything that only changes temperature: a liquid or the vessel itself. Mass in kg, T in °C. */
export interface HeatBody {
  label: string;
  m: number;
  c: number;
  T: number;
  /** "liquid" fills the vessel; "vessel" is the cup or bucket; "pour" is a liquid added during the run. */
  role: "liquid" | "vessel" | "pour";
}

/** Ice added to the vessel: mass (kg) and starting temperature (°C, at or below 0). */
export interface HeatIce {
  m: number;
  T: number;
}

export interface Equilibrium {
  /** Final temperature (°C). */
  T: number;
  /** Ice left unmelted (kg); 0 if there was no ice or it all melted. */
  iceLeft: number;
}

/**
 * Final state of a mixture with no heat lost. Heat is counted from "liquid water at 0 °C",
 * so ice carries −L per kg plus c_ice × T. Total heat H decides the case:
 * H ≥ 0, all ice melts; −mL ≤ H < 0, ice and water at 0 °C; below that, everything ends below 0
 * (the liquids are then treated as not freezing, which never happens in these problems).
 */
export function equilibrium(bodies: HeatBody[], ice?: HeatIce): Equilibrium {
  const C = bodies.reduce((a, b) => a + b.m * b.c, 0);
  const Q = bodies.reduce((a, b) => a + b.m * b.c * b.T, 0);
  if (!ice || ice.m <= 0) return { T: Q / C, iceLeft: 0 };
  const H = Q + ice.m * (C_ICE * ice.T - L_ICE);
  if (H >= 0) return { T: H / (C + ice.m * C_WATER), iceLeft: 0 };
  if (H >= -ice.m * L_ICE) return { T: 0, iceLeft: -H / L_ICE };
  return { T: (H + ice.m * L_ICE) / (C + ice.m * C_ICE), iceLeft: ice.m };
}

/** Mass of hot water (same units as mCold) to mix with cold water to reach target T. */
export function hotWaterForMix(mCold: number, tCold: number, tHot: number, target: number) {
  return (mCold * (target - tCold)) / (tHot - target);
}

/**
 * Mass (kg) of a liquid (specific heat c, temperature tAdd) to add so that all the bodies end at target.
 * Heat given out by the bodies = heat taken in by the added liquid.
 */
export function addedMassForTarget(bodies: HeatBody[], c: number, tAdd: number, target: number) {
  const given = bodies.reduce((a, b) => a + b.m * b.c * (b.T - target), 0);
  return given / (c * (target - tAdd));
}

/** Mass (kg) of ice at tIce (≤ 0 °C) to add so that the mixture ends at 0 °C with `left` kg of ice still floating. */
export function iceForLeftover(bodies: HeatBody[], tIce: number, left: number) {
  const Q = bodies.reduce((a, b) => a + b.m * b.c * b.T, 0); // heat given out cooling everything to 0 °C
  return (Q + left * L_ICE) / (L_ICE - C_ICE * tIce);
}

export type HeatGoal = { type: "temp"; T: number; band: number } | { type: "ice"; left: number; band: number };

export interface HeatMixScene {
  kind: "heat-mix";
  vessel: "bucket" | "tumbler" | "glass";
  /** What is in (or is) the vessel before the run, plus anything poured in during it. */
  bodies: HeatBody[];
  ice?: HeatIce;
  goal: HeatGoal;
}

export type HeatScene = HeatMixScene;

/** True for every scene this sim draws. */
export function isHeatScene(s: { kind: string }): s is HeatScene {
  return s.kind.startsWith("heat-");
}

/** Seconds: pouring in, then settling. */
export const POUR_S = 1.2;
export const SETTLE_S = 3.3;
/** Settling time constant (s) for the animation. */
export const TAU_S = 0.6;

/** How far the settling has gone at time t (0 before mixing starts, near 1 at the end). */
export function settleFraction(t: number) {
  if (t <= POUR_S) return 0;
  const f = 1 - Math.exp(-(t - POUR_S) / TAU_S);
  const fEnd = 1 - Math.exp(-SETTLE_S / TAU_S);
  return Math.min(1, f / fEnd);
}

export function planHeat(s: HeatScene): { outcome: { ok: boolean; text: string }; duration: number; eq: Equilibrium } {
  const eq = equilibrium(s.bodies, s.ice);
  const duration = POUR_S + SETTLE_S;
  const g = s.goal;
  if (g.type === "temp") {
    const d = eq.T - g.T;
    const ok = Math.abs(d) <= g.band;
    const text = ok
      ? `It settles at ${eq.T.toFixed(1)} °C, right on the target!`
      : `It settles at ${eq.T.toFixed(1)} °C, ${Math.abs(d).toFixed(1)} °C too ${d > 0 ? "hot" : "cold"}.`;
    return { outcome: { ok, text }, duration, eq };
  }
  const leftG = eq.iceLeft * 1000;
  const wantG = g.left * 1000;
  if (eq.iceLeft <= 0) {
    return { outcome: { ok: false, text: `All the ice melts and the drink ends at ${eq.T.toFixed(1)} °C. No ice is left floating.` }, duration, eq };
  }
  const ok = Math.abs(eq.iceLeft - g.left) <= g.band;
  const text = ok
    ? `It settles at 0 °C with ${leftG.toFixed(0)} g of ice still floating, just as planned!`
    : `It settles at 0 °C with ${leftG.toFixed(0)} g of ice floating instead of ${wantG.toFixed(0)} g.`;
  return { outcome: { ok, text }, duration, eq };
}
