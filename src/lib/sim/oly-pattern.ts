/**
 * Maths Olympiad: sequences and patterns. A pattern is built stage by stage up to the student's
 * stage number, and the sim counts what it used. Pure functions shared by the OlyPattern sim and the answers.
 */
import { isWhole } from "./oly-number";

export type PatternKind = "pat-sticks" | "pat-seats" | "pat-hex";

export interface PatternScene {
  kind: PatternKind;
  /** The student's stage number (squares in the row, rows of seats, rings of the rangoli). */
  n: number;
  /** The count the story fixes. */
  target: number;
  /** Seats only: seats in the first row and the extra seats in each next row. */
  first?: number;
  step?: number;
}

export function isPatternScene(s: { kind: string }): s is PatternScene {
  return s.kind.startsWith("pat-");
}

/** Matchsticks for a row of n squares: 3n + 1. */
export const sticks = (n: number) => 3 * n + 1;

/** Seats in row k (k = 1, 2, ...) when row 1 has `first` and each row adds `step`. */
export const seatsInRow = (k: number, first: number, step: number) => first + (k - 1) * step;

/** Seats in n rows: n × [(2 × first) + ((n − 1) × step)] ÷ 2. */
export const seatsTotal = (n: number, first: number, step: number) => (n * (2 * first + (n - 1) * step)) / 2;

/** Dots in a centred hexagon with n rings (the middle dot is ring 1): 3n(n − 1) + 1. */
export const hexDots = (n: number) => 3 * n * (n - 1) + 1;

/** Count for stage n of a scene's pattern, found by adding stage by stage (no formula). */
export function countByBuilding(s: Pick<PatternScene, "kind" | "first" | "step">, n: number) {
  let c = 0;
  for (let k = 1; k <= n; k++) {
    if (s.kind === "pat-sticks") c += k === 1 ? 4 : 3;
    else if (s.kind === "pat-seats") c += seatsInRow(k, s.first ?? 0, s.step ?? 0);
    else c += k === 1 ? 1 : 6 * (k - 1);
  }
  return c;
}

/** Count for stage n by the closed formula. */
export function countByFormula(s: Pick<PatternScene, "kind" | "first" | "step">, n: number) {
  if (s.kind === "pat-sticks") return sticks(n);
  if (s.kind === "pat-seats") return seatsTotal(n, s.first ?? 0, s.step ?? 0);
  return hexDots(n);
}

/** The stage whose count equals `target`, by building up one stage at a time; NaN if none. */
export function stageFor(s: Pick<PatternScene, "kind" | "first" | "step">, target: number, limit = 10000) {
  for (let n = 1; n <= limit; n++) {
    const c = countByBuilding(s, n);
    if (c === target) return n;
    if (c > target) return NaN;
  }
  return NaN;
}

export const BUILD_S = 3.2;
export const END_S = 0.8;

const WORD: Record<PatternKind, [string, string]> = {
  "pat-sticks": ["square", "matchsticks"],
  "pat-seats": ["row", "seats"],
  "pat-hex": ["ring", "dots"],
};

export function planPattern(s: PatternScene): { outcome: { ok: boolean; text: string }; duration: number; stage: number; count: number } {
  const duration = BUILD_S + END_S;
  const [unit, things] = WORD[s.kind];
  const whole = isWhole(s.n) && s.n >= 1;
  const stage = Math.max(0, whole ? Math.round(s.n) : Math.floor(s.n));
  const count = countByFormula(s, stage);
  if (!whole)
    return {
      outcome: { ok: false, text: s.n < 1 ? `There must be at least one ${unit}.` : `You cannot build ${Number(s.n.toPrecision(4))} ${unit}s; it must be a whole number.` },
      duration,
      stage,
      count,
    };
  if (count === s.target) return { outcome: { ok: true, text: `${stage} ${unit}s use exactly ${count} ${things}. Nothing left, nothing missing!` }, duration, stage, count };
  return {
    outcome: {
      ok: false,
      text: count < s.target ? `${stage} ${unit}s use ${count} ${things}, leaving ${s.target - count} unused.` : `${stage} ${unit}s need ${count} ${things}, ${count - s.target} more than the ${s.target} there are.`,
    },
    duration,
    stage,
    count,
  };
}
