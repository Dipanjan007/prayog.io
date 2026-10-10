"use client";

import { BUILD_S, badSides, interiorAngle, planPolygon, type PolygonScene } from "@/lib/sim/oly-polygon";
import { C, label, useSimCanvas, wrapLabel } from "./canvas";

interface Props {
  scene: PolygonScene;
  idle: boolean;
  runKey: number;
  onDone?: () => void;
}

/** Polygon sim: builds regular polygons with the student's number of sides and measures their corners. */
export default function OlyPolygon({ scene, idle, runKey, onDone }: Props) {
  const plan = planPolygon(scene);
  const { ref } = useSimCanvas((ctx, w, h, t) => draw(ctx, w, h, scene, t, idle), plan.duration, runKey, onDone);
  const what =
    scene.kind === "poly-vertex" ? "Regular tiles are laid corner to corner around one point." : scene.kind === "poly-pair" ? "Two regular frames are drawn and one corner of each is measured." : "A regular polygon is drawn and one corner is measured.";
  return (
    <canvas ref={ref} className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80" role="img" aria-label={`${what} ${idle ? "" : plan.outcome.text}`} />
  );
}

const rad = (d: number) => (d * Math.PI) / 180;
const fmtDeg = (a: number) => `${Number(a.toFixed(2))}°`;
const TILE = ["rgba(167,139,250,0.35)", "rgba(103,232,249,0.3)", "rgba(244,114,182,0.3)", "rgba(251,146,60,0.3)"];

/** Vertices (screen coords, y down) of a regular n-gon with side s, one vertex at P and its corner spanning angles a0 to a0 + interior (degrees, measured anticlockwise on screen). */
function polygonAt(P: [number, number], n: number, s: number, a0: number) {
  const pts: [number, number][] = [P];
  let x = P[0];
  let y = P[1];
  let dir = a0;
  for (let i = 1; i < n; i++) {
    x += s * Math.cos(rad(dir));
    y -= s * Math.sin(rad(dir));
    pts.push([x, y]);
    dir += 360 / n;
  }
  return pts;
}

/** A regular n-gon centred at (cx, cy) with circumradius R, first vertex at the bottom. */
function centred(cx: number, cy: number, R: number, n: number) {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = Math.PI / 2 + Math.PI / n + (2 * Math.PI * i) / n;
    pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
  }
  return pts;
}

/** Draw the first `frac` of a closed outline. */
function partial(ctx: CanvasRenderingContext2D, pts: [number, number][], frac: number, colour: string, fill?: string) {
  const n = pts.length;
  const edges = frac * n;
  if (fill && frac >= 1) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i <= Math.ceil(edges); i++) {
    const a = pts[(i - 1) % n];
    const b = pts[i % n];
    const f = Math.min(1, edges - (i - 1));
    ctx.lineTo(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f);
  }
  ctx.stroke();
}

/** Arc for the corner at V between the edges to A and B, with a label. */
function corner(ctx: CanvasRenderingContext2D, V: [number, number], A: [number, number], B: [number, number], r: number, colour: string, text: string, w: number, dashedArc = false) {
  const a1 = Math.atan2(A[1] - V[1], A[0] - V[0]);
  let a2 = Math.atan2(B[1] - V[1], B[0] - V[0]);
  while (a2 < a1) a2 += 2 * Math.PI;
  let from = a1;
  let to = a2;
  if (to - from > Math.PI) [from, to] = [a2, a1 + 2 * Math.PI];
  ctx.save();
  if (dashedArc) ctx.setLineDash([4, 3]);
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(V[0], V[1], r, from, to);
  ctx.stroke();
  ctx.restore();
  const mid = (from + to) / 2;
  label(ctx, text, V[0] + (r + 16) * Math.cos(mid), V[1] + (r + 12) * Math.sin(mid), w, { size: 11, color: colour, align: "center", bold: true });
}

function verdict(ctx: CanvasRenderingContext2D, w: number, h: number, ok: boolean, short: string) {
  label(ctx, `${ok ? "✓" : "✗"} ${short}`, w / 2, h - 12, w, { align: "center", size: 13, color: ok ? C.lime : C.rose, bold: true });
}

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, s: PolygonScene, t: number, idle: boolean) {
  const plan = planPolygon(s);
  const done = !idle && t >= plan.duration - 1e-6;
  const p = idle ? 0 : Math.min(1, t / BUILD_S);
  const bad = badSides(s.n);
  const n = Math.round(s.n);

  if (s.kind === "poly-regular") label(ctx, `goal: every corner ${fmtDeg(s.target)}`, 8, 14, w, { size: 11, color: C.lime });
  if (s.kind === "poly-vertex") label(ctx, `${s.fixed.map((k) => `${k}-gon`).join(" + ")} + your tile`, 8, 14, w, { size: 11, color: C.cyan });
  if (s.kind === "poly-pair") label(ctx, `goal: big corner − small corner = ${fmtDeg(s.diff)}`, 8, 14, w, { size: 11, color: C.lime });
  label(ctx, idle ? "n = ?" : `n = ${Number(s.n.toPrecision(5))}`, w - 8, 14, w, { size: 13, color: "#fbbf24", align: "right", bold: true });

  if (idle) {
    const tip =
      s.kind === "poly-regular"
        ? "The sim will draw a regular polygon with n sides and measure a corner."
        : s.kind === "poly-vertex"
          ? "The sim will lay the three tiles corner to corner round one point."
          : "The sim will draw an n-gon and a 2n-gon and measure a corner of each.";
    wrapLabel(ctx, tip, w / 2, h / 2, w, { size: 11, color: C.dim });
    label(ctx, "Enter your answer, then test it", 8, h - 12, w, { size: 10, color: C.dim });
    return;
  }
  if (bad) {
    wrapLabel(ctx, bad, w / 2, h / 2, w, { size: 12, color: C.rose });
    if (done) verdict(ctx, w, h, false, "Not a polygon");
    return;
  }

  const top = 30;
  const bottom = h - 28;
  const H = bottom - top;

  if (s.kind === "poly-regular") {
    // Fixed polygon size; very large n is drawn smaller and finer.
    const R = Math.min(w * 0.38, H * 0.5);
    const cy = top + H / 2;
    const cx = w / 2;
    const pts = centred(cx, cy, R, n);
    partial(ctx, pts, p, C.violet, "rgba(167,139,250,0.12)");
    if (p >= 1) {
      const V = pts[0];
      const r = Math.max(14, Math.min(28, R * 0.3));
      // The drawing's corner, dashed, and the polygon's real corner.
      const a1 = Math.atan2(pts[1][1] - V[1], pts[1][0] - V[0]);
      const tgt = a1 + rad(s.target);
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = "rgba(163,230,53,0.8)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(V[0], V[1]);
      ctx.lineTo(V[0] + Math.cos(tgt) * R * 0.9, V[1] + Math.sin(tgt) * R * 0.9);
      ctx.stroke();
      ctx.restore();
      corner(ctx, V, pts[1], pts[n - 1], r, plan.outcome.ok ? C.lime : C.rose, fmtDeg(interiorAngle(n)), w);
      label(ctx, `dashed: the ${fmtDeg(s.target)} on the drawing`, 8, 32, w, { size: 10, color: "rgba(163,230,53,0.8)" });
    }
    if (done) verdict(ctx, w, h, plan.outcome.ok, plan.outcome.ok ? "The corners match!" : interiorAngle(n) > s.target ? "Corners too wide" : "Corners too sharp");
    return;
  }

  if (s.kind === "poly-vertex") {
    const all = [...s.fixed, n];
    const angles = all.map(interiorAngle);
    const total = angles.reduce((a, b) => a + b, 0);
    // The first fixed tile is the biggest; it points up, so the meeting point sits low and the side is set so that tile fits.
    const reach = 1 / Math.sin(Math.PI / Math.max(s.fixed[0] ?? 4, 4));
    const side = Math.min((0.6 * H) / reach, (0.9 * w) / reach);
    const P: [number, number] = [w / 2, top + H * 0.64];
    let a0 = 90 - angles[0] / 2;
    const tiles = all.map((k, i) => {
      const pts = polygonAt(P, k, side, a0);
      const from = a0;
      a0 += angles[i];
      return { k, pts, from, to: a0 };
    });
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 26, w, h - 52);
    ctx.clip();
    tiles.forEach((tile, i) => {
      const start = (i / tiles.length) * BUILD_S;
      const f = Math.max(0, Math.min(1, (t - start) / (BUILD_S / tiles.length)));
      if (f <= 0) return;
      const mine = i === tiles.length - 1;
      partial(ctx, tile.pts, f, mine ? "#fbbf24" : C.violet, mine ? "rgba(251,191,36,0.28)" : TILE[i % TILE.length]);
    });
    ctx.restore();
    if (p >= 1) {
      // The leftover wedge or the overlap, at the point.
      const gap = 360 - total;
      const r = side * 0.55;
      if (Math.abs(gap) > 0.05) {
        const from = gap > 0 ? tiles[tiles.length - 1].to : tiles[0].from;
        const to = gap > 0 ? from + gap : from - gap;
        ctx.fillStyle = gap > 0 ? "rgba(15,23,42,0.95)" : "rgba(251,113,133,0.55)";
        ctx.strokeStyle = C.rose;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(P[0], P[1]);
        ctx.arc(P[0], P[1], r, -rad(from), -rad(to), true);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        const mid = rad((from + to) / 2);
        label(ctx, gap > 0 ? `gap ${fmtDeg(gap)}` : `overlap ${fmtDeg(-gap)}`, P[0] + (r + 22) * Math.cos(mid), P[1] - (r + 14) * Math.sin(mid), w, { size: 11, color: C.rose, align: "center", bold: true });
      }
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(P[0], P[1], 3, 0, Math.PI * 2);
      ctx.fill();
      label(ctx, `${angles.map((a) => fmtDeg(a)).join(" + ")} = ${fmtDeg(total)}`, 8, 32, w, { size: 10, color: Math.abs(total - 360) <= 0.05 ? C.lime : C.rose });
    }
    if (done) verdict(ctx, w, h, plan.outcome.ok, plan.outcome.ok ? "No gap, no overlap!" : total < 360 ? "A gap is left" : "The tiles overlap");
    return;
  }

  // Two frames side by side.
  const R = Math.min(w * 0.21, H * 0.42);
  const cy = top + H / 2;
  const frames = [
    { k: n, cx: w * 0.27, colour: C.cyan },
    { k: 2 * n, cx: w * 0.73, colour: C.pink },
  ];
  for (const f of frames) {
    const pts = centred(f.cx, cy, R, f.k);
    partial(ctx, pts, p, f.colour, "rgba(255,255,255,0.05)");
    label(ctx, `${f.k}-gon`, f.cx, top + 4, w, { size: 11, color: f.colour, align: "center", bold: true });
    if (p >= 1) corner(ctx, pts[0], pts[1], pts[f.k - 1], Math.max(12, Math.min(22, R * 0.3)), f.colour, fmtDeg(interiorAngle(f.k)), w);
  }
  if (p >= 1) {
    const d = interiorAngle(2 * n) - interiorAngle(n);
    label(ctx, `difference ${fmtDeg(d)}`, w / 2, bottom - 4, w, { size: 11, color: plan.outcome.ok ? C.lime : C.rose, align: "center", bold: true });
  }
  if (done) {
    const d = interiorAngle(2 * n) - interiorAngle(n);
    verdict(ctx, w, h, plan.outcome.ok, plan.outcome.ok ? `Exactly ${fmtDeg(s.diff)} apart!` : d > s.diff ? "Difference too big" : "Difference too small");
  }
}
