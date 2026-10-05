/**
 * Air track physics for the Class 9 "How Forces Affect Motion" lesson.
 * Two carts on a straight track: a push for a set time, collisions (elastic or sticky)
 * and a spring "recoil" release. Pure functions, so they can be unit tested.
 */

export const G = 9.8; // m/s²
/** Sliding friction coefficient when the air supply is off (a rough plastic track). */
export const MU = 0.2;
export const TRACK = 3; // m
export const CART_W = 0.2; // m, length of each cart along the track
/** Starting centres of the carts in "collide" mode, and the middle of the track for "recoil". */
export const START_A = 0.25;
export const START_B = 2.0;
export const MID = TRACK / 2;
/** Run stops after this much simulated time, even if something is still moving. */
export const MAX_T = 20;

/** Slider ranges, shared by the UI and the tests. */
export const SLIDERS = {
  mass: { min: 0.5, max: 3, step: 0.25 },
  force: { min: 0.5, max: 5, step: 0.5 },
  time: { min: 0.1, max: 0.5, step: 0.05 },
};

export type Mode = "collide" | "recoil";
export type CollisionKind = "elastic" | "sticky";

export interface Settings {
  mode: Mode;
  kind: CollisionKind;
  /** Air supply on: no friction. Off: sliding friction μ = 0.2. */
  air: boolean;
  mA: number;
  mB: number;
  /** Push force (N) and how long it lasts (s). */
  F: number;
  pushTime: number;
}

export interface Hit {
  t: number;
  kind: CollisionKind;
  /** Momentum (kg m/s) of A and B just before and just after the collision. */
  before: [number, number];
  after: [number, number];
}

export interface World {
  s: Settings;
  t: number;
  xA: number;
  vA: number;
  xB: number;
  vB: number;
  stuck: boolean;
  /** Net force on A (N) and its acceleration (m/s²) in the last step. */
  netA: number;
  accA: number;
  /** Did A ever move? */
  moved: boolean;
  /** Seconds A glided with no push, air on, before any collision. */
  glide: number;
  /** A's speed when the glide started, to check it stays constant. */
  glideV: number;
  glideDrift: number;
  hits: Hit[];
  /** Speed of each cart as it reached its end buffer (null if it never did). */
  exitA: number | null;
  exitB: number | null;
  /** Momentum of each cart when the push ended (recoil). */
  afterPush: [number, number] | null;
  ended: boolean;
}

/** Final velocities of a 1-D collision. e = 1: elastic. e = 0: the carts stick together. */
export function collide(m1: number, u1: number, m2: number, u2: number, e: number): [number, number] {
  const p = m1 * u1 + m2 * u2;
  const v1 = (p + m2 * e * (u2 - u1)) / (m1 + m2);
  const v2 = (p + m1 * e * (u1 - u2)) / (m1 + m2);
  return [v1, v2];
}

/** Largest friction force on a mass (N): zero with the air on. */
export const frictionMax = (m: number, air: boolean) => (air ? 0 : MU * m * G);

/**
 * Net force on a body pushed with `applied` newtons while moving at v.
 * At rest, friction balances the push up to μmg, so the net force can be zero (balanced forces).
 */
export function netForce(applied: number, m: number, v: number, air: boolean) {
  const fMax = frictionMax(m, air);
  if (fMax === 0) return applied;
  if (Math.abs(v) > 1e-9) return applied - Math.sign(v) * fMax;
  if (Math.abs(applied) <= fMax) return 0;
  return applied - Math.sign(applied) * fMax;
}

export function createWorld(s: Settings): World {
  const recoil = s.mode === "recoil";
  return {
    s,
    t: 0,
    xA: recoil ? MID - CART_W / 2 : START_A,
    vA: 0,
    xB: recoil ? MID + CART_W / 2 : START_B,
    vB: 0,
    stuck: false,
    netA: 0,
    accA: 0,
    moved: false,
    glide: 0,
    glideV: 0,
    glideDrift: 0,
    hits: [],
    exitA: null,
    exitB: null,
    afterPush: null,
    ended: false,
  };
}

/** Velocity after dt under net force, without friction flipping the direction of motion. */
function advanceV(v: number, applied: number, m: number, air: boolean, dt: number) {
  const net = netForce(applied, m, v, air);
  let nv = v + (net / m) * dt;
  // Friction can stop a cart but never push it backwards.
  if (!air && v !== 0 && Math.sign(nv) !== Math.sign(v) && Math.abs(applied) <= frictionMax(m, air)) nv = 0;
  return { nv, net };
}

const H = 0.0005; // s, internal step

/** Advance the world by dt seconds (in place). */
export function step(w: World, dt: number) {
  let left = dt;
  while (left > 1e-12 && !w.ended) {
    const h = Math.min(H, left);
    left -= h;
    substep(w, h);
  }
  return w;
}

function substep(w: World, h: number) {
  const { s } = w;
  const pushing = w.t < s.pushTime - 1e-12;
  const fA = pushing ? (s.mode === "recoil" ? -s.F : s.F) : 0;
  const fB = pushing && s.mode === "recoil" ? s.F : 0;

  if (w.stuck) {
    const m = s.mA + s.mB;
    const { nv, net } = advanceV(w.vA, fA, m, s.air, h);
    w.netA = net * (s.mA / m);
    w.accA = net / m;
    w.xA += ((w.vA + nv) / 2) * h;
    w.xB = w.xA + CART_W;
    w.vA = w.vB = nv;
  } else {
    const a = advanceV(w.vA, fA, s.mA, s.air, h);
    const b = advanceV(w.vB, fB, s.mB, s.air, h);
    w.netA = a.net;
    w.accA = a.net / s.mA;
    w.xA += ((w.vA + a.nv) / 2) * h;
    w.xB += ((w.vB + b.nv) / 2) * h;
    w.vA = a.nv;
    w.vB = b.nv;
  }
  w.t += h;
  if (Math.abs(w.vA) > 1e-6) w.moved = true;

  // Glide: A moving freely on air before any collision.
  if (!pushing && s.air && w.hits.length === 0 && Math.abs(w.vA) > 0.05 && s.mode === "collide") {
    if (w.glide === 0) w.glideV = w.vA;
    w.glide += h;
    w.glideDrift = Math.max(w.glideDrift, Math.abs(w.vA - w.glideV));
  }

  // Collision: carts touching and closing in.
  if (!w.stuck && w.xB - w.xA <= CART_W && w.vA > w.vB) {
    const e = s.kind === "elastic" ? 1 : 0;
    const before: [number, number] = [s.mA * w.vA, s.mB * w.vB];
    const [vA, vB] = collide(s.mA, w.vA, s.mB, w.vB, e);
    w.vA = vA;
    w.vB = vB;
    w.xA = w.xB - CART_W;
    if (e === 0) w.stuck = true;
    w.hits.push({ t: w.t, kind: s.kind, before, after: [s.mA * vA, s.mB * vB] });
  }

  if (!w.afterPush && w.t >= s.pushTime - 1e-12) w.afterPush = [s.mA * w.vA, s.mB * w.vB];

  // End buffers catch the carts.
  const half = CART_W / 2;
  if (w.xB + half >= TRACK && w.vB > 0) {
    if (w.exitB === null) w.exitB = w.vB;
    w.xB = TRACK - half;
    w.vB = 0;
    if (w.stuck) {
      if (w.exitA === null) w.exitA = w.vA;
      w.vA = 0;
      w.xA = w.xB - CART_W;
    }
  }
  if (w.xA - half <= 0 && w.vA < 0) {
    if (w.exitA === null) w.exitA = w.vA;
    w.xA = half;
    w.vA = 0;
    if (w.stuck) {
      w.vB = 0;
      w.xB = w.xA + CART_W;
    }
  }
  // A blocked by B parked at the right buffer.
  if (w.xA + half >= TRACK - CART_W && w.vA > 0 && w.vB === 0 && w.xB + half >= TRACK - 1e-9) {
    w.xA = TRACK - half - CART_W;
    w.vA = 0;
  }

  const still = Math.abs(w.vA) < 1e-9 && Math.abs(w.vB) < 1e-9;
  if (w.t >= MAX_T || (!pushing && still)) w.ended = true;
}

/** Run a whole push to the end. */
export function runToEnd(s: Settings) {
  const w = createWorld(s);
  while (!w.ended) step(w, 0.01);
  return w;
}

/** Challenge: knock cart B to the target speed (air on). One star per round. */
export const ROUNDS: { mB: number; kind: CollisionKind; v: number; label: string }[] = [
  { mB: 1, kind: "elastic", v: 1.5, label: "Bounce a 1 kg cart away at 1.5 m/s" },
  { mB: 2, kind: "sticky", v: 0.8, label: "Stick to a 2 kg cart and roll on at 0.8 m/s" },
  { mB: 0.5, kind: "elastic", v: 2, label: "Send a 0.5 kg cart off at 2.0 m/s" },
];
/** How close (m/s) cart B's speed must be to the target. */
export const TOLERANCE = 0.05;
