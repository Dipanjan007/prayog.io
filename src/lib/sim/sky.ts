/**
 * Sun, Earth and Moon physics for the Class 8 "Keeping Time with the Skies" lesson.
 * Pure functions, so they can be unit tested.
 *
 * Angles: degrees unless a name ends in "Rad". Azimuth is measured from north,
 * clockwise (north 0°, east 90°, south 180°, west 270°).
 */

/** New moon to new moon (synodic month), in days. */
export const SYNODIC_DAYS = 29.53;
/** One trip of the Earth around the Sun (tropical year), in days. */
export const YEAR_DAYS = 365.24;
/** Twelve lunar months, in days (about 354). */
export const LUNAR_YEAR_DAYS = 12 * SYNODIC_DAYS;
/** Latitude used for India (close to the Tropic of Cancer, which passes near Ujjain and Bhopal). */
export const INDIA_LAT = 23;
/** Tilt of the Earth's axis. */
export const AXIAL_TILT = 23.44;

const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;
const mod = (a: number, n: number) => ((a % n) + n) % n;

export type Paksha = "Shukla" | "Krishna";

export const PHASE_NAMES = [
  "New moon (Amavasya)",
  "Waxing crescent",
  "First quarter",
  "Waxing gibbous",
  "Full moon (Purnima)",
  "Waning gibbous",
  "Last quarter",
  "Waning crescent",
] as const;

/**
 * The Moon on a given day. Day 0 is a new moon at midnight.
 * elong is the angle Sun-Earth-Moon measured eastward from the Sun: 0° new, 90° first quarter,
 * 180° full, 270° last quarter. The Moon goes round once relative to the Sun every synodic month.
 */
export function moonPhase(day: number) {
  const age = mod(day, SYNODIC_DAYS);
  const elong = (360 * age) / SYNODIC_DAYS;
  // The lit fraction of the disc we see.
  const lit = (1 - Math.cos(toRad(elong))) / 2;
  const waxing = elong < 180;
  // A tithi is the time for the Moon to gain 12° on the Sun: 30 tithis in a lunar month.
  const tithiOfMonth = Math.min(30, Math.floor(elong / 12) + 1);
  const paksha: Paksha = waxing ? "Shukla" : "Krishna";
  const tithi = waxing ? tithiOfMonth : tithiOfMonth - 15;
  const name = PHASE_NAMES[Math.floor(mod(elong + 22.5, 360) / 45)];
  return { age, elong, lit, waxing, paksha, tithi, tithiOfMonth, name, lunarMonths: Math.floor(day / SYNODIC_DAYS) };
}

/**
 * The lit part of the Moon's disc as we see it, one row at a time.
 * The disc is a unit circle; y runs from -1 to 1. Returns [x0, x1], the lit stretch of that row.
 * Drawn for an observer in the northern hemisphere: a waxing Moon is lit on the right (west, the side
 * facing the setting Sun), a waning Moon on the left.
 *
 * Derivation: with the viewer on +z and the Sun at elongation e, sunlight comes from (sin e, 0, -cos e).
 * A visible point (x, y, z) is lit when x·sin e > z·cos e. The terminator projects to x = ±cos e·√(1-y²).
 */
export function litSpan(y: number, elongDeg: number): [number, number] {
  const w = Math.sqrt(Math.max(0, 1 - y * y));
  const c = Math.cos(toRad(elongDeg));
  const waxing = mod(elongDeg, 360) < 180;
  return waxing ? [c * w, w] : [-w, -c * w];
}

/** Where things sit in the top-down view (seen from above the North Pole; everything turns anticlockwise). */
export function orbitAngles(day: number) {
  // Day 0: Earth starts on the +x side of the Sun.
  const earthRad = (2 * Math.PI * day) / YEAR_DAYS;
  // Direction from the Earth to the Sun.
  const sunFromEarthRad = earthRad + Math.PI;
  const { elong } = moonPhase(day);
  const moonRad = sunFromEarthRad + toRad(elong);
  const hour = mod(day, 1) * 24;
  // India faces the Sun at local noon; the Earth spins anticlockwise, so 6 h later India is 90° further round.
  const indiaRad = sunFromEarthRad + toRad((hour - 12) * 15);
  return { earthRad, sunFromEarthRad, moonRad, indiaRad, hour };
}

/** Day or night in India. Uses 6 am to 6 pm, the equinox case; real sunrise shifts with the season. */
export function indiaInDaylight(hour: number) {
  const h = mod(hour, 24);
  return h >= 6 && h < 18;
}

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const MONTH_START = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

/** Day of the year (1 January = 0) for the 21st of a month (0 = January). 21 March is day 79. */
export const dayOfYear21 = (month: number) => MONTH_START[month] + 21 - 1;

/** The Sun's declination (degrees north of the celestial equator) on the 21st of a month. */
export function sunDeclination(month: number) {
  // A sine-shaped year: 0° at the March equinox, +23.4° in June, -23.4° in December. Good to about 1°.
  return AXIAL_TILT * Math.sin((2 * Math.PI * (dayOfYear21(month) - 79)) / 365);
}

/** The Sun's position at a latitude for a declination and local solar time (12 = noon). */
export function sunPosition(latDeg: number, declDeg: number, hour: number) {
  const phi = toRad(latDeg);
  const dec = toRad(declDeg);
  const H = toRad((hour - 12) * 15);
  const east = -Math.cos(dec) * Math.sin(H);
  const north = Math.cos(phi) * Math.sin(dec) - Math.sin(phi) * Math.cos(dec) * Math.cos(H);
  const up = Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H);
  const alt = toDeg(Math.asin(Math.max(-1, Math.min(1, up))));
  const az = mod(toDeg(Math.atan2(east, north)), 360);
  return { alt, az };
}

/** The shadow of an upright stick. Points away from the Sun; length = height / tan(altitude). Null at night. */
export function stickShadow(altDeg: number, azDeg: number, height = 1) {
  if (altDeg <= 0) return null;
  return { length: height / Math.tan(toRad(altDeg)), az: mod(azDeg + 180, 360) };
}

/** Sunrise and sunset in local solar time. */
export function sunTimes(latDeg: number, declDeg: number) {
  const cosH = -Math.tan(toRad(latDeg)) * Math.tan(toRad(declDeg));
  const H0 = toDeg(Math.acos(Math.max(-1, Math.min(1, cosH)))) / 15;
  return { rise: 12 - H0, set: 12 + H0, length: 2 * H0 };
}

const POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
/** Eight-point compass name for an azimuth. */
export const compass = (az: number) => POINTS[Math.floor(mod(az + 22.5, 360) / 45)];

/** Clock text for a time in hours, like "7:45 am". */
export function clock(hour: number) {
  const h = mod(hour, 24);
  let hh = Math.floor(h);
  let mm = Math.round((h - hh) * 60);
  if (mm === 60) {
    hh = (hh + 1) % 24;
    mm = 0;
  }
  const ap = hh < 12 ? "am" : "pm";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${ap}`;
}
