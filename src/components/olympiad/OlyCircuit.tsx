"use client";

import { planBulb, planHeater, planShunt, type BulbScene, type CircuitScene, type HeaterScene, type ShuntScene } from "@/lib/sim/oly-electricity";
import { C, label, useSimCanvas } from "./canvas";

interface Props {
  scene: CircuitScene;
  idle: boolean;
  runKey: number;
  onDone?: () => void;
}

const BG = "#0a0d1c";
const WIRE = "rgba(255,255,255,0.55)";
/** Speed of the current dots (px/s) when the current is exactly what the design wants. */
const DOT_SPEED = 55;
const DOT_GAP = 18;

type Pt = [number, number];

/** Reusable circuit sim: a bulb with a series resistor, a kettle coil behind a fuse, or a lamp with a shunt fed by a real battery. */
export default function OlyCircuit({ scene, idle, runKey, onDone }: Props) {
  const plan = scene.kind === "electricity-bulb" ? planBulb(scene) : scene.kind === "electricity-heater" ? planHeater(scene) : planShunt(scene);
  const { ref } = useSimCanvas(
    (ctx, w, h, t) => {
      if (scene.kind === "electricity-bulb") drawBulb(ctx, w, h, scene, t, idle);
      else if (scene.kind === "electricity-heater") drawHeater(ctx, w, h, scene, t, idle);
      else drawShunt(ctx, w, h, scene, t, idle);
    },
    plan.duration,
    runKey,
    onDone,
  );
  const what =
    scene.kind === "electricity-bulb"
      ? `A ${scene.E} V battery, a resistor and a ${scene.ratedV} V bulb in series, with current shown as moving dots.`
      : scene.kind === "electricity-heater"
        ? `A ${scene.V} V supply, a ${scene.fuseA} A fuse and a kettle's heating coil in series, with current shown as moving dots.`
        : `A battery with internal resistance feeds a lamp through a ${scene.Rs} Ω resistor, with a resistor X across the lamp.`;
  return (
    <canvas
      ref={ref}
      className="h-60 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
      role="img"
      aria-label={`${what} ${idle ? "" : plan.outcome.text}`}
    />
  );
}

/* ---------- Layout and parts ---------- */

function frame(w: number, h: number, rightPad = 30) {
  return { L: 30, R: w - rightPad, T: w < 480 ? 58 : 44, B: h - 34 };
}

function wire(ctx: CanvasRenderingContext2D, pts: Pt[]) {
  ctx.strokeStyle = WIRE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
}

/** Dots spaced DOT_GAP apart sliding along a polyline, moved forward by `shift` px. */
function dots(ctx: CanvasRenderingContext2D, pts: Pt[], shift: number, color = C.ball) {
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segs.push(d);
    total += d;
  }
  if (total <= 0) return;
  ctx.fillStyle = color;
  const start = ((shift % DOT_GAP) + DOT_GAP) % DOT_GAP;
  for (let s = start; s < total; s += DOT_GAP) {
    let rest = s;
    let i = 0;
    while (i < segs.length - 1 && rest > segs[i]) rest -= segs[i++];
    const f = segs[i] ? rest / segs[i] : 0;
    const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f;
    const y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f;
    ctx.beginPath();
    ctx.arc(x, y, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Covers a stretch of wire (and its dots) so a part can be drawn there. */
function mask(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, width = 14) {
  ctx.strokeStyle = BG;
  ctx.lineWidth = width;
  ctx.lineCap = "butt";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function resistor(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, glow = 0, masked = true) {
  if (masked) mask(ctx, x1, y1, x2, y2);
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const n = 8;
  ctx.save();
  if (glow > 0) {
    ctx.shadowColor = C.orange;
    ctx.shadowBlur = 14 * glow;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let i = 1; i < n; i++) {
    const s = (len * i) / n;
    const a = i % 2 ? 6 : -6;
    ctx.lineTo(x1 + ux * s - uy * a, y1 + uy * s + ux * a);
  }
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

/** Battery on a vertical wire, positive plate at the top. */
function battery(ctx: CanvasRenderingContext2D, x: number, y: number) {
  mask(ctx, x, y - 13, x, y + 13);
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  for (const [dy, half, lw] of [
    [-9, 12, 2],
    [-3, 6, 3],
    [3, 12, 2],
    [9, 6, 3],
  ] as const) {
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x - half, y + dy);
    ctx.lineTo(x + half, y + dy);
    ctx.stroke();
  }
  label(ctx, "+", x - 18, y - 11, 9999, { size: 11, color: C.rose, bold: true });
}

/** A bulb on a vertical wire. glow is power over rated power. */
function bulb(ctx: CanvasRenderingContext2D, x: number, y: number, glow: number) {
  mask(ctx, x, y - 15, x, y + 15);
  if (glow > 0.01) {
    const g = Math.min(glow, 1.6);
    const rad = 14 + 34 * g;
    const grad = ctx.createRadialGradient(x, y, 2, x, y, rad);
    const hot = glow > 1.06;
    grad.addColorStop(0, hot ? `rgba(255,255,255,${Math.min(1, g)})` : `rgba(253,224,71,${Math.min(1, 0.95 * g)})`);
    grad.addColorStop(0.4, hot ? `rgba(253,224,71,${0.6 * Math.min(1, g)})` : `rgba(250,204,21,${0.45 * g})`);
    grad.addColorStop(1, "rgba(250,204,21,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
    if (hot) {
      ctx.strokeStyle = C.rose;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(x, y, rad * 0.75, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.stroke();
  // Filament: lead-ins and a small coil, coloured by how hot it is.
  const fil = glow > 0.01 ? (glow > 0.7 ? "#fde68a" : C.orange) : "rgba(255,255,255,0.6)";
  ctx.strokeStyle = fil;
  ctx.beginPath();
  ctx.moveTo(x, y - 15);
  ctx.lineTo(x - 5, y - 2);
  for (let i = 0; i <= 4; i++) ctx.lineTo(x - 5 + (10 * i) / 4, y - 2 + (i % 2 ? -4 : 0));
  ctx.lineTo(x, y + 15);
  ctx.stroke();
}

function meter(ctx: CanvasRenderingContext2D, x: number, y: number, letter: string, vertical: boolean) {
  if (vertical) mask(ctx, x, y - 12, x, y + 12);
  else mask(ctx, x - 12, y, x + 12, y);
  ctx.fillStyle = BG;
  ctx.strokeStyle = C.cyan;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  label(ctx, letter, x, y + 0.5, 9999, { size: 11, color: C.cyan, bold: true, align: "center" });
}

function status(ctx: CanvasRenderingContext2D, w: number, h: number, text: string, color: string) {
  label(ctx, text, w / 2, h - 12, w, { align: "center", size: 12, color, bold: true });
}

function idleNote(ctx: CanvasRenderingContext2D, w: number, h: number) {
  status(ctx, w, h, "Enter your answer, then switch on", C.dim);
}

const ease = (t: number, d = 0.4) => Math.min(1, Math.max(0, t / d));

/* ---------- 1. Bulb with a series resistor ---------- */

function drawBulb(ctx: CanvasRenderingContext2D, w: number, h: number, s: BulbScene, t: number, idle: boolean) {
  const plan = planBulb(s);
  const { L, R, T, B } = frame(w, h);
  const loop: Pt[] = [
    [L, B],
    [L, T],
    [R, T],
    [R, B],
    [L, B],
  ];
  const on = idle ? 0 : ease(t);
  wire(ctx, loop);
  if (!idle) dots(ctx, loop, DOT_SPEED * (plan.I / plan.Irated) * t);

  const midY = (T + B) / 2;
  const midX = (L + R) / 2;
  const half = Math.min(48, (R - L) * 0.2);
  battery(ctx, L, midY);
  label(ctx, `${s.E} V`, L + 16, midY, w, { size: 11, color: C.dim });
  resistor(ctx, midX - half, T, midX + half, T, C.cyan);
  label(ctx, idle ? "R = ?" : `R = ${s.R.toFixed(1)} Ω`, midX, T - 14, w, { align: "center", size: 12, color: C.cyan, bold: true });
  bulb(ctx, R, midY, on * (plan.P / s.ratedP));
  label(ctx, `${s.ratedV} V, ${s.ratedP} W`, R - 18, midY, w, { align: "right", size: 10, color: C.dim });
  meter(ctx, midX, B, "A", false);

  if (idle) {
    label(ctx, `bulb needs ${plan.Irated.toFixed(2)} A`, 8, 14, w, { size: 11, color: C.dim });
    return idleNote(ctx, w, h);
  }
  const I = plan.I * on;
  label(ctx, `I = ${I.toFixed(3)} A`, 8, 14, w, { size: 12, color: C.ball, bold: true });
  label(ctx, `rated ${plan.Irated.toFixed(3)} A`, w - 8, w < 480 ? 34 : 14, w, { align: "right", size: 11, color: C.dim });
  label(ctx, `${I.toFixed(3)} A`, midX, B - 20, w, { align: "center", size: 10, color: C.cyan });
  if (on < 1) return;
  const off = plan.I / plan.Irated - 1;
  if (plan.outcome.ok) status(ctx, w, h, "Full rated brightness ✓", C.lime);
  else status(ctx, w, h, off > 0 ? `Too bright: ${Math.round(off * 100)}% over the rated current` : `Too dim: ${Math.round(-off * 100)}% under the rated current`, off > 0 ? C.rose : C.orange);
}

/* ---------- 2. Kettle coil behind a fuse ---------- */

function drawHeater(ctx: CanvasRenderingContext2D, w: number, h: number, s: HeaterScene, t: number, idle: boolean) {
  const plan = planHeater(s);
  const { L, R, T, B } = frame(w, h, 52);
  const loop: Pt[] = [
    [L, B],
    [L, T],
    [R, T],
    [R, B],
    [L, B],
  ];
  const tEnd = plan.blowAt ?? plan.duration;
  const tc = Math.min(t, tEnd);
  const blown = !idle && plan.blowAt !== null && t >= plan.blowAt;
  const Iwant = s.targetP / s.V;
  const on = idle ? 0 : ease(tc);
  // After the fuse blows, the coil cools over half a second.
  const heat = idle ? 0 : blown ? Math.max(0, 1 - (t - tEnd) / 0.5) : on;

  const midY = (T + B) / 2;
  const kw = 30;
  const kTop = T + 16;
  const kBot = B - 12;
  // Water warms at a rate set by the power; it should just reach boiling at the end.
  const temp = idle ? 25 : Math.min(100, 25 + 75 * (plan.P / s.targetP) * (Math.max(0, tc - 0.2) / (plan.duration - 0.2)));

  wire(ctx, loop);
  if (!idle) dots(ctx, loop, DOT_SPEED * (plan.I / Iwant) * tc);

  // AC supply on the left.
  mask(ctx, L, midY - 14, L, midY + 14);
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(L, midY, 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i <= 16; i++) {
    const x = L - 7 + (14 * i) / 16;
    const y = midY - 4 * Math.sin((i / 16) * Math.PI * 2);
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.stroke();
  label(ctx, `${s.V} V ~`, L + 17, midY, w, { size: 11, color: C.dim });

  // Fuse on the top wire.
  const fx = (L + R) / 2;
  mask(ctx, fx - 20, T, fx + 20, T);
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(fx - 16, T - 6, 32, 12);
  ctx.strokeStyle = blown ? C.rose : WIRE;
  ctx.beginPath();
  ctx.moveTo(fx - 20, T);
  if (blown) {
    ctx.lineTo(fx - 5, T);
    ctx.moveTo(fx + 5, T);
  }
  ctx.lineTo(fx + 20, T);
  ctx.stroke();
  if (blown && t - tEnd < 0.6) {
    const k = 1 - (t - tEnd) / 0.6;
    ctx.strokeStyle = `rgba(251,146,60,${k})`;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(fx + 6 * Math.cos(a), T + 6 * Math.sin(a));
      ctx.lineTo(fx + (10 + 14 * (1 - k)) * Math.cos(a), T + (10 + 14 * (1 - k)) * Math.sin(a));
      ctx.stroke();
    }
  }
  label(ctx, `${s.fuseA} A fuse`, fx, T - 16, w, { align: "center", size: 11, color: blown ? C.rose : C.dim, bold: blown });

  // Kettle body around the coil, drawn over the wire.
  ctx.fillStyle = BG;
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(R - kw, kTop, 2 * kw, kBot - kTop, 8);
  ctx.fill();
  ctx.stroke();
  const warm = (temp - 25) / 75;
  const wTop = kTop + 18;
  ctx.fillStyle = `rgba(${Math.round(56 + 180 * warm)},${Math.round(189 - 80 * warm)},${Math.round(248 - 150 * warm)},0.28)`;
  ctx.fillRect(R - kw + 2, wTop, 2 * kw - 4, kBot - wTop - 2);
  if (temp >= 99.5) {
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    for (let i = 0; i < 6; i++) {
      const by = kBot - 6 - (((t * 40 + i * 23) % (kBot - wTop - 10)) | 0);
      ctx.beginPath();
      ctx.arc(R - kw + 8 + ((i * 11) % (2 * kw - 14)), by, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.strokeStyle = WIRE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(R, kTop);
  ctx.lineTo(R, midY - 26);
  ctx.moveTo(R, midY + 26);
  ctx.lineTo(R, kBot);
  ctx.stroke();

  // Heating coil inside the kettle.
  const coilColor = heat > 0.05 ? `rgba(251,${Math.round(146 + 60 * (1 - heat))},60,1)` : "rgba(255,255,255,0.75)";
  resistor(ctx, R, midY - 26, R, midY + 26, coilColor, heat * Math.min(1.4, plan.P / s.targetP), false);
  label(ctx, idle ? "L = ?" : `L = ${s.L.toFixed(2)} m`, R - kw - 6, midY, w, { align: "right", size: 12, color: C.cyan, bold: true });
  ctx.fillStyle = BG;
  ctx.fillRect(R - kw + 3, kTop + 2, 2 * kw - 6, 14);
  label(ctx, `${Math.round(temp)} °C`, R, kTop + 9, w, { align: "center", size: 10, color: temp >= 99.5 ? C.lime : C.dim, bold: temp >= 99.5 });

  if (idle) {
    label(ctx, `goal: ${s.targetP} W`, 8, 14, w, { size: 11, color: C.dim });
    return idleNote(ctx, w, h);
  }
  const I = blown ? 0 : plan.I * on;
  label(ctx, `I = ${I.toFixed(2)} A`, 8, 14, w, { size: 12, color: blown ? C.rose : C.ball, bold: true });
  label(ctx, `P = ${Math.round(blown ? 0 : plan.P * on)} W / goal ${s.targetP} W`, w - 8, w < 480 ? 34 : 14, w, { align: "right", size: 11, color: C.dim });
  if (blown) return status(ctx, w, h, "Fuse blown! The kettle goes cold", C.rose);
  if (t < plan.duration) return;
  if (plan.outcome.ok) status(ctx, w, h, "Boiling right on time, fuse holds ✓", C.lime);
  else status(ctx, w, h, plan.P < s.targetP ? `Only ${Math.round(plan.P)} W: still not boiling` : `${Math.round(plan.P)} W: coil runs too hot`, plan.P < s.targetP ? C.orange : C.rose);
}

/* ---------- 3. Real battery, series resistor, lamp with a shunt ---------- */

function drawShunt(ctx: CanvasRenderingContext2D, w: number, h: number, s: ShuntScene, t: number, idle: boolean) {
  const plan = planShunt(s);
  const { L, R, T, B } = frame(w, h);
  const xJ = L + (R - L) * 0.6;
  const main1: Pt[] = [
    [L, B],
    [L, T],
    [xJ, T],
  ];
  const main2: Pt[] = [
    [xJ, B],
    [L, B],
  ];
  const lampPath: Pt[] = [
    [xJ, T],
    [xJ, B],
  ];
  const xPath: Pt[] = [
    [xJ, T],
    [R, T],
    [R, B],
    [xJ, B],
  ];
  const on = idle ? 0 : ease(t);
  for (const p of [main1, main2, lampPath, xPath]) wire(ctx, p);
  // Dot speeds are proportional to each current, scaled so the design current runs at DOT_SPEED.
  const Iref = (s.E - s.VL) / (s.r + s.Rs);
  if (!idle) {
    const k = (DOT_SPEED / Iref) * t;
    dots(ctx, main1, k * plan.I);
    dots(ctx, main2, k * plan.I);
    dots(ctx, lampPath, k * plan.IL);
    dots(ctx, xPath, k * plan.IX);
  }
  // Junction dots.
  ctx.fillStyle = WIRE;
  for (const y of [T, B]) {
    ctx.beginPath();
    ctx.arc(xJ, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Battery with its internal resistance, boxed.
  const midY = (T + B) / 2;
  ctx.save();
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = C.faint;
  ctx.lineWidth = 1;
  ctx.strokeRect(L - 18, midY - 36, 36, 70);
  ctx.restore();
  battery(ctx, L, midY - 14);
  resistor(ctx, L, midY + 6, L, midY + 30, "rgba(255,255,255,0.8)");
  label(ctx, idle || !plan.outcome.ok ? "E = ?" : `E = ${s.E} V`, L + 22, midY - 14, w, { size: 10, color: C.dim });
  label(ctx, idle || !plan.outcome.ok ? "r = ?" : `r = ${s.r} Ω`, L + 22, midY + 18, w, { size: 10, color: C.dim });

  const half = Math.min(30, (xJ - L) * 0.22);
  const rsX = (L + xJ) / 2 + 6;
  resistor(ctx, rsX - half, T, rsX + half, T, "rgba(255,255,255,0.85)");
  label(ctx, `${s.Rs} Ω`, rsX, T - 14, w, { align: "center", size: 11, color: C.dim });

  bulb(ctx, xJ, midY, on * ((plan.V / s.VL) ** 2));
  resistor(ctx, R, midY - 22, R, midY + 22, C.cyan);
  label(ctx, idle ? "X = ?" : `X = ${s.X.toFixed(2)} Ω`, R - 12, midY, w, { align: "right", size: 12, color: C.cyan, bold: true });

  if (idle) {
    label(ctx, `lamp: ${s.VL} V, ${(s.VL * s.VL) / s.RL} W`, 8, 14, w, { size: 11, color: C.dim });
    return idleNote(ctx, w, h);
  }
  const V = plan.V * on;
  label(ctx, `lamp V = ${V.toFixed(2)} V`, 8, 14, w, { size: 12, color: C.ball, bold: true });
  label(ctx, `I = ${(plan.I * on).toFixed(2)} A`, w - 8, w < 480 ? 34 : 14, w, { align: "right", size: 11, color: C.dim });
  label(ctx, `${(plan.IL * on).toFixed(2)} A`, xJ - 6, midY + 26, w, { align: "right", size: 10, color: C.ball });
  label(ctx, `${(plan.IX * on).toFixed(2)} A`, R - 6, midY + 32, w, { align: "right", size: 10, color: C.ball });
  if (on < 1) return;
  const off = plan.V / s.VL - 1;
  if (plan.outcome.ok) status(ctx, w, h, `Lamp at its rated ${s.VL} V ✓`, C.lime);
  else status(ctx, w, h, off > 0 ? "Lamp over-run: too much voltage" : "Lamp too dim: X takes too much current", off > 0 ? C.rose : C.orange);
}
