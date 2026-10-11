"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import {
  CAP_RANGE,
  GLASS,
  H_RANGE,
  PI,
  R_RANGE,
  SOLIDS,
  closeEnough,
  cone,
  cylinder,
  fillAfter,
  glassVolume,
  hemisphere,
  pourVolume,
  round2,
  slant,
  solidSurface,
  solidVolume,
  type PourSource,
  type SolidDims,
  type SolidId,
  type SolidRound,
} from "@/lib/sim/solids";

export type SolidsMode = "build" | "pour";

export type SolidsReading =
  | { mode: "build"; solid: SolidId; r: number; h: number; H: number; V: number; S: number }
  | { mode: "pour"; src: PourSource; pours: number; fill: number }
  | { mode: "answer"; guess: number; ok: boolean };

interface Props {
  onReading?: (r: SolidsReading) => void;
  /** Challenge: build solids, then type the answer to the round's question. */
  round?: SolidRound | null;
}

const COL = { solid: "#22d3ee", cone: "#f472b6", cap: "#a78bfa", water: "#38bdf8", label: "#facc15" };
const fmt = (v: number) => {
  const r = round2(v);
  return Number.isInteger(r) ? `${r}` : r.toFixed(2).replace(/0$/, "");
};
const tidy = (v: number) => Math.round(v * 10) / 10;

export default function SolidsLab({ onReading, round = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<SolidsMode>("pour");
  const [solid, setSolid] = useState<SolidId>(round?.start ?? "icecream");
  const [dims, setDims] = useState<SolidDims>({ r: 2, h: 6, H: 1.5 });
  const [src, setSrc] = useState<PourSource>("cone");
  const [pours, setPours] = useState(0);
  const [shownFill, setShownFill] = useState(0);
  const [guess, setGuess] = useState("");
  const [checked, setChecked] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: SolidsMode = round ? "build" : mode;
  const info = SOLIDS.find((s) => s.id === solid)!;
  const u = info.unit;
  const V = solidVolume(solid, dims);
  const S = solidSurface(solid, dims);
  const fill = fillAfter(src, pours);

  useEffect(() => {
    if (round) return;
    if (activeMode === "build") onReadingRef.current?.({ mode: "build", solid, r: dims.r, h: dims.h, H: dims.H, V, S });
    else onReadingRef.current?.({ mode: "pour", src, pours, fill });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- V, S and fill come from the other values
  }, [round, activeMode, solid, dims, src, pours]);

  // Let the water level rise smoothly to the new fill.
  const shownRef = useRef(0);
  useEffect(() => {
    let raf = 0;
    const step = () => {
      const f = shownRef.current;
      const next = Math.abs(fill - f) < 0.005 ? fill : f + (fill - f) * 0.15;
      shownRef.current = next;
      setShownFill(next);
      if (next !== fill) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [fill]);

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
    if (activeMode === "build") drawSolid(ctx, size.w, size.h, solid, dims, u);
    else drawPour(ctx, size.w, size.h, src, pours, shownFill);
  }, [size, activeMode, solid, dims, u, src, pours, shownFill]);

  const setDim = (k: keyof SolidDims, v: number) => setDims((d) => ({ ...d, [k]: tidy(v) }));

  const check = () => {
    if (!round) return;
    const g = Number(guess.replace(",", "."));
    const ok = closeEnough(g, round);
    setChecked(ok);
    onReadingRef.current?.({ mode: "answer", guess: g, ok });
  };

  const parts = partsOf(solid, dims);

  return (
    <div className="flex flex-col gap-3 select-none">
      {!round && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["pour", "build"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${activeMode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m === "pour" ? "Pour" : "Build"}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={
          activeMode === "build"
            ? `${info.label} with radius ${dims.r} ${u}: volume ${fmt(V)} ${u}³, surface area ${fmt(S)} ${u}²`
            : `${pours} ${src === "cone" ? "cones" : "balls"} of water poured into a glass; it is ${Math.round(Math.min(fill, 1) * 100)}% full`
        }
      />

      {activeMode === "build" ? (
        <>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4" role="group" aria-label="Solid">
            {SOLIDS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSolid(s.id)}
                aria-pressed={solid === s.id}
                className={`rounded-xl border px-2 py-2 text-sm whitespace-nowrap ${solid === s.id ? "border-cyan-300 bg-cyan-300/15 text-white" : "border-white/10 text-white/70"}`}
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Volume V" value={`${fmt(V)} ${u}³`} colour="text-cyan-200" />
            <Readout label="Surface S" value={`${fmt(S)} ${u}²`} colour="text-pink-200" />
            <Readout
              label="Slant l"
              value={solid === "icecream" ? `${fmt(slant(dims.r, dims.h))} ${u}` : solid === "tent" ? `${fmt(slant(dims.r, dims.H))} ${u}` : "none"}
              colour="text-yellow-200"
            />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-center text-xs text-white/60 tabular-nums">
            <div>
              V = {parts.vText} = {parts.v.map(fmt).join(" + ")}
            </div>
            <div className="mt-0.5">
              S = {parts.sText} = {parts.s.map(fmt).join(" + ")}
            </div>
          </div>
          <Stepper label="Radius r" unit={u} colour={COL.solid} value={dims.r} range={R_RANGE} onChange={(v) => setDim("r", v)} />
          <Stepper label={info.hLabel} unit={u} colour={COL.cone} value={dims.h} range={H_RANGE} onChange={(v) => setDim("h", v)} />
          {solid === "tent" && <Stepper label="Cone height H" unit={u} colour={COL.cap} value={dims.H} range={CAP_RANGE} onChange={(v) => setDim("H", v)} />}
          {round && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex gap-2">
                <input
                  inputMode="decimal"
                  size={6}
                  value={guess}
                  onChange={(e) => {
                    setGuess(e.target.value);
                    setChecked(null);
                  }}
                  placeholder="Your answer"
                  aria-label="Your answer"
                  className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white tabular-nums"
                />
                <span className="self-center text-sm text-white/60">{round.unit}</span>
                <button className="btn-primary !px-4 !py-2 text-sm" onClick={check} disabled={!guess.trim()}>
                  Check
                </button>
              </div>
              {checked !== null && (
                <p className={`mt-2 text-sm ${checked ? "text-lime-300" : "text-amber-200"}`}>
                  {checked ? `Spot on! The answer is about ${round.answer} ${round.unit}.` : "Not close enough yet. Check which parts you added, and your multiplication."}
                </p>
              )}
            </div>
          )}
          <p className="text-center text-xs text-white/40">π = 22/7. Only the outside surface is counted: hidden joins{solid === "tent" ? " and the tent floor" : ""} are left out.</p>
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label={src === "cone" ? "One cone" : "One ball"} value={`${fmt(pourVolume(src))} cm³`} colour="text-pink-200" />
            <Readout label="Glass holds" value={`${fmt(glassVolume())} cm³`} colour="text-cyan-200" />
            <Readout label="Glass full" value={fill > 1 + 1e-9 ? "spilling!" : `${Math.round(fill * 100)}%`} colour={Math.abs(fill - 1) < 1e-9 ? "text-lime-200" : "text-white"} />
          </div>
          <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="What to pour from">
            {(["cone", "ball"] as const).map((s) => (
              <button
                key={s}
                aria-pressed={src === s}
                onClick={() => {
                  setSrc(s);
                  setPours(0);
                }}
                className={`rounded-xl border px-2 py-2 text-sm ${src === s ? "border-cyan-300 bg-cyan-300/15 text-white" : "border-white/10 text-white/70"}`}
              >
                {s === "cone" ? "🍦 Cone" : "⚽ Ball"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button className="btn-primary !py-2 text-sm" onClick={() => setPours((n) => Math.min(n + 1, 6))} disabled={fill > 1 + 1e-9}>
              Pour one {src}
            </button>
            <button className="btn-ghost !py-2 text-sm" onClick={() => setPours(0)}>
              Empty the glass
            </button>
          </div>
          <p className="text-center text-xs text-white/40">
            The glass: r = {GLASS.r} cm, h = {GLASS.h} cm. The cone has the same base and height; the ball (r = {GLASS.r} cm) just fits inside. Pours so far: {pours}.
          </p>
        </>
      )}
    </div>
  );
}

/** The parts of each solid, for the formula line under the readouts. */
function partsOf(id: SolidId, { r, h, H }: SolidDims) {
  switch (id) {
    case "icecream":
      return {
        vText: "(1 ÷ 3)πr²h + (2 ÷ 3)πr³",
        v: [cone.volume(r, h), hemisphere.volume(r)],
        sText: "πrl + 2πr²",
        s: [cone.curved(r, h), hemisphere.curved(r)],
      };
    case "capsule":
      return {
        vText: "πr²h + (4 ÷ 3)πr³",
        v: [cylinder.volume(r, h), 2 * hemisphere.volume(r)],
        sText: "2πrh + 4πr²",
        s: [cylinder.curved(r, h), 2 * hemisphere.curved(r)],
      };
    case "tent":
      return {
        vText: "πr²h + (1 ÷ 3)πr²H",
        v: [cylinder.volume(r, h), cone.volume(r, H)],
        sText: "2πrh + πrl",
        s: [cylinder.curved(r, h), cone.curved(r, H)],
      };
    case "cylinder":
      return { vText: "πr²h", v: [cylinder.volume(r, h)], sText: "2πrh + 2πr²", s: [cylinder.curved(r, h), 2 * PI * r * r] };
  }
}

function Readout({ label, value, colour }: { label: string; value: string; colour: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] tracking-wider text-white/50">{label}</div>
      <div className={`truncate font-display text-sm tabular-nums sm:text-lg ${colour}`}>{value}</div>
    </div>
  );
}

function Stepper(p: { label: string; unit: string; colour: string; value: number; range: { min: number; max: number; step: number }; onChange: (v: number) => void }) {
  const set = (v: number) => p.onChange(Math.min(p.range.max, Math.max(p.range.min, tidy(v))));
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="flex justify-between text-sm">
        <span style={{ color: p.colour }}>{p.label}</span>
        <span className="tabular-nums text-white">
          {p.value} {p.unit}
        </span>
      </div>
      <input
        type="range"
        aria-label={p.label}
        className="range mt-1 w-full"
        min={p.range.min}
        max={p.range.max}
        step={p.range.step}
        value={p.value}
        onChange={(e) => set(Number(e.target.value))}
      />
      <div className="mt-1 flex justify-between gap-2">
        {[-1, -0.1, 0.1, 1].map((s) => (
          <button
            key={s}
            aria-label={`${s > 0 ? "Increase" : "Decrease"} ${p.label} by ${Math.abs(s)}`}
            onClick={() => set(p.value + s)}
            className="h-8 flex-1 rounded-lg border border-white/10 text-xs text-white/70 tabular-nums"
          >
            {s > 0 ? "+" : "−"}
            {Math.abs(s)}
          </button>
        ))}
      </div>
    </div>
  );
}

type Box = { X: (x: number) => number; Y: (y: number) => number; k: number };

/** Fit a world box [x0, x1] × [y0, y1] (y up) into the canvas, leaving room for labels. */
function fit(w: number, h: number, x0: number, x1: number, y0: number, y1: number): Box {
  const padL = 30;
  const padR = 90;
  const padT = 22;
  const padB = 22;
  const k = Math.min((w - padL - padR) / (x1 - x0), (h - padT - padB) / (y1 - y0));
  const ox = padL + (w - padL - padR - (x1 - x0) * k) / 2 - x0 * k;
  const oy = padT + (h - padT - padB - (y1 - y0) * k) / 2 + y1 * k;
  return { X: (x) => ox + x * k, Y: (y) => oy - y * k, k };
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, colour: string, align: CanvasTextAlign = "left") {
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = align;
  const tw = ctx.measureText(text).width;
  // Keep every label inside the canvas.
  const cw = ctx.canvas.clientWidth;
  const ch = ctx.canvas.clientHeight;
  const want = align === "left" ? x : align === "right" ? x - tw : x - tw / 2;
  const left = Math.max(3, Math.min(cw - tw - 3, want));
  y = Math.max(13, Math.min(ch - 4, y));
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(10,13,28,0.8)";
  ctx.fillRect(left - 2, y - 11, tw + 4, 15);
  ctx.fillStyle = colour;
  ctx.fillText(text, left, y);
  ctx.textAlign = "left";
}

function shape(ctx: CanvasRenderingContext2D, colour: string, draw: () => void) {
  ctx.fillStyle = colour + "33";
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2;
  ctx.beginPath();
  draw();
  ctx.fill();
  ctx.stroke();
}

function drawSolid(ctx: CanvasRenderingContext2D, w: number, h: number, id: SolidId, { r, h: hh, H }: SolidDims, u: string) {
  const fmtU = (v: number) => `${fmt(v)} ${u}`;
  if (id === "capsule") {
    // Lying down: cylinder from −hh/2 to hh/2, hemispheres at the ends.
    // Fit into a slightly shorter box, leaving room for the length line underneath.
    const b = fit(w, h - 18, -hh / 2 - r, hh / 2 + r, -r, r);
    const { X, Y, k } = b;
    shape(ctx, COL.solid, () => {
      ctx.moveTo(X(-hh / 2), Y(r));
      ctx.lineTo(X(hh / 2), Y(r));
      ctx.arc(X(hh / 2), Y(0), r * k, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(X(-hh / 2), Y(-r));
      ctx.arc(X(-hh / 2), Y(0), r * k, Math.PI / 2, (3 * Math.PI) / 2);
      ctx.closePath();
    });
    // Joins (hidden faces) as dashed lines.
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.moveTo(X(-hh / 2), Y(r));
    ctx.lineTo(X(-hh / 2), Y(-r));
    ctx.moveTo(X(hh / 2), Y(r));
    ctx.lineTo(X(hh / 2), Y(-r));
    ctx.stroke();
    ctx.setLineDash([]);
    radius(ctx, X(hh / 2), Y(0), X(hh / 2), Y(r), `r = ${fmtU(r)}`);
    const dimY = Y(-r) + 12;
    dimension(ctx, X(-hh / 2), dimY, X(hh / 2), dimY, `h = ${fmtU(hh)}`, "below");
    return;
  }
  if (id === "icecream") {
    const b = fit(w, h, -r, r, 0, hh + r);
    const { X, Y, k } = b;
    shape(ctx, "#f59e0b", () => {
      ctx.moveTo(X(0), Y(0));
      ctx.lineTo(X(r), Y(hh));
      ctx.lineTo(X(-r), Y(hh));
      ctx.closePath();
    });
    // Waffle lines on the cone.
    ctx.strokeStyle = "rgba(245,158,11,0.35)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      const f = i / 6;
      ctx.beginPath();
      ctx.moveTo(X(-r * f), Y(hh * f));
      ctx.lineTo(X(r * f), Y(hh * f));
      ctx.stroke();
    }
    shape(ctx, COL.cone, () => {
      ctx.moveTo(X(-r), Y(hh));
      ctx.arc(X(0), Y(hh), r * k, Math.PI, 0);
      ctx.closePath();
    });
    radius(ctx, X(0), Y(hh), X(r), Y(hh), `r = ${fmtU(r)}`, true);
    dimension(ctx, X(r) + 14, Y(0), X(r) + 14, Y(hh), `h = ${fmtU(hh)}`, "right");
    label(ctx, `l = ${fmtU(slant(r, hh))}`, X(-r / 2) - 6, Y(hh / 2), "#fcd34d", "right");
    return;
  }
  if (id === "tent") {
    const b = fit(w, h, -r, r, 0, hh + H);
    const { X, Y } = b;
    shape(ctx, COL.solid, () => {
      ctx.rect(X(-r), Y(hh), X(r) - X(-r), Y(0) - Y(hh));
    });
    shape(ctx, COL.cap, () => {
      ctx.moveTo(X(-r), Y(hh));
      ctx.lineTo(X(0), Y(hh + H));
      ctx.lineTo(X(r), Y(hh));
      ctx.closePath();
    });
    // Door flap.
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.moveTo(X(0), Y(0));
    ctx.lineTo(X(0), Y(hh * 0.7));
    ctx.stroke();
    radius(ctx, X(0), Y(hh), X(r), Y(hh), `r = ${fmtU(r)}`);
    dimension(ctx, X(r) + 14, Y(0), X(r) + 14, Y(hh), `h = ${fmtU(hh)}`, "right");
    dimension(ctx, X(r) + 14, Y(hh), X(r) + 14, Y(hh + H), `H = ${fmtU(H)}`, "right");
    label(ctx, `l = ${fmtU(slant(r, H))}`, X(-r / 2) - 6, Y(hh + H / 2), "#fcd34d", "right");
    return;
  }
  // Cylinder tub, with an ellipse on top for depth.
  const b = fit(w, h, -r, r, 0, hh);
  const { X, Y, k } = b;
  const ey = Math.min(r * k * 0.25, 14);
  shape(ctx, COL.solid, () => {
    ctx.moveTo(X(-r), Y(hh));
    ctx.lineTo(X(-r), Y(0));
    ctx.ellipse(X(0), Y(0), r * k, ey, 0, Math.PI, 0, true);
    ctx.lineTo(X(r), Y(hh));
    ctx.closePath();
  });
  ctx.strokeStyle = COL.solid;
  ctx.beginPath();
  ctx.ellipse(X(0), Y(hh), r * k, ey, 0, 0, Math.PI * 2);
  ctx.stroke();
  radius(ctx, X(0), Y(hh), X(r), Y(hh), `r = ${fmtU(r)}`);
  dimension(ctx, X(r) + 14, Y(0), X(r) + 14, Y(hh), `h = ${fmtU(hh)}`, "right");
}

/** A radius line with its label above it (or below when `below`). */
function radius(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, text: string, below = false) {
  ctx.strokeStyle = COL.label;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.fillStyle = COL.label;
  ctx.beginPath();
  ctx.arc(x0, y0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  const vertical = Math.abs(x1 - x0) < 1;
  if (vertical) label(ctx, text, x0 + 6, (y0 + y1) / 2 + 4, COL.label);
  else label(ctx, text, (x0 + x1) / 2, below ? y0 + 16 : y0 - 6, COL.label, "center");
}

/** A dimension line with end ticks and a label beside it. */
function dimension(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, text: string, side: "right" | "below") {
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  if (side === "right") {
    ctx.moveTo(x0 - 4, y0);
    ctx.lineTo(x0 + 4, y0);
    ctx.moveTo(x1 - 4, y1);
    ctx.lineTo(x1 + 4, y1);
  } else {
    ctx.moveTo(x0, y0 - 4);
    ctx.lineTo(x0, y0 + 4);
    ctx.moveTo(x1, y1 - 4);
    ctx.lineTo(x1, y1 + 4);
  }
  ctx.stroke();
  if (side === "right") label(ctx, text, x0 + 6, (y0 + y1) / 2 + 4, "rgba(255,255,255,0.85)");
  else label(ctx, text, (x0 + x1) / 2, y0 + 16, "rgba(255,255,255,0.85)", "center");
}

function drawPour(ctx: CanvasRenderingContext2D, w: number, h: number, src: PourSource, pours: number, fill: number) {
  // Same scale for the source and the glass, so their sizes compare honestly.
  const k = Math.min((h - 60) / GLASS.h, (w - 80) / (4 * GLASS.r + 3));
  const r = GLASS.r * k;
  const gh = GLASS.h * k;
  const baseY = h - 30;
  const srcX = w * 0.28;
  const glassX = w * 0.7;

  // Source: a cone of water (tip down) or a ball of water.
  ctx.fillStyle = COL.water + "55";
  ctx.strokeStyle = COL.water;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (src === "cone") {
    ctx.moveTo(srcX, baseY);
    ctx.lineTo(srcX + r, baseY - gh);
    ctx.lineTo(srcX - r, baseY - gh);
    ctx.closePath();
  } else ctx.arc(srcX, baseY - r, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText(src === "cone" ? "cone" : "ball", srcX, baseY + 18);

  // Arrow from source to glass.
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(srcX + r + 8, baseY - gh - 6);
  ctx.quadraticCurveTo((srcX + glassX) / 2, baseY - gh - 30, glassX - r - 4, baseY - gh - 6);
  ctx.stroke();
  ctx.setLineDash([]);

  // The glass and its water.
  const level = Math.min(fill, 1) * gh;
  ctx.fillStyle = COL.water + "88";
  ctx.fillRect(glassX - r, baseY - level, 2 * r, level);
  if (fill > 1 + 1e-9) {
    // Spill down both sides.
    ctx.fillStyle = COL.water + "66";
    ctx.fillRect(glassX - r - 5, baseY - gh, 5, gh);
    ctx.fillRect(glassX + r, baseY - gh, 5, gh);
    ctx.fillRect(glassX - r - 20, baseY - 3, 2 * r + 40, 3);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(glassX - r, baseY - gh);
  ctx.lineTo(glassX - r, baseY);
  ctx.lineTo(glassX + r, baseY);
  ctx.lineTo(glassX + r, baseY - gh);
  ctx.stroke();
  // Marks at thirds.
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "left";
  for (const [f, t] of [
    [1 / 3, "1/3"],
    [2 / 3, "2/3"],
    [1, "full"],
  ] as const) {
    const y = baseY - f * gh;
    ctx.strokeStyle = "rgba(250,204,21,0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(glassX + r - 8, y);
    ctx.lineTo(glassX + r + 4, y);
    ctx.stroke();
    ctx.fillStyle = "rgba(250,204,21,0.85)";
    ctx.fillText(t, glassX + r + 8, y + 4);
  }
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText(`glass · ${pours} poured`, glassX, baseY + 18);
  if (fill > 1 + 1e-9) {
    ctx.fillStyle = "#fb923c";
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.fillText("Spills over!", glassX, 18);
  } else if (Math.abs(fill - 1) < 1e-9) {
    ctx.fillStyle = "#a3e635";
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.fillText("Full to the brim", glassX, 18);
  }
  ctx.textAlign = "left";
}
