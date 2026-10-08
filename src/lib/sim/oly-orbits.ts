/**
 * Olympiad track: gravitation and orbits. Pure functions shared by the OlyOrbits sim and the
 * problem answers. Three scenes:
 *  - "orbits-jump": the same take-off speed on Earth and on another world (g = GM/R²).
 *  - "orbits-geo": a satellite on a circular orbit above the equator, watched for one turn of the Earth.
 *  - "orbits-throw": a canister thrown straight up from a small moon, where g weakens with height.
 */

/** Newton's gravitational constant (N m² / kg²). */
export const GN = 6.674e-11;

export interface Body {
  name: string;
  /** Mass (kg) and mean radius (m). */
  M: number;
  R: number;
}

export const EARTH: Body = { name: "Earth", M: 5.972e24, R: 6.371e6 };
/** Rounded values given in the problems. */
export const MARS: Body = { name: "Mars", M: 6.42e23, R: 3.39e6 };
export const PHOBOS: Body = { name: "Phobos", M: 1.07e16, R: 1.11e4 };

/** One sidereal day (23 h 56 min 4 s): the time the Earth takes to turn once relative to the stars. */
export const SIDEREAL_DAY = 86164;

export interface Outcome {
  ok: boolean;
  text: string;
}

/* ---------- Surface gravity and jumps ---------- */

/** Surface gravity g = GM / R² (m/s²). */
export function surfaceG(b: Body) {
  return (GN * b.M) / (b.R * b.R);
}

/** Height reached on `on` with the take-off speed that gives `hEarth` on Earth. h ∝ 1/g. */
export function jumpHeightOn(hEarth: number, on: Body) {
  return (hEarth * surfaceG(EARTH)) / surfaceG(on);
}

export interface JumpScene {
  kind: "orbits-jump";
  /** Height the feet rise on Earth (m). */
  hEarth: number;
  on: Body;
  /** The student's predicted height on the other world (m): a marker is placed there. */
  mark: number;
  /** Allowed difference between the real peak and the marker, as a fraction of the marker. */
  window: number;
}

export function planJump(s: JumpScene) {
  const gE = surfaceG(EARTH);
  const g = surfaceG(s.on);
  const v0 = Math.sqrt(2 * gE * s.hEarth);
  const apex = (v0 * v0) / (2 * g);
  const flight = (2 * v0) / g;
  const duration = flight + 0.4;
  const at = (t: number) => {
    const tt = Math.min(Math.max(t, 0), flight);
    return Math.max(0, v0 * tt - 0.5 * g * tt * tt);
  };
  const earthFlight = (2 * v0) / gE;
  const atEarth = (t: number) => {
    const tt = Math.min(Math.max(t, 0), earthFlight);
    return Math.max(0, v0 * tt - 0.5 * gE * tt * tt);
  };
  const diff = apex - s.mark;
  const ok = Math.abs(diff) <= s.window * s.mark;
  const outcome: Outcome = ok
    ? { ok, text: `The feet rise to ${apex.toFixed(2)} m and just touch your mark. Spot on!` }
    : diff > 0
      ? { ok, text: `The feet sail ${diff.toFixed(2)} m above your mark. ${s.on.name} pulls more weakly than you thought.` }
      : { ok, text: `The feet stop ${(-diff).toFixed(2)} m below your mark. ${s.on.name} pulls harder than you thought.` };
  return { duration, flight, v0, g, gE, apex, at, atEarth, outcome };
}

/* ---------- Circular orbits and the geostationary ring ---------- */

/** Speed on a circular orbit of radius r: v = √(GM / r). */
export function orbitSpeed(b: Body, r: number) {
  return Math.sqrt((GN * b.M) / r);
}

/** Period of a circular orbit of radius r: T = 2π √(r³ / GM). */
export function orbitPeriod(b: Body, r: number) {
  return 2 * Math.PI * Math.sqrt((r * r * r) / (GN * b.M));
}

/** Height above the surface (m) of the circular orbit whose period is T (s). */
export function heightForPeriod(b: Body, T: number) {
  const r = Math.cbrt((GN * b.M * T * T) / (4 * Math.PI * Math.PI));
  return r - b.R;
}

export interface GeoScene {
  kind: "orbits-geo";
  /** The student's orbit height above the equator (km). */
  hKm: number;
  /** How long the Earth takes to turn once (s); we watch for this long. */
  day: number;
  /** Largest drift (degrees of longitude) still counted as "staying put". */
  maxDrift: number;
  /** The ground station the satellite starts above. */
  station: string;
}

/** Angle wrapped into (−180°, 180°]. */
function wrapDeg(a: number) {
  let x = a % 360;
  if (x > 180) x -= 360;
  if (x <= -180) x += 360;
  return x;
}

export function planGeo(s: GeoScene) {
  const r = EARTH.R + s.hKm * 1000;
  const T = orbitPeriod(EARTH, r);
  const duration = s.day;
  /** Angles (radians, anticlockwise seen from above the North Pole) of the Earth and the satellite at time t. */
  const at = (t: number) => {
    const tt = Math.min(Math.max(t, 0), duration);
    return { earth: (2 * Math.PI * tt) / s.day, sat: (2 * Math.PI * tt) / T };
  };
  /** Positive drift: the satellite runs ahead (east) of the spot it started over. */
  const driftAt = (t: number) => {
    const a = at(t);
    return wrapDeg(((a.sat - a.earth) * 180) / Math.PI);
  };
  // Over one day the satellite gains 360°(day/T − 1) on the ground below it.
  const lead = 360 * (s.day / T - 1);
  const ok = Math.abs(lead) <= s.maxDrift;
  const hours = (T / 3600).toFixed(1);
  const outcome: Outcome = ok
    ? { ok, text: `The satellite turns with the Earth. After a whole day it is still over ${s.station}.` }
    : lead > 0
      ? { ok, text: `Too low: it goes round in ${hours} h, faster than the Earth turns, and drifts ${Math.abs(lead) > 360 ? "more than a full lap" : `${Math.round(Math.abs(lead))}°`} east in a day.` }
      : { ok, text: `Too high: it goes round in ${hours} h, slower than the Earth turns, and drifts ${Math.abs(lead) > 360 ? "more than a full lap" : `${Math.round(Math.abs(lead))}°`} west in a day.` };
  return { duration, r, T, at, driftAt, lead, outcome };
}

/* ---------- Throwing up from a small moon ---------- */

/** Launch speed so that something thrown straight up from the surface just reaches height H: ½v² = GM(1/R − 1/(R+H)). */
export function throwSpeedToHeight(b: Body, H: number) {
  return Math.sqrt(2 * GN * b.M * (1 / b.R - 1 / (b.R + H)));
}

/** Escape speed √(2GM / R). */
export function escapeSpeed(b: Body) {
  return Math.sqrt((2 * GN * b.M) / b.R);
}

/** Highest point (m above the surface) reached by a straight-up throw at speed v, or Infinity if it escapes. */
export function throwPeak(b: Body, v: number) {
  const inv = 1 / b.R - (v * v) / (2 * GN * b.M);
  return inv <= 0 ? Infinity : 1 / inv - b.R;
}

export interface ThrowScene {
  kind: "orbits-throw";
  body: Body;
  /** Height (m) of the hovering probe that should catch the canister. */
  H: number;
  /** The student's launch speed (m/s). */
  v: number;
  /** Largest arrival speed (m/s) the probe's net can catch. */
  catchSpeed: number;
}

export interface ThrowPoint {
  t: number;
  /** Height above the surface (m) and upward speed (m/s). */
  y: number;
  v: number;
}

export function planThrow(s: ThrowScene) {
  const { body, H } = s;
  const GM = GN * body.M;
  const vNeed = throwSpeedToHeight(body, H);
  const peak = throwPeak(body, s.v);
  // Reaches the probe if it climbs to H (a hair of rounding allowed for the exact answer).
  const reaches = peak >= H * (1 - 1e-6);
  const arrive = reaches ? Math.sqrt(Math.max(0, s.v * s.v - vNeed * vNeed)) : 0;
  const ok = reaches && arrive <= s.catchSpeed;

  // Step the motion: dv/dt = −GM / r². Velocity Verlet, fine steps for the size of the trip.
  const dt = Math.max(0.05, (H / Math.max(vNeed, 0.1)) / 3000);
  const top = reaches ? (ok ? H : Math.min(1.5 * H, Number.isFinite(peak) ? peak : 1.5 * H)) : Infinity;
  const pts: ThrowPoint[] = [{ t: 0, y: 0, v: s.v }];
  let r = body.R;
  let v = s.v;
  let t = 0;
  let a = -GM / (r * r);
  for (let i = 0; i < 400000; i++) {
    const rNew = r + v * dt + 0.5 * a * dt * dt;
    const aNew = -GM / (rNew * rNew);
    const vNew = v + 0.5 * (a + aNew) * dt;
    t += dt;
    r = rNew;
    v = vNew;
    a = aNew;
    const y = r - body.R;
    if (y <= 0) {
      pts.push({ t, y: 0, v });
      break;
    }
    if (reaches && (y >= top || v <= 0)) {
      pts.push({ t, y: ok ? H : y, v: Math.max(0, v) });
      break;
    }
    if (i % 4 === 0) pts.push({ t, y, v });
  }
  const duration = pts[pts.length - 1].t;
  const at = (time: number): ThrowPoint => {
    if (time <= 0) return pts[0];
    if (time >= duration) return pts[pts.length - 1];
    let lo = 0;
    let hi = pts.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (pts[mid].t <= time) lo = mid;
      else hi = mid;
    }
    const p = pts[lo];
    const q = pts[hi];
    const f = (time - p.t) / (q.t - p.t || 1);
    return { t: time, y: p.y + (q.y - p.y) * f, v: p.v + (q.v - p.v) * f };
  };

  const km = (m: number) => (m / 1000).toFixed(1);
  const outcome: Outcome = ok
    ? { ok, text: "The canister drifts up and stops right at the probe's net. Caught!" }
    : !reaches
      ? { ok, text: `The canister turns back ${km(H - peak)} km below the probe and falls back to ${body.name}.` }
      : { ok, text: `The canister reaches the probe still moving at ${arrive.toFixed(1)} m/s, too fast for the net, and ${Number.isFinite(peak) ? "flies on past it" : `escapes from ${body.name} for ever`}.` };
  return { duration, vNeed, peak, reaches, arrive, at, path: pts, outcome };
}

/* ---------- Every orbits scene ---------- */

export type OrbitsScene = JumpScene | GeoScene | ThrowScene;

/** True for every scene this sim draws. */
export function isOrbitsScene(s: { kind: string }): s is OrbitsScene {
  return s.kind.startsWith("orbits-");
}

export function planOrbits(s: OrbitsScene): { outcome: Outcome; duration: number } {
  switch (s.kind) {
    case "orbits-jump":
      return planJump(s);
    case "orbits-geo":
      return planGeo(s);
    case "orbits-throw":
      return planThrow(s);
  }
}
