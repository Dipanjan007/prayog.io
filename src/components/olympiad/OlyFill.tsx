"use client";

import { POUR_S, fillLevels, halfSize, levelFor, planFill, type FillScene, type Region } from "@/lib/sim/oly-fill";
import { C, fitWorld, label, useSimCanvas } from "./canvas";

interface Props {
  scene: FillScene;
  idle: boolean;
  runKey: number;
  onDone?: () => void;
}

/** Fill sim: exactly the student's area of colour is poured into the shape. Too little leaves it bare, too much spills. */
export default function OlyFill({ scene, idle, runKey, onDone }: Props) {
  const plan = planFill(scene);
  const { ref } = useSimCanvas((ctx, w, h, t) => draw(ctx, w, h, scene, t, idle), plan.duration, runKey, onDone);
  return (
    <canvas
      ref={ref}
      className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
      role="img"
      aria-label={`Your area of ${scene.stuff} is poured into the shape from the bottom up. ${idle ? "" : plan.outcome.text}`}
    />
  );
}

/** Sorted sample heights per region, so the fill level is cheap to look up on every frame. */
const LEVELS = new Map<string, number[]>();
function levelsOf(r: Region) {
  const key = JSON.stringify(r);
  let v = LEVELS.get(key);
  if (!v) {
    v = fillLevels(r, 120);
    LEVELS.set(key, v);
  }
  return v;
}

/** Trace the region as a clip (rings and cut-out squares use the even-odd rule; the leaf is two clips). */
function clipRegion(ctx: CanvasRenderingContext2D, r: Region, X: (x: number) => number, Y: (y: number) => number, k: number) {
  if (r.type === "ring") {
    ctx.beginPath();
    ctx.arc(X(0), Y(0), r.R * k, 0, Math.PI * 2);
    ctx.arc(X(0), Y(0), r.r * k, 0, Math.PI * 2);
    ctx.clip("evenodd");
    return;
  }
  const hs = r.s / 2;
  if (r.type === "square-minus-circle") {
    ctx.beginPath();
    ctx.rect(X(-hs), Y(hs), r.s * k, r.s * k);
    ctx.arc(X(0), Y(0), hs * k, 0, Math.PI * 2);
    ctx.clip("evenodd");
    return;
  }
  ctx.beginPath();
  ctx.rect(X(-hs), Y(hs), r.s * k, r.s * k);
  ctx.clip();
  ctx.beginPath();
  ctx.arc(X(-hs), Y(-hs), r.s * k, 0, Math.PI * 2);
  ctx.clip();
  ctx.beginPath();
  ctx.arc(X(hs), Y(hs), r.s * k, 0, Math.PI * 2);
  ctx.clip();
}

function outline(ctx: CanvasRenderingContext2D, r: Region, X: (x: number) => number, Y: (y: number) => number, k: number) {
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 1.5;
  if (r.type === "ring") {
    for (const rad of [r.R, r.r]) {
      ctx.beginPath();
      ctx.arc(X(0), Y(0), rad * k, 0, Math.PI * 2);
      ctx.stroke();
    }
    return;
  }
  const hs = r.s / 2;
  ctx.strokeRect(X(-hs), Y(hs), r.s * k, r.s * k);
  if (r.type === "square-minus-circle") {
    ctx.beginPath();
    ctx.arc(X(0), Y(0), hs * k, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }
  // Leaf: the two quarter-circle arcs inside the square.
  ctx.beginPath();
  ctx.arc(X(-hs), Y(-hs), r.s * k, -Math.PI / 2, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(X(hs), Y(hs), r.s * k, Math.PI / 2, Math.PI);
  ctx.stroke();
}

function dims(ctx: CanvasRenderingContext2D, s: FillScene, X: (x: number) => number, Y: (y: number) => number, w: number) {
  const r = s.region;
  const u = s.unit.replace("²", "");
  if (r.type === "ring") {
    ctx.strokeStyle = C.cyan;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(X(0), Y(0));
    ctx.lineTo(X(r.R * 0.707), Y(r.R * 0.707));
    ctx.stroke();
    ctx.strokeStyle = C.pink;
    ctx.beginPath();
    ctx.moveTo(X(0), Y(0));
    ctx.lineTo(X(-r.r), Y(0));
    ctx.stroke();
    label(ctx, `R = ${r.R} ${u}`, X(r.R * 0.707) + 4, Y(r.R * 0.707) - 8, w, { size: 10, color: C.cyan, bold: true });
    label(ctx, `r = ${r.r}`, X(-r.r / 2), Y(0) - 9, w, { size: 10, color: C.pink, align: "center", bold: true });
    return;
  }
  label(ctx, `${r.s} ${u}`, X(0), Y(-r.s / 2) + 12, w, { size: 10, color: C.cyan, align: "center", bold: true });
}

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, s: FillScene, t: number, idle: boolean) {
  const plan = planFill(s);
  const done = !idle && t >= plan.duration - 1e-6;
  const hs = halfSize(s.region);
  const spill = !idle && plan.fraction > 1;
  // Leave room on the right for a spill heap.
  const box = { x0: -hs * 1.08, x1: hs * (spill ? 1.9 : 1.08), y0: -hs * 1.08, y1: hs * 1.08 };
  const { X, Y, k } = fitWorld(w, h, box, { l: 12, r: 12, t: 36, b: 30 });

  label(ctx, "goal: cover the shape exactly", 8, 14, w, { size: 11, color: C.lime });
  label(ctx, idle ? "A = ?" : `you pour ${Number(s.amount.toPrecision(5))} ${s.unit}`, w - 8, 14, w, { size: 12, color: s.colour, bold: true, align: "right" });

  // Empty shape, lightly shaded.
  ctx.save();
  clipRegion(ctx, s.region, X, Y, k);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(0, 0, w, h);
  if (!idle) {
    const pour = Math.min(1, t / POUR_S);
    const f = Math.min(1, plan.fraction) * pour;
    const level = levelFor(levelsOf(s.region), f);
    const yTop = level === Infinity ? Y(hs) - 2 : Y(level + (2 * hs) / 120);
    ctx.fillStyle = s.colour;
    ctx.globalAlpha = 0.85;
    if (f > 0) ctx.fillRect(0, yTop, w, h - yTop);
    ctx.globalAlpha = 1;
    // Bare part after the pour runs out.
    if (done && plan.fraction < 1) {
      ctx.fillStyle = "rgba(251,113,133,0.18)";
      ctx.fillRect(0, 0, w, yTop);
    }
  }
  ctx.restore();
  outline(ctx, s.region, X, Y, k);
  dims(ctx, s, X, Y, w);

  if (idle) {
    label(ctx, "Enter your answer, then test it", 8, h - 12, w, { size: 10, color: C.dim });
    return;
  }
  // The heap that spills over once the shape is full.
  if (spill) {
    const pour = Math.min(1, t / POUR_S);
    const extra = Math.max(0, (plan.fraction * pour - 1) / (plan.fraction - 1));
    if (extra > 0) {
      const heapArea = Math.min(plan.fraction - 1, 1.2) * extra * 4 * hs * hs * 0.25;
      const half = Math.sqrt(heapArea);
      const cx = hs * 1.5;
      ctx.fillStyle = s.colour;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(X(cx - half), Y(-hs));
      ctx.lineTo(X(cx), Y(-hs + half));
      ctx.lineTo(X(cx + half), Y(-hs));
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      if (done) label(ctx, `spilt ${Number((s.amount - plan.area).toPrecision(4))} ${s.unit}`, X(cx), Y(-hs) + 12, w, { size: 10, color: C.rose, align: "center", bold: true });
    }
  }
  if (done) {
    const ok = plan.outcome.ok;
    if (!spill && !ok) label(ctx, `bare: ${Number((plan.area - s.amount).toPrecision(4))} ${s.unit}`, X(0), Y(hs) - 10, w, { size: 10, color: C.rose, align: "center", bold: true });
    label(ctx, `${ok ? "✓ Covered edge to edge!" : plan.fraction < 1 ? "✗ Ran out: some is bare" : "✗ Too much: it spills"}`, w / 2, h - 12, w, { align: "center", size: 13, color: ok ? C.lime : C.rose, bold: true });
  }
}
