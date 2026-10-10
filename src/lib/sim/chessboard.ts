/**
 * The chessboard and the rice (Maths Outliers, Class 8 level).
 * Pure functions for the ChessboardLab sim: doubling grains square by square, the total 2⁶⁴ − 1,
 * ₹1 lakh a day against 1 paisa doubled, and a lotus pond with a doubling time.
 * Masses use a rough 25 mg a grain; there are no harvest figures here.
 * Counts are kept as BigInt so square 64 (2⁶³) is exact.
 */

const B = (n: number | string) => BigInt(n);
const ONE = B(1);
const TWO = B(2);

export const SQUARES = 64;

/** Grains on square s (1 to 64): 2^(s − 1). */
export function grainsOn(s: number) {
  return TWO ** B(s - 1);
}

/** Grains on squares 1 to s together: 2^s − 1. */
export function totalTo(s: number) {
  return TWO ** B(s) - ONE;
}

/** Write a whole number the Indian way: 1,00,00,000 for one crore. */
export function formatIndian(n: bigint | number) {
  const s = (typeof n === "bigint" ? n : B(Math.round(n))).toString();
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const groups: string[] = [];
  for (let i = rest.length; i > 0; i -= 2) groups.unshift(rest.slice(Math.max(0, i - 2), i));
  return `${groups.join(",")},${last3}`;
}

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
export const sup = (k: number) => `${k}`.replace(/\d/g, (d) => SUP[Number(d)]);

/** A big count in powers of ten, e.g. 1.8 × 10¹⁹. Small counts are written in full. */
export function sci(n: bigint, digits = 2) {
  const s = n.toString();
  if (s.length <= 7) return formatIndian(n);
  const lead = Number(`${s[0]}.${s.slice(1, digits + 1)}`);
  return `${Number(lead.toFixed(digits - 1))} × 10${sup(s.length - 1)}`;
}

/**
 * Rough mass of one grain of raw rice, in milligrams. 1,000 grains of rice usually weigh
 * about 20 to 30 g, so 25 mg a grain is a fair round figure. Every mass in the lab is "about".
 */
export const GRAIN_MG = 25;

/** Mass of `grains` grains of rice, in tonnes (1 tonne = 1,000,000,000 mg). */
export function riceTonnes(grains: bigint) {
  return (Number(grains) * GRAIN_MG) / 1e9;
}

/** Grains in a 25 kg sack at GRAIN_MG each: 10 lakh. */
export const SACK_GRAINS = (25 * 1e6) / GRAIN_MG;

/** Seconds in a year of 365.25 days. */
export const YEAR_S = 365.25 * 24 * 60 * 60;

/** Years it takes to count `grains` grains at one grain a second, without stopping. */
export function countingYears(grains: bigint) {
  return Number(grains) / YEAR_S;
}

/** Age of the universe in years (about 13.8 billion, from the Planck satellite). */
export const UNIVERSE_YEARS = 13.8e9;

/** The first square holding more than `amount` grains on its own. */
export function firstSquareOver(amount: number) {
  for (let s = 1; s <= SQUARES; s++) if (grainsOn(s) > B(amount)) return s;
  return SQUARES + 1;
}

/** ₹1 lakh in paise. */
export const LAKH_PAISE = 10_000_000;
export const RACE_DAYS = 30;

/** Offer A: ₹1 lakh every day. Total after `day` days, in paise. */
export function lakhTotal(day: number) {
  return B(LAKH_PAISE) * B(day);
}

/** Offer B: 1 paisa on day 1, doubled every day. Paise given on that day. */
export function paisaOn(day: number) {
  return grainsOn(day);
}

/** Offer B's total after `day` days, in paise: 2^day − 1. */
export function paisaTotal(day: number) {
  return totalTo(day);
}

/** The first day the doubling total is ahead of the lakh-a-day total. */
export function overtakeDay() {
  for (let d = 1; d <= 64; d++) if (paisaTotal(d) > lakhTotal(d)) return d;
  return -1;
}

/** Paise as rupees, Indian style: ₹1,07,37,418.23. */
export function formatRupees(paise: bigint) {
  const hundred = B(100);
  const r = paise / hundred;
  const p = (paise % hundred).toString().padStart(2, "0");
  return `₹${formatIndian(r)}.${p}`;
}

/** The pond is full on this day, whatever the doubling time. */
export const POND_FULL_DAY = 30;
export const DOUBLING_TIMES = [1, 2, 3];

/** Fraction of the pond covered on `day` when the leaves double every `T` days: 2^((day − 30) ÷ T). */
export function pondCover(day: number, T: number) {
  return Math.pow(2, (day - POND_FULL_DAY) / T);
}

/** The day the pond is exactly half covered: one doubling time before it is full. */
export function halfDay(T: number) {
  return POND_FULL_DAY - T;
}

/** Challenge: which is the first square with more grains than this? */
export interface GrainRound {
  name: string;
  brief: string;
  amount: number;
}

export function isFirstOver(s: number, r: GrainRound) {
  return s === firstSquareOver(r.amount);
}
