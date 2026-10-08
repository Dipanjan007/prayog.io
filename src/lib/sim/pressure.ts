/**
 * Pressure in solids, liquids and air (NCERT Class 8 Curiosity, Chapter 6).
 * Pure functions with real constants, so the lab and its tests agree.
 */

/** Acceleration due to gravity on Earth, as NCERT uses it (m/s²). */
export const G = 9.8;
/** Density of water (kg/m³). */
export const RHO_WATER = 1000;
/** Standard atmospheric pressure at sea level (Pa). */
export const P_ATM = 101325;

/** Weight of a mass in newtons: W = m g. */
export function weight(massKg: number, g = G) {
  return massKg * g;
}

/** Pressure = force ÷ area (Pa = N/m²). */
export function pressure(forceN: number, areaM2: number) {
  if (areaM2 <= 0) return Infinity;
  return forceN / areaM2;
}

/** Force from a pressure acting on an area (N). */
export function forceFromPressure(pressurePa: number, areaM2: number) {
  return pressurePa * areaM2;
}

// ---------- Solids ----------

/** A standard Indian clay brick: about 23 cm × 11 cm × 7.5 cm and 3 kg. */
export const BRICK = { massKg: 3, l: 0.23, w: 0.11, h: 0.075 };

export type BrickFace = "flat" | "side" | "end";

/** Area (m²) of the brick face resting on the sand. */
export function brickFaceArea(face: BrickFace) {
  const { l, w, h } = BRICK;
  return face === "flat" ? l * w : face === "side" ? l * h : w * h;
}

/**
 * Simple sinkage model for soft ground: the dent grows in proportion to the
 * pressure, dent = P ÷ k. Real soils are not this tidy, but the trend is right.
 */
export const SAND_K = 3e5; // Pa per metre of dent: one brick on its end sinks about 1.2 cm.
export function dentDepth(pressurePa: number, k = SAND_K) {
  return Math.max(0, pressurePa / k);
}

/** Things that cut or poke: edge or tip area (m²) and the pressure the target gives way at (Pa). */
export const CUTTERS = {
  knife: {
    // A 10 cm blade: a sharp edge about 0.05 mm wide, a blunt one about 2 mm wide.
    sharp: 0.1 * 0.05e-3,
    blunt: 0.1 * 2e-3,
    // An apple's skin gives way at roughly a million pascals.
    breaks: 1e6,
  },
  pin: {
    // A drawing pin: the point is about 0.2 mm across, the head about 1 cm across.
    sharp: Math.PI * 0.1e-3 ** 2,
    blunt: Math.PI * 5e-3 ** 2,
    // Soft wood gives way at a few tens of millions of pascals.
    breaks: 3e7,
  },
} as const;

export type CutterId = keyof typeof CUTTERS;

/** True if pressing with this force on this area breaks into the target. */
export function cuts(forceN: number, areaM2: number, breaksAtPa: number) {
  return pressure(forceN, areaM2) >= breaksAtPa;
}

/** A heavy school bag hung on two shoulder straps, each pressing on about 12 cm of shoulder. */
export const BAG = { massKg: 6, contactLength: 0.12, wide: 0.05, thin: 0.015, hurtsAbovePa: 1e4 };

/** Pressure (Pa) on each shoulder from the bag with straps of this width (m). */
export function strapPressure(strapWidth: number, massKg = BAG.massKg) {
  return pressure(weight(massKg) / 2, strapWidth * BAG.contactLength);
}

// ---------- Liquids ----------

/** Pressure of a liquid column: p = h ρ g (Pa), on top of the air pressure. */
export function liquidPressure(depthM: number, rho = RHO_WATER, g = G) {
  return Math.max(0, depthM) * rho * g;
}

/** Depth of water that gives this pressure (m). */
export function depthForPressure(pressurePa: number, rho = RHO_WATER, g = G) {
  return pressurePa / (rho * g);
}

/** Speed of water leaving a small hole at this depth below the surface: v = √(2 g h). */
export function jetSpeed(depthM: number, g = G) {
  return Math.sqrt(2 * g * Math.max(0, depthM));
}

/**
 * Where a jet lands: the hole is `fallM` above the floor and `depthM` below the
 * water surface. Time to fall t = √(2 fall ÷ g), so distance = v t = 2 √(depth × fall).
 */
export function jetRange(depthM: number, fallM: number) {
  if (depthM <= 0 || fallM <= 0) return 0;
  return 2 * Math.sqrt(depthM * fallM);
}

/** True when b is twice a (either way round), within a small tolerance. */
export function isDoubled(a: number, b: number, tol = 0.03) {
  if (a <= 0 || b <= 0) return false;
  const r = Math.max(a, b) / Math.min(a, b);
  return Math.abs(r - 2) <= 2 * tol;
}

/**
 * Rate the water level falls (m/s) through small holes, from flow = hole area × speed.
 * `holeRatio` is hole area ÷ pipe area.
 */
export function drainRate(depths: number[], holeRatio: number) {
  return depths.reduce((s, d) => s + holeRatio * jetSpeed(d), 0);
}

// ---------- Air ----------

/** Force (N) the air presses on an area at normal air pressure. */
export function airForce(areaM2: number, p = P_ATM) {
  return forceFromPressure(p, areaM2);
}

/** Mass (kg) whose weight equals a force. */
export function massForForce(forceN: number, g = G) {
  return forceN / g;
}

/** A rubber sucker 5 cm across. */
export const SUCKER = { radius: 0.025, massKg: 0.02, pressedInside: 0.25 * P_ATM, leakTau: 1.2 };
export const SUCKER_AREA = Math.PI * SUCKER.radius ** 2;

/** Net force (N) holding the sucker on the wall: the air outside pushes harder than the air inside. */
export function suckerHold(insidePa: number, area = SUCKER_AREA, outsidePa = P_ATM) {
  return Math.max(0, (outsidePa - insidePa) * area);
}

/** Air leaking into the cup: the inside pressure creeps up towards the outside pressure. */
export function leakStep(insidePa: number, dt: number, tau = SUCKER.leakTau, outsidePa = P_ATM) {
  return outsidePa - (outsidePa - insidePa) * Math.exp(-dt / tau);
}

/** Air flows from high pressure to low pressure. Returns +1 if air moves from a to b, −1 for b to a, 0 if equal. */
export function flowDirection(pa: number, pb: number) {
  return pa > pb ? 1 : pa < pb ? -1 : 0;
}

// ---------- Challenge ----------

export type FootprintVerdict = "sinks" | "safe" | "oversized";

/**
 * Judge a footprint: too small sinks past the line; safe but far bigger than
 * needed is "oversized"; within `band` of the limit is just right.
 */
export function footprintVerdict(massKg: number, areaM2: number, limitPa: number, band = 0.85): FootprintVerdict {
  const p = pressure(weight(massKg), areaM2);
  if (p > limitPa) return "sinks";
  return p >= band * limitPa ? "safe" : "oversized";
}

/** Smallest footprint (m²) that keeps the pressure at or below the limit. */
export function minFootprint(massKg: number, limitPa: number) {
  return weight(massKg) / limitPa;
}

/** Pressure with a friendly unit. */
export function formatPa(p: number) {
  if (!Number.isFinite(p)) return "∞";
  if (p >= 1e6) return `${(p / 1e6).toFixed(p >= 1e8 ? 0 : 1)} MPa`;
  if (p >= 1e4) return `${(p / 1e3).toFixed(1)} kPa`;
  return `${Math.round(p).toLocaleString("en-IN")} Pa`;
}

/** Area with a friendly unit. */
export function formatArea(a: number) {
  if (a >= 0.1) return `${a.toFixed(2)} m²`;
  if (a >= 1e-6) return `${(a * 1e4).toFixed(a >= 1e-2 ? 0 : a >= 1e-4 ? 1 : 3)} cm²`;
  return `${(a * 1e6).toFixed(3)} mm²`;
}
