"use client";

import { useEffect, useRef, useState } from "react";
import type { Vec } from "@/lib/sim/optics";
import { CONDITIONS, INCIDENCE, RETINA_CM, TARGETS, eyeFocus, prismScene, type EyeCondition, type TargetId } from "@/lib/sim/eye";

export type EyeMode = "eye" | "prism";

export interface EyeReading {
  mode: EyeMode;
  condition: EyeCondition;
  target: TargetId;
  glasses: number;
  sharp: boolean;
  /** Where the image falls: "on" the retina, "front" or "behind". */
  focus: "on" | "front" | "behind";
  prism: { incidence: number; recombined: boolean; spread: number };
}

interface Props {
  onReading?: (r: EyeReading) => void;
  /** Challenge: fixes the eye and target; the student only picks glasses. */
  patient?: { condition: EyeCondition; target: TargetId; min: number; max: number } | null;
}

export default function EyeBench({ onReading, patient = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<EyeMode>("eye");
  const [condition, setCondition] = useState<EyeCondition>("normal");
  const [target, setTarget] = useState<TargetId>("book");
  const [glasses, setGlasses] = useState(0);
  const [incidence, setIncidence] = useState(50);
  const [recombined, setRecombined] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const cond = patient ? { ...CONDITIONS[patient.condition], min: patient.min, max: patient.max } : CONDITIONS[condition];
  const activeCondition = patient?.condition ?? condition;
  const activeTarget = patient?.target ?? target;
  const t = TARGETS.find((x) => x.id === activeTarget)!;
  const { eye, defocus, sharp, focus } = eyeFocus(cond, t.d, glasses);
  const activeMode = patient ? "eye" : mode;

  const prism = prismScene(incidence, recombined);

  useEffect(() => {
    onReadingRef.current?.({
      mode: activeMode,
      condition: activeCondition,
      target: activeTarget,
      glasses,
      sharp,
      focus,
      prism: { incidence, recombined, spread: prism.spread },
    });
  }, [activeMode, activeCondition, activeTarget, glasses, sharp, focus, incidence, recombined, prism.spread]);

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
    if (activeMode === "eye") drawEye(ctx, size.w, size.h, t.d, eye, glasses, defocus);
    else drawPrism(ctx, size.w, size.h, prism);
  }, [size, activeMode, t.d, eye, glasses, defocus, prism]);

  const blur = Math.min(10, Math.abs(defocus) * 5);

  return (
    <div className="flex flex-col gap-3 select-none">
      {!patient && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-ink/20 p-1 text-sm">
          {(["eye", "prism"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${activeMode === m ? "bg-cream/10 text-cream" : "text-faint"}`}>
              {m === "eye" ? "Human eye" : "Glass prism"}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-56 w-full rounded-2xl border border-line bg-well sm:h-72"
        role="img"
        aria-label={
          activeMode === "eye"
            ? `${cond.label} looking at the ${t.label.toLowerCase()}: the image falls ${focus === "on" ? "on" : focus === "front" ? "in front of" : "behind"} the retina`
            : `White light through a glass prism splits into a spectrum${recombined ? ", then a second prism joins it back into white" : ""}`
        }
      />

      {activeMode === "eye" ? (
        <>
          <div className="flex items-center gap-3 rounded-2xl panel p-3">
            <div className="text-xs text-faint">What the eye sees</div>
            <div
              className="flex-1 rounded-xl bg-cream/90 px-3 py-2 text-center font-semibold text-ink transition-[filter]"
              style={{ filter: `blur(${blur}px)` }}
            >
              {t.emoji} {t.text}
            </div>
            <div className={`text-sm font-semibold ${sharp ? "text-sage-300" : "text-brick-300"}`}>{sharp ? "Sharp" : "Blurred"}</div>
          </div>
          {!patient && (
            <>
              <Choice
                options={(Object.keys(CONDITIONS) as EyeCondition[]).map((id) => ({ id, label: CONDITIONS[id].label }))}
                value={condition}
                onChange={setCondition}
              />
              <Choice options={TARGETS.map((x) => ({ id: x.id, label: `${x.emoji} ${x.label}` }))} value={target} onChange={setTarget} />
            </>
          )}
          <label className="block rounded-2xl panel px-4 py-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Spectacle lens power</span>
              <span className="tabular-nums text-cream">
                {glasses > 0 ? "+" : glasses < 0 ? "−" : ""}
                {Math.abs(glasses).toFixed(1)} D {glasses > 0 ? "(convex)" : glasses < 0 ? "(concave)" : "(no glasses)"}
              </span>
            </div>
            <input type="range" className="range mt-2 w-full" min={-3} max={3} step={0.5} value={glasses} onChange={(e) => setGlasses(Number(e.target.value))} />
          </label>
          <p className="text-center text-xs text-faint">
            {patient ? "A mystery patient" : `${cond.label}: ${cond.note}`}. The eye lens adjusts by itself (accommodation) as far as it can.
          </p>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-2xl panel px-1 py-2">
              <div className="text-[11px] uppercase tracking-wider text-faint">Angle of incidence</div>
              <div className="font-display text-lg tabular-nums">{incidence}°</div>
            </div>
            <div className="rounded-2xl panel px-1 py-2">
              <div className="text-[11px] uppercase tracking-wider text-faint">Red to violet spread</div>
              <div className="font-display text-lg tabular-nums">{prism.spread.toFixed(1)}°</div>
            </div>
          </div>
          <label className="block rounded-2xl panel px-4 py-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Angle of incidence</span>
              <span className="tabular-nums text-cream">{incidence}°</span>
            </div>
            <input type="range" className="range mt-2 w-full" min={INCIDENCE.min} max={INCIDENCE.max} step={1} value={incidence} onChange={(e) => setIncidence(Number(e.target.value))} />
          </label>
          <button
            className={`rounded-xl border px-3 py-2 text-sm ${recombined ? "chip-on" : "border-line text-muted"}`}
            onClick={() => setRecombined(!recombined)}
          >
            {recombined ? "Remove the second prism" : "Add a second prism, upside down (Newton's experiment)"}
          </button>
        </>
      )}
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
          className={`flex-1 rounded-xl border px-3 py-2 text-sm whitespace-nowrap ${value === o.id ? "chip-on" : "border-line text-muted"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function drawEye(ctx: CanvasRenderingContext2D, w: number, h: number, d: number, eyePower: number, glasses: number, defocus: number) {
  // Eye drawn in cm; the eyeball is 2.5 cm across and sits on the right.
  const k = Math.min(h / 3.4, w / 6);
  const lensX = w - 3.1 * k;
  const oy = h / 2;
  const X = (cm: number) => lensX + cm * k;
  const Y = (cm: number) => oy - cm * k;

  // Eyeball, cornea, retina.
  ctx.strokeStyle = "rgba(240,233,221,0.5)";
  ctx.fillStyle = "rgba(240,233,221,0.04)";
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
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("retina", w - 6, Y(1.2));
  ctx.textAlign = "left";

  // Eye lens.
  ctx.fillStyle = "rgba(125,211,252,0.25)";
  ctx.strokeStyle = "rgba(125,211,252,0.8)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(X(0), oy, 0.12 * k + (eyePower - 40) * 0.03 * k, 0.55 * k, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(240,233,221,0.6)";
  ctx.fillText("eye lens", X(-0.35), Y(0.85));

  // Spectacles.
  if (glasses !== 0) {
    const gx = X(-0.9);
    ctx.strokeStyle = glasses > 0 ? "#a3e635" : "#22d3ee";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const b = glasses > 0 ? 6 : -6;
    ctx.moveTo(gx, Y(0.8));
    ctx.quadraticCurveTo(gx + b, oy, gx, Y(-0.8));
    ctx.moveTo(gx, Y(0.8));
    ctx.quadraticCurveTo(gx - b, oy, gx, Y(-0.8));
    ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillText(glasses > 0 ? "convex" : "concave", gx - 22, Y(-1.0));
  }

  // Rays from a point on the object, diverging (or parallel for far objects), through the eye.
  // A real 0.5 D error moves the focus by under half a millimetre, so the drawing exaggerates
  // it: each dioptre of error shifts the meeting point 0.6 cm from the retina.
  const meet = Math.min(4, Math.max(1.3, RETINA_CM - defocus * 0.6));
  const dcm = Number.isFinite(d) ? d * 100 : Infinity;
  const startX = -lensX / k;
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = "#fde047";
  ctx.shadowColor = "#fde047";
  ctx.shadowBlur = 5;
  for (const y of [-0.4, -0.2, 0, 0.2, 0.4]) {
    const slopeIn = Number.isFinite(dcm) ? y / dcm : 0;
    const slopeOut = -y / meet;
    ctx.beginPath();
    ctx.moveTo(X(startX), Y(y + slopeIn * startX));
    ctx.lineTo(X(0), Y(y));
    // Stop at the retina.
    ctx.lineTo(X(RETINA_CM), Y(y + slopeOut * RETINA_CM));
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  if (meet < RETINA_CM - 0.05) {
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    ctx.arc(X(meet), oy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(240,233,221,0.7)";
    ctx.textAlign = "center";
    ctx.fillText("focus in front of retina", X(1.25), Y(-0.95));
    ctx.textAlign = "left";
  } else if (meet > RETINA_CM + 0.05) {
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = "rgba(253,224,71,0.5)";
    for (const y of [-0.4, 0.4]) {
      ctx.beginPath();
      ctx.moveTo(X(RETINA_CM), Y(y - (y / meet) * RETINA_CM));
      ctx.lineTo(X(meet), oy);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(240,233,221,0.7)";
    ctx.textAlign = "center";
    ctx.fillText("focus behind retina", X(1.25), Y(-0.95));
    ctx.textAlign = "left";
  }
}

function drawPrism(ctx: CanvasRenderingContext2D, w: number, h: number, scene: ReturnType<typeof prismScene>) {
  const k = Math.min(w / 44, h / 24);
  const P = (p: Vec) => ({ x: w / 2 + p.x * k, y: h / 2 - p.y * k });
  for (const tri of [scene.first, scene.second]) {
    if (!tri) continue;
    ctx.fillStyle = "rgba(125,211,252,0.12)";
    ctx.strokeStyle = "rgba(125,211,252,0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    tri.forEach((p, i) => (i ? ctx.lineTo(P(p).x, P(p).y) : ctx.moveTo(P(p).x, P(p).y)));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // White beam in.
  const a = P(scene.start);
  const b = P(scene.mid);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = "lighter";
  for (const r of scene.rays) {
    ctx.strokeStyle = r.c;
    ctx.lineWidth = 2;
    ctx.beginPath();
    r.path.points.slice(1).forEach((p, i) => (i ? ctx.lineTo(P(p).x, P(p).y) : ctx.moveTo(P(p).x, P(p).y)));
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";
  if (!scene.second) {
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillStyle = "rgba(240,233,221,0.6)";
    ctx.fillText("V I B G Y O R", w - 90, h - 10);
  }
}
