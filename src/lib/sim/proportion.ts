/**
 * Proportional reasoning 1 (NCERT Class 8 Ganita Prakash, "Proportional Reasoning-1").
 * Pure functions for the RatioLab sim: mixing paint in a ratio, scaling a
 * nimbu-paani recipe, and turning map centimetres into real distances.
 */

/** Highest common factor of two whole numbers. */
export function hcf(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

/** A ratio in its simplest form: 4 : 6 becomes 2 : 3. */
export function simplest(a: number, b: number): [number, number] {
  const g = hcf(a, b) || 1;
  return [a / g, b / g];
}

/** a : b = c : d, tested by cross products (a × d = b × c). Ratios with a zero part never match. */
export function sameRatio(a: number, b: number, c: number, d: number) {
  if (a <= 0 || b <= 0 || c <= 0 || d <= 0) return false;
  return a * d === b * c;
}

/** True when every (x, y) pair in a table has the same ratio y ÷ x, so the points sit on one line through (0, 0). */
export function isProportionalTable(pairs: [number, number][]) {
  const [x0, y0] = pairs[0];
  return pairs.every(([x, y]) => x * y0 === y * x0);
}

/** Scale an amount: `amount` serves `from`; how much serves `to`? (amount ÷ from) × to. */
export function scaleAmount(amount: number, from: number, to: number) {
  return (amount * to) / from;
}

// ---------- Paint ----------

/** Paint cups per colour run from 0 to 12. */
export const CUPS = { min: 0, max: 12 };

/** The sample green in free play: 2 cups blue to 3 cups yellow. */
export const SAMPLE = { blue: 2, yellow: 3 };

/** Share of yellow in the mix, 0 (all blue) to 1 (all yellow). */
export function yellowShare(blue: number, yellow: number) {
  const t = blue + yellow;
  return t ? yellow / t : 0;
}

const BLUE = [37, 99, 235];
const GREEN = [22, 163, 74];
const YELLOW = [250, 204, 21];

/** The colour of a blue-yellow mix. Mixes with the same ratio get exactly the same colour. */
export function mixColour(blue: number, yellow: number) {
  if (blue + yellow === 0) return "rgba(255,255,255,0.06)";
  const f = yellowShare(blue, yellow);
  const [p, q, t] = f <= 0.5 ? [BLUE, GREEN, f / 0.5] : [GREEN, YELLOW, (f - 0.5) / 0.5];
  const c = p.map((v, i) => Math.round(v + (q[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/** Challenge: a Holi colour order. Match the sample's shade and fill exactly `total` cups. */
export interface PaintOrder {
  name: string;
  brief: string;
  blue: number;
  yellow: number;
  total: number;
}

export function fillsOrder(blue: number, yellow: number, o: PaintOrder) {
  return blue + yellow === o.total && sameRatio(blue, yellow, o.blue, o.yellow);
}

/** Every mix the sim's cups allow that fills the order. */
export function orderSolutions(o: PaintOrder) {
  const out: [number, number][] = [];
  for (let b = CUPS.min; b <= CUPS.max; b++) for (let y = CUPS.min; y <= CUPS.max; y++) if (fillsOrder(b, y, o)) out.push([b, y]);
  return out;
}

// ---------- Nimbu-paani ----------

/** The recipe card: for 4 glasses, 2 lemons and 6 spoons of sugar. */
export const RECIPE = { glasses: 4, lemons: 2, sugar: 6 };
export const GLASSES = { min: 2, max: 24, step: 2 };
export const LEMONS_MAX = 12;
export const SUGAR_MAX = 36;

/** Lemons and sugar for n glasses, keeping the recipe's ratio. */
export function recipeFor(n: number) {
  return { lemons: scaleAmount(RECIPE.lemons, RECIPE.glasses, n), sugar: scaleAmount(RECIPE.sugar, RECIPE.glasses, n) };
}

/** −1 too little, 0 just right, 1 too much: compares amount ÷ glasses with the recipe, by cross products. */
function vs(amount: number, glasses: number, recipeAmount: number) {
  const d = amount * RECIPE.glasses - recipeAmount * glasses;
  return d === 0 ? 0 : d < 0 ? -1 : 1;
}

export function taste(glasses: number, lemons: number, sugar: number) {
  const lemon = vs(lemons, glasses, RECIPE.lemons);
  const sweet = vs(sugar, glasses, RECIPE.sugar);
  return { lemon, sweet, right: lemon === 0 && sweet === 0 };
}

// ---------- Map ----------

/** The town map's scale: 1 cm on the map stands for 500 m on the ground. */
export const MAP_SCALE_M = 500;

export interface Place {
  id: string;
  name: string;
  emoji: string;
  /** Position on the map in cm, with Home at (0, 0). */
  x: number;
  y: number;
}

export const PLACES: Place[] = [
  { id: "school", name: "School", emoji: "🏫", x: 3, y: 4 },
  { id: "temple", name: "Temple", emoji: "🛕", x: -4.8, y: 3.6 },
  { id: "fort", name: "Fort", emoji: "🏰", x: -6, y: -2.5 },
  { id: "station", name: "Station", emoji: "🚉", x: 8, y: -6 },
];

/** Straight-line distance from Home on the map, in cm. */
export function mapCm(p: Place) {
  return Math.round(Math.hypot(p.x, p.y) * 1000) / 1000;
}

/** Real distance in km for a map distance in cm: (cm × 500 m) ÷ 1000. */
export function realKm(cm: number, scaleM = MAP_SCALE_M) {
  return (cm * scaleM) / 1000;
}

/** A typed answer counts when it is within 0.01 km (10 m). */
export function kmOk(answer: number, p: Place) {
  return Number.isFinite(answer) && Math.abs(answer - realKm(mapCm(p))) < 0.01 + 1e-9;
}
