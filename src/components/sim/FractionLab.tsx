"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import {
  BAR,
  FIT,
  SHARE,
  barOk,
  cmp,
  fitOk,
  fits,
  fmtFrac,
  fmtMixed,
  frac,
  mul,
  ofQuantity,
  shareOk,
  value,
  type Frac,
  type FracRound,
} from "@/lib/sim/fractions";

export type FracMode = "bar" | "share" | "fit";

export type FracReading =
  | { mode: "bar"; first: Frac; second: Frac; product: Frac; vsFirst: -1 | 0 | 1 }
  | { mode: "share"; N: number; f: Frac; part: Frac }
  | { mode: "fit"; whole: Frac; piece: Frac; count: Frac; full: number; rest: Frac }
  | { mode: "order"; ok: boolean };

interface Props {
  onReading?: (r: FracReading) => void;
  /** Challenge: a mithai shop order. The mode and any fixed numbers come from the order. */
  order?: FracRound | null;
}

const COL = { first: "#22d3ee", second: "#f472b6", both: "#a78bfa", laddoo: "#fb923c", jug: "#22d3ee" };
const MODES: { id: FracMode; label: string }[] = [
  { id: "bar", label: "Bar" },
  { id: "share", label: "Share" },
  { id: "fit", label: "Fit" },
];

export default function FractionLab({ onReading, order = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<FracMode>("bar");
  const [first, setFirst] = useState<Frac>(frac(1, 2));
  const [second, setSecond] = useState<Frac>(order?.kind === "bar" ? frac(1, 2) : frac(1, 3));
  const [N, setN] = useState(order?.kind === "share" ? 10 : 12);
  const [shareF, setShareF] = useState<Frac>(frac(1, 3));
  const [whole, setWhole] = useState<Frac>(frac(2));
  const [piece, setPiece] = useState<Frac>(frac(1, 2));
  const [served, setServed] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: FracMode = order ? order.kind : mode;
  const sf = order?.kind === "share" ? order.frac : shareF;
  const wh = order?.kind === "fit" ? order.whole : whole;
  const product = mul(first, second);
  const vsFirst = cmp(product, first);
  const part = ofQuantity(N, sf);
  const fit = fits(wh, piece);

  useEffect(() => {
    if (order) return;
    if (activeMode === "bar") onReadingRef.current?.({ mode: "bar", first, second, product, vsFirst });
    else if (activeMode === "share") onReadingRef.current?.({ mode: "share", N, f: sf, part });
    else onReadingRef.current?.({ mode: "fit", whole: wh, piece, count: fit.count, full: fit.full, rest: fit.rest });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- product, part and fit come from the inputs listed
  }, [order, activeMode, first, second, N, sf, wh, piece]);

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
    if (activeMode === "bar") drawBar(ctx, size.w, size.h, first, second);
    else if (activeMode === "share") drawShare(ctx, size.w, size.h, N, sf);
    else drawFit(ctx, size.w, size.h, wh, piece);
    ctx.textAlign = "left";
  }, [size, activeMode, first, second, N, sf, wh, piece]);

  // Any change clears the last "served" verdict.
  const change =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setServed(null);
    };

  const serve = () => {
    if (!order) return;
    const ok =
      order.kind === "bar" ? barOk(order.target, first, second) : order.kind === "share" ? shareOk(order.frac, order.part, N) : fitOk(order.whole, order.count, piece);
    setServed(ok);
    onReadingRef.current?.({ mode: "order", ok });
  };

  const label =
    activeMode === "bar"
      ? `Chocolate bar cut into ${first.d} strips one way and ${second.d} the other; ${first.n * second.n} of ${first.d * second.d} pieces are shaded twice, so ${fmtFrac(second)} of ${fmtFrac(first)} is ${fmtFrac(product)}`
      : activeMode === "share"
        ? `${N} laddoos in ${sf.d} groups; ${fmtFrac(sf)} of them is ${fmtMixed(part)}`
        : `${fmtFrac(wh)} litres poured into glasses of ${fmtFrac(piece)} litre: ${fmtMixed(fit.count)} glasses`;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!order && (
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)} className={`rounded-xl py-2 ${activeMode === m.id ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m.label}
            </button>
          ))}
        </div>
      )}

      <canvas ref={canvasRef} className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80" role="img" aria-label={label} />

      {activeMode === "bar" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="first × second" value={`${fmtFrac(first)} × ${fmtFrac(second)}`} colour="text-white" />
            <Readout label="pieces" value={`${first.n * second.n}/${first.d * second.d}`} colour="text-violet-200" />
            <Readout label="simplest" value={fmtFrac(product)} colour="text-violet-200" />
          </div>
          {!order && (
            <p className={`rounded-2xl border px-4 py-2 text-center text-sm ${vsFirst < 0 ? "border-white/10 bg-white/[0.03] text-white/70" : "border-lime-300/40 bg-lime-300/10 text-lime-100"}`}>
              {vsFirst < 0
                ? `${fmtFrac(product)} is smaller than ${fmtFrac(first)}: taking ${fmtFrac(second)} of it keeps only a part.`
                : vsFirst === 0
                  ? `${fmtFrac(product)} is the same as ${fmtFrac(first)}: ${second.n}/${second.d} is a whole, so you keep all of it.`
                  : `${fmtFrac(product)} is bigger than ${fmtFrac(first)}.`}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <FracPicker label="First cut" colour={COL.first} f={first} maxDen={BAR.maxDen} onChange={change(setFirst)} />
            <FracPicker label="Second cut" colour={COL.second} f={second} maxDen={BAR.maxDen} onChange={change(setSecond)} />
          </div>
        </>
      )}

      {activeMode === "share" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="laddoos" value={`${N}`} colour="text-orange-200" />
            <Readout label="each group" value={N % sf.d === 0 ? `${N / sf.d}` : fmtMixed(frac(N, sf.d))} colour="text-white" />
            <Readout label={`${fmtFrac(sf)} of ${N}`} value={fmtMixed(part)} colour="text-cyan-200" />
          </div>
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-center text-sm text-white/70">
            {N % sf.d === 0
              ? `${sf.n}/${sf.d} of ${N} = (${N} ÷ ${sf.d}) × ${sf.n} = ${N / sf.d} × ${sf.n} = ${fmtMixed(part)}`
              : `${N} laddoos do not split into ${sf.d} equal groups of whole laddoos: (${N} × ${sf.n}) ÷ ${sf.d} = ${fmtMixed(part)}`}
          </p>
          <div className={`grid gap-2 ${order ? "" : "sm:grid-cols-[1fr_auto]"}`}>
            <Slider label="Laddoos in the box" colour={COL.laddoo} value={N} min={1} max={SHARE.maxN} onChange={change(setN)} />
            {!order && <FracPicker label="Fraction" colour={COL.first} f={shareF} maxDen={SHARE.maxDen} onChange={change(setShareF)} />}
          </div>
        </>
      )}

      {activeMode === "fit" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="total ÷ glass" value={`${fmtFrac(wh)} ÷ ${fmtFrac(piece)}`} colour="text-white" />
            <Readout label="glasses" value={fmtMixed(fit.count)} colour="text-violet-200" />
            <Readout label="full glasses" value={`${fit.full}`} colour="text-pink-200" />
          </div>
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-center text-sm text-white/70">
            {fmtFrac(wh)} ÷ ({fmtFrac(piece)}) = {fmtFrac(wh)} × ({piece.d}/{piece.n}) = {fmtFrac(fit.count)}
            {fit.rest.n ? `: ${fit.full} full glasses and ${fmtFrac(fit.rest)} of one more` : `: exactly ${fit.full} full glasses`}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {order ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2 text-center text-sm">
                <div className="text-xs" style={{ color: COL.jug }}>
                  Total (litres)
                </div>
                <div className="mt-3 font-display text-2xl tabular-nums">{fmtFrac(wh)}</div>
                <div className="text-xs text-white/50">{fmtMixed(wh)} litres</div>
              </div>
            ) : (
              <FracPicker label="Total" colour={COL.jug} f={whole} maxDen={FIT.maxDen} maxN={FIT.maxWholeN} improper onChange={change(setWhole)} />
            )}
            <FracPicker label="Each glass" colour={COL.both} f={piece} maxDen={FIT.maxDen} maxN={FIT.maxPieceN} improper onChange={change(setPiece)} />
          </div>
        </>
      )}

      {order && (
        <>
          <button className="btn-primary !py-2 text-sm" onClick={serve}>
            {order.kind === "bar" ? "Cut the bar" : order.kind === "share" ? "Pack the box" : "Pour the lassi"}
          </button>
          {served !== null && (
            <p className={`text-center text-sm ${served ? "text-lime-300" : "text-amber-200"}`} role="status">
              {served
                ? "Order served exactly right!"
                : order.kind === "bar"
                  ? first.n === first.d || second.n === second.d
                    ? "A whole bar is not a cut. Use two fractions less than 1."
                    : `That leaves ${fmtFrac(product)} of the bar, not ${fmtFrac(order.target)}.`
                  : order.kind === "share"
                    ? `${fmtFrac(order.frac)} of ${N} is ${fmtMixed(part)}, not ${order.part}.`
                    : `That fills ${fmtMixed(fit.count)} glasses, not exactly ${order.count}.`}
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

function Slider(p: { label: string; colour: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const set = (v: number) => p.onChange(Math.min(p.max, Math.max(p.min, v)));
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span style={{ color: p.colour }}>{p.label}</span>
        <span className="flex items-center gap-1">
          <button className="h-8 w-8 rounded-lg border border-white/10 text-white/80" aria-label={`${p.label}: one fewer`} onClick={() => set(p.value - 1)}>
            −
          </button>
          <span className="w-8 text-center tabular-nums text-white">{p.value}</span>
          <button className="h-8 w-8 rounded-lg border border-white/10 text-white/80" aria-label={`${p.label}: one more`} onClick={() => set(p.value + 1)}>
            +
          </button>
        </span>
      </div>
      <input type="range" aria-label={p.label} className="range mt-1 w-full" min={p.min} max={p.max} step={1} value={p.value} onChange={(e) => set(Number(e.target.value))} />
    </div>
  );
}

/**
 * Pick a fraction with +/− buttons for the top and the bottom. Proper-or-whole by default
 * (top at most the bottom); `improper` lets the top go up to maxN.
 */
function FracPicker(p: { label: string; colour: string; f: Frac; maxDen: number; maxN?: number; improper?: boolean; onChange: (f: Frac) => void }) {
  const topMax = p.improper ? (p.maxN ?? 12) : p.f.d;
  const setN = (n: number) => p.onChange({ n: Math.min(topMax, Math.max(1, n)), d: p.f.d });
  const setD = (d: number) => {
    const nd = Math.min(p.maxDen, Math.max(1, d));
    p.onChange({ n: p.improper ? p.f.n : Math.min(p.f.n, nd), d: nd });
  };
  const btn = "h-9 w-9 rounded-lg border border-white/10 bg-white/[0.04] text-lg text-white/80 active:bg-white/10 disabled:opacity-30";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2 text-center">
      <div className="text-xs" style={{ color: p.colour }}>
        {p.label}
      </div>
      <div className="mt-1 flex items-center justify-center gap-2">
        <button className={btn} aria-label={`${p.label} top down`} disabled={p.f.n <= 1} onClick={() => setN(p.f.n - 1)}>
          −
        </button>
        <span className="w-7 font-display text-xl tabular-nums">{p.f.n}</span>
        <button className={btn} aria-label={`${p.label} top up`} disabled={p.f.n >= topMax} onClick={() => setN(p.f.n + 1)}>
          +
        </button>
      </div>
      <div className="mx-auto my-1 h-0.5 w-10 rounded bg-white/50" />
      <div className="flex items-center justify-center gap-2">
        <button className={btn} aria-label={`${p.label} bottom down`} disabled={p.f.d <= 1} onClick={() => setD(p.f.d - 1)}>
          −
        </button>
        <span className="w-7 font-display text-xl tabular-nums">{p.f.d}</span>
        <button className={btn} aria-label={`${p.label} bottom up`} disabled={p.f.d >= p.maxDen} onClick={() => setD(p.f.d + 1)}>
          +
        </button>
      </div>
    </div>
  );
}

/** Area model: columns for the first fraction, rows for the second; the overlap is the product. */
function drawBar(ctx: CanvasRenderingContext2D, w: number, h: number, first: Frac, second: Frac) {
  const L = 46;
  const T = 30;
  const W = w - L - 14;
  const H = h - T - 34;
  const cw = W / first.d;
  const rh = H / second.d;

  // The chocolate.
  ctx.fillStyle = "#3b2418";
  ctx.fillRect(L, T, W, H);
  for (let i = 0; i < first.d; i++)
    for (let j = 0; j < second.d; j++) {
      const inA = i < first.n;
      const inB = j < second.n;
      if (!inA && !inB) continue;
      ctx.fillStyle = inA && inB ? COL.both + "cc" : inA ? COL.first + "40" : COL.second + "40";
      ctx.fillRect(L + i * cw, T + j * rh, cw, rh);
    }
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < first.d; i++) {
    ctx.moveTo(L + i * cw, T);
    ctx.lineTo(L + i * cw, T + H);
  }
  for (let j = 1; j < second.d; j++) {
    ctx.moveTo(L, T + j * rh);
    ctx.lineTo(L + W, T + j * rh);
  }
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 2;
  ctx.strokeRect(L, T, W, H);

  // Brackets: the first fraction along the top, the second down the left side.
  ctx.lineWidth = 2;
  ctx.strokeStyle = COL.first;
  ctx.beginPath();
  ctx.moveTo(L, T - 6);
  ctx.lineTo(L + first.n * cw, T - 6);
  ctx.stroke();
  ctx.fillStyle = COL.first;
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${first.n}/${first.d}`, Math.min(L + (first.n * cw) / 2, w - 30), T - 11);
  ctx.strokeStyle = COL.second;
  ctx.beginPath();
  ctx.moveTo(L - 6, T);
  ctx.lineTo(L - 6, T + second.n * rh);
  ctx.stroke();
  ctx.fillStyle = COL.second;
  ctx.textAlign = "right";
  ctx.fillText(`${second.n}/${second.d}`, L - 10, T + (second.n * rh) / 2 + 4);

  // Count the twice-shaded pieces.
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${first.n * second.n} of ${first.d * second.d} small pieces shaded twice`, L + W / 2, h - 12);
}

/** N laddoos in d equal groups; the first n groups are the fraction taken. */
function drawShare(ctx: CanvasRenderingContext2D, w: number, h: number, N: number, f: Frac) {
  const T = 26;
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "center";
  const laddoo = (x: number, y: number, r: number, on: boolean) => {
    ctx.fillStyle = on ? COL.laddoo : "rgba(251,146,60,0.25)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    if (on && r > 5) {
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  const grid = (count: number, bw: number, bh: number) => {
    const cols = Math.max(1, Math.ceil(Math.sqrt((count * bw) / bh)));
    const rows = Math.max(1, Math.ceil(count / cols));
    return { cols, rows, r: Math.max(2, Math.min(bw / cols, bh / rows) * 0.4) };
  };

  if (N % f.d !== 0) {
    // No equal whole groups: show the laddoos and say so.
    const g = grid(N, w - 20, h - T - 12);
    const cw = (w - 20) / g.cols;
    const rh = (h - T - 12) / g.rows;
    for (let i = 0; i < N; i++) laddoo(10 + cw * ((i % g.cols) + 0.5), T + rh * (Math.floor(i / g.cols) + 0.5), g.r, true);
    ctx.fillStyle = "#facc15";
    ctx.fillText(`${N} laddoos cannot make ${f.d} equal groups of whole laddoos`, w / 2, 16);
    return;
  }

  const per = N / f.d;
  const gc = Math.min(f.d, Math.max(1, Math.round(Math.sqrt((f.d * w) / (h - T)))));
  const gr = Math.ceil(f.d / gc);
  const bw = (w - 12) / gc;
  const bh = (h - T - 6) / gr;
  const inner = grid(per, bw - 12, bh - 12);
  for (let k = 0; k < f.d; k++) {
    const x0 = 6 + (k % gc) * bw;
    const y0 = T + Math.floor(k / gc) * bh;
    const taken = k < f.n;
    ctx.fillStyle = taken ? "rgba(34,211,238,0.10)" : "rgba(255,255,255,0.03)";
    ctx.strokeStyle = taken ? COL.first : "rgba(255,255,255,0.2)";
    ctx.lineWidth = taken ? 2 : 1;
    ctx.beginPath();
    ctx.roundRect(x0 + 3, y0 + 3, bw - 6, bh - 6, 8);
    ctx.fill();
    ctx.stroke();
    const cw = (bw - 12) / inner.cols;
    const rh = (bh - 12) / inner.rows;
    for (let i = 0; i < per; i++) laddoo(x0 + 6 + cw * ((i % inner.cols) + 0.5), y0 + 6 + rh * (Math.floor(i / inner.cols) + 0.5), inner.r, taken);
  }
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText(`${f.d} equal groups of ${per}; ${f.n} of them hold ${f.n * per}`, w / 2, 16);
}

/** A jug's worth of drink laid out as a strip, cut into glasses of one size. */
function drawFit(ctx: CanvasRenderingContext2D, w: number, h: number, whole: Frac, piece: Frac) {
  const { full, rest } = fits(whole, piece);
  const W = value(whole);
  const p = value(piece);
  const reach = rest.n ? (full + 1) * p : W;
  const scale = Math.max(W, reach);
  const L = 16;
  const k = (w - 2 * L) / scale;
  const y = h / 2 - 18;
  const bh = 46;

  // The drink, from 0 to the total.
  ctx.fillStyle = "rgba(34,211,238,0.12)";
  ctx.fillRect(L, y, W * k, bh);
  ctx.strokeStyle = COL.jug;
  ctx.lineWidth = 2;
  ctx.strokeRect(L, y, W * k, bh);

  // Full glasses, alternating colours, numbered when there is room.
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "center";
  for (let i = 0; i < full; i++) {
    const x = L + i * p * k;
    ctx.fillStyle = i % 2 ? COL.second + "88" : COL.both + "aa";
    ctx.fillRect(x + 1, y + 4, p * k - 2, bh - 8);
    if (p * k >= 16) {
      ctx.fillStyle = "#fff";
      ctx.fillText(`${i + 1}`, x + (p * k) / 2, y + bh / 2 + 4);
    }
  }
  // The glass that is only part full.
  if (rest.n) {
    const x = L + full * p * k;
    ctx.fillStyle = "rgba(250,204,21,0.35)";
    ctx.fillRect(x + 1, y + 4, (W - full * p) * k - 1, bh - 8);
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 1, y + 4, p * k - 2, bh - 8);
    ctx.setLineDash([]);
    ctx.fillStyle = "#facc15";
    const label = `${fmtFrac(rest)} of a glass`;
    const lx = Math.min(Math.max(x + (p * k) / 2, L + ctx.measureText(label).width / 2), w - L - ctx.measureText(label).width / 2);
    ctx.fillText(label, lx, y - 8);
  }

  // Litre marks.
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 1;
  const every = scale > 8 ? 2 : 1;
  for (let L1 = 0; L1 <= scale + 1e-9; L1 += every) {
    const x = L + L1 * k;
    ctx.beginPath();
    ctx.moveTo(x, y + bh);
    ctx.lineTo(x, y + bh + 6);
    ctx.stroke();
    ctx.fillText(`${L1} L`, x, y + bh + 19);
  }
  ctx.fillStyle = COL.jug;
  ctx.fillText(`total ${fmtMixed(whole)} litres`, Math.min(L + (W * k) / 2, w - 60), y + bh + 38);
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText(`${full} full glass${full === 1 ? "" : "es"} of ${fmtFrac(piece)} L`, w / 2, 18);
}
