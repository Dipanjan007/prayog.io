"use client";

import { useEffect, useRef, useState } from "react";
import {
  C,
  MUON_LIFETIME,
  MUON_START_HEIGHT,
  clockRate,
  gamma,
  gpsDrift,
  muonRange,
  muonSurvival,
  orbitalSpeed,
  GPS_ORBIT_RADIUS,
  rangeError,
  twinTrip,
} from "@/lib/sim/relativity";
import { fitCanvas } from "./canvas";

export type ClockMode = "light" | "clock" | "muon" | "gps" | "twins";

export interface TwinTrip {
  id: number;
  beta: number;
  distanceLy: number;
  earthYears: number;
  shipYears: number;
  mystery: boolean;
}

export interface LightClockReading {
  mode: ClockMode;
  /** Light clock mode: the train's speed as a fraction of c, and its γ. */
  beta: number;
  gamma: number;
  /** Light speed mode: what has been fired from the train so far. */
  fired: { ball: boolean; light: boolean };
  /** The last finished muon launch. */
  muon: { id: number; beta: number; reached: boolean } | null;
  /** GPS mode: days run without correcting the clocks, and which effects are switched on. */
  gps: { days: number; speed: boolean; gravity: boolean; fixed: boolean };
  /** The last finished twin trip. */
  trip: TwinTrip | null;
}

interface Props {
  onReading?: (r: LightClockReading) => void;
  /** Challenge: Twins mode only, with a fixed trip and the Earth calendar hidden. */
  mystery?: { beta: number; distanceLy: number; star: string } | null;
}

const MODES: { id: ClockMode; label: string }[] = [
  { id: "light", label: "Light speed" },
  { id: "clock", label: "Light clock" },
  { id: "muon", label: "Muons" },
  { id: "gps", label: "GPS" },
  { id: "twins", label: "Twins" },
];

const BALL_KMH = 140;
/** Light clock: seconds for one trip between the mirrors on screen, for a clock at rest. */
const ONE_WAY_S = 0.6;
/** Muon animation length (s on screen) for the full 15 km fall. */
const MUON_ANIM_S = 3.2;
/** GPS mode: screen seconds per simulated day. */
const GPS_S_PER_DAY = 3;
const GPS_MAX_DAYS = 7;
const TRIP_ANIM_S = 4.5;
const TWIN_START_AGE = 14;
const STARS = [
  { name: "Proxima Centauri", ly: 4.2 },
  { name: "Sirius", ly: 8.6 },
  { name: "Vega", ly: 25 },
];
const DRIFT = gpsDrift();

const CYAN = "#22d3ee";
const VIOLET = "#a78bfa";
const PINK = "#f472b6";
const YELLOW = "#fde047";
const FONT = "11px system-ui, sans-serif";

type Shot = { kind: "ball" | "light"; start: number; x0: number };
type MuonRun = { id: number; start: number; beta: number; reported: boolean };
type TripRun = { id: number; start: number; beta: number; distanceLy: number; mystery: boolean; reported: boolean };

export default function LightClockLab({ onReading, mystery = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setModeState] = useState<ClockMode>("light");
  const [trainKmh, setTrainKmh] = useState(160);
  const [fired, setFired] = useState({ ball: false, light: false });
  const [lastShot, setLastShot] = useState<"ball" | "light" | null>(null);
  const [beta, setBeta] = useState(0.5);
  const [muonBeta, setMuonBeta] = useState(0.995);
  const [muon, setMuon] = useState<LightClockReading["muon"]>(null);
  const [muonBusy, setMuonBusy] = useState(false);
  const [gpsSpeed, setGpsSpeed] = useState(true);
  const [gpsGravity, setGpsGravity] = useState(true);
  const [gpsFixed, setGpsFixed] = useState(false);
  const [gpsRunning, setGpsRunning] = useState(false);
  const [gpsDays, setGpsDays] = useState(0);
  const [star, setStar] = useState(0);
  const [twinBeta, setTwinBeta] = useState(0.5);
  const [trip, setTrip] = useState<TwinTrip | null>(null);
  const [tripBusy, setTripBusy] = useState(false);
  const [ticks, setTicks] = useState({ platform: 0, train: 0 });

  const shotRef = useRef<Shot | null>(null);
  const muonRef = useRef<MuonRun | null>(null);
  const tripRef = useRef<TripRun | null>(null);
  const gpsDaysRef = useRef(0);
  const clockRef = useRef({ phaseP: 0, phaseT: 0, xw: 0, trail: [] as { x: number; y: number }[] });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: ClockMode = mystery ? "twins" : mode;
  const tripBeta = mystery?.beta ?? twinBeta;
  const tripLy = mystery?.distanceLy ?? STARS[star].ly;
  const gpsPerDay = (gpsSpeed ? DRIFT.speed : 0) + (gpsGravity ? DRIFT.gravity : 0);
  const gpsError = gpsFixed ? 0 : gpsPerDay * gpsDays;

  const params = useRef({ activeMode, trainKmh, beta, muonBeta, gpsRunning, gpsErrorPerDay: gpsFixed ? 0 : gpsPerDay, tripBeta, tripLy, mystery: !!mystery });
  useEffect(() => {
    params.current = { activeMode, trainKmh, beta, muonBeta, gpsRunning, gpsErrorPerDay: gpsFixed ? 0 : gpsPerDay, tripBeta, tripLy, mystery: !!mystery };
  });

  const setMode = (m: ClockMode) => {
    setModeState(m);
    setGpsRunning(false);
  };

  const fire = (kind: "ball" | "light") => {
    shotRef.current = { kind, start: performance.now(), x0: NaN };
    setLastShot(kind);
    setFired((f) => (f[kind] ? f : { ...f, [kind]: true }));
  };

  const launchMuon = () => {
    muonRef.current = { id: (muonRef.current?.id ?? 0) + 1, start: performance.now(), beta: muonBeta, reported: false };
    setMuonBusy(true);
  };

  const launchTrip = () => {
    tripRef.current = { id: (tripRef.current?.id ?? 0) + 1, start: performance.now(), beta: tripBeta, distanceLy: tripLy, mystery: !!mystery, reported: false };
    setTripBusy(true);
  };

  const resetClocks = () => {
    clockRef.current = { phaseP: 0, phaseT: 0, xw: 0, trail: [] };
    setTicks({ platform: 0, train: 0 });
  };

  const resetGps = () => {
    gpsDaysRef.current = 0;
    setGpsDays(0);
    setGpsRunning(false);
  };

  // ---------- Animation loop ----------
  useEffect(() => {
    const c = canvasRef.current!;
    let raf = 0;
    let last = performance.now();
    let trainX = 0;
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

      if (P.activeMode === "light") {
        // Train speed on screen: 300 km/h crosses the canvas in about 2.5 s.
        const pxPerKmh = w / 2.5 / 300;
        trainX += P.trainKmh * pxPerKmh * dt;
        const shot = shotRef.current;
        if (shot && Number.isNaN(shot.x0)) {
          // Pin the shot to the screen. If the train's front is not in view, bring the train back in first.
          const span = w + trainLen(w);
          let front = ((trainX % span) + span) % span;
          if (front < 0.1 * w || front > 0.6 * w) {
            trainX += 0.25 * w - front;
            front = 0.25 * w;
          }
          shot.x0 = front;
        }
        drawLightSpeed(ctx, w, h, trainX, P.trainKmh, pxPerKmh, shotRef.current, now);
      } else if (P.activeMode === "clock") {
        const k = clockRef.current;
        const rate = clockRate(P.beta);
        const before = { p: Math.floor(k.phaseP / 2), t: Math.floor(k.phaseT / 2) };
        k.phaseP += dt / ONE_WAY_S;
        k.phaseT += (dt / ONE_WAY_S) * rate;
        const H = clockGeom(h).H;
        k.xw += (P.beta * H * dt) / ONE_WAY_S;
        const after = { p: Math.floor(k.phaseP / 2), t: Math.floor(k.phaseT / 2) };
        if (after.p !== before.p || after.t !== before.t) setTicks({ platform: after.p, train: after.t });
        drawLightClock(ctx, w, h, P.beta, k);
      } else if (P.activeMode === "muon") {
        const run = muonRef.current;
        let prog: number | null = null;
        if (run) {
          prog = Math.min(1, (now - run.start) / 1000 / MUON_ANIM_S);
          if (prog >= 1 && !run.reported) {
            run.reported = true;
            setMuon({ id: run.id, beta: run.beta, reached: muonRange(run.beta) >= MUON_START_HEIGHT });
            setMuonBusy(false);
          }
        }
        drawMuons(ctx, w, h, run ? run.beta : P.muonBeta, prog);
      } else if (P.activeMode === "gps") {
        if (P.gpsRunning) {
          gpsDaysRef.current = Math.min(GPS_MAX_DAYS, gpsDaysRef.current + dt / GPS_S_PER_DAY);
          const q = Math.floor(gpsDaysRef.current * 20) / 20;
          setGpsDays((d) => (d === q ? d : q));
          if (gpsDaysRef.current >= GPS_MAX_DAYS) setGpsRunning(false);
        }
        drawGps(ctx, w, h, gpsDaysRef.current, P.gpsErrorPerDay * gpsDaysRef.current, now);
      } else {
        const run = tripRef.current;
        let prog: number | null = null;
        if (run && run.mystery === P.mystery) {
          prog = Math.min(1, (now - run.start) / 1000 / TRIP_ANIM_S);
          if (prog >= 1 && !run.reported) {
            run.reported = true;
            const t = twinTrip(run.distanceLy, run.beta);
            setTrip({ id: run.id, beta: run.beta, distanceLy: run.distanceLy, mystery: run.mystery, ...t });
            setTripBusy(false);
          }
        }
        const live = run && prog !== null ? run : null;
        drawTwins(ctx, w, h, live?.beta ?? P.tripBeta, live?.distanceLy ?? P.tripLy, prog, P.mystery);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const g = gamma(beta);
  const gpsDaysWhole = Math.floor(gpsDays);
  useEffect(() => {
    onReadingRef.current?.({
      mode: activeMode,
      beta,
      gamma: g,
      fired,
      muon,
      gps: { days: gpsDaysWhole, speed: gpsSpeed, gravity: gpsGravity, fixed: gpsFixed },
      trip,
    });
  }, [activeMode, beta, g, fired, muon, gpsDaysWhole, gpsSpeed, gpsGravity, gpsFixed, trip]);

  const lastTrip = trip && trip.mystery === !!mystery ? trip : null;
  const mGamma = gamma(muonBeta);

  return (
    <div className="flex flex-col gap-3 select-none">
      {!mystery && (
        <div className="grid grid-cols-5 gap-1 rounded-2xl bg-black/20 p-1 text-xs sm:text-sm">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)} className={`rounded-xl px-0.5 py-2 leading-tight ${activeMode === m.id ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m.label}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-72 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={ariaFor(activeMode, trainKmh, beta, muonBeta, tripBeta, tripLy)}
      />

      {activeMode === "light" && (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Stat label="Speed on the train" value={lastShot === "light" ? "c" : lastShot === "ball" ? `${BALL_KMH} km/h` : "–"} />
            <Stat label="Seen from platform" value={lastShot === "light" ? "c" : lastShot === "ball" ? `${BALL_KMH + trainKmh} km/h` : "–"} />
          </div>
          {lastShot && (
            <p className={`text-center text-sm ${lastShot === "light" ? "text-lime-300" : "text-white/70"}`}>
              {lastShot === "ball"
                ? `The speeds add: ${BALL_KMH} + ${trainKmh} = ${BALL_KMH + trainKmh} km/h.`
                : `Light still goes at c = ${(C / 1000).toLocaleString("en-IN")} km/s, not c + ${trainKmh} km/h. Both people measure the same speed.`}
            </p>
          )}
          <Slider label="Train speed" value={`${trainKmh} km/h`} min={0} max={300} step={10} v={trainKmh} onChange={setTrainKmh} />
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost !px-2 !py-2 text-sm" onClick={() => fire("ball")}>
              🏏 Bowl a ball
            </button>
            <button className="btn-primary !px-2 !py-2 text-sm" onClick={() => fire("light")}>
              🔦 Flash the torch
            </button>
          </div>
          <p className="text-center text-xs text-white/40">
            The ball leaves the bowler at {BALL_KMH} km/h. The light pulse is drawn hugely slowed down so you can see it.
          </p>
        </>
      )}

      {activeMode === "clock" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Speed" value={`${beta.toFixed(3)}c`} />
            <Stat label="γ" value={g < 100 ? g.toFixed(3) : "huge"} />
            <Stat label="Train clock rate" value={`${(100 / g).toFixed(1)}%`} />
          </div>
          <p className="text-center text-xs text-white/50 tabular-nums">
            Platform clock: {ticks.platform} {ticks.platform === 1 ? "tick" : "ticks"} · Train clock: {ticks.train} {ticks.train === 1 ? "tick" : "ticks"} · 1 tick on the train = {g.toFixed(2)} ticks on the platform
          </p>
          <Slider label="Train speed (fraction of light speed)" value={`${beta.toFixed(3)}c`} min={0} max={0.99} step={0.001} v={beta} onChange={setBeta} />
          <button className="btn-ghost !py-2 text-sm" onClick={resetClocks}>
            ↺ Reset both clocks to zero
          </button>
        </>
      )}

      {activeMode === "muon" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="γ" value={mGamma.toFixed(1)} />
            <Stat label="Range, no dilation" value={`${Math.round(muonRange(muonBeta, false))} m`} />
            <Stat label="Range, real" value={`${(muonRange(muonBeta) / 1000).toFixed(1)} km`} />
          </div>
          {muon && (
            <p className={`text-center text-sm ${muon.reached ? "text-lime-300" : "text-amber-200"}`}>
              {muon.reached
                ? `The real muon reached the ground! About ${Math.round(muonSurvival(MUON_START_HEIGHT, muon.beta) * 100)}% of muons at ${muon.beta}c survive the 15 km trip.`
                : `Not far enough. At ${muon.beta}c an average muon travels only ${(muonRange(muon.beta) / 1000).toFixed(1)} km. Go faster.`}
            </p>
          )}
          <Slider label="Muon speed" value={`${muonBeta.toFixed(4)}c`} min={0.99} max={0.9999} step={0.0001} v={muonBeta} onChange={setMuonBeta} />
          <button className="btn-primary !py-2 text-sm disabled:opacity-50" onClick={launchMuon} disabled={muonBusy}>
            ☄️ A cosmic ray hits the air: make a muon
          </button>
          <p className="text-center text-xs text-white/40">
            A muon at rest lives {MUON_LIFETIME * 1e6} μs on average. Distances shown are for an average muon.
          </p>
        </>
      )}

      {activeMode === "gps" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Days" value={gpsDays.toFixed(1)} />
            <Stat label="Clock error" value={`${gpsError >= 0 ? "+" : "−"}${Math.abs(gpsError * 1e6).toFixed(1)} μs`} />
            <Stat label="Map error" value={`${(rangeError(gpsError) / 1000).toFixed(1)} km`} />
          </div>
          <p className="text-center text-xs text-white/50 tabular-nums">
            Each day: speed {(DRIFT.speed * 1e6).toFixed(1)} μs, gravity +{(DRIFT.gravity * 1e6).toFixed(1)} μs, net +{(DRIFT.net * 1e6).toFixed(1)} μs. Orbit speed{" "}
            {(orbitalSpeed(GPS_ORBIT_RADIUS) / 1000).toFixed(2)} km/s.
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Toggle on={gpsSpeed} onClick={() => setGpsSpeed(!gpsSpeed)} label="Speed effect" />
            <Toggle on={gpsGravity} onClick={() => setGpsGravity(!gpsGravity)} label="Gravity effect" />
            <Toggle on={gpsFixed} onClick={() => setGpsFixed(!gpsFixed)} label="Engineers' fix" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-primary !py-2 text-sm" onClick={() => (gpsDays >= GPS_MAX_DAYS ? (resetGps(), setGpsRunning(true)) : setGpsRunning(!gpsRunning))}>
              {gpsRunning ? "⏸ Pause" : "▶ Let the days pass"}
            </button>
            <button className="btn-ghost !py-2 text-sm" onClick={resetGps}>
              ↺ Day 0
            </button>
          </div>
        </>
      )}

      {activeMode === "twins" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="γ" value={gamma(tripBeta).toFixed(2)} />
            <Stat label="Earth twin ages" value={lastTrip ? (mystery ? "?" : `${lastTrip.earthYears.toFixed(1)} yr`) : "–"} />
            <Stat label="Astronaut ages" value={lastTrip ? `${lastTrip.shipYears.toFixed(1)} yr` : "–"} />
          </div>
          {lastTrip && !mystery && (
            <p className="text-center text-sm text-white/70">
              The astronaut comes home {(lastTrip.earthYears - lastTrip.shipYears).toFixed(1)} years younger than her twin.
            </p>
          )}
          {mystery ? (
            <p className="text-center text-sm text-white/70">
              Trip to {mystery.star} at {mystery.beta}c. The Earth calendar is hidden.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                {STARS.map((s, i) => (
                  <button
                    key={s.name}
                    onClick={() => setStar(i)}
                    className={`rounded-xl border px-1 py-1.5 text-xs leading-tight sm:text-sm ${star === i ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
                  >
                    {s.name}
                    <span className="block text-white/50">{s.ly} light years</span>
                  </button>
                ))}
              </div>
              <Slider label="Rocket speed" value={`${twinBeta.toFixed(2)}c`} min={0.1} max={0.99} step={0.01} v={twinBeta} onChange={setTwinBeta} />
            </>
          )}
          <button className="btn-primary !py-2 text-sm disabled:opacity-50" onClick={launchTrip} disabled={tripBusy}>
            🚀 Launch the round trip
          </button>
        </>
      )}
    </div>
  );
}

function ariaFor(mode: ClockMode, kmh: number, beta: number, muonBeta: number, tripBeta: number, ly: number) {
  switch (mode) {
    case "light":
      return `A train passes a platform at ${kmh} kilometres per hour. A ball bowled forward moves faster for the platform, but a light pulse moves at the speed of light for everyone`;
    case "clock":
      return `Two light clocks. One stands on the platform; the other rides a train at ${beta.toFixed(2)} times light speed, so its photon follows a longer zig-zag path and ticks slower`;
    case "muon":
      return `Muons made 15 kilometres up fall at ${muonBeta} times light speed. Without time dilation they decay high in the air; with it they can reach the ground`;
    case "gps":
      return "A GPS satellite orbits the Earth. Its clock drifts because of relativity, and the position on a map drifts with it";
    default:
      return `An astronaut twin flies to a star ${ly} light years away and back at ${tripBeta} times light speed while the other twin stays on Earth`;
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
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

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} aria-pressed={on} className={`rounded-xl border px-1 py-2 text-xs sm:text-sm ${on ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/60"}`}>
      {on ? "✓ " : ""}
      {label}
    </button>
  );
}

// ---------- Drawing ----------

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = "rgba(255,255,255,0.6)", align: CanvasTextAlign = "left") {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.textAlign = "left";
}

function drawTrain(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, hgt: number) {
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + len - 26, y);
  ctx.quadraticCurveTo(x + len, y + 2, x + len, y + hgt);
  ctx.lineTo(x, y + hgt);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#1d4ed8";
  ctx.fillRect(x, y + hgt - 8, len, 4);
  ctx.fillStyle = "#0a0d1c";
  for (let wx = x + 8; wx < x + len - 34; wx += 22) ctx.fillRect(wx, y + 6, 14, 9);
}

function drawLightSpeed(ctx: CanvasRenderingContext2D, w: number, h: number, trainX: number, kmh: number, pxPerKmh: number, shot: Shot | null, now: number) {
  const ground = Math.round(h * 0.62);
  label(ctx, "Seen from the platform", 8, 16);
  // Platform and rails.
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(0, ground + 10, w, h - ground - 10);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, ground + 2);
  ctx.lineTo(w, ground + 2);
  ctx.stroke();
  // Observer on the platform.
  const ox = w * 0.5;
  const oy = h - 12;
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ox, oy - 34, 6, 0, Math.PI * 2);
  ctx.moveTo(ox, oy - 28);
  ctx.lineTo(ox, oy - 12);
  ctx.lineTo(ox - 6, oy);
  ctx.moveTo(ox, oy - 12);
  ctx.lineTo(ox + 6, oy);
  ctx.stroke();
  label(ctx, "you, on the platform", ox + 12, oy - 20, "rgba(255,255,255,0.5)");

  // The train wraps around the screen.
  const len = trainLen(w);
  const span = w + len;
  const tx = (((trainX % span) + span) % span) - len;
  const ty = ground - 46;
  drawTrain(ctx, tx, ty, len, 46);
  if (kmh > 0) label(ctx, `${kmh} km/h →`, tx + 8, ty - 6, CYAN);

  if (shot && !Number.isNaN(shot.x0)) {
    const age = (now - shot.start) / 1000;
    const yy = ty + 22;
    if (shot.kind === "ball") {
      const bx = shot.x0 + 6 + (kmh + BALL_KMH) * pxPerKmh * age;
      if (bx < w + 20 && age < 4) {
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(bx, yy, 5, 0, Math.PI * 2);
        ctx.fill();
        label(ctx, `${kmh + BALL_KMH} km/h`, Math.min(bx, w - 4), yy - 12, "#fca5a5", bx > w - 60 ? "right" : "center");
      }
    } else if (age < 3) {
      // The beam is drawn slowed down enormously; its speed on screen is the same whatever the train does.
      const reach = Math.min(w + 10, shot.x0 + age * w * 1.2);
      ctx.strokeStyle = YELLOW;
      ctx.shadowColor = YELLOW;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(Math.max(shot.x0, reach - 80), yy);
      ctx.lineTo(reach, yy);
      ctx.stroke();
      ctx.shadowBlur = 0;
      label(ctx, "light: c", Math.min(reach, w - 4), yy - 12, YELLOW, "right");
    }
  }
}

function trainLen(w: number) {
  return Math.min(170, w * 0.45);
}

function clockGeom(h: number) {
  const top = 30;
  const H = Math.round(h * 0.36);
  return { top, H, bot: top + H };
}

function drawMirror(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 14, y);
  ctx.lineTo(x + 14, y);
  ctx.stroke();
}

function photon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = YELLOW;
  ctx.shadowColor = YELLOW;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function tri(phase: number) {
  const f = ((phase % 2) + 2) % 2;
  return f < 1 ? f : 2 - f;
}

function drawLightClock(ctx: CanvasRenderingContext2D, w: number, h: number, beta: number, k: { phaseP: number; phaseT: number; xw: number; trail: { x: number; y: number }[] }) {
  const { top, H, bot } = clockGeom(h);
  label(ctx, "Seen from the platform", 8, 14);
  const yOf = (phase: number) => bot - 6 - tri(phase) * (H - 12);

  // Platform clock (at rest).
  const px = 34;
  ctx.fillStyle = "rgba(34,211,238,0.07)";
  ctx.fillRect(px - 20, top - 8, 40, H + 16);
  drawMirror(ctx, px, top);
  drawMirror(ctx, px, bot);
  ctx.strokeStyle = "rgba(253,224,71,0.3)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px, top + 2);
  ctx.lineTo(px, bot - 2);
  ctx.stroke();
  photon(ctx, px, yOf(k.phaseP));

  // Train clock (moving right).
  const left = 64;
  const carW = 70;
  const span = w - left + carW;
  const sx = left - carW / 2 + (((k.xw % span) + span) % span);
  const offset = sx - k.xw;
  k.trail.push({ x: k.xw, y: tri(k.phaseT) });
  if (k.trail.length > 600) k.trail.shift();
  ctx.save();
  ctx.beginPath();
  ctx.rect(left - 6, 0, w - left + 6, h);
  ctx.clip();
  ctx.fillStyle = "rgba(167,139,250,0.10)";
  ctx.strokeStyle = "rgba(167,139,250,0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(sx - carW / 2, top - 12, carW, H + 24, 8);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(253,224,71,0.55)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  k.trail.forEach((p, i) => {
    const x = p.x + offset;
    const y = bot - 6 - p.y * (H - 12);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  drawMirror(ctx, sx, top);
  drawMirror(ctx, sx, bot);
  photon(ctx, sx, yOf(k.phaseT));
  if (beta > 0) label(ctx, `${beta.toFixed(2)}c →`, sx - carW / 2 + 4, bot + 22, VIOLET);
  ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.moveTo(left - 6, top - 14);
  ctx.lineTo(left - 6, bot + 14);
  ctx.stroke();

  // Two dials: one tick moves the hand one step; twelve ticks make a full turn.
  const dialTop = bot + 40;
  const r = Math.max(18, Math.min(34, (h - dialTop) / 2 - 10));
  const cy = dialTop + (h - dialTop) / 2 - 4;
  dial(ctx, w * 0.27, cy, r, k.phaseP / 2, "Platform clock", CYAN);
  dial(ctx, w * 0.73, cy, r, k.phaseT / 2, "Train clock", VIOLET);
}

function dial(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, ticks: number, name: string, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.sin(a) * (r - 5), y - Math.cos(a) * (r - 5));
    ctx.lineTo(x + Math.sin(a) * r, y - Math.cos(a) * r);
    ctx.stroke();
  }
  const a = (Math.floor(ticks) / 12) * Math.PI * 2;
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.sin(a) * (r - 7), y - Math.cos(a) * (r - 7));
  ctx.stroke();
  label(ctx, `${Math.floor(ticks)}`, x, y + r + 12, "white", "center");
  label(ctx, name, x, y - r - 6, color, "center");
}

function burst(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = "#fb923c";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * 4, y + Math.sin(a) * 4);
    ctx.lineTo(x + Math.cos(a) * 10, y + Math.sin(a) * 10);
    ctx.stroke();
  }
}

function drawMuons(ctx: CanvasRenderingContext2D, w: number, h: number, beta: number, prog: number | null) {
  const topY = 34;
  const ground = h - 22;
  const maxKm = 16;
  const Y = (m: number) => ground - (m / 1000 / maxKm) * (ground - topY);
  // Sky and ground.
  const g = ctx.createLinearGradient(0, topY, 0, ground);
  g.addColorStop(0, "rgba(99,102,241,0.10)");
  g.addColorStop(1, "rgba(14,165,233,0.12)");
  ctx.fillStyle = g;
  ctx.fillRect(0, topY - 10, w, ground - topY + 10);
  ctx.fillStyle = "rgba(132,204,22,0.18)";
  ctx.fillRect(0, ground, w, h - ground);
  // Height scale.
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  for (let km = 0; km <= 15; km += 5) {
    const y = Y(km * 1000);
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(46, y);
    ctx.stroke();
    label(ctx, `${km} km`, 2, y + 4, "rgba(255,255,255,0.5)");
  }
  const cols = [
    { x: w * 0.45, title: "No time dilation", range: muonRange(beta, false), color: PINK },
    { x: w * 0.78, title: "Real world", range: muonRange(beta), color: CYAN },
  ];
  const start = MUON_START_HEIGHT;
  const travelled = prog === null ? 0 : prog * start;
  for (const col of cols) {
    label(ctx, col.title, col.x, 16, col.color, "center");
    // Where the average muon decays.
    const decayAt = start - col.range;
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = col.color;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(col.x, Y(start));
    ctx.lineTo(col.x, Y(Math.max(0, decayAt)));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    if (prog === null) {
      ctx.fillStyle = col.color;
      ctx.beginPath();
      ctx.arc(col.x, Y(start), 4, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    const dead = travelled >= col.range;
    const alt = start - Math.min(travelled, col.range);
    const y = Y(Math.max(0, alt));
    const earthT = Math.min(travelled, col.range) / (beta * C);
    const ownT = col.title === "Real world" ? earthT / gamma(beta) : earthT;
    if (dead) {
      burst(ctx, col.x, y);
      label(ctx, "decayed", col.x + 12, y + 4, "#fb923c");
    } else {
      ctx.fillStyle = col.color;
      ctx.shadowColor = col.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(col.x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (alt <= 0) label(ctx, "ground!", col.x, ground + 14, "#bef264", "center");
    }
    label(ctx, `own clock ${(ownT * 1e6).toFixed(2)} μs`, col.x, Math.min(ground - 6, y + 22), "rgba(255,255,255,0.7)", "center");
  }
}

function drawGps(ctx: CanvasRenderingContext2D, w: number, h: number, days: number, clockErr: number, now: number) {
  // Earth and orbit (not to scale).
  const R = Math.min(h * 0.15, w * 0.1);
  const cx = Math.min(w * 0.25, R * 2.6 + 6);
  const cy = h * 0.48;
  const orbitR = R * 2.3;
  label(ctx, "Orbit not to scale", 6, 14, "rgba(255,255,255,0.4)");
  const grad = ctx.createRadialGradient(cx - R / 3, cy - R / 3, R / 5, cx, cy, R);
  grad.addColorStop(0, "#38bdf8");
  grad.addColorStop(1, "#1e3a8a");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, orbitR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // A GPS satellite goes round twice a day.
  const a = days * 2 * Math.PI * 2 + now / 4000;
  const sx = cx + Math.cos(a) * orbitR;
  const sy = cy + Math.sin(a) * orbitR;
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(sx - 4, sy - 4, 8, 8);
  ctx.fillStyle = "#60a5fa";
  ctx.fillRect(sx - 14, sy - 2, 8, 4);
  ctx.fillRect(sx + 6, sy - 2, 8, 4);
  label(ctx, "GPS satellite", Math.max(36, Math.min(sx, mxLeft(cx, orbitR) - 36)), sy - 10, "rgba(255,255,255,0.7)", "center");

  // Map: true position in the middle; the GPS fix drifts by c × clock error.
  const mx0 = mxLeft(cx, orbitR);
  const mw = w - mx0 - 8;
  const my0 = 26;
  const mh = h - my0 - 26;
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(mx0, my0, mw, mh, 10);
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  for (let gx = mx0 + 12; gx < mx0 + mw; gx += 24) {
    ctx.beginPath();
    ctx.moveTo(gx, my0);
    ctx.lineTo(gx, my0 + mh);
    ctx.stroke();
  }
  for (let gy = my0 + 12; gy < my0 + mh; gy += 24) {
    ctx.beginPath();
    ctx.moveTo(mx0, gy);
    ctx.lineTo(mx0 + mw, gy);
    ctx.stroke();
  }
  const pxPerKm = (mw - 30) / 60; // the map is about 60 km wide
  const youX = mx0 + 16;
  const youY = my0 + mh / 2;
  const errKm = rangeError(clockErr) / 1000;
  const dotX = youX + errKm * pxPerKm;
  ctx.fillStyle = "#bef264";
  ctx.beginPath();
  ctx.arc(youX, youY, 5, 0, Math.PI * 2);
  ctx.fill();
  label(ctx, "you", youX - 6, youY + 18, "#bef264");
  if (errKm > 0.05) {
    ctx.strokeStyle = "rgba(244,114,182,0.5)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(youX, youY);
    ctx.lineTo(Math.min(dotX, mx0 + mw - 6), youY);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.fillStyle = PINK;
  ctx.shadowColor = PINK;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(Math.min(dotX, mx0 + mw - 8), youY - 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
  label(ctx, dotX > mx0 + mw - 8 ? "GPS fix: off the map →" : "GPS thinks you are here", mx0 + 6, youY - 16, PINK);
  // 10 km scale bar.
  const sbY = my0 + mh - 10;
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.beginPath();
  ctx.moveTo(mx0 + 10, sbY);
  ctx.lineTo(mx0 + 10 + 10 * pxPerKm, sbY);
  ctx.stroke();
  label(ctx, "10 km", mx0 + 14 + 10 * pxPerKm, sbY + 4, "rgba(255,255,255,0.6)");
  label(ctx, `Day ${days.toFixed(1)}`, mx0 + 6, my0 - 8, "rgba(255,255,255,0.7)");
}

function mxLeft(cx: number, orbitR: number) {
  return cx + orbitR + 16;
}

function drawTwins(ctx: CanvasRenderingContext2D, w: number, h: number, beta: number, ly: number, prog: number | null, mystery: boolean) {
  const y = h * 0.34;
  const ex = 34;
  const sx = w - 34;
  // Earth.
  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.arc(ex, y, 14, 0, Math.PI * 2);
  ctx.fill();
  label(ctx, "Earth", ex, y + 30, "rgba(255,255,255,0.6)", "center");
  // Star.
  ctx.fillStyle = YELLOW;
  ctx.shadowColor = YELLOW;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(sx, y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  label(ctx, "star", sx, y + 30, "rgba(255,255,255,0.6)", "center");
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  ctx.moveTo(ex + 18, y);
  ctx.lineTo(sx - 14, y);
  ctx.stroke();
  ctx.setLineDash([]);
  label(ctx, `${ly} light years`, w / 2, y - 22, "rgba(255,255,255,0.6)", "center");

  const t = twinTrip(ly, beta);
  const f = prog ?? 0;
  const out = f < 0.5 ? f * 2 : 2 - f * 2;
  const rx = ex + 20 + out * (sx - ex - 40);
  const dir = f < 0.5 ? 1 : -1;
  ctx.save();
  ctx.translate(rx, y);
  ctx.scale(dir, 1);
  ctx.fillStyle = "#e2e8f0";
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-8, -6);
  ctx.lineTo(-8, 6);
  ctx.closePath();
  ctx.fill();
  if (prog !== null && prog < 1) {
    ctx.fillStyle = "#fb923c";
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(-16 - Math.random() * 4, 0);
    ctx.lineTo(-8, 4);
    ctx.fill();
  }
  ctx.restore();
  if (prog !== null && prog < 1) label(ctx, `${beta}c`, rx, y - 10, VIOLET, "center");

  // The twins and their ages.
  const by = h * 0.62;
  const earthAge = TWIN_START_AGE + f * t.earthYears;
  const shipAge = TWIN_START_AGE + f * t.shipYears;
  twin(ctx, w * 0.27, by, CYAN, "Earth twin", mystery ? "age ?" : `age ${earthAge.toFixed(1)}`);
  twin(ctx, w * 0.73, by, VIOLET, "Astronaut twin", `age ${shipAge.toFixed(1)}`);
  if (prog === 1 && !mystery) label(ctx, `${(earthAge - shipAge).toFixed(1)} years apart`, w / 2, h - 10, "#bef264", "center");
  if (prog === null) label(ctx, `Both twins start at age ${TWIN_START_AGE}`, w / 2, h - 10, "rgba(255,255,255,0.5)", "center");
}

function twin(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, name: string, age: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.moveTo(x, y + 7);
  ctx.lineTo(x, y + 26);
  ctx.lineTo(x - 7, y + 38);
  ctx.moveTo(x, y + 26);
  ctx.lineTo(x + 7, y + 38);
  ctx.moveTo(x - 9, y + 15);
  ctx.lineTo(x + 9, y + 15);
  ctx.stroke();
  label(ctx, name, x, y - 14, color, "center");
  ctx.font = "bold 14px system-ui, sans-serif";
  label(ctx, age, x, y + 56, "white", "center");
  ctx.font = FONT;
}
