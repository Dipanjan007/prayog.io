"use client";

import { useEffect, useRef, useState } from "react";
import { TRUCK_BED_H, type LoadingJob } from "@/content/lessons/simple-machines";
import {
  PULLEYS,
  RAMP_MU,
  WORK_ACTIONS,
  kgf,
  liftTime,
  mechanicalAdvantage,
  power,
  pulleyEffort,
  pulleySetup,
  rampAngle,
  rampForce,
  ropePulled,
  weight,
  workMeterRun,
  type PulleyId,
  type WorkAction,
  type WorkRun,
} from "@/lib/sim/machines";
import { fitCanvas } from "./canvas";

export type MachineMode = "work" | "pulley" | "ramp" | "power";

/** One finished run. The sim reports each run once, when its animation ends. */
export type MachineReading =
  | { mode: "work"; runId: number; m: number; run: WorkRun }
  | {
      mode: "pulley";
      runId: number;
      setup: PulleyId;
      /** Ideal mechanical advantage (strands holding the load) and number of pulleys. */
      n: number;
      k: number;
      friction: boolean;
      m: number;
      load: number;
      effort: number;
      lift: number;
      rope: number;
      realMA: number;
      workIn: number;
      workOut: number;
    }
  | { mode: "ramp"; runId: number; m: number; h: number; L: number; theta: number; friction: boolean; F: number; FL: number; mgh: number }
  | { mode: "power"; runId: number; m: number; h: number; tA: number; tB: number; W: number; PA: number; PB: number }
  | { mode: "motor"; runId: number; m: number; h: number; P: number; t: number };

type DistOmit<T> = T extends unknown ? Omit<T, "runId"> : never;
type Pending = DistOmit<MachineReading>;

interface Props {
  onReading?: (r: MachineReading) => void;
  /** Challenge: one loading job, which locks the mode and the load. */
  job?: LoadingJob | null;
}

const PULLEY_LIFT = 3;
const POWER_H = 6;
const LOADS = {
  bucket: { label: "Water bucket", m: 15 },
  cement: { label: "Cement bag", m: 50 },
  bricks: { label: "Brick pallet", m: 120 },
} as const;
type LoadId = keyof typeof LOADS | "crate";

const C = {
  force: "#f472b6",
  move: "#22d3ee",
  load: "#a78bfa",
  fric: "#fb923c",
  pos: "#a3e635",
  neg: "#fb7185",
  text: "rgba(255,255,255,0.75)",
  dim: "rgba(255,255,255,0.45)",
  rope: "#e2e8f0",
};
const FONT = "12px system-ui, sans-serif";

type Anim = { key: string; start: number; dur: number; reported: boolean; reading: Pending };

const fmt = (x: number, d = 1) => (Math.abs(x) < 0.05 && d <= 1 ? "0" : x.toFixed(d));
const signed = (x: number) => (x > 0.05 ? `+${x.toFixed(1)}` : x < -0.05 ? `−${Math.abs(x).toFixed(1)}` : "0");

export default function MachineBench({ onReading, job = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modeSel, setMode] = useState<MachineMode>("work");
  // Work meter
  const [action, setAction] = useState<WorkAction>("lift");
  const [wm, setWm] = useState(5);
  const [wd, setWd] = useState(1);
  // Pulleys
  const [setupId, setSetup] = useState<PulleyId>("fixed");
  const [loadSel, setLoad] = useState<keyof typeof LOADS>("bucket");
  const [pFricSel, setPFric] = useState(false);
  // Ramp
  const [L, setL] = useState(2);
  const [rmSel, setRm] = useState(50);
  const [rFricSel, setRFric] = useState(false);
  // Power
  const [pm, setPm] = useState(20);
  const [tA, setTA] = useState(12);
  const [tB, setTB] = useState(4);
  const [motor, setMotor] = useState(job?.kind === "motor" ? job.motors[0] : 150);

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<MachineReading | null>(null);
  const animRef = useRef<Anim | null>(null);
  const runId = useRef(0);
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });
  useEffect(() => {
    if (result) onReadingRef.current?.(result);
  }, [result]);

  const mode: MachineMode = job ? (job.kind === "motor" ? "power" : job.kind) : modeSel;
  const motorJob = job?.kind === "motor" ? job : null;

  // ----- derived physics for the current settings -----
  const workRun = workMeterRun(action, wm, wd);

  const setup = pulleySetup(setupId);
  const loadId: LoadId = job?.kind === "pulley" ? "crate" : loadSel;
  const pm_ = job?.kind === "pulley" ? job.m : LOADS[loadSel].m;
  const pFric = job?.kind === "pulley" ? true : pFricSel;
  const pLoad = weight(pm_);
  const effort = pulleyEffort(pLoad, setup.n, setup.k, pFric);
  const rope = ropePulled(PULLEY_LIFT, setup.n);
  const effortLimit = job?.kind === "pulley" ? kgf(job.maxEffortKg) : null;

  const rm = job?.kind === "ramp" ? job.m : rmSel;
  const rh = job?.kind === "ramp" ? job.h : TRUCK_BED_H;
  const rFric = job?.kind === "ramp" ? true : rFricSel;
  const rF = rampForce(rm, rh, L, rFric ? RAMP_MU : 0);
  const theta = rampAngle(rh, L);
  const mgh = weight(rm) * rh;
  const rampLimit = job?.kind === "ramp" ? job.maxF : null;

  const powM = motorJob ? motorJob.m : pm;
  const powH = motorJob ? motorJob.h : POWER_H;
  const powW = weight(powM) * powH;
  const motorT = liftTime(powM, powH, motor);

  const settings =
    mode === "work"
      ? { mode, action, wm, wd }
      : mode === "pulley"
        ? { mode, setupId, loadId, pFric }
        : mode === "ramp"
          ? { mode, L, rm, rFric }
          : motorJob
            ? { mode, motor }
            : { mode, pm, tA, tB };
  const key = JSON.stringify(settings);

  const params = useRef({ key, mode, action, workRun, setupId, loadId, effort, pLoad, pFric, L, rh, rm, rF, theta, tA, tB, motorJob, motor, motorT, powM });
  useEffect(() => {
    params.current = { key, mode, action, workRun, setupId, loadId, effort, pLoad, pFric, L, rh, rm, rF, theta, tA, tB, motorJob, motor, motorT, powM };
  });

  const go = () => {
    let reading: Pending;
    let dur = 1.6;
    if (mode === "work") reading = { mode: "work", m: wm, run: workRun };
    else if (mode === "pulley") {
      dur = 2.4;
      reading = {
        mode: "pulley",
        setup: setupId,
        n: setup.n,
        k: setup.k,
        friction: pFric,
        m: pm_,
        load: pLoad,
        effort,
        lift: PULLEY_LIFT,
        rope,
        realMA: mechanicalAdvantage(pLoad, effort),
        workIn: effort * rope,
        workOut: pLoad * PULLEY_LIFT,
      };
    } else if (mode === "ramp") {
      dur = 2.4;
      reading = { mode: "ramp", m: rm, h: rh, L, theta, friction: rFric, F: rF, FL: rF * L, mgh };
    } else if (motorJob) {
      dur = Math.min(motorT, 4);
      reading = { mode: "motor", m: powM, h: powH, P: motor, t: motorT };
    } else {
      dur = Math.min(Math.max(tA, tB), 4);
      reading = { mode: "power", m: pm, h: POWER_H, tA, tB, W: powW, PA: power(powW, tA), PB: power(powW, tB) };
    }
    animRef.current = { key, start: performance.now(), dur: dur * 1000, reported: false, reading };
    setBusy(true);
  };

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

      let p = 0;
      const a = animRef.current;
      if (a && a.key === P.key) {
        p = Math.min(1, (now - a.start) / a.dur);
        if (p >= 1 && !a.reported) {
          a.reported = true;
          runId.current++;
          setResult({ ...a.reading, runId: runId.current } as MachineReading);
          setBusy(false);
        }
      } else if (a && !a.reported) {
        // A setting changed mid-run: that run is cancelled.
        a.reported = true;
        setBusy(false);
      }

      ctx.font = FONT;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (P.mode === "work") drawWork(ctx, w, h, P.workRun, p);
      else if (P.mode === "pulley") drawPulley(ctx, w, h, P.setupId, P.loadId, P.effort, P.pLoad, p);
      else if (P.mode === "ramp") drawRamp(ctx, w, h, P.L, P.rh, P.rm, P.rF, P.theta, p);
      else if (P.motorJob) drawPower(ctx, w, h, [{ name: `${P.motor} W motor`, t: P.motorT, motor: true }], P.powM, P.motorJob.h, p, Math.min(P.motorT, 4) / P.motorT);
      else {
        const tmax = Math.max(P.tA, P.tB);
        drawPower(
          ctx,
          w,
          h,
          [
            { name: "A: Ravi", t: P.tA, motor: false },
            { name: "B: Motor", t: P.tB, motor: true },
          ],
          P.powM,
          POWER_H,
          p,
          Math.min(tmax, 4) / tmax,
        );
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const ariaLabel =
    mode === "work"
      ? `Work meter: ${WORK_ACTIONS[action].label.toLowerCase()} a ${wm} kg load through ${wd} m. Work done by you is ${signed(workRun.W)} joules.`
      : mode === "pulley"
        ? `A ${setup.label} pulley system with ${setup.n} strands holding a ${pm_} kg load. The effort is ${effort.toFixed(0)} newtons.`
        : mode === "ramp"
          ? `A cart of ${rm} kg pulled up a ${L} m ramp onto a truck bed ${rh} m high. The spring balance reads ${rF.toFixed(0)} newtons.`
          : `Two lifters raise the same load to a roof ${powH} m up in different times.`;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!job && (
        <div className="grid grid-cols-4 gap-1 rounded-2xl bg-black/20 p-1 text-xs sm:text-sm">
          {(["work", "pulley", "ramp", "power"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl px-1 py-2 ${mode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m === "work" ? "Work meter" : m === "pulley" ? "Pulleys" : m === "ramp" ? "Ramp" : "Power"}
            </button>
          ))}
        </div>
      )}

      <canvas ref={canvasRef} className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80" role="img" aria-label={ariaLabel} />

      {mode === "work" && (
        <>
          <div className="grid grid-cols-4 gap-2 text-center">
            <Stat label="Force" value={`${fmt(workRun.F)} N`} />
            <Stat label="Distance" value={`${wd.toFixed(1)} m`} />
            <Stat label="Angle θ" value={`${workRun.theta}°`} />
            <Stat label="Work" value={`${signed(workRun.W)} J`} tone={workRun.W > 0.05 ? "pos" : workRun.W < -0.05 ? "neg" : undefined} />
          </div>
          <p className="text-center text-xs text-white/50 tabular-nums">
            W = F × d × cos θ = {fmt(workRun.F)} × {wd.toFixed(1)} × cos {workRun.theta}° = {signed(workRun.W)} J
            <br />
            {action === "push"
              ? `Friction does ${signed(workRun.Wf)} J on the box. Gravity does 0 J.`
              : `Gravity does ${signed(workRun.Wg)} J on the bag.`}
          </p>
          <Choice
            grid
            options={(Object.keys(WORK_ACTIONS) as WorkAction[]).map((id) => ({ id, label: WORK_ACTIONS[id].label }))}
            value={action}
            onChange={setAction}
          />
          <p className="-mt-1 text-center text-xs text-white/50">{WORK_ACTIONS[action].text}</p>
          <Slider label={action === "push" ? "Mass of the box" : "Mass of the bag"} value={`${wm} kg`} min={1} max={20} step={1} v={wm} onChange={setWm} />
          <Slider label="Distance moved" value={`${wd.toFixed(1)} m`} min={0.5} max={2} step={0.1} v={wd} onChange={setWd} />
          <GoButton busy={busy} onClick={go} label="▶ Go" />
        </>
      )}

      {mode === "pulley" && (
        <>
          <div className="grid grid-cols-4 gap-2 text-center">
            <Stat label="Load" value={`${pLoad.toFixed(0)} N`} />
            <Stat label="Effort" value={`${effort.toFixed(0)} N`} tone={effortLimit ? (effort <= effortLimit ? "pos" : "neg") : undefined} />
            <Stat label="Ideal MA" value={`${setup.n}`} />
            <Stat label="Real MA" value={mechanicalAdvantage(pLoad, effort).toFixed(2)} />
          </div>
          <p className="text-center text-xs text-white/50 tabular-nums">
            Lift {PULLEY_LIFT} m: rope pulled = {setup.n} × {PULLEY_LIFT} = {rope} m
            <br />
            Effort × rope = {(effort * rope).toFixed(0)} J · Load × height = {(pLoad * PULLEY_LIFT).toFixed(0)} J
            {effortLimit && (
              <>
                <br />
                <span className={effort <= effortLimit ? "text-lime-300" : "text-amber-200"}>
                  Worker&apos;s limit: {effortLimit.toFixed(0)} N. {effort <= effortLimit ? "This effort is fine." : "Too heavy to pull!"}
                </span>
              </>
            )}
          </p>
          <Choice options={PULLEYS.map((p) => ({ id: p.id, label: p.label }))} value={setupId} onChange={setSetup} />
          {!job && (
            <>
              <Choice
                options={(Object.keys(LOADS) as (keyof typeof LOADS)[]).map((id) => ({ id, label: `${LOADS[id].label} ${LOADS[id].m} kg` }))}
                value={loadSel}
                onChange={setLoad}
              />
              <Choice
                options={[
                  { id: "ideal", label: "Ideal (no friction)" },
                  { id: "real", label: "Small friction" },
                ]}
                value={pFricSel ? "real" : "ideal"}
                onChange={(v) => setPFric(v === "real")}
              />
            </>
          )}
          <GoButton busy={busy} onClick={go} label={`▶ Lift ${PULLEY_LIFT} m`} />
        </>
      )}

      {mode === "ramp" && (
        <>
          <div className="grid grid-cols-4 gap-2 text-center">
            <Stat label="Balance" value={`${rF.toFixed(0)} N`} tone={rampLimit ? (rF <= rampLimit ? "pos" : "neg") : undefined} />
            <Stat label="Slope" value={`${theta.toFixed(0)}°`} />
            <Stat label="F × L" value={`${(rF * L).toFixed(0)} J`} />
            <Stat label="m g h" value={`${mgh.toFixed(0)} J`} />
          </div>
          <p className="text-center text-xs text-white/50 tabular-nums">
            Lifting straight up needs m g = {weight(rm).toFixed(0)} N. On this ramp: {rF.toFixed(0)} N.
            {rampLimit !== null && (
              <>
                <br />
                <span className={rF <= rampLimit ? "text-lime-300" : "text-amber-200"}>
                  Your limit: {rampLimit} N. {rF <= rampLimit ? "You can manage this pull." : "Too steep to pull!"}
                </span>
              </>
            )}
          </p>
          <Slider label="Ramp length L" value={`${L.toFixed(2)} m`} min={1.25} max={6} step={0.25} v={L} onChange={setL} />
          {!job && (
            <>
              <Slider label="Mass of the cart" value={`${rmSel} kg`} min={20} max={150} step={5} v={rmSel} onChange={setRm} />
              <Choice
                options={[
                  { id: "off", label: "No friction" },
                  { id: "on", label: "Wheel friction" },
                ]}
                value={rFricSel ? "on" : "off"}
                onChange={(v) => setRFric(v === "on")}
              />
            </>
          )}
          <GoButton busy={busy} onClick={go} label="▶ Pull it up" />
        </>
      )}

      {mode === "power" && motorJob && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Work" value={`${powW.toFixed(0)} J`} />
            <Stat label="Power" value={`${motor} W`} />
            <Stat label="Time" value={`${motorT.toFixed(1)} s`} tone={motorT <= motorJob.maxT ? "pos" : "neg"} />
          </div>
          <p className="text-center text-xs text-white/50 tabular-nums">
            t = W ÷ P = {powW.toFixed(0)} ÷ {motor} = {motorT.toFixed(1)} s (deadline {motorJob.maxT} s)
          </p>
          <Choice options={motorJob.motors.map((P) => ({ id: String(P), label: `${P} W` }))} value={String(motor)} onChange={(v) => setMotor(Number(v))} />
          <GoButton busy={busy} onClick={go} label="▶ Lift the bricks" />
        </>
      )}

      {mode === "power" && !motorJob && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Work each" value={`${powW.toFixed(0)} J`} />
            <Stat label="Power A" value={`${power(powW, tA).toFixed(0)} W`} />
            <Stat label="Power B" value={`${power(powW, tB).toFixed(0)} W`} />
          </div>
          <p className="text-center text-xs text-white/50 tabular-nums">
            W = m g h = {pm} × 9.8 × {POWER_H} = {powW.toFixed(0)} J for both. P = W ÷ t.
          </p>
          <Slider label="Load" value={`${pm} kg`} min={5} max={50} step={5} v={pm} onChange={setPm} />
          <Slider label="Time for A (Ravi)" value={`${tA} s`} min={2} max={30} step={1} v={tA} onChange={setTA} />
          <Slider label="Time for B (motor)" value={`${tB} s`} min={2} max={30} step={1} v={tB} onChange={setTB} />
          <GoButton busy={busy} onClick={go} label="▶ Race" />
        </>
      )}
    </div>
  );
}

/* ---------- Controls ---------- */

function GoButton({ busy, onClick, label }: { busy: boolean; onClick: () => void; label: string }) {
  return (
    <button className="btn-primary !py-2 text-sm disabled:opacity-50" onClick={onClick} disabled={busy}>
      {busy ? "Moving…" : label}
    </button>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="truncate text-[10px] uppercase tracking-wider text-white/50 sm:text-[11px]">{label}</div>
      <div className={`font-display text-sm tabular-nums sm:text-lg ${tone === "pos" ? "text-lime-300" : tone === "neg" ? "text-rose-300" : ""}`}>{value}</div>
    </div>
  );
}

function Slider({ label, value, min, max, step, v, onChange }: { label: string; value: string; min: number; max: number; step: number; v: number; onChange: (n: number) => void }) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex justify-between text-sm">
        <span className="text-white/60">{label}</span>
        <span className="tabular-nums text-white">{value}</span>
      </div>
      <input type="range" className="range mt-2 w-full" min={min} max={max} step={step} value={v} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Choice<T extends string>({ options, value, onChange, grid = false }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; grid?: boolean }) {
  return (
    <div className={grid ? "grid grid-cols-2 gap-2 sm:grid-cols-4" : "flex flex-wrap gap-2"}>
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

/* ---------- Drawing ---------- */

type Ctx = CanvasRenderingContext2D;

function arrow(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, color: string, width = 3) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 2) return;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const head = Math.min(10, len * 0.5);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - ux * head * 0.8, y2 - uy * head * 0.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ux * head - uy * head * 0.55, y2 - uy * head + ux * head * 0.55);
  ctx.lineTo(x2 - ux * head + uy * head * 0.55, y2 - uy * head - ux * head * 0.55);
  ctx.closePath();
  ctx.fill();
}

function text(ctx: Ctx, s: string, x: number, y: number, color = C.text, align: CanvasTextAlign = "center", font = FONT) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(s, x, y);
}

function ground(ctx: Ctx, w: number, y: number) {
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(w, y);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let x = -10; x < w; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 1);
    ctx.lineTo(x, y + 9);
    ctx.stroke();
  }
}

/** A simple stick figure standing with feet at (x, y), height hgt px. Returns the shoulder point. */
function person(ctx: Ctx, x: number, y: number, hgt: number, color = "rgba(255,255,255,0.7)") {
  const head = hgt * 0.11;
  const hip = y - hgt * 0.47;
  const shoulder = y - hgt * 0.8;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y - hgt + head, head, 0, Math.PI * 2);
  ctx.moveTo(x, y - hgt + head * 2);
  ctx.lineTo(x, hip);
  ctx.moveTo(x, hip);
  ctx.lineTo(x - hgt * 0.12, y);
  ctx.moveTo(x, hip);
  ctx.lineTo(x + hgt * 0.12, y);
  ctx.stroke();
  return { x, y: shoulder };
}

function line(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, color: string, width = 2, dash: number[] = []) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

/** The work meter gauge: a bar centred on zero, filled green for positive and red for negative work. */
function gauge(ctx: Ctx, w: number, W: number, full: number) {
  const x0 = w * 0.08;
  const x1 = w * 0.92;
  const mid = (x0 + x1) / 2;
  const y = 40;
  roundRect(ctx, x0, y - 7, x1 - x0, 14, 7, "rgba(255,255,255,0.08)");
  const frac = Math.max(-1, Math.min(1, W / full));
  if (Math.abs(frac) > 0.002) {
    const xe = mid + frac * (x1 - mid);
    roundRect(ctx, Math.min(mid, xe), y - 7, Math.abs(xe - mid), 14, 4, W > 0 ? C.pos : C.neg);
  }
  line(ctx, mid, y - 11, mid, y + 11, "rgba(255,255,255,0.8)", 2);
  text(ctx, "−", x0 + 8, y + 18, C.neg);
  text(ctx, "+", x1 - 8, y + 18, C.pos);
  text(ctx, "0", mid, y + 18, C.dim);
  const label = Math.abs(W) < 0.05 ? "Work by you: 0 J" : `Work by you: ${W > 0 ? "+" : "−"}${Math.abs(W).toFixed(1)} J`;
  text(ctx, label, mid, 16, Math.abs(W) < 0.05 ? "#fff" : W > 0 ? C.pos : C.neg, "center", "bold 13px system-ui, sans-serif");
}

function bag(ctx: Ctx, cx: number, by: number, s: number) {
  // A school bag: body with a strap, bottom at by.
  const bw = 0.34 * s;
  const bh = 0.4 * s;
  roundRect(ctx, cx - bw / 2, by - bh, bw, bh, 5, "#7c3aed", "#c4b5fd");
  ctx.strokeStyle = "#c4b5fd";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, by - bh, bw * 0.28, Math.PI, 0);
  ctx.stroke();
  return { top: by - bh - bw * 0.28, mid: by - bh / 2 };
}

function drawWork(ctx: Ctx, w: number, h: number, run: WorkRun, p: number) {
  gauge(ctx, w, run.W * p, 400);
  const yG = h * 0.9;
  ground(ctx, w, yG);
  const s = Math.min((yG - 100) / 2.3, w / 4.2);
  const e = p < 1 ? p * p * (3 - 2 * p) : 1;
  const bx0 = w * 0.5;
  const H = 1.6 * s;

  if (run.action === "lift" || run.action === "lower") {
    // Shelf at height d to the right of the bag.
    const shelfY = yG - run.d * s;
    roundRect(ctx, bx0 + 0.22 * s, shelfY, 0.9 * s, 6, 2, "#57534e");
    line(ctx, bx0 + 1.05 * s, shelfY + 6, bx0 + 1.05 * s, yG, "#57534e", 4);
    const from = run.action === "lift" ? 0 : run.d;
    const to = run.action === "lift" ? run.d : 0;
    const hgt = from + (to - from) * e;
    const bx = bx0;
    const by = yG - hgt * s;
    const pp = person(ctx, bx0 - 0.55 * s, yG, H);
    const b = bag(ctx, bx, by, s);
    line(ctx, pp.x, pp.y, bx, b.top, "rgba(255,255,255,0.7)", 2.5);
    // Your force (up) and gravity (down).
    arrow(ctx, bx + 0.32 * s, b.mid, bx + 0.32 * s, b.mid - 38, C.force);
    text(ctx, "F", bx + 0.32 * s + 12, b.mid - 32, C.force);
    arrow(ctx, bx - 0.32 * s, b.mid - 10, bx - 0.32 * s, b.mid + 16, C.load, 2);
    text(ctx, "mg", bx - 0.32 * s - 16, b.mid + 10, C.load);
    // Displacement arrow, drawn at the side.
    const dx = w * 0.88;
    const yFrom = yG - from * s;
    const yTo = yG - to * s;
    line(ctx, dx - 6, yFrom, dx + 6, yFrom, C.dim, 1.5);
    arrow(ctx, dx, yFrom, dx, yFrom + (yTo - yFrom) * Math.max(e, 0.001), C.move);
    text(ctx, "d", dx + 12, (yFrom + yTo) / 2, C.move);
    text(ctx, `θ = ${run.theta}°`, w * 0.14, yG - 1.0 * s, "#fff", "center", "bold 13px system-ui, sans-serif");
    text(ctx, run.action === "lift" ? "F up, d up" : "F up, d down", w * 0.14, yG - 1.0 * s + 18, C.dim);
  } else if (run.action === "carry") {
    const x0 = w * 0.18;
    const x = x0 + run.d * s * e;
    const pp = person(ctx, x, yG, H);
    const by = yG - 0.95 * s;
    const b = bag(ctx, x + 0.35 * s, by, s);
    line(ctx, pp.x, pp.y, x + 0.35 * s, b.top, "rgba(255,255,255,0.7)", 2.5);
    arrow(ctx, x + 0.35 * s, b.top - 4, x + 0.35 * s, b.top - 46, C.force);
    text(ctx, "F", x + 0.35 * s + 12, b.top - 40, C.force);
    arrow(ctx, x0, yG - 2.0 * s + 6, x0 + Math.max(run.d * s * e, 1), yG - 2.0 * s + 6, C.move);
    text(ctx, "d", x0 + (run.d * s) / 2, yG - 2.0 * s - 6, C.move);
    text(ctx, `θ = 90°`, w * 0.82, yG - 1.0 * s, "#fff", "center", "bold 13px system-ui, sans-serif");
    text(ctx, "F up, d sideways", w * 0.82, yG - 1.0 * s + 18, C.dim);
  } else {
    // Push a box along the floor.
    const box = 0.5 * s;
    const x0 = w * 0.3;
    const x = x0 + run.d * s * e;
    roundRect(ctx, x, yG - box, box, box, 3, "#92400e", "#fbbf24");
    line(ctx, x + 3, yG - box + 3, x + box - 3, yG - 3, "#fbbf24", 1);
    line(ctx, x + box - 3, yG - box + 3, x + 3, yG - 3, "#fbbf24", 1);
    const pp = person(ctx, x - 0.42 * s, yG, H);
    line(ctx, pp.x, pp.y, x, yG - box * 0.6, "rgba(255,255,255,0.7)", 2.5);
    arrow(ctx, x + box / 2, yG - box / 2, x + box / 2 + 46, yG - box / 2, C.force);
    text(ctx, "F", x + box / 2 + 46, yG - box / 2 - 12, C.force);
    arrow(ctx, x + box / 2, yG - 3, x + box / 2 - 34, yG - 3, C.fric, 2);
    text(ctx, "friction", x + box / 2 - 30, yG + 12, C.fric);
    arrow(ctx, x0, yG - H - 16, x0 + Math.max(run.d * s * e, 1), yG - H - 16, C.move);
    text(ctx, "d", x0 + (run.d * s) / 2, yG - H - 28, C.move);
    text(ctx, `θ = 0°`, w * 0.82, yG - 1.6 * s, "#fff", "center", "bold 13px system-ui, sans-serif");
    text(ctx, "F and d same way", w * 0.82, yG - 1.6 * s + 18, C.dim);
  }
}

/* ----- Pulleys ----- */

function drawLoad(ctx: Ctx, id: LoadId, cx: number, top: number, kg: number) {
  if (id === "bucket") {
    const bw = 34;
    const bh = 30;
    ctx.beginPath();
    ctx.moveTo(cx - bw / 2, top + 6);
    ctx.lineTo(cx + bw / 2, top + 6);
    ctx.lineTo(cx + bw / 2 - 5, top + 6 + bh);
    ctx.lineTo(cx - bw / 2 + 5, top + 6 + bh);
    ctx.closePath();
    ctx.fillStyle = "#475569";
    ctx.fill();
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    roundRect(ctx, cx - bw / 2 + 2, top + 7, bw - 4, 5, 2, "#38bdf8");
    ctx.beginPath();
    ctx.arc(cx, top + 6, bw / 2, Math.PI, 0);
    ctx.strokeStyle = "#94a3b8";
    ctx.stroke();
    return top + 6 + bh;
  }
  const big = id === "crate" || id === "bricks";
  const bw = big ? 52 : 40;
  const bh = big ? 36 : 26;
  const y = top + 2;
  if (id === "cement") roundRect(ctx, cx - bw / 2, y, bw, bh, 8, "#78716c", "#d6d3d1");
  else if (id === "bricks") {
    roundRect(ctx, cx - bw / 2, y, bw, bh, 2, "#9a3412", "#fdba74");
    for (let r = 1; r < 4; r++) line(ctx, cx - bw / 2, y + (r * bh) / 4, cx + bw / 2, y + (r * bh) / 4, "#fdba74", 1);
  } else {
    roundRect(ctx, cx - bw / 2, y, bw, bh, 3, "#92400e", "#fbbf24");
    line(ctx, cx - bw / 2 + 3, y + 3, cx + bw / 2 - 3, y + bh - 3, "#fbbf24", 1.5);
    line(ctx, cx + bw / 2 - 3, y + 3, cx - bw / 2 + 3, y + bh - 3, "#fbbf24", 1.5);
  }
  text(ctx, `${kg} kg`, cx, y + bh / 2, "#fff", "center", "bold 11px system-ui, sans-serif");
  return y + bh;
}

function sheave(ctx: Ctx, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "#1e293b";
  ctx.fill();
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = "#94a3b8";
  ctx.fill();
}

function springBalance(ctx: Ctx, x: number, y: number, reading: string, up: boolean) {
  // A small spring balance in the rope, its hook pointing towards the load side.
  const top = up ? y : y - 30;
  roundRect(ctx, x - 6, top, 12, 30, 3, "#0f172a", C.force);
  ctx.strokeStyle = C.force;
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) line(ctx, x - 3, top + 6 + i * 5, x + 3, top + 8 + i * 5, C.force, 1);
  text(ctx, reading, x + 10, top + 15, C.force, "left", "bold 12px system-ui, sans-serif");
}

function drawPulley(ctx: Ctx, w: number, h: number, id: PulleyId, loadId: LoadId, effort: number, load: number, p: number) {
  const sp = pulleySetup(id);
  const n = sp.n;
  const R = 12;
  const beamY = 14;
  const yTop = 42;
  const liftPx = h * 0.12;
  const e = p < 1 ? p * p * (3 - 2 * p) : 1;
  const yB0 = h * 0.6;
  const yBot = yB0 - liftPx * e;
  const strands = sp.effortUp ? n : n + 1;
  const span = (strands - 1) * 2 * R;
  const xs = Math.max(w * 0.3, 70) - span / 2;
  const sx = (i: number) => xs + i * 2 * R;
  const yG = h * 0.93;

  // Scene: a well for the bucket, otherwise a building site floor.
  const loadCx0 = n === 1 && !sp.effortUp ? sx(0) : (sx(0) + sx(n - 1)) / 2;
  if (loadId === "bucket") {
    const wy = yB0 + 34;
    roundRect(ctx, loadCx0 - 44, wy, 12, yG - wy, 2, "#57534e", "#a8a29e");
    roundRect(ctx, loadCx0 + 32, wy, 12, yG - wy, 2, "#57534e", "#a8a29e");
    roundRect(ctx, loadCx0 - 32, yG - 10, 64, 10, 0, "rgba(56,189,248,0.35)");
    line(ctx, 0, wy, loadCx0 - 44, wy, "rgba(255,255,255,0.25)", 2);
    line(ctx, loadCx0 + 44, wy, w, wy, "rgba(255,255,255,0.25)", 2);
    text(ctx, "well", loadCx0, yG - 20, C.dim);
  } else ground(ctx, w, yG);

  // Beam (only over the fixed side when the effort pulls up).
  const beamX1 = sp.effortUp ? sx(0) + R : w * 0.96;
  roundRect(ctx, w * 0.04, beamY - 6, beamX1 - w * 0.04, 10, 2, "#334155", "#64748b");

  // Turns between neighbouring strands: top (fixed) or bottom (movable).
  type Turn = { x: number; top: boolean };
  const turns: Turn[] = [];
  for (let i = n - 2; i >= 0; i--) turns.push({ x: sx(i) + R, top: (n - 2 - i) % 2 === 1 });
  if (!sp.effortUp) turns.push({ x: sx(n - 1) + R, top: true });
  const turnAt = (i: number, j: number) => turns.find((t) => Math.abs(t.x - (sx(i) + sx(j)) / 2) < 0.1);
  const firstTurn = turnAt(0, 1);
  const anchorTop = firstTurn ? !firstTurn.top : false;
  const bottomTurns = turns.filter((t) => !t.top);

  // Movable block (if any) and the load beneath it.
  const hasBlock = bottomTurns.length > 0;
  const loadCx = hasBlock ? (sx(0) + sx(n - 1)) / 2 : sx(0);
  let hookY = yBot;
  if (hasBlock) {
    const bx0 = Math.min(sx(0), ...bottomTurns.map((t) => t.x - R)) - 4;
    const bx1 = Math.max(sx(n - 1), ...bottomTurns.map((t) => t.x + R)) + 4;
    roundRect(ctx, bx0, yBot - 4, bx1 - bx0, R + 10, 4, "rgba(167,139,250,0.18)", C.load);
    hookY = yBot + R + 6;
  }
  line(ctx, loadCx, hookY, loadCx, hookY + 10, "#94a3b8", 2);
  const loadBottom = drawLoad(ctx, loadId, loadCx, hookY + 8, Math.round(load / 9.8));
  arrow(ctx, loadCx - 34, loadBottom - 14, loadCx - 34, loadBottom + 14, C.load, 2);
  text(ctx, `${load.toFixed(0)} N`, loadCx - 40, loadBottom + 4, C.load, "right");

  // Strands.
  for (let i = 0; i < n; i++) {
    const x = sx(i);
    let y1: number;
    if (i === 0 && anchorTop) y1 = beamY + 4;
    else y1 = yTop;
    if (i === n - 1 && sp.effortUp) continue;
    line(ctx, x, y1, x, yBot, C.rope, 2);
    if (i === 0 && !anchorTop) {
      ctx.beginPath();
      ctx.arc(x, yBot, 3, 0, Math.PI * 2);
      ctx.fillStyle = C.rope;
      ctx.fill();
    }
  }
  if (anchorTop) {
    ctx.beginPath();
    ctx.arc(sx(0), beamY + 4, 3, 0, Math.PI * 2);
    ctx.fillStyle = C.rope;
    ctx.fill();
  }
  // Sheaves and the rope wrapped round them.
  for (const t of turns) {
    const y = t.top ? yTop : yBot;
    if (t.top) line(ctx, t.x, beamY + 4, t.x, y, "#64748b", 3);
    sheave(ctx, t.x, y, R);
    ctx.strokeStyle = C.rope;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (t.top) ctx.arc(t.x, y, R, Math.PI, 0);
    else ctx.arc(t.x, y, R, 0, Math.PI);
    ctx.stroke();
  }

  // Effort strand, hand and spring balance.
  const ropePx = n * liftPx * e;
  const ex = sx(strands - 1);
  if (sp.effortUp) {
    const hy0 = yB0 - 36;
    const hy = hy0 - ropePx;
    line(ctx, ex, yBot, ex, hy, C.rope, 2);
    springBalance(ctx, ex, hy - 30, `${effort.toFixed(0)} N`, true);
    arrow(ctx, ex, hy - 30, ex, hy - 50, C.force);
  } else {
    const hy0 = yTop + 30;
    const hy = hy0 + ropePx;
    line(ctx, ex, yTop, ex, hy, C.rope, 2);
    springBalance(ctx, ex, hy + 30, `${effort.toFixed(0)} N`, false);
    arrow(ctx, ex, hy + 30, ex, hy + 48, C.force);
  }

  // Counters.
  const raised = PULLEY_LIFT * e;
  text(ctx, `Load raised: ${raised.toFixed(1)} m`, w * 0.97, yTop + 24, C.load, "right");
  text(ctx, `Rope pulled: ${(n * raised).toFixed(1)} m`, w * 0.97, yTop + 42, C.force, "right");
  text(ctx, n > 1 ? `${n} strands hold the load` : "1 strand holds the load", w * 0.97, yTop + 60, C.dim, "right");
}

/* ----- Ramp ----- */

function drawRamp(ctx: Ctx, w: number, h: number, L: number, rh: number, m: number, F: number, theta: number, p: number) {
  const yG = h * 0.86;
  ground(ctx, w, yG);
  const truckW = 78;
  const s = Math.min((w - 34 - truckW) / 6.05, (yG - 80) / 1.4);
  const bedX = w - 12 - truckW;
  const bedY = yG - rh * s;
  // Tempo: bed, cab and wheels.
  roundRect(ctx, bedX, bedY, truckW - 22, 10, 2, "#334155", "#94a3b8");
  roundRect(ctx, bedX + truckW - 22, bedY - 26, 20, 36 + 0, 4, "#0e7490", "#67e8f9");
  roundRect(ctx, bedX + truckW - 18, bedY - 20, 12, 10, 2, "#a5f3fc");
  line(ctx, bedX + 2, bedY, bedX + 2, bedY - 16, "#94a3b8", 2);
  for (const wx of [bedX + 14, bedX + truckW - 14]) {
    ctx.beginPath();
    ctx.arc(wx, yG - 9, 9, 0, Math.PI * 2);
    ctx.fillStyle = "#111827";
    ctx.fill();
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  roundRect(ctx, bedX + 6, bedY + 10, truckW - 12, yG - 18 - bedY - 10 > 0 ? yG - 18 - bedY - 10 : 2, 0, "rgba(51,65,85,0.6)");

  // Ramp plank from the ground to the bed edge.
  const run = Math.sqrt(Math.max(0, L * L - rh * rh)) * s;
  const x0 = bedX - run;
  ctx.strokeStyle = "#d6a35c";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x0, yG);
  ctx.lineTo(bedX, bedY);
  ctx.stroke();
  // Height marker and angle arc.
  line(ctx, bedX + 4, bedY, bedX + 4, yG, C.dim, 1, [4, 4]);
  text(ctx, `L = ${L.toFixed(2)} m, h = ${rh} m, θ = ${theta.toFixed(0)}°`, Math.min((x0 + bedX) / 2, w - 110), yG + 16, C.dim);
  const th = (theta * Math.PI) / 180;
  ctx.strokeStyle = C.dim;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x0, yG, 26, -th, 0);
  ctx.stroke();

  // Cart along the ramp. u = distance from the bottom (px).
  const e = p < 1 ? p * p * (3 - 2 * p) : 1;
  const cartL = Math.max(0.55 * s, 18);
  const u = e * (L * s - cartL) + cartL / 2;
  const ux = Math.cos(th);
  const uy = -Math.sin(th);
  const cx = x0 + ux * u;
  const cy = yG + uy * u;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-th);
  roundRect(ctx, -cartL / 2, -cartL * 0.62 - 6, cartL, cartL * 0.62, 3, "#5b21b6", C.load);
  for (const wx of [-cartL * 0.3, cartL * 0.3]) {
    ctx.beginPath();
    ctx.arc(wx, -4, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#e2e8f0";
    ctx.fill();
  }
  ctx.restore();
  text(ctx, `${m} kg`, cx - Math.sin(th) * (cartL * 0.6 + 16), cy - Math.cos(th) * (cartL * 0.6 + 16), C.load);

  // Rope and spring balance pulling along the ramp.
  const fx = cx + ux * (cartL / 2);
  const fy = cy + uy * (cartL / 2) - 8 * Math.cos(th);
  const len = 52;
  arrow(ctx, fx, fy, fx + ux * len, fy + uy * len, C.force);
  const lx = fx + ux * len + 6;
  if (lx > w - 84) text(ctx, `F = ${F.toFixed(0)} N`, w - 6, fy + uy * len - 22, C.force, "right", "bold 13px system-ui, sans-serif");
  else text(ctx, `F = ${F.toFixed(0)} N`, lx, fy + uy * len - 14, C.force, "left", "bold 13px system-ui, sans-serif");

  // Top line: the work check.
  text(ctx, `F × L = ${F.toFixed(0)} × ${L.toFixed(2)} = ${(F * L).toFixed(0)} J`, w / 2, 16, C.force, "center", "bold 12px system-ui, sans-serif");
  text(ctx, `m g h = ${m} × 9.8 × ${rh} = ${(m * 9.8 * rh).toFixed(0)} J`, w / 2, 34, C.load);
}

/* ----- Power ----- */

function drawPower(ctx: Ctx, w: number, h: number, lanes: { name: string; t: number; motor: boolean }[], m: number, H: number, p: number, k: number) {
  const roofY = 40;
  const yG = h * 0.8;
  ground(ctx, w, yG);
  const bx0 = w * 0.36;
  const bx1 = w * 0.64;
  roundRect(ctx, bx0, roofY, bx1 - bx0, yG - roofY, 2, "rgba(148,163,184,0.12)", "rgba(148,163,184,0.4)");
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 2; c++) roundRect(ctx, bx0 + 10 + c * ((bx1 - bx0) / 2), roofY + 14 + r * ((yG - roofY) / 3.2), (bx1 - bx0) / 2 - 20, 14, 2, "rgba(103,232,249,0.15)");
  line(ctx, bx0 + 4, roofY - 4, bx0 + 4, yG, C.dim, 1, [3, 4]);
  text(ctx, `${H} m`, (bx0 + bx1) / 2, roofY - 10, C.dim);
  const tmax = Math.max(...lanes.map((l) => l.t));
  const elapsedReal = p * tmax; // real seconds shown on the clocks
  const sides = lanes.length === 1 ? [1] : [-1, 1];
  lanes.forEach((lane, i) => {
    const side = sides[i];
    const px = side < 0 ? bx0 - 14 : bx1 + 14;
    const loadX = side < 0 ? bx0 - 34 : bx1 + 34;
    // Arm and pulley at the roof edge.
    line(ctx, side < 0 ? bx0 : bx1, roofY + 2, loadX + side * 2, roofY + 2, "#64748b", 3);
    sheave(ctx, (px + loadX) / 2, roofY + 10, 9);
    const frac = Math.min(1, (p * tmax) / lane.t);
    const loadTop = yG - 30 - (yG - 30 - roofY - 26) * frac;
    line(ctx, loadX, roofY + 10, loadX, loadTop, C.rope, 2);
    line(ctx, px, roofY + 10, px, yG - 30, C.rope, 2);
    roundRect(ctx, loadX - 14, loadTop, 28, 22, 3, "#9a3412", "#fdba74");
    text(ctx, `${m}`, loadX, loadTop + 11, "#fff", "center", "bold 10px system-ui, sans-serif");
    if (lane.motor) {
      roundRect(ctx, px - 13, yG - 30, 26, 30, 4, "#0e7490", "#67e8f9");
      text(ctx, "M", px, yG - 15, "#fff", "center", "bold 12px system-ui, sans-serif");
    } else {
      const sh = person(ctx, px + side * 4, yG, 54);
      line(ctx, sh.x, sh.y, px, sh.y - 8, "rgba(255,255,255,0.7)", 2.5);
    }
    const tx = side < 0 ? w * 0.17 : w * 0.83;
    const clock = Math.min(elapsedReal, lane.t);
    text(ctx, lane.name, tx, yG + 14, "#fff", "center", "bold 12px system-ui, sans-serif");
    text(ctx, `t = ${(frac >= 1 ? lane.t : clock).toFixed(1)} s`, tx, yG + 30, C.move);
    const W = weight(m) * H;
    text(ctx, frac >= 1 ? `P = ${(W / lane.t).toFixed(0)} W` : "P = ?", tx, yG + 46, frac >= 1 ? C.pos : C.dim, "center", "bold 12px system-ui, sans-serif");
  });
  if (k < 1 && p > 0 && p < 1) text(ctx, `${(1 / k).toFixed(1)}× speed`, 8, 14, C.dim, "left");
}
