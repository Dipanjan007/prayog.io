"use client";

import { useEffect, useRef, useState } from "react";
import {
  INDIA_LAT,
  LUNAR_YEAR_DAYS,
  MONTHS,
  SYNODIC_DAYS,
  YEAR_DAYS,
  clock,
  compass,
  indiaInDaylight,
  litSpan,
  moonPhase,
  orbitAngles,
  stickShadow,
  sunDeclination,
  sunPosition,
  sunTimes,
} from "@/lib/sim/sky";

export type SkyMode = "orbit" | "shadow";

export interface SkyReading {
  mode: SkyMode;
  day: number;
  /** Time of day in India for the orbit view, in hours. */
  hour: number;
  elong: number;
  lit: number;
  waxing: boolean;
  indiaDay: boolean;
  shadow: { month: number; hour: number; alt: number; length: number | null; az: number | null };
}

interface Props {
  onReading?: (r: SkyReading) => void;
  /** Challenge: a Moon to match, by elongation in degrees. Forces the orbit view. */
  target?: { elong: number } | null;
}

const MAX_DAY = 365;

export default function SkyClock({ onReading, target = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<SkyMode>("orbit");
  const [day, setDay] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [month, setMonth] = useState(9);
  const [hour, setHour] = useState(8);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: SkyMode = target ? "orbit" : mode;
  const phase = moonPhase(day);
  const angles = orbitAngles(day);
  const indiaDay = indiaInDaylight(angles.hour);
  const decl = sunDeclination(month);
  const sun = sunPosition(INDIA_LAT, decl, hour);
  const shadow = stickShadow(sun.alt, sun.az);
  const times = sunTimes(INDIA_LAT, decl);

  useEffect(() => {
    onReadingRef.current?.({
      mode: activeMode,
      day,
      hour: angles.hour,
      elong: phase.elong,
      lit: phase.lit,
      waxing: phase.waxing,
      indiaDay,
      shadow: { month, hour, alt: sun.alt, length: shadow?.length ?? null, az: shadow?.az ?? null },
    });
  }, [activeMode, day, angles.hour, phase.elong, phase.lit, phase.waxing, indiaDay, month, hour, sun.alt, shadow?.length, shadow?.az]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setDay((d) => {
        if (d >= MAX_DAY) {
          setPlaying(false);
          return d;
        }
        return Math.min(MAX_DAY, d + 0.25);
      });
    }, 60);
    return () => clearInterval(id);
  }, [playing]);

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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);
    if (activeMode === "orbit") drawOrbit(ctx, size.w, size.h, day, target?.elong ?? null);
    else drawShadow(ctx, size.w, size.h, month, hour);
  }, [size, activeMode, day, target, month, hour]);

  const nudge = (dd: number) => {
    setPlaying(false);
    setDay((d) => Math.max(0, Math.min(MAX_DAY, d + dd)));
  };
  const wholeDay = Math.floor(day);

  return (
    <div className="flex flex-col gap-3 select-none">
      {!target && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["orbit", "shadow"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${activeMode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m === "orbit" ? "Sun, Earth and Moon" : "Shadow stick"}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={
          activeMode === "orbit"
            ? `Top view of the Sun, Earth and Moon on day ${wholeDay} at ${clock(angles.hour)}. India is on the ${indiaDay ? "day" : "night"} side. The Moon seen from India is a ${phase.name.toLowerCase()}, ${Math.round(phase.lit * 100)} percent lit${target ? ", next to the Moon you must match" : ""}.`
            : shadow
              ? `Top view of a 1 metre stick at 23 degrees north on 21 ${MONTHS[month]} at ${clock(hour)}. The Sun is ${Math.round(sun.alt)} degrees high in the ${compass(sun.az)} and the shadow is ${shadow.length.toFixed(2)} metres long, pointing ${compass(shadow.az)}.`
              : `Top view of a stick at 23 degrees north on 21 ${MONTHS[month]} at ${clock(hour)}. The Sun has set, so there is no shadow.`
        }
      />

      {activeMode === "orbit" ? (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Tithi" value={tithiText(phase.paksha, phase.tithi)} />
            <Stat label="Moon lit" value={`${Math.round(phase.lit * 100)}%`} />
            <Stat label="Lunar months" value={`${phase.lunarMonths} done`} />
          </div>
          <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Day</span>
              <span className="tabular-nums text-white">
                Day {wholeDay}, {clock(angles.hour)}
              </span>
            </div>
            <input
              type="range"
              className="range mt-2 w-full"
              min={0}
              max={MAX_DAY}
              step={0.25}
              value={day}
              onChange={(e) => {
                setPlaying(false);
                setDay(Number(e.target.value));
              }}
            />
            <div className="mt-2 grid grid-cols-4 gap-2">
              <button className="rounded-xl border border-white/10 px-2 py-1.5 text-sm text-white/70" onClick={() => nudge(-1)}>
                −1 day
              </button>
              <button className="rounded-xl border border-white/10 px-2 py-1.5 text-sm text-white/70" onClick={() => nudge(0.25)}>
                +6 h
              </button>
              <button className="rounded-xl border border-white/10 px-2 py-1.5 text-sm text-white/70" onClick={() => nudge(1)}>
                +1 day
              </button>
              <button
                className={`rounded-xl border px-2 py-1.5 text-sm ${playing ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
                onClick={() => {
                  if (!playing && day >= MAX_DAY) setDay(0);
                  setPlaying(!playing);
                }}
              >
                {playing ? "Pause" : "Play"}
              </button>
            </div>
          </label>
          {!target && <YearBar day={day} />}
          <p className="text-center text-xs text-white/40">
            Day 0 is an Amavasya at midnight. India is on the {indiaDay ? "day" : "night"} side right now.
          </p>
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Sun height" value={sun.alt > 0 ? `${Math.round(sun.alt)}°` : "Set"} />
            <Stat label="Shadow" value={shadow ? (shadow.length > 20 ? "> 20 m" : `${shadow.length.toFixed(2)} m`) : "None"} />
            <Stat label="Points" value={shadow ? (shadow.length < 0.03 ? "Almost none" : compass(shadow.az)) : "–"} />
          </div>
          <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Time of day</span>
              <span className="tabular-nums text-white">{clock(hour)}</span>
            </div>
            <input type="range" className="range mt-2 w-full" min={5} max={19} step={0.25} value={hour} onChange={(e) => setHour(Number(e.target.value))} />
          </label>
          <div className="grid grid-cols-6 gap-1.5">
            {MONTHS.map((m, i) => (
              <button
                key={m}
                onClick={() => setMonth(i)}
                className={`rounded-xl border px-1 py-1.5 text-xs ${month === i ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
              >
                {m}
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-white/40">
            21 {MONTHS[month]} at 23° N, local Sun time. Sunrise {clock(times.rise)}, sunset {clock(times.set)}. The stick is 1 m tall.
          </p>
        </>
      )}
    </div>
  );
}

/** "Shukla 5", with the 15th tithi named: Purnima ends Shukla paksha and Amavasya ends Krishna paksha. */
const tithiText = (paksha: string, tithi: number) => (tithi === 15 ? (paksha === "Shukla" ? "Purnima" : "Amavasya") : `${paksha} ${tithi}`);

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] uppercase tracking-wider text-white/50">{label}</div>
      <div className="font-display text-base tabular-nums sm:text-lg">{value}</div>
    </div>
  );
}

/** The solar year as a bar, with a tick for every Amavasya. */
function YearBar({ day }: { day: number }) {
  const ticks: number[] = [];
  for (let k = 1; k * SYNODIC_DAYS <= YEAR_DAYS; k++) ticks.push(k * SYNODIC_DAYS);
  const pct = (d: number) => `${Math.min(100, (d / YEAR_DAYS) * 100)}%`;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/60">
      <div className="flex justify-between">
        <span>Earth&apos;s trip round the Sun</span>
        <span className="tabular-nums text-white">{Math.min(100, Math.round((day / YEAR_DAYS) * 100))}%</span>
      </div>
      <div className="relative mt-2 h-3 rounded-full bg-white/10">
        <div className="absolute inset-y-0 left-0 rounded-full bg-amber-300/70" style={{ width: pct(day) }} />
        {ticks.map((t, i) => (
          <div key={t} className={`absolute -inset-y-0.5 w-0.5 ${i === 11 ? "bg-cyan-300" : "bg-white/40"}`} style={{ left: pct(t) }} />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between gap-2">
        <span>Ticks: each Amavasya</span>
        <span className="text-right">
          <span className="text-cyan-300">12th Amavasya: day {Math.round(LUNAR_YEAR_DAYS)}</span>. Full trip: day 365.
        </span>
      </div>
    </div>
  );
}

/** Background stars at fixed spots so they do not flicker between frames. */
function drawStars(ctx: CanvasRenderingContext2D, w: number, h: number) {
  let s = 7;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  for (let i = 0; i < 60; i++) {
    ctx.beginPath();
    ctx.arc(rnd() * w, rnd() * h, rnd() * 0.9 + 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A ball lit on the half facing the Sun. sunRad is the direction to the Sun (maths angle, y up). */
function litBall(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, sunRad: number, dark: string, light: string) {
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  // Canvas y points down, so a maths angle a is canvas angle -a.
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.arc(x, y, r, -sunRad - Math.PI / 2, -sunRad + Math.PI / 2);
  ctx.closePath();
  ctx.fill();
}

/** The Moon as seen from Earth, drawn row by row from litSpan, so the shape matches the phase angle. */
function moonDisc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, elong: number) {
  ctx.fillStyle = "#1e2333";
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  const N = 64;
  const right: [number, number][] = [];
  const left: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const v = -1 + (2 * i) / N;
    const [x0, x1] = litSpan(v, elong);
    right.push([x + x1 * r, y + v * r]);
    left.push([x + x0 * r, y + v * r]);
  }
  ctx.fillStyle = "#f4f1de";
  ctx.shadowColor = "#f4f1de";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  right.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  for (let i = left.length - 1; i >= 0; i--) ctx.lineTo(left[i][0], left[i][1]);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawOrbit(ctx: CanvasRenderingContext2D, w: number, h: number, day: number, targetElong: number | null) {
  drawStars(ctx, w, h);
  const { earthRad, sunFromEarthRad, moonRad, indiaRad } = orbitAngles(day);
  const phase = moonPhase(day);
  const insetW = w < 520 ? 104 : 160;
  const ow = w - insetW;
  const cx = ow / 2;
  const cy = h / 2;
  // Not to scale: the real Earth-Sun distance is about 390 times the Earth-Moon distance.
  const R = Math.min(ow, h) / 2 - 38;
  const rm = R * 0.3;
  const P = (ox: number, oy: number, a: number, r: number) => ({ x: ox + r * Math.cos(a), y: oy - r * Math.sin(a) });

  ctx.font = "11px system-ui, sans-serif";
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();

  // Sun.
  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 26);
  g.addColorStop(0, "#fff7c2");
  g.addColorStop(0.5, "#fbbf24");
  g.addColorStop(1, "rgba(251,191,36,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, 26, 0, Math.PI * 2);
  ctx.fill();

  // Earth and the Moon's orbit.
  const E = P(cx, cy, earthRad, R);
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.arc(E.x, E.y, rm, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const M = P(E.x, E.y, moonRad, rm);
  // Our line of sight to the Moon.
  ctx.strokeStyle = "rgba(125,211,252,0.35)";
  ctx.beginPath();
  ctx.moveTo(E.x, E.y);
  ctx.lineTo(M.x, M.y);
  ctx.stroke();

  litBall(ctx, E.x, E.y, 10, sunFromEarthRad, "#1e3a5f", "#38bdf8");
  const I = P(E.x, E.y, indiaRad, 10);
  ctx.fillStyle = "#fb923c";
  ctx.strokeStyle = "#0a0d1c";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(I.x, I.y, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Sunlight is nearly parallel at the Moon, so its lit half faces the same way as the Earth's.
  litBall(ctx, M.x, M.y, 5.5, sunFromEarthRad, "#3a3f4f", "#f4f1de");

  // Labels, kept inside the orbit area.
  const label = (text: string, x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    const tw = ctx.measureText(text).width;
    ctx.fillText(text, Math.max(4, Math.min(ow - tw - 4, x - tw / 2)), Math.max(12, Math.min(h - 6, y)));
  };
  label("Sun", cx, cy + 34, "rgba(253,224,71,0.8)");
  // Push each label out along a direction far enough that its box clears the ball.
  const offset = (text: string, a: number, clear: number) => clear + Math.abs(Math.cos(a)) * (ctx.measureText(text).width / 2) + Math.abs(Math.sin(a)) * 6;
  // Earth's label sits just above or below the Moon's orbit, on the side away from the Moon.
  label("Earth", E.x, M.y > E.y ? E.y - rm - 6 : E.y + rm + 14, "rgba(125,211,252,0.85)");
  const mAway = P(M.x, M.y, moonRad, offset("Moon", moonRad, 8));
  label("Moon", mAway.x, mAway.y + 4, "rgba(244,241,222,0.8)");

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillText("Not to scale", 8, h - 8);
  ctx.fillStyle = "#fb923c";
  ctx.beginPath();
  ctx.arc(11, 14, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("India", 18, 18);

  // Inset: the Moon as seen from India.
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(ow, 0, insetW, h);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.moveTo(ow + 0.5, 0);
  ctx.lineTo(ow + 0.5, h);
  ctx.stroke();
  const ix = ow + insetW / 2;
  const mr = Math.min(insetW / 2 - 16, targetElong === null ? 40 : 30);
  ctx.textAlign = "center";
  const name = phase.name.replace(/ \(.*\)/, "");
  if (targetElong === null) {
    const top = h / 2 - mr - 34;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText("Moon from India", ix, top + 10);
    moonDisc(ctx, ix, top + 24 + mr, mr, phase.elong);
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(name, ix, top + 2 * mr + 44);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(tithiText(phase.paksha, phase.tithi), ix, top + 2 * mr + 60);
  } else {
    const gap = (h - 2 * (2 * mr + 22)) / 3;
    let y = gap;
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText("Your Moon", ix, y + 10);
    moonDisc(ctx, ix, y + 20 + mr, mr, phase.elong);
    y += 2 * mr + 22 + gap;
    ctx.fillStyle = "#67e8f9";
    ctx.fillText("Match this", ix, y + 10);
    moonDisc(ctx, ix, y + 20 + mr, mr, targetElong);
  }
  ctx.textAlign = "left";
}

function drawShadow(ctx: CanvasRenderingContext2D, w: number, h: number, month: number, hour: number) {
  const decl = sunDeclination(month);
  const cx = w / 2;
  const cy = h / 2;
  const rim = Math.min(w, h) / 2 - 22;
  const perM = rim / 2.2;
  // Azimuth (from north, clockwise) to canvas: north is up, east is right.
  const at = (az: number, r: number) => {
    const a = (az * Math.PI) / 180;
    return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
  };

  ctx.font = "11px system-ui, sans-serif";
  // Ground with 1 m and 2 m rings.
  ctx.fillStyle = "rgba(163,230,53,0.05)";
  ctx.beginPath();
  ctx.arc(cx, cy, rim, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([2, 4]);
  for (const m of [1, 2]) {
    ctx.beginPath();
    ctx.arc(cx, cy, m * perM, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "10px system-ui, sans-serif";
  for (const m of [1, 2]) {
    const p = at(135, m * perM);
    ctx.fillText(`${m} m`, p.x + 3, p.y + 10);
  }

  // Compass.
  ctx.font = "bold 12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const [t, az] of [["N", 0], ["E", 90], ["S", 180], ["W", 270]] as const) {
    const p = at(az, rim + 12);
    ctx.fillStyle = t === "N" ? "#67e8f9" : "rgba(255,255,255,0.6)";
    ctx.fillText(t, p.x, p.y);
  }
  ctx.font = "10px system-ui, sans-serif";

  // Sundial trail: where the shadow tip falls on the hour, all day.
  const { rise, set } = sunTimes(INDIA_LAT, decl);
  let lastLabel: { x: number; y: number } | null = null;
  for (let hr = Math.ceil(rise); hr <= Math.floor(set); hr++) {
    const s = sunPosition(INDIA_LAT, decl, hr);
    const sh = stickShadow(s.alt, s.az);
    if (!sh || sh.length * perM > rim) continue;
    const p = at(sh.az, sh.length * perM);
    ctx.fillStyle = "rgba(103,232,249,0.55)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
    if (!lastLabel || Math.hypot(p.x - lastLabel.x, p.y - lastLabel.y) > 16) {
      ctx.fillStyle = "rgba(103,232,249,0.75)";
      ctx.fillText(String(hr > 12 ? hr - 12 : hr), p.x, p.y + (sh.az < 90 || sh.az > 270 ? -9 : 9));
      lastLabel = p;
    }
  }

  const s = sunPosition(INDIA_LAT, decl, hour);
  const sh = stickShadow(s.alt, s.az);
  if (sh) {
    const len = Math.min(sh.length * perM, rim);
    const tip = at(sh.az, len);
    ctx.strokeStyle = "rgba(148,163,184,0.95)";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(tip.x, tip.y);
    ctx.stroke();
    ctx.lineCap = "butt";
    if (sh.length * perM > rim) {
      // Arrowhead: the shadow runs on past the edge of the drawing.
      const a = (sh.az * Math.PI) / 180;
      const ux = Math.sin(a);
      const uy = -Math.cos(a);
      ctx.fillStyle = "rgba(148,163,184,0.95)";
      ctx.beginPath();
      ctx.moveTo(tip.x + ux * 8, tip.y + uy * 8);
      ctx.lineTo(tip.x - uy * 7, tip.y + ux * 7);
      ctx.lineTo(tip.x + uy * 7, tip.y - ux * 7);
      ctx.closePath();
      ctx.fill();
    }
    // The Sun in its compass direction, drawn like a sky map seen from above:
    // on the rim at the horizon, at the centre when straight overhead.
    const sp = at(s.az, (rim * (90 - s.alt)) / 90);
    const g = ctx.createRadialGradient(sp.x, sp.y, 1, sp.x, sp.y, 14);
    g.addColorStop(0, "#fff7c2");
    g.addColorStop(0.5, "#fbbf24");
    g.addColorStop(1, "rgba(251,191,36,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 14, 0, Math.PI * 2);
    ctx.fill();
  }
  // The stick, seen from above.
  ctx.fillStyle = "#fde68a";
  ctx.strokeStyle = "#0a0d1c";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillText("Seen from above", 8, 16);
  ctx.fillStyle = "rgba(103,232,249,0.7)";
  ctx.fillText("● shadow tip each hour", 8, h - 8);
  ctx.fillStyle = "rgba(253,224,71,0.75)";
  ctx.fillText("Sun: nearer the middle is higher", 8, h - 22);
  if (!sh) {
    ctx.textAlign = "center";
    ctx.font = "12px system-ui, sans-serif";
    const msg = "The Sun has set. No shadow.";
    const tw = ctx.measureText(msg).width;
    ctx.fillStyle = "rgba(10,13,28,0.85)";
    ctx.fillRect(cx - tw / 2 - 8, cy + 22, tw + 16, 22);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText(msg, cx, cy + 37);
    ctx.textAlign = "left";
  }
}
