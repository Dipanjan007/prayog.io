/**
 * Pendulum and race-track physics for the Class 7 "Measurement of Time and Motion" lesson.
 * Pure functions, so they can be unit tested.
 */

/** Acceleration due to gravity, m/s². */
export const G = 9.8;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Slider limits for the pendulum. */
export const LENGTH_CM = { min: 10, max: 150 };
export const MASS_G = { min: 20, max: 500 };
export const ANGLE_DEG = { min: 5, max: 45 };

/** Time period for small swings: T = 2π√(L/g). Mass does not appear anywhere. */
export const smallAnglePeriod = (lengthM: number) => 2 * Math.PI * Math.sqrt(lengthM / G);

/**
 * Exact time period of an ideal simple pendulum released from rest at `angleDeg`.
 * T = 2π√(L/g) / AGM(1, cos(θ₀/2)), the closed form of the complete elliptic integral.
 * Bigger swings take a little longer: about 0.2% at 10°, 1.7% at 30°, 4% at 45°.
 */
export function pendulumPeriod(lengthM: number, angleDeg: number) {
  let a = 1;
  let b = Math.cos(rad(angleDeg) / 2);
  for (let i = 0; i < 20 && Math.abs(a - b) > 1e-15; i++) [a, b] = [(a + b) / 2, Math.sqrt(a * b)];
  return smallAnglePeriod(lengthM) / a;
}

/** Length (m) that gives a time period T (s) for small swings. */
export const lengthForPeriod = (T: number) => G * (T / (2 * Math.PI)) ** 2;

export interface Swing {
  /** Time since release, s. */
  t: number;
  /** Angle from the vertical, radians (positive on the release side). */
  theta: number;
  /** Angular velocity, rad/s. */
  omega: number;
  /** Half swings completed: each time the bob reaches an end and turns back. */
  halves: number;
  /** Time at which the most recent full oscillation finished, s. */
  lastFull: number;
}

export const release = (angleDeg: number): Swing => ({ t: 0, theta: rad(angleDeg), omega: 0, halves: 0, lastFull: 0 });

/** One RK4 step of θ'' = −(g/L) sin θ. No air drag: an ideal pendulum keeps swinging. */
function rk4(theta: number, omega: number, lengthM: number, h: number) {
  const k = G / lengthM;
  const f = (th: number) => -k * Math.sin(th);
  const a1 = omega;
  const b1 = f(theta);
  const a2 = omega + (h / 2) * b1;
  const b2 = f(theta + (h / 2) * a1);
  const a3 = omega + (h / 2) * b2;
  const b3 = f(theta + (h / 2) * a2);
  const a4 = omega + h * b3;
  const b4 = f(theta + h * a3);
  return { theta: theta + (h / 6) * (a1 + 2 * a2 + 2 * a3 + a4), omega: omega + (h / 6) * (b1 + 2 * b2 + 2 * b3 + b4) };
}

/**
 * Move the pendulum on by `dt` seconds. A half swing ends each time the bob turns round
 * (ω changes sign); two half swings make one oscillation, back where it started.
 * The turning time is found by linear interpolation of ω, which is accurate to well under 1 ms.
 */
export function advanceSwing(s: Swing, lengthM: number, dt: number, maxStep = 1 / 500): Swing {
  let { t, theta, omega, halves, lastFull } = s;
  let left = dt;
  while (left > 1e-12) {
    const h = Math.min(maxStep, left);
    const next = rk4(theta, omega, lengthM, h);
    // The bob starts at rest at the release end, so ignore the very first instant.
    if (t > 1e-9 && omega !== 0 && Math.sign(next.omega) !== Math.sign(omega)) {
      halves++;
      const turnAt = t + (h * omega) / (omega - next.omega);
      if (halves % 2 === 0) lastFull = turnAt;
    }
    theta = next.theta;
    omega = next.omega;
    t += h;
    left -= h;
  }
  return { t, theta, omega, halves, lastFull };
}

export const oscillations = (s: Swing) => Math.floor(s.halves / 2);

/** Time (s) for n full oscillations, found by actually swinging the pendulum. */
export function timeOscillations(lengthM: number, angleDeg: number, n: number) {
  let s = release(angleDeg);
  while (oscillations(s) < n) s = advanceSwing(s, lengthM, 0.01);
  return s.lastFull;
}

// ---------------------------------------------------------------- Race track

/** The race is along a straight 100 m track. */
export const TRACK_M = 100;

export type RacerId = "cycle" | "runner" | "auto" | "cheetah";

export interface Racer {
  id: RacerId;
  name: string;
  emoji: string;
  color: string;
  /** How it moves, for the sim note and the lesson text. */
  how: string;
}

export const RACERS: Racer[] = [
  { id: "cycle", name: "Cycle", emoji: "🚲", color: "#67e8f9", how: "Already rolling at the start line and keeps a steady 5 m/s." },
  { id: "runner", name: "Runner", emoji: "🏃", color: "#c4b5fd", how: "Starts from rest, speeds up to 6 m/s, then runs steadily." },
  { id: "auto", name: "Auto-rickshaw", emoji: "🛺", color: "#fde047", how: "Starts from rest, reaches 11 m/s, slows to 2.5 m/s for a speed breaker at 55 to 62 m, then speeds up again." },
  { id: "cheetah", name: "Cheetah", emoji: "🐆", color: "#fb923c", how: "Starts from rest and speeds up to 27 m/s (about 97 km/h)." },
];

/** Speed breaker on the auto-rickshaw's lane, metres from the start. */
export const BUMP: [number, number] = [55, 62];

interface Motion {
  v0: number;
  accel: number;
  top: number;
  /** Highest speed allowed at position x (for braking before the speed breaker). */
  cap?: (x: number) => number;
}

const AUTO_BRAKE = 3; // m/s²
const BUMP_SPEED = 2.5; // m/s

const MOTIONS: Record<RacerId, Motion> = {
  cycle: { v0: 5, accel: 0, top: 5 },
  runner: { v0: 0, accel: 2.5, top: 6 },
  auto: {
    v0: 0,
    accel: 2,
    top: 11,
    cap: (x) => (x < BUMP[0] ? Math.sqrt(BUMP_SPEED ** 2 + 2 * AUTO_BRAKE * (BUMP[0] - x)) : x <= BUMP[1] ? BUMP_SPEED : Infinity),
  },
  cheetah: { v0: 0, accel: 7.5, top: 27 },
};

export interface Run {
  dt: number;
  /** Position (m) at t = i·dt, until just past the finish line. */
  xs: number[];
  /** Time to reach the finish line, s. */
  finish: number;
}

const runs = new Map<RacerId, Run>();

/** The racer's whole run, worked out once with small time steps. */
export function raceRun(id: RacerId): Run {
  const cached = runs.get(id);
  if (cached) return cached;
  const m = MOTIONS[id];
  const dt = 0.001;
  let x = 0;
  let v = m.v0;
  let t = 0;
  const xs = [0];
  let finish = 0;
  const every = 10; // store every 0.01 s
  for (let i = 1; finish === 0 || i % every !== 1; i++) {
    const cap = m.cap ? m.cap(x) : Infinity;
    const vNew = Math.min(v + m.accel * dt, m.top, cap);
    const xNew = x + ((v + vNew) / 2) * dt;
    if (!finish && xNew >= TRACK_M) finish = t + (dt * (TRACK_M - x)) / (xNew - x);
    x = xNew;
    v = vNew;
    t += dt;
    if (i % every === 0) xs.push(x);
  }
  const run = { dt: dt * every, xs, finish };
  runs.set(id, run);
  return run;
}

/** Position (m) at time t, held at the finish line once the racer is done. */
export function positionAt(id: RacerId, t: number) {
  const r = raceRun(id);
  if (t >= r.finish) return TRACK_M;
  const f = t / r.dt;
  const i = Math.floor(f);
  const a = r.xs[i] ?? TRACK_M;
  const b = r.xs[i + 1] ?? TRACK_M;
  return Math.min(TRACK_M, a + (b - a) * (f - i));
}

export const finishTime = (id: RacerId) => raceRun(id).finish;

/** Speed = distance ÷ time. Here the average speed over the whole 100 m. */
export const averageSpeed = (distanceM: number, timeS: number) => distanceM / timeS;

/** m/s to km/h: 1 m/s = 3600 m per hour = 3.6 km/h. */
export const toKmh = (ms: number) => ms * 3.6;

/** Is a student's answer close enough to distance ÷ time? Allows rounding to one decimal place. */
export function speedAnswerOk(answer: number, distanceM: number, timeS: number) {
  const right = averageSpeed(distanceM, timeS);
  return Number.isFinite(answer) && Math.abs(answer - right) <= Math.max(0.1, right * 0.03);
}

/** Gaps (m) covered in each whole second until the finish: equal gaps mean uniform motion. */
export function gapsPerSecond(id: RacerId) {
  const gaps: number[] = [];
  for (let s = 1; s <= finishTime(id); s++) gaps.push(positionAt(id, s) - positionAt(id, s - 1));
  return gaps;
}
