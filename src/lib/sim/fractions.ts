/**
 * Working with Fractions (NCERT Class 7 Ganita Prakash, Part I, Chapter 8).
 * Pure functions for the FractionLab sim: the area model of a fraction of a
 * fraction, a fraction of a number of things, and dividing by a fraction as
 * "how many pieces fit".
 */

/** A fraction n/d with whole numbers, d > 0. */
export interface Frac {
  n: number;
  d: number;
}

export const frac = (n: number, d = 1): Frac => ({ n, d });

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

/** Lowest terms: 6/12 → 1/2. */
export function simplify(f: Frac): Frac {
  const g = gcd(f.n, f.d);
  return { n: f.n / g, d: f.d / g };
}

/** (a/b) × (c/d) = (a × c)/(b × d), in lowest terms. */
export function mul(x: Frac, y: Frac): Frac {
  return simplify({ n: x.n * y.n, d: x.d * y.d });
}

/** (a/b) ÷ (c/d) = (a/b) × (d/c), in lowest terms. */
export function div(x: Frac, y: Frac): Frac {
  return simplify({ n: x.n * y.d, d: x.d * y.n });
}

export const value = (f: Frac) => f.n / f.d;

/** Exact comparison by cross-multiplying: −1, 0 or 1. */
export function cmp(x: Frac, y: Frac): -1 | 0 | 1 {
  const l = x.n * y.d;
  const r = y.n * x.d;
  return l < r ? -1 : l > r ? 1 : 0;
}

export const equal = (x: Frac, y: Frac) => cmp(x, y) === 0;

/** The fraction f of N things: (N ÷ d) × n, kept exact. */
export function ofQuantity(N: number, f: Frac): Frac {
  return simplify({ n: N * f.n, d: f.d });
}

/** Whole part and what is left: 8/3 → 2 and 2/3. */
export function mixed(f: Frac): { whole: number; rest: Frac } {
  const s = simplify(f);
  return { whole: Math.floor(s.n / s.d), rest: simplify({ n: s.n % s.d, d: s.d }) };
}

/** "3/4", "2" or "0". */
export function fmtFrac(f: Frac): string {
  const s = simplify(f);
  return s.d === 1 ? `${s.n}` : `${s.n}/${s.d}`;
}

/** "2 and 2/3", "3/4" or "5". */
export function fmtMixed(f: Frac): string {
  const { whole, rest } = mixed(f);
  if (rest.n === 0) return `${whole}`;
  return whole ? `${whole} and ${fmtFrac(rest)}` : fmtFrac(rest);
}

/** How many pieces of size `piece` fit into `whole`: full pieces, plus the part of one more piece left over. */
export function fits(whole: Frac, piece: Frac): { count: Frac; full: number; rest: Frac } {
  const count = div(whole, piece);
  const { whole: full, rest } = mixed(count);
  return { count, full, rest };
}

/** Control ranges, so the challenge tests can check every round is solvable. */
export const BAR = { maxDen: 10 };
export const SHARE = { maxN: 60, maxDen: 12 };
export const FIT = { maxWholeN: 12, maxDen: 10, maxPieceN: 10 };

/** Challenge rounds at the mithai shop. */
export type FracRound =
  | { kind: "bar"; name: string; brief: string; target: Frac }
  | { kind: "share"; name: string; brief: string; frac: Frac; part: number }
  | { kind: "fit"; name: string; brief: string; whole: Frac; count: number };

/** Bar: two real cuts (each fraction less than 1) must leave exactly the target fraction of the bar. */
export const barOk = (target: Frac, first: Frac, second: Frac) =>
  first.n < first.d && second.n < second.d && equal(mul(first, second), target);
/** Share: the fraction of N things must be exactly `part` things. */
export const shareOk = (f: Frac, part: number, N: number) => equal(ofQuantity(N, f), frac(part));
/** Fit: exactly `count` pieces must fit, with nothing left over. */
export const fitOk = (whole: Frac, count: number, piece: Frac) => equal(div(whole, piece), frac(count));

/** Every proper-or-whole fraction n/d the sim lets you make with d up to maxDen. */
export function properFracs(maxDen: number): Frac[] {
  const out: Frac[] = [];
  for (let d = 1; d <= maxDen; d++) for (let n = 1; n <= d; n++) out.push({ n, d });
  return out;
}

/** Answers to a round that the sim's controls can reach (empty means unsolvable). */
export function solutions(r: FracRound): string[] {
  if (r.kind === "bar") {
    const all = properFracs(BAR.maxDen);
    const out: string[] = [];
    for (const x of all) for (const y of all) if (barOk(r.target, x, y)) out.push(`${x.n}/${x.d} × ${y.n}/${y.d}`);
    return out;
  }
  if (r.kind === "share") {
    const out: string[] = [];
    for (let N = 1; N <= SHARE.maxN; N++) if (shareOk(r.frac, r.part, N)) out.push(`${N}`);
    return out;
  }
  const out: string[] = [];
  for (let d = 1; d <= FIT.maxDen; d++) for (let n = 1; n <= FIT.maxPieceN; n++) if (fitOk(r.whole, r.count, { n, d })) out.push(`${n}/${d}`);
  return out;
}
