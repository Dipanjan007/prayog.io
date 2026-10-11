/**
 * Powers and exponents (NCERT Class 8 Ganita Prakash Part I, "Power Play").
 * Pure functions for the PowerLab sim: folding paper (thickness doubles each fold),
 * the laws of exponents with chips, and writing big Indian numbers in scientific notation.
 */

/** Thickness of one sheet of notebook paper, in mm. */
export const SHEET_MM = 0.1;
export const FOLDS = { min: 0, max: 50 };

/** Thickness after n folds, in mm: 0.1 × 2ⁿ. */
export function thicknessMm(n: number) {
  return SHEET_MM * 2 ** n;
}

/** How many layers of paper after n folds: 2ⁿ. */
export function layers(n: number) {
  return 2 ** n;
}

/** The fewest folds whose stack is at least `heightMm` tall. Works with whole numbers of layers to avoid rounding slips. */
export function foldsToReach(heightMm: number) {
  // thickness ≥ height  ⇔  2ⁿ ≥ height ÷ 0.1 = height × 10
  const need = heightMm * 10;
  let n = 0;
  while (2 ** n < need) n++;
  return n;
}

/** Things to beat, tallest last. Heights in mm. */
export interface Landmark {
  name: string;
  /** Height or distance, written for students. */
  label: string;
  mm: number;
  emoji: string;
}

const M = 1000;
const KM = 1000 * M;

export const LANDMARKS: Landmark[] = [
  { name: "a notebook", label: "about 1 cm", mm: 10, emoji: "📓" },
  { name: "you", label: "about 1.5 m", mm: 1.5 * M, emoji: "🧍" },
  { name: "the Statue of Unity", label: "182 m", mm: 182 * M, emoji: "🗽" },
  { name: "Mount Everest", label: "8,849 m", mm: 8849 * M, emoji: "🏔️" },
  { name: "the Space Station", label: "about 400 km up", mm: 400 * KM, emoji: "🛰️" },
  { name: "the Moon", label: "3,84,400 km away", mm: 384400 * KM, emoji: "🌕" },
];

/** The tallest landmark the stack has passed after n folds (or null). */
export function passed(n: number) {
  const t = thicknessMm(n);
  let best: Landmark | null = null;
  for (const l of LANDMARKS) if (t >= l.mm) best = l;
  return best;
}

/** A length in mm written in the best unit: mm, cm, m or km. */
export function fmtLength(mm: number) {
  const unit = (v: number, u: string) => `${roundNice(v)} ${u}`;
  if (mm < 10) return unit(mm, "mm");
  if (mm < 1000) return unit(mm / 10, "cm");
  if (mm < 1000 * 1000) return unit(mm / 1000, "m");
  return unit(mm / 1e6, "km");
}

/** Up to 3 significant figures for small values, whole numbers with Indian commas for big ones. */
function roundNice(v: number) {
  if (v >= 1000) return indian(Math.round(v));
  return `${Number(v.toPrecision(3))}`;
}

/** Indian digit grouping: 3,84,400 and 1,40,00,00,000. */
export function indian(n: number): string {
  if (n < 0) return `−${indian(-n)}`;
  const s = Math.round(n).toString();
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  const parts: string[] = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) parts.unshift(rest);
  return `${parts.join(",")},${last3}`;
}

const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };

/** A whole number as superscript digits: sup(12) = "¹²". */
export function sup(n: number) {
  return `${n}`
    .split("")
    .map((c) => SUP[c] ?? c)
    .join("");
}

/** Laws of exponents with the chips in the sim. */
export const BASES = [2, 3, 10] as const;
export const EXP = { min: 0, max: 8 };

/** aᵐ × aⁿ = aᵐ⁺ⁿ: the exponent of the product. */
export function productPower(m: number, n: number) {
  return m + n;
}

/** aᵐ ÷ aⁿ: pairs of chips cancel. Returns the chips left on top and on the bottom. */
export function quotientChips(m: number, n: number) {
  const cancel = Math.min(m, n);
  return { cancel, top: m - cancel, bottom: n - cancel, power: m - n };
}

/** The value of aᵏ as a fraction top/bottom, for k that may be negative. */
export function powerValue(a: number, k: number) {
  return k >= 0 ? { top: a ** k, bottom: 1 } : { top: 1, bottom: a ** -k };
}

/** Big numbers to write in scientific notation. Values are whole numbers so the digits are exact. */
export interface BigItem {
  id: string;
  name: string;
  value: number;
  unit: string;
}

export const BIG_ITEMS: BigItem[] = [
  { id: "people", name: "People in India (about)", value: 1_400_000_000, unit: "people" },
  { id: "moon", name: "Earth to the Moon", value: 384_400, unit: "km" },
  { id: "sun", name: "Earth to the Sun (about)", value: 150_000_000, unit: "km" },
  { id: "everest", name: "Height of Mount Everest", value: 8_849, unit: "m" },
  { id: "light", name: "Speed of light (about)", value: 300_000, unit: "km per second" },
];

/** The exponent of 10 that puts the number into standard form (1 ≤ mantissa < 10). */
export function standardExponent(value: number) {
  let e = 0;
  while (10 ** (e + 1) <= value) e++;
  return e;
}

/**
 * value ÷ 10ᵉ as an exact decimal string (no floating-point noise),
 * e.g. mantissa(384400, 5) = "3.844", mantissa(384400, 2) = "3844".
 */
export function mantissa(value: number, e: number) {
  const digits = `${value}`;
  if (e <= 0) return digits + "0".repeat(-e);
  const pad = digits.padStart(e + 1, "0");
  const whole = pad.slice(0, pad.length - e);
  const frac = pad.slice(pad.length - e).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}

/** Is value ÷ 10ᵉ between 1 and 10 (standard form)? */
export function isStandard(value: number, e: number) {
  return e === standardExponent(value);
}

/** Exponent range the student can choose in Big numbers. */
export const SCI_EXP = { min: 0, max: 12 };

/** Challenge: fold just enough for the stack to pass a target. */
export interface FoldTarget {
  name: string;
  brief: string;
  /** Height in mm. */
  mm: number;
  label: string;
}

export function foldOk(t: FoldTarget, n: number) {
  return n === foldsToReach(t.mm);
}
