/**
 * Olympiad track: blocks, inclines, friction and pulleys (Newton's laws).
 * Light inextensible strings, light frictionless pulleys. Pure functions shared by the
 * OlyIncline sim and the problem answers.
 */

export const G = 9.8; // m/s²
const RAD = Math.PI / 180;

export interface Outcome {
  ok: boolean;
  text: string;
}

/* ---------- Answers on paper ---------- */

/** Atwood machine: acceleration of the heavier side m1 going down. */
export function atwoodAccel(m1: number, m2: number) {
  return ((m1 - m2) * G) / (m1 + m2);
}

/** Counterweight m2 so that m1 (starting at rest) falls a distance d in time t. */
export function atwoodMassForTime(m1: number, d: number, t: number) {
  const a = (2 * d) / (t * t);
  return (m1 * (G - a)) / (G + a);
}

/** Kinetic friction that makes a block, sent down a slope at v0, stop after exactly L. */
export function muToStopAfter(v0: number, L: number, thetaDeg: number) {
  const th = thetaDeg * RAD;
  return (v0 * v0 / (2 * G * L) + Math.sin(th)) / Math.cos(th);
}

/** Acceleration of a block on a slope pulled up by a hanging mass m2, while it moves up. */
export function pulleyAccelUp(m1: number, m2: number, thetaDeg: number, muK: number) {
  const th = thetaDeg * RAD;
  return (m2 * G - m1 * G * (Math.sin(th) + muK * Math.cos(th))) / (m1 + m2);
}

/** Hanging mass so the block (from rest) moves d up the slope in time t. */
export function pulleyMassForTime(m1: number, thetaDeg: number, muK: number, d: number, t: number) {
  const th = thetaDeg * RAD;
  const a = (2 * d) / (t * t);
  return (m1 * (a + G * (Math.sin(th) + muK * Math.cos(th)))) / (G - a);
}

/** String tension while the slope block accelerates upward at a. */
export function pulleyTension(m2: number, a: number) {
  return m2 * (G - a);
}

/* ---------- 1D motion with friction that can stop and stick ---------- */

/**
 * The motion is along one coordinate s with velocity v. `accel(v)` gives the acceleration while
 * moving (v ≠ 0) and `startAccel()` gives it when at rest (0 if static friction holds).
 */
interface Seg {
  t0: number;
  s0: number;
  v0: number;
  a: number;
}

export function piecewise(v0: number, accel: (v: number) => number, startAccel: () => number, tMax = 30): Seg[] {
  const segs: Seg[] = [];
  let t = 0;
  let s = 0;
  let v = v0;
  for (let i = 0; i < 4 && t < tMax; i++) {
    const a = v === 0 ? startAccel() : accel(v);
    segs.push({ t0: t, s0: s, v0: v, a });
    if (v === 0 && a === 0) break; // stuck for good
    if (v !== 0 && Math.sign(a) === -Math.sign(v) && a !== 0) {
      const dt = -v / a;
      s += v * dt + 0.5 * a * dt * dt;
      t += dt;
      v = 0;
    } else break; // speeds up or keeps going for ever
  }
  return segs;
}

export function sAt(segs: Seg[], t: number) {
  let seg = segs[0];
  for (const g of segs) if (t >= g.t0) seg = g;
  const dt = t - seg.t0;
  return { s: seg.s0 + seg.v0 * dt + 0.5 * seg.a * dt * dt, v: seg.v0 + seg.a * dt };
}

/** First time s reaches the value d (d > 0), or Infinity. */
export function timeToReach(segs: Seg[], d: number) {
  for (let i = 0; i < segs.length; i++) {
    const g = segs[i];
    const tEnd = i + 1 < segs.length ? segs[i + 1].t0 : Infinity;
    const rem = d - g.s0;
    // s0 + v0 τ + a τ²/2 = d
    let tau: number;
    if (Math.abs(g.a) < 1e-12) tau = g.v0 > 0 ? rem / g.v0 : Infinity;
    else {
      const disc = g.v0 * g.v0 + 2 * g.a * rem;
      if (disc < 0) continue;
      const r1 = (-g.v0 + Math.sqrt(disc)) / g.a;
      const r2 = (-g.v0 - Math.sqrt(disc)) / g.a;
      const pos = [r1, r2].filter((r) => r >= -1e-12).sort((a, b) => a - b);
      tau = pos.length ? pos[0] : Infinity;
    }
    if (g.t0 + tau <= tEnd + 1e-9) return g.t0 + Math.max(0, tau);
  }
  return Infinity;
}

/* ---------- Scenes the sim can play ---------- */

export interface AtwoodScene {
  kind: "atwood";
  m1: number;
  m2: number;
  /** Starting height of m1 above the ground, and the time it should take to land. */
  d: number;
  targetT: number;
}

export interface SlideScene {
  kind: "slide";
  thetaDeg: number;
  L: number;
  v0: number;
  muK: number;
  muS: number;
}

export interface PulleyScene {
  kind: "pulley";
  m1: number;
  m2: number;
  thetaDeg: number;
  muK: number;
  muS: number;
  /** Distance from the block to the pulley, and the time it should take. */
  d: number;
  targetT: number;
}

export type InclineScene = AtwoodScene | SlideScene | PulleyScene;

export interface InclinePlan {
  duration: number;
  /** Distance moved along the track (down for atwood m1 and slide, up the slope for pulley). */
  at: (t: number) => { s: number; v: number; fall: number };
  outcome: Outcome;
}

const timeWindow = 0.03; // ±3% on a timed run counts as "on time"

export function planIncline(sc: InclineScene): InclinePlan {
  if (sc.kind === "atwood") {
    const a = atwoodAccel(sc.m1, sc.m2);
    if (a <= 0) {
      return {
        duration: 1.5,
        at: () => ({ s: 0, v: 0, fall: 0 }),
        outcome: { ok: false, text: "The counterweight is too heavy: the bucket does not go down at all." },
      };
    }
    const T = Math.sqrt((2 * sc.d) / a);
    const ok = Math.abs(T - sc.targetT) <= timeWindow * sc.targetT;
    return {
      duration: T,
      at: (t) => {
        const tt = Math.min(Math.max(t, 0), T);
        return { s: 0.5 * a * tt * tt, v: a * tt, fall: 0 };
      },
      outcome: ok
        ? { ok, text: `The bucket touches down at ${T.toFixed(2)} s. Right on time.` }
        : { ok, text: `The bucket lands at ${T.toFixed(2)} s, ${T < sc.targetT ? "too early" : "too late"}.` },
    };
  }

  if (sc.kind === "slide") {
    const th = sc.thetaDeg * RAD;
    const down = G * (Math.sin(th) - sc.muK * Math.cos(th));
    const holds = Math.tan(th) <= sc.muS;
    const segs = piecewise(
      sc.v0,
      () => down,
      () => (holds ? 0 : down),
    );
    const tEdge = timeToReach(segs, sc.L);
    const stop = segs.length > 1 ? segs[1].s0 : Infinity;
    const okWindow = 0.03 * sc.L;
    if (Number.isFinite(tEdge) && !(Math.abs(stop - sc.L) <= okWindow)) {
      // Goes over the edge and drops off the end of the ramp.
      const vEdge = sAt(segs, tEdge).v;
      const fallT = 0.7;
      return {
        duration: tEdge + fallT,
        at: (t) => {
          if (t <= tEdge) return { ...sAt(segs, Math.max(t, 0)), fall: 0 };
          const dt = t - tEdge;
          return { s: sc.L + vEdge * dt * Math.cos(th), v: vEdge, fall: vEdge * Math.sin(th) * dt + 0.5 * G * dt * dt };
        },
        outcome: { ok: false, text: `The crate reaches the edge still moving at ${vEdge.toFixed(2)} m/s and falls off.` },
      };
    }
    const T = segs.length > 1 ? segs[1].t0 : 3;
    const ok = Math.abs(stop - sc.L) <= okWindow;
    return {
      duration: T,
      at: (t) => ({ ...sAt(segs, Math.min(Math.max(t, 0), T)), fall: 0 }),
      outcome: ok
        ? { ok, text: "The crate stops right at the edge of the ramp." }
        : { ok, text: `The crate stops ${(sc.L - stop).toFixed(2)} m before the edge.` },
    };
  }

  // Pulley on a slope. s is up the slope.
  const th = sc.thetaDeg * RAD;
  const drive = sc.m2 * G - sc.m1 * G * Math.sin(th);
  const fK = sc.muK * sc.m1 * G * Math.cos(th);
  const fS = sc.muS * sc.m1 * G * Math.cos(th);
  const M = sc.m1 + sc.m2;
  const segs = piecewise(
    0,
    (v) => (drive - Math.sign(v) * fK) / M,
    () => (Math.abs(drive) <= fS ? 0 : (drive - Math.sign(drive) * fK) / M),
  );
  const a0 = segs[0].a;
  if (a0 <= 0) {
    return {
      duration: a0 < 0 ? 1.2 : 1.5,
      at: (t) => ({ ...sAt(segs, Math.min(Math.max(t, 0), 1.2)), fall: 0 }),
      outcome:
        a0 === 0
          ? { ok: false, text: "Static friction wins. The trolley does not move." }
          : { ok: false, text: "The counterweight is too light. The trolley slides down the ramp." },
    };
  }
  const T = timeToReach(segs, sc.d);
  const ok = Math.abs(T - sc.targetT) <= timeWindow * sc.targetT;
  return {
    duration: T,
    at: (t) => ({ ...sAt(segs, Math.min(Math.max(t, 0), T)), fall: 0 }),
    outcome: ok
      ? { ok, text: `The trolley reaches the top at ${T.toFixed(2)} s. Right on time.` }
      : { ok, text: `The trolley reaches the top at ${T.toFixed(2)} s, ${T < sc.targetT ? "too early" : "too late"}.` },
  };
}
