/**
 * Gravitation physics for the Class 9 "Gravitation: Mass, Weight and Gravity" lab.
 * Pure functions with real constants, so they can be unit tested.
 */

/** Universal gravitational constant, N m² / kg². */
export const G = 6.674e-11;
/** Speed of light in vacuum, m/s. */
export const C = 2.998e8;

export type WorldId = "earth" | "moon" | "mars" | "jupiter";

export interface World {
  label: string;
  /** Mass in kg. */
  M: number;
  /** Radius in m (Jupiter: equatorial radius at the cloud tops). */
  R: number;
  /** Density of the air at the surface, kg/m³ (0 for the Moon). Jupiter: at its 1 bar cloud level. */
  air: number;
}

export const WORLDS: Record<WorldId, World> = {
  earth: { label: "Earth", M: 5.972e24, R: 6.371e6, air: 1.225 },
  moon: { label: "Moon", M: 7.342e22, R: 1.7374e6, air: 0 },
  mars: { label: "Mars", M: 6.417e23, R: 3.3895e6, air: 0.02 },
  jupiter: { label: "Jupiter", M: 1.898e27, R: 7.1492e7, air: 0.16 },
};

export const WORLD_IDS = Object.keys(WORLDS) as WorldId[];

/** The Sun, for the squeeze experiment. */
export const SUN = { label: "Sun", M: 1.989e30, R: 6.957e8 };

/** Newton's law of gravitation: F = G m₁ m₂ / r² (newtons). */
export function gravForce(m1: number, m2: number, r: number) {
  return (G * m1 * m2) / (r * r);
}

/** Acceleration due to gravity at the surface: g = G M / R². */
export function surfaceG(M: number, R: number) {
  return (G * M) / (R * R);
}

export function worldG(id: WorldId) {
  return surfaceG(WORLDS[id].M, WORLDS[id].R);
}

/** Weight W = m g (newtons). Mass m stays the same everywhere. */
export function weight(m: number, g: number) {
  return m * g;
}

/** Speed for a circular orbit at distance r from the centre: v = √(G M / r). */
export function circularSpeed(M: number, r: number) {
  return Math.sqrt((G * M) / r);
}

/** Escape speed from distance R: v = √(2 G M / R). */
export function escapeSpeed(M: number, R: number) {
  return Math.sqrt((2 * G * M) / R);
}

/** The radius at which the escape speed reaches the speed of light: r = 2 G M / c². */
export function schwarzschildRadius(M: number) {
  return (2 * G * M) / (C * C);
}

// ---------- Falling with and without air ----------

/**
 * Air drag on a falling object: a = g − k v², with k = (air density) × dragPerDensity.
 * dragPerDensity = Cd × A / (2 m), in m² / kg.
 */
export const FALLERS = {
  /** A cricket ball: 0.16 kg, 3.6 cm radius, Cd ≈ 0.47. */
  ball: { label: "Cricket ball", dragPerDensity: (0.47 * Math.PI * 0.036 * 0.036) / (2 * 0.16) },
  /** A bird feather: chosen so it drifts down at about 0.6 m/s in Earth's air, like a real feather. */
  feather: { label: "Feather", dragPerDensity: 22 },
} as const;

export function dragK(airDensity: number, dragPerDensity: number) {
  return airDensity * dragPerDensity;
}

/** Terminal speed v = √(g / k). Infinite with no air. */
export function terminalSpeed(g: number, k: number) {
  return k > 0 ? Math.sqrt(g / k) : Infinity;
}

/** ln(cosh z) without overflow. */
function lnCosh(z: number) {
  const a = Math.abs(z);
  return a + Math.log1p(Math.exp(-2 * a)) - Math.LN2;
}

/** Distance fallen from rest after time t (exact solution of a = g − k v²). */
export function fallDistance(t: number, g: number, k: number) {
  if (k <= 0) return 0.5 * g * t * t;
  const vt = terminalSpeed(g, k);
  return ((vt * vt) / g) * lnCosh((g * t) / vt);
}

/** Speed after time t when falling from rest. */
export function fallSpeed(t: number, g: number, k: number) {
  if (k <= 0) return g * t;
  const vt = terminalSpeed(g, k);
  return vt * Math.tanh((g * t) / vt);
}

/** Time to fall a height h from rest. With no air this is √(2h / g). */
export function fallTime(h: number, g: number, k: number) {
  if (k <= 0) return Math.sqrt((2 * h) / g);
  const vt = terminalSpeed(g, k);
  const x = (h * g) / (vt * vt);
  // acosh(e^x) = x + ln(1 + √(1 − e^(−2x)))
  return (vt / g) * (x + Math.log1p(Math.sqrt(1 - Math.exp(-2 * x))));
}

/** g measured from a timed drop from rest with no air: g = 2h / t². */
export function gFromDrop(h: number, t: number) {
  return (2 * h) / (t * t);
}

// ---------- Newton's cannon ----------

export type CannonOutcome = "fell" | "orbit" | "escape";

/**
 * A ball fired sideways (horizontally) at speed v from height h above a planet of mass M and radius R.
 * No air. It escapes if its total energy is not negative; otherwise it follows an ellipse,
 * and it falls back if the lowest point of that ellipse is below the ground.
 */
export function cannonOutcome(v: number, M: number, R: number, h: number): CannonOutcome {
  const r0 = R + h;
  const mu = G * M;
  if (v * v >= (2 * mu) / r0) return "escape";
  return lowestPoint(v, M, r0) < R ? "fell" : "orbit";
}

/** Nearest distance to the centre on the ellipse of a horizontal launch at r0 (the launch point is one end of it). */
export function lowestPoint(v: number, M: number, r0: number) {
  const mu = G * M;
  const other = (r0 * v * v) / ((2 * mu) / r0 - v * v);
  return Math.min(r0, other);
}

/** Time for one orbit of an ellipse with semi-major axis a: T = 2π √(a³ / G M). */
export function orbitPeriod(M: number, a: number) {
  return 2 * Math.PI * Math.sqrt((a * a * a) / (G * M));
}

/** Semi-major axis of a bound orbit with speed v at distance r: from v² = GM (2/r − 1/a). */
export function semiMajorAxis(v: number, M: number, r: number) {
  return 1 / (2 / r - (v * v) / (G * M));
}

export interface OrbitState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** One velocity-Verlet step under gravity from a mass M at the origin. Returns a new state. */
export function orbitStep(s: OrbitState, M: number, dt: number): OrbitState {
  const mu = G * M;
  const acc = (x: number, y: number) => {
    const r = Math.hypot(x, y);
    const f = -mu / (r * r * r);
    return [f * x, f * y];
  };
  const [ax, ay] = acc(s.x, s.y);
  const x = s.x + s.vx * dt + 0.5 * ax * dt * dt;
  const y = s.y + s.vy * dt + 0.5 * ay * dt * dt;
  const [bx, by] = acc(x, y);
  return { x, y, vx: s.vx + 0.5 * (ax + bx) * dt, vy: s.vy + 0.5 * (ay + by) * dt };
}

/** Energy per kilogram: v²/2 − GM/r. Negative means the ball is held by gravity. */
export function specificEnergy(s: OrbitState, M: number) {
  return 0.5 * (s.vx * s.vx + s.vy * s.vy) - (G * M) / Math.hypot(s.x, s.y);
}

// ---------- Challenge ----------

/** The world whose surface g is closest to a measured value. */
export function closestWorld(g: number): WorldId {
  let best: WorldId = "earth";
  for (const id of WORLD_IDS) if (Math.abs(worldG(id) - g) < Math.abs(worldG(best) - g)) best = id;
  return best;
}
