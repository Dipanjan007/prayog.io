/**
 * Maths Olympiad: areas of shapes built from squares and circles. The sim pours exactly the
 * student's area of colour (or seed) into the region, so too little leaves a gap and too much
 * spills. Pure functions shared by the OlyFill sim and the problem answers.
 */

/** Region shapes, all centred on the origin (lengths in the problem's unit). */
export type Region =
  /** Between two circles, outer radius R and inner radius r. */
  | { type: "ring"; R: number; r: number }
  /** A square of side s with the largest circle inside it cut out (the four corners). */
  | { type: "square-minus-circle"; s: number }
  /** In a square of side s, the overlap of two quarter circles of radius s drawn from opposite corners. */
  | { type: "leaf"; s: number };

/** Area with the given value of π (problems state π = 22/7). */
export function regionArea(r: Region, pi = Math.PI) {
  switch (r.type) {
    case "ring":
      return pi * (r.R * r.R - r.r * r.r);
    case "square-minus-circle":
      return r.s * r.s - pi * (r.s / 2) ** 2;
    case "leaf":
      return 2 * ((pi * r.s * r.s) / 4) - r.s * r.s;
  }
}

/** Is the point (x, y) inside the region? */
export function inside(r: Region, x: number, y: number) {
  switch (r.type) {
    case "ring": {
      const d = x * x + y * y;
      return d <= r.R * r.R && d >= r.r * r.r;
    }
    case "square-minus-circle": {
      const h = r.s / 2;
      return Math.abs(x) <= h && Math.abs(y) <= h && x * x + y * y >= h * h;
    }
    case "leaf": {
      // Square from (−h, −h) to (h, h); quarter circles centred on the bottom-left and top-right corners.
      const h = r.s / 2;
      if (Math.abs(x) > h || Math.abs(y) > h) return false;
      const s2 = r.s * r.s;
      return (x + h) ** 2 + (y + h) ** 2 <= s2 && (x - h) ** 2 + (y - h) ** 2 <= s2;
    }
  }
}

/** Half-width of the box that holds the drawing. */
export function halfSize(r: Region) {
  return r.type === "ring" ? r.R : r.s / 2;
}

/** Area of the region found by counting grid points, a check that does not use any formula. */
export function gridArea(r: Region, n = 600) {
  const h = halfSize(r);
  const step = (2 * h) / n;
  let k = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (inside(r, -h + (i + 0.5) * step, -h + (j + 0.5) * step)) k++;
  return k * step * step;
}

/**
 * Heights (y) of sample points inside the region, lowest first. Filling up to the k-th one covers
 * k / count of the area, which is how the sim turns an amount of powder into a fill level.
 */
export function fillLevels(r: Region, n = 90) {
  const h = halfSize(r);
  const step = (2 * h) / n;
  const ys: number[] = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x = -h + (i + 0.5) * step;
    const y = -h + (j + 0.5) * step;
    if (inside(r, x, y)) ys.push(y);
  }
  return ys.sort((a, b) => a - b);
}

/** Fill level (y) after covering a fraction f of the region, from sorted sample heights. */
export function levelFor(levels: number[], f: number) {
  if (f <= 0 || !levels.length) return -Infinity;
  if (f >= 1) return Infinity;
  return levels[Math.min(levels.length - 1, Math.floor(f * levels.length))];
}

export interface FillScene {
  kind: "fill-pour";
  region: Region;
  /** π used in the problem. */
  pi: number;
  /** The student's area. */
  amount: number;
  unit: string;
  /** What is poured, like "rangoli powder". */
  stuff: string;
  /** Colour of the poured stuff. */
  colour: string;
}

export function isFillScene(s: { kind: string }): s is FillScene {
  return s.kind.startsWith("fill-");
}

export const POUR_S = 3.0;
export const END_S = 0.8;
/** Relative error that still looks exactly full. */
export const FIT = 0.004;

export function planFill(s: FillScene): { outcome: { ok: boolean; text: string }; duration: number; area: number; fraction: number } {
  const area = regionArea(s.region, s.pi);
  const fraction = s.amount / area;
  const duration = POUR_S + END_S;
  const n = (x: number) => String(Number(x.toPrecision(4)));
  const ok = Math.abs(fraction - 1) <= FIT;
  const text = ok
    ? `${n(s.amount)} ${s.unit} of ${s.stuff} covers the shape exactly, edge to edge!`
    : fraction < 1
      ? `${n(s.amount)} ${s.unit} of ${s.stuff} runs out with ${n(area - s.amount)} ${s.unit} still bare.`
      : `The shape is full after ${n(area)} ${s.unit}, and ${n(s.amount - area)} ${s.unit} of ${s.stuff} spills over.`;
  return { outcome: { ok, text }, duration, area, fraction };
}
