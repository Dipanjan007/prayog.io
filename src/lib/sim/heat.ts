/**
 * Heat physics for the Class 7 "Heat Transfer in Nature" lesson.
 * Pure functions, so they can be unit tested. SI units unless a name says otherwise.
 *
 * Three small models:
 * 1. Conduction along a thin rod: the 1D heat equation with heat lost to the air from the
 *    rod's surface (a "fin"). Real material constants, so the order and the rough times are right.
 * 2. Convection in a pot: a smooth, steady stream-function flow (one or two rolls). It is a
 *    picture of the currents, not a fluid solver.
 * 3. A sunny coast over one day: land swings in temperature much more than the sea, and the
 *    surface breeze blows from the cooler side to the warmer side.
 */

export type RodMaterial = "copper" | "steel" | "glass" | "wood";

/** k: thermal conductivity (W/m·K), rho: density (kg/m³), c: specific heat (J/kg·K). Textbook values. */
export const MATERIALS: Record<RodMaterial, { label: string; k: number; rho: number; c: number; kind: "good" | "poor"; color: string }> = {
  copper: { label: "Copper", k: 400, rho: 8960, c: 385, kind: "good", color: "#b07a5a" },
  // Kitchen steel in India is mostly stainless steel, a much poorer conductor than copper.
  steel: { label: "Steel", k: 16, rho: 8000, c: 500, kind: "good", color: "#94a3b8" },
  glass: { label: "Glass", k: 1.0, rho: 2500, c: 840, kind: "poor", color: "#7dd3fc" },
  wood: { label: "Wood", k: 0.15, rho: 600, c: 1700, kind: "poor", color: "#6b4a2e" },
};

export const ROD = {
  /** m */
  length: 0.2,
  /** m (a 6 mm thick rod) */
  radius: 0.003,
  /** Grid points along the rod, including both ends. */
  nodes: 81,
  /** °C held at the flame end while heating. */
  flameT: 200,
  /** °C */
  airT: 30,
  /** Heat transfer to still air, W/m²·K. */
  h: 5,
  /** Melting point of candle wax (paraffin), °C. */
  waxMelt: 60,
  /** Wax drop positions measured from the flame end, m. */
  drops: [0.02, 0.06, 0.1, 0.14, 0.18],
};

/** Thermal diffusivity k / (rho c), m²/s: how fast a temperature change spreads. */
export function diffusivity(m: RodMaterial) {
  const p = MATERIALS[m];
  return p.k / (p.rho * p.c);
}

/** Cooling rate to the air per kelvin above air temperature, 1/s: 2h / (rho c r) for a thin round rod. */
export function lossRate(m: RodMaterial) {
  const p = MATERIALS[m];
  return (2 * ROD.h) / (p.rho * p.c * ROD.radius);
}

export function createRod() {
  return new Float64Array(ROD.nodes).fill(ROD.airT);
}

/**
 * Advance the rod by dt seconds (explicit finite differences, split into stable sub-steps).
 * dT/dt = α d²T/dx² − β (T − T_air). The flame end is held at flameT while heating; the far end
 * is insulated. When the flame is off the hot end cools like the rest of the rod.
 */
export function stepRod(T: Float64Array, m: RodMaterial, dt: number, heating: boolean) {
  const n = T.length;
  const dx = ROD.length / (n - 1);
  const a = diffusivity(m);
  const b = lossRate(m);
  const maxStep = (0.4 * dx * dx) / a;
  const steps = Math.max(1, Math.ceil(dt / maxStep));
  const h = dt / steps;
  const r = (a * h) / (dx * dx);
  const next = new Float64Array(n);
  for (let s = 0; s < steps; s++) {
    for (let i = 0; i < n; i++) {
      const left = i === 0 ? T[1] : T[i - 1];
      const right = i === n - 1 ? T[n - 2] : T[i + 1];
      next[i] = T[i] + r * (left - 2 * T[i] + right) - b * h * (T[i] - ROD.airT);
    }
    if (heating) next[0] = ROD.flameT;
    T.set(next);
  }
  return T;
}

/** Temperature at x metres from the flame end, read from the grid by linear interpolation. */
export function tempAt(T: Float64Array, x: number) {
  const f = (Math.min(ROD.length, Math.max(0, x)) / ROD.length) * (T.length - 1);
  const i = Math.min(T.length - 2, Math.floor(f));
  return T[i] + (T[i + 1] - T[i]) * (f - i);
}

/** The long-time (steady) temperature of a heated rod with an insulated far end. */
export function steadyRod(m: RodMaterial, x: number) {
  const lambda = Math.sqrt(diffusivity(m) / lossRate(m));
  return ROD.airT + (ROD.flameT - ROD.airT) * (Math.cosh((ROD.length - x) / lambda) / Math.cosh(ROD.length / lambda));
}

/** Which wax drops are hot enough to melt right now. */
export function meltedDrops(T: Float64Array) {
  return ROD.drops.map((x) => tempAt(T, x) >= ROD.waxMelt);
}

// ---------------------------------------------------------------------------
// Convection in a pot of water.

export type FlamePos = "middle" | "side";

/**
 * Water velocity at (x, y) in the pot, both from 0 to 1 (y = 0 at the bottom, up is positive).
 * strength is in pot-heights per second. Built from a stream function so no water is made or lost:
 * middle flame: ψ = (A/2π) sin 2πx sin πy (two rolls, rising in the middle),
 * side flame (right): ψ = (A/π) sin πx sin πy (one roll, rising on the right).
 */
export function potFlow(x: number, y: number, strength: number, pos: FlamePos) {
  const P = Math.PI;
  if (pos === "middle") {
    return { u: (strength / 2) * Math.sin(2 * P * x) * Math.cos(P * y), v: -strength * Math.cos(2 * P * x) * Math.sin(P * y) };
  }
  return { u: strength * Math.sin(P * x) * Math.cos(P * y), v: -strength * Math.cos(P * x) * Math.sin(P * y) };
}

/** Where the flame sits under the pot (x from 0 to 1). */
export const flameX = (pos: FlamePos) => (pos === "middle" ? 0.5 : 0.85);

/**
 * Lumped water temperature, °C. With the flame on it heats towards 100 °C; with the flame off it
 * cools towards room temperature. rate is per (sped-up) second.
 */
export function stepWater(t: number, flame: boolean, dt: number) {
  const target = flame ? 100 : ROD.airT;
  const rate = flame ? 0.02 : 0.005;
  return target + (t - target) * Math.exp(-rate * dt);
}

// ---------------------------------------------------------------------------
// The coast over one day. hour runs from 0 to 24 (local time).

const wave = (hour: number, peakHour: number) => Math.sin((2 * Math.PI * (hour - peakHour + 6)) / 24);

/** Land (sand) surface air, °C: warms fast in the day, cools fast at night. Warmest about 3 pm. */
export function landTemp(hour: number) {
  return 28 + 7 * wave(hour, 15);
}

/** Sea surface air, °C: water needs much more heat to warm up, so it changes very little. */
export function seaTemp(hour: number) {
  return 28 + 1 * wave(hour, 16);
}

/** How strong the Sun is, 0 to 1: up from 6 am to 6 pm, highest at noon. */
export function sunlight(hour: number) {
  return Math.max(0, Math.sin((Math.PI * (hour - 6)) / 12));
}

export type Breeze = "sea" | "land" | "calm";

/**
 * Warm air over the hotter side rises; cooler air flows in near the ground to take its place.
 * Sea breeze: from the sea to the land. Land breeze: from the land to the sea.
 */
export function breeze(hour: number): { kind: Breeze; strength: number; diff: number } {
  const diff = landTemp(hour) - seaTemp(hour);
  const kind: Breeze = Math.abs(diff) < 1 ? "calm" : diff > 0 ? "sea" : "land";
  return { kind, strength: kind === "calm" ? 0 : Math.min(1, Math.abs(diff) / 6), diff };
}

/**
 * Two tins of water left in the sun, one painted black and one white. Black absorbs about 90% of
 * sunlight, white only about 25%, so in sunshine the black tin gets warmer. At night both settle to
 * the air temperature. A simple steady-state model: each tin sits above the air by (absorbed fraction ×
 * sunlight × 25 °C).
 */
export const SURFACES = { black: 0.9, white: 0.25 };
export function tinTemps(hour: number) {
  const air = landTemp(hour);
  const s = sunlight(hour);
  return { black: air + SURFACES.black * s * 25, white: air + SURFACES.white * s * 25 };
}

/** "2:30 pm" style label. */
export function clockLabel(hour: number) {
  const h = Math.floor(hour) % 24;
  const m = Math.round((hour - Math.floor(hour)) * 60);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}
