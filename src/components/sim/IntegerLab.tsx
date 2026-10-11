"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import {
  N_MAX,
  RANGE,
  TIMES_MAX,
  TOKEN_MAX,
  apply,
  br,
  cancel,
  fmtInt,
  inRange,
  jumps,
  pattern,
  place,
  sentence,
  signRule,
  tokenValue,
  zeroPairs,
  type IntRound,
  type Op,
  type Scene,
} from "@/lib/sim/integers";

export type IntMode = Scene | "tokens" | "times";

export type IntReading =
  | { mode: "move"; scene: Scene; start: number; op: Op; n: number; end: number }
  | { mode: "tokens"; plus: number; minus: number; value: number }
  | { mode: "times"; a: number; b: number; p: number }
  | { mode: "round"; ok: boolean };

interface Props {
  onReading?: (r: IntReading) => void;
  /** Challenge: a control-room job. Its scene, start and working button come from the round. */
  trip?: IntRound | null;
}

const COL = { pos: "#22d3ee", neg: "#f472b6", jump: "#a78bfa", target: "#a3e635", warm: "#fb923c" };
const MODES: { id: IntMode; label: string }[] = [
  { id: "lift", label: "Lift" },
  { id: "temp", label: "Leh" },
  { id: "tokens", label: "Tokens" },
  { id: "times", label: "Times" },
];

interface Trip {
  from: number;
  op: Op;
  n: number;
  to: number;
}

export default function IntegerLab({ onReading, trip = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<IntMode>("lift");
  const [at, setAt] = useState<Record<Scene, number>>({ lift: 0, temp: -5 });
  const [op, setOp] = useState<Op>(trip?.kind === "move" ? trip.op : "+");
  const [n, setN] = useState(2);
  const [last, setLast] = useState<Trip | null>(null);
  const [anim, setAnim] = useState<number | null>(null);
  const [plus, setPlus] = useState(3);
  const [minus, setMinus] = useState(1);
  const [ta, setTa] = useState(trip?.kind === "times" ? 1 : 3);
  const [tb, setTb] = useState(-2);
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: IntMode = trip ? (trip.kind === "move" ? trip.scene : "times") : mode;
  const scene: Scene = activeMode === "temp" ? "temp" : "lift";
  const activeOp: Op = trip?.kind === "move" ? trip.op : op;
  const start = trip?.kind === "move" ? trip.start : at[scene];
  const end = apply(start, activeOp, n);
  const canGo = inRange(scene, end);
  const b = trip?.kind === "times" ? trip.b : tb;
  const product = ta * b || 0;
  const value = tokenValue(plus, minus);
  // In a challenge the lift shows where the last try landed, or the start before any try.
  const shownAt = trip?.kind === "move" ? (last ? last.to : trip.start) : at[scene];

  useEffect(() => {
    if (trip) return;
    if (activeMode === "tokens") onReadingRef.current?.({ mode: "tokens", plus, minus, value });
    else if (activeMode === "times") onReadingRef.current?.({ mode: "times", a: ta, b, p: product });
  }, [trip, activeMode, plus, minus, value, ta, b, product]);

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
    if (activeMode === "lift" || activeMode === "temp") {
      const target = trip?.kind === "move" ? trip.target : null;
      drawVertical(ctx, size.w, size.h, activeMode, anim ?? shownAt, last, target);
    } else if (activeMode === "tokens") drawTokens(ctx, size.w, size.h, plus, minus);
    else drawTimes(ctx, size.w, size.h, ta, b, trip?.kind === "times" ? trip.target : null);
    ctx.textAlign = "left";
  }, [size, activeMode, anim, shownAt, last, plus, minus, ta, b, trip]);

  // Slide the lift (or the thermometer) from one number to the next.
  const raf = useRef(0);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const slide = (from: number, to: number) => {
    cancelAnimationFrame(raf.current);
    const ms = Math.min(1200, 300 + Math.abs(to - from) * 60);
    let t0 = -1;
    const step = (t: number) => {
      if (t0 < 0) t0 = t;
      const k = Math.min(1, (t - t0) / ms);
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      if (k < 1) {
        setAnim(from + (to - from) * e);
        raf.current = requestAnimationFrame(step);
      } else setAnim(null);
    };
    raf.current = requestAnimationFrame(step);
  };

  const switchMode = (m: IntMode) => {
    setMode(m);
    setLast(null);
  };
  const setStart = (v: number) => {
    const c = Math.min(RANGE[scene].max, Math.max(RANGE[scene].min, v));
    setAt((s) => ({ ...s, [scene]: c }));
    setLast(null);
  };
  const changeN = (v: number) => {
    setN(Math.min(N_MAX, Math.max(-N_MAX, v)));
    setVerdict(null);
  };

  const go = () => {
    if (!canGo) return;
    setLast({ from: start, op: activeOp, n, to: end });
    slide(start, end);
    if (trip?.kind === "move") {
      const ok = end === trip.target;
      setVerdict(ok);
      onReadingRef.current?.({ mode: "round", ok });
      return;
    }
    setAt((s) => ({ ...s, [scene]: end }));
    onReadingRef.current?.({ mode: "move", scene, start, op: activeOp, n, end });
  };

  const check = () => {
    if (trip?.kind !== "times") return;
    const ok = product === trip.target;
    setVerdict(ok);
    onReadingRef.current?.({ mode: "round", ok });
  };

  const unit = scene === "temp" ? " °C" : "";
  const label =
    activeMode === "lift" || activeMode === "temp"
      ? `${scene === "lift" ? "Lift" : "Thermometer"} at ${place(scene, shownAt)}${last ? `; last trip ${sentence(last.from, last.op, last.n)}` : ""}`
      : activeMode === "tokens"
        ? `${plus} plus tokens and ${minus} minus tokens: ${zeroPairs(plus, minus)} zero pairs, worth ${fmtInt(value)}`
        : `${fmtInt(ta)} jumps of ${fmtInt(b)} on a number line land on ${fmtInt(product)}`;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!trip && (
        <div className="grid grid-cols-4 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => switchMode(m.id)} className={`rounded-xl py-2 ${activeMode === m.id ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m.label}
            </button>
          ))}
        </div>
      )}

      <canvas ref={canvasRef} className="h-72 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80" role="img" aria-label={label} />

      {(activeMode === "lift" || activeMode === "temp") && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="start" value={`${fmtInt(start)}${unit}`} colour="text-white" />
            <Readout label={activeOp === "+" ? "add" : "subtract"} value={br(n)} colour={n < 0 ? "text-pink-200" : "text-cyan-200"} />
            <Readout label="lands on" value={canGo ? `${fmtInt(end)}${unit}` : "off the scale"} colour="text-violet-200" />
          </div>
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-center text-sm text-white/70" data-testid="sum">
            {canGo
              ? activeOp === "−"
                ? `${fmtInt(start)} − ${br(n)} = ${fmtInt(start)} + ${br(-n)} = ${fmtInt(end)}: taking away ${br(n)} is adding ${br(-n)}.`
                : `${fmtInt(start)} + ${br(n)} = ${fmtInt(end)}: ${n < 0 ? `move ${-n} down` : n > 0 ? `move ${n} up` : "stay put"}.`
              : scene === "lift"
                ? `${sentence(start, activeOp, n)}, but the building only goes from basement −5 to floor 12.`
                : `${sentence(start, activeOp, n)}, but this thermometer only reads −20 °C to 20 °C.`}
          </p>
          <div className={`grid gap-2 ${trip ? "grid-cols-1" : "sm:grid-cols-2"}`}>
            {!trip && (
              <Stepper
                label={scene === "lift" ? "Start floor" : "Start temperature"}
                colour={COL.pos}
                value={at[scene]}
                min={RANGE[scene].min}
                max={RANGE[scene].max}
                show={(v) => `${fmtInt(v)}${unit}`}
                onChange={setStart}
              />
            )}
            <Stepper label="Number" colour={n < 0 ? COL.neg : COL.pos} value={n} min={-N_MAX} max={N_MAX} show={br} onChange={changeN} slider />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["+", "−"] as const).map((o) => {
              const broken = trip?.kind === "move" && trip.op !== o;
              return (
                <button
                  key={o}
                  aria-pressed={activeOp === o}
                  disabled={broken}
                  onClick={() => setOp(o)}
                  className={`rounded-xl border py-2 text-sm disabled:opacity-30 ${activeOp === o ? "border-violet-300/60 bg-violet-400/15 text-white" : "border-white/10 text-white/60"}`}
                >
                  {o === "+" ? "Add" : "Subtract"}
                  {broken ? " (broken)" : ""}
                </button>
              );
            })}
            <button className="btn-primary !py-2 text-sm disabled:opacity-40" disabled={!canGo} onClick={go}>
              Go
            </button>
          </div>
          {trip?.kind === "move" && <p className="text-center text-xs text-white/50">Every try starts again from {place(scene, trip.start)}.</p>}
        </>
      )}

      {activeMode === "tokens" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="+ tokens" value={`${plus}`} colour="text-cyan-200" />
            <Readout label="− tokens" value={`${minus}`} colour="text-pink-200" />
            <Readout label="worth" value={fmtInt(value)} colour="text-violet-200" />
          </div>
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-center text-sm text-white/70">
            {zeroPairs(plus, minus)} zero pair{zeroPairs(plus, minus) === 1 ? "" : "s"} cancel. {plus} − {minus} = {fmtInt(value)}
            {(() => {
              const c = cancel(plus, minus);
              return c.plus ? `: ${c.plus} + token${c.plus === 1 ? "" : "s"} left.` : c.minus ? `: ${c.minus} − token${c.minus === 1 ? "" : "s"} left.` : ": nothing left.";
            })()}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Stepper label="+ tokens" colour={COL.pos} value={plus} min={0} max={TOKEN_MAX} show={(v) => `${v}`} onChange={setPlus} />
            <Stepper label="− tokens" colour={COL.neg} value={minus} min={0} max={TOKEN_MAX} show={(v) => `${v}`} onChange={setMinus} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="btn-ghost !py-2 text-sm disabled:opacity-40"
              disabled={plus >= TOKEN_MAX || minus >= TOKEN_MAX}
              onClick={() => {
                setPlus(plus + 1);
                setMinus(minus + 1);
              }}
            >
              Add a zero pair
            </button>
            <button
              className="btn-ghost !py-2 text-sm disabled:opacity-40"
              disabled={zeroPairs(plus, minus) === 0}
              onClick={() => {
                setPlus(plus - 1);
                setMinus(minus - 1);
              }}
            >
              Remove a zero pair
            </button>
          </div>
        </>
      )}

      {activeMode === "times" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="a × b" value={`${br(ta)} × ${br(b)}`} colour="text-white" />
            <Readout label="lands on" value={fmtInt(product)} colour="text-violet-200" />
            <Readout label="sign" value={signRule(ta, b) === "0" ? "zero" : signRule(ta, b) === "+" ? "positive" : "negative"} colour={product < 0 ? "text-pink-200" : "text-cyan-200"} />
          </div>
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-center text-sm text-white/70">
            {ta === 0
              ? "No jumps at all, so you stay on 0."
              : ta > 0
                ? `${ta} jump${ta === 1 ? "" : "s"} of ${br(b)} from 0.`
                : `A negative count turns you round: ${-ta} jump${ta === -1 ? "" : "s"} of ${br(-b)} from 0.`}
          </p>
          {!trip && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className="text-[11px] tracking-wider text-white/50">the pattern for × {br(b)}</div>
              <div className="mt-1 flex flex-wrap gap-1 text-xs tabular-nums">
                {pattern(b).map((r) => (
                  <span key={r.a} className={`rounded-lg px-2 py-1 ${r.a === ta ? "bg-violet-400/20 text-white" : "text-white/60"}`}>
                    {br(r.a)} × {br(b)} = {fmtInt(r.p)}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className={`grid gap-2 ${trip ? "grid-cols-1" : "grid-cols-2"}`}>
            <Stepper
              label="Jumps (a)"
              colour={COL.jump}
              value={ta}
              min={-TIMES_MAX}
              max={TIMES_MAX}
              show={br}
              onChange={(v) => {
                setTa(v);
                setVerdict(null);
              }}
            />
            {!trip && <Stepper label="Jump size (b)" colour={COL.pos} value={tb} min={-TIMES_MAX} max={TIMES_MAX} show={br} onChange={setTb} />}
          </div>
          {trip && (
            <button className="btn-primary !py-2 text-sm" onClick={check}>
              Check
            </button>
          )}
        </>
      )}

      {trip && verdict !== null && (
        <p className={`text-center text-sm ${verdict ? "text-lime-300" : "text-amber-200"}`} role="status">
          {verdict
            ? "Job done!"
            : trip.kind === "move"
              ? `That reached ${place(trip.scene, end)}, not ${place(trip.scene, trip.target)}.`
              : `${br(ta)} × ${br(trip.b)} = ${fmtInt(product)}, not ${fmtInt(trip.target)}.`}
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

/** A number picker with − and + buttons, and an optional slider. */
function Stepper(p: { label: string; colour: string; value: number; min: number; max: number; show: (v: number) => string; onChange: (v: number) => void; slider?: boolean }) {
  const set = (v: number) => p.onChange(Math.min(p.max, Math.max(p.min, v)));
  const btn = "h-9 w-9 shrink-0 rounded-lg border border-white/10 bg-white/[0.04] text-lg text-white/80 active:bg-white/10 disabled:opacity-30";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span style={{ color: p.colour }}>{p.label}</span>
        <span className="flex items-center gap-1">
          <button className={btn} aria-label={`${p.label} down`} disabled={p.value <= p.min} onClick={() => set(p.value - 1)}>
            −
          </button>
          <span className="w-14 text-center font-display tabular-nums text-white">{p.show(p.value)}</span>
          <button className={btn} aria-label={`${p.label} up`} disabled={p.value >= p.max} onClick={() => set(p.value + 1)}>
            +
          </button>
        </span>
      </div>
      {p.slider && (
        <input type="range" aria-label={p.label} className="range mt-1 w-full" min={p.min} max={p.max} step={1} value={p.value} onChange={(e) => set(Number(e.target.value))} />
      )}
    </div>
  );
}

/** A vertical number line: a lift shaft with basements, or Leh's thermometer. */
function drawVertical(ctx: CanvasRenderingContext2D, w: number, h: number, scene: Scene, pos: number, last: Trip | null, target: number | null) {
  const { min, max } = RANGE[scene];
  const T = 34;
  const B = h - 14;
  const y = (v: number) => B - ((v - min) / (max - min)) * (B - T);
  const gap = (B - T) / (max - min);
  const cx = Math.min(w * 0.42, w / 2 - 20);
  const half = scene === "lift" ? 22 : 9;

  // The heading: the last trip as a sum, or where we are.
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(last ? sentence(last.from, last.op, last.n) : place(scene, Math.round(pos)), w / 2, 20);

  if (scene === "lift") {
    // Earth below the ground floor, sky above.
    ctx.fillStyle = "rgba(146,94,60,0.18)";
    ctx.fillRect(0, y(0) + gap / 2, w, B - y(0) + gap / 2);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.strokeRect(cx - half - 6, y(max) - gap / 2, 2 * half + 12, y(min) - y(max) + gap);
  } else {
    // The thermometer tube, with the red liquid up to the reading.
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.beginPath();
    ctx.roundRect(cx - half, T - 8, 2 * half, B - T + 16, half);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.stroke();
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.roundRect(cx - half + 3, y(pos), 2 * half - 6, B + 5 - y(pos), half - 3);
    ctx.fill();
  }

  // Ticks and numbers on the left; label every one when there is room.
  const every = scene === "temp" ? 5 : gap >= 13 ? 1 : 2;
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "right";
  for (let v = min; v <= max; v++) {
    const yy = y(v);
    const big = v % every === 0;
    ctx.strokeStyle = v === 0 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.18)";
    ctx.lineWidth = v === 0 ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(cx - half - (big ? 14 : 9), yy);
    ctx.lineTo(cx - half - 6, yy);
    ctx.stroke();
    if (big) {
      ctx.fillStyle = v < 0 ? COL.neg : v > 0 ? COL.pos : "#fff";
      ctx.fillText(scene === "lift" && v === 0 ? "G 0" : fmtInt(v), cx - half - 18, yy + 4);
    }
  }
  if (scene === "lift") {
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.moveTo(cx + half + 6, y(0) + gap / 2);
    ctx.lineTo(w - 6, y(0) + gap / 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.textAlign = "right";
    ctx.fillText("ground", w - 8, y(0) + gap / 2 - 4);
    ctx.fillText("basements", w - 8, y(0) + gap / 2 + 14);
  }

  // Target floor or temperature in the challenge.
  if (target !== null) {
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = COL.target;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - half - 6, y(target));
    ctx.lineTo(w - 8, y(target));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = COL.target;
    ctx.textAlign = "right";
    ctx.fillText(`target ${fmtInt(target)}${scene === "temp" ? " °C" : ""}`, w - 8, y(target) - 4);
  }

  // The jump: an arrow on the right from the start to where it landed.
  if (last && last.from !== last.to) {
    const x = cx + half + 18;
    const up = last.to > last.from;
    ctx.strokeStyle = COL.jump;
    ctx.fillStyle = COL.jump;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y(last.from));
    ctx.lineTo(x, y(last.to));
    ctx.stroke();
    const ty = y(last.to);
    ctx.beginPath();
    ctx.moveTo(x, ty);
    ctx.lineTo(x - 5, ty + (up ? 8 : -8));
    ctx.lineTo(x + 5, ty + (up ? 8 : -8));
    ctx.closePath();
    ctx.fill();
    const d = last.to - last.from;
    ctx.font = "bold 12px system-ui, sans-serif";
    ctx.textAlign = "left";
    const text = `${d > 0 ? "up" : "down"} ${Math.abs(d)}`;
    const ly = Math.min(B - 4, Math.max(T + 10, (y(last.from) + y(last.to)) / 2 + 4));
    ctx.fillText(text, Math.min(x + 8, w - ctx.measureText(text).width - 6), ly);
  }

  // The lift car (or the reading marker on the thermometer).
  const py = y(pos);
  if (scene === "lift") {
    ctx.fillStyle = "rgba(167,139,250,0.35)";
    ctx.strokeStyle = "#c4b5fd";
    ctx.lineWidth = 2;
    const ch = Math.max(12, gap * 0.9);
    ctx.beginPath();
    ctx.roundRect(cx - half, py - ch / 2, 2 * half, ch, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(fmtInt(Math.round(pos)), cx, py + 4);
  } else {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(cx + half + 2, py);
    ctx.lineTo(cx + half + 10, py - 5);
    ctx.lineTo(cx + half + 10, py + 5);
    ctx.closePath();
    ctx.fill();
    if (!last || last.from === last.to) {
      ctx.font = "bold 12px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${fmtInt(Math.round(pos))} °C`, cx + half + 14, py + 4);
    }
  }
}

/** + tokens on the top row, − tokens below; matched columns are zero pairs. */
function drawTokens(ctx: CanvasRenderingContext2D, w: number, h: number, plus: number, minus: number) {
  const pairs = zeroPairs(plus, minus);
  const cols = Math.max(plus, minus, 1);
  const cw = Math.min(40, (w - 20) / cols);
  const r = Math.max(6, cw * 0.4);
  const x0 = (w - cols * cw) / 2;
  const yP = h * 0.38;
  const yM = h * 0.66;

  ctx.textAlign = "center";
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(`(+${plus}) + (−${minus}) = ${fmtInt(plus - minus)}`, w / 2, 22);

  const token = (x: number, yy: number, sign: "+" | "−", faded: boolean) => {
    const c = sign === "+" ? COL.pos : COL.neg;
    ctx.globalAlpha = faded ? 0.3 : 1;
    ctx.fillStyle = c + "33";
    ctx.strokeStyle = c;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, yy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = c;
    ctx.font = `bold ${Math.round(r * 1.3)}px system-ui, sans-serif`;
    ctx.fillText(sign, x, yy + r * 0.45);
    ctx.globalAlpha = 1;
  };
  for (let i = 0; i < cols; i++) {
    const x = x0 + cw * (i + 0.5);
    if (i < pairs) {
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, yP + r + 2);
      ctx.lineTo(x, yM - r - 2);
      ctx.stroke();
      if (cw >= 16) {
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.font = "11px system-ui, sans-serif";
        ctx.fillText("0", x + (cw >= 28 ? 8 : 0), (yP + yM) / 2 + 4);
      }
    }
    if (i < plus) token(x, yP, "+", i < pairs);
    if (i < minus) token(x, yM, "−", i < pairs);
  }
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  const left = cancel(plus, minus);
  ctx.fillText(
    pairs ? `${pairs} zero pair${pairs === 1 ? "" : "s"} faded out; what is left shows ${fmtInt(plus - minus)}` : left.plus || left.minus ? "no zero pairs to cancel" : "an empty board is worth 0",
    w / 2,
    h - 12,
  );
}

/** a jumps of size b along a number line from −25 to 25. */
function drawTimes(ctx: CanvasRenderingContext2D, w: number, h: number, a: number, b: number, target: number | null) {
  const M = TIMES_MAX * TIMES_MAX;
  const L = 14;
  const k = (w - 2 * L) / (2 * M);
  const x = (v: number) => L + (v + M) * k;
  const y0 = h * 0.68;

  ctx.textAlign = "center";
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(`${br(a)} × ${br(b)} = ${fmtInt(a * b || 0)}`, w / 2, 22);

  // The line, with numbers every 5.
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(L, y0);
  ctx.lineTo(w - L, y0);
  ctx.stroke();
  ctx.font = "11px system-ui, sans-serif";
  for (let v = -M; v <= M; v++) {
    const big = v % 5 === 0;
    ctx.strokeStyle = big ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x(v), y0 - (big ? 6 : 3));
    ctx.lineTo(x(v), y0 + (big ? 6 : 3));
    ctx.stroke();
    if (big) {
      ctx.fillStyle = v < 0 ? COL.neg : v > 0 ? COL.pos : "#fff";
      ctx.fillText(fmtInt(v), x(v), y0 + 20);
    }
  }

  if (target !== null) {
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = COL.target;
    ctx.beginPath();
    ctx.moveTo(x(target), y0 - 70);
    ctx.lineTo(x(target), y0 + 8);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = COL.target;
    ctx.fillText(`target ${fmtInt(target)}`, Math.min(Math.max(x(target), 40), w - 40), y0 + 38);
  }

  // The jumps, as arcs above the line.
  const pts = jumps(a, b);
  const step = pts.length > 1 ? Math.abs(pts[1] - pts[0]) : 0;
  const arcH = Math.min(60, 12 + step * k * 0.6);
  ctx.strokeStyle = COL.jump;
  ctx.fillStyle = COL.jump;
  ctx.lineWidth = 2;
  for (let i = 1; i < pts.length; i++) {
    const xa = x(pts[i - 1]);
    const xb = x(pts[i]);
    if (xa === xb) continue;
    ctx.beginPath();
    ctx.moveTo(xa, y0);
    ctx.quadraticCurveTo((xa + xb) / 2, y0 - 2 * arcH, xb, y0);
    ctx.stroke();
    const dir = xb > xa ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(xb, y0 - 1);
    ctx.lineTo(xb - dir * 7, y0 - 9);
    ctx.lineTo(xb - dir * 1, y0 - 11);
    ctx.closePath();
    ctx.fill();
  }
  const land = pts[pts.length - 1];
  ctx.fillStyle = land < 0 ? COL.neg : land > 0 ? COL.pos : "#fff";
  ctx.beginPath();
  ctx.arc(x(land), y0, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "12px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText(
    a < 0 && b !== 0 ? `a is negative, so each jump of ${br(b)} goes the other way` : `${Math.abs(a)} jump${Math.abs(a) === 1 ? "" : "s"} of ${br(b)} from 0`,
    w / 2,
    44,
  );
}
