/**
 * Human eye and prism physics for the Class 10 "Human Eye and the Colourful World" lesson.
 * Pure functions, so they can be unit tested.
 */
import { rad, trace, type Medium, type Vec } from "./optics";

export type EyeCondition = "normal" | "myopia" | "hypermetropia";

/** What the eye looks at, with distance in metres. */
export const TARGETS = [
  { id: "book", label: "Book", d: 0.25, emoji: "📖", text: "Read me up close" },
  { id: "friend", label: "Friend", d: 1, emoji: "🙋", text: "Hi there!" },
  { id: "board", label: "Blackboard", d: 5, emoji: "🧑‍🏫", text: "F = m × a" },
  { id: "stars", label: "Stars", d: Infinity, emoji: "✨", text: "★  ✦  ★" },
] as const;
export type TargetId = (typeof TARGETS)[number]["id"];

/**
 * Accommodation range of the eye lens in dioptres, for a 2.5 cm eye.
 * Normal: far point at infinity (40 D) to near point 25 cm (44 D).
 * Myopia here: far point 2 m. Hypermetropia here: near point 1 m.
 */
export const CONDITIONS: Record<EyeCondition, { label: string; min: number; max: number; note: string }> = {
  normal: { label: "Normal eye", min: 40, max: 44, note: "near point 25 cm, far point infinity" },
  myopia: { label: "Myopia", min: 40.5, max: 44, note: "far point only 2 m, so far things blur" },
  hypermetropia: { label: "Hypermetropia", min: 40, max: 41, note: "near point 1 m, so close things blur" },
};

export const RETINA_CM = 2.5;

/** Dioptres the eye and glasses need together to focus an object at d metres on the retina. */
export const needed = (d: number) => 100 / RETINA_CM + (Number.isFinite(d) ? 1 / d : 0);

/** How sharply an eye with this accommodation range (dioptres) sees an object d metres away through glasses. */
export function eyeFocus({ min, max }: { min: number; max: number }, d: number, glasses: number) {
  const need = needed(d);
  const eye = Math.min(max, Math.max(min, need - glasses));
  const total = eye + glasses;
  const defocus = total - need; // > 0: focuses in front of the retina
  const sharp = Math.abs(defocus) < 0.1;
  const focus: "on" | "front" | "behind" = sharp ? "on" : defocus > 0 ? "front" : "behind";
  return { eye, total, defocus, sharp, focus };
}

// Refractive index per colour, spread exaggerated about 4× so the spectrum is visible.
export const SPECTRUM = [
  { name: "Red", c: "#ef4444", n: 1.47 },
  { name: "Orange", c: "#f97316", n: 1.485 },
  { name: "Yellow", c: "#facc15", n: 1.5 },
  { name: "Green", c: "#22c55e", n: 1.515 },
  { name: "Blue", c: "#3b82f6", n: 1.53 },
  { name: "Indigo", c: "#6366f1", n: 1.545 },
  { name: "Violet", c: "#a855f7", n: 1.56 },
];

/** Incidence range (degrees) where every colour gets out of a 60° prism without total internal reflection. */
export const INCIDENCE = { min: 40, max: 70 };

/**
 * White light hits the middle of a 60° prism's left face. With `recombined`, a second prism
 * (the first turned upside down, just past its right face) brings the colours back together.
 */
export function prismScene(incidence: number, recombined: boolean) {
  const s = 10; // prism side, cm
  const h = (s * Math.sqrt(3)) / 2;
  const first: Vec[] = [
    { x: -8 - s / 2, y: -h / 2 },
    { x: -8 + s / 2, y: -h / 2 },
    { x: -8, y: h / 2 },
  ];
  // Rotate the first prism 180° about a point just outside the middle of its right face,
  // so the two facing sides are parallel with a 1.5 cm gap.
  const gap = 1.5;
  const m = { x: (first[1].x + first[2].x) / 2, y: (first[1].y + first[2].y) / 2 };
  const pivot = { x: m.x + Math.cos(rad(30)) * (gap / 2), y: m.y + Math.sin(rad(30)) * (gap / 2) };
  const second = first.map((p) => ({ x: 2 * pivot.x - p.x, y: 2 * pivot.y - p.y }));

  const mid = { x: (first[0].x + first[2].x) / 2, y: (first[0].y + first[2].y) / 2 };
  const normalIn = rad(-30); // the left face's inward normal
  const dirAngle = normalIn + rad(incidence);
  const dir = { x: Math.cos(dirAngle), y: Math.sin(dirAngle) };
  const start = { x: mid.x - dir.x * 30, y: mid.y - dir.y * 30 };
  const rays = SPECTRUM.map((col) => {
    const media: Medium[] = [{ points: first, n: col.n }];
    if (recombined) media.push({ points: second, n: col.n });
    return { ...col, path: trace(start, dir, { media }, 40, 8) };
  });
  const angle = (r: (typeof rays)[number]) => Math.atan2(r.path.dir.y, r.path.dir.x);
  const spread = Math.abs((angle(rays[0]) - angle(rays[rays.length - 1])) * (180 / Math.PI));
  return { first, second: recombined ? second : null, rays, start, mid, spread };
}
