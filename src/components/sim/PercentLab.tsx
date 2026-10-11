"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { fitCanvas } from "./canvas";
import {
  DISCOUNT,
  GST_RATES,
  ITEMS,
  UPDOWN,
  bill,
  goalItem,
  goalOk,
  percentDecimal,
  percentFraction,
  percentOf,
  rupees,
  tidy,
  upDown,
  type BillOrder,
  type PriceGoal,
} from "@/lib/sim/percent";

export type PercentMode = "grid" | "shop" | "updown";

export type PercentReading =
  | { mode: "grid"; p: number }
  | { mode: "shop"; item: string; d: number; g: number; order: BillOrder; total: number }
  | { mode: "updown"; up: number; down: number; end: number }
  | { mode: "goal"; d: number; ok: boolean };

interface Props {
  onReading?: (r: PercentReading) => void;
  /** Challenge: item and GST are fixed; pick the discount that hits the exact bill. */
  goal?: PriceGoal | null;
}

const MODES: { id: PercentMode; label: string }[] = [
  { id: "grid", label: "Grid" },
  { id: "shop", label: "Shop" },
  { id: "updown", label: "Up & down" },
];
const CYAN = "#22d3ee";
const PINK = "#f472b6";
const LIME = "#a3e635";
const VIOLET = "#a78bfa";

export default function PercentLab({ onReading, goal = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<PercentMode>("grid");
  const [p, setP] = useState(10);
  const [itemId, setItemId] = useState(ITEMS[0].id);
  const [d, setD] = useState(goal ? 0 : 10);
  const [g, setG] = useState<number>(0);
  const [order, setOrder] = useState<BillOrder>("discount-first");
  const [up, setUp] = useState(10);
  const [down, setDown] = useState(10);
  const [rung, setRung] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: PercentMode = goal ? "shop" : mode;
  const item = goal ? goalItem(goal) : ITEMS.find((x) => x.id === itemId)!;
  const gst = goal ? goal.gst : g;
  const billNow = bill(item.price, d, gst, goal ? "discount-first" : order);
  const ud = upDown(UPDOWN.start, up, down);

  useEffect(() => {
    if (goal) return;
    if (activeMode === "grid") onReadingRef.current?.({ mode: "grid", p });
    else if (activeMode === "shop") onReadingRef.current?.({ mode: "shop", item: itemId, d, g, order, total: billNow.total });
    else onReadingRef.current?.({ mode: "updown", up, down, end: ud.end });
  }, [goal, activeMode, p, itemId, d, g, order, billNow.total, up, down, ud.end]);

  useEffect(() => {
    const el = canvasRef.current!;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hidden = goal !== null && rung === null;
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !size.w) return;
    const ctx = fitCanvas(el, size.w, size.h);
    ctx.clearRect(0, 0, size.w, size.h);
    if (activeMode === "grid") drawGrid(ctx, size.w, size.h, p);
    else if (activeMode === "shop") drawBill(ctx, size.w, size.h, item.price, d, gst, goal ? "discount-first" : order, hidden, goal);
    else drawUpDown(ctx, size.w, size.h, up, down);
  }, [size, activeMode, p, item.price, d, gst, order, hidden, goal, up, down]);

  /** Tap a square on the grid to shade up to it. */
  const onGridTap = (e: PointerEvent<HTMLCanvasElement>) => {
    if (activeMode !== "grid" || !size.w) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const { x0, y0, cell } = gridBox(size.w, size.h);
    const c = Math.floor((e.clientX - rect.left - x0) / cell);
    const r = Math.floor((e.clientY - rect.top - y0) / cell);
    if (c < 0 || c > 9 || r < 0 || r > 9) return;
    setP(r * 10 + c + 1);
  };

  const ring = () => {
    if (!goal) return;
    const ok = goalOk(goal, d);
    setRung(ok);
    onReadingRef.current?.({ mode: "goal", d, ok });
  };

  const f = percentFraction(p);
  const ariaLabel =
    activeMode === "grid"
      ? `${p} of 100 squares shaded: ${p}% = ${f.num}/${f.den}`
      : activeMode === "shop"
        ? hidden
          ? `${item.name} at ${rupees(billNow.price)} with ${d}% off and ${gst}% GST; bill hidden until you ring it up`
          : `${item.name} bill: ${rupees(billNow.price)}, ${d}% off, ${gst}% GST, you pay ${rupees(billNow.total)}`
        : `₹100 up ${up}% to ₹${tidy(ud.afterUp)}, then down ${down}% to ₹${tidy(ud.end)}`;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!goal && (
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {MODES.map((x) => (
            <button key={x.id} onClick={() => setMode(x.id)} className={`rounded-xl py-2 ${activeMode === x.id ? "bg-white/10 text-white" : "text-white/50"}`}>
              {x.label}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        onPointerDown={onGridTap}
        className="h-64 w-full touch-manipulation rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={ariaLabel}
      />

      {activeMode === "grid" ? (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Percent" value={`${p}%`} colour="text-cyan-200" />
            <Readout label="Fraction" value={`${f.num}/${f.den}`} colour="text-violet-200" />
            <Readout label="Decimal" value={percentDecimal(p)} colour="text-lime-200" />
          </div>
          <p className="text-center text-sm text-white/70 tabular-nums">
            {p} out of 100 = {p}/100{f.den !== 100 ? ` = ${f.num}/${f.den}` : ""}
          </p>
          <Stepper label="Squares shaded" value={p} min={0} max={100} steps={[1, 10]} onChange={setP} />
        </>
      ) : activeMode === "shop" ? (
        <>
          {!goal && (
            <div className="grid grid-cols-3 gap-1.5">
              {ITEMS.map((x) => (
                <button
                  key={x.id}
                  onClick={() => setItemId(x.id)}
                  aria-pressed={itemId === x.id}
                  className={`rounded-xl border px-1 py-2 text-xs ${itemId === x.id ? "border-cyan-300 bg-cyan-300/15 text-white" : "border-white/10 text-white/70"}`}
                >
                  {x.emoji} {x.name}
                  <span className="block tabular-nums text-white/60">{rupees(x.price * 100)}</span>
                </button>
              ))}
            </div>
          )}
          <BillLines b={billNow} d={d} g={gst} order={goal ? "discount-first" : order} hidden={hidden} />
          <Stepper label="Discount %" value={d} min={DISCOUNT.min} max={DISCOUNT.max} steps={[DISCOUNT.step]} stepSize={DISCOUNT.step} onChange={(v) => {
            setD(v);
            setRung(null);
          }} />
          {goal ? (
            <>
              <button className="btn-primary !py-2 text-sm" onClick={ring}>
                Ring up the bill
              </button>
              {rung !== null && (
                <p className={`text-center text-sm ${rung ? "text-lime-300" : "text-amber-200"}`}>
                  {rung
                    ? `Exactly ${rupees(goal.target * 100)}! ${d}% off, then ${goal.gst}% GST.`
                    : billNow.total > goal.target * 100
                      ? `The bill is ${rupees(billNow.total)}, more than ${rupees(goal.target * 100)}. Give a bigger discount.`
                      : `The bill is ${rupees(billNow.total)}, less than ${rupees(goal.target * 100)}. Give a smaller discount.`}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
                {GST_RATES.map((r) => (
                  <button
                    key={r}
                    aria-label={`GST ${r}%`}
                    aria-pressed={g === r}
                    onClick={() => setG(r)}
                    className={`rounded-xl py-1.5 tabular-nums ${g === r ? "bg-white/10 text-white" : "text-white/50"}`}
                  >
                    GST {r}%
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
                {(["discount-first", "gst-first"] as const).map((o) => (
                  <button
                    key={o}
                    aria-pressed={order === o}
                    onClick={() => setOrder(o)}
                    className={`rounded-xl py-1.5 ${order === o ? "bg-white/10 text-white" : "text-white/50"}`}
                  >
                    {o === "discount-first" ? "Discount first" : "GST first"}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Start" value="₹100" colour="text-white" />
            <Readout label={`After +${up}%`} value={`₹${tidy(ud.afterUp)}`} colour="text-lime-200" />
            <Readout label={`After −${down}%`} value={`₹${tidy(ud.end)}`} colour={Math.abs(ud.end - 100) < 1e-9 ? "text-lime-200" : "text-pink-200"} />
          </div>
          <p className="text-center text-sm text-white/70 tabular-nums">
            +{up}% of ₹100 = ₹{tidy(percentOf(up, 100))}; −{down}% of ₹{tidy(ud.afterUp)} = ₹{tidy(percentOf(down, ud.afterUp))}
            {Math.abs(ud.change) < 1e-9 ? " · back to the start!" : ` · overall ${ud.change > 0 ? "+" : "−"}${tidy(Math.abs(ud.change))}%`}
          </p>
          <Stepper label="Increase %" value={up} min={UPDOWN.min} max={UPDOWN.max} steps={[UPDOWN.step]} stepSize={UPDOWN.step} onChange={setUp} />
          <Stepper label="Decrease %" value={down} min={UPDOWN.min} max={UPDOWN.max} steps={[UPDOWN.step]} stepSize={UPDOWN.step} onChange={setDown} />
        </>
      )}
    </div>
  );
}

function BillLines({ b, d, g, order, hidden }: { b: ReturnType<typeof bill>; d: number; g: number; order: BillOrder; hidden: boolean }) {
  const offLine = (
    <Line key="off" label={`Discount (${d}%)`} value={hidden ? "?" : `−${rupees(b.off)}`} colour="text-pink-200" />
  );
  const gstLine = <Line key="gst" label={`GST (${g}%)`} value={hidden ? "?" : `+${rupees(b.gst)}`} colour="text-lime-200" />;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm tabular-nums">
      <Line label="Price" value={rupees(b.price)} colour="text-white" />
      {order === "discount-first" ? offLine : gstLine}
      <Line label={order === "discount-first" ? "After discount" : "With GST"} value={hidden ? "?" : rupees(b.middle)} colour="text-white/80" />
      {order === "discount-first" ? gstLine : offLine}
      <div className="mt-1 border-t border-white/10 pt-1">
        <Line label="You pay" value={hidden ? "?" : rupees(b.total)} colour="text-cyan-200 font-semibold" />
      </div>
    </div>
  );
}

function Line({ label, value, colour }: { label: string; value: string; colour: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-white/60">{label}</span>
      <span className={colour}>{value}</span>
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

/** A slider with − and + buttons for touch screens. */
function Stepper(p: { label: string; value: number; min: number; max: number; steps: number[]; stepSize?: number; onChange: (v: number) => void }) {
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
        step={p.stepSize ?? 1}
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

/** Where the 10 × 10 grid sits on the canvas. */
function gridBox(w: number, h: number) {
  const cell = Math.floor(Math.min((w - 28) / 10, (h - 44) / 10));
  const x0 = (w - 10 * cell) / 2;
  const y0 = 10 + (h - 44 - 10 * cell) / 2;
  return { x0, y0, cell };
}

/** Grid mode: 100 squares, p shaded row by row. */
function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, p: number) {
  const { x0, y0, cell } = gridBox(w, h);
  for (let i = 0; i < 100; i++) {
    const r = Math.floor(i / 10);
    const c = i % 10;
    const x = x0 + c * cell;
    const y = y0 + r * cell;
    const on = i < p;
    ctx.fillStyle = on ? CYAN + "66" : "rgba(255,255,255,0.04)";
    ctx.strokeStyle = on ? CYAN : "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
    ctx.strokeRect(x + 1, y + 1, cell - 2, cell - 2);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x0, y0, 10 * cell, 10 * cell);
  const f = percentFraction(p);
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${p} of 100 squares = ${p}% = ${f.num}/${f.den}`, w / 2, h - 12);
  ctx.textAlign = "left";
}

/** Shop mode: the price as a bar, the discount cut off in pink and the GST added in lime. */
function drawBill(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  price: number,
  d: number,
  g: number,
  order: BillOrder,
  hidden: boolean,
  goal: PriceGoal | null,
) {
  const b = bill(price, d, g, order);
  const pad = 14;
  const labelW = Math.min(110, w * 0.3);
  const barX = pad + labelW;
  const barMax = w - barX - pad;
  const biggest = Math.max(b.price, b.middle, b.total, goal ? goal.target * 100 : 0);
  const scale = barMax / biggest;
  const rows = 3;
  const rowH = Math.min(46, (h - 2 * pad - 30) / rows);
  const top = pad + (h - 2 * pad - 30 - rows * rowH) / 2;
  const barH = rowH * 0.55;

  const bar = (row: number, label: string, segs: { v: number; colour: string; dashed?: boolean }[], note: string) => {
    const y = top + row * rowH;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(label, pad, y + barH / 2 + 4);
    let x = barX;
    for (const s of segs) {
      const sw = s.v * scale;
      if (s.dashed) {
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = s.colour;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 0.5, y + 0.5, Math.max(0, sw - 1), barH - 1);
        ctx.setLineDash([]);
      } else {
        ctx.fillStyle = s.colour + "77";
        ctx.fillRect(x, y, sw, barH);
        ctx.strokeStyle = s.colour;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, Math.max(0, sw - 1), barH - 1);
      }
      x += sw;
    }
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText(note, barX, y + barH + 13);
  };

  if (order === "discount-first") {
    bar(0, "Price", [{ v: b.price - b.off, colour: CYAN }, { v: b.off, colour: PINK, dashed: true }], hidden ? `${rupees(b.price)}` : `${rupees(b.price)}, ${d}% off = −${rupees(b.off)}`);
    bar(1, "After discount", hidden ? [] : [{ v: b.middle, colour: CYAN }], hidden ? "?" : rupees(b.middle));
    bar(2, "You pay", hidden ? [] : [{ v: b.middle, colour: CYAN }, { v: b.gst, colour: LIME }], hidden ? "?" : `${rupees(b.middle)} + ${g}% GST ${rupees(b.gst)} = ${rupees(b.total)}`);
  } else {
    bar(0, "Price", [{ v: b.price, colour: CYAN }, { v: b.gst, colour: LIME }], `${rupees(b.price)} + ${g}% GST = ${rupees(b.middle)}`);
    bar(1, "With GST", [{ v: b.middle - b.off, colour: VIOLET }, { v: b.off, colour: PINK, dashed: true }], `${d}% off ${rupees(b.middle)} = −${rupees(b.off)}`);
    bar(2, "You pay", [{ v: b.total, colour: VIOLET }], rupees(b.total));
  }
  if (goal) {
    const x = barX + goal.target * 100 * scale;
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(x, top - 6);
    ctx.lineTo(x, top + rows * rowH);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.fillStyle = goal ? "#facc15" : "rgba(255,255,255,0.6)";
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(goal ? `Target bill: ${rupees(goal.target * 100)} (yellow line)` : "Pink is taken off, green is GST added", w / 2, h - 12);
  ctx.textAlign = "left";
}

/** Up & down: three bars, ₹100 → after the rise → after the fall, with a dashed line at ₹100. */
function drawUpDown(ctx: CanvasRenderingContext2D, w: number, h: number, up: number, down: number) {
  const r = upDown(UPDOWN.start, up, down);
  const pad = 14;
  const base = h - 34;
  const maxV = (UPDOWN.start * (100 + UPDOWN.max)) / 100;
  const scale = (base - pad - 22) / maxV;
  const colW = (w - 2 * pad) / 3;
  const barW = Math.min(70, colW * 0.55);
  const bars: { v: number; label: string; colour: string; note: string }[] = [
    { v: UPDOWN.start, label: "Start", colour: CYAN, note: "₹100" },
    { v: r.afterUp, label: `+${up}%`, colour: LIME, note: `₹${tidy(r.afterUp)}` },
    { v: r.end, label: `−${down}%`, colour: PINK, note: `₹${tidy(r.end)}` },
  ];
  // The ₹100 line.
  const y100 = base - UPDOWN.start * scale;
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, y100);
  ctx.lineTo(w - pad, y100);
  ctx.stroke();
  ctx.setLineDash([]);
  bars.forEach((b, i) => {
    const cx = pad + colW * (i + 0.5);
    const y = base - b.v * scale;
    ctx.fillStyle = b.colour + "66";
    ctx.fillRect(cx - barW / 2, y, barW, base - y);
    ctx.strokeStyle = b.colour;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - barW / 2, y, barW, base - y);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(b.note, cx, y - 6);
    ctx.fillStyle = b.colour;
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(b.label, cx, base + 16);
  });
  // The step amounts between bars.
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText(`+₹${tidy(percentOf(up, 100))}`, pad + colW, Math.min(base - 4, y100 + 14));
  ctx.fillText(`−₹${tidy(percentOf(down, r.afterUp))}`, pad + colW * 2, Math.min(base - 4, y100 + 14));
  ctx.textAlign = "left";
}
