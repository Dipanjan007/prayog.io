"use client";

import { useEffect, useRef, useState } from "react";
import {
  BODIES,
  COAL_J_PER_KG,
  EARTH,
  GPS_ORBIT_RADIUS,
  HOME_KWH_PER_YEAR,
  PROCESSES,
  RAD_TO_ARCSEC,
  SUN,
  clockLossPerDay,
  clockRate,
  coalTonnes,
  compactness,
  duration,
  energyFrom,
  fusionFraction,
  gravityClockGainPerDay,
  homesForYear,
  indianCount,
  lightBend,
  newtonBend,
  rayHeight,
  sci,
  stationSeconds,
  sunMassLossPerSecond,
  toKWh,
  type BodyId,
  type ProcessId,
} from "@/lib/sim/massenergy";
import { fitCanvas } from "./canvas";

export type MassEnergyMode = "convert" | "sun" | "space";

export interface MassEnergyReading {
  mode: MassEnergyMode;
  /** Fuel mass in kg (E = mc² tab). */
  massKg: number;
  process: ProcessId;
  /** Energy released in joules. */
  energyJ: number;
  /** How many one-second sunshine measurements have finished. */
  sunRuns: number;
  body: BodyId;
  grid: boolean;
  ray: boolean;
  /** Closest distance of the starlight from the body's centre, in body radii. */
  rayB: number;
}

interface Props {
  onReading?: (r: MassEnergyReading) => void;
  /** Challenge: E = mc² tab only, full conversion, with a target energy (J) to match. */
  target?: { energyJ: number; label: string } | null;
}

const MASS_MIN = 1e-6;
const MASS_MAX = 10;
const PRESETS: { label: string; kg: number }[] = [
  { label: "🍚 Grain of rice", kg: 0.02e-3 },
  { label: "📎 Paper clip", kg: 1e-3 },
  { label: "🏏 Cricket ball", kg: 0.16 },
  { label: "🛍️ 1 kg of sugar", kg: 1 },
];

/** Energy ladder on the canvas: log scale from 1 J to 10²⁰ J, with everyday marks. */
const LADDER = { lo: 0, hi: 20 };
const RUNGS: { label: string; J: number }[] = [
  { label: "A fast cricket ball", J: 120 },
  { label: "Charge a phone", J: 5e4 },
  { label: "A home for a year", J: HOME_KWH_PER_YEAR * 3.6e6 },
  { label: "1 GW station, 1 day", J: 8.64e13 },
  { label: "India, 1 year", J: 6.1e18 },
];

/**
 * How each body looks on the rubber sheet. These are drawing choices only, not to scale:
 * dent depth grows with how compact the body is, and the bending is hugely exaggerated
 * so it can be seen (except that the neutron star's is already huge).
 */
const LOOK: Record<BodyId, { r: number; dent: number; bend: number; color: string; glow: string }> = {
  earth: { r: 0.13, dent: 0.14, bend: 0.05, color: "#38bdf8", glow: "#0ea5e9" },
  sun: { r: 0.17, dent: 0.32, bend: 0.13, color: "#fde047", glow: "#f59e0b" },
  whiteDwarf: { r: 0.09, dent: 0.58, bend: 0.26, color: "#e0f2fe", glow: "#a5f3fc" },
  neutronStar: { r: 0.05, dent: 0.95, bend: 0.55, color: "#c4b5fd", glow: "#a78bfa" },
};

/** Fixed background stars, so they never flicker. */
const STARS = (() => {
  let s = 777;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  return Array.from({ length: 70 }, () => ({ x: rnd(), y: rnd(), a: 0.2 + rnd() * 0.5 }));
})();

export default function MassEnergyLab({ onReading, target = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modeState, setMode] = useState<MassEnergyMode>("convert");
  const [massKg, setMassKg] = useState(0.16);
  const [processState, setProcess] = useState<ProcessId>("full");
  const [sunRuns, setSunRuns] = useState(0);
  const [measuring, setMeasuring] = useState(false);
  const [body, setBody] = useState<BodyId>("sun");
  const [grid, setGrid] = useState(false);
  const [ray, setRay] = useState(false);
  const [rayB, setRayB] = useState(3);
  const measureStart = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const mode: MassEnergyMode = target ? "convert" : modeState;
  const process: ProcessId = target ? "full" : processState;
  const energyJ = energyFrom(process, massKg);

  const params = useRef({ mode, massKg, process, energyJ, target, body, grid, ray, rayB });
  useEffect(() => {
    params.current = { mode, massKg, process, energyJ, target, body, grid, ray, rayB };
  });

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const measure = () => {
    if (measuring) return;
    setMeasuring(true);
    measureStart.current = performance.now();
    timer.current = setTimeout(() => {
      setMeasuring(false);
      measureStart.current = null;
      setSunRuns((n) => n + 1);
    }, 1000);
  };

  // ---------- Animation loop ----------
  useEffect(() => {
    const c = canvasRef.current!;
    let raf = 0;
    const t0 = performance.now();
    let sunOpened = t0;
    let lastMode: MassEnergyMode | null = null;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const P = params.current;
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (!w || !h) return;
      const ctx = fitCanvas(c, w, h);
      ctx.clearRect(0, 0, w, h);
      if (P.mode === "sun" && lastMode !== "sun") sunOpened = now;
      lastMode = P.mode;
      const t = (now - t0) / 1000;
      if (P.mode === "convert") drawConvert(ctx, w, h, t, P.massKg, P.energyJ, P.target?.energyJ ?? null);
      else if (P.mode === "sun") {
        const m = measureStart.current;
        drawSun(ctx, w, h, t, (now - sunOpened) / 1000, m === null ? null : Math.min(1, (now - m) / 1000));
      } else drawSpace(ctx, w, h, t, P.body, P.grid, P.ray, P.rayB);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    onReadingRef.current?.({ mode, massKg, process, energyJ, sunRuns, body, grid, ray, rayB });
  }, [mode, massKg, process, energyJ, sunRuns, body, grid, ray, rayB]);

  const b = BODIES[body];
  const bendRad = lightBend(b.mass, rayB * b.radius);
  const strong = compactness(b.mass, b.radius) > 0.05;
  const loss = clockLossPerDay(b.mass, b.radius);
  const rate = clockRate(b.mass, b.radius);
  const ratio = target ? energyJ / target.energyJ : 0;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!target && (
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["convert", "sun", "space"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${mode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m === "convert" ? "E = mc²" : m === "sun" ? "The Sun" : "Curved space"}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={
          mode === "convert"
            ? `${formatMass(massKg)} of ${PROCESSES[process].fuel} gives ${sci(energyJ)} joules, shown on an energy ladder from 1 joule to 10 to the 20 joules`
            : mode === "sun"
              ? "The Sun, with a picture of four hydrogen nuclei fusing into one helium nucleus and a counter of the mass turned into energy"
              : `A rubber sheet analogy of space-time dented by ${b.label.toLowerCase()}${ray ? `, with starlight passing ${rayB.toFixed(1)} radii from its centre and bending` : ""}, and two clocks: one far away and one on the surface`
        }
      />

      {mode === "convert" && (
        <>
          {target && (
            <div className="rounded-2xl border border-pink-300/30 bg-pink-300/[0.06] px-4 py-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-white/60">Target: {target.label}</span>
                <span className="tabular-nums text-pink-200">{sci(target.energyJ)} J</span>
              </div>
              <div className="mt-1 text-xs text-white/60 tabular-nums">
                Your mass gives {ratio >= 0.01 && ratio < 10 ? `${Math.round(ratio * 100)}% of` : `${sci(ratio, 3)} times`} the target energy
                {Math.abs(ratio - 1) <= 0.05 ? " ✓ a match!" : ratio < 1 ? ". Add mass." : ". Too much mass."}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-3">
            <Stat label="Energy" value={`${sci(energyJ)} J`} />
            <Stat label="In kWh" value={`${indianCount(toKWh(energyJ))}`} />
            <Stat label="Homes for a year" value={indianCount(homesForYear(energyJ))} />
            <Stat label="Coal to burn" value={`${sci(coalTonnes(energyJ))} t`} />
            <Stat label="1 GW station runs" value={duration(stationSeconds(energyJ))} />
            <Stat label="Mass → energy" value={formatPercent(PROCESSES[process].fraction)} />
          </div>
          <Slider
            label={target ? "Mass to convert" : `Mass of ${process === "full" ? "anything" : process === "chemical" ? "coal" : process === "fission" ? "uranium-235" : "hydrogen"}`}
            value={formatMass(massKg)}
            min={Math.log10(MASS_MIN)}
            max={Math.log10(MASS_MAX)}
            step={0.005}
            v={Math.log10(massKg)}
            onChange={(x) => setMassKg(clampMass(10 ** x))}
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setMassKg(p.kg)}
                className={`rounded-xl border px-2 py-2 text-sm ${Math.abs(massKg - p.kg) < p.kg * 1e-6 ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {!target && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(PROCESSES) as ProcessId[]).map((id) => (
                <button
                  key={id}
                  onClick={() => setProcess(id)}
                  className={`rounded-xl border px-2 py-2 text-sm ${process === id ? "border-violet-300 bg-violet-300/15" : "border-white/10 text-white/70"}`}
                >
                  {PROCESSES[id].label}
                </button>
              ))}
            </div>
          )}
          <p className="text-center text-xs text-white/40">
            {target ? "All of the mass becomes energy: E = m × c². " : `Fuel: ${PROCESSES[process].fuel}. `}
            We assume a home uses {HOME_KWH_PER_YEAR.toLocaleString("en-IN")} kWh a year and coal gives {COAL_J_PER_KG / 1e6} MJ per kg.
          </p>
        </>
      )}

      {mode === "sun" && (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Stat label="Sun's power" value={`${sci(SUN.luminosity, 4)} W`} />
            <Stat label="Mass lost each second" value={sunRuns > 0 ? `${sci(sunMassLossPerSecond())} kg` : "?"} />
          </div>
          <button className="btn-primary !py-2 text-sm disabled:opacity-50" onClick={measure} disabled={measuring}>
            {measuring ? "Measuring…" : "⏱ Measure 1 second of sunshine"}
          </button>
          {sunRuns > 0 && (
            <p className="text-center text-sm text-lime-300 tabular-nums">
              In 1 s: {sci(SUN.luminosity, 4)} J ÷ c² = {sci(sunMassLossPerSecond())} kg, about {(sunMassLossPerSecond() / 1e9).toFixed(2)} million tonnes.
            </p>
          )}
          <p className="text-center text-xs text-white/40">
            Fusion: 4 hydrogen nuclei become 1 helium nucleus, and {(fusionFraction() * 100).toFixed(2)}% of their mass becomes energy.
          </p>
        </>
      )}

      {mode === "space" && (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Stat
              label="Starlight bends"
              value={ray ? (bendRad * RAD_TO_ARCSEC < 3600 ? `${sci(bendRad * RAD_TO_ARCSEC, 3)}″` : `${((bendRad * 180) / Math.PI).toFixed(0)}°`) : "light off"}
            />
            <Stat label="Surface clock loses" value={`${duration(loss)} a day`} />
          </div>
          {ray && (
            <p className="text-center text-xs text-white/60 tabular-nums">
              Einstein: bending = (4 × G × M) ÷ (c² × b).{" "}
              {strong
                ? "Gravity this strong bends light even more than this simple formula says."
                : `A Newton-style guess gives only half: ${sci(newtonBend(b.mass, rayB * b.radius) * RAD_TO_ARCSEC, 3)}″.`}
            </p>
          )}
          <p className="text-center text-xs text-white/60 tabular-nums">
            {body === "earth"
              ? `GPS satellites, 20,200 km up in weaker gravity: their clocks gain ${(gravityClockGainPerDay(EARTH.mass, EARTH.radius, GPS_ORBIT_RADIUS) * 1e6).toFixed(1)} μs a day.`
              : `A clock on the surface ticks at ${rate > 0.9999 ? `${sci(rate * 100, 8)}%` : `${(rate * 100).toFixed(1)}%`} of the speed of a clock far away.`}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(BODIES) as BodyId[]).map((id) => (
              <button
                key={id}
                onClick={() => setBody(id)}
                className={`rounded-xl border px-2 py-2 text-sm ${body === id ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
              >
                {BODIES[id].label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Toggle on={grid} onClick={() => setGrid(!grid)} label={grid ? "▦ Grid on" : "▦ Grid off"} />
            <Toggle on={ray} onClick={() => setRay(!ray)} label={ray ? "✦ Starlight on" : "✦ Starlight off"} />
          </div>
          <Slider label="Starlight passes the centre at" value={`${rayB.toFixed(1)} radii`} min={1} max={5} step={0.1} v={rayB} onChange={setRayB} />
          <p className="text-center text-xs text-white/40">The rubber sheet is only an analogy. Sizes, dents and bending are not to scale.</p>
        </>
      )}
    </div>
  );
}

function clampMass(m: number) {
  return Math.min(MASS_MAX, Math.max(MASS_MIN, m));
}

export function formatMass(kg: number) {
  if (kg < 1e-5) return `${Number((kg * 1e6).toPrecision(3))} mg`;
  if (kg < 1) return `${Number((kg * 1e3).toPrecision(3))} g`;
  return `${Number(kg.toPrecision(3))} kg`;
}

function formatPercent(f: number) {
  const p = f * 100;
  if (p >= 1) return `${Number(p.toPrecision(3))}%`;
  if (p >= 0.01) return `${Number(p.toPrecision(2))}%`;
  return `${sci(p, 2)}%`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] uppercase tracking-wider text-white/50">{label}</div>
      <div className="font-display text-base tabular-nums sm:text-lg">{value}</div>
    </div>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button className={`rounded-xl border px-3 py-2 text-sm ${on ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`} onClick={onClick}>
      {label}
    </button>
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

const FONT = "11px system-ui, sans-serif";

function drawConvert(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, m: number, E: number, targetJ: number | null) {
  ctx.font = FONT;
  // Lump of mass on the left: its size grows with the log of the mass.
  const lx = Math.min(w * 0.2, 80);
  const ly = h * 0.5;
  const lr = 8 + ((Math.log10(m) + 6) / 7) * 22;
  // Burst of energy around it, bigger for more energy.
  const power = Math.max(0, Math.min(1, Math.log10(Math.max(E, 1)) / LADDER.hi));
  const pulse = 0.5 + 0.5 * Math.sin(t * 3);
  const rays = 14;
  ctx.strokeStyle = `rgba(253,224,71,${0.25 + 0.35 * power})`;
  ctx.lineWidth = 2;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 + t * 0.3;
    const r1 = lr + 4;
    const r2 = lr + 6 + power * (28 + 10 * pulse);
    ctx.beginPath();
    ctx.moveTo(lx + Math.cos(a) * r1, ly + Math.sin(a) * r1);
    ctx.lineTo(lx + Math.cos(a) * r2, ly + Math.sin(a) * r2);
    ctx.stroke();
  }
  const g = ctx.createRadialGradient(lx - lr * 0.3, ly - lr * 0.3, 1, lx, ly, lr);
  g.addColorStop(0, "#f5d0fe");
  g.addColorStop(1, "#a855f7");
  ctx.fillStyle = g;
  ctx.shadowColor = "#a855f7";
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(lx, ly, lr, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(formatMass(m), lx, ly + lr + 48);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("mass m", lx, 18);

  // Energy ladder on the right.
  const top = 16;
  const bot = h - 16;
  const Y = (J: number) => bot - ((Math.log10(Math.max(J, 1)) - LADDER.lo) / (LADDER.hi - LADDER.lo)) * (bot - top);
  const ax = Math.max(lx + 70, w * 0.42);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ax, top);
  ctx.lineTo(ax, bot);
  ctx.stroke();
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  for (let e = LADDER.lo; e <= LADDER.hi; e += 5) {
    const y = Y(10 ** e);
    ctx.fillRect(ax - 5, y - 0.5, 10, 1);
    ctx.fillText(e === 0 ? "1 J" : `10${sup(e)}`, ax - 8, y + 4);
  }
  ctx.textAlign = "left";
  for (const r of RUNGS) {
    const y = Y(r.J);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(ax - 3, y - 0.5, 9, 1);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(r.label, ax + 10, y + 4);
  }

  // Arrow from the lump to the current energy.
  const ey = Y(E);
  ctx.strokeStyle = "rgba(34,211,238,0.5)";
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(lx + lr + 6, ly);
  ctx.quadraticCurveTo((lx + ax) / 2, ey, ax - 12, ey);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.textAlign = "center";
  ctx.fillText("× c²", (lx + lr + ax) / 2, Math.min(ly, ey) - 10 < top + 4 ? Math.max(ly, ey) + 16 : Math.min(ly, ey) - 10);

  if (targetJ !== null) {
    const ty = Y(targetJ);
    ctx.fillStyle = "#f9a8d4";
    ctx.beginPath();
    ctx.moveTo(ax + 4, ty);
    ctx.lineTo(ax + 13, ty - 6);
    ctx.lineTo(ax + 13, ty + 6);
    ctx.closePath();
    ctx.fill();
    ctx.textAlign = "right";
    ctx.fillText("target", w - 6, ty - 8);
  }

  // Current energy marker.
  ctx.fillStyle = "#22d3ee";
  ctx.shadowColor = "#22d3ee";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(ax, ey, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.textAlign = "right";
  ctx.font = "bold 12px system-ui, sans-serif";
  ctx.fillStyle = "#a5f3fc";
  const label = `${sci(E)} J`;
  ctx.fillText(label, ax - 12, Math.min(bot, Math.max(top + 10, ey - 8)));
  ctx.font = FONT;
}

function sup(n: number) {
  const map: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
  return String(n)
    .split("")
    .map((c) => map[c])
    .join("");
}

function drawSun(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, openFor: number, measureProg: number | null) {
  ctx.font = FONT;
  const compact = w < 480;
  const cx = compact ? w * 0.3 : w * 0.32;
  const cy = h * 0.55;
  const R = Math.min(compact ? w * 0.25 : w * 0.2, h * 0.36);
  // Glow and disc.
  const glow = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.8);
  glow.addColorStop(0, "rgba(251,191,36,0.45)");
  glow.addColorStop(1, "rgba(251,191,36,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.8, 0, Math.PI * 2);
  ctx.fill();
  const disc = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.2, R * 0.1, cx, cy, R);
  disc.addColorStop(0, "#fef9c3");
  disc.addColorStop(0.6, "#fbbf24");
  disc.addColorStop(1, "#ea580c");
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  // Shimmering granules.
  for (let i = 0; i < 26; i++) {
    const a = i * 2.39996;
    const rr = R * Math.sqrt((i + 0.5) / 26) * 0.9;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    ctx.fillStyle = `rgba(255,255,255,${0.08 + 0.08 * Math.sin(t * 2 + i)})`;
    ctx.beginPath();
    ctx.arc(x, y, R * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.textAlign = "center";
  ctx.fillText("core: fusion", cx, cy + 4);

  // Live counter of mass turned into energy since the tab opened.
  const lost = sunMassLossPerSecond() * openFor;
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("Mass turned into energy since you opened this tab:", 8, 16);
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.fillStyle = "#fde047";
  ctx.fillText(`${(lost / 1e9).toFixed(1)} million tonnes`, 8, 33);
  ctx.font = FONT;

  // Fusion picture on the right: 4 H come together, then a He and a flash.
  const fx = compact ? w * 0.78 : w * 0.72;
  const fy = h * 0.5;
  const cycle = (t % 3) / 3;
  const join = Math.min(1, cycle / 0.55);
  const spread = 30 * (1 - join);
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText(compact ? "4 H → He" : "4 hydrogen → 1 helium", fx, fy - 58);
  if (cycle < 0.55) {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      nucleon(ctx, fx + Math.cos(a) * (8 + spread), fy + Math.sin(a) * (8 + spread), "#fb7185", "H");
    }
  } else {
    const k = (cycle - 0.55) / 0.45;
    // Flash of energy: the 0.7% of mass that disappeared.
    ctx.strokeStyle = `rgba(253,224,71,${1 - k})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(fx, fy, 14 + k * 46, 0, Math.PI * 2);
    ctx.stroke();
    nucleon(ctx, fx - 7, fy - 7, "#fb7185", "");
    nucleon(ctx, fx + 7, fy + 7, "#fb7185", "");
    nucleon(ctx, fx + 7, fy - 7, "#94a3b8", "");
    nucleon(ctx, fx - 7, fy + 7, "#94a3b8", "");
    ctx.fillStyle = "#fde047";
    ctx.fillText("He + energy", fx, fy + 36);
  }
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText(`${(fusionFraction() * 100).toFixed(1)}% of the mass → energy`, Math.min(fx, w - 75), fy + 62);

  // One-second measurement ring.
  if (measureProg !== null) {
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, R + 10, -Math.PI / 2, -Math.PI / 2 + measureProg * Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#a5f3fc";
    ctx.textAlign = "center";
    ctx.fillText(`${measureProg.toFixed(2)} s`, cx, cy + R + 26 > h - 4 ? cy - R - 16 : cy + R + 26);
  }
  ctx.textAlign = "left";
}

function nucleon(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, label: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();
  if (label) {
    ctx.fillStyle = "#0a0d1c";
    ctx.textAlign = "center";
    ctx.fillText(label, x, y + 4);
  }
}

/** Sheet coordinates: u from −1.6 to 1.6 (left to right), v from −1 (far) to 1 (near). */
const U_MAX = 1.6;

function drawSpace(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, body: BodyId, grid: boolean, ray: boolean, rayB: number) {
  ctx.font = FONT;
  const look = LOOK[body];
  // Background stars.
  for (const s of STARS) {
    ctx.fillStyle = `rgba(255,255,255,${s.a})`;
    ctx.fillRect(s.x * w, s.y * h, 1.2, 1.2);
  }
  const sx = (w - 16) / (2 * U_MAX);
  const sy = h * 0.2;
  const depthPx = h * 0.34;
  const cy = h * 0.5;
  const width = look.r * 1.4;
  const edge = width / Math.sqrt(U_MAX * U_MAX + width * width);
  const dent = (u: number, v: number) => {
    const r = Math.hypot(u, v);
    return Math.max(0, look.dent * (width / Math.sqrt(r * r + width * width) - edge) / (1 - edge));
  };
  const P = (u: number, v: number) => ({ x: w / 2 + u * sx, y: cy + v * sy + dent(u, v) * depthPx });

  if (grid) {
    ctx.strokeStyle = "rgba(34,211,238,0.35)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 12; i++) {
      const v = -1 + (2 * i) / 12;
      ctx.beginPath();
      for (let j = 0; j <= 80; j++) {
        const p = P(-U_MAX + (2 * U_MAX * j) / 80, v);
        if (j === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(167,139,250,0.35)";
    for (let i = 0; i <= 20; i++) {
      const u = -U_MAX + (2 * U_MAX * i) / 20;
      ctx.beginPath();
      for (let j = 0; j <= 50; j++) {
        const p = P(u, -1 + (2 * j) / 50);
        if (j === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.textAlign = "left";
    ctx.fillText("rubber-sheet analogy", 8, h - 8);
  }

  // The body, sitting in its dent.
  const c = P(0, 0);
  const rPx = Math.max(5, look.r * sx * 0.7);
  const g = ctx.createRadialGradient(c.x - rPx * 0.3, c.y - rPx * 1.3, 1, c.x, c.y - rPx, rPx);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(1, look.color);
  ctx.fillStyle = g;
  ctx.shadowColor = look.glow;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(c.x, c.y - rPx, rPx, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.textAlign = "center";
  ctx.fillText(BODIES[body].label, c.x, c.y - rPx * 2 - 6);

  if (ray) {
    // Starlight comes from a star on the left, passing in front of the body at b.
    const b = rayB * look.r;
    const alpha = look.bend / rayB;
    const pts: { x: number; y: number }[] = [];
    for (let j = 0; j <= 120; j++) {
      const u = -U_MAX + (2 * U_MAX * j) / 120;
      const v = rayHeight(u, b, alpha);
      pts.push(P(u, v));
    }
    // Where the star seems to be: trace the bent ray straight back from the observer.
    const vEnd = rayHeight(U_MAX, b, alpha);
    const vApparent = vEnd + alpha * 2 * U_MAX;
    const real = P(-U_MAX, b);
    const seen = P(-U_MAX, vApparent);
    const end = pts[pts.length - 1];
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.setLineDash([3, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(seen.x + 6, seen.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = "#fde68a";
    ctx.shadowColor = "#fde68a";
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
    ctx.shadowBlur = 0;
    // A photon moving along the ray.
    const k = (t * 0.35) % 1;
    const ph = pts[Math.floor(k * (pts.length - 1))];
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(ph.x, ph.y, 3, 0, Math.PI * 2);
    ctx.fill();
    star(ctx, real.x + 6, real.y, "#fde68a", 1);
    star(ctx, seen.x + 6, seen.y, "rgba(253,230,138,0.45)", 0.8);
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText("seen here", seen.x + 14, seen.y + 4);
    ctx.textAlign = "right";
    ctx.fillText("you 👁", end.x - 2, end.y + 16);
  }

  // Two clocks: one far away, one on the surface.
  const rate = clockRate(BODIES[body].mass, BODIES[body].radius);
  clock(ctx, 34, 24, t, 1, "far away");
  clock(ctx, w - 36, 24, t, rate, "on surface");
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, s: number) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 2.5 * s : 6 * s;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    if (i) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    else ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
}

/** A clock face whose hand goes round once every 6 s of far-away time, times the clock rate. */
function clock(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, rate: number, label: string) {
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.fillStyle = "rgba(10,13,28,0.85)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  const a = (t * rate * Math.PI * 2) / 6 - Math.PI / 2;
  ctx.strokeStyle = "#f472b6";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(a) * 11, y + Math.sin(a) * 11);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.textAlign = "center";
  ctx.fillText(label, x, y + 27);
}
