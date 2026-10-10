/**
 * Maths Olympiad: number sense and divisibility. A pile of N things is packed into boxes (or rows)
 * of several sizes, and each packing must leave a set number over. Pure functions shared by the
 * OlyNumber sim and the problem answers.
 */

export interface PackRule {
  /** Box or row size. */
  size: number;
  /** How many must be left over after filling as many full boxes as possible. */
  rem: number;
}

export interface PackScene {
  kind: "num-pack";
  /** The student's number of things. */
  n: number;
  /** What is being packed, singular and plural, like ["laddoo", "laddoos"]. */
  item: [string, string];
  /** What one group is called, like "box" or "row". */
  group: string;
  rules: PackRule[];
  /** The pile must have more than this many things. */
  min: number;
}

export type NumberScene = PackScene;

export function isNumberScene(s: { kind: string }): s is NumberScene {
  return s.kind.startsWith("num-");
}

/** True when n is a whole number (allowing for floating-point dust). */
export function isWhole(n: number) {
  return Number.isFinite(n) && Math.abs(n - Math.round(n)) < 1e-9;
}

/** Remainder that is never negative. */
export function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

export function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

export function lcm(...ns: number[]) {
  return ns.reduce((a, b) => (a / gcd(a, b)) * b, 1);
}

/** Does a pile of n leave exactly the wanted number over for every rule? */
export function fitsAll(n: number, rules: PackRule[]) {
  return isWhole(n) && rules.every((r) => mod(Math.round(n), r.size) === r.rem);
}

/** The smallest whole number above `min` that fits every rule (searched one by one, so it does not trust any formula). */
export function smallestFitting(rules: PackRule[], min: number, limit = 1_000_000) {
  for (let n = Math.floor(min) + 1; n <= limit; n++) if (fitsAll(n, rules)) return n;
  return NaN;
}

/** Every divisor of n, smallest first. */
export function divisors(n: number) {
  const out: number[] = [];
  for (let d = 1; d <= n; d++) if (n % d === 0) out.push(d);
  return out;
}

export interface PackRow {
  size: number;
  want: number;
  full: number;
  left: number;
  ok: boolean;
}

/** Seconds spent packing each rule, then a pause for the verdict. */
export const ROW_S = 1.1;
export const END_S = 0.8;

export function planNumber(s: NumberScene): { outcome: { ok: boolean; text: string }; duration: number; rows: PackRow[]; smaller: number | null } {
  const whole = isWhole(s.n) && s.n >= 0;
  const n = whole ? Math.round(s.n) : Math.max(0, Math.floor(s.n));
  const rows = s.rules.map((r) => {
    const left = mod(n, r.size);
    return { size: r.size, want: r.rem, full: Math.floor(n / r.size), left, ok: whole && left === r.rem };
  });
  const duration = s.rules.length * ROW_S + END_S;
  const [one, many] = s.item;
  const things = (k: number) => `${k} ${k === 1 ? one : many}`;
  if (!whole) return { outcome: { ok: false, text: `You cannot have ${s.n} ${many}: the pile must be a whole number.` }, duration, rows, smaller: null };
  if (n <= s.min) return { outcome: { ok: false, text: `${things(n)} is not more than ${s.min}, so it breaks the first condition.` }, duration, rows, smaller: null };
  const bad = rows.find((r) => !r.ok);
  if (bad)
    return {
      outcome: { ok: false, text: `Packed in ${s.group === "box" ? "boxes" : `${s.group}s`} of ${bad.size}, ${things(n)} leave ${bad.left} over, not ${bad.want}.` },
      duration,
      rows,
      smaller: null,
    };
  const first = smallestFitting(s.rules, s.min, n);
  if (first < n)
    return { outcome: { ok: false, text: `${things(n)} fit every rule, but ${first} also works and is smaller.` }, duration, rows, smaller: first };
  return { outcome: { ok: true, text: `${things(n)} leave exactly the right number over every time, and no smaller pile does.` }, duration, rows, smaller: null };
}
