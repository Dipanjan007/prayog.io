"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ANGLE_DEG,
  BUMP,
  LENGTH_CM,
  MASS_G,
  RACERS,
  TRACK_M,
  advanceSwing,
  finishTime,
  oscillations,
  positionAt,
  release,
  speedAnswerOk,
  toKmh,
  type RacerId,
  type Swing,
} from "@/lib/sim/timemotion";

export type TimeMode = "pendulum" | "race";

/** Oscillations timed in each run, like the NCERT activity. */
export const COUNT = 10;

export interface PendulumRun {
  id: number;
  lengthCm: number;
  massG: number;
  angle: number;
  /** Stopwatch time for COUNT oscillations, s. */
  total: number;
  /** Time period, s. */
  period: number;
}

export interface TimeReading {
  mode: TimeMode;
  /** Every finished pendulum run, oldest first. */
  runs: PendulumRun[];
  /** Racers that have crossed the finish line in some race. */
  raced: RacerId[];
  /** Racers whose speed the student has worked out correctly. */
  speedsFound: RacerId[];
}

interface Props {
  onReading?: (r: TimeReading) => void;
  /** Challenge: the target time period. Locks the lab to the pendulum. */
  target?: number | null;
}

const racer = (id: RacerId) => RACERS.find((r) => r.id === id)!;

export default function TimeLab({ onReading, target = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<TimeMode>("pendulum");
  const [lengthCm, setLengthCm] = useState(50);
  const [massG, setMassG] = useState(100);
  const [angle, setAngle] = useState(10);
  const [fast, setFast] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Pendulum.
  const swing = useRef<Swing>(release(10));
  const [swinging, setSwinging] = useState(false);
  const [clock, setClockState] = useState({ t: 0, osc: 0 });
  /** The same stopwatch reading, for drawing inside the animation loop. */
  const clockRef = useRef({ t: 0, osc: 0 });
  const setClock = useCallback((c: { t: number; osc: number }) => {
    clockRef.current = c;
    setClockState(c);
  }, []);
  const [runs, setRuns] = useState<PendulumRun[]>([]);

  // Race.
  const [lanes, setLanes] = useState<RacerId[]>(["cycle", "auto"]);
  const raceT = useRef(0);
  const [racing, setRacing] = useState(false);
  const [raceClock, setRaceClock] = useState(0);
  const [results, setResults] = useState<RacerId[]>([]);
  const [raced, setRaced] = useState<RacerId[]>([]);
  const [answers, setAnswers] = useState<Partial<Record<RacerId, string>>>({});
  const [checked, setChecked] = useState<Partial<Record<RacerId, boolean>>>({});
  const [speedsFound, setSpeedsFound] = useState<RacerId[]>([]);

  const activeMode: TimeMode = target !== null ? "pendulum" : mode;
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  useEffect(() => {
    onReadingRef.current?.({ mode: activeMode, runs, raced, speedsFound });
  }, [activeMode, runs, raced, speedsFound]);

  useEffect(() => {
    const c = canvasRef.current!;
    const ro = new ResizeObserver(() => setSize({ w: c.clientWidth, h: c.clientHeight }));
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c || !size.w) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (c.width !== Math.round(size.w * dpr) || c.height !== Math.round(size.h * dpr)) {
      c.width = Math.round(size.w * dpr);
      c.height = Math.round(size.h * dpr);
    }
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);
    if (activeMode === "pendulum") {
      drawPendulum(ctx, size.w, size.h, { lengthCm, massG, angle, theta: swing.current.theta, ...clockRef.current, target });
    } else drawRace(ctx, size.w, size.h, lanes, raceT.current);
  }, [size, activeMode, lengthCm, massG, angle, lanes, target]);

  // Redraw whenever a setting changes or the stopwatch is reset.
  const watchReset = clock.t === 0;
  useEffect(() => draw(), [draw, watchReset]);

  // Animation loop while the pendulum swings or the race runs.
  const lengthM = lengthCm / 100;
  useEffect(() => {
    if (!swinging && !racing) return;
    let last = performance.now();
    let raf = 0;
    const speed = fast ? 5 : 1;
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1) * speed;
      last = now;
      if (swinging) {
        const s = advanceSwing(swing.current, lengthM, dt);
        if (oscillations(s) >= COUNT) {
          // The bob is back at the release end: stop the watch there.
          const total = s.lastFull;
          swing.current = release(angle);
          setSwinging(false);
          setClock({ t: total, osc: COUNT });
          setRuns((prev) => [...prev.slice(-19), { id: (prev.at(-1)?.id ?? 0) + 1, lengthCm, massG, angle, total, period: total / COUNT }]);
          draw();
          return;
        }
        swing.current = s;
        setClock({ t: s.t, osc: oscillations(s) });
      } else {
        raceT.current += dt;
        const end = Math.max(...lanes.map(finishTime));
        if (raceT.current >= end) {
          raceT.current = end;
          setRacing(false);
          setResults(lanes);
          setRaced((prev) => (lanes.every((l) => prev.includes(l)) ? prev : [...new Set([...prev, ...lanes])]));
        }
        setRaceClock(raceT.current);
      }
      draw();
      if (swinging || raceT.current < Math.max(...lanes.map(finishTime))) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [swinging, racing, fast, lengthM, lengthCm, massG, angle, lanes, draw, setClock]);

  /** Any change to the pendulum stops the watch and puts the bob back at the start. */
  const resetSwing = (deg = angle) => {
    swing.current = release(deg);
    setSwinging(false);
    setClock({ t: 0, osc: 0 });
  };

  const toggleLane = (id: RacerId) => {
    if (racing) return;
    const next = lanes.includes(id) ? lanes.filter((l) => l !== id) : RACERS.map((r) => r.id).filter((r) => r === id || lanes.includes(r));
    if (!next.length) return;
    raceT.current = 0;
    setRaceClock(0);
    setLanes(next);
  };

  const startRace = () => {
    raceT.current = 0;
    setRaceClock(0);
    setResults([]);
    setRacing(true);
  };

  const checkSpeed = (id: RacerId) => {
    const shown = Number(finishTime(id).toFixed(1));
    const ok = speedAnswerOk(Number((answers[id] ?? "").replace(",", ".")), TRACK_M, shown);
    setChecked((c) => ({ ...c, [id]: ok }));
    if (ok) setSpeedsFound((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const lastRun = runs.at(-1);
  const recent = [...runs].reverse().slice(0, 5);

  return (
    <div className="flex flex-col gap-3 select-none">
      {target === null && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-ink/20 p-1 text-sm">
          {(["pendulum", "race"] as const).map((m) => (
            <button key={m} onClick={() => {
                setMode(m);
                resetSwing();
                setRacing(false);
              }} className={`rounded-xl py-2 ${activeMode === m ? "bg-cream/10 text-cream" : "text-faint"}`}>
              {m === "pendulum" ? "Pendulum timer" : "Race track"}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-64 w-full rounded-2xl border border-line bg-well sm:h-80"
        role="img"
        aria-label={
          activeMode === "pendulum"
            ? `A simple pendulum, ${lengthCm} cm long with a ${massG} g bob, released from ${angle} degrees. ${clock.osc} of ${COUNT} oscillations timed, stopwatch at ${clock.t.toFixed(2)} seconds.`
            : `A 100 metre race track with ${lanes.map((l) => racer(l).name).join(", ")}. Dots mark where each racer was after every second.`
        }
      />

      {activeMode === "pendulum" ? (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Stopwatch" value={`${clock.t.toFixed(2)} s`} />
            <Readout label="Oscillations" value={`${clock.osc} / ${COUNT}`} />
            <Readout label="Time period" value={lastRun ? `${lastRun.period.toFixed(2)} s` : "?"} />
          </div>
          <Slider label="Length of thread" value={lengthCm} unit="cm" min={LENGTH_CM.min} max={LENGTH_CM.max} step={1} onChange={(v) => (setLengthCm(v), resetSwing())} />
          <Slider label="Mass of bob" value={massG} unit="g" min={MASS_G.min} max={MASS_G.max} step={10} onChange={(v) => (setMassG(v), resetSwing())} />
          <Slider label="Release angle" value={angle} unit="°" min={ANGLE_DEG.min} max={ANGLE_DEG.max} step={1} onChange={(v) => (setAngle(v), resetSwing(v))} />
          <div className="flex gap-2">
            <button
              className={`flex-1 rounded-xl border px-3 py-2 text-sm ${swinging ? "border-brick-300/60 text-brick-200" : "chip-on"}`}
              onClick={() => (swinging ? resetSwing() : (resetSwing(), setSwinging(true)))}
            >
              {swinging ? "Stop and reset" : `Release and time ${COUNT} oscillations`}
            </button>
            <SpeedToggle fast={fast} setFast={setFast} />
          </div>
          {recent.length > 0 && (
            <div className="overflow-hidden rounded-2xl panel text-xs">
              <table className="w-full text-center tabular-nums">
                <thead className="text-[11px] uppercase tracking-wider text-faint">
                  <tr>
                    <th className="py-1.5 font-normal">Length</th>
                    <th className="font-normal">Mass</th>
                    <th className="font-normal">Angle</th>
                    <th className="font-normal">{COUNT} osc.</th>
                    <th className="font-normal">Period</th>
                  </tr>
                </thead>
                <tbody className="text-cream/85">
                  {recent.map((r) => (
                    <tr key={r.id} className="border-t border-line">
                      <td className="py-1">{r.lengthCm} cm</td>
                      <td>{r.massG} g</td>
                      <td>{r.angle}°</td>
                      <td>{r.total.toFixed(2)} s</td>
                      <td className="font-semibold text-saffron-200">{r.period.toFixed(2)} s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-center text-xs text-faint">Time period = time for {COUNT} oscillations ÷ {COUNT}</p>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {RACERS.map((r) => (
              <button
                key={r.id}
                onClick={() => toggleLane(r.id)}
                aria-pressed={lanes.includes(r.id)}
                className={`rounded-xl border px-2 py-2 text-sm whitespace-nowrap ${lanes.includes(r.id) ? "chip-on" : "border-line text-muted"}`}
              >
                {r.emoji} {r.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="flex-1 rounded-xl border chip-on px-3 py-2 text-sm disabled:opacity-50" disabled={racing} onClick={startRace}>
              {racing ? `Racing… ${raceClock.toFixed(1)} s` : "Start the race"}
            </button>
            <SpeedToggle fast={fast} setFast={setFast} />
          </div>
          {results.length > 0 && (
            <div className="flex flex-col gap-2 rounded-2xl panel p-3 text-sm">
              <div className="text-xs text-faint">Results: work out each speed. Speed = distance ÷ time.</div>
              {[...results]
                .sort((a, b) => finishTime(a) - finishTime(b))
                .map((id) => {
                  const r = racer(id);
                  const shown = Number(finishTime(id).toFixed(1));
                  const found = speedsFound.includes(id);
                  return (
                    <div key={id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="min-w-0 flex-1">
                        {r.emoji} {r.name}: <span className="tabular-nums text-cream">100 m in {shown.toFixed(1)} s</span>
                      </span>
                      {found ? (
                        <span className="tabular-nums text-sage-300">
                          ✓ {(TRACK_M / shown).toFixed(1)} m/s ({toKmh(TRACK_M / shown).toFixed(0)} km/h)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <input
                            inputMode="decimal"
                            aria-label={`Speed of the ${r.name.toLowerCase()} in metres per second`}
                            className="w-16 rounded-lg border border-line-strong bg-ink/30 px-2 py-1 text-right tabular-nums"
                            value={answers[id] ?? ""}
                            onChange={(e) => setAnswers((a) => ({ ...a, [id]: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && checkSpeed(id)}
                          />
                          <span className="text-muted">m/s</span>
                          <button className="rounded-lg border border-line-strong px-2 py-1 text-xs" onClick={() => checkSpeed(id)}>
                            Check
                          </button>
                          {checked[id] === false && <span className="text-xs text-brick-300">Try again</span>}
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
          <p className="text-center text-xs text-faint">Each dot shows where a racer was after every 1 s. Pick racers, then start.</p>
        </>
      )}
    </div>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl panel px-1 py-2">
      <div className="text-[11px] uppercase tracking-wider text-faint">{label}</div>
      <div className="font-display text-lg tabular-nums">{value}</div>
    </div>
  );
}

function Slider({ label, value, unit, min, max, step, onChange }: { label: string; value: number; unit: string; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label className="block rounded-2xl panel px-4 py-3">
      <div className="flex justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums text-cream">
          {value} {unit}
        </span>
      </div>
      <input type="range" className="range mt-2 w-full" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function SpeedToggle({ fast, setFast }: { fast: boolean; setFast: (f: boolean) => void }) {
  return (
    <button
      className={`shrink-0 rounded-xl border px-3 py-2 text-sm ${fast ? "chip-on" : "border-line text-muted"}`}
      onClick={() => setFast(!fast)}
      aria-pressed={fast}
      title="Play the animation 5 times faster. The stopwatch still shows real seconds."
    >
      {fast ? "5× fast" : "Real time"}
    </button>
  );
}

function drawPendulum(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  p: { lengthCm: number; massG: number; angle: number; theta: number; t: number; osc: number; target: number | null },
) {
  const px = w / 2;
  const py = 18;
  // The longest thread (150 cm) just fits, leaving room for the biggest bob.
  const k = (h - py - 34) / (LENGTH_CM.max / 100);
  const L = (p.lengthCm / 100) * k;
  const r = 5 + 9 * Math.cbrt(p.massG / MASS_G.max);
  const th0 = (p.angle * Math.PI) / 180;

  // Stand.
  ctx.strokeStyle = "rgba(240,233,221,0.55)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(px - 46, py);
  ctx.lineTo(px + 46, py);
  ctx.stroke();

  // Rest line and the swing range.
  ctx.setLineDash([3, 4]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(240,233,221,0.15)";
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px, py + L + r);
  ctx.stroke();
  ctx.strokeStyle = "rgba(103,232,249,0.35)";
  ctx.beginPath();
  ctx.arc(px, py, L, Math.PI / 2 - th0, Math.PI / 2 + th0);
  ctx.stroke();
  ctx.setLineDash([]);

  // Thread and bob. θ > 0 is to the right.
  const bx = px + L * Math.sin(p.theta);
  const by = py + L * Math.cos(p.theta);
  ctx.strokeStyle = "rgba(240,233,221,0.8)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(bx, by);
  ctx.stroke();
  const g = ctx.createRadialGradient(bx - r / 3, by - r / 3, 1, bx, by, r);
  g.addColorStop(0, "#fef3c7");
  g.addColorStop(1, "#b45309");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(bx, by, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#13110f";
  ctx.beginPath();
  ctx.arc(px, py, 3, 0, Math.PI * 2);
  ctx.fill();

  // Labels.
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillStyle = "rgba(240,233,221,0.6)";
  ctx.textAlign = "right";
  ctx.fillText(`${p.lengthCm} cm`, px - 8, py + Math.max(14, L / 2));
  ctx.textAlign = "left";
  ctx.fillText(`${p.angle}°`, px + 8, py + 16);

  ctx.font = "600 15px system-ui, sans-serif";
  ctx.fillStyle = "#a5f3fc";
  ctx.fillText(`⏱ ${p.t.toFixed(2)} s`, 10, 22);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(240,233,221,0.85)";
  ctx.fillText(`${p.osc} / ${COUNT}`, w - 10, 22);
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillStyle = "rgba(240,233,221,0.5)";
  ctx.fillText("oscillations", w - 10, 37);
  if (p.target !== null) {
    ctx.textAlign = "left";
    ctx.font = "600 13px system-ui, sans-serif";
    ctx.fillStyle = "#fde047";
    ctx.fillText(`Target period: ${p.target.toFixed(2)} s`, 10, h - 12);
  }
  ctx.textAlign = "left";
}

function drawRace(ctx: CanvasRenderingContext2D, w: number, h: number, lanes: RacerId[], t: number) {
  const left = 26;
  const right = w - 22;
  const top = 34;
  const bottom = h - 22;
  const X = (m: number) => left + ((right - left) * m) / TRACK_M;
  const laneH = (bottom - top) / lanes.length;

  ctx.font = "600 15px system-ui, sans-serif";
  ctx.fillStyle = "#a5f3fc";
  ctx.fillText(`⏱ ${t.toFixed(1)} s`, 10, 22);

  // Distance markers every 10 m.
  ctx.font = "10px system-ui, sans-serif";
  ctx.textAlign = "center";
  for (let m = 0; m <= TRACK_M; m += 10) {
    ctx.strokeStyle = m === 0 || m === TRACK_M ? "rgba(240,233,221,0.6)" : "rgba(240,233,221,0.1)";
    ctx.lineWidth = m === 0 || m === TRACK_M ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(X(m), top - 4);
    ctx.lineTo(X(m), bottom);
    ctx.stroke();
    if (m % 20 === 0) {
      ctx.fillStyle = "rgba(240,233,221,0.5)";
      ctx.fillText(m === TRACK_M ? "100 m" : `${m}`, Math.min(X(m), w - 16), bottom + 14);
    }
  }
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(240,233,221,0.6)";
  ctx.fillText("FINISH", right, top - 8);

  lanes.forEach((id, i) => {
    const r = RACERS.find((x) => x.id === id)!;
    const y0 = top + i * laneH;
    const cy = y0 + laneH / 2;
    if (i > 0) {
      ctx.strokeStyle = "rgba(240,233,221,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, y0);
      ctx.lineTo(right, y0);
      ctx.stroke();
    }
    if (id === "auto") {
      // Speed breaker.
      ctx.fillStyle = "rgba(250,204,21,0.25)";
      ctx.fillRect(X(BUMP[0]), y0 + 3, X(BUMP[1]) - X(BUMP[0]), laneH - 6);
      ctx.fillStyle = "rgba(253,224,71,0.7)";
      ctx.textAlign = "center";
      ctx.font = "9px system-ui, sans-serif";
      if (laneH > 34) ctx.fillText("bump", (X(BUMP[0]) + X(BUMP[1])) / 2, y0 + laneH - 6);
    }
    // One dot for every whole second.
    ctx.fillStyle = r.color;
    for (let s = 1; s <= t; s++) {
      ctx.beginPath();
      ctx.arc(X(positionAt(id, s)), cy + Math.min(14, laneH * 0.3), 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    // The racer, facing the finish line. Most emoji fonts draw these facing left; the bicycle already faces right.
    const x = positionAt(id, t);
    const size = Math.max(14, Math.min(24, laneH * 0.5));
    ctx.save();
    ctx.translate(X(x), cy - 2);
    if (id !== "cycle") ctx.scale(-1, 1);
    ctx.font = `${size}px system-ui, "Noto Color Emoji", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(r.emoji, 0, 0);
    ctx.restore();
    // Finish time once across the line.
    const T = finishTime(id);
    if (t >= T) {
      ctx.font = "600 12px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillStyle = r.color;
      ctx.fillText(`${T.toFixed(1)} s`, X(TRACK_M) - size * 0.7 - 4, cy - 2);
    }
  });
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}
