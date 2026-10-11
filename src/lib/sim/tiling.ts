/**
 * Tiling with regular polygons (NCERT Class 7 Ganita Prakash Part 2, "Constructions and Tilings").
 * Pure functions for the TilingLab sim: interior angles, fitting tiles round one corner (vertex),
 * which shapes tile a floor on their own, mixed floors, and the floor patterns the sim draws.
 */

/** The regular polygons in the tile box, by number of sides. */
export const SHAPES = [3, 4, 5, 6, 8, 10, 12] as const;
export type Sides = (typeof SHAPES)[number];

export const SHAPE_NAME: Record<Sides, string> = {
  3: "Triangle",
  4: "Square",
  5: "Pentagon",
  6: "Hexagon",
  8: "Octagon",
  10: "Decagon",
  12: "12-gon",
};

/** Interior angle of a regular n-gon in degrees: 180° − (360° ÷ n). */
export function interiorAngle(n: number) {
  return 180 - 360 / n;
}

/** Sum of the corner angles of the tiles meeting at one point. */
export function angleSum(tiles: readonly number[]) {
  return tiles.reduce((s, n) => s + interiorAngle(n), 0);
}

/** Round away floating-point dust (all box angles are whole degrees). */
const whole = (x: number) => Math.round(x * 1e6) / 1e6;

export type Fit = "gap" | "fits" | "overlap";

/** Do the tiles fit round one point exactly, leave a gap, or overlap? */
export function vertexFit(tiles: readonly number[]): Fit {
  const s = whole(angleSum(tiles));
  return s === 360 ? "fits" : s < 360 ? "gap" : "overlap";
}

/** Degrees left to fill round the point (negative when the tiles overlap). */
export function gapLeft(tiles: readonly number[]) {
  return whole(360 - angleSum(tiles));
}

/** How many copies of one shape fit round a point: 360° ÷ (interior angle), whole or not. */
export function copiesRoundPoint(n: number) {
  return whole(360 / interiorAngle(n));
}

/** A shape tiles a floor on its own when a whole number of copies fills the point. */
export function tilesAlone(n: number) {
  return Number.isInteger(copiesRoundPoint(n));
}

/** Can another tile be added round the point? Only while there is still a gap. */
export function canAdd(tiles: readonly number[]) {
  return vertexFit(tiles) === "gap";
}

/** Uses more than one kind of shape. */
export function isMixed(tiles: readonly number[]) {
  return new Set(tiles).size > 1;
}

/** A label for a set of tiles round a point that ignores order, e.g. "4.8.8". */
export function vertexKey(tiles: readonly number[]) {
  return [...tiles].sort((a, b) => a - b).join(".");
}

/** Every multiset of box shapes that exactly fills `deg` degrees (each list sorted, smallest first). */
export function fillsFor(deg: number, from: readonly number[] = SHAPES, min = 3): number[][] {
  const out: number[][] = [];
  const go = (left: number, start: number, acc: number[]) => {
    if (Math.abs(left) < 1e-9) {
      out.push(acc);
      return;
    }
    for (let i = 0; i < from.length; i++) {
      const n = from[i];
      if (n < start) continue;
      const a = interiorAngle(n);
      if (a <= left + 1e-9) go(left - a, n, [...acc, n]);
    }
  };
  go(deg, min, []);
  return out;
}

/* ---------- Floors ---------- */

export type Pt = { x: number; y: number };
/** A polygon tile on the floor: its number of sides and its corners (side length 1). */
export interface Tile {
  n: number;
  pts: Pt[];
}

export type FloorId = "triangles" | "squares" | "hexagons" | "octagons-squares" | "squares-triangles" | "hexagons-triangles";

export interface Floor {
  id: FloorId;
  name: string;
  /** The tiles meeting at every corner, in order round the corner. */
  vertex: number[];
}

export const FLOORS: Floor[] = [
  { id: "triangles", name: "Triangles", vertex: [3, 3, 3, 3, 3, 3] },
  { id: "squares", name: "Squares", vertex: [4, 4, 4, 4] },
  { id: "hexagons", name: "Hexagons", vertex: [6, 6, 6] },
  { id: "octagons-squares", name: "Octagons + squares", vertex: [4, 8, 8] },
  { id: "squares-triangles", name: "Squares + triangles", vertex: [3, 3, 3, 4, 4] },
  { id: "hexagons-triangles", name: "Hexagons + triangles", vertex: [3, 6, 3, 6] },
];

/** A regular n-gon with side 1, centred at c, with a corner at angle `rot` (radians). */
export function regular(n: number, c: Pt, rot: number): Tile {
  const R = 1 / (2 * Math.sin(Math.PI / n));
  const pts: Pt[] = [];
  for (let k = 0; k < n; k++) {
    const a = rot + (2 * Math.PI * k) / n;
    pts.push({ x: c.x + R * Math.cos(a), y: c.y + R * Math.sin(a) });
  }
  return { n, pts };
}

const S3 = Math.sqrt(3);

/** Tiles of a floor pattern covering at least the box |x| ≤ hw, |y| ≤ hh (side length 1, maths axes). */
export function floorTiles(id: FloorId, hw: number, hh: number): Tile[] {
  const out: Tile[] = [];
  const inBox = (c: Pt, pad: number) => Math.abs(c.x) <= hw + pad && Math.abs(c.y) <= hh + pad;
  const I = Math.ceil(hw) + 3;
  const J = Math.ceil(hh) + 3;
  switch (id) {
    case "squares":
      for (let i = -I; i <= I; i++) for (let j = -J; j <= J; j++) if (inBox({ x: i + 0.5, y: j + 0.5 }, 1)) out.push(regular(4, { x: i + 0.5, y: j + 0.5 }, Math.PI / 4));
      break;
    case "triangles":
      // Rows of height √3/2; up and down triangles alternate.
      for (let j = -2 * J; j <= 2 * J; j++)
        for (let i = -I; i <= I; i++) {
          const y0 = (j * S3) / 2;
          const x0 = i + (j % 2 === 0 ? 0 : 0.5);
          const up: Pt[] = [
            { x: x0, y: y0 },
            { x: x0 + 1, y: y0 },
            { x: x0 + 0.5, y: y0 + S3 / 2 },
          ];
          const down: Pt[] = [
            { x: x0 + 0.5, y: y0 + S3 / 2 },
            { x: x0 + 1, y: y0 },
            { x: x0 + 1.5, y: y0 + S3 / 2 },
          ];
          if (inBox({ x: x0 + 0.5, y: y0 }, 1.5)) out.push({ n: 3, pts: up }, { n: 3, pts: down });
        }
      break;
    case "hexagons":
      // Flat-topped hexagons: centres 1.5 apart across, √3 apart down, odd columns shifted.
      for (let i = -I; i <= I; i++)
        for (let j = -J; j <= J; j++) {
          const c = { x: 1.5 * i, y: S3 * j + (Math.abs(i) % 2 ? S3 / 2 : 0) };
          if (inBox(c, 2)) out.push(regular(6, c, 0));
        }
      break;
    case "octagons-squares": {
      const a = 1 + Math.SQRT2;
      for (let i = -I; i <= I; i++)
        for (let j = -J; j <= J; j++) {
          const c = { x: i * a, y: j * a };
          if (inBox(c, 3)) out.push(regular(8, c, Math.PI / 8));
          const s = { x: (i + 0.5) * a, y: (j + 0.5) * a };
          if (inBox(s, 3)) out.push(regular(4, s, 0));
        }
      break;
    }
    case "squares-triangles": {
      // A strip of squares, then a strip of triangles, shifted half a tile each time.
      const period = 1 + S3 / 2;
      for (let j = -J; j <= J; j++) {
        const y0 = j * period;
        const shift = (((j % 2) + 2) % 2) * 0.5;
        for (let i = -I - 1; i <= I + 1; i++) {
          const x0 = i + shift;
          if (!inBox({ x: x0, y: y0 }, 2)) continue;
          out.push({
            n: 4,
            pts: [
              { x: x0, y: y0 },
              { x: x0 + 1, y: y0 },
              { x: x0 + 1, y: y0 + 1 },
              { x: x0, y: y0 + 1 },
            ],
          });
          const yt = y0 + 1;
          out.push({
            n: 3,
            pts: [
              { x: x0, y: yt },
              { x: x0 + 1, y: yt },
              { x: x0 + 0.5, y: yt + S3 / 2 },
            ],
          });
          out.push({
            n: 3,
            pts: [
              { x: x0 + 0.5, y: yt + S3 / 2 },
              { x: x0 + 1, y: yt },
              { x: x0 + 1.5, y: yt + S3 / 2 },
            ],
          });
        }
      }
      break;
    }
    case "hexagons-triangles":
      // Hexagons on a triangular lattice 2 apart, with an up and a down triangle beside each.
      for (let i = -I; i <= I; i++)
        for (let j = -J; j <= J; j++) {
          const c = { x: 2 * i + j, y: S3 * j };
          if (!inBox(c, 3)) continue;
          out.push(regular(6, c, 0));
          out.push({
            n: 3,
            pts: [
              { x: c.x + 1, y: c.y },
              { x: c.x + 1.5, y: c.y + S3 / 2 },
              { x: c.x + 0.5, y: c.y + S3 / 2 },
            ],
          });
          out.push({
            n: 3,
            pts: [
              { x: c.x + 1, y: c.y },
              { x: c.x + 0.5, y: c.y - S3 / 2 },
              { x: c.x + 1.5, y: c.y - S3 / 2 },
            ],
          });
        }
      break;
  }
  return out;
}

/** The tiles that have a corner at point p, and the angle each one makes there. */
export function tilesAtCorner(tiles: Tile[], p: Pt, eps = 1e-6) {
  return tiles.filter((t) => t.pts.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < eps)).map((t) => ({ n: t.n, angle: interiorAngle(t.n) }));
}

/** The tile corner nearest to point p. */
export function nearestCorner(tiles: Tile[], p: Pt): Pt {
  let best = tiles[0].pts[0];
  let bd = Infinity;
  for (const t of tiles)
    for (const q of t.pts) {
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < bd) {
        bd = d;
        best = q;
      }
    }
  return best;
}

/* ---------- Challenge ---------- */

/** Challenge: some tiles are already laid round a corner; finish it with no gap and no overlap. */
export interface TileRound {
  name: string;
  brief: string;
  /** Tiles already laid round the corner (they cannot be lifted). */
  fixed: number[];
}

/** The round is solved when the laid and added tiles exactly fill the corner, and something was added. */
export function roundSolved(r: TileRound, added: readonly number[]) {
  return added.length > 0 && vertexFit([...r.fixed, ...added]) === "fits";
}
