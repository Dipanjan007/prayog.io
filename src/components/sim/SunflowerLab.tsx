"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import {
  ANGLE,
  ARMS,
  MAX_TERMS,
  PHI,
  SEEDS,
  START,
  agreesWithPhi,
  armAnswers,
  armOf,
  isGoldenSetting,
  lastRatio,
  listRhythms,
  packing,
  seeds as seedsFor,
  sequence,
  smoothArms,
  spokes,
  turnFor,
  type GoldenRound,
} from "@/lib/sim/golden";

export type GoldenMode = "numbers" | "rhythms" | "sunflower";

export type GoldenReading =
  | { mode: "numbers"; a: number; b: number; terms: number; ratio: number; phi: boolean }
  | { mode: "rhythms"; beats: number; count: number }
  | { mode: "sunflower"; angle: number; seeds: number; colours: number; spokes: number | null; packing: number; golden: boolean; smooth: boolean }
  | { mode: "round"; ok: boolean };

interface Props {
  onReading?: (r: GoldenReading) => void;
  /** Challenge round: count rhythms, grow the best head, or find the spiral count. */
  round?: GoldenRound | null;
}

const MODES: { id: GoldenMode; label: string }[] = [
  { id: "numbers", label: "Numbers" },
  { id: "rhythms", label: "Rhythms" },
  { id: "sunflower", label: "Sunflower" },
];

const COL = { cyan: "#22d3ee", pink: "#f472b6", lime: "#a3e635", violet: "#a78bfa", amber: "#facc15" };
/** The drum shows rhythms of up to this many beats. */
const DRUM_MAX = 6;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const fix1 = (v: number) => Math.round(v * 10) / 10;

export default function SunflowerLab({ onReading, round = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<GoldenMode>(round?.kind === "rhythm" ? "rhythms" : round ? "sunflower" : "numbers");
  const [a, setA] = useState(1);
  const [b, setB] = useState(1);
  const [terms, setTerms] = useState(3);
  const [beats, setBeats] = useState(3);
  const [angle, setAngle] = useState(round?.kind === "arms" ? 137.5 : 120);
  const [seedCount, setSeedCount] = useState(round && round.kind !== "rhythm" ? round.seeds : 200);
  const [colours, setColours] = useState(1);
  const [checked, setChecked] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const seq = useMemo(() => sequence(a, b, terms), [a, b, terms]);
  const ratio = lastRatio(seq);
  const turn = turnFor(angle);
  const spokeCount = spokes(angle);
  const golden = isGoldenSetting(angle);
  const score = useMemo(() => (mode === "sunflower" ? packing(seedCount, turn) : 0), [mode, seedCount, turn]);
  const smooth = smoothArms(colours, turn);
  const rhythmList = useMemo(() => listRhythms(beats), [beats]);

  useEffect(() => {
    if (round) return;
    if (mode === "numbers") onReadingRef.current?.({ mode, a, b, terms, ratio, phi: agreesWithPhi(ratio) });
    else if (mode === "rhythms") onReadingRef.current?.({ mode, beats, count: rhythmList.length });
    else onReadingRef.current?.({ mode, angle, seeds: seedCount, colours, spokes: spokeCount, packing: score, golden, smooth });
  }, [round, mode, a, b, terms, ratio, beats, rhythmList, angle, seedCount, colours, spokeCount, score, golden, smooth]);

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
    if (mode === "numbers") drawRatios(ctx, size.w, size.h, seq);
    else if (mode === "rhythms") drawRhythms(ctx, size.w, size.h, beats, rhythmList);
    else drawHead(ctx, size.w, size.h, seedCount, turn, colours, spokeCount);
  }, [size, mode, seq, beats, rhythmList, seedCount, turn, colours, spokeCount]);

  const send = (ok: boolean) => {
    setChecked(ok);
    onReadingRef.current?.({ mode: "round", ok });
  };

  const canvas = (
    <canvas
      ref={canvasRef}
      className="h-60 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-72"
      role="img"
      aria-label={
        mode === "numbers"
          ? `Ratios of neighbours for ${terms} terms starting ${a}, ${b}: last ratio ${Number.isFinite(ratio) ? ratio.toFixed(3) : "none"}`
          : mode === "rhythms"
            ? `${rhythmList.length} rhythms of ${beats} beats`
            : `Sunflower head of ${seedCount} seeds turned ${angle.toFixed(1)}° each, painted in ${colours} colours`
      }
    />
  );

  const angleControls = (
    <>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <button className="btn-ghost !px-4 !py-2 text-lg" aria-label="Turn 0.1° less" onClick={() => setAngle((v) => clamp(fix1(v - ANGLE.step), ANGLE.min, ANGLE.max))}>
          −
        </button>
        <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <div className="flex justify-between text-sm">
            <span style={{ color: COL.amber }}>Turn per seed</span>
            <span className="tabular-nums text-white">{angle.toFixed(1)}°</span>
          </div>
          <input
            type="range"
            aria-label="Turn per seed"
            className="range mt-1 w-full"
            min={ANGLE.min}
            max={ANGLE.max}
            step={ANGLE.step}
            value={angle}
            onChange={(e) => {
              setAngle(fix1(Number(e.target.value)));
              setChecked(null);
            }}
          />
        </label>
        <button className="btn-ghost !px-4 !py-2 text-lg" aria-label="Turn 0.1° more" onClick={() => setAngle((v) => clamp(fix1(v + ANGLE.step), ANGLE.min, ANGLE.max))}>
          +
        </button>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {[120, 135, 144, 150].map((v) => (
          <button key={v} onClick={() => setAngle(v)} aria-label={`Set turn to ${v}°`} className={`rounded-lg border py-1.5 text-sm tabular-nums ${angle === v ? "border-amber-300 bg-amber-300/15" : "border-white/10 text-white/70"}`}>
            {v}°
          </button>
        ))}
      </div>
    </>
  );

  const colourControls = (
    <Stepper
      label="Colours"
      value={colours}
      onDown={() => {
        setColours((k) => Math.max(ARMS.min, k - 1));
        setChecked(null);
      }}
      onUp={() => {
        setColours((k) => Math.min(ARMS.max, k + 1));
        setChecked(null);
      }}
      min={ARMS.min}
      max={ARMS.max}
    />
  );

  if (round) {
    return (
      <div className="flex flex-col gap-3 select-none">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
          <div className="text-[11px] tracking-wider text-white/50">{round.name}</div>
          <div className="mt-1 text-sm text-cyan-100">{round.brief}</div>
        </div>
        {canvas}
        {round.kind === "rhythm" && (
          <>
            <Stepper label="Beats on the drum" value={beats} onDown={() => setBeats((v) => Math.max(1, v - 1))} onUp={() => setBeats((v) => Math.min(DRUM_MAX, v + 1))} min={1} max={DRUM_MAX} />
            <div className="grid grid-cols-4 gap-2">
              {round.options.map((o) => (
                <button key={o} className="btn-ghost !py-2 text-sm tabular-nums" aria-label={`Answer ${o} rhythms`} onClick={() => send(o === listRhythms(round.beats).length)}>
                  {o}
                </button>
              ))}
            </div>
          </>
        )}
        {round.kind === "pack" && (
          <>
            {angleControls}
            <div className="grid grid-cols-2 gap-2 text-center">
              <Readout label="Spokes" value={spokeCount ? `${spokeCount}` : "none"} colour="text-pink-200" />
              <Readout label="Packing" value={`${score}%`} colour="text-lime-200" />
            </div>
            <button className="btn-primary !py-2 text-sm" onClick={() => send(isGoldenSetting(angle))}>
              Grow {round.seeds} seeds
            </button>
          </>
        )}
        {round.kind === "arms" && (
          <>
            {colourControls}
            <button className="btn-primary !py-2 text-sm" onClick={() => send(armAnswers(round).includes(colours))}>
              Send {colours} spirals
            </button>
          </>
        )}
        {checked !== null && (
          <p className={`text-center text-sm ${checked ? "text-lime-300" : "text-amber-200"}`}>
            {checked
              ? round.kind === "rhythm"
                ? `Spot on! ${listRhythms(round.beats - 1).length} + ${listRhythms(round.beats - 2).length} = ${listRhythms(round.beats).length}.`
                : round.kind === "pack"
                  ? `Spot on! The golden angle packs ${round.seeds} seeds with no spokes and no gaps.`
                  : `Spot on! ${colours} smooth spirals, a Virahanka number.`
              : round.kind === "rhythm"
                ? "Not quite. A rhythm ends in a short beat or a long beat: add the counts for one and two beats fewer."
                : round.kind === "pack"
                  ? "Not quite. Look for no spokes and the highest packing score."
                  : "Not quite. Keep changing the colours until every colour makes one smooth curve."}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 select-none">
      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)} className={`rounded-xl py-2 ${mode === m.id ? "bg-white/10 text-white" : "text-white/50"}`}>
            {m.label}
          </button>
        ))}
      </div>

      {canvas}

      {mode === "numbers" && (
        <>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-center text-sm tabular-nums text-white/80 break-words" aria-label="The terms so far">
            {seq.join(", ")}
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Readout label="Last ÷ one before" value={Number.isFinite(ratio) ? `${seq[seq.length - 1]} ÷ ${seq[seq.length - 2]}` : "–"} colour="text-white" />
            <Readout label="Ratio" value={Number.isFinite(ratio) ? ratio.toFixed(3) : "–"} colour={agreesWithPhi(ratio) ? "text-lime-300" : "text-cyan-200"} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Stepper label="Start 1st" value={a} onDown={() => setA((v) => Math.max(START.min, v - 1))} onUp={() => setA((v) => Math.min(START.max, v + 1))} min={START.min} max={START.max} />
            <Stepper label="Start 2nd" value={b} onDown={() => setB((v) => Math.max(START.min, v - 1))} onUp={() => setB((v) => Math.min(START.max, v + 1))} min={START.min} max={START.max} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-primary !py-2 text-sm" onClick={() => setTerms((t) => Math.min(MAX_TERMS, t + 1))} disabled={terms >= MAX_TERMS}>
              Add a term
            </button>
            <button className="btn-ghost !py-2 text-sm" onClick={() => setTerms(3)}>
              Start again
            </button>
          </div>
          <p className="text-center text-xs text-white/40">
            {agreesWithPhi(ratio) ? `The ratio has settled at 1.618, the golden ratio φ.` : "Each new term is the last two added. Watch the ratio of the last two."}
          </p>
        </>
      )}

      {mode === "rhythms" && (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Readout label="Beats" value={`${beats}`} colour="text-white" />
            <Readout label="Rhythms" value={`${rhythmList.length}`} colour="text-lime-200" />
          </div>
          <Stepper label="Beats on the drum" value={beats} onDown={() => setBeats((v) => Math.max(1, v - 1))} onUp={() => setBeats((v) => Math.min(DRUM_MAX, v + 1))} min={1} max={DRUM_MAX} />
          <p className="text-center text-xs text-white/40">
            Short beat S lasts 1, long beat L lasts 2.
            {beats >= 3 ? ` Ending in S: ${listRhythms(beats - 1).length}. Ending in L: ${listRhythms(beats - 2).length}.` : ""}
          </p>
        </>
      )}

      {mode === "sunflower" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Spokes" value={spokeCount ? `${spokeCount}` : "none"} colour="text-pink-200" />
            <Readout label="Packing" value={`${score}%`} colour="text-lime-200" />
            <Readout label="Spiral arms" value={smooth ? `${colours}` : "–"} colour="text-violet-200" />
          </div>
          {angleControls}
          <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: COL.lime }}>Seeds</span>
              <span className="tabular-nums text-white">{seedCount}</span>
            </div>
            <input type="range" aria-label="Seeds" className="range mt-1 w-full" min={SEEDS.min} max={SEEDS.max} step={SEEDS.step} value={seedCount} onChange={(e) => setSeedCount(Number(e.target.value))} />
          </label>
          {colourControls}
          <p className="text-center text-xs text-white/40">
            {golden
              ? smooth
                ? `${colours} colours: every colour is one smooth spiral arm.`
                : "The golden angle: no spokes, no gaps. Now try painting it in different numbers of colours."
              : spokeCount
                ? `${angle}° is a simple fraction of a turn, so the seeds line up in ${spokeCount} spokes.`
                : "Hunt for the turn with the highest packing score."}
          </p>
        </>
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

function Stepper(p: { label: string; value: number; onDown: () => void; onUp: () => void; min: number; max: number }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-1.5">
      <button className="btn-ghost !px-3 !py-1.5 text-lg" aria-label={`${p.label} down`} onClick={p.onDown} disabled={p.value <= p.min}>
        −
      </button>
      <div className="text-center">
        <div className="text-[11px] text-white/50">{p.label}</div>
        <div className="tabular-nums text-white">{p.value}</div>
      </div>
      <button className="btn-ghost !px-3 !py-1.5 text-lg" aria-label={`${p.label} up`} onClick={p.onUp} disabled={p.value >= p.max}>
        +
      </button>
    </div>
  );
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, colour: string, align: CanvasTextAlign = "left", font = "12px system-ui, sans-serif") {
  ctx.font = font;
  ctx.fillStyle = colour;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.textAlign = "left";
}

/** Ratio of each term to the one before, plotted against the term number, with the φ line. */
function drawRatios(ctx: CanvasRenderingContext2D, w: number, h: number, seq: number[]) {
  const top = 14;
  const left = 36;
  const right = w - 12;
  const bottom = h - 28;
  const lo = 0.5;
  const hi = 2.5;
  const Y = (v: number) => bottom - ((bottom - top) * (clamp(v, lo, hi) - lo)) / (hi - lo);
  const X = (n: number) => left + ((right - left) * (n - 2)) / (MAX_TERMS - 2);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.stroke();
  for (const t of [0.5, 1, 1.5, 2, 2.5]) label(ctx, `${t}`, left - 6, Y(t) + 4, "rgba(255,255,255,0.5)", "right");
  for (const n of [2, 5, 10, 15, 20]) label(ctx, `${n}`, X(n), bottom + 14, "rgba(255,255,255,0.5)", n === 20 ? "right" : "center");
  label(ctx, "term number", (left + right) / 2, bottom + 26, "rgba(255,255,255,0.35)", "center", "11px system-ui, sans-serif");
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = COL.amber;
  ctx.beginPath();
  ctx.moveTo(left, Y(PHI));
  ctx.lineTo(right, Y(PHI));
  ctx.stroke();
  ctx.setLineDash([]);
  label(ctx, "φ ≈ 1.618", right - 2, Y(PHI) - 6, COL.amber, "right");
  ctx.strokeStyle = COL.cyan;
  ctx.fillStyle = COL.cyan;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let n = 2; n <= seq.length; n++) {
    const y = Y(seq[n - 1] / seq[n - 2]);
    if (n === 2) ctx.moveTo(X(n), y);
    else ctx.lineTo(X(n), y);
  }
  ctx.stroke();
  for (let n = 2; n <= seq.length; n++) {
    const r = seq[n - 1] / seq[n - 2];
    ctx.fillStyle = agreesWithPhi(r) ? COL.lime : COL.cyan;
    ctx.beginPath();
    ctx.arc(X(n), Y(r), n === seq.length ? 4.5 : 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  label(ctx, "ratio of neighbours", left + 6, top + 10, COL.cyan);
}

/** Every rhythm of the given beats: short beats as small cyan blocks, long ones as wide violet blocks. */
function drawRhythms(ctx: CanvasRenderingContext2D, w: number, h: number, beats: number, list: string[]) {
  const top = 26;
  const rowH = Math.min(26, (h - top - 8) / list.length);
  const unit = Math.min(44, (w - 40) / DRUM_MAX);
  const x0 = (w - unit * beats) / 2;
  label(ctx, `${list.length} rhythms of ${beats} beat${beats > 1 ? "s" : ""}`, w / 2, 17, "rgba(255,255,255,0.75)", "center", "bold 13px system-ui, sans-serif");
  list.forEach((r, i) => {
    let x = x0;
    const y = top + i * rowH;
    for (const c of r) {
      const len = c === "S" ? 1 : 2;
      ctx.fillStyle = c === "S" ? COL.cyan + "bb" : COL.violet + "bb";
      ctx.beginPath();
      ctx.roundRect(x + 1.5, y + 1.5, unit * len - 3, rowH - 3, 4);
      ctx.fill();
      if (rowH >= 14) label(ctx, c, x + (unit * len) / 2, y + rowH / 2 + 4, "#0a0d1c", "center", "bold 11px system-ui, sans-serif");
      x += unit * len;
    }
  });
}

/** A sunflower head: seed i turned i × the angle, at distance √(i + 0.5), painted by arm. */
function drawHead(ctx: CanvasRenderingContext2D, w: number, h: number, count: number, turn: number, colours: number, spokeCount: number | null) {
  const pts = seedsFor(count, turn);
  const R = Math.min(w, h) / 2 - 8;
  const scale = R / Math.sqrt(count + 0.5);
  const cx = w / 2;
  const cy = h / 2;
  const dot = Math.max(1.5, scale * 0.75);
  pts.forEach((p, i) => {
    ctx.fillStyle = colours > 1 ? `hsl(${(360 * armOf(i, colours)) / colours}, 85%, 62%)` : COL.amber;
    ctx.beginPath();
    ctx.arc(cx + p.x * scale, cy + p.y * scale, dot, 0, Math.PI * 2);
    ctx.fill();
  });
  label(ctx, spokeCount ? `${spokeCount} spokes` : "no spokes", 8, 16, spokeCount ? COL.pink : COL.lime);
  label(ctx, `${count} seeds`, 8, h - 8, "rgba(255,255,255,0.5)");
}
