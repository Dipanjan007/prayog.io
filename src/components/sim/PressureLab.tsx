"use client";

import { useEffect, useRef, useState } from "react";
import {
  BAG,
  BRICK,
  CUTTERS,
  G,
  P_ATM,
  RHO_WATER,
  SUCKER,
  SUCKER_AREA,
  airForce,
  brickFaceArea,
  cuts,
  dentDepth,
  drainRate,
  footprintVerdict,
  formatArea,
  formatPa,
  jetRange,
  jetSpeed,
  leakStep,
  liquidPressure,
  massForForce,
  pressure,
  suckerHold,
  weight,
  type BrickFace,
  type FootprintVerdict,
} from "@/lib/sim/pressure";
import { fitCanvas } from "./canvas";

export type PressureMode = "squash" | "water" | "air";
export type SquashObject = "brick" | "knife" | "pin" | "bag";

export interface PressureReading {
  mode: PressureMode;
  // Squash
  object: SquashObject;
  /** brick: flat | side | end; knife and pin: sharp | blunt; bag: wide | thin. */
  contact: string;
  count: number;
  force: number;
  area: number;
  pressure: number;
  /** Knife and pin: did it go in? */
  cut: boolean | null;
  // Water
  /** Water depth above the bottom of the pipe (m), to the nearest cm. */
  level: number;
  open: boolean[];
  bottomP: number;
  // Air
  stuck: boolean;
  pull: number;
  /** The last time the sucker came off, and the biggest pull it had held before that. */
  fall: { id: number; heldPull: number } | null;
  // Challenge
  test: { id: number; area: number; pressure: number; verdict: FootprintVerdict } | null;
}

export interface FootprintTarget {
  name: string;
  emoji: string;
  massKg: number;
  ground: string;
  limitPa: number;
}

interface Props {
  onReading?: (r: PressureReading) => void;
  /** Challenge: choose a footprint for this load on soft ground. */
  target?: FootprintTarget | null;
  band?: number;
}

const CONTACTS: Record<SquashObject, { id: string; label: string }[]> = {
  brick: [
    { id: "flat", label: "Flat" },
    { id: "side", label: "Side" },
    { id: "end", label: "End" },
  ],
  knife: [
    { id: "sharp", label: "Sharp edge" },
    { id: "blunt", label: "Blunt edge" },
  ],
  pin: [
    { id: "sharp", label: "Point first" },
    { id: "blunt", label: "Head first" },
  ],
  bag: [
    { id: "wide", label: "Wide straps" },
    { id: "thin", label: "Thin straps" },
  ],
};

const OBJECTS: { id: SquashObject; label: string }[] = [
  { id: "brick", label: "🧱 Brick" },
  { id: "knife", label: "🔪 Knife" },
  { id: "pin", label: "📌 Pin" },
  { id: "bag", label: "🎒 Bag" },
];

/** Dents in sand are drawn this many times deeper than real so you can see them. */
const DENT_ZOOM = 3;
/** The pipe: holes this high above its bottom (m), and its bottom this high above the floor (m). */
const HOLES = [0.7, 0.4, 0.1];
const PIPE_H = 1;
const STAND = 1;
/** Hole area ÷ pipe area: a 4 mm hole in a 7 cm pipe. */
const HOLE_RATIO = 0.0033;
const LEVEL_MIN = 0.05;

function areaFor(object: SquashObject, contact: string) {
  if (object === "brick") return brickFaceArea(contact as BrickFace);
  if (object === "bag") return (contact === "wide" ? BAG.wide : BAG.thin) * BAG.contactLength;
  const c = CUTTERS[object];
  return contact === "sharp" ? c.sharp : c.blunt;
}

function forceFor(object: SquashObject, count: number, push: number) {
  if (object === "brick") return weight(BRICK.massKg) * count;
  if (object === "bag") return weight(BAG.massKg) / 2;
  return push;
}

export default function PressureLab({ onReading, target = null, band = 0.85 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<PressureMode>("squash");
  const [object, setObjectState] = useState<SquashObject>("brick");
  const [contact, setContact] = useState("flat");
  const [count, setCount] = useState(1);
  const [push, setPush] = useState(20);

  // Water: the level lives in a ref (the loop drains it) and in state rounded to 1 cm.
  const [levelCm, setLevelCm] = useState(60);
  const levelRef = useRef(0.6);
  const [open, setOpen] = useState([false, false, false]);
  const [tap, setTap] = useState(false);

  // Air
  const [pull, setPull] = useState(0);
  const [leak, setLeak] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [insideKpa, setInsideKpa] = useState(P_ATM / 1000);
  const insideRef = useRef(P_ATM);
  const heldRef = useRef(0);
  const [fall, setFall] = useState<PressureReading["fall"]>(null);

  // Challenge
  const [foot, setFoot] = useState(0.3);
  const [test, setTest] = useState<PressureReading["test"]>(null);
  const testAnim = useRef<{ start: number; frac: number } | null>(null);

  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const setObject = (o: SquashObject) => {
    setObjectState(o);
    setContact(CONTACTS[o][0].id);
  };

  const area = areaFor(object, contact);
  const force = forceFor(object, count, push);
  const p = pressure(force, area);
  const cutter = object === "knife" || object === "pin" ? CUTTERS[object] : null;
  const cut = cutter ? cuts(force, area, cutter.breaks) : null;
  const level = levelCm / 100;
  const bottomP = liquidPressure(level);
  const hold = suckerHold(insideKpa * 1000);

  const params = useRef({ mode, object, contact, count, p, cut, open, tap, pull, leak, stuck, target, foot });
  useEffect(() => {
    params.current = { mode, object, contact, count, p, cut, open, tap, pull, leak, stuck, target, foot };
  });

  const setLevel = (m: number) => {
    levelRef.current = m;
    setLevelCm(Math.round(m * 100));
  };

  const pressOn = () => {
    insideRef.current = SUCKER.pressedInside;
    setInsideKpa(SUCKER.pressedInside / 1000);
    heldRef.current = 0;
    setLeak(false);
    setStuck(true);
  };

  const runTest = () => {
    if (!target) return;
    const tp = pressure(weight(target.massKg), foot);
    testAnim.current = { start: performance.now(), frac: tp / target.limitPa };
    setTest((t) => ({ id: (t?.id ?? 0) + 1, area: foot, pressure: tp, verdict: footprintVerdict(target.massKg, foot, target.limitPa, band) }));
  };

  // ---------- Animation loop ----------
  useEffect(() => {
    const c = canvasRef.current!;
    let raf = 0;
    let last = performance.now();
    let sink = 0;
    let fallY = 0;
    let fallId = 0;
    let wasStuck = false;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const P = params.current;
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (!w || !h) return;
      const ctx = fitCanvas(c, w, h);
      ctx.clearRect(0, 0, w, h);
      ctx.font = FONT;

      if (P.target) {
        const ta = testAnim.current;
        const frac = ta ? Math.min(1, (now - ta.start) / 1500) * ta.frac : 0;
        drawFootprint(ctx, w, h, P.target, P.foot, ta ? frac : null);
        return;
      }

      if (P.mode === "squash") {
        let goal = 0;
        if (P.object === "brick") goal = dentDepth(P.p);
        else if (P.object === "bag") goal = Math.min(1, P.p / 30000);
        else goal = P.cut ? 1 : 0;
        sink += (goal - sink) * Math.min(1, dt * 5);
        drawSquash(ctx, w, h, P.object, P.contact, P.count, P.p, P.cut, sink);
        return;
      }

      if (P.mode === "water") {
        let L = levelRef.current;
        const depths = HOLES.map((y, i) => (P.open[i] ? L - y : 0)).filter((d) => d > 0);
        if (P.tap) L = PIPE_H * 0.95;
        else if (depths.length) L = Math.max(LEVEL_MIN, L - drainRate(depths, HOLE_RATIO) * dt);
        if (L !== levelRef.current) {
          levelRef.current = L;
          const cm = Math.round(L * 100);
          setLevelCm((old) => (old === cm ? old : cm));
        }
        drawWater(ctx, w, h, L, P.open, P.tap, now / 1000);
        return;
      }

      // Air
      let inside = insideRef.current;
      if (P.stuck) {
        if (P.leak) {
          inside = leakStep(inside, dt);
          insideRef.current = inside;
          const k = Math.round(inside / 100) / 10;
          setInsideKpa((old) => (old === k ? old : k));
        }
        heldRef.current = Math.max(heldRef.current, P.pull);
        const grip = suckerHold(inside);
        if (grip < P.pull + weight(SUCKER.massKg) * 4) {
          fallId++;
          const held = heldRef.current;
          setStuck(false);
          setLeak(false);
          setFall({ id: fallId, heldPull: held });
          insideRef.current = P_ATM;
          setInsideKpa(P_ATM / 1000);
          fallY = 0;
        }
      }
      if (P.stuck && !wasStuck) fallY = 0;
      wasStuck = P.stuck;
      if (!P.stuck) fallY = Math.min(1, fallY + dt * 1.5);
      drawAir(ctx, w, h, P.stuck, insideRef.current, P.pull, P.leak, fallY, now / 1000);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    onReadingRef.current?.({ mode, object, contact, count, force, area, pressure: p, cut, level, open, bottomP, stuck, pull, fall, test });
  }, [mode, object, contact, count, force, area, p, cut, level, open, bottomP, stuck, pull, fall, test]);

  if (target) {
    const tp = pressure(weight(target.massKg), foot);
    return (
      <div className="flex flex-col gap-3 select-none">
        <canvas
          ref={canvasRef}
          className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
          role="img"
          aria-label={`A ${target.name.toLowerCase()} of ${target.massKg} kilograms on ${target.ground}, standing on a footprint of ${foot.toFixed(2)} square metres. A red line marks how deep it may sink.`}
        />
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Weight" value={`${Math.round(weight(target.massKg)).toLocaleString("en-IN")} N`} />
          <Stat label="Footprint" value={`${foot.toFixed(2)} m²`} />
          <Stat label="Pressure" value={formatPa(tp)} />
        </div>
        <p className="text-center text-xs text-white/50">
          {target.ground[0].toUpperCase() + target.ground.slice(1)} holds up to {formatPa(target.limitPa)} before it sinks past the line.
        </p>
        <Slider label="Total footprint (all feet or tyres)" value={`${foot.toFixed(2)} m²`} min={0.02} max={1} step={0.01} v={foot} onChange={setFoot} />
        <button className="btn-primary !py-2 text-sm" onClick={runTest}>
          {target.emoji} Step onto the ground
        </button>
      </div>
    );
  }

  const atmTable = airForce(1);
  return (
    <div className="flex flex-col gap-3 select-none">
      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
        {(["squash", "water", "air"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${mode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
            {m === "squash" ? "Squash" : m === "water" ? "Water" : "Air"}
          </button>
        ))}
      </div>

      <canvas
        ref={canvasRef}
        className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={
          mode === "squash"
            ? `A ${object} pressing with ${force.toFixed(1)} newtons on an area of ${formatArea(area)}, giving a pressure of ${formatPa(p)}`
            : mode === "water"
              ? `A tall pipe with ${level.toFixed(2)} metres of water, a balloon tied over its bottom and three side holes${open.some(Boolean) ? ", with water spurting from the open holes" : ""}`
              : `A rubber sucker on a wall${stuck ? `, pulled with ${pull} newtons by a spring balance` : ", which has fallen off"}`
        }
      />

      {mode === "squash" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Force" value={`${force.toFixed(1)} N`} />
            <Stat label="Area" value={formatArea(area)} />
            <Stat label="Pressure" value={formatPa(p)} />
          </div>
          <p className="text-center text-xs text-white/50 tabular-nums">
            P = F ÷ A = {force.toFixed(1)} N ÷ {area < 1e-4 ? area.toExponential(2) : area.toFixed(4)} m²
            {object === "brick" && ` · dent ${(dentDepth(p) * 1000).toFixed(1)} mm`}
            {cut !== null && (cut ? " · it goes in!" : " · it does not go in")}
            {object === "bag" && (p > BAG.hurtsAbovePa ? " · ouch, it digs in" : " · comfy")}
          </p>
          <Choice options={OBJECTS} value={object} onChange={setObject} />
          <Choice options={CONTACTS[object]} value={contact} onChange={setContact} />
          {object === "brick" && (
            <Choice
              options={[
                { id: "1", label: "1 brick" },
                { id: "2", label: "2 bricks" },
              ]}
              value={String(count)}
              onChange={(v) => setCount(Number(v))}
            />
          )}
          {cutter && <Slider label="Your push" value={`${push} N`} min={5} max={50} step={5} v={push} onChange={setPush} />}
          {object === "bag" && <p className="text-center text-xs text-white/40">A {BAG.massKg} kg school bag. Each shoulder carries half its weight.</p>}
        </>
      )}

      {mode === "water" && (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Stat label="Water depth" value={`${level.toFixed(2)} m`} />
            <Stat label="Pressure at balloon" value={`${Math.round(bottomP).toLocaleString("en-IN")} Pa`} />
          </div>
          <p className="text-center text-xs text-white/50 tabular-nums">
            p = h × ρ × g = {level.toFixed(2)} × {RHO_WATER} × {G} = {Math.round(bottomP)} Pa
          </p>
          <Slider
            label="Fill the pipe to"
            value={`${level.toFixed(2)} m`}
            min={LEVEL_MIN}
            max={PIPE_H * 0.95}
            step={0.05}
            v={Math.round(level * 20) / 20}
            onChange={setLevel}
          />
          <div className="grid grid-cols-3 gap-2">
            {HOLES.map((y, i) => {
              const d = level - y;
              return (
                <button
                  key={y}
                  onClick={() => setOpen((o) => o.map((x, j) => (j === i ? !x : x)))}
                  className={`rounded-xl border px-1 py-2 text-xs ${open[i] ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
                >
                  <div>{["Top", "Middle", "Bottom"][i]} hole</div>
                  <div className="tabular-nums text-white/60">{open[i] ? (d > 0 ? `${jetSpeed(d).toFixed(2)} m/s` : "dry") : "plugged"}</div>
                </button>
              );
            })}
          </div>
          <button
            className={`rounded-xl border px-3 py-2 text-sm ${tap ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
            onClick={() => setTap(!tap)}
          >
            {tap ? "🚰 Tap on: keeping it full" : "🚰 Turn on the tap to keep it full"}
          </button>
        </>
      )}

      {mode === "air" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Air inside" value={stuck ? `${insideKpa.toFixed(1)} kPa` : "101.3 kPa"} />
            <Stat label="Air holds it" value={stuck ? `${Math.round(hold)} N` : "–"} />
            <Stat label="Your pull" value={`${pull} N`} />
          </div>
          <p className={`text-center text-xs ${stuck ? "text-white/50" : "text-amber-200"}`}>
            {stuck
              ? `Outside ${(P_ATM / 1000).toFixed(1)} kPa pushes in harder than ${insideKpa.toFixed(1)} kPa inside: (${(P_ATM / 1000).toFixed(1)} − ${insideKpa.toFixed(1)}) kPa × ${(SUCKER_AREA * 1e4).toFixed(1)} cm² ≈ ${Math.round(hold)} N`
              : fall
                ? `It came off! It held up to ${fall.heldPull} N. Press it on again.`
                : "Press the sucker on the wall to squeeze the air out of its cup."}
          </p>
          <Slider label="Pull with the spring balance" value={`${pull} N`} min={0} max={200} step={5} v={pull} onChange={setPull} />
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-primary !py-2 text-sm" onClick={pressOn}>
              {stuck ? "Press it again" : "Press it on the wall"}
            </button>
            <button
              className={`rounded-xl border px-3 py-2 text-sm disabled:opacity-40 ${leak ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
              onClick={() => setLeak(!leak)}
              disabled={!stuck}
            >
              {leak ? "💨 Air leaking in" : "💨 Lift the edge, let air in"}
            </button>
          </div>
          <p className="text-center text-xs text-white/40">
            Fun fact: air presses on a 1 m² table top with about {Math.round(atmTable / 1000)},000 N, the weight of about {Math.round(massForForce(atmTable) / 1000)} tonnes. Air below the table pushes up just as hard.
          </p>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] uppercase tracking-wider text-white/50">{label}</div>
      <div className="font-display text-lg tabular-nums">{value}</div>
    </div>
  );
}

function Slider({ label, value, min, max, step, v, onChange }: { label: string; value: string; min: number; max: number; step: number; v: number; onChange: (n: number) => void }) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex justify-between gap-2 text-sm">
        <span className="text-white/60">{label}</span>
        <span className="tabular-nums text-white">{value}</span>
      </div>
      <input type="range" className="range mt-2 w-full" min={min} max={max} step={step} value={v} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Choice<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`flex-1 rounded-xl border px-2 py-2 text-sm whitespace-nowrap ${value === o.id ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Drawing ----------

const FONT = "11px system-ui, sans-serif";

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = "rgba(255,255,255,0.85)", align: CanvasTextAlign = "center") {
  ctx.font = FONT;
  const tw = ctx.measureText(text).width;
  const lx = align === "center" ? x - tw / 2 : align === "right" ? x - tw : x;
  ctx.fillStyle = "rgba(10,13,28,0.8)";
  ctx.fillRect(lx - 3, y - 11, tw + 6, 15);
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.fillText(text, lx, y);
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width = 2) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 8 * Math.cos(a - 0.45), y2 - 8 * Math.sin(a - 0.45));
  ctx.lineTo(x2 - 8 * Math.cos(a + 0.45), y2 - 8 * Math.sin(a + 0.45));
  ctx.closePath();
  ctx.fill();
}

function drawSquash(ctx: CanvasRenderingContext2D, w: number, h: number, object: SquashObject, contact: string, count: number, p: number, cut: boolean | null, sink: number) {
  label(ctx, `P = ${formatPa(p)}`, w / 2, 18, "#67e8f9");
  if (object === "brick") drawBrick(ctx, w, h, contact as BrickFace, count, sink);
  else if (object === "bag") drawBag(ctx, w, h, contact === "wide", p, sink);
  else if (object === "knife") drawKnife(ctx, w, h, contact === "sharp", !!cut, sink);
  else drawPin(ctx, w, h, contact === "sharp", !!cut, sink);
}

function drawBrick(ctx: CanvasRenderingContext2D, w: number, h: number, face: BrickFace, count: number, sinkM: number) {
  const sandTop = Math.round(h * 0.66);
  const ppm = Math.min(w / 0.7, (sandTop - 30) / 0.47);
  // Front view: width and height of the brick as we see it.
  const [bw, bh] = face === "flat" ? [BRICK.l, BRICK.h] : face === "side" ? [BRICK.l, BRICK.w] : [BRICK.h, BRICK.l];
  const W = bw * ppm;
  const H = bh * ppm;
  const cx = w / 2;
  const dent = sinkM * DENT_ZOOM * ppm;

  // Sand with a dent under the brick.
  ctx.fillStyle = "#a16207";
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.moveTo(0, sandTop);
  ctx.lineTo(cx - W / 2 - 6, sandTop);
  ctx.lineTo(cx - W / 2, sandTop + dent);
  ctx.lineTo(cx + W / 2, sandTop + dent);
  ctx.lineTo(cx + W / 2 + 6, sandTop);
  ctx.lineTo(w, sandTop);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  // Sand grains.
  ctx.fillStyle = "rgba(253,224,71,0.25)";
  for (let i = 0; i < 90; i++) {
    const x = (i * 97.3) % w;
    const y = sandTop + 4 + ((i * 53.7) % (h - sandTop - 6));
    if (Math.abs(x - cx) < W / 2 && y < sandTop + dent + 2) continue;
    ctx.fillRect(x, y, 2, 2);
  }

  for (let i = 0; i < count; i++) {
    const y = sandTop + dent - (i + 1) * H;
    ctx.fillStyle = "#b45309";
    ctx.strokeStyle = "#fb923c";
    ctx.lineWidth = 1.5;
    ctx.fillRect(cx - W / 2, y, W, H);
    ctx.strokeRect(cx - W / 2, y, W, H);
  }
  const topY = sandTop + dent - count * H;
  arrow(ctx, cx, topY - 26, cx, topY - 4, "#f472b6");
  label(ctx, `W = ${(weight(BRICK.massKg) * count).toFixed(1)} N`, cx + 50, topY - 12, "#f9a8d4");

  // Dent gauge, in real millimetres.
  const gx = w - 24;
  const gTop = sandTop + 4;
  const gH = h - gTop - 10;
  const maxMm = 30;
  const mm = sinkM * 1000;
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(gx, gTop, 10, gH);
  ctx.fillStyle = "#22d3ee";
  ctx.fillRect(gx, gTop, 10, (Math.min(mm, maxMm) / maxMm) * gH);
  label(ctx, `dent ${mm.toFixed(1)} mm`, gx - 4, h - 12, "rgba(255,255,255,0.85)", "right");
  label(ctx, `${(brickFaceArea(face) * 1e4).toFixed(1)} cm² on the sand`, 8, sandTop - 8, "rgba(255,255,255,0.7)", "left");
}

function drawKnife(ctx: CanvasRenderingContext2D, w: number, h: number, sharp: boolean, cut: boolean, sink: number) {
  const board = h - 26;
  ctx.fillStyle = "#78350f";
  ctx.fillRect(10, board, w - 20, 14);
  const r = Math.min(w * 0.22, h * 0.3);
  const cx = w / 2;
  const cy = board - r * 0.92;
  // Apple, with a slit where the knife goes in.
  ctx.fillStyle = "#dc2626";
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 0.92, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#65a30d";
  ctx.beginPath();
  ctx.ellipse(cx + 8, cy - r * 0.95, 9, 4, -0.5, 0, Math.PI * 2);
  ctx.fill();
  const top = cy - r * 0.92;
  const depth = sink * r * 0.9;
  if (depth > 1) {
    ctx.fillStyle = "#fef3c7";
    ctx.fillRect(cx - 2, top, 4, depth);
  }
  // Blade, from the side: the edge is at its bottom.
  const bladeW = Math.min(150, w * 0.5);
  const bladeH = 34;
  const edgeY = top + depth;
  const x0 = cx - bladeW / 2;
  ctx.fillStyle = "#cbd5e1";
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, edgeY - bladeH);
  ctx.lineTo(x0 + bladeW, edgeY - bladeH);
  ctx.lineTo(x0 + bladeW, edgeY);
  ctx.lineTo(x0, edgeY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Handle.
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(x0 + bladeW, edgeY - bladeH, 60, 18);
  ctx.strokeStyle = "#475569";
  ctx.strokeRect(x0 + bladeW, edgeY - bladeH, 60, 18);
  arrow(ctx, x0 + bladeW + 30, edgeY - bladeH - 30, x0 + bladeW + 30, edgeY - bladeH - 4, "#f472b6");

  // Edge close-up, so the edge width is visible.
  const zx = 12;
  const zy = 32;
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.strokeRect(zx, zy, 70, 60);
  ctx.fillStyle = "#cbd5e1";
  ctx.beginPath();
  if (sharp) {
    ctx.moveTo(zx + 20, zy + 6);
    ctx.lineTo(zx + 50, zy + 6);
    ctx.lineTo(zx + 35, zy + 52);
  } else {
    ctx.moveTo(zx + 20, zy + 6);
    ctx.lineTo(zx + 50, zy + 6);
    ctx.lineTo(zx + 44, zy + 52);
    ctx.lineTo(zx + 26, zy + 52);
  }
  ctx.closePath();
  ctx.fill();
  label(ctx, "edge, zoomed", zx + 35, zy + 74, "rgba(255,255,255,0.6)");
  label(ctx, cut ? "slices in!" : "only squashes", cx, Math.min(board - 4, cy + r * 0.5), cut ? "#a3e635" : "#fcd34d");
}

function drawPin(ctx: CanvasRenderingContext2D, w: number, h: number, pointFirst: boolean, cut: boolean, sink: number) {
  const boardTop = Math.round(h * 0.62);
  ctx.fillStyle = "#92400e";
  ctx.fillRect(10, boardTop, w - 20, h - boardTop - 10);
  ctx.strokeStyle = "rgba(253,186,116,0.25)";
  for (let y = boardTop + 8; y < h - 12; y += 9) {
    ctx.beginPath();
    ctx.moveTo(14, y);
    ctx.bezierCurveTo(w * 0.3, y + 3, w * 0.6, y - 3, w - 14, y);
    ctx.stroke();
  }
  const cx = w / 2;
  const shaft = Math.min(70, h * 0.28);
  const headR = 22;
  const into = sink * shaft * 0.8;
  const tipY = boardTop + into;
  ctx.fillStyle = "#e2e8f0";
  ctx.strokeStyle = "#e2e8f0";
  if (pointFirst) {
    // Point down, head up.
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, tipY - shaft);
    ctx.lineTo(cx, tipY - 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 1.5, tipY - 6);
    ctx.lineTo(cx, tipY);
    ctx.lineTo(cx + 1.5, tipY - 6);
    ctx.fill();
    ctx.fillStyle = "#f43f5e";
    ctx.fillRect(cx - headR, tipY - shaft - 8, headR * 2, 8);
    arrow(ctx, cx, tipY - shaft - 40, cx, tipY - shaft - 12, "#f472b6");
  } else {
    // Head down on the wood, point up towards the thumb.
    ctx.fillStyle = "#f43f5e";
    ctx.fillRect(cx - headR, boardTop - 8, headR * 2, 8);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, boardTop - 8);
    ctx.lineTo(cx, boardTop - 8 - shaft + 6);
    ctx.stroke();
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(cx - 1.5, boardTop - 8 - shaft + 6);
    ctx.lineTo(cx, boardTop - 8 - shaft);
    ctx.lineTo(cx + 1.5, boardTop - 8 - shaft + 6);
    ctx.fill();
    arrow(ctx, cx, boardTop - shaft - 46, cx, boardTop - shaft - 14, "#f472b6");
    label(ctx, "ouch for your thumb!", cx + 70, boardTop - shaft - 20, "#fcd34d");
  }
  label(ctx, cut ? "goes into the wood!" : "does not go in", cx, h - 18, cut ? "#a3e635" : "#fcd34d");
}

function drawBag(ctx: CanvasRenderingContext2D, w: number, h: number, wide: boolean, p: number, sink: number) {
  // Front view across the shoulder: the strap lies over the top.
  const cx = w * 0.42;
  const top = h * 0.42;
  const R = Math.min(w * 0.3, h * 0.42);
  ctx.fillStyle = "#c08457";
  ctx.beginPath();
  ctx.ellipse(cx, top + R, R * 1.2, R, 0, Math.PI, 0);
  ctx.lineTo(cx + R * 1.2, h);
  ctx.lineTo(cx - R * 1.2, h);
  ctx.closePath();
  ctx.fill();
  const sw = (wide ? BAG.wide : BAG.thin) * 1800; // drawn width, same scale for both straps
  const d = sink * 18;
  // Strap pressing in: a darker dent in the skin, then the strap.
  ctx.fillStyle = "rgba(127,29,29,0.55)";
  ctx.fillRect(cx - sw / 2 - 2, top, sw + 4, d + 2);
  ctx.fillStyle = "#6d28d9";
  ctx.fillRect(cx - sw / 2, top - 10 + d, sw, 10);
  // Strap running down to the bag.
  ctx.strokeStyle = "#6d28d9";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(cx + sw / 2, top - 5 + d);
  ctx.quadraticCurveTo(cx + R * 1.3, top - 10, cx + R * 1.45, top + 40);
  ctx.stroke();
  ctx.fillStyle = "#7c3aed";
  ctx.fillRect(cx + R * 1.2, top + 40, 52, 66);
  arrow(ctx, cx + R * 1.2 + 26, top + 108, cx + R * 1.2 + 26, Math.min(h - 6, top + 140), "#f472b6");
  label(ctx, `${(weight(BAG.massKg) / 2).toFixed(1)} N on this shoulder`, cx, top - 22, "rgba(255,255,255,0.8)");
  label(ctx, `strap ${wide ? BAG.wide * 100 : BAG.thin * 100} cm wide`, cx, top + 20, "rgba(255,255,255,0.8)");
  const ouch = p > BAG.hurtsAbovePa;
  label(ctx, ouch ? "ouch, it digs in!" : "comfy", 50, h - 14, ouch ? "#fcd34d" : "#a3e635");
}

function drawWater(ctx: CanvasRenderingContext2D, w: number, h: number, L: number, open: boolean[], tap: boolean, t: number) {
  const floor = h - 12;
  const ppm = Math.min((w - 30) / 2.7, (floor - 16) / (STAND + PIPE_H + 0.05));
  const pipeX = 16 + 0.25 * ppm; // left edge of the pipe
  const pipeW = Math.max(16, 0.1 * ppm);
  const right = pipeX + pipeW;
  const Y = (m: number) => floor - m * ppm;
  const bottom = Y(STAND);
  const topY = Y(STAND + PIPE_H);

  // Floor.
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, floor);
  ctx.lineTo(w, floor);
  ctx.stroke();
  // Stand and clamp.
  ctx.strokeStyle = "rgba(148,163,184,0.7)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(8, floor);
  ctx.lineTo(8, topY + 10);
  ctx.moveTo(8, (bottom + topY) / 2);
  ctx.lineTo(pipeX, (bottom + topY) / 2);
  ctx.stroke();

  // Balloon tied over the bottom: it bulges more as the pressure grows.
  const bulge = 4 + (liquidPressure(L) / liquidPressure(PIPE_H)) * pipeW * 1.6;
  ctx.fillStyle = "rgba(244,114,182,0.85)";
  ctx.beginPath();
  ctx.moveTo(pipeX - 2, bottom);
  ctx.bezierCurveTo(pipeX - 2 - bulge * 0.3, bottom + bulge, right + 2 + bulge * 0.3, bottom + bulge, right + 2, bottom);
  ctx.closePath();
  ctx.fill();

  // Water.
  const wy = Y(STAND + L);
  const g = ctx.createLinearGradient(0, wy, 0, bottom);
  g.addColorStop(0, "rgba(56,189,248,0.35)");
  g.addColorStop(1, "rgba(14,116,144,0.8)");
  ctx.fillStyle = g;
  ctx.fillRect(pipeX, wy, pipeW, bottom - wy);
  // Pipe walls.
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pipeX, topY);
  ctx.lineTo(pipeX, bottom);
  ctx.moveTo(right, topY);
  ctx.lineTo(right, bottom);
  ctx.stroke();

  if (tap) {
    ctx.fillStyle = "rgba(56,189,248,0.6)";
    ctx.fillRect(pipeX + pipeW / 2 - 2, topY - 10, 4, wy - topY + 10);
    label(ctx, "tap on", pipeX + pipeW + 30, topY + 2, "#7dd3fc");
  }

  // Holes and jets: x = v t, y falls g t² ÷ 2.
  HOLES.forEach((y, i) => {
    const hy = Y(STAND + y);
    const depth = L - y;
    ctx.fillStyle = open[i] ? "#0a0d1c" : "#fbbf24";
    ctx.beginPath();
    ctx.arc(right, hy, 3, 0, Math.PI * 2);
    ctx.fill();
    if (!open[i] || depth <= 0) return;
    const v = jetSpeed(depth);
    const fall = STAND + y;
    const tEnd = Math.sqrt((2 * fall) / G);
    ctx.strokeStyle = "rgba(56,189,248,0.75)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let k = 0; k <= 30; k++) {
      const tt = (k / 30) * tEnd;
      const x = right + v * tt * ppm;
      const yy = Y(fall - (G * tt * tt) / 2);
      if (k === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
    // Drops moving along the jet in real time.
    ctx.fillStyle = "#e0f2fe";
    for (let k = 0; k < 5; k++) {
      const tt = ((t + k / 5) % 1) * tEnd;
      ctx.beginPath();
      ctx.arc(right + v * tt * ppm, Y(fall - (G * tt * tt) / 2), 2, 0, Math.PI * 2);
      ctx.fill();
    }
    const land = right + jetRange(depth, fall) * ppm;
    ctx.fillStyle = "rgba(56,189,248,0.5)";
    ctx.beginPath();
    ctx.ellipse(land, floor, 8, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    label(ctx, `${v.toFixed(1)} m/s`, right + 26, hy - 6, "#7dd3fc", "left");
  });

  // Depth marker for the water column.
  const mx = pipeX - 8;
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(mx, wy);
  ctx.lineTo(mx, bottom);
  ctx.stroke();
  const Lcm = Math.round(L * 100) / 100;
  label(ctx, `h = ${Lcm.toFixed(2)} m`, w - 8, 18, "rgba(255,255,255,0.85)", "right");
  label(ctx, `p at balloon = ${Math.round(liquidPressure(Lcm))} Pa`, w - 8, 36, "#f9a8d4", "right");
}

function drawAir(ctx: CanvasRenderingContext2D, w: number, h: number, stuck: boolean, inside: number, pull: number, leak: boolean, fallY: number, t: number) {
  const wallX = Math.min(70, w * 0.16);
  const floor = h - 14;
  // Tiled wall.
  ctx.fillStyle = "rgba(148,163,184,0.18)";
  ctx.fillRect(0, 0, wallX, h);
  ctx.strokeStyle = "rgba(148,163,184,0.3)";
  ctx.lineWidth = 1;
  for (let y = 0; y < h; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(wallX, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.moveTo(0, floor);
  ctx.lineTo(w, floor);
  ctx.stroke();

  // Air particles outside, at normal pressure.
  ctx.fillStyle = "rgba(165,243,252,0.35)";
  for (let i = 0; i < 70; i++) {
    const x = wallX + 8 + ((i * 71.3 + t * 9 * ((i % 5) - 2)) % (w - wallX - 16) + (w - wallX - 16)) % (w - wallX - 16);
    const y = 6 + ((i * 37.9 + t * 7 * ((i % 3) - 1)) % (floor - 12) + (floor - 12)) % (floor - 12);
    ctx.fillRect(x, y, 2, 2);
  }

  const cupR = Math.min(46, h * 0.18);
  const cy = Math.round(h * 0.42);
  const pullPx = stuck ? Math.min(1, pull / 200) * 6 : 0;
  // Where the sucker is: on the wall, or falling to the floor.
  const sx = wallX + (stuck ? pullPx : 14 + fallY * 20);
  const sy = stuck ? cy : cy + fallY * (floor - cy - cupR - 4);

  // Cup: a dome opening onto the wall.
  ctx.fillStyle = "rgba(244,114,182,0.25)";
  ctx.strokeStyle = "#f472b6";
  ctx.lineWidth = 3;
  ctx.beginPath();
  const depthPx = stuck ? 10 + 14 * ((inside - 0.25 * P_ATM) / (0.75 * P_ATM)) : 24;
  ctx.moveTo(sx, sy - cupR);
  ctx.quadraticCurveTo(sx + depthPx * 2, sy, sx, sy + cupR);
  ctx.stroke();
  ctx.fill();
  // Knob and string.
  const knobX = sx + depthPx + 6;
  ctx.fillStyle = "#f472b6";
  ctx.fillRect(knobX - 4, sy - 6, 12, 12);

  // Particles left inside the cup: fewer means lower pressure.
  if (stuck) {
    const n = Math.round((inside / P_ATM) * 12);
    ctx.fillStyle = "rgba(165,243,252,0.8)";
    for (let i = 0; i < n; i++) {
      const a = (i / 12) * Math.PI - Math.PI / 2 + 0.2;
      ctx.fillRect(sx + 3 + (depthPx * 0.6) * Math.abs(Math.cos(a * 3 + t)), sy + Math.sin(a) * cupR * 0.75, 2, 2);
    }
    // Outside air pushing the cup onto the wall.
    for (const dy of [-cupR * 0.6, 0, cupR * 0.6]) arrow(ctx, sx + depthPx + 46, sy + dy, sx + depthPx + 18, sy + dy, "#67e8f9", 2);
    label(ctx, "air pushes in", sx + depthPx + 54, sy - cupR - 6, "#67e8f9", "left");
    if (leak) {
      arrow(ctx, sx + 22, sy + cupR + 16, sx + 4, sy + cupR - 4, "#fbbf24", 2);
      label(ctx, "air rushes in: high → low", sx + 26, sy + cupR + 24, "#fcd34d", "left");
    }
  }

  // Spring balance pulling to the right.
  const bx = Math.min(w - 70, knobX + 120);
  const sLen = 34 + Math.min(1, pull / 200) * 40;
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(knobX + 8, sy);
  ctx.lineTo(bx, sy);
  ctx.stroke();
  // Spring coils.
  ctx.strokeStyle = "#a78bfa";
  ctx.beginPath();
  for (let k = 0; k <= 12; k++) {
    const x = bx + (k / 12) * sLen;
    const y = sy + (k % 2 ? -6 : 6) * (k === 0 || k === 12 ? 0 : 1);
    if (k === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = "rgba(167,139,250,0.25)";
  ctx.strokeStyle = "#a78bfa";
  ctx.fillRect(bx + sLen, sy - 12, 34, 24);
  ctx.strokeRect(bx + sLen, sy - 12, 34, 24);
  label(ctx, `${pull} N`, bx + sLen + 17, sy + 30, "#c4b5fd");

  label(ctx, `outside ${(P_ATM / 1000).toFixed(1)} kPa`, w - 8, 18, "#67e8f9", "right");
  label(ctx, stuck ? `inside ${(inside / 1000).toFixed(1)} kPa` : "fell off!", w - 8, 36, stuck ? "#f9a8d4" : "#fcd34d", "right");
}

function drawFootprint(ctx: CanvasRenderingContext2D, w: number, h: number, target: FootprintTarget, foot: number, frac: number | null) {
  const groundTop = Math.round(h * 0.55);
  const line = groundTop + Math.min(60, (h - groundTop) * 0.5);
  const per = line - groundTop; // pixels of sinking at the limit pressure
  ctx.fillStyle = "rgba(161,98,7,0.45)";
  ctx.fillRect(0, groundTop, w, h - groundTop);
  ctx.strokeStyle = "#ef4444";
  ctx.setLineDash([6, 4]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, line);
  ctx.lineTo(w, line);
  ctx.stroke();
  ctx.setLineDash([]);
  label(ctx, "do not sink past here", w - 8, line - 6, "#fca5a5", "right");
  label(ctx, target.ground, 8, h - 10, "rgba(255,255,255,0.6)", "left");

  // Footprint pad: its drawn width grows with the area.
  const padW = 20 + Math.sqrt(foot) * Math.min(w * 0.55, 220);
  const sink = frac === null ? 0 : Math.min(frac * per, h - groundTop - 14);
  const padTop = groundTop + sink - 12;
  const cx = w / 2;
  ctx.fillStyle = "#64748b";
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.5;
  ctx.fillRect(cx - padW / 2, padTop, padW, 12);
  ctx.strokeRect(cx - padW / 2, padTop, padW, 12);
  ctx.font = `${Math.round(Math.min(90, h * 0.32))}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(target.emoji, cx, padTop - 4);
  ctx.textAlign = "left";
  ctx.font = FONT;
  label(ctx, `${target.name}: ${target.massKg.toLocaleString("en-IN")} kg`, 8, 18, "rgba(255,255,255,0.85)", "left");
  if (frac !== null) {
    const ok = frac <= 1;
    label(ctx, ok ? "stays above the line" : "sinks too deep!", w - 8, 18, ok ? "#a3e635" : "#fca5a5", "right");
  }
}
