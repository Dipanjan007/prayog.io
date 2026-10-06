"use client";

import { useEffect, useRef, useState } from "react";
import {
  MATERIALS,
  ROD,
  breeze,
  clockLabel,
  createRod,
  flameX,
  landTemp,
  meltedDrops,
  potFlow,
  seaTemp,
  stepRod,
  stepWater,
  sunlight,
  tempAt,
  tinTemps,
  type Breeze,
  type FlamePos,
  type RodMaterial,
} from "@/lib/sim/heat";

export type HeatMode = "rod" | "pot" | "coast";

export interface HeatReading {
  mode: HeatMode;
  material: RodMaterial;
  heating: boolean;
  /** Whole minutes of (sped-up) heating time on the current rod. */
  minutes: number;
  /** Wax drops that have fallen from the current rod. */
  drops: number;
  flame: boolean;
  flamePos: FlamePos;
  dye: boolean;
  /** Enough dye has been carried up into the top part of the pot. */
  risen: boolean;
  hour: number;
  breeze: Breeze;
  /** Black tin minus white tin, °C, rounded. */
  tinDiff: number;
}

const SPEEDS = [10, 100] as const;
const MAX_DYE = 420;

interface Dot {
  x: number;
  y: number;
}

export default function HeatLab({ onReading }: { onReading?: (r: HeatReading) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [mode, setMode] = useState<HeatMode>("rod");

  // Rod.
  const [material, setMaterial] = useState<RodMaterial>("copper");
  const [heating, setHeating] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(10);
  const [rodStat, setRodStat] = useState({ minutes: 0, drops: 0 });
  const rod = useRef({ T: createRod(), time: 0, fellAt: ROD.drops.map(() => 0) });

  // Pot.
  const [flame, setFlame] = useState(false);
  const [flamePos, setFlamePos] = useState<FlamePos>("middle");
  const [dye, setDye] = useState(false);
  const [potStat, setPotStat] = useState({ risen: false, water: ROD.airT });
  const pot = useRef({ strength: 0, water: ROD.airT as number, dye: [] as Dot[], toAdd: 0, water0: [] as Dot[], crystal: null as Dot | null });

  // Coast.
  const [hour, setHour] = useState(7);
  const wind = breeze(hour);
  const tins = tinTemps(hour);

  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });
  const live = useRef({ mode, material, heating, speed, flame, flamePos, hour });
  useEffect(() => {
    live.current = { mode, material, heating, speed, flame, flamePos, hour };
  });

  const tinDiff = Math.round(tins.black - tins.white);
  useEffect(() => {
    onReadingRef.current?.({
      mode,
      material,
      heating,
      minutes: rodStat.minutes,
      drops: rodStat.drops,
      flame,
      flamePos,
      dye,
      risen: potStat.risen,
      hour,
      breeze: wind.kind,
      tinDiff,
    });
  }, [mode, material, heating, rodStat.minutes, rodStat.drops, flame, flamePos, dye, potStat.risen, hour, wind.kind, tinDiff]);

  useEffect(() => {
    const c = canvasRef.current!;
    const ro = new ResizeObserver(() => setSize({ w: c.clientWidth, h: c.clientHeight }));
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  // One animation loop for whichever view is showing.
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
    const air: number[] = Array.from({ length: 26 }, (_, i) => i / 26);
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const L = live.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (L.mode === "rod") {
        const r = rod.current;
        if (L.heating || r.T[0] > ROD.airT + 0.5) {
          stepRod(r.T, L.material, dt * L.speed, L.heating);
          if (L.heating) r.time += dt * L.speed;
        }
        meltedDrops(r.T).forEach((m, i) => {
          if (m && !r.fellAt[i]) r.fellAt[i] = now;
        });
        const drops = r.fellAt.filter((t) => t > 0).length;
        const minutes = Math.floor(r.time / 60);
        setRodStat((s) => (s.minutes === minutes && s.drops === drops ? s : { minutes, drops }));
        drawRod(ctx, w, h, r.T, L.material, L.heating, r.time, r.fellAt, now);
      } else if (L.mode === "pot") {
        const p = pot.current;
        p.strength += ((L.flame ? 0.22 : 0) - p.strength) * Math.min(1, dt * 0.6);
        p.water = stepWater(p.water, L.flame, dt);
        if (!p.water0.length) p.water0 = Array.from({ length: 70 }, () => ({ x: 0.04 + Math.random() * 0.92, y: 0.04 + Math.random() * 0.92 }));
        if (p.crystal && p.toAdd > 0) {
          const n = Math.min(p.toAdd, Math.max(1, Math.round(dt * 40)));
          for (let i = 0; i < n; i++) p.dye.push({ x: p.crystal.x + (Math.random() - 0.5) * 0.04, y: p.crystal.y + Math.random() * 0.02 });
          p.toAdd -= n;
        }
        const move = (d: Dot, jitter: number) => {
          const f = potFlow(d.x, d.y, p.strength, L.flamePos);
          d.x += f.u * dt + (Math.random() - 0.5) * jitter * Math.sqrt(dt);
          d.y += f.v * dt + (Math.random() - 0.5) * jitter * Math.sqrt(dt);
          d.x = Math.min(0.985, Math.max(0.015, d.x));
          d.y = Math.min(0.985, Math.max(0.015, d.y));
        };
        p.dye.forEach((d) => move(d, 0.06));
        p.water0.forEach((d) => move(d, 0.02));
        const up = p.dye.filter((d) => d.y > 0.6).length;
        const risen = p.dye.length >= 100 && up / p.dye.length >= 0.2;
        const water = Math.round(p.water);
        setPotStat((s) => (s.risen === risen && s.water === water ? s : { risen, water }));
        drawPot(ctx, w, h, p, L.flame, L.flamePos, now);
      } else {
        const b = breeze(L.hour);
        const dir = b.kind === "sea" ? 1 : b.kind === "land" ? -1 : 0;
        for (let i = 0; i < air.length; i++) air[i] = (((air[i] + dir * b.strength * 0.05 * dt) % 1) + 1) % 1;
        drawCoast(ctx, w, h, L.hour, air, now);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [size, mode]);

  const resetRod = () => {
    rod.current = { T: createRod(), time: 0, fellAt: ROD.drops.map(() => 0) };
    setRodStat({ minutes: 0, drops: 0 });
  };
  const pickMaterial = (m: RodMaterial) => {
    setMaterial(m);
    resetRod();
  };
  const addDye = () => {
    const p = pot.current;
    p.dye = [];
    p.toAdd = MAX_DYE;
    // Drop the crystal a little to one side of the flame, as in the NCERT activity, so the dye joins a current.
    p.crystal = { x: flamePos === "middle" ? 0.4 : 0.75, y: 0.03 };
    setDye(true);
    setPotStat((s) => ({ ...s, risen: false }));
  };
  const freshWater = () => {
    pot.current = { strength: 0, water: ROD.airT, dye: [], toAdd: 0, water0: [], crystal: null };
    setFlame(false);
    setDye(false);
    setPotStat({ risen: false, water: ROD.airT });
  };

  const label =
    mode === "rod"
      ? `A ${MATERIALS[material].label.toLowerCase()} rod ${heating ? "heated" : "not heated"} at its left end. ${rodStat.drops} of ${ROD.drops.length} wax drops have fallen.`
      : mode === "pot"
        ? `A pot of water at ${potStat.water} °C ${flame ? `with the flame lit under the ${flamePos}` : "with the flame off"}.${dye ? (potStat.risen ? " Purple dye is carried up above the flame and down at the sides." : " Purple dye sits near the bottom.") : ""}`
        : `A beach at ${clockLabel(hour)}. ${wind.kind === "sea" ? "A sea breeze blows from the sea to the land." : wind.kind === "land" ? "A land breeze blows from the land to the sea." : "The air is calm."} Black tin ${tins.black.toFixed(0)} °C, white tin ${tins.white.toFixed(0)} °C.`;

  return (
    <div className="flex flex-col gap-3 select-none">
      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
        {(["rod", "pot", "coast"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${mode === m ? "bg-white/10 text-white" : "text-white/45"}`}>
            {m === "rod" ? "Heated rod" : m === "pot" ? "Pot of water" : "Seaside"}
          </button>
        ))}
      </div>

      <canvas ref={canvasRef} className="h-56 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-72" role="img" aria-label={label} />

      {mode === "rod" && (
        <>
          <Choice options={(Object.keys(MATERIALS) as RodMaterial[]).map((id) => ({ id, label: MATERIALS[id].label }))} value={material} onChange={pickMaterial} />
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`rounded-xl border px-3 py-2 text-sm ${heating ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/60"}`}
              onClick={() => setHeating(!heating)}
            >
              {heating ? "Put out the flame" : "Light the flame"}
            </button>
            <button className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/60" onClick={resetRod}>
              Cool rod, new wax
            </button>
          </div>
          <Choice
            options={SPEEDS.map((s) => ({ id: String(s), label: s === 10 ? "Speed 10×" : "Fast 100×" }))}
            value={String(speed)}
            onChange={(v) => setSpeed(Number(v) as (typeof SPEEDS)[number])}
          />
          <p className="text-center text-xs text-white/45">
            {MATERIALS[material].kind === "good" ? "Metals are good conductors of heat." : "Glass and wood are poor conductors of heat."} Wax melts at about {ROD.waxMelt} °C.
          </p>
        </>
      )}

      {mode === "pot" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`rounded-xl border px-3 py-2 text-sm ${flame ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/60"}`}
              onClick={() => setFlame(!flame)}
            >
              {flame ? "Turn off the flame" : "Light the flame"}
            </button>
            <button className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/60" onClick={addDye}>
              {dye ? "Drop another crystal" : "Drop a crystal"}
            </button>
          </div>
          <Choice
            options={[
              { id: "middle", label: "Flame in the middle" },
              { id: "side", label: "Flame at one side" },
            ]}
            value={flamePos}
            onChange={(v) => setFlamePos(v as FlamePos)}
          />
          <button className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/60" onClick={freshWater}>
            Fresh cold water
          </button>
          <p className="text-center text-xs text-white/45">The crystal is potassium permanganate. It colours the water purple, so you can see where the water goes.</p>
        </>
      )}

      {mode === "coast" && (
        <>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { k: "Land", v: landTemp(hour) },
              { k: "Sea", v: seaTemp(hour) },
              { k: "Black tin", v: tins.black },
              { k: "White tin", v: tins.white },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
                <div className="text-[11px] uppercase tracking-wider text-white/45">{s.k}</div>
                <div className="font-display text-lg tabular-nums">{s.v.toFixed(0)} °C</div>
              </div>
            ))}
          </div>
          <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Time of day</span>
              <span className="tabular-nums text-white">{clockLabel(hour)}</span>
            </div>
            <input type="range" className="range mt-2 w-full" min={0} max={23.5} step={0.5} value={hour} onChange={(e) => setHour(Number(e.target.value))} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button className={`rounded-xl border px-3 py-2 text-sm ${sunlight(hour) > 0 ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/60"}`} onClick={() => setHour(12)}>
              ☀️ Day (noon)
            </button>
            <button className={`rounded-xl border px-3 py-2 text-sm ${sunlight(hour) === 0 ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/60"}`} onClick={() => setHour(0)}>
              🌙 Night (midnight)
            </button>
          </div>
        </>
      )}
    </div>
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
// Drawing helpers.

const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const hex = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
const RAMP = [hex("#7f1d1d"), hex("#ef4444"), hex("#fb923c"), hex("#fde047")];

/** Colour for a temperature: the material's own colour when cool, glowing red to yellow as it heats. */
function heatColour(T: number, base: string) {
  const t = Math.min(1, Math.max(0, (T - ROD.airT) / (ROD.flameT - ROD.airT)));
  if (t < 0.15) return `rgb(${mix(hex(base), RAMP[0], t / 0.15).join(",")})`;
  const s = ((t - 0.15) / 0.85) * 3;
  const i = Math.min(2, Math.floor(s));
  return `rgb(${mix(RAMP[i], RAMP[i + 1], s - i).join(",")})`;
}

function drawFlame(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, now: number, wide = 0.45) {
  const f = 1 + 0.12 * Math.sin(now / 70) + 0.06 * Math.sin(now / 37);
  const g = ctx.createRadialGradient(x, y - size * 0.4, 1, x, y - size * 0.4, size * f);
  g.addColorStop(0, "rgba(254,240,138,0.95)");
  g.addColorStop(0.45, "rgba(251,146,60,0.8)");
  g.addColorStop(1, "rgba(239,68,68,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - size * wide, y);
  ctx.quadraticCurveTo(x - size * wide * 1.1, y - size * 0.7, x, y - size * 1.3 * f);
  ctx.quadraticCurveTo(x + size * wide * 1.1, y - size * 0.7, x + size * wide, y);
  ctx.closePath();
  ctx.fill();
}

function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, colour: string, align: CanvasTextAlign = "left", size = 11) {
  ctx.font = `${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.fillStyle = colour;
  ctx.fillText(s, x, y);
}

function drawRod(ctx: CanvasRenderingContext2D, w: number, h: number, T: Float64Array, m: RodMaterial, heating: boolean, time: number, fellAt: number[], now: number) {
  const x0 = 30;
  const x1 = w - 22;
  const len = x1 - x0;
  const thick = Math.max(16, Math.min(24, h * 0.09));
  const cy = h * 0.4;
  const X = (x: number) => x0 + (x / ROD.length) * len;
  const base = MATERIALS[m].color;

  // Clamp stand at the far end.
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(x1 + 4, cy - thick, 6, h * 0.78 - cy + thick);
  ctx.fillRect(x1 - 6, cy - thick / 2 - 4, 16, 4);

  // Burner and flame under the left end.
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(x0 - 16, h * 0.78, 32, 8);
  if (heating) drawFlame(ctx, x0 + 4, h * 0.78, (h * 0.78 - cy) * 0.8, now, 0.22);

  // The rod as rows of particles: each wobbles more and glows hotter as it warms up.
  // The wobble is hugely exaggerated so you can see it.
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(x0, cy - thick / 2, len, thick);
  const cols = Math.max(18, Math.round(len / 11));
  const rows = 3;
  const rad = Math.min(4, (len / cols) * 0.36);
  for (let i = 0; i < cols; i++) {
    const x = ((i + 0.5) / cols) * ROD.length;
    const t = tempAt(T, x);
    const amp = 0.4 + 2.6 * Math.min(1, (t - ROD.airT) / (ROD.flameT - ROD.airT));
    ctx.fillStyle = heatColour(t, base);
    for (let j = 0; j < rows; j++) {
      const ph = i * 12.9898 + j * 78.233;
      const px = X(x) + amp * Math.sin(now / 45 + ph);
      const py = cy + ((j - 1) * thick) / 3 + amp * Math.cos(now / 39 + ph * 1.7);
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Wax drops hang under the rod; melted ones fall into the tray.
  const trayY = h * 0.78;
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(x0 + 30, trayY + 2, len - 30, 4);
  ROD.drops.forEach((x, i) => {
    const px = X(x);
    const hangY = cy + thick / 2 + 6;
    let y = hangY;
    if (fellAt[i]) {
      const s = (now - fellAt[i]) / 1000;
      y = Math.min(trayY - 3, hangY + 0.5 * 900 * s * s);
    }
    ctx.fillStyle = fellAt[i] ? "rgba(254,243,199,0.75)" : "#fef3c7";
    ctx.beginPath();
    if (fellAt[i] && y >= trayY - 3) ctx.ellipse(px, trayY - 1, 7, 3, 0, 0, Math.PI * 2);
    else ctx.ellipse(px, y, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, `${tempAt(T, x).toFixed(0)}°`, px, cy - thick / 2 - 8, "rgba(255,255,255,0.75)", "center");
  });

  // Headings.
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  text(ctx, `Time ${mins} min ${String(secs).padStart(2, "0")} s`, 10, 18, "rgba(255,255,255,0.8)");
  text(ctx, `${MATERIALS[m].label} rod, 20 cm`, w - 10, 18, "rgba(165,243,252,0.9)", "right");
  const fallen = fellAt.filter((t) => t > 0).length;
  text(ctx, `Wax drops fallen: ${fallen} of ${ROD.drops.length}`, w - 10, h - 10, "rgba(255,255,255,0.7)", "right");
  if (heating) text(ctx, "flame", x0 + 2, h - 10, "rgba(251,146,60,0.9)", "center");
}

interface PotState {
  water: number;
  dye: Dot[];
  water0: Dot[];
  crystal: Dot | null;
  strength: number;
}

function drawPot(ctx: CanvasRenderingContext2D, w: number, h: number, p: PotState, flame: boolean, pos: FlamePos, now: number) {
  const potW = Math.min(w * 0.62, h * 1.25);
  const potH = h * 0.66;
  const left = (w - potW) / 2;
  const top = h * 0.1;
  const bottom = top + potH;
  const P = (d: Dot) => ({ x: left + d.x * potW, y: bottom - d.y * potH });

  // Water warms from blue towards a warmer tint.
  const t = Math.min(1, Math.max(0, (p.water - ROD.airT) / 70));
  const c = mix([30, 64, 120], [70, 60, 110], t);
  ctx.fillStyle = `rgba(${c.join(",")},0.55)`;
  ctx.fillRect(left, top + potH * 0.02, potW, potH * 0.98);
  // A warm glow above the flame shows the hottest water.
  if (p.strength > 0.02) {
    const fx = left + flameX(pos) * potW;
    const g = ctx.createRadialGradient(fx, bottom, 2, fx, bottom, potH * 0.8);
    g.addColorStop(0, `rgba(251,146,60,${0.35 * (p.strength / 0.22)})`);
    g.addColorStop(1, "rgba(251,146,60,0)");
    ctx.fillStyle = g;
    ctx.fillRect(left, top, potW, potH);
  }

  // Water particles and dye.
  ctx.fillStyle = "rgba(186,230,253,0.55)";
  for (const d of p.water0) {
    const q = P(d);
    ctx.beginPath();
    ctx.arc(q.x, q.y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(192,38,211,0.75)";
  for (const d of p.dye) {
    const q = P(d);
    ctx.beginPath();
    ctx.arc(q.x, q.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  if (p.crystal) {
    const q = P(p.crystal);
    ctx.fillStyle = "#701a75";
    ctx.fillRect(q.x - 3, bottom - 5, 6, 4);
  }

  // Pot walls.
  ctx.strokeStyle = "rgba(226,232,240,0.7)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(left - 2, top - 4);
  ctx.lineTo(left - 2, bottom + 2);
  ctx.lineTo(left + potW + 2, bottom + 2);
  ctx.lineTo(left + potW + 2, top - 4);
  ctx.stroke();

  // Flow arrows once the currents are going.
  if (p.strength > 0.08) {
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 1.5;
    const pts = pos === "middle" ? [[0.5, 0.35], [0.5, 0.65], [0.25, 0.92], [0.75, 0.92], [0.06, 0.5], [0.94, 0.5]] : [[0.88, 0.35], [0.88, 0.65], [0.5, 0.92], [0.08, 0.5], [0.5, 0.08]];
    for (const [x, y] of pts) {
      const f = potFlow(x, y, 1, pos);
      const m = Math.hypot(f.u, f.v) || 1;
      const a = P({ x, y });
      const dx = (f.u / m) * 10;
      const dy = (-f.v / m) * 10;
      ctx.beginPath();
      ctx.moveTo(a.x - dx, a.y - dy);
      ctx.lineTo(a.x + dx, a.y + dy);
      ctx.stroke();
      const ang = Math.atan2(dy, dx);
      ctx.beginPath();
      ctx.moveTo(a.x + dx, a.y + dy);
      ctx.lineTo(a.x + dx - 6 * Math.cos(ang - 0.5), a.y + dy - 6 * Math.sin(ang - 0.5));
      ctx.lineTo(a.x + dx - 6 * Math.cos(ang + 0.5), a.y + dy - 6 * Math.sin(ang + 0.5));
      ctx.fill();
    }
  }

  // Burner and flame.
  const fx = left + flameX(pos) * potW;
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(fx - 18, h - 14, 36, 6);
  if (flame) drawFlame(ctx, fx, h - 14, Math.min(28, h - 16 - bottom), now);

  text(ctx, `Water ${p.water.toFixed(0)} °C`, 10, 18, "rgba(255,255,255,0.8)");
  if (p.strength > 0.08) {
    const hotX = pos === "middle" ? left + potW / 2 : left + potW * 0.88;
    text(ctx, "hot water rises", Math.min(w - 50, hotX), top - 6, "rgba(253,186,116,0.95)", "center");
  }
  if (p.dye.length) text(ctx, "dye", w - 10, 18, "rgba(232,121,249,0.95)", "right");
}

function drawCoast(ctx: CanvasRenderingContext2D, w: number, h: number, hour: number, air: number[], now: number) {
  const sun = sunlight(hour);
  const ground = h * 0.74;
  const shore = w * 0.46;

  // Sky.
  const sky = ctx.createLinearGradient(0, 0, 0, ground);
  sky.addColorStop(0, `rgba(${mix([10, 13, 28], [37, 99, 235], sun).join(",")},1)`);
  sky.addColorStop(1, `rgba(${mix([15, 23, 42], [125, 211, 252], sun * 0.8).join(",")},1)`);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, ground);

  // Sun or Moon on an arc across the sky.
  if (sun > 0) {
    const a = (Math.PI * (hour - 6)) / 12;
    const sx = w * 0.5 - Math.cos(a) * w * 0.42;
    const sy = ground - Math.sin(a) * ground * 0.8 - 4;
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    ctx.arc(sx, sy, 11, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    for (let i = 0; i < 18; i++) ctx.fillRect((i * 97.3) % w, ((i * 41.7) % (ground * 0.5)) + 4, 1.5, 1.5);
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.arc(w * 0.82, h * 0.12, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sea and land.
  ctx.fillStyle = "#1e3a8a";
  ctx.fillRect(0, ground, shore + 8, h - ground);
  ctx.fillStyle = `rgba(${mix([87, 70, 40], [214, 181, 120], 0.3 + 0.7 * sun).join(",")},1)`;
  ctx.beginPath();
  ctx.moveTo(shore - 12, h);
  ctx.lineTo(shore + 6, ground);
  ctx.lineTo(w, ground);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  // Water vapour rising from the warm sea in sunshine (the start of the water cycle).
  if (sun > 0.3) {
    ctx.strokeStyle = `rgba(226,232,240,${0.35 * sun})`;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) {
      const x = w * (0.06 + i * 0.1);
      const phase = ((now / 2500 + i * 0.27) % 1) * 20;
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const y = ground - 4 - phase - k * 2.5;
        const xx = x + Math.sin(k * 0.6 + now / 400) * 3;
        if (k === 0) ctx.moveTo(xx, y);
        else ctx.lineTo(xx, y);
      }
      ctx.stroke();
    }
  }

  // Black and white tins with water on the sand.
  const tinW = Math.min(22, w * 0.06);
  const tx = w * 0.7;
  ctx.fillStyle = "#0b0b0b";
  ctx.fillRect(tx, ground - 20, tinW, 20);
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(tx, ground - 20, tinW, 20);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(tx + tinW + 10, ground - 20, tinW, 20);
  text(ctx, "tins", tx + tinW + 5, ground + 14, "rgba(255,255,255,0.8)", "center");

  // The convection loop: near the ground the breeze blows from cool to warm, warm air rises,
  // and the air returns high up. Air parcels move around it.
  const b = breeze(hour);
  const lx0 = w * 0.1;
  const lx1 = w * 0.9;
  const ly0 = h * 0.24;
  const ly1 = ground - 32;
  const per = 2 * (lx1 - lx0) + 2 * (ly1 - ly0);
  const at = (s: number) => {
    // s from 0 to 1 round the loop: bottom (sea to land), up the right, top (land to sea), down the left.
    let d = s * per;
    const bw = lx1 - lx0;
    const bh = ly1 - ly0;
    if (d < bw) return { x: lx0 + d, y: ly1 };
    d -= bw;
    if (d < bh) return { x: lx1, y: ly1 - d };
    d -= bh;
    if (d < bw) return { x: lx1 - d, y: ly0 };
    d -= bw;
    return { x: lx0, y: ly0 + d };
  };
  if (b.kind !== "calm") {
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    ctx.strokeRect(lx0, ly0, lx1 - lx0, ly1 - ly0);
    ctx.setLineDash([]);
  }
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  for (let i = 0; i < air.length; i++) {
    const q = at(air[i]);
    const jx = b.kind === "calm" ? Math.sin(now / 300 + i) * 2 : 0;
    ctx.beginPath();
    ctx.arc(q.x + jx, q.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Big arrow for the surface breeze.
  if (b.kind !== "calm") {
    const dir = b.kind === "sea" ? 1 : -1;
    const mid = w * 0.5;
    const half = w * 0.17;
    const y = ly1 + 14;
    ctx.strokeStyle = "#67e8f9";
    ctx.fillStyle = "#67e8f9";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mid - dir * half, y);
    ctx.lineTo(mid + dir * half, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mid + dir * (half + 8), y);
    ctx.lineTo(mid + dir * (half - 4), y - 7);
    ctx.lineTo(mid + dir * (half - 4), y + 7);
    ctx.closePath();
    ctx.fill();
    // Rising warm air on the warmer side.
    const rx = b.kind === "sea" ? lx1 : lx0;
    text(ctx, "warm air rises", b.kind === "sea" ? rx - 6 : rx + 6, (ly0 + ly1) / 2, "rgba(253,186,116,0.95)", b.kind === "sea" ? "right" : "left");
  }

  const title = b.kind === "sea" ? "Sea breeze: sea → land" : b.kind === "land" ? "Land breeze: land → sea" : "Calm: land and sea about equal";
  text(ctx, `${clockLabel(hour)}  ${title}`, 10, 18, "#ffffff", "left", 12);
  text(ctx, "SEA", 10, h - 10, "rgba(191,219,254,0.9)");
  text(ctx, "LAND", w - 10, h - 10, "rgba(254,243,199,0.95)", "right");
}
