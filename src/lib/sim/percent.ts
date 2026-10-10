/**
 * Percentages (NCERT Class 8 Ganita Prakash Part 2, "Fractions in Disguise").
 * Pure functions for the PercentLab sim: a percent as so many squares out of 100,
 * a shop bill with a discount and GST, and percent increase and decrease one after
 * the other. Money is worked in paise (whole numbers) so no rounding slips creep in.
 */

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

/** p% as a fraction in lowest terms: 25% = 1/4. */
export function percentFraction(p: number) {
  if (p === 0) return { num: 0, den: 1 };
  const g = gcd(p, 100);
  return { num: p / g, den: 100 / g };
}

/** p% as a decimal string: 25 → "0.25", 5 → "0.05", 100 → "1". */
export function percentDecimal(p: number) {
  if (p === 100) return "1";
  if (p === 0) return "0";
  return `0.${`${p}`.padStart(2, "0")}`.replace(/0+$/, "");
}

/** p% of an amount. */
export function percentOf(p: number, amount: number) {
  return (p * amount) / 100;
}

/** Items on sale. Prices in rupees. */
export interface ShopItem {
  id: string;
  name: string;
  price: number;
  emoji: string;
}

export const ITEMS: ShopItem[] = [
  { id: "bag", name: "School bag", price: 800, emoji: "🎒" },
  { id: "bat", name: "Cricket bat", price: 2000, emoji: "🏏" },
  { id: "mixer", name: "Mixer grinder", price: 1200, emoji: "🥤" },
];

/** GST rates the sim offers, in %. */
export const GST_RATES = [0, 5, 18] as const;
export const DISCOUNT = { min: 0, max: 50, step: 5 };

export type BillOrder = "discount-first" | "gst-first";

/**
 * A bill in paise. Discount d% then GST g% (or GST first). Each line is rounded to the
 * nearest paisa, as on a real bill; the tests check the lesson's numbers need no rounding.
 */
export function bill(price: number, d: number, g: number, order: BillOrder = "discount-first") {
  const P = Math.round(price * 100);
  if (order === "discount-first") {
    const off = Math.round((P * d) / 100);
    const afterOff = P - off;
    const gst = Math.round((afterOff * g) / 100);
    return { price: P, off, middle: afterOff, gst, total: afterOff + gst };
  }
  const gst = Math.round((P * g) / 100);
  const withGst = P + gst;
  const off = Math.round((withGst * d) / 100);
  return { price: P, off, middle: withGst, gst, total: withGst - off };
}

/** Exact final price in paise × 10000 (no rounding): price × (100 − d) × (100 + g). */
export function exactTotalScaled(price: number, d: number, g: number) {
  return price * 100 * (100 - d) * (100 + g);
}

/** ₹ amount from paise, Indian commas, paise shown only when needed. */
export function rupees(paise: number) {
  const neg = paise < 0;
  const p = Math.abs(Math.round(paise));
  const r = Math.floor(p / 100);
  const ps = p % 100;
  const body = indian(r) + (ps ? `.${`${ps}`.padStart(2, "0")}` : "");
  return `${neg ? "−" : ""}₹${body}`;
}

/** Indian digit grouping: 1,23,456. */
export function indian(n: number): string {
  const s = `${Math.round(Math.abs(n))}`;
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

/** Up & down: start, after an increase of up%, then after a decrease of down%. */
export function upDown(start: number, up: number, down: number) {
  const afterUp = (start * (100 + up)) / 100;
  const end = (afterUp * (100 - down)) / 100;
  return { afterUp, end, change: percentChange(start, end) };
}

/** Percent change from old to new: ((new − old) ÷ old) × 100. */
export function percentChange(oldV: number, newV: number) {
  return ((newV - oldV) / oldV) * 100;
}

/** The decrease (in %) that undoes an increase of up%: up ÷ (100 + up) × 100. */
export function undoDecrease(up: number) {
  return (up / (100 + up)) * 100;
}

export const UPDOWN = { start: 100, min: 0, max: 50, step: 5 };

/** A number tidy for display: up to 2 decimals, trailing zeros dropped. */
export function tidy(v: number) {
  return `${Number(v.toFixed(2))}`;
}

/** Challenge: hit an exact bill by choosing the discount. */
export interface PriceGoal {
  name: string;
  brief: string;
  item: string;
  gst: number;
  /** Target final price in rupees. */
  target: number;
}

export function goalItem(goal: PriceGoal) {
  return ITEMS.find((i) => i.id === goal.item)!;
}

/** Does discount d hit the target bill exactly? */
export function goalOk(goal: PriceGoal, d: number) {
  return exactTotalScaled(goalItem(goal).price, d, goal.gst) === goal.target * 100 * 10000;
}
