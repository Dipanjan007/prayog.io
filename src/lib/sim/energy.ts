/**
 * Work, energy and lever physics for the Class 9 "Work, Energy, and Simple Machines" lesson.
 * Pure functions, so they can be unit tested.
 *
 * Coaster model: a 100 kg cart (a point mass) on a track y = h(x). Gravity g = 9.8 m/s².
 * With friction on, the friction force is μN with N = mg cos θ. We ignore the extra normal
 * force from the track's curvature (mv²/r), so the heat made is exactly μ m g × (horizontal
 * distance travelled). Air drag is ignored.
 */

export const G = 9.8; // m/s²
export const MASS = 100; // kg, a small cart with a rider
export const MU = 0.05; // friction coefficient when friction is switched on

/** Keypoints along the ground (m): start, valley, hill 1, valley, hill 2 (last hill), valley, station. */
export const KEY_X = [0, 8, 18, 26, 34, 42, 50] as const;
export const HILL_X = [KEY_X[2], KEY_X[4]] as const;
export const TRACK_END = KEY_X[KEY_X.length - 1];
export const HEIGHT = { min: 1, max: 12, step: 0.1 };

export interface Track {
  /** Start height (m). The cart starts here at rest. */
  h0: number;
  /** Height of hill 1 and of the last hill (m). */
  h1: number;
  h2: number;
}

export const keyHeights = (t: Track) => [t.h0, 0, t.h1, 0, t.h2, 0, 0];

function segment(x: number) {
  const cx = Math.min(Math.max(x, 0), TRACK_END);
  let i = 0;
  while (i < KEY_X.length - 2 && cx > KEY_X[i + 1]) i++;
  const dx = KEY_X[i + 1] - KEY_X[i];
  return { i, u: (cx - KEY_X[i]) / dx, dx };
}

/**
 * Track height at horizontal position x (m). The first drop is a parabola h0(1 − u)², so it is
 * steep at the very start and the cart rolls off by itself. Every other piece is a smooth
 * cosine step, flat at each hilltop and valley, so the tops of the hills are the keypoints.
 */
export function trackHeight(t: Track, x: number) {
  const k = keyHeights(t);
  const { i, u } = segment(x);
  if (i === 0) return t.h0 * (1 - u) ** 2;
  return k[i] + ((k[i + 1] - k[i]) * (1 - Math.cos(Math.PI * u))) / 2;
}

/** Slope dh/dx of the track. */
export function trackSlope(t: Track, x: number) {
  const k = keyHeights(t);
  const { i, u, dx } = segment(x);
  if (i === 0) return (-2 * t.h0 * (1 - u)) / dx;
  return ((k[i + 1] - k[i]) * Math.PI * Math.sin(Math.PI * u)) / (2 * dx);
}

/** Kinetic energy per kg (J/kg) the cart has at x on its first forward trip, from the energy budget. */
export function keAt(t: Track, x: number, friction: boolean) {
  const mu = friction ? MU : 0;
  return G * (t.h0 - trackHeight(t, x)) - mu * G * x;
}

/**
 * What the run will do, worked out from energy alone: the cart clears a hill only if it still
 * has kinetic energy left at the top. Returns the speed over the last hill, or null if it
 * rolls back before then.
 */
export function predictRun(t: Track, friction: boolean) {
  const clears = HILL_X.map((x) => keAt(t, x, friction) > 1e-9);
  const cleared = clears[0] && clears[1];
  const lastCrestSpeed = cleared ? Math.sqrt(2 * keAt(t, HILL_X[1], friction)) : null;
  return { clears, cleared, lastCrestSpeed, finishes: cleared && keAt(t, TRACK_END, friction) > 0 };
}

/** Extra start height (m) above the last hill that friction eats before the cart reaches its top. */
export const frictionHeightLoss = (friction: boolean) => (friction ? MU * HILL_X[1] : 0);

export interface Cart {
  /** Horizontal position (m) and speed along the track (m/s, positive = forward). */
  x: number;
  v: number;
  /** Heat made by friction so far (J). */
  heat: number;
  /** Speed over the top of the last hill, once it gets there. */
  crestSpeed: number | null;
  /** The cart turned back before it got over the last hill. */
  turnedBack: boolean;
  /** Reached the station at the end. */
  finished: boolean;
  /** Came to rest and friction holds it there. */
  settled: boolean;
}

export const startCart = (): Cart => ({ x: 0, v: 0, heat: 0, crestSpeed: null, turnedBack: false, finished: false, settled: false });

/** Energies of the cart in joules. */
export function energies(t: Track, c: Cart) {
  const pe = MASS * G * trackHeight(t, c.x);
  const ke = 0.5 * MASS * c.v * c.v;
  return { pe, ke, heat: c.heat, total: pe + ke + c.heat };
}

const SUB = 0.001; // s per physics substep

/**
 * Advance the cart by dt seconds. Newton's second law along the track, in small steps:
 * a = −g sin θ − μ g cos θ (friction against the motion). After each step the speed is set from
 * the energy budget (start PE − heat − PE now), so the total never drifts.
 */
export function advance(t: Track, c: Cart, friction: boolean, dt: number): Cart {
  if (c.finished || c.settled) return c;
  const mu = friction ? MU : 0;
  let { x, v, heat, crestSpeed, turnedBack } = c;
  let settled = false;
  let finished = false;
  const e0 = G * t.h0; // J/kg at the start
  const steps = Math.max(1, Math.round(dt / SUB));
  const h = dt / steps;
  for (let n = 0; n < steps; n++) {
    const p = trackSlope(t, x);
    const cos = 1 / Math.sqrt(1 + p * p);
    const sin = p * cos;
    // At rest: friction holds the cart if the slope is gentle enough.
    if (v === 0 && Math.abs(p) <= mu) {
      settled = true;
      break;
    }
    const dir = v !== 0 ? Math.sign(v) : -Math.sign(sin);
    const a = -G * sin - mu * G * cos * dir;
    const vNew = v + a * h;
    if (v !== 0 && Math.sign(vNew) !== Math.sign(v)) {
      // The cart stops for an instant. On a gentle slope friction holds it still.
      if (v > 0 && crestSpeed === null) turnedBack = true;
      if (mu > 0 && Math.abs(p) <= mu) {
        v = 0;
        settled = true;
        break;
      }
    }
    const dx = vNew * cos * h;
    const xNew = Math.min(Math.max(x + dx, 0), TRACK_END);
    const heatNew = heat + mu * MASS * G * Math.abs(xNew - x);
    const keBudget = e0 - heatNew / MASS - G * trackHeight(t, xNew);
    if (keBudget < 0) {
      // Not enough energy to get there: the cart stops and turns around here.
      if (v > 0 && crestSpeed === null) turnedBack = true;
      v = 0;
      if (mu > 0 && Math.abs(p) <= mu) {
        settled = true;
        break;
      }
      continue;
    }
    // Near a turning point trust Newton's law directly; elsewhere use the exact energy budget.
    const budgetSpeed = Math.sqrt(2 * keBudget);
    const speed = Math.abs(vNew) > 0.3 ? budgetSpeed : Math.min(Math.abs(vNew), budgetSpeed);
    const sign = Math.sign(vNew);
    if (crestSpeed === null && x < HILL_X[1] && xNew >= HILL_X[1] && sign > 0) {
      crestSpeed = Math.sqrt(Math.max(0, 2 * (e0 - heat / MASS - mu * G * (HILL_X[1] - x) - G * t.h2)));
    }
    x = xNew;
    heat = heatNew;
    v = sign * speed;
    if (x >= TRACK_END) {
      // The cart rolls into the station and keeps its kinetic energy.
      finished = true;
      break;
    }
  }
  return { x, v, heat, crestSpeed, turnedBack, finished, settled };
}

/** Run the whole trip (for tests): up to maxT seconds. */
export function simulate(t: Track, friction: boolean, maxT = 60, dt = 1 / 60) {
  let c = startCart();
  let maxH = trackHeight(t, 0);
  let worstDrift = 0;
  const e0 = MASS * G * t.h0;
  for (let time = 0; time < maxT && !c.finished && !c.settled; time += dt) {
    c = advance(t, c, friction, dt);
    maxH = Math.max(maxH, trackHeight(t, c.x));
    worstDrift = Math.max(worstDrift, Math.abs(energies(t, c).total - e0) / e0);
  }
  return { cart: c, maxH, worstDrift };
}

/* ---------------- Levers ---------------- */

export type LeverClass = 1 | 2 | 3;
/** Length of the lever bar (m). */
export const BEAM = 4;
export const LEVER_POS = { min: 0.4, max: 3.6, step: 0.1 };

/**
 * Where the fulcrum, load and effort sit along the bar (m from the left end).
 * Class 1 (see-saw, crowbar): fulcrum in the middle somewhere; you slide the fulcrum.
 * Class 2 (wheelbarrow, nutcracker): load in the middle; you slide the load.
 * Class 3 (tongs, fishing rod, your forearm): effort in the middle; you slide the effort.
 */
export function leverLayout(cls: LeverClass, pos: number) {
  if (cls === 1) return { fulcrum: pos, load: 0, effort: BEAM };
  if (cls === 2) return { fulcrum: 0, load: pos, effort: BEAM };
  return { fulcrum: 0, load: BEAM, effort: pos };
}

/**
 * Principle of moments for a light (weightless) bar: it balances when
 * load × load arm = effort × effort arm. A rigid bar that does not balance swings until it hits
 * the ground, so `winner` says which force wins.
 */
export function leverMoments(cls: LeverClass, pos: number, load: number, effort: number) {
  const L = leverLayout(cls, pos);
  const loadArm = Math.abs(L.load - L.fulcrum);
  const effortArm = Math.abs(L.effort - L.fulcrum);
  const loadMoment = load * loadArm;
  const effortMoment = effort * effortArm;
  const net = effortMoment - loadMoment;
  const balanced = Math.abs(net) <= 0.02 * loadMoment;
  const winner: "balanced" | "load" | "effort" = balanced ? "balanced" : net > 0 ? "effort" : "load";
  return {
    ...L,
    loadArm,
    effortArm,
    loadMoment,
    effortMoment,
    balanced,
    winner,
    /** Mechanical advantage = load ÷ effort (meaningful when balanced). */
    ma: effort > 0 ? load / effort : Infinity,
    /** Effort needed to balance exactly. */
    effortNeeded: effortArm > 0 ? loadMoment / effortArm : Infinity,
  };
}
