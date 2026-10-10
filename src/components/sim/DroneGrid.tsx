"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import { LIMIT, QUADRANT_SIGNS, distance, fmt, midpoint, place, reflect, same, snap, type Delivery, type GridPt, type Mirror, type Place } from "@/lib/sim/coordinates";

export type GridMode = "plot" | "distance";

export type GridReading =
  | { mode: "plot"; p: GridPt; place: Place; mirror: Mirror | null }
  | { mode: "distance"; a: GridPt; b: GridPt; dist: number; mid: GridPt }
  | { mode: "drop"; p: GridPt; ok: boolean };

interface Props {
  onReading?: (r: GridReading) => void;
  /** Challenge: fly to an address and drop the parcel. Mirrors are hidden. */
  delivery?: Delivery | null;
}

const COL = { p: "#22d3ee", a: "#22d3ee", b: "#f472b6", m: "#facc15", img: "#a78bfa" };
const placeText = (pl: Place) =>
  pl === "origin" ? "at the origin" : pl === "x-axis" || pl === "y-axis" ? `on the ${pl}` : `in Quadrant ${pl} ${QUADRANT_SIGNS[pl]}`;
const num = (v: number) => (v < 0 ? `−${Math.abs(v)}` : `${v}`);

export default function DroneGrid({ onReading, delivery = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<GridMode>("plot");
  const [p, setP] = useState<GridPt>({ x: 0, y: 0 });
  const [mirror, setMirror] = useState<Mirror | null>(null);
  const [ab, setAb] = useState<{ a: GridPt; b: GridPt }>({ a: { x: -2, y: -1 }, b: { x: 4, y: 2 } });
  const [sel, setSel] = useState<"a" | "b">("b");
  const [dropped, setDropped] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const dragging = useRef<null | "p" | "a" | "b">(null);
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: GridMode = delivery ? "plot" : mode;
  const image = mirror && !delivery ? reflect(p, mirror) : null;
  const dist = distance(ab.a, ab.b);
  const mid = midpoint(ab.a, ab.b);

  useEffect(() => {
    if (delivery) return;
    if (activeMode === "plot") onReadingRef.current?.({ mode: "plot", p, place: place(p), mirror });
    else onReadingRef.current?.({ mode: "distance", a: ab.a, b: ab.b, dist, mid });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dist and mid come from ab
  }, [delivery, activeMode, p, mirror, ab]);

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
    drawGrid(ctx, g, size.w);
    if (activeMode === "plot") {
      delivery?.marks.forEach((m) => landmark(ctx, g, m.at, m.label));
      if (image && !same(image, p)) {
        ctx.strokeStyle = COL.img + "99";
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(g.X(p.x), g.Y(p.y));
        ctx.lineTo(g.X(image.x), g.Y(image.y));
        ctx.stroke();
        ctx.setLineDash([]);
        dot(ctx, g, image, COL.img, `P′ ${fmt(image)}`, false);
      }
      drone(ctx, g, p, dropped);
    } else {
      // The right triangle under AB: across, then up.
      const corner = { x: ab.b.x, y: ab.a.y };
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(g.X(ab.a.x), g.Y(ab.a.y));
      ctx.lineTo(g.X(corner.x), g.Y(corner.y));
      ctx.lineTo(g.X(ab.b.x), g.Y(ab.b.y));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = "11px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.textAlign = "center";
      const dx = ab.b.x - ab.a.x;
      const dy = ab.b.y - ab.a.y;
      if (dx) ctx.fillText(`${Math.abs(dx)}`, g.X((ab.a.x + corner.x) / 2), g.Y(corner.y) + (dy >= 0 ? 14 : -6));
      if (dy) ctx.fillText(`${Math.abs(dy)}`, g.X(corner.x) + (dx >= 0 ? 10 : -10), g.Y((corner.y + ab.b.y) / 2) + 4);
      ctx.strokeStyle = "#a3e635";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(g.X(ab.a.x), g.Y(ab.a.y));
      ctx.lineTo(g.X(ab.b.x), g.Y(ab.b.y));
      ctx.stroke();
      dot(ctx, g, mid, COL.m, "M", false);
      dot(ctx, g, ab.a, COL.a, "A", sel === "a");
      dot(ctx, g, ab.b, COL.b, "B", sel === "b");
      ctx.textAlign = "left";
    }
  }, [size, activeMode, p, image, ab, mid, sel, delivery, dropped]);

  const toPt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const g = grid(size.w, size.h);
    return snap((e.clientX - r.left - g.cx) / g.k, -(e.clientY - r.top - g.cy) / g.k);
  };
  const put = (who: "p" | "a" | "b", q: GridPt) => {
    if (who === "p") {
      setP((old) => (same(old, q) ? old : q));
      setDropped(null);
    } else setAb((old) => (same(old[who], q) ? old : { ...old, [who]: q }));
  };
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const q = toPt(e);
    let who: "p" | "a" | "b" = "p";
    if (activeMode === "distance") {
      // Grab whichever of A and B is nearer to the finger.
      who = distance(q, ab.a) < distance(q, ab.b) ? "a" : "b";
      setSel(who);
    }
    dragging.current = who;
    put(who, q);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragging.current) put(dragging.current, toPt(e));
  };
  const onUp = () => {
    dragging.current = null;
  };

  const target = activeMode === "plot" ? p : ab[sel];
  const who = activeMode === "plot" ? "p" : sel;
  const step = (dx: number, dy: number) => put(who, snap(target.x + dx, target.y + dy));

  const drop = () => {
    if (!delivery) return;
    const ok = same(p, delivery.target);
    setDropped(ok);
    onReadingRef.current?.({ mode: "drop", p, ok });
  };

  return (
    <div className="flex flex-col gap-3 select-none">
      {!delivery && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["plot", "distance"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${activeMode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m === "plot" ? "Plot" : "Distance"}
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
        className="h-72 w-full touch-none cursor-crosshair rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={
          activeMode === "plot"
            ? `Drone at ${fmt(p)}, ${placeText(place(p))}${image ? `; mirror image ${fmt(image)}` : ""}`
            : `A at ${fmt(ab.a)}, B at ${fmt(ab.b)}, ${dist.toFixed(2)} units apart, midpoint ${fmt(mid)}`
        }
      />

      {activeMode === "plot" ? (
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
            <div className="text-[11px] uppercase tracking-wider text-white/50">Drone</div>
            <div className="font-display text-lg tabular-nums text-cyan-200">{fmt(p)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
            <div className="text-[11px] uppercase tracking-wider text-white/50">Where</div>
            <div className="text-sm text-white">{placeText(place(p))}</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
            <div className="text-[11px] uppercase tracking-wider text-white/50">A and B</div>
            <div className="text-sm tabular-nums">
              <span className="text-cyan-200">{fmt(ab.a)}</span> <span className="text-pink-200">{fmt(ab.b)}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
            <div className="text-[11px] uppercase tracking-wider text-white/50">AB</div>
            <div className="font-display text-lg tabular-nums text-lime-200">{Number.isInteger(dist) ? dist : dist.toFixed(2)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
            <div className="text-[11px] uppercase tracking-wider text-white/50">Midpoint M</div>
            <div className="font-display text-lg tabular-nums text-yellow-200">{fmt(mid)}</div>
          </div>
        </div>
      )}
      {activeMode === "distance" && (
        <p className="rounded-2xl bg-white/[0.03] px-3 py-2 text-center text-xs text-white/60 tabular-nums">
          AB = √(({num(ab.b.x)} − {ab.a.x < 0 ? `(${num(ab.a.x)})` : ab.a.x})² + ({num(ab.b.y)} − {ab.a.y < 0 ? `(${num(ab.a.y)})` : ab.a.y})²) = √(
          {(ab.b.x - ab.a.x) ** 2} + {(ab.b.y - ab.a.y) ** 2}) = √{(ab.b.x - ab.a.x) ** 2 + (ab.b.y - ab.a.y) ** 2}
        </p>
      )}

      {activeMode === "distance" && (
        <div className="grid grid-cols-2 gap-2">
          {(["a", "b"] as const).map((n) => (
            <button
              key={n}
              onClick={() => setSel(n)}
              className={`h-9 rounded-xl border px-3 text-sm ${sel === n ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
            >
              Move {n.toUpperCase()}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-4 gap-2">
        {[
          ["x − 1", -1, 0],
          ["x + 1", 1, 0],
          ["y − 1", 0, -1],
          ["y + 1", 0, 1],
        ].map(([l, dx, dy]) => (
          <button key={l as string} onClick={() => step(dx as number, dy as number)} className="h-9 rounded-xl border border-white/10 px-1 text-sm whitespace-nowrap text-white/80 tabular-nums">
            {l}
          </button>
        ))}
      </div>

      {activeMode === "plot" && !delivery && (
        <div className="flex flex-wrap gap-2">
          {(["x-axis", "y-axis", "origin"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMirror(mirror === m ? null : m)}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm whitespace-nowrap ${mirror === m ? "border-violet-300 bg-violet-300/15" : "border-white/10 text-white/70"}`}
            >
              {m === "origin" ? "Mirror through origin" : `Mirror in ${m}`}
            </button>
          ))}
        </div>
      )}

      {delivery && (
        <>
          <button className="btn-primary !py-2 text-sm" onClick={drop}>
            Drop the parcel at {fmt(p)}
          </button>
          {dropped !== null && (
            <p className={`text-center text-sm ${dropped ? "text-lime-300" : "text-amber-200"}`}>
              {dropped ? "Delivered! Right on target." : `Nobody is waiting at ${fmt(p)}. Check the address and try again.`}
            </p>
          )}
        </>
      )}
      <p className="text-center text-xs text-white/40">Tap or drag on the grid, or use the buttons. 1 unit = 100 m.</p>
    </div>
  );
}

type Grid = { k: number; cx: number; cy: number; X: (x: number) => number; Y: (y: number) => number };

function grid(w: number, h: number): Grid {
  const k = Math.min(w, h) / (2 * LIMIT + 1.6);
  const cx = w / 2;
  const cy = h / 2;
  return { k, cx, cy, X: (x) => cx + x * k, Y: (y) => cy - y * k };
}

function drawGrid(ctx: CanvasRenderingContext2D, g: Grid, w: number) {
  // Quadrant tints and names.
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.textAlign = "center";
  const quads: [string, number, number][] = [
    ["I", 1, 1],
    ["II", -1, 1],
    ["III", -1, -1],
    ["IV", 1, -1],
  ];
  for (const [name, sx, sy] of quads) {
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fillText(name, g.X(sx * (LIMIT - 1)), g.Y(sy * (LIMIT - 1)) + 4);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = -LIMIT; i <= LIMIT; i++) {
    ctx.moveTo(g.X(i), g.Y(-LIMIT));
    ctx.lineTo(g.X(i), g.Y(LIMIT));
    ctx.moveTo(g.X(-LIMIT), g.Y(i));
    ctx.lineTo(g.X(LIMIT), g.Y(i));
  }
  ctx.stroke();
  // Axes with arrows and numbers.
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(g.X(-LIMIT - 0.5), g.Y(0));
  ctx.lineTo(g.X(LIMIT + 0.5), g.Y(0));
  ctx.moveTo(g.X(0), g.Y(-LIMIT - 0.5));
  ctx.lineTo(g.X(0), g.Y(LIMIT + 0.5));
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "10px system-ui, sans-serif";
  for (let i = -LIMIT; i <= LIMIT; i += 2) {
    if (!i) continue;
    ctx.fillText(num(i), g.X(i), g.Y(0) + 12);
    ctx.textAlign = "right";
    ctx.fillText(num(i), g.X(0) - 4, g.Y(i) + 3);
    ctx.textAlign = "center";
  }
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "italic 12px system-ui, sans-serif";
  ctx.fillText("x", Math.min(w - 8, g.X(LIMIT + 0.5) + 6), g.Y(0) - 6);
  ctx.fillText("y", g.X(0) + 10, Math.max(10, g.Y(LIMIT + 0.5) + 4));
  ctx.textAlign = "left";
}

function dot(ctx: CanvasRenderingContext2D, g: Grid, q: GridPt, colour: string, label: string, big: boolean) {
  ctx.fillStyle = colour;
  ctx.shadowColor = colour;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(g.X(q.x), g.Y(q.y), big ? 8 : 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.font = "bold 12px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(label, g.X(q.x) + 9, g.Y(q.y) - 8);
}

function landmark(ctx: CanvasRenderingContext2D, g: Grid, q: GridPt, label: string) {
  ctx.fillStyle = "#fb923c";
  ctx.fillRect(g.X(q.x) - 6, g.Y(q.y) - 6, 12, 12);
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`${label} ${fmt(q)}`, g.X(q.x) + 9, g.Y(q.y) + 16);
}

function drone(ctx: CanvasRenderingContext2D, g: Grid, q: GridPt, dropped: boolean | null) {
  const x = g.X(q.x);
  const y = g.Y(q.y);
  ctx.strokeStyle = COL.p;
  ctx.lineWidth = 2;
  ctx.shadowColor = COL.p;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(x - 9, y - 9);
  ctx.lineTo(x + 9, y + 9);
  ctx.moveTo(x + 9, y - 9);
  ctx.lineTo(x - 9, y + 9);
  ctx.stroke();
  for (const [dx, dy] of [
    [-9, -9],
    [9, -9],
    [-9, 9],
    [9, 9],
  ]) {
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = dropped ? "#a3e635" : COL.p;
  ctx.beginPath();
  ctx.arc(x, y, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "bold 12px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`P ${fmt(q)}`, x + 13, y - 12);
}
