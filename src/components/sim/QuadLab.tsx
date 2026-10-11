"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import {
  BOARD,
  LETTERS,
  NAME_TEXT,
  START,
  alsoNames,
  angles,
  classify,
  diagonals2,
  isProper,
  lenText,
  orderHint,
  orderOk,
  properties,
  roundAngles,
  sides2,
  type Order,
  type Pt,
  type QuadName,
} from "@/lib/sim/quad";

export type QuadReading = { mode: "free"; corners: Pt[]; name: QuadName; angles: number[] | null; diagonals: boolean } | { mode: "check"; ok: boolean };

interface Props {
  onReading?: (r: QuadReading) => void;
  /** Challenge: the shape to make. Its name stays hidden until the student checks it. */
  order?: Order | null;
}

const key = (q: Pt[]) => q.map((p) => `${p.x},${p.y}`).join(" ");

export default function QuadLab({ onReading, order = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [corners, setCorners] = useState<Pt[]>(START);
  const [sel, setSel] = useState(0);
  const [diag, setDiag] = useState(false);
  const [checked, setChecked] = useState<{ at: string; ok: boolean } | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const dragging = useRef(false);
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const name = classify(corners);
  const proper = isProper(corners);
  const ang = proper ? roundAngles(angles(corners)) : null;
  const revealed = !order || (checked !== null && checked.at === key(corners));

  useEffect(() => {
    if (order) return;
    const ok = isProper(corners);
    onReadingRef.current?.({ mode: "free", corners, name: classify(corners), angles: ok ? roundAngles(angles(corners)) : null, diagonals: diag });
  }, [order, corners, diag]);

  useEffect(() => {
    const el = canvasRef.current!;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !size.w) return;
    const ctx = fitCanvas(el, size.w, size.h);
    ctx.clearRect(0, 0, size.w, size.h);
    draw(ctx, size.w, size.h, corners, sel, diag);
  }, [size, corners, sel, diag]);

  /** Move corner i to a peg, unless another corner is already there. */
  const moveTo = (i: number, x: number, y: number) => {
    const p = { x: Math.max(0, Math.min(BOARD.w, Math.round(x))), y: Math.max(0, Math.min(BOARD.h, Math.round(y))) };
    setCorners((q) => (q.some((c, j) => j !== i && c.x === p.x && c.y === p.y) ? q : q.map((c, j) => (j === i ? p : c))));
  };

  const toBoard = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const { u, gx0, gy0 } = layout(size.w, size.h);
    return { x: (e.clientX - r.left - gx0) / u, y: (gy0 - (e.clientY - r.top)) / u, u };
  };
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toBoard(e);
    let best = -1;
    let bd = Infinity;
    corners.forEach((c, i) => {
      const d = Math.hypot(c.x - p.x, c.y - p.y) * p.u;
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    if (best < 0 || bd > Math.max(28, p.u * 0.9)) return;
    setSel(best);
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging.current) return;
    const p = toBoard(e);
    moveTo(sel, p.x, p.y);
  };
  const onUp = () => {
    dragging.current = false;
  };

  const check = () => {
    if (!order) return;
    const ok = orderOk(order, corners);
    setChecked({ at: key(corners), ok });
    onReadingRef.current?.({ mode: "check", ok });
  };

  const s2 = sides2(corners);
  const d2 = diagonals2(corners);
  const pr = properties(corners);
  const also = alsoNames(name);
  const facts: string[] = [];
  if (proper) {
    facts.push(pr.parallelPairs === 2 ? "2 pairs of parallel sides" : pr.parallelPairs === 1 ? "1 pair of parallel sides" : "no parallel sides");
    if (pr.allSidesEqual) facts.push("all sides equal");
    else if (pr.oppositeSidesEqual) facts.push("opposite sides equal");
    else if (pr.kiteSides) facts.push("2 pairs of neighbouring sides equal");
    if (pr.rightAngles) facts.push(`${pr.rightAngles} right angle${pr.rightAngles > 1 ? "s" : ""}`);
    if (diag) {
      if (pr.diagonalsBisect) facts.push("diagonals cut each other in half");
      if (pr.diagonalsEqual) facts.push("diagonals equal");
      if (pr.diagonalsPerpendicular) facts.push("diagonals cross at 90°");
    }
  }
  const sideNames = ["AB", "BC", "CD", "DA"];

  return (
    <div className="flex flex-col gap-3 select-none">
      <canvas
        ref={canvasRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="h-64 w-full cursor-grab touch-none rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={`Quadrilateral ABCD with corners ${corners.map((c, i) => `${LETTERS[i]} (${c.x}, ${c.y})`).join(", ")}. ${
          revealed ? NAME_TEXT[name] : "Name hidden until you check the shape"
        }.${ang ? ` Angles ${ang.map((a, i) => `${LETTERS[i]} ${a}°`).join(", ")}, total 360°.` : ""} Drag a corner to move it.`}
      />

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-center">
        <div className="font-display text-lg text-white" aria-live="polite">
          {revealed ? NAME_TEXT[name] : "Name: ?"}
        </div>
        {revealed && also.length > 0 && <div className="text-xs text-white/50">also a {also.join(", a ")}</div>}
        {facts.length > 0 && <div className="mt-1 text-xs text-cyan-200/80">{facts.join(" · ")}</div>}
      </div>

      <div className="grid grid-cols-4 gap-1.5 text-center">
        {LETTERS.map((l, i) => (
          <Readout key={l} label={`∠${l}`} value={ang ? `${ang[i]}°` : "–"} colour="text-amber-200" />
        ))}
        {sideNames.map((n, i) => (
          <Readout key={n} label={n} value={lenText(s2[i])} colour="text-cyan-200" />
        ))}
      </div>
      <p className="text-center text-xs text-white/50">
        {ang ? `∠A + ∠B + ∠C + ∠D = ${ang.join(" + ")} = ${ang.reduce((s, a) => s + a, 0)}°` : "Move a corner so the sides do not cross."}
        {diag ? ` · diagonals AC = ${lenText(d2[0])}, BD = ${lenText(d2[1])}` : ""}
      </p>

      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
        {LETTERS.map((l, i) => (
          <button
            key={l}
            onClick={() => setSel(i)}
            aria-pressed={sel === i}
            aria-label={`Corner ${l}`}
            className={`rounded-xl py-2 ${sel === i ? "bg-white/10 text-white" : "text-white/50"}`}
          >
            {l}
          </button>
        ))}
      </div>
      <Stepper label="Across" thing="across" colour="#22d3ee" value={corners[sel].x} min={0} max={BOARD.w} onChange={(v) => moveTo(sel, v, corners[sel].y)} />
      <Stepper label="Up" thing="up" colour="#a78bfa" value={corners[sel].y} min={0} max={BOARD.h} onChange={(v) => moveTo(sel, corners[sel].x, v)} />

      <div className="flex flex-wrap gap-2">
        <button className="btn-ghost flex-1 !py-2 text-sm" onClick={() => setDiag((d) => !d)} aria-pressed={diag}>
          {diag ? "Hide diagonals" : "Show diagonals"}
        </button>
        {order && (
          <button className="btn-primary flex-1 !py-2 text-sm" onClick={check}>
            Check the shape
          </button>
        )}
      </div>

      {order && checked !== null && revealed && (
        <p className={`text-center text-sm ${checked.ok ? "text-lime-300" : "text-amber-200"}`}>
          {checked.ok ? `Order done! A ${order.shape}, just as asked.` : orderHint(order, corners)}
        </p>
      )}
    </div>
  );
}

function Readout({ label, value, colour }: { label: string; value: string; colour: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-1 py-1.5">
      <div className="text-[11px] text-white/50">{label}</div>
      <div className={`font-display text-sm tabular-nums ${colour}`}>{value}</div>
    </div>
  );
}

function Stepper(p: { label: string; thing: string; colour: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-1.5">
      <button
        className="h-9 w-9 shrink-0 rounded-lg border border-white/15 text-lg text-white/80 disabled:opacity-30"
        onClick={() => p.onChange(p.value - 1)}
        disabled={p.value <= p.min}
        aria-label={`Less ${p.thing}`}
      >
        −
      </button>
      <label className="min-w-0 flex-1">
        <div className="flex justify-between text-sm">
          <span style={{ color: p.colour }}>{p.label}</span>
          <span className="tabular-nums text-white">{p.value}</span>
        </div>
        <input
          type="range"
          className="range mt-1 w-full"
          min={p.min}
          max={p.max}
          step={1}
          value={p.value}
          onChange={(e) => p.onChange(Number(e.target.value))}
          aria-label={p.label}
        />
      </label>
      <button
        className="h-9 w-9 shrink-0 rounded-lg border border-white/15 text-lg text-white/80 disabled:opacity-30"
        onClick={() => p.onChange(p.value + 1)}
        disabled={p.value >= p.max}
        aria-label={`More ${p.thing}`}
      >
        +
      </button>
    </div>
  );
}

const PAD = 22;

function layout(w: number, h: number) {
  const u = Math.max(4, Math.min((w - 2 * PAD) / BOARD.w, (h - 2 * PAD) / BOARD.h));
  const gx0 = (w - u * BOARD.w) / 2;
  const gy0 = (h + u * BOARD.h) / 2;
  return { u, gx0, gy0 };
}

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, q: Pt[], sel: number, diag: boolean) {
  const { u, gx0, gy0 } = layout(w, h);
  const X = (x: number) => gx0 + x * u;
  const Y = (y: number) => gy0 - y * u;
  const P = q.map((p) => ({ x: X(p.x), y: Y(p.y) }));

  // Pegs.
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  for (let i = 0; i <= BOARD.w; i++)
    for (let j = 0; j <= BOARD.h; j++) {
      ctx.beginPath();
      ctx.arc(X(i), Y(j), 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

  const proper = isProper(q);
  ctx.beginPath();
  P.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  if (proper) {
    ctx.fillStyle = "rgba(34,211,238,0.08)";
    ctx.fill();
  }
  ctx.strokeStyle = proper ? "#22d3ee" : "#fb7185";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.stroke();

  if (diag) {
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = "#a78bfa";
    ctx.lineWidth = 1.5;
    for (const [a, b] of [[0, 2], [1, 3]]) {
      ctx.beginPath();
      ctx.moveTo(P[a].x, P[a].y);
      ctx.lineTo(P[b].x, P[b].y);
      ctx.stroke();
      ctx.fillStyle = "#a78bfa";
      ctx.beginPath();
      ctx.arc((P[a].x + P[b].x) / 2, (P[a].y + P[b].y) / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.setLineDash([]);
  }

  if (proper) {
    // Equal sides get the same number of tick marks; parallel sides get matching arrows.
    const s2 = sides2(q);
    const groups = [...new Set(s2)].filter((v) => s2.filter((x) => x === v).length > 1);
    const pr = properties(q);
    for (let i = 0; i < 4; i++) {
      const a = P[i];
      const b = P[(i + 1) % 4];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const ux = (b.x - a.x) / len;
      const uy = (b.y - a.y) / len;
      const g = groups.indexOf(s2[i]);
      if (g >= 0) {
        ctx.strokeStyle = "#fde68a";
        ctx.lineWidth = 1.5;
        for (let t = 0; t <= g; t++) {
          const off = (t - g / 2) * 5;
          const cx = (a.x + b.x) / 2 + ux * off;
          const cy = (a.y + b.y) / 2 + uy * off;
          ctx.beginPath();
          ctx.moveTo(cx - uy * 6, cy + ux * 6);
          ctx.lineTo(cx + uy * 6, cy - ux * 6);
          ctx.stroke();
        }
      }
      const pair = i % 2;
      if (pr.parallel[pair]) {
        // Arrows point the same way on both sides of a pair: flip the second side.
        const sgn = i < 2 ? 1 : -1;
        ctx.strokeStyle = "#f472b6";
        ctx.lineWidth = 1.5;
        for (let t = 0; t <= pair; t++) {
          const cx = a.x + (b.x - a.x) * 0.3 + ux * t * 5 * sgn;
          const cy = a.y + (b.y - a.y) * 0.3 + uy * t * 5 * sgn;
          ctx.beginPath();
          ctx.moveTo(cx - ux * 5 * sgn - uy * 4, cy - uy * 5 * sgn + ux * 4);
          ctx.lineTo(cx, cy);
          ctx.lineTo(cx - ux * 5 * sgn + uy * 4, cy - uy * 5 * sgn - ux * 4);
          ctx.stroke();
        }
      }
    }
  }

  // Corner letters outside, angles inside.
  const ang = proper ? roundAngles(angles(q)) : null;
  const exactRight = proper ? q.map((v, i) => {
    const p = q[(i + 3) % 4];
    const n = q[(i + 1) % 4];
    return (p.x - v.x) * (n.x - v.x) + (p.y - v.y) * (n.y - v.y) === 0;
  }) : [];
  const clampX = (x: number) => Math.max(10, Math.min(w - 10, x));
  const clampY = (y: number) => Math.max(10, Math.min(h - 6, y));
  for (let i = 0; i < 4; i++) {
    const v = P[i];
    const p = P[(i + 3) % 4];
    const n = P[(i + 1) % 4];
    const a = norm(p.x - v.x, p.y - v.y);
    const b = norm(n.x - v.x, n.y - v.y);
    let inx = a.x + b.x;
    let iny = a.y + b.y;
    const l = Math.hypot(inx, iny);
    if (l < 1e-6) {
      inx = -a.y;
      iny = a.x;
    } else {
      inx /= l;
      iny /= l;
    }
    if (ang && ang[i] > 180) {
      inx = -inx;
      iny = -iny;
    }
    if (exactRight[i]) {
      const m = Math.min(9, u * 0.35);
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(v.x + a.x * m, v.y + a.y * m);
      ctx.lineTo(v.x + (a.x + b.x) * m, v.y + (a.y + b.y) * m);
      ctx.lineTo(v.x + b.x * m, v.y + b.y * m);
      ctx.stroke();
    }
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = i === sel ? "#f472b6" : "#fff";
    ctx.fillText(LETTERS[i], clampX(v.x - inx * 14), clampY(v.y - iny * 14 + 5));
    if (ang) {
      ctx.font = "11px system-ui, sans-serif";
      ctx.fillStyle = "#fcd34d";
      ctx.fillText(`${ang[i]}°`, clampX(v.x + inx * 26), clampY(v.y + iny * 26 + 4));
    }
    // The corner itself.
    ctx.fillStyle = i === sel ? "#f472b6" : "#22d3ee";
    ctx.beginPath();
    ctx.arc(v.x, v.y, i === sel ? 7 : 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.textAlign = "left";
}

function norm(x: number, y: number) {
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
}
