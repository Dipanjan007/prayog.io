/**
 * 2D ray optics shared by every Light chapter.
 *
 * Units are centimetres. The principal axis is y = 0 and light travels left
 * to right (+x), so NCERT's New Cartesian sign convention applies directly:
 * distances to the left of a lens or mirror are negative, to the right
 * positive, heights above the axis positive.
 *
 * Two kinds of element:
 * - Media: polygons with a refractive index (glass blocks, prisms, water).
 *   Rays obey Snell's law exactly at their edges, with total internal
 *   reflection when sin r would exceed 1.
 * - Thin lenses and spherical mirrors: vertical elements at x with focal
 *   length f. They bend rays paraxially (the ideal lens of the textbook), so
 *   images land exactly where the lens and mirror formulas say.
 */

export interface Vec {
  x: number;
  y: number;
}

export interface Medium {
  /** Corners in order (either winding). */
  points: Vec[];
  n: number;
}

export interface ThinElement {
  kind: "lens" | "mirror";
  x: number;
  /** Half the element's height: rays passing further from the axis miss it. */
  halfHeight: number;
  /** NCERT sign convention: convex lens and convex mirror positive, concave negative. */
  f: number;
}

export interface PlaneMirror {
  a: Vec;
  b: Vec;
}

export interface Scene {
  media?: Medium[];
  elements?: ThinElement[];
  planeMirrors?: PlaneMirror[];
  /** Refractive index outside every medium (1 for air). */
  ambient?: number;
}

export interface RayPath {
  points: Vec[];
  /** Direction after the last point, when the ray left the scene. */
  dir: Vec;
}

const EPS = 1e-7;

export const deg = (rad: number) => (rad * 180) / Math.PI;
export const rad = (degrees: number) => (degrees * Math.PI) / 180;

const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
const scale = (a: Vec, k: number): Vec => ({ x: a.x * k, y: a.y * k });
const dot = (a: Vec, b: Vec) => a.x * b.x + a.y * b.y;
const cross = (a: Vec, b: Vec) => a.x * b.y - a.y * b.x;
export const norm = (a: Vec): Vec => {
  const l = Math.hypot(a.x, a.y);
  return { x: a.x / l, y: a.y / l };
};

/** Angle of refraction (degrees) from Snell's law, or null for total internal reflection. */
export function snell(iDeg: number, n1: number, n2: number): number | null {
  const s = (n1 / n2) * Math.sin(rad(iDeg));
  return Math.abs(s) > 1 ? null : deg(Math.asin(s));
}

/** Reflect direction d off a surface with unit normal nrm. */
export function reflect(d: Vec, nrm: Vec): Vec {
  return sub(d, scale(nrm, 2 * dot(d, nrm)));
}

/**
 * Refract unit direction d through a surface with unit normal nrm (either
 * side), going from index n1 into n2. Returns null for total internal reflection.
 */
export function refract(d: Vec, nrm: Vec, n1: number, n2: number): Vec | null {
  let nn = nrm;
  let cosi = -dot(d, nn);
  if (cosi < 0) {
    nn = scale(nn, -1);
    cosi = -cosi;
  }
  const eta = n1 / n2;
  const k = 1 - eta * eta * (1 - cosi * cosi);
  if (k < 0) return null;
  return norm(add(scale(d, eta), scale(nn, eta * cosi - Math.sqrt(k))));
}

/** Where a ray meets segment ab: distance along the ray and the hit point, or null. */
function hitSegment(o: Vec, d: Vec, a: Vec, b: Vec): { t: number; p: Vec } | null {
  const e = sub(b, a);
  const den = cross(d, e);
  if (Math.abs(den) < EPS) return null;
  const ao = sub(a, o);
  const t = cross(ao, e) / den;
  const u = cross(ao, d) / den;
  if (t <= EPS || u < -EPS || u > 1 + EPS) return null;
  return { t, p: add(o, scale(d, t)) };
}

/** True if p is inside the polygon (even-odd rule). */
export function inside(p: Vec, poly: Vec[]): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}

function indexAt(p: Vec, scene: Scene) {
  for (const m of scene.media ?? []) if (inside(p, m.points)) return m.n;
  return scene.ambient ?? 1;
}

/**
 * Trace one ray through the scene until it leaves `bounds` (a half-width in
 * cm around the origin) or has made `maxEvents` turns.
 */
export function trace(origin: Vec, direction: Vec, scene: Scene, bounds = 200, maxEvents = 24): RayPath {
  let o = origin;
  let d = norm(direction);
  const points: Vec[] = [o];

  for (let event = 0; event < maxEvents; event++) {
    type Hit = { t: number; p: Vec; apply: () => Vec | null };
    let best: Hit | null = null;
    const consider = (h: Hit | null) => {
      if (h && (!best || h.t < best.t)) best = h;
    };

    for (const m of scene.media ?? []) {
      const pts = m.points;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const h = hitSegment(o, d, a, b);
        if (!h) continue;
        const e = norm(sub(b, a));
        const nrm = { x: -e.y, y: e.x };
        const dd = d;
        consider({
          ...h,
          apply: () => {
            // Which side are we going to? Step a hair either side of the edge.
            const n1 = indexAt(sub(h.p, scale(dd, 1e-4)), scene);
            const n2 = indexAt(add(h.p, scale(dd, 1e-4)), scene);
            return refract(dd, nrm, n1, n2) ?? reflect(dd, nrm);
          },
        });
      }
    }

    for (const pm of scene.planeMirrors ?? []) {
      const h = hitSegment(o, d, pm.a, pm.b);
      if (!h) continue;
      const e = norm(sub(pm.b, pm.a));
      const dd = d;
      consider({ ...h, apply: () => reflect(dd, { x: -e.y, y: e.x }) });
    }

    for (const el of scene.elements ?? []) {
      if (Math.abs(d.x) < EPS) continue;
      const t = (el.x - o.x) / d.x;
      if (t <= EPS) continue;
      const p = add(o, scale(d, t));
      if (Math.abs(p.y) > el.halfHeight) continue;
      const dd = d;
      consider({
        t,
        p,
        apply: () => {
          // Paraxial thin element: slope per unit distance travelled along x.
          const sign = Math.sign(dd.x);
          const slope = dd.y / Math.abs(dd.x);
          if (el.kind === "lens") return norm({ x: sign, y: slope - p.y / el.f });
          // Mirror facing incoming light: reverse direction, then bend.
          return norm({ x: -sign, y: slope + p.y / el.f });
        },
      });
    }

    const hit = best as Hit | null;
    if (!hit) break;
    points.push(hit.p);
    const next = hit.apply();
    if (!next) break;
    o = hit.p;
    d = next;
  }

  // Run on to the edge of the view.
  const last = points[points.length - 1];
  const tx = d.x > EPS ? (bounds - last.x) / d.x : d.x < -EPS ? (-bounds - last.x) / d.x : Infinity;
  const ty = d.y > EPS ? (bounds - last.y) / d.y : d.y < -EPS ? (-bounds - last.y) / d.y : Infinity;
  const t = Math.min(tx, ty);
  if (Number.isFinite(t) && t > 0) points.push(add(last, scale(d, t)));
  return { points, dir: d };
}

export interface ImageInfo {
  /** Image distance (cm), signed. Infinity when the object is at the focus. */
  v: number;
  /** Magnification, signed: negative means inverted. */
  m: number;
  real: boolean;
  erect: boolean;
  /** Plain-words description, e.g. "Real, inverted, diminished". */
  nature: string;
}

function describe(v: number, m: number, real: boolean): ImageInfo {
  if (!Number.isFinite(v)) return { v, m: Infinity, real: true, erect: false, nature: "At infinity (highly enlarged)" };
  const size = Math.abs(Math.abs(m) - 1) < 0.02 ? "same size" : Math.abs(m) > 1 ? "enlarged" : "diminished";
  const erect = m > 0;
  return { v, m, real, erect, nature: `${real ? "Real" : "Virtual"}, ${erect ? "erect" : "inverted"}, ${size}` };
}

/** Lens formula 1/v − 1/u = 1/f and m = v/u (u negative for a real object). */
export function lensImage(u: number, f: number): ImageInfo {
  const inv = 1 / f + 1 / u;
  const v = Math.abs(inv) < 1e-9 ? Infinity : 1 / inv;
  return describe(v, v / u, v > 0);
}

/** Mirror formula 1/v + 1/u = 1/f and m = −v/u. */
export function mirrorImage(u: number, f: number): ImageInfo {
  const inv = 1 / f - 1 / u;
  const v = Math.abs(inv) < 1e-9 ? Infinity : 1 / inv;
  return describe(v, -v / u, v < 0);
}

/** Power of a lens in dioptres, with f in centimetres. */
export const power = (fCm: number) => 100 / fCm;

/** An axis-aligned rectangle as a medium. */
export function block(x: number, y: number, w: number, h: number, n: number): Medium {
  return {
    n,
    points: [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x, y: y + h },
    ],
  };
}

/** Refractive indices from the NCERT table (Class 10, Light). */
export const MATERIALS = {
  water: { label: "Water", n: 1.33 },
  glass: { label: "Crown glass", n: 1.52 },
  diamond: { label: "Diamond", n: 2.42 },
} as const;

export type MaterialId = keyof typeof MATERIALS;
