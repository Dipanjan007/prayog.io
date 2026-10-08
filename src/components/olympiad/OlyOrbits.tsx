"use client";

import { EARTH, planGeo, planJump, planThrow, type GeoScene, type JumpScene, type OrbitsScene, type ThrowScene } from "@/lib/sim/oly-orbits";
import { C, arrow, dashed, fitWorld, label, speedFor, stopwatch, useSimCanvas } from "./canvas";

interface Props {
  scene: OrbitsScene;
  idle: boolean;
  runKey: number;
  onDone?: () => void;
}

function planFor(s: OrbitsScene) {
  return s.kind === "orbits-jump" ? planJump(s) : s.kind === "orbits-geo" ? planGeo(s) : planThrow(s);
}

/** Gravitation and orbits sim: a jump on another world, a satellite watched for one turn of the Earth, or a throw from a small moon. */
export default function OlyOrbits({ scene, idle, runKey, onDone }: Props) {
  const plan = planFor(scene);
  const { ref } = useSimCanvas(
    (ctx, w, h, t) => {
      if (scene.kind === "orbits-jump") drawJump(ctx, w, h, scene, t, idle);
      else if (scene.kind === "orbits-geo") drawGeo(ctx, w, h, scene, t, idle);
      else drawThrow(ctx, w, h, scene, t, idle);
    },
    plan.duration,
    runKey,
    onDone,
  );
  const what =
    scene.kind === "orbits-jump"
      ? `An astronaut jumps straight up on ${scene.on.name}, next to a faint copy of the same jump on Earth.`
      : scene.kind === "orbits-geo"
        ? `Top view of the turning Earth with a satellite on a circular orbit above the equator, starting over ${scene.station}.`
        : `A canister is thrown straight up from ${scene.body.name} towards a probe hovering ${(scene.H / 1000).toFixed(1)} km above the surface.`;
  return (
    <canvas
      ref={ref}
      className="h-60 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
      role="img"
      aria-label={`${what} ${idle ? "" : plan.outcome.text}`}
    />
  );
}

/* ---------- Jump on another world ---------- */

/** A suited stick figure with its feet at (x, y) in canvas pixels; k is pixels per metre. */
function astronaut(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, color: string, alpha = 1, crouch = 0) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(2, 0.12 * k);
  const hip = y - (0.85 - crouch) * k;
  const neck = hip - 0.6 * k;
  ctx.beginPath();
  ctx.moveTo(x - 0.15 * k, y);
  ctx.lineTo(x, hip);
  ctx.lineTo(x + 0.15 * k, y);
  ctx.moveTo(x, hip);
  ctx.lineTo(x, neck);
  ctx.moveTo(x - 0.3 * k, neck + 0.35 * k);
  ctx.lineTo(x, neck + 0.05 * k);
  ctx.lineTo(x + 0.3 * k, neck + 0.35 * k);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, neck - 0.16 * k, 0.16 * k, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0a0d1c";
  ctx.fillRect(x - 0.02 * k, neck - 0.22 * k, 0.14 * k, 0.09 * k);
  ctx.restore();
}

function drawJump(ctx: CanvasRenderingContext2D, w: number, h: number, s: JumpScene, t: number, idle: boolean) {
  const plan = planJump(s);
  const top = idle ? 1.6 : Math.max(plan.apex, s.mark, 0.4);
  const { k, X, Y } = fitWorld(w, h, { x0: -2.2, x1: 2.2, y0: 0, y1: top + 2.0 }, { l: 10, r: 10, t: 34, b: 18 });

  // Ground: red Martian soil on the right, a grey Earth floor on the left.
  ctx.fillStyle = "rgba(251,113,133,0.14)";
  ctx.fillRect(X(-0.1), Y(0), w - X(-0.1), h - Y(0));
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(0, Y(0), X(-0.1), h - Y(0));
  ctx.strokeStyle = C.ground;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, Y(0));
  ctx.lineTo(w, Y(0));
  ctx.stroke();
  label(ctx, "Earth", X(-1.2), Y(0) + 10, w, { align: "center", size: 10, color: C.dim });
  label(ctx, s.on.name, X(0.7), Y(0) + 10, w, { align: "center", size: 10, color: C.rose });

  // Earth jump reference.
  dashed(ctx, [[X(-1.9), Y(s.hEarth)], [X(-0.5), Y(s.hEarth)]], C.faint, 1);
  label(ctx, `${s.hEarth.toFixed(2)} m`, X(-1.9), Y(s.hEarth) - 8, w, { size: 10, color: C.dim });
  const yE = idle ? 0 : plan.atEarth(t);
  astronaut(ctx, X(-1.2), Y(yE), k, "#e2e8f0", 0.35);

  // The student's mark.
  if (!idle) {
    const done = t >= plan.duration - 1e-9;
    const col = done ? (plan.outcome.ok ? C.lime : C.rose) : C.cyan;
    dashed(ctx, [[X(0.15), Y(s.mark)], [X(2.15), Y(s.mark)]], col, 1.5);
    label(ctx, `mark ${s.mark.toFixed(2)} m`, X(1.15), Y(s.mark) - 9, w, { size: 10, color: col, bold: true });
  } else label(ctx, "h = ?", X(1.7), Y(1.2), w, { align: "center", size: 12, color: C.cyan, bold: true });

  const y = idle ? 0 : plan.at(t);
  // Trace of the highest point so far.
  if (!idle && y > 0.01) {
    ctx.strokeStyle = "rgba(250,204,21,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(X(1.05), Y(0));
    ctx.lineTo(X(1.05), Y(y));
    ctx.stroke();
  }
  astronaut(ctx, X(0.7), Y(y), k, C.ball);

  label(ctx, idle ? `Same push, weaker gravity` : `feet at ${y.toFixed(2)} m   g = ${plan.g.toFixed(2)} m/s²`, 8, 14, w, { color: C.ball, size: 12, bold: true });
  if (!idle) stopwatch(ctx, w, Math.min(t, plan.duration), undefined, speedFor(plan.duration));
}

/* ---------- Geostationary orbit ---------- */

function drawGeo(ctx: CanvasRenderingContext2D, w: number, h: number, s: GeoScene, t: number, idle: boolean) {
  const plan = planGeo(s);
  const rWorld = idle ? 7 * EARTH.R : Math.max(plan.r, 3 * EARTH.R);
  const cx = w / 2;
  const cy = h / 2 + 6;
  const k = (Math.min(w, h) / 2 - 44) / rWorld;
  const rE = Math.max(6, EARTH.R * k);
  const a = idle ? { earth: 0, sat: 0 } : plan.at(t);
  const up = -Math.PI / 2; // Hassan starts at the top of the picture
  // Canvas y points down, so "anticlockwise seen from the North Pole" means subtracting the angle.
  const pos = (r: number, ang: number) => [cx + r * Math.cos(up - ang), cy + r * Math.sin(up - ang)] as const;

  // Earth with a few meridians so its turning shows.
  ctx.fillStyle = "rgba(56,189,248,0.25)";
  ctx.beginPath();
  ctx.arc(cx, cy, rE, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(103,232,249,0.55)";
  ctx.lineWidth = 1;
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const [px, py] = pos(rE, a.earth + (i * Math.PI) / 3 + Math.PI / 6);
    ctx.strokeStyle = "rgba(103,232,249,0.25)";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, py);
    ctx.stroke();
  }
  const [hx, hy] = pos(rE, a.earth);
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.arc(hx, hy, 4, 0, Math.PI * 2);
  ctx.fill();
  label(ctx, s.station, hx + 7, hy + 9, w, { size: 10, color: C.orange, bold: true });

  // Spin direction.
  const rs = rE + 10;
  ctx.strokeStyle = C.dim;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, rs, Math.PI * 0.2, Math.PI * 0.45);
  ctx.stroke();
  const at = (f: number) => [cx + rs * Math.cos(Math.PI * f), cy + rs * Math.sin(Math.PI * f)] as const;
  arrow(ctx, ...at(0.2), ...at(0.08), C.dim, 1.2);

  if (idle) {
    label(ctx, "Seen from above the North Pole", 8, 14, w, { size: 10, color: C.dim });
    label(ctx, "h = ?  Enter the height, then test it", w - 8, h - 12, w, { align: "right", size: 10, color: C.dim });
    return;
  }

  const rO = plan.r * k;
  ctx.save();
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = "rgba(167,139,250,0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, rO, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  const drift = plan.driftAt(t);
  const done = t >= plan.duration - 1e-9;
  const good = Math.abs(drift) <= s.maxDrift;
  const col = good ? C.lime : C.rose;
  const [sx, sy] = pos(rO, a.sat);
  // The dish at Hassan points along this line.
  dashed(ctx, [[hx, hy], [sx, sy]], good ? "rgba(163,230,53,0.6)" : "rgba(251,113,133,0.6)", 1);
  ctx.fillStyle = C.ball;
  ctx.fillRect(sx - 4, sy - 4, 8, 8);
  ctx.fillStyle = C.cyan;
  ctx.fillRect(sx - 11, sy - 1.5, 6, 3);
  ctx.fillRect(sx + 5, sy - 1.5, 6, 3);

  const hours = Math.min(t, plan.duration) / 3600;
  label(ctx, `${hours.toFixed(1)} h of ${(s.day / 3600).toFixed(2)} h`, 8, 14, w, { color: C.ball, size: 12, bold: true });
  label(ctx, `h = ${Math.round(s.hKm).toLocaleString("en-IN")} km   orbit takes ${(plan.T / 3600).toFixed(1)} h`, 8, h - 30, w, { size: 10, color: C.violet });
  const dTxt = Math.abs(drift) < 0.05 ? "right overhead" : `${Math.abs(drift).toFixed(0)}° ${drift > 0 ? "east" : "west"} of ${s.station}`;
  label(ctx, `satellite: ${dTxt}`, w - 8, h - 12, w, { align: "right", size: 11, color: done || !good ? col : C.lime, bold: true });
  stopwatch(ctx, w, Math.min(t, plan.duration), undefined, speedFor(plan.duration));
}

/* ---------- Throw from a small moon ---------- */

function drawThrow(ctx: CanvasRenderingContext2D, w: number, h: number, s: ThrowScene, t: number, idle: boolean) {
  const plan = planThrow(s);
  const R = s.body.R;
  const { k, X, Y } = fitWorld(w, h, { x0: -0.9 * R, x1: 0.9 * R, y0: 0.55 * R, y1: R + 1.6 * s.H }, { l: 10, r: 10, t: 30, b: 0 });

  // A few fixed stars.
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  for (let i = 0; i < 24; i++) {
    const sx = ((i * 97) % 101) / 101;
    const sy = ((i * 53) % 61) / 61;
    ctx.fillRect(sx * w, sy * h * 0.7, 1.2, 1.2);
  }

  // The moon, drawn as a sphere, with a few craters.
  ctx.fillStyle = "#3f3a37";
  ctx.beginPath();
  ctx.arc(X(0), Y(0), R * k, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(251,146,60,0.55)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  for (const [cxm, cym, cr] of [
    [-0.45, 0.82, 0.08],
    [0.5, 0.78, 0.06],
    [0.2, 0.88, 0.035],
    [-0.7, 0.62, 0.05],
  ]) {
    ctx.beginPath();
    ctx.arc(X(cxm * R), Y(cym * R), cr * R * k, 0, Math.PI * 2);
    ctx.fill();
  }
  label(ctx, s.body.name, X(0.62 * R), Y(0.6 * R), w, { align: "center", size: 11, color: C.orange, bold: true });

  // Rover at the launch point.
  ctx.fillStyle = C.dim;
  ctx.fillRect(X(0) - 9, Y(R) - 6, 18, 6);

  // Probe with its net.
  const done = !idle && t >= plan.duration - 1e-9;
  const pY = Y(R + s.H);
  const netCol = done ? (plan.outcome.ok ? C.lime : C.rose) : C.cyan;
  ctx.fillStyle = C.violet;
  ctx.fillRect(X(0) - 8, pY - 16, 16, 9);
  ctx.strokeStyle = netCol;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(X(0), pY - 7, 9, 0, Math.PI);
  ctx.stroke();
  dashed(ctx, [[X(-0.75 * R), pY], [X(0) - 14, pY]], C.faint, 1);
  label(ctx, `probe, ${(s.H / 1000).toFixed(1)} km up`, X(-0.75 * R), pY - 9, w, { size: 10, color: C.violet });

  if (idle) {
    label(ctx, "v = ?  Enter the launch speed, then test it", w - 8, 14, w, { align: "right", size: 10, color: C.dim });
    return;
  }

  // Trail and canister.
  const p = plan.at(t);
  ctx.strokeStyle = "rgba(250,204,21,0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(X(0), Y(R));
  let maxY = 0;
  for (const q of plan.path) {
    if (q.t > t) break;
    maxY = Math.max(maxY, q.y);
  }
  maxY = Math.max(maxY, p.y);
  ctx.lineTo(X(0), Y(R + maxY));
  ctx.stroke();
  const cxp = X(0) + 3;
  const cyp = Y(R + p.y) - 4;
  ctx.fillStyle = C.ball;
  ctx.beginPath();
  ctx.arc(cxp, cyp, 4, 0, Math.PI * 2);
  ctx.fill();
  // Gravity arrow shrinks as 1/r².
  const gLen = 28 * (R / (R + p.y)) ** 2;
  arrow(ctx, cxp + 12, cyp, cxp + 12, cyp + gLen, C.pink, 1.5);
  label(ctx, "g", cxp + 18, cyp + gLen / 2, w, { size: 10, color: C.pink });

  label(ctx, `height ${(p.y / 1000).toFixed(2)} km   v = ${p.v.toFixed(2)} m/s`, 8, 14, w, { color: C.ball, size: 12, bold: true });
  stopwatch(ctx, w, Math.min(t, plan.duration), undefined, speedFor(plan.duration));
}
