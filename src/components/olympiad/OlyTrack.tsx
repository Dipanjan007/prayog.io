"use client";

import { G, loopLayout, planBank, planLoop, type BankScene, type LoopScene } from "@/lib/sim/oly-track";
import { C, arrow, dashed, fitWorld, label, speedFor, stopwatch, useSimCanvas } from "./canvas";

interface Props {
  scene: BankScene | LoopScene;
  idle: boolean;
  runKey: number;
  onDone?: () => void;
}

const RAD = Math.PI / 180;

/** Reusable circular-motion sim: a banked bend (top view + road section) or a vertical loop fed by a slope or a spring. */
export default function OlyTrack({ scene, idle, runKey, onDone }: Props) {
  const plan = scene.kind === "bank" ? planBank(scene) : planLoop(scene);
  const { ref } = useSimCanvas(
    (ctx, w, h, t) => (scene.kind === "bank" ? drawBank(ctx, w, h, scene, t, idle) : drawLoop(ctx, w, h, scene, t, idle)),
    plan.duration,
    runKey,
    onDone,
  );
  return (
    <canvas
      ref={ref}
      className="h-60 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
      role="img"
      aria-label={
        scene.kind === "bank"
          ? `A car going round a banked bend of radius ${scene.r} m, seen from above, with a cross-section of the road. ${idle ? "" : plan.outcome.text}`
          : `A cart ${scene.start.type === "height" ? "rolls down a slope" : "is fired by a spring"} into a vertical loop of radius ${scene.R} m. ${idle ? "" : plan.outcome.text}`
      }
    />
  );
}

function drawBank(ctx: CanvasRenderingContext2D, w: number, h: number, s: BankScene, t: number, idle: boolean) {
  const plan = planBank(s);
  const raw = idle ? { slide: 0, angle: 0 } : plan.at(t);
  // Once the car is well off its lane we stop drawing it further away.
  const st = { ...raw, slide: Math.max(-1.8 * s.lane, Math.min(1.8 * s.lane, raw.slide)) };
  const split = w < 520 ? w * 0.52 : w * 0.5;

  // Left: top view of the bend. The road is drawn wider than scale so the lane shows.
  const cx = split * 0.42;
  const cy = h * 0.56;
  const R = Math.min(split * 0.36, h * 0.36);
  const half = Math.max(12, R * 0.16);
  const pxPerM = half / s.lane;
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = half * 2;
  ctx.beginPath();
  ctx.arc(cx, cy, R, Math.PI * 0.95, Math.PI * 2.05);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1;
  for (const r of [R - half, R + half]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * 0.95, Math.PI * 2.05);
    ctx.stroke();
  }
  dashed(ctx, [[cx, cy], [cx - R, cy]], C.faint, 1);
  label(ctx, `r = ${s.r} m`, cx - R / 2, cy + 10, split, { align: "center", size: 10, color: C.dim });
  // Car: radius shrinks if it slides down (inward).
  const rCar = R - st.slide * pxPerM;
  const a = Math.PI + st.angle;
  const carX = cx + rCar * Math.cos(a);
  const carY = cy + rCar * Math.sin(a);
  const off = Math.abs(raw.slide) > s.lane;
  ctx.save();
  ctx.translate(carX, carY);
  ctx.rotate(a + Math.PI / 2);
  ctx.fillStyle = off ? C.rose : C.ball;
  ctx.fillRect(-5, -9, 10, 18);
  ctx.restore();
  label(ctx, "Top view", 8, 14, w, { size: 10, color: C.dim });
  label(ctx, `${(s.v * 3.6).toFixed(0)} km/h`, 8, h - 12, w, { size: 10, color: C.ball });

  // Right: cross-section of the road at the bank angle, centre of the bend on the left.
  const th = idle ? 0 : s.thetaDeg * RAD;
  const ox = split + (w - split) * 0.12;
  const len = (w - split) * 0.78;
  const baseY = h * 0.78;
  const ex = ox + len * Math.cos(th);
  const ey = baseY - len * Math.sin(th);
  ctx.fillStyle = "rgba(251,146,60,0.18)";
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ox, baseY);
  ctx.lineTo(ex, ey);
  ctx.lineTo(ex, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  label(ctx, idle ? "θ = ?" : `θ = ${s.thetaDeg.toFixed(1)}°`, ox + 30, baseY - 9, w, { size: 11, color: C.orange, bold: true });
  label(ctx, "← centre of bend", ox, baseY + 14, w, { size: 10, color: C.dim });
  label(ctx, "Road section", w - 8, 14, w, { size: 10, color: C.dim, align: "right" });
  // Car on the slope: middle of the road, moved by the slide (down-slope = towards the centre).
  const kSec = (len * 0.32) / s.lane;
  const along = Math.max(-len * 0.45, Math.min(len * 0.45, -st.slide * kSec));
  const mx = ox + (len / 2 + along) * Math.cos(th);
  const my = baseY - (len / 2 + along) * Math.sin(th);
  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(-th);
  ctx.fillStyle = off ? C.rose : C.ball;
  ctx.fillRect(-14, -14, 28, 14);
  ctx.restore();
  if (!idle) {
    // Forces: weight down, normal force perpendicular to the road.
    const nx = -Math.sin(th);
    const ny = -Math.cos(th);
    arrow(ctx, mx, my - 7, mx + nx * 40, my - 7 + ny * 40, C.cyan, 1.5);
    arrow(ctx, mx, my - 7, mx, my + 26, C.pink, 1.5);
    label(ctx, "N", mx + nx * 40 - 10, my - 7 + ny * 40, w, { size: 10, color: C.cyan });
    label(ctx, "mg", mx + 4, my + 28, w, { size: 10, color: C.pink });
    const slipText = Math.abs(plan.slip) < 0.02 ? "no sliding" : plan.slip > 0 ? "sliding inward" : "sliding outward";
    label(ctx, slipText, w - 8, h - 12, w, { align: "right", size: 11, color: Math.abs(plan.slip) < 0.1 ? C.lime : C.rose, bold: true });
  } else {
    label(ctx, "Enter the bank angle, then test it", w - 8, h - 12, w, { align: "right", size: 10, color: C.dim });
  }
}

function drawLoop(ctx: CanvasRenderingContext2D, w: number, h: number, s: LoopScene, t: number, idle: boolean) {
  const plan = planLoop(s);
  const L = loopLayout(idle && s.start.type === "height" ? { ...s, start: { type: "height", h: 3 * s.R } } : s);
  const hShow = s.start.type === "height" ? (idle ? 3 * s.R : s.start.h) : 0;
  const x0 = s.start.type === "spring" ? -0.2 * s.R : -0.5;
  const y1 = Math.max(2.25 * s.R, hShow * 1.08);
  const { k, X, Y } = fitWorld(w, h, { x0, x1: L.exitX, y0: 0, y1 }, { l: 10, r: 10, t: 30, b: 20 });

  // Floor.
  ctx.fillStyle = C.grass;
  ctx.fillRect(0, Y(0), w, h - Y(0));
  ctx.strokeStyle = C.track;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (s.start.type === "height") {
    if (idle) ctx.setLineDash([5, 4]);
    ctx.moveTo(X(0), Y(hShow));
    ctx.lineTo(X(L.ramp), Y(0));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(X(L.ramp), Y(0));
  } else ctx.moveTo(X(x0), Y(0));
  ctx.lineTo(X(L.exitX), Y(0));
  ctx.stroke();
  // Loop.
  ctx.beginPath();
  ctx.arc(X(L.loopX), Y(s.R), s.R * k, 0, Math.PI * 2);
  ctx.stroke();
  label(ctx, `R = ${s.R} m`, X(L.loopX), Y(s.R), w, { align: "center", size: 10, color: C.dim });
  // Rough patch.
  if (s.patch > 0) {
    ctx.fillStyle = "rgba(251,146,60,0.45)";
    ctx.fillRect(X(L.patchStart), Y(0) - 3, s.patch * k, 6);
    label(ctx, `rough ${s.patch} m, μₖ = ${s.mu}`, X(L.patchStart + s.patch / 2), Y(0) + 13, w, { align: "center", size: 10, color: C.orange });
  }
  // Height marker or spring.
  if (s.start.type === "height") {
    dashed(ctx, [[X(0) - 2, Y(hShow)], [X(0) - 2, Y(0)]], C.faint, 1);
    label(ctx, idle ? "h = ?" : `h = ${hShow.toFixed(2)} m`, X(0) + 6, Y(hShow) - 10, w, { size: 11, color: C.cyan, bold: true });
  } else {
    const wall = X(x0) + 2;
    ctx.fillStyle = C.dim;
    ctx.fillRect(wall - 4, Y(0.5 * s.R), 4, Y(0) - Y(0.5 * s.R));
    const relaxed = L.launch * 0.8;
    const p = idle ? null : plan.at(t);
    const launchX = L.launch;
    // Before release the spring is squeezed by x (drawn to scale but at least a little).
    const squeezed = Math.max(0.15 * relaxed, relaxed - (s.start.type === "spring" ? s.start.x : 0));
    const springEnd = p && p.x > launchX ? relaxed : idle ? relaxed : squeezed;
    zigzag(ctx, wall, X(x0 + springEnd), Y(0.18 * s.R), C.lime);
    label(ctx, idle ? "x = ?" : `x = ${((s.start.type === "spring" ? s.start.x : 0) * 100).toFixed(1)} cm`, wall + 4, Y(0.5 * s.R) - 10, w, { size: 11, color: C.lime, bold: true });
  }

  if (idle) {
    if (s.start.type === "spring") {
      ctx.fillStyle = C.ball;
      ctx.beginPath();
      ctx.arc(X(L.launch), Y(0) - 5, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    label(ctx, "Enter your answer, then test it", w - 8, 14, w, { align: "right", color: C.dim });
    return;
  }

  // Trail and cart.
  ctx.strokeStyle = "rgba(250,204,21,0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  let first = true;
  for (const q of plan.path) {
    if (q.t > t) break;
    if (first) ctx.moveTo(X(q.p.x), Y(q.p.y));
    else ctx.lineTo(X(q.p.x), Y(q.p.y));
    first = false;
  }
  ctx.stroke();
  let p = plan.at(t);
  if (s.start.type === "spring" && t === 0) p = { ...p, x: L.launch };
  const onLoop = p.phi !== null;
  // Draw the cart just inside the track.
  let px = X(p.x);
  let py = Y(p.y);
  if (onLoop) {
    px -= 5 * Math.sin(p.phi!);
    py -= 5 * Math.cos(p.phi!);
  } else if (!p.falling) py -= 5;
  ctx.fillStyle = p.falling ? C.rose : C.ball;
  ctx.beginPath();
  ctx.arc(px, py, 5, 0, Math.PI * 2);
  ctx.fill();
  const readout = onLoop ? `v = ${p.v.toFixed(2)} m/s   N = ${Math.max(0, (p.v * p.v) / s.R / G + Math.cos(p.phi!)).toFixed(2)} × mg` : `v = ${p.v.toFixed(2)} m/s`;
  label(ctx, readout, 8, 14, w, { color: C.ball, size: 12, bold: true });
  stopwatch(ctx, w, Math.min(t, plan.duration), undefined, speedFor(plan.duration));
  if (s.topTarget > 0) label(ctx, `goal at top: N = ${s.topTarget} × mg`, w - 8, w < 480 ? 50 : 32, w, { align: "right", size: 10, color: C.dim });
}

function zigzag(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, color: string) {
  const n = 8;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  for (let i = 1; i < n; i++) ctx.lineTo(x1 + ((x2 - x1) * i) / n, y + (i % 2 ? -5 : 5));
  ctx.lineTo(x2, y);
  ctx.stroke();
  arrow(ctx, x2, y, x2 + 0.1, y, color, 1);
}
