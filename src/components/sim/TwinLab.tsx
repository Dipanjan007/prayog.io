"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import {
  ANG,
  CLUES,
  SIDE,
  START,
  clueFrom,
  clueInfo,
  judge,
  measure,
  solve,
  type Clue,
  type ClueValues,
  type FitKind,
  type Pt,
  type RoundVerdict,
  type Tri,
  type TwinRound,
} from "@/lib/sim/congruence";

export type TwinReading = { mode: "build"; clue: Clue; kind: FitKind; values: ClueValues } | { mode: "round"; ok: boolean };

interface Props {
  onReading?: (r: TwinReading) => void;
  /** Challenge: pick a clue about this triangle that keeps the round's rule and fits only one triangle. */
  round?: TwinRound | null;
}

type Part = keyof ClueValues;
const COLS = ["#22d3ee", "#f472b6", "#a78bfa"];
const f1 = (v: number) => `${Number(v.toFixed(1))}`;
const partText = (p: Part, v: number) => (p.length === 1 ? `∠${p} = ${f1(v)}°` : `${p} = ${f1(v)} cm`);

const KIND_TEXT: Record<FitKind, string> = {
  one: "Exactly one triangle fits. Your friend's copy will be a perfect twin.",
  two: "Two different triangles fit! Side BC can swing to two places, C₁ and C₂. Your friend might draw the wrong one.",
  many: "Every size fits. The angles fix the shape but not the size, so your friend could draw it big or small.",
  none: "",
};

const NONE_TEXT: Record<Clue, string> = {
  SSS: "No triangle fits: two of the sides together are not longer than the third, so they cannot meet.",
  SAS: "No triangle fits.",
  ASA: "No triangle fits: the two angles add up to 180° or more, so the other sides never meet.",
  RHS: "No triangle fits: the hypotenuse must be the longest side.",
  SSA: "No triangle fits: side BC is too short to reach the slanted line from A.",
  AAA: "No triangle fits: ∠A and ∠B already add up to 180° or more.",
};

const VERDICT_TEXT: Record<Exclude<RoundVerdict, "ok">, string> = {
  rule: "That clue breaks this round's rule.",
  unusable: "This triangle has no right angle, so RHS cannot be used.",
  two: "Two different triangles fit that clue, so your friend might draw the wrong one.",
  many: "Triangles of every size fit those angles, so your friend's copy may be bigger or smaller.",
  none: "No triangle fits that clue.",
  one: "",
};

function partLabel(clue: Clue, p: Part) {
  if (p.length === 1) return `Angle ${p}`;
  if (clue === "RHS" && p === "AB") return "Hypotenuse AB";
  return `Side ${p}`;
}

export default function TwinLab({ onReading, round = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [clue, setClue] = useState<Clue>("SSS");
  const [vals, setVals] = useState<Record<Clue, ClueValues>>(START);
  const [picked, setPicked] = useState<Clue | null>(null);
  const [sent, setSent] = useState<RoundVerdict | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const v = vals[clue];
  const fit = solve(clue, v);

  useEffect(() => {
    if (round) return;
    onReadingRef.current?.({ mode: "build", clue, kind: solve(clue, vals[clue]).kind, values: vals[clue] });
  }, [round, clue, vals]);

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
    if (!round) {
      const f = solve(clue, vals[clue]);
      if (f.kind === "none") drawNone(ctx, size.w, size.h);
      else drawTris(ctx, size.w, size.h, f.tris, clueInfo(clue).parts, clue === "RHS", f.kind);
    } else if (picked && sent) {
      const j = judge(round, picked);
      if (j.fit && j.fit.kind !== "none") drawTris(ctx, size.w, size.h, j.fit.tris, clueInfo(picked).parts, picked === "RHS", j.fit.kind);
      else drawTris(ctx, size.w, size.h, [round.target], ["AB", "BC", "CA"], false, "one");
    } else drawTris(ctx, size.w, size.h, [round.target], ["AB", "BC", "CA"], false, "one");
  }, [size, clue, vals, round, picked, sent]);

  const setPart = (p: Part, x: number) => setVals((s) => ({ ...s, [clue]: { ...s[clue], [p]: x } }));

  const send = () => {
    if (!round || !picked) return;
    const j = judge(round, picked);
    setSent(j.verdict);
    onReadingRef.current?.({ mode: "round", ok: j.verdict === "ok" });
  };

  const active = round ? picked : clue;
  const target = round ? measure(round.target) : null;
  const sentValues = round && picked ? clueFrom(round.target, picked) : null;

  return (
    <div className="flex flex-col gap-3 select-none">
      {round && target && (
        <div className="rounded-2xl border border-orange-300/30 bg-orange-300/[0.07] px-3 py-2 text-center text-xs text-orange-100 tabular-nums">
          Your triangle: AB = {f1(target.AB)} cm, BC = {f1(target.BC)} cm, CA = {f1(target.CA)} cm, ∠A = {f1(target.A)}°, ∠B = {f1(target.B)}°, ∠C = {f1(target.C)}°
        </div>
      )}

      <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Clue">
        {CLUES.map((c) => (
          <button
            key={c.id}
            aria-label={`Clue ${c.id}`}
            aria-pressed={active === c.id}
            onClick={() => {
              if (round) {
                setPicked(c.id);
                setSent(null);
              } else setClue(c.id);
            }}
            className={`rounded-xl border px-1 py-2 font-display text-sm tracking-wider ${
              active === c.id ? "border-violet-300 bg-violet-300/15 text-white" : "border-white/10 text-white/70"
            }`}
          >
            {c.id}
          </button>
        ))}
      </div>
      {active && (
        <p className="text-center text-xs text-white/60">
          {active}: {clueInfo(active).says}
          {active === "RHS" ? " (the right angle is at C)" : ""}
        </p>
      )}

      <canvas
        ref={canvasRef}
        className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={
          round
            ? sent
              ? `Triangles that fit the ${picked} clue`
              : "Your triangle"
            : fit.kind === "none"
              ? `No triangle fits this ${clue} clue`
              : `${fit.kind === "many" ? "Many" : fit.tris.length} triangle${fit.tris.length === 1 ? "" : "s"} fit this ${clue} clue`
        }
      />

      {!round ? (
        <>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-center">
            <div className="text-[11px] tracking-wider text-white/50">Triangles that fit</div>
            <div className={`font-display text-lg ${fit.kind === "one" ? "text-lime-200" : fit.kind === "none" ? "text-white/60" : "text-amber-200"}`}>
              {fit.kind === "one" ? "1" : fit.kind === "two" ? "2" : fit.kind === "many" ? "as many as you like" : "0"}
            </div>
            <p className="mt-1 text-xs text-white/60">{fit.kind === "none" ? NONE_TEXT[clue] : KIND_TEXT[fit.kind]}</p>
          </div>
          {clueInfo(clue).parts.map((p) => (
            <Stepper
              key={`${clue}-${p}`}
              label={partLabel(clue, p)}
              colour={p.length === 1 ? "#facc15" : "#67e8f9"}
              display={p.length === 1 ? `${v[p]}°` : `${v[p]} cm`}
              min={p.length === 1 ? ANG.min : SIDE.min}
              max={p.length === 1 ? ANG.max : SIDE.max}
              step={p.length === 1 ? ANG.step : SIDE.step}
              value={v[p]!}
              onChange={(x) => setPart(p, x)}
            />
          ))}
          {clue === "AAA" && (
            <p className="text-center text-xs text-white/50 tabular-nums">
              ∠C = 180° − (∠A + ∠B) = 180° − ({v.A}° + {v.B}°) = {180 - v.A! - v.B!}°
            </p>
          )}
          {clue === "RHS" && <p className="text-center text-xs text-white/50">∠C is fixed at 90°.</p>}
        </>
      ) : (
        <>
          {sentValues && (
            <p className="text-center text-xs text-white/60 tabular-nums">
              You send: {clueInfo(picked!).parts.map((p) => partText(p, sentValues[p]!)).join(", ")}
              {picked === "RHS" ? ", ∠C = 90°" : ""}
            </p>
          )}
          {picked === "RHS" && !sentValues && <p className="text-center text-xs text-white/60">You send: right angle at C, hypotenuse AB and side BC</p>}
          <button className="btn-primary !py-2 text-sm disabled:opacity-40" disabled={!picked} onClick={send}>
            Send this clue
          </button>
          {sent && (
            <p className={`text-center text-sm ${sent === "ok" ? "text-lime-300" : "text-amber-200"}`}>
              {sent === "ok" ? `Yes! Only one triangle fits ${picked}, and it keeps the rule. Your friend has a perfect twin.` : `Not yet: ${VERDICT_TEXT[sent]}`}
            </p>
          )}
        </>
      )}
    </div>
  );
}

/** A slider with − and + buttons. */
function Stepper(p: { label: string; colour: string; display: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.min(p.max, Math.max(p.min, Math.round(v / p.step) * p.step));
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="flex justify-between text-sm">
        <span style={{ color: p.colour }}>{p.label}</span>
        <span className="tabular-nums text-white">{p.display}</span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <button
          aria-label={`Decrease ${p.label}`}
          onClick={() => p.onChange(clamp(p.value - p.step))}
          className="h-9 w-9 shrink-0 rounded-lg border border-white/10 text-lg text-white/80"
        >
          −
        </button>
        <input
          type="range"
          aria-label={p.label}
          className="range min-w-0 flex-1"
          min={p.min}
          max={p.max}
          step={p.step}
          value={p.value}
          onChange={(e) => p.onChange(Number(e.target.value))}
        />
        <button
          aria-label={`Increase ${p.label}`}
          onClick={() => p.onChange(clamp(p.value + p.step))}
          className="h-9 w-9 shrink-0 rounded-lg border border-white/10 text-lg text-white/80"
        >
          +
        </button>
      </div>
    </div>
  );
}

function drawNone(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "14px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("No triangle fits these clues", w / 2, h / 2);
  ctx.textAlign = "left";
}

/**
 * Draw the triangles that fit, scaled to fill the canvas. The clue's parts are labelled on the
 * first triangle (the biggest one for AAA); corners are lettered, with C₁ and C₂ when two fit.
 */
function drawTris(ctx: CanvasRenderingContext2D, w: number, h: number, tris: Tri[], parts: Part[], rightAtC: boolean, kind: FitKind) {
  const pts = tris.flatMap((t) => [t.A, t.B, t.C]);
  const minX = Math.min(...pts.map((p) => p.x));
  const maxX = Math.max(...pts.map((p) => p.x));
  const minY = Math.min(...pts.map((p) => p.y));
  const maxY = Math.max(...pts.map((p) => p.y));
  const pad = 36;
  const s = Math.min((w - 2 * pad) / Math.max(maxX - minX, 1e-6), (h - 2 * pad) / Math.max(maxY - minY, 1e-6));
  const ox = (w - (maxX - minX) * s) / 2;
  const oy = (h + (maxY - minY) * s) / 2;
  const P = (p: Pt) => ({ x: ox + (p.x - minX) * s, y: oy - (p.y - minY) * s });

  tris.forEach((t, i) => {
    const [a, b, c] = [P(t.A), P(t.B), P(t.C)];
    const col = COLS[i % COLS.length];
    ctx.fillStyle = `${col}1f`;
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = col;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
  });

  const main = kind === "many" ? tris[tris.length - 1] : tris[0];
  const V = { A: P(main.A), B: P(main.B), C: P(main.C) };
  const cen = { x: (V.A.x + V.B.x + V.C.x) / 3, y: (V.A.y + V.B.y + V.C.y) / 3 };
  const m = measure(main);
  ctx.font = "12px system-ui, sans-serif";

  // Right angle at C.
  if (rightAtC) {
    const u = unit(V.C, V.A);
    const q = unit(V.C, V.B);
    const r = 10;
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(V.C.x + u.x * r, V.C.y + u.y * r);
    ctx.lineTo(V.C.x + (u.x + q.x) * r, V.C.y + (u.y + q.y) * r);
    ctx.lineTo(V.C.x + q.x * r, V.C.y + q.y * r);
    ctx.stroke();
  }

  // Labels: corner letters first (always drawn), then angle sizes, then side lengths. Each one is
  // pushed further out along its direction until it clears the labels already placed, or skipped.
  type Label = { text: string; x: number; y: number; dx: number; dy: number; colour: string; font: string; must: boolean };
  const labels: Label[] = [];
  const letter = (p: Pt, c: Pt, text: string) => {
    const o = unit(c, p);
    labels.push({ text, x: p.x + o.x * 15, y: p.y + o.y * 15, dx: o.x, dy: o.y, colour: "#fff", font: "bold 13px system-ui, sans-serif", must: true });
  };
  letter(V.A, cen, "A");
  letter(V.B, cen, "B");
  if (kind === "two") {
    tris.forEach((t, i) => {
      const c2 = P(t.C);
      const ci = { x: (P(t.A).x + P(t.B).x + c2.x) / 3, y: (P(t.A).y + P(t.B).y + c2.y) / 3 };
      letter(c2, ci, i === 0 ? "C₁" : "C₂");
    });
  } else letter(V.C, cen, "C");

  // Given angles: an arc, and the size just inside the corner. In AAA, ∠C is part of the clue too.
  const angles = kind === "many" ? (["A", "B", "C"] as Part[]) : parts.filter((x) => x.length === 1);
  for (const p of angles) {
    const k = p as "A" | "B" | "C";
    const others = (["A", "B", "C"] as const).filter((x) => x !== k);
    const u = unit(V[k], V[others[0]]);
    const q = unit(V[k], V[others[1]]);
    const a1 = Math.atan2(u.y, u.x);
    const a2 = Math.atan2(q.y, q.x);
    let d = a2 - a1;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(V[k].x, V[k].y, 16, a1, a1 + d, d < 0);
    ctx.stroke();
    const bis = unit({ x: 0, y: 0 }, { x: u.x + q.x, y: u.y + q.y });
    labels.push({ text: `${f1(m[k])}°`, x: V[k].x + bis.x * 34, y: V[k].y + bis.y * 34, dx: bis.x, dy: bis.y, colour: "#fde047", font: "12px system-ui, sans-serif", must: false });
  }
  // Given sides: the length, just outside the side.
  for (const p of parts.filter((x) => x.length === 2)) {
    const e1 = V[p[0] as "A" | "B" | "C"];
    const e2 = V[p[1] as "A" | "B" | "C"];
    const mid = { x: (e1.x + e2.x) / 2, y: (e1.y + e2.y) / 2 };
    const out = unit(cen, mid);
    labels.push({ text: `${f1(m[p])} cm`, x: mid.x + out.x * 14, y: mid.y + out.y * 14, dx: out.x, dy: out.y, colour: "#a5f3fc", font: "12px system-ui, sans-serif", must: false });
  }

  const placed: { l: number; t: number; r: number; b: number }[] = [];
  for (const lb of labels) {
    ctx.font = lb.font;
    const tw = ctx.measureText(lb.text).width;
    const boxAt = (step: number) => {
      const cx = lb.x + lb.dx * step;
      const cy = lb.y + lb.dy * step;
      const l = Math.min(w - tw - 7, Math.max(1, cx - tw / 2 - 3));
      const t = Math.min(h - 16, Math.max(1, cy - 8));
      return { l, t, r: l + tw + 6, b: t + 15 };
    };
    const free = (bx: { l: number; t: number; r: number; b: number }) => placed.every((q) => bx.r <= q.l || bx.l >= q.r || bx.b <= q.t || bx.t >= q.b);
    let box = [0, 8, 16, 24].map(boxAt).find(free);
    if (!box && lb.must) box = boxAt(0);
    if (!box) continue;
    placed.push(box);
    ctx.fillStyle = "rgba(10,13,28,0.85)";
    ctx.fillRect(box.l, box.t, box.r - box.l, box.b - box.t);
    ctx.fillStyle = lb.colour;
    ctx.textAlign = "left";
    ctx.fillText(lb.text, box.l + 3, box.t + 12);
  }
}

function unit(from: Pt, to: Pt) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const l = Math.hypot(dx, dy) || 1;
  return { x: dx / l, y: dy / l };
}
