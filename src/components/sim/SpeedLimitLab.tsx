"use client";

import { useEffect, useRef, useState } from "react";
import { additionGap, contractedLength, einsteinAdd, einsteinAddSI, galileoAdd, gamma, kmhToMs } from "@/lib/sim/relativity";

export type SpeedMode = "shrink" | "add";
export type SpeedUnits = "space" | "everyday";

export interface SpeedLaunch {
  id: number;
  units: SpeedUnits;
  /** Rocket (or train) speed and probe (or ball) speed: fractions of c in space, km/h on Earth. */
  u: number;
  v: number;
  galileo: number;
  einstein: number;
}

export interface SpeedLimitReading {
  mode: SpeedMode;
  /** Shrinking rocket: rest length (m), speed (fraction of c) and measured length (m). */
  L0: number;
  beta: number;
  length: number;
  /** The last finished launch in Adding speeds mode. */
  launch: SpeedLaunch | null;
}

interface Props {
  onReading?: (r: SpeedLimitReading) => void;
  /** Challenge: Shrinking rocket only, rest length fixed, a target length drawn, and the speed set by the player. */
  mystery?: { L0: number; target: number; tryBeta: number | null } | null;
}

const ROCKET_H_M = 12;
const MAX_L0 = 260;
const LAUNCH_S = 3;
const CYAN = "#22d3ee";
const VIOLET = "#a78bfa";
const PINK = "#f472b6";
const YELLOW = "#fde047";
const LIME = "#bef264";
const FONT = "11px system-ui, sans-serif";

type Run = { id: number; start: number; units: SpeedUnits; u: number; v: number; reported: boolean };

export default function SpeedLimitLab({ onReading, mystery = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setModeState] = useState<SpeedMode>("shrink");
  const [L0Sel, setL0] = useState(100);
  const [betaSel, setBeta] = useState(0.5);
  const [units, setUnits] = useState<SpeedUnits>("space");
  const [u, setU] = useState(0.5);
  const [v, setV] = useState(0.5);
  const [trainKmh, setTrainKmh] = useState(160);
  const [ballKmh, setBallKmh] = useState(140);
  const [launch, setLaunch] = useState<SpeedLaunch | null>(null);
  const [busy, setBusy] = useState(false);
  const runRef = useRef<Run | null>(null);
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: SpeedMode = mystery ? "shrink" : mode;
  const L0 = mystery?.L0 ?? L0Sel;
  const beta = mystery ? (mystery.tryBeta ?? 0) : betaSel;
  const length = contractedLength(L0, beta);
  const pu = units === "space" ? u : trainKmh;
  const pv = units === "space" ? v : ballKmh;

  const params = useRef({ activeMode, L0, beta, target: mystery?.target ?? null, units, pu, pv });
  useEffect(() => {
    params.current = { activeMode, L0, beta, target: mystery?.target ?? null, units, pu, pv };
  });

  const setMode = (m: SpeedMode) => {
    setModeState(m);
    runRef.current = null;
    setBusy(false);
  };
  const setUnitsSafe = (x: SpeedUnits) => {
    setUnits(x);
    runRef.current = null;
    setBusy(false);
  };

  const fire = () => {
    runRef.current = { id: (runRef.current?.id ?? 0) + 1, start: performance.now(), units, u: pu, v: pv, reported: false };
    setBusy(true);
  };

  useEffect(() => {
    const c = canvasRef.current!;
    let raf = 0;
    let last = performance.now();
    let x = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const P = params.current;
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      const ctx = c.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.font = FONT;
      if (P.activeMode === "shrink") {
        x += P.beta * (w / 1.6) * dt;
        drawShrink(ctx, w, h, P.L0, P.beta, x, P.target);
        return;
      }
      const run = runRef.current;
      let t: number | null = null;
      if (run && run.units === P.units) {
        t = (now - run.start) / 1000;
        if (t >= LAUNCH_S && !run.reported) {
          run.reported = true;
          setLaunch({ id: run.id, units: run.units, u: run.u, v: run.v, ...combine(run.units, run.u, run.v) });
          setBusy(false);
        }
      }
      const live = run && t !== null ? run : null;
      drawAdd(ctx, w, h, live?.units ?? P.units, live?.u ?? P.pu, live?.v ?? P.pv, t === null ? null : Math.min(t, LAUNCH_S));
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    onReadingRef.current?.({ mode: activeMode, L0, beta, length, launch });
  }, [activeMode, L0, beta, length, launch]);

  const g = gamma(beta);
  const sum = combine(units, pu, pv);
  const lastLaunch = launch && launch.units === units ? launch : null;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!mystery && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["shrink", "add"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${activeMode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m === "shrink" ? "Shrinking rocket" : "Adding speeds"}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-72 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={
          activeMode === "shrink"
            ? `A rocket ${L0} metres long when parked flies past at ${beta.toFixed(2)} times light speed and measures ${length.toFixed(1)} metres long, with the same height`
            : units === "space"
              ? `A rocket at ${u} c fires a probe at ${v} c. Galileo's rule gives ${(u + v).toFixed(2)} c; Einstein's gives ${einsteinAdd(u, v).toFixed(3)} c, below light speed`
              : `A train at ${trainKmh} kilometres per hour and a ball bowled forward at ${ballKmh} kilometres per hour; both rules give the same speed`
        }
      />

      {activeMode === "shrink" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="γ" value={g.toFixed(3)} />
            <Stat label="Parked length" value={`${L0} m`} />
            <Stat label="Measured" value={`${length.toFixed(1)} m`} />
          </div>
          <p className="text-center text-xs text-white/50 tabular-nums">
            L = L₀ ÷ γ = {L0} ÷ {g.toFixed(3)} = {length.toFixed(1)} m · height stays {ROCKET_H_M} m
          </p>
          {!mystery && (
            <>
              <Slider label="Rocket speed" value={`${betaSel.toFixed(3)}c`} min={0} max={0.995} step={0.001} v={betaSel} onChange={setBeta} />
              <Slider label="Parked length" value={`${L0Sel} m`} min={20} max={200} step={10} v={L0Sel} onChange={setL0} />
            </>
          )}
        </>
      )}

      {activeMode === "add" && (
        <>
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
            {(["space", "everyday"] as const).map((x) => (
              <button key={x} onClick={() => setUnitsSafe(x)} className={`rounded-xl py-1.5 ${units === x ? "bg-white/10 text-white" : "text-white/50"}`}>
                {x === "space" ? "🚀 Space speeds" : "🚄 Everyday speeds"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Stat label="Galileo: u + v" value={fmt(units, sum.galileo)} warn={units === "space" && sum.galileo > 1} />
            <Stat label="Einstein" value={fmt(units, sum.einstein)} />
          </div>
          {lastLaunch && (
            <p className={`text-center text-sm ${lastLaunch.units === "space" ? "text-lime-300" : "text-white/70"}`}>
              {lastLaunch.units === "space"
                ? lastLaunch.v >= 1
                  ? `Light from the rocket still moves at exactly c, not ${lastLaunch.galileo.toFixed(2)}c.`
                  : `Galileo says ${lastLaunch.galileo.toFixed(2)}c${lastLaunch.galileo > 1 ? ", faster than light!" : "."} Nature says ${lastLaunch.einstein.toFixed(4)}c, still below c.`
                : `The two answers differ by only ${sci(additionGap(kmhToMs(lastLaunch.u), kmhToMs(lastLaunch.v)))} m/s. Galileo's rule is fine here.`}
            </p>
          )}
          {units === "space" ? (
            <>
              <Slider label="Rocket speed u" value={`${u.toFixed(2)}c`} min={0} max={0.99} step={0.01} v={u} onChange={setU} />
              <Slider label="Probe speed v (from the rocket)" value={v >= 1 ? "1c (light)" : `${v.toFixed(2)}c`} min={0} max={1} step={0.01} v={v} onChange={setV} />
            </>
          ) : (
            <>
              <Slider label="Vande Bharat train speed u" value={`${trainKmh} km/h`} min={0} max={300} step={10} v={trainKmh} onChange={setTrainKmh} />
              <Slider label="Ball speed v (from the train)" value={`${ballKmh} km/h`} min={0} max={200} step={10} v={ballKmh} onChange={setBallKmh} />
            </>
          )}
          <div className={`grid gap-2 ${units === "space" ? "grid-cols-2" : "grid-cols-1"}`}>
            {units === "space" && (
              <button className="btn-ghost !px-2 !py-2 text-sm" onClick={() => setV(1)}>
                🔦 Probe is light
              </button>
            )}
            <button className="btn-primary !px-2 !py-2 text-sm disabled:opacity-50" onClick={fire} disabled={busy}>
              {units === "space" ? "🚀 Launch the probe" : "🏏 Bowl the ball"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function combine(units: SpeedUnits, u: number, v: number) {
  if (units === "space") return { galileo: galileoAdd(u, v), einstein: einsteinAdd(u, v) };
  const e = einsteinAddSI(kmhToMs(u), kmhToMs(v)) * 3.6;
  return { galileo: galileoAdd(u, v), einstein: e };
}

function fmt(units: SpeedUnits, x: number) {
  if (units === "space") return `${x >= 1.0 && x < 1.00005 ? "1" : x.toFixed(4)}c`;
  return `${x.toFixed(2)} km/h`;
}

/** Scientific notation like 1.6 × 10⁻¹². */
function sci(x: number) {
  if (x === 0) return "0";
  const e = Math.floor(Math.log10(Math.abs(x)));
  const m = x / 10 ** e;
  const sup = String(e)
    .split("")
    .map((ch) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(ch)] ?? "⁻")
    .join("");
  return `${m.toFixed(1)} × 10${sup}`;
}

function Stat({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`min-w-0 rounded-2xl border px-1 py-2 ${warn ? "border-rose-400/50 bg-rose-400/10" : "border-white/10 bg-white/[0.03]"}`}>
      <div className={`truncate text-[10px] tracking-wider text-white/50 sm:text-[11px] ${label === "γ" ? "" : "uppercase"}`}>{label === "γ" ? "γ (gamma)" : label}</div>
      <div className="font-display text-base tabular-nums sm:text-lg">{value}</div>
    </div>
  );
}

function Slider({ label, value, min, max, step, v, onChange }: { label: string; value: string; min: number; max: number; step: number; v: number; onChange: (n: number) => void }) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex justify-between gap-2 text-sm">
        <span className="text-white/60">{label}</span>
        <span className="tabular-nums text-white">{value}</span>
      </div>
      <input type="range" className="range mt-2 w-full" min={min} max={max} step={step} value={v} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

// ---------- Drawing ----------

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = "rgba(255,255,255,0.6)", align: CanvasTextAlign = "left") {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.textAlign = "left";
}

/** A rocket pointing right, its body `len` px long and `hgt` px tall, with its tail at x. */
function rocket(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, hgt: number, fill: string, stroke: string, dashed = false) {
  const nose = Math.min(len * 0.25, hgt * 1.2);
  ctx.beginPath();
  ctx.moveTo(x, y - hgt / 2);
  ctx.lineTo(x + len - nose, y - hgt / 2);
  ctx.quadraticCurveTo(x + len, y, x + len - nose, y + hgt / 2);
  ctx.lineTo(x, y + hgt / 2);
  ctx.closePath();
  if (dashed) ctx.setLineDash([4, 4]);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.setLineDash([]);
  // Fins scale with the body length too.
  if (!dashed) {
    const fin = Math.min(len * 0.12, 14);
    ctx.fillStyle = stroke;
    ctx.beginPath();
    ctx.moveTo(x, y - hgt / 2);
    ctx.lineTo(x - fin * 0.6, y - hgt / 2 - 6);
    ctx.lineTo(x + fin, y - hgt / 2);
    ctx.moveTo(x, y + hgt / 2);
    ctx.lineTo(x - fin * 0.6, y + hgt / 2 + 6);
    ctx.lineTo(x + fin, y + hgt / 2);
    ctx.fill();
  }
}

function heightBar(ctx: CanvasRenderingContext2D, x: number, y: number, hgt: number) {
  ctx.strokeStyle = "rgba(190,242,100,0.7)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 3, y - hgt / 2);
  ctx.lineTo(x + 3, y - hgt / 2);
  ctx.moveTo(x, y - hgt / 2);
  ctx.lineTo(x, y + hgt / 2);
  ctx.moveTo(x - 3, y + hgt / 2);
  ctx.lineTo(x + 3, y + hgt / 2);
  ctx.stroke();
  label(ctx, `${ROCKET_H_M} m`, x - 5, y + 4, LIME, "right");
}

function lengthLabel(ctx: CanvasRenderingContext2D, text: string, tail: number, len: number, y: number, w: number, color: string) {
  // Beside the nose if there is room, otherwise inside the body.
  const tw = ctx.measureText(text).width;
  if (tail + len + 8 + tw < w - 4) label(ctx, text, tail + len + 8, y + 4, color);
  else label(ctx, text, tail + len / 2, y + 4, "white", "center");
}

function drawShrink(ctx: CanvasRenderingContext2D, w: number, h: number, L0: number, beta: number, x: number, target: number | null) {
  const left = 52;
  const pxm = (w - left - 14) / MAX_L0;
  const hgt = ROCKET_H_M * pxm * 2.2; // drawn taller than true scale so the rocket is easy to see
  const L = contractedLength(L0, beta);

  // Parked rocket.
  const y1 = 46;
  label(ctx, "Parked (at rest)", 8, 16);
  rocket(ctx, left, y1, L0 * pxm, hgt, "rgba(34,211,238,0.12)", CYAN);
  heightBar(ctx, left - 16, y1, hgt);
  lengthLabel(ctx, `${L0} m`, left, L0 * pxm, y1, w, CYAN);

  // Flying past a ruler on the platform. The space dust streams backwards to show the motion.
  const y2 = Math.round(h * 0.6);
  const rulerY = y2 + hgt / 2 + 14;
  const bandTop = y2 - hgt / 2 - 10;
  const bandBot = y2 + hgt / 2 + 6;
  if (beta > 0) {
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      const gap = (w + 60) / 14;
      const sx = w + 30 - ((((x * 1.4 + i * gap) % (w + 60)) + (w + 60)) % (w + 60));
      const sy = bandTop + ((i * 37) % Math.max(1, bandBot - bandTop));
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 6 + 26 * beta, sy);
      ctx.stroke();
    }
  }
  label(ctx, beta > 0 ? `Flying past you at ${beta.toFixed(3)}c` : "Flying past you (set a speed)", 8, bandTop - 8);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, rulerY);
  ctx.lineTo(left + MAX_L0 * pxm, rulerY);
  for (let m = 0; m <= MAX_L0; m += 10) {
    const tx = left + m * pxm;
    const big = m % 50 === 0;
    ctx.moveTo(tx, rulerY);
    ctx.lineTo(tx, rulerY + (big ? 8 : 4));
  }
  ctx.stroke();
  for (let m = 0; m <= MAX_L0; m += 50) label(ctx, `${m}`, left + m * pxm, rulerY + 19, "rgba(255,255,255,0.5)", "center");
  label(ctx, "m", left + MAX_L0 * pxm, rulerY - 4, "rgba(255,255,255,0.5)", "right");

  if (target !== null) {
    // The gate: the length the rocket must measure.
    rocket(ctx, left, y2, target * pxm, hgt, "rgba(244,114,182,0.06)", PINK, true);
    label(ctx, `must measure ${target} m`, Math.min(left + target * pxm + 6, w - 4), bandTop - 8, PINK, left + target * pxm + 110 > w ? "right" : "left");
  }

  const len = L * pxm;
  rocket(ctx, left, y2, len, hgt, "rgba(167,139,250,0.18)", VIOLET);
  if (beta > 0) {
    ctx.fillStyle = "#fb923c";
    ctx.beginPath();
    ctx.moveTo(left - 2, y2 - hgt / 4);
    ctx.lineTo(left - 8 - 10 * beta - Math.random() * 4, y2);
    ctx.lineTo(left - 2, y2 + hgt / 4);
    ctx.fill();
  }
  heightBar(ctx, left - 16, y2, hgt);
  lengthLabel(ctx, `${L.toFixed(1)} m`, left, len, y2, w, VIOLET);
}

function drawAdd(ctx: CanvasRenderingContext2D, w: number, h: number, units: SpeedUnits, u: number, v: number, t: number | null) {
  const left = 12;
  const right = w - 12;
  const space = units === "space";
  const sum = combine(units, u, v);
  // On screen, light (or 500 km/h on Earth) crosses the track in LAUNCH_S seconds.
  const full = space ? 1 : 500;
  const X = (speed: number) => left + Math.min(1.9, (speed / full) * ((t ?? 0) / LAUNCH_S)) * (right - left);
  const lanes = space
    ? [
        { name: `Rocket u = ${u.toFixed(2)}c`, speed: u, color: CYAN, kind: "rocket" },
        { name: "Light: c", speed: 1, color: YELLOW, kind: "light" },
        { name: `Galileo: ${sum.galileo.toFixed(2)}c`, speed: sum.galileo, color: PINK, kind: "probe" },
        { name: `Einstein: ${sum.einstein.toFixed(4)}c`, speed: sum.einstein, color: LIME, kind: "probe" },
      ]
    : [
        { name: `Train u = ${u} km/h`, speed: u, color: CYAN, kind: "rocket" },
        { name: `Galileo: ${sum.galileo.toFixed(2)} km/h`, speed: sum.galileo, color: PINK, kind: "probe" },
        { name: `Einstein: ${sum.einstein.toFixed(2)} km/h`, speed: sum.einstein, color: LIME, kind: "probe" },
      ];
  const top = 24;
  const laneH = (h - top - 30) / lanes.length;
  label(ctx, space ? "Seen from Earth" : "Seen from the platform", 8, 14);
  // Light's finish line.
  if (space) {
    ctx.strokeStyle = "rgba(253,224,71,0.25)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(right, top);
    ctx.lineTo(right, h - 30);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  lanes.forEach((lane, i) => {
    const y = top + laneH * i + laneH / 2 + 4;
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, y + 8);
    ctx.lineTo(right, y + 8);
    ctx.stroke();
    label(ctx, lane.name, left, y - laneH / 2 + 12, lane.color);
    const px = X(lane.speed);
    if (px > right + 30) {
      label(ctx, "→ off the chart!", right, y + 4, lane.color, "right");
      return;
    }
    if (lane.kind === "rocket") {
      rocket(ctx, px - 30, y, 30, 10, "rgba(34,211,238,0.2)", lane.color);
    } else if (lane.kind === "light") {
      ctx.strokeStyle = YELLOW;
      ctx.shadowColor = YELLOW;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(Math.max(left, px - 40), y);
      ctx.lineTo(px, y);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = lane.color;
      ctx.shadowColor = lane.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(px, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  });
  const foot = h - 10;
  if (t === null) label(ctx, space ? "Press Launch to fire the probe forwards from the rocket." : "Press Bowl to send the ball forwards from the train.", w / 2, foot, "rgba(255,255,255,0.5)", "center");
  else if (space && sum.galileo > 1 && t >= LAUNCH_S * 0.6) label(ctx, "Galileo's probe beats light. Real probes never do.", w / 2, foot, PINK, "center");
  else if (!space && t >= LAUNCH_S * 0.6) label(ctx, "Both answers land in the same spot.", w / 2, foot, LIME, "center");
}
