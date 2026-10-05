"use client";

import { planIncline, type InclineScene } from "@/lib/sim/oly-incline";
import { C, arrow, fitWorld, label, speedFor, stopwatch, useSimCanvas } from "./canvas";

interface Props {
  scene: InclineScene;
  idle: boolean;
  runKey: number;
  onDone?: () => void;
}

const RAD = Math.PI / 180;

/** Reusable Newton's-laws sim: an Atwood machine, a block sliding down a slope, or a block hauled up a slope by a hanging mass. */
export default function OlyIncline({ scene, idle, runKey, onDone }: Props) {
  const plan = planIncline(scene);
  const { ref } = useSimCanvas(
    (ctx, w, h, t) => {
      if (scene.kind === "atwood") drawAtwood(ctx, w, h, scene, t, idle);
      else if (scene.kind === "slide") drawSlide(ctx, w, h, scene, t, idle);
      else drawPulley(ctx, w, h, scene, t, idle);
      if (!idle) stopwatch(ctx, w, Math.min(t, plan.duration), scene.kind === "slide" ? undefined : scene.targetT, speedFor(plan.duration));
    },
    plan.duration,
    runKey,
    onDone,
  );
  const what =
    scene.kind === "atwood"
      ? "Two masses hang over a pulley: a bucket and a counterweight."
      : scene.kind === "slide"
        ? `A crate slides down a ${scene.thetaDeg}° ramp ${scene.L} m long towards its edge.`
        : `A crate on a ${scene.thetaDeg}° ramp is pulled up by a counterweight hanging over a pulley.`;
  return (
    <canvas
      ref={ref}
      className="h-60 w-full rounded-2xl border border-line bg-well sm:h-80"
      role="img"
      aria-label={`${what} ${idle ? "" : plan.outcome.text}`}
    />
  );
}

function box(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, angle: number, fill: string, stroke: string, text?: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.fillRect(-size / 2, -size / 2, size, size);
  ctx.strokeRect(-size / 2, -size / 2, size, size);
  if (text) {
    ctx.fillStyle = "white";
    ctx.font = "600 10px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, 0);
  }
  ctx.restore();
}

function ground(ctx: CanvasRenderingContext2D, w: number, h: number, y: number) {
  ctx.fillStyle = C.grass;
  ctx.fillRect(0, y, w, h - y);
  ctx.strokeStyle = C.ground;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(w, y);
  ctx.stroke();
}

function drawAtwood(ctx: CanvasRenderingContext2D, w: number, h: number, s: Extract<InclineScene, { kind: "atwood" }>, t: number, idle: boolean) {
  const plan = planIncline(s);
  const top = s.d + 2.1;
  const { k, X, Y } = fitWorld(w, h, { x0: -1.6, x1: 1.6, y0: 0, y1: top + 0.3 }, { l: 10, r: 10, t: 28, b: 18 });
  ground(ctx, w, h, Y(0));
  const pr = 0.28;
  const px = 0;
  const py = top;
  // Beam and pulley.
  ctx.strokeStyle = C.dim;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(X(-1), Y(top + 0.3));
  ctx.lineTo(X(1), Y(top + 0.3));
  ctx.moveTo(X(0), Y(top + 0.3));
  ctx.lineTo(X(0), Y(top));
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(X(px), Y(py), pr * k, 0, Math.PI * 2);
  ctx.stroke();

  const sMove = idle ? 0 : plan.at(t).s;
  const size = 0.45;
  const bucketBottom = s.d - sMove;
  const cwBottom = 0.5 + sMove;
  // Ropes.
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(X(-pr), Y(py));
  ctx.lineTo(X(-pr), Y(bucketBottom + size));
  ctx.moveTo(X(pr), Y(py));
  ctx.lineTo(X(pr), Y(cwBottom + size));
  ctx.stroke();
  box(ctx, X(-pr), Y(bucketBottom + size / 2), size * k, 0, "rgba(34,211,238,0.3)", C.cyan, `${s.m1} kg`);
  box(ctx, X(pr), Y(cwBottom + size / 2), size * k * 0.9, 0, "rgba(167,139,250,0.3)", C.violet, idle ? "m = ?" : `${s.m2.toFixed(2)}`);
  // Start height marker.
  ctx.strokeStyle = C.faint;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(X(-1.3), Y(s.d));
  ctx.lineTo(X(-0.55), Y(s.d));
  ctx.stroke();
  ctx.setLineDash([]);
  arrow(ctx, X(-1.2), Y(s.d), X(-1.2), Y(0) - 1, C.dim, 1);
  label(ctx, `${s.d} m`, X(-1.15), (Y(s.d) + Y(0)) / 2, w, { size: 10 });
  if (idle) label(ctx, "Enter the counterweight, then test it", 8, 14, w, { color: C.dim });
}

function drawSlide(ctx: CanvasRenderingContext2D, w: number, h: number, s: Extract<InclineScene, { kind: "slide" }>, t: number, idle: boolean) {
  const plan = planIncline(s);
  const th = s.thetaDeg * RAD;
  const drop = 1;
  const topY = drop + s.L * Math.sin(th);
  const endX = s.L * Math.cos(th);
  const { k, X, Y } = fitWorld(w, h, { x0: -0.4, x1: endX + 1.6, y0: 0, y1: topY + 0.6 }, { l: 10, r: 10, t: 28, b: 18 });
  ground(ctx, w, h, Y(0));
  // Ramp on its support, ending at a ledge with a drop beyond.
  ctx.fillStyle = "rgba(251,146,60,0.18)";
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(X(0), Y(topY));
  ctx.lineTo(X(endX), Y(drop));
  ctx.lineTo(X(endX), Y(0));
  ctx.lineTo(X(0), Y(0));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  label(ctx, `${s.thetaDeg}°`, X(endX) - 34, Y(drop) - 8, w, { size: 10, color: C.orange });
  label(ctx, `${s.L} m ramp`, X(endX / 2) + 6, Y(drop + (s.L * Math.sin(th)) / 2) - 10, w, { size: 10, color: C.dim });
  label(ctx, "edge", X(endX), Y(drop) + 12, w, { align: "center", size: 10, color: C.rose });

  const size = 0.4;
  const st = idle ? { s: 0, v: s.v0, fall: 0 } : plan.at(t);
  let cx: number;
  let cy: number;
  let ang = th;
  if (st.fall > 0) {
    cx = endX + (st.s - s.L);
    cy = Math.max(size / 2, drop - st.fall + size / 2);
    ang = th * 0.5;
  } else {
    const along = Math.min(st.s, s.L);
    cx = along * Math.cos(th) + (size / 2) * Math.sin(th);
    cy = topY - along * Math.sin(th) + (size / 2) * Math.cos(th);
  }
  box(ctx, X(cx), Y(cy), size * k, ang, "rgba(34,211,238,0.3)", C.cyan);
  if (idle) {
    arrow(ctx, X(cx) + 10, Y(cy) - 14, X(cx) + 10 + 28 * Math.cos(th), Y(cy) - 14 + 28 * Math.sin(th), C.ball, 1.5);
    label(ctx, `${s.v0} m/s`, X(cx) + 14, Y(cy) - 26, w, { size: 10, color: C.ball });
    label(ctx, "Enter μₖ, then test it", 8, 14, w, { color: C.dim });
  } else {
    label(ctx, `μₖ = ${s.muK.toFixed(3)}   v = ${Math.max(0, st.v).toFixed(2)} m/s`, 8, 14, w, { color: C.ball, size: 12, bold: true });
  }
}

function drawPulley(ctx: CanvasRenderingContext2D, w: number, h: number, s: Extract<InclineScene, { kind: "pulley" }>, t: number, idle: boolean) {
  const plan = planIncline(s);
  const th = s.thetaDeg * RAD;
  const size = 0.42;
  const P = s.d + size / 2 + 0.35; // pulley position along the slope
  const topX = P * Math.cos(th);
  const topY = P * Math.sin(th);
  const pr = 0.2;
  const low = -s.d - 0.4;
  const { k, X, Y } = fitWorld(w, h, { x0: -0.3, x1: topX + 1.4, y0: low - 0.3, y1: topY + 0.5 }, { l: 10, r: 10, t: 28, b: 14 });
  // Dock: ramp on a pier, with water below the far side.
  ctx.fillStyle = "rgba(56,189,248,0.14)";
  ctx.fillRect(X(topX + 0.1), Y(low), w - X(topX + 0.1), h - Y(low));
  ground(ctx, X(topX + 0.1), h, Y(0));
  ctx.fillStyle = "rgba(251,146,60,0.18)";
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(X(0), Y(0));
  ctx.lineTo(X(topX), Y(topY));
  ctx.lineTo(X(topX + 0.1), Y(topY));
  ctx.lineTo(X(topX + 0.1), Y(low - 0.3));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(X(0), Y(0));
  ctx.lineTo(X(topX), Y(topY));
  ctx.lineTo(X(topX), Y(0));
  ctx.closePath();
  ctx.fill();
  label(ctx, `${s.thetaDeg}°`, X(0) + 26, Y(0) - 8, w, { size: 10, color: C.orange });

  // Pulley.
  const pxW = topX + 0.12;
  const pyW = topY + pr;
  ctx.strokeStyle = C.dim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(X(pxW), Y(pyW), pr * k, 0, Math.PI * 2);
  ctx.stroke();

  const sMove = idle ? 0 : plan.at(t).s;
  const along = size / 2 + 0.05 + sMove;
  const cx = along * Math.cos(th) - (size / 2) * Math.sin(th);
  const cy = along * Math.sin(th) + (size / 2) * Math.cos(th);
  // Rope from crate to pulley top, then down to the counterweight.
  const cwTop = topY - 0.25 - sMove;
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(X(cx + (size / 2) * Math.cos(th)), Y(cy + (size / 2) * Math.sin(th)));
  ctx.lineTo(X(pxW - pr * Math.sin(th)), Y(pyW + pr * Math.cos(th)));
  ctx.moveTo(X(pxW + pr), Y(pyW));
  ctx.lineTo(X(pxW + pr), Y(cwTop));
  ctx.stroke();
  box(ctx, X(cx), Y(cy), size * k, -th, "rgba(34,211,238,0.3)", C.cyan, `${s.m1} kg`);
  const cs = size * 0.9;
  box(ctx, X(pxW + pr), Y(cwTop - cs / 2), cs * k, 0, "rgba(167,139,250,0.3)", C.violet, idle ? "M = ?" : `${s.m2.toFixed(2)}`);
  label(ctx, `${s.d} m to the pulley`, X(topX * 0.55), Y(topY * 0.25), w, { size: 10, color: C.dim });
  label(ctx, `μₖ = ${s.muK}`, X(topX * 0.3), Y(0) + 12, w, { size: 10, color: C.dim });
  if (idle) label(ctx, "Enter the counterweight, then test it", 8, 14, w, { color: C.dim });
  else label(ctx, `v = ${Math.max(0, plan.at(t).v).toFixed(2)} m/s`, 8, 14, w, { color: C.ball, size: 12, bold: true });
}
