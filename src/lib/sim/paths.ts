/**
 * Physics for the "Distance, displacement and going round" lesson: path length
 * versus displacement on a street map, average speed versus average velocity,
 * a ball thrown up and caught, and uniform circular motion (a marble in a ring
 * and a 400 m athletics track). Pure functions, so they can be unit tested.
 *
 * SI units (m, s). Map coordinates: x points east, y points north.
 */

/** Acceleration due to gravity near the Earth's surface (m/s²). */
export const g = 9.8;

/** Length of one lap of a standard athletics track, measured in lane 1 (m). */
export const TRACK_LENGTH = 400;

/** A brisk walking pace, about 5 km/h (m/s). */
export const WALK_SPEED = 1.4;

export interface Pt {
  x: number;
  y: number;
}

// ---------- The street map ----------

/** Streets run every 100 m, east–west and north–south. Home is at (0, 0). */
export const BLOCK = 100;
export const MAP = { xMin: -400, xMax: 800, yMin: -300, yMax: 600 };

export const LANDMARKS = {
  home: { x: 0, y: 0, label: "Home", icon: "🏠" },
  school: { x: 800, y: 600, label: "School", icon: "🏫" },
  park: { x: -400, y: 300, label: "Park", icon: "🌳" },
  metro: { x: 400, y: -300, label: "Metro", icon: "🚇" },
  market: { x: -300, y: -200, label: "Market", icon: "🛒" },
  library: { x: 600, y: 200, label: "Library", icon: "📚" },
} as const;
export type LandmarkId = keyof typeof LANDMARKS;

/** Snap a point to the nearest street crossing inside the map. */
export function snapToCrossing(p: Pt): Pt {
  const s = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(v / BLOCK) * BLOCK));
  return { x: s(p.x, MAP.xMin, MAP.xMax), y: s(p.y, MAP.yMin, MAP.yMax) };
}

/**
 * The corners of a walk along the streets from a to b: east–west first, then
 * north–south. Does not include a itself.
 */
export function streetRoute(a: Pt, b: Pt): Pt[] {
  if (a.x === b.x || a.y === b.y) return [{ ...b }];
  return [{ x: b.x, y: a.y }, { ...b }];
}

/** Shortest length of a walk along a grid of streets: |Δx| + |Δy|. */
export function streetDistance(a: Pt, b: Pt) {
  return Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
}

// ---------- Distance and displacement ----------

export function segmentLength(a: Pt, b: Pt) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Distance: the total length of the path actually travelled. */
export function pathLength(pts: Pt[]) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += segmentLength(pts[i - 1], pts[i]);
  return d;
}

/** Displacement: the straight arrow from the first point to the last. */
export function displacementOf(pts: Pt[]) {
  if (pts.length === 0) return { dx: 0, dy: 0, mag: 0 };
  const a = pts[0];
  const b = pts[pts.length - 1];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return { dx, dy, mag: Math.hypot(dx, dy) };
}

/** The point reached after travelling distance s along the path. */
export function pointAtDistance(pts: Pt[], s: number): Pt {
  if (pts.length === 0) return { x: 0, y: 0 };
  let left = Math.max(0, s);
  for (let i = 1; i < pts.length; i++) {
    const L = segmentLength(pts[i - 1], pts[i]);
    if (left <= L) {
      const f = L === 0 ? 0 : left / L;
      return { x: pts[i - 1].x + f * (pts[i].x - pts[i - 1].x), y: pts[i - 1].y + f * (pts[i].y - pts[i - 1].y) };
    }
    left -= L;
  }
  return { ...pts[pts.length - 1] };
}

/** The path cut off after travelling distance s (so it ends at pointAtDistance). */
export function pathUpTo(pts: Pt[], s: number): Pt[] {
  if (pts.length === 0) return [];
  const out: Pt[] = [pts[0]];
  let left = Math.max(0, s);
  for (let i = 1; i < pts.length; i++) {
    const L = segmentLength(pts[i - 1], pts[i]);
    if (left < L) {
      out.push(pointAtDistance([pts[i - 1], pts[i]], left));
      return out;
    }
    out.push(pts[i]);
    left -= L;
  }
  return out;
}

/**
 * Direction of a vector in words, like a map: "due north", or "37° north of east"
 * (the angle is measured from the east–west line towards north or south).
 */
export function directionText(dx: number, dy: number) {
  const eps = 1e-9;
  if (Math.abs(dx) < eps && Math.abs(dy) < eps) return "no direction";
  if (Math.abs(dx) < eps) return dy > 0 ? "due north" : "due south";
  if (Math.abs(dy) < eps) return dx > 0 ? "due east" : "due west";
  const angle = Math.round((Math.atan2(Math.abs(dy), Math.abs(dx)) * 180) / Math.PI);
  if (angle === 45) return dx > 0 ? (dy > 0 ? "north-east" : "south-east") : dy > 0 ? "north-west" : "south-west";
  return `${angle}° ${dy > 0 ? "north" : "south"} of ${dx > 0 ? "east" : "west"}`;
}

// ---------- Average speed and average velocity ----------

/** Average speed = total distance ÷ total time. */
export function averageSpeed(distance: number, time: number) {
  return time > 0 ? distance / time : 0;
}

/** Size of the average velocity = size of the displacement ÷ total time. */
export function averageVelocity(displacement: number, time: number) {
  return time > 0 ? displacement / time : 0;
}

/** Is a numeric answer within an absolute tolerance of the true value? */
export function answerOk(guess: number, truth: number, tolerance: number) {
  return Number.isFinite(guess) && Math.abs(guess - truth) <= tolerance;
}

// ---------- A ball thrown straight up ----------

/** Highest point reached: v² = u² − 2gh with v = 0 gives h = u² ÷ 2g. */
export function maxHeight(u: number, gg = g) {
  return (u * u) / (2 * gg);
}

/** Time to go up and come back to the hand: 2u ÷ g. */
export function flightTime(u: number, gg = g) {
  return (2 * u) / gg;
}

/** Height above the hand at time t (the displacement, taking up as positive): s = ut − ½gt². */
export function heightAt(u: number, t: number, gg = g) {
  const T = flightTime(u, gg);
  const tt = Math.min(Math.max(t, 0), T);
  return Math.max(0, u * tt - 0.5 * gg * tt * tt);
}

/** Distance travelled by time t: up to the top, then the way back down is added. */
export function throwDistanceAt(u: number, t: number, gg = g) {
  const tTop = u / gg;
  const H = maxHeight(u, gg);
  const h = heightAt(u, t, gg);
  return t <= tTop ? h : 2 * H - h;
}

// ---------- Uniform circular motion ----------

/** Speed in a circle of radius r, going round once in time T: v = 2πr ÷ T. */
export function circleSpeed(r: number, T: number) {
  return (2 * Math.PI * r) / T;
}

/** Radius of a circle whose circumference is L. */
export function radiusForCircumference(L: number) {
  return L / (2 * Math.PI);
}

/** Position on a circle centred at the origin, angle θ anticlockwise from east. */
export function circlePoint(r: number, theta: number): Pt {
  return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
}

/** Unit vector along the velocity when going anticlockwise: along the tangent, at right angles to the radius. */
export function tangentDir(theta: number): Pt {
  return { x: -Math.sin(theta), y: Math.cos(theta) };
}

/** Distance along the circle after turning through θ (radians). */
export function arcDistance(r: number, theta: number) {
  return r * Math.abs(theta);
}

/** Straight-line displacement from the start after turning through θ: the chord 2r sin(θ/2). */
export function chordDisplacement(r: number, theta: number) {
  return 2 * r * Math.abs(Math.sin(theta / 2));
}

/**
 * Where a marble goes after the ring is lifted at angle θ: nothing pulls it round
 * any more, so it moves in a straight line along the tangent at the same speed.
 */
export function releasedPosition(r: number, theta: number, v: number, t: number): Pt {
  const p = circlePoint(r, theta);
  const d = tangentDir(theta);
  return { x: p.x + d.x * v * t, y: p.y + d.y * v * t };
}

/** Does the path pass through point p (at a corner or part-way along a straight piece)? */
export function pathVisits(pts: Pt[], p: Pt, eps = 1e-6) {
  if (pts.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < eps)) return true;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const L = segmentLength(a, b);
    if (L === 0) continue;
    const cross = ((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)) / L;
    const along = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / L;
    if (Math.abs(cross) < eps && along >= -eps && along <= L + eps) return true;
  }
  return false;
}
