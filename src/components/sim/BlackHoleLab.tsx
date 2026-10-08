"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BODIES,
  C,
  CAPTURE_B,
  CHANDRASEKHAR_LIMIT,
  G_EARTH,
  M_SUN,
  NEUTRON_STAR_LIMIT,
  PHOTON_SPHERE,
  escapeSpeed,
  formatLength,
  lightPath,
  remnantFate,
  schwarzschildRadius,
  sci,
  sizeLike,
  surfaceGravity,
  tidalStretch,
  type BodyId,
  type Remnant,
} from "@/lib/sim/blackhole";
import { fitCanvas } from "./canvas";

export type BlackHoleMode = "squeeze" | "star" | "light";

export interface BlackHoleReading {
  mode: BlackHoleMode;
  body: BodyId | "mystery";
  mass: number;
  /** Current (squeezed) radius, m. */
  radius: number;
  /** The body's real radius, m. */
  realRadius: number;
  rs: number;
  g: number;
  /** Surface gravity at the real size. */
  g0: number;
  vEsc: number;
  blackHole: boolean;
  /** The last finished star collapse. */
  fate: { id: number; core: number; kind: Remnant } | null;
  /** The last light ray that finished its trip. */
  ray: { id: number; b: number; captured: boolean; bendDeg: number; closest: number } | null;
}

export interface MysteryBody {
  name: string;
  mass: number;
  radius: number;
}

interface Props {
  onReading?: (r: BlackHoleReading) => void;
  /** Challenge: squeeze mode only, with this body, and the horizon hidden until it forms. */
  mystery?: MysteryBody | null;
}

const SLIDER_STEPS = 2000;
/** The squeeze slider goes down to this fraction of r_s. */
const MIN_FRACTION = 0.4;
const STAR_ANIM_S = 4.2;
const RAY_SPEED = 14; // r_s per second on screen

const BLACK_HOLES = {
  stellar: { label: "10 Suns", mass: 10 * M_SUN },
  sgra: { label: "Sgr A* (4 million Suns)", mass: 4.3e6 * M_SUN },
} as const;
type HoleId = keyof typeof BLACK_HOLES;

const BODY_LOOK: Record<BodyId | "mystery", { inner: string; outer: string }> = {
  earth: { inner: "#7dd3fc", outer: "#1d4ed8" },
  sun: { inner: "#fff7c2", outer: "#f59e0b" },
  star20: { inner: "#f0f9ff", outer: "#60a5fa" },
  mystery: { inner: "#f5d0fe", outer: "#a855f7" },
};

const REMNANT_INFO: Record<Remnant, { name: string; text: string; color: string }> = {
  "white-dwarf": {
    name: "White dwarf",
    text: "The core settles into a hot ball about the size of Earth. A teaspoon of it would weigh a few tonnes.",
    color: "text-cyan-100",
  },
  "neutron-star": {
    name: "Neutron star",
    text: "The core crushes down to a ball about 20 km across, the size of a city. A teaspoon would weigh about a billion tonnes.",
    color: "text-violet-200",
  },
  "black-hole": {
    name: "Black hole",
    text: "No known force can stop the collapse. The core falls inside its own event horizon.",
    color: "text-pink-200",
  },
};

/** Fixed background stars, x and y from 0 to 1. */
const STARS = (() => {
  let s = 777;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  return Array.from({ length: 70 }, () => ({ x: rnd(), y: rnd(), r: 0.4 + rnd() * 0.9, a: 0.2 + rnd() * 0.5 }));
})();

type StarRun = { start: number; core: number; kind: Remnant; reported: boolean };
type Ray = { id: number; b: number; pts: [number, number][]; cum: number[]; first: number; captured: boolean; deflection: number; closest: number; start: number; reported: boolean };

export default function BlackHoleLab({ onReading, mystery = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modeState, setMode] = useState<BlackHoleMode>("squeeze");
  const mode: BlackHoleMode = mystery ? "squeeze" : modeState;
  const [bodyState, setBody] = useState<BodyId>("earth");
  const bodyId: BodyId | "mystery" = mystery ? "mystery" : bodyState;
  const [pos, setPos] = useState(SLIDER_STEPS);
  const [core, setCore] = useState(2);
  const [fate, setFate] = useState<BlackHoleReading["fate"]>(null);
  const [collapsing, setCollapsing] = useState(false);
  const [b, setB] = useState(4);
  const [hole, setHole] = useState<HoleId>("stellar");
  const [ray, setRay] = useState<BlackHoleReading["ray"]>(null);
  const [firing, setFiring] = useState(false);

  const body = mystery ?? BODIES[bodyState];
  const rs = schwarzschildRadius(body.mass);
  const rMin = MIN_FRACTION * rs;
  const radius = rMin * (body.radius / rMin) ** (pos / SLIDER_STEPS);
  const blackHole = radius <= rs;
  const g = surfaceGravity(body.mass, radius);
  const g0 = surfaceGravity(body.mass, body.radius);
  const vEsc = escapeSpeed(body.mass, radius);

  const onReadingRef = useRef(onReading);
  const params = useRef({ mode, bodyId, radius, real: body.radius, rs, blackHole, hidden: !!mystery, core, b });
  const starRun = useRef<StarRun | null>(null);
  const rays = useRef<Ray[]>([]);
  const nextId = useRef(1);
  useEffect(() => {
    onReadingRef.current = onReading;
    params.current = { mode, bodyId, radius, real: body.radius, rs, blackHole, hidden: !!mystery, core, b };
  });

  // ---------- Animation loop ----------
  useEffect(() => {
    const c = canvasRef.current!;
    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const P = params.current;
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (!w || !h) return;
      const ctx = fitCanvas(c, w, h);
      ctx.clearRect(0, 0, w, h);
      for (const s of STARS) {
        ctx.fillStyle = `rgba(255,255,255,${s.a})`;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      const t = now / 1000;
      if (P.mode === "squeeze") drawSqueeze(ctx, w, h, t, P);
      else if (P.mode === "star") {
        const run = starRun.current;
        const el = run ? (now - run.start) / 1000 : null;
        if (run && el !== null && el >= STAR_ANIM_S - 0.6 && !run.reported) {
          run.reported = true;
          setFate({ id: nextId.current++, core: run.core, kind: run.kind });
          setCollapsing(false);
        }
        drawStar(ctx, w, h, t, run && el !== null ? { el, kind: run.kind, core: run.core } : null, P.core);
      } else {
        for (const r of rays.current) {
          const total = r.cum[r.cum.length - 1] - r.cum[r.first];
          if (!r.reported && ((now - r.start) / 1000) * RAY_SPEED >= Math.min(total, 40)) {
            r.reported = true;
            setRay({ id: r.id, b: r.b, captured: r.captured, bendDeg: (r.deflection * 180) / Math.PI, closest: r.closest });
            setFiring(false);
          }
        }
        drawLight(ctx, w, h, t, now, rays.current, P.b);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    onReadingRef.current?.({ mode, body: bodyId, mass: body.mass, radius, realRadius: body.radius, rs, g, g0, vEsc, blackHole, fate, ray });
  }, [mode, bodyId, body.mass, body.radius, radius, rs, g, g0, vEsc, blackHole, fate, ray]);

  const chooseBody = (id: BodyId) => {
    setBody(id);
    setPos(SLIDER_STEPS);
  };
  const nudge = (d: number) => setPos((p) => Math.max(0, Math.min(SLIDER_STEPS, p + d)));

  const runStar = () => {
    starRun.current = { start: performance.now(), core, kind: remnantFate(core), reported: false };
    setCollapsing(true);
    setFate(null);
  };
  const changeCore = (v: number) => {
    setCore(v);
    if (!collapsing) {
      starRun.current = null;
      setFate(null);
    }
  };

  const fire = () => {
    const path = lightPath(b);
    const cum = [0];
    for (let i = 1; i < path.points.length; i++) {
      const [x0, y0] = path.points[i - 1];
      const [x1, y1] = path.points[i];
      cum.push(cum[i - 1] + Math.hypot(x1 - x0, y1 - y0));
    }
    let first = path.points.findIndex(([x]) => x > -16);
    if (first < 1) first = Math.max(0, first);
    else first -= 1;
    rays.current = [
      ...rays.current.slice(-5),
      { id: nextId.current++, b, pts: path.points, cum, first, captured: path.captured, deflection: path.deflection, closest: path.closest, start: performance.now(), reported: false },
    ];
    setFiring(true);
  };
  const clearRays = () => {
    rays.current = [];
    setRay(null);
    setFiring(false);
  };

  const holeMass = BLACK_HOLES[hole].mass;
  const holeRs = schwarzschildRadius(holeMass);
  const stretchG = ray ? tidalStretch(holeMass, ray.closest * holeRs) / G_EARTH : 0;
  const lastRemnant = mode === "star" && fate ? REMNANT_INFO[fate.kind] : null;

  const ariaLabel = useMemo(() => {
    if (mode === "squeeze")
      return blackHole
        ? `${body === mystery ? mystery!.name : BODIES[bodyState].label} squeezed inside its event horizon: it is now a black hole`
        : `${body === mystery ? mystery!.name : BODIES[bodyState].label} squeezed to a radius of ${formatLength(radius)}, drawn on a log scale`;
    if (mode === "star") return `A star with a core of ${core} Suns running out of fuel and collapsing`;
    return `Rays of light passing a black hole. Rays aimed closer than 2.6 times the horizon radius fall in; others bend`;
  }, [mode, blackHole, body, mystery, bodyState, radius, core]);

  return (
    <div className="flex flex-col gap-3 select-none">
      {!mystery && (
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["squeeze", "star", "light"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${mode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m === "squeeze" ? "Squeeze" : m === "star" ? "Star life" : "Light paths"}
            </button>
          ))}
        </div>
      )}

      <canvas ref={canvasRef} className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80" role="img" aria-label={ariaLabel} />

      {mode === "squeeze" && (
        <>
          {mystery ? (
            <div className="rounded-2xl border border-violet-300/30 bg-violet-300/[0.07] px-4 py-2 text-center text-sm">
              Mystery object: <span className="text-white">{mystery.name}</span> · mass {sci(mystery.mass)} kg
            </div>
          ) : (
            <Choice options={(Object.keys(BODIES) as BodyId[]).map((id) => ({ id, label: BODIES[id].label }))} value={bodyState} onChange={chooseBody} />
          )}
          <div className="grid grid-cols-2 gap-2 text-center">
            <Stat label="Radius" value={formatLength(radius)} />
            <Stat label="Event horizon r_s" value={mystery && !blackHole ? "?" : formatLength(rs)} />
            <Stat label="Surface gravity" value={blackHole ? "No surface" : `${sci(g)} m/s²`} />
            <Stat label="Gravity vs real size" value={blackHole ? "Beyond" : `× ${sci(g / g0)}`} />
          </div>
          <EscapeBar v={vEsc} />
          <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex justify-between gap-2 text-sm">
              <span className="text-white/60">Squeeze (log scale)</span>
              <span className="text-right tabular-nums text-white">{blackHole ? "Black hole!" : sizeLike(radius)}</span>
            </div>
            <input
              type="range"
              className="range mt-2 w-full"
              min={0}
              max={SLIDER_STEPS}
              step={1}
              value={pos}
              aria-label="Radius of the body, on a log scale"
              onChange={(e) => setPos(Number(e.target.value))}
            />
            <div className="mt-1 flex justify-between text-[11px] text-white/40">
              <span>← smaller</span>
              <span>real size →</span>
            </div>
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button className="btn-ghost !px-2 !py-2 text-sm" onClick={() => nudge(-10)} aria-label="Squeeze a lot more">
              −−
            </button>
            <button className="btn-ghost !px-2 !py-2 text-sm" onClick={() => nudge(-1)} aria-label="Squeeze a little more">
              −
            </button>
            <button className="btn-ghost !px-2 !py-2 text-sm" onClick={() => nudge(1)} aria-label="Let it grow a little">
              +
            </button>
            <button className="btn-ghost !px-2 !py-2 text-sm" onClick={() => setPos(SLIDER_STEPS)}>
              Reset
            </button>
          </div>
          <p className={`text-center text-sm ${blackHole ? "text-pink-200" : "text-white/50"}`}>
            {blackHole
              ? `Event horizon formed! The escape speed reached the speed of light at r_s = ${formatLength(rs)}.`
              : "Same mass, smaller ball: gravity at the surface and the escape speed both shoot up."}
          </p>
        </>
      )}

      {mode === "star" && (
        <>
          <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Core mass left when fuel runs out</span>
              <span className="tabular-nums text-white">{core.toFixed(1)} Suns</span>
            </div>
            <input
              type="range"
              className="range mt-2 w-full"
              min={0.5}
              max={10}
              step={0.1}
              value={core}
              disabled={collapsing}
              onChange={(e) => changeCore(Number(e.target.value))}
            />
            <FateStrip core={core} />
          </label>
          <button className="btn-primary !py-2 text-sm disabled:opacity-50" onClick={runStar} disabled={collapsing}>
            {collapsing ? "Collapsing…" : "▶ Run out of fuel"}
          </button>
          {lastRemnant && fate && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
              <div className={`font-semibold ${lastRemnant.color}`}>
                {fate.core.toFixed(1)} Sun core → {lastRemnant.name}
              </div>
              <p className="mt-1 text-white/70">{lastRemnant.text}</p>
              {fate.kind === "black-hole" && <p className="mt-1 text-white/50">Its event horizon: r_s = {formatLength(schwarzschildRadius(fate.core * M_SUN))}</p>}
            </div>
          )}
          <p className="text-center text-xs text-white/40">The limits of about 1.4 and about 3 Suns are approximate. The second one is still being measured.</p>
        </>
      )}

      {mode === "light" && (
        <>
          <Choice options={(Object.keys(BLACK_HOLES) as HoleId[]).map((id) => ({ id, label: BLACK_HOLES[id].label }))} value={hole} onChange={setHole} />
          <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex justify-between gap-2 text-sm">
              <span className="text-white/60">Aim distance</span>
              <span className="text-right tabular-nums text-white">
                {b.toFixed(2)} r_s · {formatLength(b * holeRs)}
              </span>
            </div>
            <input type="range" className="range mt-2 w-full" min={0.5} max={8} step={0.05} value={b} onChange={(e) => setB(Number(e.target.value))} aria-label="Aim distance of the light ray" />
          </label>
          <div className="grid grid-cols-[2fr_1fr] gap-2">
            <button className="btn-primary !py-2 text-sm disabled:opacity-50" onClick={fire} disabled={firing}>
              ✦ Fire a light ray
            </button>
            <button className="btn-ghost !py-2 text-sm" onClick={clearRays}>
              Clear
            </button>
          </div>
          {ray && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
              <div className={ray.captured ? "font-semibold text-pink-200" : "font-semibold text-amber-100"}>
                {ray.captured ? "Captured! The light fell inside the horizon." : `Escaped, bent by ${Math.round(ray.bendDeg)}°`}
              </div>
              <p className="mt-1 text-white/60">
                Stretch on a 1.8 m astronaut at the closest point: {sci(stretchG, 2)} g{" "}
                {stretchG > 1000 ? "(spaghetti!)" : stretchG < 0.1 ? "(you would not even feel it)" : "(very uncomfortable)"}
              </p>
            </div>
          )}
          <p className="text-center text-xs text-white/40">
            Aim closer than {CAPTURE_B.toFixed(1)} r_s and the light is trapped. That sets the size of the dark shadow.
          </p>
        </>
      )}
    </div>
  );
}

// ---------- Drawing ----------

type Params = { mode: BlackHoleMode; bodyId: BodyId | "mystery"; radius: number; real: number; rs: number; blackHole: boolean; hidden: boolean };

function drawSqueeze(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, P: Params) {
  const rMin = MIN_FRACTION * P.rs;
  const span = Math.log(P.real / rMin);
  const frac = (r: number) => Math.log(r / rMin) / span;
  const cx = w / 2;
  const cy = h * 0.42;
  const maxPx = Math.min(w * 0.4, h * 0.3);
  const minPx = 3;
  const px = (r: number) => minPx + (maxPx - minPx) * frac(r);
  const look = BODY_LOOK[P.bodyId];
  const showHorizon = !P.hidden || P.blackHole;

  if (P.blackHole) {
    const rh = px(P.rs);
    const glow = ctx.createRadialGradient(cx, cy, rh, cx, cy, rh * 2.6 + 10);
    glow.addColorStop(0, "rgba(251,146,60,0.9)");
    glow.addColorStop(0.25, "rgba(244,114,182,0.35)");
    glow.addColorStop(1, "rgba(244,114,182,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, rh * 2.6 + 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(cx, cy, rh, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(253,186,116,${0.6 + 0.3 * Math.sin(t * 3)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, rh + 1, 0, Math.PI * 2);
    ctx.stroke();
    // The squeezed body, now hidden inside.
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(1.5, px(P.radius)), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    const r = px(P.radius);
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    grad.addColorStop(0, look.inner);
    grad.addColorStop(1, look.outer);
    if (P.bodyId !== "earth") {
      ctx.shadowColor = look.outer;
      ctx.shadowBlur = 18;
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    if (showHorizon) {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(244,114,182,0.9)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, px(P.rs), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = P.blackHole ? "rgba(251,207,232,0.95)" : "rgba(255,255,255,0.55)";
  ctx.fillText(P.blackHole ? "Event horizon: nothing gets out" : showHorizon ? "pink ring = where the horizon would form" : "Squeeze until a horizon forms", cx, Math.min(h - 58, cy + maxPx + 18));

  // Log ruler of radius.
  const x0 = 16;
  const x1 = w - 16;
  const y = h - 30;
  const X = (r: number) => x0 + (x1 - x0) * frac(r);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  const lo = Math.ceil(Math.log10(rMin));
  const hi = Math.floor(Math.log10(P.real));
  const names: Record<number, string> = { [-3]: "1 mm", 0: "1 m", 3: "1 km", 6: "1000 km", 9: "10⁶ km", 12: "10⁹ km" };
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "10px system-ui, sans-serif";
  for (let e = lo; e <= hi; e++) {
    const x = X(10 ** e);
    const big = e % 3 === 0;
    ctx.strokeStyle = big ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.moveTo(x, y - (big ? 5 : 3));
    ctx.lineTo(x, y + (big ? 5 : 3));
    ctx.stroke();
    if (big && names[e] && x > x0 + 14 && x < x1 - 14) ctx.fillText(names[e], x, y + 17);
  }
  if (showHorizon) {
    const xs = X(P.rs);
    ctx.fillStyle = "#f472b6";
    ctx.fillRect(xs - 1, y - 9, 2, 18);
    ctx.fillText("r_s", xs, y - 12);
  }
  const xn = X(P.radius);
  ctx.fillStyle = "#67e8f9";
  ctx.beginPath();
  ctx.moveTo(xn, y - 3);
  ctx.lineTo(xn - 5, y - 11);
  ctx.lineTo(xn + 5, y - 11);
  ctx.closePath();
  ctx.fill();
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillText("radius, log scale: each tick is 10 times bigger", x0, 14);
}

function drawStar(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, run: { el: number; kind: Remnant; core: number } | null, core: number) {
  const cx = w / 2;
  const cy = h / 2;
  const maxPx = Math.min(w, h) * 0.36;
  ctx.textAlign = "center";
  ctx.font = "11px system-ui, sans-serif";
  const ball = (r: number, inner: string, outer: string, blur = 20) => {
    const g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.shadowColor = outer;
    ctx.shadowBlur = blur;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  };
  if (!run) {
    const r = maxPx * (0.45 + 0.04 * Math.min(core, 10) / 10 + 0.01 * Math.sin(t * 2));
    ball(r, "#fffbeb", "#f59e0b", 30);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText("A star shining by fusing its fuel", cx, h - 14);
    return;
  }
  const { el, kind } = run;
  const label = (s: string) => {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(s, cx, h - 14);
  };
  if (el < 1.2) {
    // Fuel runs low: the star swells into a giant and reddens.
    const k = el / 1.2;
    ball(maxPx * (0.5 + 0.45 * k), "#fde68a", k > 0.5 ? "#ef4444" : "#f59e0b", 35);
    label("Fuel running out: the star swells into a giant");
    return;
  }
  if (el < 2.0) {
    const k = (el - 1.2) / 0.8;
    ctx.globalAlpha = 1 - 0.6 * k;
    ball(maxPx * 0.95, "rgba(254,202,202,0.5)", "rgba(239,68,68,0.5)", 30);
    ctx.globalAlpha = 1;
    ball(Math.max(3, maxPx * 0.3 * (1 - k)), "#ffffff", "#fbbf24", 25);
    label("No more fuel: gravity crushes the core");
    return;
  }
  const k = Math.min(1, (el - 2.0) / 1.4);
  if (kind === "white-dwarf") {
    // Outer layers drift off as a glowing cloud.
    ctx.strokeStyle = `rgba(103,232,249,${0.6 * (1 - k)})`;
    ctx.lineWidth = 10 * (1 - k) + 2;
    ctx.beginPath();
    ctx.arc(cx, cy, maxPx * (0.4 + 0.6 * k), 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // A supernova blast.
    const flash = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxPx * (0.3 + 1.2 * k));
    flash.addColorStop(0, `rgba(255,255,255,${0.9 * (1 - k)})`);
    flash.addColorStop(0.5, `rgba(251,146,60,${0.6 * (1 - k)})`);
    flash.addColorStop(1, "rgba(244,114,182,0)");
    ctx.fillStyle = flash;
    ctx.fillRect(0, 0, w, h);
  }
  if (kind === "white-dwarf") {
    ball(8, "#ffffff", "#a5f3fc", 18);
    label(el > 3 ? "White dwarf: about Earth-sized" : "Outer layers drift away");
  } else if (kind === "neutron-star") {
    const a = t * 6;
    ctx.strokeStyle = "rgba(196,181,253,0.7)";
    ctx.lineWidth = 2;
    for (const s of [0, Math.PI]) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a + s) * maxPx * 0.9, cy + Math.sin(a + s) * maxPx * 0.5);
      ctx.stroke();
    }
    ball(4, "#ffffff", "#a78bfa", 14);
    label(el > 3 ? "Neutron star: about 20 km across, spinning fast" : "Supernova!");
  } else {
    const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 34);
    glow.addColorStop(0, "rgba(251,146,60,0.85)");
    glow.addColorStop(1, "rgba(244,114,182,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(cx, cy, 11, 0, Math.PI * 2);
    ctx.fill();
    label(el > 3 ? "Black hole: nothing stops the collapse" : "Supernova!");
  }
}

function drawLight(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, now: number, rays: Ray[], aim: number) {
  const k = Math.min(w / 24, h / 18);
  const cx = w * 0.56;
  const cy = h / 2;
  const S = (x: number, y: number): [number, number] => [cx + x * k, cy - y * k];
  // Glow of hot gas around the hole (illustration).
  const glow = ctx.createRadialGradient(cx, cy, k, cx, cy, k * 3.2);
  glow.addColorStop(0, "rgba(251,146,60,0.55)");
  glow.addColorStop(0.5, "rgba(244,114,182,0.18)");
  glow.addColorStop(1, "rgba(244,114,182,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, k * 3.2, 0, Math.PI * 2);
  ctx.fill();
  // Shadow edge and photon sphere.
  ctx.setLineDash([2, 4]);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, CAPTURE_B * k, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = `rgba(253,186,116,${0.5 + 0.2 * Math.sin(t * 2)})`;
  ctx.beginPath();
  ctx.arc(cx, cy, PHOTON_SPHERE * k, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(cx, cy, k, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(244,114,182,0.8)";
  ctx.beginPath();
  ctx.arc(cx, cy, k, 0, Math.PI * 2);
  ctx.stroke();

  // Rays.
  ctx.lineCap = "round";
  rays.forEach((r, i) => {
    const age = rays.length - 1 - i;
    const shown = ((now - r.start) / 1000) * RAY_SPEED + r.cum[r.first];
    ctx.strokeStyle = r.captured ? `rgba(244,114,182,${age ? 0.45 : 1})` : `rgba(253,224,71,${age ? 0.4 : 1})`;
    ctx.lineWidth = age ? 1.5 : 2.2;
    ctx.beginPath();
    let head: [number, number] | null = null;
    for (let j = r.first; j < r.pts.length; j++) {
      if (r.cum[j] > shown) {
        const [ax, ay] = r.pts[j - 1] ?? r.pts[j];
        const [bx, by] = r.pts[j];
        const seg = r.cum[j] - (r.cum[j - 1] ?? 0);
        const f = seg > 0 ? (shown - r.cum[j - 1]) / seg : 0;
        head = S(ax + (bx - ax) * f, ay + (by - ay) * f);
        ctx.lineTo(...head);
        break;
      }
      const p = S(...r.pts[j]);
      if (j === r.first) ctx.moveTo(...p);
      else ctx.lineTo(...p);
    }
    ctx.stroke();
    if (head && age === 0) {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(head[0], head[1], 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Aim marker at the left edge.
  const [, ay] = S(0, aim);
  ctx.fillStyle = "#67e8f9";
  ctx.beginPath();
  ctx.moveTo(14, ay);
  ctx.lineTo(4, ay - 5);
  ctx.lineTo(4, ay + 5);
  ctx.closePath();
  ctx.fill();
  ctx.setLineDash([3, 5]);
  ctx.strokeStyle = "rgba(103,232,249,0.35)";
  ctx.beginPath();
  ctx.moveTo(16, ay);
  ctx.lineTo(cx, ay);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = "10px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillText("dotted: shadow edge · orange: light can orbit", 8, h - 8);
}

// ---------- Small UI pieces ----------

function EscapeBar({ v }: { v: number }) {
  const f = v / C;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex justify-between gap-2 text-sm">
        <span className="text-white/60">Escape speed</span>
        <span className="text-right tabular-nums text-white">{f >= 1 ? "Light can't escape" : `${sci(v / 1000)} km/s · ${f < 0.001 ? sci(f * 100, 2) : (f * 100).toFixed(1)}% of c`}</span>
      </div>
      <div className="relative mt-2 h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${f >= 1 ? "bg-pink-400" : "bg-gradient-to-r from-cyan-400 to-violet-400"}`}
          style={{ width: `${Math.max(1, Math.min(100, f * 100))}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-white/40">
        <span>0</span>
        <span>speed of light, c = 3 lakh km/s</span>
      </div>
    </div>
  );
}

function FateStrip({ core }: { core: number }) {
  const lo = 0.5;
  const hi = 10;
  const p = (m: number) => ((m - lo) / (hi - lo)) * 100;
  return (
    <div className="mt-2">
      <div className="relative h-4 overflow-hidden rounded-full text-[10px] leading-4">
        <div className="absolute inset-y-0 left-0 bg-cyan-300/30" style={{ width: `${p(CHANDRASEKHAR_LIMIT)}%` }} />
        <div className="absolute inset-y-0 bg-violet-400/30" style={{ left: `${p(CHANDRASEKHAR_LIMIT)}%`, width: `${p(NEUTRON_STAR_LIMIT) - p(CHANDRASEKHAR_LIMIT)}%` }} />
        <div className="absolute inset-y-0 right-0 bg-pink-400/30 text-center text-pink-100" style={{ left: `${p(NEUTRON_STAR_LIMIT)}%` }}>
          black hole
        </div>
        <div className="absolute inset-y-0 w-1 -translate-x-1/2 rounded bg-white" style={{ left: `${p(core)}%` }} />
      </div>
      <div className="relative mt-1 h-4 text-[10px] text-white/50">
        <span className="absolute left-0">WD</span>
        <span className="absolute -translate-x-1/2" style={{ left: `${p(CHANDRASEKHAR_LIMIT)}%` }}>
          ≈1.4
        </span>
        <span className="absolute -translate-x-1/2 text-violet-200/80" style={{ left: `${(p(CHANDRASEKHAR_LIMIT) + p(NEUTRON_STAR_LIMIT)) / 2 + 1}%` }}>
          NS
        </span>
        <span className="absolute -translate-x-1/2" style={{ left: `${p(NEUTRON_STAR_LIMIT) + 2}%` }}>
          ≈3
        </span>
      </div>
      <div className="text-[11px] text-white/40">WD: white dwarf · NS: neutron star</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] uppercase tracking-wider text-white/50">{label}</div>
      <div className="font-display text-base tabular-nums">{value}</div>
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
          className={`flex-1 rounded-xl border px-2 py-2 text-sm whitespace-nowrap ${value === o.id ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
