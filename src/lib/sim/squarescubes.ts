/**
 * Squares and cubes (NCERT Class 8 Ganita Prakash Part I, "A Square and A Cube").
 * Pure functions for the SquareCubeLab sim: fitting tiles into the biggest square,
 * stacking unit cubes, the odd-number pattern, square roots between whole numbers
 * and Ramanujan's taxi number 1729.
 */

/** Whole-number square root: the biggest n with n² ≤ N (N ≥ 0). */
export function isqrt(N: number) {
  let n = Math.floor(Math.sqrt(N));
  while (n * n > N) n--;
  while ((n + 1) * (n + 1) <= N) n++;
  return n;
}

/** Whole-number cube root: the biggest n with n³ ≤ N (N ≥ 0). */
export function icbrt(N: number) {
  let n = Math.floor(Math.cbrt(N));
  while (n * n * n > N) n--;
  while ((n + 1) ** 3 <= N) n++;
  return n;
}

export function isPerfectSquare(N: number) {
  return Number.isInteger(N) && N >= 0 && isqrt(N) ** 2 === N;
}

export function isPerfectCube(N: number) {
  return Number.isInteger(N) && N >= 0 && icbrt(N) ** 3 === N;
}

/** Lay N tiles into the biggest square you can: its side, the tiles used, the tiles left and how many more make the next square. */
export function squareFit(N: number) {
  const side = isqrt(N);
  return { side, used: side * side, left: N - side * side, toNext: (side + 1) ** 2 - N };
}

/** Stack N unit cubes into the biggest solid cube you can. */
export function cubeFit(N: number) {
  const side = icbrt(N);
  return { side, used: side ** 3, left: N - side ** 3, toNext: (side + 1) ** 3 - N };
}

/** The first n odd numbers: 1, 3, 5, …, (2n − 1). These are the L-shaped layers of an n × n square. */
export function oddLayers(n: number) {
  return Array.from({ length: n }, (_, i) => 2 * i + 1);
}

/** Add up the first n odd numbers the long way. */
export function sumOfOdds(n: number) {
  return oddLayers(n).reduce((s, x) => s + x, 0);
}

/** √N lies between these two whole numbers (equal when N is a perfect square). */
export function sqrtBetween(N: number): [number, number] {
  const lo = isqrt(N);
  return lo * lo === N ? [lo, lo] : [lo, lo + 1];
}

/** All the ways to write N as a³ + b³ with 1 ≤ a ≤ b. */
export function cubeSumWays(N: number): [number, number][] {
  const ways: [number, number][] = [];
  for (let a = 1; 2 * a ** 3 <= N; a++) {
    const b = icbrt(N - a ** 3);
    if (b >= a && a ** 3 + b ** 3 === N) ways.push([a, b]);
  }
  return ways;
}

/** The smallest number that is a sum of two cubes in two different ways (search up to `limit`). */
export function smallestTaxicab(limit = 100000) {
  for (let N = 2; N <= limit; N++) if (cubeSumWays(N).length >= 2) return N;
  return NaN;
}

/** Last digits a perfect square can end in. */
export function squareEndings() {
  return [...new Set(Array.from({ length: 10 }, (_, d) => (d * d) % 10))].sort((x, y) => x - y);
}

/** Sim limits. */
export const TILES = { min: 1, max: 150 };
export const CUBE_EDGE = { min: 1, max: 8 };
export const SUM_SIDE = { min: 1, max: 12 };
/** Challenge sides the student can pick from. */
export const ORDER_SIDE = { min: 1, max: 15 };

/** Challenge: build the biggest square or cube from a pile. */
export interface Order {
  name: string;
  brief: string;
  kind: "square" | "cube";
  total: number;
}

/** The right answer for an order: the side of the biggest square or cube that fits. */
export function orderSide(o: Order) {
  return o.kind === "square" ? squareFit(o.total).side : cubeFit(o.total).side;
}

/** Pieces a side-n square or cube needs. */
export function piecesFor(kind: Order["kind"], n: number) {
  return kind === "square" ? n * n : n ** 3;
}

export function orderOk(o: Order, n: number) {
  return n === orderSide(o);
}
