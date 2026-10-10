"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import { SIDES, TERMS, fixed, inner, madhavaPi, outer, roundAnswer, roundWorks, type PiRound } from "@/lib/sim/pi";

export type PiMode = "poly" | "series";

export type PiReading =
  | { mode: "poly"; n: number; inner: number; outer: number }
  | { mode: "series"; n: number; corrected: boolean; value: number }
  | { mode: "round"; ok: boolean };

interface Props {
  onReading?: (r: PiReading) => void;
  /** Challenge: find the fewest sides or terms that give π to some decimals. */
  round?: PiRound | null;
}

const MODES: { id: PiMode; label: string }[] = [
  { id: "poly", label: "Polygons" },
  { id: "series", label: "Series" },
];

const COL = { cyan: "#22d3ee", pink: "#f472b6", lime: "#a3e635", violet: "#a78bfa", amber: "#facc15" };
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export default function PiLab({ onReading, round = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<PiMode>(round?.kind ?? "poly");
  const [sides, setSides] = useState(6);
  const [terms, setTerms] = useState(1);
  const [corr, setCorr] = useState(!!round?.corrected);
  const [checked, setChecked] = useState<number | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const lo = inner(sides);
  const hi = outer(sides);
  const est = madhavaPi(terms, corr);

  useEffect(() => {
    if (round) return;
    if (mode === "poly") onReadingRef.current?.({ mode, n: sides, inner: lo, outer: hi });
    else onReadingRef.current?.({ mode, n: terms, corrected: corr, value: est });
  }, [round, mode, sides, lo, hi, terms, corr, est]);

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
    if (mode === "poly") drawPolygons(ctx, size.w, size.h, sides);
    else drawSeries(ctx, size.w, size.h, terms, corr);
  }, [size, mode, sides, terms, corr]);

  const n = mode === "poly" ? sides : terms;
  const lim = mode === "poly" ? SIDES : TERMS;
  const setN = (v: number) => {
    const x = clamp(Math.round(v), lim.min, lim.max);
    if (mode === "poly") setSides(x);
    else setTerms(x);
    setChecked(null);
  };

  const check = () => {
    if (!round) return;
    setChecked(n);
    onReadingRef.current?.({ mode: "round", ok: n === roundAnswer(round) });
  };

  const d = round?.decimals ?? 4;
  const word = mode === "poly" ? "sides" : "terms";

  const canvas = (
    <canvas
      ref={canvasRef}
      className="h-60 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-72"
      role="img"
      aria-label={
        mode === "poly"
          ? `Circle with ${sides}-sided polygons inside and outside: ${fixed(lo, 4)} < π < ${fixed(hi, 4)}`
          : `Madhava's series after ${terms} terms${corr ? " with the end correction" : ""}: ${fixed(est, 6)}`
      }
    />
  );

  const pad = (
    <div className="grid grid-cols-4 gap-2">
      {mode === "poly" ? (
        <button className="btn-ghost !px-1 !py-2 text-sm" aria-label="Halve the sides" onClick={() => setN(sides / 2)} disabled={sides % 2 === 1 || sides < 6}>
          ÷2
        </button>
      ) : (
        <button className="btn-ghost !px-1 !py-2 text-sm" aria-label="10 fewer terms" onClick={() => setN(terms - 10)} disabled={terms <= TERMS.min}>
          −10
        </button>
      )}
      <button className="btn-ghost !px-1 !py-2 text-sm" aria-label={mode === "poly" ? "One fewer side" : "One fewer term"} onClick={() => setN(n - 1)} disabled={n <= lim.min}>
        −1
      </button>
      <button className="btn-ghost !px-1 !py-2 text-sm" aria-label={mode === "poly" ? "One more side" : "One more term"} onClick={() => setN(n + 1)} disabled={n >= lim.max}>
        +1
      </button>
      {mode === "poly" ? (
        <button className="btn-ghost !px-1 !py-2 text-sm" aria-label="Double the sides" onClick={() => setN(sides * 2)} disabled={sides * 2 > SIDES.max}>
          ×2
        </button>
      ) : (
        <button className="btn-ghost !px-1 !py-2 text-sm" aria-label="10 more terms" onClick={() => setN(terms + 10)} disabled={terms >= TERMS.max}>
          +10
        </button>
      )}
    </div>
  );

  const slider = (
    <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2">
      <div className="flex justify-between text-sm">
        <span style={{ color: COL.amber }}>{mode === "poly" ? "Sides n" : "Terms n"}</span>
        <span className="tabular-nums text-white">{n}</span>
      </div>
      <input type="range" aria-label={mode === "poly" ? "Sides n" : "Terms n"} className="range mt-1 w-full" min={lim.min} max={lim.max} step={1} value={n} onChange={(e) => setN(Number(e.target.value))} />
    </label>
  );

  const readouts =
    mode === "poly" ? (
      <div className="grid grid-cols-3 gap-2 text-center">
        <Readout label="Inside" value={fixed(lo, d + 2)} sub={round ? `→ ${fixed(lo, d)}` : undefined} colour="text-cyan-200" />
        <Readout label="Outside" value={fixed(hi, d + 2)} sub={round ? `→ ${fixed(hi, d)}` : undefined} colour="text-pink-200" />
        <Readout label="Gap" value={fixed(hi - lo, d + 2)} colour="text-white" />
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-2 text-center">
        <Readout label={corr ? "4 × (sum + correction)" : "4 × sum"} value={fixed(est, round ? d + 2 : 6)} sub={round ? `→ ${fixed(est, d)}` : undefined} colour="text-lime-200" />
        <Readout label="Last term" value={`${terms % 2 ? "+" : "−"} 1/${2 * terms - 1}`} colour="text-violet-200" />
      </div>
    );

  if (round) {
    const best = roundAnswer(round);
    const ok = checked === best;
    return (
      <div className="flex flex-col gap-3 select-none">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
          <div className="text-[11px] tracking-wider text-white/50">
            Fewest {word}
            {round.corrected ? ", with Madhava's correction" : round.kind === "series" ? ", no correction" : ""}
          </div>
          <div className="font-display mt-1 text-lg text-cyan-100">π to {round.decimals} decimals: {fixed(Math.PI, round.decimals)}</div>
        </div>
        {canvas}
        {readouts}
        {pad}
        {slider}
        <button className="btn-primary !py-2 text-sm" onClick={check}>
          Use {n} {word}
        </button>
        {checked !== null && (
          <p className={`text-center text-sm ${ok ? "text-lime-300" : "text-amber-200"}`}>
            {ok
              ? `Spot on! ${best} ${word} is the fewest that gives ${fixed(Math.PI, round.decimals)}.`
              : roundWorks(checked, round)
                ? `That works, but fewer ${word} also do. Go down and find the first.`
                : round.kind === "poly"
                  ? `Not yet: with ${checked} sides the two polygons do not both give ${fixed(Math.PI, round.decimals)}.`
                  : `Not yet: ${checked} terms give ${fixed(madhavaPi(checked, !!round.corrected), round.decimals)}, not ${fixed(Math.PI, round.decimals)}.`}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 select-none">
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)} className={`rounded-xl py-2 ${mode === m.id ? "bg-white/10 text-white" : "text-white/50"}`}>
            {m.label}
          </button>
        ))}
      </div>

      {canvas}
      {readouts}
      {pad}
      {slider}

      {mode === "poly" ? (
        <>
          <button className="btn-ghost !py-2 text-sm" onClick={() => setSides(6)}>
            Back to the hexagon
          </button>
          <p className="text-center text-xs text-white/40">
            Circle 1 unit across, so its circumference is π. {fixed(lo, 4)} &lt; π &lt; {fixed(hi, 4)}
          </p>
        </>
      ) : (
        <>
          <button
            className={`!py-2 text-sm ${corr ? "btn-primary" : "btn-ghost"}`}
            aria-pressed={corr}
            aria-label="Madhava's correction"
            onClick={() => setCorr((c) => !c)}
          >
            Madhava&apos;s correction: {corr ? "on" : "off"}
          </button>
          <p className="text-center text-xs text-white/40">
            π ÷ 4 = 1 − 1/3 + 1/5 − 1/7 + ... {corr ? `Correction after ${terms} terms: ${terms % 2 ? "−" : "+"} ${terms}/${4 * terms * terms + 1}.` : "π is 3.141593 to 6 decimals."}
          </p>
        </>
      )}
    </div>
  );
}

function Readout({ label, value, sub, colour }: { label: string; value: string; sub?: string; colour: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] tracking-wider text-white/50">{label}</div>
      <div className={`font-display text-base tabular-nums sm:text-lg ${colour}`}>{value}</div>
      {sub && <div className="text-xs tabular-nums text-white/60">{sub}</div>}
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

/** The circle with a regular n-gon inside it (corners on the circle) and one outside (sides touching). */
function drawPolygons(ctx: CanvasRenderingContext2D, w: number, h: number, n: number) {
  const cx = w / 2;
  const cy = h / 2;
  const R = (Math.min(w, h) / 2 - 10) * Math.cos(Math.PI / n);
  const poly = (r: number, colour: string, fill: string) => {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const t = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const x = cx + r * Math.cos(t);
      const y = cy + r * Math.sin(t);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = colour;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };
  poly(R / Math.cos(Math.PI / n), COL.pink, "rgba(244,114,182,0.08)");
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = COL.amber;
  ctx.lineWidth = 2;
  ctx.stroke();
  poly(R, COL.cyan, "rgba(34,211,238,0.08)");
  label(ctx, `${n} sides`, 8, 16, "rgba(255,255,255,0.75)", "left", "bold 12px system-ui, sans-serif");
  label(ctx, "inside", 8, h - 8, COL.cyan);
  label(ctx, "circle", w - 8, 16, COL.amber, "right");
  label(ctx, "outside", w - 8, h - 8, COL.pink, "right");
}

/** 4 × each running total, plotted against the number of terms, with the π line. */
function drawSeries(ctx: CanvasRenderingContext2D, w: number, h: number, n: number, corr: boolean) {
  const top = 14;
  const left = 40;
  const right = w - 12;
  const bottom = h - 28;
  const yLo = 2.7;
  const yHi = 3.6;
  const X = (k: number) => left + ((right - left) * (k - 1)) / Math.max(1, n - 1);
  const Y = (v: number) => bottom - ((bottom - top) * (clamp(v, yLo, yHi) - yLo)) / (yHi - yLo);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.stroke();
  for (const t of [2.8, 3, 3.2, 3.4, 3.6]) label(ctx, t.toFixed(1), left - 6, Y(t) + 4, "rgba(255,255,255,0.5)", "right");
  label(ctx, "1", left, bottom + 14, "rgba(255,255,255,0.5)", "center");
  label(ctx, `${n} terms`, right, bottom + 14, "rgba(255,255,255,0.5)", "right");
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = COL.amber;
  ctx.beginPath();
  ctx.moveTo(left, Y(Math.PI));
  ctx.lineTo(right, Y(Math.PI));
  ctx.stroke();
  ctx.setLineDash([]);
  label(ctx, "π", right - 4, Y(Math.PI) - 6, COL.amber, "right", "bold 13px system-ui, sans-serif");
  const curve = (c: boolean, colour: string) => {
    ctx.strokeStyle = colour;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let k = 1; k <= n; k++) {
      const p: [number, number] = [n === 1 ? (left + right) / 2 : X(k), Y(madhavaPi(k, c))];
      if (k === 1) ctx.moveTo(...p);
      else ctx.lineTo(...p);
    }
    ctx.stroke();
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(n === 1 ? (left + right) / 2 : X(n), Y(madhavaPi(n, c)), 4, 0, Math.PI * 2);
    ctx.fill();
  };
  curve(false, COL.violet);
  if (corr) curve(true, COL.lime);
  label(ctx, "4 × sum", right - 4, top + 10, COL.violet, "right");
  if (corr) label(ctx, "with correction", right - 4, top + 26, COL.lime, "right");
}
