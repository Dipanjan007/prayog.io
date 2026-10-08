/**
 * Physics for the fluids and buoyancy Olympiad sim: a hydraulic lift (Pascal), a barge loaded to
 * its load line (Archimedes, river vs sea water) and a cube floating at the boundary of two liquids
 * (with a U-tube to find the top liquid's density). Pure functions shared by the OlyFluids sim and
 * the problem answers.
 */

export const G = 9.8; // m/s²
export const RHO_WATER = 1000; // kg/m³
export const RHO_SEA = 1025; // kg/m³

export interface Outcome {
  ok: boolean;
  text: string;
}

/* ---------- Hydraulic lift ---------- */

/** Force on the small piston (N) that holds a load of mass m (kg) still. Pistons at the same level. */
export function liftForce(m: number, dBig: number, dSmall: number) {
  return m * G * (dSmall / dBig) ** 2;
}

export interface LiftScene {
  kind: "fluids-lift";
  /** Load on the big piston (kg) and piston diameters (m). */
  mass: number;
  dBig: number;
  dSmall: number;
  /** The force the student puts on the small piston (N). */
  force: number;
  /** Working height of the platform (m), and room above it before the top stop (m). */
  height: number;
  headroom: number;
  /** Allowed mismatch as a fraction of the right force. */
  tol: number;
  watch: number;
}

/** Upward acceleration of the load (m/s²): (pushed-up force − weight) / mass = g × (F/F₀ − 1). */
export function liftAccel(s: LiftScene) {
  const need = liftForce(s.mass, s.dBig, s.dSmall);
  return G * (s.force / need - 1);
}

export function planLift(s: LiftScene) {
  const need = liftForce(s.mass, s.dBig, s.dSmall);
  const eps = s.force / need - 1;
  const a = G * eps;
  /** Platform height (m) at time t. It stops at the floor or at the top stop. */
  const at = (t: number) => {
    const tt = Math.min(Math.max(t, 0), s.watch);
    return Math.max(0, Math.min(s.height + s.headroom, s.height + 0.5 * a * tt * tt));
  };
  const ok = Math.abs(eps) <= s.tol;
  const outcome: Outcome = ok
    ? { ok, text: `The car stays put at ${s.height} m. The mechanic can work safely underneath.` }
    : eps < 0
      ? { ok, text: `Not enough push: the oil cannot hold the car, and it sinks back to the floor. You are ${Math.round(-eps * 100)}% short.` }
      : { ok, text: `Too much push: the car shoots up and bangs into the top stop. You are ${Math.round(eps * 100)}% over.` };
  return { outcome, duration: s.watch, at, need, accel: a };
}

/* ---------- Barge and load line ---------- */

/** Mass (kg) of a box-shaped hull of length L and width B floating with draft d (m) in liquid of density rho. */
export function floatingMass(L: number, B: number, d: number, rho: number) {
  return rho * L * B * d;
}

/** Draft (m) of a box hull carrying total mass M (kg) in liquid of density rho. */
export function draftFor(M: number, L: number, B: number, rho: number) {
  return M / (rho * L * B);
}

/**
 * Cargo (tonnes) that brings a box barge down to its load line in water of density rhoLoad, given
 * that empty it floats with draft emptyDraft in water of density rhoEmpty.
 */
export function cargoToLine(L: number, B: number, emptyDraft: number, rhoEmpty: number, line: number, rhoLoad: number) {
  const empty = floatingMass(L, B, emptyDraft, rhoEmpty);
  return (floatingMass(L, B, line, rhoLoad) - empty) / 1000;
}

export interface BargeScene {
  kind: "fluids-barge";
  L: number;
  B: number;
  /** Empty draft (m), measured in water of density rhoEmpty. */
  emptyDraft: number;
  rhoEmpty: number;
  /** Water where it is loaded, load line and hull height (m). */
  rho: number;
  line: number;
  hull: number;
  /** Cargo the student loads (tonnes). */
  cargo: number;
  /** Allowed gap between the water and the load line (m). */
  tol: number;
}

export function planBarge(s: BargeScene) {
  const empty = floatingMass(s.L, s.B, s.emptyDraft, s.rhoEmpty);
  const d0 = draftFor(empty, s.L, s.B, s.rho);
  const total = empty + s.cargo * 1000;
  const dF = draftFor(total, s.L, s.B, s.rho);
  const sinks = dF >= s.hull;
  const gap = dF - s.line; // + means the line is under water
  const lower = 1.2; // s the crane takes to lower the cargo
  const duration = 4.5;
  /** Draft (m) at time t. Above hull height the barge has flooded and is sinking. */
  const at = (t: number) => {
    const tt = Math.min(Math.max(t, 0), duration);
    if (tt <= lower) return d0;
    const u = tt - lower;
    if (sinks) return Math.min(s.hull + 3, d0 + (s.hull - d0) * Math.min(1, u / 1.2) + Math.max(0, u - 1.2) * 1.5);
    return dF + (d0 - dF) * Math.exp(-u / 0.6) * Math.cos(3 * u);
  };
  const cm = Math.abs(gap * 100).toFixed(0);
  const ok = !sinks && Math.abs(gap) <= s.tol;
  const outcome: Outcome = sinks
    ? { ok, text: "Water pours over the side. The barge floods and sinks!" }
    : ok
      ? { ok, text: "The water settles right at the load line. Fully loaded and safe to sail!" }
      : gap > 0
        ? { ok, text: `The load line is ${cm} cm under water. Overloaded: the port inspector will not let it sail.` }
        : { ok, text: `The load line is still ${cm} cm above the water. Safe, but space is wasted.` };
  return { outcome, duration, at, d0, dF, sinks };
}

/* ---------- U-tube and a cube at the boundary of two liquids ---------- */

/** Density of a liquid whose column hOil balances a water column hWater above the boundary in a U-tube. */
export function uTubeDensity(hWater: number, hOil: number, rhoWater = RHO_WATER) {
  return (rhoWater * hWater) / hOil;
}

/** Density of a cube of side a that floats with x of it in the lower liquid and the rest in the upper. */
export function cubeDensity(a: number, x: number, rhoLow: number, rhoHigh: number) {
  return (rhoLow * x + rhoHigh * (a - x)) / a;
}

export type CubeRest = { where: "boundary"; inLow: number } | { where: "floor" } | { where: "surface"; sunk: number };

/** Where a cube of density rho settles in a jar with a deep upper layer (rhoHigh) over a lower layer (rhoLow). */
export function cubeRest(rho: number, a: number, rhoLow: number, rhoHigh: number): CubeRest {
  if (rho >= rhoLow) return { where: "floor" };
  if (rho <= rhoHigh) return { where: "surface", sunk: (a * rho) / rhoHigh };
  return { where: "boundary", inLow: (a * (rho - rhoHigh)) / (rhoLow - rhoHigh) };
}

export interface CubeScene {
  kind: "fluids-cube";
  /** Cube side (cm) and the student's density (kg/m³). */
  a: number;
  rho: number;
  rhoLow: number;
  /** U-tube reading that fixes the upper liquid's density: water column and oil column above the boundary (cm). */
  uWater: number;
  uOil: number;
  /** Depth of each layer in the jar (cm). */
  low: number;
  high: number;
  /** What the lab saw: depth of the cube in the lower liquid (cm), and the allowed miss (cm). */
  seenInLow: number;
  tol: number;
}

export function cubeUpperDensity(s: CubeScene) {
  return uTubeDensity(s.uWater, s.uOil, s.rhoLow);
}

/** Height of the cube's bottom above the jar floor (cm) when it rests. */
export function cubeRestBottom(s: CubeScene) {
  const r = cubeRest(s.rho, s.a, s.rhoLow, cubeUpperDensity(s));
  if (r.where === "floor") return 0;
  if (r.where === "surface") return s.low + s.high - r.sunk;
  return s.low - r.inLow;
}

export function planCube(s: CubeScene) {
  const rest = cubeRest(s.rho, s.a, s.rhoLow, cubeUpperDensity(s));
  const yEnd = cubeRestBottom(s);
  const y0 = s.low + s.high + 0.6; // dropped from just above the surface
  const duration = 4;
  /** Bottom of the cube above the floor (cm) at time t: a damped settle. */
  const at = (t: number) => {
    const tt = Math.min(Math.max(t, 0), duration);
    if (rest.where === "floor") {
      const fall = y0 - Math.min(y0, 2.5 * tt * tt);
      return Math.max(0, fall);
    }
    return yEnd + (y0 - yEnd) * Math.exp(-tt / 0.55) * Math.cos(2.2 * tt);
  };
  let outcome: Outcome;
  if (rest.where === "floor") outcome = { ok: false, text: "The cube is denser than water. It sinks straight to the bottom of the jar." };
  else if (rest.where === "surface") outcome = { ok: false, text: "The cube is lighter than the kerosene. It bobs at the top, never reaching the water." };
  else {
    const miss = rest.inLow - s.seenInLow;
    const ok = Math.abs(miss) <= s.tol;
    outcome = ok
      ? { ok, text: `It settles with ${rest.inLow.toFixed(1)} cm in the water, just as the lab saw.` }
      : { ok, text: `It settles with ${rest.inLow.toFixed(1)} cm in the water, but the lab saw ${s.seenInLow} cm. ${miss > 0 ? "Too heavy." : "Too light."}` };
  }
  return { outcome, duration, at, rest, yEnd };
}

/* ---------- Shared entry points ---------- */

export type FluidsScene = LiftScene | BargeScene | CubeScene;

/** True for every scene this sim draws. */
export function isFluidsScene(s: { kind: string }): s is FluidsScene {
  return s.kind.startsWith("fluids-");
}

export function planFluids(s: FluidsScene): { outcome: Outcome; duration: number } {
  switch (s.kind) {
    case "fluids-lift":
      return planLift(s);
    case "fluids-barge":
      return planBarge(s);
    case "fluids-cube":
      return planCube(s);
  }
}
