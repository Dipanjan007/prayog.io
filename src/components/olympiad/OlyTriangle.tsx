"use client";

import { RUN_S, crossHeight, distance, distanceForAngle, landingDistance, planTriangle, towerHeight, type TriangleScene } from "@/lib/sim/oly-triangle";
import { C, dashed, fitWorld, label, useSimCanvas } from "./canvas";

interface Props {
  scene: TriangleScene;
  idle: boolean;
  runKey: number;
  onDone?: () => void;
}

const WHAT: Record<TriangleScene["kind"], string> = {
  "tri-ladder": "A ladder of your length leans against the wall.",
  "tri-map": "A line of your length is laid out on the map.",
  "tri-bamboo": "The bamboo snaps at your height and its top swings to the ground.",
  "tri-cross": "Your pole stands under the crossing of the two strings.",
  "tri-tower": "A tower of your height is checked against the sight line.",
  "tri-tower2": "The two viewing spots for a tower of your height are marked.",
};

/** Right-triangle sim: ladders, maps, snapped poles, crossing strings and sight lines, built from the student's number. */
export default function OlyTriangle({ scene, idle, runKey, onDone }: Props) {
  const plan = planTriangle(scene);
  const { ref } = useSimCanvas((ctx, w, h, t) => draw(ctx, w, h, scene, t, idle), plan.duration, runKey, onDone);
  return <canvas ref={ref} className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80" role="img" aria-label={`${WHAT[scene.kind]} ${idle ? "" : plan.outcome.text}`} />;
}

const f2 = (x: number) => String(Number(x.toFixed(2)));
const ease = (x: number) => 1 - (1 - Math.max(0, Math.min(1, x))) ** 2;
const STUDENT = "#fbbf24";

function ground(ctx: CanvasRenderingContext2D, w: number, y: number) {
  ctx.fillStyle = C.grass;
  ctx.fillRect(0, y, w, 6);
  ctx.strokeStyle = C.ground;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(w, y);
  ctx.stroke();
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, colour: string, width = 2) {
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, colour: string) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, s: TriangleScene, t: number, idle: boolean) {
  const plan = planTriangle(s);
  const done = !idle && t >= plan.duration - 1e-6;
  const p = idle ? 0 : ease(t / RUN_S);
  const pad = { l: 26, r: 26, t: 44, b: 46 };
  const ok = plan.outcome.ok;

  const value = (sym: string, v: number, unit: string) => label(ctx, idle ? `${sym} = ?` : `${sym} = ${f2(v)} ${unit}`, w - 8, 14, w, { size: 13, color: STUDENT, bold: true, align: "right" });
  const finish = (short: string) => {
    if (idle) label(ctx, "Enter your answer, then test it", 8, h - 12, w, { size: 10, color: C.dim });
    else if (done) label(ctx, `${ok ? "✓" : "✗"} ${short}`, w / 2, h - 12, w, { align: "center", size: 13, color: ok ? C.lime : C.rose, bold: true });
  };

  switch (s.kind) {
    case "tri-ladder": {
      const L = idle ? s.target * 1.1 : s.L;
      const top = L > s.foot ? Math.sqrt(L * L - s.foot * s.foot) : 0;
      const box = { x0: -1, x1: s.foot + 1.5, y0: 0, y1: Math.max(s.target, idle ? 0 : top) * 1.12 + 0.5 };
      const { X, Y } = fitWorld(w, h, box, pad);
      ground(ctx, w, Y(0));
      // Wall with the window.
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(X(-1), Y(box.y1), X(0) - X(-1), Y(0) - Y(box.y1));
      line(ctx, X(0), Y(0), X(0), Y(box.y1), C.track);
      ctx.fillStyle = "rgba(250,204,21,0.25)";
      ctx.fillRect(X(-0.8), Y(s.target + 1.1), X(0) - X(-0.8), Y(s.target) - Y(s.target + 1.1));
      line(ctx, X(-0.9), Y(s.target), X(0.25), Y(s.target), C.lime, 3);
      label(ctx, `sill ${f2(s.target)} m`, X(0.3), Y(s.target) + 12, w, { size: 10, color: C.lime });
      label(ctx, `${f2(s.foot)} m`, (X(0) + X(s.foot)) / 2, Y(0) + 14, w, { size: 10, color: C.dim, align: "center" });
      dot(ctx, X(s.foot), Y(0), 3, C.dim);
      value("L", s.L, "m");
      if (idle) break;
      // The ladder rises from flat until its top touches the wall.
      const finalA = L > s.foot ? Math.acos(s.foot / L) : 0;
      const a = finalA * p;
      const tx = s.foot - L * Math.cos(a);
      const ty = L * Math.sin(a);
      line(ctx, X(s.foot), Y(0), X(tx), Y(ty), STUDENT, 4);
      if (done && top > 0) {
        dot(ctx, X(0), Y(top), 4, ok ? C.lime : C.rose);
        label(ctx, `top at ${f2(top)} m`, X(0.3), Y(top) - 12, w, { size: 11, color: ok ? C.lime : C.rose, bold: true });
      }
      break;
    }
    case "tri-map": {
      const [a, b] = [s.from.at, s.to.at];
      const D = distance(a, b);
      const L = idle ? 0 : s.L * p;
      const ux = (b[0] - a[0]) / D;
      const uy = (b[1] - a[1]) / D;
      const end: [number, number] = [a[0] + ux * L, a[1] + uy * L];
      const xs = [a[0], b[0], 0, idle ? a[0] : a[0] + ux * s.L];
      const ys = [a[1], b[1], 0, idle ? a[1] : a[1] + uy * s.L];
      const box = { x0: Math.floor(Math.min(...xs)) - 1, x1: Math.ceil(Math.max(...xs)) + 1, y0: Math.floor(Math.min(...ys)) - 1, y1: Math.ceil(Math.max(...ys)) + 1 };
      const { X, Y, k } = fitWorld(w, h, box, { l: 20, r: 20, t: 34, b: 26 });
      // Grid every unit (or every 2, 5 when crowded) and the axes.
      const step = k > 14 ? 1 : k > 6 ? 2 : 5;
      ctx.lineWidth = 1;
      for (let x = Math.ceil(box.x0 / step) * step; x <= box.x1; x += step) line(ctx, X(x), Y(box.y0), X(x), Y(box.y1), x === 0 ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.07)", 1);
      for (let y = Math.ceil(box.y0 / step) * step; y <= box.y1; y += step) line(ctx, X(box.x0), Y(y), X(box.x1), Y(y), y === 0 ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.07)", 1);
      label(ctx, "x", X(box.x1) - 6, Y(0) - 8, w, { size: 10, color: C.dim });
      label(ctx, "y", X(0) + 8, Y(box.y1) + 8, w, { size: 10, color: C.dim });
      // Dashed legs show the right triangle.
      dashed(ctx, [[X(a[0]), Y(a[1])], [X(b[0]), Y(a[1])], [X(b[0]), Y(b[1])]], "rgba(103,232,249,0.4)");
      dot(ctx, X(a[0]), Y(a[1]), 5, C.cyan);
      dot(ctx, X(b[0]), Y(b[1]), 5, C.orange);
      label(ctx, `${s.from.name} (${a.join(", ")})`, X(a[0]), Y(a[1]) + (a[1] <= b[1] ? 14 : -14), w, { size: 10, color: C.cyan, align: "center" });
      label(ctx, `${s.to.name} (${b.join(", ")})`, X(b[0]), Y(b[1]) + (b[1] < a[1] ? 14 : -14), w, { size: 10, color: C.orange, align: "center" });
      value("d", s.L, s.unit);
      if (idle) break;
      line(ctx, X(a[0]), Y(a[1]), X(end[0]), Y(end[1]), STUDENT, 3);
      dot(ctx, X(end[0]), Y(end[1]), 3.5, done ? (ok ? C.lime : C.rose) : STUDENT);
      label(ctx, `1 square = ${step} ${s.unit}`, 8, 14, w, { size: 10, color: C.dim });
      break;
    }
    case "tri-bamboo": {
      const x = idle ? s.total / 2 : Math.max(0, Math.min(s.total, s.x));
      const top = s.total - x;
      const land = landingDistance(s.total, x);
      const reach = Math.max(s.mark, Number.isNaN(land) ? 0 : land, top) + 1.5;
      const box = { x0: -1.5, x1: reach, y0: 0, y1: s.total * 1.05 };
      const { X, Y } = fitWorld(w, h, box, pad);
      ground(ctx, w, Y(0));
      // Flag at the mark.
      line(ctx, X(s.mark), Y(0), X(s.mark), Y(0) - 22, C.lime, 2);
      ctx.fillStyle = C.lime;
      ctx.beginPath();
      ctx.moveTo(X(s.mark), Y(0) - 22);
      ctx.lineTo(X(s.mark) + 12, Y(0) - 17);
      ctx.lineTo(X(s.mark), Y(0) - 12);
      ctx.fill();
      label(ctx, `${f2(s.mark)} m`, X(s.mark), Y(0) + 14, w, { size: 10, color: C.lime, align: "center" });
      value("x", s.x, "m");
      if (idle) {
        line(ctx, X(0), Y(0), X(0), Y(s.total), "#84cc16", 5);
        label(ctx, `${f2(s.total)} m`, X(0) + 10, Y(s.total / 2), w, { size: 10, color: C.dim });
        break;
      }
      dashed(ctx, [[X(0), Y(x)], [X(0), Y(s.total)]], "rgba(132,204,22,0.25)", 3);
      line(ctx, X(0), Y(0), X(0), Y(x), "#84cc16", 5);
      // The top part turns about the break. If it can reach, it stops with its tip on the ground.
      const finalA = Number.isNaN(land) ? Math.PI : Math.PI - Math.acos(x / top);
      const a = finalA * p;
      const tipX = top * Math.sin(a);
      const tipY = x + top * Math.cos(a);
      line(ctx, X(0), Y(x), X(tipX), Y(tipY), "#a3e635", 5);
      dot(ctx, X(0), Y(x), 4, C.rose);
      label(ctx, `break ${f2(x)} m`, X(0) - 6, Y(x), w, { size: 10, color: C.rose, align: "right" });
      if (done && !Number.isNaN(land)) label(ctx, `lands ${f2(land)} m`, X(land), Y(0) - 30, w, { size: 11, color: ok ? C.lime : C.rose, align: "center", bold: true });
      break;
    }
    case "tri-cross": {
      const c = crossHeight(s.h1, s.h2);
      // Crossing point: x = gap × h1 ÷ (h1 + h2) from the first pole.
      const cx = (s.gap * s.h1) / (s.h1 + s.h2);
      const box = { x0: -1, x1: s.gap + 1, y0: 0, y1: Math.max(s.h1, s.h2, idle ? 0 : s.y) * 1.08 };
      const { X, Y } = fitWorld(w, h, box, pad);
      ground(ctx, w, Y(0));
      line(ctx, X(0), Y(0), X(0), Y(s.h1), "#d6a76b", 5);
      line(ctx, X(s.gap), Y(0), X(s.gap), Y(s.h2), "#d6a76b", 5);
      label(ctx, `${f2(s.h1)} m`, X(0) - 6, Y(s.h1) - 8, w, { size: 10, color: C.dim, align: "right" });
      label(ctx, `${f2(s.h2)} m`, X(s.gap) + 6, Y(s.h2) - 8, w, { size: 10, color: C.dim });
      label(ctx, `${f2(s.gap)} m`, X(s.gap / 2), Y(0) + 14, w, { size: 10, color: C.dim, align: "center" });
      // Strings of lights.
      line(ctx, X(0), Y(s.h1), X(s.gap), Y(0), "rgba(250,204,21,0.7)", 1.5);
      line(ctx, X(0), Y(0), X(s.gap), Y(s.h2), "rgba(244,114,182,0.7)", 1.5);
      for (let i = 1; i < 12; i++) {
        const f = i / 12;
        dot(ctx, X(s.gap * f), Y(s.h1 * (1 - f)), 2, "#fde047");
        dot(ctx, X(s.gap * f), Y(s.h2 * f), 2, "#f9a8d4");
      }
      value("h", s.y, "m");
      if (idle) break;
      const y = s.y * p;
      line(ctx, X(cx), Y(0), X(cx), Y(y), STUDENT, 4);
      if (done) {
        dot(ctx, X(cx), Y(c), 4, ok ? C.lime : C.rose);
        if (!ok) label(ctx, `crossing ${f2(c)} m`, X(cx) + 8, Y(c) - 10, w, { size: 10, color: C.rose });
      }
      break;
    }
    case "tri-tower": {
      const H = idle ? 0 : s.h;
      const top = towerHeight(s.dist, s.angle, s.eye);
      const box = { x0: -2, x1: s.dist + 3, y0: 0, y1: Math.max(top, H) * 1.1 };
      const { X, Y } = fitWorld(w, h, box, pad);
      ground(ctx, w, Y(0));
      // Observer and sight line.
      line(ctx, X(0), Y(0), X(0), Y(s.eye), C.cyan, 3);
      dot(ctx, X(0), Y(s.eye), 3.5, C.cyan);
      dashed(ctx, [[X(0), Y(s.eye)], [X(s.dist), Y(s.eye)]], C.faint);
      const reach = idle ? 0.5 : p;
      line(ctx, X(0), Y(s.eye), X(s.dist * reach), Y(s.eye + (top - s.eye) * reach), "rgba(103,232,249,0.85)", 1.5);
      label(ctx, `${s.angle}°`, X(0) + 34, Y(s.eye) - 9, w, { size: 11, color: C.cyan, bold: true });
      label(ctx, `${f2(s.dist)} m`, X(s.dist / 2), Y(0) + 14, w, { size: 10, color: C.dim, align: "center" });
      label(ctx, `eye ${f2(s.eye)} m`, X(0) + 6, Y(s.eye / 2), w, { size: 9, color: C.dim });
      value("h", s.h, "m");
      if (idle) {
        line(ctx, X(s.dist), Y(0), X(s.dist), Y(top * 0.6), "rgba(255,255,255,0.2)", 10);
        label(ctx, "?", X(s.dist) + 10, Y(top * 0.3), w, { size: 13, color: STUDENT, bold: true });
        break;
      }
      line(ctx, X(s.dist), Y(0), X(s.dist), Y(H), "rgba(251,146,60,0.6)", 10);
      line(ctx, X(s.dist) - 7, Y(H), X(s.dist) + 7, Y(H), STUDENT, 3);
      if (done) {
        dot(ctx, X(s.dist), Y(top), 4, ok ? C.lime : C.rose);
        label(ctx, `sight line hits ${f2(top)} m`, X(s.dist) - 8, Y(top) - 12, w, { size: 10, color: ok ? C.lime : C.rose, align: "right" });
      }
      break;
    }
    case "tri-tower2": {
      const H = idle ? s.gap * 0.8 : s.h;
      const d1 = distanceForAngle(H, s.a1);
      const d2 = distanceForAngle(H, s.a2);
      const box = { x0: -3, x1: Math.max(d1, d2 + s.gap) + 4, y0: 0, y1: H * 1.12 };
      const { X, Y } = fitWorld(w, h, box, pad);
      // Sea, the tower at x = 0, the boat sailing in from the far spot.
      ctx.fillStyle = "rgba(56,189,248,0.12)";
      ctx.fillRect(X(0) + 6, Y(0), w, 8);
      ground(ctx, X(0) + 6, Y(0));
      line(ctx, X(0), Y(0), X(0), Y(H), "rgba(255,255,255,0.75)", 8);
      ctx.fillStyle = "#fde047";
      ctx.fillRect(X(0) - 6, Y(H) - 4, 12, 6);
      value("h", s.h, "m");
      label(ctx, `${s.a1}° then ${s.a2}°, ${f2(s.gap)} m apart`, 8, 14, w, { size: 10, color: C.cyan });
      if (idle) break;
      // The boat goes from the a1 spot towards the tower by the story's gap; then we look up again.
      const bx = Math.max(0.5, d1 - s.gap * p);
      line(ctx, X(d1), Y(0), X(d1), Y(0) + 6, C.cyan, 2);
      label(ctx, `${s.a1}°`, X(d1), Y(0) + 16, w, { size: 10, color: C.cyan, align: "center" });
      line(ctx, X(d2), Y(0), X(d2), Y(0) + 6, C.lime, 2);
      label(ctx, `${s.a2}° spot`, X(d2), Y(0) + 16, w, { size: 10, color: C.lime, align: "center" });
      line(ctx, X(d1), Y(0), X(0), Y(H), "rgba(103,232,249,0.4)", 1);
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.moveTo(X(bx) - 9, Y(0) - 2);
      ctx.lineTo(X(bx) + 9, Y(0) - 2);
      ctx.lineTo(X(bx) + 6, Y(0) + 3);
      ctx.lineTo(X(bx) - 6, Y(0) + 3);
      ctx.fill();
      if (done) {
        const seen = (Math.atan2(H, bx) * 180) / Math.PI;
        line(ctx, X(bx), Y(0), X(0), Y(H), ok ? C.lime : C.rose, 1.5);
        label(ctx, `now ${f2(seen)}°`, X(bx), Y(0) - 16, w, { size: 11, color: ok ? C.lime : C.rose, align: "center", bold: true });
      }
      break;
    }
  }

  const SHORT: Record<TriangleScene["kind"], [string, string]> = {
    "tri-ladder": ["Right at the sill!", "Misses the sill"],
    "tri-map": ["Lands on the spot!", "Misses the spot"],
    "tri-bamboo": ["On the flag!", "Misses the flag"],
    "tri-cross": ["Touches the crossing!", "Misses the crossing"],
    "tri-tower": ["Grazes the top!", "Wrong height"],
    "tri-tower2": [`Exactly ${"a2" in s ? s.a2 : ""}° now!`, "Wrong angle at the second spot"],
  };
  finish(SHORT[s.kind][ok ? 0 : 1]);
}
