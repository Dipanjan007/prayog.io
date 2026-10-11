"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import {
  A_VALUES,
  BREADTH,
  B_RANGE,
  C_RANGE,
  HALF,
  TARGETS,
  discriminant,
  evalQ,
  formatQuadratic,
  gardenArea,
  gardenBreadths,
  gardenEquation,
  meetsRound,
  rootCount,
  roots,
  type RootRound,
} from "@/lib/sim/quadratics";

export type QuadMode = "curve" | "garden";

export type QuadReading =
  | { mode: "curve"; a: number; b: number; c: number; disc: number; count: 0 | 1 | 2; roots: number[] }
  | { mode: "garden"; x: number; area: number; target: number }
  | { mode: "round"; ok: boolean };

interface Props {
  onReading?: (r: QuadReading) => void;
  /** Challenge: build a curve with the given roots, then check it. */
  round?: RootRound | null;
}

const COL = { curve: "#22d3ee", root: "#facc15", a: "#a78bfa", b: "#f472b6", c: "#a3e635", target: "#fb923c" };
const num = (v: number) => (v < 0 ? `−${Math.abs(v)}` : `${v}`);
const fmt = (v: number) => {
  const r = Math.round(v * 100) / 100;
  return num(Object.is(r, -0) ? 0 : r);
};
/** Graph window for the curve. */
const WIN = { x: 10, y: 20 };

export default function QuadraticLab({ onReading, round = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<QuadMode>("curve");
  // Start on a curve with roots 1 and −3, away from the task values.
  const [ai, setAi] = useState(A_VALUES.indexOf(1));
  const [b, setB] = useState(2);
  const [c, setC] = useState(-3);
  const [x, setX] = useState(5);
  const [target, setTarget] = useState(96);
  const [checked, setChecked] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: QuadMode = round ? "curve" : mode;
  const a = A_VALUES[ai];
  const disc = discriminant(a, b, c);
  const count = rootCount(a, b, c);
  const rs = roots(a, b, c);
  const area = gardenArea(x);

  useEffect(() => {
    if (round) return;
    if (activeMode === "curve") onReadingRef.current?.({ mode: "curve", a, b, c, disc, count, roots: rs });
    else onReadingRef.current?.({ mode: "garden", x, area, target });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- disc, count and rs come from a, b and c
  }, [round, activeMode, a, b, c, x, area, target]);

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
    if (activeMode === "curve") drawCurve(ctx, size.w, size.h, a, b, c, !round || checked !== null, round);
    else drawGarden(ctx, size.w, size.h, x, target);
  }, [size, activeMode, a, b, c, x, target, round, checked]);

  const change = (f: () => void) => {
    f();
    setChecked(null);
  };

  const check = () => {
    if (!round) return;
    const ok = meetsRound(a, b, c, round);
    setChecked(ok);
    onReadingRef.current?.({ mode: "round", ok });
  };

  const eq = gardenEquation(target);
  const gDisc = discriminant(eq.a, eq.b, eq.c);
  const nGarden = gardenBreadths(target).length;
  const showRoots = !round || checked !== null;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!round && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["curve", "garden"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${activeMode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m === "curve" ? "Curve" : "Garden"}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={
          activeMode === "curve"
            ? `Graph of y = ${formatQuadratic(a, b, c)}; it meets the x-axis ${count === 0 ? "nowhere" : count === 1 ? "once" : "twice"}`
            : `A garden ${fmt(x)} m wide and ${fmt(HALF - x)} m long with an area of ${fmt(area)} square metres`
        }
      />

      {activeMode === "curve" ? (
        <>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-center font-display text-base text-white tabular-nums sm:text-lg">
            y = {formatQuadratic(a, b, c)}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="b² − 4ac" value={fmt(disc)} colour="text-yellow-200" />
            <Readout label="Real roots" value={count === 2 ? "2" : count === 1 ? "1 (equal)" : "0"} colour="text-cyan-200" />
            <Readout label="x =" value={!showRoots ? "?" : rs.length ? rs.map(fmt).join(", ") : "none"} colour="text-lime-200" />
          </div>
          <p className="text-center text-xs text-white/50 tabular-nums">
            x = (−b ± √(b² − 4ac)) ÷ (2a) = ({num(-b)} ± √{disc < 0 ? `(${fmt(disc)})` : fmt(disc)}) ÷ {fmt(2 * a)}
            {disc < 0 ? ": no real square root" : ""}
          </p>
          <Stepper label="a" colour={COL.a} value={a} display={num(a)} min={0} max={A_VALUES.length - 1} step={1} index={ai} onChange={(i) => change(() => setAi(i))} />
          <Stepper label="b" colour={COL.b} value={b} display={num(b)} min={B_RANGE.min} max={B_RANGE.max} step={B_RANGE.step} index={b} onChange={(v) => change(() => setB(v))} />
          <Stepper label="c" colour={COL.c} value={c} display={num(c)} min={C_RANGE.min} max={C_RANGE.max} step={C_RANGE.step} index={c} onChange={(v) => change(() => setC(v))} />
          {round && (
            <>
              <button className="btn-primary !py-2 text-sm" onClick={check}>
                Check my curve
              </button>
              {checked !== null && (
                <p className={`text-center text-sm ${checked ? "text-lime-300" : "text-amber-200"}`}>
                  {checked
                    ? round.roots[0] === round.roots[1]
                      ? `Yes! It just touches the x-axis at x = ${num(round.roots[0])}.`
                      : `Yes! It meets the x-axis at x = ${num(round.roots[0])} and x = ${num(round.roots[1])}.`
                    : `Not yet: this curve's roots are ${rs.length ? rs.map(fmt).join(" and ") : "not real"}.`}
                </p>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Breadth x" value={`${fmt(x)} m`} colour="text-cyan-200" />
            <Readout label="Length 20 − x" value={`${fmt(HALF - x)} m`} colour="text-pink-200" />
            <Readout label="Area" value={`${fmt(area)} m²`} colour={Math.abs(area - target) < 1e-9 ? "text-lime-200" : "text-white"} />
          </div>
          <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Target area">
            {TARGETS.map((t) => (
              <button
                key={t}
                onClick={() => setTarget(t)}
                aria-pressed={target === t}
                className={`rounded-xl border px-1 py-2 text-sm tabular-nums ${target === t ? "border-orange-300 bg-orange-300/15 text-white" : "border-white/10 text-white/70"}`}
              >
                {t} m²
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-center text-sm text-white/70 tabular-nums">
            x(20 − x) = {target} → {formatQuadratic(eq.a, eq.b, eq.c)} = 0
            <br />
            b² − 4ac = 400 − {4 * target} = {fmt(gDisc)}:{" "}
            <span className={nGarden ? "text-lime-200" : "text-amber-200"}>
              {nGarden === 2 ? "two breadths work" : nGarden === 1 ? "only one breadth works" : "no rectangle can do it"}
            </span>
          </div>
          <Stepper
            label="Breadth x"
            colour={COL.curve}
            value={x}
            display={`${fmt(x)} m`}
            min={BREADTH.min}
            max={BREADTH.max}
            step={BREADTH.step}
            index={x}
            onChange={setX}
          />
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

/** A slider with − and + buttons. `index` is the slider position; `value` is what it means. */
function Stepper(p: {
  label: string;
  colour: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  index: number;
  onChange: (v: number) => void;
}) {
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
          onClick={() => p.onChange(clamp(p.index - p.step))}
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
          value={p.index}
          onChange={(e) => p.onChange(Number(e.target.value))}
        />
        <button
          aria-label={`Increase ${p.label}`}
          onClick={() => p.onChange(clamp(p.index + p.step))}
          className="h-9 w-9 shrink-0 rounded-lg border border-white/10 text-lg text-white/80"
        >
          +
        </button>
      </div>
    </div>
  );
}

function drawCurve(ctx: CanvasRenderingContext2D, w: number, h: number, a: number, b: number, c: number, showRoots: boolean, round: RootRound | null) {
  const pad = 8;
  const X = (x: number) => pad + ((x + WIN.x) / (2 * WIN.x)) * (w - 2 * pad);
  const Y = (y: number) => pad + ((WIN.y - y) / (2 * WIN.y)) * (h - 2 * pad);

  // Grid: every 1 across, every 5 up.
  ctx.lineWidth = 1;
  for (let i = -WIN.x; i <= WIN.x; i++) {
    ctx.strokeStyle = i % 5 === 0 ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)";
    ctx.beginPath();
    ctx.moveTo(X(i), pad);
    ctx.lineTo(X(i), h - pad);
    ctx.stroke();
  }
  for (let j = -WIN.y; j <= WIN.y; j += 5) {
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.beginPath();
    ctx.moveTo(pad, Y(j));
    ctx.lineTo(w - pad, Y(j));
    ctx.stroke();
  }
  // Axes.
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad, Y(0));
  ctx.lineTo(w - pad, Y(0));
  ctx.moveTo(X(0), pad);
  ctx.lineTo(X(0), h - pad);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "center";
  for (const i of [-10, -5, 5, 10]) {
    const tx = Math.min(w - pad - 8, Math.max(pad + 8, X(i)));
    ctx.fillText(num(i), tx, Y(0) + 13);
  }
  ctx.textAlign = "left";
  for (const j of [-20, -10, 10, 20]) ctx.fillText(num(j), X(0) + 4, Math.min(h - pad - 2, Math.max(pad + 10, Y(j) + 4)));
  ctx.fillText("x", w - pad - 10, Y(0) - 5);
  ctx.fillText("y", X(0) - 12, pad + 10);

  // Target roots in the challenge, as faint rings.
  if (round) {
    ctx.strokeStyle = "rgba(251,146,60,0.8)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 2;
    for (const r of new Set(round.roots)) {
      ctx.beginPath();
      ctx.arc(X(r), Y(0), 9, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // The curve, clipped to the plot.
  ctx.save();
  ctx.beginPath();
  ctx.rect(pad, pad, w - 2 * pad, h - 2 * pad);
  ctx.clip();
  ctx.strokeStyle = COL.curve;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = COL.curve;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  const steps = Math.max(200, Math.round(w));
  for (let i = 0; i <= steps; i++) {
    const x = -WIN.x + (2 * WIN.x * i) / steps;
    const y = Math.max(-WIN.y * 3, Math.min(WIN.y * 3, evalQ(a, b, c, x)));
    if (i) ctx.lineTo(X(x), Y(y));
    else ctx.moveTo(X(x), Y(y));
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Roots: dots on the axis with labels, one above and one below so they never overlap.
  if (!showRoots) return;
  const rs = roots(a, b, c).filter((r) => Math.abs(r) <= WIN.x);
  ctx.font = "bold 12px system-ui, sans-serif";
  ctx.textAlign = "center";
  rs.forEach((r, i) => {
    ctx.fillStyle = COL.root;
    ctx.shadowColor = COL.root;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(X(r), Y(0), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    const label = `x = ${fmt(r)}`;
    const half = ctx.measureText(label).width / 2 + 4;
    const lx = Math.min(w - half, Math.max(half, X(r)));
    const below = i === 1 || (rs.length === 1 && a < 0);
    const ly = below ? Y(0) + 28 : Y(0) - 14;
    ctx.fillStyle = "rgba(10,13,28,0.85)";
    ctx.fillRect(lx - half, ly - 12, half * 2, 16);
    ctx.fillStyle = COL.root;
    ctx.fillText(label, lx, ly);
  });
  ctx.textAlign = "left";
}

function drawGarden(ctx: CanvasRenderingContext2D, w: number, h: number, x: number, target: number) {
  // Left: the garden to scale. Right: area against breadth, with the target line.
  const split = Math.round(w * 0.44);
  const len = HALF - x;
  const k = Math.min((split - 30) / HALF, (h - 50) / HALF);
  const gw = len * k;
  const gh = x * k;
  const gx = (split - gw) / 2;
  const gy = (h - gh) / 2;
  ctx.fillStyle = "rgba(163,230,53,0.18)";
  ctx.fillRect(gx, gy, gw, gh);
  ctx.strokeStyle = "#a3e635";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 3]);
  ctx.strokeRect(gx, gy, gw, gh);
  ctx.setLineDash([]);
  // Little plants in rows.
  ctx.fillStyle = "rgba(163,230,53,0.55)";
  for (let i = 1; i < len; i += 2) for (let j = 1; j < x; j += 2) ctx.fillRect(gx + i * k - 1, gy + j * k - 1, 2, 2);
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#f9a8d4";
  ctx.fillText(`length ${fmt(len)} m`, split / 2, Math.max(14, gy - 6));
  ctx.fillStyle = "#67e8f9";
  ctx.fillText(`breadth ${fmt(x)} m`, split / 2, gy + gh + 15);

  // Area graph.
  const L = split + 30;
  const R = w - 10;
  const T = 14;
  const B = h - 24;
  const maxA = 120;
  const GX = (v: number) => L + (v / HALF) * (R - L);
  const GY = (v: number) => B - (v / maxA) * (B - T);
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(L, T);
  ctx.lineTo(L, B);
  ctx.lineTo(R, B);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "right";
  for (const v of [0, 50, 100]) ctx.fillText(`${v}`, L - 4, GY(v) + 4);
  ctx.textAlign = "center";
  for (const v of [0, 10]) ctx.fillText(`${v}`, GX(v), B + 14);
  ctx.textAlign = "right";
  ctx.fillText("20 m", R, B + 14);

  // Target line.
  ctx.strokeStyle = COL.target;
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(L, GY(target));
  ctx.lineTo(R, GY(target));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = COL.target;
  ctx.textAlign = "left";
  ctx.fillText(`${target} m²`, L + 4, GY(target) - 4);

  // Area curve x(20 − x).
  ctx.strokeStyle = COL.curve;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 100; i++) {
    const v = (HALF * i) / 100;
    if (i) ctx.lineTo(GX(v), GY(gardenArea(v)));
    else ctx.moveTo(GX(v), GY(gardenArea(v)));
  }
  ctx.stroke();
  // Current breadth.
  ctx.fillStyle = Math.abs(gardenArea(x) - target) < 1e-9 ? "#a3e635" : "#fff";
  ctx.beginPath();
  ctx.arc(GX(x), GY(gardenArea(x)), 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = "left";
}
