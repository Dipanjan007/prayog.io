/**
 * The golden ratio (Maths Outliers). Pure functions for the SunflowerLab sim:
 * Virahanka-Fibonacci numbers, the ratio of neighbours heading to φ, counting
 * rhythms of short and long beats, and seeds placed by a fixed turn (Vogel's model).
 */

/** The golden ratio φ = (1 + √5) ÷ 2 ≈ 1.618. */
export const PHI = (1 + Math.sqrt(5)) / 2;

/** The golden angle: the smaller part of a full turn cut in the golden ratio, 360° ÷ φ² ≈ 137.5°. */
export const GOLDEN_ANGLE = 360 / (PHI * PHI);

/** Start numbers the sim allows, and the most terms it will add. */
export const START = { min: 1, max: 20 };
export const MAX_TERMS = 20;

/** The first `count` terms of the sequence that starts a, b and adds the last two each time. */
export function sequence(a: number, b: number, count: number) {
  const out = [a, b].slice(0, Math.max(0, count));
  while (out.length < count) out.push(out[out.length - 1] + out[out.length - 2]);
  return out;
}

/** The Virahanka-Fibonacci numbers 1, 1, 2, 3, 5, 8, ... */
export function fib(count: number) {
  return sequence(1, 1, count);
}

/** True when n is one of the Virahanka-Fibonacci numbers. */
export function isFib(n: number) {
  let a = 1;
  let b = 1;
  while (b < n) [a, b] = [b, a + b];
  return n === b || n === a;
}

/** Ratio of the last term to the one before it, or NaN when there is no earlier term or it is 0. */
export function lastRatio(seq: number[]) {
  if (seq.length < 2) return NaN;
  const p = seq[seq.length - 2];
  return p === 0 ? NaN : seq[seq.length - 1] / p;
}

/** True when r rounds to 1.618, the golden ratio to 3 decimal places. */
export function agreesWithPhi(r: number) {
  return Math.round(r * 1000) === 1618;
}

/** Fewest terms (2 or more) after which the ratio of neighbours rounds to 1.618, starting from a, b. */
export function termsToPhi(a: number, b: number) {
  for (let n = 2; n <= 60; n++) if (agreesWithPhi(lastRatio(sequence(a, b, n)))) return n;
  return Infinity;
}

/** Beats the rhythm mode allows. */
export const BEATS = { min: 1, max: 7 };

/**
 * Virahanka's question: how many rhythms of `beats` beats can be made from short (1 beat)
 * and long (2 beat) syllables? Counted directly by listing, not with the sequence.
 */
export function rhythms(beats: number): number {
  return listRhythms(beats).length;
}

/** Every rhythm of `beats` beats as a string of S (1 beat) and L (2 beats). */
export function listRhythms(beats: number): string[] {
  if (beats < 0) return [];
  if (beats === 0) return [""];
  return [...listRhythms(beats - 1).map((r) => r + "S"), ...listRhythms(beats - 2).map((r) => r + "L")];
}

export interface Seed {
  x: number;
  y: number;
}

/**
 * Seeds of a sunflower head: seed i sits i turns of `angleDeg` round from the first,
 * at distance √(i + 0.5) from the centre, so each seed gets the same share of area (π).
 */
export function seeds(count: number, angleDeg: number): Seed[] {
  const t = (angleDeg * Math.PI) / 180;
  const out: Seed[] = [];
  for (let i = 0; i < count; i++) {
    const r = Math.sqrt(i + 0.5);
    out.push({ x: r * Math.cos(i * t), y: r * Math.sin(i * t) });
  }
  return out;
}

/** Spacing of seeds packed perfectly in a honeycomb with the same share of area (π) each. */
export const IDEAL_GAP = Math.sqrt((2 * Math.PI) / Math.sqrt(3));

/**
 * How well the seeds are packed, as a percentage: the closest any two seeds come
 * (leaving out the crowded first tenth at the centre), compared with a perfect honeycomb.
 * Spokes and gaps squash some seeds together, so a low score means wasted space.
 */
export function packing(count: number, angleDeg: number) {
  const s = seeds(count, angleDeg);
  let best = Infinity;
  for (let i = Math.floor(count / 10); i < count; i++) {
    for (let j = 0; j < i; j++) {
      const d = Math.hypot(s[i].x - s[j].x, s[i].y - s[j].y);
      if (d < best) best = d;
    }
  }
  return Math.round((100 * best) / IDEAL_GAP);
}

/**
 * When the turn is a simple fraction p/q of a full turn (q ≤ 24), the seeds line up in
 * q straight spokes. Returns q, or null when the angle is not such a fraction.
 */
export function spokes(angleDeg: number, tol = 1e-6): number | null {
  for (let q = 1; q <= 24; q++) {
    const turns = (angleDeg * q) / 360;
    if (Math.abs(turns - Math.round(turns)) < tol) return q;
  }
  return null;
}

/** Arm (0 … k − 1) that seed i is painted in when the head is painted in k colours. */
export function armOf(i: number, k: number) {
  return i % k;
}

/** Turn between neighbouring seeds of one painted arm, folded to −180° … 180°. Small means a smooth spiral arm. */
export function armTwist(k: number, angleDeg: number) {
  const a = (((k * angleDeg) % 360) + 360) % 360;
  return a > 180 ? a - 360 : a;
}

/** Largest turn (degrees) between seeds of one colour that still looks like one smooth spiral arm. */
export const SMOOTH_TWIST = 14;

/** True when painting in k colours makes every colour one smooth spiral arm. */
export function smoothArms(k: number, angleDeg: number) {
  return k > 1 && Math.abs(armTwist(k, angleDeg)) < SMOOTH_TWIST;
}

/**
 * Controls of the sunflower mode. The dial stays between 120° and 160° so it holds one
 * golden-style angle: other "noble" angles, like 99.5°, pack almost as well as 137.5°.
 */
export const ANGLE = { min: 120, max: 160, step: 0.1 };
export const SEEDS = { min: 100, max: 500, step: 10 };
export const ARMS = { min: 1, max: 40 };

/** The golden angle as the sim's 0.1° slider can show it: 137.5°. */
export const GOLDEN_SETTING = Math.round(GOLDEN_ANGLE * 10) / 10;

/** True when the angle is the golden angle to the sim's 0.1° step. */
export function isGoldenSetting(angleDeg: number) {
  return Math.abs(angleDeg - GOLDEN_SETTING) < 1e-6;
}

/**
 * The turn the sim really uses for a dial setting: 137.5° on the dial is the exact golden
 * angle (137.5078...°), so a big head does not drift off it; every other setting is used as shown.
 */
export function turnFor(setting: number) {
  return isGoldenSetting(setting) ? GOLDEN_ANGLE : setting;
}

/** Every angle the slider can reach, in order. */
export function sliderAngles() {
  const out: number[] = [];
  for (let t = ANGLE.min * 10; t <= ANGLE.max * 10; t++) out.push(t / 10);
  return out;
}

/** Challenge rounds: count rhythms, grow the best-packed head, or find the spiral count. */
export type GoldenRound =
  | { kind: "rhythm"; name: string; brief: string; beats: number; options: number[] }
  | { kind: "pack"; name: string; brief: string; seeds: number }
  | { kind: "arms"; name: string; brief: string; seeds: number; min: number; max: number };

/** Every number of colours in the round's range that gives smooth spiral arms at the golden angle. */
export function armAnswers(r: { min: number; max: number }) {
  const out: number[] = [];
  for (let k = r.min; k <= r.max; k++) if (smoothArms(k, GOLDEN_ANGLE)) out.push(k);
  return out;
}

/** The right answer for a round: the rhythm count, the angle, or the number of colours. */
export function roundAnswer(r: GoldenRound) {
  if (r.kind === "rhythm") return rhythms(r.beats);
  if (r.kind === "pack") return GOLDEN_SETTING;
  return armAnswers(r)[0];
}
