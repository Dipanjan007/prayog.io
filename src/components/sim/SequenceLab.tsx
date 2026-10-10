"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import {
  DIFF,
  FIRST,
  JAR_STEP,
  START,
  TERMS,
  WEEKS,
  apSum,
  apTerm,
  apTerms,
  differences,
  doubleTerm,
  doubleTerms,
  forecastAnswer,
  jarB,
  overtakeWeek,
  parseAnswer,
  sub,
  type Forecast,
} from "@/lib/sim/sequences";

export type SeqMode = "build" | "double";

export type SeqReading =
  | { mode: "build"; a: number; d: number; n: number; pair: boolean; last: number }
  | { mode: "double"; s: number; weeks: number }
  | { mode: "forecast"; ok: boolean };

interface Props {
  onReading?: (r: SeqReading) => void;
  /** Challenge: a pattern to build and a number to predict. */
  forecast?: Forecast | null;
}

const COL = { a: "#22d3ee", d: "#a78bfa", back: "#f472b6", jarA: "#fb923c", jarB: "#22d3ee", line: "#a3e635" };

export default function SequenceLab({ onReading, forecast = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<SeqMode>("build");
  const [a, setA] = useState(2);
  const [d, setD] = useState(2);
  const [n, setN] = useState(6);
  const [pair, setPair] = useState(false);
  const [s, setS] = useState(1);
  const [weeks, setWeeks] = useState(6);
  const [guess, setGuess] = useState("");
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: SeqMode = forecast ? (forecast.kind === "ap" ? "build" : "double") : mode;
  // In a doubling forecast there is no ₹50 jar: just the doubling sequence.
  const jarOnly = forecast?.kind === "double";
  const last = apTerm(a, d, n);
  const sum = apSum(a, d, n);
  const terms = apTerms(a, d, n);
  const dbl = doubleTerm(s, weeks);

  useEffect(() => {
    if (forecast) return;
    if (activeMode === "build") onReadingRef.current?.({ mode: "build", a, d, n, pair, last });
    else onReadingRef.current?.({ mode: "double", s, weeks });
  }, [forecast, activeMode, a, d, n, pair, last, s, weeks]);

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
    if (activeMode === "build") drawBuild(ctx, size.w, size.h, a, d, n, pair && !forecast);
    else drawDouble(ctx, size.w, size.h, s, weeks, jarOnly);
    ctx.textAlign = "left";
  }, [size, activeMode, a, d, n, pair, forecast, s, weeks, jarOnly]);

  const check = () => {
    if (!forecast) return;
    const ok = parseAnswer(guess) === forecastAnswer(forecast);
    setVerdict(ok);
    onReadingRef.current?.({ mode: "forecast", ok });
  };

  const label =
    activeMode === "build"
      ? `Arithmetic progression with first term ${a} and difference ${d}: ${terms.join(", ")}. Term ${n} is ${last} and the sum is ${sum}.`
      : jarOnly
        ? `Doubling sequence starting at ${s}: term ${weeks} is ${dbl}`
        : `Week ${weeks}: Jar A, doubling from ₹${s}, holds ₹${dbl}; Jar B, ₹${JAR_STEP} a week, holds ₹${jarB(weeks)}`;

  const diffs = differences(activeMode === "build" ? terms : doubleTerms(s, weeks));

  return (
    <div className="flex flex-col gap-3 select-none">
      {!forecast && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["build", "double"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${activeMode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m === "build" ? "Build" : "Doubling"}
            </button>
          ))}
        </div>
      )}

      <canvas ref={canvasRef} className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80" role="img" aria-label={label} />

      {activeMode === "build" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="difference d" value={`${d}`} colour="text-violet-200" />
            <Readout label={`term t${sub(n)}`} value={`${last}`} colour="text-cyan-200" />
            <Readout label={`sum S${sub(n)}`} value={`${sum}`} colour="text-pink-200" />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
            <div className="text-[11px] tracking-wider text-white/50">the sequence, and the differences</div>
            <div className="mt-1 break-words tabular-nums text-white">{terms.join(", ")}</div>
            <div className="mt-0.5 break-words text-xs tabular-nums text-violet-200" data-testid="differences">
              {diffs.length ? diffs.map((x) => `+${x}`).join("  ") : "one term has no differences yet"}
            </div>
          </div>
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-center text-sm text-white/70">
            {pair && !forecast
              ? `S${sub(n)} = (${n} × (${a} + ${last})) ÷ 2 = (${n} × ${a + last}) ÷ 2 = ${n * (a + last)} ÷ 2 = ${sum}`
              : `t${sub(n)} = ${a} + (${n} − 1) × ${d} = ${a} + ${(n - 1) * d} = ${last}`}
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <Stepper label="First term (a)" colour={COL.a} value={a} {...FIRST} onChange={setA} />
            <Stepper label="Difference (d)" colour={COL.d} value={d} {...DIFF} onChange={setD} />
            <Stepper label="Terms (n)" colour="#fff" value={n} {...TERMS} onChange={setN} />
          </div>
          {!forecast && (
            <button
              aria-pressed={pair}
              onClick={() => setPair(!pair)}
              className={`rounded-xl border py-2 text-sm ${pair ? "border-pink-300/60 bg-pink-400/15 text-white" : "border-white/10 text-white/60"}`}
            >
              Pair up
            </button>
          )}
        </>
      )}

      {activeMode === "double" && (
        <>
          <div className={`grid gap-2 text-center ${jarOnly ? "grid-cols-2" : "grid-cols-3"}`}>
            <Readout label={jarOnly ? "term" : "week"} value={`${weeks}`} colour="text-white" />
            <Readout label={jarOnly ? `t${sub(weeks)}` : "Jar A"} value={jarOnly ? `${dbl}` : `₹${dbl}`} colour="text-orange-200" />
            {!jarOnly && <Readout label="Jar B" value={`₹${jarB(weeks)}`} colour="text-cyan-200" />}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
            <div className="text-[11px] tracking-wider text-white/50">{jarOnly ? "the doubling sequence, and its differences" : "Jar A each week, and how much it grew"}</div>
            <div className="mt-1 break-words tabular-nums text-white">{doubleTerms(s, weeks).join(", ")}</div>
            <div className="mt-0.5 break-words text-xs tabular-nums text-orange-200">{diffs.length ? diffs.map((x) => `+${x}`).join("  ") : "one term has no differences yet"}</div>
          </div>
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-center text-sm text-white/70">
            {jarOnly
              ? `t${sub(weeks)} = ${s} × 2${sup(weeks - 1)} = ${dbl}`
              : dbl > jarB(weeks)
                ? `Week ${weeks}: Jar A has ₹${dbl}, more than Jar B's ₹${jarB(weeks)}. Doubling took the lead in week ${overtakeWeek(s)}.`
                : `Week ${weeks}: Jar B is still ahead, ₹${jarB(weeks)} to ₹${dbl}. Keep going.`}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Stepper label={jarOnly ? "Start" : "Jar A starts with ₹"} colour={COL.jarA} value={s} {...START} onChange={setS} />
            <Stepper label={jarOnly ? "Term number" : "Weeks"} colour="#fff" value={weeks} {...WEEKS} onChange={setWeeks} />
          </div>
        </>
      )}

      {forecast && (
        <>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              aria-label="Your forecast"
              inputMode="numeric"
              placeholder="Your answer"
              value={guess}
              onChange={(e) => {
                setGuess(e.target.value);
                setVerdict(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") check();
              }}
              className="min-w-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white placeholder:text-white/30"
            />
            <button className="btn-primary !py-2 text-sm" onClick={check} disabled={!guess.trim()}>
              Check forecast
            </button>
          </div>
          {verdict !== null && (
            <p className={`text-center text-sm ${verdict ? "text-lime-300" : "text-amber-200"}`} role="status">
              {verdict
                ? "Spot on!"
                : Number.isNaN(parseAnswer(guess))
                  ? "Type a whole number."
                  : forecast.ask === "sum"
                    ? "Not quite. Is the question asking for one term, or for all of them added up?"
                    : "Not quite. Build the pattern and look at the right term."}
            </p>
          )}
        </>
      )}
    </div>
  );
}

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (k: number) => `${k}`.replace(/\d/g, (c) => SUP[Number(c)]);

function Readout({ label, value, colour }: { label: string; value: string; colour: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] tracking-wider text-white/50">{label}</div>
      <div className={`font-display text-base tabular-nums sm:text-lg ${colour}`}>{value}</div>
    </div>
  );
}

/** A number picker with − and + buttons and a slider. */
function Stepper(p: { label: string; colour: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const set = (v: number) => p.onChange(Math.min(p.max, Math.max(p.min, v)));
  const btn = "h-9 w-9 shrink-0 rounded-lg border border-white/10 bg-white/[0.04] text-lg text-white/80 active:bg-white/10 disabled:opacity-30";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span style={{ color: p.colour }}>{p.label}</span>
        <span className="flex items-center gap-1">
          <button className={btn} aria-label={`${p.label} down`} disabled={p.value <= p.min} onClick={() => set(p.value - 1)}>
            −
          </button>
          <span className="w-8 text-center font-display tabular-nums text-white">{p.value}</span>
          <button className={btn} aria-label={`${p.label} up`} disabled={p.value >= p.max} onClick={() => set(p.value + 1)}>
            +
          </button>
        </span>
      </div>
      <input type="range" aria-label={p.label} className="range mt-1 w-full" min={p.min} max={p.max} step={1} value={p.value} onChange={(e) => set(Number(e.target.value))} />
    </div>
  );
}

/**
 * One bar per term: a at the bottom, then d stacked once per step after the first.
 * With pairing, a second copy runs backwards on top, so every column is a + l.
 */
function drawBuild(ctx: CanvasRenderingContext2D, w: number, h: number, a: number, d: number, n: number, pair: boolean) {
  const terms = apTerms(a, d, n);
  const l = terms[n - 1];
  const top = pair ? a + l : l;
  const L = 10;
  const T = 34;
  const B = h - 22;
  const cw = (w - 2 * L) / n;
  const bw = Math.max(4, cw * 0.7);
  const k = (B - T) / Math.max(top, 1);
  const showVals = cw >= 18;

  ctx.textAlign = "center";
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(pair ? `two copies: each column is ${a} + ${l} = ${a + l}` : `a = ${a}, d = ${d}: each bar is d more than the last`, w / 2, 18);

  for (let i = 0; i < n; i++) {
    const x = L + cw * i + (cw - bw) / 2;
    // a, the first term.
    ctx.fillStyle = COL.a + "aa";
    ctx.fillRect(x, B - a * k, bw, a * k);
    // i blocks of d.
    for (let j = 0; j < i; j++) {
      const y = B - (a + (j + 1) * d) * k;
      ctx.fillStyle = COL.d + (j % 2 ? "99" : "cc");
      ctx.fillRect(x, y, bw, d * k);
    }
    // The backwards copy on top.
    if (pair) {
      const back = terms[n - 1 - i];
      ctx.fillStyle = COL.back + "55";
      ctx.strokeStyle = COL.back;
      ctx.lineWidth = 1;
      ctx.fillRect(x, B - (terms[i] + back) * k, bw, back * k);
      ctx.strokeRect(x + 0.5, B - (terms[i] + back) * k + 0.5, bw - 1, back * k - 1);
    }
    // Value above the bar, number below.
    ctx.font = `${cw >= 26 ? 11 : 10}px system-ui, sans-serif`;
    if (showVals && !pair) {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(`${terms[i]}`, x + bw / 2, B - terms[i] * k - 4);
    }
    if (cw >= 14 || i % 2 === 0 || i === n - 1) {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText(`${i + 1}`, x + bw / 2, B + 14);
    }
  }
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.beginPath();
  ctx.moveTo(L, B);
  ctx.lineTo(w - L, B);
  ctx.stroke();

  if (pair) {
    const y = B - (a + l) * k;
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = COL.line;
    ctx.beginPath();
    ctx.moveTo(L, y);
    ctx.lineTo(w - L, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

/** Two jars, week by week: one doubles, one gets ₹50 each week. */
function drawDouble(ctx: CanvasRenderingContext2D, w: number, h: number, s: number, weeks: number, jarOnly: boolean) {
  const A = doubleTerms(s, weeks);
  const Bs = Array.from({ length: weeks }, (_, i) => jarB(i + 1));
  const top = Math.max(...A, ...(jarOnly ? [] : Bs), 1);
  const L = 10;
  const T = 40;
  const B = h - 22;
  const cw = (w - 2 * L) / weeks;
  const k = (B - T) / top;
  const over = jarOnly ? null : overtakeWeek(s);

  ctx.textAlign = "center";
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(jarOnly ? `start at ${s}, double every time` : `Jar A doubles from ₹${s}; Jar B gets ₹${JAR_STEP} a week`, w / 2, 18);
  if (!jarOnly) {
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = COL.jarA;
    ctx.fillRect(L, 28, 10, 8);
    ctx.fillText("Jar A", L + 14, 36);
    ctx.fillStyle = COL.jarB;
    ctx.fillRect(L + 60, 28, 10, 8);
    ctx.fillText("Jar B", L + 74, 36);
  }

  for (let i = 0; i < weeks; i++) {
    const x0 = L + cw * i;
    const bw = jarOnly ? cw * 0.7 : cw * 0.38;
    if (over !== null && i + 1 >= over) {
      ctx.fillStyle = "rgba(251,146,60,0.07)";
      ctx.fillRect(x0, T - 4, cw, B - T + 4);
    }
    const xa = jarOnly ? x0 + (cw - bw) / 2 : x0 + cw * 0.1;
    ctx.fillStyle = COL.jarA + "cc";
    ctx.fillRect(xa, B - A[i] * k, bw, A[i] * k);
    if (!jarOnly) {
      ctx.fillStyle = COL.jarB + "aa";
      ctx.fillRect(x0 + cw * 0.52, B - Bs[i] * k, bw, Bs[i] * k);
    }
    ctx.textAlign = "center";
    ctx.font = "10px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    if (cw >= 14 || i % 2 === 0 || i === weeks - 1) ctx.fillText(`${i + 1}`, x0 + cw / 2, B + 14);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.beginPath();
  ctx.moveTo(L, B);
  ctx.lineTo(w - L, B);
  ctx.stroke();

  // The last value at the top right, above the tallest bar. Weeks where Jar A leads are shaded.
  ctx.font = "bold 11px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillStyle = COL.jarA;
  const lastA = A[weeks - 1];
  ctx.fillText(jarOnly ? `${lastA}` : `₹${lastA}`, w - L, 36);
}
