"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import {
  DOUBLING_TIMES,
  POND_FULL_DAY,
  RACE_DAYS,
  SQUARES,
  countingYears,
  formatIndian,
  formatRupees,
  grainsOn,
  halfDay,
  isFirstOver,
  lakhTotal,
  overtakeDay,
  paisaOn,
  paisaTotal,
  pondCover,
  riceTonnes,
  sci,
  sup,
  totalTo,
  type GrainRound,
} from "@/lib/sim/chessboard";

export type ChessMode = "board" | "race" | "pond";

export type ChessReading =
  | { mode: "board"; square: number }
  | { mode: "race"; day: number }
  | { mode: "pond"; day: number; T: number; cover: number }
  | { mode: "round"; ok: boolean };

interface Props {
  onReading?: (r: ChessReading) => void;
  /** Challenge: pick the first square holding more grains than this amount. */
  round?: GrainRound | null;
}

const MODES: { id: ChessMode; label: string }[] = [
  { id: "board", label: "Board" },
  { id: "race", label: "Race" },
  { id: "pond", label: "Pond" },
];

const COL = { cyan: "#22d3ee", pink: "#f472b6", lime: "#a3e635", violet: "#a78bfa", amber: "#facc15" };
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Board geometry shared by drawing and tapping. */
function boardBox(w: number, h: number) {
  const side = Math.min(w - 16, h - 16);
  return { x0: (w - side) / 2, y0: (h - side) / 2, cell: side / 8 };
}

/** Tonnes in words: milligrams or grams when tiny, crore tonnes when huge. */
function massText(t: number) {
  if (t < 1e-6) return `about ${Math.round(t * 1e9).toLocaleString("en-IN")} mg`;
  if (t < 1e-3) return `about ${Math.round(t * 1e6).toLocaleString("en-IN")} g`;
  if (t < 1) return `about ${Math.round(t * 1000).toLocaleString("en-IN")} kg`;
  if (t < 1e7) return `about ${Math.round(t).toLocaleString("en-IN")} tonnes`;
  return `about ${Math.round(t / 1e7).toLocaleString("en-IN")} crore tonnes`;
}

export default function ChessboardLab({ onReading, round = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<ChessMode>("board");
  const [square, setSquare] = useState(1);
  const [day, setDay] = useState(1);
  const [pondDay, setPondDay] = useState(20);
  const [T, setT] = useState(1);
  const [checked, setChecked] = useState<number | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const cover = pondCover(pondDay, T);
  const shownMode: ChessMode = round ? "board" : mode;

  useEffect(() => {
    if (round) return;
    if (mode === "board") onReadingRef.current?.({ mode, square });
    else if (mode === "race") onReadingRef.current?.({ mode, day });
    else onReadingRef.current?.({ mode, day: pondDay, T, cover });
  }, [round, mode, square, day, pondDay, T, cover]);

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
    if (shownMode === "board") drawBoard(ctx, size.w, size.h, square, !round || checked !== null);
    else if (shownMode === "race") drawRace(ctx, size.w, size.h, day);
    else drawPond(ctx, size.w, size.h, pondDay, T);
  }, [size, shownMode, square, round, checked, day, pondDay, T]);

  const pick = (s: number) => {
    setSquare(clamp(s, 1, SQUARES));
    setChecked(null);
  };

  const onTap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (shownMode !== "board") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const { x0, y0, cell } = boardBox(rect.width, rect.height);
    const col = Math.floor((e.clientX - rect.left - x0) / cell);
    const row = Math.floor((e.clientY - rect.top - y0) / cell);
    if (col >= 0 && col < 8 && row >= 0 && row < 8) pick(row * 8 + col + 1);
  };

  const check = () => {
    if (!round) return;
    setChecked(square);
    onReadingRef.current?.({ mode: "round", ok: isFirstOver(square, round) });
  };

  const canvas = (
    <canvas
      ref={canvasRef}
      onPointerDown={onTap}
      className={`h-60 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-72 ${shownMode === "board" ? "cursor-pointer" : ""}`}
      role="img"
      aria-label={
        shownMode === "board"
          ? `Chessboard with square ${square} picked`
          : shownMode === "race"
            ? `Race on day ${day}: Offer A ${formatRupees(lakhTotal(day))}, Offer B ${formatRupees(paisaTotal(day))}`
            : `Lotus pond on day ${pondDay}, ${pct(cover)} covered`
      }
    />
  );

  const squarePad = (
    <div className="grid grid-cols-4 gap-2">
      <button className="btn-ghost !px-1 !py-2 text-sm" aria-label="Back a row" onClick={() => pick(square - 8)} disabled={square <= 1}>
        −8
      </button>
      <button className="btn-ghost !px-1 !py-2 text-sm" aria-label="Back a square" onClick={() => pick(square - 1)} disabled={square <= 1}>
        −1
      </button>
      <button className="btn-ghost !px-1 !py-2 text-sm" aria-label="Next square" onClick={() => pick(square + 1)} disabled={square >= SQUARES}>
        +1
      </button>
      <button className="btn-ghost !px-1 !py-2 text-sm" aria-label="Next row" onClick={() => pick(square + 8)} disabled={square >= SQUARES}>
        +8
      </button>
    </div>
  );

  if (round) {
    const ok = checked !== null && isFirstOver(checked, round);
    return (
      <div className="flex flex-col gap-3 select-none">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
          <div className="text-[11px] tracking-wider text-white/50">First square with more than</div>
          <div className="font-display mt-1 text-lg text-cyan-100 tabular-nums">{formatIndian(round.amount)} grains</div>
        </div>
        {canvas}
        <div className="grid grid-cols-2 gap-2 text-center">
          <Readout label="Your square" value={`${square}`} colour="text-white" />
          <Readout label="Grains on it" value={checked === square ? formatIndian(grainsOn(square)) : "?"} colour="text-amber-200" />
        </div>
        {squarePad}
        <button className="btn-primary !py-2 text-sm" onClick={check}>
          Put grains on square {square}
        </button>
        {checked !== null && (
          <p className={`text-center text-sm ${ok ? "text-lime-300" : "text-amber-200"}`}>
            {ok
              ? `Spot on! Square ${checked} holds 2${sup(checked - 1)} = ${formatIndian(grainsOn(checked))}, and square ${checked - 1} only ${formatIndian(grainsOn(checked - 1))}.`
              : grainsOn(checked) <= BigInt(round.amount)
                ? `Not enough: square ${checked} holds ${formatIndian(grainsOn(checked))}. Go further along.`
                : `Square ${checked} has more, but so does an earlier square. Go back and find the first one.`}
          </p>
        )}
      </div>
    );
  }

  const g = grainsOn(square);
  const tot = totalTo(square);

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

      {mode === "board" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Square" value={`${square}`} colour="text-white" />
            <Readout label="On this square" value={`2${sup(square - 1)}`} colour="text-amber-200" />
            <Readout label="Total so far" value={`2${sup(square)} − 1`} colour="text-lime-200" />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-white/50">On square {square}</span>
              <span className="text-right tabular-nums text-amber-200 break-all">{formatIndian(g)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-white/50">Squares 1 to {square}</span>
              <span className="text-right tabular-nums text-lime-200 break-all">{formatIndian(tot)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-white/50">About</span>
              <span className="text-right tabular-nums text-white/80">
                {sci(tot)} {tot === BigInt(1) ? "grain" : "grains"}, {massText(riceTonnes(tot))}
              </span>
            </div>
          </div>
          {squarePad}
          <p className="text-center text-xs text-white/40">
            {square === SQUARES
              ? `Counting it all at one grain a second would take about ${Math.round(countingYears(tot) / 1e9)} billion years.`
              : square > 1
                ? `The total is one less than the ${formatIndian(grainsOn(square + 1))} grains waiting on square ${square + 1}.`
                : "Tap a square or use the buttons. Each square doubles the one before."}
          </p>
        </>
      )}

      {mode === "race" && (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Readout label="Offer A: ₹1 lakh a day" value={formatRupees(lakhTotal(day))} colour="text-cyan-200" />
            <Readout label="Offer B: 1 paisa doubled" value={formatRupees(paisaTotal(day))} colour="text-pink-200" />
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <button className="btn-ghost !px-4 !py-2 text-lg" aria-label="Day before" onClick={() => setDay((d) => Math.max(1, d - 1))} disabled={day <= 1}>
              −
            </button>
            <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: COL.lime }}>Day</span>
                <span className="tabular-nums text-white">{day}</span>
              </div>
              <input type="range" aria-label="Day" className="range mt-1 w-full" min={1} max={RACE_DAYS} step={1} value={day} onChange={(e) => setDay(Number(e.target.value))} />
            </label>
            <button className="btn-ghost !px-4 !py-2 text-lg" aria-label="Next day" onClick={() => setDay((d) => Math.min(RACE_DAYS, d + 1))} disabled={day >= RACE_DAYS}>
              +
            </button>
          </div>
          <p className="text-center text-xs text-white/40">
            Day {day}: Offer B gives {formatRupees(paisaOn(day))} today.{" "}
            {day >= overtakeDay() ? `Offer B has overtaken (from day ${overtakeDay()}).` : "Offer A is ahead."}
          </p>
        </>
      )}

      {mode === "pond" && (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Readout label="Day" value={`${pondDay}`} colour="text-white" />
            <Readout label="Pond covered" value={pct(cover)} colour="text-lime-200" />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <div className="text-sm" style={{ color: COL.pink }}>
              Leaves double every
            </div>
            <div className="mt-1 grid grid-cols-3 gap-1">
              {DOUBLING_TIMES.map((t) => (
                <button key={t} onClick={() => setT(t)} className={`rounded-lg border py-1.5 text-sm ${T === t ? "border-pink-300 bg-pink-300/15" : "border-white/10 text-white/70"}`}>
                  {t === 1 ? "1 day" : `${t} days`}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <button className="btn-ghost !px-4 !py-2 text-lg" aria-label="Pond day before" onClick={() => setPondDay((d) => Math.max(0, d - 1))} disabled={pondDay <= 0}>
              −
            </button>
            <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: COL.lime }}>Pond day</span>
                <span className="tabular-nums text-white">{pondDay}</span>
              </div>
              <input type="range" aria-label="Pond day" className="range mt-1 w-full" min={0} max={POND_FULL_DAY} step={1} value={pondDay} onChange={(e) => setPondDay(Number(e.target.value))} />
            </label>
            <button className="btn-ghost !px-4 !py-2 text-lg" aria-label="Pond day after" onClick={() => setPondDay((d) => Math.min(POND_FULL_DAY, d + 1))} disabled={pondDay >= POND_FULL_DAY}>
              +
            </button>
          </div>
          <p className="text-center text-xs text-white/40">
            {pondDay === halfDay(T)
              ? `Half covered on day ${pondDay}, just ${T === 1 ? "1 day" : `${T} days`} before the pond is full on day ${POND_FULL_DAY}.`
              : `The pond is full on day ${POND_FULL_DAY}. When is it exactly half covered?`}
          </p>
        </>
      )}
    </div>
  );
}

/** A share of the pond as a percentage, with more decimals when it is tiny. */
function pct(f: number) {
  if (f >= 0.1) return `${Number((f * 100).toFixed(1))}%`;
  if (f >= 0.001) return `${Number((f * 100).toFixed(2))}%`;
  return `${Number((f * 100).toPrecision(2))}%`;
}

function Readout({ label, value, colour }: { label: string; value: string; colour: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] tracking-wider text-white/50">{label}</div>
      <div className={`font-display text-base tabular-nums sm:text-lg ${colour} break-words`}>{value}</div>
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

/** The board: squares up to the picked one glow amber, brighter as the grains grow. */
function drawBoard(ctx: CanvasRenderingContext2D, w: number, h: number, square: number, fill: boolean) {
  const { x0, y0, cell } = boardBox(w, h);
  for (let s = 1; s <= SQUARES; s++) {
    const row = Math.floor((s - 1) / 8);
    const col = (s - 1) % 8;
    const x = x0 + col * cell;
    const y = y0 + row * cell;
    const dark = (row + col) % 2 === 1;
    ctx.fillStyle = dark ? "#151a33" : "#232a4d";
    ctx.fillRect(x, y, cell, cell);
    if (fill && s <= square) {
      ctx.fillStyle = `rgba(250, 204, 21, ${0.15 + (0.75 * s) / SQUARES})`;
      ctx.fillRect(x, y, cell, cell);
    }
    if (cell >= 22) label(ctx, `${s}`, x + 3, y + 11, fill && s <= square && s > 40 ? "#0a0d1c" : "rgba(255,255,255,0.45)", "left", "9px system-ui, sans-serif");
  }
  const row = Math.floor((square - 1) / 8);
  const col = (square - 1) % 8;
  ctx.strokeStyle = COL.cyan;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x0 + col * cell + 1.5, y0 + row * cell + 1.5, cell - 3, cell - 3);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x0, y0, cell * 8, cell * 8);
}

/** Running totals of both offers over 30 days, in rupees, on the same scale. */
function drawRace(ctx: CanvasRenderingContext2D, w: number, h: number, day: number) {
  const top = 18;
  const left = 58;
  const right = w - 12;
  const bottom = h - 28;
  const maxR = 1.2e7;
  const X = (d: number) => left + ((right - left) * (d - 1)) / (RACE_DAYS - 1);
  const Y = (rupees: number) => bottom - ((bottom - top) * Math.min(rupees, maxR)) / maxR;
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.stroke();
  for (const [v, t] of [
    [0, "₹0"],
    [5e6, "₹50 lakh"],
    [1e7, "₹1 crore"],
  ] as const)
    label(ctx, t, left - 6, Y(v) + 4, "rgba(255,255,255,0.5)", "right", "11px system-ui, sans-serif");
  for (const d of [1, 10, 20, 30]) label(ctx, `${d}`, X(d), bottom + 14, "rgba(255,255,255,0.5)", d === 30 ? "right" : "center");
  label(ctx, "day", (left + right) / 2, bottom + 26, "rgba(255,255,255,0.35)", "center", "11px system-ui, sans-serif");
  const line = (val: (d: number) => number, colour: string) => {
    ctx.strokeStyle = colour;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let d = 1; d <= day; d++) {
      if (d === 1) ctx.moveTo(X(d), Y(val(d)));
      else ctx.lineTo(X(d), Y(val(d)));
    }
    ctx.stroke();
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(X(day), Y(val(day)), 4, 0, Math.PI * 2);
    ctx.fill();
  };
  line((d) => Number(lakhTotal(d)) / 100, COL.cyan);
  line((d) => Number(paisaTotal(d)) / 100, COL.pink);
  label(ctx, "A: ₹1 lakh a day", left + 6, top + 4, COL.cyan);
  label(ctx, "B: 1 paisa doubled", left + 6, top + 20, COL.pink);
  const o = overtakeDay();
  if (day >= o) {
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = COL.lime + "aa";
    ctx.beginPath();
    ctx.moveTo(X(o), top + 28);
    ctx.lineTo(X(o), bottom);
    ctx.stroke();
    ctx.setLineDash([]);
    label(ctx, `B ahead from day ${o}`, X(o) - 6, top + 40, COL.lime, "right");
  }
}

/** Fixed, scattered order in which the 256 leaf spots fill, spreading out from one corner. */
const LEAF_ORDER = (() => {
  const cells: { i: number; j: number; k: number }[] = [];
  for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) cells.push({ i, j, k: Math.hypot(i, j) + 2.5 * Math.abs(Math.sin(i * 12.9898 + j * 78.233)) });
  return cells.sort((a, b) => a.k - b.k);
})();

/** The pond as a 16 × 16 grid of leaf spots: each spot is 1/256 of the pond. */
function drawPond(ctx: CanvasRenderingContext2D, w: number, h: number, day: number, T: number) {
  const top = 26;
  const side = Math.min(w - 24, h - top - 10);
  const x0 = (w - side) / 2;
  const y0 = top;
  ctx.fillStyle = "#0b3b5a";
  ctx.beginPath();
  ctx.roundRect(x0, y0, side, side, 12);
  ctx.fill();
  const cell = side / 16;
  const leaves = pondCover(day, T) * 256;
  const whole = Math.floor(leaves);
  LEAF_ORDER.forEach((c, n) => {
    const part = n < whole ? 1 : n === whole ? leaves - whole : 0;
    if (part <= 0) return;
    ctx.fillStyle = "#4ade80";
    ctx.beginPath();
    ctx.arc(x0 + (c.j + 0.5) * cell, y0 + (c.i + 0.5) * cell, cell * 0.48 * Math.sqrt(part), 0, Math.PI * 2);
    ctx.fill();
  });
  label(ctx, `Day ${day} of ${POND_FULL_DAY}`, x0, 17, "rgba(255,255,255,0.75)", "left", "bold 12px system-ui, sans-serif");
  label(ctx, `${pct(pondCover(day, T))} covered`, x0 + side, 17, COL.lime, "right", "bold 12px system-ui, sans-serif");
}
