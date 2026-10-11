/**
 * Infinite sums (Maths Outliers, Class 9 level).
 * Pure functions for the InfiniteSums sim: eating half a laddoo again and again,
 * Zeno's runner and tortoise, sums that grow forever and geometric series a ÷ (1 − r).
 */

/** A fraction p/q, kept exact so "settles at exactly 6" can be checked without rounding. */
export interface Frac {
  p: number;
  q: number;
}

export const fracValue = (r: Frac) => r.p / r.q;
export const fracLabel = (r: Frac) => (r.q === 1 ? `${r.p}` : `${r.p}/${r.q}`);

/** The ratios r the Geometric mode offers. The last two never settle. */
export const R_CHOICES: Frac[] = [
  { p: 1, q: 10 },
  { p: 1, q: 5 },
  { p: 1, q: 4 },
  { p: 1, q: 3 },
  { p: 1, q: 2 },
  { p: 2, q: 3 },
  { p: 3, q: 4 },
  { p: 9, q: 10 },
  { p: 1, q: 1 },
  { p: 3, q: 2 },
];

/** First-term choices in the Geometric mode. */
export const A_MIN = 1;
export const A_MAX = 10;

/** The k-th term (k = 0, 1, 2, ...) of a, ar, ar², ... */
export function geoTerm(a: number, r: number, k: number) {
  return a * Math.pow(r, k);
}

/** Sum of the first n terms: a + ar + ... + arⁿ⁻¹ = a × (1 − rⁿ) ÷ (1 − r), or a × n when r = 1. */
export function geoPartial(a: number, r: number, n: number) {
  if (r === 1) return a * n;
  return (a * (1 - Math.pow(r, n))) / (1 - r);
}

/** True when the endless sum a + ar + ar² + ... settles to a number. */
export function settles(r: number) {
  return Math.abs(r) < 1;
}

/** Where a + ar + ar² + ... settles: a ÷ (1 − r), or null when it never settles. */
export function geoLimit(a: number, r: number): number | null {
  return settles(r) ? a / (1 - r) : null;
}

/** Exact limit as a fraction of whole numbers: a ÷ (1 − p/q) = (a × q) ÷ (q − p). */
export function geoLimitFrac(a: number, r: Frac): Frac | null {
  if (r.p >= r.q) return null;
  return reduce({ p: a * r.q, q: r.q - r.p });
}

function gcd(x: number, y: number): number {
  return y === 0 ? Math.abs(x) : gcd(y, x % y);
}

/** A fraction in its lowest terms: 6/4 becomes 3/2. */
export function reduce(f: Frac): Frac {
  const g = gcd(f.p, f.q) || 1;
  return { p: f.p / g, q: f.q / g };
}

/** How much of the Halves sum 1 + 1/2 + 1/4 + ... is still missing after n terms: (1/2)ⁿ⁻¹ × 2 = 2 − sum. */
export function halvesGap(n: number) {
  return Math.pow(0.5, n - 1);
}

/**
 * Show a sum that creeps up to `limit` without ever reaching it (pass a limit only for such sums). Rounding would print the limit itself,
 * so once the gap is too small to show we print "just under" instead.
 */
export function fmtUnder(sum: number, limit: number | null, digits = 4) {
  const shown = sum.toFixed(digits);
  if (limit !== null && Number(shown) >= Number(limit.toFixed(digits))) return `just under ${Number(limit.toFixed(digits))}`;
  return shown;
}

/** True when a and r make an endless sum that settles at exactly `target`. */
export function settlesAt(a: number, r: Frac, target: number) {
  const L = geoLimitFrac(a, r);
  return L !== null && L.p === target * L.q;
}

/** Laddoo: after n bites, each eating half of what is left, how much is eaten: 1 − (1/2)ⁿ. */
export function laddooEaten(bites: number) {
  return 1 - Math.pow(0.5, bites);
}

/** Bites the Laddoo mode allows (past this the slice is too thin to draw). */
export const MAX_BITES = 20;

/** 1 + 1/2 + 1/3 + ... + 1/n: the harmonic sum. */
export function harmonic(n: number) {
  let s = 0;
  for (let k = 1; k <= n; k++) s += 1 / k;
  return s;
}

/** The first n with 1 + 1/2 + ... + 1/n bigger than `target`. */
export function harmonicPassing(target: number) {
  let s = 0;
  let n = 0;
  while (s <= target) {
    n++;
    s += 1 / n;
  }
  return n;
}

/** 1 + 1/4 + 1/9 + ... + 1/n². It settles at π² ÷ 6 ≈ 1.645 (Euler, 1734). */
export function squaresSum(n: number) {
  let s = 0;
  for (let k = 1; k <= n; k++) s += 1 / (k * k);
  return s;
}

export type SeriesId = "harmonic" | "halves" | "squares";

export const SERIES: Record<SeriesId, { label: string; terms: string; sum: (n: number) => number; settle: number | null }> = {
  halves: { label: "Halves", terms: "1 + 1/2 + 1/4 + 1/8 + ...", sum: (n) => geoPartial(1, 0.5, n), settle: 2 },
  squares: { label: "Squares", terms: "1 + 1/4 + 1/9 + 1/16 + ...", sum: squaresSum, settle: (Math.PI * Math.PI) / 6 },
  harmonic: { label: "Harmonic", terms: "1 + 1/2 + 1/3 + 1/4 + ...", sum: harmonic, settle: null },
};

/** How many terms the Grow or settle mode can add: roughly ×1.5 each step so 10 000 is in reach. */
export const N_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100, 150, 200, 300, 500, 1000, 2000, 5000, 10000];

/** Zeno's race: the runner gives the tortoise a head start. */
export const ZENO = { head: 100, runner: 10, tortoise: 1 };

/**
 * After `stage` Zeno stages (each stage the runner reaches where the tortoise was),
 * the time used so far, the runner's position and the gap still left.
 */
export function zenoStage(stage: number, z = ZENO) {
  const ratio = z.tortoise / z.runner;
  const firstTime = z.head / z.runner;
  const time = geoPartial(firstTime, ratio, stage);
  const runnerPos = z.runner * time;
  const tortoisePos = z.head + z.tortoise * time;
  return { time, runnerPos, tortoisePos, gap: tortoisePos - runnerPos };
}

/** When the runner actually draws level: head ÷ (runner − tortoise), the same as the endless sum of stage times. */
export function zenoCatchTime(z = ZENO) {
  return z.head / (z.runner - z.tortoise);
}

/** Challenge: predict where an endless geometric sum settles. */
export interface SumRound {
  name: string;
  brief: string;
  a: number;
  r: Frac;
  /** The sum as the student sees it, e.g. "8 + 4 + 2 + 1 + ...". */
  shown: string;
}

/** How close (absolute) a typed answer must be. */
export const GUESS_TOL = 0.01;

export function checkGuess(guess: number, round: SumRound, tol = GUESS_TOL) {
  const L = geoLimit(round.a, fracValue(round.r));
  return L !== null && Number.isFinite(guess) && Math.abs(guess - L) <= tol;
}

/** Read a typed number, allowing a comma as the decimal point or a fraction like 25/2. */
export function parseAnswer(s: string) {
  const t = s.trim().replace(",", ".");
  const m = /^(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/.exec(t);
  if (m) return Number(m[1]) / Number(m[2]);
  return t ? Number(t) : NaN;
}
