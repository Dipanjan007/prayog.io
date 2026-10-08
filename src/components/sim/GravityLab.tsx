"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  C,
  FALLERS,
  SUN,
  WORLDS,
  WORLD_IDS,
  cannonOutcome,
  circularSpeed,
  dragK,
  escapeSpeed,
  fallDistance,
  fallTime,
  gravForce,
  orbitStep,
  schwarzschildRadius,
  specificEnergy,
  weight,
  worldG,
  type CannonOutcome,
  type OrbitState,
  type WorldId,
} from "@/lib/sim/gravity";
import { fitCanvas } from "./canvas";

export type GravityMode = "pull" | "drop" | "cannon" | "squeeze";
export type SqueezeBody = "earth" | "sun";

export interface DropResult {
  id: number;
  world: WorldId;
  air: boolean;
  tBall: number;
  tFeather: number;
  /** Both landed within 0.02 s of each other. */
  together: boolean;
}

export interface ShotResult {
  id: number;
  /** Launch speed, km/s. */
  v: number;
  outcome: CannonOutcome;
  /** For a ball that fell back: distance along the ground from the mountain, km. */
  landedKm: number | null;
}

export type GravityReading =
  | { mode: "pull"; m1: number; m2: number; r: number; F: number }
  | { mode: "drop"; world: WorldId; air: boolean; mass: number; g: number; weight: number; mystery: boolean; drop: DropResult | null }
  | { mode: "cannon"; v: number; shot: ShotResult | null }
  | { mode: "squeeze"; body: SqueezeBody; radius: number; vEsc: number; blackHole: boolean };

interface Props {
  onReading?: (r: GravityReading) => void;
  /** Challenge: Drop mode on a hidden world with a fixed mass on the scale (kg). */
  mystery?: { world: WorldId; mass: number } | null;
}

/** Pull mode units: m₁ in 10²⁴ kg, m₂ in 10²² kg, r in 10⁵ km. */
const M1_UNIT = 1e24;
const M2_UNIT = 1e22;
const R_UNIT = 1e8;
const PULL_DEFAULT = { m1: 6, m2: 7, r: 4 };
/** Drop height, m. */
const DROP_H = 2;
/** The cannon sits on an imaginary mountain 100 km tall, above the air. */
const MOUNTAIN_H = 100e3;
/** Simulated seconds per real second for the cannon (a low orbit takes about 6 s). */
const CANNON_SPEEDUP = 900;
/** Squeeze slider: radius = R₀ × 10^(−s/10). */
const SQUEEZE_MAX = 100;

const COL_A = "#22d3ee";
const COL_B = "#a78bfa";
const COL_F = "#f472b6";
const FONT = "11px system-ui, sans-serif";

const SKY: Record<WorldId, string> = {
  earth: "rgba(56,130,246,0.16)",
  moon: "rgba(0,0,0,0)",
  mars: "rgba(234,88,12,0.16)",
  jupiter: "rgba(217,160,90,0.18)",
};
const GROUND: Record<WorldId, string> = {
  earth: "#3f6212",
  moon: "#6b7280",
  mars: "#9a3412",
  jupiter: "#a16207",
};

/** Fixed background stars, in 0..1 coordinates. */
const STARS = (() => {
  let s = 777;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  return Array.from({ length: 70 }, () => ({ x: rnd(), y: rnd(), a: 0.15 + rnd() * 0.45, r: rnd() < 0.15 ? 1.3 : 0.8 }));
})();

type DropAnim = { start: number; g: number; kB: number; kF: number; tB: number; tF: number; slow: number; reported: boolean; world: WorldId; air: boolean };
type ShotAnim = {
  s: OrbitState;
  v: number;
  M: number;
  R: number;
  trail: [number, number][];
  swept: number;
  lastAngle: number;
  outcome: CannonOutcome;
  /** Still moving (stops on landing or once far away). */
  flying: boolean;
  /** Something to report has happened: landed, finished a lap, or left the view. */
  event: boolean;
  reported: boolean;
  landedKm: number | null;
};

export default function GravityLab({ onReading, mystery = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modeSel, setModeSel] = useState<GravityMode>("pull");
  // Pull
  const [m1, setM1] = useState(PULL_DEFAULT.m1);
  const [m2, setM2] = useState(PULL_DEFAULT.m2);
  const [r, setR] = useState(PULL_DEFAULT.r);
  const [pinned, setPinned] = useState(() => gravForce(PULL_DEFAULT.m1 * M1_UNIT, PULL_DEFAULT.m2 * M2_UNIT, PULL_DEFAULT.r * R_UNIT));
  // Drop
  const [worldSel, setWorldSel] = useState<WorldId>("earth");
  const [airSel, setAirSel] = useState(true);
  const [massSel, setMassSel] = useState(45);
  const [slow, setSlow] = useState(false);
  const [drop, setDrop] = useState<DropResult | null>(null);
  const [dropping, setDropping] = useState(false);
  // Cannon
  const [vTenths, setVTenths] = useState(50);
  const [shot, setShot] = useState<ShotResult | null>(null);
  const [shots, setShots] = useState<ShotResult[]>([]);
  // Squeeze
  const [body, setBody] = useState<SqueezeBody>("earth");
  const [squeeze, setSqueeze] = useState(0);

  const dropRef = useRef<DropAnim | null>(null);
  const shotRef = useRef<ShotAnim | null>(null);
  const ids = useRef(0);
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const mode: GravityMode = mystery ? "drop" : modeSel;
  const world: WorldId = mystery ? mystery.world : worldSel;
  const air = mystery ? true : airSel;
  const mass = mystery ? mystery.mass : massSel;
  const g = worldG(world);
  const W = weight(mass, g);
  const F = gravForce(m1 * M1_UNIT, m2 * M2_UNIT, r * R_UNIT);
  const v = vTenths / 10;
  const sq = body === "earth" ? { label: "Earth", M: WORLDS.earth.M, R0: WORLDS.earth.R } : { label: "Sun", M: SUN.M, R0: SUN.R };
  const radius = sq.R0 * 10 ** (-squeeze / 10);
  const rs = schwarzschildRadius(sq.M);
  const blackHole = radius <= rs;
  const vEsc = escapeSpeed(sq.M, radius);

  const params = useRef({ mode, m1, m2, r, F, world, air, mass, W, mystery: !!mystery, radius, rs, sqLabel: sq.label, R0: sq.R0, blackHole, vEsc });
  useEffect(() => {
    params.current = { mode, m1, m2, r, F, world, air, mass, W, mystery: !!mystery, radius, rs, sqLabel: sq.label, R0: sq.R0, blackHole, vEsc };
  });

  // Changing the mode, world or air puts the ball and feather back at the top.
  const resetDrop = () => {
    dropRef.current = null;
    setDropping(false);
    setDrop(null);
  };
  const pickMode = (m: GravityMode) => {
    setModeSel(m);
    resetDrop();
  };
  const pickWorld = (id: WorldId) => {
    setWorldSel(id);
    resetDrop();
  };
  const toggleAir = () => {
    setAirSel(!airSel);
    resetDrop();
  };

  const startDrop = () => {
    const kB = air ? dragK(WORLDS[world].air, FALLERS.ball.dragPerDensity) : 0;
    const kF = air ? dragK(WORLDS[world].air, FALLERS.feather.dragPerDensity) : 0;
    dropRef.current = {
      start: performance.now(),
      g,
      kB,
      kF,
      tB: fallTime(DROP_H, g, kB),
      tF: fallTime(DROP_H, g, kF),
      slow: slow ? 4 : 1,
      reported: false,
      world,
      air,
    };
    setDropping(true);
  };

  const fire = () => {
    setShot(null);
    const E = WORLDS.earth;
    const r0 = E.R + MOUNTAIN_H;
    shotRef.current = {
      s: { x: 0, y: r0, vx: v * 1000, vy: 0 },
      v,
      M: E.M,
      R: E.R,
      trail: [[0, r0]],
      swept: 0,
      lastAngle: Math.atan2(r0, 0),
      outcome: cannonOutcome(v * 1000, E.M, E.R, MOUNTAIN_H),
      flying: true,
      event: false,
      reported: false,
      landedKm: null,
    };
  };

  // ---------- Animation loop ----------
  useEffect(() => {
    const c = canvasRef.current!;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const P = params.current;
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (!w || !h) return;
      const ctx = fitCanvas(c, w, h);
      ctx.clearRect(0, 0, w, h);
      ctx.font = FONT;

      if (P.mode === "pull") drawPull(ctx, w, h, P.m1, P.m2, P.r, P.F);
      else if (P.mode === "drop") {
        const d = dropRef.current;
        let tau: number | null = null;
        if (d) {
          tau = (now - d.start) / 1000 / d.slow;
          if (tau >= Math.max(d.tB, d.tF) && !d.reported) {
            d.reported = true;
            const id = ++ids.current;
            setDrop({ id, world: d.world, air: d.air, tBall: d.tB, tFeather: d.tF, together: Math.abs(d.tB - d.tF) < 0.02 });
            setDropping(false);
          }
        }
        drawDrop(ctx, w, h, P.world, P.mystery, P.mass, P.W, d, tau);
      } else if (P.mode === "cannon") {
        const s = shotRef.current;
        if (s && s.flying) {
          // Far from Earth the ball crawls, so the clock runs faster there too.
          const far = Math.hypot(s.s.x, s.s.y) / (WORLDS.earth.R + MOUNTAIN_H);
          advanceShot(s, dt * CANNON_SPEEDUP * Math.max(1, far ** 1.5), w, h);
        }
        if (s && s.event && !s.reported) {
          s.reported = true;
          const res = { id: ++ids.current, v: s.v, outcome: s.outcome, landedKm: s.landedKm };
          setShot(res);
          setShots((prev) => [...prev.filter((p) => p.v !== res.v), res].slice(-12));
        }
        drawCannon(ctx, w, h, s);
      } else drawSqueeze(ctx, w, h, P.sqLabel, P.R0, P.radius, P.rs, P.vEsc);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ---------- Readings ----------
  useEffect(() => {
    if (mode === "pull") onReadingRef.current?.({ mode, m1, m2, r, F });
  }, [mode, m1, m2, r, F]);
  useEffect(() => {
    if (mode === "drop") onReadingRef.current?.({ mode, world, air, mass, g, weight: W, mystery: !!mystery, drop });
  }, [mode, world, air, mass, g, W, mystery, drop]);
  useEffect(() => {
    if (mode === "cannon") onReadingRef.current?.({ mode, v, shot });
  }, [mode, v, shot]);
  useEffect(() => {
    if (mode === "squeeze") onReadingRef.current?.({ mode, body, radius, vEsc, blackHole });
  }, [mode, body, radius, vEsc, blackHole]);

  const ratio = F / pinned;
  const r0 = WORLDS.earth.R + MOUNTAIN_H;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!mystery && (
        <div className="grid grid-cols-4 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["pull", "drop", "cannon", "squeeze"] as const).map((m) => (
            <button key={m} onClick={() => pickMode(m)} className={`rounded-xl py-2 ${mode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m === "pull" ? "Pull" : m === "drop" ? "Drop" : m === "cannon" ? "Cannon" : "Squeeze"}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-72 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={
          mode === "pull"
            ? `Two bodies of ${m1} × 10^24 kg and ${m2} × 10^22 kg, ${r} × 10^5 km apart, pulling each other with equal and opposite force arrows`
            : mode === "drop"
              ? `A cricket ball and a feather dropped from 2 metres ${mystery ? "on a mystery world" : `on ${WORLDS[world].label}`}, next to a ${mass} kg astronaut standing on a weighing scale`
              : mode === "cannon"
                ? `Newton's cannon on a mountain on Earth firing a ball sideways at ${v} km/s`
                : `${sq.label} squeezed to a radius of ${fmtLen(radius)}, with its escape speed compared with the speed of light`
        }
      />

      {mode === "pull" && (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Stat label="Force on each" value={sci(F, 2) + " N"} />
            <Stat label="Compared with 📌" value={`× ${fmtRatio(ratio)}`} />
          </div>
          <p className="text-center text-xs text-white/50 tabular-nums">
            F = G m₁m₂ ÷ r² = 6.674 × 10⁻¹¹ × ({m1} × 10²⁴) × ({m2} × 10²²) ÷ ({r} × 10⁸ m)²
          </p>
          <Slider label="Mass m₁ (big body)" value={`${m1} × 10²⁴ kg`} min={1} max={8} step={1} v={m1} onChange={setM1} />
          <Slider label="Mass m₂ (small body)" value={`${m2} × 10²² kg`} min={1} max={8} step={1} v={m2} onChange={setM2} />
          <Slider label="Distance r between centres" value={`${r} × 10⁵ km`} min={1} max={8} step={1} v={r} onChange={setR} />
          <button className="btn-ghost !py-2 text-sm" onClick={() => setPinned(F)}>
            📌 Pin this force to compare
          </button>
          <p className="text-center text-xs text-white/40">Earth and the Moon are close to m₁ = 6, m₂ = 7, r = 4.</p>
        </>
      )}

      {mode === "drop" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Mass" value={`${mass} kg`} />
            <Stat label="Weight" value={`${Math.round(W)} N`} />
            <Stat label="Gravity" value={mystery ? "g = ?" : `${g.toFixed(2)} m/s²`} />
          </div>
          {drop && !dropping && (
            <p className={`text-center text-sm ${drop.together ? "text-lime-300" : "text-amber-200"}`}>
              {drop.together
                ? `They landed together after ${drop.tBall.toFixed(2)} s.`
                : `Ball: ${drop.tBall.toFixed(2)} s. Feather: ${drop.tFeather.toFixed(2)} s. The air slowed the feather.`}
            </p>
          )}
          {!mystery && (
            <>
              <Choice options={WORLD_IDS.map((id) => ({ id, label: WORLDS[id].label }))} value={worldSel} onChange={pickWorld} />
              <Slider label="Mass on the scale" value={`${massSel} kg`} min={1} max={100} step={1} v={massSel} onChange={setMassSel} />
            </>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-primary !py-2 text-sm disabled:opacity-50" onClick={startDrop} disabled={dropping}>
              ⬇ Drop both
            </button>
            <Toggle on={slow} onClick={() => setSlow(!slow)}>
              {slow ? "Slow-mo on" : "Slow-mo off"}
            </Toggle>
          </div>
          {!mystery && (
            <Toggle on={airSel} disabled={WORLDS[world].air === 0} onClick={toggleAir}>
              {WORLDS[world].air === 0 ? "No air on the Moon" : airSel ? "💨 Air on" : "Air off (vacuum)"}
            </Toggle>
          )}
        </>
      )}

      {mode === "cannon" && (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Stat label="Launch speed" value={`${v.toFixed(1)} km/s`} />
            <Stat label="Result" value={shot ? outcomeText(shot) : "–"} />
          </div>
          <SpeedStrip v={v} shots={shots} />
          <Slider label="Sideways speed" value={`${v.toFixed(1)} km/s`} min={10} max={120} step={1} v={vTenths} onChange={setVTenths} />
          <button className="btn-primary !py-2 text-sm" onClick={fire}>
            💥 Fire the cannon
          </button>
          <p className="text-center text-xs text-white/40">
            The mountain is {MOUNTAIN_H / 1000} km tall, above the air. Here orbit speed is √(GM ÷ r) = {(circularSpeed(WORLDS.earth.M, r0) / 1000).toFixed(2)} km/s.
          </p>
        </>
      )}

      {mode === "squeeze" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Radius" value={fmtLen(radius)} />
            <Stat label="Escape km/s" value={blackHole ? "> light" : fmtKms(vEsc)} />
            <Stat label="Of light speed" value={blackHole ? "≥ 100%" : `${pct(vEsc / C)}`} />
          </div>
          <p className={`text-center text-sm ${blackHole ? "text-pink-300" : "text-white/60"}`}>
            {blackHole
              ? `Black hole! Inside ${fmtLen(rs)} not even light can get out.`
              : `Same mass, ${sizeLike(2 * radius)}. Squeeze below ${fmtLen(rs)} to trap light.`}
          </p>
          <Choice
            options={[
              { id: "earth" as const, label: "Earth" },
              { id: "sun" as const, label: "Sun" },
            ]}
            value={body}
            onChange={setBody}
          />
          <Slider label={`Squeeze the ${sq.label} (mass stays the same)`} value={fmtLen(radius)} min={0} max={SQUEEZE_MAX} step={1} v={squeeze} onChange={setSqueeze} />
        </>
      )}
    </div>
  );
}

// ---------- Cannon motion ----------

/** Radial drawing scale: the 100 km mountain is drawn much taller than it really is, so it can be seen. */
function cannonView(w: number, h: number) {
  const Rpx = Math.min(w, h) * 0.19;
  const mountainPx = 14;
  return { cx: w / 2, cy: h * 0.44, Rpx, mountainPx, s: Rpx / WORLDS.earth.R };
}

function cannonPx(w: number, h: number, x: number, y: number) {
  const V = cannonView(w, h);
  const r = Math.hypot(x, y);
  const R = WORLDS.earth.R;
  const rd = r <= R + MOUNTAIN_H ? V.Rpx + (Math.max(0, r - R) / MOUNTAIN_H) * V.mountainPx : r * V.s + (V.mountainPx - MOUNTAIN_H * V.s);
  const k = r > 0 ? rd / r : 0;
  return [V.cx + x * k, V.cy - y * k] as const;
}

function advanceShot(s: ShotAnim, simDt: number, w: number, h: number) {
  const n = Math.max(1, Math.ceil(simDt / 2));
  const dt = simDt / n;
  for (let i = 0; i < n; i++) {
    s.s = orbitStep(s.s, s.M, dt);
    const rr = Math.hypot(s.s.x, s.s.y);
    const ang = Math.atan2(s.s.y, s.s.x);
    let d = ang - s.lastAngle;
    if (d > Math.PI) d -= 2 * Math.PI;
    if (d < -Math.PI) d += 2 * Math.PI;
    s.swept += d;
    s.lastAngle = ang;
    if (rr <= s.R) {
      // Land on the surface.
      s.s = { x: (s.s.x / rr) * s.R, y: (s.s.y / rr) * s.R, vx: 0, vy: 0 };
      s.trail.push([s.s.x, s.s.y]);
      s.outcome = "fell";
      s.landedKm = (Math.abs(s.swept) * s.R) / 1000;
      s.flying = false;
      s.event = true;
      return;
    }
    // One full lap round the Earth: an orbit.
    if (Math.abs(s.swept) >= 2 * Math.PI) s.event = true;
  }
  s.trail.push([s.s.x, s.s.y]);
  if (s.trail.length > 3000) s.trail.splice(0, s.trail.length - 3000);
  const [px, py] = cannonPx(w, h, s.s.x, s.s.y);
  const off = px < -40 || px > w + 40 || py < -40 || py > h + 40;
  // Gone out of view: it escapes if it has enough energy, otherwise it is on a big orbit and will come back.
  if (off && !s.event) {
    s.outcome = specificEnergy(s.s, s.M) >= 0 ? "escape" : "orbit";
    s.event = true;
  }
  if (Math.hypot(s.s.x, s.s.y) > 80 * s.R) s.flying = false;
}

function outcomeText(s: ShotResult) {
  if (s.outcome === "fell") return `Fell, ${Math.round(s.landedKm ?? 0).toLocaleString("en-IN")} km`;
  if (s.outcome === "orbit") return "Orbit!";
  return "Escaped!";
}

// ---------- Formatting ----------

const SUP: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
function sup(n: number) {
  return String(n)
    .split("")
    .map((ch) => SUP[ch] ?? ch)
    .join("");
}

/** 1.75e20 → "1.75 × 10²⁰". */
export function sci(x: number, digits = 2) {
  if (x === 0) return "0";
  let e = Math.floor(Math.log10(Math.abs(x)));
  let m = x / 10 ** e;
  if (Number(m.toFixed(digits)) >= 10) {
    m /= 10;
    e += 1;
  }
  return `${m.toFixed(digits)} × 10${sup(e)}`;
}

function fmtRatio(x: number) {
  for (let n = 2; n <= 64; n++) if (Math.abs(x - 1 / n) < 1e-9) return `1/${n}`;
  if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
  return x < 1 ? x.toFixed(3) : x.toFixed(2);
}

export function fmtLen(m: number) {
  if (m >= 1000) return `${Math.round(m / 1000).toLocaleString("en-IN")} km`;
  if (m >= 1) return `${m.toFixed(m < 10 ? 1 : 0)} m`;
  if (m >= 0.01) return `${(m * 100).toFixed(1)} cm`;
  return `${(m * 1000).toFixed(1)} mm`;
}

/** Speed in km/s, number only. */
function fmtKms(v: number) {
  const km = v / 1000;
  return km < 10 ? km.toFixed(1) : Math.round(km).toLocaleString("en-IN");
}

function pct(x: number) {
  const p = x * 100;
  if (p >= 10) return `${p.toFixed(0)}%`;
  if (p >= 0.1) return `${p.toFixed(1)}%`;
  return `${p.toFixed(3)}%`;
}

/** What a ball of this diameter is about as big as. */
function sizeLike(d: number) {
  if (d > 1e6) return "still planet-sized";
  if (d > 30e3) return "about as wide as a big city";
  if (d > 1500) return "about as wide as a small town";
  if (d > 100) return "about the size of a cricket ground";
  if (d > 3) return "about the size of a bus";
  if (d > 0.15) return "about the size of a football";
  if (d > 0.04) return "about the size of a cricket ball";
  return "smaller than a marble";
}

// ---------- Drawing ----------

function stars(ctx: CanvasRenderingContext2D, w: number, h: number, alpha = 1) {
  for (const s of STARS) {
    ctx.fillStyle = `rgba(255,255,255,${s.a * alpha})`;
    ctx.fillRect(s.x * w, s.y * h, s.r, s.r);
  }
}

function arrow(ctx: CanvasRenderingContext2D, x0: number, y: number, x1: number, color: string) {
  const dir = Math.sign(x1 - x0) || 1;
  const len = Math.abs(x1 - x0);
  const head = Math.min(8, len * 0.6);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1 - dir * head, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x1 - dir * head, y - head * 0.7);
  ctx.lineTo(x1 - dir * head, y + head * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
}

function ball(ctx: CanvasRenderingContext2D, x: number, y: number, rad: number, color: string) {
  const grd = ctx.createRadialGradient(x - rad * 0.35, y - rad * 0.35, rad * 0.1, x, y, rad);
  grd.addColorStop(0, "#ffffff");
  grd.addColorStop(0.25, color);
  grd.addColorStop(1, "rgba(10,13,28,0.9)");
  ctx.fillStyle = grd;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(x, y, rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawPull(ctx: CanvasRenderingContext2D, w: number, h: number, m1: number, m2: number, r: number, F: number) {
  stars(ctx, w, h, 0.7);
  const RA = 11 * Math.cbrt(m1);
  const RB = 6 * Math.cbrt(m2);
  const xA = 16 + 22;
  const u = (w - 16 - 12 - xA) / 8;
  const xB = xA + r * u;
  const cy = h * 0.42;
  // Arrow scale: the default pair gets 34 px; arrows are capped at half the gap between the centres.
  const Fdef = gravForce(PULL_DEFAULT.m1 * M1_UNIT, PULL_DEFAULT.m2 * M2_UNIT, PULL_DEFAULT.r * R_UNIT);
  const want = (40 * F) / Fdef;
  const cap = Math.max(0, (xB - RB - (xA + RA)) / 2 - 3);
  const L = Math.min(want, cap);
  ball(ctx, xA, cy, RA, COL_A);
  ball(ctx, xB, cy, RB, COL_B);
  if (L >= 2) {
    arrow(ctx, xA + RA + 1, cy, xA + RA + 1 + L, COL_F);
    arrow(ctx, xB - RB - 1, cy, xB - RB - 1 - L, COL_F);
  }
  ctx.textAlign = "center";
  ctx.fillStyle = COL_F;
  ctx.fillText(want > cap ? "pull arrows too long to fit here" : "equal and opposite pulls", w / 2, cy - 30);

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(`m₁ = ${m1} × 10²⁴ kg`, Math.max(xA, 52), cy + 26 + 22);
  ctx.fillText(`m₂ = ${m2} × 10²² kg`, Math.min(Math.max(xB, xA + 120), w - 52), cy + 26 + 38);

  // Distance between centres.
  const dy = h - 24;
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(xA, cy + RA + 2);
  ctx.lineTo(xA, dy);
  ctx.moveTo(xB, cy + RB + 2);
  ctx.lineTo(xB, dy);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(xA, dy);
  ctx.lineTo(xB, dy);
  ctx.stroke();
  const text = `r = ${r} × 10⁵ km`;
  const tw = ctx.measureText(text).width;
  const tx = Math.min(w - tw / 2 - 4, Math.max(tw / 2 + 4, (xA + xB) / 2));
  ctx.fillStyle = "#0a0d1c";
  ctx.fillRect(tx - tw / 2 - 3, dy - 7, tw + 6, 14);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(text, tx, dy + 4);
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillText("Sizes not to scale", 8, 16);
}

function drawFeather(ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.fillStyle = "rgba(226,232,240,0.55)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-11, 0);
  ctx.quadraticCurveTo(0, -7, 11, 0);
  ctx.quadraticCurveTo(0, 5, -11, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-14, 1);
  ctx.lineTo(11, 0);
  ctx.stroke();
  ctx.restore();
}

function drawDrop(ctx: CanvasRenderingContext2D, w: number, h: number, world: WorldId, mystery: boolean, mass: number, W: number, d: DropAnim | null, tau: number | null) {
  ctx.fillStyle = mystery ? "rgba(148,163,184,0.08)" : SKY[world];
  ctx.fillRect(0, 0, w, h);
  if (mystery || world === "moon" || world === "mars") stars(ctx, w, h, world === "moon" ? 1 : 0.5);
  const ground = h - 30;
  const top = 46;
  const pxm = (ground - top) / DROP_H;
  ctx.fillStyle = mystery ? "#475569" : GROUND[world];
  ctx.fillRect(0, ground, w, h - ground);

  // Ruler.
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 1;
  ctx.textAlign = "left";
  ctx.beginPath();
  ctx.moveTo(14, top);
  ctx.lineTo(14, ground);
  for (let m = 0; m <= DROP_H + 1e-9; m += 0.5) {
    const y = ground - m * pxm;
    ctx.moveTo(14, y);
    ctx.lineTo(20, y);
  }
  ctx.stroke();
  ctx.fillText("2 m", 22, top + 4);
  ctx.fillText("0", 22, ground - 2);

  const split = Math.max(w * 0.56, w - 170);
  const xBall = split * 0.42;
  const xFeather = split * 0.78;
  // Shelf they drop from.
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(xBall - 22, top - 10);
  ctx.lineTo(xFeather + 22, top - 10);
  ctx.stroke();

  let yB = 0;
  let yF = 0;
  let tilt = 0;
  if (d && tau !== null) {
    const tb = Math.min(tau, d.tB);
    const tf = Math.min(tau, d.tF);
    yB = Math.min(DROP_H, fallDistance(tb, d.g, d.kB));
    yF = Math.min(DROP_H, fallDistance(tf, d.g, d.kF));
    if (d.kF > 0 && tau < d.tF) tilt = Math.sin(tau * 5) * 0.5;
  }
  const ballY = top + yB * pxm - 6;
  const featherY = top + yF * pxm - 4;
  ball(ctx, xBall, Math.min(ballY, ground - 7), 7, "#ef4444");
  drawFeather(ctx, xFeather + (tilt ? Math.sin(tau! * 3) * 6 : 0), Math.min(featherY, ground - 4), tilt);
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("ball", xBall, ground + 16);
  ctx.fillText("feather", xFeather, ground + 16);
  if (d && tau !== null) {
    ctx.fillStyle = "#fde047";
    if (tau >= d.tB) ctx.fillText(`${d.tB.toFixed(2)} s`, xBall, ground - 18);
    if (tau >= d.tF) ctx.fillText(`${d.tF.toFixed(2)} s`, xFeather, ground - 18);
  }

  // Timer and world label.
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = "#fde047";
  const shown = d && tau !== null ? Math.min(tau, Math.max(d.tB, d.tF)) : 0;
  ctx.fillText(`⏱ ${shown.toFixed(2)} s`, 8, 18);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(mystery ? "Planet ?" : WORLDS[world].label, w - 8, 18);
  ctx.font = FONT;
  if (d && d.slow > 1 && tau !== null && tau < Math.max(d.tB, d.tF)) {
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("slow motion ×4", w - 8, 32);
  }

  // Astronaut on a scale.
  const sx = (split + w) / 2 + 4;
  const scaleTop = ground - 12;
  ctx.fillStyle = "#334155";
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(sx - 30, scaleTop, 60, 12, 3);
  ctx.fill();
  ctx.stroke();
  // Body: helmet, suit and schoolbag.
  const feet = scaleTop;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(sx - 6, feet);
  ctx.lineTo(sx - 3, feet - 20);
  ctx.moveTo(sx + 6, feet);
  ctx.lineTo(sx + 3, feet - 20);
  ctx.moveTo(sx, feet - 20);
  ctx.lineTo(sx, feet - 44);
  ctx.moveTo(sx, feet - 40);
  ctx.lineTo(sx - 10, feet - 28);
  ctx.moveTo(sx, feet - 40);
  ctx.lineTo(sx + 10, feet - 28);
  ctx.stroke();
  ctx.fillStyle = "#a78bfa";
  ctx.fillRect(sx - 13, feet - 44, 7, 15);
  ctx.strokeStyle = COL_A;
  ctx.fillStyle = "rgba(34,211,238,0.15)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(sx, feet - 52, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Display.
  const boxY = Math.max(40, feet - 100);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(sx - 44, boxY, 88, 36, 6);
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.font = "bold 15px system-ui, sans-serif";
  ctx.fillStyle = "#a3e635";
  ctx.fillText(`${Math.round(W)} N`, sx, boxY + 17);
  ctx.font = FONT;
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText(`mass ${mass} kg`, sx, boxY + 30);
  ctx.textAlign = "left";
}

function drawCannon(ctx: CanvasRenderingContext2D, w: number, h: number, s: ShotAnim | null) {
  stars(ctx, w, h);
  const V = cannonView(w, h);
  // Earth with a thin air layer.
  ctx.fillStyle = "rgba(56,189,248,0.10)";
  ctx.beginPath();
  ctx.arc(V.cx, V.cy, V.Rpx + 4, 0, Math.PI * 2);
  ctx.fill();
  const grd = ctx.createRadialGradient(V.cx - V.Rpx * 0.3, V.cy - V.Rpx * 0.3, V.Rpx * 0.1, V.cx, V.cy, V.Rpx);
  grd.addColorStop(0, "#38bdf8");
  grd.addColorStop(0.6, "#1d4ed8");
  grd.addColorStop(1, "#0f172a");
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(V.cx, V.cy, V.Rpx, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(132,204,22,0.55)";
  ctx.beginPath();
  ctx.ellipse(V.cx - V.Rpx * 0.25, V.cy - V.Rpx * 0.1, V.Rpx * 0.3, V.Rpx * 0.4, 0.4, 0, Math.PI * 2);
  ctx.ellipse(V.cx + V.Rpx * 0.4, V.cy + V.Rpx * 0.35, V.Rpx * 0.22, V.Rpx * 0.25, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Mountain and cannon.
  const peak = V.cy - V.Rpx - V.mountainPx;
  ctx.fillStyle = "#78716c";
  ctx.beginPath();
  ctx.moveTo(V.cx - 13, V.cy - V.Rpx + 3);
  ctx.lineTo(V.cx, peak);
  ctx.lineTo(V.cx + 13, V.cy - V.Rpx + 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(V.cx - 4, peak - 4, 10, 4);

  if (s) {
    ctx.strokeStyle = s.outcome === "fell" ? "#fbbf24" : s.outcome === "orbit" ? "#a3e635" : COL_F;
    ctx.lineWidth = 2;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    s.trail.forEach(([x, y], i) => {
      const [px, py] = cannonPx(w, h, x, y);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    const [bx, by] = cannonPx(w, h, s.s.x, s.s.y);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ball(ctx, bx, by, 4, "#fde047");
  }
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillText(`Earth · time sped up ×${CANNON_SPEEDUP} or more`, 8, 16);
  ctx.fillText("Mountain drawn far taller than real", 8, h - 10);
}

function drawSqueeze(ctx: CanvasRenderingContext2D, w: number, h: number, label: string, R0: number, R: number, rs: number, vEsc: number) {
  stars(ctx, w, h);
  const bh = R <= rs;
  const cx = w * 0.3;
  const cy = h * 0.45;
  const R0px = Math.min(w * 0.24, h * 0.34);
  // Original size.
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, R0px, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText(`${label} at full size`, cx, cy - R0px - 6);
  const col = label === "Sun" ? "#fbbf24" : COL_A;
  if (bh) {
    ctx.fillStyle = "#000";
    ctx.shadowColor = "#fb923c";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else ball(ctx, cx, cy, Math.max(1.5, (R0px * R) / R0), col);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText(`same mass, radius ${fmtLen(R)}`, cx, cy + R0px + 16);

  // Zoomed view: the body and the light-trapping radius at the same scale.
  const zx = w * 0.76;
  const zy = cy;
  const zr = Math.min(w * 0.2, h * 0.3);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(zx, zy, zr + 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("zoomed in", zx, zy - zr - 14);
  const big = Math.max(R, rs);
  const bodyPx = (R / big) * zr;
  const rsPx = Math.max(1, (rs / big) * zr);
  if (bh) {
    const g = ctx.createRadialGradient(zx, zy, rsPx * 0.9, zx, zy, rsPx * 1.35);
    g.addColorStop(0, "rgba(251,146,60,0.9)");
    g.addColorStop(1, "rgba(251,146,60,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(zx, zy, rsPx * 1.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(zx, zy, rsPx, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ball(ctx, zx, zy, Math.max(2, bodyPx), col);
    // Light rays escaping.
    ctx.strokeStyle = "rgba(253,224,71,0.8)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r1 = Math.max(2, bodyPx) + 3;
      const r2 = r1 + 10 + 10 * (1 - Math.min(1, vEsc / C));
      ctx.beginPath();
      ctx.moveTo(zx + Math.cos(a) * r1, zy + Math.sin(a) * r1);
      ctx.lineTo(zx + Math.cos(a) * r2, zy + Math.sin(a) * r2);
      ctx.stroke();
    }
    if (rsPx >= 2) {
      ctx.strokeStyle = "#fb923c";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(zx, zy, rsPx, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  ctx.fillStyle = "#fb923c";
  ctx.fillText(bh ? "light trapped" : rsPx >= 2 ? "orange ring: 2GM ÷ c²" : `2GM ÷ c² = ${fmtLen(rs)}`, zx, zy + zr + 22);

  // Escape speed bar on a log scale, from 1 km/s to the speed of light.
  const bx = 14;
  const bw = w - 28;
  const by = h - 22;
  const frac = Math.max(0, Math.min(1, Math.log10(vEsc / 1000) / Math.log10(C / 1000)));
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(bx, by, bw, 8);
  ctx.fillStyle = bh ? "#f472b6" : "#22d3ee";
  ctx.fillRect(bx, by, bw * frac, 8);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.textAlign = "left";
  ctx.fillText("escape speed", bx, by - 4);
  ctx.textAlign = "right";
  ctx.fillText("light 300,000 km/s", bx + bw, by - 4);
  ctx.textAlign = "left";
}

// ---------- Controls ----------

function SpeedStrip({ v, shots }: { v: number; shots: ShotResult[] }) {
  const pos = (x: number) => ((x - 1) / 11) * 100;
  const col = (o: CannonOutcome) => (o === "fell" ? "bg-amber-300" : o === "orbit" ? "bg-lime-300" : "bg-pink-400");
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex justify-between text-xs text-white/50">
        <span>Your shots</span>
        <span>
          <span className="text-amber-200">● fell</span> <span className="text-lime-300">● orbit</span> <span className="text-pink-300">● escaped</span>
        </span>
      </div>
      <div className="relative mt-2 h-4 rounded-full bg-white/10">
        {shots.map((s) => (
          <span key={s.v} className={`absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${col(s.outcome)}`} style={{ left: `${pos(s.v)}%` }} />
        ))}
        <span className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white" style={{ left: `${pos(v)}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-white/40 tabular-nums">
        {[1, 3, 5, 7, 9, 11].map((k) => (
          <span key={k}>{k}</span>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="truncate text-[11px] uppercase tracking-wider text-white/50">{label}</div>
      <div className="truncate font-display text-base tabular-nums sm:text-lg">{value}</div>
    </div>
  );
}

function Slider({ label, value, min, max, step, v, onChange }: { label: string; value: string; min: number; max: number; step: number; v: number; onChange: (n: number) => void }) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex justify-between gap-2 text-sm">
        <span className="text-white/60">{label}</span>
        <span className="shrink-0 tabular-nums text-white">{value}</span>
      </div>
      <input type="range" className="range mt-2 w-full" min={min} max={max} step={step} value={v} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Toggle({ on, disabled, onClick, children }: { on: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`flex-1 rounded-xl border px-3 py-2 text-sm whitespace-nowrap disabled:opacity-50 ${on ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
    >
      {children}
    </button>
  );
}

function Choice<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`flex-1 rounded-xl border px-2 py-2 text-sm whitespace-nowrap ${value === o.id ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
