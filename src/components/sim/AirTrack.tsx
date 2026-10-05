"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CART_W,
  SLIDERS,
  TRACK,
  createWorld,
  frictionMax,
  netForce,
  step,
  type CollisionKind,
  type Hit,
  type Mode,
  type Settings,
  type World,
} from "@/lib/sim/collision";

export interface AirTrackResult {
  runId: number;
  settings: Settings;
  /** Acceleration of cart A (m/s²) while the push acts, starting from rest. */
  pushAcc: number;
  moved: boolean;
  /** Seconds A glided freely on air before any collision, and how much its speed changed meanwhile. */
  glide: number;
  glideDrift: number;
  hit: Hit | null;
  /** Speed of B as it reached the far end (null if it never got there). */
  exitB: number | null;
  /** Momentum of A and B when the push ended. */
  afterPush: [number, number] | null;
}

interface Props {
  /** Called once each time a run finishes. */
  onReading?: (r: AirTrackResult) => void;
  /** Challenge: locks cart B and the collision type, air on. */
  target?: { mB: number; kind: CollisionKind; v: number } | null;
}

const COL_A = "#22d3ee";
const COL_B = "#a78bfa";
const COL_F = "#fb923c";

export default function AirTrack({ onReading, target = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>("collide");
  const [kindSel, setKind] = useState<CollisionKind>("elastic");
  const [airSel, setAir] = useState(true);
  const [mA, setMA] = useState(1);
  const [mBSel, setMB] = useState(1);
  const [F, setF] = useState(2);
  const [pushTime, setPushTime] = useState(0.3);
  const [slow, setSlow] = useState(false);
  const [running, setRunning] = useState(false);
  const [live, setLive] = useState({ t: 0, vA: 0, vB: 0, netA: 0, accA: 0 });
  const [bars, setBars] = useState<{ before: [number, number]; after: [number, number]; title: string } | null>(null);
  const runId = useRef(0);
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: Mode = target ? "collide" : mode;
  const kind = target?.kind ?? kindSel;
  const air = target ? true : airSel;
  const mB = target?.mB ?? mBSel;
  const settings: Settings = { mode: activeMode, kind, air, mA, mB, F, pushTime };
  const key = JSON.stringify(settings);

  const worldRef = useRef<World>(createWorld(settings));
  const runningRef = useRef(false);
  const slowRef = useRef(slow);
  const targetRef = useRef(target);
  useEffect(() => {
    slowRef.current = slow;
    targetRef.current = target;
  });

  // A new setting puts the carts back at the start.
  useEffect(() => {
    if (runningRef.current) return;
    worldRef.current = createWorld(JSON.parse(key) as Settings);
    setLive({ t: 0, vA: 0, vB: 0, netA: 0, accA: 0 });
    setBars(null);
  }, [key]);

  const reset = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    worldRef.current = createWorld(worldRef.current.s);
    setLive({ t: 0, vA: 0, vB: 0, netA: 0, accA: 0 });
    setBars(null);
  }, []);

  const go = useCallback(() => {
    worldRef.current = createWorld(JSON.parse(key) as Settings);
    setBars(null);
    runId.current += 1;
    runningRef.current = true;
    setRunning(true);
  }, [key]);

  useEffect(() => {
    const c = canvasRef.current!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let last = performance.now();
    let lastReport = 0;
    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const w = worldRef.current;
      if (runningRef.current) {
        step(w, dt * (slowRef.current ? 0.4 : 1));
        if (w.ended) {
          runningRef.current = false;
          setRunning(false);
          const s = w.s;
          const result: AirTrackResult = {
            runId: runId.current,
            settings: s,
            pushAcc: netForce(s.mode === "recoil" ? -s.F : s.F, s.mA, 0, s.air) / s.mA,
            moved: w.moved,
            glide: w.glide,
            glideDrift: w.glideDrift,
            hit: w.hits[0] ?? null,
            exitB: w.exitB,
            afterPush: w.afterPush,
          };
          onReadingRef.current?.(result);
        }
        if (now - lastReport > 80 || w.ended) {
          lastReport = now;
          setLive({ t: w.t, vA: w.vA, vB: w.vB, netA: w.t < w.s.pushTime ? w.netA : 0, accA: w.t < w.s.pushTime ? w.accA : 0 });
          if (w.s.mode === "recoil") {
            if (w.afterPush) setBars((b) => b ?? { before: [0, 0], after: w.afterPush!, title: "spring release" });
          } else if (w.hits[0]) {
            const h = w.hits[0];
            setBars((b) => b ?? { before: h.before, after: h.after, title: h.kind === "elastic" ? "elastic collision" : "sticky collision" });
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
      draw(ctx, cw, ch, w, targetRef.current?.v ?? null);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const pushing = running && live.t < pushTime;
  const fMax = frictionMax(mA, air);

  return (
    <div className="flex flex-col gap-3 select-none">
      {!target && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-ink/20 p-1 text-sm">
          {(["collide", "recoil"] as const).map((m) => (
            <button
              key={m}
              disabled={running}
              onClick={() => setMode(m)}
              className={`rounded-xl py-2 ${activeMode === m ? "bg-cream/10 text-cream" : "text-faint"}`}
            >
              {m === "collide" ? "Collision lab" : "Recoil (spring)"}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-56 w-full rounded-2xl border border-line bg-well sm:h-64"
        role="img"
        aria-label={
          activeMode === "collide"
            ? `Air track with cart A (${mA} kg) moving at ${live.vA.toFixed(2)} metres per second and cart B (${mB} kg) at ${live.vB.toFixed(2)} metres per second. Air supply ${air ? "on" : "off"}.`
            : `Two carts pushed apart by a spring: cart A (${mA} kg) at ${live.vA.toFixed(2)} metres per second and cart B (${mB} kg) at ${live.vB.toFixed(2)} metres per second.`
        }
      />

      <div className="grid grid-cols-4 gap-2 text-center">
        <Readout label="Net F on A" value={live.netA.toFixed(1)} unit="N" />
        <Readout label="Accel. A" value={live.accA.toFixed(1)} unit="m/s²" />
        <Readout label="Velocity A" value={live.vA.toFixed(2)} unit="m/s" />
        <Readout label="Velocity B" value={live.vB.toFixed(2)} unit="m/s" />
      </div>

      <MomentumBars bars={bars} mode={activeMode} />

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <button
          onClick={go}
          disabled={running}
          className={`rounded-2xl border py-3 font-semibold transition ${
            running ? "border-line text-faint" : "border-sage-300/40 bg-sage-400/15 hover:bg-sage-400/25"
          }`}
        >
          {pushing ? "Pushing…" : running ? "Running…" : activeMode === "recoil" ? "Release the spring" : "Push cart A ▶"}
        </button>
        <button onClick={reset} className="rounded-2xl border border-line px-4 text-sm text-muted hover:bg-cream/10">
          Reset
        </button>
      </div>

      {activeMode === "collide" && !target && (
        <Choice
          disabled={running}
          options={[
            { id: "elastic", label: "Elastic (bounce)" },
            { id: "sticky", label: "Sticky (velcro)" },
          ]}
          value={kind}
          onChange={setKind}
        />
      )}
      <div className="flex flex-wrap gap-2">
        {!target && (
          <Toggle on={air} disabled={running} onClick={() => setAir(!airSel)}>
            {air ? "Air supply on: no friction" : "Air supply off: friction"}
          </Toggle>
        )}
        <Toggle on={slow} onClick={() => setSlow(!slow)}>
          {slow ? "Slow motion on" : "Slow motion off"}
        </Toggle>
      </div>

      <Slider label="Mass of cart A" value={mA} unit="kg" r={SLIDERS.mass} disabled={running} onChange={setMA} digits={2} />
      <Slider label="Mass of cart B" value={mB} unit="kg" r={SLIDERS.mass} disabled={running || !!target} onChange={setMB} digits={2} />
      <Slider
        label={activeMode === "recoil" ? "Spring force on each cart" : "Push force on A"}
        value={F}
        unit="N"
        r={SLIDERS.force}
        disabled={running}
        onChange={setF}
        digits={1}
      />
      <Slider label="Push lasts for" value={pushTime} unit="s" r={SLIDERS.time} disabled={running} onChange={setPushTime} digits={2} />
      <p className="text-center text-xs text-faint">
        Impulse F × t = {(F * pushTime).toFixed(2)} N s.
        {!air && ` Friction on A can be up to ${fMax.toFixed(1)} N (μ = 0.2).`}
        {activeMode === "recoil" && " The spring pushes A left and B right with the same force."}
      </p>
    </div>
  );
}

function Readout({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-2xl panel px-1 py-2">
      <div className="text-[10px] uppercase tracking-wider text-faint sm:text-[11px]">{label}</div>
      <div className="font-display text-base tabular-nums sm:text-lg">
        {value}
        <span className="ml-0.5 text-[10px] text-faint sm:text-xs">{unit}</span>
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
    <label className={`block rounded-2xl panel px-4 py-3 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums text-cream">
          {value.toFixed(digits)} {unit}
        </span>
      </div>
      <input
        type="range"
        className="range mt-2 w-full"
        min={r.min}
        max={r.max}
        step={r.step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Toggle({ on, disabled, onClick, children }: { on: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`flex-1 rounded-xl border px-3 py-2 text-sm whitespace-nowrap ${on ? "chip-on" : "border-line text-muted"}`}
    >
      {children}
    </button>
  );
}

function Choice<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          disabled={disabled}
          onClick={() => onChange(o.id)}
          className={`flex-1 rounded-xl border px-3 py-2 text-sm whitespace-nowrap ${value === o.id ? "chip-on" : "border-line text-muted"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function MomentumBars({ bars, mode }: { bars: { before: [number, number]; after: [number, number]; title: string } | null; mode: Mode }) {
  if (!bars)
    return (
      <div className="rounded-2xl panel px-3 py-3 text-center text-xs text-faint">
        Momentum bars (p = m × v) appear here {mode === "recoil" ? "when the spring lets go" : "when the carts collide"}.
      </div>
    );
  const sets = [
    { name: "Before", p: bars.before },
    { name: "After", p: bars.after },
  ];
  const max = Math.max(0.05, ...sets.flatMap((s) => [Math.abs(s.p[0]), Math.abs(s.p[1]), Math.abs(s.p[0] + s.p[1])]));
  return (
    <div className="rounded-2xl panel p-3">
      <div className="mb-2 text-xs text-faint">Momentum in kg m/s, {bars.title}. Right is positive.</div>
      <div className="grid grid-cols-2 gap-3">
        {sets.map((s) => (
          <div key={s.name}>
            <div className="mb-1 text-xs font-semibold text-muted">{s.name}</div>
            <Bar label="A" value={s.p[0]} max={max} colour={COL_A} />
            <Bar label="B" value={s.p[1]} max={max} colour={COL_B} />
            <Bar label="Total" value={s.p[0] + s.p[1]} max={max} colour="#fde047" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Bar({ label, value, max, colour }: { label: string; value: number; max: number; colour: string }) {
  const frac = Math.min(1, Math.abs(value) / max) * 50;
  const v = Math.abs(value) < 0.005 ? 0 : value;
  return (
    <div className="mb-1 grid grid-cols-[2.4rem_1fr] items-center gap-1 text-[11px]">
      <span className="text-faint">{label}</span>
      <div>
        <div className="relative h-2.5 rounded bg-cream/5">
          <div className="absolute top-0 left-1/2 h-full w-px bg-cream/30" />
          <div
            className="absolute top-0 h-full rounded"
            style={{ background: colour, width: `${frac}%`, left: v >= 0 ? "50%" : `${50 - frac}%` }}
          />
        </div>
        <div className="tabular-nums text-muted">{v.toFixed(2)}</div>
      </div>
    </div>
  );
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y: number, x2: number, colour: string, width = 3) {
  const dir = Math.sign(x2 - x1) || 1;
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2 - dir * 6, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y);
  ctx.lineTo(x2 - dir * 8, y - 5);
  ctx.lineTo(x2 - dir * 8, y + 5);
  ctx.closePath();
  ctx.fill();
}

/** Text that never leaves the canvas. */
function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, w: number) {
  const tw = ctx.measureText(text).width;
  ctx.textAlign = "left";
  ctx.fillText(text, Math.max(4, Math.min(w - tw - 4, x - tw / 2)), y);
}

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, world: World, targetV: number | null) {
  const s = world.s;
  const pad = 12;
  const k = (w - 2 * pad) / TRACK; // px per metre
  const X = (m: number) => pad + m * k;
  const railY = h * 0.7;
  const pushing = world.t < s.pushTime && world.t > 0;
  ctx.clearRect(0, 0, w, h);
  ctx.font = "11px system-ui, sans-serif";

  // Rail with air holes, and end buffers.
  ctx.fillStyle = "#1e2440";
  ctx.fillRect(X(0), railY, TRACK * k, 10);
  ctx.fillStyle = s.air ? "rgba(125,211,252,0.6)" : "rgba(240,233,221,0.15)";
  for (let m = 0.05; m < TRACK; m += 0.1) ctx.fillRect(X(m) - 1, railY + 2, 2, 2);
  ctx.fillStyle = "#475569";
  ctx.fillRect(X(0) - 4, railY - 22, 4, 32);
  ctx.fillRect(X(TRACK), railY - 22, 4, 32);
  // Metre marks.
  ctx.fillStyle = "rgba(240,233,221,0.4)";
  for (let m = 0; m <= TRACK; m += 0.5) {
    ctx.fillRect(X(m), railY + 10, 1, m % 1 === 0 ? 6 : 3);
    if (m % 1 === 0) label(ctx, `${m} m`, X(m), railY + 27, w);
  }

  // Top line: time and air state.
  ctx.fillStyle = "rgba(240,233,221,0.6)";
  ctx.textAlign = "left";
  ctx.fillText(`t = ${world.t.toFixed(2)} s`, 6, 15);
  ctx.textAlign = "right";
  ctx.fillStyle = targetV !== null ? "#fde047" : s.air ? "rgba(125,211,252,0.8)" : "rgba(251,146,60,0.9)";
  ctx.fillText(targetV !== null ? `Target for B: ${targetV.toFixed(1)} m/s` : s.air ? "Air on: frictionless" : "Air off: friction", w - 6, 15);
  ctx.textAlign = "left";

  // Spring between the carts in recoil mode, squashed before release.
  const cw = CART_W * k;
  const ha = 14 + 6 * s.mA;
  const hb = 14 + 6 * s.mB;
  if (s.mode === "recoil") {
    const x1 = X(world.xA) + cw / 2;
    const x2 = X(world.xB) - cw / 2;
    const gapPx = Math.max(x2 - x1, 2);
    if (gapPx < 60) {
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const y = railY - 10;
      const n = 6;
      ctx.moveTo(x1, y);
      for (let i = 1; i <= n; i++) ctx.lineTo(x1 + (gapPx * i) / n, y + (i % 2 ? -4 : 4));
      ctx.stroke();
    }
  }

  // Carts.
  for (const [x, hgt, col, name] of [
    [world.xA, ha, COL_A, "A"],
    [world.xB, hb, COL_B, "B"],
  ] as const) {
    const left = X(x) - cw / 2;
    if (s.air) {
      ctx.fillStyle = "rgba(125,211,252,0.25)";
      ctx.fillRect(left + 2, railY - 3, cw - 4, 3);
    }
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(left, railY - 3 - hgt, cw, hgt);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#13110f";
    ctx.font = "600 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(name, left + cw / 2, railY - 3 - hgt / 2 + 4);
    ctx.font = "11px system-ui, sans-serif";
  }
  // Mass labels above the carts, pushed apart when the carts are close together.
  ctx.font = "11px system-ui, sans-serif";
  const ta = `${s.mA.toFixed(2)} kg`;
  const tb = `${s.mB.toFixed(2)} kg`;
  const wa = ctx.measureText(ta).width;
  const wb = ctx.measureText(tb).width;
  let la = X(world.xA) - wa / 2;
  let lb = X(world.xB) - wb / 2;
  const overlap = la + wa + 6 - lb;
  if (overlap > 0) {
    la -= overlap / 2;
    lb += overlap / 2;
  }
  la = Math.max(4, Math.min(w - wa - wb - 10, la));
  lb = Math.max(la + wa + 6, Math.min(w - wb - 4, lb));
  ctx.textAlign = "left";
  ctx.fillStyle = COL_A;
  ctx.fillText(ta, la, railY - 8 - ha);
  ctx.fillStyle = COL_B;
  ctx.fillText(tb, lb, railY - 8 - hb);
  if (world.stuck) {
    ctx.fillStyle = "#fde047";
    const jx = X(world.xA) + cw / 2;
    ctx.fillRect(jx - 1, railY - 3 - Math.min(ha, hb), 2, Math.min(ha, hb));
  }

  // Push arrows: the hand pushes A, or the spring pushes both apart. The size goes in the top line.
  if (pushing) {
    const fy = railY - 3 - ha / 2;
    const len = 14 + s.F * 6;
    const ax = X(world.xA) - cw / 2;
    if (s.mode === "collide") arrow(ctx, ax - len, fy, ax - 1, COL_F);
    else {
      const bx = X(world.xB) + cw / 2;
      arrow(ctx, ax + 2, fy, ax - len, COL_F);
      arrow(ctx, bx - 2, railY - 3 - hb / 2, bx + len, COL_F);
    }
    ctx.fillStyle = COL_F;
    ctx.font = "600 11px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(s.mode === "collide" ? `Push F = ${s.F} N` : `Spring: ${s.F} N each way`, 6, 31);
    ctx.font = "11px system-ui, sans-serif";
  }

  // Velocity arrows on two rows so the labels never overlap.
  const vScale = Math.min(28, k * 0.3); // px per m/s
  for (const [x, v, col, row, name] of [
    [world.xA, world.vA, COL_A, 0, "A"],
    [world.xB, world.vB, COL_B, 1, "B"],
  ] as const) {
    const y = 58 + row * 26;
    const cx = X(x);
    ctx.fillStyle = col;
    if (Math.abs(v) < 0.005) {
      label(ctx, `v${name} = 0`, cx, y + 4, w);
      continue;
    }
    const len = Math.max(10, Math.min(w * 0.3, Math.abs(v) * vScale));
    const end = Math.max(4, Math.min(w - 4, cx + Math.sign(v) * len));
    arrow(ctx, cx, y, end, col, 2.5);
    ctx.fillStyle = col;
    // Label just above the arrow, kept inside the canvas.
    label(ctx, `v${name} = ${v.toFixed(2)} m/s`, (cx + end) / 2, y - 7, w);
  }
}
