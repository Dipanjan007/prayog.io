"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import {
  CUBE_EDGE,
  ORDER_SIDE,
  SUM_SIDE,
  TILES,
  oddLayers,
  orderOk,
  orderSide,
  piecesFor,
  squareFit,
  type Order,
} from "@/lib/sim/squarescubes";

export type SquareCubeMode = "tiles" | "cubes" | "sums";

export type SquareCubeReading =
  | { mode: "tiles"; N: number; side: number; left: number; odd: boolean }
  | { mode: "cubes"; n: number; total: number }
  | { mode: "sums"; a: number; b: number; total: number }
  | { mode: "order"; n: number; ok: boolean };

interface Props {
  onReading?: (r: SquareCubeReading) => void;
  /** Challenge: a fixed pile; the student picks the side and builds. */
  order?: Order | null;
}

/** Odd-layer colours, cycling. */
const LAYER = ["#22d3ee", "#a78bfa", "#f472b6", "#a3e635", "#facc15", "#fb923c"];
const TILE = "#22d3ee";
const MODES: { id: SquareCubeMode; label: string }[] = [
  { id: "tiles", label: "Tiles" },
  { id: "cubes", label: "Cubes" },
  { id: "sums", label: "Cube sums" },
];

export default function SquareCubeLab({ onReading, order = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<SquareCubeMode>("tiles");
  // Start off a perfect square so a full square is the student's discovery.
  const [N, setN] = useState(12);
  const [odd, setOdd] = useState(false);
  const [edge, setEdge] = useState(2);
  const [a, setA] = useState(2);
  const [b, setB] = useState(5);
  const [side, setSide] = useState(3);
  const [built, setBuilt] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const fit = squareFit(N);
  const sum = a ** 3 + b ** 3;

  useEffect(() => {
    if (order) return;
    if (mode === "tiles") onReadingRef.current?.({ mode, N, side: fit.side, left: fit.left, odd });
    else if (mode === "cubes") onReadingRef.current?.({ mode, n: edge, total: edge ** 3 });
    else onReadingRef.current?.({ mode, a, b, total: sum });
  }, [order, mode, N, fit.side, fit.left, odd, edge, a, b, sum]);

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
    if (order) drawOrder(ctx, size.w, size.h, order, side, built);
    else if (mode === "tiles") drawTiles(ctx, size.w, size.h, N, odd);
    else if (mode === "cubes") drawCubeStack(ctx, size.w, size.h, edge);
    else drawCubeSum(ctx, size.w, size.h, a, b);
  }, [size, order, mode, N, odd, edge, a, b, side, built]);

  const build = () => {
    if (!order) return;
    const ok = orderOk(order, side);
    setBuilt(ok);
    onReadingRef.current?.({ mode: "order", n: side, ok });
  };

  const ariaLabel = order
    ? `${order.total} ${order.kind === "square" ? "tiles" : "blocks"} in the pile; side chosen ${side}`
    : mode === "tiles"
      ? `${N} tiles: a ${fit.side} by ${fit.side} square with ${fit.left} left over`
      : mode === "cubes"
        ? `A cube of edge ${edge} made of ${edge ** 3} unit cubes`
        : `Two cubes, ${a} cubed is ${a ** 3} and ${b} cubed is ${b ** 3}, together ${sum}`;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!order && (
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)} className={`rounded-xl py-2 ${mode === m.id ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m.label}
            </button>
          ))}
        </div>
      )}

      <canvas ref={canvasRef} className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80" role="img" aria-label={ariaLabel} />

      {order ? (
        <OrderControls order={order} side={side} built={built} onSide={(v) => {
          setSide(v);
          setBuilt(null);
        }} onBuild={build} />
      ) : mode === "tiles" ? (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Tiles N" value={`${N}`} colour="text-white" />
            <Readout label="Biggest square" value={`${fit.side} × ${fit.side}`} colour="text-cyan-200" />
            <Readout label="Left over" value={`${fit.left}`} colour={fit.left ? "text-amber-200" : "text-lime-200"} />
          </div>
          <div
            className={`rounded-2xl border px-4 py-2 text-center text-sm ${
              fit.left === 0 ? "border-lime-300/40 bg-lime-300/10 text-lime-100" : "border-white/10 bg-white/[0.03] text-white/70"
            }`}
          >
            {fit.left === 0
              ? `${N} = ${fit.side}², a perfect square. √${N} = ${fit.side}`
              : `${fit.side}² = ${fit.used} < ${N} < ${(fit.side + 1) ** 2} = ${fit.side + 1}², so ${fit.side} < √${N} < ${fit.side + 1}. ${fit.toNext} more for the next square.`}
          </div>
          {odd && (
            <p className="text-center text-sm text-white/70 tabular-nums">
              Odd layers: {oddLayers(fit.side).join(" + ")} = {fit.used}
            </p>
          )}
          <Stepper label="Number of tiles" value={N} min={TILES.min} max={TILES.max} steps={[1, 10]} onChange={setN} />
          <button
            onClick={() => setOdd((v) => !v)}
            aria-pressed={odd}
            className={`rounded-xl border px-3 py-2 text-sm ${odd ? "border-violet-300 bg-violet-300/15 text-white" : "border-white/10 text-white/70"}`}
          >
            {odd ? "✓ Odd layers on" : "Odd layers"}
          </button>
        </>
      ) : mode === "cubes" ? (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Edge n" value={`${edge}`} colour="text-cyan-200" />
            <Readout label="One layer n²" value={`${edge * edge}`} colour="text-violet-200" />
            <Readout label="Cubes n³" value={`${edge ** 3}`} colour="text-lime-200" />
          </div>
          <p className="text-center text-sm text-white/70 tabular-nums">
            {edge} layers × {edge * edge} cubes = {edge} × {edge} × {edge} = {edge ** 3} = {edge}³
          </p>
          <Stepper label="Edge of the cube" value={edge} min={CUBE_EDGE.min} max={CUBE_EDGE.max} steps={[1]} onChange={setEdge} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="a³" value={`${a ** 3}`} colour="text-cyan-200" />
            <Readout label="b³" value={`${b ** 3}`} colour="text-pink-200" />
            <Readout label="a³ + b³" value={`${sum}`} colour={sum === 1729 ? "text-lime-200" : "text-white"} />
          </div>
          <p className={`text-center text-sm tabular-nums ${sum === 1729 ? "text-lime-300" : "text-white/60"}`}>
            {a}³ + {b}³ = {a ** 3} + {b ** 3} = {sum}
            {sum === 1729 ? " ✓ the taxi number!" : ""}
          </p>
          <Stepper label="Cube a" value={a} min={SUM_SIDE.min} max={SUM_SIDE.max} steps={[1]} onChange={setA} />
          <Stepper label="Cube b" value={b} min={SUM_SIDE.min} max={SUM_SIDE.max} steps={[1]} onChange={setB} />
        </>
      )}
    </div>
  );
}

function OrderControls({ order, side, built, onSide, onBuild }: { order: Order; side: number; built: boolean | null; onSide: (v: number) => void; onBuild: () => void }) {
  const noun = order.kind === "square" ? "tiles" : "blocks";
  const need = piecesFor(order.kind, side);
  const best = orderSide(order);
  return (
    <>
      <div className="grid grid-cols-2 gap-2 text-center">
        <Readout label="In the pile" value={`${order.total} ${noun}`} colour="text-white" />
        <Readout label={order.kind === "square" ? "Square side" : "Cube edge"} value={`${side}`} colour="text-cyan-200" />
      </div>
      <Stepper label={order.kind === "square" ? "Side of the square" : "Edge of the cube"} value={side} min={ORDER_SIDE.min} max={ORDER_SIDE.max} steps={[1]} onChange={onSide} />
      <button className="btn-primary !py-2 text-sm" onClick={onBuild}>
        {order.kind === "square" ? `Lay the ${side} × ${side} square` : `Build the ${side} × ${side} × ${side} cube`}
      </button>
      {built !== null && (
        <p className={`text-center text-sm ${built ? "text-lime-300" : "text-amber-200"}`}>
          {built
            ? `Built! It uses ${need} ${noun} and leaves ${order.total - need}. One size bigger needs ${piecesFor(order.kind, side + 1)}, too many.`
            : need > order.total
              ? `Not enough ${noun}: side ${side} needs ${need}, but the pile has ${order.total}.`
              : `You can go bigger: side ${side} uses only ${need}, and ${order.total - need} are left over.`}
        </p>
      )}
      {built === false && side > best + 3 && <p className="text-center text-xs text-white/40">Try a much smaller side.</p>}
    </>
  );
}

function Readout({ label, value, colour }: { label: string; value: string; colour: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] tracking-wider text-white/50">{label}</div>
      <div className={`font-display text-base tabular-nums sm:text-lg ${colour}`}>{value}</div>
    </div>
  );
}

/** A slider with − and + buttons for touch screens. */
function Stepper(p: { label: string; value: number; min: number; max: number; steps: number[]; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.min(p.max, Math.max(p.min, v));
  const deltas = [...p.steps.map((s) => -s).reverse(), ...p.steps];
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2">
      <div className="flex justify-between text-sm">
        <span className="text-cyan-200">{p.label}</span>
        <span className="tabular-nums text-white">{p.value}</span>
      </div>
      <input
        type="range"
        aria-label={p.label}
        className="range mt-1 w-full"
        min={p.min}
        max={p.max}
        step={1}
        value={p.value}
        onChange={(e) => p.onChange(Number(e.target.value))}
      />
      <div className="mt-1 flex gap-2">
        {deltas.map((s) => (
          <button
            key={s}
            aria-label={`${p.label} ${s > 0 ? "plus" : "minus"} ${Math.abs(s)}`}
            onClick={() => p.onChange(clamp(p.value + s))}
            className="h-9 flex-1 rounded-lg border border-white/10 text-sm text-white/70 tabular-nums"
          >
            {s > 0 ? "+" : "−"}
            {Math.abs(s)}
          </button>
        ))}
      </div>
    </div>
  );
}

/** N tiles: the biggest square, with leftovers placed along the next L-shaped layer and the missing cells dashed. */
function drawTiles(ctx: CanvasRenderingContext2D, w: number, h: number, N: number, odd: boolean) {
  const { side, left } = squareFit(N);
  const grid = left ? side + 1 : side;
  const cell = Math.min((w - 24) / grid, (h - 44) / grid, 46);
  const x0 = (w - grid * cell) / 2;
  const y0 = 12 + (h - 44 - grid * cell) / 2;
  const tile = (r: number, c: number, colour: string, dashed = false) => {
    const x = x0 + c * cell;
    const y = y0 + r * cell;
    if (dashed) {
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 2, y + 2, cell - 4, cell - 4);
      ctx.setLineDash([]);
      return;
    }
    ctx.fillStyle = colour + "55";
    ctx.strokeStyle = colour;
    ctx.lineWidth = 1.2;
    ctx.fillRect(x + 1.5, y + 1.5, cell - 3, cell - 3);
    ctx.strokeRect(x + 1.5, y + 1.5, cell - 3, cell - 3);
  };
  for (let r = 0; r < side; r++) for (let c = 0; c < side; c++) tile(r, c, odd ? LAYER[Math.max(r, c) % LAYER.length] : TILE);
  if (left) {
    // The next layer: down the right-hand column, then along the bottom row from the right.
    const next: [number, number][] = [];
    for (let r = 0; r < side; r++) next.push([r, side]);
    next.push([side, side]);
    for (let c = side - 1; c >= 0; c--) next.push([side, c]);
    next.forEach(([r, c], i) => tile(r, c, "#facc15", i >= left));
  }
  // Outline the full square.
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, side * cell - 1, side * cell - 1);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "center";
  const note = left ? `${side} × ${side} = ${side * side}, ${left} left over (yellow)` : `${side} × ${side} = ${N}, none left over`;
  ctx.fillText(note, w / 2, h - 12);
  ctx.textAlign = "left";
}

/** Isometric projection helpers. */
function iso(u: number, ox: number, oy: number) {
  const cx = u * Math.cos(Math.PI / 6);
  const sy = u * Math.sin(Math.PI / 6);
  return (x: number, y: number, z: number) => ({ x: ox + (x - y) * cx, y: oy + (x + y) * sy - z * u });
}

/** Screen size of an n-edge isometric cube with unit u. */
function isoSize(n: number, u: number) {
  return { w: 2 * n * u * Math.cos(Math.PI / 6), h: 2 * n * u * Math.sin(Math.PI / 6) + n * u };
}

/** Draw the three visible faces of a unit cube at (i, j, k). */
function unitCube(ctx: CanvasRenderingContext2D, P: ReturnType<typeof iso>, i: number, j: number, k: number, colour: string) {
  const face = (pts: { x: number; y: number }[], alpha: string) => {
    ctx.beginPath();
    pts.forEach((p, n) => (n ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = colour + alpha;
    ctx.fill();
    ctx.stroke();
  };
  ctx.strokeStyle = "rgba(10,13,28,0.9)";
  ctx.lineWidth = 1;
  face([P(i, j, k + 1), P(i + 1, j, k + 1), P(i + 1, j + 1, k + 1), P(i, j + 1, k + 1)], "ff");
  face([P(i + 1, j, k), P(i + 1, j + 1, k), P(i + 1, j + 1, k + 1), P(i + 1, j, k + 1)], "b0");
  face([P(i, j + 1, k), P(i + 1, j + 1, k), P(i + 1, j + 1, k + 1), P(i, j + 1, k + 1)], "80");
}

/** An n × n × n stack of unit cubes, drawn back to front. Layers alternate colour so they can be counted. */
function drawCubeStack(ctx: CanvasRenderingContext2D, w: number, h: number, n: number, caption = true) {
  const s1 = isoSize(n, 1);
  const u = Math.min((w - 24) / s1.w, (h - (caption ? 44 : 24)) / s1.h);
  const s = isoSize(n, u);
  const ox = w / 2;
  const oy = (caption ? 8 : 12) + (h - (caption ? 36 : 24) - s.h) / 2 + n * u;
  const P = iso(u, ox, oy);
  const cubes: [number, number, number][] = [];
  // Only the cubes on the three visible outside faces can be seen.
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) if (i === n - 1 || j === n - 1 || k === n - 1) cubes.push([i, j, k]);
  cubes.sort((p, q) => p[0] + p[1] + p[2] - (q[0] + q[1] + q[2]));
  for (const [i, j, k] of cubes) unitCube(ctx, P, i, j, k, k % 2 ? "#a78bfa" : "#22d3ee");
  if (caption) {
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${n} × ${n} × ${n} = ${n ** 3} unit cubes`, w / 2, h - 12);
    ctx.textAlign = "left";
  }
}

/** Two solid cubes side by side, to scale, with unit lines on their faces. */
function drawCubeSum(ctx: CanvasRenderingContext2D, w: number, h: number, a: number, b: number) {
  const gap = 34;
  const s1 = isoSize(1, 1);
  const u = Math.min((w - 24 - gap) / ((a + b) * s1.w), (h - 64) / (Math.max(a, b) * s1.h));
  const base = h - 40;
  const draw = (n: number, cx: number, colour: string) => {
    const s = isoSize(n, u);
    // Bottom corner of the cube sits on the base line.
    const P = iso(u, cx, base - s.h + n * u);
    const face = (pts: { x: number; y: number }[], alpha: string) => {
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
      ctx.fillStyle = colour + alpha;
      ctx.fill();
      ctx.strokeStyle = colour;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };
    face([P(0, 0, n), P(n, 0, n), P(n, n, n), P(0, n, n)], "66");
    face([P(n, 0, 0), P(n, n, 0), P(n, n, n), P(n, 0, n)], "44");
    face([P(0, n, 0), P(n, n, 0), P(n, n, n), P(0, n, n)], "30");
    if (u >= 3) {
      ctx.strokeStyle = colour + "55";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let t = 1; t < n; t++) {
        const lines: [V3, V3][] = [
          [[t, 0, n], [t, n, n]],
          [[0, t, n], [n, t, n]],
          [[n, t, 0], [n, t, n]],
          [[n, 0, t], [n, n, t]],
          [[t, n, 0], [t, n, n]],
          [[0, n, t], [n, n, t]],
        ];
        for (const [p, q] of lines) {
          const A = P(...p);
          const B = P(...q);
          ctx.moveTo(A.x, A.y);
          ctx.lineTo(B.x, B.y);
        }
      }
      ctx.stroke();
    }
    ctx.fillStyle = colour;
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${n}³ = ${n ** 3}`, cx, h - 14);
  };
  const wa = isoSize(a, u).w;
  const wb = isoSize(b, u).w;
  const left = (w - wa - wb - gap) / 2;
  draw(a, left + wa / 2, "#22d3ee");
  draw(b, left + wa + gap + wb / 2, "#f472b6");
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("+", left + wa + gap / 2, base - 6);
  ctx.textAlign = "left";
}

type V3 = [number, number, number];

/** Challenge: a dashed preview of the chosen size; once built, the real square or cube and what is left. */
function drawOrder(ctx: CanvasRenderingContext2D, w: number, h: number, order: Order, n: number, built: boolean | null) {
  const need = piecesFor(order.kind, n);
  if (built && order.kind === "cube") {
    drawCubeStack(ctx, w, h - 20, n, false);
  } else if (built && order.kind === "square") {
    const cell = Math.min((w - 24) / n, (h - 56) / n, 40);
    const x0 = (w - n * cell) / 2;
    const y0 = 12 + (h - 56 - n * cell) / 2;
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) {
        ctx.fillStyle = TILE + "55";
        ctx.strokeStyle = TILE;
        ctx.lineWidth = 1;
        ctx.fillRect(x0 + c * cell + 1, y0 + r * cell + 1, cell - 2, cell - 2);
        ctx.strokeRect(x0 + c * cell + 1, y0 + r * cell + 1, cell - 2, cell - 2);
      }
  } else {
    // Preview: a dashed outline of the chosen size, scaled against the biggest side allowed.
    const k = Math.min((w - 24) / ORDER_SIDE.max, (h - 56) / ORDER_SIDE.max);
    const s = n * k;
    const x0 = (w - s) / 2;
    const y0 = 12 + (h - 56 - s) / 2;
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = built === false ? "#fb7185" : "rgba(255,255,255,0.6)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x0, y0, s, s);
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(order.kind === "square" ? `side ${n}` : `edge ${n} (seen from the top)`, w / 2, y0 + s / 2 + 4);
  }
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.textAlign = "center";
  if (built === null) {
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(`Pile: ${order.total} ${order.kind === "square" ? "tiles" : "blocks"}`, w / 2, h - 14);
  } else {
    ctx.fillStyle = built ? "#a3e635" : "#fb7185";
    ctx.fillText(built ? `✓ Used ${need}, ${order.total - need} left over` : "✗ Not the biggest that fits", w / 2, h - 14);
  }
  ctx.textAlign = "left";
}
