/**
 * Probability (NCERT Class 9 Ganita Manjari, "The Mathematics of Maybe: Introduction to Probability").
 * Pure functions for the ChanceLab sim: a seeded random source, coins, dice, a spinner, a bag of
 * marbles and the sum of two dice, experimental against theoretical probability, and the mela
 * challenge of building a bag or spinner with given chances.
 */

/** A source of random numbers in [0, 1), like Math.random. Pass a seeded one for repeatable runs. */
export type Rng = () => number;

/** A small seeded random source (mulberry32): the same seed always gives the same tosses. */
export function makeRng(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick an outcome index with chances in proportion to the whole-number weights. */
export function pick(weights: number[], rng: Rng) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}

/** Roll one fair die: 1 to 6. */
export function rollDie(rng: Rng) {
  return 1 + Math.floor(rng() * 6);
}

export type ExpId = "coin" | "die" | "spinner" | "bag" | "sum";

export interface Experiment {
  id: ExpId;
  label: string;
  /** The action word on the buttons: Toss, Roll, Spin, Draw. */
  verb: string;
  outcomes: string[];
  /** Number of equally likely ways each outcome can happen. */
  ways: number[];
  /** The outcome whose running frequency the sim traces. */
  tracked: number;
}

export const EXPERIMENTS: Record<ExpId, Experiment> = {
  coin: { id: "coin", label: "Coin", verb: "Toss", outcomes: ["Heads", "Tails"], ways: [1, 1], tracked: 0 },
  die: { id: "die", label: "Die", verb: "Roll", outcomes: ["1", "2", "3", "4", "5", "6"], ways: [1, 1, 1, 1, 1, 1], tracked: 5 },
  // Half the spinner is red, a quarter blue and a quarter green.
  spinner: { id: "spinner", label: "Spinner", verb: "Spin", outcomes: ["Red", "Blue", "Green"], ways: [2, 1, 1], tracked: 0 },
  // 5 red, 3 blue and 2 green marbles; each marble goes back after it is drawn.
  bag: { id: "bag", label: "Bag", verb: "Draw", outcomes: ["Red", "Blue", "Green"], ways: [5, 3, 2], tracked: 0 },
  sum: {
    id: "sum",
    label: "Two dice",
    verb: "Roll",
    outcomes: ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    ways: [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1],
    tracked: 5,
  },
};

export const EXP_ORDER: ExpId[] = ["coin", "die", "spinner", "bag", "sum"];

/** Number of the 36 ordered pairs of two dice that add up to s (2 to 12). */
export function sumWays(s: number) {
  return s < 2 || s > 12 ? 0 : 6 - Math.abs(s - 7);
}

/** Theoretical probabilities: (ways for the outcome) ÷ (all ways). */
export function theory(ways: number[]) {
  const total = ways.reduce((a, b) => a + b, 0);
  return ways.map((w) => w / total);
}

/** One trial of an experiment: the outcome index, plus the two dice for "sum". */
export function trial(exp: Experiment, rng: Rng): { i: number; dice?: [number, number] } {
  if (exp.id === "sum") {
    const d1 = rollDie(rng);
    const d2 = rollDie(rng);
    return { i: d1 + d2 - 2, dice: [d1, d2] };
  }
  if (exp.id === "die") return { i: rollDie(rng) - 1 };
  return { i: pick(exp.ways, rng) };
}

/** Run n trials, adding to the tally. Returns the new counts and the last trial. */
export function runTrials(exp: Experiment, n: number, rng: Rng, counts: number[] = exp.outcomes.map(() => 0)) {
  const next = [...counts];
  let last: ReturnType<typeof trial> | null = null;
  for (let k = 0; k < n; k++) {
    last = trial(exp, rng);
    next[last.i]++;
  }
  return { counts: next, last };
}

/** Experimental probabilities: (times it happened) ÷ (number of trials). All zero before any trial. */
export function freqs(counts: number[]) {
  const n = counts.reduce((a, b) => a + b, 0);
  return counts.map((c) => (n ? c / n : 0));
}

/** The biggest gap between an experimental and a theoretical probability. */
export function maxGap(counts: number[], probs: number[]) {
  const f = freqs(counts);
  return Math.max(...f.map((x, i) => Math.abs(x - probs[i])));
}

/** True when there are at least `minTrials` trials and every frequency is within tol of its probability. */
export function settled(counts: number[], probs: number[], minTrials: number, tol = 0.05) {
  const n = counts.reduce((a, b) => a + b, 0);
  return n >= minTrials && maxGap(counts, probs) <= tol;
}

/** True when outcome i has happened strictly more often than every other outcome. */
export function leads(counts: number[], i: number) {
  return counts.every((c, j) => j === i || c < counts[i]);
}

/** Most trials one experiment keeps, so the tally and trace stay light. */
export const MAX_TRIALS = 20000;

/* ---------- Challenge: build a bag or spinner with given chances ---------- */

/** A fraction as [numerator, denominator]. */
export type Frac = [number, number];

export const COLOURS = ["Red", "Blue", "Green"] as const;

export interface BuildTarget {
  name: string;
  brief: string;
  kind: "bag" | "spinner";
  /** Wanted P(red), P(blue), P(green). */
  target: [Frac, Frac, Frac];
}

/** The builder's limits: up to 10 marbles of each colour, or up to 12 equal sectors on a spinner. */
export const BAG_MAX_EACH = 10;
export const SPINNER_MAX = 12;

/** Starting counts in the builder: every colour equally likely, so no target is met yet. */
export function startCounts(kind: "bag" | "spinner"): [number, number, number] {
  return kind === "bag" ? [2, 2, 2] : [4, 4, 4];
}

/** Whether the counts are allowed by the builder (at least one marble or sector). */
export function allowed(kind: "bag" | "spinner", counts: number[]) {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total < 1 || counts.some((c) => c < 0 || !Number.isInteger(c))) return false;
  return kind === "bag" ? counts.every((c) => c <= BAG_MAX_EACH) : total <= SPINNER_MAX;
}

/** Exact check, with whole numbers only: count ÷ total = n ÷ d  ⇔  count × d = n × total. */
export function meetsTarget(counts: number[], target: Frac[]) {
  const total = counts.reduce((a, b) => a + b, 0);
  return total > 0 && target.every(([n, d], i) => counts[i] * d === n * total);
}

/** Every allowed set of counts the builder can make that meets the target. */
export function solutions(t: BuildTarget) {
  const out: [number, number, number][] = [];
  const top = t.kind === "bag" ? BAG_MAX_EACH : SPINNER_MAX;
  for (let r = 0; r <= top; r++)
    for (let b = 0; b <= top; b++)
      for (let g = 0; g <= top; g++) {
        const c: [number, number, number] = [r, b, g];
        if (allowed(t.kind, c) && meetsTarget(c, t.target)) out.push(c);
      }
  return out;
}

/** Greatest common divisor, to show a probability as a fraction in lowest terms. */
export function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : Math.abs(a);
}

/** "3/8", in lowest terms; "0" and "1" for the ends. */
export function fracText(n: number, d: number) {
  if (n === 0) return "0";
  const g = gcd(n, d);
  return d / g === 1 ? `${n / g}` : `${n / g}/${d / g}`;
}

/** Whether to keep a point on the running-frequency trace after `total` trials: every trial up to 100, then about 100 per decade. */
export function keepTracePoint(total: number) {
  if (total <= 100) return true;
  const step = 10 ** (Math.floor(Math.log10(total)) - 2);
  return total % step === 0;
}

/**
 * Run n trials like runTrials, and also record the running experimental probability of the tracked
 * outcome as [trials so far, frequency] points, so the sim can draw it wobbling and settling.
 */
export function runTraced(exp: Experiment, n: number, rng: Rng, counts: number[] = exp.outcomes.map(() => 0)) {
  const next = [...counts];
  let total = next.reduce((a, b) => a + b, 0);
  const trace: [number, number][] = [];
  let last: ReturnType<typeof trial> | null = null;
  const room = Math.max(0, Math.min(n, MAX_TRIALS - total));
  for (let k = 0; k < room; k++) {
    last = trial(exp, rng);
    next[last.i]++;
    total++;
    if (keepTracePoint(total)) trace.push([total, next[exp.tracked] / total]);
  }
  return { counts: next, last, trace };
}

/** Theoretical probability of each colour for a bag or spinner the student built, as [numerator, denominator]. */
export function builtChances(counts: number[]): Frac[] {
  const total = counts.reduce((a, b) => a + b, 0);
  return counts.map((c) => [c, total]);
}
