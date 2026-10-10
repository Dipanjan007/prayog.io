"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import {
  RADIUS,
  SEG_THETA,
  THETA,
  arcLength,
  meetsSliceRound,
  sectorArea,
  segmentArea,
  triangleArea,
  type SliceRound,
} from "@/lib/sim/sectors";

export type SectorMode = "pizza" | "segment";

export type SectorReading =
  | { mode: "pizza"; theta: number; r: number; arc: number; area: number }
  | { mode: "segment"; theta: number; r: number; sector: number; triangle: number; segment: number }
  | { mode: "round"; ok: boolean };

interface Props {
  onReading?: (r: SectorReading) => void;
  /** Challenge: the radius is fixed; set the angle and cut. */
  round?: SliceRound | null;
}

const COL = { crust: "#fb923c", cheese: "#facc15", radius: "#22d3ee", tri: "#22d3ee", seg: "#f472b6" };
const RAD = Math.PI / 180;
/** Two decimal places, no trailing zeros. */
const f2 = (v: number) => `${Number((Math.round(v * 100) / 100).toFixed(2))}`;
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const fraction = (t: number) => {
  const g = gcd(t, 360);
  return t === 360 ? "1 (whole)" : `${t / g} ÷ ${360 / g}`;
};

export default function SectorLab({ onReading, round = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<SectorMode>("pizza");
  // Start away from every task value: a 45° slice of an 8 cm pizza; a 60° segment.
  const [theta, setTheta] = useState(45);
  const [segTheta, setSegTheta] = useState(60);
  const [radius, setRadius] = useState(8);
  const [checked, setChecked] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: SectorMode = round ? "pizza" : mode;
  const r = round ? round.r : radius;
  const unit = round ? round.unit : "cm";
  const arc = arcLength(theta, r);
  const area = sectorArea(theta, r);
  const sec = sectorArea(segTheta, r);
  const tri = triangleArea(segTheta, r);
  const seg = segmentArea(segTheta, r);

  useEffect(() => {
    if (round) return;
    if (activeMode === "pizza") onReadingRef.current?.({ mode: "pizza", theta, r: radius, arc: arcLength(theta, radius), area: sectorArea(theta, radius) });
    else
      onReadingRef.current?.({
        mode: "segment",
        theta: segTheta,
        r: radius,
        sector: sectorArea(segTheta, radius),
        triangle: triangleArea(segTheta, radius),
        segment: segmentArea(segTheta, radius),
      });
  }, [round, activeMode, theta, segTheta, radius]);

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
    if (activeMode === "pizza") drawPizza(ctx, size.w, size.h, theta, r, round ? round.r : RADIUS.max, unit);
    else drawSegment(ctx, size.w, size.h, segTheta, r, unit);
  }, [size, activeMode, theta, segTheta, r, round, unit]);

  const check = () => {
    if (!round) return;
    const ok = meetsSliceRound(theta, round);
    setChecked(ok);
    onReadingRef.current?.({ mode: "round", ok });
  };

  const shown = !round || checked !== null;
  const miss = (() => {
    if (!round) return "";
    if (round.kind === "theta") {
      const n = Math.round(360 / round.target);
      return `${n} slices of ${theta}° make ${n * theta}°, not 360°.`;
    }
    if (round.kind === "arc") return `this slice has ${f2(arc)} ${unit} of crust, not ${round.target} ${unit}.`;
    return `this swing waters ${f2(area)} ${unit}², not ${round.target} ${unit}².`;
  })();

  return (
    <div className="flex flex-col gap-3 select-none">
      {!round && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["pizza", "segment"] as const).map((md) => (
            <button key={md} onClick={() => setMode(md)} className={`rounded-xl py-2 ${activeMode === md ? "bg-white/10 text-white" : "text-white/50"}`}>
              {md === "pizza" ? "Pizza" : "Segment"}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={
          activeMode === "pizza"
            ? `A circle of radius ${r} ${unit} with a ${theta}° sector shaded`
            : `A circle of radius ${r} ${unit} cut by a chord with ${segTheta}° at the centre; the segment is shaded`
        }
      />

      {activeMode === "pizza" ? (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="θ ÷ 360" value={fraction(theta)} colour="text-yellow-200" />
            <Readout label="Arc length" value={shown ? `${f2(arc)} ${unit}` : "?"} colour="text-orange-200" />
            <Readout label="Sector area" value={shown ? `${f2(area)} ${unit}²` : "?"} colour="text-amber-200" />
          </div>
          {shown && (
            <p className="text-center text-xs text-white/50 tabular-nums">
              Whole circle: 2πr = {f2(2 * Math.PI * r)} {unit}, πr² = {f2(Math.PI * r * r)} {unit}²
            </p>
          )}
          <Stepper label="Angle θ" colour={COL.cheese} display={`${theta}°`} min={THETA.min} max={THETA.max} step={THETA.step} value={theta} onChange={(v) => {
              setTheta(v);
              setChecked(null);
            }} />
          {round ? (
            <>
              <p className="text-center text-xs text-white/50">
                Radius r = {round.r} {unit} (fixed)
              </p>
              <button className="btn-primary !py-2 text-sm" onClick={check}>
                Cut the slice
              </button>
              {checked !== null && (
                <p className={`text-center text-sm ${checked ? "text-lime-300" : "text-amber-200"}`}>
                  {checked
                    ? round.kind === "theta"
                      ? `Yes! ${Math.round(360 / round.target)} slices of ${theta}° make exactly 360°.`
                      : round.kind === "arc"
                        ? `Yes! ${f2(arc)} ${unit} of crust, just what Riya wanted.`
                        : `Yes! The sprinkler waters ${f2(area)} ${unit}².`
                    : `Not yet: ${miss}`}
                </p>
              )}
            </>
          ) : (
            <Stepper label="Radius r" colour={COL.radius} display={`${radius} cm`} min={RADIUS.min} max={RADIUS.max} step={RADIUS.step} value={radius} onChange={setRadius} />
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Sector" value={`${f2(sec)} cm²`} colour="text-amber-200" />
            <Readout label="Triangle" value={`${f2(tri)} cm²`} colour="text-cyan-200" />
            <Readout label="Segment" value={`${f2(seg)} cm²`} colour="text-pink-200" />
          </div>
          <p className="text-center text-xs text-white/50 tabular-nums">
            segment = sector − triangle = {f2(sec)} − {f2(tri)} = {f2(seg)} cm²
          </p>
          <Stepper label="Angle θ" colour={COL.cheese} display={`${segTheta}°`} min={SEG_THETA.min} max={SEG_THETA.max} step={SEG_THETA.step} value={segTheta} onChange={setSegTheta} />
          <Stepper label="Radius r" colour={COL.radius} display={`${radius} cm`} min={RADIUS.min} max={RADIUS.max} step={RADIUS.step} value={radius} onChange={setRadius} />
        </>
      )}
    </div>
  );
}

function Readout({ label, value, colour }: { label: string; value: string; colour: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] tracking-wider text-white/50">{label}</div>
      <div className={`truncate font-display text-base tabular-nums sm:text-lg ${colour}`}>{value}</div>
    </div>
  );
}

/** A slider with − and + buttons. */
function Stepper(p: { label: string; colour: string; display: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.min(p.max, Math.max(p.min, Math.round(v / p.step) * p.step));
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="flex justify-between text-sm">
        <span style={{ color: p.colour }}>{p.label}</span>
        <span className="tabular-nums text-white">{p.display}</span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <button
          aria-label={`Decrease ${p.label}`}
          onClick={() => p.onChange(clamp(p.value - p.step))}
          className="h-9 w-9 shrink-0 rounded-lg border border-white/10 text-lg text-white/80"
        >
          −
        </button>
        <input
          type="range"
          aria-label={p.label}
          className="range min-w-0 flex-1"
          min={p.min}
          max={p.max}
          step={p.step}
          value={p.value}
          onChange={(e) => p.onChange(Number(e.target.value))}
        />
        <button
          aria-label={`Increase ${p.label}`}
          onClick={() => p.onChange(clamp(p.value + p.step))}
          className="h-9 w-9 shrink-0 rounded-lg border border-white/10 text-lg text-white/80"
        >
          +
        </button>
      </div>
    </div>
  );
}

/** Text in a corner of the canvas, with a dark backing box. */
function cornerTag(ctx: CanvasRenderingContext2D, text: string, w: number, side: "left" | "right", colour: string) {
  ctx.font = "bold 12px system-ui, sans-serif";
  const tw = ctx.measureText(text).width;
  const x = side === "left" ? 8 : w - 8 - tw;
  ctx.fillStyle = "rgba(10,13,28,0.85)";
  ctx.fillRect(x - 4, 6, tw + 8, 18);
  ctx.fillStyle = colour;
  ctx.textAlign = "left";
  ctx.fillText(text, x, 19);
}

/** Canvas angle for a clock-style angle: 0° at 12 o'clock, turning clockwise. */
const clockAngle = (deg: number) => -Math.PI / 2 + deg * RAD;

function geometry(w: number, h: number, r: number, rMax: number) {
  const Rmax = Math.max(10, Math.min(w, h) / 2 - 30);
  return { cx: w / 2, cy: h / 2 + 8, R: (r / rMax) * Rmax, Rmax };
}

function drawPizza(ctx: CanvasRenderingContext2D, w: number, h: number, theta: number, r: number, rMax: number, unit: string) {
  const { cx, cy, R } = geometry(w, h, r, rMax);
  const a0 = clockAngle(0);
  const a1 = clockAngle(theta);

  // The whole pizza, faint.
  ctx.fillStyle = "rgba(250,204,21,0.08)";
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(251,146,60,0.35)";
  ctx.lineWidth = 4;
  ctx.stroke();

  // The slice.
  ctx.fillStyle = "rgba(250,204,21,0.42)";
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, R, a0, a1);
  ctx.closePath();
  ctx.fill();

  // Toppings: spread evenly with the golden angle, only inside the slice.
  ctx.fillStyle = "rgba(239,68,68,0.75)";
  const N = 60;
  for (let i = 0; i < N; i++) {
    const rr = Math.sqrt((i + 0.5) / N) * 0.82 * R;
    const ang = (i * 137.508) % 360;
    const margin = (6 / Math.max(rr, 1)) / RAD + 1;
    if (rr < 12 || ang < margin || ang > theta - margin) continue;
    ctx.beginPath();
    ctx.arc(cx + rr * Math.cos(clockAngle(ang)), cy + rr * Math.sin(clockAngle(ang)), Math.max(1.5, R * 0.035), 0, Math.PI * 2);
    ctx.fill();
  }

  // Crust: the arc.
  ctx.strokeStyle = COL.crust;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.shadowColor = COL.crust;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, R, a0, a1);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.lineCap = "butt";

  // The two radii.
  ctx.strokeStyle = COL.radius;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + R * Math.cos(a0), cy + R * Math.sin(a0));
  ctx.lineTo(cx, cy);
  ctx.lineTo(cx + R * Math.cos(a1), cy + R * Math.sin(a1));
  ctx.stroke();

  // Angle mark at the centre.
  ctx.strokeStyle = COL.cheese;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, Math.min(14, R * 0.4), a0, a1);
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();

  cornerTag(ctx, `r = ${r} ${unit}`, w, "left", "#67e8f9");
  cornerTag(ctx, `θ = ${theta}°`, w, "right", "#fde047");
}

function drawSegment(ctx: CanvasRenderingContext2D, w: number, h: number, theta: number, r: number, unit: string) {
  const { cx, cy, R } = geometry(w, h, r, RADIUS.max);
  const a0 = clockAngle(0);
  const a1 = clockAngle(theta);
  const A = { x: cx + R * Math.cos(a0), y: cy + R * Math.sin(a0) };
  const B = { x: cx + R * Math.cos(a1), y: cy + R * Math.sin(a1) };

  // The whole circle, faint.
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Triangle O A B.
  ctx.fillStyle = "rgba(34,211,238,0.22)";
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(A.x, A.y);
  ctx.lineTo(B.x, B.y);
  ctx.closePath();
  ctx.fill();

  // Segment: between the arc and the chord.
  ctx.fillStyle = "rgba(244,114,182,0.45)";
  ctx.beginPath();
  ctx.moveTo(A.x, A.y);
  ctx.arc(cx, cy, R, a0, a1);
  ctx.closePath();
  ctx.fill();

  // Outlines: radii, chord and arc.
  ctx.strokeStyle = COL.tri;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(A.x, A.y);
  ctx.lineTo(cx, cy);
  ctx.lineTo(B.x, B.y);
  ctx.stroke();
  ctx.strokeStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(A.x, A.y);
  ctx.lineTo(B.x, B.y);
  ctx.stroke();
  ctx.strokeStyle = COL.seg;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, R, a0, a1);
  ctx.stroke();

  ctx.strokeStyle = COL.cheese;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, Math.min(14, R * 0.4), a0, a1);
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();

  cornerTag(ctx, `r = ${r} ${unit}`, w, "left", "#67e8f9");
  cornerTag(ctx, `θ = ${theta}°`, w, "right", "#fde047");
}
