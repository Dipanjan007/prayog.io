"use client";

import { useEffect, useRef, useState } from "react";
import {
  AU,
  GM_EARTH,
  GM_SUN,
  MOON_DIST,
  MOON_PERIOD,
  PLACES,
  R_EARTH,
  YEAR_S,
  centripetalAcc,
  centripetalForce,
  circularSpeed,
  distanceFromAxis,
  gAtLatitude,
  gravityAcc,
  launchFate,
  maxCurveSpeed,
  maxFriction,
  orbitPeriod,
  skidRadius,
  skids,
  spinAcc,
  spinSpeed,
  spinWeightAcc,
  weightAt,
  type SpinRound,
} from "@/lib/sim/circular";
import { fitCanvas } from "./canvas";

export type SpinMode = "whirl" | "earth" | "orbit";
export type SpinScene = "ball" | "car";
export type SpinView = "outside" | "riding";
export type OrbitBody = "sat" | "moon" | "sun";
export type Fate = "crash" | "orbit" | "escape";

export interface SpinReading {
  mode: SpinMode;
  scene: SpinScene;
  view: SpinView;
  /** Mass (kg), speed (m/s) and radius (m) in Whirl mode. */
  m: number;
  v: number;
  r: number;
  /** Inward force needed, m v² / r (N). */
  force: number;
  /** The ball's string is cut, or the car is skidding. */
  released: boolean;
  lat: number;
  body: OrbitBody;
  /** The last satellite launch that finished (crashed, escaped or went once round). */
  launch: { id: number; altKm: number; v: number; fate: Fate; challenge: boolean } | null;
  /** The last car drive that finished: one lap, or a skid. */
  drive: { id: number; v: number; skid: boolean; challenge: boolean } | null;
}

interface Props {
  onReading?: (r: SpinReading) => void;
  /** Challenge round: locks the curve or the orbit height and hides the answer. */
  target?: SpinRound | null;
}

const BALL = { m: [0.1, 1, 0.1], v: [1, 8, 0.5], r: [0.5, 1.5, 0.1] } as const;
const CAR = { m: [800, 2000, 100], v: [5, 30, 0.1], r: [20, 60, 1] } as const;
const ROADS = { dry: { label: "Dry road", mu: 0.7 }, wet: { label: "Wet road", mu: 0.4 } } as const;
type Road = keyof typeof ROADS;
/** The ball plays at 1/3 of real speed so you can follow it; the car at 2× so a lap does not take too long. */
const BALL_RATE = 1 / 3;
const CAR_RATE = 2;
/** Half the width of the road (m). */
const ROAD_HALF = 4;
/** One spin of the Earth plays in this many seconds. */
const EARTH_TURN_S = 12;
/** One circular satellite orbit plays in this many seconds. */
const ORBIT_PLAY_S = 5;
const SAT_V = [1, 11.5, 0.01] as const;
const ALT_MIN = 200;
const ALT_MAX = 40_000;
const STUDENT_KG = 50;

const COL_IN = "#fb7185";
const COL_OUT = "#a78bfa";
const COL_V = "#22d3ee";
const FONT = "11px system-ui, sans-serif";

type Pt = { x: number; y: number };
type BallRelease = { kind: "ball"; x0: number; y0: number; vx: number; vy: number; tau: number };
type CarSkid = { kind: "car"; cx: number; cy: number; R: number; th0: number; phi: number; v: number; done: boolean };
type Sat = { x: number; y: number; vx: number; vy: number; swept: number; prev: number; fate: Fate; v0: number; altKm: number; r0: number; done: boolean; reported: boolean; trail: Pt[]; challenge: boolean };
type Sim = {
  cam: number;
  release: BallRelease | CarSkid | null;
  trailW: Pt[];
  trailR: Pt[];
  driving: boolean;
  lapStart: number;
  reported: boolean;
  earthPhase: number;
  bodyPhase: number;
  sat: Sat | null;
};

const altToU = (alt: number) => (1000 * Math.log(alt / ALT_MIN)) / Math.log(ALT_MAX / ALT_MIN);
const uToAlt = (u: number) => {
  const a = ALT_MIN * Math.pow(ALT_MAX / ALT_MIN, u / 1000);
  return a < 1000 ? Math.round(a / 10) * 10 : Math.round(a / 100) * 100;
};
const rot = (p: Pt, a: number): Pt => ({ x: p.x * Math.cos(a) - p.y * Math.sin(a), y: p.x * Math.sin(a) + p.y * Math.cos(a) });
const fmt = (n: number, d = 1) => n.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });

export default function SpinLab({ onReading, target = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modeSel, setModeSel] = useState<SpinMode>("whirl");
  const [sceneSel, setSceneSel] = useState<SpinScene>("ball");
  const [view, setView] = useState<SpinView>("outside");
  const [ball, setBall] = useState({ m: 0.5, v: 4, r: 1 });
  const [car, setCar] = useState({ m: 1200, v: 12, r: 40 });
  const [road, setRoad] = useState<Road>("dry");
  const [released, setReleased] = useState(false);
  const [lat, setLat] = useState(19.08);
  const [bodySel, setBodySel] = useState<OrbitBody>("sat");
  const [altSel, setAltSel] = useState(500);
  const [satV, setSatV] = useState(6);
  const [busy, setBusy] = useState(false);
  const [launch, setLaunch] = useState<SpinReading["launch"]>(null);
  const [drive, setDrive] = useState<SpinReading["drive"]>(null);
  const ids = useRef(0);

  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const challenge = !!target;
  const mode: SpinMode = target ? (target.kind === "car" ? "whirl" : "orbit") : modeSel;
  const scene: SpinScene = target?.kind === "car" ? "car" : target ? "ball" : sceneSel;
  const body: OrbitBody = target ? "sat" : bodySel;
  const altKm = target?.kind === "orbit" ? target.altKm : altSel;
  const carSet = target?.kind === "car" ? { m: target.m, v: car.v, r: target.r } : car;
  const mu = target?.kind === "car" ? target.mu : ROADS[road].mu;
  const cur = scene === "ball" ? ball : carSet;
  const force = centripetalForce(cur.m, cur.v, cur.r);
  const grip = maxFriction(carSet.m, mu);
  const vMax = maxCurveSpeed(mu, carSet.r);
  const r0 = R_EARTH + altKm * 1000;
  const vCirc = circularSpeed(GM_EARTH, r0);

  const simRef = useRef<Sim>({
    cam: challenge ? -Math.PI / 2 : Math.PI / 6,
    release: null,
    trailW: [],
    trailR: [],
    driving: !challenge,
    lapStart: 0,
    reported: true,
    earthPhase: 0,
    bodyPhase: 0,
    sat: null,
  });

  const params = useRef({ mode, scene, view, cur, mu, lat, body, r0, altKm, challenge });
  useEffect(() => {
    params.current = { mode, scene, view, cur, mu, lat, body, r0, altKm, challenge };
  });

  // ---------- Actions ----------
  const resetWhirl = (parked: boolean) => {
    const s = simRef.current;
    s.release = null;
    s.trailW = [];
    s.trailR = [];
    s.driving = !parked;
    s.reported = true;
    if (parked) s.cam = -Math.PI / 2;
    setReleased(false);
    setBusy(false);
  };

  const cut = () => {
    const s = simRef.current;
    const { r, v } = ball;
    s.release = { kind: "ball", x0: r * Math.cos(s.cam), y0: r * Math.sin(s.cam), vx: -v * Math.sin(s.cam), vy: v * Math.cos(s.cam), tau: 0 };
    s.trailW = [];
    s.trailR = [];
    setReleased(true);
  };

  const startDrive = () => {
    const s = simRef.current;
    resetWhirl(true);
    s.driving = true;
    s.lapStart = s.cam;
    s.reported = false;
    setBusy(true);
  };

  const fire = () => {
    const v = satV * 1000;
    const { fate } = launchFate(GM_EARTH, r0, v, R_EARTH);
    simRef.current.sat = { x: 0, y: r0, vx: -v, vy: 0, swept: 0, prev: Math.PI / 2, fate, v0: v, altKm, r0, done: false, reported: false, trail: [], challenge };
    setBusy(true);
  };

  const clearSat = () => {
    simRef.current.sat = null;
    setBusy(false);
  };

  const pickMode = (m: SpinMode) => {
    setModeSel(m);
    clearSat();
  };
  const pickScene = (sc: SpinScene) => {
    setSceneSel(sc);
    resetWhirl(false);
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
      const s = simRef.current;
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (!w || !h) return;
      const ctx = fitCanvas(c, w, h);
      ctx.clearRect(0, 0, w, h);
      ctx.font = FONT;

      if (P.mode === "whirl") {
        const { m, v, r } = P.cur;
        const rate = P.scene === "ball" ? BALL_RATE : CAR_RATE;
        const omega = v / r;
        const pdt = dt * rate;
        if (s.driving || s.release) s.cam += omega * pdt;
        const rel = s.release;
        if (!rel && P.scene === "car" && s.driving && skids(m, v, r, P.mu) && (!P.challenge || s.cam - s.lapStart > 0.3)) {
          const R = skidRadius(v, P.mu);
          s.release = { kind: "car", cx: (r - R) * Math.cos(s.cam), cy: (r - R) * Math.sin(s.cam), R, th0: s.cam, phi: 0, v, done: false };
          s.trailW = [];
          s.trailR = [];
          setReleased(true);
        }
        let pos: Pt;
        let heading: number;
        if (rel?.kind === "ball") {
          rel.tau += pdt;
          pos = { x: rel.x0 + rel.vx * rel.tau, y: rel.y0 + rel.vy * rel.tau };
          heading = Math.atan2(rel.vy, rel.vx);
        } else if (rel?.kind === "car") {
          if (!rel.done) {
            rel.phi += (rel.v * pdt) / rel.R;
            const p = { x: rel.cx + rel.R * Math.cos(rel.th0 + rel.phi), y: rel.cy + rel.R * Math.sin(rel.th0 + rel.phi) };
            if (Math.hypot(p.x, p.y) > r + ROAD_HALF + 3 || rel.phi >= Math.PI) {
              rel.done = true;
              if (!s.reported) {
                s.reported = true;
                setDrive({ id: ++ids.current, v, skid: true, challenge: P.challenge });
                setBusy(false);
              }
            }
          }
          pos = { x: rel.cx + rel.R * Math.cos(rel.th0 + rel.phi), y: rel.cy + rel.R * Math.sin(rel.th0 + rel.phi) };
          heading = rel.th0 + rel.phi + Math.PI / 2;
        } else {
          pos = { x: r * Math.cos(s.cam), y: r * Math.sin(s.cam) };
          heading = s.cam + Math.PI / 2;
          if (P.scene === "car" && P.challenge && s.driving && !s.reported && s.cam - s.lapStart >= 2 * Math.PI) {
            s.reported = true;
            s.driving = false;
            s.cam = s.lapStart;
            setDrive({ id: ++ids.current, v, skid: false, challenge: true });
            setBusy(false);
          }
        }
        if (rel && !(rel.kind === "car" && rel.done)) {
          s.trailW.push(pos);
          s.trailR.push(rot(pos, -s.cam));
          if (s.trailW.length > 600) {
            s.trailW.shift();
            s.trailR.shift();
          }
        }
        drawWhirl(ctx, w, h, P.scene, P.view, s, pos, heading, m, v, r, P.mu, !!rel, P.challenge);
      } else if (P.mode === "earth") {
        s.earthPhase = (s.earthPhase + (2 * Math.PI * dt) / EARTH_TURN_S) % (2 * Math.PI);
        drawEarth(ctx, w, h, s.earthPhase, P.lat);
      } else if (P.body === "sat") {
        const sat = s.sat;
        if (sat && !sat.done) {
          const T = orbitPeriod(GM_EARTH, sat.r0);
          const phys = (dt * T) / ORBIT_PLAY_S;
          const n = 300;
          const h1 = phys / n;
          for (let i = 0; i < n; i++) {
            const d = Math.hypot(sat.x, sat.y);
            const a = -GM_EARTH / (d * d * d);
            sat.vx += a * sat.x * h1;
            sat.vy += a * sat.y * h1;
            sat.x += sat.vx * h1;
            sat.y += sat.vy * h1;
            if (Math.hypot(sat.x, sat.y) <= R_EARTH) {
              const k = R_EARTH / Math.hypot(sat.x, sat.y);
              sat.x *= k;
              sat.y *= k;
              sat.done = true;
              break;
            }
          }
          const ang = Math.atan2(sat.y, sat.x);
          let dA = ang - sat.prev;
          if (dA > Math.PI) dA -= 2 * Math.PI;
          if (dA < -Math.PI) dA += 2 * Math.PI;
          sat.swept += dA;
          sat.prev = ang;
          sat.trail.push({ x: sat.x, y: sat.y });
          if (sat.trail.length > 1500) sat.trail.shift();
          const dist = Math.hypot(sat.x, sat.y);
          if (dist > 4 * sat.r0) sat.done = true;
          const finished = sat.done || Math.abs(sat.swept) >= 2 * Math.PI;
          if (finished && !sat.reported) {
            sat.reported = true;
            // A tiny numerical wobble must not turn a graze into a crash, so the fate comes from the exact formula.
            setLaunch({ id: ++ids.current, altKm: sat.altKm, v: sat.v0, fate: sat.fate, challenge: sat.challenge });
            setBusy(false);
          }
        }
        drawSat(ctx, w, h, P.r0, sat);
      } else {
        s.bodyPhase = (s.bodyPhase + (2 * Math.PI * dt) / 8) % (2 * Math.PI);
        drawBody(ctx, w, h, P.body, s.bodyPhase);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    onReadingRef.current?.({ mode, scene, view, m: cur.m, v: cur.v, r: cur.r, force, released, lat, body, launch, drive });
  }, [mode, scene, view, cur.m, cur.v, cur.r, force, released, lat, body, launch, drive]);

  // ---------- Controls ----------
  const setBallK = (k: "m" | "v" | "r") => (n: number) => setBall((b) => ({ ...b, [k]: n }));
  const setCarK = (k: "m" | "v" | "r") => (n: number) => setCar((b) => ({ ...b, [k]: n }));
  const setLatitude = (n: number) => setLat(n);
  const place = PLACES.find((p) => Math.abs(p.lat - lat) < 0.01);
  const satDone = launch && launch.altKm === altKm && launch.challenge === challenge && !busy ? launch : null;
  const carDone = drive && drive.challenge === challenge && !busy ? drive : null;

  const ariaLabel =
    mode === "whirl"
      ? scene === "ball"
        ? `Top view of a ${ball.m} kilogram ball whirled on a ${ball.r} metre string at ${ball.v} metres per second${released ? ", string cut, ball flying along the tangent" : ""}, seen ${view === "outside" ? "from outside" : "riding along with the ball"}`
        : `Top view of a car going round a curve of radius ${carSet.r} metres at ${carSet.v} metres per second${released ? ", skidding off the road" : ""}`
      : mode === "earth"
        ? `The spinning Earth with a person at latitude ${lat} degrees going round a circle about the axis`
        : body === "sat"
          ? `A satellite launched sideways ${altKm} kilometres above the Earth`
          : body === "moon"
            ? "The Moon going round the Earth, pulled by gravity"
            : "The Earth going round the Sun, pulled by gravity";

  return (
    <div className="flex flex-col gap-3 select-none">
      {!target && (
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["whirl", "earth", "orbit"] as const).map((m) => (
            <button key={m} onClick={() => pickMode(m)} className={`rounded-xl py-2 ${mode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m === "whirl" ? "Whirl" : m === "earth" ? "Spinning Earth" : "Orbits"}
            </button>
          ))}
        </div>
      )}

      <canvas ref={canvasRef} className="h-80 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-96" role="img" aria-label={ariaLabel} />

      {mode === "whirl" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            {!target && (
              <Choice
                options={[
                  { id: "ball", label: "⚾ Ball on a string" },
                  { id: "car", label: "🚗 Car on a curve" },
                ]}
                value={scene}
                onChange={pickScene}
              />
            )}
            <div className={target ? "col-span-2" : ""}>
              <Choice
                options={[
                  { id: "outside", label: "From outside" },
                  { id: "riding", label: "Riding along" },
                ]}
                value={view}
                onChange={setView}
              />
            </div>
          </div>

          {scene === "ball" ? (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="Speed" value={`${fmt(ball.v)} m/s`} />
                <Stat label="Radius" value={`${fmt(ball.r)} m`} />
                <Stat label="Tension" value={released ? "0 N" : `${force < 10 ? fmt(force, 2) : fmt(force)} N`} accent={COL_IN} />
              </div>
              <p className="text-center text-xs text-white/60 tabular-nums">
                F = m v² ÷ r = {fmt(ball.m)} × {fmt(ball.v)}² ÷ {fmt(ball.r)} = {force < 10 ? fmt(force, 2) : fmt(force)} N
              </p>
              <Slider label="Mass of the ball" value={`${fmt(ball.m)} kg`} min={BALL.m[0]} max={BALL.m[1]} step={BALL.m[2]} v={ball.m} onChange={setBallK("m")} />
              <Slider label="Speed" value={`${fmt(ball.v)} m/s`} min={BALL.v[0]} max={BALL.v[1]} step={BALL.v[2]} v={ball.v} onChange={setBallK("v")} />
              <Slider label="Length of string (radius)" value={`${fmt(ball.r)} m`} min={BALL.r[0]} max={BALL.r[1]} step={BALL.r[2]} v={ball.r} onChange={setBallK("r")} />
              {released ? (
                <button className="btn-ghost !py-2 text-sm" onClick={() => resetWhirl(false)}>
                  🔁 Tie a new string
                </button>
              ) : (
                <button className="btn-primary !py-2 text-sm" onClick={cut}>
                  ✂️ Cut the string
                </button>
              )}
              <ViewNote view={view} released={released} scene="ball" />
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="Speed" value={`${fmt(carSet.v)} m/s`} sub={`${Math.round(carSet.v * 3.6)} km/h`} />
                <Stat label="Needed" value={challenge ? "?" : `${fmt(force / 1000, 2)} kN`} sub="m v² ÷ r" accent={COL_IN} />
                <Stat label="Tyre grip" value={challenge ? "?" : `${fmt(grip / 1000, 2)} kN`} sub="μ m g" />
              </div>
              {!challenge && <GripBar need={force} grip={grip} />}
              {target?.kind === "car" ? (
                <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-center text-xs text-white/70 tabular-nums">
                  Curve radius r = {target.r} m · μ = {target.mu} · car {target.m} kg · g = 9.8 m/s²
                </p>
              ) : (
                <>
                  <Choice options={(Object.keys(ROADS) as Road[]).map((id) => ({ id, label: `${ROADS[id].label} (μ = ${ROADS[id].mu})` }))} value={road} onChange={setRoad} />
                  <Slider label="Mass of the car" value={`${carSet.m} kg`} min={CAR.m[0]} max={CAR.m[1]} step={CAR.m[2]} v={carSet.m} onChange={setCarK("m")} />
                  <Slider label="Radius of the curve" value={`${carSet.r} m`} min={CAR.r[0]} max={CAR.r[1]} step={CAR.r[2]} v={carSet.r} onChange={setCarK("r")} />
                </>
              )}
              <Slider label="Speed" value={`${fmt(carSet.v)} m/s`} min={CAR.v[0]} max={CAR.v[1]} step={CAR.v[2]} v={carSet.v} onChange={setCarK("v")} disabled={busy} nudge={0.1} />
              {target ? (
                <>
                  <button className="btn-primary !py-2 text-sm disabled:opacity-50" onClick={startDrive} disabled={busy}>
                    🚗 Drive round the bend
                  </button>
                  {carDone && (
                    <p className={`text-center text-sm ${carDone.skid ? "text-amber-200" : "text-lime-300"}`}>
                      {carDone.skid
                        ? `Skidded at ${fmt(carDone.v)} m/s: the tyres could not give enough inward force.`
                        : `Made it round at ${fmt(carDone.v)} m/s (${Math.round(carDone.v * 3.6)} km/h).`}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-center text-xs text-white/50 tabular-nums">Fastest safe speed here: √(μ g r) = {fmt(vMax)} m/s. The mass cancels out.</p>
                  {released && (
                    <button className="btn-ghost !py-2 text-sm" onClick={() => resetWhirl(false)}>
                      🔁 Back on the road
                    </button>
                  )}
                </>
              )}
              <ViewNote view={view} released={released} scene="car" />
            </>
          )}
        </>
      )}

      {mode === "earth" && (
        <>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {PLACES.map((p) => (
              <button
                key={p.id}
                onClick={() => setLatitude(p.lat)}
                className={`rounded-xl border px-1 py-2 text-xs ${place?.id === p.id ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
              >
                {p.name}
              </button>
            ))}
          </div>
          <Slider label={`Latitude${place ? ` (${place.name})` : ""}`} value={`${fmt(lat, lat % 1 ? 2 : 0)}° N`} min={0} max={90} step={0.5} v={lat} onChange={setLatitude} />
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Spin speed" value={`${Math.round(spinSpeed(lat))} m/s`} sub={`${fmt(spinSpeed(lat) * 3.6, 0)} km/h`} />
            <Stat label="Circle radius" value={`${fmt(distanceFromAxis(lat) / 1000, 0)} km`} />
            <Stat label="Inward acc." value={`${spinAcc(lat).toFixed(4)}`} sub="m/s², ω² × radius" accent={COL_IN} />
          </div>
          <WeightCard lat={lat} />
        </>
      )}

      {mode === "orbit" && (
        <>
          {!target && (
            <Choice
              options={[
                { id: "sat", label: "🛰️ Satellite" },
                { id: "moon", label: "🌙 Moon" },
                { id: "sun", label: "☀️ Earth & Sun" },
              ]}
              value={body}
              onChange={(b) => {
                setBodySel(b);
                clearSat();
              }}
            />
          )}
          {body === "sat" ? (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="Height" value={`${altKm.toLocaleString("en-IN")} km`} />
                <Stat label="Gravity per kg" value={`${gravityAcc(GM_EARTH, r0).toFixed(2)}`} sub="N/kg (m/s²)" accent={COL_IN} />
                <Stat label="Circle speed" value={challenge ? "?" : `${fmt(vCirc / 1000, 2)} km/s`} sub={challenge ? "work it out" : `one orbit: ${fmtTime(orbitPeriod(GM_EARTH, r0))}`} />
              </div>
              {target ? (
                <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-center text-xs text-white/70 tabular-nums">
                  r = R + h = 6,371 km + {altKm.toLocaleString("en-IN")} km = {(r0 / 1000).toLocaleString("en-IN")} km · GM of Earth = 3.986 × 10¹⁴ m³/s²
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "ISS 400 km", alt: 400 },
                      { label: "500 km", alt: 500 },
                      { label: "GSAT 35,786 km", alt: 35_786 },
                    ].map((c) => (
                      <button
                        key={c.alt}
                        onClick={() => {
                          setAltSel(c.alt);
                          clearSat();
                        }}
                        className={`rounded-xl border px-1 py-2 text-xs ${altSel === c.alt ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  <Slider
                    label="Height above the ground"
                    value={`${altSel.toLocaleString("en-IN")} km`}
                    min={0}
                    max={1000}
                    step={1}
                    v={altToU(altSel)}
                    onChange={(u) => {
                      setAltSel(uToAlt(u));
                      clearSat();
                    }}
                    disabled={busy}
                  />
                </>
              )}
              <Slider label="Launch speed (sideways)" value={`${satV.toFixed(2)} km/s`} min={SAT_V[0]} max={SAT_V[1]} step={SAT_V[2]} v={satV} onChange={setSatV} disabled={busy} nudge={0.01} />
              <button className="btn-primary !py-2 text-sm disabled:opacity-50" onClick={fire} disabled={busy}>
                🚀 Launch
              </button>
              {satDone && (
                <p className={`text-center text-sm ${satDone.fate === "orbit" ? "text-lime-300" : "text-amber-200"}`}>
                  {satDone.fate === "crash"
                    ? `Too slow at ${(satDone.v / 1000).toFixed(2)} km/s: gravity pulled it down faster than the ground curved away. It crashed.`
                    : satDone.fate === "escape"
                      ? `Too fast at ${(satDone.v / 1000).toFixed(2)} km/s: gravity could not bend its path enough, and it escaped.`
                      : challenge
                        ? `In orbit at ${(satDone.v / 1000).toFixed(2)} km/s. Is the path a circle, or an oval?`
                        : Math.abs(satDone.v / vCirc - 1) <= 0.02
                          ? `A circular orbit! At ${(satDone.v / 1000).toFixed(2)} km/s gravity gives exactly m v² ÷ r.`
                          : `In orbit, but on an oval path. A circle needs ${fmt(vCirc / 1000, 2)} km/s here.`}
                </p>
              )}
            </>
          ) : (
            <BodyCard body={body} />
          )}
        </>
      )}
    </div>
  );
}

function fmtTime(s: number) {
  const hTot = s / 3600;
  if (hTot < 3) return `${Math.round(s / 60)} min`;
  const h = Math.floor(hTot);
  const m = Math.round((hTot - h) * 60);
  return `${h} h ${m} min`;
}

function ViewNote({ view, released, scene }: { view: SpinView; released: boolean; scene: SpinScene }) {
  const thing = scene === "ball" ? "ball" : "car";
  const pull = scene === "ball" ? "string" : "road";
  const text =
    view === "outside"
      ? released
        ? scene === "ball"
          ? "No string, no inward force: the ball goes straight on along the tangent (dashed line). It does not fly straight outward."
          : "Too fast for the tyres. Their grip can only bend the path into a wider curve, so the car slides off the outside of the bend."
        : `From outside, only one sideways force acts: the ${pull} pulls the ${thing} towards the centre. Nothing pushes it outward.`
      : released
        ? `Riding along, the ${thing} seems to be flung outward. Seen from outside, it simply went straight on.`
        : `Riding along, the ${thing} looks still. So it seems an outward centrifugal force (violet) balances the inward pull. It is an apparent force: it appears only because you are turning.`;
  return <p className={`rounded-xl px-3 py-2 text-xs ${view === "riding" ? "bg-violet-300/10 text-violet-100" : "bg-white/[0.04] text-white/70"}`}>{text}</p>;
}

function GripBar({ need, grip }: { need: number; grip: number }) {
  const max = grip * 2;
  const pct = Math.min(100, (need / max) * 100);
  const over = need > grip;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex justify-between text-xs">
        <span className="text-white/60">Friction needed vs tyre grip</span>
        <span className={over ? "text-amber-200" : "text-lime-300"}>{over ? "Skids!" : "Holds the road"}</span>
      </div>
      <div className="relative mt-2 h-3 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${over ? "bg-amber-300" : "bg-rose-400"}`} style={{ width: `${pct}%` }} />
        <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white" />
      </div>
      <div className="relative mt-1 h-4 text-[10px] text-white/50">
        <span className="absolute left-1/2 -translate-x-1/2">grip limit</span>
      </div>
    </div>
  );
}

function WeightCard({ lat }: { lat: number }) {
  const here = weightAt(STUDENT_KG, lat);
  const pole = weightAt(STUDENT_KG, 90);
  const less = pole - here;
  const spin = STUDENT_KG * spinWeightAcc(lat);
  const bulge = Math.max(0, less - spin);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
      <div className="text-[11px] uppercase tracking-wider text-white/50">A 50 kg student on a scale</div>
      <div className="mt-1 flex flex-wrap justify-between gap-x-4 tabular-nums">
        <span className="text-white/70">
          Here: <span className="text-white">{fmt(here, 1)} N</span> (g = {gAtLatitude(lat).toFixed(3)})
        </span>
        <span className="text-white/70">
          North Pole: <span className="text-white">{fmt(pole, 1)} N</span>
        </span>
      </div>
      <div className="mt-2 text-xs text-white/60 tabular-nums">
        {less < 0.005 ? (
          "At the pole you spin on the spot. No circle, so none of gravity is used up."
        ) : (
          <>
            Lighter by <span className="text-white">{fmt(less, 2)} N ({fmt((less / pole) * 100, 2)}%)</span>: spin takes{" "}
            <span style={{ color: COL_IN }}>{fmt(spin, 2)} N</span> ({fmt((spin / pole) * 100, 2)}%) and the bulge, which puts you farther from the centre, takes {fmt(bulge, 2)} N.
          </>
        )}
      </div>
    </div>
  );
}

function BodyCard({ body }: { body: "moon" | "sun" }) {
  const moon = body === "moon";
  const r = moon ? MOON_DIST : AU;
  const T = moon ? MOON_PERIOD : YEAR_S;
  const GM = moon ? GM_EARTH : GM_SUN;
  const v = (2 * Math.PI * r) / T;
  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Distance" value={moon ? "3.84 lakh km" : "15 crore km"} />
        <Stat label="One orbit" value={moon ? "27.3 days" : "365.25 days"} />
        <Stat label="Speed" value={`${fmt(v / 1000, moon ? 2 : 1)} km/s`} />
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm tabular-nums">
        <div className="flex justify-between">
          <span className="text-white/60">Needed for the circle, v² ÷ r</span>
          <span>{centripetalAcc(v, r).toFixed(5)} m/s²</span>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-white/60">Pull of {moon ? "Earth's" : "the Sun's"} gravity, GM ÷ r²</span>
          <span style={{ color: COL_IN }}>{gravityAcc(GM, r).toFixed(5)} m/s²</span>
        </div>
        <p className="mt-2 text-xs text-white/60">
          {moon
            ? "They match (within 1%). Gravity is the string that keeps the Moon on its path. Newton checked this sum in the 1660s."
            : "They match. The Sun's gravity gives the Earth exactly the centripetal force it needs to go round once a year, at about 30 km/s."}
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="truncate text-[11px] uppercase tracking-wider text-white/50">{label}</div>
      <div className="font-display text-base tabular-nums sm:text-lg" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-white/50 tabular-nums">{sub}</div>}
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
  nudge,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  v: number;
  onChange: (n: number) => void;
  disabled?: boolean;
  nudge?: number;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n / step) * step));
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 ${disabled ? "opacity-60" : ""}`}>
      <label className="block">
        <div className="flex justify-between text-sm">
          <span className="text-white/60">{label}</span>
          <span className="tabular-nums text-white">{value}</span>
        </div>
        <input type="range" className="range mt-2 w-full" min={min} max={max} step={step} value={v} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} />
      </label>
      {nudge && (
        <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
          {[-10, -1, 1, 10].map((k) => (
            <button
              key={k}
              disabled={disabled}
              className="rounded-lg border border-white/10 py-1.5 text-white/70 tabular-nums disabled:opacity-40"
              onClick={() => onChange(Number(clamp(v + k * nudge).toFixed(4)))}
              aria-label={`${k > 0 ? "Increase" : "Decrease"} by ${Math.abs(k * nudge)}`}
            >
              {k > 0 ? "+" : "−"}
              {Math.abs(k * nudge) < 1 ? Math.abs(k * nudge).toFixed(nudge < 0.1 ? 2 : 1) : Math.abs(k * nudge)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Choice<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`min-w-0 flex-1 rounded-xl border px-1 py-2 text-xs sm:text-sm ${value === o.id ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Drawing ----------

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, opts: { dashed?: boolean; label?: string; width?: number } = {}) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 2) return;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const head = Math.min(9, len * 0.5);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = opts.width ?? 2.5;
  if (opts.dashed) ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - ux * head * 0.8, y2 - uy * head * 0.8);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ux * head - uy * head * 0.55, y2 - uy * head + ux * head * 0.55);
  ctx.lineTo(x2 - ux * head + uy * head * 0.55, y2 - uy * head - ux * head * 0.55);
  ctx.closePath();
  ctx.fill();
  if (opts.label) label(ctx, opts.label, (x1 + x2) / 2 - uy * 14, (y1 + y2) / 2 + ux * 14 + 4, color);
}

/** How far (px) you can go from (x, y) in direction (dx, dy) before leaving the canvas, less a margin. */
function roomAlong(x: number, y: number, dx: number, dy: number, w: number, h: number) {
  let t = Infinity;
  if (dx > 1e-6) t = Math.min(t, (w - 10 - x) / dx);
  if (dx < -1e-6) t = Math.min(t, (10 - x) / dx);
  if (dy > 1e-6) t = Math.min(t, (h - 22 - y) / dy);
  if (dy < -1e-6) t = Math.min(t, (24 - y) / dy);
  return Math.max(0, t);
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.font = FONT;
  const tw = ctx.measureText(text).width;
  const w = ctx.canvas.clientWidth;
  const cx = Math.min(w - tw / 2 - 4, Math.max(tw / 2 + 4, x));
  ctx.fillStyle = "rgba(10,13,28,0.75)";
  ctx.fillRect(cx - tw / 2 - 3, y - 10, tw + 6, 14);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(text, cx, y);
  ctx.textAlign = "left";
}

function drawWhirl(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scene: SpinScene,
  view: SpinView,
  s: Sim,
  pos: Pt,
  heading: number,
  m: number,
  v: number,
  r: number,
  mu: number,
  released: boolean,
  hideNums: boolean,
) {
  const cx = w / 2;
  const cy = h / 2 + 6;
  // The ball view keeps one scale so a longer string looks longer; the car view zooms out only for big curves.
  const rMaxM = scene === "ball" ? BALL.r[1] : Math.max(r, 36) * 1.35;
  const scale = (Math.min(w, h) / 2 - 26) / rMaxM;
  const riding = view === "riding";
  const a = riding ? -s.cam : 0;
  const S = (p: Pt) => {
    const q = rot(p, a);
    return { x: cx + q.x * scale, y: cy - q.y * scale };
  };
  const SR = (q: Pt) => ({ x: cx + q.x * scale, y: cy - q.y * scale });

  // Ground: world-fixed marks, so they turn when you ride along.
  if (scene === "ball") {
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    const step = 0.3;
    const lim = Math.hypot(w, h) / 2 / scale;
    for (let x = -lim; x <= lim; x += step)
      for (let y = -lim; y <= lim; y += step) {
        const p = S({ x, y });
        if (p.x < -4 || p.x > w + 4 || p.y < -4 || p.y > h + 4) continue;
        ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
      }
    for (const [x, y] of [
      [1.75, 0.9],
      [-1.6, 1.2],
      [-0.4, -1.85],
      [1.3, -1.5],
    ]) {
      const p = S({ x, y });
      ctx.fillStyle = "rgba(132,204,22,0.45)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = "rgba(132,204,22,0.10)";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(120,120,135,0.55)";
    ctx.lineWidth = ROAD_HALF * 2 * scale;
    ctx.beginPath();
    ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
    ctx.stroke();
    // Dashed centre line drawn in world angles, so it turns with the ground.
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 24; i++) {
      const t0 = (i / 24) * Math.PI * 2;
      const p1 = S({ x: r * Math.cos(t0), y: r * Math.sin(t0) });
      const p2 = S({ x: r * Math.cos(t0 + 0.12), y: r * Math.sin(t0 + 0.12) });
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    for (const [x, y] of [
      [0, 0],
      [10, 8],
      [-12, -6],
      [55, 50],
      [-58, 40],
      [50, -55],
      [-45, -58],
    ]) {
      const p = S({ x, y });
      ctx.fillStyle = "rgba(74,222,128,0.5)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // The circular path.
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.setLineDash([4, 5]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Trail after release.
  const trail = riding ? s.trailR.map(SR) : s.trailW.map(S);
  if (trail.length > 1) {
    ctx.strokeStyle = scene === "ball" ? "rgba(251,191,36,0.75)" : "rgba(251,191,36,0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    trail.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
  }
  // In the outside view after a cut, show the tangent line at the release point.
  if (released && !riding && s.release?.kind === "ball") {
    const rel = s.release;
    const p0 = S({ x: rel.x0, y: rel.y0 });
    const p1 = S({ x: rel.x0 + rel.vx * 10, y: rel.y0 + rel.vy * 10 });
    const pm = S({ x: rel.x0 - rel.vx * 10, y: rel.y0 - rel.vy * 10 });
    ctx.strokeStyle = "rgba(34,211,238,0.35)";
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(pm.x, pm.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
    ctx.setLineDash([]);
    const rad = S({ x: 0, y: 0 });
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.moveTo(rad.x, rad.y);
    ctx.lineTo(p0.x, p0.y);
    ctx.stroke();
    const tl = Math.hypot(pm.x - p0.x, pm.y - p0.y) || 1;
    label(ctx, "tangent", p0.x + ((pm.x - p0.x) / tl) * 40, p0.y + ((pm.y - p0.y) / tl) * 40 - 8, "rgba(165,243,252,0.9)");
  }

  const centre = { x: cx, y: cy };
  const objS = S(pos);

  // Centre: the person holding the string, or the middle of the roundabout.
  if (scene === "ball") {
    if (!released) {
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(centre.x, centre.y);
      ctx.lineTo(objS.x, objS.y);
      ctx.stroke();
    }
    ctx.fillStyle = "#334155";
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.arc(centre.x, centre.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath();
    ctx.arc(centre.x, centre.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // The object.
  const objHeading = riding ? heading + a : heading;
  if (scene === "ball") {
    const rad = 5 + m * 6;
    const g = ctx.createRadialGradient(objS.x - rad / 3, objS.y - rad / 3, 1, objS.x, objS.y, rad);
    g.addColorStop(0, "#fde68a");
    g.addColorStop(1, "#f59e0b");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(objS.x, objS.y, rad, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const L = Math.max(16, 4.5 * scale);
    const W = Math.max(8, 2 * scale);
    ctx.save();
    ctx.translate(objS.x, objS.y);
    ctx.rotate(-objHeading);
    ctx.fillStyle = "#22d3ee";
    ctx.fillRect(-L / 2, -W / 2, L, W);
    ctx.fillStyle = "rgba(10,13,28,0.7)";
    ctx.fillRect(L * 0.05, -W / 2 + 1.5, L * 0.22, W - 3);
    ctx.restore();
  }

  // Forces.
  const toC = { x: centre.x - objS.x, y: centre.y - objS.y };
  const dC = Math.hypot(toC.x, toC.y) || 1;
  const ux = toC.x / dC;
  const uy = toC.y / dC;
  const F = centripetalForce(m, v, r);
  const Fref = scene === "ball" ? 10 : 10_000;
  const rPx = r * scale;
  const maxLen = Math.max(24, rPx * 0.85);
  // Keep both arrows on the canvas: no longer than the room outward, and not past the centre.
  const room = roomAlong(objS.x, objS.y, -ux, -uy, w, h);
  const L = Math.max(12, Math.min(maxLen, (F / Fref) * 38, riding ? room : Infinity, dC - 10));
  const fLabel =
    scene === "ball" ? `tension ${F < 10 ? F.toFixed(2) : F.toFixed(1)} N` : hideNums ? "friction" : `friction ${(Math.min(F, maxFriction(m, mu)) / 1000).toFixed(1)} kN`;
  if (!released) {
    arrow(ctx, objS.x, objS.y, objS.x + ux * L, objS.y + uy * L, COL_IN, { label: fLabel });
    if (riding) arrow(ctx, objS.x, objS.y, objS.x - ux * L, objS.y - uy * L, COL_OUT, { dashed: true, label: "centrifugal (apparent)" });
    else {
      const vl = 16 + v * (scene === "ball" ? 5 : 1.6);
      arrow(ctx, objS.x, objS.y, objS.x + Math.cos(objHeading) * vl, objS.y - Math.sin(objHeading) * vl, COL_V, { label: "velocity", width: 2 });
    }
  } else if (!riding) {
    const vl = 16 + v * (scene === "ball" ? 5 : 1.6);
    arrow(ctx, objS.x, objS.y, objS.x + Math.cos(objHeading) * vl, objS.y - Math.sin(objHeading) * vl, COL_V, { width: 2 });
  }

  // Header.
  ctx.font = "bold 12px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = riding ? "#c4b5fd" : "rgba(255,255,255,0.75)";
  ctx.fillText(riding ? "Riding along: you turn with it" : "From outside: the ground stays still", 8, 16);
  ctx.font = FONT;
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.textAlign = "right";
  ctx.fillText(scene === "ball" ? "top view · slowed 3×" : "top view · sped up 2×", w - 8, h - 8);
  ctx.textAlign = "left";
}

/** Orthographic Earth seen from a little above the equator. */
function drawEarth(ctx: CanvasRenderingContext2D, w: number, h: number, phase: number, lat: number) {
  const R = Math.min(w * 0.34, h * 0.34);
  const cx = w / 2;
  const cy = h / 2 + 8;
  const tilt = (16 * Math.PI) / 180;
  const proj = (latD: number, lon: number) => {
    const phi = (latD * Math.PI) / 180;
    const X = Math.cos(phi) * Math.sin(lon);
    const Y = Math.cos(phi) * Math.cos(lon);
    const Z = Math.sin(phi);
    return { x: cx + R * X, y: cy - R * (Z * Math.cos(tilt) - Y * Math.sin(tilt)), front: Y * Math.cos(tilt) + Z * Math.sin(tilt) >= 0 };
  };

  // Axis.
  const north = { x: cx, y: cy - R * Math.cos(tilt) };
  const south = { x: cx, y: cy + R * Math.cos(tilt) };
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(cx, south.y + 22);
  ctx.lineTo(cx, north.y - 22);
  ctx.stroke();
  ctx.setLineDash([]);

  // Globe.
  const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R);
  g.addColorStop(0, "#1e6fb8");
  g.addColorStop(1, "#0b2a52");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(103,232,249,0.5)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Meridians (they turn with the Earth) and the equator.
  const path = (pts: { x: number; y: number; front: boolean }[], color: string, width = 1) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    let on = false;
    for (const p of pts) {
      if (!p.front) {
        on = false;
        continue;
      }
      if (on) ctx.lineTo(p.x, p.y);
      else ctx.moveTo(p.x, p.y);
      on = true;
    }
    ctx.stroke();
  };
  for (let k = 0; k < 12; k++) {
    const lon = phase + (k * Math.PI) / 6;
    const pts = [];
    for (let d = -90; d <= 90; d += 5) pts.push(proj(d, lon));
    path(pts, "rgba(165,243,252,0.18)");
  }
  const ring = (latD: number) => {
    const pts = [];
    for (let i = 0; i <= 72; i++) pts.push(proj(latD, (i / 72) * Math.PI * 2));
    return pts;
  };
  path(ring(0), "rgba(165,243,252,0.35)");
  // The circle this person travels round each day.
  if (lat < 89.9) path(ring(lat), "#fbbf24", 2);

  // The person, carried round by the spin.
  const lonP = phase;
  const p = proj(lat, lonP);
  const axisPt = { x: cx, y: cy - R * Math.sin((lat * Math.PI) / 180) * Math.cos(tilt) };
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.beginPath();
  ctx.arc(axisPt.x, axisPt.y, 2.5, 0, Math.PI * 2);
  ctx.fill();
  const front = p.front || lat > 80;
  if (front) {
    const dx = axisPt.x - p.x;
    const dy = axisPt.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d > 8) arrow(ctx, p.x, p.y, p.x + dx * 0.55, p.y + dy * 0.55, COL_IN, { label: "towards the axis" });
    ctx.fillStyle = "#fb923c";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.font = FONT;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.textAlign = "left";
  ctx.fillText("N", cx + 6, north.y - 12);
  ctx.textAlign = "left";
  ctx.font = "bold 12px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(`You at ${lat.toFixed(lat % 1 ? 1 : 0)}° N: ${Math.round(spinSpeed(lat))} m/s eastward`, 8, 16);
  ctx.font = FONT;
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.textAlign = "right";
  ctx.fillText(`one day plays in ${EARTH_TURN_S} s`, w - 8, h - 8);
  ctx.textAlign = "left";
  if (!front) {
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText("(you are on the far side now)", 8, h - 8);
  }
}

function drawEarthDisc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, "#1e6fb8");
  g.addColorStop(1, "#0b2a52");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(103,232,249,0.6)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawSat(ctx: CanvasRenderingContext2D, w: number, h: number, r0: number, sat: Sat | null) {
  const cx = w / 2;
  const cy = h / 2 + 6;
  const scale = (Math.min(w, h) / 2 - 14) / (r0 * 1.3);
  const S = (p: Pt) => ({ x: cx + p.x * scale, y: cy - p.y * scale });
  // Thin air layer, then Earth.
  ctx.fillStyle = "rgba(103,232,249,0.08)";
  ctx.beginPath();
  ctx.arc(cx, cy, (R_EARTH + 100e3) * scale, 0, Math.PI * 2);
  ctx.fill();
  drawEarthDisc(ctx, cx, cy, R_EARTH * scale);

  // Target height.
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  ctx.arc(cx, cy, r0 * scale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  if (sat && sat.trail.length > 1) {
    ctx.strokeStyle = sat.fate === "orbit" ? "rgba(163,230,53,0.8)" : "rgba(251,191,36,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    sat.trail.forEach((p, i) => {
      const q = S(p);
      if (i) ctx.lineTo(q.x, q.y);
      else ctx.moveTo(q.x, q.y);
    });
    ctx.stroke();
  }
  const pos = sat ? { x: sat.x, y: sat.y } : { x: 0, y: r0 };
  const q = S(pos);
  const d = Math.hypot(pos.x, pos.y);
  if (!sat || !sat.done || d > R_EARTH * 1.001) {
    // Gravity arrow: always towards the centre of the Earth.
    const gl = 26;
    arrow(ctx, q.x, q.y, q.x - (pos.x / d) * gl, q.y + (pos.y / d) * gl, COL_IN, { label: "gravity" });
    const vx = sat ? sat.vx : -1;
    const vy = sat ? sat.vy : 0;
    const vv = Math.hypot(vx, vy) || 1;
    if (!sat) arrow(ctx, q.x, q.y, q.x + (vx / vv) * 30, q.y - (vy / vv) * 30, COL_V, { label: "launch", width: 2 });
  }
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(q.x - 3, q.y - 3, 6, 6);
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(q.x - 9, q.y - 1.5, 5, 3);
  ctx.fillRect(q.x + 4, q.y - 1.5, 5, 3);
  if (sat?.done && sat.fate === "crash") label(ctx, "crashed", q.x, q.y - 10, "#fcd34d");

  ctx.font = "bold 12px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.textAlign = "left";
  ctx.fillText("Launch sideways from the dashed height", 8, 16);
  ctx.font = FONT;
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.textAlign = "right";
  ctx.fillText(`to scale · one circular orbit plays in ${ORBIT_PLAY_S} s`, w - 8, h - 8);
  ctx.textAlign = "left";
}

function drawBody(ctx: CanvasRenderingContext2D, w: number, h: number, body: "moon" | "sun", phase: number) {
  const cx = w / 2;
  const cy = h / 2 + 6;
  const R = Math.min(w, h) / 2 - 34;
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  if (body === "moon") drawEarthDisc(ctx, cx, cy, 16);
  else {
    ctx.fillStyle = "#fde047";
    ctx.shadowColor = "#fde047";
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  const x = cx + R * Math.cos(phase);
  const y = cy - R * Math.sin(phase);
  const ux = (cx - x) / R;
  const uy = (cy - y) / R;
  arrow(ctx, x, y, x + ux * 40, y + uy * 40, COL_IN, { label: "gravity" });
  arrow(ctx, x, y, x - Math.sin(phase) * 36, y - Math.cos(phase) * 36, COL_V, { label: "velocity", width: 2 });
  if (body === "moon") {
    ctx.fillStyle = "#d4d4d8";
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  } else drawEarthDisc(ctx, x, y, 7);
  ctx.font = "bold 12px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(body === "moon" ? "Earth's gravity holds the Moon" : "The Sun's gravity holds the Earth", 8, 16);
  ctx.font = FONT;
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.textAlign = "right";
  ctx.fillText(`sizes not to scale · one ${body === "moon" ? "month" : "year"} plays in 8 s`, w - 8, h - 8);
  ctx.textAlign = "left";
}
