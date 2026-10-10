/**
 * Maths Olympiad: angles and regular polygons. Pure functions shared by the OlyPolygon sim and
 * the problem answers. Angles are in degrees.
 */
import { isWhole } from "./oly-number";

/** Each interior angle of a regular polygon with n sides: 180° − (360° ÷ n). */
export function interiorAngle(n: number) {
  return 180 - 360 / n;
}

/** Sides of the regular polygon with this interior angle: 360° ÷ (180° − angle). */
export function sidesForInterior(angle: number) {
  return 360 / (180 - angle);
}

/** Sides of the regular tile that closes the gap left by these tiles around one point. */
export function closingTile(sides: number[]) {
  const gap = 360 - sides.reduce((a, n) => a + interiorAngle(n), 0);
  return sidesForInterior(gap);
}

/** n for which a regular 2n-gon's interior angle beats the n-gon's by `diff` degrees: 180° ÷ diff. */
export function doublingSides(diff: number) {
  return 180 / diff;
}

/** One regular polygon whose interior angle must equal `target`. */
export interface PolyRegularScene {
  kind: "poly-regular";
  n: number;
  target: number;
  /** What the polygon is in the story, like "window". */
  thing: string;
}

/** Regular tiles meeting at one point: the fixed ones, then the student's n-gon. Their angles must make 360°. */
export interface PolyVertexScene {
  kind: "poly-vertex";
  fixed: number[];
  n: number;
}

/** An n-gon and a 2n-gon: the bigger one's interior angle must beat the smaller one's by `diff`. */
export interface PolyPairScene {
  kind: "poly-pair";
  n: number;
  diff: number;
}

export type PolygonScene = PolyRegularScene | PolyVertexScene | PolyPairScene;

export function isPolygonScene(s: { kind: string }): s is PolygonScene {
  return s.kind.startsWith("poly-");
}

export const BUILD_S = 2.6;
export const END_S = 0.8;
/** How close (in degrees) counts as a perfect fit. */
export const FIT_DEG = 0.05;

const deg = (a: number) => `${Number(a.toFixed(2))}°`;

/** Reason a value cannot be the number of sides, or null if it can. */
export function badSides(n: number) {
  if (!isWhole(n)) return `A polygon must have a whole number of sides, not ${Number(n.toPrecision(4))}.`;
  if (n < 3) return "A polygon needs at least 3 sides.";
  return null;
}

export function planPolygon(s: PolygonScene): { outcome: { ok: boolean; text: string }; duration: number } {
  const duration = BUILD_S + END_S;
  const bad = badSides(s.n);
  if (bad) return { outcome: { ok: false, text: bad }, duration };
  const n = Math.round(s.n);
  if (s.kind === "poly-regular") {
    const a = interiorAngle(n);
    const ok = Math.abs(a - s.target) <= FIT_DEG;
    return {
      outcome: { ok, text: ok ? `A regular ${n}-gon has angles of exactly ${deg(a)}. The ${s.thing} fits!` : `A regular ${n}-gon has angles of ${deg(a)}, not ${deg(s.target)}.` },
      duration,
    };
  }
  if (s.kind === "poly-vertex") {
    const sum = [...s.fixed, n].reduce((t, k) => t + interiorAngle(k), 0);
    const gap = 360 - sum;
    const ok = Math.abs(gap) <= FIT_DEG;
    return {
      outcome: {
        ok,
        text: ok
          ? `The angles add up to exactly 360°, so the tiles close up with no gap!`
          : gap > 0
            ? `The angles add up to ${deg(sum)}, leaving a ${deg(gap)} gap.`
            : `The angles add up to ${deg(sum)}, so the tiles overlap by ${deg(-gap)}.`,
      },
      duration,
    };
  }
  const d = interiorAngle(2 * n) - interiorAngle(n);
  const ok = Math.abs(d - s.diff) <= FIT_DEG;
  return {
    outcome: {
      ok,
      text: ok
        ? `${deg(interiorAngle(2 * n))} − ${deg(interiorAngle(n))} = ${deg(d)}, exactly as the plan says!`
        : `The ${2 * n}-gon's angle beats the ${n}-gon's by ${deg(d)}, not ${deg(s.diff)}.`,
    },
    duration,
  };
}
