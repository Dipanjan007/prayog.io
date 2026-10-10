"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import { ANGLE, LEN, RISE, RUN, buildRamp, meetsRampRound, ratioText, ratios, slideSides, type RampRound } from "@/lib/sim/trig";

export type RampMode = "slide" | "build";

export type RampReading =
  | { mode: "slide"; theta: number; L: number; sin: number; cos: number; tan: number }
  | { mode: "build"; rise: number; run: number; theta: number; sin: number; cos: number; tan: number }
  | { mode: "round"; ok: boolean };

interface Props {
  onReading?: (r: RampReading) => void;
  /** Challenge: build a ramp with a given sin, cos or tan, then check it. */
  round?: RampRound | null;
}

const COL = { opp: "#f472b6", adj: "#22d3ee", hyp: "#a78bfa", angle: "#facc15" };
/** Lengths in metres, to 3 places, with no trailing zeros. */
const m = (v: number) => `${Number(v.toFixed(3))}`;
const sq = (v: number) => (v * v).toFixed(3);

export default function RampLab({ onReading, round = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<RampMode>("slide");
  // Start away from every task value: 40° and a 2 m slide; a 0.2 m by 0.5 m ramp.
  const [theta, setTheta] = useState(40);
  const [L, setL] = useState(2);
  const [rise, setRise] = useState(2);
  const [run, setRun] = useState(5);
  const [checked, setChecked] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: RampMode = round ? "build" : mode;
  const r = ratios(theta);
  const s = slideSides(theta, L);
  const b = buildRamp(rise, run);

  useEffect(() => {
    if (round) return;
    if (activeMode === "slide") {
      const q = ratios(theta);
      onReadingRef.current?.({ mode: "slide", theta, L, sin: q.sin, cos: q.cos, tan: q.tan });
    } else {
      const q = buildRamp(rise, run);
      onReadingRef.current?.({ mode: "build", rise, run, theta: q.theta, sin: q.sin, cos: q.cos, tan: q.tan });
    }
  }, [round, activeMode, theta, L, rise, run]);

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
    const { w, h } = size;
    if (activeMode === "slide") {
      const sides = slideSides(theta, L);
      // One scale for every angle and length, so a longer slide is drawn bigger.
      const k = Math.min(scaleFor(w, h, LEN.max, LEN.max), scaleFor(w, h, slideSides(ANGLE.min, LEN.max).adj, slideSides(ANGLE.max, LEN.max).opp));
      const ghosts: number[] = [];
      for (let g = 1; g < L - 1e-9; g++) ghosts.push(g);
      drawTriangle(ctx, w, h, sides.opp, sides.adj, theta, k, ghosts.map((g) => g * Math.cos((theta * Math.PI) / 180)));
    } else {
      const q = buildRamp(rise, run);
      const k = Math.min(scaleFor(w, h, q.run, q.rise), scaleFor(w, h, 0.6, 0.6));
      drawTriangle(ctx, w, h, q.rise, q.run, q.theta, k, []);
    }
  }, [size, activeMode, theta, L, rise, run]);

  const change = (f: () => void) => {
    f();
    setChecked(null);
  };

  const check = () => {
    if (!round) return;
    const ok = meetsRampRound(rise, run, round);
    setChecked(ok);
    onReadingRef.current?.({ mode: "round", ok });
  };

  const showRatios = !round || checked !== null;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!round && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["slide", "build"] as const).map((md) => (
            <button key={md} onClick={() => setMode(md)} className={`rounded-xl py-2 ${activeMode === md ? "bg-white/10 text-white" : "text-white/50"}`}>
              {md === "slide" ? "Slide" : "Build"}
            </button>
          ))}
        </div>
      )}

      {round && (
        <div className="rounded-2xl border border-orange-300/30 bg-orange-300/[0.07] px-3 py-2 text-center text-sm text-orange-100">
          Target: {round.ratio} θ = {round.num} ÷ {round.den}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={
          activeMode === "slide"
            ? `A slide ${m(L)} m long at ${theta}° to the ground: height ${m(s.opp)} m, base ${m(s.adj)} m`
            : `A ramp rising ${m(b.rise)} m over a run of ${m(b.run)} m, with a sloping side of ${m(b.hyp)} m`
        }
      />

      {activeMode === "slide" ? (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="sin θ" value={ratioText(r.sin)} sub={`${m(s.opp)} ÷ ${m(s.hyp)}`} colour="text-pink-200" />
            <Readout label="cos θ" value={ratioText(r.cos)} sub={`${m(s.adj)} ÷ ${m(s.hyp)}`} colour="text-cyan-200" />
            <Readout label="tan θ" value={ratioText(r.tan)} sub={`${m(s.opp)} ÷ ${m(s.adj)}`} colour="text-yellow-200" />
          </div>
          <p className="text-center text-xs text-white/50 tabular-nums">
            sin²θ + cos²θ = {sq(r.sin)} + {sq(r.cos)} = {(r.sin ** 2 + r.cos ** 2).toFixed(3)}
          </p>
          <Stepper label="Angle θ" colour={COL.angle} display={`${theta}°`} min={ANGLE.min} max={ANGLE.max} step={ANGLE.step} value={theta} onChange={setTheta} />
          <Stepper label="Slide length" colour={COL.hyp} display={`${m(L)} m`} min={LEN.min} max={LEN.max} step={LEN.step} value={L} onChange={setL} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Rise" value={`${m(b.rise)} m`} colour="text-pink-200" />
            <Readout label="Run" value={`${m(b.run)} m`} colour="text-cyan-200" />
            <Readout label="Slope length" value={`${m(b.hyp)} m`} colour="text-violet-200" />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="sin θ" value={showRatios ? ratioText(b.sin) : "?"} sub={`${m(b.rise)} ÷ ${m(b.hyp)}`} colour="text-pink-200" />
            <Readout label="cos θ" value={showRatios ? ratioText(b.cos) : "?"} sub={`${m(b.run)} ÷ ${m(b.hyp)}`} colour="text-cyan-200" />
            <Readout label="tan θ" value={showRatios ? ratioText(b.tan) : "?"} sub={`${m(b.rise)} ÷ ${m(b.run)}`} colour="text-yellow-200" />
          </div>
          {showRatios && (
            <p className="text-center text-xs text-white/50 tabular-nums">
              θ ≈ {b.theta.toFixed(1)}° · sin²θ + cos²θ = {sq(b.sin)} + {sq(b.cos)} = {(b.sin ** 2 + b.cos ** 2).toFixed(3)}
            </p>
          )}
          <Stepper label="Rise" colour={COL.opp} display={`${m(rise / 10)} m`} min={RISE.min} max={RISE.max} step={RISE.step} value={rise} onChange={(v) => change(() => setRise(v))} />
          <Stepper label="Run" colour={COL.adj} display={`${m(run / 10)} m`} min={RUN.min} max={RUN.max} step={RUN.step} value={run} onChange={(v) => change(() => setRun(v))} />
          {round && (
            <>
              <button className="btn-primary !py-2 text-sm" onClick={check}>
                Check my ramp
              </button>
              {checked !== null && (
                <p className={`text-center text-sm ${checked ? "text-lime-300" : "text-amber-200"}`}>
                  {checked
                    ? `Yes! ${round.ratio} θ = ${round.num} ÷ ${round.den} exactly.`
                    : `Not yet: this ramp has ${round.ratio} θ = ${ratioText(b[round.ratio])}, but ${round.num} ÷ ${round.den} = ${ratioText(round.num / round.den)}.`}
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function Readout({ label, value, sub, colour }: { label: string; value: string; sub?: string; colour: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] tracking-wider text-white/50">{label}</div>
      <div className={`truncate font-display text-base tabular-nums sm:text-lg ${colour}`}>{value}</div>
      {sub && <div className="truncate text-[11px] text-white/40 tabular-nums">{sub}</div>}
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

/** Width of a two-line label. */
function labelWidth(ctx: CanvasRenderingContext2D, a: string, b: string) {
  return Math.max(ctx.measureText(a).width, ctx.measureText(b).width) + 6;
}

const LABEL_H = 28;

/** A two-line label (name, then value) in a dark box whose top-left corner is (x, y). */
function label2(ctx: CanvasRenderingContext2D, a: string, b: string, x: number, y: number, colour: string) {
  const bw = labelWidth(ctx, a, b);
  ctx.fillStyle = "rgba(10,13,28,0.85)";
  ctx.fillRect(x, y, bw, LABEL_H);
  ctx.fillStyle = colour;
  ctx.textAlign = "center";
  ctx.fillText(a, x + bw / 2, y + 11);
  ctx.fillText(b, x + bw / 2, y + 24);
  ctx.textAlign = "left";
}

/** Pixels per metre for a triangle of base `adj` and height `opp`, leaving room for the labels. */
function scaleFor(w: number, h: number, adj: number, opp: number) {
  return Math.max(4, Math.min((w - 96) / adj, (h - 64) / opp));
}

/**
 * A right triangle with the angle θ at the bottom left: base `adj`, height `opp` (metres), drawn at
 * k pixels per metre. `ghosts` are the bases of smaller slides at the same angle, drawn faintly inside.
 */
function drawTriangle(ctx: CanvasRenderingContext2D, w: number, h: number, opp: number, adj: number, thetaDeg: number, k: number, ghosts: number[]) {
  const t = (thetaDeg * Math.PI) / 180;
  ctx.font = "11px system-ui, sans-serif";
  const hyp = Math.hypot(opp, adj);
  const L = {
    adj: ["adjacent", `${m(adj)} m`],
    opp: ["opposite", `${m(opp)} m`],
    hyp: ["hypotenuse", `${m(hyp)} m`],
  } as const;
  const wAdj = labelWidth(ctx, L.adj[0], L.adj[1]);
  const wOpp = labelWidth(ctx, L.opp[0], L.opp[1]);
  const wHyp = labelWidth(ctx, L.hyp[0], L.hyp[1]);
  const y0 = h - 36;
  const B = adj * k;
  const H = opp * k;
  const y2 = y0 - H;
  const nx = -Math.sin(t);
  const ny = -Math.cos(t);

  // Lay everything out with the corner at x = 0, then centre the whole drawing.
  const hypBox = (() => {
    const mx = B / 2;
    const my = y0 - H / 2;
    if (nx < -0.4) {
      // Up and to the left of the slope: the box's bottom-right corner sits just off the slope.
      const bx = mx + nx * 10;
      const by = my + ny * 10;
      return { x: bx - wHyp, y: by - LABEL_H };
    }
    // Above the slope: lift it until its bottom clears the slope under its right edge.
    const cx = mx + nx * 10;
    const right = Math.min(cx + wHyp / 2, B);
    const slopeY = y0 - right * Math.tan(t);
    const bottom = Math.min(my - 10, slopeY - 4);
    return { x: cx - wHyp / 2, y: Math.max(2, bottom - LABEL_H) };
  })();
  const oppBox = { x: B + 8, y: Math.min(y0 - LABEL_H, y0 - H / 2 - LABEL_H / 2) };
  const adjBox = { x: B / 2 - wAdj / 2, y: y0 + 6 };
  const left = Math.min(-18, hypBox.x, adjBox.x);
  const right = Math.max(oppBox.x + wOpp, hypBox.x + wHyp, adjBox.x + wAdj);
  const x0 = Math.max(4 - left, Math.min(w - 4 - right, (w - (right - left)) / 2 - left));
  const x1 = x0 + B;

  // Faint smaller slides at the same angle: same shape, smaller size.
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(167,139,250,0.35)";
  for (const g of ghosts) {
    ctx.beginPath();
    ctx.moveTo(x0 + g * k, y0);
    ctx.lineTo(x0 + g * k, y0 - g * Math.tan(t) * k);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Fill.
  ctx.fillStyle = "rgba(167,139,250,0.08)";
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y0);
  ctx.lineTo(x1, y2);
  ctx.closePath();
  ctx.fill();

  const side = (ax: number, ay: number, bx: number, by: number, colour: string, width: number) => {
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.shadowColor = colour;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.shadowBlur = 0;
  };
  side(x0, y0, x1, y0, COL.adj, 3);
  side(x1, y0, x1, y2, COL.opp, 3);
  side(x0, y0, x1, y2, COL.hyp, 4);

  // Right-angle mark.
  const ra = Math.min(10, B * 0.3, H * 0.3);
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x1 - ra, y0 - ra, ra, ra);

  // Angle arc and θ.
  ctx.strokeStyle = COL.angle;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x0, y0, Math.min(20, B * 0.6), -t, 0);
  ctx.stroke();
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.fillStyle = COL.angle;
  ctx.textAlign = "right";
  ctx.fillText("θ", x0 - 6, y0 + 4);
  ctx.textAlign = "left";

  ctx.font = "11px system-ui, sans-serif";
  label2(ctx, L.adj[0], L.adj[1], x0 + adjBox.x, adjBox.y, COL.adj);
  label2(ctx, L.opp[0], L.opp[1], x0 + oppBox.x, oppBox.y, COL.opp);
  label2(ctx, L.hyp[0], L.hyp[1], x0 + hypBox.x, hypBox.y, COL.hyp);
}
