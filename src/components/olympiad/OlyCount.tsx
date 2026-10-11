"use client";

import { FILL_S, chanceOf, planCount, type ChanceScene, type CountListScene, type CountScene } from "@/lib/sim/oly-count";
import { isWhole } from "@/lib/sim/oly-number";
import { C, label, useSimCanvas, wrapLabel } from "./canvas";

interface Props {
  scene: CountScene;
  idle: boolean;
  runKey: number;
  onDone?: () => void;
}

/**
 * Listing sim. For a count, every real object (pair, match, route) is listed and dropped into the
 * slots of your count: spare slots or homeless objects show the mistake. For a probability, every
 * equally likely outcome lights up and the favourable ones are counted.
 */
export default function OlyCount({ scene, idle, runKey, onDone }: Props) {
  const plan = planCount(scene);
  const { ref } = useSimCanvas((ctx, w, h, t) => (scene.kind === "count-chance" ? drawChance(ctx, w, h, scene, t, idle) : drawList(ctx, w, h, scene, t, idle)), plan.duration, runKey, onDone);
  const what = scene.kind === "count-chance" ? `Every outcome is listed and the ones giving ${scene.event} light up.` : `Every ${scene.word[0]} is listed and dropped into a slot of the count.`;
  return (
    <canvas
      ref={ref}
      className="h-72 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
      role="img"
      aria-label={`${what} ${idle ? "" : plan.outcome.text}`}
    />
  );
}

/** Columns and cell size for n cells in a w × h box, keeping cells roughly `aspect` wide per unit high. */
function layout(n: number, w: number, h: number, aspect: number) {
  let best = { cols: 1, rows: n, cw: 0, ch: 0 };
  for (let cols = 1; cols <= Math.max(1, n); cols++) {
    const rows = Math.ceil(n / cols);
    const ch = Math.min(h / rows, w / cols / aspect);
    if (ch > best.ch) best = { cols, rows, cw: ch * aspect, ch };
  }
  return best;
}

function drawList(ctx: CanvasRenderingContext2D, w: number, h: number, s: CountListScene, t: number, idle: boolean) {
  const plan = planCount(s);
  const done = !idle && t >= plan.duration - 1e-6;
  const narrow = w < 480;
  const [one, many] = s.word;
  const items = s.items;
  const slots = isWhole(s.slots) && s.slots >= 0 ? Math.round(s.slots) : 0;
  const placed = idle ? 0 : Math.min(items.length, Math.floor((t / FILL_S) * items.length + 1e-9));

  label(ctx, s.heading, 8, 14, w, { size: 12, color: C.cyan, bold: true });
  if (!idle) {
    label(ctx, `${placed} ${placed === 1 ? one : many} listed`, w - 8, 14, w, { size: 11, color: "#fbbf24", align: "right", bold: true });
    label(ctx, `slots: ${s.slotsFrom === "answer" ? "your count" : "the story"}, ${Number(s.slots.toPrecision(4))}`, 8, 30, w, { size: 10, color: C.dim });
  }

  // Route problems get a street map next to (or above) the slots.
  let bx = 8;
  let by = 40;
  let bw = w - 16;
  let bh = h - 40 - 26;
  if (s.grid) {
    const g = s.grid;
    const mapH = narrow ? Math.min(96, bh * 0.42) : bh;
    const mapW = narrow ? w - 16 : Math.min(w * 0.36, mapH * ((g.w + 1) / (g.h + 1)));
    const k = Math.min((mapW - 24) / g.w, (mapH - 24) / g.h);
    const ox = 8 + 12 + (narrow ? (mapW - 24 - k * g.w) / 2 : 0);
    const oy = by + 12 + k * g.h;
    const X = (x: number) => ox + x * k;
    const Y = (y: number) => oy - y * k;
    ctx.strokeStyle = C.faint;
    ctx.lineWidth = 2;
    for (let x = 0; x <= g.w; x++) {
      ctx.beginPath();
      ctx.moveTo(X(x), Y(0));
      ctx.lineTo(X(x), Y(g.h));
      ctx.stroke();
    }
    for (let y = 0; y <= g.h; y++) {
      ctx.beginPath();
      ctx.moveTo(X(0), Y(y));
      ctx.lineTo(X(g.w), Y(y));
      ctx.stroke();
    }
    if (g.blocked) {
      ctx.fillStyle = "rgba(56,189,248,0.55)";
      ctx.beginPath();
      ctx.arc(X(g.blocked[0]), Y(g.blocked[1]), Math.max(4, k * 0.28), 0, Math.PI * 2);
      ctx.fill();
    }
    // Faint trail of every route so far, then the newest one bright.
    const drawPath = (path: string, colour: string, width: number) => {
      let x = 0;
      let y = 0;
      ctx.strokeStyle = colour;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(X(0), Y(0));
      for (const c of path) {
        if (c === "E") x++;
        else y++;
        ctx.lineTo(X(x), Y(y));
      }
      ctx.stroke();
    };
    for (let i = 0; i < placed - 1; i++) drawPath(items[i].path ?? "", "rgba(163,230,53,0.08)", 3);
    if (placed > 0) drawPath(items[placed - 1].path ?? "", C.lime, 3);
    ctx.fillStyle = C.cyan;
    ctx.beginPath();
    ctx.arc(X(0), Y(0), 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.orange;
    ctx.beginPath();
    ctx.arc(X(g.w), Y(g.h), 4, 0, Math.PI * 2);
    ctx.fill();
    if (narrow) {
      by += mapH;
      bh -= mapH;
    } else {
      bx += mapW + 12;
      bw -= mapW + 12;
    }
  }

  if (idle) {
    wrapLabel(ctx, s.slotsFrom === "answer" ? `Your count becomes a row of slots, and every real ${one} drops into one.` : `Every ${one} your answer makes drops into the slots.`, bx + bw / 2, by + bh / 2, w, { size: 11, color: C.dim });
    label(ctx, "Enter your answer, then test it", 8, h - 12, w, { size: 10, color: C.dim });
    return;
  }

  const n = Math.max(slots, items.length, 1);
  const longest = Math.max(3, ...items.slice(0, 50).map((i) => i.label.length));
  const L = layout(n, bw, bh, Math.max(1.6, Math.min(5, longest * 0.62)));
  const font = Math.min(11, L.ch * 0.5, (L.cw - 4) / (longest * 0.62));
  for (let i = 0; i < n; i++) {
    const cx = bx + (i % L.cols) * L.cw;
    const cy = by + Math.floor(i / L.cols) * L.ch;
    const pad = Math.min(2, L.ch * 0.12);
    const isSlot = i < slots;
    const hasItem = i < placed;
    const r = { x: cx + pad, y: cy + pad, w: Math.max(1, L.cw - 2 * pad), h: Math.max(1, L.ch - 2 * pad) };
    if (isSlot) {
      ctx.strokeStyle = done && !hasItem ? C.rose : "rgba(255,255,255,0.28)";
      ctx.lineWidth = 1;
      if (r.w > 3) ctx.strokeRect(r.x, r.y, r.w, r.h);
    }
    if (hasItem) {
      ctx.fillStyle = isSlot ? "rgba(163,230,53,0.35)" : "rgba(251,113,133,0.5)";
      ctx.fillRect(r.x, r.y, r.w, r.h);
      if (font >= 6) label(ctx, items[i].label, r.x + r.w / 2, r.y + r.h / 2, w, { size: font, color: "rgba(255,255,255,0.9)", align: "center" });
    } else if (isSlot && done) {
      ctx.fillStyle = "rgba(251,113,133,0.12)";
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
  }

  if (done) {
    const ok = plan.outcome.ok;
    const k = items.length;
    const short = ok ? `Exactly ${k}: a slot for every ${one}!` : s.invalid ? "That cannot happen" : !isWhole(s.slots) ? "A count is a whole number" : k > slots ? `${k - slots} ${k - slots === 1 ? `${one} has` : `${many} have`} no slot` : `${slots - k} ${slots - k === 1 ? "slot stays" : "slots stay"} empty`;
    label(ctx, `${ok ? "✓" : "✗"} ${short}`, w / 2, h - 12, w, { align: "center", size: 13, color: ok ? C.lime : C.rose, bold: true });
  }
}

function drawChance(ctx: CanvasRenderingContext2D, w: number, h: number, s: ChanceScene, t: number, idle: boolean) {
  const plan = planCount(s);
  const done = !idle && t >= plan.duration - 1e-6;
  const { fav, total, p } = chanceOf(s.cells);
  const n = s.cells.length;
  const lit = idle ? 0 : Math.min(n, Math.floor((t / FILL_S) * n + 1e-9));
  let favSoFar = 0;
  let realSoFar = 0;
  for (let i = 0; i < lit; i++) {
    if (s.cells[i].void) continue;
    realSoFar++;
    if (s.cells[i].fav) favSoFar++;
  }

  label(ctx, `event: ${s.event}`, 8, 14, w, { size: 12, color: C.cyan, bold: true });
  label(ctx, idle ? "p = ?" : `your p = ${Number(s.p.toPrecision(4))}`, w - 8, 14, w, { size: 12, color: "#fbbf24", bold: true, align: "right" });
  if (!idle) label(ctx, `${favSoFar} of ${realSoFar} outcomes so far`, 8, 30, w, { size: 10, color: C.lime });

  // Grid with optional labels on the left and top.
  const lab = s.rowLabels ? 18 : 0;
  const gx = 8 + lab;
  const gy = 42 + (s.colLabels ? 14 : 0);
  const barH = 26;
  const gw = w - 16 - lab;
  const gh = h - gy - barH - 24;
  const longest = Math.max(...s.cells.map((c) => c.label.length), 2);
  const cw0 = gw / s.cols;
  const ch = Math.min(gh / s.rows, Math.max(cw0 / Math.max(1.2, longest * 0.55), 12), cw0);
  const cw = Math.min(cw0, ch * Math.max(1.2, longest * 0.62));
  const ox = gx + (gw - cw * s.cols) / 2;
  const font = Math.min(11, ch * 0.5, (cw - 3) / (longest * 0.62));
  s.rowLabels?.forEach((l, r) => label(ctx, l, ox - 6, gy + r * ch + ch / 2, w, { size: Math.min(10, ch * 0.6), color: C.dim, align: "right" }));
  s.colLabels?.forEach((l, c) => label(ctx, l, ox + c * cw + cw / 2, gy - 8, w, { size: Math.min(10, cw * 0.6), color: C.dim, align: "center" }));
  s.cells.forEach((c, i) => {
    const x = ox + (i % s.cols) * cw;
    const y = gy + Math.floor(i / s.cols) * ch;
    const on = i < lit;
    if (c.void) {
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(x + 1, y + 1, cw - 2, ch - 2);
      ctx.strokeStyle = C.faint;
      ctx.beginPath();
      ctx.moveTo(x + 2, y + ch - 2);
      ctx.lineTo(x + cw - 2, y + 2);
      ctx.stroke();
      return;
    }
    ctx.fillStyle = on ? (c.fav ? "rgba(163,230,53,0.45)" : "rgba(255,255,255,0.08)") : "rgba(255,255,255,0.03)";
    ctx.fillRect(x + 1, y + 1, cw - 2, ch - 2);
    if (font >= 6) label(ctx, c.label, x + cw / 2, y + ch / 2, w, { size: font, color: on ? "rgba(255,255,255,0.9)" : C.dim, align: "center" });
  });

  if (idle) {
    label(ctx, "Enter your answer, then test it", 8, h - 12, w, { size: 10, color: C.dim });
    return;
  }

  // A 0-to-1 bar: the true chance fills in as outcomes are counted; your p is a marker.
  const by = h - 24 - barH + 6;
  const bx0 = 8;
  const bx1 = w - 8;
  const X = (q: number) => bx0 + Math.max(0, Math.min(1, q)) * (bx1 - bx0);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(bx0, by, bx1 - bx0, 8);
  const shownP = favSoFar / Math.max(1, total);
  ctx.fillStyle = C.lime;
  ctx.fillRect(bx0, by, X(shownP) - bx0, 8);
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(X(s.p) - 1.5, by - 4, 3, 16);
  label(ctx, "0", bx0, by + 16, w, { size: 9, color: C.dim });
  label(ctx, "1", bx1, by + 16, w, { size: 9, color: C.dim, align: "right" });
  if (done) label(ctx, `${fav} ÷ ${total} = ${Number(p.toPrecision(3))}`, X(p), by + 16, w, { size: 10, color: C.lime, align: "center", bold: true });

  if (done) {
    const ok = plan.outcome.ok;
    label(ctx, `${ok ? "✓ Matches the count!" : `✗ ${s.p > p ? "Too high" : "Too low"}`}`, w / 2, h - 8, w, { align: "center", size: 13, color: ok ? C.lime : C.rose, bold: true });
  }
}
