"use client";

import { RUN_S, clock, overtakeTimes, planEquation, trainPositions, type BalanceScene, type EquationScene, type OvertakeScene, type TrainsScene } from "@/lib/sim/oly-equation";
import { C, label, useSimCanvas } from "./canvas";

interface Props {
  scene: EquationScene;
  idle: boolean;
  runKey: number;
  onDone?: () => void;
}

const WHAT: Record<EquationScene["kind"], string> = {
  "eq-balance": "Sacks of your weight go on a market balance.",
  "eq-trains": "Two trains run towards each other for your time.",
  "eq-overtake": "A train of your length passes a cyclist and then a walker.",
};

/** Equation sim: a market balance, two trains on one line, and a train passing a cyclist and a walker. */
export default function OlyEquation({ scene, idle, runKey, onDone }: Props) {
  const plan = planEquation(scene);
  const { ref } = useSimCanvas(
    (ctx, w, h, t) => {
      if (scene.kind === "eq-balance") drawBalance(ctx, w, h, scene, t, idle);
      else if (scene.kind === "eq-trains") drawTrains(ctx, w, h, scene, t, idle);
      else drawOvertake(ctx, w, h, scene, t, idle);
    },
    plan.duration,
    runKey,
    onDone,
  );
  return <canvas ref={ref} className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80" role="img" aria-label={`${WHAT[scene.kind]} ${idle ? "" : plan.outcome.text}`} />;
}

const n2 = (x: number) => String(Number(x.toFixed(2)));
const ease = (x: number) => 1 - (1 - Math.max(0, Math.min(1, x))) ** 3;
const STUDENT = "#fbbf24";

function finish(ctx: CanvasRenderingContext2D, w: number, h: number, s: EquationScene, t: number, idle: boolean, short: [string, string]) {
  const plan = planEquation(s);
  if (idle) label(ctx, "Enter your answer, then test it", 8, h - 12, w, { size: 10, color: C.dim });
  else if (t >= plan.duration - 1e-6) {
    const ok = plan.outcome.ok;
    label(ctx, `${ok ? "✓" : "✗"} ${short[ok ? 0 : 1]}`, w / 2, h - 12, w, { align: "center", size: 13, color: ok ? C.lime : C.rose, bold: true });
  }
}

/* ---------- Balance ---------- */

function drawBalance(ctx: CanvasRenderingContext2D, w: number, h: number, s: BalanceScene, t: number, idle: boolean) {
  const L = s.left.x * s.w + s.left.k;
  const R = s.right.x * s.w + s.right.k;
  const diff = L - R;
  const ok = planEquation(s).outcome.ok;
  // Tips up to 16°, more for a bigger difference; a correct answer stays level.
  const maxTilt = ok ? 0 : (16 * Math.PI) / 180;
  const target = ok ? 0 : Math.sign(diff) * Math.min(maxTilt, (Math.abs(diff) / Math.max(L, R, 1)) * 2.2 + 0.08);
  const p = idle ? 0 : ease(t / RUN_S);
  const wobble = idle ? 0 : Math.sin(t * 9) * 0.04 * (1 - Math.min(1, t / RUN_S));
  const a = target * p + wobble;

  label(ctx, `one ${s.thing}: w = ${idle ? "?" : `${n2(s.w)} kg`}`, w - 8, 14, w, { size: 13, color: STUDENT, bold: true, align: "right" });
  const cx = w / 2;
  const py = h * 0.36;
  const arm = Math.min(w * 0.3, 190);
  // Stand.
  ctx.strokeStyle = C.track;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, py);
  ctx.lineTo(cx, h - 34);
  ctx.moveTo(cx - 30, h - 34);
  ctx.lineTo(cx + 30, h - 34);
  ctx.stroke();
  // Beam: left end goes down when the left is heavier (positive a).
  const lx = cx - arm * Math.cos(a);
  const ly = py + arm * Math.sin(a);
  const rx = cx + arm * Math.cos(a);
  const ry = py - arm * Math.sin(a);
  ctx.strokeStyle = "#d6a76b";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(lx, ly);
  ctx.lineTo(rx, ry);
  ctx.stroke();
  ctx.fillStyle = C.track;
  ctx.beginPath();
  ctx.moveTo(cx, py - 8);
  ctx.lineTo(cx - 7, py + 6);
  ctx.lineTo(cx + 7, py + 6);
  ctx.fill();
  // Pointer.
  ctx.strokeStyle = ok && !idle ? C.lime : C.rose;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, py);
  ctx.lineTo(cx + 40 * Math.sin(-a), py - 40 * Math.cos(a));
  ctx.stroke();

  const pan = (x: number, y: number, side: { x: number; k: number }, total: number) => {
    const drop = h * 0.2;
    const pw = Math.min(arm * 0.8, 120);
    const by = y + drop;
    ctx.strokeStyle = C.dim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - pw / 2, by);
    ctx.moveTo(x, y);
    ctx.lineTo(x + pw / 2, by);
    ctx.stroke();
    ctx.strokeStyle = C.track;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - pw / 2, by);
    ctx.quadraticCurveTo(x, by + 12, x + pw / 2, by);
    ctx.stroke();
    // Sacks (the unknown) then a weight block for the known kilograms.
    const items = side.x + (side.k > 0 ? 1 : 0);
    const iw = Math.min(26, (pw - 6) / Math.max(1, items));
    let ix = x - (items * iw) / 2;
    for (let i = 0; i < side.x; i++) {
      ctx.fillStyle = "#4ade80";
      ctx.beginPath();
      ctx.arc(ix + iw / 2, by - iw * 0.42, iw * 0.42, 0, Math.PI * 2);
      ctx.fill();
      label(ctx, idle ? "?" : "w", ix + iw / 2, by - iw * 0.42, w, { size: Math.min(11, iw * 0.5), color: "#052e16", align: "center", bold: true });
      ix += iw;
    }
    if (side.k > 0) {
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(ix + 2, by - iw * 0.8, iw - 4, iw * 0.8);
      label(ctx, `${side.k}`, ix + iw / 2, by - iw * 0.4, w, { size: Math.min(10, iw * 0.45), color: "#0f172a", align: "center", bold: true });
    }
    const desc = `${side.x > 1 ? `${side.x}w` : side.x === 1 ? "w" : ""}${side.x && side.k ? " + " : ""}${side.k ? `${side.k} kg` : ""}`;
    label(ctx, desc, x, by + 18, w, { size: 11, color: C.cyan, align: "center", bold: true });
    if (!idle) label(ctx, `${n2(total)} kg`, x, by + 32, w, { size: 10, color: C.dim, align: "center" });
  };
  pan(lx, ly, s.left, L);
  pan(rx, ry, s.right, R);
  finish(ctx, w, h, s, t, idle, ["The beam stays level!", diff > 0 ? "Tips to the left" : "Tips to the right"]);
}

/* ---------- Trains ---------- */

function drawTrains(ctx: CanvasRenderingContext2D, w: number, h: number, s: TrainsScene, t: number, idle: boolean) {
  const plan = planEquation(s);
  const T = idle ? 0 : Math.max(0, s.t) * Math.min(1, t / RUN_S);
  const { x1, x2 } = trainPositions(s.D, s.v1, s.v2, s.delay2, T);
  const x0 = 22;
  const xEnd = w - 22;
  const X = (km: number) => x0 + (km / s.D) * (xEnd - x0);
  const y = h * 0.5;

  label(ctx, `${clock(s.start + T)}`, 8, 14, w, { size: 14, color: C.cyan, bold: true });
  label(ctx, idle ? "x = ?" : `you: ${n2(s.v1 * s.t)} km from ${s.from}`, w - 8, 14, w, { size: 12, color: STUDENT, bold: true, align: "right" });
  // Track with sleepers.
  ctx.strokeStyle = C.track;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(X(0), y);
  ctx.lineTo(X(s.D), y);
  ctx.stroke();
  ctx.strokeStyle = C.faint;
  for (let km = 0; km <= s.D; km += s.D / 22) {
    ctx.beginPath();
    ctx.moveTo(X(km), y - 4);
    ctx.lineTo(X(km), y + 4);
    ctx.stroke();
  }
  // Stations and distance ticks.
  for (const [km, name, align] of [
    [0, s.from, "left"],
    [s.D, s.to, "right"],
  ] as const) {
    ctx.fillStyle = C.dim;
    ctx.fillRect(X(km) - 4, y - 18, 8, 14);
    label(ctx, name, X(km), y + 34, w, { size: 11, color: C.dim, align });
  }
  const step = s.D > 200 ? 50 : 25;
  for (let km = step; km < s.D; km += step) label(ctx, `${km}`, X(km), y + 16, w, { size: 9, color: "rgba(255,255,255,0.3)", align: "center" });

  // Trains as short coloured blocks with their speeds.
  const tw = Math.max(18, Math.min(34, w * 0.07));
  ctx.fillStyle = C.orange;
  ctx.fillRect(X(x1) - tw, y - 16, tw, 10);
  label(ctx, `${s.v1} km/h →`, X(x1) - tw / 2, y - 26, w, { size: 10, color: C.orange, align: "center" });
  ctx.fillStyle = C.cyan;
  ctx.fillRect(X(x2), y + 6 - 0, tw, 10);
  const waiting = T < s.delay2;
  label(ctx, waiting ? `leaves at ${clock(s.start + s.delay2)}` : `← ${s.v2} km/h`, X(x2) + tw / 2, y + 26 + 18, w, { size: 10, color: C.cyan, align: "center" });

  if (!idle && t >= plan.duration - 1e-6) {
    const gap = x2 - x1;
    if (Math.abs(gap) > 0.003 * s.D) {
      ctx.strokeStyle = C.rose;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X(Math.min(x1, x2)), y - 40);
      ctx.lineTo(X(Math.max(x1, x2)), y - 40);
      ctx.stroke();
      label(ctx, `${gap > 0 ? "still" : "passed by"} ${n2(Math.abs(gap))} km`, X((x1 + x2) / 2), y - 52, w, { size: 11, color: C.rose, align: "center", bold: true });
    } else label(ctx, `meet ${n2(x1)} km from ${s.from}`, X(x1), y - 52, w, { size: 11, color: C.lime, align: "center", bold: true });
  }
  finish(ctx, w, h, s, t, idle, ["They meet right there!", "They are not side by side"]);
}

/* ---------- Overtaking ---------- */

function drawOvertake(ctx: CanvasRenderingContext2D, w: number, h: number, s: OvertakeScene, t: number, idle: boolean) {
  const L = idle ? 1 : Math.max(1, s.L);
  const { v, tWalk } = idle ? { v: 0, tWalk: 0 } : overtakeTimes({ ...s, L });
  const tMax = Math.max(s.tc, s.tw, tWalk) * 1.08;
  const tau = idle ? 0 : tMax * Math.min(1, t / RUN_S);
  // Both lanes share one scale: from a train length behind the start to where the train ends up.
  const x0 = -L * 1.05;
  const x1 = Math.max(v * tMax, L * 0.5) + 4;
  const X = (m: number) => 12 + ((m - x0) / (x1 - x0)) * (w - 24);

  label(ctx, idle ? "L = ?" : `L = ${n2(L)} m  ⇒  train at ${n2(v)} m/s`, w - 8, 14, w, { size: 12, color: STUDENT, bold: true, align: "right" });

  const lane = (y: number, who: string, speed: number, dir: 1 | -1, want: number, colour: string) => {
    const front = v * tau;
    const pos = dir * speed * tau;
    const passT = dir === 1 ? s.tc : tWalk;
    const passed = tau >= passT;
    ctx.strokeStyle = C.faint;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(8, y + 12);
    ctx.lineTo(w - 8, y + 12);
    ctx.stroke();
    if (!idle) {
      ctx.fillStyle = "rgba(251,146,60,0.75)";
      ctx.fillRect(X(front - L), y - 2, Math.max(2, X(front) - X(front - L)), 12);
      ctx.fillStyle = "#fde68a";
      ctx.fillRect(X(front) - 3, y - 2, 3, 12);
    }
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(X(pos), y - 8, 4, 0, Math.PI * 2);
    ctx.fill();
    const shown = Math.min(tau, passT);
    const okLane = dir === 1 || Math.abs(tWalk - s.tw) <= 0.003 * s.tw;
    label(ctx, `${who} ${dir === 1 ? "→" : "←"} ${n2(speed)} m/s`, 8, y - 20, w, { size: 10, color: colour });
    if (!idle)
      label(ctx, `passing: ${n2(shown)} s${passed ? (okLane ? " ✓" : ` (want ${want} s)`) : ""}`, w - 8, y - 20, w, {
        size: 11,
        color: passed ? (okLane ? C.lime : C.rose) : C.dim,
        align: "right",
        bold: passed,
      });
    else label(ctx, `passes in ${want} s`, w - 8, y - 20, w, { size: 10, color: C.dim, align: "right" });
  };
  lane(h * 0.36, "cyclist", s.vc, 1, s.tc, C.cyan);
  lane(h * 0.72, "walker", s.vw, -1, s.tw, C.pink);
  finish(ctx, w, h, s, t, idle, ["Both passing times fit!", "The walker's time is wrong"]);
}
