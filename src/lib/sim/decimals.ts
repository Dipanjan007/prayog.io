/**
 * Another Peek Beyond the Point (NCERT Class 7 Ganita Prakash Part 2, Chapter 4).
 * Pure functions for the DecimalLab sim. Everything is kept exact with whole numbers:
 * the number line counts thousandths, money counts paise, and the place-value chart
 * stores a number as digits × a power of ten.
 */

/* ---------- Number line, in thousandths ---------- */

/** The line runs from 0 to 20 (in thousandths). */
export const LINE = { min: 0, max: 20000 };

/** Size of one step at each zoom level, in thousandths: ones, tenths, hundredths, thousandths. */
export const STEP = [1000, 100, 10, 1] as const;
export const LEVEL_NAME = ["ones", "tenths", "hundredths", "thousandths"] as const;

/** "2.35", "0.5", "12.047", "3" from thousandths. */
export function fmtThou(v: number): string {
  const neg = v < 0;
  const a = Math.abs(v);
  const whole = Math.floor(a / 1000);
  const frac = String(a % 1000).padStart(3, "0").replace(/0+$/, "");
  return `${neg ? "−" : ""}${whole}${frac ? "." + frac : ""}`;
}

/** Thousandths from a decimal string like "2.35" (at most 3 decimal places). */
export function thou(s: string): number {
  const [w, f = ""] = s.split(".");
  if (f.length > 3) throw new Error(`${s} has more than 3 decimal places`);
  return Number(w) * 1000 + Number(f.padEnd(3, "0"));
}

/**
 * The part of the line on screen at a zoom level: level 0 shows 0 to 20 in ones; each deeper
 * level shows the one interval of the level above that holds v, cut into 10 steps.
 */
export function windowAt(v: number, level: number): { lo: number; hi: number; step: number } {
  if (level <= 0) return { lo: LINE.min, hi: LINE.max, step: STEP[0] };
  const span = STEP[level - 1];
  const lo = Math.min(Math.floor(v / span) * span, LINE.max - span);
  return { lo, hi: lo + span, step: STEP[level] };
}

/** Move v by n steps of the current level, kept on the line. */
export function stepBy(v: number, level: number, n: number) {
  return Math.min(LINE.max, Math.max(LINE.min, v + n * STEP[level]));
}

/** Snap a point to the nearest step of the current window (used when the line is tapped). */
export function snapTo(x: number, level: number, v: number) {
  const { lo, hi, step } = windowAt(v, level);
  return Math.min(hi, Math.max(lo, Math.round(x / step) * step));
}

/** The digits of v: ones (with tens), tenths, hundredths, thousandths. */
export function places(v: number) {
  return { whole: Math.floor(v / 1000), tenths: Math.floor(v / 100) % 10, hundredths: Math.floor(v / 10) % 10, thousandths: v % 10 };
}

/** Compare two decimal strings exactly: −1, 0 or 1. */
export function compareDec(a: string, b: string): -1 | 0 | 1 {
  const x = thou(a);
  const y = thou(b);
  return x < y ? -1 : x > y ? 1 : 0;
}

/* ---------- Money, in paise ---------- */

/** "₹34.75" from paise. */
export function fmtRupees(p: number): string {
  const neg = p < 0;
  const a = Math.abs(p);
  return `${neg ? "−" : ""}₹${Math.floor(a / 100)}.${String(a % 100).padStart(2, "0")}`;
}

export interface Item {
  id: string;
  name: string;
  emoji: string;
  /** Price in paise. */
  price: number;
}

/** The school canteen's menu. */
export const ITEMS: Item[] = [
  { id: "samosa", name: "Samosa", emoji: "🥟", price: 1250 },
  { id: "chai", name: "Chai", emoji: "☕", price: 875 },
  { id: "lassi", name: "Lassi", emoji: "🥛", price: 2225 },
  { id: "vadapav", name: "Vada pav", emoji: "🍔", price: 1500 },
  { id: "biscuits", name: "Biscuits", emoji: "🍪", price: 550 },
  { id: "banana", name: "Banana", emoji: "🍌", price: 425 },
];

/** The notes you can pay with, in paise. */
export const NOTES = [2000, 5000, 10000, 20000];

/** Most of one item you can put in the basket. */
export const MAX_EACH = 5;

export type Basket = Record<string, number>;

export function billTotal(basket: Basket): number {
  return ITEMS.reduce((s, it) => s + it.price * (basket[it.id] ?? 0), 0);
}

/** Change from a note, or null when the note is too small. */
export function changeFrom(note: number, total: number): number | null {
  return note >= total ? note - total : null;
}

/* ---------- Place-value chart: multiply and divide by 10 and 100 ---------- */

/** A number written as digits × 10^e, so ×10 and ÷10 are exact. */
export interface Dec {
  m: number;
  e: number;
}

/** Drop trailing zeros from the digits: 2450 × 10^−3 → 245 × 10^−2. */
export function norm(d: Dec): Dec {
  let { m, e } = d;
  if (m === 0) return { m: 0, e: 0 };
  while (m % 10 === 0) {
    m /= 10;
    e += 1;
  }
  return { m, e };
}

export function dec(s: string): Dec {
  const [w, f = ""] = s.split(".");
  return norm({ m: Number(w + f), e: -f.length });
}

/** Multiply by 10^k (k = 1 is ×10, k = −2 is ÷100). */
export function shift(d: Dec, k: number): Dec {
  return norm({ m: d.m, e: d.e + k });
}

export function fmtDec(d: Dec): string {
  const { m, e } = norm(d);
  if (e >= 0) return `${m}${"0".repeat(e)}`;
  const s = String(m).padStart(-e + 1, "0");
  return `${s.slice(0, s.length + e)}.${s.slice(s.length + e)}`;
}

export const decEqual = (a: Dec, b: Dec) => {
  const x = norm(a);
  const y = norm(b);
  return x.m === y.m && x.e === y.e;
};

/** The chart's columns, as powers of ten: thousands down to ten-thousandths. */
export const CHART = { hi: 3, lo: -4 };
export const COLUMN_NAME: Record<number, string> = {
  3: "Th",
  2: "H",
  1: "T",
  0: "O",
  [-1]: "t",
  [-2]: "h",
  [-3]: "th",
  [-4]: "tth",
};

/** Power of ten of the highest and lowest digit of d. */
export function span(d: Dec) {
  const n = norm(d);
  return { top: n.e + String(n.m).length - 1, bottom: n.e };
}

/** Does d fit on the chart? */
export function fitsChart(d: Dec) {
  const s = span(d);
  return s.top <= CHART.hi && s.bottom >= CHART.lo;
}

/** The digit of d in the 10^p column. */
export function digitAt(d: Dec, p: number): number {
  const n = norm(d);
  const i = p - n.e;
  if (i < 0) return 0;
  return Math.floor(n.m / 10 ** i) % 10;
}

/** The four buttons: ×10, ×100, ÷10, ÷100, as powers of ten. */
export const SHIFTS = [
  { k: 1, label: "× 10" },
  { k: 2, label: "× 100" },
  { k: -1, label: "÷ 10" },
  { k: -2, label: "÷ 100" },
] as const;

/** Start numbers you can pick in the chart. */
export const STARTS = ["3.75", "0.5", "42", "1.205"];

/* ---------- Challenge: sports day ---------- */

export type DecRound =
  | { kind: "place"; name: string; brief: string; target: number }
  | { kind: "bill"; name: string; brief: string; target: number }
  | { kind: "shift"; name: string; brief: string; start: string; target: string };

/** Fewest zoom and step presses to land on target from 1 at level 0 (BFS), or −1 if impossible. */
export function placeMoves(target: number, from = 1000, maxDepth = 40): number {
  const key = (v: number, l: number) => `${v}:${l}`;
  const seen = new Set([key(from, 0)]);
  let frontier: [number, number][] = [[from, 0]];
  for (let d = 0; d <= maxDepth; d++) {
    if (frontier.some(([v]) => v === target)) return d;
    const next: [number, number][] = [];
    for (const [v, l] of frontier) {
      const opts: [number, number][] = [
        [stepBy(v, l, 1), l],
        [stepBy(v, l, -1), l],
      ];
      if (l < 3) opts.push([v, l + 1]);
      if (l > 0) opts.push([v, l - 1]);
      for (const [nv, nl] of opts)
        if (!seen.has(key(nv, nl))) {
          seen.add(key(nv, nl));
          next.push([nv, nl]);
        }
    }
    frontier = next;
  }
  return -1;
}

/** Every basket (up to MAX_EACH of each item) that costs exactly `target` paise. */
export function exactBaskets(target: number): Basket[] {
  const out: Basket[] = [];
  const walk = (i: number, left: number, b: Basket) => {
    if (left === 0) {
      out.push({ ...b });
      return;
    }
    if (i === ITEMS.length || left < 0) return;
    for (let c = 0; c <= MAX_EACH && c * ITEMS[i].price <= left; c++) {
      if (c) b[ITEMS[i].id] = c;
      else delete b[ITEMS[i].id];
      walk(i + 1, left - c * ITEMS[i].price, b);
    }
    delete b[ITEMS[i].id];
  };
  walk(0, target, {});
  return out;
}

/** Fewest ×/÷ presses from start to target staying on the chart, or −1. */
export function shiftMoves(start: string, target: string, maxDepth = 6): number {
  const goal = dec(target);
  let frontier = [dec(start)];
  const seen = new Set(frontier.map(fmtDec));
  for (let d = 0; d <= maxDepth; d++) {
    if (frontier.some((x) => decEqual(x, goal))) return d;
    const next: Dec[] = [];
    for (const x of frontier)
      for (const s of SHIFTS) {
        const y = shift(x, s.k);
        if (fitsChart(y) && !seen.has(fmtDec(y))) {
          seen.add(fmtDec(y));
          next.push(y);
        }
      }
    frontier = next;
  }
  return -1;
}
