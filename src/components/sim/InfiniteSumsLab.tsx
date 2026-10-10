"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import {
  A_MAX,
  A_MIN,
  MAX_BITES,
  N_STEPS,
  R_CHOICES,
  SERIES,
  ZENO,
  checkGuess,
  fmtUnder,
  fracLabel,
  fracValue,
  geoLimit,
  geoLimitFrac,
  geoPartial,
  geoTerm,
  harmonicPassing,
  laddooEaten,
  parseAnswer,
  settles,
  settlesAt,
  zenoCatchTime,
  zenoStage,
  type Frac,
  type SeriesId,
  type SumRound,
} from "@/lib/sim/infinite-sums";

export type SumsMode = "laddoo" | "zeno" | "grow" | "geo";

export type SumsReading =
  | { mode: "laddoo"; bites: number }
  | { mode: "zeno"; stage: number }
  | { mode: "grow"; series: SeriesId; n: number; sum: number }
  | { mode: "geo"; a: number; r: Frac; n: number; at6: boolean; grows: boolean }
  | { mode: "round"; ok: boolean };

interface Props {
  onReading?: (r: SumsReading) => void;
  /** Challenge: predict where this endless sum settles. */
  round?: SumRound | null;
}

const MODES: { id: SumsMode; label: string }[] = [
  { id: "laddoo", label: "Laddoo" },
  { id: "zeno", label: "Zeno" },
  { id: "grow", label: "Grow or settle" },
  { id: "geo", label: "Geometric" },
];

const COL = { cyan: "#22d3ee", pink: "#f472b6", lime: "#a3e635", violet: "#a78bfa", amber: "#facc15" };
const MAX_STAGE = 12;
const GEO_MAX_N = 30;

/** Up to `d` decimals, without trailing zeros. */
const num = (v: number, d = 4) => `${Number(v.toFixed(d))}`;

export default function InfiniteSumsLab({ onReading, round = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<SumsMode>("laddoo");
  const [bites, setBites] = useState(0);
  const [stage, setStage] = useState(0);
  const [series, setSeries] = useState<SeriesId>("halves");
  const [nIdx, setNIdx] = useState(0);
  const [a, setA] = useState(4);
  const [rIdx, setRIdx] = useState(1);
  const [geoN, setGeoN] = useState(5);
  const [guess, setGuess] = useState("");
  const [checked, setChecked] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const r = R_CHOICES[rIdx];
  const n = N_STEPS[nIdx];
  const growSum = SERIES[series].sum(n);

  useEffect(() => {
    if (round) return;
    if (mode === "laddoo") onReadingRef.current?.({ mode, bites });
    else if (mode === "zeno") onReadingRef.current?.({ mode, stage });
    else if (mode === "grow") onReadingRef.current?.({ mode, series, n, sum: growSum });
    else onReadingRef.current?.({ mode, a, r, n: geoN, at6: settlesAt(a, r, 6), grows: !settles(fracValue(r)) });
  }, [round, mode, bites, stage, series, n, growSum, a, r, geoN]);

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
    if (round) drawPartials(ctx, size.w, size.h, round.a, fracValue(round.r), 30, checked === true);
    else if (mode === "laddoo") drawLaddoo(ctx, size.w, size.h, bites);
    else if (mode === "zeno") drawZeno(ctx, size.w, size.h, stage);
    else if (mode === "grow") drawGrow(ctx, size.w, size.h, series, nIdx);
    else drawPartials(ctx, size.w, size.h, a, fracValue(r), geoN, true);
  }, [size, round, checked, mode, bites, stage, series, nIdx, a, r, geoN]);

  const check = () => {
    if (!round) return;
    const ok = checkGuess(parseAnswer(guess), round);
    setChecked(ok);
    onReadingRef.current?.({ mode: "round", ok });
  };

  const canvas = (
    <canvas
      ref={canvasRef}
      className="h-60 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-72"
      role="img"
      aria-label={
        round
          ? `Running totals of ${round.shown}`
          : mode === "laddoo"
            ? `A laddoo after ${bites} bites: ${bites ? `${2 ** bites - 1}/${2 ** bites}` : "none"} eaten`
            : mode === "zeno"
              ? `Zeno's race after ${stage} stages: the runner is ${num(zenoStage(stage).gap)} m behind the tortoise`
              : mode === "grow"
                ? `${SERIES[series].label} sum after ${n} terms is ${num(growSum)}`
                : `Geometric sum with first term ${a} and ratio ${fracLabel(r)}, ${geoN} terms`
      }
    />
  );

  if (round) {
    const L = geoLimitFrac(round.a, round.r);
    return (
      <div className="flex flex-col gap-3 select-none">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
          <div className="text-[11px] tracking-wider text-white/50">Where does it settle?</div>
          <div className="font-display mt-1 text-lg text-cyan-100">{round.shown}</div>
          <div className="mt-1 text-xs text-white/50">
            First term a = {round.a} · each term is r = {fracLabel(round.r)} times the one before
          </div>
        </div>
        {canvas}
        <div className="flex gap-2">
          <input
            inputMode="decimal"
            size={6}
            value={guess}
            onChange={(e) => {
              setGuess(e.target.value);
              setChecked(null);
            }}
            placeholder="Your answer"
            aria-label="Where the sum settles"
            className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white tabular-nums"
          />
          <button className="btn-primary !px-4 !py-2 text-sm" onClick={check} disabled={!guess.trim()}>
            Check
          </button>
        </div>
        {checked !== null && (
          <p className={`text-center text-sm ${checked ? "text-lime-300" : "text-amber-200"}`}>
            {checked && L
              ? `Spot on! ${round.a} ÷ (1 − ${fracLabel(round.r)}) = ${fracLabel(L)}. Watch the running total creep up to it.`
              : "Not quite. Use S = a ÷ (1 − r): work out the bracket first, then divide."}
          </p>
        )}
      </div>
    );
  }

  const zs = zenoStage(stage);

  return (
    <div className="flex flex-col gap-3 select-none">
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm sm:grid-cols-4">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)} className={`rounded-xl py-2 ${mode === m.id ? "bg-white/10 text-white" : "text-white/50"}`}>
            {m.label}
          </button>
        ))}
      </div>

      {canvas}

      {mode === "laddoo" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Bites" value={`${bites}`} colour="text-white" />
            <Readout label="Eaten" value={bites === 0 ? "0" : bites <= 10 ? `${2 ** bites - 1}/${2 ** bites}` : `1 − 1/2${sup(bites)}`} colour="text-amber-200" />
            <Readout label="Left" value={bites === 0 ? "1" : bites <= 10 ? `1/${2 ** bites}` : `1/2${sup(bites)}`} colour="text-pink-200" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-primary !py-2 text-sm" onClick={() => setBites((b) => Math.min(MAX_BITES, b + 1))} disabled={bites >= MAX_BITES}>
              Take a bite
            </button>
            <button className="btn-ghost !py-2 text-sm" onClick={() => setBites(0)}>
              New laddoo
            </button>
          </div>
          <p className="text-center text-xs text-white/40">
            {bites === 0
              ? "Each bite eats half of what is left."
              : `Eaten so far: 1 − (1/2)${sup(bites)} = ${num(laddooEaten(bites), 6)}${bites >= MAX_BITES ? ". The slices are now too thin to cut!" : ""}`}
          </p>
        </>
      )}

      {mode === "zeno" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Stage" value={`${stage}`} colour="text-white" />
            <Readout label="Time so far" value={`${num(zs.time)} s`} colour="text-cyan-200" />
            <Readout label="Gap left" value={stage === 0 ? `${ZENO.head} m` : zs.gap < 1e-4 ? "< 0.0001 m" : `${num(zs.gap)} m`} colour="text-pink-200" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-primary !py-2 text-sm" onClick={() => setStage((s) => Math.min(MAX_STAGE, s + 1))} disabled={stage >= MAX_STAGE}>
              Next stage
            </button>
            <button className="btn-ghost !py-2 text-sm" onClick={() => setStage(0)}>
              Restart race
            </button>
          </div>
          <p className="text-center text-xs text-white/40">
            Runner {ZENO.runner} m/s, tortoise {ZENO.tortoise} m/s, head start {ZENO.head} m. Each stage, the runner reaches where the tortoise was. They draw level at{" "}
            {num(zenoCatchTime(), 2)}... s.
          </p>
        </>
      )}

      {mode === "grow" && (
        <>
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
            {(["halves", "squares", "harmonic"] as const).map((id) => (
              <button key={id} onClick={() => setSeries(id)} className={`rounded-xl py-2 ${series === id ? "bg-white/10 text-white" : "text-white/50"}`}>
                {SERIES[id].label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Terms n" value={`${n}`} colour="text-white" />
            <Readout label="Sum" value={fmtUnder(growSum, SERIES[series].settle)} colour="text-lime-200" />
            <Readout label="Settles at" value={SERIES[series].settle === null ? "never" : num(SERIES[series].settle!, 3)} colour="text-violet-200" />
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <button className="btn-ghost !px-4 !py-2 text-lg" aria-label="Fewer terms" onClick={() => setNIdx((i) => Math.max(0, i - 1))} disabled={nIdx === 0}>
              −
            </button>
            <div className="text-center text-sm text-white/70">{SERIES[series].terms}</div>
            <button className="btn-ghost !px-4 !py-2 text-lg" aria-label="More terms" onClick={() => setNIdx((i) => Math.min(N_STEPS.length - 1, i + 1))} disabled={nIdx === N_STEPS.length - 1}>
              +
            </button>
          </div>
          <p className="text-center text-xs text-white/40">
            {series === "harmonic"
              ? growSum > 5
                ? `Passed 5 at term ${harmonicPassing(5)}, and it keeps climbing.`
                : "The terms shrink, but slowly. Can you push this past 5?"
              : series === "halves"
                ? "Each term is half the one before."
                : "The squares shrink fast. This settles at π² ÷ 6 (Euler, 1734)."}
          </p>
        </>
      )}

      {mode === "geo" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label={`Sum of ${geoN} terms`} value={num(geoPartial(a, fracValue(r), geoN), 3)} colour="text-lime-200" />
            <Readout label="a ÷ (1 − r)" value={settles(fracValue(r)) ? fracLabel(geoLimitFrac(a, r)!) : "grows forever"} colour="text-violet-200" />
            <Readout label="Next term" value={num(geoTerm(a, fracValue(r), geoN), 3)} colour="text-pink-200" />
          </div>
          <Slider label="First term a" colour={COL.cyan} value={a} min={A_MIN} max={A_MAX} step={1} onChange={setA} />
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <div className="text-sm" style={{ color: COL.pink }}>
              Ratio r
            </div>
            <div className="mt-1 grid grid-cols-5 gap-1">
              {R_CHOICES.map((x, i) => (
                <button
                  key={fracLabel(x)}
                  onClick={() => setRIdx(i)}
                  aria-label={`r = ${fracLabel(x)}`}
                  className={`rounded-lg border py-1.5 text-sm tabular-nums ${rIdx === i ? "border-pink-300 bg-pink-300/15" : "border-white/10 text-white/70"}`}
                >
                  {fracLabel(x)}
                </button>
              ))}
            </div>
          </div>
          <Slider label="Terms shown n" colour={COL.lime} value={geoN} min={1} max={GEO_MAX_N} step={1} onChange={setGeoN} />
          <p className="text-center text-xs text-white/40">
            {settles(fracValue(r))
              ? `S = ${a} ÷ (1 − ${fracLabel(r)}) = ${fracLabel(geoLimitFrac(a, r)!)}${settlesAt(a, r, 6) ? ". Exactly 6!" : ""}`
              : `r = ${fracLabel(r)}: the terms never shrink, so the sum keeps growing.`}
          </p>
        </>
      )}
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

function Slider(p: { label: string; colour: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2">
      <div className="flex justify-between text-sm">
        <span style={{ color: p.colour }}>{p.label}</span>
        <span className="tabular-nums text-white">{p.value}</span>
      </div>
      <input type="range" className="range mt-1 w-full" min={p.min} max={p.max} step={p.step} value={p.value} onChange={(e) => p.onChange(Number(e.target.value))} />
    </label>
  );
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, colour: string, align: CanvasTextAlign = "left", font = "12px system-ui, sans-serif") {
  ctx.font = font;
  ctx.fillStyle = colour;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.textAlign = "left";
}

/** A laddoo seen from above: each bite is a slice half the size of the last, coloured in turn. */
function drawLaddoo(ctx: CanvasRenderingContext2D, w: number, h: number, bites: number) {
  const barH = 46;
  const R = Math.min(w / 2 - 20, (h - barH - 24) / 2);
  const cx = w / 2;
  const cy = 12 + R;
  // The whole laddoo.
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  for (let i = 0; i < 40; i++) {
    const t = i * 2.4;
    const rr = R * Math.sqrt((i + 0.5) / 40) * 0.92;
    ctx.beginPath();
    ctx.arc(cx + rr * Math.cos(t), cy + rr * Math.sin(t), 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  // Eaten slices.
  const colours = [COL.cyan, COL.violet, COL.pink, COL.lime];
  let start = -Math.PI / 2;
  for (let k = 1; k <= bites; k++) {
    const share = Math.pow(0.5, k) * Math.PI * 2;
    ctx.fillStyle = "#0a0d1c";
    ctx.strokeStyle = colours[(k - 1) % colours.length];
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, start, start + share);
    ctx.closePath();
    ctx.fill();
    if (share * R > 0.6) ctx.stroke();
    // Label the big slices with their size.
    if (k <= 4 && share * R > 30) {
      const mid = start + share / 2;
      label(ctx, `1/${2 ** k}`, cx + R * 0.6 * Math.cos(mid), cy + R * 0.6 * Math.sin(mid) + 4, colours[(k - 1) % colours.length], "center", "bold 13px system-ui, sans-serif");
    }
    start += share;
  }

  // Number line from 0 to 1 showing how much is eaten.
  const x0 = 24;
  const x1 = w - 24;
  const y = h - 26;
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  const eaten = laddooEaten(bites);
  ctx.strokeStyle = COL.amber;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x0 + (x1 - x0) * eaten, y);
  ctx.stroke();
  label(ctx, "0", x0, y + 18, "rgba(255,255,255,0.6)", "center");
  label(ctx, "1 whole laddoo", x1, y + 18, "rgba(255,255,255,0.6)", "right");
  label(ctx, "eaten", x0, y - 8, COL.amber);
}

/** Zeno's race on a 0 to 130 m track: where each runner is after the stages so far. */
function drawZeno(ctx: CanvasRenderingContext2D, w: number, h: number, stage: number) {
  const maxM = 130;
  const x0 = 18;
  const x1 = w - 18;
  const X = (m: number) => x0 + ((x1 - x0) * m) / maxM;
  const s = zenoStage(stage);
  const yR = h * 0.38;
  const yT = h * 0.68;
  // Track lines and metre marks.
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  for (const y of [yR, yT]) {
    ctx.beginPath();
    ctx.moveTo(x0, y + 12);
    ctx.lineTo(x1, y + 12);
    ctx.stroke();
  }
  for (let m = 0; m <= maxM; m += 10) {
    ctx.beginPath();
    ctx.moveTo(X(m), h - 26);
    ctx.lineTo(X(m), h - 20);
    ctx.stroke();
    if (m % 50 === 0) label(ctx, `${m} m`, X(m), h - 8, "rgba(255,255,255,0.5)", m === 0 ? "left" : "center");
  }
  // Where they draw level.
  const catchM = ZENO.runner * zenoCatchTime();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = COL.lime + "aa";
  ctx.beginPath();
  ctx.moveTo(X(catchM), 22);
  ctx.lineTo(X(catchM), h - 26);
  ctx.stroke();
  ctx.setLineDash([]);
  label(ctx, `level at ${num(catchM, 1)} m`, Math.min(X(catchM), x1 - 4), 16, COL.lime, X(catchM) > x1 - 60 ? "right" : "center");
  // Stage marks: each place the runner reached.
  for (let k = 1; k <= stage; k++) {
    const p = zenoStage(k).runnerPos;
    ctx.fillStyle = COL.cyan + "88";
    ctx.fillRect(X(p) - 1, yR + 8, 2, 8);
  }
  // Runner and tortoise.
  const dot = (x: number, y: number, c: string, emoji: string) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "20px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(emoji, x, y - 8);
    ctx.textAlign = "left";
  };
  dot(X(s.runnerPos), yR + 12, COL.cyan, "🏃");
  dot(X(s.tortoisePos), yT + 12, COL.pink, "🐢");
  label(ctx, "runner", x0, yR - 22, COL.cyan);
  label(ctx, "tortoise", x0, yT - 22, COL.pink);
}

/** Running totals of a named series, plotted against the step number, with its settling line. */
function drawGrow(ctx: CanvasRenderingContext2D, w: number, h: number, series: SeriesId, nIdx: number) {
  const top = 10;
  const left = 34;
  const right = w - 12;
  const bottom = h - 30;
  const maxY = series === "harmonic" ? 10 : 2.5;
  const Y = (v: number) => bottom - ((bottom - top) * Math.min(v, maxY)) / maxY;
  const X = (i: number) => left + ((right - left) * i) / (N_STEPS.length - 1);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.stroke();
  const ticks = series === "harmonic" ? [0, 2, 4, 6, 8, 10] : [0, 0.5, 1, 1.5, 2, 2.5];
  for (const t of ticks) label(ctx, `${t}`, left - 6, Y(t) + 4, "rgba(255,255,255,0.5)", "right");
  for (const i of [0, 9, 19, N_STEPS.length - 1]) label(ctx, `${N_STEPS[i]}`, X(i), bottom + 14, "rgba(255,255,255,0.5)", i === N_STEPS.length - 1 ? "right" : "center");
  label(ctx, "terms (each step adds more)", (left + right) / 2, bottom + 27, "rgba(255,255,255,0.35)", "center", "11px system-ui, sans-serif");
  const settle = SERIES[series].settle;
  const line = (v: number, c: string, text: string) => {
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = c;
    ctx.beginPath();
    ctx.moveTo(left, Y(v));
    ctx.lineTo(right, Y(v));
    ctx.stroke();
    ctx.setLineDash([]);
    label(ctx, text, right - 2, Y(v) - 5, c, "right");
  };
  if (settle !== null) line(settle, COL.violet, `settles at ${num(settle, 3)}`);
  else line(5, COL.amber, "5");
  ctx.strokeStyle = COL.lime;
  ctx.fillStyle = COL.lime;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= nIdx; i++) {
    const y = Y(SERIES[series].sum(N_STEPS[i]));
    if (i) ctx.lineTo(X(i), y);
    else ctx.moveTo(X(i), y);
  }
  ctx.stroke();
  for (let i = 0; i <= nIdx; i++) {
    ctx.beginPath();
    ctx.arc(X(i), Y(SERIES[series].sum(N_STEPS[i])), i === nIdx ? 4 : 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Bars for each term and a staircase of running totals for a + ar + ar² + ..., with the settling line. */
function drawPartials(ctx: CanvasRenderingContext2D, w: number, h: number, a: number, r: number, n: number, showLimit: boolean) {
  const top = 14;
  const left = 34;
  const right = w - 12;
  const bottom = h - 22;
  const L = geoLimit(a, r);
  const last = geoPartial(a, r, n);
  const maxY = Math.max(L ?? 0, last, a) * 1.12;
  const Y = (v: number) => bottom - ((bottom - top) * v) / maxY;
  const bw = (right - left) / n;
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.stroke();
  label(ctx, "0", left - 6, bottom + 4, "rgba(255,255,255,0.5)", "right");
  label(ctx, num(maxY / 1.12, 1), left - 6, Y(maxY / 1.12) + 4, "rgba(255,255,255,0.5)", "right");
  label(ctx, `${n} terms`, right, bottom + 16, "rgba(255,255,255,0.5)", "right");
  // Running total: each term stacked on the last.
  let total = 0;
  for (let k = 0; k < n; k++) {
    const t = geoTerm(a, r, k);
    const x = left + k * bw + 1;
    ctx.fillStyle = COL.pink + "66";
    ctx.fillRect(x, Y(total + t), Math.max(1, bw - 2), Y(total) - Y(total + t));
    ctx.fillStyle = COL.cyan + "55";
    ctx.fillRect(x, Y(total), Math.max(1, bw - 2), bottom - Y(total));
    total += t;
  }
  if (L !== null && showLimit) {
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = COL.lime;
    ctx.beginPath();
    ctx.moveTo(left, Y(L));
    ctx.lineTo(right, Y(L));
    ctx.stroke();
    ctx.setLineDash([]);
    label(ctx, `settles at ${num(L, 3)}`, left + 6, Y(L) - 5, COL.lime);
  } else if (L === null) {
    label(ctx, "keeps growing ↑", left + 6, top + 12, COL.amber);
  }
  label(ctx, "new term", right - 4, top + 12, COL.pink, "right");
}
