"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import {
  CHART,
  COLUMN_NAME,
  ITEMS,
  LEVEL_NAME,
  NOTES,
  MAX_EACH,
  STARTS,
  SHIFTS,
  STEP,
  billTotal,
  changeFrom,
  dec,
  decEqual,
  digitAt,
  fitsChart,
  fmtDec,
  fmtRupees,
  fmtThou,
  places,
  shift,
  snapTo,
  span,
  stepBy,
  windowAt,
  type Basket,
  type DecRound,
} from "@/lib/sim/decimals";

export type DecMode = "zoom" | "shop" | "chart";

export type DecReading =
  | { mode: "zoom"; v: number; level: number }
  | { mode: "shop"; basket: Basket; total: number; paid: number | null; change: number | null }
  | { mode: "chart"; start: string; value: string; k: number | null }
  | { mode: "round"; ok: boolean };

interface Props {
  onReading?: (r: DecReading) => void;
  /** Challenge: a sports-day job. The mode and the fixed numbers come from the round. */
  job?: DecRound | null;
}

const COL = { line: "#22d3ee", pin: "#f472b6", parent: "#a78bfa", digit: "#a3e635", point: "#facc15" };
const MODES: { id: DecMode; label: string }[] = [
  { id: "zoom", label: "Zoom" },
  { id: "shop", label: "Shop" },
  { id: "chart", label: "× ÷ 10" },
];
/** A value in thousandths shown with `dp` decimal places, e.g. 2.30 at the hundredths zoom. */
const fixed = (v: number, dp: number) => (v / 1000).toFixed(dp);
const stepText = (level: number) => fmtThou(STEP[level]);

export default function DecimalLab({ onReading, job = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<DecMode>("zoom");
  const [v, setV] = useState(job?.kind === "place" ? Math.floor(job.target / 1000) * 1000 : 1000);
  const [level, setLevel] = useState(0);
  const [basket, setBasket] = useState<Basket>({});
  const [paid, setPaid] = useState<number | null>(null);
  const [start, setStart] = useState(job?.kind === "shift" ? job.start : STARTS[0]);
  const [num, setNum] = useState(() => dec(job?.kind === "shift" ? job.start : STARTS[0]));
  const [lastK, setLastK] = useState<number | null>(null);
  const [anim, setAnim] = useState<{ from: number; t0: number } | null>(null);
  const [checked, setChecked] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [now, setNow] = useState(0);
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: DecMode = job ? (job.kind === "place" ? "zoom" : job.kind === "bill" ? "shop" : "chart") : mode;
  const total = billTotal(basket);
  const change = paid !== null ? changeFrom(paid, total) : null;
  const numText = fmtDec(num);

  useEffect(() => {
    if (job) return;
    if (activeMode === "zoom") onReadingRef.current?.({ mode: "zoom", v, level });
    else if (activeMode === "shop") onReadingRef.current?.({ mode: "shop", basket, total, paid, change });
    else onReadingRef.current?.({ mode: "chart", start, value: numText, k: lastK });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- total and change come from basket and paid
  }, [job, activeMode, v, level, basket, paid, start, numText, lastK]);

  useEffect(() => {
    const el = canvasRef.current!;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Slide the digits across the chart after a × or ÷.
  useEffect(() => {
    if (!anim) return;
    let id = 0;
    const tick = (t: number) => {
      setNow(t);
      if (t - anim.t0 < 450) id = requestAnimationFrame(tick);
      else setAnim(null);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [anim]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !size.w) return;
    const ctx = fitCanvas(el, size.w, size.h);
    ctx.clearRect(0, 0, size.w, size.h);
    if (activeMode === "zoom") drawZoom(ctx, size.w, size.h, v, level);
    else if (activeMode === "shop") drawBill(ctx, size.w, size.h, basket, total, job?.kind === "bill" ? job.target : paid, job?.kind === "bill");
    else {
      const p = anim ? Math.min(1, Math.max(0, (now - anim.t0) / 450)) : 1;
      const ease = 1 - (1 - p) ** 3;
      drawChart(ctx, size.w, size.h, num, anim ? anim.from * (1 - ease) : 0);
    }
    ctx.textAlign = "left";
  }, [size, activeMode, v, level, basket, total, paid, num, anim, now, job]);

  const touch = () => setChecked(null);
  const moveV = (n: number) => {
    setV((x) => stepBy(x, level, n));
    touch();
  };
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeMode !== "zoom" || !size.w) return;
    const r = e.currentTarget.getBoundingClientRect();
    const { lo, hi } = windowAt(v, level);
    const x = lo + ((e.clientX - r.left - PAD) / (size.w - 2 * PAD)) * (hi - lo);
    setV(snapTo(x, level, v));
    touch();
  };
  const add = (id: string) => {
    setBasket((b) => ((b[id] ?? 0) >= MAX_EACH ? b : { ...b, [id]: (b[id] ?? 0) + 1 }));
    setPaid(null);
    touch();
  };
  /** `at` is the click's time stamp, on the same clock as requestAnimationFrame. */
  const doShift = (k: number, at: number) => {
    const next = shift(num, k);
    if (!fitsChart(next)) return;
    setNum(next);
    setLastK(k);
    setAnim({ from: k, t0: at });
    touch();
  };
  const restart = (s: string) => {
    setStart(s);
    setNum(dec(s));
    setLastK(null);
    setAnim(null);
    touch();
  };

  const check = () => {
    if (!job) return;
    const ok = job.kind === "place" ? v === job.target : job.kind === "bill" ? total === job.target : decEqual(num, dec(job.target));
    setChecked(ok);
    onReadingRef.current?.({ mode: "round", ok });
  };

  const pl = places(v);
  const label =
    activeMode === "zoom"
      ? `Number line zoomed to ${LEVEL_NAME[level]}; the pin is at ${fmtThou(v)}`
      : activeMode === "shop"
        ? `Canteen bill: total ${fmtRupees(total)}${change !== null ? `, paid ${fmtRupees(paid!)}, change ${fmtRupees(change)}` : ""}`
        : `Place value chart showing ${numText}`;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!job && (
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)} className={`rounded-xl py-2 ${activeMode === m.id ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m.label}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className={`h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80 ${activeMode === "zoom" ? "cursor-pointer touch-none" : ""}`}
        role="img"
        aria-label={label}
        onPointerDown={onDown}
      />

      {activeMode === "zoom" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="pin at" value={fmtThou(v)} colour="text-pink-200" />
            <Readout label="zoomed to" value={LEVEL_NAME[level]} colour="text-cyan-200" />
            <Readout label="one step" value={stepText(level)} colour="text-white" />
          </div>
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-center text-sm text-white/70">
            {fmtThou(v)} = {pl.whole} {pl.whole === 1 ? "one" : "ones"} + {pl.tenths} tenths + {pl.hundredths} hundredths + {pl.thousandths} thousandths
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost !py-2 text-sm disabled:opacity-30" disabled={level === 0} onClick={() => setLevel((l) => l - 1)}>
              Zoom out
            </button>
            <button className="btn-ghost !py-2 text-sm disabled:opacity-30" disabled={level === 3} onClick={() => setLevel((l) => l + 1)}>
              Zoom in
            </button>
            <button className="rounded-xl border border-white/10 py-2 text-sm tabular-nums text-white/80" onClick={() => moveV(-1)}>
              − {stepText(level)}
            </button>
            <button className="rounded-xl border border-white/10 py-2 text-sm tabular-nums text-white/80" onClick={() => moveV(1)}>
              + {stepText(level)}
            </button>
          </div>
          <p className="text-center text-xs text-white/40">Tap the line to drop the pin, or step it. Zoom in to cut each step into 10 smaller steps.</p>
        </>
      )}

      {activeMode === "shop" && (
        <>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {ITEMS.map((it) => (
              <button
                key={it.id}
                aria-label={`Add ${it.name}`}
                onClick={() => add(it.id)}
                className={`flex items-center justify-between gap-1 rounded-xl border px-2 py-2 text-left text-sm ${basket[it.id] ? "border-cyan-300/60 bg-cyan-300/10" : "border-white/10"}`}
              >
                <span>
                  {it.emoji} {it.name}
                  {basket[it.id] ? <span className="ml-1 text-cyan-200">×{basket[it.id]}</span> : null}
                </span>
                <span className="tabular-nums text-white/60">{fmtRupees(it.price)}</span>
              </button>
            ))}
          </div>
          {job?.kind === "bill" ? (
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-ghost !py-2 text-sm" onClick={() => {
                  setBasket({});
                  touch();
                }}>
                Empty basket
              </button>
              <div className="rounded-xl border border-white/10 py-2 text-center text-sm tabular-nums">Coupon {fmtRupees(job.target)}</div>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-1.5">
              <button className="rounded-xl border border-white/10 py-2 text-xs text-white/70" onClick={() => {
                  setBasket({});
                  setPaid(null);
                }}>
                Empty basket
              </button>
              {NOTES.map((n) => (
                <button
                  key={n}
                  disabled={n < total || total === 0}
                  onClick={() => setPaid(n)}
                  className={`rounded-xl border py-2 text-sm tabular-nums disabled:opacity-30 ${paid === n ? "border-lime-300 bg-lime-300/15" : "border-white/10"}`}
                >
                  Pay ₹{n / 100}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {activeMode === "chart" && (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Readout label="started at" value={start} colour="text-white" />
            <Readout label="now" value={numText} colour="text-lime-200" />
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {SHIFTS.map((s) => (
              <button
                key={s.k}
                disabled={!fitsChart(shift(num, s.k))}
                onClick={(e) => doShift(s.k, e.timeStamp)}
                className="rounded-xl border border-white/10 py-2 text-sm tabular-nums text-white/85 disabled:opacity-30"
              >
                {s.label}
              </button>
            ))}
          </div>
          {job?.kind === "shift" ? (
            <button className="btn-ghost !py-2 text-sm" onClick={() => restart(job.start)}>
              Start again from {job.start}
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5 text-sm">
              <span className="text-white/50">Start at</span>
              {STARTS.map((s) => (
                <button
                  key={s}
                  aria-label={`Start at ${s}`}
                  onClick={() => restart(s)}
                  className={`min-w-14 flex-1 rounded-xl border px-2 py-1.5 tabular-nums ${start === s ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <p className="text-center text-xs text-white/40">Each column is 10 times the column on its right. × 10 moves every digit one column left; ÷ 10 moves it one column right.</p>
        </>
      )}

      {job && (
        <>
          <button className="btn-primary !py-2 text-sm" onClick={check}>
            {job.kind === "place" ? "Post the time" : job.kind === "bill" ? "Use the coupon" : "Check the bill"}
          </button>
          {checked !== null && (
            <p className={`text-center text-sm ${checked ? "text-lime-300" : "text-amber-200"}`} role="status">
              {checked
                ? "Spot on!"
                : job.kind === "place"
                  ? v < job.target
                    ? `${fmtThou(v)} is to the left of the winning time. Move right.`
                    : `${fmtThou(v)} is to the right of the winning time. Move left.`
                  : job.kind === "bill"
                    ? total < job.target
                      ? `${fmtRupees(total)} leaves ${fmtRupees(job.target - total)} of the coupon unused.`
                      : `${fmtRupees(total)} is ${fmtRupees(total - job.target)} more than the coupon.`
                    : `${numText} is not the bill yet.`}
            </p>
          )}
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

const PAD = 22;

/** The number line at one zoom level, with the coarser line above and lines showing which interval was blown up. */
function drawZoom(ctx: CanvasRenderingContext2D, w: number, h: number, v: number, level: number) {
  const { lo, hi, step } = windowAt(v, level);
  const X = (x: number) => PAD + ((x - lo) / (hi - lo)) * (w - 2 * PAD);
  const y = Math.round(h * 0.64);
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "center";

  if (level > 0) {
    // The coarser line, with the interval we zoomed into lit up.
    const up = windowAt(v, level - 1);
    const Xu = (x: number) => PAD + ((x - up.lo) / (up.hi - up.lo)) * (w - 2 * PAD);
    const yu = 40;
    ctx.strokeStyle = COL.parent + "99";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(PAD, yu);
    ctx.lineTo(w - PAD, yu);
    for (let x = up.lo; x <= up.hi; x += up.step) {
      ctx.moveTo(Xu(x), yu - 4);
      ctx.lineTo(Xu(x), yu + 4);
    }
    ctx.stroke();
    ctx.fillStyle = COL.parent;
    ctx.fillText(fixed(up.lo, level - 1), PAD, yu - 9);
    ctx.fillText(fixed(up.hi, level - 1), w - PAD, yu - 9);
    ctx.strokeStyle = COL.line;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(Xu(lo), yu);
    ctx.lineTo(Xu(hi), yu);
    ctx.stroke();
    // The fan from the small interval to the full line below.
    ctx.fillStyle = "rgba(34,211,238,0.07)";
    ctx.strokeStyle = "rgba(34,211,238,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Xu(lo), yu + 3);
    ctx.lineTo(Xu(hi), yu + 3);
    ctx.lineTo(w - PAD, y - 34);
    ctx.lineTo(PAD, y - 34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(`zoomed in: each ${fmtThou(STEP[level - 1])} cut into 10 steps of ${fmtThou(step)}`, w / 2, (yu + y - 34) / 2 + 4);
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText("whole numbers from 0 to 20", w / 2, 30);
  }

  // The main line.
  const n = Math.round((hi - lo) / step);
  const gap = (w - 2 * PAD) / n;
  const need = ctx.measureText(fixed(hi, level)).width + 8;
  const labelEvery = [1, 2, 5, 10].find((k) => gap * k >= need && n % k === 0) ?? n;
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD - 8, y);
  ctx.lineTo(w - PAD + 8, y);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= n; i++) {
    const x = X(lo + i * step);
    const big = i % labelEvery === 0;
    ctx.strokeStyle = big ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)";
    ctx.beginPath();
    ctx.moveTo(x, y - (big ? 9 : 5));
    ctx.lineTo(x, y + (big ? 9 : 5));
    ctx.stroke();
    if (big) {
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.fillText(fixed(lo + i * step, level), x, y + 24);
    }
  }

  // The pin.
  const px = X(v);
  ctx.strokeStyle = COL.pin;
  ctx.fillStyle = COL.pin;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = COL.pin;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(px, y);
  ctx.lineTo(px, y - 26);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(px, y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.font = "bold 13px system-ui, sans-serif";
  const text = fmtThou(v);
  const tw = ctx.measureText(text).width + 12;
  const bx = Math.min(w - 4 - tw, Math.max(4, px - tw / 2));
  ctx.fillStyle = "rgba(244,114,182,0.2)";
  ctx.strokeStyle = COL.pin;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(bx, y - 46, tw, 20, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.fillText(text, bx + tw / 2, y - 31);
}

/** A canteen bill written in columns, with every decimal point in one line. */
function drawBill(ctx: CanvasRenderingContext2D, w: number, h: number, basket: Basket, total: number, paid: number | null, coupon: boolean) {
  const rows = ITEMS.filter((it) => basket[it.id]);
  const lines = rows.length + (paid !== null ? 3 : 1);
  const lh = Math.min(22, (h - 40) / Math.max(lines + 1, 5));
  const right = w - 24;
  ctx.font = `${Math.min(14, lh - 6)}px ui-monospace, monospace`;
  const pointX = right - ctx.measureText("00").width;
  let y = 28;

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.textAlign = "left";
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText(coupon ? "Sports day canteen: coupon bill" : "Sports day canteen bill", 16, 18);
  ctx.font = `${Math.min(14, lh - 6)}px ui-monospace, monospace`;

  // The decimal point column.
  ctx.fillStyle = "rgba(250,204,21,0.10)";
  ctx.fillRect(pointX - 4, 24, 9, h - 30);

  const money = (p: number, colour: string, sign = "") => {
    const s = fmtRupees(p);
    const [rup, paise] = s.split(".");
    ctx.fillStyle = colour;
    ctx.textAlign = "right";
    ctx.fillText(sign + rup, pointX - 3, y);
    ctx.textAlign = "left";
    ctx.fillStyle = COL.point;
    ctx.fillText(".", pointX - 3, y);
    ctx.fillStyle = colour;
    ctx.fillText(paise, pointX + 4, y);
  };
  if (!rows.length) {
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.textAlign = "center";
    ctx.font = "13px system-ui, sans-serif";
    ctx.fillText("Tap the snacks below to add them to the bill", w / 2, h / 2);
    return;
  }
  for (const it of rows) {
    y += lh;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.textAlign = "left";
    ctx.fillText(`${basket[it.id]} × ${it.name}`, 16, y);
    money(it.price * basket[it.id], "#e5e7eb", rows.indexOf(it) ? "+ " : "");
  }
  const rule = () => {
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pointX - 90, y + 6);
    ctx.lineTo(right + 4, y + 6);
    ctx.stroke();
  };
  rule();
  y += lh;
  ctx.fillStyle = COL.line;
  ctx.textAlign = "left";
  ctx.fillText("Total", 16, y);
  money(total, COL.line);
  if (paid !== null) {
    y += lh;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.textAlign = "left";
    ctx.fillText(coupon ? "Coupon" : "Paid", 16, y);
    money(paid, "#e5e7eb");
    if (!coupon) {
      rule();
      y += lh;
      ctx.fillStyle = COL.digit;
      ctx.textAlign = "left";
      ctx.fillText(`Change (${fmtRupees(paid)} − total)`, 16, y);
      money(paid - total, COL.digit);
    }
  }
}

/**
 * Place value chart from thousands to ten-thousandths. `slide` is how many columns the digits
 * still have to travel (for the animation after × or ÷); 0 when they are in place.
 */
function drawChart(ctx: CanvasRenderingContext2D, w: number, h: number, num: { m: number; e: number }, slide: number) {
  const cols: number[] = [];
  for (let p = CHART.hi; p >= CHART.lo; p--) cols.push(p);
  const L = 8;
  const cw = (w - 2 * L) / cols.length;
  const X = (p: number) => L + (CHART.hi - p) * cw;
  const top = 30;
  const rowY = h / 2 + 10;
  ctx.textAlign = "center";

  // Headers and cells.
  ctx.font = `${cw < 40 ? 11 : 12}px system-ui, sans-serif`;
  for (const p of cols) {
    ctx.fillStyle = p >= 0 ? "rgba(34,211,238,0.07)" : "rgba(167,139,250,0.08)";
    ctx.fillRect(X(p) + 1, top, cw - 2, h - top - 30);
    ctx.fillStyle = p >= 0 ? COL.line : COL.parent;
    ctx.fillText(COLUMN_NAME[p], X(p) + cw / 2, top + 16);
  }
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillText("whole numbers", X(1.5) + cw / 2, h - 12);
  ctx.fillText("parts of one", X(-2.5) + cw / 2, h - 12);
  // The decimal point sits between ones and tenths.
  ctx.fillStyle = COL.point;
  ctx.beginPath();
  ctx.arc(X(-1), rowY + 6, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(250,204,21,0.35)";
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(X(-1), top);
  ctx.lineTo(X(-1), h - 30);
  ctx.stroke();
  ctx.setLineDash([]);

  // Digits, including the zeros a reader must write (like the 0s in 0.0375 or 2450).
  const s = span(num);
  const from = Math.max(s.top, 0);
  const to = Math.min(s.bottom, 0);
  ctx.font = `bold ${Math.min(30, cw * 0.7)}px ui-monospace, monospace`;
  for (let p = from; p >= to; p--) {
    const x = X(p) + cw / 2 + slide * cw;
    ctx.fillStyle = p > s.top || p < s.bottom ? "rgba(163,230,53,0.55)" : COL.digit;
    ctx.fillText(String(digitAt(num, p)), x, rowY + 10);
  }
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText(`${fmtDec(num)}`, w / 2, top - 10);
}
