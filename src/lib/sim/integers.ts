/**
 * Operations with Integers (NCERT Class 7 Ganita Prakash Part 2, Chapter 2).
 * Pure functions for the IntegerLab sim: a lift (or a thermometer in Leh) that jumps
 * along a number line, + and − tokens that cancel in zero pairs, and multiplication
 * as repeated jumps, where a negative count jumps the other way.
 */

export type Op = "+" | "−";
export type Scene = "lift" | "temp";

/** The building has basements down to −5 and floors up to 12; Leh's thermometer reads −20 °C to 20 °C. */
export const RANGE: Record<Scene, { min: number; max: number }> = {
  lift: { min: -5, max: 12 },
  temp: { min: -20, max: 20 },
};

/** How far the number you add or subtract can go each way. */
export const N_MAX = 15;
/** Multiplication: counts and jump sizes from −5 to 5. */
export const TIMES_MAX = 5;
/** Most tokens of one kind on the board. */
export const TOKEN_MAX = 12;

/** "−3", "0", "5" with a real minus sign. */
export const fmtInt = (n: number) => (n < 0 ? `−${-n}` : `${n}`);
/** A number written for the middle of a sum: negatives get brackets, "(−3)". */
export const br = (n: number) => (n < 0 ? `(${fmtInt(n)})` : `${n}`);

export function apply(s: number, op: Op, n: number) {
  return op === "+" ? s + n : s - n;
}

/** "2 − (−3) = 5" */
export function sentence(s: number, op: Op, n: number) {
  return `${fmtInt(s)} ${op} ${br(n)} = ${fmtInt(apply(s, op, n))}`;
}

/** Subtracting n is the same as adding its opposite: s − n = s + (−n). */
export function asAddition(s: number, op: Op, n: number) {
  return op === "+" ? { s, n } : { s, n: -n };
}

export const inRange = (scene: Scene, v: number) => v >= RANGE[scene].min && v <= RANGE[scene].max;

/** How a floor or temperature is said out loud. */
export function place(scene: Scene, v: number) {
  if (scene === "temp") return `${fmtInt(v)} °C`;
  if (v === 0) return "the ground floor";
  return v < 0 ? `basement ${fmtInt(v)}` : `floor ${v}`;
}

/* ---------- Tokens ---------- */

export const tokenValue = (plus: number, minus: number) => plus - minus;
/** Each + with a − is a zero pair: together they are worth 0. */
export const zeroPairs = (plus: number, minus: number) => Math.min(plus, minus);
/** Take out every zero pair: what is left shows the value plainly. */
export function cancel(plus: number, minus: number) {
  const z = zeroPairs(plus, minus);
  return { plus: plus - z, minus: minus - z };
}

/** Every way to show v on a board with at most TOKEN_MAX of each token. */
export function tokenWays(v: number) {
  const out: { plus: number; minus: number }[] = [];
  for (let plus = 0; plus <= TOKEN_MAX; plus++) {
    const minus = plus - v;
    if (minus >= 0 && minus <= TOKEN_MAX) out.push({ plus, minus });
  }
  return out;
}

/* ---------- Multiplication ---------- */

/** a jumps of size b from 0. A negative count a means |a| jumps of size b the other way. */
export function jumps(a: number, b: number): number[] {
  const step = a >= 0 ? b : -b;
  const out = [0];
  // `|| 0` keeps −0 (from 0 × a negative) from showing up as a separate value.
  for (let i = 0; i < Math.abs(a); i++) out.push(out[out.length - 1] + step || 0);
  return out;
}

/** Sign of a product, as the rule says it. */
export function signRule(a: number, b: number): "+" | "−" | "0" {
  if (a === 0 || b === 0) return "0";
  return (a < 0) === (b < 0) ? "+" : "−";
}

/** The pattern a × b for a from `from` down to `to`: each row changes by −b. */
export function pattern(b: number, from = 3, to = -3) {
  const out: { a: number; p: number }[] = [];
  for (let a = from; a >= to; a--) out.push({ a, p: a * b || 0 });
  return out;
}

/* ---------- Challenge ---------- */

export type IntRound =
  | { kind: "move"; scene: Scene; name: string; brief: string; start: number; op: Op; target: number }
  | { kind: "times"; name: string; brief: string; b: number; target: number };

/** The numbers the sim's controls can pick that solve a round. */
export function solutions(r: IntRound): number[] {
  const out: number[] = [];
  if (r.kind === "move") {
    for (let n = -N_MAX; n <= N_MAX; n++) if (apply(r.start, r.op, n) === r.target && inRange(r.scene, r.target)) out.push(n);
  } else {
    for (let a = -TIMES_MAX; a <= TIMES_MAX; a++) if (a * r.b === r.target) out.push(a);
  }
  return out;
}
