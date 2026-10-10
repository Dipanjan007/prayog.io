"use client";

import { BUILD_S, countByFormula, planPattern, seatsInRow, type PatternScene } from "@/lib/sim/oly-pattern";
import { C, label, useSimCanvas } from "./canvas";

interface Props {
  scene: PatternScene;
  idle: boolean;
  runKey: number;
  onDone?: () => void;
}

const WHAT: Record<PatternScene["kind"], [string, string, string]> = {
  "pat-sticks": ["A row of squares is built from matchsticks", "squares", "matchsticks"],
  "pat-seats": ["Rows of seats are set out", "rows", "seats"],
  "pat-hex": ["A hexagon of diyas grows ring by ring", "rings", "diyas"],
};

/** Pattern builder: builds the student's number of stages and counts what it used against the stock. */
export default function OlyPattern({ scene, idle, runKey, onDone }: Props) {
  const plan = planPattern(scene);
  const { ref } = useSimCanvas((ctx, w, h, t) => draw(ctx, w, h, scene, t, idle), plan.duration, runKey, onDone);
  const [what] = WHAT[scene.kind];
  return <canvas ref={ref} className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80" role="img" aria-label={`${what} for your number. ${idle ? "" : plan.outcome.text}`} />;
}

const STUDENT = "#fbbf24";
/** Most stages drawn one by one; beyond this the picture is capped (the count is still exact). */
const MAX_DRAW = 80;

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, s: PatternScene, t: number, idle: boolean) {
  const plan = planPattern(s);
  const done = !idle && t >= plan.duration - 1e-6;
  const [, unit, things] = WHAT[s.kind];
  const n = Math.min(plan.stage, MAX_DRAW);
  const total = plan.count;
  const p = idle ? 0 : Math.min(1, t / BUILD_S);
  // Stages appear one after another; the counter runs with them.
  const stagesShown = idle ? 0 : Math.min(n, Math.floor(p * n + 1e-9) + (p >= 1 ? 0 : 1));
  const usedNow = idle ? 0 : p >= 1 ? total : countByFormula(s, Math.min(plan.stage, Math.floor(p * plan.stage)));

  label(ctx, idle ? `n = ? ${unit}` : `n = ${Number(s.n.toPrecision(5))} ${unit}`, 8, 14, w, { size: 13, color: STUDENT, bold: true });
  label(ctx, `stock: ${s.target} ${things}`, w - 8, 14, w, { size: 11, color: C.cyan, bold: true, align: "right" });

  // Stock bar: what is used fills it; overflow shows in red past the end.
  const bx = 8;
  const bw = w - 16;
  const by = 26;
  const frac = s.target > 0 ? usedNow / s.target : 0;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(bx, by, bw, 7);
  ctx.fillStyle = frac > 1 ? C.rose : C.lime;
  ctx.fillRect(bx, by, Math.min(1, frac) * bw, 7);
  if (!idle) label(ctx, `used ${usedNow}`, bx, by + 16, w, { size: 10, color: frac > 1 ? C.rose : C.lime });

  const top = 52;
  const bottom = h - 28;
  const H = bottom - top;
  if (!idle && n > 0) {
    if (s.kind === "pat-sticks") {
      const side = Math.min(H * 0.6, (w - 24) / n, 40);
      const x0 = (w - side * n) / 2;
      const y0 = top + (H - side) / 2;
      const sticks: [number, number, number, number][] = [];
      for (let k = 0; k < n; k++) {
        const x = x0 + k * side;
        if (k === 0) sticks.push([x, y0, x, y0 + side]);
        sticks.push([x, y0, x + side, y0], [x, y0 + side, x + side, y0 + side], [x + side, y0, x + side, y0 + side]);
      }
      const shown = p >= 1 ? sticks.length : Math.floor(p * sticks.length);
      ctx.lineCap = "round";
      ctx.lineWidth = Math.max(1, Math.min(3, side * 0.12));
      sticks.slice(0, shown).forEach(([a, b, c, d]) => {
        ctx.strokeStyle = "#fcd34d";
        ctx.beginPath();
        ctx.moveTo(a, b);
        ctx.lineTo(c, d);
        ctx.stroke();
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(c, d, Math.max(1, ctx.lineWidth * 0.7), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.lineCap = "butt";
    } else if (s.kind === "pat-seats") {
      const first = s.first ?? 1;
      const step = s.step ?? 0;
      const widest = seatsInRow(n, first, step);
      const d = Math.min(H / n, (w - 20) / widest, 14);
      for (let k = 1; k <= stagesShown; k++) {
        const seats = seatsInRow(k, first, step);
        const y = bottom - (k - 0.5) * d;
        const x0 = w / 2 - (seats * d) / 2;
        ctx.fillStyle = k % 2 ? "rgba(103,232,249,0.85)" : "rgba(167,139,250,0.85)";
        for (let j = 0; j < seats; j++) ctx.fillRect(x0 + j * d + d * 0.12, y - d * 0.38, d * 0.76, d * 0.76);
      }
      // The court in front of row 1.
      ctx.strokeStyle = C.faint;
      ctx.strokeRect(w / 2 - (first * d) / 2, bottom + 2, first * d, 6);
    } else {
      // Centred hexagon on a triangular lattice: ring k has 6 × (k − 1) diyas.
      const d = Math.min(H / (2 * n - 1) / 0.866, (w - 20) / (2 * n - 1), 16);
      const cx = w / 2;
      const cy = top + H / 2;
      const dirs = [0, 1, 2, 3, 4, 5].map((i) => [Math.cos((Math.PI / 3) * i), Math.sin((Math.PI / 3) * i)]);
      for (let k = 1; k <= stagesShown; k++) {
        ctx.fillStyle = k % 2 ? "#fb923c" : "#facc15";
        const r = Math.max(1, d * 0.32);
        if (k === 1) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }
        const m = k - 1;
        for (let side = 0; side < 6; side++) {
          const [ax, ay] = dirs[side];
          const [bx2, by2] = dirs[(side + 2) % 6];
          for (let j = 0; j < m; j++) {
            const x = cx + d * (ax * m + bx2 * j);
            const y = cy + d * (ay * m + by2 * j);
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
    if (plan.stage > MAX_DRAW) label(ctx, `(first ${MAX_DRAW} drawn)`, w - 8, bottom + 10, w, { size: 9, color: C.dim, align: "right" });
  }

  if (idle) {
    label(ctx, "Enter your answer, then test it", 8, h - 12, w, { size: 10, color: C.dim });
    return;
  }
  if (done) {
    const ok = plan.outcome.ok;
    const short = ok ? `All ${s.target} ${things} used, none missing!` : !Number.isInteger(s.n) || s.n < 1 ? `Not a whole number of ${unit}` : total < s.target ? `${s.target - total} ${things} left over` : `${total - s.target} ${things} short`;
    label(ctx, `${ok ? "✓" : "✗"} ${short}`, w / 2, h - 12, w, { align: "center", size: 13, color: ok ? C.lime : C.rose, bold: true });
  }
}
