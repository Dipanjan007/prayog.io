"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import { COEF, GRID, TOTAL, eqText, isSolution, lhs, num, ptText, snap, workText, xIntercept, yIntercept, type Eq, type Pt, type Puzzle } from "@/lib/sim/twovar";

export type LineReading =
  | { mode: "free"; eq: Eq; p: Pt; value: number; on: boolean; showLine: boolean }
  | { mode: "check"; p: Pt; ok: boolean };

interface Props {
  onReading?: (r: LineReading) => void;
  /** Challenge: two conditions drawn as two lines; find the point on both. */
  puzzle?: Puzzle | null;
}

const COL = { line: "#22d3ee", line2: "#f472b6", p: "#facc15", sol: "#a3e635", icpt: "#a78bfa" };
const same = (p: Pt, q: Pt) => p.x === q.x && p.y === q.y;

export default function SolutionLine({ onReading, puzzle = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [eq, setEq] = useState<Eq>({ a: 2, b: 3, c: 12 });
  // Start off the line, so finding a solution is the student's move.
  const [p, setP] = useState<Pt>({ x: 1, y: 1 });
  const [showLine, setShowLine] = useState(false);
  const [found, setFound] = useState<Pt[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const dragging = useRef(false);
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const degenerate = eq.a === 0 && eq.b === 0;
  const on = !degenerate && isSolution(eq, p);
  const value = lhs(eq, p);

  useEffect(() => {
    if (puzzle) return;
    onReadingRef.current?.({ mode: "free", eq, p, value: lhs(eq, p), on: !(eq.a === 0 && eq.b === 0) && isSolution(eq, p), showLine });
  }, [puzzle, eq, p, showLine]);

  // Remember the solutions found for this equation, so they stay as dots on the grid.
  useEffect(() => {
    if (puzzle || !on) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keeps a trail of the points tried
    setFound((f) => (f.some((q) => same(q, p)) ? f : [...f, p]));
  }, [puzzle, on, p]);

  useEffect(() => {
    const el = canvasRef.current!;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !size.w) return;
    const ctx = fitCanvas(el, size.w, size.h);
    ctx.clearRect(0, 0, size.w, size.h);
    const g = grid(size.w, size.h);
    drawGrid(ctx, g);
    // Line labels keep clear of P and of P's coordinates in the top-right corner.
    const avoid = [
      { x: size.w - 110, y: 0, w: 110, h: 26 },
      { x: g.X(p.x) - 10, y: g.Y(p.y) - 10, w: 20, h: 20 },
    ];
    if (puzzle) {
      drawLine(ctx, g, puzzle.eqs[0], COL.line);
      drawLine(ctx, g, puzzle.eqs[1], COL.line2);
      drawTags(ctx, g, puzzle.eqs, [COL.line, COL.line2], avoid);
    } else if (!degenerate) {
      if (showLine) {
        drawLine(ctx, g, eq, COL.line);
        drawTags(ctx, g, [eq], [COL.line], avoid);
        for (const q of [xIntercept(eq), yIntercept(eq)]) {
          if (!q || q.x < GRID.min || q.x > GRID.max || q.y < GRID.min || q.y > GRID.max) continue;
          ctx.strokeStyle = COL.icpt;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(g.X(q.x), g.Y(q.y), 9, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      for (const q of found) {
        if (!isSolution(eq, q)) continue;
        ctx.fillStyle = COL.sol;
        ctx.beginPath();
        ctx.arc(g.X(q.x), g.Y(q.y), 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // The point P, with its coordinates in the top-right corner, clear of every line in the lab.
    const good = puzzle ? checked === true : on;
    ctx.fillStyle = good ? COL.sol : COL.p;
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(g.X(p.x), g.Y(p.y), 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#0a0d1c";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillStyle = COL.p;
    ctx.fillText(`P ${ptText(p)}`, size.w - 10, 18);
    ctx.textAlign = "left";
  }, [size, eq, p, showLine, found, puzzle, degenerate, on, checked]);

  const move = (q: Pt) => {
    setP((old) => (same(old, q) ? old : q));
    setChecked(null);
  };
  const toPt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const g = grid(size.w, size.h);
    return snap(g.ix(e.clientX - r.left), g.iy(e.clientY - r.top));
  };
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragging.current = true;
    move(toPt(e));
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragging.current) move(toPt(e));
  };
  const onUp = () => {
    dragging.current = false;
  };
  const setCoef = (k: keyof Eq) => (v: number) => {
    setEq((old) => ({ ...old, [k]: v }));
    setFound([]);
  };

  const check = () => {
    if (!puzzle) return;
    const ok = puzzle.eqs.every((e) => isSolution(e, p));
    setChecked(ok);
    onReadingRef.current?.({ mode: "check", p, ok });
  };

  return (
    <div className="flex flex-col gap-3 select-none">
      <canvas
        ref={canvasRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="h-72 w-full touch-none cursor-crosshair rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={
          puzzle
            ? `Lines ${eqText(puzzle.eqs[0])} and ${eqText(puzzle.eqs[1])}; P at ${ptText(p)}`
            : `P at ${ptText(p)}; ${eqText(eq)} gives ${num(value)} there${on ? ", a solution" : ""}${showLine ? "; the line is shown" : ""}`
        }
      />

      {puzzle ? (
        <div className="grid grid-cols-2 gap-2 text-center">
          {puzzle.eqs.map((e, i) => {
            const ok = isSolution(e, p);
            return (
              <div key={i} className={`rounded-2xl border px-2 py-2 ${ok ? "border-lime-300/40 bg-lime-300/10" : "border-white/10 bg-white/[0.03]"}`}>
                <div className="text-[11px] tracking-wider" style={{ color: i ? COL.line2 : COL.line }}>
                  {eqText(e)}
                </div>
                <div className="text-xs text-white/60 tabular-nums">{workText(e, p)}</div>
                <div className={`font-display text-base tabular-nums ${ok ? "text-lime-200" : "text-white"}`}>
                  = {num(lhs(e, p))} {ok ? "✓" : `≠ ${num(e.c)}`}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div
            className={`rounded-2xl border px-3 py-2 text-center text-sm tabular-nums ${on ? "border-lime-300/40 bg-lime-300/10 text-lime-100" : "border-white/10 bg-white/[0.03] text-white/80"}`}
          >
            {degenerate ? (
              "With a = 0 and b = 0 there is no x or y left. Make a or b bigger than 0."
            ) : (
              <>
                <div className="text-xs text-white/50">{eqText(eq)} at P</div>
                {workText(eq, p)} = {num(value)} {on ? `✓ a solution` : `≠ ${num(eq.c)}`}
              </>
            )}
          </div>
          {!degenerate && (
            <p className="text-center text-xs text-white/50">
              {eq.a > 0 && eq.b > 0 ? `Shop story: x pens at ₹${eq.a * 10} and y notebooks at ₹${eq.b * 10} cost ₹${eq.c * 10}. ` : ""}
              Solutions found: {found.filter((q) => isSolution(eq, q)).length}
            </p>
          )}
        </>
      )}

      <div className="grid grid-cols-4 gap-2">
        {(
          [
            ["x − 1", -1, 0],
            ["x + 1", 1, 0],
            ["y − 1", 0, -1],
            ["y + 1", 0, 1],
          ] as const
        ).map(([l, dx, dy]) => (
          <button key={l} onClick={() => move(snap(p.x + dx, p.y + dy))} className="h-9 rounded-xl border border-white/10 px-1 text-sm whitespace-nowrap text-white/80 tabular-nums">
            {l}
          </button>
        ))}
      </div>

      {puzzle ? (
        <>
          <button className="btn-primary !py-2 text-sm" onClick={check}>
            Check P {ptText(p)}
          </button>
          {checked !== null && (
            <p className={`text-center text-sm ${checked ? "text-lime-300" : "text-amber-200"}`}>
              {checked
                ? `Both true! ${p.x} ${puzzle.xName} and ${p.y} ${puzzle.yName}.`
                : puzzle.eqs.some((e) => isSolution(e, p))
                  ? "That point is on one line but not the other. Slide along the line you are on."
                  : "That point is on neither line. Start on one line, then cross-check the other."}
            </p>
          )}
        </>
      ) : (
        <>
          <button
            onClick={() => setShowLine((s) => !s)}
            className={`rounded-xl border px-3 py-2 text-sm ${showLine ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
          >
            {showLine ? "Hide the line" : "Show the line"}
          </button>
          <Slider label="a, the number times x" colour={COL.line} value={eq.a} min={COEF.min} max={COEF.max} onChange={setCoef("a")} />
          <Slider label="b, the number times y" colour={COL.line2} value={eq.b} min={COEF.min} max={COEF.max} onChange={setCoef("b")} />
          <Slider label="c, the total" colour={COL.p} value={eq.c} min={TOTAL.min} max={TOTAL.max} onChange={setCoef("c")} />
        </>
      )}
      <p className="text-center text-xs text-white/40">Tap or drag on the grid, or use the buttons. P sits on whole-number points.</p>
    </div>
  );
}

function Slider(p: { label: string; colour: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2">
      <div className="flex justify-between gap-2 text-sm">
        <span style={{ color: p.colour }}>{p.label}</span>
        <span className="tabular-nums text-white">{p.value}</span>
      </div>
      <input type="range" aria-label={p.label} className="range mt-1 w-full" min={p.min} max={p.max} step={1} value={p.value} onChange={(e) => p.onChange(Number(e.target.value))} />
    </label>
  );
}

type Grid = { k: number; X: (x: number) => number; Y: (y: number) => number; ix: (px: number) => number; iy: (py: number) => number };

function grid(w: number, h: number): Grid {
  const span = GRID.max - GRID.min;
  // Room for axis numbers below and to the left, and for P's coordinates at the top.
  const k = Math.min((w - 34) / (span + 0.6), (h - 46) / (span + 0.6));
  const ox = (w - span * k) / 2 + 8;
  const oy = (h - span * k) / 2 + 12 + span * k;
  return {
    k,
    X: (x) => ox + (x - GRID.min) * k,
    Y: (y) => oy - (y - GRID.min) * k,
    ix: (px) => (px - ox) / k + GRID.min,
    iy: (py) => (oy - py) / k + GRID.min,
  };
}

function drawGrid(ctx: CanvasRenderingContext2D, g: Grid) {
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = GRID.min; i <= GRID.max; i++) {
    ctx.moveTo(g.X(i), g.Y(GRID.min));
    ctx.lineTo(g.X(i), g.Y(GRID.max));
    ctx.moveTo(g.X(GRID.min), g.Y(i));
    ctx.lineTo(g.X(GRID.max), g.Y(i));
  }
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(g.X(GRID.min), g.Y(0));
  ctx.lineTo(g.X(GRID.max), g.Y(0));
  ctx.moveTo(g.X(0), g.Y(GRID.min));
  ctx.lineTo(g.X(0), g.Y(GRID.max));
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "10px system-ui, sans-serif";
  for (let i = GRID.min; i <= GRID.max; i += 2) {
    if (!i) continue;
    ctx.textAlign = "center";
    ctx.fillText(num(i), g.X(i), g.Y(0) + 12);
    ctx.textAlign = "right";
    ctx.fillText(num(i), g.X(0) - 4, g.Y(i) + 3);
  }
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "italic 12px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("x", g.X(GRID.max) + 4, g.Y(0) + 4);
  ctx.fillText("y", g.X(0) + 6, g.Y(GRID.max) - 3);
}

/** The two ends of the line inside the grid square. */
function ends(e: Eq): [Pt, Pt] | null {
  const pts: Pt[] = [];
  const { min, max } = GRID;
  if (e.b !== 0)
    for (const x of [min, max]) {
      const y = (e.c - e.a * x) / e.b;
      if (y >= min - 1e-9 && y <= max + 1e-9) pts.push({ x, y });
    }
  if (e.a !== 0)
    for (const y of [min, max]) {
      const x = (e.c - e.b * y) / e.a;
      if (x >= min - 1e-9 && x <= max + 1e-9) pts.push({ x, y });
    }
  if (pts.length < 2) return null;
  // Pick the two points furthest apart (corners can appear twice).
  let best: [Pt, Pt] = [pts[0], pts[1]];
  let bd = -1;
  for (const p of pts)
    for (const q of pts) {
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d > bd) {
        bd = d;
        best = [p, q];
      }
    }
  return best;
}

function drawLine(ctx: CanvasRenderingContext2D, g: Grid, e: Eq, colour: string) {
  const se = ends(e);
  if (!se) return;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = colour;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(g.X(se[0].x), g.Y(se[0].y));
  ctx.lineTo(g.X(se[1].x), g.Y(se[1].y));
  ctx.stroke();
  ctx.shadowBlur = 0;
}

type Box = { x: number; y: number; w: number; h: number };

/** Does the segment p→q (pixels) pass through the box, grown by a small margin? */
function hits(b: Box, p: Pt, q: Pt, m = 3) {
  const n = Math.max(2, Math.ceil(Math.hypot(q.x - p.x, q.y - p.y) / 3));
  for (let i = 0; i <= n; i++) {
    const x = p.x + ((q.x - p.x) * i) / n;
    const y = p.y + ((q.y - p.y) * i) / n;
    if (x > b.x - m && x < b.x + b.w + m && y > b.y - m && y < b.y + b.h + m) return true;
  }
  return false;
}

/**
 * Write each equation beside its own line, at the first spot that is inside the grid,
 * clear of every line, clear of the other tags and clear of P's coordinates at the top right.
 */
function drawTags(ctx: CanvasRenderingContext2D, g: Grid, eqs: Eq[], colours: string[], avoid: Box[]) {
  ctx.font = "bold 11px system-ui, sans-serif";
  const segs = eqs.map((e) => {
    const se = ends(e);
    return se ? se.map((q) => ({ x: g.X(q.x), y: g.Y(q.y) })) : null;
  });
  const placed: Box[] = [...avoid];
  const left = g.X(GRID.min);
  const right = g.X(GRID.max);
  const topY = g.Y(GRID.max);
  const bottom = g.Y(GRID.min);
  eqs.forEach((e, i) => {
    const s = segs[i];
    if (!s) return;
    const text = eqText(e);
    const w = ctx.measureText(text).width;
    const h = 11;
    const len = Math.hypot(s[1].x - s[0].x, s[1].y - s[0].y) || 1;
    // Unit normal to the line, in pixels.
    const nx = -(s[1].y - s[0].y) / len;
    const ny = (s[1].x - s[0].x) / len;
    let pick: Box | null = null;
    for (const t of [0.12, 0.88, 0.3, 0.7, 0.5]) {
      const ax = s[0].x + (s[1].x - s[0].x) * t;
      const ay = s[0].y + (s[1].y - s[0].y) * t;
      for (const side of [1, -1]) {
        // Centre the box 12 px off the line, on this side.
        const d = 6 + (w / 2) * Math.abs(nx) + (h / 2) * Math.abs(ny);
        const cx = ax + side * nx * d;
        const cy = ay + side * ny * d;
        const b = { x: cx - w / 2, y: cy - h / 2, w, h };
        if (b.x < left + 2 || b.x + b.w > right - 2 || b.y < topY + 2 || b.y + b.h > bottom - 2) continue;
        if (segs.some((q) => q && hits(b, q[0], q[1]))) continue;
        if (placed.some((o) => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y)) continue;
        pick = b;
        break;
      }
      if (pick) break;
    }
    if (!pick) return;
    placed.push(pick);
    ctx.fillStyle = colours[i];
    ctx.textAlign = "left";
    ctx.fillText(text, pick.x, pick.y + h - 1);
  });
}
