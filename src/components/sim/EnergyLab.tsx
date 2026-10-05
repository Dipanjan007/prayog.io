"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BEAM,
  G,
  HEIGHT,
  KEY_X,
  LEVER_POS,
  MASS,
  MU,
  TRACK_END,
  advance,
  energies,
  keyHeights,
  leverMoments,
  startCart,
  trackHeight,
  trackSlope,
  type Cart,
  type LeverClass,
  type Track,
} from "@/lib/sim/energy";

export type EnergyMode = "coaster" | "lever";

export interface EnergyReading {
  mode: EnergyMode;
  track: Track;
  friction: boolean;
  /** The cart has been released (and not reset). */
  running: boolean;
  x: number;
  pe: number;
  ke: number;
  heat: number;
  turnedBack: boolean;
  finished: boolean;
  settled: boolean;
  crestSpeed: number | null;
  lever: { cls: LeverClass; load: number; effort: number; pos: number; balanced: boolean; ma: number };
}

interface Props {
  onReading?: (r: EnergyReading) => void;
  /** Challenge: the hills are fixed and friction is on; only the start height can change. */
  challenge?: { h1: number; h2: number; h0: number } | null;
}

const LOADS = [
  { w: 200, label: "Bag 200 N" },
  { w: 600, label: "Stone 600 N" },
  { w: 1000, label: "Rock 1000 N" },
];
const CLASSES: { id: LeverClass; label: string; example: string; posLabel: string }[] = [
  { id: 1, label: "Class 1", example: "see-saw, crowbar, scissors", posLabel: "Fulcrum position" },
  { id: 2, label: "Class 2", example: "wheelbarrow, nutcracker, bottle opener", posLabel: "Load position" },
  { id: 3, label: "Class 3", example: "tongs, tweezers, your forearm", posLabel: "Effort position" },
];
const HANDLES: { key: keyof Track; i: number; label: string }[] = [
  { key: "h0", i: 0, label: "Start" },
  { key: "h1", i: 2, label: "Hill 1" },
  { key: "h2", i: 4, label: "Last hill" },
];

const snapH = (h: number) => Math.round(Math.min(HEIGHT.max, Math.max(HEIGHT.min, h)) * 10) / 10;
const kJ = (j: number) => (j / 1000).toFixed(1);

export default function EnergyLab({ onReading, challenge = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<EnergyMode>("coaster");
  const [track, setTrack] = useState<Track>(challenge ? { h0: challenge.h0, h1: challenge.h1, h2: challenge.h2 } : { h0: 10, h1: 6, h2: 8 });
  const [frictionOn, setFriction] = useState(false);
  const friction = challenge ? true : frictionOn;
  const [running, setRunning] = useState(false);
  const [cart, setCart] = useState<Cart>(startCart);
  const cartRef = useRef<Cart>(startCart());
  const [size, setSize] = useState({ w: 0, h: 0 });

  const [cls, setCls] = useState<LeverClass>(1);
  const [load, setLoad] = useState(600);
  const [pos, setPos] = useState(2);
  const [effort, setEffort] = useState(300);
  const angleRef = useRef(0);

  const activeMode: EnergyMode = challenge ? "coaster" : mode;
  const lever = useMemo(() => leverMoments(cls, pos, load, effort), [cls, pos, load, effort]);

  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const reset = useCallback(() => {
    cartRef.current = startCart();
    setCart(cartRef.current);
    setRunning(false);
  }, []);

  const setHeight = useCallback(
    (key: keyof Track, h: number) => {
      setTrack((t) => ({ ...t, [key]: snapH(h) }));
      reset();
    },
    [reset],
  );

  // Report readings.
  const e = energies(track, cart);
  useEffect(() => {
    onReadingRef.current?.({
      mode: activeMode,
      track,
      friction,
      running,
      x: cart.x,
      pe: e.pe,
      ke: e.ke,
      heat: e.heat,
      turnedBack: cart.turnedBack,
      finished: cart.finished,
      settled: cart.settled,
      crestSpeed: cart.crestSpeed,
      lever: { cls, load, effort, pos, balanced: lever.balanced, ma: lever.ma },
    });
  }, [activeMode, track, friction, running, cart, e.pe, e.ke, e.heat, cls, load, effort, pos, lever.balanced, lever.ma]);

  useEffect(() => {
    const c = canvasRef.current!;
    const ro = new ResizeObserver(() => setSize({ w: c.clientWidth, h: c.clientHeight }));
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  // Draw (and animate) the scene.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !size.w) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(size.w * dpr);
    c.height = Math.round(size.h * dpr);
    const ctx = c.getContext("2d")!;
    let raf = 0;
    let last = performance.now();
    let lastReport = 0;
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size.w, size.h);
      let again = false;
      if (activeMode === "coaster") {
        if (running) {
          const before = cartRef.current;
          cartRef.current = advance(track, before, friction, dt);
          if (now - lastReport > 100 || cartRef.current.finished !== before.finished || cartRef.current.settled !== before.settled) {
            lastReport = now;
            setCart(cartRef.current);
          }
          again = !cartRef.current.finished && !cartRef.current.settled;
          if (!again) setCart(cartRef.current);
        }
        drawCoaster(ctx, size.w, size.h, track, cartRef.current, friction, !!challenge);
      } else {
        const target = lever.winner === "balanced" ? 0 : lever.winner === "load" ? 1 : -1;
        angleRef.current += (target - angleRef.current) * Math.min(1, dt * 6);
        if (Math.abs(target - angleRef.current) > 0.002) again = true;
        else angleRef.current = target;
        drawLever(ctx, size.w, size.h, lever, cls, load, effort, angleRef.current);
      }
      if (again) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [size, activeMode, running, track, friction, challenge, lever, cls, load, effort]);

  // Drag the hilltops and the start up and down on the canvas.
  const drag = useRef<keyof Track | null>(null);
  const toWorldH = (clientY: number) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    const v = coasterView(r.width, r.height);
    return (v.ground - (clientY - r.top)) / v.ky;
  };
  const onPointerDown = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeMode !== "coaster") return;
    const r = ev.currentTarget.getBoundingClientRect();
    const v = coasterView(r.width, r.height);
    const px = ev.clientX - r.left;
    const py = ev.clientY - r.top;
    const k = keyHeights(track);
    let best: keyof Track | null = null;
    let bestD = 34;
    for (const hd of HANDLES) {
      if (challenge && hd.key !== "h0") continue;
      const d = Math.hypot(px - v.X(KEY_X[hd.i]), py - v.Y(k[hd.i]));
      if (d < bestD) {
        bestD = d;
        best = hd.key;
      }
    }
    if (!best) return;
    drag.current = best;
    ev.currentTarget.setPointerCapture(ev.pointerId);
    ev.preventDefault();
  };
  const onPointerMove = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current) return;
    setHeight(drag.current, toWorldH(ev.clientY));
  };
  const endDrag = () => {
    drag.current = null;
  };

  const e0 = MASS * G * track.h0;
  const height = trackHeight(track, cart.x);
  const speed = Math.abs(cart.v);
  const liftWork = e0;
  const motor = 2000; // W

  return (
    <div className="flex flex-col gap-3 select-none">
      {!challenge && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["coaster", "lever"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${activeMode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m === "coaster" ? "Roller coaster" : "Lever"}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className={`h-56 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-72 ${activeMode === "coaster" ? "touch-none" : ""}`}
        role="img"
        aria-label={
          activeMode === "coaster"
            ? `Roller coaster track. Start ${track.h0.toFixed(1)} m high, hill 1 ${track.h1.toFixed(1)} m, last hill ${track.h2.toFixed(1)} m. The cart is ${height.toFixed(1)} m high moving at ${speed.toFixed(1)} m/s. Drag the round handles to change the heights.`
            : `${CLASSES[cls - 1].label} lever: a ${load} N load ${lever.loadArm.toFixed(1)} m from the fulcrum and a ${effort} N effort ${lever.effortArm.toFixed(1)} m from it. ${lever.balanced ? "It balances." : lever.winner === "load" ? "The load wins." : "The effort wins."}`
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />

      {activeMode === "coaster" ? (
        <>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <Bar label="Potential energy (mgh)" value={e.pe} max={e0} colour="bg-cyan-400" />
            <Bar label="Kinetic energy (½mv²)" value={e.ke} max={e0} colour="bg-lime-400" />
            <Bar label="Heat from friction" value={e.heat} max={e0} colour="bg-orange-400" />
            <Bar label="Total" value={e.total} max={e0} colour="bg-violet-400" />
            <div className="mt-2 flex justify-between text-xs text-white/50">
              <span>
                Height <b className="tabular-nums text-white">{height.toFixed(1)} m</b>
              </span>
              <span>
                Speed <b className="tabular-nums text-white">{speed.toFixed(1)} m/s</b>
              </span>
              <span>Cart {MASS} kg</span>
            </div>
            <div className="mt-1 text-xs text-white/50">
              <span className={friction ? "text-orange-300" : "text-violet-300"}>- - -</span> Dashed line: the highest the cart can ever reach
              {friction ? ". Friction makes it fall as the cart travels." : ", its start height."}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => (running ? reset() : setRunning(true))}
              className={`rounded-2xl border py-3 font-semibold ${running ? "border-white/10 text-white/70" : "border-lime-300/40 bg-lime-400/15"}`}
            >
              {running ? "Reset" : "Release the cart ▶"}
            </button>
            <button
              disabled={!!challenge}
              onClick={() => {
                setFriction(!frictionOn);
                reset();
              }}
              className={`rounded-2xl border px-2 py-3 text-sm ${friction ? "border-orange-300 bg-orange-300/15" : "border-white/10 text-white/70"} ${challenge ? "opacity-70" : ""}`}
            >
              Friction: {friction ? `on (μ = ${MU})` : "off"}
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            {HANDLES.filter((hd) => !challenge || hd.key === "h0").map((hd) => (
              <label key={hd.key} className="mb-1 block">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">{hd.label} height</span>
                  <span className="tabular-nums text-white">{track[hd.key].toFixed(1)} m</span>
                </div>
                <input
                  type="range"
                  className="range mt-1 w-full"
                  min={HEIGHT.min}
                  max={HEIGHT.max}
                  step={HEIGHT.step}
                  value={track[hd.key]}
                  onChange={(ev) => setHeight(hd.key, Number(ev.target.value))}
                />
              </label>
            ))}
            {challenge && <div className="mt-1 text-xs text-white/50">Test track: hill 1 is {challenge.h1} m, the last hill is {challenge.h2} m.</div>}
          </div>
          <p className="text-center text-xs text-white/40">
            Drag the round handles or use the sliders. Hauling the cart up to {track.h0.toFixed(1)} m takes W = mgh = {kJ(liftWork)} kJ of work. A{" "}
            {motor / 1000} kW motor does it in {(liftWork / motor).toFixed(1)} s, because P = W/t.
          </p>
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Load × arm" value={`${Math.round(lever.loadMoment)}`} unit="N m" />
            <Readout label="Effort × arm" value={`${Math.round(lever.effortMoment)}`} unit="N m" />
            <Readout label="MA = L/E" value={effort > 0 ? lever.ma.toFixed(2) : "–"} unit="" />
          </div>
          <Choice options={CLASSES.map((x) => ({ id: String(x.id), label: x.label }))} value={String(cls)} onChange={(v) => setCls(Number(v) as LeverClass)} />
          <Choice options={LOADS.map((x) => ({ id: String(x.w), label: x.label }))} value={String(load)} onChange={(v) => setLoad(Number(v))} />
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <label className="mb-1 block">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">{CLASSES[cls - 1].posLabel}</span>
                <span className="tabular-nums text-white">{pos.toFixed(1)} m from the left end</span>
              </div>
              <input type="range" className="range mt-1 w-full" min={LEVER_POS.min} max={LEVER_POS.max} step={LEVER_POS.step} value={pos} onChange={(ev) => setPos(Number(ev.target.value))} />
            </label>
            <label className="block">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Effort</span>
                <span className="tabular-nums text-white">{effort} N</span>
              </div>
              <input type="range" className="range mt-1 w-full" min={0} max={2000} step={10} value={effort} onChange={(ev) => setEffort(Number(ev.target.value))} />
            </label>
          </div>
          <p className="text-center text-xs text-white/40">
            {CLASSES[cls - 1].label}: {CLASSES[cls - 1].example}. The bar is {BEAM} m long and its own weight is ignored.
          </p>
        </>
      )}
    </div>
  );
}

function Bar({ label, value, max, colour }: { label: string; value: number; max: number; colour: string }) {
  const f = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <div className="mb-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className="tabular-nums text-white">{kJ(Math.max(0, value))} kJ</span>
      </div>
      <div className="mt-0.5 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${colour}`} style={{ width: `${f * 100}%` }} />
      </div>
    </div>
  );
}

function Readout({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] uppercase tracking-wider text-white/50">{label}</div>
      <div className="font-display text-lg tabular-nums">
        {value}
        {unit && <span className="ml-0.5 text-xs text-white/50">{unit}</span>}
      </div>
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
          className={`flex-1 rounded-xl border px-3 py-2 text-sm whitespace-nowrap ${value === o.id ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Screen mapping for the coaster. On narrow screens the heights are drawn up to twice as tall
 * as the lengths so the hills are visible; the physics always uses the true shape.
 */
function coasterView(w: number, h: number) {
  const kx = (w - 28) / TRACK_END;
  const ky = Math.min(2 * kx, (h - 46) / HEIGHT.max);
  const ox = 14;
  const ground = h - 16;
  return { kx, ky, ground, X: (x: number) => ox + x * kx, Y: (y: number) => ground - y * ky };
}

function drawCoaster(ctx: CanvasRenderingContext2D, w: number, h: number, t: Track, cart: Cart, friction: boolean, challenge: boolean) {
  const v = coasterView(w, h);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#0b0f24");
  sky.addColorStop(1, "#1b1640");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#151827";
  ctx.fillRect(0, v.ground, w, h - v.ground);
  ctx.fillStyle = "#2a2f45";
  ctx.fillRect(0, v.ground, w, 2);

  // Energy line: the highest the cart could ever reach at each point (start height, minus friction losses).
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = friction ? "rgba(251,146,60,0.6)" : "rgba(167,139,250,0.6)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(v.X(0), v.Y(t.h0));
  ctx.lineTo(v.X(TRACK_END), v.Y(friction ? t.h0 - MU * TRACK_END : t.h0));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = "11px system-ui, sans-serif";

  // Supports.
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  for (let x = 1; x < TRACK_END; x += 2) {
    ctx.beginPath();
    ctx.moveTo(v.X(x), v.ground);
    ctx.lineTo(v.X(x), v.Y(trackHeight(t, x)));
    ctx.stroke();
  }
  // Rail.
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = 0; x <= TRACK_END; x += 0.25) {
    const px = v.X(x);
    const py = v.Y(trackHeight(t, x));
    if (x === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // Station flag.
  ctx.fillStyle = "#a3e635";
  ctx.fillRect(v.X(TRACK_END) - 2, v.ground - 26, 2, 24);
  ctx.beginPath();
  ctx.moveTo(v.X(TRACK_END) - 2, v.ground - 26);
  ctx.lineTo(v.X(TRACK_END) - 14, v.ground - 21);
  ctx.lineTo(v.X(TRACK_END) - 2, v.ground - 16);
  ctx.fill();

  // Handles with heights.
  const k = keyHeights(t);
  for (const hd of HANDLES) {
    const locked = challenge && hd.key !== "h0";
    const px = v.X(KEY_X[hd.i]);
    const py = v.Y(k[hd.i]);
    if (!locked) {
      ctx.fillStyle = "rgba(34,211,238,0.25)";
      ctx.beginPath();
      ctx.arc(px, py, 11, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = locked ? "#94a3b8" : "#67e8f9";
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.textAlign = hd.i === 0 ? "left" : "center";
    ctx.fillText(`${k[hd.i].toFixed(1)} m`, hd.i === 0 ? px - 4 : px, py - 15);
    ctx.textAlign = "left";
  }

  // Cart, tilted along the track (in screen space).
  const cx = v.X(cart.x);
  const cy = v.Y(trackHeight(t, cart.x));
  const ang = Math.atan2(-trackSlope(t, cart.x) * v.ky, v.kx);
  const len = Math.max(18, 2.2 * v.kx);
  ctx.save();
  // Keep the whole cart on screen when it rolls into the station.
  ctx.translate(Math.min(cx, w - len / 2 - 2), cy);
  ctx.rotate(ang);
  const heat = cart.heat > 0 && friction && Math.abs(cart.v) > 0.5;
  ctx.fillStyle = heat ? "#fb923c" : "#f43f5e";
  ctx.beginPath();
  ctx.roundRect(-len / 2, -11, len, 8, 3);
  ctx.fill();
  ctx.fillStyle = "#fde68a";
  ctx.beginPath();
  ctx.arc(-len * 0.1, -14, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0b0b12";
  for (const wx of [-len * 0.3, len * 0.3]) {
    ctx.beginPath();
    ctx.arc(wx, -2.5, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  if (cart.finished || cart.turnedBack) {
    ctx.font = "600 12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = cart.finished ? "#a3e635" : "#fda4af";
    ctx.fillText(cart.finished ? "Made it to the station!" : "Not enough energy: it rolls back", w / 2, h - 2);
    ctx.textAlign = "left";
  }
}

function drawLever(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  m: ReturnType<typeof leverMoments>,
  cls: LeverClass,
  load: number,
  effort: number,
  tilt: number,
) {
  const k = (w - 56) / BEAM;
  const ox = 28;
  const ground = h - (cls === 1 ? 22 : 40);
  const fh = Math.min(64, h * 0.22); // fulcrum height
  const pivot = { x: ox + m.fulcrum * k, y: ground - fh };
  // A rigid bar that does not balance swings until one end rests on the ground.
  const reach = cls === 1 ? (tilt > 0 ? m.fulcrum : BEAM - m.fulcrum) : BEAM;
  const maxA = Math.asin(Math.min(1, (fh - 4) / (reach * k)));
  // Class 1: load wins → left end down. Class 2 and 3: load wins → right end down.
  const angle = cls === 1 ? -tilt * maxA : tilt * maxA;
  const P = (s: number, up = 0) => {
    const d = (s - m.fulcrum) * k;
    return { x: pivot.x + d * Math.cos(angle) + up * Math.sin(angle), y: pivot.y + d * Math.sin(angle) - up * Math.cos(angle) };
  };

  ctx.fillStyle = "#151827";
  ctx.fillRect(0, ground, w, h - ground);
  ctx.fillStyle = "#2a2f45";
  ctx.fillRect(0, ground, w, 2);

  // Fulcrum.
  ctx.fillStyle = "#94a3b8";
  ctx.beginPath();
  ctx.moveTo(pivot.x, pivot.y);
  ctx.lineTo(pivot.x - 14, ground);
  ctx.lineTo(pivot.x + 14, ground);
  ctx.closePath();
  ctx.fill();

  // Bar.
  const a = P(0);
  const b = P(BEAM);
  ctx.strokeStyle = "#d6a35c";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.lineCap = "butt";

  ctx.font = "11px system-ui, sans-serif";
  // Load: a block sitting on the bar.
  const size = 16 + (load / 1000) * 14;
  const lp = P(m.load, 3.5);
  ctx.save();
  ctx.translate(lp.x, lp.y);
  ctx.rotate(angle);
  ctx.fillStyle = "#64748b";
  ctx.fillRect(-size / 2, -size, size, size);
  ctx.restore();
  ctx.fillStyle = "#e2e8f0";
  ctx.textAlign = "center";
  const fit = (x: number, text: string) => {
    const half = ctx.measureText(text).width / 2 + 4;
    return Math.min(w - half, Math.max(half, x));
  };
  const lx = fit(lp.x, `Load ${load} N`);
  ctx.fillText(`Load ${load} N`, lx, Math.max(32, lp.y - size - 6));

  // Effort arrow: push down on a class 1 lever, lift up on class 2 and 3.
  const ep = P(m.effort, 3.5);
  const up = cls !== 1;
  const len = 16 + Math.min(1, effort / 1000) * 26;
  ctx.strokeStyle = "#22d3ee";
  ctx.fillStyle = "#22d3ee";
  ctx.lineWidth = 3;
  if (effort > 0) {
    // Both arrows sit above the bar: pressing down onto it, or pulling up from it.
    const tipY = up ? ep.y - 4 - len : ep.y - 2;
    const tailY = up ? ep.y - 4 : tipY - len;
    ctx.beginPath();
    ctx.moveTo(ep.x, tailY);
    ctx.lineTo(ep.x, tipY);
    ctx.stroke();
    ctx.beginPath();
    const dir = up ? -1 : 1;
    ctx.moveTo(ep.x, tipY);
    ctx.lineTo(ep.x - 6, tipY - dir * 9);
    ctx.lineTo(ep.x + 6, tipY - dir * 9);
    ctx.closePath();
    ctx.fill();
  }
  const ex = fit(ep.x, `Effort ${effort} N`);
  ctx.fillText(`Effort ${effort} N`, ex, Math.max(32, ep.y - len - (up ? 10 : 8)));

  // Arm lengths along the ground.
  const arm = (from: number, to: number, colour: string, label: string, armY: number) => {
    if (Math.abs(to - from) < 0.05) return;
    const x1 = ox + from * k;
    const x2 = ox + to * k;
    ctx.strokeStyle = colour;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, armY - 3);
    ctx.lineTo(x1, armY);
    ctx.lineTo(x2, armY);
    ctx.lineTo(x2, armY - 3);
    ctx.stroke();
    ctx.fillStyle = colour;
    ctx.fillText(label, fit((x1 + x2) / 2, label), armY + 11);
  };
  // Load arm and effort arm, measured from the fulcrum. On class 2 and 3 they overlap, so use two rows.
  arm(m.fulcrum, m.load, "#cbd5e1", `load arm ${m.loadArm.toFixed(1)} m`, ground + 5);
  arm(m.fulcrum, m.effort, "#67e8f9", `effort arm ${m.effortArm.toFixed(1)} m`, cls === 1 ? ground + 5 : ground + 24);

  ctx.font = "600 12px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = m.balanced ? "#a3e635" : "#fda4af";
  ctx.fillText(m.balanced ? "Balanced: moments are equal" : m.winner === "load" ? "Load wins" : "Effort wins", 10, 18);
  ctx.textAlign = "left";
}
