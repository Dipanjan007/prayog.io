/**
 * Area (NCERT Class 8 Ganita Prakash Part 2, "Area").
 * Pure functions for the AreaLab geoboard: a rectangle sheared into a
 * parallelogram, a triangle as half a parallelogram, and a trapezium as half of
 * a parallelogram made from two copies. All corners sit on whole-number pegs.
 */

export interface Pt {
  x: number;
  y: number;
}

/** The geoboard: 14 squares across, 7 up. */
export const GRID = { w: 14, h: 7 };

/** Shear: a rectangle b × h whose top edge slides s squares sideways. */
export interface ShearShape {
  kind: "shear";
  b: number;
  h: number;
  s: number;
}
/** Triangle: base b on the bottom, top corner p squares from the left end of the base, height h. */
export interface TriangleShape {
  kind: "triangle";
  b: number;
  h: number;
  p: number;
}
/** Trapezium: bottom side a, top side c (parallel to it), height h, top starting o squares from the left. */
export interface TrapeziumShape {
  kind: "trapezium";
  a: number;
  c: number;
  h: number;
  o: number;
}
export type Shape = ShearShape | TriangleShape | TrapeziumShape;
export type ShapeKind = Shape["kind"];

/** Each control: its key on the shape, a name, and the full range the slider allows. */
export interface Control {
  key: string;
  label: string;
  /** Used in "Less …" / "More …" button names. */
  thing: string;
  min: number;
  max: number;
}

export const CONTROLS: Record<ShapeKind, Control[]> = {
  shear: [
    { key: "b", label: "Base", thing: "base", min: 1, max: 12 },
    { key: "h", label: "Height", thing: "height", min: 1, max: GRID.h },
    { key: "s", label: "Slide top", thing: "slide", min: -6, max: 6 },
  ],
  triangle: [
    { key: "b", label: "Base", thing: "base", min: 1, max: 12 },
    { key: "h", label: "Height", thing: "height", min: 1, max: GRID.h },
    { key: "p", label: "Top corner", thing: "top corner", min: -6, max: 12 },
  ],
  trapezium: [
    { key: "a", label: "Bottom side", thing: "bottom side", min: 1, max: 10 },
    { key: "c", label: "Top side", thing: "top side", min: 1, max: 10 },
    { key: "h", label: "Height", thing: "height", min: 1, max: GRID.h },
    { key: "o", label: "Top shift", thing: "top shift", min: -4, max: 6 },
  ],
};

/** The control the student drags on the canvas: the top edge or corner. */
export const DRAG_KEY: Record<ShapeKind, string> = { shear: "s", triangle: "p", trapezium: "o" };

export const START: Record<ShapeKind, Shape> = {
  shear: { kind: "shear", b: 5, h: 3, s: 0 },
  triangle: { kind: "triangle", b: 4, h: 3, p: 1 },
  trapezium: { kind: "trapezium", a: 6, c: 2, h: 3, o: 1 },
};

export function polygon(sh: Shape): Pt[] {
  if (sh.kind === "shear") return [{ x: 0, y: 0 }, { x: sh.b, y: 0 }, { x: sh.b + sh.s, y: sh.h }, { x: sh.s, y: sh.h }];
  if (sh.kind === "triangle") return [{ x: 0, y: 0 }, { x: sh.b, y: 0 }, { x: sh.p, y: sh.h }];
  return [{ x: 0, y: 0 }, { x: sh.a, y: 0 }, { x: sh.o + sh.c, y: sh.h }, { x: sh.o, y: sh.h }];
}

/**
 * The copy turned half a turn about the middle of the right-hand side. With the
 * shape it makes a parallelogram. A sheared rectangle has no copy.
 */
export function copyPolygon(sh: Shape): Pt[] | null {
  if (sh.kind === "shear") return null;
  const poly = polygon(sh);
  const [p, q] = [poly[1], poly[2]];
  const mx = p.x + q.x;
  const my = p.y + q.y;
  return poly.map((v) => ({ x: mx - v.x, y: my - v.y }));
}

/** The parallelogram that the shape and its copy make together. */
export function doubled(sh: Shape): Pt[] {
  if (sh.kind === "shear") return polygon(sh);
  if (sh.kind === "triangle") return [{ x: 0, y: 0 }, { x: sh.b, y: 0 }, { x: sh.b + sh.p, y: sh.h }, { x: sh.p, y: sh.h }];
  return [{ x: 0, y: 0 }, { x: sh.a + sh.c, y: 0 }, { x: sh.a + sh.c + sh.o, y: sh.h }, { x: sh.o, y: sh.h }];
}

/** Area by the shoelace rule (works for any simple polygon). */
export function polyArea(poly: Pt[]) {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}

/** Area by the school formula: b × h, (b × h) ÷ 2, or ((a + c) × h) ÷ 2. */
export function area(sh: Shape) {
  if (sh.kind === "shear") return sh.b * sh.h;
  if (sh.kind === "triangle") return (sh.b * sh.h) / 2;
  return ((sh.a + sh.c) * sh.h) / 2;
}

/** Left and right edges of the drawing, copy included, so toggling the copy never moves anything. */
export function span(sh: Shape) {
  const pts = [...polygon(sh), ...(copyPolygon(sh) ?? [])];
  const xs = pts.map((p) => p.x);
  return { min: Math.min(...xs), max: Math.max(...xs) };
}

export function fits(sh: Shape) {
  const { min, max } = span(sh);
  return max - min <= GRID.w && sh.h <= GRID.h;
}

/** Whole-peg x where the drawing starts, so it sits in the middle of the board. */
export function originX(sh: Shape) {
  const { min, max } = span(sh);
  return Math.floor((GRID.w - (max - min)) / 2) - min;
}

/** The values a control can take now, given the other controls (the drawing must fit the board). */
export function range(sh: Shape, key: string): [number, number] {
  const c = CONTROLS[sh.kind].find((x) => x.key === key)!;
  const ok: number[] = [];
  for (let v = c.min; v <= c.max; v++) if (fits({ ...sh, [key]: v } as Shape)) ok.push(v);
  return [Math.min(...ok), Math.max(...ok)];
}

/** Set a control, clamped to what fits. */
export function setValue(sh: Shape, key: string, v: number): Shape {
  const [lo, hi] = range(sh, key);
  return { ...sh, [key]: Math.max(lo, Math.min(hi, Math.round(v))) } as Shape;
}

/** Part of a convex polygon inside the unit square with lower-left corner (cx, cy). */
function clipToCell(poly: Pt[], cx: number, cy: number): Pt[] {
  let out = poly;
  const edges: [(p: Pt) => number, (a: Pt, b: Pt) => Pt][] = [
    [(p) => p.x - cx, (a, b) => lerp(a, b, (cx - a.x) / (b.x - a.x))],
    [(p) => cx + 1 - p.x, (a, b) => lerp(a, b, (cx + 1 - a.x) / (b.x - a.x))],
    [(p) => p.y - cy, (a, b) => lerp(a, b, (cy - a.y) / (b.y - a.y))],
    [(p) => cy + 1 - p.y, (a, b) => lerp(a, b, (cy + 1 - a.y) / (b.y - a.y))],
  ];
  for (const [inside, cut] of edges) {
    const next: Pt[] = [];
    for (let i = 0; i < out.length; i++) {
      const a = out[i];
      const b = out[(i + 1) % out.length];
      const ia = inside(a) >= 0;
      const ib = inside(b) >= 0;
      if (ia) next.push(a);
      if (ia !== ib) next.push(cut(a, b));
    }
    out = next;
    if (!out.length) break;
  }
  return out;
}
const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

export interface Cell {
  x: number;
  y: number;
  /** How much of this square the shape covers, 0 to 1. */
  part: number;
}

/** Count squares: every grid square the shape covers, whole or in part. */
export function squares(poly: Pt[]) {
  const xs = poly.map((p) => p.x);
  const ys = poly.map((p) => p.y);
  const cells: Cell[] = [];
  for (let x = Math.floor(Math.min(...xs)); x < Math.ceil(Math.max(...xs)); x++)
    for (let y = Math.floor(Math.min(...ys)); y < Math.ceil(Math.max(...ys)); y++) {
      const part = polyArea(clipToCell(poly, x, y));
      if (part > 1e-9) cells.push({ x, y, part: Math.min(1, part) });
    }
  const whole = cells.filter((c) => c.part > 1 - 1e-9).length;
  const pieces = cells.filter((c) => c.part <= 1 - 1e-9);
  const pieceArea = pieces.reduce((s, c) => s + c.part, 0);
  return { cells, whole, parts: pieces.length, pieceArea };
}

/** Numbers like 12 or 12.5. */
export function num(v: number) {
  return `${Math.round(v * 100) / 100}`;
}

/** The working for a shape's area, with brackets for the step done first. */
export function working(sh: Shape) {
  if (sh.kind === "shear") return `${sh.b} × ${sh.h} = ${num(area(sh))}`;
  if (sh.kind === "triangle") return `(${sh.b} × ${sh.h}) ÷ 2 = ${num(area(sh))}`;
  return `((${sh.a} + ${sh.c}) × ${sh.h}) ÷ 2 = ${num(area(sh))}`;
}

/** Challenge: a plot to mark out on the board. */
export interface Plot {
  name: string;
  brief: string;
  kind: ShapeKind;
  area: number;
  /** Controls that must have these values. */
  fixed: Record<string, number>;
  /** The parallelogram must lean (not a rectangle). */
  lean?: boolean;
}

export function plotOk(plot: Plot, sh: Shape) {
  if (sh.kind !== plot.kind) return false;
  if (Math.abs(area(sh) - plot.area) > 1e-9) return false;
  for (const [k, v] of Object.entries(plot.fixed)) if ((sh as unknown as Record<string, number>)[k] !== v) return false;
  if (plot.lean && sh.kind === "shear" && sh.s === 0) return false;
  return true;
}

/** Every shape the controls can make for a plot's kind (used to check a plot can be solved). */
export function allShapes(kind: ShapeKind): Shape[] {
  const ctrls = CONTROLS[kind];
  const out: Shape[] = [];
  const walk = (i: number, acc: Record<string, number>) => {
    if (i === ctrls.length) {
      const sh = { kind, ...acc } as Shape;
      if (fits(sh)) out.push(sh);
      return;
    }
    for (let v = ctrls[i].min; v <= ctrls[i].max; v++) walk(i + 1, { ...acc, [ctrls[i].key]: v });
  };
  walk(0, {});
  return out;
}

/** What is wrong with a try, in a short hint. */
export function plotHint(plot: Plot, sh: Shape) {
  for (const [k, v] of Object.entries(plot.fixed)) {
    const got = (sh as unknown as Record<string, number>)[k];
    if (got !== v) {
      const c = CONTROLS[plot.kind].find((x) => x.key === k)!;
      return `The ${c.label.toLowerCase()} must be ${v}, not ${got}.`;
    }
  }
  if (plot.lean && sh.kind === "shear" && sh.s === 0) return "That is a rectangle. The plot must lean: slide the top.";
  const a = area(sh);
  return `This plot is ${num(a)} square units, ${a > plot.area ? "too big" : "too small"}. You need ${num(plot.area)}.`;
}
