/**
 * Shadows, pinhole camera and plane mirror physics for the Class 7
 * "Light: Shadows and Reflections" lesson. Pure functions, so they can be
 * unit tested. Units are centimetres unless a name says otherwise.
 *
 * Light travels in straight lines, so every result here is plain geometry:
 * similar triangles for shadows and the pinhole camera, and the law of
 * reflection (angle of incidence = angle of reflection) for mirrors, which
 * comes from the shared ray engine in ./optics.
 */
import { deg, norm, rad, trace, type PlaneMirror, type Vec } from "./optics";

/* ------------------------------------------------------------------ */
/* Shadow stage: lamp, object and screen on one straight line.          */
/* ------------------------------------------------------------------ */

/** The screen (a white wall) stands this far from the left end of the bench. */
export const SCREEN_X = 110;
export const LAMP_RANGE = { min: 5, max: 85 };
/** The object always stays at least this far from the lamp and from the screen. */
export const MIN_GAP = 10;

export type LampId = "small" | "wide";
/** Radius of the glowing part of the lamp. The small bulb is almost a point. */
export const LAMPS: Record<LampId, { label: string; radius: number }> = {
  small: { label: "Small bulb", radius: 0.3 },
  wide: { label: "Wide lamp", radius: 5 },
};

export type MaterialId = "glass" | "butter" | "cardboard";
/**
 * Fraction of light that gets through a sheet of each material. The numbers
 * are typical, rounded values for a Class 7 demonstration, not measurements.
 */
export const OBJECT_MATERIALS: Record<MaterialId, { label: string; kind: string; transmit: number }> = {
  glass: { label: "Glass", kind: "Transparent", transmit: 0.92 },
  butter: { label: "Butter paper", kind: "Translucent", transmit: 0.4 },
  cardboard: { label: "Cardboard", kind: "Opaque", transmit: 0 },
};

export type ShapeId = "card" | "ball" | "bird";

function circle(r: number, n = 28): Vec[] {
  return Array.from({ length: n }, (_, i) => ({ x: r * Math.cos((2 * Math.PI * i) / n), y: r * Math.sin((2 * Math.PI * i) / n) }));
}

/** Front views of the objects, centred on the line from lamp to screen. */
export const SHAPES: Record<ShapeId, { label: string; points: Vec[] }> = {
  card: {
    label: "Square card",
    points: [
      { x: -4, y: -4 },
      { x: 4, y: -4 },
      { x: 4, y: 4 },
      { x: -4, y: 4 },
    ],
  },
  ball: { label: "Ball", points: circle(4) },
  // A hand shadow puppet: a flying bird made with two hands (thumbs as the head).
  bird: {
    label: "Hand bird",
    points: [
      { x: -0.6, y: -3.6 },
      { x: 0.6, y: -3.6 },
      { x: 0.8, y: -1.2 },
      { x: 1.8, y: -0.4 },
      { x: 3.0, y: 0.6 },
      { x: 4.2, y: 2.6 },
      { x: 4.8, y: 4 },
      { x: 3.2, y: 3.2 },
      { x: 2.2, y: 2.0 },
      { x: 1.0, y: 1.2 },
      { x: 0.7, y: 2.0 },
      { x: 0.3, y: 2.4 },
      { x: 0.8, y: 2.9 },
      { x: 0.0, y: 3.0 },
      { x: -0.7, y: 2.2 },
      { x: -1.0, y: 1.2 },
      { x: -2.2, y: 2.0 },
      { x: -3.2, y: 3.2 },
      { x: -4.8, y: 4 },
      { x: -4.2, y: 2.6 },
      { x: -3.0, y: 0.6 },
      { x: -1.8, y: -0.4 },
      { x: -0.8, y: -1.2 },
    ],
  },
};

/** Half the height of a shape (it is centred, so its top edge). */
export const halfHeight = (shape: ShapeId) => Math.max(...SHAPES[shape].points.map((p) => Math.abs(p.y)));

/**
 * Shadow on the screen for a lamp of radius a at lampX and an object of half
 * height h at objX, from similar triangles.
 * - k: how many times taller the shadow is than the object (from the lamp's centre).
 * - umbra: half height of the dark, full shadow. Negative means there is no umbra.
 * - outer: half height of the outer edge of the penumbra (the part-shadow).
 * With a point lamp (a = 0) umbra = outer = k·h: a sharp shadow.
 */
export function shadowEdges(lampX: number, a: number, objX: number, h: number, screenX = SCREEN_X) {
  const k = (screenX - lampX) / (objX - lampX);
  const spread = a * (k - 1);
  const umbra = h * k - spread;
  const outer = h * k + spread;
  return { k, umbra, outer, hasUmbra: umbra > 0, penumbraBand: outer - Math.max(umbra, -outer) };
}

/** Points spread evenly over a disc (Vogel's sunflower pattern). */
export function discSamples(radius: number, n: number): Vec[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, i) => {
    const r = radius * Math.sqrt((i + 0.5) / n);
    return { x: r * Math.cos(i * golden), y: r * Math.sin(i * golden) };
  });
}

const boxes = new WeakMap<Vec[], { x0: number; x1: number; y0: number; y1: number }>();
/** True if p is inside the polygon (even-odd rule). */
function insidePoly(px: number, py: number, poly: Vec[]) {
  let bb = boxes.get(poly);
  if (!bb) {
    bb = { x0: Math.min(...poly.map((q) => q.x)), x1: Math.max(...poly.map((q) => q.x)), y0: Math.min(...poly.map((q) => q.y)), y1: Math.max(...poly.map((q) => q.y)) };
    boxes.set(poly, bb);
  }
  if (px < bb.x0 || px > bb.x1 || py < bb.y0 || py > bb.y1) return false;
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > py !== b.y > py && px < ((b.x - a.x) * (py - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}

/**
 * How bright one point (y, z) of the screen is, from 0 (full shadow) to 1 (all
 * of the lamp in view). Each sample point of the round lamp sends a straight
 * ray to the screen point; the ray is blocked if it passes through the object.
 * Light that hits the object gets through only as much as the material lets.
 */
export function screenBrightness(
  y: number,
  z: number,
  lamp: { x: number; samples: Vec[] },
  obj: { x: number; points: Vec[]; transmit: number },
  screenX = SCREEN_X,
) {
  const t = (obj.x - lamp.x) / (screenX - lamp.x);
  let blocked = 0;
  for (const s of lamp.samples) {
    const qy = s.x + (y - s.x) * t;
    const qz = s.y + (z - s.y) * t;
    if (insidePoly(qy, qz, obj.points)) blocked++;
  }
  const f = blocked / lamp.samples.length;
  return 1 - f + f * obj.transmit;
}

/* ------------------------------------------------------------------ */
/* Pinhole camera.                                                      */
/* ------------------------------------------------------------------ */

/** Candle with its flame, in cm. */
export const CANDLE_CM = 10;
export const PINHOLE = {
  distance: { min: 15, max: 100 },
  box: { min: 10, max: 30 },
  holeMm: { min: 1, max: 10 },
};

/**
 * A pinhole camera with the candle d cm in front of the hole and the screen
 * b cm behind it. Rays cross at the hole, so the image is upside down and
 * image height ÷ candle height = b ÷ d (similar triangles).
 * A hole of width D lets each point of the candle make a spot of width
 * D × (d + b) ÷ d on the screen, so a bigger hole blurs the image.
 * Diffraction (a blur that only matters for holes well under 1 mm) is left out.
 */
export function pinhole(d: number, b: number, holeMm: number, height = CANDLE_CM) {
  const m = b / d;
  const imageH = height * m;
  const blurCm = (holeMm / 10) * ((d + b) / d);
  const blurRatio = blurCm / imageH;
  const clarity: "sharp" | "slightly blurred" | "blurred" = blurRatio <= 0.05 ? "sharp" : blurRatio <= 0.12 ? "slightly blurred" : "blurred";
  return { m, imageH, blurCm, blurRatio, clarity, sharp: clarity === "sharp", inverted: true };
}

/* ------------------------------------------------------------------ */
/* Plane mirrors.                                                       */
/* ------------------------------------------------------------------ */

/** A wall or tube side that soaks up light. */
export interface Wall {
  a: Vec;
  b: Vec;
}

/** A plane mirror of half length `half` centred at c, tilted θ degrees from the +x axis. */
export function mirrorAt(c: Vec, thetaDeg: number, half = 6): PlaneMirror {
  const u = { x: Math.cos(rad(thetaDeg)) * half, y: Math.sin(rad(thetaDeg)) * half };
  return { a: { x: c.x - u.x, y: c.y - u.y }, b: { x: c.x + u.x, y: c.y + u.y } };
}

/** Where segment pq crosses segment ab, as a fraction along pq, or null. */
function crossAt(p: Vec, q: Vec, a: Vec, b: Vec): number | null {
  const r = { x: q.x - p.x, y: q.y - p.y };
  const s = { x: b.x - a.x, y: b.y - a.y };
  const den = r.x * s.y - r.y * s.x;
  if (Math.abs(den) < 1e-9) return null;
  const ap = { x: a.x - p.x, y: a.y - p.y };
  const t = (ap.x * s.y - ap.y * s.x) / den;
  const u = (ap.x * r.y - ap.y * r.x) / den;
  return t > 1e-6 && t <= 1 && u >= 0 && u <= 1 ? t : null;
}

/** Shortest distance from point c to segment pq. */
function distToSegment(c: Vec, p: Vec, q: Vec) {
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((c.x - p.x) * dx + (c.y - p.y) * dy) / l2)) : 0;
  return Math.hypot(p.x + t * dx - c.x, p.y + t * dy - c.y);
}

export interface Bounce {
  /** Where the beam hit a mirror. */
  p: Vec;
  /** Angle of incidence and angle of reflection, in degrees, from the normal. */
  i: number;
  r: number;
  /** Which mirror (index into the mirrors list) the beam hit. */
  mirror: number;
}

/**
 * A beam bouncing between plane mirrors (law of reflection, from ./optics),
 * stopped by the first wall it meets, and checked against a round target.
 * Mirrors here reflect from both faces, like two mirrors glued back to back.
 */
export function beam(origin: Vec, dir: Vec, mirrors: PlaneMirror[], walls: Wall[] = [], target?: { c: Vec; r: number }, bounds = 80) {
  const raw = trace(origin, dir, { planeMirrors: mirrors }, bounds, 12).points;
  const points: Vec[] = [raw[0]];
  let hit = false;
  for (let k = 1; k < raw.length; k++) {
    const p = raw[k - 1];
    let q = raw[k];
    let stop = false;
    let best = 2;
    for (const w of walls) {
      const t = crossAt(p, q, w.a, w.b);
      if (t !== null && t < best) best = t;
    }
    if (best <= 1) {
      q = { x: p.x + (q.x - p.x) * best, y: p.y + (q.y - p.y) * best };
      stop = true;
    }
    if (target && distToSegment(target.c, p, q) <= target.r) {
      // End the beam where it first enters the target.
      const d = norm({ x: q.x - p.x, y: q.y - p.y });
      const along = (target.c.x - p.x) * d.x + (target.c.y - p.y) * d.y;
      const off = Math.hypot(target.c.x - p.x - along * d.x, target.c.y - p.y - along * d.y);
      const back = Math.sqrt(Math.max(0, target.r * target.r - off * off));
      const s = Math.max(0, along - back);
      points.push({ x: p.x + d.x * s, y: p.y + d.y * s });
      hit = true;
      break;
    }
    points.push(q);
    if (stop) break;
  }
  // Angles at every mirror the beam really reached.
  const bounces: Bounce[] = [];
  for (let k = 1; k < points.length - 1; k++) {
    const p = points[k];
    const idx = mirrors.findIndex((mm) => distToSegment(p, mm.a, mm.b) < 1e-4);
    if (idx < 0) continue;
    const m = mirrors[idx];
    const e = norm({ x: m.b.x - m.a.x, y: m.b.y - m.a.y });
    const nrm = { x: -e.y, y: e.x };
    const inD = norm({ x: p.x - points[k - 1].x, y: p.y - points[k - 1].y });
    const outD = norm({ x: points[k + 1].x - p.x, y: points[k + 1].y - p.y });
    const i = deg(Math.acos(Math.min(1, Math.abs(inD.x * nrm.x + inD.y * nrm.y))));
    const r = deg(Math.acos(Math.min(1, Math.abs(outD.x * nrm.x + outD.y * nrm.y))));
    bounces.push({ p, i, r, mirror: idx });
  }
  return { points, hit, bounces };
}

/** Torch and mirror: the mirror lies along y = 0 and the beam hits its middle. */
export const TORCH_MIRROR: PlaneMirror = { a: { x: -30, y: 0 }, b: { x: 30, y: 0 } };
export function torchBeam(incidenceDeg: number, reach = 26) {
  const from = { x: -reach * Math.sin(rad(incidenceDeg)), y: reach * Math.cos(rad(incidenceDeg)) };
  const res = beam(from, { x: -from.x, y: -from.y }, [TORCH_MIRROR], [], undefined, 40);
  return { from, ...res, i: res.bounces[0]?.i ?? incidenceDeg, r: res.bounces[0]?.r ?? incidenceDeg };
}

/* Periscope: see a cricket match over a high wall. */
export const PERISCOPE = {
  wall: { a: { x: 0, y: -30 }, b: { x: 0, y: 10 } } as Wall,
  scene: { x: 42, y: 22 },
  eye: { c: { x: -32, y: -22 }, r: 3 },
  top: { x: -10, y: 22 },
  bottom: { x: -10, y: -22 },
  /** The tube: openings face right at the top and left at the bottom. */
  tube: [
    { a: { x: -16, y: -16 }, b: { x: -16, y: 28 } },
    { a: { x: -4, y: -28 }, b: { x: -4, y: 16 } },
    { a: { x: -16, y: 28 }, b: { x: -4, y: 28 } },
    { a: { x: -16, y: -28 }, b: { x: -4, y: -28 } },
  ] as Wall[],
  half: 5,
};

/** Light from the match (three parallel rays) through a periscope with mirrors tilted top° and bottom°. */
export function periscope(top: number, bottom: number) {
  const P = PERISCOPE;
  const mirrors = [mirrorAt(P.top, top, P.half), mirrorAt(P.bottom, bottom, P.half)];
  const walls = [P.wall, ...P.tube];
  const rays = [-2, 0, 2].map((dy) => beam({ x: P.scene.x, y: P.scene.y + dy }, { x: -1, y: 0 }, mirrors, walls, { c: P.eye.c, r: P.eye.r }, 60));
  return { mirrors, rays, solved: rays[1].hit };
}

/* ------------------------------------------------------------------ */
/* Challenge: bounce the laser off mirrors to hit the target.           */
/* ------------------------------------------------------------------ */

export interface MazeLevel {
  name: string;
  laser: Vec;
  dir: Vec;
  mirrors: { c: Vec; start: number }[];
  walls: Wall[];
  target: Vec;
}

export const MAZE_HALF = { x: 50, y: 30 };
export const TARGET_R = 3;
export const MAZE_MIRROR_HALF = 6;

export const MAZE_LEVELS: MazeLevel[] = [
  {
    name: "One bounce",
    laser: { x: -45, y: 0 },
    dir: { x: 1, y: 0 },
    mirrors: [{ c: { x: 20, y: 0 }, start: 90 }],
    walls: [],
    target: { x: 20, y: 24 },
  },
  {
    name: "Over the wall",
    laser: { x: -45, y: -20 },
    dir: { x: 1, y: 0 },
    mirrors: [
      { c: { x: 25, y: -20 }, start: 90 },
      { c: { x: 25, y: 20 }, start: 90 },
    ],
    walls: [{ a: { x: -50, y: 0 }, b: { x: 10, y: 0 } }],
    target: { x: -35, y: 20 },
  },
  {
    name: "Zig-zag",
    laser: { x: -45, y: -25 },
    dir: norm({ x: 20, y: 45 }),
    mirrors: [
      { c: { x: -25, y: 20 }, start: 90 },
      { c: { x: 15, y: -22 }, start: 90 },
      { c: { x: 40, y: 18 }, start: 90 },
    ],
    walls: [
      { a: { x: -10, y: -30 }, b: { x: -10, y: 0 } },
      { a: { x: -5, y: 10 }, b: { x: -5, y: 30 } },
      { a: { x: 0, y: 5 }, b: { x: 25, y: 5 } },
    ],
    target: { x: 5, y: 22 },
  },
];

/** The level's beam with each mirror tilted angles[k] degrees. */
export function mazeBeam(level: MazeLevel, angles: number[]) {
  const mirrors = level.mirrors.map((m, k) => mirrorAt(m.c, angles[k], MAZE_MIRROR_HALF));
  return { mirrors, ...beam(level.laser, level.dir, mirrors, level.walls, { c: level.target, r: TARGET_R }, 120) };
}
