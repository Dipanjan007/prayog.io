"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import {
  CONTROLS,
  DRAG_KEY,
  GRID,
  START,
  area,
  copyPolygon,
  num,
  originX,
  plotHint,
  plotOk,
  polygon,
  range,
  setValue,
  squares,
  working,
  type Plot,
  type Pt,
  type Shape,
  type ShapeKind,
} from "@/lib/sim/area";

export type AreaReading = { mode: ShapeKind; shape: Shape; area: number; copy: boolean } | { mode: "plot"; ok: boolean };

interface Props {
  onReading?: (r: AreaReading) => void;
  /** Challenge: the plot to mark out. The area stays hidden until the student marks it. */
  plot?: Plot | null;
}

const MODES: { id: ShapeKind; label: string }[] = [
  { id: "shear", label: "Shear" },
  { id: "triangle", label: "Triangle" },
  { id: "trapezium", label: "Trapezium" },
];

const key = (sh: Shape) => JSON.stringify(sh);
const val = (sh: Shape, k: string) => (sh as unknown as Record<string, number>)[k];

export default function AreaLab({ onReading, plot = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<ShapeKind>("shear");
  const [shapes, setShapes] = useState<Record<ShapeKind, Shape>>(START);
  const [copy, setCopy] = useState(false);
  const [marked, setMarked] = useState<{ at: string; ok: boolean } | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const drag = useRef<{ x: number; v: number; u: number } | null>(null);
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const active: ShapeKind = plot ? plot.kind : mode;
  const shape = shapes[active];
  const a = area(shape);
  const showCopy = copy && active !== "shear";
  // In the challenge the area shows only for the plot just marked.
  const revealed = !plot || (marked !== null && marked.at === key(shape));

  useEffect(() => {
    if (plot) return;
    onReadingRef.current?.({ mode: active, shape, area: area(shape), copy: copy && active !== "shear" });
  }, [plot, active, shape, copy]);

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
    draw(ctx, size.w, size.h, shape, showCopy, revealed);
  }, [size, shape, showCopy, revealed]);

  const update = (k: string, v: number) => setShapes((s) => ({ ...s, [active]: setValue(s[active], k, v) }));

  const unit = () => layout(size.w, size.h).u;
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drag.current = { x: e.clientX, v: val(shape, DRAG_KEY[active]), u: unit() };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d) return;
    update(DRAG_KEY[active], d.v + Math.round((e.clientX - d.x) / d.u));
  };
  const onUp = () => {
    drag.current = null;
  };

  const mark = () => {
    if (!plot) return;
    const ok = plotOk(plot, shape);
    setMarked({ at: key(shape), ok });
    onReadingRef.current?.({ mode: "plot", ok });
  };

  const sq = squares(polygon(shape));
  const dragName = CONTROLS[active].find((c) => c.key === DRAG_KEY[active])!.label.toLowerCase();

  return (
    <div className="flex flex-col gap-3 select-none">
      {!plot && (
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`rounded-xl py-2 ${active === m.id ? "bg-white/10 text-white" : "text-white/50"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="h-64 w-full cursor-grab touch-none rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={`A geoboard with a ${active === "shear" ? (val(shape, "s") === 0 ? "rectangle" : "parallelogram") : active}. ${
          revealed ? `Area ${working(shape)} square units.` : "Area hidden until you mark the plot."
        } Drag sideways to move the ${dragName}.`}
      />

      <div className="grid grid-cols-3 gap-2 text-center">
        <Readout label="Area" value={revealed ? `${num(a)} sq units` : "?"} colour="text-lime-200" />
        <Readout label="Whole squares" value={revealed ? `${sq.whole}` : "?"} colour="text-cyan-200" />
        <Readout label="Pieces" value={revealed ? (sq.parts ? `${sq.parts} worth ${num(sq.pieceArea)}` : "0") : "?"} colour="text-violet-200" />
      </div>
      {revealed && (
        <p className="text-center text-xs text-white/50">
          {sq.whole} whole {sq.parts ? `+ pieces worth ${num(sq.pieceArea)} ` : ""}= {num(a)} · formula: {working(shape)}
        </p>
      )}

      {CONTROLS[active].map((c) => {
        const [lo, hi] = range(shape, c.key);
        return (
          <Stepper
            key={c.key}
            label={c.label}
            thing={c.thing}
            value={val(shape, c.key)}
            min={lo}
            max={hi}
            colour={c.key === DRAG_KEY[active] ? "#f472b6" : "#22d3ee"}
            onChange={(v) => update(c.key, v)}
          />
        );
      })}

      <div className="flex flex-wrap gap-2">
        {active !== "shear" && (
          <button className="btn-ghost flex-1 !py-2 text-sm" onClick={() => setCopy((c) => !c)} aria-pressed={copy}>
            {copy ? "Remove the copy" : "Add a copy"}
          </button>
        )}
        {plot && (
          <button className="btn-primary flex-1 !py-2 text-sm" onClick={mark}>
            Mark the plot
          </button>
        )}
      </div>

      {plot && marked !== null && revealed && (
        <p className={`text-center text-sm ${marked.ok ? "text-lime-300" : "text-amber-200"}`}>
          {marked.ok ? `Plot approved! ${working(shape)} square units.` : plotHint(plot, shape)}
        </p>
      )}
    </div>
  );
}

function Readout({ label, value, colour }: { label: string; value: string; colour: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] tracking-wider text-white/50">{label}</div>
      <div className={`font-display text-sm tabular-nums sm:text-lg ${colour}`}>{value}</div>
    </div>
  );
}

function Stepper(p: { label: string; thing: string; colour: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-1.5">
      <button
        className="h-9 w-9 shrink-0 rounded-lg border border-white/15 text-lg text-white/80 disabled:opacity-30"
        onClick={() => p.onChange(p.value - 1)}
        disabled={p.value <= p.min}
        aria-label={`Less ${p.thing}`}
      >
        −
      </button>
      <label className="min-w-0 flex-1">
        <div className="flex justify-between text-sm">
          <span style={{ color: p.colour }}>{p.label}</span>
          <span className="tabular-nums text-white">{p.value < 0 ? `−${-p.value}` : p.value}</span>
        </div>
        <input
          type="range"
          className="range mt-1 w-full"
          min={p.min}
          max={p.max}
          step={1}
          value={p.value}
          onChange={(e) => p.onChange(Number(e.target.value))}
          aria-label={p.label}
        />
      </label>
      <button
        className="h-9 w-9 shrink-0 rounded-lg border border-white/15 text-lg text-white/80 disabled:opacity-30"
        onClick={() => p.onChange(p.value + 1)}
        disabled={p.value >= p.max}
        aria-label={`More ${p.thing}`}
      >
        +
      </button>
    </div>
  );
}

const TOP = 26;
const BOTTOM = 24;

function layout(w: number, h: number) {
  const u = Math.max(4, Math.min((w - 24) / GRID.w, (h - TOP - BOTTOM) / GRID.h));
  const gx0 = (w - u * GRID.w) / 2;
  const gy0 = TOP + ((h - TOP - BOTTOM) + u * GRID.h) / 2;
  return { u, gx0, gy0 };
}

function pill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, colour: string, w: number) {
  ctx.font = "12px system-ui, sans-serif";
  const tw = ctx.measureText(text).width;
  const bx = Math.max(2, Math.min(w - tw - 10, x - tw / 2 - 4));
  ctx.fillStyle = "rgba(10,13,28,0.85)";
  ctx.fillRect(bx, y - 9, tw + 8, 17);
  ctx.fillStyle = colour;
  ctx.textAlign = "left";
  ctx.fillText(text, bx + 4, y + 4);
}

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, sh: Shape, showCopy: boolean, revealed: boolean) {
  const { u, gx0, gy0 } = layout(w, h);
  const ox = originX(sh);
  const X = (x: number) => gx0 + (ox + x) * u;
  const Y = (y: number) => gy0 - y * u;
  const path = (poly: Pt[]) => {
    ctx.beginPath();
    poly.forEach((p, i) => (i ? ctx.lineTo(X(p.x), Y(p.y)) : ctx.moveTo(X(p.x), Y(p.y))));
    ctx.closePath();
  };

  // Faint squares and pegs.
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID.w; i++) {
    ctx.beginPath();
    ctx.moveTo(gx0 + i * u, Y(0));
    ctx.lineTo(gx0 + i * u, Y(GRID.h));
    ctx.stroke();
  }
  for (let j = 0; j <= GRID.h; j++) {
    ctx.beginPath();
    ctx.moveTo(gx0, Y(j));
    ctx.lineTo(gx0 + GRID.w * u, Y(j));
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  for (let i = 0; i <= GRID.w; i++)
    for (let j = 0; j <= GRID.h; j++) {
      ctx.beginPath();
      ctx.arc(gx0 + i * u, Y(j), 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

  const poly = polygon(sh);

  // Whole squares and pieces, coloured so they can be counted.
  if (revealed)
    for (const c of squares(poly).cells) {
      ctx.fillStyle = c.part > 1 - 1e-9 ? "rgba(34,211,238,0.22)" : "rgba(167,139,250,0.28)";
      ctx.fillRect(X(c.x) + 1, Y(c.y + 1) + 1, u - 2, u - 2);
    }

  // The copy, turned half a turn.
  const cp = showCopy ? copyPolygon(sh) : null;
  if (cp) {
    path(cp);
    ctx.fillStyle = "rgba(244,114,182,0.16)";
    ctx.fill();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "#f472b6";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // The rubber band.
  path(poly);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = "rgba(34,211,238,0.06)";
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  path(poly);
  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.stroke();

  // Height: a dashed line straight down from the top corner, with the base stretched to meet it.
  const top = sh.kind === "shear" ? sh.s : sh.kind === "triangle" ? sh.p : sh.o;
  const baseLen = sh.kind === "trapezium" ? sh.a : sh.b;
  if (top < 0 || top > baseLen) {
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(X(top < 0 ? top : baseLen), Y(0));
    ctx.lineTo(X(top < 0 ? 0 : top), Y(0));
    ctx.stroke();
  }
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(X(top), Y(sh.h));
  ctx.lineTo(X(top), Y(0));
  ctx.stroke();
  ctx.setLineDash([]);
  // Right-angle mark at the foot.
  const dir = top <= baseLen / 2 ? 1 : -1;
  const m = Math.min(8, u * 0.35);
  ctx.strokeStyle = "#fbbf24";
  ctx.beginPath();
  ctx.moveTo(X(top) + dir * m, Y(0));
  ctx.lineTo(X(top) + dir * m, Y(0) - m);
  ctx.lineTo(X(top), Y(0) - m);
  ctx.stroke();

  // Drag handle on the top corner(s).
  const handles = sh.kind === "triangle" ? [poly[2]] : [poly[2], poly[3]];
  for (const p of handles) {
    ctx.fillStyle = "#f472b6";
    ctx.beginPath();
    ctx.arc(X(p.x), Y(p.y), Math.max(5, Math.min(8, u * 0.3)), 0, Math.PI * 2);
    ctx.fill();
  }

  // Labels.
  pill(ctx, `h = ${sh.h}`, X(top) + dir * 26, Y(sh.h / 2), "#fbbf24", w);
  const bName = sh.kind === "trapezium" ? "p" : "b";
  pill(ctx, `${bName} = ${baseLen}`, X(baseLen / 2), Y(0) + 13, "#22d3ee", w);
  // The top side's label goes above it, unless that would run into the title.
  if (sh.kind === "trapezium") pill(ctx, `q = ${sh.c}`, X(sh.o + sh.c / 2), Y(sh.h) - 14 > TOP + 8 ? Y(sh.h) - 14 : Y(sh.h) + 14, "#22d3ee", w);

  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = "#bef264";
  const name = sh.kind === "shear" ? (sh.s === 0 ? "Rectangle" : "Parallelogram") : sh.kind === "triangle" ? "Triangle" : "Trapezium";
  const extra = cp && revealed ? ` · both: ${num(2 * area(sh))}` : "";
  ctx.fillText(`${name}: ${revealed ? `${working(sh)} sq units` : "area ?"}${extra}`, 8, 17, w - 16);
  ctx.textAlign = "left";
}
