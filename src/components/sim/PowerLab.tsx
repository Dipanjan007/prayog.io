"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import {
  BASES,
  BIG_ITEMS,
  EXP,
  FOLDS,
  LANDMARKS,
  SCI_EXP,
  fmtLength,
  foldOk,
  foldsToReach,
  indian,
  isStandard,
  layers,
  mantissa,
  passed,
  powerValue,
  productPower,
  quotientChips,
  sup,
  thicknessMm,
  type FoldTarget,
} from "@/lib/sim/powers";

export type PowerMode = "fold" | "laws" | "sci";
export type LawOp = "mul" | "div";

export type PowerReading =
  | { mode: "fold"; n: number; mm: number }
  | { mode: "laws"; op: LawOp; base: number; m: number; n: number }
  | { mode: "sci"; item: string; e: number; ok: boolean }
  | { mode: "target"; n: number; ok: boolean };

interface Props {
  onReading?: (r: PowerReading) => void;
  /** Challenge: fold just enough to pass this target; the thickness stays hidden until you fold. */
  target?: FoldTarget | null;
}

const MODES: { id: PowerMode; label: string }[] = [
  { id: "fold", label: "Fold" },
  { id: "laws", label: "Laws" },
  { id: "sci", label: "Big numbers" },
];
const CYAN = "#22d3ee";
const PINK = "#f472b6";
const LIME = "#a3e635";
const VIOLET = "#a78bfa";
/** The log ruler runs from 0.1 mm (10⁻¹) to 10¹⁴ mm. */
const LOG_MIN = -1;
const LOG_MAX = 14;

export default function PowerLab({ onReading, target = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<PowerMode>("fold");
  const [folds, setFolds] = useState(target ? 0 : 3);
  const [op, setOp] = useState<LawOp>("mul");
  const [base, setBase] = useState<number>(2);
  const [m, setM] = useState(3);
  const [n, setN] = useState(2);
  const [itemId, setItemId] = useState(BIG_ITEMS[0].id);
  const [e, setE] = useState(0);
  const [folded, setFolded] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: PowerMode = target ? "fold" : mode;
  const item = BIG_ITEMS.find((x) => x.id === itemId)!;
  const ok = isStandard(item.value, e);
  const mm = thicknessMm(folds);

  useEffect(() => {
    if (target) return;
    if (activeMode === "fold") onReadingRef.current?.({ mode: "fold", n: folds, mm });
    else if (activeMode === "laws") onReadingRef.current?.({ mode: "laws", op, base, m, n });
    else onReadingRef.current?.({ mode: "sci", item: itemId, e, ok });
  }, [target, activeMode, folds, mm, op, base, m, n, itemId, e, ok]);

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
    if (activeMode === "fold") drawFold(ctx, size.w, size.h, folds, target, folded);
    else if (activeMode === "laws") drawLaws(ctx, size.w, size.h, op, base, m, n);
    else drawSci(ctx, size.w, size.h, item.value, e);
  }, [size, activeMode, folds, target, folded, op, base, m, n, item.value, e]);

  const fold = () => {
    if (!target) return;
    const good = foldOk(target, folds);
    setFolded(good);
    onReadingRef.current?.({ mode: "target", n: folds, ok: good });
  };

  const hidden = target !== null && folded === null;
  const top = passed(folds);
  const ariaLabel =
    activeMode === "fold"
      ? hidden
        ? `Target ${target!.name}, ${target!.label}; ${folds} folds chosen, height hidden until you fold`
        : `${folds} folds: ${indian(layers(folds))} layers, ${fmtLength(mm)} thick`
      : activeMode === "laws"
        ? `${base} to the power ${m} ${op === "mul" ? "times" : "divided by"} ${base} to the power ${n}`
        : `${item.name}: ${indian(item.value)} ${item.unit} written as ${mantissa(item.value, e)} times 10 to the power ${e}`;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!target && (
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {MODES.map((x) => (
            <button key={x.id} onClick={() => setMode(x.id)} className={`rounded-xl py-2 ${activeMode === x.id ? "bg-white/10 text-white" : "text-white/50"}`}>
              {x.label}
            </button>
          ))}
        </div>
      )}

      <canvas ref={canvasRef} className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80" role="img" aria-label={ariaLabel} />

      {activeMode === "fold" ? (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Folds n" value={`${folds}`} colour="text-white" />
            <Readout label="Layers 2ⁿ" value={hidden ? "?" : `2${sup(folds)}`} colour="text-violet-200" />
            <Readout label="Thickness" value={hidden ? "?" : fmtLength(mm)} colour="text-cyan-200" />
          </div>
          {!target && (
            <p className="text-center text-sm text-white/70 tabular-nums">
              0.1 mm × 2{sup(folds)} = 0.1 mm × {indian(layers(folds))} = {fmtLength(mm)}
              {top ? ` · taller than ${top.name} ${top.emoji}` : ""}
            </p>
          )}
          <Stepper label="Number of folds" value={folds} min={FOLDS.min} max={FOLDS.max} steps={[1, 10]} onChange={(v) => {
            setFolds(v);
            setFolded(null);
          }} />
          {target && (
            <>
              <button className="btn-primary !py-2 text-sm" onClick={fold}>
                Fold {folds} times
              </button>
              {folded !== null && (
                <p className={`text-center text-sm ${folded ? "text-lime-300" : "text-amber-200"}`}>
                  {folded
                    ? `Just enough! ${folds} folds make ${fmtLength(mm)}, and ${folds - 1} folds would be only ${fmtLength(thicknessMm(folds - 1))}.`
                    : mm < target.mm
                      ? `Too short: ${folds} folds make only ${fmtLength(mm)}. The target is ${target.label}.`
                      : `It passes, but with folds to spare: ${folds - 1} folds already make ${fmtLength(thicknessMm(folds - 1))}. Try fewer.`}
                </p>
              )}
              {folded === false && Math.abs(folds - foldsToReach(target.mm)) > 4 && (
                <p className="text-center text-xs text-white/40">Tip: every 10 folds multiply the height by about 1000.</p>
              )}
            </>
          )}
        </>
      ) : activeMode === "laws" ? (
        <LawControls op={op} base={base} m={m} n={n} onOp={setOp} onBase={setBase} onM={setM} onN={setN} />
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {BIG_ITEMS.map((x) => (
              <button
                key={x.id}
                onClick={() => {
                  setItemId(x.id);
                  setE(0);
                }}
                aria-pressed={itemId === x.id}
                className={`flex-1 rounded-xl border px-2 py-2 text-xs ${itemId === x.id ? "border-cyan-300 bg-cyan-300/15 text-white" : "border-white/10 text-white/70"}`}
              >
                {x.name}
              </button>
            ))}
          </div>
          <div
            className={`rounded-2xl border px-4 py-2 text-center text-sm tabular-nums ${
              ok ? "border-lime-300/40 bg-lime-300/10 text-lime-100" : "border-white/10 bg-white/[0.03] text-white/70"
            }`}
          >
            {indian(item.value)} {item.unit} = {mantissa(item.value, e)} × 10{sup(e)}
            <div className="mt-0.5 text-xs">
              {ok
                ? "✓ Scientific notation: one digit (not 0) before the point."
                : Number(mantissa(item.value, e)) >= 10
                  ? "Too many digits before the point. Move it left."
                  : "The front number is less than 1. Move the point right."}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost !py-2 text-sm" disabled={e >= SCI_EXP.max} onClick={() => setE((v) => Math.min(SCI_EXP.max, v + 1))}>
              ← Move point left
            </button>
            <button className="btn-ghost !py-2 text-sm" disabled={e <= SCI_EXP.min} onClick={() => setE((v) => Math.max(SCI_EXP.min, v - 1))}>
              Move point right →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function LawControls(p: {
  op: LawOp;
  base: number;
  m: number;
  n: number;
  onOp: (v: LawOp) => void;
  onBase: (v: number) => void;
  onM: (v: number) => void;
  onN: (v: number) => void;
}) {
  const { op, base, m, n } = p;
  const k = op === "mul" ? productPower(m, n) : quotientChips(m, n).power;
  const v = powerValue(base, k);
  const sign = op === "mul" ? "×" : "÷";
  const exp = op === "mul" ? `${sup(m)}⁺${sup(n)}` : `${sup(m)}⁻${sup(n)}`;
  const value = v.bottom === 1 ? indian(v.top) : `1/${indian(v.bottom)}`;
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["mul", "div"] as const).map((o) => (
            <button
              key={o}
              aria-label={o === "mul" ? "Multiply" : "Divide"}
              aria-pressed={op === o}
              onClick={() => p.onOp(o)}
              className={`rounded-xl py-1.5 text-base ${op === o ? "bg-white/10 text-white" : "text-white/50"}`}
            >
              {o === "mul" ? "×" : "÷"}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {BASES.map((b) => (
            <button
              key={b}
              aria-label={`Base ${b}`}
              aria-pressed={base === b}
              onClick={() => p.onBase(b)}
              className={`rounded-xl py-1.5 tabular-nums ${base === b ? "bg-white/10 text-white" : "text-white/50"}`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-center text-sm tabular-nums break-words text-white/80">
        {base}
        {sup(m)} {sign} {base}
        {sup(n)} = {base}
        <span className="text-white/50">{`⁽${exp}⁾`}</span> = {base}
        {sup(k)} = <span className="text-lime-200">{value}</span>
      </div>
      <Stepper label="Power m" value={m} min={EXP.min} max={EXP.max} steps={[1]} onChange={p.onM} />
      <Stepper label="Power n" value={n} min={EXP.min} max={EXP.max} steps={[1]} onChange={p.onN} />
    </>
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

/** A slider with − and + buttons for touch screens. */
function Stepper(p: { label: string; value: number; min: number; max: number; steps: number[]; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.min(p.max, Math.max(p.min, v));
  const deltas = [...p.steps.map((s) => -s).reverse(), ...p.steps];
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2">
      <div className="flex justify-between text-sm">
        <span className="text-cyan-200">{p.label}</span>
        <span className="tabular-nums text-white">{p.value}</span>
      </div>
      <input
        type="range"
        aria-label={p.label}
        className="range mt-1 w-full"
        min={p.min}
        max={p.max}
        step={1}
        value={p.value}
        onChange={(ev) => p.onChange(Number(ev.target.value))}
      />
      <div className="mt-1 flex gap-2">
        {deltas.map((s) => (
          <button
            key={s}
            aria-label={`${p.label} ${s > 0 ? "plus" : "minus"} ${Math.abs(s)}`}
            onClick={() => p.onChange(clamp(p.value + s))}
            className="h-9 flex-1 rounded-lg border border-white/10 text-sm text-white/70 tabular-nums"
          >
            {s > 0 ? "+" : "−"}
            {Math.abs(s)}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Fold mode: on the left, the folded sheet with its layers; on the right, a log ruler
 * where each step up is 10 times taller, with landmarks and the stack's height.
 */
function drawFold(ctx: CanvasRenderingContext2D, w: number, h: number, n: number, target: FoldTarget | null, folded: boolean | null) {
  const hidden = target !== null && folded === null;
  const mm = thicknessMm(n);
  const pad = 14;
  const split = Math.max(92, Math.min(150, w * 0.3));

  // Left: the folded sheet, drawn as a block of layers (up to 64 lines, then solid).
  const L = layers(n);
  const sheetW = split - 2 * pad;
  const maxH = h - 2 * pad - 30;
  const blockH = Math.max(4, Math.min(maxH, 4 + Math.log2(L) * (maxH / 18)));
  const bx = pad;
  const by = h - pad - 22 - blockH;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(bx, by, sheetW, blockH);
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, sheetW - 1, blockH - 1);
  if (L > 1 && L <= 64 && blockH / L >= 2) {
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    for (let i = 1; i < L; i++) {
      const y = by + (blockH * i) / L;
      ctx.moveTo(bx, y);
      ctx.lineTo(bx + sheetW, y);
    }
    ctx.stroke();
  } else if (L > 64) {
    const g = ctx.createLinearGradient(bx, by, bx, by + blockH);
    g.addColorStop(0, "rgba(167,139,250,0.35)");
    g.addColorStop(1, "rgba(34,211,238,0.35)");
    ctx.fillStyle = g;
    ctx.fillRect(bx + 1, by + 1, sheetW - 2, blockH - 2);
  }
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(hidden ? `${n} folds` : `2${sup(n)} layers`, bx + sheetW / 2, h - pad - 4);
  ctx.fillText("the sheet", bx + sheetW / 2, by - 6);

  // Right: the log ruler.
  const x0 = split + 46;
  const top = pad + 6;
  const bottom = h - pad - 6;
  const yOf = (v: number) => bottom - ((Math.log10(v) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * (bottom - top);
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, top);
  ctx.lineTo(x0, bottom);
  for (let p = LOG_MIN; p <= LOG_MAX; p++) {
    const y = yOf(10 ** p);
    ctx.moveTo(x0 - 4, y);
    ctx.lineTo(x0, y);
  }
  ctx.stroke();
  ctx.font = "10px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  const ticks: [number, string][] = [
    [0, "1 mm"],
    [3, "1 m"],
    [6, "1 km"],
    [9, "1000 km"],
    [12, "10⁶ km"],
  ];
  for (const [p, label] of ticks) ctx.fillText(label, x0 - 6, yOf(10 ** p) + 3);

  // Landmarks (or just the challenge target).
  const marks = target ? [{ name: target.name, label: target.label, mm: target.mm, emoji: "🎯" }] : LANDMARKS;
  ctx.textAlign = "left";
  ctx.font = "11px system-ui, sans-serif";
  for (const l of marks) {
    const y = yOf(l.mm);
    const beaten = !hidden && mm >= l.mm;
    ctx.strokeStyle = beaten ? LIME : "rgba(255,255,255,0.3)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(w - pad, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = beaten ? LIME : "rgba(255,255,255,0.75)";
    const text = target ? `${l.emoji} ${l.name} · ${l.label}` : `${l.emoji} ${l.name}`;
    const room = w - pad - (x0 + 26);
    ctx.fillText(clip(ctx, text, room), x0 + 26, y - 3);
  }

  // The stack's height on the ruler.
  if (!hidden) {
    const y = Math.max(top, yOf(mm));
    ctx.fillStyle = (folded === false ? "#fb7185" : CYAN) + "88";
    ctx.fillRect(x0 + 4, y, 16, bottom - y);
    ctx.strokeStyle = folded === false ? "#fb7185" : CYAN;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x0 + 24, y);
    ctx.stroke();
  }
  ctx.textAlign = "left";
}

/** Shorten text with "…" so it fits in `room` pixels. */
function clip(ctx: CanvasRenderingContext2D, text: string, room: number) {
  if (ctx.measureText(text).width <= room) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > room) t = t.slice(0, -1);
  return t + "…";
}

/** Laws mode: chips for each copy of the base. Multiply joins the rows; divide cancels pairs. */
function drawLaws(ctx: CanvasRenderingContext2D, w: number, h: number, op: LawOp, base: number, m: number, n: number) {
  const pad = 14;
  const most = Math.max(m + n, 1);
  const chip = Math.min(30, (w - 2 * pad - 40) / Math.max(op === "mul" ? most : Math.max(m, n, 1), 1));
  const font = Math.max(9, Math.min(14, chip * 0.5));
  const drawChip = (x: number, y: number, colour: string, crossed = false) => {
    ctx.fillStyle = colour + "33";
    ctx.strokeStyle = colour;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(x + 1, y + 1, chip - 2, chip - 2, Math.min(6, chip / 4));
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = `${font}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`${base}`, x + chip / 2, y + chip / 2 + font / 3);
    if (crossed) {
      ctx.strokeStyle = "rgba(251,113,133,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 3, y + chip - 3);
      ctx.lineTo(x + chip - 3, y + 3);
      ctx.stroke();
    }
  };
  const label = (text: string, x: number, y: number, colour: string) => {
    ctx.fillStyle = colour;
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(text, x, y);
  };
  const rowX = (count: number) => pad + 40 + Math.max(0, (w - 2 * pad - 40 - count * chip) / 2);

  if (op === "mul") {
    const gap = (h - 3 * chip - 2 * pad) / 4;
    const y1 = pad + gap;
    const y2 = y1 + chip + gap;
    const y3 = y2 + chip + gap;
    label(`${base}${sup(m)}`, pad, y1 + chip / 2 + 4, CYAN);
    label(`× ${base}${sup(n)}`, pad - 4, y2 + chip / 2 + 4, PINK);
    label(`= ${base}${sup(m + n)}`, pad - 4, y3 + chip / 2 + 4, LIME);
    const x1 = rowX(m);
    for (let i = 0; i < m; i++) drawChip(x1 + i * chip, y1, CYAN);
    const x2 = rowX(n);
    for (let i = 0; i < n; i++) drawChip(x2 + i * chip, y2, PINK);
    const x3 = rowX(m + n);
    for (let i = 0; i < m + n; i++) drawChip(x3 + i * chip, y3, i < m ? CYAN : PINK);
    if (m + n === 0) emptyNote(ctx, w, y3 + chip / 2, "no chips: the answer is 1");
  } else {
    const q = quotientChips(m, n);
    const lineY = h * 0.42;
    const y1 = lineY - chip - 8;
    const y2 = lineY + 8;
    label(`${base}${sup(m)}`, pad, y1 + chip / 2 + 4, CYAN);
    label(`${base}${sup(n)}`, pad, y2 + chip / 2 + 4, PINK);
    const x1 = rowX(m);
    const x2 = rowX(n);
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad + 40, lineY);
    ctx.lineTo(w - pad, lineY);
    ctx.stroke();
    for (let i = 0; i < m; i++) drawChip(x1 + i * chip, y1, CYAN, i < q.cancel);
    for (let i = 0; i < n; i++) drawChip(x2 + i * chip, y2, PINK, i < q.cancel);
    const v = powerValue(base, q.power);
    const result =
      q.top === 0 && q.bottom === 0
        ? `All ${q.cancel} pairs cancel: ${base}${sup(0)} = 1`
        : q.bottom === 0
          ? `${q.cancel} pairs cancel, ${q.top} left on top: ${base}${sup(q.power)} = ${indian(v.top)}`
          : `${q.cancel} pairs cancel, ${q.bottom} left below: 1/${base}${sup(q.bottom)} = 1/${indian(v.bottom)}`;
    ctx.fillStyle = q.power === 0 ? LIME : "rgba(255,255,255,0.8)";
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(clip(ctx, result, w - 2 * pad), w / 2, h - pad - 4);
  }
  ctx.textAlign = "left";
}

function emptyNote(ctx: CanvasRenderingContext2D, w: number, y: number, text: string) {
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, w / 2 + 20, y + 4);
}

/** Big numbers: the digits in boxes with the decimal point, and the hops it has made. */
function drawSci(ctx: CanvasRenderingContext2D, w: number, h: number, value: number, e: number) {
  const pad = 14;
  const digits = `${value}`.padStart(e + 1, "0");
  const len = digits.length;
  const box = Math.min(32, (w - 2 * pad) / (len + 0.6));
  const totalW = len * box;
  const x0 = (w - totalW) / 2;
  const y0 = h * 0.3;
  const pointAt = len - e; // the point sits after this many digits
  const ok = isStandard(value, e);
  ctx.font = `${Math.max(12, Math.min(20, box * 0.6))}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  for (let i = 0; i < len; i++) {
    const x = x0 + i * box;
    const front = i < pointAt;
    const extra = i < len - `${value}`.length; // leading zeros added for a small front number
    ctx.fillStyle = front ? CYAN + "26" : VIOLET + "1f";
    ctx.strokeStyle = front ? CYAN : VIOLET;
    ctx.lineWidth = 1;
    ctx.fillRect(x + 1.5, y0, box - 3, box);
    ctx.strokeRect(x + 1.5, y0, box - 3, box);
    ctx.fillStyle = extra ? "rgba(255,255,255,0.45)" : "#fff";
    ctx.fillText(digits[i], x + box / 2, y0 + box * 0.68);
  }
  // The decimal point (shown only when it is not at the very end).
  const px = x0 + pointAt * box;
  ctx.fillStyle = PINK;
  ctx.beginPath();
  ctx.arc(px, y0 + box + 1, Math.max(3, box * 0.12), 0, Math.PI * 2);
  ctx.fill();
  // Hop arcs from the end of the number to the point.
  if (e > 0) {
    ctx.strokeStyle = PINK + "aa";
    ctx.lineWidth = 1.2;
    for (let k = 0; k < e; k++) {
      const xa = x0 + (len - k) * box;
      const xb = xa - box;
      ctx.beginPath();
      ctx.arc((xa + xb) / 2, y0 + box + 6, box / 2, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
  }
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  const hopY = y0 + box * 2 + 14;
  ctx.fillText(e === 0 ? "The point is at the end of the number." : `${e} hop${e === 1 ? "" : "s"} left = ÷ 10${sup(e)}, so multiply by 10${sup(e)}`, w / 2, Math.min(hopY, h - 48));
  ctx.font = "bold 16px system-ui, sans-serif";
  ctx.fillStyle = ok ? LIME : "#fff";
  ctx.fillText(`${mantissa(value, e)} × 10${sup(e)}`, w / 2, h - 22);
  ctx.textAlign = "left";
}
