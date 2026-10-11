"use client";

import { ROW_S, planNumber, type NumberScene } from "@/lib/sim/oly-number";
import { C, label, useSimCanvas } from "./canvas";

interface Props {
  scene: NumberScene;
  idle: boolean;
  runKey: number;
  onDone?: () => void;
}

/** Packing sim: the student's pile is packed into each box (or row) size in turn, and what is left over shows. */
export default function OlyNumber({ scene, idle, runKey, onDone }: Props) {
  const plan = planNumber(scene);
  const { ref } = useSimCanvas((ctx, w, h, t) => draw(ctx, w, h, scene, t, idle), plan.duration, runKey, onDone);
  return (
    <canvas
      ref={ref}
      className="h-60 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
      role="img"
      aria-label={`Your number of ${scene.item[1]} is packed into ${plural(scene.group)} of ${scene.rules.map((r) => r.size).join(", ")}. ${idle ? "" : plan.outcome.text}`}
    />
  );
}

const ITEM = "#fbbf24";
/** box → boxes, row → rows. */
const plural = (g: string) => (/(s|x|ch|sh)$/.test(g) ? `${g}es` : `${g}s`);

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, s: NumberScene, t: number, idle: boolean) {
  const plan = planNumber(s);
  const done = !idle && t >= plan.duration - 1e-6;
  const narrow = w < 480;
  const [, many] = s.item;

  label(ctx, idle ? `N = ? ${many}` : `N = ${Number(s.n.toPrecision(6))} ${many}`, 8, 14, w, { size: 13, color: ITEM, bold: true });
  label(ctx, `more than ${s.min}`, w - 8, 14, w, { size: 10, color: C.dim, align: "right" });

  const top = 30;
  const bottom = h - 26;
  const band = (bottom - top) / s.rules.length;
  const labelW = narrow ? 0 : 92;
  const x0 = 8 + labelW;
  const x1 = w - 8;

  plan.rows.forEach((r, i) => {
    const y = top + i * band;
    const p = idle ? 0 : Math.max(0, Math.min(1, (t - i * ROW_S) / ROW_S));
    const finished = !idle && p >= 1;
    const ruleText = `${plural(s.group)} of ${r.size}: want ${r.want} left`;
    if (narrow) label(ctx, ruleText, 8, y + 8, w, { size: 10, color: C.cyan });
    else {
      label(ctx, `${plural(s.group)} of ${r.size}`, 8, y + band * 0.38, w, { size: 11, color: C.cyan, bold: true });
      label(ctx, `want ${r.want} left`, 8, y + band * 0.38 + 14, w, { size: 10, color: C.dim });
    }
    if (finished) {
      const txt = `${r.full} full, ${r.left} left ${r.ok ? "✓" : "✗"}`;
      label(ctx, txt, x1, y + 8, w, { size: 10, color: r.ok ? C.lime : C.rose, bold: true, align: "right" });
    }
    if (idle) return;

    // The strip of boxes, then the loose ones.
    const sy = y + (narrow ? 18 : 6);
    const sh = Math.max(8, Math.min(26, band - (narrow ? 24 : 14)));
    const avail = x1 - x0;
    const looseW = Math.min(14, sh * 0.6);
    const shown = Math.floor(p * r.full + 1e-9);
    const bw = Math.min(sh * 1.6, Math.max(1.5, (avail - (r.left + 1) * looseW) / Math.max(1, r.full)));
    for (let k = 0; k < shown; k++) {
      const bx = x0 + k * bw;
      ctx.fillStyle = "rgba(103,232,249,0.14)";
      ctx.strokeStyle = "rgba(103,232,249,0.55)";
      ctx.lineWidth = 1;
      ctx.fillRect(bx + 0.5, sy, Math.max(1, bw - 1.5), sh);
      if (bw > 5) ctx.strokeRect(bx + 0.5, sy, Math.max(1, bw - 1.5), sh);
      // Dots inside when the box is wide enough.
      if (bw >= 10 && r.size <= 12) {
        const cols = Math.ceil(Math.sqrt(r.size * ((bw - 2) / sh)));
        const rows = Math.ceil(r.size / cols);
        const d = Math.min((bw - 3) / cols, (sh - 2) / rows);
        ctx.fillStyle = ITEM;
        for (let j = 0; j < r.size; j++) {
          const cx = bx + 2 + (j % cols) * d + d / 2;
          const cy = sy + 1 + Math.floor(j / cols) * d + d / 2;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(0.8, d * 0.36), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    if (bw <= 10 && shown > 0 && r.full >= 8) label(ctx, `${shown} × ${r.size}`, x0 + 2, sy + sh + 8, w, { size: 9, color: C.dim });
    if (finished) {
      const lx = x0 + r.full * bw + looseW * 0.5;
      for (let k = 0; k < r.left; k++) {
        ctx.fillStyle = r.ok ? C.lime : C.rose;
        ctx.beginPath();
        ctx.arc(lx + k * looseW + looseW / 2, sy + sh / 2, Math.max(2, looseW * 0.32), 0, Math.PI * 2);
        ctx.fill();
      }
      if (r.left === 0) label(ctx, "none left", lx + 4, sy + sh / 2, w, { size: 10, color: r.ok ? C.lime : C.rose });
    }
  });

  if (idle) {
    label(ctx, "Enter your answer, then test it", 8, h - 12, w, { size: 10, color: C.dim });
    return;
  }
  if (done) {
    const ok = plan.outcome.ok;
    const short = ok ? "Every rule fits, and it is the smallest!" : plan.smaller !== null ? `Fits, but ${plan.smaller} is smaller` : plan.rows.some((r) => !r.ok) ? "Wrong number left over" : "Breaks a rule";
    label(ctx, `${ok ? "✓" : "✗"} ${short}`, w / 2, h - 12, w, { align: "center", size: 13, color: ok ? C.lime : C.rose, bold: true });
  }
}
