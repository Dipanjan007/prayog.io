"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import { SPEED, TRIP, WALL, WORKERS, daysText, hoursText, jobDays, roundOk, tripTime, type Job, type Round } from "@/lib/sim/inverse";

export type InverseMode = "trip" | "work";

export type InverseReading =
  | { mode: "trip"; speed: number; time: number; arrived: boolean }
  | { mode: "work"; workers: number; days: number; perDay: number }
  | { mode: "round"; ok: boolean };

interface Props {
  onReading?: (r: InverseReading) => void;
  /** Challenge: the time (or days) stays hidden until the student tries a setting. */
  round?: Round | null;
}

/** Milliseconds of animation per hour of driving. */
const MS_PER_HOUR = 300;

const num = (v: number) => `${Math.round(v * 100) / 100}`;

export default function InverseLab({ onReading, round = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<InverseMode>("trip");
  const [speed, setSpeed] = useState(60);
  const [workers, setWorkers] = useState(3);
  const [trips, setTrips] = useState<number[]>([]);
  const [driving, setDriving] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ value: number; ok: boolean } | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: InverseMode = round ? (round.kind === "trip" ? "trip" : "work") : mode;
  const km = round?.kind === "trip" ? round.km : TRIP.km;
  const from = round?.kind === "trip" ? round.from : TRIP.from;
  const to = round?.kind === "trip" ? round.to : TRIP.to;
  const job: Job = round?.kind === "job" ? round.job : WALL;
  const time = tripTime(km, speed);
  const days = jobDays(job, workers);
  const perDay = job.perPerson ? job.perPerson.amount * workers : 0;
  // In the challenge the answer shows only for the setting just tried.
  const revealed = !round || (result !== null && result.value === (activeMode === "trip" ? speed : workers) && driving === null);

  useEffect(() => {
    if (round) return;
    if (activeMode === "trip") onReadingRef.current?.({ mode: "trip", speed, time, arrived: false });
    else onReadingRef.current?.({ mode: "work", workers, days, perDay });
  }, [round, activeMode, speed, time, workers, days, perDay]);

  // Drive: animate the car, then report the arrival.
  useEffect(() => {
    if (driving === null) return;
    const hours = tripTime(km, driving);
    const dur = hours * MS_PER_HOUR;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      setProgress(p);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
        return;
      }
      setDriving(null);
      setTrips((t) => (t.includes(driving) ? t : [...t, driving]));
      if (round) {
        const ok = roundOk(round, driving);
        setResult({ value: driving, ok });
        onReadingRef.current?.({ mode: "round", ok });
      } else onReadingRef.current?.({ mode: "trip", speed: driving, time: hours, arrived: true });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [driving, km, round]);

  useEffect(() => {
    const el = canvasRef.current!;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !size.w) return;
    const ctx = fitCanvas(el, size.w, size.h);
    ctx.clearRect(0, 0, size.w, size.h);
    if (activeMode === "trip") drawTrip(ctx, size.w, size.h, { km, from, to, speed, progress, driving, trips, showCurve: !round, revealed });
    else drawWork(ctx, size.w, size.h, job, workers, revealed);
  }, [size, activeMode, km, from, to, speed, progress, driving, trips, round, revealed, job, workers]);

  const drive = () => {
    setProgress(0);
    setDriving(speed);
  };
  const startJob = () => {
    if (!round) return;
    const ok = roundOk(round, workers);
    setResult({ value: workers, ok });
    onReadingRef.current?.({ mode: "round", ok });
  };

  const exact = Math.abs(time * 100 - Math.round(time * 100)) < 1e-9;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!round && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["trip", "work"] as const).map((m) => (
            <button
              key={m}
              disabled={driving !== null}
              onClick={() => setMode(m)}
              className={`rounded-xl py-2 ${activeMode === m ? "bg-white/10 text-white" : "text-white/50"}`}
            >
              {m === "trip" ? "Trip" : "Work"}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={
          activeMode === "trip"
            ? `A ${km} km road from ${from} to ${to}. At ${speed} km/h the trip takes ${revealed ? hoursText(time) : "an unknown time"}. A graph shows time against speed.`
            : `${workers} ${job.who} share the job: ${revealed ? `${daysText(days)} days` : "days not shown yet"}.`
        }
      />

      {activeMode === "trip" ? (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Speed s" value={`${speed} km/h`} colour="text-cyan-200" />
            <Readout label="Time t" value={revealed ? hoursText(time) : "?"} colour="text-pink-200" />
            <Readout label="s × t" value={revealed ? `${km} km` : "?"} colour="text-lime-200" />
          </div>
          {revealed && (
            <p className="text-center text-xs text-white/50">
              {speed} × {num(time)} {exact ? "=" : "≈"} {km}: speed × time is the length of the road.
            </p>
          )}
          <Stepper label="Speed" thing="speed" unit=" km/h" colour="#22d3ee" value={speed} min={SPEED.min} max={SPEED.max} step={SPEED.step} disabled={driving !== null} onChange={setSpeed} />
          <button className="btn-primary !py-2 text-sm" onClick={drive} disabled={driving !== null}>
            {driving !== null ? `Driving at ${driving} km/h…` : `Drive to ${to} at ${speed} km/h`}
          </button>
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label={job.who[0].toUpperCase() + job.who.slice(1)} value={`${workers}`} colour="text-cyan-200" />
            <Readout label="Days" value={revealed ? daysText(days) : "?"} colour="text-pink-200" />
            {job.perPerson ? (
              <Readout label={`${job.perPerson.unit} a day`} value={`${perDay}`} colour="text-amber-200" />
            ) : (
              <Readout label={`${job.who} × days`} value={revealed ? `${job.total}` : "?"} colour="text-lime-200" />
            )}
          </div>
          {revealed && (
            <p className="text-center text-xs text-white/50">
              {workers} × {daysText(days)} {Math.abs(days * 100 - Math.round(days * 100)) < 1e-9 ? "=" : "≈"} {job.total} {job.who.replace(/s$/, "")}-days
              {job.perPerson ? ` · ${job.perPerson.amount} ${job.perPerson.unit} each a day` : ""}
            </p>
          )}
          <Stepper label={job.who[0].toUpperCase() + job.who.slice(1)} thing={job.who} unit="" colour="#22d3ee" value={workers} min={WORKERS.min} max={WORKERS.max} step={1} onChange={setWorkers} />
          {round && (
            <button className="btn-primary !py-2 text-sm" onClick={startJob}>
              {job.id === "rice" ? `Feed ${workers} students` : `Start with ${workers} ${job.who}`}
            </button>
          )}
        </>
      )}

      {round && result !== null && driving === null && (
        <p className={`text-center text-sm ${result.ok ? "text-lime-300" : "text-amber-200"}`}>
          {round.kind === "trip"
            ? result.ok
              ? `On time! ${result.value} km/h × ${round.hours} h = ${round.km} km.`
              : `That took ${hoursText(tripTime(round.km, result.value))}, not ${round.hours} h. ${tripTime(round.km, result.value) > round.hours ? "Go faster." : "Go slower."}`
            : result.ok
              ? `Exactly ${round.days} days: ${result.value} × ${round.days} = ${round.job.total}.`
              : `That gives ${daysText(jobDays(round.job, result.value))} days, not ${round.days}. ${jobDays(round.job, result.value) > round.days ? "Try more" : "Try fewer"} ${round.job.who}.`}
        </p>
      )}
    </div>
  );
}

function Readout({ label, value, colour }: { label: string; value: string; colour: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] tracking-wider text-white/50">{label}</div>
      <div className={`font-display text-base tabular-nums sm:text-lg ${colour}`}>{value}</div>
    </div>
  );
}

function Stepper(p: { label: string; thing: string; unit: string; colour: string; value: number; min: number; max: number; step: number; disabled?: boolean; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <button
        className="h-9 w-9 shrink-0 rounded-lg border border-white/15 text-lg text-white/80 disabled:opacity-30"
        onClick={() => p.onChange(Math.max(p.min, p.value - p.step))}
        disabled={p.disabled || p.value <= p.min}
        aria-label={`Less ${p.thing}`}
      >
        −
      </button>
      <label className="min-w-0 flex-1">
        <div className="flex justify-between text-sm">
          <span style={{ color: p.colour }}>{p.label}</span>
          <span className="tabular-nums text-white">
            {p.value}
            {p.unit}
          </span>
        </div>
        <input
          type="range"
          className="range mt-1 w-full"
          min={p.min}
          max={p.max}
          step={p.step}
          value={p.value}
          disabled={p.disabled}
          onChange={(e) => p.onChange(Number(e.target.value))}
          aria-label={p.label}
        />
      </label>
      <button
        className="h-9 w-9 shrink-0 rounded-lg border border-white/15 text-lg text-white/80 disabled:opacity-30"
        onClick={() => p.onChange(Math.min(p.max, p.value + p.step))}
        disabled={p.disabled || p.value >= p.max}
        aria-label={`More ${p.thing}`}
      >
        +
      </button>
    </div>
  );
}

function drawTrip(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  o: { km: number; from: string; to: string; speed: number; progress: number; driving: number | null; trips: number[]; showCurve: boolean; revealed: boolean },
) {
  // Road strip at the top.
  const rx0 = 34;
  const rx1 = w - 34;
  const ry = 46;
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(rx0, ry);
  ctx.lineTo(rx1, ry);
  ctx.stroke();
  ctx.lineCap = "butt";
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1;
  ctx.font = "10px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  // Distance marks; a number is left out where it would run into a place name.
  ctx.font = "12px system-ui, sans-serif";
  const leftEnd = 8 + ctx.measureText(o.from).width + 6;
  const rightStart = w - 8 - ctx.measureText(`${o.to} · ${o.km} km`).width - 6;
  ctx.font = "10px system-ui, sans-serif";
  for (let d = 0; d <= o.km; d += 40) {
    const x = rx0 + ((rx1 - rx0) * d) / o.km;
    ctx.beginPath();
    ctx.moveTo(x, ry + 6);
    ctx.lineTo(x, ry + 10);
    ctx.stroke();
    const half = ctx.measureText(`${d}`).width / 2;
    if (d > 0 && d < o.km && x - half > leftEnd && x + half < rightStart) ctx.fillText(`${d}`, x, ry + 21);
  }
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.fillText(o.from, 8, ry + 22);
  ctx.textAlign = "right";
  ctx.fillText(`${o.to} · ${o.km} km`, w - 8, ry + 22);

  // The car, and the trip clock.
  const p = o.driving !== null ? o.progress : 0;
  const carX = rx0 + (rx1 - rx0) * p;
  ctx.font = "20px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.save();
  ctx.translate(carX, ry - 6);
  ctx.scale(-1, 1);
  ctx.fillText("🚗", 0, 0);
  ctx.restore();
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = "#f9a8d4";
  if (o.driving !== null) ctx.fillText(`⏱ ${hoursText(tripTime(o.km, o.driving) * p)} at ${o.driving} km/h`, 8, 16);

  // Graph: time (h) up, speed (km/h) across.
  const gx0 = 40;
  const gx1 = w - 14;
  const gy0 = h - 26;
  const gy1 = ry + 44;
  const TMAX = 12;
  const X = (s: number) => gx0 + ((gx1 - gx0) * s) / SPEED.max;
  const Y = (t: number) => gy0 - ((gy0 - gy1) * Math.min(t, TMAX)) / TMAX;
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1;
  for (let s = 0; s <= SPEED.max; s += 20) {
    ctx.beginPath();
    ctx.moveTo(X(s), gy0);
    ctx.lineTo(X(s), gy1);
    ctx.stroke();
  }
  for (let t = 0; t <= TMAX; t += 3) {
    ctx.beginPath();
    ctx.moveTo(gx0, Y(t));
    ctx.lineTo(gx1, Y(t));
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(gx0, gy1);
  ctx.lineTo(gx0, gy0);
  ctx.lineTo(gx1, gy0);
  ctx.stroke();
  ctx.font = "10px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.textAlign = "center";
  for (let s = 0; s <= SPEED.max; s += 40) ctx.fillText(`${s}`, X(s), gy0 + 12);
  ctx.textAlign = "right";
  for (let t = 3; t <= TMAX; t += 3) ctx.fillText(`${t} h`, gx0 - 4, Y(t) + 3);
  ctx.fillStyle = "#22d3ee";
  ctx.fillText("speed (km/h) →", gx1, gy0 + 23);
  ctx.textAlign = "left";
  ctx.fillStyle = "#f9a8d4";
  ctx.fillText("↑ time", gx0 + 4, gy1 + 2);

  // The curve s × t = km: it never touches either axis.
  if (o.showCurve) {
    ctx.strokeStyle = "rgba(163,230,53,0.75)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    let first = true;
    for (let s = o.km / TMAX; s <= SPEED.max + 1e-9; s += 1) {
      const pt = { x: X(s), y: Y(o.km / s) };
      if (first) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
      first = false;
    }
    ctx.stroke();
    ctx.fillStyle = "rgba(163,230,53,0.9)";
    ctx.textAlign = "right";
    ctx.fillText(`s × t = ${o.km}`, gx1 - 2, Y(o.km / SPEED.max) - 14);
  }

  // Your speed now.
  ctx.strokeStyle = "rgba(34,211,238,0.5)";
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(X(o.speed), gy0);
  ctx.lineTo(X(o.speed), gy1);
  ctx.stroke();
  ctx.setLineDash([]);

  // Trips driven.
  for (const s of o.trips) {
    ctx.fillStyle = "#f472b6";
    ctx.beginPath();
    ctx.arc(X(s), Y(o.km / s), 5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (o.revealed && o.showCurve) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(X(o.speed), Y(o.km / o.speed), 8, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.textAlign = "left";
}

function drawWork(ctx: CanvasRenderingContext2D, w: number, h: number, job: Job, workers: number, revealed: boolean) {
  const days = jobDays(job, workers);
  const half = w / 2;
  const top = 26;
  const boxH = h - (job.perPerson ? 92 : 50);
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = "#22d3ee";
  ctx.fillText(`${workers} ${job.who}`, 10, 16);
  ctx.fillStyle = "#f9a8d4";
  ctx.fillText(revealed ? `${daysText(days)} days` : "? days", half + 6, 16);

  // People: up to 16 in a 4 × 4 grid.
  const cellW = (half - 16) / 4;
  const cellH = boxH / 4;
  const fs = Math.max(12, Math.min(cellW, cellH) * 0.7);
  ctx.font = `${fs}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  const person = job.id === "rice" ? "🧑‍🎓" : "👷";
  for (let i = 0; i < workers; i++) ctx.fillText(person, 10 + (i % 4) * cellW + cellW / 2, top + Math.floor(i / 4) * cellH + cellH * 0.75);

  // Calendar: one box per day, up to 30 boxes.
  const cols = 6;
  const rows = 5;
  const cw = (half - 16) / cols;
  const ch = boxH / rows;
  const cx0 = half + 6;
  const shown = revealed ? days : 0;
  for (let i = 0; i < cols * rows; i++) {
    const x = cx0 + (i % cols) * cw;
    const y = top + Math.floor(i / cols) * ch;
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2, y + 2, cw - 4, ch - 4);
    const fill = Math.max(0, Math.min(1, shown - i));
    if (fill > 0) {
      ctx.fillStyle = "rgba(244,114,182,0.55)";
      ctx.fillRect(x + 2, y + 2, (cw - 4) * fill, ch - 4);
    }
  }
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.fillStyle = "#fff";
  if (!revealed) ctx.fillText("?", cx0 + (half - 16) / 2, top + boxH / 2 + 5);
  else if (days > cols * rows) {
    ctx.fillStyle = "rgba(10,13,28,0.8)";
    ctx.fillRect(cx0 + 4, top + boxH / 2 - 14, half - 24, 24);
    ctx.fillStyle = "#fff";
    ctx.fillText(`${daysText(days)} days: more than a month`, cx0 + (half - 16) / 2, top + boxH / 2 + 3, half - 24);
  }

  // Direct and inverse, side by side as bars.
  if (job.perPerson) {
    const bx = 10;
    const bw = w - 20;
    const maxPer = job.perPerson.amount * WORKERS.max;
    const bars: [string, number, string][] = [
      [`${job.perPerson.unit} laid a day: ${job.perPerson.amount * workers} (goes up with ${job.who})`, (job.perPerson.amount * workers) / maxPer, "#fbbf24"],
      [`days: ${daysText(days)} (goes down as ${job.who} go up)`, days / job.total, "#f472b6"],
    ];
    ctx.textAlign = "left";
    ctx.font = "11px system-ui, sans-serif";
    bars.forEach(([label, f, colour], i) => {
      const y = h - 58 + i * 28;
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(label, bx, y + 10, bw);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(bx, y + 14, bw, 8);
      ctx.fillStyle = colour;
      ctx.fillRect(bx, y + 14, bw * f, 8);
    });
  }
  ctx.textAlign = "left";
}
