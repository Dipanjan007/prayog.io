"use client";

import { useEffect, useRef, useState } from "react";
import { RETINA_M, bifocalHalf, eyeAtAge, eyeWithAmplitude, farPoint, nearPoint, viewThrough } from "@/lib/sim/eyedefects";

export type EyeScene = "newspaper" | "needle" | "bus";
export type LensMode = "none" | "single" | "bifocal";

export interface EyeAgeReading {
  scene: EyeScene;
  age: number;
  myopic: boolean;
  cataract: boolean;
  /** Object distance in metres (Infinity for the far bus). */
  d: number;
  /** Naked-eye near and far points, metres. */
  nearPoint: number;
  farPoint: number;
  lens: LensMode;
  /** The lens power the eye is looking through right now (dioptres). */
  power: number;
  top: number;
  bottom: number;
  half: "top" | "bottom" | null;
  sharp: boolean;
  focus: "on" | "front" | "behind";
  challenge: boolean;
}

interface Props {
  onReading?: (r: EyeAgeReading) => void;
  /** Challenge: a customer with a hidden eye. Only the object distance and a single lens can be changed. */
  customer?: { name: string; scene: EyeScene; amp: number } | null;
}

const SCENES: { id: EyeScene; label: string; view: string }[] = [
  { id: "newspaper", label: "📰 Newspaper", view: "📰 Monsoon reaches Kerala early" },
  { id: "needle", label: "🪡 Needle", view: "🪡 ○ thread goes through the eye" },
  { id: "bus", label: "🚌 Far bus", view: "🚌 340 · Dadar Station" },
];

// Distance slider: 0..1000 maps to 10 cm .. 3 m on a log scale, rounded to whole centimetres.
const D_MIN = 0.1;
const D_RATIO = 30;
const sliderToD = (s: number) => Math.round(D_MIN * 100 * Math.pow(D_RATIO, s / 1000)) / 100;
const dToSlider = (d: number) => Math.round((1000 * Math.log(d / D_MIN)) / Math.log(D_RATIO));

export const fmtD = (p: number) => `${p > 0 ? "+" : p < 0 ? "−" : ""}${Math.abs(p).toFixed(2)} D`;
export const fmtDist = (d: number) => (!Number.isFinite(d) ? "infinity" : d < 1 ? `${Math.round(d * 100)} cm` : `${d.toFixed(2)} m`);

export default function EyeAgeLab({ onReading, customer = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scene, setScene] = useState<EyeScene>(customer?.scene ?? "newspaper");
  const [age, setAge] = useState(15);
  const [slider, setSlider] = useState(dToSlider(0.4));
  const [lens, setLens] = useState<LensMode>("none");
  const [single, setSingle] = useState(0);
  const [top, setTop] = useState(0);
  const [bottom, setBottom] = useState(0);
  const [myopicSet, setMyopic] = useState(false);
  const [cataractSet, setCataract] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const challenge = customer !== null;
  const myopic = !challenge && myopicSet;
  const cataract = !challenge && cataractSet;
  const lensMode: LensMode = challenge && lens === "bifocal" ? "single" : lens;
  const eye = customer ? eyeWithAmplitude(customer.amp) : eyeAtAge(age, myopic);
  const d = scene === "bus" ? Infinity : sliderToD(slider);
  const half = lensMode === "bifocal" ? bifocalHalf(d) : null;
  const power = lensMode === "none" ? 0 : lensMode === "single" ? single : half === "top" ? top : bottom;
  const view = viewThrough(eye, d, power);
  const sharp = view.sharp && !cataract;
  const np = nearPoint(eye);
  const fp = farPoint(eye);

  useEffect(() => {
    onReadingRef.current?.({
      scene,
      age,
      myopic,
      cataract,
      d,
      nearPoint: np,
      farPoint: fp,
      lens: lensMode,
      power,
      top,
      bottom,
      half,
      sharp,
      focus: view.focus,
      challenge,
    });
  }, [scene, age, myopic, cataract, d, np, fp, lensMode, power, top, bottom, half, sharp, view.focus, challenge]);

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
    draw(ctx, size.w, size.h, {
      d,
      emoji: scene === "newspaper" ? "📰" : scene === "needle" ? "🪡" : "🚌",
      eyePower: view.eyePower,
      effort: view.effort,
      defocus: view.defocus,
      imageDistance: view.imageDistance,
      lens: lensMode,
      power,
      top,
      bottom,
      half,
      cataract,
      np: challenge ? null : np,
      fp: challenge ? null : fp,
    });
  }, [size, d, scene, view.eyePower, view.effort, view.defocus, view.imageDistance, lensMode, power, top, bottom, half, cataract, challenge, np, fp]);

  const blur = sharp ? 0 : Math.min(10, 1.2 + Math.abs(view.defocus) * 5);
  const sceneView = SCENES.find((s) => s.id === scene)!;
  const effortLabel = view.effort < 0.05 ? "relaxed" : view.effort > 0.97 ? "squeezing as hard as they can" : "squeezing";

  return (
    <div className="flex flex-col gap-3 select-none">
      <canvas
        ref={canvasRef}
        className="h-60 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-72"
        role="img"
        aria-label={`Eye looking at the ${scene === "bus" ? "far bus" : `${scene} ${fmtDist(d)} away`}: the image falls ${
          cataract ? "through a cloudy lens" : view.focus === "on" ? "on" : view.focus === "front" ? "in front of" : "behind"
        } the retina`}
      />

      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <div className="w-14 shrink-0 text-xs text-white/50">What the eye sees</div>
        <div className="min-w-0 flex-1 overflow-hidden rounded-xl bg-white/90">
          <div
            className="px-3 py-2 text-center text-sm font-semibold text-slate-900 transition-[filter]"
            style={{ filter: cataract ? "blur(4px) contrast(0.35) brightness(1.15)" : `blur(${blur}px)` }}
          >
            {sceneView.view}
          </div>
        </div>
        <div className={`w-16 shrink-0 text-right text-sm font-semibold ${sharp ? "text-lime-300" : "text-rose-300"}`}>
          {cataract ? "Cloudy" : sharp ? "Sharp" : "Blurred"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
          <div className="text-[11px] uppercase tracking-wider text-white/50">Near point</div>
          <div className="font-display text-lg tabular-nums">{challenge ? "Measure it" : fmtDist(np)}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
          <div className="text-[11px] uppercase tracking-wider text-white/50">Far point</div>
          <div className="font-display text-lg tabular-nums">{challenge ? "Far is fine" : fmtDist(fp)}</div>
        </div>
      </div>
      <p className="text-center text-xs text-white/50">
        Ciliary muscles: {effortLabel}.
        {power !== 0 && Number.isFinite(view.imageDistance) && ` The glasses make a virtual image ${fmtDist(view.imageDistance)} away.`}
      </p>

      <Choice options={SCENES.map((s) => ({ id: s.id, label: s.label }))} value={scene} onChange={setScene} />

      {customer ? (
        <div className="rounded-2xl border border-violet-300/30 bg-violet-300/[0.07] px-4 py-2 text-sm">
          <span className="text-white/60">At the counter: </span>
          <span className="text-white">{customer.name}</span>
          <span className="text-white/60"> (age and eye hidden)</span>
        </div>
      ) : (
        <Slider label="Age" value={`${age} years`} min={10} max={80} step={1} v={age} onChange={setAge} />
      )}

      {scene !== "bus" && (
        <Slider label="Distance from the eye" value={fmtDist(d)} min={0} max={1000} step={1} v={slider} onChange={setSlider} />
      )}

      <Choice
        options={[
          { id: "none" as const, label: "No glasses" },
          { id: "single" as const, label: "Reading glasses" },
          ...(challenge ? [] : [{ id: "bifocal" as const, label: "Bifocal" }]),
        ]}
        value={lensMode}
        onChange={setLens}
      />
      {lensMode === "single" && <PowerSlider label="Lens power" v={single} onChange={setSingle} />}
      {lensMode === "bifocal" && (
        <>
          <PowerSlider label={`Top half, for far${half === "top" ? " (in use)" : ""}`} v={top} onChange={setTop} />
          <PowerSlider label={`Bottom half, for reading${half === "bottom" ? " (in use)" : ""}`} v={bottom} onChange={setBottom} />
        </>
      )}

      {!challenge && (
        <div className="grid grid-cols-2 gap-2">
          <Toggle on={myopicSet} onClick={() => setMyopic(!myopicSet)} label="Short-sighted too (far point 2 m)" />
          <Toggle on={cataractSet} onClick={() => setCataract(!cataractSet)} label="Cataract" />
        </div>
      )}
    </div>
  );
}

function Slider({ label, value, min, max, step, v, onChange }: { label: string; value: string; min: number; max: number; step: number; v: number; onChange: (v: number) => void }) {
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

function PowerSlider({ label, v, onChange }: { label: string; v: number; onChange: (v: number) => void }) {
  const kind = v > 0 ? "convex" : v < 0 ? "concave" : "plain glass";
  return <Slider label={label} value={`${fmtD(v)} (${kind})`} min={-3} max={4} step={0.25} v={v} onChange={onChange} />;
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} aria-pressed={on} className={`rounded-xl border px-3 py-2 text-sm ${on ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}>
      {on ? "✓ " : ""}
      {label}
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
          className={`flex-1 whitespace-nowrap rounded-xl border px-2 py-2 text-sm ${value === o.id ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

interface DrawState {
  d: number;
  emoji: string;
  eyePower: number;
  effort: number;
  defocus: number;
  imageDistance: number;
  lens: LensMode;
  power: number;
  top: number;
  bottom: number;
  half: "top" | "bottom" | null;
  cataract: boolean;
  np: number | null;
  fp: number | null;
}

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, s: DrawState) {
  const RULER = 40;
  const eh = h - RULER;
  // Eye drawn in cm; the eyeball is 2.5 cm across and sits on the right.
  const k = Math.min(eh / 3.3, w / 8.5);
  const lensX = w - 3.1 * k;
  const oy = eh / 2 + 4;
  const X = (cm: number) => lensX + cm * k;
  const Y = (cm: number) => oy - cm * k;
  const retinaCm = RETINA_M * 100;
  ctx.font = "11px system-ui, sans-serif";

  // Not to scale: distances in front of the eye are squeezed onto a log scale (10 cm .. 3 m).
  const gx = X(-0.9);
  const leftX = 18;
  const span = gx - 24 - leftX;
  const toX = (dist: number) => (Number.isFinite(dist) ? gx - 24 - span * Math.min(1, Math.max(0, Math.log(dist / D_MIN) / Math.log(D_RATIO))) : -Infinity);

  // Eyeball and retina.
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(X(1.25), oy, 1.3 * k, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#f472b6";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(X(1.25), oy, 1.3 * k, -0.6, 0.6);
  ctx.stroke();
  ctx.fillStyle = "#f472b6";
  ctx.textAlign = "right";
  ctx.fillText("retina", w - 6, Y(1.25));

  // Ciliary muscles: glow pinker the harder they squeeze.
  const e = Math.max(0, Math.min(1, s.effort));
  ctx.fillStyle = `rgb(${Math.round(34 + e * 210)}, ${Math.round(211 - e * 97)}, ${Math.round(238 - e * 56)})`;
  for (const sgn of [1, -1]) {
    ctx.beginPath();
    ctx.ellipse(X(0), Y(sgn * 0.78), 0.1 * k, 0.16 * k, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eye lens: fatter with more power; milky with a cataract.
  ctx.fillStyle = s.cataract ? "rgba(226,232,240,0.75)" : "rgba(125,211,252,0.25)";
  ctx.strokeStyle = "rgba(125,211,252,0.8)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(X(0), oy, 0.1 * k + Math.max(0, s.eyePower - 40) * 0.045 * k, 0.6 * k, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText(s.cataract ? "cloudy lens" : "eye lens", X(0), Y(1.05));

  // Spectacles.
  const drawHalf = (p: number, y0: number, y1: number, active: boolean) => {
    if (p === 0) {
      ctx.strokeStyle = active ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gx, Y(y0));
      ctx.lineTo(gx, Y(y1));
      ctx.stroke();
      return;
    }
    const col = p > 0 ? "163,230,53" : "34,211,238";
    ctx.strokeStyle = `rgba(${col},${active ? 1 : 0.35})`;
    ctx.lineWidth = 2;
    const b = Math.sign(p) * Math.min(9, 3 + Math.abs(p) * 1.5);
    const ym = (Y(y0) + Y(y1)) / 2;
    ctx.beginPath();
    ctx.moveTo(gx, Y(y0));
    ctx.quadraticCurveTo(gx + b, ym, gx, Y(y1));
    ctx.moveTo(gx, Y(y0));
    ctx.quadraticCurveTo(gx - b, ym, gx, Y(y1));
    ctx.stroke();
  };
  if (s.lens === "single") drawHalf(s.power, 0.85, -0.85, true);
  if (s.lens === "bifocal") {
    drawHalf(s.top, 0.85, 0.03, s.half === "top");
    drawHalf(s.bottom, -0.03, -0.85, s.half === "bottom");
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText("bifocal", gx, Y(-1.1));
  }

  // Rays from the object, bent by the glasses so they seem to come from the glasses' virtual image,
  // then focused by the eye lens. A real 0.5 D error moves the focus by under half a millimetre, so the
  // drawing exaggerates it: each dioptre of error shifts the meeting point 0.6 cm from the retina.
  const objX = toX(s.d);
  const glasses = s.lens !== "none" && s.power !== 0;
  const imgX = glasses ? toX(s.imageDistance) : objX;
  const meet = Math.min(4, Math.max(1.3, retinaCm - s.defocus * 0.6));
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = s.cataract ? "rgba(253,224,71,0.55)" : "#fde047";
  ctx.shadowColor = "#fde047";
  ctx.shadowBlur = 5;
  const heights = s.half === "top" ? [0.5, 0.35, 0.2, 0.05] : s.half === "bottom" ? [-0.05, -0.2, -0.35, -0.5] : [-0.5, -0.25, 0, 0.25, 0.5];
  for (const yg of heights) {
    const py = Y(yg);
    // Incoming ray: from the object point on the axis (or parallel from far away) to the glasses plane.
    ctx.beginPath();
    if (Number.isFinite(objX)) ctx.moveTo(objX, oy);
    else ctx.moveTo(leftX, py);
    ctx.lineTo(gx, py);
    // Between glasses and eye the ray travels as if it came from the image point (the object itself without glasses).
    const slope = Number.isFinite(imgX) ? (py - oy) / (gx - imgX) : 0;
    const yLensPx = py + slope * (X(0) - gx);
    const yLens = (oy - yLensPx) / k;
    ctx.lineTo(X(0), yLensPx);
    ctx.lineTo(X(retinaCm), Y(yLens - (yLens / meet) * retinaCm));
    ctx.stroke();
  }
  if (glasses && Number.isFinite(imgX)) {
    ctx.shadowBlur = 0;
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = "rgba(253,224,71,0.35)";
    ctx.lineWidth = 1;
    for (const yg of [heights[0], heights[heights.length - 1]]) {
      ctx.beginPath();
      ctx.moveTo(gx, Y(yg));
      ctx.lineTo(imgX, oy);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(253,224,71,0.8)";
    ctx.beginPath();
    ctx.arc(imgX, oy, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "10px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("image", imgX, oy + 14);
  }
  ctx.shadowBlur = 0;

  // Object marker.
  ctx.font = "20px system-ui, sans-serif";
  ctx.textAlign = "center";
  if (Number.isFinite(objX)) ctx.fillText(s.emoji, objX, oy - 10);
  else ctx.fillText(s.emoji, leftX + 10, 22);
  ctx.font = "11px system-ui, sans-serif";

  // Focus marker.
  if (s.cataract) {
    ctx.fillStyle = "rgba(226,232,240,0.5)";
    for (let i = 0; i < 40; i++) {
      const a = (i * 2.399) % (Math.PI * 2);
      const r = ((i * 37) % 100) / 100;
      ctx.fillRect(X(0.4 + r * 1.9), oy + Math.sin(a) * r * 0.9 * k, 2, 2);
    }
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText("light scattered by the cloudy lens", X(1.25), Y(-1.15));
  } else if (meet < retinaCm - 0.05) {
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    ctx.arc(X(meet), oy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText("focus in front of retina", X(1.25), Y(-1.15));
  } else if (meet > retinaCm + 0.05) {
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText("focus behind retina", X(1.25), Y(-1.15));
  } else {
    ctx.fillStyle = "#a3e635";
    ctx.fillText("sharp on the retina", X(1.25), Y(-1.15));
  }

  // Distance ruler (log scale) with the near point and far point.
  const ry = h - 22;
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftX, ry);
  ctx.lineTo(gx, ry);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "10px system-ui, sans-serif";
  const ticks: [number, string][] = span > 200 ? [[0.1, "10 cm"], [0.25, "25"], [0.5, "50"], [1, "1 m"], [2, "2 m"]] : [[0.1, "10"], [0.25, "25"], [1, "1 m"], [2, "2 m"]];
  for (const [dist, label] of ticks) {
    const x = toX(dist);
    ctx.fillRect(x - 0.5, ry - 3, 1, 6);
    ctx.fillText(label, x, ry + 14);
  }
  if (span > 200) ctx.fillText("∞ ←", leftX + 4, ry + 14);
  ctx.fillText("eye", gx + 8, ry + 14);
  const mark = (dist: number, color: string, label: string, up: boolean) => {
    const x = Number.isFinite(dist) ? toX(dist) : leftX;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, ry - 2);
    ctx.lineTo(x - 5, ry - 10);
    ctx.lineTo(x + 5, ry - 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillText(label, Math.max(leftX + 20, Math.min(gx - 20, x)), up ? ry - 14 : ry - 26);
  };
  if (s.np !== null) mark(s.np, "#f472b6", "near point", true);
  if (s.fp !== null && Number.isFinite(s.fp)) mark(s.fp, "#22d3ee", "far point", false);
  ctx.textAlign = "left";
}
