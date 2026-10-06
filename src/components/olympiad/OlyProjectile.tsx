"use client";

import { planArc, planRiver, projectileAt, type ArcScene, type RiverScene } from "@/lib/sim/oly-projectile";
import { C, arrow, dashed, fitWorld, label, speedFor, stopwatch, useSimCanvas } from "./canvas";

interface Props {
  scene: ArcScene | RiverScene;
  /** Before the first run: hide anything that depends on the student's answer. */
  idle: boolean;
  runKey: number;
  onDone?: () => void;
}

/** Reusable projectile sim: a side-view arc (walls, fielders, moving baskets) or a top-view river crossing. */
export default function OlyProjectile({ scene, idle, runKey, onDone }: Props) {
  const plan = scene.kind === "arc" ? planArc(scene) : planRiver(scene);
  const { ref } = useSimCanvas(
    (ctx, w, h, t) => (scene.kind === "arc" ? drawArc(ctx, w, h, scene, t, idle) : drawRiver(ctx, w, h, scene, t, idle, speedFor(plan.duration))),
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
        scene.kind === "arc"
          ? `Side view of a throw at ${Math.round(scene.angleDeg)} degrees${scene.barrier ? `, with a ${scene.barrier.type} ${scene.barrier.x} m away` : ""}${scene.target ? " and a basket moving away" : ""}. ${idle ? "" : plan.outcome.text}`
          : `Top view of a ferry crossing a ${scene.W} m wide river with the current flowing to the right. ${idle ? "" : plan.outcome.text}`
      }
    />
  );
}

function drawArc(ctx: CanvasRenderingContext2D, w: number, h: number, s: ArcScene, t: number, idle: boolean) {
  const plan = planArc(s);
  const T = plan.duration;
  // World box from the fixed geometry, stretched to fit this run's path.
  let x1 = (s.barrier?.x ?? 20) * 1.15;
  let y1 = (s.barrier?.h ?? 3) * 1.8;
  if (s.target) x1 = Math.max(x1, s.target.x0 + s.target.u * (idle ? 2.5 : T) + 2);
  if (!idle) {
    const vy = s.v * Math.sin((s.angleDeg * Math.PI) / 180);
    y1 = Math.max(y1, s.h0 + (vy * vy) / (2 * 9.8) + 1);
    x1 = Math.max(x1, plan.end.x + 2);
  }
  x1 = Math.min(x1, Math.max((s.barrier?.x ?? 30) * 2.2, s.target ? s.target.x0 + s.target.u * 4 : 0));
  y1 = Math.min(y1, x1 * 0.8);
  const { k, X, Y } = fitWorld(w, h, { x0: -2, x1, y0: 0, y1 }, { l: 12, r: 12, t: 26, b: 26 });

  // Ground.
  ctx.fillStyle = C.grass;
  ctx.fillRect(0, Y(0), w, h - Y(0));
  ctx.strokeStyle = C.ground;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, Y(0));
  ctx.lineTo(w, Y(0));
  ctx.stroke();

  // Thrower (stick figure, drawn bigger than scale so it shows).
  const fig = Math.max(18, s.h0 * k * 1.2);
  person(ctx, X(0) - 4, Y(0), fig, C.cyan);

  // Launch angle.
  ctx.strokeStyle = C.dim;
  ctx.beginPath();
  ctx.arc(X(0), Y(s.h0), 18, -(s.angleDeg * Math.PI) / 180, 0);
  ctx.stroke();
  label(ctx, `${Math.round(s.angleDeg)}°`, X(0) + 22, Y(s.h0) - 7, w, { size: 10 });

  // Barrier.
  if (s.barrier) {
    const bx = X(s.barrier.x);
    if (s.barrier.type === "wall") {
      ctx.fillStyle = "rgba(251,146,60,0.35)";
      ctx.strokeStyle = C.orange;
      ctx.fillRect(bx - 4, Y(s.barrier.h), 8, Y(0) - Y(s.barrier.h));
      ctx.strokeRect(bx - 4, Y(s.barrier.h), 8, Y(0) - Y(s.barrier.h));
      label(ctx, `${s.barrier.h} m wall`, bx, Y(s.barrier.h) - 10, w, { align: "center", size: 10, color: C.orange });
    } else {
      const reachPx = Y(0) - Y(s.barrier.h);
      person(ctx, bx, Y(0), Math.max(18, reachPx * 0.62), C.orange, true);
      dashed(ctx, [[bx - 14, Y(s.barrier.h)], [bx + 14, Y(s.barrier.h)]], C.orange);
      label(ctx, `reach ${s.barrier.h} m`, bx - 6, Y(s.barrier.h) - 10, w, { align: "right", size: 10, color: C.orange });
      // Boundary rope.
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillRect(bx + 3, Y(0) - 2, 4, 2);
    }
    label(ctx, `${s.barrier.x} m`, bx, Y(0) + 12, w, { align: "center", size: 10, color: C.dim });
  }

  // Moving basket on its trolley.
  if (s.target) {
    const tx = s.target.x0 + s.target.u * t;
    const left = X(tx - s.target.w / 2);
    const right = X(tx + s.target.w / 2);
    ctx.fillStyle = "rgba(167,139,250,0.25)";
    ctx.strokeStyle = C.violet;
    ctx.fillRect(left - 10, Y(s.h0 - 0.6), right - left + 20, Y(0.3) - Y(s.h0 - 0.6));
    ctx.strokeRect(left - 10, Y(s.h0 - 0.6), right - left + 20, Y(0.3) - Y(s.h0 - 0.6));
    ctx.beginPath();
    ctx.arc(left - 4, Y(0.15), 4, 0, Math.PI * 2);
    ctx.arc(right + 4, Y(0.15), 4, 0, Math.PI * 2);
    ctx.fillStyle = C.violet;
    ctx.fill();
    ctx.strokeStyle = C.pink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left, Y(s.h0));
    ctx.lineTo(left + 3, Y(s.h0 - 0.6));
    ctx.lineTo(right - 3, Y(s.h0 - 0.6));
    ctx.lineTo(right, Y(s.h0));
    ctx.stroke();
    arrow(ctx, right + 12, Y(s.h0 - 0.2), right + 30, Y(s.h0 - 0.2), C.violet, 1.5);
    label(ctx, `basket ${s.target.u} m/s →`, (left + right) / 2, Y(0) + 12, w, { align: "center", size: 10, color: C.violet });
  }

  if (idle) {
    label(ctx, "Enter your answer, then test it", w / 2, 14, w, { align: "center", color: C.dim });
    return;
  }

  // Trail and ball.
  ctx.strokeStyle = "rgba(250,204,21,0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  const n = 80;
  for (let i = 0; i <= n; i++) {
    const tt = (Math.min(t, T) * i) / n;
    const p = projectileAt(s.v, s.angleDeg, s.h0, tt);
    if (i) ctx.lineTo(X(p.x), Y(p.y));
    else ctx.moveTo(X(p.x), Y(p.y));
  }
  ctx.stroke();
  const p = plan.at(t);
  ctx.fillStyle = C.ball;
  ctx.beginPath();
  ctx.arc(X(p.x), Y(p.y), 5, 0, Math.PI * 2);
  ctx.fill();
  stopwatch(ctx, w, Math.min(t, T));
  label(ctx, `v = ${s.v.toFixed(2)} m/s`, 8, 14, w, { color: C.ball, size: 12, bold: true });
}

function person(ctx: CanvasRenderingContext2D, x: number, ground: number, hgt: number, color: string, armsUp = false) {
  const head = hgt * 0.12;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - hgt * 0.15, ground);
  ctx.lineTo(x, ground - hgt * 0.45);
  ctx.lineTo(x + hgt * 0.15, ground);
  ctx.moveTo(x, ground - hgt * 0.45);
  ctx.lineTo(x, ground - hgt * 0.8);
  if (armsUp) {
    ctx.moveTo(x, ground - hgt * 0.75);
    ctx.lineTo(x - hgt * 0.12, ground - hgt * 1.15);
    ctx.moveTo(x, ground - hgt * 0.75);
    ctx.lineTo(x + hgt * 0.12, ground - hgt * 1.15);
  } else {
    ctx.moveTo(x - hgt * 0.2, ground - hgt * 0.6);
    ctx.lineTo(x + hgt * 0.25, ground - hgt * 0.75);
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, ground - hgt * 0.8 - head, head, 0, Math.PI * 2);
  ctx.stroke();
}

function drawRiver(ctx: CanvasRenderingContext2D, w: number, h: number, s: RiverScene, t: number, idle: boolean, speed: number) {
  const plan = planRiver(s);
  const bank = 30;
  const top = bank;
  const bottom = h - bank;
  const span = Math.max(s.W * 0.9, Math.abs(plan.end.down) * 2.4, 160);
  const kx = w / span;
  const ky = (bottom - top) / s.W;
  const X = (down: number) => w / 2 + down * kx;
  const Y = (across: number) => bottom - across * ky;

  // Banks and water.
  ctx.fillStyle = "rgba(163,230,53,0.12)";
  ctx.fillRect(0, 0, w, top);
  ctx.fillRect(0, bottom, w, h - bottom);
  ctx.fillStyle = "rgba(56,189,248,0.12)";
  ctx.fillRect(0, top, w, bottom - top);
  // Current arrows.
  for (let i = 0; i < 4; i++) {
    const y = top + ((i + 0.5) * (bottom - top)) / 4;
    for (let x = 30; x < w; x += 110) arrow(ctx, x + (i % 2) * 40, y, x + 30 + (i % 2) * 40, y, "rgba(125,211,252,0.35)", 1.5);
  }
  label(ctx, `current ${s.c} m/s →`, 8, top + 10, w, { size: 10, color: "rgba(125,211,252,0.8)" });
  label(ctx, `${s.W} m wide`, w - 8, (top + bottom) / 2, w, { align: "right", size: 10, color: C.dim });

  // Ghat.
  const gx = X(s.ghat);
  ctx.fillStyle = "rgba(251,146,60,0.35)";
  ctx.strokeStyle = C.orange;
  const gw = Math.max(10, 2 * s.half * kx);
  ctx.fillRect(gx - gw / 2, top - 12, gw, 12);
  ctx.strokeRect(gx - gw / 2, top - 12, gw, 12);
  label(ctx, "Kolkata ghat", gx, top - 20, w, { align: "center", size: 10, color: C.orange });
  label(ctx, "Howrah", X(0), bottom + 16, w, { align: "center", size: 10, color: C.dim });
  dashed(ctx, [[X(0), bottom], [gx, top]], C.faint);

  const pos = idle ? { across: 0, down: 0 } : plan.at(t);
  // Trail.
  if (!idle) {
    ctx.strokeStyle = "rgba(250,204,21,0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(X(0), Y(0));
    ctx.lineTo(X(pos.down), Y(pos.across));
    ctx.stroke();
  }
  // Ferry, pointing along its heading through the water.
  const ang = idle ? 0 : (s.headingDeg * Math.PI) / 180;
  const bx = X(pos.down);
  const by = Y(pos.across);
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(-ang);
  ctx.fillStyle = C.ball;
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.lineTo(6, 6);
  ctx.lineTo(-6, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  if (!idle) {
    const hx = -Math.sin(ang);
    const hy = Math.cos(ang);
    arrow(ctx, bx, by, bx + hx * 36, by - hy * 36, C.cyan, 1.5);
    label(ctx, `heading ${s.headingDeg.toFixed(1)}°`, 8, h - 12, w, { size: 11, color: C.cyan, bold: true });
    const shownT = Math.min(t, plan.duration);
    label(ctx, `t = ${shownT.toFixed(0)} s${speed > 1.05 ? `  ×${Math.round(speed)} speed` : ""}`, w - 8, h - 12, w, { align: "right", size: 11, color: "rgba(165,243,252,0.9)", bold: true });
  } else {
    label(ctx, "Enter a heading, then test it", w - 8, h - 12, w, { align: "right", color: C.dim });
  }
}
