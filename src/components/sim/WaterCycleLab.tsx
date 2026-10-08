"use client";

import { useEffect, useRef, useState } from "react";
import {
  LAND,
  WEATHER,
  convectionTop,
  dewPoint,
  drinkTemp,
  dryingHours,
  evaporationRate,
  infiltration,
  landscape,
  matkaTemp,
  tumblerSweats,
  wetBulb,
  type City,
  type Drink,
  type Ground,
  type Hang,
} from "@/lib/sim/water-cycle";

export type WaterMode = "land" | "kitchen";

export interface WaterReading {
  mode: WaterMode;
  /** Sun's heat, 0 to 1. */
  sun: number;
  /** m/s, from the sea towards the hills. */
  wind: number;
  ground: Ground;
  /** Evaporation from the sea, mm/day. */
  evaporation: number;
  /** Rain on the slope facing the sea, mm/h. */
  rainHill: number;
  hillCloud: boolean;
  /** Totals since the last reset, mm, in steps of 0.5 mm. */
  soaked: number;
  runoff: number;
  /** Soaked while the ground was soil, and run off while it was concrete, mm. */
  soakedSoil: number;
  runoffConcrete: number;
  /** Kitchen air. */
  T: number;
  rh: number;
  /** The kitchen weather matches a preset exactly. */
  city: City | null;
  fan: number;
  hang: Hang;
  /** Hours for the shirt to dry (Infinity if it never will). */
  dryHours: number;
  drink: Drink;
  drinkT: number;
  dew: number;
  sweating: boolean;
  matkaT: number;
}

export type WaterLabRound = "monsoon" | "recharge" | "dew";

/** Simulated hours per real second. */
const HOURS_PER_SECOND = 1;

const step = (x: number) => Math.floor(x * 2) / 2;

export default function WaterCycleLab({ onReading, round = null }: { onReading?: (r: WaterReading) => void; round?: WaterLabRound | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [mode, setMode] = useState<WaterMode>(round === "dew" ? "kitchen" : "land");

  // Sea and hills.
  const [sun, setSun] = useState(0.5);
  const [wind, setWind] = useState(0);
  const [ground, setGround] = useState<Ground>("soil");
  const [totals, setTotals] = useState({ soaked: 0, runoff: 0, soakedSoil: 0, runoffConcrete: 0 });
  const acc = useRef({ soaked: 0, runoff: 0, soakedSoil: 0, runoffConcrete: 0 });

  // Kitchen.
  const [T, setT] = useState<number>(WEATHER.mumbai.T);
  const [rhPct, setRhPct] = useState(Math.round(WEATHER.mumbai.rh * 100));
  const [fan, setFan] = useState(0);
  const [hang, setHang] = useState<Hang>("spread");
  const [drink, setDrink] = useState<Drink>(round === "dew" ? "fridge" : "matka");

  const rh = rhPct / 100;
  const L = landscape(sun, wind);
  const dryHours = dryingHours(T, rh, fan, hang);
  const dTemp = drinkTemp(drink, T, rh);
  const dew = dewPoint(T, rh);
  const sweating = tumblerSweats(dTemp, T, rh);
  const mT = matkaTemp(T, rh);
  const city = (Object.keys(WEATHER) as City[]).find((c) => WEATHER[c].T === T && Math.round(WEATHER[c].rh * 100) === rhPct) ?? null;

  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });
  const live = useRef({ mode, sun, wind, ground, T, rh, fan, hang, drink });
  useEffect(() => {
    live.current = { mode, sun, wind, ground, T, rh, fan, hang, drink };
  });

  const evapR = Math.round(L.evaporation * 10) / 10;
  const rainR = Math.round(L.rainHill * 100) / 100;
  useEffect(() => {
    onReadingRef.current?.({
      mode,
      sun,
      wind,
      ground,
      evaporation: evapR,
      rainHill: rainR,
      hillCloud: L.hillCloud,
      ...totals,
      T,
      rh,
      city,
      fan,
      hang,
      dryHours,
      drink,
      drinkT: dTemp,
      dew,
      sweating,
      matkaT: mT,
    });
  }, [mode, sun, wind, ground, evapR, rainR, L.hillCloud, totals, T, rh, city, fan, hang, dryHours, drink, dTemp, dew, sweating, mT]);

  useEffect(() => {
    const c = canvasRef.current!;
    const ro = new ResizeObserver(() => setSize({ w: c.clientWidth, h: c.clientHeight }));
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !size.w) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(size.w * dpr);
    c.height = Math.round(size.h * dpr);
    const ctx = c.getContext("2d")!;
    const { w, h } = size;
    let raf = 0;
    let last = performance.now();
    const vapour: Vapour[] = [];
    let spawn = 0;
    const shirt = { wet: 1, dryFor: 0 };
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const S = live.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (S.mode === "land") {
        const land = landscape(S.sun, S.wind);
        // Rain falls on the slope, and the ground soaks up what it can.
        if (land.rainHill > 0) {
          const split = infiltration(land.rainHill, S.ground);
          const hrs = dt * HOURS_PER_SECOND;
          const a = acc.current;
          a.soaked += split.soak * hrs;
          a.runoff += split.runoff * hrs;
          if (S.ground === "soil") a.soakedSoil += split.soak * hrs;
          else a.runoffConcrete += split.runoff * hrs;
          setTotals((t) =>
            t.soaked === step(a.soaked) && t.runoff === step(a.runoff) && t.soakedSoil === step(a.soakedSoil) && t.runoffConcrete === step(a.runoffConcrete)
              ? t
              : { soaked: step(a.soaked), runoff: step(a.runoff), soakedSoil: step(a.soakedSoil), runoffConcrete: step(a.runoffConcrete) },
          );
        }
        // Vapour puffs leave the sea at a rate set by the evaporation.
        spawn += land.evaporation * 0.9 * dt;
        while (spawn >= 1) {
          spawn -= 1;
          vapour.push({ x: Math.random() * SEA_END, z: 0, age: 0 });
        }
        stepVapour(vapour, dt, S.sun, S.wind, land.cloudBase, land.hillCloud);
        drawLand(ctx, w, h, now, S.sun, S.wind, S.ground, land, vapour, acc.current.soaked);
      } else {
        const hours = dryingHours(S.T, S.rh, S.fan, S.hang);
        // The shirt dries at 1 hour per second, then a fresh wet one is hung up.
        if (shirt.wet > 0) shirt.wet = Number.isFinite(hours) ? Math.max(0, shirt.wet - (dt * HOURS_PER_SECOND) / hours) : shirt.wet;
        else if ((shirt.dryFor += dt) > 1.5) {
          shirt.wet = 1;
          shirt.dryFor = 0;
        }
        drawKitchen(ctx, w, h, now, S.T, S.rh, S.fan, S.hang, S.drink, shirt.wet);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [size, mode]);

  const resetTotals = () => {
    acc.current = { soaked: 0, runoff: 0, soakedSoil: 0, runoffConcrete: 0 };
    setTotals({ ...acc.current });
  };
  const preset = (c: City) => {
    setT(WEATHER[c].T);
    setRhPct(Math.round(WEATHER[c].rh * 100));
  };

  const label =
    mode === "land"
      ? `Sea at ${L.seaT.toFixed(0)} °C evaporating ${L.evaporation.toFixed(1)} mm a day. Wind ${wind} m/s towards the hills. ${
          L.hillCloud ? `Clouds cover the hills and ${L.rainHill.toFixed(1)} mm of rain falls each hour on the side facing the sea. The far side stays dry.` : "No rain falls on the hills."
        } ${totals.soaked} mm has soaked into the ground and ${totals.runoff} mm has run off.`
      : `A kitchen at ${T} °C and ${rhPct}% humidity. The shirt ${Number.isFinite(dryHours) ? `dries in ${hoursLabel(dryHours)}` : "will never dry"}. Matka water ${mT.toFixed(1)} °C. The steel tumbler holds ${drink === "matka" ? "matka water" : drink === "fridge" ? "fridge water" : "ice water"} at ${dTemp.toFixed(1)} °C and is ${sweating ? "covered in drops" : "dry"}.`;

  return (
    <div className="flex flex-col gap-3 select-none">
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
        {(["land", "kitchen"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${mode === m ? "bg-white/10 text-white" : "text-white/45"}`}>
            {m === "land" ? "Sea and hills" : "Kitchen"}
          </button>
        ))}
      </div>

      <canvas ref={canvasRef} className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80" role="img" aria-label={label} />

      {mode === "land" && (
        <>
          <Stats
            items={[
              { k: "Sea", v: `${L.seaT.toFixed(0)} °C` },
              { k: "Evaporation", v: `${L.evaporation.toFixed(1)}`, u: "mm/day" },
              { k: "Cloud base", v: `${Math.round(L.cloudBase / 10) * 10}`, u: "m" },
              { k: "Rain on hills", v: `${L.rainHill.toFixed(1)}`, u: "mm/h" },
            ]}
          />
          <Slider label="Sun's heat" value={sun} min={0} max={1} step={0.05} show={`${Math.round(sun * 100)}%`} onChange={setSun} />
          <Slider label="Wind from the sea" value={wind} min={0} max={10} step={0.5} show={`${wind} m/s`} onChange={setWind} />
          <Choice
            options={[
              { id: "soil", label: "🌱 Soil" },
              { id: "concrete", label: "🏙️ Concrete" },
            ]}
            value={ground}
            onChange={setGround}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm">
            <span className="text-white/60">
              Soaked in <span className="tabular-nums text-cyan-200">{totals.soaked.toFixed(1)} mm</span> · Ran off{" "}
              <span className="tabular-nums text-amber-200">{totals.runoff.toFixed(1)} mm</span>
            </span>
            <button className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-white/60" onClick={resetTotals}>
              Reset totals
            </button>
          </div>
          <p className="text-center text-xs text-white/45">The wind blows from the Arabian Sea towards the Western Ghats, like the monsoon. 1 second here is 1 hour.</p>
        </>
      )}

      {mode === "kitchen" && (
        <>
          <Stats
            items={[
              { k: "Shirt dries in", v: Number.isFinite(dryHours) ? hoursLabel(dryHours) : "never" },
              { k: "Matka water", v: `${mT.toFixed(1)} °C` },
              { k: "Tumbler", v: sweating ? "sweating" : "dry" },
              { k: "Dew point", v: `${dew.toFixed(1)} °C` },
            ]}
          />
          <Choice
            options={(Object.keys(WEATHER) as City[]).map((c) => ({ id: c, label: WEATHER[c].label }))}
            value={city ?? ("" as City)}
            onChange={preset}
          />
          <Slider label="Air temperature" value={T} min={10} max={45} step={1} show={`${T} °C`} onChange={setT} />
          <Slider label="Humidity" value={rhPct} min={10} max={100} step={1} show={`${rhPct}%`} onChange={setRhPct} />
          <Slider label="Fan" value={fan} min={0} max={5} step={0.5} show={fan ? `${fan} m/s` : "off"} onChange={setFan} />
          <Choice
            options={[
              { id: "spread", label: "Shirt spread out" },
              { id: "folded", label: "Shirt folded" },
            ]}
            value={hang}
            onChange={setHang}
          />
          <Choice
            options={[
              { id: "matka", label: "🏺 Matka water" },
              { id: "fridge", label: "Fridge water" },
              { id: "ice", label: "🧊 Ice water" },
            ]}
            value={drink}
            onChange={setDrink}
          />
          <p className="text-center text-xs text-white/45">
            The shirt hangs in the shade, and 1 second here is 1 hour. A wet cloth cools to {wetBulb(T, rh).toFixed(1)} °C (the wet-bulb temperature) as it dries.
          </p>
        </>
      )}
    </div>
  );
}

function hoursLabel(hrs: number) {
  if (hrs >= 48) return `${Math.round(hrs / 24)} days`;
  const hh = Math.floor(hrs);
  const mm = Math.round((hrs - hh) * 60);
  return hh ? `${hh} h ${String(mm === 60 ? 59 : mm).padStart(2, "0")} min` : `${mm} min`;
}

function Stats({ items }: { items: { k: string; v: string; u?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
      {items.map((s) => (
        <div key={s.k} className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
          <div className="text-[11px] uppercase tracking-wider text-white/45">{s.k}</div>
          <div className="font-display text-lg tabular-nums">
            {s.v}
            {s.u && <span className="ml-1 text-xs text-white/50">{s.u}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function Slider({ label, value, min, max, step, show, onChange }: { label: string; value: number; min: number; max: number; step: number; show: string; onChange: (v: number) => void }) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex justify-between text-sm">
        <span className="text-white/60">{label}</span>
        <span className="tabular-nums text-white">{show}</span>
      </div>
      <input type="range" className="range mt-2 w-full" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} />
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
          className={`flex-1 rounded-xl border px-3 py-2 text-sm whitespace-nowrap ${value === o.id ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/60"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The landscape. x runs from 0 (open sea) to 1 (the plateau), heights are in metres.

const SEA_END = 0.3;
const PLAIN_END = 0.45;
const PEAK = 0.64;
const LEE_END = 0.76;
const PLAIN_H = 30;

/** Ground height (m) at x. */
function terrain(x: number) {
  if (x < SEA_END) return 0;
  if (x < PLAIN_END) return PLAIN_H;
  if (x < PEAK) return PLAIN_H + ((x - PLAIN_END) / (PEAK - PLAIN_END)) * (LAND.hillTop - PLAIN_H);
  if (x < LEE_END) return LAND.hillTop - ((x - PEAK) / (LEE_END - PEAK)) * (LAND.hillTop - LAND.plateau);
  return LAND.plateau;
}

interface Vapour {
  x: number;
  z: number;
  age: number;
}

/** Move vapour puffs: they rise in sun-warmed air, drift with the wind and are pushed up the hills. */
function stepVapour(v: Vapour[], dt: number, sun: number, wind: number, base: number, hillCloud: boolean) {
  const top = convectionTop(sun);
  for (let i = v.length - 1; i >= 0; i--) {
    const p = v[i];
    p.age += dt;
    p.x += wind * 0.012 * dt;
    if (p.z < top) p.z += (180 + 420 * sun) * dt;
    const ground = terrain(p.x);
    if (p.x > SEA_END && p.x < PEAK) p.z = Math.max(p.z, ground + 120);
    if (p.x >= PEAK) p.z = Math.max(ground + 120, p.z - 400 * dt);
    // A puff that reaches the cloud base has condensed into the cloud.
    const intoCloud = p.z >= base && (p.x < SEA_END ? top > base : hillCloud && p.x < PEAK);
    if (intoCloud || p.age > 7 || p.x > 1) v.splice(i, 1);
  }
  if (v.length > 400) v.splice(0, v.length - 400);
}

/** A cheap repeatable random number in [0, 1) for drawing rain and drops. */
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, colour: string, align: CanvasTextAlign = "left", size = 11) {
  ctx.font = `${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.fillStyle = colour;
  ctx.fillText(s, x, y);
}

function puff(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x - r * 0.9, y, r * 0.7, 0, Math.PI * 2);
  ctx.arc(x, y - r * 0.35, r, 0, Math.PI * 2);
  ctx.arc(x + r * 0.95, y, r * 0.75, 0, Math.PI * 2);
  ctx.fill();
}

function drawLand(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  now: number,
  sun: number,
  wind: number,
  ground: Ground,
  land: ReturnType<typeof landscape>,
  vapour: Vapour[],
  soaked: number,
) {
  const seaY = h * 0.6;
  const topY = h * 0.05;
  const perM = (seaY - topY) / 3000;
  const X = (x: number) => x * w;
  const Y = (z: number) => seaY - z * perM;
  const t = now / 1000;

  // Sky, brighter with a stronger Sun.
  const sky = ctx.createLinearGradient(0, 0, 0, seaY);
  sky.addColorStop(0, `rgba(37,99,235,${0.18 + 0.3 * sun})`);
  sky.addColorStop(1, `rgba(125,211,252,${0.08 + 0.2 * sun})`);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, seaY);

  // The Sun.
  const sx = w * 0.07 + 12;
  const sy = h * 0.11;
  const sr = 7 + 6 * sun;
  const glow = ctx.createRadialGradient(sx, sy, 1, sx, sy, sr * 3.2);
  glow.addColorStop(0, `rgba(253,224,71,${0.25 + 0.5 * sun})`);
  glow.addColorStop(1, "rgba(253,224,71,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(sx - sr * 3.2, sy - sr * 3.2, sr * 6.4, sr * 6.4);
  ctx.fillStyle = "#fde047";
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  ctx.fill();

  // Ground cross-section: soil (or concrete on the near side), with groundwater at the bottom.
  const surface = (x: number) => Y(terrain(x));
  ctx.beginPath();
  ctx.moveTo(X(SEA_END), seaY);
  for (let i = 0; i <= 80; i++) {
    const x = SEA_END + ((1 - SEA_END) * i) / 80;
    ctx.lineTo(X(x), surface(x));
  }
  ctx.lineTo(w, h);
  ctx.lineTo(X(SEA_END) - 10, h);
  ctx.closePath();
  ctx.fillStyle = "#3b2a1a";
  ctx.fill();
  // Groundwater rises as rain soaks in (drawn much deeper than real).
  const gw = Math.min(h * 0.22, 6 + soaked * 0.5);
  const gwg = ctx.createLinearGradient(0, h - gw, 0, h);
  gwg.addColorStop(0, "rgba(56,189,248,0.55)");
  gwg.addColorStop(1, "rgba(30,64,175,0.75)");
  ctx.fillStyle = gwg;
  ctx.fillRect(X(SEA_END) - 4, h - gw, w - X(SEA_END) + 4, gw);
  text(ctx, `groundwater +${soaked.toFixed(0)} mm`, w - 6, h - 5, "rgba(186,230,253,0.95)", "right", 10);

  // Surface: green hills, concrete on the plain and lower slope if chosen.
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#4d7c0f";
  ctx.beginPath();
  for (let i = 0; i <= 80; i++) {
    const x = SEA_END + ((1 - SEA_END) * i) / 80;
    if (i === 0) ctx.moveTo(X(x), surface(x));
    else ctx.lineTo(X(x), surface(x));
  }
  ctx.stroke();
  const wetEnd = PEAK;
  if (ground === "concrete") {
    ctx.strokeStyle = "#9ca3af";
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const x = SEA_END + ((wetEnd - SEA_END) * i) / 40;
      if (i === 0) ctx.moveTo(X(x), surface(x));
      else ctx.lineTo(X(x), surface(x));
    }
    ctx.stroke();
    // A few buildings on the plain.
    ctx.fillStyle = "rgba(148,163,184,0.85)";
    for (let i = 0; i < 4; i++) {
      const bx = X(SEA_END + 0.02 + i * 0.03);
      const bh = 8 + hash(i + 3) * 14;
      ctx.fillRect(bx, Y(PLAIN_H) - bh, Math.max(5, w * 0.018), bh);
    }
  } else {
    // A few trees.
    ctx.fillStyle = "#65a30d";
    for (let i = 0; i < 7; i++) {
      const x = SEA_END + 0.03 + i * 0.045;
      if (x > PEAK - 0.01) continue;
      ctx.beginPath();
      ctx.arc(X(x), surface(x) - 5, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Sea with gentle waves.
  ctx.fillStyle = "#1e3a8a";
  ctx.fillRect(0, seaY, X(SEA_END) + 2, h - seaY);
  ctx.strokeStyle = "rgba(147,197,253,0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= X(SEA_END); x += 3) {
    const y = seaY + 1.5 * Math.sin(x / 9 + t * 2);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Vapour puffs.
  for (const p of vapour) {
    const a = Math.min(1, p.age * 2) * Math.max(0, 1 - p.age / 7);
    ctx.fillStyle = `rgba(226,232,240,${0.45 * a})`;
    ctx.beginPath();
    ctx.arc(X(p.x) + Math.sin(p.age * 3 + p.x * 50) * 2, Y(p.z), 1.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cloud base line.
  const baseY = Y(land.cloudBase);
  ctx.setLineDash([4, 5]);
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, baseY);
  ctx.lineTo(X(PEAK), baseY);
  ctx.stroke();
  ctx.setLineDash([]);
  text(ctx, `cloud base ${Math.round(land.cloudBase / 10) * 10} m`, 6, baseY + 11, "rgba(255,255,255,0.6)", "left", 10);

  // Small clouds over the sea, from sun-warmed air rising by itself.
  if (land.seaCloud) {
    const grow = Math.min(1, (convectionTop(sun) - land.cloudBase) / 500);
    ctx.fillStyle = `rgba(241,245,249,${0.35 + 0.35 * grow})`;
    for (let i = 0; i < 2; i++) {
      const cx = ((0.06 + i * 0.13 + t * wind * 0.004) % SEA_END) * w;
      puff(ctx, cx, baseY - 6 - 6 * grow, 6 + 6 * grow);
    }
  }

  // The cloud on the hills, and its rain.
  if (land.hillCloud) {
    const thick = Math.min(1, land.rainHill / 5);
    const x0 = SEA_END + 0.03;
    const cloudTopY = Y(LAND.hillTop + 200 + 700 * thick);
    ctx.fillStyle = `rgba(203,213,225,${0.55 + 0.35 * thick})`;
    for (let i = 0; i < 6; i++) {
      const x = x0 + 0.02 + ((PEAK - 0.02 - x0) * i) / 5;
      const cy = (baseY + cloudTopY) / 2 + Math.sin(t * 0.8 + i) * 2;
      puff(ctx, X(x), cy, Math.max(8, (baseY - cloudTopY) * 0.36));
    }
    ctx.fillStyle = `rgba(100,116,139,${0.35 + 0.3 * thick})`;
    ctx.fillRect(X(x0) - 6, baseY - 6, X(PEAK) - X(x0) + 6, 6);
    // Rain streaks.
    const drops = Math.round(10 + 14 * land.rainHill);
    ctx.strokeStyle = "rgba(125,211,252,0.85)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < drops; i++) {
      const fx = x0 + hash(i) * (PEAK - x0);
      const yTop = baseY;
      const yBot = surface(fx);
      if (yBot <= yTop) continue;
      const fall = ((t * 1.6 + hash(i + 99)) % 1) * (yBot - yTop);
      const y = yTop + fall;
      ctx.beginPath();
      ctx.moveTo(X(fx) - wind * 0.3, y);
      ctx.lineTo(X(fx), Math.min(yBot, y + 7));
      ctx.stroke();
    }
    // Rain soaking in, and rain running off down the slope.
    const split = infiltration(land.rainHill, ground);
    ctx.fillStyle = "rgba(56,189,248,0.8)";
    const seeps = Math.round(split.soak * 5);
    for (let i = 0; i < seeps; i++) {
      const fx = x0 + hash(i + 7) * (PEAK - x0);
      const y0 = surface(fx) + 3;
      const depth = h - gw - y0;
      if (depth <= 0) continue;
      const y = y0 + ((t * 0.5 + hash(i + 41)) % 1) * depth;
      ctx.fillRect(X(fx), y, 2, 3);
    }
    const runs = Math.round(split.runoff * 4);
    ctx.fillStyle = "rgba(147,197,253,0.95)";
    for (let i = 0; i < runs; i++) {
      // Each runoff blob slides down the slope and along the plain into the sea.
      const fx = PEAK - ((t * 0.12 + hash(i + 17)) % 1) * (PEAK - SEA_END + 0.02);
      ctx.fillRect(X(fx) - 2, surface(Math.max(SEA_END, fx)) - 3, 5, 2.5);
    }
    if (split.runoff > 0) text(ctx, "runoff →  sea", X(SEA_END) + 4, Y(PLAIN_H) + 13, "rgba(253,230,138,0.9)", "left", 10);
    text(ctx, "rain shadow", X(0.88), Y(LAND.plateau) - 20, "rgba(253,230,138,0.9)", "center", 10);
  }

  // Wind arrow.
  if (wind > 0) {
    const ax = w * 0.2;
    const ay = h * 0.08;
    const len = 10 + wind * 5;
    ctx.strokeStyle = "#67e8f9";
    ctx.fillStyle = "#67e8f9";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + len, ay);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ax + len + 7, ay);
    ctx.lineTo(ax + len - 2, ay - 5);
    ctx.lineTo(ax + len - 2, ay + 5);
    ctx.closePath();
    ctx.fill();
    text(ctx, "wind", ax, ay - 7, "rgba(165,243,252,0.9)", "left", 10);
  }

  text(ctx, "Arabian Sea", 6, seaY + 16, "rgba(191,219,254,0.9)", "left", 10);
  text(ctx, "Western Ghats", X(PEAK), Y(LAND.hillTop) + 16, "rgba(255,255,255,0.75)", "center", 10);
  text(ctx, "Pune", X(0.9), Y(LAND.plateau) - 6, "rgba(254,243,199,0.85)", "center", 10);
}

// ---------------------------------------------------------------------------
// The kitchen: a shirt on a line, a matka and a steel tumbler.

function drawKitchen(ctx: CanvasRenderingContext2D, w: number, h: number, now: number, T: number, rh: number, fan: number, hang: Hang, drink: Drink, wet: number) {
  const t = now / 1000;
  const floor = h * 0.86;
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(0, floor, w, h - floor);
  text(ctx, `Air ${T} °C · humidity ${Math.round(rh * 100)}%`, 8, 16, "rgba(255,255,255,0.8)", "left", 11);

  // Clothes line and shirt.
  const lineY = h * 0.22;
  const lx0 = w * 0.04;
  const lx1 = w * 0.38;
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(lx0, lineY);
  ctx.lineTo(lx1, lineY);
  ctx.stroke();
  const cx = (lx0 + lx1) / 2;
  const dry = [125, 211, 252];
  const soaked = [30, 64, 140];
  const col = dry.map((v, i) => Math.round(v + (soaked[i] - v) * wet));
  ctx.fillStyle = `rgb(${col.join(",")})`;
  const sw = Math.min(w * 0.3, h * 0.55);
  let bottom = lineY;
  if (hang === "spread") {
    const sh = sw * 0.95;
    ctx.beginPath();
    ctx.moveTo(cx - sw * 0.28, lineY);
    ctx.lineTo(cx - sw * 0.5, lineY + sh * 0.22);
    ctx.lineTo(cx - sw * 0.36, lineY + sh * 0.32);
    ctx.lineTo(cx - sw * 0.28, lineY + sh * 0.26);
    ctx.lineTo(cx - sw * 0.28, lineY + sh);
    ctx.lineTo(cx + sw * 0.28, lineY + sh);
    ctx.lineTo(cx + sw * 0.28, lineY + sh * 0.26);
    ctx.lineTo(cx + sw * 0.36, lineY + sh * 0.32);
    ctx.lineTo(cx + sw * 0.5, lineY + sh * 0.22);
    ctx.lineTo(cx + sw * 0.28, lineY);
    ctx.closePath();
    ctx.fill();
    bottom = lineY + sh;
  } else {
    const fw = sw * 0.42;
    const fh = sw * 0.38;
    ctx.fillRect(cx - fw / 2, lineY, fw, fh);
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - fw / 2, lineY + (fh * i) / 4);
      ctx.lineTo(cx + fw / 2, lineY + (fh * i) / 4);
      ctx.stroke();
    }
    bottom = lineY + fh;
  }
  // Clothes pegs.
  ctx.fillStyle = "#f472b6";
  ctx.fillRect(cx - sw * 0.2, lineY - 4, 3, 8);
  ctx.fillRect(cx + sw * 0.2 - 3, lineY - 4, 3, 8);
  // Vapour leaving the shirt, faster when it dries faster.
  const rate = evaporationRate(wetBulb(T, rh), T, rh, Math.max(0.3, fan));
  if (wet > 0) {
    const n = Math.min(14, Math.round(rate * 0.8));
    ctx.fillStyle = "rgba(226,232,240,0.5)";
    for (let i = 0; i < n; i++) {
      const ph = (t * 0.6 + hash(i)) % 1;
      const x = cx + (hash(i + 5) - 0.5) * sw * 0.6 + fan * 6 * ph;
      ctx.beginPath();
      ctx.arc(x, lineY - 4 - ph * lineY * 0.7, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    // Drips.
    if (wet > 0.6) {
      ctx.fillStyle = "rgba(56,189,248,0.8)";
      for (let i = 0; i < 3; i++) {
        const ph = (t * 0.9 + hash(i + 20)) % 1;
        ctx.fillRect(cx + (i - 1) * sw * 0.15, bottom + ph * (floor - bottom), 2, 4);
      }
    }
  }
  text(ctx, wet > 0 ? `${Math.round(wet * 100)}% wet` : "dry!", cx, Math.min(floor - 4, bottom + 16), wet > 0 ? "rgba(186,230,253,0.9)" : "rgba(190,242,100,0.95)", "center", 11);
  // Fan.
  if (fan > 0) {
    const fx = lx0 + 6;
    const fy = floor - 18;
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      const a = t * fan * 3 + (k * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + Math.cos(a) * 9, fy + Math.sin(a) * 9);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(165,243,252,0.35)";
    ctx.lineWidth = 1;
    for (let k = 0; k < 3; k++) {
      const y = lineY + 14 + k * 16;
      const off = ((t * fan * 20) % 30) - 15;
      ctx.beginPath();
      ctx.moveTo(lx0 + off + 10, y);
      ctx.lineTo(lx0 + off + 30, y);
      ctx.stroke();
    }
  }

  // Matka on a stand.
  const mx = w * 0.56;
  const mr = Math.min(w * 0.09, h * 0.17);
  const my = floor - 10 - mr;
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(mx - mr * 0.8, floor - 10, mr * 1.6, 10);
  ctx.fillStyle = "#b45309";
  ctx.beginPath();
  ctx.ellipse(mx, my, mr, mr * 0.95, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(mx - mr * 0.35, my - mr * 1.25, mr * 0.7, mr * 0.4);
  ctx.fillStyle = "#92400e";
  ctx.fillRect(mx - mr * 0.45, my - mr * 1.32, mr * 0.9, mr * 0.12);
  // Damp spots: water seeps through the clay and evaporates.
  ctx.fillStyle = "rgba(120,53,15,0.8)";
  for (let i = 0; i < 6; i++) {
    const a = hash(i + 60) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(mx + Math.cos(a) * mr * 0.6, my + Math.sin(a) * mr * 0.55, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  const cool = T - matkaTemp(T, rh);
  const puffs = Math.min(8, Math.round(cool));
  ctx.fillStyle = "rgba(226,232,240,0.45)";
  for (let i = 0; i < puffs; i++) {
    const ph = (t * 0.5 + hash(i + 80)) % 1;
    const side = hash(i + 90) > 0.5 ? 1 : -1;
    ctx.beginPath();
    ctx.arc(mx + side * (mr + 3 + ph * 8), my - ph * mr, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, "Matka", mx, my - mr * 1.45, "rgba(254,215,170,0.95)", "center", 11);
  text(ctx, `${matkaTemp(T, rh).toFixed(1)} °C`, mx, my + 4, "#fff7ed", "center", 11);

  // Steel tumbler.
  const tx = w * 0.84;
  const tw = Math.min(w * 0.12, h * 0.24);
  const th = tw * 1.3;
  const ty = floor - th;
  const g = ctx.createLinearGradient(tx - tw / 2, 0, tx + tw / 2, 0);
  g.addColorStop(0, "#64748b");
  g.addColorStop(0.35, "#e2e8f0");
  g.addColorStop(1, "#475569");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(tx - tw / 2, ty);
  ctx.lineTo(tx + tw / 2, ty);
  ctx.lineTo(tx + tw * 0.4, floor);
  ctx.lineTo(tx - tw * 0.4, floor);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(56,189,248,0.8)";
  ctx.beginPath();
  ctx.ellipse(tx, ty + 2, tw / 2 - 1, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  if (drink === "ice") {
    ctx.fillStyle = "rgba(240,249,255,0.9)";
    ctx.fillRect(tx - tw * 0.3, ty - 5, 8, 7);
    ctx.fillRect(tx + tw * 0.05, ty - 6, 8, 8);
  }
  const dT = drinkTemp(drink, T, rh);
  const dew = dewPoint(T, rh);
  if (tumblerSweats(dT, T, rh)) {
    const n = Math.min(40, Math.round(6 + (dew - dT) * 1.5));
    ctx.fillStyle = "rgba(186,230,253,0.95)";
    for (let i = 0; i < n; i++) {
      const fy = hash(i + 200);
      const slide = hash(i + 300) > 0.75 ? ((t * 0.08 + hash(i)) % 1) * (1 - fy) : 0;
      const yy = ty + 6 + (fy + slide) * (th - 10);
      const half = tw / 2 - (tw * 0.1 * (yy - ty)) / th;
      const xx = tx + (hash(i + 400) - 0.5) * 2 * (half - 3);
      ctx.beginPath();
      ctx.ellipse(xx, yy, 1.6, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    text(ctx, "drops!", tx, ty - 22, "rgba(186,230,253,0.95)", "center", 11);
  }
  text(ctx, "Tumbler", tx, ty - 10, "rgba(226,232,240,0.9)", "center", 11);
  text(ctx, `${dT.toFixed(1)} °C`, tx, floor + 13, "rgba(255,255,255,0.85)", "center", 11);
  text(ctx, `dew point ${dew.toFixed(1)} °C`, w - 8, 16, "rgba(165,243,252,0.9)", "right", 11);
}
