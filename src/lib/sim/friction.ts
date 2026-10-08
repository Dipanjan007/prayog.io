/**
 * Friction and tension physics for the Class 9 "How Forces Affect Motion" friction lab.
 * A block pulled along a table with a spring balance (static peak, steady sliding friction,
 * rolling on rollers), and connected objects joined by a light string: a block pulled by a
 * hanging mass over a pulley, and two blocks towed along the table.
 * Pure functions, so they can be unit tested.
 */

export const G = 9.8; // m/s²

export type SurfaceId = "glass" | "wood" | "sandpaper";

export interface Surface {
  id: SurfaceId;
  label: string;
  /** Static and kinetic (sliding) friction coefficients for a wooden block on this surface. */
  muS: number;
  muK: number;
  /** Rolling friction coefficient for the same block resting on round pencils (rollers). */
  muR: number;
}

/** Typical coefficients for a wooden block. Real values vary with how clean and dry the surfaces are. */
export const SURFACES: Record<SurfaceId, Surface> = {
  glass: { id: "glass", label: "Glass", muS: 0.22, muK: 0.16, muR: 0.005 },
  wood: { id: "wood", label: "Wood", muS: 0.4, muK: 0.3, muR: 0.01 },
  sandpaper: { id: "sandpaper", label: "Sandpaper", muS: 0.8, muK: 0.65, muR: 0.03 },
};
export const SURFACE_IDS: SurfaceId[] = ["glass", "wood", "sandpaper"];

/** The wooden block, and the slotted masses that can be stacked on it. */
export const BLOCK_MASS = 0.5; // kg
export const LOADS = [0, 0.5, 1, 1.5]; // kg

/** Weight of a mass, and the normal force from a level table on it (they are equal). */
export function weight(m: number) {
  return m * G;
}
export const normalForce = weight;

/** Friction = μ × N. */
export function friction(mu: number, N: number) {
  return mu * N;
}

/** Largest static friction, and the sliding (or rolling) friction, for a block of mass m. */
export function frictionLimits(surface: Surface, m: number, rolling: boolean) {
  const N = normalForce(m);
  if (rolling) {
    // Rollers have almost no "sticking": starting and keeping going take about the same force.
    const f = friction(surface.muR, N);
    return { N, fs: f, fk: f };
  }
  return { N, fs: friction(surface.muS, N), fk: friction(surface.muK, N) };
}

/**
 * Static friction on a block at rest: it matches the push up to its limit.
 * Returns the friction force, and whether the push beats it so the block starts to slide.
 */
export function staticFriction(push: number, fsMax: number) {
  return push <= fsMax ? { f: push, slips: false } : { f: fsMax, slips: true };
}

// ---------- Spring balance pull ----------

/** How fast the hand raises the pull on the spring balance while the block is still (N/s). */
export const RATE = 4;
/** The steady speed the student keeps the block sliding at (m/s). */
export const PULL_SPEED = 0.15;
/** How quickly the student brings the block up to speed (s), and how fast the hand's pull can change (s). */
export const TAU_SPEED = 0.4;
export const TAU_HAND = 0.08;
/** The block slides this far (m) before it reaches the end of the table. */
export const PULL_TRACK = 1.3;
/** A reading counts as steady once the force is this close to sliding friction and the speed is steady. */
export const STEADY_F = 0.004;
export const STEADY_V = 0.005;

export type PullPhase = "rest" | "sliding";

export interface PullConfig {
  surface: SurfaceId;
  /** Total mass of block plus loads (kg). */
  mass: number;
  rolling: boolean;
}

export interface PullState {
  cfg: PullConfig;
  t: number;
  /** Spring balance reading: the pull on the string (N). */
  F: number;
  x: number;
  v: number;
  phase: PullPhase;
  pulling: boolean;
  /** Highest reading before the block first slipped this run, and the steady sliding reading. */
  peak: number | null;
  /** Time (s) when the block slipped. */
  peakT: number | null;
  steady: number | null;
  /** Friction on the block right now (N), opposing the pull or the motion. */
  f: number;
  ended: boolean;
}

export function createPull(cfg: PullConfig): PullState {
  return { cfg, t: 0, F: 0, x: 0, v: 0, phase: "rest", pulling: false, peak: null, peakT: null, steady: null, f: 0, ended: false };
}

/** Start pulling. A new pull from rest starts a fresh measurement of the peak and the steady reading. */
export function startPull(s: PullState) {
  if (s.ended) return;
  if (s.phase === "rest") {
    s.peak = null;
    s.peakT = null;
    s.steady = null;
  }
  s.pulling = true;
}

export function stopPull(s: PullState) {
  s.pulling = false;
}

/** Advance the pull by dt seconds (small steps are taken inside for accuracy). */
export function stepPull(s: PullState, dt: number) {
  const { fs, fk } = frictionLimits(SURFACES[s.cfg.surface], s.cfg.mass, s.cfg.rolling);
  const m = s.cfg.mass;
  const n = Math.max(1, Math.ceil(dt / 0.002));
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    s.t += h;
    if (s.phase === "rest") {
      if (s.pulling) {
        const next = s.F + RATE * h;
        if (next >= fs) {
          // The pull has just reached the static limit: the block slips.
          s.F = fs;
          s.peak = fs;
          s.peakT = s.t;
          s.phase = "sliding";
        } else s.F = next;
      } else s.F *= Math.exp(-h / TAU_HAND);
      s.f = s.phase === "rest" ? s.F : fk;
      continue;
    }
    // Sliding: the student adjusts the pull to bring the block to a steady speed, or lets go.
    const target = s.pulling ? fk + (m * (PULL_SPEED - s.v)) / TAU_SPEED : 0;
    s.F += (target - s.F) * (1 - Math.exp(-h / TAU_HAND));
    s.f = fk;
    const a = (s.F - fk) / m;
    s.v += a * h;
    if (s.v <= 0) {
      // Friction has stopped the block.
      s.v = 0;
      s.phase = "rest";
      s.f = Math.min(s.F, fs);
      continue;
    }
    s.x += s.v * h;
    if (s.pulling && s.steady === null && Math.abs(s.F - fk) < STEADY_F && Math.abs(s.v - PULL_SPEED) < STEADY_V) s.steady = s.F;
    if (s.x >= PULL_TRACK) {
      s.x = PULL_TRACK;
      s.v = 0;
      s.F = 0;
      s.f = 0;
      s.phase = "rest";
      s.pulling = false;
      s.ended = true;
      return;
    }
  }
}

// ---------- Connected objects ----------

/** Distance the connected objects travel in a run (m): the hanging mass reaches the floor. */
export const RUN_DIST = 1;

export interface Connected {
  moves: boolean;
  /** Acceleration of the whole system (m/s²). */
  a: number;
  /** String tension (N), or null when the system stays still and the tension cannot be pinned down. */
  T: number | null;
  /** Total friction from the table (N). */
  f: number;
  /** Net force on the whole system (N) and its total mass (kg). */
  net: number;
  total: number;
}

/**
 * A block of mass M on the table, joined by a light string over a smooth pulley to a hanging mass mh.
 * a = (mh g − μk M g) / (M + mh), T = mh (g − a).
 */
export function pulley(M: number, mh: number, surface: Surface): Connected {
  const drive = weight(mh);
  const total = M + mh;
  if (drive <= friction(surface.muS, normalForce(M))) return { moves: false, a: 0, T: drive, f: drive, net: 0, total };
  const f = friction(surface.muK, normalForce(M));
  const net = drive - f;
  const a = net / total;
  return { moves: true, a, T: mh * (G - a), f, net, total };
}

/**
 * Two blocks on the table joined by a string: a pull F on the front block A tows block B behind it,
 * like a tractor towing a trolley. a = (F − μk (mA + mB) g) / (mA + mB), T = mB (a + μk g).
 */
export function tow(F: number, mA: number, mB: number, surface: Surface): Connected {
  const total = mA + mB;
  if (F <= friction(surface.muS, normalForce(total))) return { moves: false, a: 0, T: null, f: F, net: 0, total };
  const f = friction(surface.muK, normalForce(total));
  const net = F - f;
  const a = net / total;
  return { moves: true, a, T: mB * (a + surface.muK * G), f, net, total };
}

/** Time to cover a distance from rest at a steady acceleration: d = ½ a t². */
export function timeToCover(d: number, a: number) {
  return a > 0 ? Math.sqrt((2 * d) / a) : Infinity;
}

/** Slider ranges, shared by the UI and the tests. */
export const SLIDERS = {
  hanging: { min: 0.05, max: 2, step: 0.05 },
  towForce: { min: 1, max: 40, step: 0.5 },
};

// ---------- Challenge ----------

/** Pick the hanging mass that gives the block the target acceleration. One star per round. */
export const ROUNDS: { name: string; surface: SurfaceId; load: number; answer: number }[] = [
  { name: "Tea crate on a wooden shelf", surface: "wood", load: 0.5, answer: 0.6 },
  { name: "Heavy box on a glass counter", surface: "glass", load: 1.5, answer: 0.5 },
  { name: "Brick on a rough sandpaper floor", surface: "sandpaper", load: 1, answer: 1.25 },
];
export const TOLERANCE = 0.1; // m/s²

export function roundTarget(r: (typeof ROUNDS)[number]) {
  return pulley(BLOCK_MASS + r.load, r.answer, SURFACES[r.surface]).a;
}

export function roundPassed(r: (typeof ROUNDS)[number], a: number) {
  return Math.abs(a - roundTarget(r)) <= TOLERANCE;
}
