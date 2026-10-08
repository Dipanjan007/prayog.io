"use client";

import { useEffect, useRef, useState } from "react";
import {
  LANDMARKS,
  MAP,
  TRACK_LENGTH,
  WALK_SPEED,
  arcDistance,
  averageSpeed,
  averageVelocity,
  chordDisplacement,
  circlePoint,
  directionText,
  displacementOf,
  flightTime,
  heightAt,
  maxHeight,
  pathLength,
  pathUpTo,
  pointAtDistance,
  radiusForCircumference,
  releasedPosition,
  snapToCrossing,
  streetRoute,
  tangentDir,
  throwDistanceAt,
  type LandmarkId,
  type Pt,
} from "@/lib/sim/paths";

export type PathMode = "map" | "throw" | "ring";
export type RingKind = "marble" | "track";

export interface PathReading {
  mode: PathMode;
  /** The walk on the map, reported once the walker has reached the last tapped crossing. */
  walk: { points: Pt[]; distance: number; dx: number; dy: number; mag: number; time: number };
  /** The last ball that came back down to the hand. */
  caught: { id: number; u: number; h: number; distance: number } | null;
  ring: { kind: RingKind; released: boolean; laps: number };
}

interface Props {
  onReading?: (r: PathReading) => void;
  /** Challenge: map only, averages hidden, these landmarks highlighted. */
  puzzle?: { highlight: LandmarkId[] } | null;
}

const HOME: Pt = { x: LANDMARKS.home.x, y: LANDMARKS.home.y };
/** On-screen walking speed of the map walker (m of map per second of animation). */
const MAP_ANIM_SPEED = 450;
const MAX_LEGS = 30;
/** Ball throws: speeds in m/s. Shown in real time. */
const U_RANGE = { min: 5, max: 20 };
/** Marble ring radius (m): a bangle-sized ring. Shown in real time. */
const MARBLE_R = 0.15;
/** The 400 m track drawn as a circle with the same lap length. */
const TRACK_R = radiusForCircumference(TRACK_LENGTH);
/** The track race plays 10 times faster than real time. */
const TRACK_FF = 10;

type Ui = { walked: number; throwT: number | null; theta: number; trackAngle: number; trackT: number };

export default function PathLab({ onReading, puzzle = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modeState, setModeState] = useState<PathMode>("map");
  const mode: PathMode = puzzle ? "map" : modeState;

  // Map walk
  const [legs, setLegs] = useState<Pt[][]>([]);
  const points = [HOME, ...legs.flat()];
  const total = pathLength(points);
  const [settled, setSettled] = useState<Pt[]>([HOME]);

  // Throw
  const [u, setU] = useState(12);
  const [caught, setCaught] = useState<PathReading["caught"]>(null);
  const [flying, setFlying] = useState(false);
  const [flyU, setFlyU] = useState(12);

  // Ring
  const [kind, setKind] = useState<RingKind>("marble");
  const [vMarble, setVMarble] = useState(0.4);
  const [vRun, setVRun] = useState(8);
  const [released, setReleased] = useState(false);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState(0);

  const [ui, setUi] = useState<Ui>({ walked: 0, throwT: null, theta: 0, trackAngle: 0, trackT: 0 });

  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  // Mutable animation state.
  const sim = useRef({
    walked: 0,
    throwStart: 0,
    throwU: 0,
    throwOn: false,
    throwId: 0,
    theta: 0,
    release: null as null | { theta: number; t: number },
    trackOn: false,
    trackAngle: 0,
    trackT: 0,
  });
  const params = useRef({ mode, points, total, u, kind, vMarble, vRun, highlight: puzzle?.highlight ?? [], hideAverages: !!puzzle });
  useEffect(() => {
    params.current = { mode, points, total, u, kind, vMarble, vRun, highlight: puzzle?.highlight ?? [], hideAverages: !!puzzle };
  });

  const setMode = (m: PathMode) => {
    setModeState(m);
    sim.current.throwOn = false;
    setFlying(false);
    sim.current.trackOn = false;
    setRunning(false);
  };

  // ---------- Map actions ----------
  const tapMap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode !== "map") return;
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    const t = mapTransform(rect.width, rect.height);
    const m = t.toMetres(e.clientX - rect.left, e.clientY - rect.top);
    const target = snapToCrossing(m);
    const last = points[points.length - 1];
    if (target.x === last.x && target.y === last.y) return;
    if (legs.length >= MAX_LEGS) return;
    setLegs([...legs, streetRoute(last, target)]);
  };
  const undo = () => {
    const next = legs.slice(0, -1);
    const len = pathLength([HOME, ...next.flat()]);
    sim.current.walked = Math.min(sim.current.walked, len);
    setLegs(next);
  };
  const resetWalk = () => {
    sim.current.walked = 0;
    setLegs([]);
  };

  // ---------- Throw actions ----------
  const throwBall = () => {
    const s = sim.current;
    s.throwStart = performance.now();
    s.throwU = u;
    s.throwOn = true;
    setFlyU(u);
    setFlying(true);
  };

  // ---------- Ring actions ----------
  const liftRing = () => {
    sim.current.release = { theta: sim.current.theta, t: 0 };
    setReleased(true);
  };
  const ringBack = () => {
    sim.current.release = null;
    sim.current.theta = 0;
    setReleased(false);
  };
  const runLap = () => {
    const s = sim.current;
    s.trackAngle = 0;
    s.trackT = 0;
    s.trackOn = true;
    setRunning(true);
  };
  const chooseKind = (k: RingKind) => {
    setKind(k);
    sim.current.trackOn = false;
    setRunning(false);
  };

  // ---------- Animation loop ----------
  useEffect(() => {
    const c = canvasRef.current!;
    let raf = 0;
    let last = performance.now();
    let lastUi = 0;
    let settledLen = -1;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const P = params.current;
      const S = sim.current;
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

      // Walk: move the walker towards the end of the planned path.
      if (S.walked < P.total) S.walked = Math.min(P.total, S.walked + MAP_ANIM_SPEED * dt);
      if (S.walked > P.total) S.walked = P.total;
      const walkDone = S.walked >= P.total - 1e-9;
      const key = walkDone ? P.points.length * 1e7 + P.total : -1;
      if (walkDone && key !== settledLen) {
        settledLen = key;
        setSettled(P.points);
      }
      if (!walkDone) settledLen = -1;

      // Throw.
      let throwT: number | null = null;
      if (S.throwOn) {
        const T = flightTime(S.throwU);
        throwT = (now - S.throwStart) / 1000;
        if (throwT >= T) {
          throwT = T;
          S.throwOn = false;
          S.throwId++;
          setFlying(false);
          setCaught({ id: S.throwId, u: S.throwU, h: maxHeight(S.throwU), distance: throwDistanceAt(S.throwU, T) });
        }
      }

      // Ring.
      if (P.mode === "ring" && P.kind === "marble") {
        if (S.release) S.release.t += dt;
        else S.theta = (S.theta + (P.vMarble / MARBLE_R) * dt) % (2 * Math.PI);
      }
      if (S.trackOn) {
        S.trackT += dt * TRACK_FF;
        S.trackAngle = (P.vRun / TRACK_R) * S.trackT;
        if (S.trackAngle >= 2 * Math.PI) {
          S.trackAngle = 2 * Math.PI;
          S.trackT = (2 * Math.PI * TRACK_R) / P.vRun;
          S.trackOn = false;
          setRunning(false);
          setLaps((n) => n + 1);
        }
      }

      if (P.mode === "map") drawMap(ctx, w, h, P.points, S.walked, P.highlight);
      else if (P.mode === "throw") {
        // Keep the last throw's graph on screen until the speed is changed.
        const keep = S.throwOn || (S.throwId > 0 && P.u === S.throwU);
        drawThrow(ctx, w, h, keep ? S.throwU : P.u, S.throwOn ? throwT : keep ? flightTime(S.throwU) : null);
      }
      else if (P.kind === "marble") drawMarble(ctx, w, h, S.theta, S.release, P.vMarble);
      else drawTrack(ctx, w, h, S.trackAngle);

      if (now - lastUi > 90) {
        lastUi = now;
        setUi((o) => {
          const n = { walked: S.walked, throwT: S.throwOn ? throwT : null, theta: S.theta, trackAngle: S.trackAngle, trackT: S.trackT };
          return o.walked === n.walked && o.throwT === n.throwT && o.theta === n.theta && o.trackAngle === n.trackAngle && o.trackT === n.trackT ? o : n;
        });
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const sd = displacementOf(settled);
  const settledDist = pathLength(settled);
  useEffect(() => {
    onReadingRef.current?.({
      mode,
      walk: { points: settled, distance: settledDist, dx: sd.dx, dy: sd.dy, mag: sd.mag, time: settledDist / WALK_SPEED },
      caught,
      ring: { kind, released, laps },
    });
  }, [mode, settled, settledDist, sd.dx, sd.dy, sd.mag, caught, kind, released, laps]);

  // ---------- Live numbers ----------
  const walkedNow = Math.min(ui.walked, total);
  const posNow = pointAtDistance(points, walkedNow);
  const dNow = { dx: posNow.x - HOME.x, dy: posNow.y - HOME.y };
  const magNow = Math.hypot(dNow.dx, dNow.dy);
  const tWalk = walkedNow / WALK_SPEED;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!puzzle && (
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["map", "throw", "ring"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${mode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m === "map" ? "Map walk" : m === "throw" ? "Throw up" : "Ring"}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        onPointerDown={tapMap}
        className={`h-72 w-full touch-manipulation rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-96 ${mode === "map" ? "cursor-crosshair" : ""}`}
        role="img"
        aria-label={
          mode === "map"
            ? `A street map with Home, School, Park, Metro, Market and Library. You have walked ${Math.round(walkedNow)} metres and your displacement from Home is ${Math.round(magNow)} metres ${directionText(dNow.dx, dNow.dy)}. Tap a street crossing to walk there.`
            : mode === "throw"
              ? `A ball thrown straight up at ${u} metres per second, with a graph of distance and displacement against time`
              : kind === "marble"
                ? "A marble rolling round a ring at a steady speed with its velocity arrow along the tangent"
                : "A runner going round a 400 metre track, with the distance along the track and the straight displacement from the start"
        }
      />

      {mode === "map" && (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Stat label="Distance walked" value={`${Math.round(walkedNow)} m`} tone="text-orange-300" />
            <Stat label="Displacement" value={`${Math.round(magNow)} m`} tone="text-cyan-300" />
          </div>
          <p className="text-center text-sm text-white/70">
            Direction from Home: <span className="text-cyan-200">{directionText(dNow.dx, dNow.dy)}</span>
          </p>
          <div className={`grid gap-2 text-center ${puzzle ? "grid-cols-1" : "grid-cols-3"}`}>
            <Stat label="Time at 1.4 m/s" value={`${Math.round(tWalk)} s`} small />
            {!puzzle && (
              <>
                <Stat label="Avg speed" value={`${averageSpeed(walkedNow, tWalk).toFixed(2)} m/s`} small />
                <Stat label="Avg velocity" value={`${averageVelocity(magNow, tWalk).toFixed(2)} m/s`} small />
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost !py-2 text-sm" onClick={undo} disabled={!legs.length}>
              ↶ Undo last leg
            </button>
            <button className="btn-ghost !py-2 text-sm" onClick={resetWalk} disabled={!legs.length}>
              ⟲ Reset walk
            </button>
          </div>
          <p className="text-center text-xs text-white/40">
            Tap a street crossing to walk there. You walk east–west first, then north–south. Streets are 100 m apart.
          </p>
        </>
      )}

      {mode === "throw" && <ThrowPanel u={u} setU={setU} flying={flying} flyU={flyU} throwT={ui.throwT} caught={caught} onThrow={throwBall} />}

      {mode === "ring" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            {(["marble", "track"] as const).map((k) => (
              <button
                key={k}
                onClick={() => chooseKind(k)}
                className={`rounded-xl border px-2 py-2 text-sm ${kind === k ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
              >
                {k === "marble" ? "Marble in a ring" : "400 m track"}
              </button>
            ))}
          </div>
          {kind === "marble" ? (
            <MarblePanel v={vMarble} setV={setVMarble} theta={ui.theta} released={released} onLift={liftRing} onBack={ringBack} />
          ) : (
            <TrackPanel v={vRun} setV={setVRun} angle={ui.trackAngle} t={ui.trackT} running={running} laps={laps} onRun={runLap} />
          )}
        </>
      )}
    </div>
  );
}

// ---------- Panels ----------

function ThrowPanel({
  u,
  setU,
  flying,
  flyU,
  throwT,
  caught,
  onThrow,
}: {
  u: number;
  flyU: number;
  setU: (n: number) => void;
  flying: boolean;
  throwT: number | null;
  caught: PathReading["caught"];
  onThrow: () => void;
}) {
  const t = throwT;
  return (
    <>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Time" value={t !== null ? `${t.toFixed(2)} s` : caught ? `${flightTime(caught.u).toFixed(2)} s` : "–"} small />
        <Stat label="Displacement" value={flying && t !== null ? `${heightAt(flyU, t).toFixed(1)} m` : caught ? "0.0 m" : "–"} small tone="text-cyan-300" />
        <Stat label="Distance" value={flying && t !== null ? `${throwDistanceAt(flyU, t).toFixed(1)} m` : caught ? `${caught.distance.toFixed(1)} m` : "–"} small tone="text-orange-300" />
      </div>
      {caught && !flying && (
        <p className="text-center text-sm text-lime-300">
          Caught! It rose h = {caught.h.toFixed(1)} m, so distance = 2h = {caught.distance.toFixed(1)} m, and displacement = 0.
        </p>
      )}
      <Slider label="Throw speed u" value={`${u} m/s`} min={U_RANGE.min} max={U_RANGE.max} step={1} v={u} onChange={setU} disabled={flying} />
      <p className="text-center text-xs text-white/50 tabular-nums">
        Highest point h = u² ÷ 2g = {maxHeight(u).toFixed(1)} m · back in your hand after {flightTime(u).toFixed(2)} s
      </p>
      <button className="btn-primary !py-2 text-sm disabled:opacity-50" onClick={onThrow} disabled={flying}>
        🏏 Throw the ball up
      </button>
    </>
  );
}

function MarblePanel({
  v,
  setV,
  theta,
  released,
  onLift,
  onBack,
}: {
  v: number;
  setV: (n: number) => void;
  theta: number;
  released: boolean;
  onLift: () => void;
  onBack: () => void;
}) {
  const d = tangentDir(theta);
  return (
    <>
      <div className="grid grid-cols-2 gap-2 text-center">
        <Stat label="Speed" value={`${v.toFixed(2)} m/s`} />
        <Stat label="Velocity heading" value={released ? "fixed" : directionText(d.x, d.y)} small tone="text-pink-300" />
      </div>
      <p className="text-center text-xs text-white/50 tabular-nums">
        Ring radius {MARBLE_R * 100} cm · one turn every {((2 * Math.PI * MARBLE_R) / v).toFixed(2)} s (T = 2πr ÷ v)
      </p>
      {released ? (
        <>
          <p className="text-center text-sm text-lime-300">The marble left along the tangent (dashed line) and rolls on in a straight line.</p>
          <button className="btn-ghost !py-2 text-sm" onClick={onBack}>
            Put the ring back
          </button>
        </>
      ) : (
        <>
          <Slider label="Marble speed" value={`${v.toFixed(2)} m/s`} min={0.2} max={0.8} step={0.05} v={v} onChange={setV} />
          <button className="btn-primary !py-2 text-sm" onClick={onLift}>
            ✋ Lift the ring here
          </button>
        </>
      )}
    </>
  );
}

function TrackPanel({
  v,
  setV,
  angle,
  t,
  running,
  laps,
  onRun,
}: {
  v: number;
  setV: (n: number) => void;
  angle: number;
  t: number;
  running: boolean;
  laps: number;
  onRun: () => void;
}) {
  const dist = arcDistance(TRACK_R, angle);
  const disp = chordDisplacement(TRACK_R, angle);
  const done = !running && laps > 0 && angle >= 2 * Math.PI - 1e-9;
  return (
    <>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Time" value={`${t.toFixed(1)} s`} small />
        <Stat label="Distance" value={`${Math.round(dist)} m`} small tone="text-orange-300" />
        <Stat label="Displacement" value={`${disp.toFixed(1)} m`} small tone="text-cyan-300" />
        <Stat label="Avg speed" value={`${averageSpeed(dist, t).toFixed(2)} m/s`} small />
        <Stat label="Avg velocity" value={`${averageVelocity(disp, t).toFixed(2)} m/s`} small />
        <Stat label="Laps" value={`${laps}`} small />
      </div>
      {done && (
        <p className="text-center text-sm text-lime-300">
          Lap done: 400 m in {t.toFixed(1)} s. Average speed {averageSpeed(400, t).toFixed(2)} m/s, but average velocity 0 m/s.
        </p>
      )}
      <Slider label="Running speed" value={`${v} m/s`} min={5} max={10} step={0.5} v={v} onChange={setV} disabled={running} />
      <button className="btn-primary !py-2 text-sm disabled:opacity-50" onClick={onRun} disabled={running}>
        🏃 Run one lap
      </button>
      <p className="text-center text-xs text-white/40">Halfway round, the displacement is the width of the circle: {(2 * TRACK_R).toFixed(1)} m.</p>
    </>
  );
}

function Stat({ label, value, small, tone }: { label: string; value: string; small?: boolean; tone?: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="truncate text-[11px] uppercase tracking-wider text-white/50">{label}</div>
      <div className={`font-display tabular-nums ${small ? "text-sm sm:text-base" : "text-lg"} ${tone ?? ""}`}>{value}</div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  v,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  v: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex justify-between text-sm">
        <span className="text-white/60">{label}</span>
        <span className="tabular-nums text-white">{value}</span>
      </div>
      <input
        type="range"
        className="range mt-2 w-full"
        min={min}
        max={max}
        step={step}
        value={v}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

// ---------- Drawing ----------

const FONT = "11px system-ui, sans-serif";
const CYAN = "#67e8f9";
const ORANGE = "#fb923c";
const PINK = "#f472b6";
const VIOLET = "#a78bfa";

function mapTransform(w: number, h: number) {
  // Room at the top for the odometer and compass, and at the bottom for the scale bar.
  const pad = 16;
  const top = 32;
  const bottom = 20;
  const W = MAP.xMax - MAP.xMin;
  const H = MAP.yMax - MAP.yMin;
  const s = Math.min((w - 2 * pad) / W, (h - top - bottom) / H);
  const ox = (w - W * s) / 2;
  const oy = top + (h - top - bottom - H * s) / 2;
  return {
    s,
    X: (x: number) => ox + (x - MAP.xMin) * s,
    Y: (y: number) => oy + (MAP.yMax - y) * s,
    toMetres: (px: number, py: number): Pt => ({ x: MAP.xMin + (px - ox) / s, y: MAP.yMax - (py - oy) / s }),
  };
}

function arrow(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string, width = 2.5) {
  const len = Math.hypot(x1 - x0, y1 - y0);
  if (len < 2) return;
  const a = Math.atan2(y1 - y0, x1 - x0);
  const head = Math.min(10, len * 0.5);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1 - Math.cos(a) * head * 0.6, y1 - Math.sin(a) * head * 0.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - Math.cos(a - 0.4) * head, y1 - Math.sin(a - 0.4) * head);
  ctx.lineTo(x1 - Math.cos(a + 0.4) * head, y1 - Math.sin(a + 0.4) * head);
  ctx.closePath();
  ctx.fill();
}

function compass(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.font = "bold 11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("N", x, y - 14);
  arrow(ctx, x, y + 8, x, y - 8, "rgba(255,255,255,0.6)", 1.5);
}

function drawMap(ctx: CanvasRenderingContext2D, w: number, h: number, pts: Pt[], walked: number, highlight: readonly LandmarkId[]) {
  const T = mapTransform(w, h);
  const blk = 100 * T.s;
  // Blocks between the streets.
  ctx.fillStyle = "rgba(167,139,250,0.07)";
  for (let x = MAP.xMin; x < MAP.xMax; x += 100)
    for (let y = MAP.yMin; y < MAP.yMax; y += 100) {
      const g = Math.max(2, blk * 0.12);
      ctx.fillRect(T.X(x) + g, T.Y(y + 100) + g, blk - 2 * g, blk - 2 * g);
    }
  // Streets.
  ctx.strokeStyle = "rgba(255,255,255,0.13)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = MAP.xMin; x <= MAP.xMax; x += 100) {
    ctx.moveTo(T.X(x), T.Y(MAP.yMin));
    ctx.lineTo(T.X(x), T.Y(MAP.yMax));
  }
  for (let y = MAP.yMin; y <= MAP.yMax; y += 100) {
    ctx.moveTo(T.X(MAP.xMin), T.Y(y));
    ctx.lineTo(T.X(MAP.xMax), T.Y(y));
  }
  ctx.stroke();
  // Crossings.
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  for (let x = MAP.xMin; x <= MAP.xMax; x += 100)
    for (let y = MAP.yMin; y <= MAP.yMax; y += 100) {
      ctx.beginPath();
      ctx.arc(T.X(x), T.Y(y), 1.4, 0, 2 * Math.PI);
      ctx.fill();
    }

  // Landmarks.
  const iconSize = Math.max(12, Math.min(18, blk * 0.5));
  for (const [id, L] of Object.entries(LANDMARKS) as [LandmarkId, (typeof LANDMARKS)[LandmarkId]][]) {
    const x = T.X(L.x);
    const y = T.Y(L.y);
    if (highlight.includes(id)) {
      ctx.strokeStyle = PINK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, iconSize * 0.85, 0, 2 * Math.PI);
      ctx.stroke();
    }
    ctx.font = `${iconSize}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(L.icon, x, y);
    ctx.font = FONT;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    const ly = L.y >= MAP.yMax ? y + iconSize * 0.6 + 10 : y - iconSize * 0.6 - 3;
    const lx = Math.min(w - 24, Math.max(24, x));
    ctx.fillText(L.label, lx, ly);
  }

  // Planned path ahead (faint dashed), walked part (orange).
  if (pts.length > 1) {
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(251,146,60,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(T.X(p.x), T.Y(p.y)) : ctx.moveTo(T.X(p.x), T.Y(p.y))));
    ctx.stroke();
    ctx.setLineDash([]);
    const done = pathUpTo(pts, walked);
    ctx.strokeStyle = ORANGE;
    ctx.lineWidth = 3.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    done.forEach((p, i) => (i ? ctx.lineTo(T.X(p.x), T.Y(p.y)) : ctx.moveTo(T.X(p.x), T.Y(p.y))));
    ctx.stroke();
  }

  // Displacement arrow from the start to the walker.
  const start = pts[0];
  const pos = pointAtDistance(pts, walked);
  const mag = Math.hypot(pos.x - start.x, pos.y - start.y);
  arrow(ctx, T.X(start.x), T.Y(start.y), T.X(pos.x), T.Y(pos.y), CYAN, 3);
  if (mag > 1) {
    const mx = (T.X(start.x) + T.X(pos.x)) / 2;
    const my = (T.Y(start.y) + T.Y(pos.y)) / 2;
    const text = `${Math.round(mag)} m`;
    ctx.font = "bold 12px system-ui, sans-serif";
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = "rgba(10,13,28,0.85)";
    ctx.fillRect(mx - tw / 2 - 4, my - 9, tw + 8, 17);
    ctx.fillStyle = CYAN;
    ctx.textAlign = "center";
    ctx.fillText(text, mx, my + 4);
  }
  // Walker.
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(T.X(pos.x), T.Y(pos.y), 5.5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Odometer badge, compass and scale.
  ctx.font = "bold 12px system-ui, sans-serif";
  const odo = `🚶 ${Math.round(walked)} m walked`;
  const ow = ctx.measureText(odo).width;
  ctx.fillStyle = "rgba(10,13,28,0.8)";
  ctx.fillRect(6, 6, ow + 12, 20);
  ctx.fillStyle = ORANGE;
  ctx.textAlign = "left";
  ctx.fillText(odo, 12, 20);
  const cx = Math.max(ow + 40, w * 0.62);
  arrow(ctx, cx, 24, cx, 6, "rgba(255,255,255,0.6)", 1.5);
  ctx.font = "bold 11px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.textAlign = "right";
  ctx.fillText("N", cx - 5, 19);
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w - 14 - blk, h - 8);
  ctx.lineTo(w - 14, h - 8);
  ctx.stroke();
  ctx.font = FONT;
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.textAlign = "center";
  ctx.fillText("100 m", w - 14 - blk / 2, h - 12);
}

function drawThrow(ctx: CanvasRenderingContext2D, w: number, h: number, u: number, t: number | null) {
  const H = maxHeight(u);
  const T = flightTime(u);
  const Hmax = maxHeight(U_RANGE.max);
  const colW = Math.min(110, w * 0.28);
  const ground = h - 26;
  const top = 18;
  const pxm = (ground - 40 - top) / Hmax;
  const hand = ground - 40;
  const bx = colW * 0.55;

  // Ground and person.
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, ground);
  ctx.lineTo(colW, ground);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  const px = bx - 14;
  ctx.arc(px, ground - 52, 6, 0, 2 * Math.PI);
  ctx.moveTo(px, ground - 46);
  ctx.lineTo(px, ground - 20);
  ctx.lineTo(px - 7, ground);
  ctx.moveTo(px, ground - 20);
  ctx.lineTo(px + 7, ground);
  ctx.moveTo(px, ground - 40);
  ctx.lineTo(bx - 3, hand + 3);
  ctx.stroke();

  // Top marker.
  const yTop = hand - H * pxm;
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = "rgba(167,139,250,0.7)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx - 18, yTop);
  ctx.lineTo(colW, yTop);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = FONT;
  ctx.fillStyle = VIOLET;
  ctx.textAlign = "left";
  ctx.fillText(`h = ${H.toFixed(1)} m`, 4, yTop + 13);

  // Ball and its displacement arrow.
  const y = t !== null ? heightAt(u, t) : 0;
  const by = hand - y * pxm;
  if (y > 0.3) arrow(ctx, bx + 12, hand, bx + 12, by, CYAN, 2);
  ctx.fillStyle = "#f87171";
  ctx.beginPath();
  ctx.arc(bx, by - 5, 5, 0, 2 * Math.PI);
  ctx.fill();

  // Graph of distance and displacement against time.
  const gx0 = colW + 34;
  const gx1 = w - 10;
  const gy0 = top + 8;
  const gy1 = ground;
  const yMax = 2 * H * 1.08;
  const GX = (tt: number) => gx0 + (tt / T) * (gx1 - gx0);
  const GY = (m: number) => gy1 - (m / yMax) * (gy1 - gy0);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(gx0, gy0);
  ctx.lineTo(gx0, gy1);
  ctx.lineTo(gx1, gy1);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.textAlign = "right";
  for (const [m, label] of [
    [H, "h"],
    [2 * H, "2h"],
  ] as const) {
    ctx.fillText(label, gx0 - 4, GY(m) + 4);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.moveTo(gx0, GY(m));
    ctx.lineTo(gx1, GY(m));
    ctx.stroke();
  }
  ctx.textAlign = "center";
  ctx.fillText(`time → ${T.toFixed(2)} s`, (gx0 + gx1) / 2, gy1 + 16);
  // Legend.
  ctx.textAlign = "left";
  ctx.fillStyle = ORANGE;
  ctx.fillText("— distance", gx0 + 6, gy0 + 4);
  ctx.fillStyle = CYAN;
  ctx.fillText("— displacement (height)", gx0 + 6, gy0 + 18);

  // Faint preview, then the traced part.
  for (const [fn, color, faint] of [
    [throwDistanceAt, ORANGE, "rgba(251,146,60,0.18)"],
    [heightAt, CYAN, "rgba(103,232,249,0.18)"],
  ] as const) {
    for (const [end, col, lw] of [
      [T, faint, 1.5],
      [t ?? -1, color, 2.5],
    ] as const) {
      if (end <= 0) continue;
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.beginPath();
      const n = 80;
      for (let i = 0; i <= n; i++) {
        const tt = (end * i) / n;
        const yy = GY(fn(u, tt));
        if (i) ctx.lineTo(GX(tt), yy);
        else ctx.moveTo(GX(tt), yy);
      }
      ctx.stroke();
    }
  }
  if (t !== null) {
    ctx.fillStyle = ORANGE;
    ctx.beginPath();
    ctx.arc(GX(t), GY(throwDistanceAt(u, t)), 3.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = CYAN;
    ctx.beginPath();
    ctx.arc(GX(t), GY(heightAt(u, t)), 3.5, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function ringGeometry(w: number, h: number) {
  return { cx: w / 2, cy: h / 2 + 4, R: Math.min(w, h) * 0.34 };
}

function drawMarble(ctx: CanvasRenderingContext2D, w: number, h: number, theta: number, release: { theta: number; t: number } | null, v: number) {
  const { cx, cy, R } = ringGeometry(w, h);
  const pxm = R / MARBLE_R;
  const P = (p: Pt) => ({ x: cx + p.x * pxm, y: cy - p.y * pxm });
  compass(ctx, w - 18, 30);

  // Faint velocity arrows round the ring: same length, different directions.
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const p = P(circlePoint(MARBLE_R, a));
    const d = tangentDir(a);
    arrow(ctx, p.x, p.y, p.x + d.x * 26, p.y - d.y * 26, "rgba(244,114,182,0.22)", 1.5);
  }

  // Ring (with a gap where it was lifted).
  ctx.strokeStyle = "rgba(167,139,250,0.85)";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  if (release) {
    const gap = 0.45;
    ctx.arc(cx, cy, R + 4, -release.theta + gap, -release.theta - gap + 2 * Math.PI);
  } else ctx.arc(cx, cy, R + 4, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.lineCap = "butt";

  // Centre and radius.
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.arc(cx, cy, 2.5, 0, 2 * Math.PI);
  ctx.fill();

  let pos: Pt;
  let dir: Pt;
  if (release) {
    const p0 = P(circlePoint(MARBLE_R, release.theta));
    const d0 = tangentDir(release.theta);
    // The lifted piece of ring, raised up off the table.
    ctx.strokeStyle = "rgba(167,139,250,0.4)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy - 14, R + 4, -(release.theta + 0.4), -(release.theta - 0.4));
    ctx.stroke();
    // Tangent line.
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p0.x - d0.x * 2000, p0.y + d0.y * 2000);
    ctx.lineTo(p0.x + d0.x * 2000, p0.y - d0.y * 2000);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = FONT;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.textAlign = "center";
    ctx.fillText("tangent", p0.x - d0.x * 50 + (p0.x - cx) * 0.18, p0.y + d0.y * 50 + (p0.y - cy) * 0.18);
    // Roll on until the marble reaches the edge of the table (the canvas).
    const m = 12;
    const lim = (p: number, d: number, lo: number, hi: number) => (d > 1e-9 ? (hi - p) / d : d < -1e-9 ? (lo - p) / d : Infinity);
    const maxPx = Math.max(0, Math.min(lim(p0.x, d0.x, m, w - m), lim(p0.y, -d0.y, m, h - m)));
    const travelled = Math.min(release.t * v, maxPx / pxm);
    pos = releasedPosition(MARBLE_R, release.theta, 1, travelled);
    dir = d0;
  } else {
    pos = circlePoint(MARBLE_R, theta);
    dir = tangentDir(theta);
  }
  const m = P(pos);
  if (!release) {
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(m.x, m.y);
    ctx.stroke();
  }
  arrow(ctx, m.x, m.y, m.x + dir.x * 48, m.y - dir.y * 48, PINK, 3);
  ctx.font = "bold 11px system-ui, sans-serif";
  ctx.fillStyle = PINK;
  ctx.textAlign = "center";
  ctx.fillText("v", m.x + dir.x * 58, m.y - dir.y * 58 + 4);
  const grad = ctx.createRadialGradient(m.x - 2, m.y - 2, 1, m.x, m.y, 8);
  grad.addColorStop(0, "#e0f2fe");
  grad.addColorStop(1, "#38bdf8");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(m.x, m.y, 7, 0, 2 * Math.PI);
  ctx.fill();
}

function drawTrack(ctx: CanvasRenderingContext2D, w: number, h: number, angle: number) {
  const { cx, cy, R } = ringGeometry(w, h);
  compass(ctx, w - 18, 30);
  // Start at the bottom (south) and run anticlockwise.
  const a0 = -Math.PI / 2;
  const at = (a: number) => ({ x: cx + R * Math.cos(a0 + a), y: cy - R * Math.sin(a0 + a) });
  ctx.strokeStyle = "rgba(180,83,9,0.55)";
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = "rgba(74,222,128,0.08)";
  ctx.beginPath();
  ctx.arc(cx, cy, R - 10, 0, 2 * Math.PI);
  ctx.fill();
  // Start line.
  const s = at(0);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(s.x, s.y - 10);
  ctx.lineTo(s.x, s.y + 10);
  ctx.stroke();
  ctx.font = FONT;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.textAlign = "center";
  ctx.fillText("START / FINISH", s.x, s.y + 24);
  ctx.fillText("400 m lap", cx, cy - 6);

  // Distance along the track.
  if (angle > 0) {
    ctx.strokeStyle = ORANGE;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, R, -a0, -(a0 + angle), true);
    ctx.stroke();
  }
  // Displacement chord.
  const r = at(angle);
  arrow(ctx, s.x, s.y, r.x, r.y, CYAN, 3);
  // Runner and velocity.
  const d = tangentDir(a0 + angle);
  arrow(ctx, r.x, r.y, r.x + d.x * 36, r.y - d.y * 36, PINK, 2.5);
  ctx.fillStyle = "#fde047";
  ctx.beginPath();
  ctx.arc(r.x, r.y, 6, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText(`${Math.round(arcDistance(TRACK_R, angle))} m run`, cx, cy + 12);
}
