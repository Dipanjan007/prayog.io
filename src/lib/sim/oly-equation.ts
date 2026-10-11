/**
 * Maths Olympiad: equations and word problems. A market balance, two trains on one line and a
 * train passing a cyclist and a walker. Pure functions shared by the OlyEquation sim and the answers.
 */

/** One pan of a balance: `x` copies of the unknown weight plus `k` kg of known weights. */
export interface Pan {
  x: number;
  k: number;
}

/** The unknown weight that balances the pans: (right.k − left.k) ÷ (left.x − right.x). */
export function solveBalance(left: Pan, right: Pan) {
  return (right.k - left.k) / (left.x - right.x);
}

/** Hours after the first train starts until the two trains meet. */
export function meetTime(D: number, v1: number, v2: number, delay2: number) {
  return (D + v2 * delay2) / (v1 + v2);
}

/** Train positions (km from station A) at time t (hours after the first train starts). */
export function trainPositions(D: number, v1: number, v2: number, delay2: number, t: number) {
  return { x1: Math.min(D, v1 * Math.max(0, t)), x2: Math.max(0, D - v2 * Math.max(0, t - delay2)) };
}

/**
 * Length of a train that takes tc seconds to pass a cyclist (speed vc, same way) and tw seconds to
 * pass a walker (speed vw, coming towards it). Speeds in m/s. From L ÷ (v − vc) = tc and L ÷ (v + vw) = tw:
 * L = (vc + vw) ÷ [(1 ÷ tw) − (1 ÷ tc)].
 */
export function trainLength(vc: number, tc: number, vw: number, tw: number) {
  return (vc + vw) / (1 / tw - 1 / tc);
}

export interface BalanceScene {
  kind: "eq-balance";
  left: Pan;
  right: Pan;
  /** The student's weight for one unknown, in kg. */
  w: number;
  /** What the unknown is, singular. */
  thing: string;
}

export interface TrainsScene {
  kind: "eq-trains";
  D: number;
  v1: number;
  v2: number;
  delay2: number;
  /** Station names at each end and the clock time the first train leaves (hours, like 6). */
  from: string;
  to: string;
  start: number;
  /** The student's time, in hours after the first train leaves. */
  t: number;
}

export interface OvertakeScene {
  kind: "eq-overtake";
  vc: number;
  tc: number;
  vw: number;
  tw: number;
  /** The student's train length, in m. */
  L: number;
}

export type EquationScene = BalanceScene | TrainsScene | OvertakeScene;

export function isEquationScene(s: { kind: string }): s is EquationScene {
  return s.kind.startsWith("eq-");
}

export const RUN_S = 3.2;
export const END_S = 0.8;
/** Relative error that still looks perfect. */
export const FIT = 0.003;

const n2 = (x: number) => String(Number(x.toFixed(2)));

/** Clock time like "9:00" from hours after midnight. */
export function clock(h: number) {
  let m = Math.round(h * 60);
  m = ((m % 1440) + 1440) % 1440;
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
}

/** Signed difference of the two pans (kg), left minus right. */
export function balanceTilt(s: BalanceScene) {
  return s.left.x * s.w + s.left.k - (s.right.x * s.w + s.right.k);
}

/** For the overtake: the train speed implied by the student's length, and the time it then takes to pass the walker. */
export function overtakeTimes(s: OvertakeScene) {
  const v = s.L / s.tc + s.vc;
  return { v, tWalk: s.L / (v + s.vw) };
}

export function planEquation(s: EquationScene): { outcome: { ok: boolean; text: string }; duration: number } {
  const duration = RUN_S + END_S;
  const done = (ok: boolean, text: string) => ({ outcome: { ok, text }, duration });
  if (s.kind === "eq-balance") {
    const L = s.left.x * s.w + s.left.k;
    const R = s.right.x * s.w + s.right.k;
    if (Math.abs(L - R) <= FIT * Math.max(L, R)) return done(true, `Both pans hold ${n2(L)} kg. The beam stays level!`);
    return done(false, `The left pan holds ${n2(L)} kg and the right ${n2(R)} kg, so the beam tips to the ${L > R ? "left" : "right"}.`);
  }
  if (s.kind === "eq-trains") {
    if (s.t <= 0) return done(false, "The trains must run for some time before they can meet.");
    const { x1, x2 } = trainPositions(s.D, s.v1, s.v2, s.delay2, s.t);
    const gap = x2 - x1;
    const at = clock(s.start + s.t);
    if (Math.abs(gap) <= FIT * s.D) return done(true, `At ${at} both trains are ${n2(x1)} km from ${s.from}. They meet!`);
    return done(false, gap > 0 ? `At ${at} they are still ${n2(gap)} km apart.` : `At ${at} they have already passed each other and are ${n2(-gap)} km apart.`);
  }
  const { v, tWalk } = overtakeTimes(s);
  if (s.L <= 0) return done(false, "A train must have some length.");
  if (Math.abs(tWalk - s.tw) <= FIT * s.tw)
    return done(true, `A ${n2(s.L)} m train runs at ${n2(v)} m/s and passes the walker in exactly ${n2(tWalk)} s!`);
  return done(false, `A ${n2(s.L)} m train passing the cyclist in ${s.tc} s runs at ${n2(v)} m/s, and then needs ${n2(tWalk)} s to pass the walker, not ${s.tw} s.`);
}
