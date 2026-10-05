/**
 * Olympiad track: projectile and relative-velocity physics.
 * Pure functions, shared by the OlyProjectile sim and the problem answers, so the two always agree.
 * No air drag anywhere (a teacher may point out that a real cricket ball feels a lot of drag).
 */

export const G = 9.8; // m/s²
const RAD = Math.PI / 180;

export interface Outcome {
  ok: boolean;
  text: string;
}

/** Position of a projectile launched from (0, h0) with speed v at angleDeg above the horizontal. */
export function projectileAt(v: number, angleDeg: number, h0: number, t: number) {
  const c = Math.cos(angleDeg * RAD);
  const s = Math.sin(angleDeg * RAD);
  return { x: v * c * t, y: h0 + v * s * t - 0.5 * G * t * t, vx: v * c, vy: v * s - G * t };
}

/** Height of the path when it is a horizontal distance x from the launch point. */
export function heightAtX(v: number, angleDeg: number, h0: number, x: number) {
  const c = Math.cos(angleDeg * RAD);
  return h0 + x * Math.tan(angleDeg * RAD) - (G * x * x) / (2 * v * v * c * c);
}

/** Time to come down to height y (the later root), or NaN if the path never gets there. */
export function timeToHeight(v: number, angleDeg: number, h0: number, y: number) {
  const vy = v * Math.sin(angleDeg * RAD);
  const disc = vy * vy + 2 * G * (h0 - y);
  if (disc < 0) return NaN;
  return (vy + Math.sqrt(disc)) / G;
}

/**
 * Launch speed for a fixed angle so the path passes exactly through the point (x, y),
 * starting from height h0. From y = h0 + x tanθ − g x² / (2 v² cos²θ).
 */
export function speedThroughPoint(angleDeg: number, h0: number, x: number, y: number) {
  const c = Math.cos(angleDeg * RAD);
  const rise = h0 - y + x * Math.tan(angleDeg * RAD);
  if (rise <= 0) return NaN;
  return Math.sqrt((G * x * x) / (2 * c * c * rise));
}

/**
 * Launch speed (from the same height as the target) so the ball lands on a target that starts
 * x0 ahead and moves away at speed u. Range v² sin2θ / g must equal x0 + u T with T = 2 v sinθ / g,
 * which gives sin2θ v² − 2u sinθ v − g x0 = 0.
 */
export function speedForMovingTarget(angleDeg: number, x0: number, u: number) {
  const s = Math.sin(angleDeg * RAD);
  const a = Math.sin(2 * angleDeg * RAD);
  const b = -2 * u * s;
  const c = -G * x0;
  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
}

export interface ArcScene {
  kind: "arc";
  v: number;
  angleDeg: number;
  h0: number;
  /** A wall the ball must clear, or a fielder who catches anything below `h`. */
  barrier?: { x: number; h: number; type: "wall" | "fielder" };
  /** For a fielder: how far above the hands still counts as "just" clearing. */
  justMargin?: number;
  /** A basket moving away at u, starting x0 from the launch point, w wide, at launch height. */
  target?: { x0: number; u: number; w: number };
  /** Ground level for the fall (0 unless a target sets the landing height). */
}

export interface ArcPlan {
  duration: number;
  at: (t: number) => { x: number; y: number; targetX: number | null };
  outcome: Outcome;
  /** Where the ball ends: landed, hit the wall or was caught. */
  end: { x: number; y: number; how: "landed" | "wall" | "caught" };
}

export function planArc(s: ArcScene): ArcPlan {
  const landY = s.target ? s.h0 : 0;
  let T = timeToHeight(s.v, s.angleDeg, s.h0, landY);
  if (!Number.isFinite(T)) T = 0;
  let how: ArcPlan["end"]["how"] = "landed";
  let margin = Infinity;
  if (s.barrier) {
    const vx = s.v * Math.cos(s.angleDeg * RAD);
    const tb = s.barrier.x / vx;
    const yb = heightAtX(s.v, s.angleDeg, s.h0, s.barrier.x);
    margin = yb - s.barrier.h;
    if (tb < T && margin < -1e-6) {
      T = tb;
      how = s.barrier.type === "wall" ? "wall" : "caught";
    }
  }
  const end = projectileAt(s.v, s.angleDeg, s.h0, T);
  const targetX = (t: number) => (s.target ? s.target.x0 + s.target.u * t : null);
  const at = (t: number) => {
    const tt = Math.min(Math.max(t, 0), T);
    const p = projectileAt(s.v, s.angleDeg, s.h0, tt);
    return { x: p.x, y: p.y, targetX: targetX(t) };
  };

  const short = s.barrier !== undefined && how === "landed" && end.x < s.barrier.x;
  let outcome: Outcome;
  if (short) outcome = { ok: false, text: `The ball comes down ${(s.barrier!.x - end.x).toFixed(1)} m before it even reaches the ${s.barrier!.type}.` };
  else if (how === "wall") outcome = { ok: false, text: `The ball hits the wall ${(-margin).toFixed(2)} m below its top.` };
  else if (how === "caught") outcome = { ok: false, text: `Caught! The ball passes ${(-margin).toFixed(2)} m below the fielder's reach.` };
  else if (s.target) {
    const dx = end.x - (s.target.x0 + s.target.u * T);
    if (Math.abs(dx) <= s.target.w / 2) outcome = { ok: true, text: `Splash! It lands in the basket after ${T.toFixed(2)} s.` };
    else outcome = { ok: false, text: `It lands ${Math.abs(dx).toFixed(1)} m ${dx < 0 ? "behind" : "ahead of"} the basket.` };
  } else if (s.barrier && s.barrier.type === "fielder") {
    if (margin <= (s.justMargin ?? 0.2)) outcome = { ok: true, text: "Just over the fingertips. That is the minimum speed." };
    else outcome = { ok: false, text: `Clears the fielder by ${margin.toFixed(1)} m. That is more than the minimum speed.` };
  } else outcome = { ok: true, text: `Lands ${end.x.toFixed(1)} m away.` };

  return { duration: T, at, outcome, end: { x: end.x, y: end.y, how } };
}

/* ---------- River crossing (relative velocity) ---------- */

/**
 * Heading for a boat (speed u relative to water) so it lands `drift` metres downstream on the far bank
 * of a river of width W with current c. Angle is measured from "straight across", positive upstream.
 * Across: u cosφ, downstream: c − u sinφ, and (c − u sinφ)/(u cosφ) = drift/W.
 */
export function headingForLanding(u: number, c: number, W: number, drift: number) {
  const k = drift / W;
  // c = u sinφ + k u cosφ = R sin(φ + δ)
  const R = u * Math.hypot(1, k);
  const delta = Math.atan2(k * u, u);
  return (Math.asin(c / R) - delta) / RAD;
}

export function riverAt(u: number, c: number, headingDeg: number, t: number) {
  return { across: u * Math.cos(headingDeg * RAD) * t, down: (c - u * Math.sin(headingDeg * RAD)) * t };
}

export interface RiverScene {
  kind: "river";
  W: number;
  u: number;
  c: number;
  headingDeg: number;
  /** Ghat position downstream of the point directly opposite the start, and its half-width. */
  ghat: number;
  half: number;
}

export function planRiver(s: RiverScene) {
  const across = s.u * Math.cos(s.headingDeg * RAD);
  const T = across > 0 ? s.W / across : 0;
  const end = riverAt(s.u, s.c, s.headingDeg, T);
  const miss = end.down - s.ghat;
  const outcome: Outcome =
    across <= 0
      ? { ok: false, text: "Pointed that way, the ferry never gets across." }
      : Math.abs(miss) <= s.half
        ? { ok: true, text: `Docked at the ghat after ${(T / 60).toFixed(1)} minutes.` }
        : { ok: false, text: `The ferry reaches the bank ${Math.abs(miss).toFixed(0)} m ${miss > 0 ? "downstream" : "upstream"} of the ghat.` };
  return {
    duration: T,
    at: (t: number) => riverAt(s.u, s.c, s.headingDeg, Math.min(Math.max(t, 0), T)),
    outcome,
    end,
  };
}
