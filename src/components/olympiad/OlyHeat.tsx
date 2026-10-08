"use client";

import { POUR_S, planHeat, settleFraction, type HeatScene } from "@/lib/sim/oly-heat";
import { C, label, stopwatch, useSimCanvas } from "./canvas";

interface Props {
  scene: HeatScene;
  idle: boolean;
  runKey: number;
  onDone?: () => void;
}

/** Calorimeter sim: a vessel is filled (or ice dropped in), a thermometer settles, and the goal band shows if it worked. */
export default function OlyHeat({ scene, idle, runKey, onDone }: Props) {
  const plan = planHeat(scene);
  const { ref } = useSimCanvas((ctx, w, h, t) => draw(ctx, w, h, scene, t, idle), plan.duration, runKey, onDone);
  const what = scene.ice ? "Ice is dropped into a glass of sharbat" : `Liquid is poured into a ${scene.vessel}`;
  return (
    <canvas
      ref={ref}
      className="h-60 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
      role="img"
      aria-label={`${what} and a thermometer shows the temperature settling. ${idle ? "" : plan.outcome.text}`}
    />
  );
}

/** Cold is sky blue, warm is amber, hot is red. */
const STOPS: [number, [number, number, number]][] = [
  [0, [56, 189, 248]],
  [50, [250, 204, 21]],
  [100, [239, 68, 68]],
];
function tempColour(T: number, alpha = 1) {
  const x = Math.max(0, Math.min(100, T));
  const i = x <= 50 ? 0 : 1;
  const [t0, a] = STOPS[i];
  const [t1, b] = STOPS[i + 1];
  const f = (x - t0) / (t1 - t0);
  const c = a.map((v, k) => Math.round(v + (b[k] - v) * f));
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
}

const fmtT = (T: number) => `${T.toFixed(1)} °C`;
const fmtM = (kg: number) => (kg >= 1 ? `${kg.toFixed(2)} kg` : `${(kg * 1000).toFixed(0)} g`);

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, s: HeatScene, t: number, idle: boolean) {
  const plan = planHeat(s);
  const eq = plan.eq;
  const done = !idle && t >= plan.duration - 1e-6;
  const f = idle ? 0 : settleFraction(t);
  const pour = idle ? 0 : Math.min(1, t / POUR_S);
  const narrow = w < 480;

  const liquid = s.bodies.filter((b) => b.role === "liquid");
  const poured = s.bodies.filter((b) => b.role === "pour");
  const mLiq = liquid.reduce((a, b) => a + b.m, 0);
  const mPour = poured.reduce((a, b) => a + b.m, 0);
  const T0 = liquid[0]?.T ?? 0;
  const Tnow = eq.T + (T0 - eq.T) * (1 - f);

  // Thermometer scale.
  const temps = [...s.bodies.map((b) => b.T), eq.T, ...(s.ice ? [s.ice.T] : []), ...(s.goal.type === "temp" ? [s.goal.T] : [])];
  const tLo = Math.floor((Math.min(...temps) - 2) / 10) * 10;
  const tHi = Math.ceil((Math.max(...temps) + 2) / 10) * 10;

  // ---- Vessel ----
  const vx = narrow ? w * 0.5 : w * 0.45;
  const vBottom = h - 30;
  const vH = h * (s.vessel === "bucket" ? 0.52 : 0.58);
  const vTop = vBottom - vH;
  const halfBottom = Math.min(w * 0.13, vH * (s.vessel === "bucket" ? 0.48 : s.vessel === "tumbler" ? 0.3 : 0.32));
  const halfTop = halfBottom * (s.vessel === "bucket" ? 1.3 : s.vessel === "tumbler" ? 1.12 : 1.22);
  const xAt = (y: number, side: -1 | 1) => vx + side * (halfBottom + ((halfTop - halfBottom) * (vBottom - y)) / vH);

  // Liquid level: the starting liquid fills half the vessel; what is poured in raises it.
  const fill = Math.min(0.93, 0.5 * (1 + (mPour * pour) / Math.max(mLiq, 1e-9)));
  const yLiq = vBottom - fill * vH;
  ctx.fillStyle = tempColour(Tnow, 0.55);
  ctx.beginPath();
  ctx.moveTo(xAt(yLiq, -1), yLiq);
  ctx.lineTo(xAt(yLiq, 1), yLiq);
  ctx.lineTo(xAt(vBottom, 1), vBottom);
  ctx.lineTo(xAt(vBottom, -1), vBottom);
  ctx.closePath();
  ctx.fill();

  // Pour stream from above, coloured by the poured liquid's temperature.
  if (!idle && poured.length && pour < 1) {
    const sx = vx - halfTop * 0.35;
    ctx.strokeStyle = tempColour(poured[0].T, 0.85);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(sx, 6);
    ctx.lineTo(sx, yLiq);
    ctx.stroke();
  }

  // Ice cubes: fall in during the pour time, then shrink as they melt.
  if (s.ice) {
    const n = Math.max(1, Math.min(8, Math.round(s.ice.m / 0.02)));
    const mNow = idle ? s.ice.m : s.ice.m - (s.ice.m - eq.iceLeft) * f;
    const side0 = Math.min(18, halfBottom * 0.55);
    const side = side0 * Math.cbrt(Math.max(0, mNow) / s.ice.m);
    const iceT = idle ? s.ice.T : Math.min(0, eq.T + (s.ice.T - eq.T) * (1 - f));
    if (!idle && side > 0.6) {
      const cols = Math.min(n, 4);
      for (let i = 0; i < n; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cxI = vx + (col - (cols - 1) / 2) * side0 * 1.2 + (row % 2) * side0 * 0.4;
        const restY = yLiq - side * 0.2 + row * side0 * 1.15;
        const drop = Math.min(1, (t - i * 0.08) / 0.7);
        const y = drop < 1 ? 4 + (restY - 4) * Math.max(0, drop) ** 2 : restY;
        ctx.fillStyle = "rgba(224,242,254,0.85)";
        ctx.strokeStyle = "rgba(186,230,253,1)";
        ctx.lineWidth = 1;
        ctx.fillRect(cxI - side / 2, y - side / 2, side, side);
        ctx.strokeRect(cxI - side / 2, y - side / 2, side, side);
      }
    }
    if (idle) {
      label(ctx, `ice at ${s.ice.T} °C: m = ?`, vx, vTop - 12, w, { align: "center", size: 11, color: C.cyan, bold: true });
    } else {
      const left = Math.max(0, mNow);
      label(ctx, `ice ${fmtT(iceT)}, ${fmtM(left)} left`, vx, vTop - 12, w, { align: "center", size: 11, color: C.cyan, bold: true });
    }
  }

  // Vessel outline.
  const steel = s.vessel === "tumbler";
  ctx.strokeStyle = steel ? "rgba(203,213,225,0.9)" : s.vessel === "glass" ? "rgba(186,230,253,0.7)" : C.track;
  ctx.lineWidth = steel ? 3 : 2;
  ctx.beginPath();
  ctx.moveTo(xAt(vTop, -1), vTop);
  ctx.lineTo(xAt(vBottom, -1), vBottom);
  ctx.lineTo(xAt(vBottom, 1), vBottom);
  ctx.lineTo(xAt(vTop, 1), vTop);
  ctx.stroke();
  if (s.vessel === "bucket") {
    // Rim and handle lugs.
    ctx.fillStyle = C.dim;
    ctx.fillRect(xAt(vTop, -1) - 6, vTop + 4, 6, 4);
    ctx.fillRect(xAt(vTop, 1), vTop + 4, 6, 4);
  }
  ctx.strokeStyle = C.faint;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(8, vBottom + 1);
  ctx.lineTo(w - 8, vBottom + 1);
  ctx.stroke();

  // ---- Thermometer ----
  const tx = w - (narrow ? 34 : 50);
  const tTop = narrow ? 50 : 34;
  const tBot = h - 44;
  const Y = (T: number) => tBot - ((T - tLo) / (tHi - tLo)) * (tBot - tTop);
  if (s.goal.type === "temp") {
    ctx.fillStyle = "rgba(163,230,53,0.35)";
    const y1 = Y(s.goal.T + Math.max(s.goal.band, 0.6));
    const y2 = Y(s.goal.T - Math.max(s.goal.band, 0.6));
    ctx.fillRect(tx - 14, y1, 28, Math.max(3, y2 - y1));
    label(ctx, "goal", tx - 16, Y(s.goal.T), w, { align: "right", size: 10, color: C.lime });
  }
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(tx - 5, tTop - 4, 10, tBot - tTop + 4);
  const thermoT = idle ? T0 : Tnow;
  ctx.fillStyle = C.rose;
  ctx.fillRect(tx - 3, Y(thermoT), 6, tBot - Y(thermoT) + 2);
  ctx.beginPath();
  ctx.arc(tx, tBot + 8, 8, 0, Math.PI * 2);
  ctx.fill();
  const step = tHi - tLo > 60 ? 20 : 10;
  for (let T = tLo; T <= tHi; T += step) {
    ctx.strokeStyle = C.dim;
    ctx.beginPath();
    ctx.moveTo(tx + 5, Y(T));
    ctx.lineTo(tx + 9, Y(T));
    ctx.stroke();
    label(ctx, `${T}`, tx + 11, Y(T), w, { size: 9, color: C.dim });
  }

  // ---- Readouts ----
  label(ctx, `T = ${fmtT(thermoT)}`, 8, 14, w, { size: 13, color: tempColour(thermoT), bold: true });
  if (!idle) stopwatch(ctx, w, Math.min(t, plan.duration));
  const goalText = s.goal.type === "temp" ? `goal: ${s.goal.T} °C` : `goal: ${fmtM(s.goal.left)} of ice left`;
  label(ctx, goalText, 8, 32, w, { size: 10, color: C.lime });

  // Each body's temperature, heading for the common final value.
  let y = 52;
  for (const b of s.bodies) {
    if (b.role === "pour" && (idle || pour <= 0)) {
      if (idle) label(ctx, `add ${b.label} at ${b.T} °C: m = ?`, vx, vTop - 12, w, { align: "center", size: 11, color: tempColour(b.T), bold: true });
      continue;
    }
    const Tb = idle ? b.T : eq.T + (b.T - eq.T) * (1 - f);
    const text = narrow ? `${b.label} ${fmtT(Tb)}` : `${b.label} (${fmtM(b.m)}) ${fmtT(Tb)}`;
    label(ctx, text, 8, y, w, { size: 10, color: tempColour(Tb) });
    y += 15;
  }

  if (idle) {
    label(ctx, "Enter your answer, then test it", 8, h - 12, w, { size: 10, color: C.dim });
    return;
  }
  if (done) {
    const ok = plan.outcome.ok;
    const short =
      s.goal.type === "temp"
        ? ok
          ? "On target!"
          : eq.T > s.goal.T
            ? "Too hot"
            : "Too cold"
        : ok
          ? "Just right!"
          : eq.iceLeft <= 0
            ? "All the ice melted"
            : eq.iceLeft > s.goal.left
              ? "Too much ice left"
              : "Too little ice left";
    label(ctx, `${ok ? "✓" : "✗"} ${short}`, vx, h - 12, w, { align: "center", size: 13, color: ok ? C.lime : C.rose, bold: true });
  } else if (f > 0) {
    label(ctx, "settling…", vx, h - 12, w, { align: "center", size: 10, color: C.dim });
  }
}
