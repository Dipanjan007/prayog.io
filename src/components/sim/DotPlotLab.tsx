"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import { DATASETS, clampValue, fmt, meetsData, sorted, summary, type DataSetId, type DataTarget, type Summary } from "@/lib/sim/data";

export type DataReading = { mode: "data"; set: DataSetId; values: number[] } | { mode: "check"; values: number[]; ok: boolean };

interface Props {
  onReading?: (r: DataReading) => void;
  /** Challenge: values to reshape until the mean and median hit the request. */
  request?: DataTarget | null;
}

const COL = { dot: "#22d3ee", sel: "#facc15", mean: "#f472b6", median: "#a3e635", mode: "#a78bfa" };
const R = 7;
const STEPS = [-5, -1, 1, 5];

export default function DotPlotLab({ onReading, request = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [set, setSet] = useState<DataSetId>(request ? request.set : "cricket");
  const [data, setData] = useState<Record<DataSetId, number[]>>(() => ({
    cricket: request?.set === "cricket" ? [...request.start] : [...DATASETS.cricket.start],
    heights: request?.set === "heights" ? [...request.start] : [...DATASETS.heights.start],
  }));
  const [sel, setSel] = useState(0);
  const [checked, setChecked] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const drag = useRef<number | null>(null);
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const ds = DATASETS[set];
  const values = data[set];
  const s = summary(values);
  const selIdx = Math.min(sel, values.length - 1);

  useEffect(() => {
    if (request) return;
    onReadingRef.current?.({ mode: "data", set, values });
  }, [request, set, values]);

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
    draw(ctx, size.w, size.h, set, values, s, selIdx);
  }, [size, set, values, s, selIdx]);

  const setValue = (i: number, v: number) => {
    const nv = clampValue(ds, v);
    if (values[i] === nv) return;
    setData((d) => ({ ...d, [set]: d[set].map((x, j) => (j === i ? nv : x)) }));
    setChecked(null);
  };

  const geom = () => layout(size.w, size.h, set);
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const g = geom();
    const pos = dotPositions(values, g);
    let best = -1;
    let bestD = 24;
    pos.forEach((p, i) => {
      const d = Math.hypot(p.x - px, p.y - py);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best < 0) return;
    drag.current = best;
    setSel(best);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (drag.current === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const g = geom();
    setValue(drag.current, g.toValue(e.clientX - rect.left));
  };
  const onUp = () => {
    drag.current = null;
  };

  const add = () => {
    if (values.length >= ds.maxN) return;
    setData((d) => ({ ...d, [set]: [...d[set], ds.addValue] }));
    setSel(values.length);
  };
  const remove = () => {
    if (values.length <= ds.minN) return;
    setData((d) => ({ ...d, [set]: d[set].filter((_, j) => j !== selIdx) }));
    setSel(Math.max(0, selIdx - 1));
  };
  const reset = () => {
    setData((d) => ({ ...d, [set]: [...DATASETS[set].start] }));
    setSel(0);
  };
  const check = () => {
    if (!request) return;
    const ok = meetsData(values, request);
    setChecked(ok);
    onReadingRef.current?.({ mode: "check", values, ok });
  };

  const ordered = sorted(values);
  const mid = values.length % 2 ? [Math.floor(values.length / 2)] : [values.length / 2 - 1, values.length / 2];

  return (
    <div className="flex flex-col gap-3 select-none">
      {!request && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["cricket", "heights"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setSet(m);
                setSel(0);
              }}
              className={`rounded-xl py-2 ${set === m ? "bg-white/10 text-white" : "text-white/50"}`}
            >
              {DATASETS[m].label}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="h-64 w-full cursor-grab touch-none rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-72"
        role="img"
        aria-label={`Dot plot of ${values.length} values in ${ds.unit}: ${values.join(", ")}. Mean ${fmt(s.mean)}, median ${fmt(s.median)}, ${s.modes.length ? `mode ${s.modes.join(" and ")}` : "no mode"}, range ${s.range}.`}
      />

      <div className="grid grid-cols-4 gap-1.5 text-center">
        <Readout label="Mean" value={fmt(s.mean)} colour="text-pink-200" />
        <Readout label="Median" value={fmt(s.median)} colour="text-lime-200" />
        <Readout label="Mode" value={s.modes.length ? s.modes.join(", ") : "none"} colour="text-violet-200" />
        <Readout label="Range" value={fmt(s.range)} colour="text-cyan-200" />
      </div>
      <p className="text-center text-xs text-white/50">
        Sorted:{" "}
        {ordered.map((v, i) => (
          <span key={i} className={mid.includes(i) ? "font-semibold text-lime-300" : ""}>
            {v}
            {i < ordered.length - 1 ? ", " : ""}
          </span>
        ))}{" "}
        · total {values.reduce((a, b) => a + b, 0)} {ds.unit}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {values.map((v, i) => (
          <button
            key={i}
            onClick={() => setSel(i)}
            aria-label={`${ds.item} ${i + 1}: ${v} ${ds.unit}`}
            className={`min-w-11 rounded-xl border px-2 py-1.5 text-sm tabular-nums ${i === selIdx ? "border-yellow-300 bg-yellow-300/15 text-white" : "border-white/10 text-white/70"}`}
          >
            {v}
          </button>
        ))}
      </div>

      <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2">
        <div className="flex justify-between text-sm">
          <span className="text-yellow-200">
            {ds.item} {selIdx + 1}
          </span>
          <span className="tabular-nums text-white">
            {values[selIdx]} {ds.unit}
          </span>
        </div>
        <input
          type="range"
          aria-label="Selected value"
          className="range mt-1 w-full"
          min={ds.min}
          max={ds.max}
          step={1}
          value={values[selIdx]}
          onChange={(e) => setValue(selIdx, Number(e.target.value))}
        />
        <div className="mt-1 grid grid-cols-4 gap-2">
          {STEPS.map((k) => (
            <button
              key={k}
              aria-label={`Selected value ${k > 0 ? "plus" : "minus"} ${Math.abs(k)}`}
              onClick={() => setValue(selIdx, values[selIdx] + k)}
              className="h-8 rounded-lg border border-white/10 text-xs text-white/70 tabular-nums"
            >
              {k > 0 ? "+" : "−"}
              {Math.abs(k)}
            </button>
          ))}
        </div>
      </label>

      {request ? (
        <>
          <button className="btn-primary !py-2 text-sm" onClick={check}>
            Check the data
          </button>
          {checked !== null && (
            <p className={`text-center text-sm ${checked ? "text-lime-300" : "text-amber-200"}`}>
              {checked
                ? "Exactly right!"
                : `Not yet. Mean ${fmt(s.mean)}${request.mean !== undefined ? ` (want ${request.mean})` : ""}, median ${fmt(s.median)}${request.median !== undefined ? ` (want ${request.median})` : ""}.`}
            </p>
          )}
        </>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <button onClick={add} disabled={values.length >= ds.maxN} className="btn-ghost !px-1 !py-2 text-xs disabled:opacity-40">
            Add {set === "cricket" ? "an innings" : "a student"}
          </button>
          <button onClick={remove} disabled={values.length <= ds.minN} className="btn-ghost !px-1 !py-2 text-xs disabled:opacity-40">
            Remove selected
          </button>
          <button onClick={reset} className="btn-ghost !px-1 !py-2 text-xs">
            Reset data
          </button>
        </div>
      )}
    </div>
  );
}

function Readout({ label, value, colour }: { label: string; value: string; colour: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] tracking-wider text-white/50">{label}</div>
      <div className={`font-display truncate text-sm tabular-nums sm:text-lg ${colour}`}>{value}</div>
    </div>
  );
}

interface Geom {
  x0: number;
  x1: number;
  axisY: number;
  min: number;
  max: number;
  toX: (v: number) => number;
  toValue: (x: number) => number;
}

function layout(w: number, h: number, set: DataSetId): Geom {
  const ds = DATASETS[set];
  const x0 = 18;
  const x1 = w - 18;
  const axisY = h - 52;
  const toX = (v: number) => x0 + ((v - ds.min) / (ds.max - ds.min)) * (x1 - x0);
  const toValue = (x: number) => ds.min + ((x - x0) / (x1 - x0)) * (ds.max - ds.min);
  return { x0, x1, axisY, min: ds.min, max: ds.max, toX, toValue };
}

/** Where each dot sits: on its value, stacked upward when it would overlap a dot already placed. */
function dotPositions(values: number[], g: Geom) {
  const order = values.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v || a.i - b.i);
  const placed: { x: number; level: number }[] = [];
  const out: { x: number; y: number }[] = new Array(values.length);
  for (const { v, i } of order) {
    const x = g.toX(v);
    let level = 0;
    while (placed.some((p) => p.level === level && Math.abs(p.x - x) < 2 * R)) level++;
    placed.push({ x, level });
    out[i] = { x, y: g.axisY - R - 3 - level * (2 * R + 2) };
  }
  return out;
}

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, set: DataSetId, values: number[], s: Summary, sel: number) {
  const ds = DATASETS[set];
  const g = layout(w, h, set);
  const clampX = (x: number, half: number) => Math.min(w - half - 4, Math.max(half + 4, x));

  // Axis with ticks.
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(g.x0, g.axisY);
  ctx.lineTo(g.x1, g.axisY);
  ctx.stroke();
  const tick = set === "cricket" ? (w < 420 ? 25 : 10) : w < 420 ? 10 : 5;
  ctx.font = "10px system-ui, sans-serif";
  ctx.textAlign = "center";
  for (let v = ds.min; v <= ds.max; v += tick) {
    const x = g.toX(v);
    const major = (v - ds.min) % (tick * (set === "cricket" && w >= 420 ? 5 : 2)) === 0 || w < 420;
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.moveTo(x, g.axisY);
    ctx.lineTo(x, g.axisY + (major ? 5 : 3));
    ctx.stroke();
    if (major) {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText(`${v}`, x, g.axisY + 17);
    }
  }
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "right";
  ctx.fillText(ds.unit, g.x1, g.axisY + 27);

  // Range bracket below the axis.
  const lo = g.toX(Math.min(...values));
  const hi = g.toX(Math.max(...values));
  const ry = g.axisY + 32;
  ctx.strokeStyle = COL.dot;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(lo, ry - 4);
  ctx.lineTo(lo, ry);
  ctx.lineTo(hi, ry);
  ctx.lineTo(hi, ry - 4);
  ctx.stroke();
  ctx.fillStyle = COL.dot;
  ctx.textAlign = "center";
  ctx.font = "11px system-ui, sans-serif";
  const rText = `range ${s.range}`;
  ctx.fillText(rText, clampX((lo + hi) / 2, ctx.measureText(rText).width / 2), ry + 13);

  // Mean and median lines, with their labels in two rows at the top.
  const lines: [number, string, string, number][] = [
    [s.median, COL.median, `median ${fmt(s.median)}`, 14],
    [s.mean, COL.mean, `mean ${fmt(s.mean)}`, 30],
  ];
  for (const [v, col, label, ly] of lines) {
    const x = g.toX(v);
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(x, ly + 4);
    ctx.lineTo(x, g.axisY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = col;
    ctx.font = "bold 12px system-ui, sans-serif";
    ctx.fillText(label, clampX(x, ctx.measureText(label).width / 2), ly);
  }
  // The mean is the balance point: a small fulcrum under the axis.
  const mx = g.toX(s.mean);
  ctx.fillStyle = COL.mean;
  ctx.beginPath();
  ctx.moveTo(mx, g.axisY + 1);
  ctx.lineTo(mx - 5, g.axisY + 8);
  ctx.lineTo(mx + 5, g.axisY + 8);
  ctx.closePath();
  ctx.fill();

  // Dots, mode values ringed, the selected one highlighted.
  const pos = dotPositions(values, g);
  values.forEach((v, i) => {
    const p = pos[i];
    ctx.fillStyle = i === sel ? COL.sel : COL.dot + "cc";
    ctx.beginPath();
    ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
    ctx.fill();
    if (s.modes.includes(v)) {
      ctx.strokeStyle = COL.mode;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, R + 2.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (v >= 100 && set === "cricket") {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px system-ui, sans-serif";
      ctx.fillText("100+", clampX(p.x, 12), p.y - R - 4);
    }
  });
  ctx.textAlign = "left";
}
