"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import {
  CUPS,
  GLASSES,
  LEMONS_MAX,
  MAP_SCALE_M,
  PLACES,
  RECIPE,
  SAMPLE,
  SUGAR_MAX,
  fillsOrder,
  kmOk,
  mapCm,
  mixColour,
  realKm,
  sameRatio,
  simplest,
  taste,
  type PaintOrder,
  type Place,
} from "@/lib/sim/proportion";

export type RatioMode = "paint" | "recipe" | "map";

export type RatioReading =
  | { mode: "paint"; blue: number; yellow: number; same: boolean }
  | { mode: "recipe"; glasses: number; lemons: number; sugar: number; right: boolean }
  | { mode: "map"; place: string; ok: boolean }
  | { mode: "order"; ok: boolean };

interface Props {
  onReading?: (r: RatioReading) => void;
  /** Challenge: mix this order's shade in exactly its number of cups. */
  order?: PaintOrder | null;
}

const fmt = (v: number) => (Number.isInteger(v) ? `${v}` : `${Math.round(v * 100) / 100}`);

export default function RatioLab({ onReading, order = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<RatioMode>("paint");
  const [mix, setMixState] = useState(order ? { blue: 0, yellow: 0 } : { ...SAMPLE });
  const [matches, setMatches] = useState<string[]>(order ? [] : [`${SAMPLE.blue}:${SAMPLE.yellow}`]);
  const [drink, setDrink] = useState({ glasses: 4, lemons: 2, sugar: 6 });
  const [place, setPlace] = useState<Place>(PLACES[0]);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState<{ id: string; ok: boolean } | null>(null);
  const [solved, setSolved] = useState<string[]>([]);
  const [delivered, setDelivered] = useState<boolean | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: RatioMode = order ? "paint" : mode;
  const target = order ?? SAMPLE;
  const same = sameRatio(mix.blue, mix.yellow, target.blue, target.yellow);
  const t = taste(drink.glasses, drink.lemons, drink.sugar);

  const setMix = (blue: number, yellow: number) => {
    const b = Math.max(CUPS.min, Math.min(CUPS.max, blue));
    const y = Math.max(CUPS.min, Math.min(CUPS.max, yellow));
    setMixState({ blue: b, yellow: y });
    setDelivered(null);
    if (sameRatio(b, y, target.blue, target.yellow)) setMatches((m) => (m.includes(`${b}:${y}`) ? m : [...m, `${b}:${y}`]));
  };

  useEffect(() => {
    if (order) return;
    if (activeMode === "paint") onReadingRef.current?.({ mode: "paint", blue: mix.blue, yellow: mix.yellow, same });
    else if (activeMode === "recipe") onReadingRef.current?.({ mode: "recipe", ...drink, right: t.right });
  }, [order, activeMode, mix, same, drink, t.right]);

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
    if (activeMode === "paint") drawPaint(ctx, size.w, size.h, mix.blue, mix.yellow, target, matches, !!order);
    else if (activeMode === "recipe") drawRecipe(ctx, size.w, size.h, drink.glasses, drink.lemons, drink.sugar);
    else drawMap(ctx, size.w, size.h, place, solved);
  }, [size, activeMode, mix, target, matches, order, drink, place, solved]);

  const check = () => {
    const ok = kmOk(Number(answer.replace(",", ".")), place);
    setChecked({ id: place.id, ok });
    if (ok) setSolved((s) => (s.includes(place.id) ? s : [...s, place.id]));
    onReadingRef.current?.({ mode: "map", place: place.id, ok });
  };

  const deliver = () => {
    if (!order) return;
    const ok = fillsOrder(mix.blue, mix.yellow, order);
    setDelivered(ok);
    onReadingRef.current?.({ mode: "order", ok });
  };

  const [sb, sy] = simplest(mix.blue, mix.yellow);
  const total = mix.blue + mix.yellow;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!order && (
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["paint", "recipe", "map"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${activeMode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m === "paint" ? "Paint" : m === "recipe" ? "Recipe" : "Map"}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={
          activeMode === "paint"
            ? `Bucket with ${mix.blue} cups blue and ${mix.yellow} cups yellow, ${same ? "the same shade as" : "a different shade from"} the sample ${target.blue} : ${target.yellow}. A graph plots yellow cups against blue cups.`
            : activeMode === "recipe"
              ? `Nimbu-paani for ${drink.glasses} glasses with ${drink.lemons} lemons and ${drink.sugar} spoons of sugar`
              : `Town map with Home in the middle. The ${place.name} is ${fmt(mapCm(place))} cm away on the map.`
        }
      />

      {activeMode === "paint" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Blue : yellow" value={`${mix.blue} : ${mix.yellow}`} colour="text-white" />
            <Readout label="Simplest" value={total && mix.blue && mix.yellow ? `${sb} : ${sy}` : "–"} colour="text-cyan-200" />
            <Readout label="Total cups" value={`${total}`} colour="text-lime-200" />
          </div>
          <div
            className={`rounded-2xl border px-4 py-2 text-center text-sm ${
              same ? "border-lime-300/40 bg-lime-300/10 text-lime-100" : "border-white/10 bg-white/[0.03] text-white/70"
            }`}
          >
            {same
              ? `Same shade as the sample: ${mix.blue} : ${mix.yellow} = ${target.blue} : ${target.yellow}`
              : total === 0
                ? "The bucket is empty. Add some paint."
                : `Not the sample's shade: ${mix.blue} × ${target.yellow} = ${mix.blue * target.yellow}, but ${mix.yellow} × ${target.blue} = ${mix.yellow * target.blue}`}
          </div>
          <Stepper label="Blue cups" thing="blue" colour="#60a5fa" value={mix.blue} min={CUPS.min} max={CUPS.max} onChange={(v) => setMix(v, mix.yellow)} />
          <Stepper label="Yellow cups" thing="yellow" colour="#facc15" value={mix.yellow} min={CUPS.min} max={CUPS.max} onChange={(v) => setMix(mix.blue, v)} />
          <button className="btn-ghost !py-2 text-sm" onClick={() => setMix(0, 0)}>
            Empty the bucket
          </button>
          {order && (
            <>
              <button className="btn-primary !py-2 text-sm" onClick={deliver}>
                Deliver the order
              </button>
              {delivered !== null && (
                <p className={`text-center text-sm ${delivered ? "text-lime-300" : "text-amber-200"}`}>
                  {delivered
                    ? `Delivered! ${mix.blue} : ${mix.yellow} = ${order.blue} : ${order.yellow}, and ${mix.blue} + ${mix.yellow} = ${order.total} cups.`
                    : !same
                      ? `Wrong shade: ${mix.blue} : ${mix.yellow} is not ${order.blue} : ${order.yellow}.`
                      : `Right shade, but ${total} cups, not ${order.total}.`}
                </p>
              )}
            </>
          )}
        </>
      )}

      {activeMode === "recipe" && (
        <>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-center text-sm text-white/70">
            Recipe card: for {RECIPE.glasses} glasses, {RECIPE.lemons} lemons and {RECIPE.sugar} spoons of sugar
          </div>
          <div
            className={`rounded-2xl border px-4 py-2 text-center text-sm ${
              t.right ? "border-lime-300/40 bg-lime-300/10 text-lime-100" : "border-amber-300/40 bg-amber-300/10 text-amber-100"
            }`}
          >
            {t.right
              ? `Tastes just like Grandma's: ${drink.lemons} : ${drink.glasses} = ${RECIPE.lemons} : ${RECIPE.glasses}`
              : [t.lemon > 0 ? "Too sour" : t.lemon < 0 ? "Not lemony enough" : "Lemon is right", t.sweet > 0 ? "too sweet" : t.sweet < 0 ? "not sweet enough" : "sugar is right"].join(", ")}
          </div>
          <Stepper label="Glasses" thing="glasses" colour="#a5f3fc" value={drink.glasses} min={GLASSES.min} max={GLASSES.max} step={GLASSES.step} onChange={(v) => setDrink((d) => ({ ...d, glasses: v }))} />
          <Stepper label="Lemons" thing="lemons" colour="#facc15" value={drink.lemons} min={0} max={LEMONS_MAX} onChange={(v) => setDrink((d) => ({ ...d, lemons: v }))} />
          <Stepper label="Spoons of sugar" thing="sugar" colour="#f9a8d4" value={drink.sugar} min={0} max={SUGAR_MAX} onChange={(v) => setDrink((d) => ({ ...d, sugar: v }))} />
        </>
      )}

      {activeMode === "map" && (
        <>
          <div className="grid grid-cols-4 gap-1.5">
            {PLACES.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setPlace(p);
                  setChecked(null);
                  setAnswer("");
                }}
                aria-label={p.name}
                className={`rounded-xl border px-1 py-2 text-xs ${place.id === p.id ? "border-cyan-300 bg-cyan-300/15 text-white" : "border-white/10 text-white/70"}`}
              >
                <span aria-hidden>{p.emoji}</span> {p.name}
                {solved.includes(p.id) ? " ✓" : ""}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Readout label="Map distance" value={`${fmt(mapCm(place))} cm`} colour="text-cyan-200" />
            <Readout label="Scale" value={`1 cm : ${MAP_SCALE_M} m`} colour="text-white" />
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-white/70">
              <span className="shrink-0">Real</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  setChecked(null);
                }}
                aria-label="Real distance in km"
                className="w-full min-w-0 rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-white"
              />
              <span className="shrink-0">km</span>
            </label>
            <button className="btn-primary !px-4 !py-1.5 text-sm" onClick={check} disabled={!answer}>
              Check
            </button>
          </div>
          {checked?.id === place.id && (
            <p className={`text-center text-sm ${checked.ok ? "text-lime-300" : "text-amber-200"}`}>
              {checked.ok
                ? `Right: ${fmt(mapCm(place))} × ${MAP_SCALE_M} m = ${fmt(mapCm(place) * MAP_SCALE_M)} m = ${fmt(realKm(mapCm(place)))} km.`
                : "Not quite. Multiply the map distance by 500 m, then change metres to km (1 km = 1000 m)."}
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

function Stepper(p: { label: string; thing: string; colour: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  const step = p.step ?? 1;
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <button
        className="h-9 w-9 shrink-0 rounded-lg border border-white/15 text-lg text-white/80 disabled:opacity-30"
        onClick={() => p.onChange(Math.max(p.min, p.value - step))}
        disabled={p.value <= p.min}
        aria-label={`Less ${p.thing}`}
      >
        −
      </button>
      <label className="min-w-0 flex-1">
        <div className="flex justify-between text-sm">
          <span style={{ color: p.colour }}>{p.label}</span>
          <span className="tabular-nums text-white">{p.value}</span>
        </div>
        <input
          type="range"
          className="range mt-1 w-full"
          min={p.min}
          max={p.max}
          step={step}
          value={p.value}
          onChange={(e) => p.onChange(Number(e.target.value))}
          aria-label={p.label}
        />
      </label>
      <button
        className="h-9 w-9 shrink-0 rounded-lg border border-white/15 text-lg text-white/80 disabled:opacity-30"
        onClick={() => p.onChange(Math.min(p.max, p.value + step))}
        disabled={p.value >= p.max}
        aria-label={`More ${p.thing}`}
      >
        +
      </button>
    </div>
  );
}

function drawPaint(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  blue: number,
  yellow: number,
  target: { blue: number; yellow: number },
  matches: string[],
  isOrder: boolean,
) {
  // Left: the sample swatch and the bucket. Right: the graph.
  const L = Math.min(150, w * 0.36);
  const cx = L / 2 + 4;
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "center";

  // Sample swatch.
  const sr = Math.min(22, L * 0.18);
  ctx.fillStyle = mixColour(target.blue, target.yellow);
  ctx.beginPath();
  ctx.arc(cx, 16 + sr, sr, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText(isOrder ? `Order ${target.blue} : ${target.yellow}` : `Sample ${target.blue} : ${target.yellow}`, cx, 16 + 2 * sr + 16);

  // Bucket, filled up to the number of cups (12 + 12 cups would fill it).
  const top = 16 + 2 * sr + 30;
  const bot = h - 26;
  const bw = Math.min(L - 24, 110);
  const tw = bw;
  const bw2 = bw * 0.78;
  const total = blue + yellow;
  const level = total / (2 * CUPS.max);
  const fillTop = bot - (bot - top) * level;
  const xAt = (y: number, side: -1 | 1) => cx + side * (bw2 / 2 + ((tw - bw2) / 2) * ((bot - y) / (bot - top)));
  if (total > 0) {
    ctx.fillStyle = mixColour(blue, yellow);
    ctx.beginPath();
    ctx.moveTo(xAt(bot, -1), bot);
    ctx.lineTo(xAt(bot, 1), bot);
    ctx.lineTo(xAt(fillTop, 1), fillTop);
    ctx.lineTo(xAt(fillTop, -1), fillTop);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(xAt(top, -1), top);
  ctx.lineTo(xAt(bot, -1), bot);
  ctx.lineTo(xAt(bot, 1), bot);
  ctx.lineTo(xAt(top, 1), top);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText(`You: ${blue} : ${yellow}`, cx, h - 8);

  // Graph: blue cups across, yellow cups up, 0 to 12.
  const gx0 = L + 30;
  const gx1 = w - 14;
  const gy0 = h - 30;
  const gy1 = 18;
  const X = (v: number) => gx0 + ((gx1 - gx0) * v) / CUPS.max;
  const Y = (v: number) => gy0 - ((gy0 - gy1) * v) / CUPS.max;
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1;
  for (let v = 0; v <= CUPS.max; v += 2) {
    ctx.beginPath();
    ctx.moveTo(X(v), gy0);
    ctx.lineTo(X(v), gy1);
    ctx.moveTo(gx0, Y(v));
    ctx.lineTo(gx1, Y(v));
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(gx0, gy1);
  ctx.lineTo(gx0, gy0);
  ctx.lineTo(gx1, gy0);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "11px system-ui, sans-serif";
  for (let v = 0; v <= CUPS.max; v += 4) {
    ctx.textAlign = "center";
    ctx.fillText(`${v}`, X(v), gy0 + 13);
    ctx.textAlign = "right";
    if (v) ctx.fillText(`${v}`, gx0 - 5, Y(v) + 4);
  }
  ctx.textAlign = "right";
  ctx.fillStyle = "#60a5fa";
  ctx.fillText("blue cups →", gx1, gy0 + 26);
  ctx.textAlign = "left";
  ctx.fillStyle = "#facc15";
  ctx.fillText("↑ yellow cups", gx0 + 4, gy1 - 6);

  // The sample's line through (0, 0).
  const end = Math.min(CUPS.max, (CUPS.max * target.blue) / target.yellow);
  ctx.strokeStyle = "rgba(163,230,53,0.7)";
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(X(0), Y(0));
  ctx.lineTo(X(end), Y((end * target.yellow) / target.blue));
  ctx.stroke();
  ctx.setLineDash([]);

  // Your mix's line, faint, when it is off the sample's line.
  if (total > 0 && !sameRatio(blue, yellow, target.blue, target.yellow)) {
    const e2 = blue === 0 ? 0 : Math.min(CUPS.max, (CUPS.max * blue) / Math.max(yellow, 1e-9));
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.moveTo(X(0), Y(0));
    if (blue === 0) ctx.lineTo(X(0), Y(CUPS.max));
    else ctx.lineTo(X(e2), Y(yellow ? (e2 * yellow) / blue : 0));
    ctx.stroke();
  }

  // Matching mixes found, then your mix.
  for (const m of matches) {
    const [b, y] = m.split(":").map(Number);
    ctx.fillStyle = mixColour(b, y);
    ctx.strokeStyle = "#a3e635";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(X(b), Y(y), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(X(blue), Y(yellow), 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.textAlign = "left";
}

function drawRecipe(ctx: CanvasRenderingContext2D, w: number, h: number, glasses: number, lemons: number, sugar: number) {
  const t = taste(glasses, lemons, sugar);
  const pad = 12;
  const cell = (w - 2 * pad) / 12;
  const rowH = Math.min(cell, 34);
  const gsz = Math.min(cell * 0.62, 22);
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "left";
  let y = 18;

  ctx.fillStyle = "#a5f3fc";
  ctx.fillText(`${glasses} glasses`, pad, y);
  y += 6;
  // Lemon water: paler when weak, deeper when sour.
  const tint = t.lemon > 0 ? "rgba(250,204,21,0.85)" : t.lemon < 0 ? "rgba(250,250,210,0.35)" : "rgba(253,230,138,0.7)";
  for (let i = 0; i < glasses; i++) {
    const gx = pad + (i % 12) * cell + (cell - gsz) / 2;
    const gy = y + Math.floor(i / 12) * rowH + (rowH - gsz) / 2;
    ctx.fillStyle = tint;
    ctx.beginPath();
    ctx.moveTo(gx + gsz * 0.12, gy + gsz * 0.3);
    ctx.lineTo(gx + gsz * 0.88, gy + gsz * 0.3);
    ctx.lineTo(gx + gsz * 0.78, gy + gsz);
    ctx.lineTo(gx + gsz * 0.22, gy + gsz);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + gsz * 0.2, gy + gsz);
    ctx.lineTo(gx + gsz * 0.8, gy + gsz);
    ctx.lineTo(gx + gsz, gy);
    ctx.stroke();
  }
  y += 2 * rowH + 18;

  ctx.fillStyle = "#facc15";
  ctx.fillText(`${lemons} lemons`, pad, y);
  y += 6;
  const lr = Math.min(cell * 0.32, 10);
  for (let i = 0; i < lemons; i++) {
    const lx = pad + i * cell + cell / 2;
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.ellipse(lx, y + lr + 2, lr * 1.2, lr, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#65a30d";
    ctx.beginPath();
    ctx.arc(lx + lr * 1.1, y + 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  y += 2 * lr + 24;

  ctx.fillStyle = "#f9a8d4";
  ctx.fillText(`${sugar} spoons of sugar`, pad, y);
  y += 8;
  const sc = (w - 2 * pad) / 18;
  const sr = Math.min(sc * 0.3, 6);
  for (let i = 0; i < sugar; i++) {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.arc(pad + (i % 18) * sc + sc / 2, y + sr + Math.floor(i / 18) * (2 * sr + 6), sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Per-glass amounts, at the bottom.
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.textAlign = "center";
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText(`Per glass: ${fmt(lemons / glasses)} lemon, ${fmt(sugar / glasses)} spoons · recipe: ½ lemon, 1½ spoons`, w / 2, h - 10, w - 16);
  ctx.textAlign = "left";
}

function drawMap(ctx: CanvasRenderingContext2D, w: number, h: number, sel: Place, solved: string[]) {
  const VX = 9.5;
  const VY = 7.2;
  const k = Math.min(w / (2 * VX), (h - 20) / (2 * VY));
  const cx = w / 2;
  const cy = (h - 20) / 2 + 2;
  const P = (x: number, y: number) => ({ x: cx + x * k, y: cy - y * k });

  // 1 cm squares.
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let x = -9; x <= 9; x++) {
    ctx.beginPath();
    ctx.moveTo(P(x, -7).x, P(x, -7).y);
    ctx.lineTo(P(x, 7).x, P(x, 7).y);
    ctx.stroke();
  }
  for (let y = -7; y <= 7; y++) {
    ctx.beginPath();
    ctx.moveTo(P(-9, y).x, P(-9, y).y);
    ctx.lineTo(P(9, y).x, P(9, y).y);
    ctx.stroke();
  }
  // A river for the look of a map.
  ctx.strokeStyle = "rgba(56,189,248,0.25)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(P(-9, -6.5).x, P(-9, -6.5).y);
  ctx.bezierCurveTo(P(-3, -5).x, P(-3, -5).y, P(1, -7).x, P(1, -7).y, P(5, -3).x, P(5, -3).y);
  ctx.stroke();

  // Line from Home to the chosen place.
  const home = P(0, 0);
  const to = P(sel.x, sel.y);
  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(home.x, home.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.setLineDash([]);
  const len = Math.hypot(to.x - home.x, to.y - home.y) || 1;
  const nx = -(to.y - home.y) / len;
  const ny = (to.x - home.x) / len;
  ctx.font = "bold 12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#22d3ee";
  const mx = (home.x + to.x) / 2 + nx * 14;
  const my = (home.y + to.y) / 2 + ny * 14;
  ctx.fillText(`${fmt(mapCm(sel))} cm`, mx, my + 4);

  const label = (x: number, y: number, emoji: string, name: string, on: boolean) => {
    ctx.font = "18px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText(emoji, x, y + 6);
    ctx.font = "11px system-ui, sans-serif";
    const tw = ctx.measureText(name).width;
    const lx = Math.max(tw / 2 + 4, Math.min(w - tw / 2 - 4, x));
    ctx.fillStyle = on ? "#a5f3fc" : "rgba(255,255,255,0.7)";
    ctx.fillText(name, lx, Math.min(h - 24, y + 22));
  };
  label(home.x, home.y, "🏠", "Home", true);
  for (const p of PLACES) {
    const q = P(p.x, p.y);
    label(q.x, q.y, p.emoji, p.name + (solved.includes(p.id) ? " ✓" : ""), p.id === sel.id);
  }

  // Scale bar.
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(10, h - 10);
  ctx.lineTo(10 + k, h - 10);
  ctx.moveTo(10, h - 14);
  ctx.lineTo(10, h - 6);
  ctx.moveTo(10 + k, h - 14);
  ctx.lineTo(10 + k, h - 6);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`1 cm = ${MAP_SCALE_M} m`, 16 + k, h - 6);
}
