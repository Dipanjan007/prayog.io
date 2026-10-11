/**
 * Maths Olympiad: counting and probability. Everything here is counted by listing the actual
 * objects (pairs, routes, outcomes), so the answers never rest on a formula alone.
 * Pure functions shared by the OlyCount sim and the problem answers.
 */
import { isWhole } from "./oly-number";

export interface CountItem {
  label: string;
  /** For routes on a grid: one letter per block, "E" (east) or "N" (north). */
  path?: string;
}

export interface CountListScene {
  kind: "count-list";
  /** The objects that really exist, listed one by one. */
  items: CountItem[];
  /** Slots to fill: the student's count, or the number the story fixes. */
  slots: number;
  /** Where the slots come from: the student's answer, or the story (the answer then changes the items). */
  slotsFrom: "answer" | "story";
  /** Singular and plural, like ["pair", "pairs"]. */
  word: [string, string];
  /** Shown above the slots, like "6 batters" or "your 10 teams". */
  heading: string;
  /** Set when the typed value is impossible (like 9.5 teams); the run then fails with this text. */
  invalid?: string;
  /** Street grid for route problems: w blocks east, h blocks north, an optional closed crossing. */
  grid?: { w: number; h: number; blocked?: [number, number] };
}

export interface ChanceCell {
  label: string;
  fav: boolean;
  /** Not a possible outcome (like picking the same toffee twice); drawn greyed out and not counted. */
  void?: boolean;
}

export interface ChanceScene {
  kind: "count-chance";
  rows: number;
  cols: number;
  /** Row by row. */
  cells: ChanceCell[];
  rowLabels?: string[];
  colLabels?: string[];
  /** The event in a few words, like "at least one six". */
  event: string;
  /** The student's probability. */
  p: number;
}

export type CountScene = CountListScene | ChanceScene;

export function isCountScene(s: { kind: string }): s is CountScene {
  return s.kind.startsWith("count-");
}

/* ---------- Listing objects ---------- */

/** Every ordered pair of two different names: (first, second). */
export function orderedPairs(names: string[]): CountItem[] {
  const out: CountItem[] = [];
  for (const a of names) for (const b of names) if (a !== b) out.push({ label: `${a}–${b}` });
  return out;
}

/** Every unordered pair from n things labelled 1..n. */
export function unorderedPairs(n: number): CountItem[] {
  const out: CountItem[] = [];
  for (let i = 1; i <= n; i++) for (let j = i + 1; j <= n; j++) out.push({ label: `${i}v${j}` });
  return out;
}

/** Every rectangle rows × perRow = n with both sides at least `minSide`. */
export function rectangles(n: number, minSide: number): CountItem[] {
  const out: CountItem[] = [];
  for (let r = minSide; r <= n; r++) if (n % r === 0 && n / r >= minSide) out.push({ label: `${r} × ${n / r}` });
  return out;
}

/** Every route of w steps east and h steps north from (0, 0) that never passes through `blocked`. */
export function gridRoutes(w: number, h: number, blocked?: [number, number]): CountItem[] {
  const out: CountItem[] = [];
  const walk = (x: number, y: number, path: string) => {
    if (blocked && x === blocked[0] && y === blocked[1]) return;
    if (x === w && y === h) {
      out.push({ label: path, path });
      return;
    }
    if (x < w) walk(x + 1, y, path + "E");
    if (y < h) walk(x, y + 1, path + "N");
  };
  walk(0, 0, "");
  return out;
}

/** The smallest size n (1, 2, 3, ...) whose listing has exactly `target` objects; NaN if none up to `limit`. */
export function sizeForCount(count: (n: number) => number, target: number, limit = 1000) {
  for (let n = 1; n <= limit; n++) if (count(n) === target) return n;
  return NaN;
}

/** n choose k, by multiplying (used only to double-check the listings in tests and solutions). */
export function choose(n: number, k: number) {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

/* ---------- Outcome grids for probability ---------- */

/** Two dice: row = first die, column = second die. */
export function diceGrid(fav: (a: number, b: number) => boolean): Pick<ChanceScene, "rows" | "cols" | "cells" | "rowLabels" | "colLabels"> {
  const cells: ChanceCell[] = [];
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) cells.push({ label: `${a}${b}`, fav: fav(a, b) });
  const lab = ["1", "2", "3", "4", "5", "6"];
  return { rows: 6, cols: 6, cells, rowLabels: lab, colLabels: lab };
}

/** Two picks without putting back: row = first pick, column = second pick; the diagonal is impossible. */
export function drawTwoGrid(bag: string[], fav: (a: string, b: string) => boolean): Pick<ChanceScene, "rows" | "cols" | "cells" | "rowLabels" | "colLabels"> {
  const cells: ChanceCell[] = [];
  bag.forEach((a, i) => bag.forEach((b, j) => cells.push(i === j ? { label: "", fav: false, void: true } : { label: a + b, fav: fav(a, b) })));
  return { rows: bag.length, cols: bag.length, cells, rowLabels: bag, colLabels: bag };
}

/** Every sequence of k tosses ("W" won, "L" lost), laid out in a grid `cols` wide. */
export function tossGrid(k: number, cols: number, fav: (seq: string) => boolean): Pick<ChanceScene, "rows" | "cols" | "cells"> {
  const cells: ChanceCell[] = [];
  for (let m = 0; m < 2 ** k; m++) {
    let seq = "";
    for (let i = k - 1; i >= 0; i--) seq += (m >> i) & 1 ? "L" : "W";
    cells.push({ label: seq, fav: fav(seq) });
  }
  return { rows: Math.ceil(cells.length / cols), cols, cells };
}

export function chanceOf(cells: ChanceCell[]) {
  const real = cells.filter((c) => !c.void);
  const fav = real.filter((c) => c.fav).length;
  return { fav, total: real.length, p: fav / real.length };
}

/* ---------- Planning a run ---------- */

/** Seconds to fill the slots (or light the outcomes), then a pause for the verdict. */
export const FILL_S = 3.4;
export const END_S = 0.8;

export function planCount(s: CountScene): { outcome: { ok: boolean; text: string }; duration: number } {
  const duration = FILL_S + END_S;
  if (s.kind === "count-chance") {
    const { fav, total, p } = chanceOf(s.cells);
    const ok = Number.isFinite(s.p) && Math.abs(s.p - p) <= 1e-6 * Math.max(p, 1e-9);
    const lead = `${fav} of the ${total} equally likely outcomes give ${s.event}, so p = ${fav} ÷ ${total} ≈ ${p.toFixed(3)}.`;
    const text = ok ? `${lead} That matches your answer!` : `${lead} Your ${fmtP(s.p)} would need ${fmtP(s.p * total)} of them to work.`;
    return { outcome: { ok, text }, duration };
  }
  const [one, many] = s.word;
  const n = s.items.length;
  const things = (k: number) => `${k} ${k === 1 ? one : many}`;
  if (s.invalid) return { outcome: { ok: false, text: s.invalid }, duration };
  if (!isWhole(s.slots) || s.slots < 0) return { outcome: { ok: false, text: `A count must be a whole number, not ${fmtP(s.slots)}.` }, duration };
  const slots = Math.round(s.slots);
  if (n === slots) return { outcome: { ok: true, text: `Exactly ${things(n)}: every slot is filled and nothing is left over!` }, duration };
  if (s.slotsFrom === "answer")
    return {
      outcome: {
        ok: false,
        text: n > slots ? `There are ${things(n)}, so ${n - slots} ${n - slots === 1 ? "has" : "have"} no slot in your count of ${slots}.` : `There are only ${things(n)}, so ${slots - n} of your ${slots} slots ${slots - n === 1 ? "stays" : "stay"} empty.`,
      },
      duration,
    };
  return {
    outcome: { ok: false, text: n > slots ? `That gives ${things(n)}, ${n - slots} more than the ${slots} in the story.` : `That gives only ${things(n)}, ${slots - n} fewer than the ${slots} in the story.` },
    duration,
  };
}

function fmtP(x: number) {
  return Number.isFinite(x) ? String(Number(x.toPrecision(3))) : "?";
}
