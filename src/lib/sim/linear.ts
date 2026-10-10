/**
 * Linear polynomials (NCERT Class 9 Ganita Manjari, "Introduction to Linear Polynomials").
 * Pure functions for the FareLab sim: p(x) = ax + b, its graph, its zero −b ÷ a,
 * and an auto or taxi fare written as base fare + (rate × km).
 */

/** p(x) = ax + b. */
export function evalLinear(a: number, b: number, x: number) {
  return a * x + b;
}

/** The zero of ax + b: the x that makes it 0, which is −b ÷ a. Null when a = 0 (then it is not linear). */
export function zeroOf(a: number, b: number): number | null {
  if (a === 0) return null;
  const z = -b / a;
  return z === 0 ? 0 : z;
}

/** Fare for a ride: base fare + (rate per km × km). */
export function fare(base: number, rate: number, km: number) {
  return base + rate * km;
}

/** Rate per km from two (km, fare) points: (change in fare) ÷ (change in km). */
export function rateFrom(p: FarePoint, q: FarePoint) {
  return (q.fare - p.fare) / (q.km - p.km);
}

/** Base fare from one point and the rate: fare − (rate × km). */
export function baseFrom(p: FarePoint, rate: number) {
  return p.fare - rate * p.km;
}

/** A number with a real minus sign, rounded to 2 decimal places when it is not whole. */
export function num(v: number) {
  const r = Math.round(v * 100) / 100;
  const s = Number.isInteger(r) ? `${Math.abs(r)}` : Math.abs(r).toFixed(2).replace(/0$/, "");
  return r < 0 ? `−${s}` : s;
}

/** ax + b written the way the book writes it: 2x − 6, −x + 4, 3x, 5. */
export function linearText(a: number, b: number, v = "x") {
  const head = a === 0 ? "" : a === 1 ? v : a === -1 ? `−${v}` : `${num(a)}${v}`;
  if (!head) return num(b);
  if (b === 0) return head;
  return `${head} ${b < 0 ? "−" : "+"} ${num(Math.abs(b))}`;
}

/** Slider ranges. Fare: rate in ₹ per km, base in ₹, ride in km. Graph: whole-number a and b. */
export const RATE = { min: 5, max: 30, step: 1 };
export const BASE = { min: 0, max: 60, step: 5 };
export const KM = { min: 0, max: 10, step: 1 };
export const COEF_A = { min: -5, max: 5, step: 1 };
export const COEF_B = { min: -10, max: 10, step: 1 };
/** The fare graph's ₹ axis runs from 0 to this. */
export const FARE_MAX = 400;
/** The plain graph runs from −GRAPH_LIMIT to GRAPH_LIMIT on both axes. */
export const GRAPH_LIMIT = 10;

export interface FarePoint {
  km: number;
  fare: number;
}

/** Challenge: a printed fare chart. Set the meter's rate and base fare so every row matches. */
export interface FareChart {
  name: string;
  brief: string;
  points: FarePoint[];
}

export function matchesChart(rate: number, base: number, chart: FareChart) {
  return chart.points.every((p) => fare(base, rate, p.km) === p.fare);
}

/** Every (rate, base) on the sliders that matches the chart. A fair chart has exactly one. */
export function chartSolutions(chart: FareChart) {
  const out: { rate: number; base: number }[] = [];
  for (let r = RATE.min; r <= RATE.max; r += RATE.step)
    for (let b = BASE.min; b <= BASE.max; b += BASE.step) if (matchesChart(r, b, chart)) out.push({ rate: r, base: b });
  return out;
}

/** Every slider value from min to max. */
export function rangeValues(r: { min: number; max: number; step: number }) {
  const out: number[] = [];
  for (let v = r.min; v <= r.max + 1e-9; v += r.step) out.push(Math.round(v * 1000) / 1000);
  return out;
}
