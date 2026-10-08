/**
 * Olympiad track: optics. Thin lenses on an optical bench (NCERT sign convention, light travels
 * left to right, distances measured from the lens) and a laser beam refracted into water.
 * Pure functions shared by the OlyOptics sim and the problem answers.
 */

const RAD = Math.PI / 180;

export interface Outcome {
  ok: boolean;
  text: string;
}

/* ---------- Thin lenses ---------- */

/**
 * Image distance from the lens formula 1/v − 1/u = 1/f (NCERT convention: u is negative for a real
 * object on the left, f is positive for a convex lens). Returns Infinity when the image is at infinity.
 */
export function lensImage(u: number, f: number) {
  const inv = 1 / f + 1 / u;
  return Math.abs(inv) < 1e-12 ? Infinity : 1 / inv;
}

export interface BenchLens {
  /** Position on the bench (cm) and focal length (cm, + for convex). */
  x: number;
  f: number;
}

export interface BenchImage {
  /** Final image position on the bench (cm) and height (cm, negative = inverted). */
  x: number;
  h: number;
  /** Distance of the final image from the last lens (cm); positive means a real image on the far side. */
  v: number;
  /** Total magnification. */
  m: number;
  real: boolean;
}

/** Follows the image through each lens in turn: the image of one lens is the object for the next. */
export function benchImage(obj: { x: number; h: number }, lenses: BenchLens[]): BenchImage {
  let x = obj.x;
  let h = obj.h;
  let v = 0;
  let m = 1;
  for (const L of lenses) {
    const u = x - L.x;
    v = lensImage(u, L.f);
    if (!Number.isFinite(v)) return { x: Infinity, h: Infinity, v: Infinity, m: Infinity, real: false };
    const mi = v / u;
    m *= mi;
    h *= mi;
    x = L.x + v;
  }
  return { x, h, v, m, real: v > 0 };
}

/**
 * Paraxial ray from the object's tip aimed at height `yAt` on the first lens, traced through the
 * lenses and stopped at `xEnd`. Returns the corners of the ray as [x, y] points (cm).
 */
export function traceRay(obj: { x: number; h: number }, lenses: BenchLens[], yAt: number, xEnd: number): [number, number][] {
  const pts: [number, number][] = [[obj.x, obj.h]];
  let x = obj.x;
  let y = obj.h;
  let slope = (yAt - obj.h) / (lenses[0].x - obj.x);
  for (const L of lenses) {
    if (L.x > xEnd) break;
    y += slope * (L.x - x);
    x = L.x;
    pts.push([x, y]);
    slope -= y / L.f; // thin lens: θ' = θ − y/f
  }
  if (xEnd > x) pts.push([xEnd, y + slope * (xEnd - x)]);
  return pts;
}

export interface BenchScene {
  kind: "optics-bench";
  /** Object (a candle flame, a hallmark) at bench position x (cm), height h (cm). */
  object: { x: number; h: number; name: string };
  lenses: BenchLens[];
  /** Where the student put the screen (cm on the bench). */
  screen: number;
  /** Bench length (cm) drawn with a ruler. */
  bench: number;
  /** Half the lens opening (cm), for the fan of rays. */
  aperture: number;
  /** Allowed focus error as a fraction of the last lens to image distance. */
  tol: number;
  /** What the student chose, for labels: the screen's mark, or its distance behind the last lens. */
  ask: "mark" | "behind-last";
}

export interface LaserScene {
  kind: "optics-laser";
  /** Laser height above the water (m) and its tilt from the vertical (degrees). */
  H: number;
  tiltDeg: number;
  /** True depth of the water (m), its refractive index and how deep the ring looks from above (m). */
  depth: number;
  n: number;
  apparent: number;
  /** Horizontal distance from the laser to the ring (m), chosen by the student. */
  D: number;
  /** How close (m) the spot must land to the ring. */
  hit: number;
}

export type OpticsScene = BenchScene | LaserScene;

/** True for every scene this sim draws. */
export function isOpticsScene(s: { kind: string }): s is OpticsScene {
  return s.kind.startsWith("optics-");
}

const fmtCm = (x: number) => `${Math.abs(x) < 10 ? x.toFixed(1) : Math.round(x)} cm`;

export function planBench(s: BenchScene) {
  const img = benchImage(s.object, s.lenses);
  const last = s.lenses[s.lenses.length - 1];
  let outcome: Outcome;
  if (s.screen <= last.x) outcome = { ok: false, text: "The screen is not behind the last lens, so the light never reaches it." };
  else if (!img.real || !Number.isFinite(img.x))
    outcome = { ok: false, text: "The lenses make a virtual image, so no screen can catch it. You see only a patch of light." };
  else {
    const off = s.screen - img.x;
    const ok = Math.abs(off) <= s.tol * img.v;
    const size = `${img.h < 0 ? "inverted" : "upright"}, ${Math.abs(img.m).toFixed(1)} × as tall`;
    outcome = ok
      ? { ok, text: `The image lands on the screen: sharp! It is ${size}.` }
      : { ok, text: `Blurred. The sharp image forms ${fmtCm(Math.abs(off))} ${off > 0 ? "before the screen, nearer the lens" : "beyond the screen"}.` };
  }
  return { duration: 2.6, outcome, image: img };
}

/** Real depth from the apparent depth seen looking straight down: real = n × apparent. */
export function realDepth(apparent: number, n: number) {
  return apparent * n;
}

/** Snell's law from air into a medium: angle of refraction (degrees), sin r = sin i / n. */
export function refractAngle(iDeg: number, n: number) {
  return Math.asin(Math.sin(iDeg * RAD) / n) / RAD;
}

/** Horizontal distance a tilted laser beam travels from the laser to the floor of the water. */
export function laserReach(H: number, tiltDeg: number, depth: number, n: number) {
  const r = refractAngle(tiltDeg, n) * RAD;
  return H * Math.tan(tiltDeg * RAD) + depth * Math.tan(r);
}

export function planLaser(s: LaserScene) {
  const air = s.H * Math.tan(s.tiltDeg * RAD);
  const water = s.depth * Math.tan(refractAngle(s.tiltDeg, s.n) * RAD);
  // Laser at x = −D, ring at x = 0.
  const surfaceX = -s.D + air;
  const floorX = surfaceX + water;
  const ok = Math.abs(floorX) <= s.hit;
  const cm = Math.round(Math.abs(floorX) * 100);
  const outcome: Outcome = ok
    ? { ok, text: "The spot lands right on the ring. The diver knows exactly where to go!" }
    : { ok, text: `The spot lands ${cm} cm ${floorX < 0 ? "short of" : "beyond"} the ring.` };
  return { duration: 2.6, outcome, surfaceX, floorX };
}

export function planOptics(s: OpticsScene): { outcome: Outcome; duration: number } {
  return s.kind === "optics-bench" ? planBench(s) : planLaser(s);
}
