"use client";

import { planCrash, planPendulum, planRecoil, type CrashScene, type PendulumScene, type RecoilScene } from "@/lib/sim/oly-momentum";
import { C, arrow, dashed, fitWorld, label, speedFor, stopwatch, useSimCanvas } from "./canvas";

interface Props {
  scene: RecoilScene | PendulumScene | CrashScene;
  idle: boolean;
  runKey: number;
  onDone?: () => void;
}

const RAD = Math.PI / 180;

/** Reusable momentum sim: recoil in a space module, a ballistic pendulum, or a 2D crash with skid marks. */
export default function OlyCollision({ scene, idle, runKey, onDone }: Props) {
  const plan = scene.kind === "recoil" ? planRecoil(scene) : scene.kind === "pendulum" ? planPendulum(scene) : planCrash(scene);
  const { ref } = useSimCanvas(
    (ctx, w, h, t) => {
      if (scene.kind === "recoil") drawRecoil(ctx, w, h, scene, t, idle);
      else if (scene.kind === "pendulum") drawPendulum(ctx, w, h, scene, t, idle);
      else drawCrash(ctx, w, h, scene, t, idle);
    },
    plan.duration,
    runKey,
    onDone,
  );
  const what =
    scene.kind === "recoil"
      ? "Inside a space module, an astronaut throws a bag and drifts back towards the hatch."
      : scene.kind === "pendulum"
        ? "A pellet is fired into a wooden block hanging on strings, which then swings up."
        : "Top view of a crossing: a car from the west and an autorickshaw from the south collide and skid together.";
  return (
    <canvas
      ref={ref}
      className="h-60 w-full rounded-2xl border border-line bg-well sm:h-80"
      role="img"
      aria-label={`${what} ${idle ? "" : plan.outcome.text}`}
    />
  );
}

function drawRecoil(ctx: CanvasRenderingContext2D, w: number, h: number, s: RecoilScene, t: number, idle: boolean) {
  const plan = planRecoil(s);
  const { k, X, Y } = fitWorld(w, h, { x0: -s.d - 0.6, x1: 3.2, y0: -1.3, y1: 1.3 }, { l: 8, r: 8, t: 30, b: 22 });
  // Module walls.
  ctx.strokeStyle = C.dim;
  ctx.lineWidth = 2;
  ctx.strokeRect(X(-s.d - 0.4), Y(1.2), X(3.2) - X(-s.d - 0.4), Y(-1.2) - Y(1.2));
  // Hatch.
  ctx.fillStyle = "rgba(251,146,60,0.35)";
  ctx.fillRect(X(-s.d - 0.4), Y(0.6), 8, Y(-0.6) - Y(0.6));
  label(ctx, "hatch", X(-s.d - 0.4) + 12, Y(0.75), w, { size: 10, color: C.orange });
  // Stars through a window.
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  for (const [a, b] of [
    [0.3, 0.9],
    [1.4, 0.8],
    [2.3, 1.0],
    [-1.6, 0.95],
  ])
    ctx.fillRect(X(a), Y(b), 1.5, 1.5);

  const st = idle ? { astro: 0, bag: 0 } : plan.at(t);
  const ax = Math.max(-s.d, st.astro);
  // Astronaut: a simple figure, 0.8 m tall here.
  const hx = X(ax);
  const r = 0.14 * k;
  ctx.strokeStyle = C.cyan;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(hx, Y(0.45), r, 0, Math.PI * 2);
  ctx.moveTo(hx, Y(0.31));
  ctx.lineTo(hx, Y(-0.25));
  ctx.lineTo(hx - 0.15 * k, Y(-0.7));
  ctx.moveTo(hx, Y(-0.25));
  ctx.lineTo(hx + 0.15 * k, Y(-0.7));
  ctx.moveTo(hx, Y(0.15));
  ctx.lineTo(hx + 0.3 * k, Y(0.05));
  ctx.stroke();
  label(ctx, `${s.M} kg`, hx, Y(-0.9), w, { align: "center", size: 10, color: C.cyan });
  // Bag.
  const bx = 0.35 + st.bag;
  if (bx < 3.1) {
    ctx.fillStyle = C.violet;
    ctx.fillRect(X(bx) - 0.12 * k, Y(0.12), 0.24 * k, 0.24 * k);
    label(ctx, `${s.m} kg bag`, X(bx), Y(-0.25), w, { align: "center", size: 10, color: C.violet });
  }
  if (idle) {
    dashed(ctx, [[X(-s.d), Y(-1.05)], [X(0), Y(-1.05)]], C.faint, 1);
    label(ctx, `${s.d} m`, X(-s.d / 2), Y(-1.05) - 8, w, { align: "center", size: 10 });
    label(ctx, "Enter the throw speed, then test it", 8, 14, w, { color: C.dim });
    return;
  }
  arrow(ctx, hx - 4, Y(0.9), hx - 4 - Math.min(60, plan.V * 150), Y(0.9), C.cyan, 1.5);
  label(ctx, `V = ${(plan.V * 100).toFixed(1)} cm/s`, 8, 14, w, { color: C.cyan, size: 12, bold: true });
  stopwatch(ctx, w, Math.min(t, plan.duration), s.targetT, speedFor(plan.duration));
}

function drawPendulum(ctx: CanvasRenderingContext2D, w: number, h: number, s: PendulumScene, t: number, idle: boolean) {
  const plan = planPendulum(s);
  const L = s.L;
  const { k, X, Y } = fitWorld(w, h, { x0: -L * 1.15, x1: L * 0.9, y0: -L * 0.25, y1: L * 1.08 }, { l: 8, r: 8, t: 28, b: 14 });
  const px = 0;
  const py = L;
  ctx.strokeStyle = C.dim;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(X(-0.25 * L), Y(py));
  ctx.lineTo(X(0.25 * L), Y(py));
  ctx.stroke();
  // Target angle marks.
  const tgt = s.targetDeg * RAD;
  dashed(ctx, [[X(px), Y(py)], [X(px + L * 1.05 * Math.sin(tgt)), Y(py - L * 1.05 * Math.cos(tgt))]], C.orange);
  label(ctx, `${s.targetDeg}° mark`, X(px + L * 1.05 * Math.sin(tgt)) + 4, Y(py - L * 1.05 * Math.cos(tgt)) + 8, w, { size: 10, color: C.orange });
  ctx.strokeStyle = C.faint;
  ctx.beginPath();
  ctx.arc(X(px), Y(py), L * 0.35 * k, Math.PI / 2 - tgt, Math.PI / 2);
  ctx.stroke();

  const st = idle ? { pellet: 0, angle: 0 } : plan.at(t);
  const a = st.angle * RAD;
  const bx = px + L * Math.sin(a);
  const by = py - L * Math.cos(a);
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(X(px), Y(py));
  ctx.lineTo(X(bx), Y(by));
  ctx.stroke();
  const size = 0.16 * L;
  ctx.save();
  ctx.translate(X(bx), Y(by));
  ctx.rotate(-a);
  ctx.fillStyle = "rgba(251,146,60,0.5)";
  ctx.strokeStyle = C.orange;
  ctx.fillRect((-size / 2) * k, 0, size * k, size * 0.8 * k);
  ctx.strokeRect((-size / 2) * k, 0, size * k, size * 0.8 * k);
  ctx.restore();
  label(ctx, `${s.M * 1000} g block`, X(bx) - (size / 2) * k - 6, Y(by - size * 0.4), w, { align: "right", size: 10, color: C.dim });
  // Rifle and pellet.
  const gunX = -L * 1.05;
  const gunY = py - L - size * 0.4;
  ctx.fillStyle = C.dim;
  ctx.fillRect(X(gunX), Y(gunY) - 3, 0.3 * L * k, 6);
  if (!idle && st.pellet < 1) {
    const pxp = gunX + 0.3 * L + (-size / 2 - gunX - 0.3 * L) * st.pellet;
    ctx.fillStyle = C.ball;
    ctx.beginPath();
    ctx.arc(X(pxp), Y(gunY), 3, 0, Math.PI * 2);
    ctx.fill();
  }
  if (idle) {
    label(ctx, "Enter the pellet speed, then test it", 8, 14, w, { color: C.dim });
    return;
  }
  label(ctx, `v = ${s.v.toFixed(0)} m/s   swing ${plan.swing.angleDeg.toFixed(1)}°`, 8, 14, w, { color: C.ball, size: 12, bold: true });
  label(ctx, st.pellet < 1 ? "pellet in slow motion" : `V after impact = ${plan.swing.V.toFixed(3)} m/s`, w - 8, h - 10, w, { align: "right", size: 10, color: C.dim });
}

function drawCrash(ctx: CanvasRenderingContext2D, w: number, h: number, s: CrashScene, t: number, idle: boolean) {
  const plan = planCrash(s);
  const st = idle ? plan.at(0) : plan.at(t);
  const back = Math.max(s.v2 * plan.approach, 5);
  const { k, X, Y } = fitWorld(w, h, { x0: -Math.max(s.v1 * plan.approach, 5) - 1, x1: Math.max(7, plan.end.x + 1.5, plan.mark.x + 1.5), y0: -back - 1, y1: Math.max(4, plan.end.y + 1.5, plan.mark.y + 1.5) }, { l: 8, r: 8, t: 28, b: 14 });
  // Roads.
  const half = 3.5 * k;
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.fillRect(0, Y(0) - half, w, half * 2);
  ctx.fillRect(X(0) - half, 0, half * 2, h);
  dashed(ctx, [[0, Y(0)], [w, Y(0)]], C.faint, 1);
  dashed(ctx, [[X(0), 0], [X(0), h]], C.faint, 1);
  label(ctx, "N ↑", w - 8, h - 12, w, { align: "right", size: 10, color: C.dim });
  // Police skid marks.
  ctx.strokeStyle = "rgba(251,146,60,0.8)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(X(0), Y(0));
  ctx.lineTo(X(plan.mark.x), Y(plan.mark.y));
  ctx.stroke();
  label(ctx, `marks: ${s.skidD} m at ${s.skidDeg}°`, X(plan.mark.x) + 8, Y(0) + half + 10, w, { size: 10, color: C.orange });
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(X(plan.mark.x), Y(plan.mark.y), s.window * k, 0, Math.PI * 2);
  ctx.stroke();

  const vehicle = (x: number, y: number, ang: number, lenM: number, widM: number, color: string) => {
    ctx.save();
    ctx.translate(X(x), Y(y));
    ctx.rotate(-ang);
    ctx.fillStyle = color;
    ctx.fillRect((-lenM / 2) * k, (-widM / 2) * k, lenM * k, widM * k);
    ctx.restore();
  };
  if (st.phase === "before") {
    vehicle(st.car.x - 1.4, st.car.y, 0, 2.6, 1.2, C.cyan);
    vehicle(st.auto.x, st.auto.y - 1, Math.PI / 2, 1.9, 1, C.ball);
  } else {
    // Actual skid so far.
    ctx.strokeStyle = C.rose;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(X(0), Y(0));
    ctx.lineTo(X(st.car.x), Y(st.car.y));
    ctx.stroke();
    const ang = Math.atan2(plan.end.y, plan.end.x);
    vehicle(st.car.x - 1.0 * Math.cos(ang), st.car.y - 1.0 * Math.sin(ang), ang, 2.6, 1.2, C.cyan);
    vehicle(st.car.x + 0.3, st.car.y - 0.6, Math.PI / 2, 1.9, 1, C.ball);
  }
  label(ctx, "car", X(-4), Y(0) - half - 10, w, { size: 10, color: C.cyan });
  label(ctx, "auto", X(0) - half - 4, Y(-4), w, { align: "right", size: 10, color: C.ball });
  if (idle) {
    label(ctx, "Enter the car's speed, then test it", 8, 14, w, { color: C.dim });
    return;
  }
  label(ctx, `car v = ${s.v1.toFixed(2)} m/s`, 8, 14, w, { color: C.cyan, size: 12, bold: true });
  stopwatch(ctx, w, Math.min(t, plan.duration), undefined, speedFor(plan.duration));
}
