/**
 * Special relativity for the "time-dilation" and "length-contraction" labs.
 * Speeds called `beta` are fractions of the speed of light (v ÷ c); everything else is SI.
 * (E = mc² lives in massenergy.ts.)
 */

/** Speed of light in a vacuum (m/s). */
export const C = 2.998e8;
/** Gravitational constant (N m²/kg²). */
export const G = 6.674e-11;
export const EARTH_MASS = 5.972e24;
/** Mean radius of the Earth (m). */
export const EARTH_RADIUS = 6.371e6;
/** Radius of a GPS satellite's orbit, about 20 200 km above the ground (m). */
export const GPS_ORBIT_RADIUS = 2.656e7;
export const SECONDS_PER_DAY = 86400;
/** Mean lifetime of a muon at rest (s). */
export const MUON_LIFETIME = 2.2e-6;
/** Height at which cosmic rays typically make muons (m). */
export const MUON_START_HEIGHT = 15000;

/** Lorentz factor γ = 1 ÷ √(1 − v²/c²). Infinite at or above light speed. */
export function gamma(beta: number) {
  const b = Math.abs(beta);
  if (b >= 1) return Infinity;
  return 1 / Math.sqrt(1 - b * b);
}

/** How fast a moving clock runs compared with yours: 1 ÷ γ. */
export function clockRate(beta: number) {
  return 1 / gamma(beta);
}

/** Δt = γ Δt₀: time that passes for you while the moving clock shows Δt₀. */
export function dilatedTime(properTime: number, beta: number) {
  return gamma(beta) * properTime;
}

/** The speed (fraction of c) that gives a Lorentz factor γ ≥ 1. */
export function betaForGamma(g: number) {
  if (g < 1) throw new RangeError("γ is never less than 1");
  return Math.sqrt(1 - 1 / (g * g));
}

/** One tick (there and back) of a light clock with mirrors a distance `gap` apart, at rest. */
export function lightClockTick(gap: number) {
  return (2 * gap) / C;
}

/**
 * A light clock moving sideways at beta, seen from the platform: the photon's
 * one-way slanted path, how far the clock moves sideways meanwhile, and the tick time.
 */
export function movingLightClock(gap: number, beta: number) {
  const g = gamma(beta);
  return { path: g * gap, sideways: beta * g * gap, tick: g * lightClockTick(gap) };
}

/** Average distance a muon travels before it decays, with or without time dilation (m). */
export function muonRange(beta: number, withDilation = true) {
  return beta * C * MUON_LIFETIME * (withDilation ? gamma(beta) : 1);
}

/** Fraction of muons that survive a trip of `distance` metres (radioactive-style decay). */
export function muonSurvival(distance: number, beta: number, withDilation = true) {
  return Math.exp(-distance / muonRange(beta, withDilation));
}

/** Speed of a circular orbit around the Earth at radius r (m/s). */
export function orbitalSpeed(r: number) {
  return Math.sqrt((G * EARTH_MASS) / r);
}

/**
 * Special relativity: a clock moving at v loses (1 − 1/γ) of each second.
 * Returns the change per day in seconds (negative = runs slow). Written so it stays exact for tiny v.
 */
export function speedShiftPerDay(v: number) {
  const b2 = (v / C) ** 2;
  return (-b2 / (1 + Math.sqrt(1 - b2))) * SECONDS_PER_DAY;
}

/**
 * General relativity (weak field): a clock higher up, at radius r, runs fast compared with one on
 * the ground by GM/c² × (1/R − 1/r) of each second. Returns seconds gained per day.
 */
export function gravityShiftPerDay(r: number, ground = EARTH_RADIUS) {
  return ((G * EARTH_MASS) / (C * C)) * (1 / ground - 1 / r) * SECONDS_PER_DAY;
}

/** Both GPS effects per day (s): speed (negative), gravity (positive) and the net gain. */
export function gpsDrift(r = GPS_ORBIT_RADIUS) {
  const speed = speedShiftPerDay(orbitalSpeed(r));
  const gravity = gravityShiftPerDay(r);
  return { speed, gravity, net: speed + gravity };
}

/** GPS works out distance from light travel time, so a clock error Δt becomes a distance error c × Δt (m). */
export function rangeError(clockError: number) {
  return C * Math.abs(clockError);
}

/** Twin trip to a star `distanceLy` light years away and back, at beta. Ignores the short turnaround. */
export function twinTrip(distanceLy: number, beta: number) {
  const earthYears = (2 * distanceLy) / beta;
  return { earthYears, shipYears: earthYears / gamma(beta) };
}

/** Galileo's everyday rule: speeds just add. */
export function galileoAdd(u: number, v: number) {
  return u + v;
}

/** Einstein's rule for adding speeds given as fractions of c: (u + v) ÷ (1 + uv/c²). */
export function einsteinAdd(u: number, v: number) {
  return (u + v) / (1 + u * v);
}

/** Einstein's rule in m/s. */
export function einsteinAddSI(u: number, v: number) {
  return (u + v) / (1 + (u * v) / (C * C));
}

/** How much less than u + v the true combined speed is, in m/s (computed without rounding loss). */
export function additionGap(u: number, v: number) {
  const k = (u * v) / (C * C);
  return ((u + v) * k) / (1 + k);
}

/** L = L₀ ÷ γ: the length you measure for an object of rest length L₀ moving at beta along its length. */
export function contractedLength(restLength: number, beta: number) {
  return restLength / gamma(beta);
}

/** The speed (fraction of c) at which an object of rest length L₀ measures L. */
export function betaForLength(restLength: number, length: number) {
  const r = length / restLength;
  if (r <= 0 || r > 1) throw new RangeError("a moving object can only look shorter, never longer");
  return Math.sqrt(1 - r * r);
}

export function kmhToMs(kmh: number) {
  return kmh / 3.6;
}

/** True when `guess` is within a fraction `tol` of `truth`. */
export function answerOk(guess: number, truth: number, tol: number) {
  return Number.isFinite(guess) && Math.abs(guess - truth) <= tol * Math.abs(truth);
}
