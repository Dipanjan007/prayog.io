/**
 * Olympiad track: circular motion and energy (banked curves, vertical loops, spring launchers).
 * The cart is a point mass on a smooth track unless a rough patch is named. Pure functions shared
 * by the OlyTrack sim and the problem answers.
 */

export const G = 9.8; // m/s²
const RAD = Math.PI / 180;

export interface Outcome {
  ok: boolean;
  text: string;
}

/* ---------- Banked curve ---------- */

/** Bank angle (degrees) where no friction is needed: tanθ = v² / (r g). */
export function bankAngle(v: number, r: number) {
  return Math.atan((v * v) / (r * G)) / RAD;
}

/**
 * On a frictionless banked road, the acceleration along the slope (positive = sliding down,
 * towards the inside of the bend). It is g sinθ − (v²/r) cosθ, and zero at the right angle.
 */
export function bankSlip(v: number, r: number, thetaDeg: number) {
  const th = thetaDeg * RAD;
  return G * Math.sin(th) - ((v * v) / r) * Math.cos(th);
}

export interface BankScene {
  kind: "bank";
  r: number;
  v: number;
  thetaDeg: number;
  /** Half the lane width (m) and how long we watch (s). */
  lane: number;
  watch: number;
}

export function planBank(s: BankScene) {
  const a = bankSlip(s.v, s.r, s.thetaDeg);
  const drift = 0.5 * a * s.watch * s.watch; // + inward, − outward
  const ok = Math.abs(drift) <= s.lane;
  return {
    duration: s.watch,
    /** Distance slid across the road (m, positive towards the inside) at time t, and the angle round the bend. */
    at: (t: number) => {
      const tt = Math.min(Math.max(t, 0), s.watch);
      return { slide: 0.5 * a * tt * tt, angle: (s.v * tt) / s.r };
    },
    slip: a,
    outcome: ok
      ? { ok, text: "The car holds its lane with no help from friction." }
      : { ok, text: `The car slides ${Math.abs(drift).toFixed(1)} m ${drift > 0 ? "down to the inside" : "up to the outside"} of the bend.` },
  };
}

/* ---------- Vertical loop ---------- */

/** Release height (above the loop's bottom) so the normal force at the top is n × weight. */
export function loopHeightForTopNormal(R: number, n: number) {
  // At the top: m v²/R = mg + n mg, and v² = 2g(h − 2R).
  return 2 * R + (R * (1 + n)) / 2;
}

/** Spring compression that sends a cart over a rough patch and just round a loop of radius R. */
export function springCompressionForLoop(k: number, m: number, mu: number, patch: number, R: number) {
  const energy = m * (mu * G * patch + 2.5 * G * R);
  return Math.sqrt((2 * energy) / k);
}

/** Normal force divided by weight at angle φ round the loop (φ = 0 at the bottom). */
export function loopNormal(vb2: number, R: number, phi: number) {
  const v2 = vb2 - 2 * G * R * (1 - Math.cos(phi));
  return (v2 / R + G * Math.cos(phi)) / G;
}

export type LoopFate = { kind: "clear"; topNormal: number } | { kind: "leave"; phi: number } | { kind: "slideBack"; phi: number } | { kind: "stall" };

/** What happens to a cart that enters the loop with speed² vb2. */
export function loopFate(vb2: number, R: number): LoopFate {
  if (vb2 <= 0) return { kind: "stall" };
  const top = loopNormal(vb2, R, Math.PI);
  if (top >= -1e-9) return { kind: "clear", topNormal: Math.max(0, top) };
  if (vb2 <= 2 * G * R) return { kind: "slideBack", phi: Math.acos(1 - vb2 / (2 * G * R)) };
  return { kind: "leave", phi: Math.acos((2 * G * R - vb2) / (3 * G * R)) };
}

export interface LoopScene {
  kind: "loop";
  R: number;
  m: number;
  start: { type: "height"; h: number } | { type: "spring"; k: number; x: number };
  /** Rough flat patch before the loop: friction coefficient and length (m). */
  mu: number;
  patch: number;
  /** Wanted normal force at the top, as a fraction of weight (0 means "only just"). */
  topTarget: number;
  /** Allowed difference in that fraction. */
  window: number;
}

/** Speed² just after the spring or at the foot of the ramp. */
export function launchSpeed2(s: LoopScene) {
  return s.start.type === "height" ? 2 * G * s.start.h : (s.start.k * s.start.x * s.start.x) / s.m;
}

/** Speed² arriving at the loop's bottom, after the rough patch (negative means it stopped). */
export function bottomSpeed2(s: LoopScene) {
  return launchSpeed2(s) - 2 * s.mu * G * s.patch;
}

/** Geometry used by the sim: x positions along the floor, in metres. */
export function loopLayout(s: LoopScene) {
  const R = s.R;
  const ramp = s.start.type === "height" ? Math.max(1.6 * s.start.h, 3 * R) : 0;
  const launch = s.start.type === "spring" ? 1.2 * R : 0;
  const x0 = 0;
  const patchStart = x0 + ramp + launch + 0.3 * R;
  const loopX = patchStart + s.patch + 0.6 * R;
  return { ramp, launch, patchStart, loopX, exitX: loopX + 3 * R };
}

export interface LoopPoint {
  x: number;
  y: number;
  /** Speed (m/s) and normal-force fraction in the loop, if on it. */
  v: number;
  phi: number | null;
  falling: boolean;
}

/**
 * Builds a sampled path for the animation. Time steps come from the true speed along the track,
 * so the cart speeds up and slows down where it should.
 */
export function planLoop(s: LoopScene) {
  const L = loopLayout(s);
  const v02 = launchSpeed2(s);
  const vb2 = bottomSpeed2(s);
  const pts: { t: number; p: LoopPoint }[] = [];
  let t = 0;
  const dtMin = 1 / 240;
  const push = (p: LoopPoint) => pts.push({ t, p });
  const crawl = 0.15 * Math.sqrt(G * s.R); // keeps the clock moving where the cart is nearly at rest

  // Ramp: straight slope from (0, h) to (ramp, 0). Speed from energy.
  if (s.start.type === "height") {
    const h = s.start.h;
    const len = Math.hypot(L.ramp, h);
    for (let d = 0; d < len; ) {
      const y = h * (1 - d / len);
      const v = Math.sqrt(Math.max(0, 2 * G * (h - y)));
      push({ x: (L.ramp * d) / len, y, v, phi: null, falling: false });
      d += Math.max(v, crawl) * dtMin;
      t += dtMin;
    }
  }
  // Flat run, rough patch included.
  let x = L.ramp + L.launch;
  let stoppedAt: number | null = null;
  while (x < L.loopX) {
    const onPatch = Math.max(0, Math.min(x, L.patchStart + s.patch) - L.patchStart);
    const v2 = v02 - 2 * s.mu * G * onPatch;
    if (v2 <= 0) {
      stoppedAt = x;
      push({ x, y: 0, v: 0, phi: null, falling: false });
      break;
    }
    const v = Math.sqrt(v2);
    push({ x, y: 0, v, phi: null, falling: false });
    x += Math.max(v, crawl) * dtMin;
    t += dtMin;
  }

  const fate: LoopFate = stoppedAt !== null ? { kind: "stall" } : loopFate(vb2, s.R);
  if (stoppedAt === null) {
    const cx = L.loopX;
    const cy = s.R;
    const onLoop = (phi: number) => {
      const v = Math.sqrt(Math.max(0, vb2 - 2 * G * s.R * (1 - Math.cos(phi))));
      return { x: cx + s.R * Math.sin(phi), y: cy - s.R * Math.cos(phi), v };
    };
    const endPhi = fate.kind === "clear" ? 2 * Math.PI : fate.kind === "leave" || fate.kind === "slideBack" ? fate.phi : 0;
    let phi = 0;
    while (phi < endPhi) {
      const q = onLoop(phi);
      push({ ...q, phi, falling: false });
      phi += (Math.max(q.v, crawl) * dtMin) / s.R;
      t += dtMin;
    }
    if (fate.kind === "clear") {
      for (let xx = cx; xx < L.exitX; ) {
        const v = Math.sqrt(vb2);
        push({ x: xx, y: 0, v, phi: null, falling: false });
        xx += v * dtMin;
        t += dtMin;
      }
    } else if (fate.kind === "slideBack") {
      // Back down the same way, then off to the left.
      while (phi > 0) {
        const q = onLoop(phi);
        push({ ...q, phi, falling: false });
        phi -= (Math.max(q.v, crawl) * dtMin) / s.R;
        t += dtMin;
      }
    } else if (fate.kind === "leave") {
      // Leaves the track and flies as a projectile until it hits the loop or the floor.
      const q = onLoop(endPhi);
      const vx = q.v * Math.cos(endPhi);
      const vy = q.v * Math.sin(endPhi);
      for (let k = 1; k < 4000; k++) {
        const tt = k * dtMin;
        const px = q.x + vx * tt;
        const py = q.y + vy * tt - 0.5 * G * tt * tt;
        t += dtMin;
        const r = Math.hypot(px - cx, py - cy);
        push({ x: px, y: Math.max(py, 0), v: Math.hypot(vx, vy - G * tt), phi: null, falling: true });
        if (py <= 0 || (k > 5 && r >= s.R)) break;
      }
    }
  }

  const topNormal = fate.kind === "clear" ? fate.topNormal : null;
  let outcome: Outcome;
  if (fate.kind === "stall") outcome = { ok: false, text: "The cart stops on the rough patch before the loop." };
  else if (fate.kind === "slideBack") outcome = { ok: false, text: "The cart runs out of speed low in the loop and rolls back." };
  else if (fate.kind === "leave")
    outcome = { ok: false, text: `The cart loses contact at ${Math.round(endAngle(fate.phi))}° round the loop and falls.` };
  else {
    const n = topNormal ?? 0;
    const ok = Math.abs(n - s.topTarget) <= s.window;
    outcome = ok
      ? { ok, text: s.topTarget === 0 ? "The cart just makes it over the top. The track barely touches it there." : `Over the top, pressing on the track with ${n.toFixed(2)} × its weight.` }
      : { ok, text: `It clears the loop, but presses on the track at the top with ${n.toFixed(2)} × its weight instead of ${s.topTarget.toFixed(2)} ×.` };
  }

  const duration = pts.length ? pts[pts.length - 1].t : 0;
  const at = (time: number) => {
    if (!pts.length) return { x: 0, y: 0, v: 0, phi: null, falling: false };
    const i = Math.min(pts.length - 1, Math.max(0, Math.round(time / dtMin)));
    return pts[i].p;
  };
  return { duration, at, outcome, fate, layout: L, vb2, path: pts };
}

function endAngle(phi: number) {
  return phi / RAD;
}
