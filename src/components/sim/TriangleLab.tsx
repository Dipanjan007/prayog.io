"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import {
  angleKind,
  anglesFromSides,
  sideKind,
  stickGap,
  sticks,
  triangleAngles,
  wholeAngles,
  type AngleKind,
  type Pt,
  type SideKind,
  type StickResult,
  type TriangleOrder,
} from "@/lib/sim/triangle";

export type TriangleMode = "sticks" | "corners";

export type TriangleReading =
  | { mode: "sticks"; a: number; b: number; c: number; result: StickResult; sides: SideKind; angles: number[] }
  | { mode: "corners"; angles: [number, number, number]; kind: AngleKind };

interface Props {
  onReading?: (r: TriangleReading) => void;
  /** Challenge: corners only, with the order shown. */
  order?: TriangleOrder | null;
}

const STICK_COLOURS = { a: "#22d3ee", b: "#f472b6", c: "#a3e635" };
const ANGLE_COLOURS = ["#22d3ee", "#f472b6", "#facc15"];
/** Corners stay inside this box, in grid units. */
const BOX = { x: 6, y: 3.6 };
const START: [Pt, Pt, Pt] = [
  { x: -4, y: -2.4 },
  { x: 4.5, y: -2.4 },
  { x: -0.5, y: 2.6 },
];

export default function TriangleLab({ onReading, order = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<TriangleMode>("sticks");
  const [len, setLen] = useState({ a: 3, b: 4, c: 8 });
  const [pts, setPts] = useState<[Pt, Pt, Pt]>(START);
  const [picked, setPicked] = useState<0 | 1 | 2>(2);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const drag = useRef<number | null>(null);
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: TriangleMode = order ? "corners" : mode;
  const result = sticks(len.a, len.b, len.c);
  const stickAngles = result === "triangle" ? anglesFromSides(len.a, len.b, len.c) : null;
  const angles = triangleAngles(pts[0], pts[1], pts[2]);
  const shown = wholeAngles(angles);
  const kind = angleKind(angles);

  useEffect(() => {
    if (activeMode === "sticks")
      onReadingRef.current?.({
        mode: "sticks",
        ...len,
        result,
        sides: sideKind(len.a, len.b, len.c),
        angles: stickAngles ? stickAngles.map((x) => Math.round(x)) : [],
      });
    else onReadingRef.current?.({ mode: "corners", angles, kind });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- angles is derived from pts
  }, [activeMode, len, result, pts, kind]);

  useEffect(() => {
    const c = canvasRef.current!;
    const ro = new ResizeObserver(() => setSize({ w: c.clientWidth, h: c.clientHeight }));
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !size.w) return;
    const ctx = fitCanvas(c, size.w, size.h);
    ctx.clearRect(0, 0, size.w, size.h);
    if (activeMode === "sticks") drawSticks(ctx, size.w, size.h, len);
    else drawCorners(ctx, size.w, size.h, pts, shown, picked);
  }, [size, activeMode, len, pts, shown, picked]);

  // Corners mode maps grid units to the canvas.
  const scale = () => cornerView(size.w, size.h).k;
  const toGrid = (e: React.PointerEvent<HTMLCanvasElement>): Pt => {
    const r = e.currentTarget.getBoundingClientRect();
    const v = cornerView(size.w, size.h);
    return { x: (e.clientX - r.left - v.cx) / v.k, y: -(e.clientY - r.top - v.cy) / v.k };
  };
  const clampPt = (p: Pt): Pt => ({ x: Math.max(-BOX.x, Math.min(BOX.x, p.x)), y: Math.max(-BOX.y, Math.min(BOX.y, p.y)) });
  const move = (i: number, p: Pt) => setPts((prev) => prev.map((q, j) => (j === i ? clampPt(p) : q)) as [Pt, Pt, Pt]);

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeMode !== "corners") return;
    const g = toGrid(e);
    const k = scale();
    let best = -1;
    let bestD = 28 / k; // grab radius: 28 px
    pts.forEach((p, i) => {
      const d = Math.hypot(p.x - g.x, p.y - g.y);
      if (d < bestD) {
        best = i;
        bestD = d;
      }
    });
    if (best < 0) return;
    drag.current = best;
    setPicked(best as 0 | 1 | 2);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (drag.current === null) return;
    move(drag.current, toGrid(e));
  };
  const onUp = () => {
    drag.current = null;
  };
  const nudge = (dx: number, dy: number) => move(picked, { x: pts[picked].x + dx, y: pts[picked].y + dy });

  const sorted = [len.a, len.b, len.c].sort((p, q) => p - q);

  return (
    <div className="flex flex-col gap-3 select-none">
      {!order && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["sticks", "corners"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${activeMode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m === "sticks" ? "Sticks" : "Corners"}
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
        className={`h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80 ${activeMode === "corners" ? "touch-none cursor-grab" : ""}`}
        role="img"
        aria-label={
          activeMode === "sticks"
            ? `Sticks of ${len.a}, ${len.b} and ${len.c} cm: ${result === "triangle" ? "they make a triangle" : result === "flat" ? "they lie flat, no triangle" : "the short sticks cannot meet"}`
            : `Triangle ABC with angles ${shown[0]}°, ${shown[1]}° and ${shown[2]}°, adding up to 180°`
        }
      />

      {activeMode === "sticks" ? (
        <>
          <div
            className={`rounded-2xl border px-4 py-2 text-center text-sm ${
              result === "triangle" ? "border-lime-300/40 bg-lime-300/10 text-lime-100" : "border-amber-300/40 bg-amber-300/10 text-amber-100"
            }`}
          >
            {sorted[0]} + {sorted[1]} = {sorted[0] + sorted[1]}
            {result === "triangle" ? " > " : result === "flat" ? " = " : " < "}
            {sorted[2]}:{" "}
            {result === "triangle"
              ? `a ${sideKind(len.a, len.b, len.c)} triangle`
              : result === "flat"
                ? "the sticks lie flat, no triangle"
                : `the short sticks miss by ${stickGap(len.a, len.b, len.c)} cm`}
          </div>
          {(["a", "b", "c"] as const).map((s) => (
            <label key={s} className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: STICK_COLOURS[s] }}>Stick {s}</span>
                <span className="tabular-nums text-white">{len[s]} cm</span>
              </div>
              <input
                type="range"
                className="range mt-1 w-full"
                min={1}
                max={12}
                step={1}
                value={len[s]}
                onChange={(e) => setLen((l) => ({ ...l, [s]: Number(e.target.value) }))}
                aria-label={`Length of stick ${s}`}
              />
            </label>
          ))}
        </>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 text-center">
            {(["A", "B", "C"] as const).map((n, i) => (
              <div key={n} className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
                <div className="text-[11px] uppercase tracking-wider" style={{ color: ANGLE_COLOURS[i] }}>
                  ∠{n}
                </div>
                <div className="font-display text-lg tabular-nums">{shown[i]}°</div>
              </div>
            ))}
            <div className="rounded-2xl border border-cyan-300/30 bg-cyan-300/[0.07] px-1 py-2">
              <div className="text-[11px] uppercase tracking-wider text-cyan-200">Total</div>
              <div className="font-display text-lg tabular-nums">{shown[0] + shown[1] + shown[2]}°</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
            <span className="text-white/60">
              {kind === "acute" || kind === "obtuse" ? "An" : "A"} <span className="text-white">{kind}</span> triangle
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-white/50">Nudge</span>
              {(["A", "B", "C"] as const).map((n, i) => (
                <button
                  key={n}
                  onClick={() => setPicked(i as 0 | 1 | 2)}
                  className={`h-8 w-8 rounded-lg border text-xs ${picked === i ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
                  aria-label={`Pick corner ${n}`}
                >
                  {n}
                </button>
              ))}
              {[
                ["←", -0.1, 0],
                ["→", 0.1, 0],
                ["↑", 0, 0.1],
                ["↓", 0, -0.1],
              ].map(([l, dx, dy]) => (
                <button
                  key={l as string}
                  onClick={() => nudge(dx as number, dy as number)}
                  className="h-8 w-8 rounded-lg border border-white/10 text-white/80"
                  aria-label={`Move corner ${"ABC"[picked]} ${l === "←" ? "left" : l === "→" ? "right" : l === "↑" ? "up" : "down"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <p className="text-center text-xs text-white/40">Drag a corner, or pick one and nudge it. The three torn-off corners always fill a straight line.</p>
        </>
      )}
    </div>
  );
}

function drawSticks(ctx: CanvasRenderingContext2D, w: number, h: number, len: { a: number; b: number; c: number }) {
  // The longest stick lies along the ground; the other two hinge at its ends.
  const named = (["a", "b", "c"] as const).map((n) => ({ n, L: len[n] })).sort((p, q) => q.L - p.L);
  const [base, left, right] = named;
  const k = Math.min((w - 40) / Math.max(base.L, 1), (h - 50) / (Math.max(left.L, right.L) * 0.95 + 0.5));
  const x0 = (w - base.L * k) / 2;
  const y0 = h - 30;
  const result = sticks(len.a, len.b, len.c);

  const stick = (x1: number, y1: number, x2: number, y2: number, colour: string, label: string) => {
    ctx.strokeStyle = colour;
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.shadowColor = colour;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = colour;
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center";
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    ctx.fillText(label, mx, my + (Math.abs(y2 - y1) < 4 ? 20 : -10));
  };

  stick(x0, y0, x0 + base.L * k, y0, STICK_COLOURS[base.n], `${base.n} = ${base.L} cm`);

  if (result === "triangle") {
    // Apex from the cosine rule: the angle at the left end, between the base and the left stick.
    const cosL = (base.L ** 2 + left.L ** 2 - right.L ** 2) / (2 * base.L * left.L);
    const ang = Math.acos(Math.max(-1, Math.min(1, cosL)));
    const ax = x0 + left.L * k * Math.cos(ang);
    const ay = y0 - left.L * k * Math.sin(ang);
    ctx.fillStyle = "rgba(167,139,250,0.12)";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + base.L * k, y0);
    ctx.lineTo(ax, ay);
    ctx.closePath();
    ctx.fill();
    stick(x0, y0, ax, ay, STICK_COLOURS[left.n], `${left.n} = ${left.L}`);
    stick(x0 + base.L * k, y0, ax, ay, STICK_COLOURS[right.n], `${right.n} = ${right.L}`);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(ax, ay, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Flat: both lie along the base and touch. Gap: raised a little, still not meeting.
    const lift = result === "flat" ? 0 : 0.22;
    const lx = x0 + left.L * k * Math.cos(lift);
    const ly = y0 - 8 - left.L * k * Math.sin(lift);
    const rx = x0 + base.L * k - right.L * k * Math.cos(lift);
    const ry = y0 - 8 - right.L * k * Math.sin(lift);
    stick(x0, y0 - 8, lx, ly, STICK_COLOURS[left.n], `${left.n} = ${left.L}`);
    stick(x0 + base.L * k, y0 - 8, rx, ry, STICK_COLOURS[right.n], `${right.n} = ${right.L}`);
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center";
    if (result === "gap") {
      ctx.strokeStyle = "#fb7185";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(rx, ry);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#fb7185";
      ctx.fillText("gap: they can't meet", (lx + rx) / 2, Math.min(ly, ry) - 18);
    } else {
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.arc(lx, ly, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText("they meet, but lie flat", lx, ly - 22);
    }
  }
  ctx.textAlign = "left";
}

/** Height kept free at the bottom of the canvas for the "corners on a straight line" picture. */
const STRIP = 50;

/** Scale and centre of the corner grid, above the strip. */
function cornerView(w: number, h: number) {
  const k = Math.min(w / (2 * BOX.x + 1.4), (h - STRIP) / (2 * BOX.y + 1.4));
  return { k, cx: w / 2, cy: (h - STRIP) / 2 };
}

function drawCorners(ctx: CanvasRenderingContext2D, w: number, h: number, pts: [Pt, Pt, Pt], shown: [number, number, number], picked: number) {
  const { k, cx: ox, cy: oy } = cornerView(w, h);
  const P = (p: Pt) => ({ x: ox + p.x * k, y: oy - p.y * k });

  // Light grid.
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let gx = -BOX.x; gx <= BOX.x; gx++) {
    ctx.beginPath();
    ctx.moveTo(P({ x: gx, y: -BOX.y }).x, P({ x: gx, y: -BOX.y }).y);
    ctx.lineTo(P({ x: gx, y: BOX.y }).x, P({ x: gx, y: BOX.y }).y);
    ctx.stroke();
  }
  for (let gy = Math.ceil(-BOX.y); gy <= BOX.y; gy++) {
    ctx.beginPath();
    ctx.moveTo(P({ x: -BOX.x, y: gy }).x, P({ x: -BOX.x, y: gy }).y);
    ctx.lineTo(P({ x: BOX.x, y: gy }).x, P({ x: BOX.x, y: gy }).y);
    ctx.stroke();
  }

  const s = pts.map(P);
  ctx.fillStyle = "rgba(167,139,250,0.12)";
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  s.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Angle wedges at each corner, and the label.
  ctx.font = "bold 12px system-ui, sans-serif";
  s.forEach((p, i) => {
    const q = s[(i + 1) % 3];
    const r = s[(i + 2) % 3];
    const a1 = Math.atan2(q.y - p.y, q.x - p.x);
    const a2 = Math.atan2(r.y - p.y, r.x - p.x);
    let d = a2 - a1;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    const rad = 22;
    ctx.fillStyle = ANGLE_COLOURS[i] + "55";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.arc(p.x, p.y, rad, a1, a1 + d, d < 0);
    ctx.closePath();
    ctx.fill();
    const mid = a1 + d / 2;
    ctx.fillStyle = ANGLE_COLOURS[i];
    ctx.textAlign = "center";
    ctx.fillText(`${shown[i]}°`, p.x + Math.cos(mid) * (rad + 16), p.y + Math.sin(mid) * (rad + 16) + 4);
    // Corner handle and name, outside the triangle.
    const cx = (s[0].x + s[1].x + s[2].x) / 3;
    const cy = (s[0].y + s[1].y + s[2].y) / 3;
    const ox = p.x - cx;
    const oy = p.y - cy;
    const on = Math.hypot(ox, oy) || 1;
    ctx.fillStyle = i === picked ? "#fff" : "rgba(255,255,255,0.8)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, i === picked ? 8 : 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText("ABC"[i], p.x + (ox / on) * 18, p.y + (oy / on) * 18 + 4);
  });

  // The three angles side by side on a straight line, in the strip at the bottom.
  const R = 34;
  const bx = R + 22;
  const by = h - 8;
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(bx - R - 8, by);
  ctx.lineTo(bx + R + 8, by);
  ctx.stroke();
  let start = Math.PI;
  shown.forEach((deg, i) => {
    const sweep = (deg * Math.PI) / 180;
    ctx.fillStyle = ANGLE_COLOURS[i] + "aa";
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.arc(bx, by, R, start, start + sweep);
    ctx.closePath();
    ctx.fill();
    start += sweep;
  });
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("∠A + ∠B + ∠C = 180°, a straight line", bx + R + 14, by - 4);
  ctx.textAlign = "left";
}
