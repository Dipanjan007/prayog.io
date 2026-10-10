/**
 * Finding the unknown on a balance (NCERT Class 7 Ganita Prakash Part 2, "Finding the Unknown").
 * Pure functions for the BalanceLab sim: pans holding mystery bags (x marbles each) and
 * loose marbles, moves that do the same thing to both pans, and the equation the scale shows.
 */

/** One pan of the taraazu: some identical mystery bags and some loose marbles. */
export interface Pan {
  bags: number;
  marbles: number;
}

export interface Scale {
  left: Pan;
  right: Pan;
}

/**
 * A move done to both pans at once: take k marbles off each, take k bags off each,
 * or split each pan into k equal shares and keep one share.
 */
export type Move = { kind: "marbles"; k: number } | { kind: "bags"; k: number } | { kind: "share"; k: number };

/** How many marbles a pan holds in all when every bag holds x marbles. */
export function weight(p: Pan, x: number) {
  return p.bags * x + p.marbles;
}

/** Left weight minus right weight: 0 when the beam is level. */
export function tilt(s: Scale, x: number) {
  return weight(s.left, x) - weight(s.right, x);
}

export function balanced(s: Scale, x: number) {
  return tilt(s, x) === 0;
}

const divides = (k: number, v: number) => v % k === 0;

/** Whether a move can be done with real bags and marbles (nothing goes below zero, shares come out whole). */
export function canApply(s: Scale, m: Move) {
  if (!Number.isInteger(m.k) || m.k < 1) return false;
  if (m.kind === "marbles") return s.left.marbles >= m.k && s.right.marbles >= m.k;
  if (m.kind === "bags") return s.left.bags >= m.k && s.right.bags >= m.k;
  return m.k >= 2 && [s.left.bags, s.left.marbles, s.right.bags, s.right.marbles].every((v) => divides(m.k, v));
}

/** Do a move to both pans. Throws if it cannot be done; check canApply first. */
export function apply(s: Scale, m: Move): Scale {
  if (!canApply(s, m)) throw new Error(`cannot ${m.kind} ${m.k}`);
  const f = (p: Pan): Pan =>
    m.kind === "marbles"
      ? { bags: p.bags, marbles: p.marbles - m.k }
      : m.kind === "bags"
        ? { bags: p.bags - m.k, marbles: p.marbles }
        : { bags: p.bags / m.k, marbles: p.marbles / m.k };
  return { left: f(s.left), right: f(s.right) };
}

/** Take one marble off a single pan only (this tips the scale). Null when that pan has no loose marble. */
export function takeOne(s: Scale, side: "left" | "right"): Scale | null {
  if (s[side].marbles < 1) return null;
  return { ...s, [side]: { bags: s[side].bags, marbles: s[side].marbles - 1 } };
}

/** When one pan holds a single bag and the other only marbles, the marble count is x. Otherwise null. */
export function solvedValue(s: Scale): number | null {
  const lone = (p: Pan) => p.bags === 1 && p.marbles === 0;
  const loose = (p: Pan) => p.bags === 0;
  if (lone(s.left) && loose(s.right)) return s.right.marbles;
  if (lone(s.right) && loose(s.left)) return s.left.marbles;
  return null;
}

/** One side of the equation, e.g. "3x + 2", "x", "14" or "0". */
export function sideText(p: Pan) {
  const bag = p.bags === 0 ? "" : p.bags === 1 ? "x" : `${p.bags}x`;
  if (bag && p.marbles) return `${bag} + ${p.marbles}`;
  return bag || `${p.marbles}`;
}

/** The equation a level scale shows, e.g. "3x + 2 = 14". */
export function equationText(s: Scale) {
  return `${sideText(s.left)} = ${sideText(s.right)}`;
}

/** Solve ax + b = cx + d: x = (d − b) ÷ (a − c). NaN when a = c. */
export function solveLinear(a: number, b: number, c: number, d: number) {
  return a === c ? NaN : (d - b) / (a - c);
}

/** The x that keeps this scale level. */
export function unknownOf(s: Scale) {
  return solveLinear(s.left.bags, s.left.marbles, s.right.bags, s.right.marbles);
}

/** Every move that can be done from here (k from 1, or 2 for shares, up to what the pans allow). */
export function legalMoves(s: Scale): Move[] {
  const out: Move[] = [];
  for (let k = 1; k <= Math.min(s.left.marbles, s.right.marbles); k++) out.push({ kind: "marbles", k });
  for (let k = 1; k <= Math.min(s.left.bags, s.right.bags); k++) out.push({ kind: "bags", k });
  const most = Math.max(s.left.bags, s.left.marbles, s.right.bags, s.right.marbles);
  for (let k = 2; k <= most; k++) if (canApply(s, { kind: "share", k })) out.push({ kind: "share", k });
  return out;
}

const key = (s: Scale) => `${s.left.bags},${s.left.marbles}|${s.right.bags},${s.right.marbles}`;

/** The fewest moves that leave a lone bag against loose marbles (breadth-first search). Infinity if impossible. */
export function minMoves(start: Scale) {
  const seen = new Set([key(start)]);
  let layer = [start];
  for (let depth = 0; layer.length; depth++) {
    const next: Scale[] = [];
    for (const s of layer) {
      if (solvedValue(s) !== null) return depth;
      for (const m of legalMoves(s)) {
        const t = apply(s, m);
        if (!seen.has(key(t))) {
          seen.add(key(t));
          next.push(t);
        }
      }
    }
    layer = next;
  }
  return Infinity;
}

/** A balance to solve. x is the number of marbles in each bag. */
export interface Puzzle {
  name: string;
  brief: string;
  scale: Scale;
  x: number;
}

/** A challenge balance with its par: the fewest moves that solve it. */
export interface BalanceRound extends Puzzle {
  par: number;
}

/** Largest amount the "How many" control goes up to. */
export const MAX_AMOUNT = 30;

/** Did the student write the equation of this scale? Either way round counts. */
export function sameEquation(s: Scale, w: Scale) {
  const eq = (p: Pan, q: Pan) => p.bags === q.bags && p.marbles === q.marbles;
  return (eq(s.left, w.left) && eq(s.right, w.right)) || (eq(s.left, w.right) && eq(s.right, w.left));
}

/** Short label for a move, as shown in the move log. */
export function moveText(m: Move) {
  if (m.kind === "marbles") return `− ${m.k} from both sides`;
  if (m.kind === "bags") return `− ${m.k === 1 ? "x" : `${m.k}x`} from both sides`;
  return `both sides ÷ ${m.k}`;
}

/** One side worked out with x put back, multiplication bracketed first, e.g. "(3 × 4) + 2". */
export function sideWithValue(p: Pan, x: number) {
  const bag = p.bags === 0 ? "" : p.bags === 1 ? `${x}` : `(${p.bags} × ${x})`;
  if (bag && p.marbles) return `${bag} + ${p.marbles}`;
  return bag || `${p.marbles}`;
}

/** The check of an answer, e.g. "(3 × 4) + 2 = 14" or "(5 × 3) + 1 = 16 and (2 × 3) + 10 = 16". */
export function checkText(s: Scale, x: number) {
  const l = weight(s.left, x);
  const r = weight(s.right, x);
  const L = sideWithValue(s.left, x);
  const R = sideWithValue(s.right, x);
  if (s.right.bags === 0 && s.left.bags > 0) return `${L} = ${l}${l === r ? "" : `, not ${r}`}`;
  if (s.left.bags === 0 && s.right.bags > 0) return `${R} = ${r}${l === r ? "" : `, not ${l}`}`;
  return `${L} = ${l} and ${R} = ${r}`;
}
