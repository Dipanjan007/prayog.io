"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import { BASE, COEF_A, COEF_B, FARE_MAX, GRAPH_LIMIT, KM, RATE, evalLinear, fare, linearText, matchesChart, num, zeroOf, type FareChart } from "@/lib/sim/linear";

export type FareMode = "fare" | "graph";

export type FareReading =
  | { mode: "fare"; rate: number; base: number; km: number; fare: number }
  | { mode: "graph"; a: number; b: number; zero: number | null }
  | { mode: "chart"; rate: number; base: number; ok: boolean };

interface Props {
  onReading?: (r: FareReading) => void;
  /** Challenge: a printed fare chart to match with the meter's rate and base fare. */
  chart?: FareChart | null;
}

const COL = { line: "#22d3ee", base: "#f472b6", point: "#facc15", zero: "#a3e635", chart: "#fb923c" };

export default function FareLab({ onReading, chart = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<FareMode>("fare");
  // Start away from the task values, so setting them is the student's move.
  const [rate, setRate] = useState(10);
  const [base, setBase] = useState(20);
  const [km, setKm] = useState(2);
  const [a, setA] = useState(1);
  const [b, setB] = useState(2);
  const [checked, setChecked] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: FareMode = chart ? "fare" : mode;
  const cost = fare(base, rate, km);
  const zero = zeroOf(a, b);

  useEffect(() => {
    if (chart) return;
    if (activeMode === "fare") onReadingRef.current?.({ mode: "fare", rate, base, km, fare: fare(base, rate, km) });
    else onReadingRef.current?.({ mode: "graph", a, b, zero: zeroOf(a, b) });
  }, [chart, activeMode, rate, base, km, a, b]);

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
    if (activeMode === "fare") drawFare(ctx, size.w, size.h, rate, base, chart ? null : km, chart);
    else drawGraph(ctx, size.w, size.h, a, b);
  }, [size, activeMode, rate, base, km, a, b, chart]);

  const setMeter = (fn: (v: number) => void) => (v: number) => {
    fn(v);
    setChecked(null);
  };

  const check = () => {
    if (!chart) return;
    const ok = matchesChart(rate, base, chart);
    setChecked(ok);
    onReadingRef.current?.({ mode: "chart", rate, base, ok });
  };

  return (
    <div className="flex flex-col gap-3 select-none">
      {!chart && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["fare", "graph"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${activeMode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m === "fare" ? "Fare" : "Graph"}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={
          activeMode === "fare"
            ? `Fare line for base fare ₹${base} and ₹${rate} per km${chart ? `, with the ${chart.name} rows marked` : `; a ${km} km ride costs ₹${cost}`}`
            : `Graph of p(x) = ${linearText(a, b)}${zero === null ? (b === 0 ? ", which is 0 everywhere" : ", a flat line that never meets the x-axis") : `, crossing the x-axis at x = ${num(zero)}`}`
        }
      />

      {activeMode === "fare" ? (
        <>
          {chart ? (
            <ChartTable chart={chart} rate={rate} base={base} />
          ) : (
            <div className="grid grid-cols-2 gap-2 text-center">
              <Readout label="p(x), x in km" value={`${linearText(rate, base)}`} colour="text-cyan-200" />
              <Readout label={`Fare for ${km} km`} value={`₹${cost}`} colour="text-yellow-200" />
            </div>
          )}
          {!chart && (
            <p className="rounded-2xl bg-white/[0.03] px-3 py-2 text-center text-xs text-white/60 tabular-nums">
              fare = base + (rate × km) = {base} + ({rate} × {km}) = {base} + {rate * km} = ₹{cost}
            </p>
          )}
          <Slider label="Rate per km" colour={COL.line} value={rate} min={RATE.min} max={RATE.max} step={RATE.step} shown={`₹${rate} per km`} onChange={setMeter(setRate)} />
          <Slider label="Base fare" colour={COL.base} value={base} min={BASE.min} max={BASE.max} step={BASE.step} shown={`₹${base}`} onChange={setMeter(setBase)} />
          {!chart && <Slider label="Ride length" colour={COL.point} value={km} min={KM.min} max={KM.max} step={KM.step} shown={`${km} km`} onChange={setKm} />}
          {chart && (
            <>
              <button className="btn-primary !py-2 text-sm" onClick={check}>
                Check the meter
              </button>
              {checked !== null && (
                <p className={`text-center text-sm ${checked ? "text-lime-300" : "text-amber-200"}`}>
                  {checked ? `Matched! The meter is ${linearText(rate, base)}: ₹${base} to start and ₹${rate} for every km.` : "Not yet: at least one row of the chart is off the line. Look at which fares are too high or too low."}
                </p>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Readout label="p(x)" value={linearText(a, b)} colour="text-cyan-200" />
            <Readout label="Zero of p(x)" value={zero === null ? (b === 0 ? "every x" : "none") : `x = ${num(zero)}`} colour="text-lime-200" />
          </div>
          <p className="rounded-2xl bg-white/[0.03] px-3 py-2 text-center text-xs text-white/60 tabular-nums">
            {a === 0
              ? b === 0
                ? "a = 0 and b = 0: p(x) = 0 for every x. This is not a linear polynomial."
                : `a = 0: p(x) = ${num(b)} for every x, never 0. This is not a linear polynomial.`
              : `${linearText(a, b)} = 0, so ${linearText(a, 0)} = ${num(-b)} and x = ${num(-b)} ÷ ${a < 0 ? `(${num(a)})` : num(a)} = ${num(zero ?? 0)}`}
          </p>
          <Slider label="a, the number times x" colour={COL.line} value={a} min={COEF_A.min} max={COEF_A.max} step={COEF_A.step} shown={num(a)} onChange={setA} />
          <Slider label="b, the number on its own" colour={COL.base} value={b} min={COEF_B.min} max={COEF_B.max} step={COEF_B.step} shown={num(b)} onChange={setB} />
        </>
      )}
    </div>
  );
}

function ChartTable({ chart, rate, base }: { chart: FareChart; rate: number; base: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] text-center text-sm tabular-nums">
      <div className="grid grid-cols-3 border-b border-white/10 py-1 text-[11px] tracking-wider text-white/50">
        <span>Ride</span>
        <span>Chart says</span>
        <span>Your meter</span>
      </div>
      {chart.points.map((p) => {
        const mine = fare(base, rate, p.km);
        return (
          <div key={p.km} className="grid grid-cols-3 py-1">
            <span className="text-white/70">{p.km} km</span>
            <span className="text-orange-200">₹{p.fare}</span>
            <span className={mine === p.fare ? "text-lime-300" : "text-white/60"}>
              ₹{mine} {mine === p.fare ? "✓" : mine < p.fare ? "↓" : "↑"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Readout({ label, value, colour }: { label: string; value: string; colour: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] tracking-wider text-white/50">{label}</div>
      <div className={`font-display text-base tabular-nums sm:text-lg ${colour}`}>{value}</div>
    </div>
  );
}

function Slider(p: { label: string; colour: string; value: number; min: number; max: number; step: number; shown: string; onChange: (v: number) => void }) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2">
      <div className="flex justify-between gap-2 text-sm">
        <span style={{ color: p.colour }}>{p.label}</span>
        <span className="tabular-nums text-white">{p.shown}</span>
      </div>
      <input
        type="range"
        aria-label={p.label}
        className="range mt-1 w-full"
        min={p.min}
        max={p.max}
        step={p.step}
        value={p.value}
        onChange={(e) => p.onChange(Number(e.target.value))}
      />
    </label>
  );
}

function drawFare(ctx: CanvasRenderingContext2D, w: number, h: number, rate: number, base: number, km: number | null, chart: FareChart | null) {
  const left = 44;
  const right = 14;
  const top = 14;
  const bottom = 30;
  const X = (k: number) => left + ((w - left - right) * k) / KM.max;
  const Y = (r: number) => h - bottom - ((h - top - bottom) * r) / FARE_MAX;

  // Grid and axes.
  ctx.font = "10px system-ui, sans-serif";
  ctx.lineWidth = 1;
  for (let k = 0; k <= KM.max; k++) {
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.beginPath();
    ctx.moveTo(X(k), Y(0));
    ctx.lineTo(X(k), Y(FARE_MAX));
    ctx.stroke();
    if (k % 2 === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.textAlign = "center";
      ctx.fillText(`${k}`, X(k), Y(0) + 13);
    }
  }
  for (let r = 0; r <= FARE_MAX; r += 50) {
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.beginPath();
    ctx.moveTo(X(0), Y(r));
    ctx.lineTo(X(KM.max), Y(r));
    ctx.stroke();
    if (r % 100 === 0 && Math.abs(Y(r) - Y(base)) > 12) {
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.textAlign = "right";
      ctx.fillText(`₹${r}`, X(0) - 5, Y(r) + 3);
    }
  }
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(X(0), Y(FARE_MAX));
  ctx.lineTo(X(0), Y(0));
  ctx.lineTo(X(KM.max), Y(0));
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "italic 11px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("km", X(KM.max), Y(0) + 25);

  // The fare line.
  ctx.strokeStyle = COL.line;
  ctx.lineWidth = 3;
  ctx.shadowColor = COL.line;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(X(0), Y(base));
  ctx.lineTo(X(KM.max), Y(fare(base, rate, KM.max)));
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Base fare where the line meets the ₹ axis, written in the margin beside the axis.
  ctx.fillStyle = COL.base;
  ctx.beginPath();
  ctx.arc(X(0), Y(base), 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "bold 11px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`₹${base}`, X(0) - 7, Y(base) + 4);

  // Caption in the top-left corner, which the line never reaches (it starts at most ₹60 and climbs to the right).
  ctx.textAlign = "left";
  ctx.font = "bold 12px system-ui, sans-serif";
  ctx.fillStyle = COL.line;
  ctx.fillText(`p(x) = ${linearText(rate, base)}`, X(0) + 8, top + 14);
  if (chart) {
    for (const p of chart.points) {
      const on = fare(base, rate, p.km) === p.fare;
      ctx.fillStyle = on ? COL.zero : COL.chart;
      ctx.fillRect(X(p.km) - 5, Y(p.fare) - 5, 10, 10);
      ctx.font = "11px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`₹${p.fare}`, X(p.km) - 8, Y(p.fare) - 8);
    }
  }

  if (km !== null) {
    const f = fare(base, rate, km);
    ctx.strokeStyle = COL.point + "aa";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(X(km), Y(0));
    ctx.lineTo(X(km), Y(f));
    ctx.lineTo(X(0), Y(f));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = COL.point;
    ctx.beginPath();
    ctx.arc(X(km), Y(f), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "bold 12px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${km} km → ₹${f}`, X(0) + 8, top + 30);
  }
  ctx.textAlign = "left";
}

function drawGraph(ctx: CanvasRenderingContext2D, w: number, h: number, a: number, b: number) {
  const L = GRAPH_LIMIT;
  const k = Math.min(w, h) / (2 * L + 2);
  const cx = w / 2;
  const cy = h / 2;
  const X = (x: number) => cx + x * k;
  const Y = (y: number) => cy - y * k;

  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = -L; i <= L; i++) {
    ctx.moveTo(X(i), Y(-L));
    ctx.lineTo(X(i), Y(L));
    ctx.moveTo(X(-L), Y(i));
    ctx.lineTo(X(L), Y(i));
  }
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(X(-L), Y(0));
  ctx.lineTo(X(L), Y(0));
  ctx.moveTo(X(0), Y(-L));
  ctx.lineTo(X(0), Y(L));
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "10px system-ui, sans-serif";
  for (let i = -L + 2; i <= L - 2; i += 2) {
    if (!i) continue;
    ctx.textAlign = "center";
    ctx.fillText(num(i), X(i), Y(0) + 12);
    ctx.textAlign = "right";
    ctx.fillText(num(i), X(0) - 4, Y(i) + 3);
  }
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "italic 12px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("x", X(L) + 4, Y(0) + 4);
  ctx.fillText("y", X(0) + 6, Y(L) + 4);

  // The line y = ax + b, clipped to the grid.
  ctx.save();
  ctx.beginPath();
  ctx.rect(X(-L), Y(L), 2 * L * k, 2 * L * k);
  ctx.clip();
  ctx.strokeStyle = COL.line;
  ctx.lineWidth = 3;
  ctx.shadowColor = COL.line;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(X(-L), Y(evalLinear(a, b, -L)));
  ctx.lineTo(X(L), Y(evalLinear(a, b, L)));
  ctx.stroke();
  ctx.restore();
  ctx.shadowBlur = 0;

  // Where it meets the y-axis (b) and the x-axis (the zero).
  ctx.font = "bold 11px system-ui, sans-serif";
  const z = zeroOf(a, b);
  ctx.fillStyle = COL.base;
  ctx.beginPath();
  ctx.arc(X(0), Y(b), 5, 0, Math.PI * 2);
  ctx.fill();
  // Write b on the side of the y-axis the line is not climbing into.
  // Write b above the dot, on the side of the y-axis where the line is lower.
  ctx.textAlign = a > 0 ? "right" : "left";
  if (z !== 0) ctx.fillText(`b = ${num(b)}`, X(0) + (a > 0 ? -8 : 8), Y(b) - 7);
  if (z !== null) {
    ctx.fillStyle = COL.zero;
    ctx.shadowColor = COL.zero;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(X(z), Y(0), 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    const label = `zero: x = ${num(z)}`;
    const tw = ctx.measureText(label).width;
    // Put it below the axis on the side away from where the line goes down.
    let lx = X(z) + (a > 0 ? 8 : -8 - tw);
    lx = Math.max(4, Math.min(w - 4 - tw, lx));
    ctx.textAlign = "left";
    ctx.fillText(label, lx, Y(0) + 22);
  }
  ctx.textAlign = "left";
}
