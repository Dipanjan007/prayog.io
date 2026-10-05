"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Sports-car physics on an ideal, frictionless road. */
export const ACCEL = 5; // m/s² with the accelerator held (0 to 100 km/h in about 5.6 s)
export const BRAKE = 8; // m/s² of braking
const TOP_SPEED = 50; // m/s (180 km/h)
const SAMPLE_EVERY = 0.1; // s
/** Stop zone for the challenge, measured at the car's front bumper. */
export const STOP_ZONE: [number, number] = [95, 100];
const CAR_LENGTH = 4.5; // m

export interface Sample {
  t: number;
  x: number;
  v: number;
  a: number;
}

export interface MotionReading {
  t: number;
  x: number;
  v: number;
  a: number;
  /** Seconds of steady cruising (no pedal) above 5 m/s, right now. */
  cruiseFor: number;
  /** Seconds the accelerator has been held without a break, and the speed when it started. */
  accelFor: number;
  accelFromV: number;
  /** Set when the car has just come to rest after braking. */
  lastStop: { fromV: number; distance: number; time: number } | null;
  /** Set when the car stops after having moved: total time and where the bumper is. */
  finish: { time: number; bumper: number } | null;
}

interface Props {
  onReading?: (r: MotionReading) => void;
  showStopZone?: boolean;
}

type Pedal = "gas" | "brake" | null;

export default function MotionTrack({ onReading, showStopZone = true }: Props) {
  const trackRef = useRef<HTMLCanvasElement>(null);
  const dRef = useRef<HTMLCanvasElement>(null);
  const vRef = useRef<HTMLCanvasElement>(null);
  const [pedal, setPedal] = useState<Pedal>(null);
  const pedalRef = useRef<Pedal>(null);
  const [display, setDisplay] = useState({ t: 0, x: 0, v: 0, a: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const state = useRef({
    t: 0,
    x: 0,
    v: 0,
    a: 0,
    samples: [{ t: 0, x: 0, v: 0, a: 0 }] as Sample[],
    nextSample: SAMPLE_EVERY,
    cruiseFor: 0,
    accelFor: 0,
    accelFromV: 0,
    brakeFrom: null as null | { v: number; x: number; t: number },
    lastStop: null as MotionReading["lastStop"],
    finish: null as MotionReading["finish"],
    moved: false,
  });

  const press = useCallback((p: Pedal) => {
    pedalRef.current = p;
    setPedal(p);
  }, []);

  const reset = useCallback(() => {
    const s = state.current;
    Object.assign(s, {
      t: 0,
      x: 0,
      v: 0,
      a: 0,
      samples: [{ t: 0, x: 0, v: 0, a: 0 }],
      nextSample: SAMPLE_EVERY,
      cruiseFor: 0,
      accelFor: 0,
      accelFromV: 0,
      brakeFrom: null,
      lastStop: null,
      finish: null,
      moved: false,
    });
    setDisplay({ t: 0, x: 0, v: 0, a: 0 });
  }, []);

  // Keyboard: → or ↑ to accelerate, ← ↓ or space to brake.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") press("gas");
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === " ") press("brake");
      else return;
      e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowUp", "ArrowLeft", "ArrowDown", " "].includes(e.key)) press(null);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [press]);

  useEffect(() => {
    const track = trackRef.current!;
    const dCan = dRef.current!;
    const vCan = vRef.current!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const fit = (c: HTMLCanvasElement) => {
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      const ctx = c.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { ctx, w, h };
    };

    let last = performance.now();
    let lastReport = 0;
    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const s = state.current;
      const p = pedalRef.current;

      // Physics.
      let a = 0;
      if (p === "gas" && s.v < TOP_SPEED) a = ACCEL;
      else if (p === "brake" && s.v > 0) a = -BRAKE;
      const running = s.moved || p === "gas";
      if (running) {
        let v = s.v + a * dt;
        if (v <= 0) {
          v = 0;
          if (a < 0) a = 0;
        }
        if (v > TOP_SPEED) v = TOP_SPEED;
        s.x += ((s.v + v) / 2) * dt;
        const wasMoving = s.v > 0;
        s.v = v;
        s.a = a;
        s.t += dt;
        if (v > 0) s.moved = true;

        // Mission bookkeeping.
        s.cruiseFor = p === null && v >= 5 ? s.cruiseFor + dt : 0;
        if (p === "gas") {
          if (s.accelFor === 0) s.accelFromV = v - a * dt;
          s.accelFor += dt;
        } else s.accelFor = 0;
        if (p === "brake" && !s.brakeFrom && v > 0) s.brakeFrom = { v: v + BRAKE * dt, x: s.x, t: s.t };
        if (p !== "brake" && v > 0) s.brakeFrom = null;
        if (wasMoving && v === 0) {
          if (s.brakeFrom) s.lastStop = { fromV: s.brakeFrom.v, distance: s.x - s.brakeFrom.x, time: s.t - s.brakeFrom.t };
          s.finish = { time: s.t, bumper: s.x };
          s.brakeFrom = null;
        }
        while (s.t >= s.nextSample) {
          s.samples.push({ t: s.nextSample, x: s.x, v: s.v, a: s.a });
          s.nextSample += SAMPLE_EVERY;
          if (s.samples.length > 600) s.samples.shift(); // keep the last minute
        }
      }

      drawTrack(fit(track), s, showStopZone, p);
      drawGraph(fit(dCan), s.samples, "x", "Distance (m)", "#22d3ee");
      drawGraph(fit(vCan), s.samples, "v", "Speed (m/s)", "#a78bfa");

      if (now - lastReport > 100) {
        lastReport = now;
        setDisplay({ t: s.t, x: s.x, v: s.v, a: s.a });
        onReadingRef.current?.({
          t: s.t,
          x: s.x,
          v: s.v,
          a: s.a,
          cruiseFor: s.cruiseFor,
          accelFor: s.accelFor,
          accelFromV: s.accelFromV,
          lastStop: s.lastStop,
          finish: s.v === 0 && s.moved ? s.finish : null,
        });
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [showStopZone]);

  const pedalProps = (p: Exclude<Pedal, null>) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      press(p);
    },
    onPointerUp: () => press(null),
    onPointerCancel: () => press(null),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  return (
    <div className="flex flex-col gap-3 select-none">
      <canvas
        ref={trackRef}
        className="h-40 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-48"
        role="img"
        aria-label={`Sports car at ${display.x.toFixed(0)} metres, moving at ${display.v.toFixed(1)} metres per second`}
      />
      <div className="grid grid-cols-4 gap-2 text-center">
        <Readout label="Time" value={display.t.toFixed(1)} unit="s" />
        <Readout label="Distance" value={display.x.toFixed(1)} unit="m" />
        <Readout label="Speed" value={display.v.toFixed(1)} unit="m/s" sub={`${(display.v * 3.6).toFixed(0)} km/h`} />
        <Readout label="Accel." value={display.a.toFixed(0)} unit="m/s²" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <canvas ref={dRef} className="h-32 w-full rounded-2xl border border-white/10 bg-white/[0.02] sm:h-40" aria-label="Distance–time graph" role="img" />
        <canvas ref={vRef} className="h-32 w-full rounded-2xl border border-white/10 bg-white/[0.02] sm:h-40" aria-label="Speed–time graph" role="img" />
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2">
        <button
          {...pedalProps("brake")}
          className={`touch-none rounded-2xl border py-4 font-semibold transition ${
            pedal === "brake" ? "border-rose-300 bg-rose-400/30" : "border-rose-300/30 bg-rose-400/10"
          }`}
        >
          ◀ Brake
        </button>
        <button onClick={reset} className="rounded-2xl border border-white/10 px-4 text-sm text-white/70 hover:bg-white/10">
          Reset
        </button>
        <button
          {...pedalProps("gas")}
          className={`touch-none rounded-2xl border py-4 font-semibold transition ${
            pedal === "gas" ? "border-lime-300 bg-lime-400/30" : "border-lime-300/30 bg-lime-400/10"
          }`}
        >
          Accelerate ▶
        </button>
      </div>
      <p className="text-center text-xs text-white/40">Hold a pedal, let go to cruise. Keyboard: → accelerate, ← brake.</p>
    </div>
  );
}

function Readout({ label, value, unit, sub }: { label: string; value: string; unit: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] uppercase tracking-wider text-white/50">{label}</div>
      <div className="font-display text-lg tabular-nums">
        {value}
        <span className="ml-0.5 text-xs text-white/50">{unit}</span>
      </div>
      {sub && <div className="text-[11px] text-white/40">{sub}</div>}
    </div>
  );
}

type Canvas = { ctx: CanvasRenderingContext2D; w: number; h: number };

function drawTrack({ ctx, w, h }: Canvas, s: { x: number; v: number }, showStopZone: boolean, pedal: Pedal) {
  const pxPerM = Math.max(w / 60, 6); // about 60 m visible
  const carScreenX = w * 0.3;
  const toX = (m: number) => carScreenX + (m - s.x) * pxPerM;
  const roadTop = h * 0.62;

  ctx.clearRect(0, 0, w, h);
  // Sky glow and far hills (parallax).
  const sky = ctx.createLinearGradient(0, 0, 0, roadTop);
  sky.addColorStop(0, "#0b0f24");
  sky.addColorStop(1, "#1b1640");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, roadTop);
  ctx.fillStyle = "#231c52";
  ctx.beginPath();
  ctx.moveTo(0, roadTop);
  for (let px = 0; px <= w; px += 20) {
    const wx = px + s.x * pxPerM * 0.15;
    ctx.lineTo(px, roadTop - 18 - 14 * Math.sin(wx / 90) - 8 * Math.sin(wx / 37));
  }
  ctx.lineTo(w, roadTop);
  ctx.fill();

  // Road.
  ctx.fillStyle = "#151827";
  ctx.fillRect(0, roadTop, w, h - roadTop);
  ctx.fillStyle = "#2a2f45";
  ctx.fillRect(0, roadTop, w, 3);

  // Stop zone.
  if (showStopZone) {
    const [a, b] = STOP_ZONE;
    ctx.fillStyle = "rgba(163,230,53,0.18)";
    ctx.fillRect(toX(a), roadTop, (b - a) * pxPerM, h - roadTop);
    ctx.fillStyle = "#a3e635";
    ctx.fillRect(toX(b) - 2, roadTop, 3, h - roadTop);
    ctx.font = "600 11px system-ui, sans-serif";
    ctx.fillText("STOP ZONE", toX(a) + 2, roadTop + 14);
  }

  // Distance markers every 10 m, dashes every 5 m.
  ctx.font = "11px system-ui, sans-serif";
  const first = Math.floor((s.x - carScreenX / pxPerM) / 5) * 5;
  for (let m = first; m < s.x + w / pxPerM; m += 5) {
    const X = toX(m);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(X, roadTop + (h - roadTop) / 2 - 1, 2.5 * pxPerM, 2);
    if (m % 10 === 0 && m >= 0) {
      ctx.fillStyle = m === 0 ? "#f472b6" : "rgba(255,255,255,0.5)";
      ctx.fillRect(X, roadTop - 6, 1.5, 6);
      ctx.fillText(m === 0 ? "START" : `${m} m`, X + 3, roadTop - 8);
    }
  }

  // Car: front bumper is at s.x.
  const len = CAR_LENGTH * pxPerM;
  const front = carScreenX;
  const back = front - len;
  const base = roadTop + (h - roadTop) * 0.45;
  const bodyH = Math.max(len * 0.22, 9);
  const wheelR = Math.max(len * 0.09, 4);
  ctx.save();
  // Speed lines.
  if (s.v > 8) {
    ctx.strokeStyle = "rgba(34,211,238,0.35)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const y = base - bodyH * (0.3 + i * 0.25);
      const l = Math.min(s.v * 2.5, 90);
      ctx.beginPath();
      ctx.moveTo(back - 6 - i * 4, y);
      ctx.lineTo(back - 6 - i * 4 - l, y);
      ctx.stroke();
    }
  }
  const grad = ctx.createLinearGradient(back, 0, front, 0);
  grad.addColorStop(0, "#f43f5e");
  grad.addColorStop(1, "#fb923c");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(back, base - wheelR * 0.4);
  ctx.lineTo(back, base - bodyH * 0.8);
  ctx.lineTo(back + len * 0.08, base - bodyH * 0.85);
  ctx.quadraticCurveTo(back + len * 0.35, base - bodyH * 1.6, back + len * 0.55, base - bodyH * 1.55);
  ctx.lineTo(back + len * 0.78, base - bodyH * 0.8);
  ctx.quadraticCurveTo(front, base - bodyH * 0.65, front, base - bodyH * 0.25);
  ctx.lineTo(front, base - wheelR * 0.4);
  ctx.closePath();
  ctx.fill();
  // Window.
  ctx.fillStyle = "rgba(186,230,253,0.8)";
  ctx.beginPath();
  ctx.moveTo(back + len * 0.3, base - bodyH * 1.05);
  ctx.quadraticCurveTo(back + len * 0.4, base - bodyH * 1.45, back + len * 0.54, base - bodyH * 1.42);
  ctx.lineTo(back + len * 0.7, base - bodyH * 0.95);
  ctx.closePath();
  ctx.fill();
  // Rear wing.
  ctx.fillStyle = "#e11d48";
  ctx.fillRect(back - 2, base - bodyH * 1.25, len * 0.16, 3);
  ctx.fillRect(back + len * 0.06, base - bodyH * 1.25, 2, bodyH * 0.45);
  // Lights.
  ctx.fillStyle = pedal === "brake" ? "#ff1f4b" : "#7f1d1d";
  ctx.fillRect(back, base - bodyH * 0.75, 3, 4);
  ctx.fillStyle = "#fde68a";
  ctx.fillRect(front - 4, base - bodyH * 0.45, 4, 3);
  // Wheels, spinning with distance.
  const spin = s.x / (CAR_LENGTH * 0.09);
  for (const wx of [back + len * 0.2, back + len * 0.8]) {
    ctx.fillStyle = "#0b0b12";
    ctx.beginPath();
    ctx.arc(wx, base, wheelR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(wx + Math.cos(spin) * wheelR * 0.7, base + Math.sin(spin) * wheelR * 0.7);
    ctx.lineTo(wx - Math.cos(spin) * wheelR * 0.7, base - Math.sin(spin) * wheelR * 0.7);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGraph({ ctx, w, h }: Canvas, samples: Sample[], key: "x" | "v", label: string, colour: string) {
  ctx.clearRect(0, 0, w, h);
  const pad = { l: 30, r: 8, t: 18, b: 18 };
  const tEnd = samples.length ? samples[samples.length - 1].t : 0;
  const tStart = Math.max(0, tEnd - 20);
  const tSpan = Math.max(10, tEnd - tStart);
  const visible = samples.filter((p) => p.t >= tStart);
  const maxY = Math.max(key === "x" ? 20 : 10, ...visible.map((p) => p[key])) * 1.1;
  const X = (t: number) => pad.l + ((t - tStart) / tSpan) * (w - pad.l - pad.r);
  const Y = (y: number) => h - pad.b - (y / maxY) * (h - pad.t - pad.b);

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.font = "10px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  for (let i = 0; i <= 2; i++) {
    const yv = (maxY / 1.1) * (i / 2);
    ctx.beginPath();
    ctx.moveTo(pad.l, Y(yv));
    ctx.lineTo(w - pad.r, Y(yv));
    ctx.stroke();
    ctx.fillText(yv.toFixed(0), 4, Y(yv) + 3);
  }
  ctx.fillText(label, pad.l, 12);
  ctx.fillText("time (s) →", w - pad.r - 52, h - 4);

  if (visible.length < 2) return;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = colour;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  visible.forEach((p, i) => (i ? ctx.lineTo(X(p.t), Y(p[key])) : ctx.moveTo(X(p.t), Y(p[key]))));
  ctx.stroke();
  ctx.shadowBlur = 0;
}
