"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BLOCK_MASS,
  G,
  LOADS,
  PULL_TRACK,
  RUN_DIST,
  SLIDERS,
  SURFACES,
  SURFACE_IDS,
  createPull,
  frictionLimits,
  pulley,
  startPull,
  stepPull,
  stopPull,
  timeToCover,
  tow,
  type Connected,
  type PullState,
  type SurfaceId,
} from "@/lib/sim/friction";

export type Setup = "pulley" | "tow";

export type FrictionReading =
  | {
      mode: "pull";
      runId: number;
      surface: SurfaceId;
      mass: number;
      rolling: boolean;
      peak: number | null;
      steady: number | null;
    }
  | {
      mode: "string";
      runId: number;
      setup: Setup;
      surface: SurfaceId;
      /** Block on the table (pulley) or the front block A (tow). */
      mA: number;
      /** Back block B (tow only). */
      mB: number;
      /** Hanging mass (pulley only). */
      mh: number;
      /** Pull on the front block (tow only). */
      F: number;
      result: Connected;
    };

interface Props {
  onReading?: (r: FrictionReading) => void;
  /** Challenge: locks String mode, the pulley setup, the surface and the load. */
  target?: { surface: SurfaceId; load: number; a: number } | null;
}

const COL_PULL = "#22d3ee";
const COL_FRIC = "#fb923c";
const COL_T = "#fde047";
const COL_BLOCK = "#a78bfa";
const COL_B = "#f472b6";
const SURF_COL: Record<SurfaceId, string> = { glass: "rgba(125,211,252,0.35)", wood: "#7c4a23", sandpaper: "#a8875a" };
const BALANCE_MAX = 20; // N, full scale of the spring balance

interface StringRun {
  id: number;
  result: Connected;
  t: number;
  x: number;
  running: boolean;
  done: boolean;
}

export default function FrictionLab({ onReading, target = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modeSel, setMode] = useState<"pull" | "string">("pull");
  const [surfaceSel, setSurface] = useState<SurfaceId>("wood");
  const [loadSel, setLoad] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [setupSel, setSetup] = useState<Setup>("pulley");
  const [mh, setMh] = useState(0.3);
  const [towF, setTowF] = useState(10);
  const [loadB, setLoadB] = useState(0.5);

  const mode = target ? "string" : modeSel;
  const setup: Setup = target ? "pulley" : setupSel;
  const surface = target?.surface ?? surfaceSel;
  const load = target?.load ?? loadSel;
  const mass = BLOCK_MASS + load;
  const massB = BLOCK_MASS + loadB;

  const onReadingRef = useRef(onReading);
  const targetRef = useRef(target);
  useEffect(() => {
    onReadingRef.current = onReading;
    targetRef.current = target;
  });

  // ---- Pull mode ----
  const pullRef = useRef<PullState>(createPull({ surface, mass, rolling }));
  const historyRef = useRef<{ t: number; F: number }[]>([]);
  const runId = useRef(0);
  const reportedKey = useRef("");
  const [live, setLive] = useState({ F: 0, v: 0, peak: null as number | null, steady: null as number | null, pulling: false, moving: false, ended: false });

  const pullKey = `${surface}|${mass}|${rolling}`;
  useEffect(() => {
    const w = pullRef.current;
    if (w.pulling || w.v > 0) return;
    pullRef.current = createPull({ surface, mass, rolling });
    historyRef.current = [];
    setLive({ F: 0, v: 0, peak: null, steady: null, pulling: false, moving: false, ended: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pullKey covers surface, mass and rolling
  }, [pullKey]);

  const togglePull = useCallback(() => {
    const w = pullRef.current;
    if (w.ended) {
      pullRef.current = createPull(w.cfg);
      historyRef.current = [];
      setLive({ F: 0, v: 0, peak: null, steady: null, pulling: false, moving: false, ended: false });
      return;
    }
    if (w.pulling) {
      stopPull(w);
    } else {
      if (w.phase === "rest") {
        runId.current += 1;
        historyRef.current = [];
        w.t = 0;
      }
      startPull(w);
    }
    setLive((l) => ({ ...l, pulling: w.pulling }));
  }, []);

  const resetPull = useCallback(() => {
    pullRef.current = createPull(pullRef.current.cfg);
    historyRef.current = [];
    setLive({ F: 0, v: 0, peak: null, steady: null, pulling: false, moving: false, ended: false });
  }, []);

  // ---- String mode ----
  const runRef = useRef<StringRun | null>(null);
  const stringRunId = useRef(0);
  const [stringRes, setStringRes] = useState<{ result: Connected; t: number; done: boolean } | null>(null);
  const [running, setRunning] = useState(false);
  const stringKey = `${setup}|${surface}|${mass}|${massB}|${mh}|${towF}|${mode}`;
  useEffect(() => {
    if (runRef.current?.running) return;
    runRef.current = null;
    setStringRes(null);
  }, [stringKey]);

  const release = useCallback(() => {
    const s = SURFACES[surface];
    const result = setup === "pulley" ? pulley(mass, mh, s) : tow(towF, mass, massB, s);
    stringRunId.current += 1;
    const run: StringRun = { id: stringRunId.current, result, t: 0, x: 0, running: result.moves, done: !result.moves };
    runRef.current = run;
    setStringRes({ result, t: 0, done: run.done });
    if (result.moves) setRunning(true);
    else
      onReadingRef.current?.({ mode: "string", runId: run.id, setup, surface, mA: mass, mB: massB, mh, F: towF, result });
  }, [surface, setup, mass, mh, towF, massB]);

  const resetString = useCallback(() => {
    runRef.current = null;
    setRunning(false);
    setStringRes(null);
  }, []);

  const stringParams = useRef({ setup, surface, mass, massB, mh, towF, mode });
  useEffect(() => {
    stringParams.current = { setup, surface, mass, massB, mh, towF, mode };
  });

  // ---- Animation loop ----
  useEffect(() => {
    const c = canvasRef.current!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let last = performance.now();
    let lastReport = 0;
    let lastSample = -1;
    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const p = stringParams.current;
      if (p.mode === "pull") {
        const w = pullRef.current;
        const active = w.pulling || w.v > 0 || w.F > 0.001;
        if (active) {
          stepPull(w, dt);
          if (w.t - lastSample >= 0.04 || w.t < lastSample) {
            lastSample = w.t;
            historyRef.current.push({ t: w.t, F: w.F });
            if (historyRef.current.length > 400) historyRef.current.shift();
          }
          const key = `${runId.current}|${w.peak}|${w.steady}`;
          if ((w.peak !== null || w.steady !== null) && key !== reportedKey.current) {
            reportedKey.current = key;
            onReadingRef.current?.({
              mode: "pull",
              runId: runId.current,
              surface: w.cfg.surface,
              mass: w.cfg.mass,
              rolling: w.cfg.rolling,
              peak: w.peak,
              steady: w.steady,
            });
          }
          if (now - lastReport > 80 || w.ended || !w.pulling) {
            lastReport = now;
            setLive({ F: w.F, v: w.v, peak: w.peak, steady: w.steady, pulling: w.pulling, moving: w.v > 0, ended: w.ended });
          }
        }
      } else {
        const r = runRef.current;
        if (r?.running) {
          r.t += dt;
          r.x = 0.5 * r.result.a * r.t * r.t;
          if (r.x >= RUN_DIST) {
            r.x = RUN_DIST;
            r.t = timeToCover(RUN_DIST, r.result.a);
            r.running = false;
            r.done = true;
            setRunning(false);
            onReadingRef.current?.({ mode: "string", runId: r.id, setup: p.setup, surface: p.surface, mA: p.mass, mB: p.massB, mh: p.mh, F: p.towF, result: r.result });
          }
          if (now - lastReport > 80 || r.done) {
            lastReport = now;
            setStringRes({ result: r.result, t: r.t, done: r.done });
          }
        }
      }
      const cw = c.clientWidth;
      const ch = c.clientHeight;
      if (!cw) return;
      if (c.width !== Math.round(cw * dpr) || c.height !== Math.round(ch * dpr)) {
        c.width = Math.round(cw * dpr);
        c.height = Math.round(ch * dpr);
      }
      const ctx = c.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (p.mode === "pull") drawPull(ctx, cw, ch, pullRef.current, historyRef.current);
      else drawString(ctx, cw, ch, p, runRef.current, targetRef.current?.a ?? null);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const busyPull = live.pulling || live.moving;
  const lim = frictionLimits(SURFACES[surface], mass, rolling);
  const res = stringRes?.result;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!target && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["pull", "string"] as const).map((m) => (
            <button
              key={m}
              disabled={busyPull || running}
              onClick={() => setMode(m)}
              className={`rounded-xl py-2 ${mode === m ? "bg-white/10 text-white" : "text-white/50"}`}
            >
              {m === "pull" ? "Pull (spring balance)" : "String (connected)"}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-72"
        role="img"
        aria-label={
          mode === "pull"
            ? `A ${mass} kilogram wooden block ${rolling ? "on rollers" : "sliding"} on ${SURFACES[surface].label.toLowerCase()}, pulled by a spring balance reading ${live.F.toFixed(2)} newtons.`
            : setup === "pulley"
              ? `A ${mass} kilogram block on ${SURFACES[surface].label.toLowerCase()} joined over a pulley to a ${mh} kilogram hanging mass.`
              : `A ${mass} kilogram block pulled with ${towF} newtons, towing a ${massB} kilogram block on ${SURFACES[surface].label.toLowerCase()}.`
        }
      />

      {mode === "pull" ? (
        <>
          <div className="grid grid-cols-4 gap-2 text-center">
            <Readout label="Balance" value={live.F.toFixed(2)} unit="N" />
            <Readout label={rolling ? "Start" : "Peak"} value={live.peak === null ? "–" : live.peak.toFixed(2)} unit="N" />
            <Readout label="Steady" value={live.steady === null ? "–" : live.steady.toFixed(2)} unit="N" />
            <Readout label="Speed" value={live.v.toFixed(2)} unit="m/s" />
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button
              onClick={togglePull}
              className={`rounded-2xl border py-3 font-semibold transition ${
                live.pulling ? "border-amber-300/40 bg-amber-400/15 hover:bg-amber-400/25" : "border-lime-300/40 bg-lime-400/15 hover:bg-lime-400/25"
              }`}
            >
              {live.ended ? "Back to the start" : live.pulling ? "Let go ■" : "Start pulling ▶"}
            </button>
            <button onClick={resetPull} className="rounded-2xl border border-white/10 px-4 text-sm text-white/70 hover:bg-white/10">
              Reset
            </button>
          </div>
          <Choice
            label="Surface"
            disabled={busyPull}
            options={SURFACE_IDS.map((id) => ({ id, label: SURFACES[id].label }))}
            value={surface}
            onChange={setSurface}
          />
          <Choice
            label="Extra mass on the block"
            disabled={busyPull}
            options={LOADS.map((l) => ({ id: String(l), label: l === 0 ? "None" : `+${l} kg` }))}
            value={String(load)}
            onChange={(v) => setLoad(Number(v))}
          />
          <Choice
            label="Block"
            disabled={busyPull}
            options={[
              { id: "slide", label: "Sliding" },
              { id: "roll", label: "Rollers" },
            ]}
            value={rolling ? "roll" : "slide"}
            onChange={(v) => setRolling(v === "roll")}
          />
          <p className="text-center text-xs text-white/40">
            Block + mass = {mass.toFixed(1)} kg, so N = m × g = {lim.N.toFixed(2)} N. The pull rises slowly until the block slips, then you keep it at a steady 0.15 m/s.
          </p>
        </>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 text-center">
            <Readout label="Accel." value={res ? res.a.toFixed(2) : "–"} unit="m/s²" />
            <Readout label="Tension" value={res ? (res.T === null ? "?" : res.T.toFixed(2)) : "–"} unit="N" />
            <Readout label="Friction" value={res ? res.f.toFixed(2) : "–"} unit="N" />
            <Readout label="Time" value={stringRes ? (res!.moves ? stringRes.t.toFixed(2) : "–") : "–"} unit="s" />
          </div>
          {res && <Working res={res} setup={setup} mh={mh} towF={towF} massB={massB} />}
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button
              onClick={release}
              disabled={running}
              className={`rounded-2xl border py-3 font-semibold transition ${
                running ? "border-white/10 text-white/40" : "border-lime-300/40 bg-lime-400/15 hover:bg-lime-400/25"
              }`}
            >
              {running ? "Moving…" : setup === "pulley" ? "Release ▶" : "Pull ▶"}
            </button>
            <button onClick={resetString} className="rounded-2xl border border-white/10 px-4 text-sm text-white/70 hover:bg-white/10">
              Reset
            </button>
          </div>
          {!target && (
            <>
              <Choice
                label="Setup"
                disabled={running}
                options={[
                  { id: "pulley", label: "Pulley" },
                  { id: "tow", label: "Tow" },
                ]}
                value={setup}
                onChange={(v) => setSetup(v as Setup)}
              />
              <Choice
                label="Surface"
                disabled={running}
                options={SURFACE_IDS.map((id) => ({ id, label: SURFACES[id].label }))}
                value={surface}
                onChange={setSurface}
              />
              <Choice
                label={setup === "pulley" ? "Extra mass on the block" : "Extra mass on front block A"}
                disabled={running}
                options={LOADS.map((l) => ({ id: String(l), label: l === 0 ? "None" : `+${l} kg` }))}
                value={String(load)}
                onChange={(v) => setLoad(Number(v))}
              />
            </>
          )}
          {setup === "pulley" ? (
            <Slider label="Hanging mass" value={mh} unit="kg" r={SLIDERS.hanging} disabled={running} onChange={setMh} digits={2} />
          ) : (
            <>
              <Choice
                label="Extra mass on back block B"
                disabled={running}
                options={LOADS.map((l) => ({ id: String(l), label: l === 0 ? "None" : `+${l} kg` }))}
                value={String(loadB)}
                onChange={(v) => setLoadB(Number(v))}
              />
              <Slider label="Pull on block A" value={towF} unit="N" r={SLIDERS.towForce} disabled={running} onChange={setTowF} digits={1} />
            </>
          )}
          <p className="text-center text-xs text-white/40">
            {SURFACES[surface].label}: μs = {SURFACES[surface].muS}, μk = {SURFACES[surface].muK}.{" "}
            {setup === "pulley"
              ? `Block M = ${mass.toFixed(1)} kg. The hanging mass falls ${RUN_DIST} m.`
              : `A = ${mass.toFixed(1)} kg, B = ${massB.toFixed(1)} kg. They travel ${RUN_DIST} m.`}{" "}
            g = {G} m/s².
          </p>
        </>
      )}
    </div>
  );
}

/** The worked calculation for the last string run, so students can check a = net force ÷ total mass. */
function Working({ res, setup, mh, towF, massB }: { res: Connected; setup: Setup; mh: number; towF: number; massB: number }) {
  const drive = setup === "pulley" ? mh * G : towF;
  if (!res.moves)
    return (
      <div className="rounded-2xl border border-amber-300/30 bg-amber-300/[0.06] px-3 py-2 text-center text-xs text-amber-100">
        Stuck! The {setup === "pulley" ? "hanging weight" : "pull"} ({drive.toFixed(2)} N) is not more than the limit of static friction, so static friction holds
        everything still.
      </div>
    );
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70">
      <div>
        a = net force ÷ total mass = ({drive.toFixed(2)} − {res.f.toFixed(2)}) ÷ {res.total.toFixed(2)} = <span className="text-white">{res.a.toFixed(2)} m/s²</span>
      </div>
      <div className="mt-0.5">
        {setup === "pulley"
          ? `Tension T = mh × (g − a) = ${mh.toFixed(2)} × (${G} − ${res.a.toFixed(2)}) = ${res.T!.toFixed(2)} N, less than the hanging weight ${drive.toFixed(2)} N.`
          : `Tension on B: T = mB × a + friction on B = ${massB.toFixed(1)} × ${res.a.toFixed(2)} + ${(res.T! - massB * res.a).toFixed(2)} = ${res.T!.toFixed(2)} N.`}
      </div>
    </div>
  );
}

function Readout({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[10px] uppercase tracking-wider text-white/50 sm:text-[11px]">{label}</div>
      <div className="font-display text-base tabular-nums sm:text-lg">
        {value}
        <span className="ml-0.5 text-[10px] text-white/50 sm:text-xs">{unit}</span>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  unit,
  r,
  disabled,
  onChange,
  digits,
}: {
  label: string;
  value: number;
  unit: string;
  r: { min: number; max: number; step: number };
  disabled?: boolean;
  onChange: (v: number) => void;
  digits: number;
}) {
  return (
    <label className={`block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex justify-between text-sm">
        <span className="text-white/60">{label}</span>
        <span className="tabular-nums text-white">
          {value.toFixed(digits)} {unit}
        </span>
      </div>
      <input
        type="range"
        aria-label={label}
        className="range mt-2 w-full"
        min={r.min}
        max={r.max}
        step={r.step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number((Math.round(Number(e.target.value) / r.step) * r.step).toFixed(4)))}
      />
    </label>
  );
}

function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div role="group" aria-label={label} className={disabled ? "opacity-60" : ""}>
      <div className="mb-1 text-xs text-white/50">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            disabled={disabled}
            aria-pressed={value === o.id}
            onClick={() => onChange(o.id)}
            className={`min-w-0 flex-1 rounded-xl border px-2 py-2 text-sm whitespace-nowrap ${value === o.id ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- Drawing ----------

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, colour: string, width = 2.5) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 3) return;
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - Math.cos(ang) * 6, y2 - Math.sin(ang) * 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(ang - 0.45) * 9, y2 - Math.sin(ang - 0.45) * 9);
  ctx.lineTo(x2 - Math.cos(ang + 0.45) * 9, y2 - Math.sin(ang + 0.45) * 9);
  ctx.closePath();
  ctx.fill();
}

/** Text that never leaves the canvas. */
function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, w: number) {
  const tw = ctx.measureText(text).width;
  ctx.textAlign = "left";
  ctx.fillText(text, Math.max(4, Math.min(w - tw - 4, x - tw / 2)), y);
}

function drawSurface(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, surface: SurfaceId) {
  ctx.fillStyle = surface === "glass" ? "#1e2a44" : "#1e2440";
  ctx.fillRect(x0, y, x1 - x0, 14);
  ctx.fillStyle = SURF_COL[surface];
  ctx.fillRect(x0, y, x1 - x0, 6);
  if (surface === "wood") {
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1;
    for (let x = x0 + 8; x < x1; x += 37) {
      ctx.beginPath();
      ctx.moveTo(x, y + 2);
      ctx.lineTo(x + 18, y + 3);
      ctx.stroke();
    }
  } else if (surface === "sandpaper") {
    ctx.fillStyle = "rgba(40,25,10,0.7)";
    for (let x = x0 + 2; x < x1; x += 4) ctx.fillRect(x, y + ((x * 7) % 5), 1.5, 1.5);
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillRect(x0, y, x1 - x0, 1);
  }
}

/** A wooden block with slotted masses stacked on top. Returns the top edge. */
function drawBlock(ctx: CanvasRenderingContext2D, left: number, bottom: number, bw: number, load: number, colour: string, name?: string) {
  const bh = 20;
  ctx.fillStyle = colour;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(left, bottom - bh, bw, bh);
  ctx.globalAlpha = 1;
  let top = bottom - bh;
  const slots = Math.round(load / 0.5);
  for (let i = 0; i < slots; i++) {
    ctx.fillStyle = i % 2 ? "#94a3b8" : "#cbd5e1";
    ctx.fillRect(left + 4, top - 6, bw - 8, 6);
    top -= 6;
  }
  if (name) {
    ctx.fillStyle = "#0a0d1c";
    ctx.font = "600 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(name, left + bw / 2, bottom - 6);
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "left";
  }
  return top;
}

/** Horizontal spring balance from x (hook end) to the right; returns where the hand holds it. */
function drawBalance(ctx: CanvasRenderingContext2D, x: number, y: number, F: number, len: number) {
  const ext = Math.min(1, F / BALANCE_MAX);
  ctx.fillStyle = "#334155";
  ctx.fillRect(x + 6, y - 6, len, 12);
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const tx = x + 10 + ((len - 8) * i) / 4;
    ctx.beginPath();
    ctx.moveTo(tx, y - 6);
    ctx.lineTo(tx, y - 2);
    ctx.stroke();
  }
  // Pointer slides along the scale as the spring stretches.
  ctx.fillStyle = COL_PULL;
  ctx.fillRect(x + 10 + (len - 8) * ext - 1, y - 5, 3, 10);
  // Hook to the block.
  ctx.strokeStyle = "#cbd5e1";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 6, y);
  ctx.stroke();
  // Hand ring.
  const hx = x + len + 14;
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(hx, y, 6, 0, Math.PI * 2);
  ctx.stroke();
  return hx;
}

function drawPull(ctx: CanvasRenderingContext2D, w: number, h: number, s: PullState, hist: { t: number; F: number }[]) {
  const { fs } = frictionLimits(SURFACES[s.cfg.surface], s.cfg.mass, s.cfg.rolling);
  ctx.clearRect(0, 0, w, h);
  ctx.font = "11px system-ui, sans-serif";

  // Graph of the spring balance reading against time.
  const gx = 34;
  const gy = 18;
  const gw = w - gx - 10;
  const gh = h * 0.42;
  const fMax = Math.max(1, fs * 1.3, ...hist.map((p) => p.F * 1.1));
  const tMax = Math.max(4, hist.length ? hist[hist.length - 1].t : 0);
  const X = (t: number) => gx + (t / tMax) * gw;
  const Y = (F: number) => gy + gh - (F / fMax) * gh;
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(gx, gy);
  ctx.lineTo(gx, gy + gh);
  ctx.lineTo(gx + gw, gy + gh);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.textAlign = "right";
  ctx.fillText(`${fMax.toFixed(1)} N`, gx - 3, gy + 8);
  ctx.fillText("0", gx - 3, gy + gh);
  ctx.textAlign = "left";
  ctx.fillText("Spring balance reading", gx + 4, gy - 5);
  ctx.textAlign = "right";
  ctx.fillText(`time (${tMax.toFixed(0)} s)`, gx + gw, gy + gh + 12);
  ctx.textAlign = "left";
  if (s.steady !== null) {
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(251,146,60,0.7)";
    ctx.beginPath();
    ctx.moveTo(gx, Y(s.steady));
    ctx.lineTo(gx + gw, Y(s.steady));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = COL_FRIC;
    ctx.textAlign = "right";
    ctx.fillText(`steady ${s.steady.toFixed(2)} N`, gx + gw, Y(s.steady) + 13);
    ctx.textAlign = "left";
  }
  if (hist.length > 1) {
    ctx.strokeStyle = COL_PULL;
    ctx.lineWidth = 2;
    ctx.beginPath();
    hist.forEach((p, i) => (i ? ctx.lineTo(X(p.t), Y(p.F)) : ctx.moveTo(X(p.t), Y(p.F))));
    ctx.stroke();
  }
  if (s.peak !== null && s.peakT !== null) {
    const px = X(s.peakT);
    ctx.fillStyle = COL_T;
    ctx.beginPath();
    ctx.arc(px, Y(s.peak), 3.5, 0, Math.PI * 2);
    ctx.fill();
    label(ctx, `${s.cfg.rolling ? "starts moving" : "peak"} ${s.peak.toFixed(2)} N`, px + 40, Y(s.peak) - 6, w);
  }

  // Table, block, string, balance and hand.
  const tableY = h * 0.84;
  const pad = 10;
  const bw = 40;
  const balLen = Math.min(90, w * 0.2);
  const travel = w - 2 * pad - bw - balLen - 40;
  drawSurface(ctx, pad, w - pad, tableY, s.cfg.surface);
  const left = pad + (s.x / PULL_TRACK) * travel;
  let bottom = tableY;
  if (s.cfg.rolling) {
    const r = 4;
    const rot = s.x / (r / 120); // rough spin for the rollers
    for (let i = 0; i < 3; i++) {
      const cx = left + 6 + i * ((bw - 12) / 2);
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(cx, tableY - r, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#0a0d1c";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, tableY - r);
      ctx.lineTo(cx + Math.cos(rot) * r, tableY - r + Math.sin(rot) * r);
      ctx.stroke();
    }
    bottom = tableY - 2 * r;
  }
  const top = drawBlock(ctx, left, bottom, bw, s.cfg.mass - BLOCK_MASS, "#c08457");
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  label(ctx, `${s.cfg.mass.toFixed(1)} kg`, left + bw / 2, top - 4, w);
  const sy = bottom - 10;
  const hookX = left + bw + 12;
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(left + bw, sy);
  ctx.lineTo(hookX, sy);
  ctx.stroke();
  const handX = drawBalance(ctx, hookX, sy, s.F, balLen);

  // Force arrows: pull on the block, and friction at the bottom.
  const scale = Math.min(70, (w * 0.25) / Math.max(fs, 0.5));
  if (s.F > 0.01) arrow(ctx, left + bw / 2, sy - 24, left + bw / 2 + Math.max(6, s.F * scale), sy - 24, COL_PULL);
  if (s.f > 0.01) arrow(ctx, left + bw / 2, tableY + 9, left + bw / 2 - Math.max(6, s.f * scale), tableY + 9, COL_FRIC);
  ctx.font = "600 11px system-ui, sans-serif";
  ctx.fillStyle = COL_PULL;
  ctx.textAlign = "right";
  ctx.fillText(`${s.F.toFixed(2)} N`, w - 6, sy - 16);
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  const status = s.ended
    ? "End of the table"
    : s.phase === "rest"
      ? s.pulling
        ? "Static friction holds it"
        : "At rest"
      : s.pulling
        ? s.steady !== null
          ? "Steady speed: pull = friction"
          : s.cfg.rolling
            ? "Rolling: speeding up"
            : "Slipping!"
        : "Sliding to a stop";
  ctx.fillText(status, w - 6, h - 6);
  ctx.textAlign = "left";
  ctx.fillStyle = COL_FRIC;
  ctx.fillText(`friction ${s.f.toFixed(2)} N`, 6, h - 6);
  // Faint marker of where the hand is.
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(handX + 8, sy - 1, 10, 2);
}

function drawString(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  p: { setup: Setup; surface: SurfaceId; mass: number; massB: number; mh: number; towF: number },
  run: StringRun | null,
  targetA: number | null,
) {
  ctx.clearRect(0, 0, w, h);
  ctx.font = "11px system-ui, sans-serif";
  const x = run?.x ?? 0;
  const res = run?.result;
  const pad = 10;
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.textAlign = "left";
  ctx.fillText(res ? `a = ${res.a.toFixed(2)} m/s²` : "Set it up, then go", 6, 15);
  if (targetA !== null) {
    ctx.fillStyle = COL_T;
    ctx.textAlign = "right";
    ctx.fillText(`Target: ${targetA.toFixed(2)} m/s²`, w - 6, 15);
    ctx.textAlign = "left";
  }

  if (p.setup === "pulley") {
    const tableY = 64;
    const pr = 10;
    const pulleyX = w - 46;
    const k = Math.min((pulleyX - pad - 46) / (RUN_DIST + 0.15), (h - tableY - 50) / RUN_DIST);
    drawSurface(ctx, pad, pulleyX, tableY, p.surface);
    // Table leg and the pulley clamp.
    ctx.fillStyle = "#1e2440";
    ctx.fillRect(pulleyX - 6, tableY, 6, h - tableY);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pulleyX + 2, tableY - 2, pr, 0, Math.PI * 2);
    ctx.stroke();
    const bw = 40;
    const right0 = pulleyX - 8 - RUN_DIST * k - 6;
    const right = right0 + x * k;
    const top = drawBlock(ctx, right - bw, tableY, bw, p.mass - BLOCK_MASS, COL_BLOCK);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    label(ctx, `M = ${p.mass.toFixed(1)} kg`, right - bw / 2, top - 4, w);
    // String: block to the top of the pulley, then down to the hanging mass.
    const sy = tableY - 2 - pr;
    const hangTop = tableY + 16 + x * k;
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(right, sy);
    ctx.lineTo(pulleyX + 2, sy);
    ctx.arc(pulleyX + 2, tableY - 2, pr, -Math.PI / 2, 0);
    ctx.lineTo(pulleyX + 2 + pr, hangTop);
    ctx.stroke();
    const hs = 12 + 10 * Math.sqrt(p.mh);
    const hx = pulleyX + 2 + pr - hs / 2;
    ctx.fillStyle = COL_B;
    ctx.fillRect(hx, hangTop, hs, hs);
    ctx.fillStyle = COL_B;
    ctx.textAlign = "right";
    ctx.fillText(`mh = ${p.mh.toFixed(2)} kg`, hx - 4, hangTop + hs / 2 + 4);
    // Floor the mass lands on.
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(hx - 8, tableY + 16 + RUN_DIST * k + hs, hs + 16, 2);
    ctx.textAlign = "left";
    // Force arrows.
    const scale = Math.min(10, 60 / Math.max(1, p.mh * G));
    if (res) {
      if (res.T !== null) arrow(ctx, right + 2, sy - 10, right + 2 + Math.max(8, res.T * scale), sy - 10, COL_T);
      arrow(ctx, right - bw / 2, tableY + 10, right - bw / 2 - Math.max(8, res.f * scale), tableY + 10, COL_FRIC);
      ctx.fillStyle = COL_T;
      if (res.T !== null) ctx.fillText(`T = ${res.T.toFixed(2)} N`, 6, 31);
      ctx.fillStyle = COL_FRIC;
      label(ctx, `friction ${res.f.toFixed(2)} N`, right - bw / 2 - 20, tableY + 28, w);
      if (!res.moves) {
        ctx.fillStyle = "#fcd34d";
        label(ctx, "Stuck: static friction holds it", w / 2 - 40, tableY + 46, w);
      }
    }
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText(`weight of mh = ${(p.mh * G).toFixed(2)} N`, 6, h - 6);
    return;
  }

  // Tow: pull F on the front block A, which tows block B with a string.
  const tableY = h * 0.66;
  const bw = 38;
  const gap = 34;
  const balLen = Math.min(70, w * 0.17);
  const travelPx = w - 2 * pad - 2 * bw - gap - balLen - 30;
  const k = travelPx / RUN_DIST;
  drawSurface(ctx, pad, w - pad, tableY, p.surface);
  const leftB = pad + x * k;
  const leftA = leftB + bw + gap;
  const topB = drawBlock(ctx, leftB, tableY, bw, p.massB - BLOCK_MASS, COL_B, "B");
  const topA = drawBlock(ctx, leftA, tableY, bw, p.mass - BLOCK_MASS, COL_BLOCK, "A");
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  label(ctx, `${p.massB.toFixed(1)} kg`, leftB + bw / 2, topB - 4, w);
  label(ctx, `${p.mass.toFixed(1)} kg`, leftA + bw / 2, topA - 4, w);
  const sy = tableY - 10;
  // String between B and A with a tiny tension meter in it.
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(leftB + bw, sy);
  ctx.lineTo(leftA, sy);
  ctx.stroke();
  ctx.fillStyle = COL_T;
  ctx.fillRect(leftB + bw + gap / 2 - 5, sy - 3, 10, 6);
  ctx.strokeStyle = "#e2e8f0";
  ctx.beginPath();
  ctx.moveTo(leftA + bw, sy);
  ctx.lineTo(leftA + bw + 8, sy);
  ctx.stroke();
  drawBalance(ctx, leftA + bw + 8, sy, p.towF, balLen);
  if (res) {
    const scale = Math.min(4, 50 / Math.max(1, p.towF));
    if (res.T !== null) {
      arrow(ctx, leftB + bw / 2, sy - 30, leftB + bw / 2 + Math.max(8, res.T * scale), sy - 30, COL_T);
      ctx.fillStyle = COL_T;
      label(ctx, `T = ${res.T.toFixed(2)} N`, leftB + bw / 2 + 30, sy - 38, w);
    }
    ctx.fillStyle = COL_FRIC;
    label(ctx, `total friction ${res.f.toFixed(2)} N`, w / 2, tableY + 30, w);
    if (!res.moves) {
      ctx.fillStyle = "#fcd34d";
      label(ctx, "Stuck: static friction holds them", w / 2, tableY + 46, w);
    }
  }
  ctx.fillStyle = COL_PULL;
  ctx.textAlign = "right";
  ctx.fillText(`Pull F = ${p.towF.toFixed(1)} N`, w - 6, 32);
  ctx.textAlign = "left";
}
