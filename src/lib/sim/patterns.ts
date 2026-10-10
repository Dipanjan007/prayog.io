/**
 * Growing patterns and their rules (NCERT Class 7 Ganita Prakash, "Expressions using Letter-Numbers").
 * Pure functions for the PatternLab sim: matchstick and tile patterns built step by step, the
 * count read straight off the drawing, rules of the form a·n + b, and equivalent expressions
 * for a rangoli border, each with the way it groups the tiles.
 */

export type PatternId = "squares" | "triangles" | "stairs" | "border" | "houses" | "fence" | "path";

export interface PatternDef {
  id: PatternId;
  name: string;
  unit: "matchsticks" | "tiles";
  /** The rule is count = (a × n) + b. */
  a: number;
  b: number;
  /** One line describing step n. */
  blurb: string;
}

export const PATTERNS: Record<PatternId, PatternDef> = {
  squares: { id: "squares", name: "Squares in a row", unit: "matchsticks", a: 3, b: 1, blurb: "Step n is a row of n squares made of matchsticks." },
  triangles: { id: "triangles", name: "Triangles in a row", unit: "matchsticks", a: 2, b: 1, blurb: "Step n is a strip of n triangles, pointing up and down in turn." },
  stairs: { id: "stairs", name: "Stairs", unit: "matchsticks", a: 4, b: 0, blurb: "Step n is the outline of a staircase with n steps." },
  border: { id: "border", name: "Rangoli border", unit: "tiles", a: 4, b: 4, blurb: "Step n is a border of tiles around an n by n rangoli." },
  houses: { id: "houses", name: "Houses in a row", unit: "matchsticks", a: 5, b: 1, blurb: "Step n is a row of n houses that share their walls." },
  fence: { id: "fence", name: "Bamboo fence", unit: "matchsticks", a: 4, b: 1, blurb: "Step n is a fence with n sections, each with two rails and a brace." },
  path: { id: "path", name: "Garden path", unit: "tiles", a: 2, b: 6, blurb: "Step n is a path of n grey tiles with white tiles all around it." },
};

/** Patterns in free play; the others are the challenge's new patterns. */
export const FREE_PATTERNS: PatternId[] = ["squares", "triangles", "stairs", "border"];

/** The biggest step the sim draws. */
export const MAX_STEP = 10;
/** Largest a or b the rule control goes up to. */
export const MAX_COEFF = 10;

/** A matchstick from (x1, y1) to (x2, y2), in units with y pointing up. */
export type Seg = [number, number, number, number];
/** A unit tile with its lower-left corner at (x, y). Only "count" tiles are counted. */
export interface Cell {
  x: number;
  y: number;
  kind: "count" | "decor";
}

const H = Math.sqrt(3) / 2;

/** The matchsticks in step n (empty for tile patterns). */
export function sticks(id: PatternId, n: number): Seg[] {
  const out: Seg[] = [];
  if (id === "squares" || id === "houses") {
    for (let i = 0; i < n; i++) out.push([i, 0, i + 1, 0], [i, 1, i + 1, 1]);
    for (let i = 0; i <= n; i++) out.push([i, 0, i, 1]);
    if (id === "houses") for (let i = 0; i < n; i++) out.push([i, 1, i + 0.5, 1.7], [i + 0.5, 1.7, i + 1, 1]);
  } else if (id === "triangles") {
    // Zig-zag points P0 (bottom), P1 (top), P2 (bottom)...; triangle k has corners P(k), P(k+1), P(k+2).
    const P = (j: number): [number, number] => [j / 2, j % 2 ? H : 0];
    for (let j = 0; j <= n; j++) out.push([...P(j), ...P(j + 1)]);
    for (let k = 0; k < n; k++) out.push([...P(k), ...P(k + 2)]);
  } else if (id === "stairs") {
    // Column i is i + 1 units tall; the outline goes round the whole staircase.
    for (let i = 0; i < n; i++) {
      out.push([i, 0, i + 1, 0]); // floor
      out.push([n, i, n, i + 1]); // back wall
      out.push([i, i + 1, i + 1, i + 1]); // tread
      out.push([i, i, i, i + 1]); // riser
    }
  } else if (id === "fence") {
    for (let i = 0; i <= n; i++) out.push([i, 0, i, 1.2]);
    for (let i = 0; i < n; i++) out.push([i, 0.3, i + 1, 0.3], [i, 0.9, i + 1, 0.9], [i, 0.3, i + 1, 0.9]);
  }
  return out;
}

/** The tiles in step n (empty for matchstick patterns). */
export function cells(id: PatternId, n: number): Cell[] {
  const out: Cell[] = [];
  if (id === "border") {
    const m = n + 2;
    for (let y = 0; y < m; y++)
      for (let x = 0; x < m; x++) out.push({ x, y, kind: x === 0 || y === 0 || x === m - 1 || y === m - 1 ? "count" : "decor" });
  } else if (id === "path") {
    for (let y = 0; y < 3; y++) for (let x = 0; x < n + 2; x++) out.push({ x, y, kind: y === 1 && x >= 1 && x <= n ? "decor" : "count" });
  }
  return out;
}

export const segKey = (s: Seg) => s.map((v) => v.toFixed(3)).join(",");

/** How many matchsticks or tiles step n uses, counted from the drawing itself. */
export function countOf(id: PatternId, n: number) {
  if (PATTERNS[id].unit === "tiles") return cells(id, n).filter((c) => c.kind === "count").length;
  return new Set(sticks(id, n).map(segKey)).size;
}

/** The rule's value: (a × n) + b. */
export function ruleValue(a: number, b: number, n: number) {
  return a * n + b;
}

/** A rule as students write it: "3n + 1", "4n", "n + 2", "6". */
export function ruleText(a: number, b: number) {
  const an = a === 0 ? "" : a === 1 ? "n" : `${a}n`;
  if (an && b) return `${an} + ${b}`;
  return an || `${b}`;
}

/** Working for step n with the multiplication bracketed first, e.g. "(3 × 100) + 1 = 301". */
export function ruleWorking(a: number, b: number, n: number) {
  const v = ruleValue(a, b, n);
  if (a === 0) return `${b}`;
  const an = a === 1 ? `${n}` : `${a} × ${n}`;
  if (!b) return `${an} = ${v}`;
  return `${a === 1 ? an : `(${an})`} + ${b} = ${v}`;
}

/** Is (a, b) the rule of this pattern? Checked against the drawn counts for every step the sim shows. */
export function ruleFits(id: PatternId, a: number, b: number) {
  for (let n = 1; n <= MAX_STEP; n++) if (ruleValue(a, b, n) !== countOf(id, n)) return false;
  return true;
}

/** Matchsticks new in step n that were not in step n − 1. Empty when step n − 1 is not part of step n. */
export function newSticks(id: PatternId, n: number): Set<string> {
  if (n < 2) return new Set();
  const now = new Set(sticks(id, n).map(segKey));
  const before = sticks(id, n - 1).map(segKey);
  if (!before.every((k) => now.has(k))) return new Set();
  for (const k of before) now.delete(k);
  return now;
}

/** A tile of the rangoli border, as (column, row) on the (n + 2) by (n + 2) grid. */
export type Tile = [number, number];

/** One way of writing the border count, and the groups of tiles it adds up. */
export interface BorderExpr {
  text: string;
  value: (n: number) => number;
  /** Groups of tiles the expression counts. A tile in two groups is counted twice; a tile in none is missed. */
  groups: (n: number) => Tile[][];
  /** Taken away at the end (for tiles counted twice on purpose). */
  minus: number;
  /** How the groups match the expression, in words. */
  how: string;
}

const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
/** The four sides without corners, and the four corners. */
const sides = (n: number) => {
  const m = n + 2;
  return {
    top: range(1, n).map((c): Tile => [c, 0]),
    bottom: range(1, n).map((c): Tile => [c, m - 1]),
    left: range(1, n).map((r): Tile => [0, r]),
    right: range(1, n).map((r): Tile => [m - 1, r]),
    corners: [[0, 0], [m - 1, 0], [0, m - 1], [m - 1, m - 1]] as Tile[],
    fullTop: range(0, m - 1).map((c): Tile => [c, 0]),
    fullBottom: range(0, m - 1).map((c): Tile => [c, m - 1]),
    fullLeft: range(0, m - 1).map((r): Tile => [0, r]),
    fullRight: range(0, m - 1).map((r): Tile => [m - 1, r]),
  };
};

/** The reference rule for the border. */
export const BORDER_RULE = { a: 4, b: 4 };

/** Ways to count the rangoli border. The first is the reference; the student sorts the rest. */
export const BORDER_EXPRS: BorderExpr[] = [
  {
    text: "4n + 4",
    value: (n) => 4 * n + 4,
    groups: (n) => {
      const s = sides(n);
      return [s.top, s.right, s.bottom, s.left, s.corners];
    },
    minus: 0,
    how: "Four sides of n tiles, then the 4 corners.",
  },
  {
    text: "4(n + 1)",
    value: (n) => 4 * (n + 1),
    groups: (n) => {
      const m = n + 2;
      // A pinwheel: each group is one side plus the corner it starts from.
      return [
        range(0, n).map((c): Tile => [c, 0]),
        range(0, n).map((r): Tile => [m - 1, r]),
        range(1, m - 1).map((c): Tile => [c, m - 1]),
        range(1, m - 1).map((r): Tile => [0, r]),
      ];
    },
    minus: 0,
    how: "Four groups of n + 1 tiles chase each other round the border.",
  },
  {
    text: "2(n + 2) + 2n",
    value: (n) => 2 * (n + 2) + 2 * n,
    groups: (n) => {
      const s = sides(n);
      return [s.fullTop, s.fullBottom, s.left, s.right];
    },
    minus: 0,
    how: "Top and bottom rows of n + 2 tiles, then the two sides of n tiles in between.",
  },
  {
    text: "(4 × (n + 2)) − 4",
    value: (n) => 4 * (n + 2) - 4,
    groups: (n) => {
      const s = sides(n);
      return [s.fullTop, s.fullRight, s.fullBottom, s.fullLeft];
    },
    minus: 4,
    how: "Four full sides of n + 2 count each corner twice, so take 4 away.",
  },
  {
    text: "4n",
    value: (n) => 4 * n,
    groups: (n) => {
      const s = sides(n);
      return [s.top, s.right, s.bottom, s.left];
    },
    minus: 0,
    how: "Four sides of n tiles, but the 4 corners are never counted.",
  },
  {
    text: "4(n + 2)",
    value: (n) => 4 * (n + 2),
    groups: (n) => {
      const s = sides(n);
      return [s.fullTop, s.fullRight, s.fullBottom, s.fullLeft];
    },
    minus: 0,
    how: "Four full sides of n + 2 tiles count every corner twice.",
  },
];

/** What a way of grouping adds up to: every group's tiles, less the amount taken away. */
export function groupTotal(e: BorderExpr, n: number) {
  return e.groups(n).reduce((s, g) => s + g.length, 0) - e.minus;
}

/** True when the expression gives the border count for every step the sim shows. */
export function sameAsBorder(e: BorderExpr) {
  for (let n = 1; n <= MAX_STEP; n++) if (e.value(n) !== countOf("border", n)) return false;
  return true;
}

/** How many times each tile is counted by an expression's groups, keyed "c,r". */
export function tileCounts(e: BorderExpr, n: number) {
  const m = new Map<string, number>();
  for (const g of e.groups(n)) for (const [c, r] of g) m.set(`${c},${r}`, (m.get(`${c},${r}`) ?? 0) + 1);
  return m;
}

/** A challenge round: a new pattern whose rule the student finds. */
export interface PatternRound {
  pattern: PatternId;
  name: string;
  brief: string;
}
