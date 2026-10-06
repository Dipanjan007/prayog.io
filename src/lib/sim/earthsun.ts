/**
 * Earth, Moon and Sun physics for the Class 7 "Earth, Moon, and the Sun" lesson:
 * day length and noon Sun height through the year (axial tilt), and solar and lunar
 * eclipses with the Moon's tilted orbit. Pure functions, so they can be unit tested.
 *
 * Angles are in degrees unless a name ends in "Rad". Azimuth is measured from north,
 * clockwise (north 0°, east 90°, south 180°, west 270°).
 *
 * Simplifications (all small at Class 7 level):
 * - Earth's orbit is a circle, so the Sun's longitude grows evenly through the year.
 * - The Moon's orbit is a circle at a fixed distance (see MOON_DIST_KM) and its node line is fixed.
 *   The real node line turns once in 18.6 years, so eclipse seasons drift about 19 days earlier each year.
 * - Earth's atmosphere, which widens its shadow by about 2%, is left out.
 */

/** Tilt of the Earth's axis from the perpendicular to its orbit. */
export const AXIAL_TILT = 23.44;
/** One trip of the Earth around the Sun, in days. */
export const YEAR_DAYS = 365.24;
/** Tilt of the Moon's orbit to the Earth's orbit. */
export const MOON_TILT = 5.14;
/**
 * Longitude of the Moon's ascending node in this model. The Sun lines up with the node line
 * around 26 July and 25 January, so the model's eclipse seasons are late January and late July.
 */
export const NODE_LON = 125;
/** Sunrise and sunset are when the top of the Sun touches the horizon, with air bending its light (standard almanac value). */
export const SUNRISE_ALT = -0.833;

export const EARTH_R_KM = 6371;
export const MOON_R_KM = 1737.4;
export const SUN_R_KM = 696_000;
export const AU_KM = 149_600_000;
/** The Moon's distance in this model: near its closest point, so a central solar eclipse is total. */
export const MOON_DIST_KM = 363_000;
/** The Moon's distance at its farthest point. */
export const MOON_FAR_KM = 405_500;

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export type CityId = "delhi" | "chennai" | "leh";
export const CITIES: Record<CityId, { name: string; lat: number }> = {
  chennai: { name: "Chennai", lat: 13.08 },
  delhi: { name: "Delhi", lat: 28.61 },
  leh: { name: "Leh", lat: 34.15 },
};

const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;
const mod = (a: number, n: number) => ((a % n) + n) % n;
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** Day of the year (0 = 1 January, 364 = 31 December) to its month and date. */
export function dateOf(day: number) {
  let d = Math.floor(mod(day, 365));
  for (let m = 0; m < 12; m++) {
    if (d < MONTH_DAYS[m]) return { month: m, date: d + 1, label: `${d + 1} ${MONTHS[m]}` };
    d -= MONTH_DAYS[m];
  }
  return { month: 11, date: 31, label: "31 Dec" };
}

/** Day of the year for a month (0-11) and date (1-31). */
export function dayOf(month: number, date: number) {
  let d = 0;
  for (let m = 0; m < month; m++) d += MONTH_DAYS[m];
  return d + date - 1;
}

/** The March equinox (21 March) is day 79. */
export const EQUINOX_DAY = dayOf(2, 21);

/** The Sun's longitude along Earth's orbit as seen from Earth: 0° at the March equinox, 90° at the June solstice. */
export function sunLongitude(day: number) {
  return mod((360 * (day - EQUINOX_DAY)) / YEAR_DAYS, 360);
}

/** How far north of the equator the Sun is overhead at noon (its declination). +23.44° in June, −23.44° in December. */
export function sunDeclination(day: number) {
  return toDeg(Math.asin(Math.sin(toRad(AXIAL_TILT)) * Math.sin(toRad(sunLongitude(day)))));
}

/** Hours of daylight at a latitude when the Sun's declination is decl. */
export function dayLength(lat: number, decl: number) {
  const c = (Math.sin(toRad(SUNRISE_ALT)) - Math.sin(toRad(lat)) * Math.sin(toRad(decl))) / (Math.cos(toRad(lat)) * Math.cos(toRad(decl)));
  if (c <= -1) return 24;
  if (c >= 1) return 0;
  return (2 * toDeg(Math.acos(c))) / 15;
}

/** Height of the Sun above the horizon at local noon: the angle sunlight makes with the ground. */
export function noonAltitude(lat: number, decl: number) {
  return 90 - Math.abs(lat - decl);
}

/** The Sun's height and direction at a local Sun time (12 = local noon). */
export function sunAltAz(lat: number, decl: number, hour: number) {
  const H = toRad(15 * (hour - 12));
  const phi = toRad(lat);
  const d = toRad(decl);
  const sinAlt = Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.cos(H);
  const alt = Math.asin(clamp(sinAlt, -1, 1));
  const cosAz = (Math.sin(d) - Math.sin(alt) * Math.sin(phi)) / (Math.cos(alt) * Math.cos(phi));
  let az = toDeg(Math.acos(clamp(cosAz, -1, 1)));
  if (Math.sin(H) > 0) az = 360 - az;
  return { alt: toDeg(alt), az };
}

/** The longest day of the year at a latitude, in hours, and the day it falls on. */
export function longestDay(lat: number) {
  let best = { day: 0, hours: 0 };
  for (let d = 0; d < 365; d++) {
    const h = dayLength(lat, sunDeclination(d));
    if (h > best.hours) best = { day: d, hours: h };
  }
  return best;
}

/** "13 h 58 min". */
export function hoursText(h: number) {
  let hh = Math.floor(h);
  let mm = Math.round((h - hh) * 60);
  if (mm === 60) {
    hh += 1;
    mm = 0;
  }
  return `${hh} h ${mm} min`;
}

/** "6:30 am" style local Sun time. */
export function clock(hour: number) {
  const t = mod(Math.round(hour * 60), 24 * 60);
  const h = Math.floor(t / 60);
  const m = t % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}

type V3 = [number, number, number];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const len = (a: V3) => Math.sqrt(dot(a, a));
const unit = (a: V3) => scale(a, 1 / len(a));

/**
 * Where the Moon is. elong is the Moon's longitude minus the Sun's, measured eastward
 * (0° new moon, 180° full moon). With tilted = false the Moon's orbit lies flat in Earth's orbit plane.
 * Returns positions in Earth radii in the ecliptic frame, Earth at the origin.
 */
export function moonPlace(day: number, elong: number, tilted: boolean, moonDistKm = MOON_DIST_KM) {
  const lonSun = sunLongitude(day);
  const lonMoon = mod(lonSun + elong, 360);
  const D = moonDistKm / EARTH_R_KM;
  let pos: V3;
  let u = 0;
  if (tilted) {
    const i = toRad(MOON_TILT);
    const om = toRad(NODE_LON);
    const delta = toRad(lonMoon - NODE_LON);
    // Angle along the tilted orbit from the ascending node that gives this longitude.
    u = Math.atan2(Math.sin(delta), Math.cos(delta) * Math.cos(i));
    pos = [
      D * (Math.cos(om) * Math.cos(u) - Math.sin(om) * Math.sin(u) * Math.cos(i)),
      D * (Math.sin(om) * Math.cos(u) + Math.cos(om) * Math.sin(u) * Math.cos(i)),
      D * Math.sin(u) * Math.sin(i),
    ];
  } else {
    pos = [D * Math.cos(toRad(lonMoon)), D * Math.sin(toRad(lonMoon)), 0];
  }
  const beta = toDeg(Math.asin(pos[2] / D));
  const sunDist = AU_KM / EARTH_R_KM;
  const sun: V3 = [sunDist * Math.cos(toRad(lonSun)), sunDist * Math.sin(toRad(lonSun)), 0];
  return { lonSun, lonMoon, beta, moon: pos, sun, D };
}

export type EclipseKind = "none" | "partial-solar" | "total-solar" | "annular-solar" | "penumbral-lunar" | "partial-lunar" | "total-lunar";

export const ECLIPSE_NAMES: Record<EclipseKind, string> = {
  none: "No eclipse",
  "partial-solar": "Partial solar eclipse",
  "total-solar": "Total solar eclipse",
  "annular-solar": "Ring (annular) solar eclipse",
  "penumbral-lunar": "Faint (penumbral) lunar eclipse",
  "partial-lunar": "Partial lunar eclipse",
  "total-lunar": "Total lunar eclipse",
};

export const isSolar = (k: EclipseKind) => k.endsWith("solar");
export const isLunar = (k: EclipseKind) => k.endsWith("lunar");

/**
 * Is there an eclipse anywhere on Earth? Uses the real sizes and distances of the Sun, Earth and Moon.
 * Solar: the line from the Sun through the Moon (the axis of the Moon's shadow) is followed to Earth.
 * Lunar: the Moon is compared with Earth's umbra and penumbra at the Moon's distance.
 * axisMiss is how far (Earth radii) the shadow's centre line passes from the centre of the Earth (solar)
 * or of the Moon (lunar); Infinity when the Moon is on the wrong side.
 */
export function eclipse(day: number, elong: number, tilted: boolean, moonDistKm = MOON_DIST_KM) {
  const p = moonPlace(day, elong, tilted, moonDistKm);
  const Rs = SUN_R_KM / EARTH_R_KM;
  const Rm = MOON_R_KM / EARTH_R_KM;
  const M = p.moon;
  const S = p.sun;
  let kind: EclipseKind = "none";
  let axisMiss = Infinity;

  // Solar: shadow axis runs from the Sun through the Moon, away from the Sun.
  const sm = sub(M, S);
  const dSM = len(sm);
  const v = unit(sm);
  const tEarth = -dot(M, v); // distance past the Moon to the point on the axis nearest Earth's centre
  if (tEarth > 0) {
    const miss = len(sub(M, scale(v, dot(M, v))));
    axisMiss = miss;
    const umbraLen = (dSM * Rm) / (Rs - Rm);
    const penumbraAt = (t: number) => Rm + (t * (Rs + Rm)) / dSM;
    if (miss < 1) {
      const tHit = tEarth - Math.sqrt(1 - miss * miss);
      kind = tHit < umbraLen ? "total-solar" : "annular-solar";
    } else if (miss < 1 + penumbraAt(tEarth)) kind = "partial-solar";
  } else {
    // Lunar: Earth's shadow axis runs from the Sun through Earth's centre.
    const w = unit(scale(S, -1));
    const t = dot(M, w);
    const dS = len(S);
    const miss = len(sub(M, scale(w, t)));
    axisMiss = miss;
    const umbra = 1 - (t * (Rs - 1)) / dS;
    const penumbra = 1 + (t * (Rs + 1)) / dS;
    if (miss + Rm <= umbra) kind = "total-lunar";
    else if (miss - Rm < umbra) kind = "partial-lunar";
    else if (miss - Rm < penumbra) kind = "penumbral-lunar";
  }
  return { ...p, kind, axisMiss };
}

/** Earth's umbra and penumbra radii at the Moon's distance, in Earth radii. */
export function earthShadowAtMoon(moonDistKm = MOON_DIST_KM) {
  const t = moonDistKm / EARTH_R_KM;
  const Rs = SUN_R_KM / EARTH_R_KM;
  const dS = AU_KM / EARTH_R_KM;
  return { umbra: 1 - (t * (Rs - 1)) / dS, penumbra: 1 + (t * (Rs + 1)) / dS };
}
