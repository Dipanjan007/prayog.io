"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import {
  DRAW_MAX,
  KOCH_SIDE,
  STEPS,
  checkCount,
  countAt,
  koch,
  kochArea,
  kochAreaLimit,
  kochPerimeter,
  kochSide,
  kochSides,
  shapeOf,
  sierArea,
  sierHoles,
  sierTriangles,
  sierpinski,
  type CountKind,
  type FractalRound,
} from "@/lib/sim/fractals";

export type FractalMode = "sier" | "koch";

export type FractalReading =
  | { mode: "sier"; step: number; triangles: number; area: number }
  | { mode: "koch"; step: number; sides: number; perimeter: number; area: number }
  | { mode: "round"; ok: boolean };

interface Props {
  onReading?: (r: FractalReading) => void;
  /** Challenge: predict a count at a step that is not drawn yet. */
  round?: FractalRound | null;
}

const MODES: { id: FractalMode; label: string }[] = [
  { id: "sier", label: "Sierpinski" },
  { id: "koch", label: "Koch" },
];

const COL = { cyan: "#22d3ee", pink: "#f472b6", lime: "#a3e635", violet: "#a78bfa", amber: "#facc15" };
const HINT_STEP = 2;

const KIND_WORDS: Record<CountKind, string> = {
  "sier-triangles": "shaded triangles",
  "sier-holes": "holes",
  "koch-sides": "sides",
};

const big = (v: number) => Math.round(v).toLocaleString("en-IN");
const num = (v: number, d = 2) => Number(v.toFixed(d)).toLocaleString("en-IN", { maximumFractionDigits: d });

export default function FractalLab({ onReading, round = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<FractalMode>(round ? shapeOf(round.kind) : "sier");
  const [step, setStep] = useState(round ? HINT_STEP : 0);
  const [guess, setGuess] = useState("");
  const [checked, setChecked] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const drawStep = Math.min(step, DRAW_MAX[mode]);
  const tris = useMemo(() => (mode === "sier" ? sierpinski(drawStep) : []), [mode, drawStep]);
  const flake = useMemo(() => (mode === "koch" ? koch(drawStep) : []), [mode, drawStep]);

  useEffect(() => {
    if (round) return;
    if (mode === "sier") onReadingRef.current?.({ mode, step, triangles: sierTriangles(step), area: sierArea(step) });
    else onReadingRef.current?.({ mode, step, sides: kochSides(step), perimeter: kochPerimeter(step), area: kochArea(step) });
  }, [round, mode, step]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !size.w) return;
    const ctx = fitCanvas(el, size.w, size.h);
    ctx.clearRect(0, 0, size.w, size.h);
    if (mode === "sier") drawSier(ctx, size.w, size.h, tris);
    else drawKoch(ctx, size.w, size.h, flake);
    label(ctx, step > drawStep ? `step ${step} (drawn: ${drawStep})` : `step ${step}`, 8, 16, "rgba(255,255,255,0.7)");
  }, [size, mode, tris, flake, step, drawStep]);

  const check = () => {
    if (!round) return;
    const ok = checkCount(guess, round);
    setChecked(ok);
    if (ok) setStep(round.step);
    onReadingRef.current?.({ mode: "round", ok });
  };

  const canvas = (
    <canvas
      ref={canvasRef}
      className="h-60 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-72"
      role="img"
      aria-label={
        mode === "sier"
          ? `Sierpinski triangle at step ${step}: ${big(sierTriangles(step))} shaded triangles`
          : `Koch snowflake at step ${step}: ${big(kochSides(step))} sides, perimeter ${num(kochPerimeter(step))} cm`
      }
    />
  );

  if (round) {
    const answer = countAt(round.kind, round.step);
    return (
      <div className="flex flex-col gap-3 select-none">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
          <div className="text-[11px] tracking-wider text-white/50">{round.kind === "koch-sides" ? "Koch snowflake" : "Sierpinski triangle"}</div>
          <div className="font-display mt-1 text-lg text-cyan-100">
            How many {KIND_WORDS[round.kind]} at step {round.step}?
          </div>
          <div className="mt-1 text-xs text-white/50 tabular-nums">
            {[0, 1, 2].map((n) => `step ${n}: ${countAt(round.kind, n)}`).join(" · ")}
          </div>
        </div>
        {canvas}
        <div className="flex gap-2">
          <input
            inputMode="numeric"
            size={6}
            value={guess}
            onChange={(e) => {
              setGuess(e.target.value);
              setChecked(null);
            }}
            placeholder="Your count"
            aria-label="Your count"
            className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white tabular-nums"
          />
          <button className="btn-primary !px-4 !py-2 text-sm" onClick={check} disabled={!guess.trim()}>
            Check
          </button>
        </div>
        {checked !== null && (
          <p className={`text-center text-sm ${checked ? "text-lime-300" : "text-amber-200"}`}>
            {checked
              ? `Spot on! ${round.kind === "sier-triangles" ? `3${sup(round.step)}` : round.kind === "koch-sides" ? `3 × 4${sup(round.step)}` : `(3${sup(round.step)} − 1) ÷ 2`} = ${big(answer)}. Here it is, drawn.`
              : round.kind === "sier-holes"
                ? "Not quite. Each step cuts one hole in every shaded triangle: add 1 + 3 + 9 + ..."
                : `Not quite. Each step multiplies the count by ${round.kind === "koch-sides" ? 4 : 3}.`}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 select-none">
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMode(m.id);
              setStep(0);
            }}
            className={`rounded-xl py-2 ${mode === m.id ? "bg-white/10 text-white" : "text-white/50"}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {canvas}

      {mode === "sier" ? (
        <div className="grid grid-cols-3 gap-2 text-center">
          <Readout label="Triangles 3ⁿ" value={big(sierTriangles(step))} colour="text-pink-200" />
          <Readout label="Holes" value={big(sierHoles(step))} colour="text-white" />
          <Readout label="Shaded area" value={`${num(sierArea(step) * 100, 1)}%`} colour="text-lime-200" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <Readout label="Sides 3 × 4ⁿ" value={big(kochSides(step))} colour="text-white" />
          <Readout label="Each side" value={`${num(kochSide(step), 3)} cm`} colour="text-violet-200" />
          <Readout label="Perimeter" value={`${num(kochPerimeter(step))} cm`} colour="text-cyan-200" />
          <Readout label="Area" value={`${num(kochArea(step))} cm²`} colour="text-lime-200" />
        </div>
      )}

      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <button className="btn-ghost !px-4 !py-2 text-lg" aria-label="Step back" onClick={() => setStep((s) => Math.max(STEPS.min, s - 1))} disabled={step <= STEPS.min}>
          −
        </button>
        <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <div className="flex justify-between text-sm">
            <span style={{ color: COL.amber }}>Step n</span>
            <span className="tabular-nums text-white">{step}</span>
          </div>
          <input type="range" aria-label="Step n" className="range mt-1 w-full" min={STEPS.min} max={STEPS.max} step={1} value={step} onChange={(e) => setStep(Number(e.target.value))} />
        </label>
        <button className="btn-ghost !px-4 !py-2 text-lg" aria-label="Next step" onClick={() => setStep((s) => Math.min(STEPS.max, s + 1))} disabled={step >= STEPS.max}>
          +
        </button>
      </div>
      <p className="text-center text-xs text-white/40">
        {mode === "sier"
          ? "Each step cuts the middle out of every shaded triangle, leaving 3 half-size copies."
          : `Each step puts a bump on the middle third of every side. Start: sides of ${KOCH_SIDE} cm. The area never passes ${num(kochAreaLimit())} cm².`}
      </p>
    </div>
  );
}

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (k: number) => `${k}`.replace(/\d/g, (d) => SUP[Number(d)]);

function Readout({ label, value, colour }: { label: string; value: string; colour: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] tracking-wider text-white/50">{label}</div>
      <div className={`font-display text-base tabular-nums sm:text-lg ${colour}`}>{value}</div>
    </div>
  );
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, colour: string, align: CanvasTextAlign = "left", font = "12px system-ui, sans-serif") {
  ctx.font = font;
  ctx.fillStyle = colour;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.textAlign = "left";
}

/** The shaded triangles, scaled so the starting triangle fits below the step label. */
function drawSier(ctx: CanvasRenderingContext2D, w: number, h: number, tris: ReturnType<typeof sierpinski>) {
  const top = 24;
  const side = Math.min(w - 24, (h - top - 10) / (Math.sqrt(3) / 2));
  const x0 = (w - side) / 2;
  const base = top + (side * Math.sqrt(3)) / 2;
  const P = ([x, y]: [number, number]): [number, number] => [x0 + x * side, base - y * side];
  // The starting triangle's outline, so the holes show.
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(...P([0, 0]));
  ctx.lineTo(...P([1, 0]));
  ctx.lineTo(...P([0.5, Math.sqrt(3) / 2]));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COL.pink;
  ctx.beginPath();
  for (const [a, b, c] of tris) {
    ctx.moveTo(...P(a));
    ctx.lineTo(...P(b));
    ctx.lineTo(...P(c));
    ctx.closePath();
  }
  ctx.fill();
}

/** The snowflake, with the circle round the starting triangle that it never leaves. */
function drawKoch(ctx: CanvasRenderingContext2D, w: number, h: number, pts: ReturnType<typeof koch>) {
  const R = Math.min(w - 16, h - 16) / 2;
  const side = R * Math.sqrt(3);
  const cx = w / 2;
  const cy = h / 2;
  // Centre of the starting triangle is (0.5, R1 / 2) in side-1 units, with R1 = 1/√3.
  const ox = 0.5;
  const oy = 1 / (2 * Math.sqrt(3));
  const P = ([x, y]: [number, number]): [number, number] => [cx + (x - ox) * side, cy - (y - oy) * side];
  ctx.setLineDash([4, 5]);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(34, 211, 238, 0.18)";
  ctx.strokeStyle = COL.cyan;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  pts.forEach((p, i) => {
    if (i) ctx.lineTo(...P(p));
    else ctx.moveTo(...P(p));
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
