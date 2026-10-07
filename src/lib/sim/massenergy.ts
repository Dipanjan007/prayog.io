/**
 * Mass-energy and curved space-time physics for the "E = mc²: mass is frozen energy" lab.
 * Pure functions with real constants, so they can be unit tested.
 */

/** Speed of light in a vacuum (m/s). */
export const C = 2.998e8;
/** Newton's gravitational constant (N m² / kg²). */
export const G = 6.674e-11;
/** Joules in one kilowatt-hour (1000 W for 3600 s). */
export const J_PER_KWH = 3.6e6;
export const SECONDS_PER_DAY = 86400;
export const SECONDS_PER_YEAR = 365 * SECONDS_PER_DAY;

/** Our assumption: an Indian home uses about 1,100 kWh of electricity a year. */
export const HOME_KWH_PER_YEAR = 1100;
/** Our assumption: burning 1 kg of good coal gives about 24 MJ of heat. */
export const COAL_J_PER_KG = 24e6;
/** A big power station: 1 GW (like one large unit at Kudankulam, about 1,000 MW). */
export const STATION_W = 1e9;

/** Sun: mass (kg), radius (m) and luminosity, its total power output (W). */
export const SUN = { mass: 1.989e30, radius: 6.957e8, luminosity: 3.828e26 };
/** Earth: mass (kg) and mean radius (m). */
export const EARTH = { mass: 5.972e24, radius: 6.371e6 };
/** GPS satellites orbit about 20,200 km above the ground, at a radius of about 26,560 km. */
export const GPS_ORBIT_RADIUS = 2.656e7;

/** Atomic masses in unified atomic mass units (u). */
export const U_H1 = 1.007825;
export const U_HE4 = 4.002602;
/** Energy of 1 u of mass, in MeV. */
export const MEV_PER_U = 931.494;
/** Energy released when one uranium-235 nucleus splits (MeV, typical). */
export const FISSION_MEV = 200;
export const U_U235 = 235.044;

/** E = m c²: the energy locked up in a mass m (kg), in joules. */
export function restEnergy(m: number) {
  return m * C * C;
}

/** The mass (kg) that holds an energy E (J): m = E / c². */
export function massFromEnergy(E: number) {
  return E / (C * C);
}

export const toKWh = (E: number) => E / J_PER_KWH;

/** How many Indian homes this energy could power for one year (at HOME_KWH_PER_YEAR). */
export function homesForYear(E: number) {
  return toKWh(E) / HOME_KWH_PER_YEAR;
}

/** Tonnes of coal you would have to burn to get this energy. */
export function coalTonnes(E: number) {
  return E / COAL_J_PER_KG / 1000;
}

/** Seconds a power station of power P (W) could run on this energy. */
export function stationSeconds(E: number, P = STATION_W) {
  return E / P;
}

/** 4 hydrogen → 1 helium: the fraction of mass that disappears (about 0.7%). */
export function fusionFraction() {
  return (4 * U_H1 - U_HE4) / (4 * U_H1);
}

/** Energy from one 4 H → He fusion, in MeV (about 26.7 MeV). */
export function fusionMeV() {
  return (4 * U_H1 - U_HE4) * MEV_PER_U;
}

/** Fission of U-235: the fraction of the uranium's mass that becomes energy (about 0.09%, roughly 0.1%). */
export function fissionFraction() {
  return FISSION_MEV / (U_U235 * MEV_PER_U);
}

/** Burning coal: the fraction of mass turned into energy (a few parts in ten billion). */
export function chemicalFraction() {
  return COAL_J_PER_KG / (C * C);
}

export type ProcessId = "chemical" | "fission" | "fusion" | "full";

export const PROCESSES: Record<ProcessId, { label: string; fuel: string; fraction: number }> = {
  chemical: { label: "Burn coal", fuel: "coal burnt in air", fraction: chemicalFraction() },
  fission: { label: "Split uranium", fuel: "uranium-235 split in a reactor", fraction: fissionFraction() },
  fusion: { label: "Fuse hydrogen", fuel: "hydrogen fused into helium", fraction: fusionFraction() },
  full: { label: "All of it", fuel: "mass turned completely into energy", fraction: 1 },
};

/** Energy (J) released from a fuel mass m (kg) by a process. */
export function energyFrom(process: ProcessId, m: number) {
  return PROCESSES[process].fraction * restEnergy(m);
}

/** Mass the Sun turns into energy every second: L / c² (about 4.26 × 10⁹ kg). */
export function sunMassLossPerSecond(L = SUN.luminosity) {
  return L / (C * C);
}

/** GM / (r c²): how strong gravity is at distance r from a mass M, with no units. */
export function compactness(M: number, r: number) {
  return (G * M) / (r * C * C);
}

/**
 * How fast a clock ticks at distance r from a mass M, compared with a clock far away:
 * sqrt(1 − 2GM / (r c²)). It is less than 1, so clocks deeper in gravity run slow.
 */
export function clockRate(M: number, r: number) {
  return Math.sqrt(1 - 2 * compactness(M, r));
}

/** Seconds per day a clock at r loses compared with a clock far away. */
export function clockLossPerDay(M: number, r: number) {
  return (1 - clockRate(M, r)) * SECONDS_PER_DAY;
}

/**
 * Seconds per day gained by a clock at rHigh compared with one at rLow, from gravity alone.
 * For GPS (rLow = Earth's surface) this is about 45.7 μs a day.
 */
export function gravityClockGainPerDay(M: number, rLow: number, rHigh: number) {
  return (clockRate(M, rHigh) / clockRate(M, rLow) - 1) * SECONDS_PER_DAY;
}

/** Light passing a mass M at closest distance b is bent by 4GM / (c² b) radians (Einstein). */
export function lightBend(M: number, b: number) {
  return (4 * G * M) / (C * C * b);
}

/** Newton-style guess for the bending of light: exactly half of Einstein's answer. */
export function newtonBend(M: number, b: number) {
  return lightBend(M, b) / 2;
}

export const RAD_TO_ARCSEC = (180 / Math.PI) * 3600;

/**
 * Path of a light ray that comes in from far left at height b (straight, along +x)
 * and passes a mass at the origin, bending by a total angle alpha (small-angle form).
 * Returns its height at position x: y = b − (alpha / 2)(x + √(x² + b²)).
 * Far to the left y → b; far to the right the ray tilts by −alpha.
 */
export function rayHeight(x: number, b: number, alpha: number) {
  return b - (alpha / 2) * (x + Math.sqrt(x * x + b * b));
}

/** True when a guess is within a fraction tol of the true value. */
export function guessOk(guess: number, truth: number, tol: number) {
  return Number.isFinite(guess) && guess > 0 && Math.abs(guess - truth) <= tol * Math.abs(truth);
}

const SUP: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };

/** 1.798e12 → "1.80 × 10¹²". Numbers from 0.01 to 9,999 are written plainly. */
export function sci(x: number, digits = 3) {
  if (x === 0 || !Number.isFinite(x)) return String(x);
  const a = Math.abs(x);
  if (a >= 0.01 && a < 10000) return trim(x.toPrecision(digits));
  const exp = Math.floor(Math.log10(a));
  let mant = x / 10 ** exp;
  let e = exp;
  if (Math.abs(Number(mant.toPrecision(digits))) >= 10) {
    mant /= 10;
    e += 1;
  }
  const sup = String(e)
    .split("")
    .map((ch) => SUP[ch])
    .join("");
  return `${trim(mant.toPrecision(digits))} × 10${sup}`;
}

function trim(s: string) {
  return s.includes(".") && !s.includes("e") ? s.replace(/\.?0+$/, "") : s;
}

/** A count in Indian words where it helps: 4.5e5 → "4.5 lakh", 3e7 → "3 crore". */
export function indianCount(n: number) {
  if (n < 1) return n < 0.01 ? sci(n, 2) : n.toFixed(2);
  if (n < 1000) return n < 10 ? n.toFixed(1).replace(/\.0$/, "") : String(Math.round(n));
  if (n < 1e5) return Math.round(n).toLocaleString("en-IN");
  if (n < 1e7) return `${trim((n / 1e5).toPrecision(3))} lakh`;
  if (n < 1e11) return `${trim((n / 1e7).toPrecision(3))} crore`;
  return sci(n, 3);
}

/** Seconds as a friendly duration: "45 s", "5.2 hours", "18 days", "3.4 years". */
export function duration(s: number) {
  if (s < 1e-3) return `${nice(s * 1e6)} μs`;
  if (s < 1) return `${nice(s * 1000)} ms`;
  if (s < 120) return `${nice(s)} s`;
  if (s < 7200) return `${nice(s / 60)} min`;
  if (s < 2 * SECONDS_PER_DAY) return `${nice(s / 3600)} hours`;
  if (s < 2 * SECONDS_PER_YEAR) return `${nice(s / SECONDS_PER_DAY)} days`;
  return `${sci(s / SECONDS_PER_YEAR, 3)} years`;
}

/** Two significant figures below 100, whole numbers above: 0.183 → "0.18", 183 → "183". */
function nice(x: number) {
  return x >= 100 ? Math.round(x).toLocaleString("en-IN") : trim(x.toPrecision(2));
}

/** Bodies for the curved space-time view. Radius is the surface (m). */
export type BodyId = "earth" | "sun" | "whiteDwarf" | "neutronStar";

export const BODIES: Record<BodyId, { label: string; mass: number; radius: number }> = {
  earth: { label: "Earth", mass: EARTH.mass, radius: EARTH.radius },
  sun: { label: "Sun", mass: SUN.mass, radius: SUN.radius },
  /** Sirius B: about 1.02 Suns squeezed to about Earth's size. */
  whiteDwarf: { label: "White dwarf", mass: 1.02 * SUN.mass, radius: 5.8e6 },
  /** A typical neutron star: 1.4 Suns in a ball with a radius of about 12 km. */
  neutronStar: { label: "Neutron star", mass: 1.4 * SUN.mass, radius: 1.2e4 },
};
