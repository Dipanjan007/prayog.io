/**
 * Olympiad track: momentum (recoil, ballistic pendulum, 2D perfectly inelastic collision).
 * Pure functions shared by the OlyCollision sim and the problem answers.
 */

export const G = 9.8; // m/s²
const RAD = Math.PI / 180;

export interface Outcome {
  ok: boolean;
  text: string;
}

/* ---------- Recoil ---------- */

/** Recoil speed of M after it pushes m away at speed u (both start at rest): M V = m u. */
export function recoilSpeed(M: number, m: number, u: number) {
  return (m * u) / M;
}

/** Throw speed of m so that M drifts a distance d in time t. */
export function throwSpeedForDrift(M: number, m: number, d: number, t: number) {
  return (M * (d / t)) / m;
}

export interface RecoilScene {
  kind: "recoil";
  M: number;
  m: number;
  u: number;
  d: number;
  targetT: number;
}

export function planRecoil(s: RecoilScene) {
  const V = recoilSpeed(s.M, s.m, s.u);
  const T = V > 0 ? s.d / V : Infinity;
  const ok = Math.abs(T - s.targetT) <= 0.03 * s.targetT;
  const shown = Math.min(T, s.targetT * 1.6);
  return {
    duration: shown,
    V,
    at: (t: number) => {
      const tt = Math.min(Math.max(t, 0), shown);
      return { astro: -V * tt, bag: s.u * tt };
    },
    outcome: ok
      ? { ok, text: `She drifts back at ${(V * 100).toFixed(1)} cm/s and reaches the hatch at ${T.toFixed(1)} s.` }
      : Number.isFinite(T)
        ? { ok, text: `She drifts at ${(V * 100).toFixed(1)} cm/s and reaches the hatch at ${T.toFixed(1)} s, not ${s.targetT} s.` }
        : { ok, text: "She does not move at all." },
  };
}

/* ---------- Ballistic pendulum ---------- */

/** Bullet of mass mb at speed v sticks in block M on strings of length L. Returns the swing. */
export function pendulumSwing(mb: number, M: number, v: number, L: number) {
  const V = (mb * v) / (mb + M);
  const h = (V * V) / (2 * G);
  const c = 1 - h / L;
  const angleDeg = c <= -1 ? 180 : Math.acos(c) / RAD;
  return { V, h, angleDeg };
}

/** Bullet speed that swings the block up to angleDeg. */
export function bulletSpeedForAngle(mb: number, M: number, L: number, angleDeg: number) {
  const h = L * (1 - Math.cos(angleDeg * RAD));
  const V = Math.sqrt(2 * G * h);
  return ((mb + M) * V) / mb;
}

export interface PendulumScene {
  kind: "pendulum";
  mb: number;
  M: number;
  v: number;
  L: number;
  targetDeg: number;
  /** Allowed angle error, degrees. */
  window: number;
}

export function planPendulum(s: PendulumScene) {
  const sw = pendulumSwing(s.mb, s.M, s.v, s.L);
  const amp = Math.min(sw.angleDeg, 170);
  const w = Math.sqrt(G / s.L);
  const fly = 0.5; // pellet flight shown in slow motion
  const swingT = (2 * Math.PI) / w; // one full swing
  const ok = Math.abs(sw.angleDeg - s.targetDeg) <= s.window;
  return {
    duration: fly + swingT,
    swing: sw,
    /** Pellet progress 0..1 before impact, then the string angle (degrees) after. */
    at: (t: number) => {
      if (t < fly) return { pellet: t / fly, angle: 0 };
      // Simple-harmonic shape with the exact energy-based amplitude.
      return { pellet: 1, angle: amp * Math.sin(w * (t - fly)) };
    },
    outcome: ok
      ? { ok, text: `The block swings up to ${sw.angleDeg.toFixed(1)}°, matching the mark.` }
      : { ok, text: `The block swings to ${sw.angleDeg.toFixed(1)}°, ${sw.angleDeg < s.targetDeg ? "short of" : "past"} the ${s.targetDeg}° mark.` },
  };
}

/* ---------- 2D crash: the two vehicles lock together and skid ---------- */

export function lockTogether(m1: number, v1: { x: number; y: number }, m2: number, v2: { x: number; y: number }) {
  const M = m1 + m2;
  return { x: (m1 * v1.x + m2 * v2.x) / M, y: (m1 * v1.y + m2 * v2.y) / M };
}

/** Skid distance for a sliding speed V with friction μ: V² = 2 μ g d. */
export function skidDistance(V: number, mu: number) {
  return (V * V) / (2 * mu * G);
}

/** Speed just after the crash from the skid length. */
export function speedFromSkid(d: number, mu: number) {
  return Math.sqrt(2 * mu * G * d);
}

/** Speed of vehicle 1 (going +x) from the skid direction (degrees from +x) and skid length. */
export function eastSpeedFromSkid(m1: number, m2: number, skidDeg: number, d: number, mu: number) {
  return ((m1 + m2) * speedFromSkid(d, mu) * Math.cos(skidDeg * RAD)) / m1;
}

/** Speed of vehicle 2 (going +y) from the same skid. */
export function northSpeedFromSkid(m1: number, m2: number, skidDeg: number, d: number, mu: number) {
  return ((m1 + m2) * speedFromSkid(d, mu) * Math.sin(skidDeg * RAD)) / m2;
}

export interface CrashScene {
  kind: "crash";
  m1: number;
  v1: number;
  m2: number;
  v2: number;
  mu: number;
  /** The skid marks found by the police: direction and length. */
  skidDeg: number;
  skidD: number;
  /** How close the wreck must stop to the end of the marks (m). */
  window: number;
}

export function planCrash(s: CrashScene) {
  const V = lockTogether(s.m1, { x: s.v1, y: 0 }, s.m2, { x: 0, y: s.v2 });
  const speed = Math.hypot(V.x, V.y);
  const d = skidDistance(speed, s.mu);
  const ux = speed > 0 ? V.x / speed : 0;
  const uy = speed > 0 ? V.y / speed : 0;
  const a = s.mu * G;
  const tStop = speed / a;
  const approach = 0.6; // seconds shown before impact
  const end = { x: ux * d, y: uy * d };
  const mark = { x: s.skidD * Math.cos(s.skidDeg * RAD), y: s.skidD * Math.sin(s.skidDeg * RAD) };
  const miss = Math.hypot(end.x - mark.x, end.y - mark.y);
  const ok = miss <= s.window;
  const angle = Math.atan2(V.y, V.x) / RAD;
  return {
    duration: approach + tStop,
    approach,
    end,
    mark,
    at: (t: number) => {
      if (t < approach) {
        const left = approach - t;
        return { phase: "before" as const, car: { x: -s.v1 * left, y: 0 }, auto: { x: 0, y: -s.v2 * left } };
      }
      const tt = Math.min(t - approach, tStop);
      const dist = speed * tt - 0.5 * a * tt * tt;
      return { phase: "after" as const, car: { x: ux * dist, y: uy * dist }, auto: { x: ux * dist, y: uy * dist } };
    },
    outcome: ok
      ? { ok, text: `The wreck skids ${d.toFixed(1)} m at ${angle.toFixed(0)}° and stops on the end of the marks.` }
      : { ok, text: `The wreck skids ${d.toFixed(1)} m at ${angle.toFixed(0)}°. The marks say ${s.skidD} m at ${s.skidDeg}°.` },
  };
}
