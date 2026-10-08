"use client";

import {
  cubeUpperDensity,
  liftForce,
  planBarge,
  planCube,
  planFluids,
  planLift,
  type BargeScene,
  type CubeScene,
  type FluidsScene,
  type LiftScene,
} from "@/lib/sim/oly-fluids";
import { C, arrow, dashed, label, speedFor, stopwatch, useSimCanvas } from "./canvas";

interface Props {
  scene: FluidsScene;
  idle: boolean;
  runKey: number;
  onDone?: () => void;
}

const WATER = "rgba(56,189,248,0.26)";
const WATER_EDGE = "rgba(103,232,249,0.8)";
const OIL = "rgba(251,146,60,0.32)";
const KERO = "rgba(250,204,21,0.16)";

/** Reusable fluids sim: a hydraulic lift, a barge loaded to its line, or a cube settling between two liquids. */
export default function OlyFluids({ scene, idle, runKey, onDone }: Props) {
  const plan = planFluids(scene);
  const { ref } = useSimCanvas(
    (ctx, w, h, t) => {
      if (scene.kind === "fluids-lift") drawLift(ctx, w, h, scene, t, idle);
      else if (scene.kind === "fluids-barge") drawBarge(ctx, w, h, scene, t, idle);
      else drawCube(ctx, w, h, scene, t, idle);
    },
    plan.duration,
    runKey,
    onDone,
  );
  const what =
    scene.kind === "fluids-lift"
      ? `A hydraulic lift holding a car, with a small piston pushed by ${idle ? "your" : scene.force.toFixed(0) + " N of"} force.`
      : scene.kind === "fluids-barge"
        ? `A barge in sea water with a load line painted on its side, being loaded with ${idle ? "your amount of" : scene.cargo.toFixed(1) + " tonnes of"} iron ore.`
        : `A U-tube with water and kerosene, and a jar where a plastic cube ${idle ? "" : `of density ${scene.rho.toFixed(0)} kg/m³ `}is dropped into kerosene floating on water.`;
  return (
    <canvas
      ref={ref}
      className="h-60 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
      role="img"
      aria-label={`${what} ${idle ? "" : plan.outcome.text}`}
    />
  );
}

function verdict(ctx: CanvasRenderingContext2D, w: number, h: number, ok: boolean, text: string) {
  label(ctx, text, w - 8, h - 12, w, { align: "right", size: 11, color: ok ? C.lime : C.rose, bold: true });
}

/* ---------- Hydraulic lift ---------- */

function drawLift(ctx: CanvasRenderingContext2D, w: number, h: number, s: LiftScene, t: number, idle: boolean) {
  const plan = planLift(s);
  const groundY = h * 0.74;
  const top = w < 480 ? 58 : 40;
  const k = (groundY - top) / (s.height + s.headroom + 1.5); // px per metre
  const y = idle ? s.height : plan.at(t);
  const done = !idle && t >= plan.duration - 1e-6;

  // Floor and the oil system below it.
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(0, groundY, w, h - groundY);
  ctx.strokeStyle = C.ground;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(w, groundY);
  ctx.stroke();

  const bigX = w * 0.64;
  const bigW = Math.max(26, Math.min(70, w * 0.09));
  const smallX = w * 0.14;
  const smallW = bigW * (s.dSmall / s.dBig) * 3; // drawn 3× wider than scale so it shows
  const pipeY = groundY + (h - groundY) * 0.62;
  // Pipe and cylinders full of oil.
  ctx.fillStyle = OIL;
  ctx.fillRect(smallX - smallW / 2, pipeY - 5, bigX - smallX, 10);
  ctx.fillRect(bigX - bigW / 2, groundY + 2, bigW, pipeY - groundY + 3);
  const smallTop = groundY - 34;
  ctx.fillRect(smallX - smallW / 2, smallTop, smallW, pipeY - smallTop + 5);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1;
  ctx.strokeRect(bigX - bigW / 2, groundY + 2, bigW, pipeY - groundY + 3);
  ctx.strokeRect(smallX - smallW / 2, smallTop - 14, smallW, pipeY - smallTop + 19);
  label(ctx, "oil", (smallX + bigX) / 2, pipeY + 14, w, { align: "center", size: 10, color: C.orange });
  label(ctx, `⌀ ${(s.dBig * 100).toFixed(0)} cm`, bigX + bigW / 2 + 4, groundY + 14, w, { size: 10, color: C.dim });
  label(ctx, `⌀ ${(s.dSmall * 100).toFixed(1)} cm`, smallX + smallW / 2 + 6, groundY - 20, w, { size: 10, color: C.dim });

  // Small piston and the push on it.
  ctx.fillStyle = C.dim;
  ctx.fillRect(smallX - smallW / 2, smallTop - 4, smallW, 4);
  arrow(ctx, smallX, smallTop - 40, smallX, smallTop - 6, C.pink, 2);
  label(ctx, idle ? "F = ?" : `F = ${s.force.toFixed(1)} N`, smallX + 8, smallTop - 34, w, { size: 11, color: C.pink, bold: true });

  // Ram, platform and car.
  const platY = groundY - y * k;
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillRect(bigX - bigW * 0.35, platY, bigW * 0.7, groundY - platY + 2);
  const platW = Math.min(w * 0.5, 230);
  ctx.fillStyle = C.track;
  ctx.fillRect(bigX - platW / 2, platY - 5, platW, 5);
  const bad = done && !plan.outcome.ok;
  const body = bad ? C.rose : C.cyan;
  const carW = platW * 0.86;
  const carH = Math.min(1.5 * k * 0.55, 34);
  const cx0 = bigX - carW / 2;
  const wheelR = Math.max(5, carH * 0.32);
  const baseY = platY - 5 - wheelR;
  ctx.fillStyle = body;
  ctx.globalAlpha = 0.85;
  ctx.fillRect(cx0, baseY - carH * 0.55, carW, carH * 0.55);
  ctx.beginPath();
  ctx.moveTo(cx0 + carW * 0.2, baseY - carH * 0.55);
  ctx.lineTo(cx0 + carW * 0.32, baseY - carH);
  ctx.lineTo(cx0 + carW * 0.72, baseY - carH);
  ctx.lineTo(cx0 + carW * 0.84, baseY - carH * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#1e293b";
  ctx.strokeStyle = C.track;
  for (const fx of [0.2, 0.8]) {
    ctx.beginPath();
    ctx.arc(cx0 + carW * fx, baseY, wheelR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  // Working height and top stop.
  const workY = groundY - s.height * k;
  const stopY = groundY - (s.height + s.headroom) * k;
  const mx = bigX + platW / 2 + 10;
  dashed(ctx, [[bigX - platW / 2 - 6, workY], [Math.min(w - 4, mx + 4), workY]], C.faint, 1);
  label(ctx, `${s.height} m`, Math.min(w - 30, mx + 2), workY - 9, w, { size: 10, color: C.dim });
  ctx.fillStyle = C.orange;
  ctx.fillRect(bigX - bigW * 0.6, stopY - 3 - 5 - wheelR * 2 - carH, bigW * 1.2, 3);
  label(ctx, "top stop", bigX + bigW * 0.7, stopY - 3 - 5 - wheelR * 2 - carH, w, { size: 10, color: C.orange });

  if (idle) {
    label(ctx, `Car + platform: ${s.mass} kg`, 8, 14, w, { size: 11, color: C.dim });
    label(ctx, "Enter the force, then test it", w - 8, h - 12, w, { align: "right", size: 10, color: C.dim });
    return;
  }
  const p = s.force / (Math.PI * (s.dSmall / 2) ** 2);
  const up = p * Math.PI * (s.dBig / 2) ** 2;
  label(ctx, `p = ${(p / 1000).toFixed(0)} kPa   up: ${(up / 1000).toFixed(2)} kN   weight: ${((s.mass * 9.8) / 1000).toFixed(2)} kN`, 8, 14, w, {
    size: w < 480 ? 10 : 11,
    color: C.ball,
    bold: true,
  });
  stopwatch(ctx, w, Math.min(t, plan.duration), undefined, speedFor(plan.duration));
  if (done) verdict(ctx, w, h, plan.outcome.ok, plan.outcome.ok ? "Car held still" : s.force < liftForce(s.mass, s.dBig, s.dSmall) ? "Car sinks" : "Car hits the stop");
}

/* ---------- Barge ---------- */

function drawBarge(ctx: CanvasRenderingContext2D, w: number, h: number, s: BargeScene, t: number, idle: boolean) {
  const plan = planBarge(s);
  const kx = (w * 0.62) / s.L;
  const ky = Math.min(3 * kx, (h * 0.42) / s.hull);
  const surfY = h * 0.52;
  const bedY = h - 6;
  const bx0 = (w - s.L * kx) / 2;
  const bx1 = bx0 + s.L * kx;
  const lower = 1.2;
  const d = idle ? plan.d0 : plan.at(t);
  const done = !idle && t >= plan.duration - 1e-6;

  // Sea.
  ctx.fillStyle = WATER;
  ctx.fillRect(0, surfY, w, bedY - surfY);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(0, bedY, w, h - bedY);

  // Hull.
  const bottom = Math.min(bedY, surfY + d * ky);
  const deck = bottom - s.hull * ky;
  const flooded = plan.sinks && !idle && t > lower && d > s.hull;
  ctx.fillStyle = flooded ? "rgba(251,113,133,0.35)" : "rgba(148,163,184,0.55)";
  ctx.strokeStyle = C.track;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.rect(bx0, deck, bx1 - bx0, bottom - deck);
  ctx.fill();
  ctx.stroke();
  // Load line.
  const lineY = bottom - s.line * ky;
  ctx.strokeStyle = C.ball;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx0 + 6, lineY);
  ctx.lineTo(bx0 + (bx1 - bx0) * 0.3, lineY);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(bx0 + (bx1 - bx0) * 0.18, lineY, 6, 0, Math.PI * 2);
  ctx.stroke();
  label(ctx, "load line", bx0 + (bx1 - bx0) * 0.32, lineY, w, { size: 10, color: C.ball });

  // Water drawn again in front of the hull's lower part, faintly, so the hull looks immersed.
  ctx.fillStyle = "rgba(56,189,248,0.18)";
  if (bottom > surfY) ctx.fillRect(bx0, surfY, bx1 - bx0, bottom - surfY);
  ctx.strokeStyle = WATER_EDGE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, surfY);
  ctx.lineTo(w, surfY);
  ctx.stroke();
  label(ctx, "sea water, 1025 kg/m³", 8, surfY + 14, w, { size: 10, color: C.cyan });

  // Cargo: a heap of ore whose size grows with the mass, lowered by a crane hook.
  const frac = Math.min(1, s.cargo / 140);
  const heapW = (bx1 - bx0) * (0.3 + 0.5 * frac);
  const heapH = Math.max(6, ky * 0.9 * Math.sqrt(frac));
  const hx = (bx0 + bx1) / 2;
  let heapBase = deck;
  if (!idle && t < lower) {
    const u = t / lower;
    heapBase = deck - (1 - u) * (deck - (w < 480 ? 64 : 46) - heapH);
    ctx.strokeStyle = C.dim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hx, 0);
    ctx.lineTo(hx, heapBase - heapH);
    ctx.stroke();
  }
  if (!idle) {
    ctx.fillStyle = "rgba(180,83,9,0.85)";
    ctx.beginPath();
    ctx.moveTo(hx - heapW / 2, heapBase);
    ctx.lineTo(hx - heapW * 0.3, heapBase - heapH);
    ctx.lineTo(hx + heapW * 0.3, heapBase - heapH);
    ctx.lineTo(hx + heapW / 2, heapBase);
    ctx.closePath();
    ctx.fill();
    label(ctx, `${s.cargo.toFixed(1)} t ore`, hx, heapBase - heapH - 10, w, { align: "center", size: 11, color: C.orange, bold: true });
  }
  label(ctx, `${s.L} m × ${s.B} m hull, heights stretched`, 8, h - 30, w, { size: 10, color: C.dim });

  if (idle) {
    label(ctx, "Enter the cargo, then test it", w - 8, 14, w, { align: "right", size: 10, color: C.dim });
    label(ctx, `empty draft at sea: ${(plan.d0 * 100).toFixed(1)} cm`, 8, 14, w, { size: 10, color: C.dim });
    return;
  }
  label(ctx, plan.sinks && t > lower + 1 ? "draft: sinking!" : `draft: ${(Math.min(d, s.hull) * 100).toFixed(1)} cm`, 8, 14, w, { size: 12, color: C.ball, bold: true });
  stopwatch(ctx, w, Math.min(t, plan.duration), undefined, speedFor(plan.duration));
  if (done) verdict(ctx, w, h, plan.outcome.ok, plan.outcome.ok ? "At the line" : plan.sinks ? "Sunk" : plan.dF > s.line ? "Line under water" : "Line above water");
}

/* ---------- U-tube and cube ---------- */

function drawCube(ctx: CanvasRenderingContext2D, w: number, h: number, s: CubeScene, t: number, idle: boolean) {
  const plan = planCube(s);
  const rhoK = cubeUpperDensity(s);
  const topPad = w < 480 ? 52 : 34;
  const floorY = h - 22;
  const k = (floorY - topPad) / (s.low + s.high + 3); // px per cm
  const split = w * 0.36;
  const done = !idle && t >= plan.duration - 1e-6;

  // U-tube on the left, drawn at the same scale.
  const tubeW = Math.max(9, 1.6 * k);
  const lx = split * 0.3;
  const rx = split * 0.75;
  const uBottom = floorY - 1 * k;
  const bY = floorY - 5 * k; // boundary level
  const Y = (cm: number) => bY - cm * k;
  ctx.fillStyle = WATER;
  // Water: bottom bend, right arm up to 10.4 cm, left arm up to the boundary.
  ctx.fillRect(lx + tubeW / 2, uBottom - tubeW, rx - lx - tubeW, tubeW);
  ctx.fillRect(rx - tubeW / 2, Y(s.uWater), tubeW, uBottom - Y(s.uWater));
  ctx.fillRect(lx - tubeW / 2, bY, tubeW, uBottom - bY);
  ctx.fillStyle = "rgba(250,204,21,0.38)";
  ctx.fillRect(lx - tubeW / 2, Y(s.uOil), tubeW, bY - Y(s.uOil));
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1;
  const tubeTop = Y(s.uOil + 2);
  ctx.beginPath();
  ctx.moveTo(lx - tubeW / 2, tubeTop);
  ctx.lineTo(lx - tubeW / 2, uBottom);
  ctx.lineTo(rx + tubeW / 2, uBottom);
  ctx.lineTo(rx + tubeW / 2, tubeTop);
  ctx.moveTo(lx + tubeW / 2, tubeTop);
  ctx.lineTo(lx + tubeW / 2, uBottom - tubeW);
  ctx.lineTo(rx - tubeW / 2, uBottom - tubeW);
  ctx.lineTo(rx - tubeW / 2, tubeTop);
  ctx.stroke();
  dashed(ctx, [[lx - tubeW, bY], [rx + tubeW, bY]], C.faint, 1);
  label(ctx, `${s.uOil.toFixed(1)}`, lx - tubeW / 2 - 4, (bY + Y(s.uOil)) / 2, w, { align: "right", size: 10, color: C.ball });
  label(ctx, `${s.uWater.toFixed(1)}`, rx + tubeW / 2 + 4, (bY + Y(s.uWater)) / 2, w, { size: 10, color: C.cyan });
  label(ctx, "U-tube (cm)", (lx + rx) / 2, floorY + 12, w, { align: "center", size: 10, color: C.dim });

  // Jar on the right.
  const jx0 = split + (w - split) * 0.18;
  const jx1 = w - (w - split) * 0.12;
  const J = (cm: number) => floorY - cm * k;
  ctx.fillStyle = WATER;
  ctx.fillRect(jx0, J(s.low), jx1 - jx0, floorY - J(s.low));
  ctx.fillStyle = KERO;
  ctx.fillRect(jx0, J(s.low + s.high), jx1 - jx0, J(s.low) - J(s.low + s.high));
  ctx.strokeStyle = WATER_EDGE;
  ctx.beginPath();
  ctx.moveTo(jx0, J(s.low));
  ctx.lineTo(jx1, J(s.low));
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(jx0, J(s.low + s.high + 2.5));
  ctx.lineTo(jx0, floorY);
  ctx.lineTo(jx1, floorY);
  ctx.lineTo(jx1, J(s.low + s.high + 2.5));
  ctx.stroke();
  label(ctx, `kerosene ${rhoK.toFixed(0)}`, jx1 - 4, J(s.low + s.high) + 10, w, { align: "right", size: 10, color: C.ball });
  label(ctx, "water 1000", jx1 - 4, floorY - 10, w, { align: "right", size: 10, color: C.cyan });

  // Where the lab saw the cube: a dashed outline.
  const side = s.a * k;
  const cx = jx0 + (jx1 - jx0) * 0.4;
  const seenBottom = J(s.low - s.seenInLow);
  ctx.save();
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = C.lime;
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - side / 2, seenBottom - side, side, side);
  ctx.restore();
  label(ctx, "lab", cx - side / 2 - 4, seenBottom - side / 2, w, { align: "right", size: 10, color: C.lime });

  if (idle) {
    label(ctx, "Enter the density, then test it", w - 8, 14, w, { align: "right", size: 10, color: C.dim });
    return;
  }
  const yb = plan.at(t);
  const bad = done && !plan.outcome.ok;
  ctx.fillStyle = bad ? "rgba(251,113,133,0.75)" : "rgba(167,139,250,0.8)";
  ctx.fillRect(cx - side / 2, J(yb) - side, side, side);
  ctx.strokeStyle = C.track;
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - side / 2, J(yb) - side, side, side);
  const inWater = Math.max(0, Math.min(s.a, s.low - yb));
  label(ctx, `ρ = ${s.rho.toFixed(0)} kg/m³   in water: ${inWater.toFixed(1)} cm`, 8, 14, w, { size: w < 480 ? 11 : 12, color: C.ball, bold: true });
  stopwatch(ctx, w, Math.min(t, plan.duration), undefined, speedFor(plan.duration));
  if (done) verdict(ctx, w, h, plan.outcome.ok, plan.outcome.ok ? "Matches the lab" : plan.rest.where === "floor" ? "Sank to the bottom" : plan.rest.where === "surface" ? "Floats on top" : plan.rest.inLow > s.seenInLow ? "Sits too low" : "Sits too high");
}
