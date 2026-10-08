"use client";

import { planBench, planLaser, refractAngle, traceRay, type BenchScene, type LaserScene, type OpticsScene } from "@/lib/sim/oly-optics";
import { C, arrow, dashed, fitWorld, label, useSimCanvas } from "./canvas";

interface Props {
  scene: OpticsScene;
  idle: boolean;
  runKey: number;
  onDone?: () => void;
}

const RAD = Math.PI / 180;
const RAY_COUNT = 5;
/** Share of the run spent drawing the rays; the rest shows the result. */
const REVEAL = 0.75;

/** Optics sim: thin lenses on an optical bench with a screen, or a laser beam refracted into water. */
export default function OlyOptics({ scene, idle, runKey, onDone }: Props) {
  const plan = scene.kind === "optics-bench" ? planBench(scene) : planLaser(scene);
  const { ref } = useSimCanvas(
    (ctx, w, h, t) => (scene.kind === "optics-bench" ? drawBench(ctx, w, h, scene, t / plan.duration, idle) : drawLaser(ctx, w, h, scene, t / plan.duration, idle)),
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
        scene.kind === "optics-bench"
          ? `An optical bench with a ${scene.object.name}, ${scene.lenses.length === 1 ? "a convex lens" : `${scene.lenses.length} convex lenses`} and a screen. ${idle ? "" : plan.outcome.text}`
          : `A boat with a tilted laser shines into a tank of water towards a ring on the floor. ${idle ? "" : plan.outcome.text}`
      }
    />
  );
}

/* ---------- Optical bench ---------- */

function drawBench(ctx: CanvasRenderingContext2D, w: number, h: number, s: BenchScene, p: number, idle: boolean) {
  const plan = planBench(s);
  const img = plan.image;
  const last = s.lenses[s.lenses.length - 1];
  const x1 = Math.max(s.bench, idle ? 0 : s.screen + 6);
  const padL = 14;
  const padR = 14;
  const kx = (w - padL - padR) / x1;
  const X = (x: number) => padL + x * kx;
  const ymax = 1.3 * Math.max(s.aperture, s.object.h, Number.isFinite(img.h) ? Math.min(Math.abs(img.h), 3 * s.aperture) : 0);
  const midY = h * 0.5 - 4;
  const ky = (h * 0.5 - 40) / ymax;
  const Y = (y: number) => midY - y * ky;

  // Axis and ruler.
  dashed(ctx, [[0, midY], [w, midY]], C.faint, 1);
  const rulerY = h - 16;
  ctx.strokeStyle = C.dim;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(X(0), rulerY);
  ctx.lineTo(X(x1), rulerY);
  ctx.stroke();
  const labelEvery = kx * 50 > 60 ? 25 : 50;
  for (let m = 0; m <= x1 + 1e-6; m += 10) {
    const big = m % labelEvery === 0;
    ctx.beginPath();
    ctx.moveTo(X(m), rulerY);
    ctx.lineTo(X(m), rulerY - (big ? 6 : 3));
    ctx.stroke();
    if (big) label(ctx, `${m}`, X(m), rulerY + 8, w, { align: "center", size: 9, color: C.dim });
  }

  // Lenses, with their focal points.
  s.lenses.forEach((L, i) => {
    const top = Y(s.aperture * 1.1);
    const bot = Y(-s.aperture * 1.1);
    ctx.fillStyle = "rgba(103,232,249,0.16)";
    ctx.strokeStyle = C.cyan;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(X(L.x), midY, 5, (bot - top) / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (const fx of [L.x - L.f, L.x + L.f]) {
      if (fx < 0 || fx > x1) continue;
      ctx.fillStyle = C.cyan;
      ctx.beginPath();
      ctx.arc(X(fx), midY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    const name = s.lenses.length > 1 ? `L${i + 1}: f = ${L.f} cm` : `f = ${L.f} cm`;
    label(ctx, name, X(L.x), top - 9, w, { align: "center", size: 10, color: C.cyan });
  });

  // Object.
  arrow(ctx, X(s.object.x), midY, X(s.object.x), Y(s.object.h), C.orange, 2);
  label(ctx, s.object.name, X(s.object.x), midY + 12, w, { align: "center", size: 10, color: C.orange });

  if (idle) {
    label(ctx, "Where does the screen go?", w - 8, 14, w, { align: "right", size: 11, color: C.dim });
    return;
  }

  // Screen.
  const sx = X(s.screen);
  const sTop = Y(ymax * 0.95);
  const sBot = Y(-ymax * 0.95);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillRect(sx - 1.5, sTop, 3, sBot - sTop);
  const where = s.ask === "mark" ? `screen at ${s.screen.toFixed(1)} cm` : `card ${(s.screen - last.x).toFixed(1)} cm behind L${s.lenses.length}`;
  label(ctx, where, sx, sTop - 9, w, { align: "center", size: 10, color: "rgba(255,255,255,0.85)", bold: true });

  // Rays from the tip of the object, revealed from left to right.
  const reveal = Math.min(1, p / REVEAL);
  const xFront = s.object.x + reveal * (s.screen - s.object.x);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 22, w, h - 44);
  ctx.clip();
  const hits: number[] = [];
  for (let k = 0; k < RAY_COUNT; k++) {
    const yAt = s.aperture * 0.9 * (1 - (2 * k) / (RAY_COUNT - 1));
    const pts = traceRay(s.object, s.lenses, yAt, s.screen);
    hits.push(pts[pts.length - 1][1]);
    ctx.strokeStyle = "rgba(250,204,21,0.7)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(X(pts[0][0]), Y(pts[0][1]));
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1];
      const [bx, by] = pts[i];
      if (bx <= xFront) ctx.lineTo(X(bx), Y(by));
      else {
        const f = (xFront - ax) / (bx - ax);
        ctx.lineTo(X(xFront), Y(ay + f * (by - ay)));
        break;
      }
    }
    ctx.stroke();
  }
  ctx.restore();
  if (reveal < 1) return;

  // Result on the screen.
  if (plan.outcome.ok) {
    ctx.save();
    ctx.shadowColor = C.lime;
    ctx.shadowBlur = 12;
    arrow(ctx, sx + 4, midY, sx + 4, Y(img.h), C.lime, 2.5);
    ctx.restore();
    label(ctx, "sharp!", w - 8, 14, w, { align: "right", size: 12, color: C.lime, bold: true });
  } else {
    const lo = Math.max(-ymax, Math.min(...hits));
    const hi = Math.min(ymax, Math.max(...hits));
    ctx.fillStyle = "rgba(251,113,133,0.35)";
    ctx.fillRect(sx - 6, Y(hi), 12, Math.max(4, Y(lo) - Y(hi)));
    label(ctx, "blurred", w - 8, 14, w, { align: "right", size: 12, color: C.rose, bold: true });
    if (img.real && img.x > last.x && img.x < x1) {
      ctx.save();
      ctx.setLineDash([4, 3]);
      arrow(ctx, X(img.x), midY, X(img.x), Y(Math.max(-ymax, Math.min(ymax, img.h))), C.lime, 1.5);
      ctx.restore();
      label(ctx, "sharp image here", X(img.x), Y(-ymax) + 4, w, { align: "center", size: 10, color: C.lime });
    }
  }
}

/* ---------- Laser into water ---------- */

function drawLaser(ctx: CanvasRenderingContext2D, w: number, h: number, s: LaserScene, p: number, idle: boolean) {
  const plan = planLaser(s);
  const lx = -s.D;
  const x0 = Math.min(lx - 0.5, -0.6);
  const x1 = Math.max(0.6, plan.floorX + 0.3, plan.surfaceX + 0.3);
  const { k, X, Y } = fitWorld(w, h, { x0, x1, y0: -s.depth - 0.1, y1: s.H + 0.35 }, { l: 10, r: 10, t: 34, b: 14 });

  // Water and tank floor.
  ctx.fillStyle = "rgba(56,189,248,0.16)";
  ctx.fillRect(0, Y(0), w, Y(-s.depth) - Y(0));
  ctx.strokeStyle = "rgba(125,211,252,0.7)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, Y(0));
  ctx.lineTo(w, Y(0));
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(0, Y(-s.depth), w, h - Y(-s.depth));
  ctx.strokeStyle = C.track;
  ctx.beginPath();
  ctx.moveTo(0, Y(-s.depth));
  ctx.lineTo(w, Y(-s.depth));
  ctx.stroke();
  label(ctx, `n = ${s.n}`, 8, Y(-s.depth / 2), w, { size: 10, color: "rgba(125,211,252,0.85)" });

  // Ring on the floor, and where it seems to be from straight above.
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(X(0), Y(-s.depth) - 3, 6, 3, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.save();
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = C.dim;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(X(0), Y(-s.apparent), 6, 3, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  label(ctx, `looks ${s.apparent.toFixed(2)} m deep`, X(0) + 10, Y(-s.apparent), w, { size: 9, color: C.dim });

  // Boat with the laser mast.
  const bx = X(lx);
  const by = Y(0);
  ctx.fillStyle = "rgba(251,146,60,0.35)";
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(bx - 26, by - 8);
  ctx.lineTo(bx + 22, by - 8);
  ctx.lineTo(bx + 14, by + 4);
  ctx.lineTo(bx - 20, by + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx, by - 8);
  ctx.lineTo(bx, Y(s.H));
  ctx.stroke();
  const th = s.tiltDeg * RAD;
  ctx.strokeStyle = C.pink;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(bx - 12 * Math.sin(th), Y(s.H) - 12 * Math.cos(th));
  ctx.lineTo(bx, Y(s.H));
  ctx.stroke();
  label(ctx, `${s.H} m`, bx - 6, Y(s.H / 2) - 4, w, { size: 9, color: C.dim, align: "right" });

  // Distance marker between the laser and the ring.
  const my = Y(s.H) - 18;
  dashed(ctx, [[bx, my], [X(0), my]], C.faint, 1);
  label(ctx, idle ? "D = ?" : `D = ${s.D.toFixed(2)} m`, (bx + X(0)) / 2, my - 9, w, { align: "center", size: 11, color: C.cyan, bold: true });

  if (idle) {
    label(ctx, `laser tilted ${s.tiltDeg}° from vertical`, w - 8, 14, w, { align: "right", size: 10, color: C.dim });
    return;
  }

  // Beam, revealed along its length.
  const A: [number, number] = [lx, s.H];
  const B: [number, number] = [plan.surfaceX, 0];
  const F: [number, number] = [plan.floorX, -s.depth];
  const l1 = Math.hypot(B[0] - A[0], B[1] - A[1]);
  const l2 = Math.hypot(F[0] - B[0], F[1] - B[1]);
  const along = Math.min(1, p / REVEAL) * (l1 + l2);
  ctx.save();
  ctx.shadowColor = "#f43f5e";
  ctx.shadowBlur = 8;
  ctx.strokeStyle = "#fb7185";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(X(A[0]), Y(A[1]));
  if (along <= l1) {
    const f = along / l1;
    ctx.lineTo(X(A[0] + f * (B[0] - A[0])), Y(A[1] + f * (B[1] - A[1])));
  } else {
    const f = (along - l1) / l2;
    ctx.lineTo(X(B[0]), Y(B[1]));
    ctx.lineTo(X(B[0] + f * (F[0] - B[0])), Y(B[1] + f * (F[1] - B[1])));
  }
  ctx.stroke();
  ctx.restore();

  if (along >= l1) {
    // Normal at the surface, with both angles.
    const nl = Math.min(0.55, s.depth * 0.45) * k;
    dashed(ctx, [[X(B[0]), Y(0) - nl], [X(B[0]), Y(0) + nl]], C.dim, 1);
    label(ctx, `${s.tiltDeg}°`, X(B[0]) - 6, Y(0) - nl * 0.9, w, { align: "right", size: 10, color: C.pink });
    label(ctx, `${refractAngle(s.tiltDeg, s.n).toFixed(1)}°`, X(B[0]) - 6, Y(0) + nl * 0.6, w, { align: "right", size: 10, color: C.pink });
  }

  if (p < REVEAL) return;
  const ok = plan.outcome.ok;
  ctx.save();
  ctx.shadowColor = ok ? C.lime : C.rose;
  ctx.shadowBlur = 14;
  ctx.fillStyle = ok ? C.lime : C.rose;
  ctx.beginPath();
  ctx.arc(X(F[0]), Y(F[1]) - 3, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const text = ok ? "on the ring!" : `${Math.round(Math.abs(plan.floorX) * 100)} cm ${plan.floorX < 0 ? "short" : "too far"}`;
  label(ctx, text, w - 8, 14, w, { align: "right", size: 12, color: ok ? C.lime : C.rose, bold: true });
}
