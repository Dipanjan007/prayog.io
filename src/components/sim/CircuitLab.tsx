"use client";

import { useEffect, useRef, useState } from "react";
import {
  AREAS_MM2,
  CELL_VOLTS,
  LENGTH,
  MATERIALS,
  MAX_AMPS,
  MAX_CELLS,
  RESISTOR_VALUES,
  batteryVolts,
  heat,
  power,
  solvePair,
  toKWh,
  wireResistance,
  type Connection,
  type MaterialId,
} from "@/lib/sim/ohm";

export type LabMode = "wire" | "pair" | "heat";

export interface CircuitReading {
  mode: LabMode;
  cells: number;
  volts: number;
  /** Total resistance of the part between the voltmeter leads (Ω). */
  r: number;
  /** Ammeter reading (A). */
  i: number;
  overload: boolean;
  wire: { material: MaterialId; length: number; area: number };
  pair: { r1: number; r2: number; how: Connection };
  heat: { t: number; p: number; h: number };
  /** Points collected on the V–I graph for the present resistance. */
  points: number;
}

interface Props {
  onReading?: (r: CircuitReading) => void;
  /** Challenge: fixes the two resistors; the student picks the joining and the cells. */
  puzzle?: { r1: number; r2: number; amps: number } | null;
}

interface Series {
  key: string;
  r: number;
  label: string;
  volts: number[];
}

const SERIES_COLOURS = ["#67e8f9", "#fbbf24", "#f472b6"];

const fmt = (x: number) => (x >= 100 ? x.toFixed(0) : x >= 0.001 ? x.toPrecision(3) : x.toExponential(2));
/** Scientific notation with superscripts, e.g. 1.35 × 10⁻⁴. */
function sci(x: number) {
  if (x === 0) return "0";
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e < 4) return fmt(x);
  const sup = String(e).replace(/-/g, "⁻").replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)]);
  return `${(x / 10 ** e).toFixed(2)} × 10${sup}`;
}
const fmtAmps = (i: number) => (i > MAX_AMPS ? `over ${MAX_AMPS} A` : `${fmt(i)} A`);

export default function CircuitLab({ onReading, puzzle = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const plotRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<LabMode>("wire");
  const [cells, setCells] = useState(puzzle ? 1 : 2);
  const [material, setMaterial] = useState<MaterialId>("nichrome");
  const [length, setLength] = useState(1);
  const [area, setArea] = useState<number>(0.1);
  const [r1Idx, setR1Idx] = useState(5);
  const [r2Idx, setR2Idx] = useState(6);
  const [how, setHow] = useState<Connection>("series");
  const [time, setTime] = useState(60);
  const [series, setSeries] = useState<Series[]>([]);
  const [lastSample, setLastSample] = useState("");
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: LabMode = puzzle ? "pair" : mode;
  const volts = batteryVolts(cells);
  const r1 = puzzle?.r1 ?? RESISTOR_VALUES[r1Idx];
  const r2 = puzzle?.r2 ?? RESISTOR_VALUES[r2Idx];
  const rWire = wireResistance(MATERIALS[material].rho, length, area);
  const pair = solvePair(volts, r1, r2, how);
  const r = activeMode === "pair" ? pair.r : rWire;
  const i = volts / r;
  const overload = i > MAX_AMPS;
  const p = power(volts, i);
  const h = heat(i, r, time);

  // Collect a V–I point whenever the voltage or the resistance changes (React's "adjust state while rendering" pattern).
  const seriesKey = activeMode === "pair" ? `pair|${r.toFixed(4)}` : `wire|${r.toFixed(6)}`;
  const sample = `${seriesKey}|${cells}`;
  const recordable = activeMode !== "heat" && !overload;
  if (recordable && sample !== lastSample) {
    setLastSample(sample);
    setSeries((prev) => {
      const found = prev.find((s) => s.key === seriesKey);
      if (found) {
        if (found.volts.includes(volts)) return prev;
        return prev.map((s) => (s === found ? { ...s, volts: [...s.volts, volts] } : s));
      }
      const label =
        activeMode === "pair" ? `${how === "series" ? "Series" : "Parallel"} ${fmt(r)} Ω` : `${MATERIALS[material].label} ${fmt(r)} Ω`;
      return [...prev, { key: seriesKey, r, label, volts: [volts] }].slice(-3);
    });
  }
  const current = series.find((s) => s.key === seriesKey);
  const points = current?.volts.length ?? 0;

  useEffect(() => {
    onReadingRef.current?.({
      mode: activeMode,
      cells,
      volts,
      r,
      i,
      overload,
      wire: { material, length, area },
      pair: { r1, r2, how },
      heat: { t: time, p, h },
      points,
    });
  }, [activeMode, cells, volts, r, i, overload, material, length, area, r1, r2, how, time, p, h, points]);

  // Everything the animation loop needs, kept in a ref so the loop never restarts.
  const scene = useRef<Scene | null>(null);
  const glowPerMetre = p / length;
  const sceneNow: Scene = {
    mode: activeMode,
    cells,
    volts,
    i,
    overload,
    wire: {
      colour: MATERIALS[material].colour,
      lengthFrac: length / LENGTH.max,
      thick: 1.5 + 5 * Math.sqrt(area / AREAS_MM2[AREAS_MM2.length - 1]),
      // Glow brightness from power per metre of wire. Exaggerated so a few watts already show.
      glow: activeMode === "pair" ? 0 : Math.min(1, Math.sqrt(glowPerMetre / 12)),
      label: `${MATERIALS[material].label} · ${length.toFixed(2)} m · ${area} mm²`,
      rText: `R = ρL/A = ${fmt(rWire)} Ω`,
    },
    pair: { r1, r2, how, i1: pair.i1, i2: pair.i2, r: pair.r },
  };
  useEffect(() => {
    scene.current = sceneNow;
  });

  useEffect(() => {
    const c = canvasRef.current!;
    let w = 0;
    let hh = 0;
    const ro = new ResizeObserver(() => {
      w = c.clientWidth;
      hh = c.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.round(w * dpr);
      c.height = Math.round(hh * dpr);
      c.getContext("2d")!.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    ro.observe(c);
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const phase = [0, 0, 0, 0];
    let last = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (w && scene.current) drawCircuit(c.getContext("2d")!, w, hh, scene.current, phase, still ? 0 : dt);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  // V–I graph.
  const [plotSize, setPlotSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const c = plotRef.current;
    if (!c) return;
    const ro = new ResizeObserver(() => setPlotSize({ w: c.clientWidth, h: c.clientHeight }));
    ro.observe(c);
    return () => ro.disconnect();
  }, [activeMode]);
  useEffect(() => {
    const c = plotRef.current;
    if (!c || !plotSize.w) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(plotSize.w * dpr);
    c.height = Math.round(plotSize.h * dpr);
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawPlot(ctx, plotSize.w, plotSize.h, series, seriesKey, overload ? null : { v: volts, i });
  }, [plotSize, series, seriesKey, volts, i, overload, activeMode]);

  const tabs: { id: LabMode; label: string }[] = [
    { id: "wire", label: "Wire bench" },
    { id: "pair", label: "Series and parallel" },
    { id: "heat", label: "Heating" },
  ];

  return (
    <div className="flex flex-col gap-3 select-none">
      {!puzzle && (
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-ink/20 p-1 text-sm">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setMode(t.id)} className={`rounded-xl px-1 py-2 leading-tight ${activeMode === t.id ? "bg-cream/10 text-cream" : "text-faint"}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-60 w-full rounded-2xl border border-line bg-well sm:h-72"
        role="img"
        aria-label={`Circuit: a ${cells}-cell battery of ${volts} V, an ammeter in series reading ${fmtAmps(i)}, and ${
          activeMode === "pair"
            ? `${r1} Ω and ${r2} Ω resistors in ${how}, total ${fmt(r)} Ω`
            : `a ${MATERIALS[material].label.toLowerCase()} wire ${length} m long with ${area} mm² cross-section, ${fmt(r)} Ω`
        }, with a voltmeter across it reading ${volts} V. Moving dots show the current.${activeMode === "heat" ? ` The wire gives ${fmt(p)} W of heat.` : ""}`}
      />

      {puzzle && (
        <div className="grid grid-cols-2 gap-2 text-center">
          <Tile label="Target current" value={`${fmt(puzzle.amps)} A`} accent />
          <Tile label="Ammeter" value={fmtAmps(i)} />
        </div>
      )}

      {activeMode === "heat" ? (
        <div className="grid grid-cols-3 gap-2 text-center">
          <Tile label="Power P = VI" value={`${fmt(p)} W`} sub={`I²R = ${fmt(i * i * r)} W`} />
          <Tile label={`Heat in ${time} s`} value={`${fmt(h)} J`} sub="H = I²Rt" />
          <Tile label="Energy" value={`${sci(toKWh(h))} kWh`} sub="1 kWh = 3.6 × 10⁶ J" />
        </div>
      ) : (
        !puzzle && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <Tile label="Voltmeter V" value={`${volts} V`} />
            <Tile label="Ammeter I" value={fmtAmps(i)} warn={overload} />
            <Tile label={activeMode === "pair" ? "Total R" : "R = V/I"} value={`${fmt(r)} Ω`} />
          </div>
        )
      )}

      {overload && (
        <p className="rounded-xl border border-brick-400/30 bg-brick-400/10 px-3 py-2 text-xs text-brick-200">
          Almost a short circuit. Copper has so little resistance that a huge current flows. In a real lab the wire gets hot and the cells run down fast.
        </p>
      )}

      <Slider
        label="Battery"
        value={`${cells} ${cells === 1 ? "cell" : "cells"} × ${CELL_VOLTS} V = ${volts} V`}
        min={1}
        max={MAX_CELLS}
        step={1}
        v={cells}
        onChange={setCells}
      />

      {activeMode === "pair" ? (
        <>
          {puzzle ? (
            <p className="text-center text-xs text-faint">
              Your resistors: R₁ = {r1} Ω and R₂ = {r2} Ω.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Slider label="R₁" value={`${r1} Ω`} min={0} max={RESISTOR_VALUES.length - 1} step={1} v={r1Idx} onChange={setR1Idx} />
              <Slider label="R₂" value={`${r2} Ω`} min={0} max={RESISTOR_VALUES.length - 1} step={1} v={r2Idx} onChange={setR2Idx} />
            </div>
          )}
          <Choice
            options={[
              { id: "series", label: "Series" },
              { id: "parallel", label: "Parallel" },
            ]}
            value={how}
            onChange={setHow}
          />
        </>
      ) : (
        <>
          <Choice options={(Object.keys(MATERIALS) as MaterialId[]).map((id) => ({ id, label: MATERIALS[id].label }))} value={material} onChange={setMaterial} />
          <Slider label="Length L" value={`${length.toFixed(2)} m`} min={LENGTH.min} max={LENGTH.max} step={LENGTH.step} v={length} onChange={setLength} />
          <div>
            <div className="mb-1 text-xs text-faint">Area of cross-section A</div>
            <Choice options={AREAS_MM2.map((a) => ({ id: String(a), label: `${a} mm²` }))} value={String(area)} onChange={(v) => setArea(Number(v))} />
          </div>
          {activeMode === "heat" && <Slider label="Time switched on t" value={`${time} s`} min={10} max={600} step={10} v={time} onChange={setTime} />}
        </>
      )}

      {activeMode !== "heat" && !puzzle && (
        <div className="rounded-2xl panel p-2">
          <div className="flex items-center justify-between px-1 pb-1 text-xs text-faint">
            <span>V–I graph: points collect as you change the cells</span>
            <button className="rounded-lg border border-line px-2 py-0.5 text-muted" onClick={() => setSeries([])}>
              Clear
            </button>
          </div>
          <canvas
            ref={plotRef}
            className="h-44 w-full rounded-xl bg-well"
            role="img"
            aria-label={`V–I graph with current on the x axis and voltage on the y axis. ${
              series.length ? series.map((s) => `${s.label}: ${s.volts.length} points on a straight line through the origin`).join(". ") : "No points yet"
            }.`}
          />
        </div>
      )}
      {activeMode === "heat" && (
        <p className="text-center text-xs text-faint">
          {MATERIALS[material].label} is {MATERIALS[material].note}. The glow is exaggerated so that even small powers show.
        </p>
      )}
    </div>
  );
}

function Tile({ label, value, sub, accent, warn }: { label: string; value: string; sub?: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className={`rounded-2xl border px-1 py-2 ${accent ? "border-saffron-300/40 bg-saffron-300/10" : "border-line bg-cream/[0.03]"}`}>
      <div className="text-[11px] uppercase tracking-wider text-faint">{label}</div>
      <div className={`font-display text-base tabular-nums sm:text-lg ${warn ? "text-brick-300" : ""}`}>{value}</div>
      {sub && <div className="text-[10px] text-faint">{sub}</div>}
    </div>
  );
}

function Slider({ label, value, min, max, step, v, onChange }: { label: string; value: string; min: number; max: number; step: number; v: number; onChange: (v: number) => void }) {
  return (
    <label className="block rounded-2xl panel px-4 py-3">
      <div className="flex justify-between gap-2 text-sm">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums text-cream">{value}</span>
      </div>
      <input type="range" className="range mt-2 w-full" min={min} max={max} step={step} value={v} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Choice<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`flex-1 rounded-xl border px-2 py-2 text-sm whitespace-nowrap ${value === o.id ? "chip-on" : "border-line text-muted"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

interface Scene {
  mode: LabMode;
  cells: number;
  volts: number;
  i: number;
  overload: boolean;
  wire: { colour: string; lengthFrac: number; thick: number; glow: number; label: string; rText: string };
  pair: { r1: number; r2: number; how: Connection; i1: number; i2: number; r: number };
}

type Pt = { x: number; y: number };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function mix(hexA: string, hexB: string, t: number) {
  const pa = [1, 3, 5].map((k) => parseInt(hexA.slice(k, k + 2), 16));
  const pb = [1, 3, 5].map((k) => parseInt(hexB.slice(k, k + 2), 16));
  return `#${pa.map((v, k) => Math.round(lerp(v, pb[k], Math.min(1, Math.max(0, t)))).toString(16).padStart(2, "0")).join("")}`;
}

function polyLength(pts: Pt[]) {
  let s = 0;
  for (let k = 1; k < pts.length; k++) s += Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y);
  return s;
}
function pointAt(pts: Pt[], s: number): Pt {
  for (let k = 1; k < pts.length; k++) {
    const d = Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y);
    if (s <= d) return { x: lerp(pts[k - 1].x, pts[k].x, s / d), y: lerp(pts[k - 1].y, pts[k].y, s / d) };
    s -= d;
  }
  return pts[pts.length - 1];
}
function line(ctx: CanvasRenderingContext2D, pts: Pt[]) {
  ctx.beginPath();
  pts.forEach((p, k) => (k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();
}

/** Dot speed in px/s, proportional to current (capped so a short circuit stays watchable). */
const dotSpeed = (amps: number) => Math.min(240, 60 * amps);
const DOT_GAP = 16;

function drawCircuit(ctx: CanvasRenderingContext2D, w: number, h: number, s: Scene, phase: number[], dt: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.font = "11px system-ui, sans-serif";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const x0 = 22;
  const x1 = w - 22;
  const y0 = 38;
  const y1 = h - 62;
  const cx = (x0 + x1) / 2;
  const W = x1 - x0;

  // Battery on the top wire: each cell is a short thick line (−) then a long thin line (+), so + is on the right.
  const cellGap = 9;
  const bw = s.cells * cellGap * 2 - cellGap;
  const bxL = x0 + W * 0.28 - bw / 2;
  const bxR = bxL + bw;
  // Ammeter on the top wire.
  const ax = x0 + W * 0.74;
  // The part on the bottom wire, between xa and xb.
  let xa: number;
  let xb: number;
  const parallel = s.mode === "pair" && s.pair.how === "parallel";
  const br = 18; // half the gap between parallel branches
  if (s.mode === "pair") {
    const half = parallel ? Math.min(90, Math.max(48, W * 0.15)) : Math.min(110, W * 0.3);
    xa = cx - half;
    xb = cx + half;
  } else {
    const span = Math.max(24, W * 0.72 * s.wire.lengthFrac);
    xa = cx - span / 2;
    xb = cx + span / 2;
  }
  const vy = y1 - (parallel ? 58 : 46);

  // Connecting wires.
  ctx.strokeStyle = "rgba(240,233,221,0.45)";
  ctx.lineWidth = 2;
  line(ctx, [{ x: bxR, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: xb, y: y1 }]);
  line(ctx, [{ x: xa, y: y1 }, { x: x0, y: y1 }, { x: x0, y: y0 }, { x: bxL, y: y0 }]);

  // Battery cells.
  for (let k = 0; k < s.cells; k++) {
    const x = bxL + k * cellGap * 2;
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 4;
    line(ctx, [{ x, y: y0 - 6 }, { x, y: y0 + 6 }]);
    ctx.lineWidth = 1.6;
    line(ctx, [{ x: x + cellGap, y: y0 - 12 }, { x: x + cellGap, y: y0 + 12 }]);
    if (k < s.cells - 1) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(240,233,221,0.45)";
      line(ctx, [{ x: x + cellGap, y: y0 }, { x: x + 2 * cellGap, y: y0 }]);
    }
  }
  ctx.fillStyle = "rgba(240,233,221,0.7)";
  ctx.textAlign = "center";
  ctx.fillText(`${s.cells} × 1.5 V = ${s.volts} V`, (bxL + bxR) / 2, y0 - 18);
  ctx.fillStyle = "#fda4af";
  ctx.fillText("+", bxR + 8, y0 + 18);
  ctx.fillStyle = "#93c5fd";
  ctx.fillText("−", bxL - 8, y0 + 18);

  // The part.
  if (s.mode === "pair") {
    const box = (x: number, y: number, label: string) => {
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(x - 28, y - 9, 56, 18);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fde68a";
      ctx.textAlign = "center";
      ctx.fillText(label, x, y + 4);
    };
    ctx.strokeStyle = "rgba(240,233,221,0.45)";
    ctx.lineWidth = 2;
    if (parallel) {
      line(ctx, [{ x: xa, y: y1 }, { x: xa, y: y1 - br }, { x: xb, y: y1 - br }, { x: xb, y: y1 }]);
      line(ctx, [{ x: xa, y: y1 }, { x: xa, y: y1 + br }, { x: xb, y: y1 + br }, { x: xb, y: y1 }]);
      box(cx, y1 - br, `R₁ ${s.pair.r1} Ω`);
      box(cx, y1 + br, `R₂ ${s.pair.r2} Ω`);
      ctx.fillStyle = "rgba(240,233,221,0.65)";
      ctx.textAlign = "left";
      if (!s.overload) {
        ctx.fillText(`I₁ ${fmt(s.pair.i1)} A`, xb + 6, y1 - br - 4);
        ctx.fillText(`I₂ ${fmt(s.pair.i2)} A`, xb + 6, y1 + br + 12);
      }
      ctx.textAlign = "center";
      ctx.fillText(`1/Rp = 1/${s.pair.r1} + 1/${s.pair.r2}, so Rp = ${fmt(s.pair.r)} Ω`, cx, h - 8);
    } else {
      line(ctx, [{ x: xa, y: y1 }, { x: xb, y: y1 }]);
      box(cx - 34, y1, `R₁ ${s.pair.r1} Ω`);
      box(cx + 34, y1, `R₂ ${s.pair.r2} Ω`);
      ctx.fillStyle = "rgba(240,233,221,0.65)";
      ctx.textAlign = "center";
      ctx.fillText(`Rs = ${s.pair.r1} + ${s.pair.r2} = ${fmt(s.pair.r)} Ω`, cx, y1 + 32);
    }
  } else {
    // Wire on a bench between two clips. Thicker line = bigger area. Glow is exaggerated for visibility.
    const g = s.wire.glow;
    const hot = g < 0.6 ? mix("#ff3d00", "#ff9a3c", g / 0.6) : mix("#ff9a3c", "#ffe9a8", (g - 0.6) / 0.4);
    ctx.strokeStyle = g > 0.05 ? mix(s.wire.colour, hot, g * 1.4) : s.wire.colour;
    ctx.lineWidth = s.wire.thick;
    if (g > 0.05) {
      ctx.shadowColor = hot;
      ctx.shadowBlur = 6 + 22 * g;
    }
    line(ctx, [{ x: xa, y: y1 }, { x: xb, y: y1 }]);
    if (g > 0.05) line(ctx, [{ x: xa, y: y1 }, { x: xb, y: y1 }]);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#475569";
    for (const x of [xa, xb]) ctx.fillRect(x - 4, y1 - 7, 8, 14);
    ctx.fillStyle = "rgba(240,233,221,0.65)";
    ctx.textAlign = "center";
    ctx.fillText(s.wire.label, cx, y1 + 26);
    ctx.fillStyle = "#a5f3fc";
    ctx.fillText(s.wire.rText, cx, y1 + 44);
  }

  // Voltmeter across the part.
  ctx.strokeStyle = "rgba(196,181,253,0.7)";
  ctx.lineWidth = 1.3;
  ctx.setLineDash([4, 3]);
  line(ctx, [{ x: xa, y: y1 }, { x: xa, y: vy }, { x: cx - 13, y: vy }]);
  line(ctx, [{ x: xb, y: y1 }, { x: xb, y: vy }, { x: cx + 13, y: vy }]);
  ctx.setLineDash([]);
  meter(ctx, cx, vy, "V", "#c4b5fd");
  ctx.fillStyle = "#ddd6fe";
  ctx.textAlign = "left";
  ctx.fillText(`${s.volts} V`, cx + 18, vy - 14);

  // Ammeter in series.
  meter(ctx, ax, y0, "A", "#67e8f9");
  ctx.fillStyle = s.overload ? "#fda4af" : "#a5f3fc";
  ctx.textAlign = "center";
  ctx.fillText(fmtAmps(s.i), ax, y0 + 30);

  // Moving dots: conventional current, out of + and round to −. Speed is proportional to current.
  const main = [{ x: bxR + 2, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: xb, y: y1 }];
  const back = [{ x: xa, y: y1 }, { x: x0, y: y1 }, { x: x0, y: y0 }, { x: bxL - 2, y: y0 }];
  const paths: { pts: Pt[]; amps: number }[] = parallel
    ? [
        { pts: main, amps: s.i },
        { pts: [{ x: xb, y: y1 }, { x: xb, y: y1 - br }, { x: xa, y: y1 - br }, { x: xa, y: y1 }], amps: s.pair.i1 },
        { pts: [{ x: xb, y: y1 }, { x: xb, y: y1 + br }, { x: xa, y: y1 + br }, { x: xa, y: y1 }], amps: s.pair.i2 },
        { pts: back, amps: s.i },
      ]
    : [{ pts: [...main, ...back], amps: s.i }];
  // Resistor boxes are drawn on top of the dots, so leave them clear.
  const boxes: Pt[] =
    s.mode !== "pair" ? [] : parallel ? [{ x: cx, y: y1 - br }, { x: cx, y: y1 + br }] : [{ x: cx - 34, y: y1 }, { x: cx + 34, y: y1 }];
  ctx.fillStyle = "#fde047";
  ctx.shadowColor = "#fde047";
  ctx.shadowBlur = 4;
  paths.forEach((path, k) => {
    phase[k] = (phase[k] + dotSpeed(path.amps) * dt) % DOT_GAP;
    const L = polyLength(path.pts);
    for (let d = phase[k]; d < L; d += DOT_GAP) {
      const p = pointAt(path.pts, d);
      // Keep dots off the meter faces.
      if (Math.hypot(p.x - ax, p.y - y0) < 13) continue;
      if (boxes.some((b) => Math.abs(p.x - b.x) < 31 && Math.abs(p.y - b.y) < 11)) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.shadowBlur = 0;

  if (s.overload) {
    ctx.fillStyle = "#fda4af";
    ctx.textAlign = "center";
    ctx.fillText("Almost a short circuit!", cx, y0 + 48);
  }
  ctx.textAlign = "left";
}

function meter(ctx: CanvasRenderingContext2D, x: number, y: number, letter: string, colour: string) {
  ctx.fillStyle = "#0f172a";
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = colour;
  ctx.font = "bold 12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(letter, x, y + 4);
  ctx.font = "11px system-ui, sans-serif";
}

/** A tidy axis maximum: 1, 2 or 5 times a power of ten. */
function niceMax(x: number) {
  const p = 10 ** Math.floor(Math.log10(x));
  for (const m of [1, 2, 5, 10]) if (m * p >= x) return m * p;
  return 10 * p;
}

function drawPlot(ctx: CanvasRenderingContext2D, w: number, h: number, series: Series[], activeKey: string, now: { v: number; i: number } | null) {
  ctx.clearRect(0, 0, w, h);
  ctx.font = "10px system-ui, sans-serif";
  const left = 34;
  const right = w - 12;
  const top = 10;
  const bottom = h - 26;
  const vMax = 10;
  let iMax = 0;
  for (const s of series) for (const v of s.volts) iMax = Math.max(iMax, v / s.r);
  if (now) iMax = Math.max(iMax, now.i);
  iMax = niceMax(Math.max(0.1, iMax * 1.05));
  const X = (i: number) => left + (i / iMax) * (right - left);
  const Y = (v: number) => bottom - (v / vMax) * (bottom - top);

  // Grid and axes.
  ctx.strokeStyle = "rgba(240,233,221,0.08)";
  ctx.lineWidth = 1;
  ctx.fillStyle = "rgba(240,233,221,0.5)";
  for (const v of [0, 3, 6, 9]) {
    line(ctx, [{ x: left, y: Y(v) }, { x: right, y: Y(v) }]);
    ctx.textAlign = "right";
    ctx.fillText(`${v}`, left - 5, Y(v) + 3);
  }
  for (const f of [0, 0.25, 0.5, 0.75, 1]) {
    line(ctx, [{ x: X(f * iMax), y: top }, { x: X(f * iMax), y: bottom }]);
    ctx.textAlign = "center";
    ctx.fillText(`${+(f * iMax).toPrecision(3)}`, X(f * iMax), bottom + 12);
  }
  ctx.textAlign = "right";
  ctx.fillText("I (A) →", right, h - 2);
  ctx.save();
  ctx.translate(10, (top + bottom) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText("V (V) →", 0, 0);
  ctx.restore();
  ctx.strokeStyle = "rgba(240,233,221,0.35)";
  line(ctx, [{ x: left, y: top }, { x: left, y: bottom }, { x: right, y: bottom }]);

  // Each resistance: points and the straight line V = IR through the origin.
  ctx.save();
  ctx.beginPath();
  ctx.rect(left, top, right - left, bottom - top);
  ctx.clip();
  series.forEach((s, k) => {
    const c = SERIES_COLOURS[k % SERIES_COLOURS.length];
    const active = s.key === activeKey;
    ctx.globalAlpha = active ? 1 : 0.45;
    if (s.volts.length >= 2) {
      ctx.strokeStyle = c;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 4]);
      line(ctx, [{ x: X(0), y: Y(0) }, { x: X(vMax / s.r), y: Y(vMax) }]);
      ctx.setLineDash([]);
    }
    ctx.fillStyle = c;
    for (const v of s.volts) {
      ctx.beginPath();
      ctx.arc(X(v / s.r), Y(v), active ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.globalAlpha = 1;
  ctx.restore();

  // Legend in the bottom right, where lines through the origin rarely go.
  ctx.font = "10px system-ui, sans-serif";
  ctx.textAlign = "right";
  series.forEach((s, k) => {
    ctx.fillStyle = SERIES_COLOURS[k % SERIES_COLOURS.length];
    ctx.globalAlpha = s.key === activeKey ? 1 : 0.6;
    ctx.fillText(`${s.label} · ${s.volts.length} ${s.volts.length === 1 ? "point" : "points"}`, right - 4, bottom - 6 - (series.length - 1 - k) * 13);
  });
  ctx.globalAlpha = 1;
  if (!series.length) {
    ctx.fillStyle = "rgba(240,233,221,0.4)";
    ctx.textAlign = "center";
    ctx.fillText("Change the number of cells to plot points", (left + right) / 2, (top + bottom) / 2);
  }
  ctx.textAlign = "left";
}
