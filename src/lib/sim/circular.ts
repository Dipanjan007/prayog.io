/**
 * Circular motion physics for the "Spin, swing and the spinning Earth" lesson:
 * centripetal force, what happens when the string is cut, cars on curves,
 * the spinning Earth and orbits. Pure functions, so they can be unit tested.
 *
 * SI units throughout (m, s, kg, N) unless a name ends in Km or Deg.
 */

/** Newton's gravitational constant (N m² kg⁻²). */
export const G = 6.674e-11;
/** Standard gravity used for cars on roads (m/s²). */
export const g = 9.8;

export const M_EARTH = 5.972e24;
export const M_SUN = 1.989e30;
/** Earth's equatorial radius (WGS84). */
export const R_EARTH_EQ = 6_378_137;
/** Earth's mean radius, used for orbits. */
export const R_EARTH = 6_371_000;
/** Square of the eccentricity of the Earth's shape (WGS84): how much it bulges. */
export const EARTH_E2 = 0.00669437999013;
/** One turn of the Earth relative to the stars (a sidereal day), in seconds: 23 h 56 min 4 s. */
export const SIDEREAL_DAY = 86_164.1;
/** Earth's spin rate (rad/s). */
export const OMEGA_EARTH = 7.2921159e-5;

/** Average Earth–Sun distance (1 astronomical unit). */
export const AU = 1.496e11;
export const YEAR_S = 365.256 * 86_400;
/** Average Earth–Moon distance (centre to centre). */
export const MOON_DIST = 3.844e8;
/** The Moon's orbit relative to the stars (sidereal month), in seconds. */
export const MOON_PERIOD = 27.32 * 86_400;

export const GM_EARTH = G * M_EARTH;
export const GM_SUN = G * M_SUN;

/** Height of a geostationary orbit above the equator (km), the textbook value. */
export const GEO_ALT_KM = 35_786;

// ---------- Centripetal force ----------

/** Acceleration towards the centre needed to move at speed v on a circle of radius r: a = v² / r. */
export function centripetalAcc(v: number, r: number) {
  return (v * v) / r;
}

/** Inward force needed: F = m v² / r. */
export function centripetalForce(m: number, v: number, r: number) {
  return (m * v * v) / r;
}

/** Angular speed ω = v / r (rad/s). */
export function angularSpeed(v: number, r: number) {
  return v / r;
}

/** Time for one trip round the circle: T = 2πr / v. */
export function periodOf(v: number, r: number) {
  return (2 * Math.PI * r) / v;
}

/**
 * Where an object on a circle goes once the inward force stops (string cut).
 * It starts at angle `theta` (rad) on a circle of radius r, moving anticlockwise
 * at speed v, and then moves in a straight line along the tangent for time t.
 */
export function releasedPosition(theta: number, r: number, v: number, t: number) {
  const x0 = r * Math.cos(theta);
  const y0 = r * Math.sin(theta);
  // Anticlockwise motion: velocity is perpendicular to the radius.
  const vx = -v * Math.sin(theta);
  const vy = v * Math.cos(theta);
  return { x: x0 + vx * t, y: y0 + vy * t, vx, vy };
}

/**
 * The same point seen by someone riding on the circle, who keeps turning at ω.
 * Rotates (x, y) by −ωt, so a point that would have stayed on the circle stays put.
 */
export function toRotatingFrame(x: number, y: number, omega: number, t: number) {
  const a = -omega * t;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: x * c - y * s, y: x * s + y * c };
}

// ---------- Cars on a flat curve ----------

/** Most friction the tyres can give: μ m g. */
export function maxFriction(m: number, mu: number) {
  return mu * m * g;
}

/** Fastest speed round a flat curve before skidding: m v²/r = μ m g, so v = √(μ g r). Mass cancels. */
export function maxCurveSpeed(mu: number, r: number) {
  return Math.sqrt(mu * g * r);
}

/** Does the car skid? True when the inward force needed is more than the tyres can give. */
export function skids(m: number, v: number, r: number, mu: number) {
  return centripetalForce(m, v, r) > maxFriction(m, mu) + 1e-9;
}

/**
 * Radius of the path while skidding with the tyres giving all their grip sideways:
 * μ g = v² / R, so R = v² / (μ g). It is wider than the road, so the car slides off the outside.
 */
export function skidRadius(v: number, mu: number) {
  return (v * v) / (mu * g);
}

// ---------- The spinning Earth ----------

/** Distance from the Earth's axis at a latitude (m), on the real slightly flattened Earth. */
export function distanceFromAxis(latDeg: number) {
  const phi = (latDeg * Math.PI) / 180;
  const s = Math.sin(phi);
  return (R_EARTH_EQ * Math.cos(phi)) / Math.sqrt(1 - EARTH_E2 * s * s);
}

/** How fast the ground moves eastward because the Earth spins (m/s): v = ω × (distance from the axis). */
export function spinSpeed(latDeg: number) {
  return OMEGA_EARTH * distanceFromAxis(latDeg);
}

/** Centripetal acceleration of the ground at a latitude, pointing at the axis: a = ω² × (distance from the axis). */
export function spinAcc(latDeg: number) {
  return OMEGA_EARTH * OMEGA_EARTH * distanceFromAxis(latDeg);
}

/** The part of the spin acceleration that points straight down, so it is taken off your weight: ω² p cos φ. */
export function spinWeightAcc(latDeg: number) {
  return spinAcc(latDeg) * Math.cos((latDeg * Math.PI) / 180);
}

/**
 * Effective g at sea level (m/s²), from the international Somigliana formula.
 * It includes both the spin and the Earth's bulge. 9.780 at the equator, 9.832 at the poles.
 */
export function gAtLatitude(latDeg: number) {
  const s = Math.sin((latDeg * Math.PI) / 180);
  const s2 = s * s;
  return (9.7803253359 * (1 + 0.00193185265241 * s2)) / Math.sqrt(1 - EARTH_E2 * s2);
}

/** Weight (N) of a mass on a scale at sea level at this latitude. */
export function weightAt(m: number, latDeg: number) {
  return m * gAtLatitude(latDeg);
}

/** Places for the latitude picker. */
export const PLACES = [
  { id: "equator", name: "Equator", lat: 0 },
  { id: "chennai", name: "Chennai", lat: 13.08 },
  { id: "mumbai", name: "Mumbai", lat: 19.08 },
  { id: "delhi", name: "Delhi", lat: 28.61 },
  { id: "leh", name: "Leh", lat: 34.15 },
  { id: "pole", name: "North Pole", lat: 90 },
] as const;

// ---------- Orbits ----------

/** Pull of gravity per kg at distance r from the centre of a body: GM / r². */
export function gravityAcc(GM: number, r: number) {
  return GM / (r * r);
}

/** Speed for a circular orbit: gravity gives exactly the centripetal force, GM m / r² = m v² / r, so v = √(GM / r). */
export function circularSpeed(GM: number, r: number) {
  return Math.sqrt(GM / r);
}

/** Time for one circular orbit: T = 2π √(r³ / GM). */
export function orbitPeriod(GM: number, r: number) {
  return 2 * Math.PI * Math.sqrt((r * r * r) / GM);
}

/** Radius of the circular orbit with period T: r = ∛(GM T² / 4π²). */
export function radiusForPeriod(GM: number, T: number) {
  return Math.cbrt((GM * T * T) / (4 * Math.PI * Math.PI));
}

/** Escape speed from distance r: √(2GM / r). Faster than this and the object never comes back. */
export function escapeSpeed(GM: number, r: number) {
  return Math.sqrt((2 * GM) / r);
}

/**
 * Launch sideways (along the tangent) at distance r0 with speed v.
 * Returns the other end of the orbit (the far or near point) and what happens:
 * "crash" if the orbit dips inside the planet, "escape" if it is too fast to come back, else "orbit".
 */
export function launchFate(GM: number, r0: number, v: number, planetR: number) {
  const k = (v * v * r0) / GM; // 1 for a circle, 2 for escape
  if (k >= 2) return { fate: "escape" as const, otherApsis: Infinity };
  const otherApsis = (r0 * k) / (2 - k);
  if (otherApsis < planetR) return { fate: "crash" as const, otherApsis };
  return { fate: "orbit" as const, otherApsis };
}

/** True when a guess is within a fraction `tol` of the true value. */
export function withinTolerance(guess: number, truth: number, tol: number) {
  return Number.isFinite(guess) && Math.abs(guess - truth) <= tol * Math.abs(truth);
}

/** A car round counts when the speed is safe but no more than `tol` below the limit. */
export function carRoundOk(v: number, mu: number, r: number, tol: number) {
  const vMax = maxCurveSpeed(mu, r);
  return v <= vMax + 1e-9 && v >= vMax * (1 - tol);
}

/** Challenge rounds: either a car on a flat curve or a satellite launched at a height. */
export type SpinRound =
  | { kind: "car"; title: string; r: number; mu: number; m: number }
  | { kind: "orbit"; title: string; altKm: number };
