"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BALLOON,
  CHARGE_PER_RUB,
  LIQUIDS,
  OBJECTS,
  RING,
  balloonAngle,
  boatDraft,
  boatSinks,
  density,
  floats,
  getObject,
  loadIsGood,
  maxLoad,
  objectHeight,
  overflowAfter,
  ringGaps,
  ringStack,
  sphereRadius,
  tankState,
  upthrust,
  type Boat,
  type FloatObject,
  type LiquidId,
  type ObjectId,
} from "@/lib/sim/buoyancy";
import { fitCanvas } from "./canvas";

export type TankMode = "tank" | "repel";

export type TankReading =
  | {
      mode: "tank";
      liquid: LiquidId;
      object: ObjectId;
      weight: number;
      reading: number;
      upthrust: number;
      /** Weight of the liquid in the beaker, N. */
      overflow: number;
      fullyUnder: boolean;
      floating: boolean;
      released: boolean;
      /** Set once the object is let go: did it float or sink? */
      outcome: "floats" | "sinks" | null;
    }
  | { mode: "repel"; rings: boolean[]; gaps: number[]; ringsFloat: boolean; rubs: number; angle: number; balloonsApart: boolean }
  | { mode: "boat"; boat: string; load: number; launchId: number; launched: boolean; sank: boolean; good: boolean };

interface Props {
  onReading?: (r: TankReading) => void;
  /** Challenge: load this boat, then launch it. */
  boat?: Boat | null;
}

/** Tank: water 22 cm deep, 24 cm wide, full to the spout. Beaker holds 700 mL. */
const TANK_DEPTH = 0.22;
const TANK_WIDTH = 0.24;
const BEAKER_CAP = 7e-4;
const BALANCE_MAX = 10;

/** Hook position from the slider: 2 cm above the surface at 0, fully under with room to spare at 100. */
function hookDepth(o: FloatObject, lower: number) {
  return -0.02 + (lower / 100) * (objectHeight(o) + 0.05);
}

export default function BuoyancyTank({ onReading, boat = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<TankMode>("tank");
  const [liquid, setLiquidState] = useState<LiquidId>("water");
  const [objectId, setObjectState] = useState<ObjectId>("stone");
  const [lower, setLowerState] = useState(0);
  const [released, setReleased] = useState(false);
  const [overflow, setOverflow] = useState(0);
  const [rings, setRings] = useState<boolean[]>([true, true, true]);
  const [ringCount, setRingCount] = useState(2);
  const [rubs, setRubs] = useState(0);
  const [load, setLoad] = useState(0);
  /** Grows with every launch, so each launch is reported once. */
  const [launchId, setLaunchId] = useState(0);
  const [launched, setLaunched] = useState(false);

  const obj = getObject(objectId);
  const rho = LIQUIDS[liquid].density;
  const st = tankState(obj, rho, hookDepth(obj, lower), released, TANK_DEPTH);
  const overflowN = upthrust(rho, overflow);
  const usedRings = rings.slice(0, ringCount);
  const z = ringStack(usedRings);
  const gaps = ringGaps(z);
  const ringsFloat = gaps.some((g) => g > 0.002);
  const angle = balloonAngle(rubs * CHARGE_PER_RUB);
  const touching = Math.asin(BALLOON.radius / (BALLOON.thread + BALLOON.radius));
  const balloonsApart = angle > touching + 0.03;

  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  // Animation state the draw loop reads.
  const live = useRef({ mode: "tank" as TankMode | "boat", obj, liquid, st, overflow, lower, released, z, usedRings, gaps, angle, rubs, boat, load, launched, dripUntil: 0 });
  useEffect(() => {
    Object.assign(live.current, { mode: boat ? "boat" : mode, obj, liquid, st, overflow, lower, released, z, usedRings, gaps, angle, rubs, boat, load, launched });
  });

  /** Move the object (or let it go) and pour any extra liquid it pushes aside into the beaker. */
  const place = useCallback(
    (nextLower: number, nextReleased: boolean) => {
      setLowerState(nextLower);
      setReleased(nextReleased);
      const next = tankState(obj, rho, hookDepth(obj, nextLower), nextReleased, TANK_DEPTH);
      setOverflow((o) => {
        const v = overflowAfter(o, next.vSub);
        if (v > o + 1e-9) live.current.dripUntil = performance.now() + 700;
        return v;
      });
    },
    [obj, rho],
  );

  /** Lift the object out, top the tank up to the spout and empty the beaker. */
  const restart = () => {
    setLowerState(0);
    setReleased(false);
    setOverflow(0);
  };

  // Report what the student sees whenever it changes.
  const outcome = released ? (st.onBottom ? "sinks" : "floats") : null;
  useEffect(() => {
    if (boat) return;
    if (mode === "tank")
      onReadingRef.current?.({
        mode: "tank",
        liquid,
        object: objectId,
        weight: st.weight,
        reading: st.reading,
        upthrust: st.upthrust,
        overflow: overflowN,
        fullyUnder: st.fullyUnder,
        floating: st.floating,
        released,
        outcome,
      });
  }, [boat, mode, liquid, objectId, st.weight, st.reading, st.upthrust, overflowN, st.fullyUnder, st.floating, released, outcome]);
  const ringKey = usedRings.join(",");
  useEffect(() => {
    if (boat || mode !== "repel") return;
    onReadingRef.current?.({ mode: "repel", rings: ringKey.split(",").map((x) => x === "true"), gaps, ringsFloat, rubs, angle, balloonsApart });
    // gaps and angle follow from ringKey and rubs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boat, mode, ringKey, ringsFloat, rubs, balloonsApart]);
  const sank = boat ? boatSinks(boat, load) : false;
  const good = boat ? loadIsGood(boat, load) : false;
  useEffect(() => {
    if (!boat) return;
    onReadingRef.current?.({ mode: "boat", boat: boat.id, load, launchId, launched, sank, good });
  }, [boat, load, launchId, launched, sank, good]);

  // One animation loop draws every scene.
  useEffect(() => {
    const c = canvasRef.current!;
    let raf = 0;
    let shownDepth = -0.02;
    let shownLower = 0;
    let shownDraft = 0;
    let last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const L = live.current;
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (!w || !h) return;
      const ctx = fitCanvas(c, w, h);
      ctx.clearRect(0, 0, w, h);
      const ease = 1 - Math.exp(-dt * 9);
      if (L.mode === "tank") {
        shownDepth += (L.st.depth - shownDepth) * ease;
        shownLower += (L.lower - shownLower) * ease;
        drawTank(ctx, w, h, { ...L, depth: shownDepth, shownLower, drip: now < L.dripUntil, now });
      } else if (L.mode === "repel") drawRepel(ctx, w, h, L.z, L.usedRings, L.gaps, L.angle, L.rubs);
      else if (L.boat) {
        const target = L.launched ? Math.min(boatDraft(L.boat, L.load), 1) : 0;
        const sinking = L.launched && boatSinks(L.boat, L.load);
        shownDraft += ((sinking ? 2.4 : target) - shownDraft) * (1 - Math.exp(-dt * (sinking ? 1.6 : 4)));
        drawBoat(ctx, w, h, L.boat, L.load, L.launched, shownDraft, sinking);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const fmt = (n: number) => n.toFixed(2);
  const ariaLabel = boat
    ? `${boat.name} with ${formatLoad(boat, load)} of cargo. ${launched ? (sank ? "It sank." : "It floats.") : "Not launched yet."}`
    : mode === "tank"
      ? `${obj.label} in ${LIQUIDS[liquid].label.toLowerCase()}. Spring balance reads ${fmt(st.reading)} newtons. Upthrust ${fmt(st.upthrust)} newtons. The liquid in the beaker weighs ${fmt(overflowN)} newtons.`
      : `${ringCount} ring magnets on a pencil, gaps ${gaps.map((g) => (g * 100).toFixed(1)).join(" and ")} centimetres. Two balloons rubbed ${rubs} times hang ${((angle * 180) / Math.PI).toFixed(0)} degrees from the vertical.`;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!boat && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(
            [
              ["tank", "Tank"],
              ["repel", "Repel"],
            ] as const
          ).map(([m, label]) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${mode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      <canvas ref={canvasRef} className="h-72 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80" role="img" aria-label={ariaLabel} />

      {!boat && mode === "tank" && (
        <>
          <div className="grid grid-cols-4 gap-2 text-center">
            <Readout label="In air" value={fmt(st.weight)} unit="N" />
            <Readout label="Balance" value={fmt(st.reading)} unit="N" sub={released ? "let go" : st.floating ? "string slack" : undefined} />
            <Readout label="Upthrust" value={fmt(st.upthrust)} unit="N" />
            <Readout label="Overflow" value={fmt(overflowN)} unit="N" sub={`${Math.round(overflow * 1e6)} mL`} />
          </div>
          <Choice options={OBJECTS.map((o) => ({ id: o.id, label: `${o.emoji} ${o.label}` }))} value={objectId} onChange={(id) => { setObjectState(id); restart(); }} />
          <Choice
            options={(Object.keys(LIQUIDS) as LiquidId[]).map((id) => ({ id, label: LIQUIDS[id].label }))}
            value={liquid}
            onChange={(id) => {
              setLiquidState(id);
              restart();
            }}
          />
          <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Lower the spring balance</span>
              <span className="tabular-nums text-white">{lower}%</span>
            </div>
            <input
              type="range"
              className="range mt-2 w-full"
              min={0}
              max={100}
              step={5}
              value={lower}
              disabled={released}
              aria-label="Lower the spring balance"
              onChange={(e) => place(Number(e.target.value), false)}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => place(lower, !released)}
              className={`rounded-2xl border py-3 text-sm font-semibold ${released ? "border-white/10 text-white/70" : "border-lime-300/30 bg-lime-400/10"}`}
            >
              {released ? "Hang it again" : "Let go ✂"}
            </button>
            <button onClick={restart} className="rounded-2xl border border-white/10 py-3 text-sm text-white/70 hover:bg-white/10">
              Lift out, empty beaker
            </button>
          </div>
          <p className="text-center text-xs text-white/40">
            {obj.label}: {Math.round(obj.mass * 1000)} g, {Math.round(obj.volume * 1e6)} cm³, so {Math.round(density(obj))} kg/m³
            {obj.id === "bowl" ? " (steel plus the air inside)" : ""}. {LIQUIDS[liquid].label}: {LIQUIDS[liquid].density} kg/m³.{" "}
            {floats(obj, rho) ? "Lighter than the same volume of liquid." : "Heavier than the same volume of liquid."}
          </p>
        </>
      )}

      {!boat && mode === "repel" && (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Readout label="Ring gaps" value={gaps.map((g) => (g * 100).toFixed(1)).join(" · ")} unit="cm" sub={ringsFloat ? "floating!" : "stuck together"} />
            <Readout label="Thread angle" value={((angle * 180) / Math.PI).toFixed(0)} unit="°" sub={balloonsApart ? "pushed apart" : "touching"} />
          </div>
          <Choice
            options={[
              { id: "2", label: "2 ring magnets" },
              { id: "3", label: "3 ring magnets" },
            ]}
            value={String(ringCount) as "2" | "3"}
            onChange={(v) => setRingCount(Number(v))}
          />
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                disabled={i >= ringCount}
                onClick={() => setRings((r) => r.map((u, j) => (j === i ? !u : u)))}
                className="rounded-xl border border-white/10 px-2 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-30"
              >
                Flip ring {i + 1}
                <span className="block text-[11px] text-white/50">{rings[i] ? "N face up" : "S face up"}</span>
              </button>
            ))}
          </div>
          <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Rub both balloons on dry hair</span>
              <span className="tabular-nums text-white">{rubs} rubs</span>
            </div>
            <input type="range" className="range mt-2 w-full" min={0} max={10} step={1} value={rubs} aria-label="Number of rubs" onChange={(e) => setRubs(Number(e.target.value))} />
          </label>
          <p className="text-center text-xs text-white/40">Ring 1 sits at the bottom of the pencil. Each balloon is rubbed the same number of times, so both get the same kind of charge.</p>
        </>
      )}

      {boat && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Hull volume" value={boat.hull >= 100 ? boat.hull.toLocaleString("en-IN") : String(boat.hull)} unit="m³" />
            <Readout label="Empty boat" value={boat.unit === "t" ? (boat.mass / 1000).toLocaleString("en-IN") : String(boat.mass)} unit={boat.unit} />
            <Readout label="Water" value={String(boat.water)} unit="kg/m³" />
          </div>
          <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Cargo ({boat.cargo})</span>
              <span className="tabular-nums text-white">{formatLoad(boat, load)}</span>
            </div>
            <input
              type="range"
              className="range mt-2 w-full"
              min={0}
              max={Math.round((maxLoad(boat) * 1.25) / boat.step) * boat.step}
              step={boat.step}
              value={load}
              disabled={launched}
              aria-label="Cargo to load"
              onChange={(e) => setLoad(Number(e.target.value))}
            />
          </label>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button disabled={launched} onClick={() => {
                setLaunchId((n) => n + 1);
                setLaunched(true);
              }} className="rounded-2xl border border-lime-300/30 bg-lime-400/10 py-3 font-semibold disabled:opacity-40">
              {launched ? (sank ? "It sank" : "Afloat") : "Launch ⚓"}
            </button>
            <button onClick={() => setLaunched(false)} className="rounded-2xl border border-white/10 px-4 text-sm text-white/70 hover:bg-white/10">
              Unload
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function formatLoad(b: Boat, kg: number) {
  return b.unit === "t" ? `${(kg / 1000).toLocaleString("en-IN")} t` : `${kg.toLocaleString("en-IN")} kg`;
}

function Readout({ label, value, unit, sub }: { label: string; value: string; unit: string; sub?: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="truncate text-[11px] uppercase tracking-wider text-white/50">{label}</div>
      <div className="font-display text-lg tabular-nums">
        {value}
        {unit && <span className="ml-0.5 text-xs text-white/50">{unit}</span>}
      </div>
      {sub && <div className="text-[11px] text-white/40">{sub}</div>}
    </div>
  );
}

function Choice<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`flex-1 rounded-xl border px-3 py-2 text-sm whitespace-nowrap ${value === o.id ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Drawing ---------- */

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width = 3) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 2) return;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const head = Math.min(9, len * 0.6);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - ux * head * 0.8, y2 - uy * head * 0.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ux * head - uy * head * 0.55, y2 - uy * head + ux * head * 0.55);
  ctx.lineTo(x2 - ux * head + uy * head * 0.55, y2 - uy * head - ux * head * 0.55);
  ctx.closePath();
  ctx.fill();
}

interface TankScene {
  obj: FloatObject;
  liquid: LiquidId;
  st: ReturnType<typeof tankState>;
  overflow: number;
  released: boolean;
  /** Animated depth of the object's bottom below the surface, m. */
  depth: number;
  shownLower: number;
  drip: boolean;
  now: number;
}

function drawTank(ctx: CanvasRenderingContext2D, w: number, h: number, s: TankScene) {
  const BH = 54; // spring balance body, px
  const scale = Math.min((h - 78) / 0.42, (w * 0.5) / TANK_WIDTH);
  const surfaceY = h - 12 - TANK_DEPTH * scale;
  const bottomY = surfaceY + TANK_DEPTH * scale;
  const tw = TANK_WIDTH * scale;
  const cx = Math.max(tw / 2 + 10, w * 0.34);
  const tl = cx - tw / 2;
  const tr = cx + tw / 2;
  const rimY = surfaceY - 0.025 * scale;
  const liq = LIQUIDS[s.liquid];

  // Object position.
  const H = objectHeight(s.obj) * scale;
  const objBottom = surfaceY + s.depth * scale;
  const objTop = objBottom - H;

  // Spring balance: follows the slider, but a slack string lets it come no closer than the object's top.
  const hookTarget = surfaceY + (-0.02 + (s.shownLower / 100) * (objectHeight(s.obj) + 0.05)) * scale - H - 10;
  const slack = !s.released && s.st.floating;
  // The balance body never dips into the tank: the string just gets longer.
  const hookY = s.released ? Math.min(hookTarget, rimY - 24) : Math.min(slack ? Math.min(hookTarget, objTop - 8) : objTop - 10, rimY - 4);
  const bodyTop = hookY - 10 - BH;

  // Stand.
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fillRect(cx - 50, 0, 100, 3);
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, 3);
  ctx.lineTo(cx, bodyTop);
  ctx.stroke();

  // Balance body with a 0 to 10 N scale.
  const bw = 26;
  ctx.fillStyle = "rgba(125,211,252,0.1)";
  ctx.strokeStyle = "rgba(125,211,252,0.6)";
  ctx.beginPath();
  ctx.roundRect(cx - bw / 2, bodyTop, bw, BH, 6);
  ctx.fill();
  ctx.stroke();
  const z0 = bodyTop + 7;
  const span = BH - 14;
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "9px system-ui, sans-serif";
  ctx.textAlign = "right";
  for (let n = 0; n <= BALANCE_MAX; n++) {
    const y = z0 + (n / BALANCE_MAX) * span;
    ctx.fillRect(cx - bw / 2 + 3, y - 0.5, n % 5 === 0 ? 8 : 4, 1);
    if (n % 5 === 0) ctx.fillText(String(n), cx - bw / 2 - 3, y + 3);
  }
  const py = z0 + (Math.min(s.st.reading, BALANCE_MAX) / BALANCE_MAX) * span;
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.moveTo(cx - bw / 2 + 2, py);
  ctx.lineTo(cx + 4, py - 3);
  ctx.lineTo(cx + 4, py + 3);
  ctx.closePath();
  ctx.fill();
  // Reading beside the balance.
  ctx.textAlign = "right";
  ctx.font = "700 15px system-ui, sans-serif";
  ctx.fillText(`${s.st.reading.toFixed(2)} N`, cx - bw / 2 - 20, bodyTop + BH / 2 + 5);
  // Hook.
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, bodyTop + BH);
  ctx.lineTo(cx, hookY);
  ctx.stroke();

  // Tank walls and the spout on the right, level with the surface.
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  ctx.fillRect(tl, rimY, tw, bottomY - rimY);
  // Object, then the liquid over it so the part under is tinted.
  drawObject(ctx, s.obj, cx, objBottom, scale);
  ctx.fillStyle = liq.color;
  ctx.globalAlpha = 0.28;
  ctx.fillRect(tl, surfaceY, tw, bottomY - surfaceY);
  ctx.globalAlpha = 1;
  ctx.fillStyle = liq.color;
  ctx.fillRect(tl, surfaceY - 1, tw, 2);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tl, rimY);
  ctx.lineTo(tl, bottomY);
  ctx.lineTo(tr, bottomY);
  ctx.lineTo(tr, rimY);
  ctx.stroke();
  // String (straight when tight, drooping when slack).
  if (!s.released) {
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, hookY);
    if (slack) ctx.bezierCurveTo(cx + 16, hookY + 4, cx + 12, objTop - 2, cx, objTop);
    else ctx.lineTo(cx, objTop);
    ctx.stroke();
  }

  // Spout and beaker.
  const sx = tr;
  const spoutEnd = sx + Math.min(26, w * 0.07);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(sx, surfaceY + 2);
  ctx.lineTo(spoutEnd, surfaceY + 8);
  ctx.stroke();
  ctx.strokeStyle = liq.color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(sx, surfaceY + 2);
  ctx.lineTo(spoutEnd, surfaceY + 8);
  ctx.stroke();
  const bkW = Math.min(64, w * 0.17);
  const bkH = Math.min(80, (bottomY - surfaceY) * 0.7);
  const bkX = spoutEnd - 4;
  const scaleTop = bottomY - 14;
  const bkBottom = scaleTop;
  const bkTop = bkBottom - bkH;
  if (s.drip) {
    ctx.strokeStyle = liq.color;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.lineDashOffset = -s.now / 20;
    ctx.beginPath();
    ctx.moveTo(spoutEnd, surfaceY + 9);
    ctx.lineTo(spoutEnd + 2, bkBottom - 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  const fill = Math.min(1, s.overflow / BEAKER_CAP) * (bkH - 4);
  ctx.fillStyle = liq.color;
  ctx.globalAlpha = 0.45;
  ctx.fillRect(bkX + 2, bkBottom - fill, bkW - 4, fill);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(bkX, bkTop);
  ctx.lineTo(bkX, bkBottom);
  ctx.lineTo(bkX + bkW, bkBottom);
  ctx.lineTo(bkX + bkW, bkTop);
  ctx.stroke();
  // Kitchen scale under the beaker.
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(bkX - 8, scaleTop, bkW + 16, 14);
  ctx.fillStyle = "#a3e635";
  ctx.font = "700 11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${upthrust(liq.density, s.overflow).toFixed(2)} N`, bkX + bkW / 2, scaleTop + 11);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "10px system-ui, sans-serif";
  ctx.fillText("overflow", bkX + bkW / 2, bkTop - 5);

  // Upthrust and weight arrows on the object (same scale).
  const ax = cx + Math.max(objWidth(s.obj) * scale / 2 + 10, 18);
  const nPx = 7;
  const midY = (objTop + objBottom) / 2;
  if (s.st.upthrust > 0.005) arrow(ctx, ax, midY, ax, midY - s.st.upthrust * nPx, "#22d3ee", 2.5);
  arrow(ctx, ax + 8, midY, ax + 8, midY + s.st.weight * nPx, "#fb7185", 2.5);

  // Status, top right.
  ctx.textAlign = "right";
  ctx.font = "600 12px system-ui, sans-serif";
  ctx.fillStyle = "#22d3ee";
  ctx.fillText(`↑ Upthrust ${s.st.upthrust.toFixed(2)} N`, w - 8, 16);
  ctx.fillStyle = "#fb7185";
  ctx.fillText(`↓ Weight ${s.st.weight.toFixed(2)} N`, w - 8, 32);
  ctx.font = "12px system-ui, sans-serif";
  const msg = s.released
    ? s.st.onBottom
      ? "Let go: it sinks"
      : "Let go: it floats"
    : s.st.floating
      ? "Floating: upthrust = weight"
      : s.st.fullyUnder
        ? "Fully under the surface"
        : s.st.vSub > 0
          ? "Going in..."
          : "In the air";
  ctx.fillStyle = s.released ? (s.st.onBottom ? "#fda4af" : "#a3e635") : "rgba(255,255,255,0.75)";
  ctx.fillText(msg, w - 8, 48);
  ctx.textAlign = "left";
}

function objWidth(o: FloatObject) {
  return o.shape === "sphere" ? 2 * sphereRadius(o.volume) * (o.id === "egg" ? 0.8 : 1) : o.width!;
}

/** Draw an object whose bottom is at y, centred on x. */
function drawObject(ctx: CanvasRenderingContext2D, o: FloatObject, x: number, y: number, scale: number) {
  const H = objectHeight(o) * scale;
  const W = objWidth(o) * scale;
  ctx.fillStyle = o.color;
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1;
  if (o.id === "stone") {
    ctx.beginPath();
    const pts = [1, 0.9, 1, 0.85, 0.95, 1.05, 0.88, 1, 0.92, 1.02];
    for (let i = 0; i < pts.length; i++) {
      const a = (i / pts.length) * Math.PI * 2;
      const px = x + Math.cos(a) * (H / 2) * pts[i] * 1.08;
      const py = y - H / 2 + Math.sin(a) * (H / 2) * pts[i];
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (o.shape === "sphere") {
    ctx.beginPath();
    ctx.ellipse(x, y - H / 2, W / 2, H / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.arc(x - W * 0.18, y - H * 0.68, Math.max(1.5, W * 0.1), 0, Math.PI * 2);
    ctx.fill();
    if (o.id === "apple") {
      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y - H);
      ctx.lineTo(x + 3, y - H - 4);
      ctx.stroke();
    }
  } else if (o.id === "bowl") {
    ctx.beginPath();
    ctx.moveTo(x - W / 2, y - H);
    ctx.quadraticCurveTo(x - W / 2, y, x - W * 0.2, y);
    ctx.lineTo(x + W * 0.2, y);
    ctx.quadraticCurveTo(x + W / 2, y, x + W / 2, y - H);
    ctx.lineTo(x + W / 2 - 3, y - H);
    ctx.quadraticCurveTo(x + W / 2 - 3, y - 3, x + W * 0.2, y - 3);
    ctx.lineTo(x - W * 0.2, y - 3);
    ctx.quadraticCurveTo(x - W / 2 + 3, y - 3, x - W / 2 + 3, y - H);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (o.id === "bottle") {
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.roundRect(x - W / 2, y - H * 0.82, W, H * 0.82, 4);
    ctx.fill();
    ctx.fillRect(x - W * 0.22, y - H, W * 0.44, H * 0.2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(x - W * 0.24, y - H, W * 0.48, 4);
  } else {
    ctx.globalAlpha = o.id === "ice" ? 0.8 : 1;
    ctx.fillRect(x - W / 2, y - H, W, H);
    ctx.globalAlpha = 1;
    ctx.strokeRect(x - W / 2, y - H, W, H);
    if (o.id === "wood") {
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(x - W / 2 + 2, y - H + (H * i) / 4);
        ctx.lineTo(x + W / 2 - 2, y - H + (H * i) / 4 + 1);
        ctx.stroke();
      }
    }
  }
}

function drawRepel(ctx: CanvasRenderingContext2D, w: number, h: number, z: number[], ups: boolean[], gaps: number[], angle: number, rubs: number) {
  // Left: ring magnets on a pencil.
  const baseY = h - 18;
  const pxPerM = Math.min((h - 64) / 0.065, (w * 0.5 - 40) / 0.034);
  const cx = Math.round(w * 0.24);
  const rw = 0.026 * pxPerM;
  const rt = RING.thickness * pxPerM;
  ctx.fillStyle = "rgba(180,83,9,0.4)";
  ctx.fillRect(cx - rw, baseY, rw * 2, 8);
  ctx.fillStyle = "#facc15";
  ctx.fillRect(cx - 3, 34, 6, baseY - 34);
  ctx.fillStyle = "#fde68a";
  ctx.beginPath();
  ctx.moveTo(cx - 3, 34);
  ctx.lineTo(cx, 26);
  ctx.lineTo(cx + 3, 34);
  ctx.closePath();
  ctx.fill();
  ctx.font = "700 9px system-ui, sans-serif";
  ctx.textAlign = "center";
  for (let i = 0; i < z.length; i++) {
    const yc = baseY - z[i] * pxPerM;
    const top = yc - rt / 2;
    const topColor = ups[i] ? "#ef4444" : "#3b82f6";
    const botColor = ups[i] ? "#3b82f6" : "#ef4444";
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? cx - rw / 2 : cx + 5;
      const ww = rw / 2 - 5;
      ctx.fillStyle = topColor;
      ctx.fillRect(x0, top, ww, rt / 2);
      ctx.fillStyle = botColor;
      ctx.fillRect(x0, top + rt / 2, ww, rt / 2);
    }
    ctx.fillStyle = "#fff";
    ctx.fillText(ups[i] ? "N" : "S", cx - rw / 4 - 2, top + rt / 2 - 1);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.textAlign = "left";
    ctx.fillText(`${i + 1} · ${ups[i] ? "N" : "S"} up`, cx + rw / 2 + 4, yc + 4);
    ctx.textAlign = "center";
  }
  // Gap labels.
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "left";
  for (let i = 0; i < gaps.length; i++) {
    if (gaps[i] < 0.002) continue;
    const yA = baseY - (z[i] + RING.thickness / 2) * pxPerM;
    const yB = baseY - (z[i + 1] - RING.thickness / 2) * pxPerM;
    ctx.fillStyle = "#a3e635";
    ctx.fillText(`gap ${(gaps[i] * 100).toFixed(1)} cm`, cx + rw / 2 + 4, (yA + yB) / 2 + 4);
  }
  ctx.textAlign = "left";
  ctx.font = "600 12px system-ui, sans-serif";
  const floating = gaps.some((g) => g > 0.002);
  ctx.fillStyle = floating ? "#a3e635" : "rgba(255,255,255,0.75)";
  ctx.fillText(floating ? "Like poles face: repel" : "Unlike poles: stuck", 8, 16);

  // Right: two rubbed balloons on threads from one hook.
  const hx = Math.round(w * 0.74);
  const hy = 14;
  const Ltot = BALLOON.thread + BALLOON.radius;
  const sb = Math.min((h - hy - 20) / (Ltot + BALLOON.radius), (w * 0.5 - 12) / (2 * Ltot * Math.sin(0.45) + 2 * BALLOON.radius));
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillRect(hx - 30, hy - 4, 60, 3);
  const br = BALLOON.radius * sb;
  for (const side of [-1, 1]) {
    const bx = hx + side * Math.sin(angle) * Ltot * sb;
    const by = hy + Math.cos(angle) * Ltot * sb;
    const tx = hx + side * Math.sin(angle) * BALLOON.thread * sb;
    const ty = hy + Math.cos(angle) * BALLOON.thread * sb;
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.fillStyle = "rgba(244,114,182,0.75)";
    ctx.beginPath();
    ctx.ellipse(bx, by, br * 0.9, br, -side * angle, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fde047";
    ctx.font = "700 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    const marks = Math.min(rubs, 6);
    for (let k = 0; k < marks; k++) {
      const a = (k / Math.max(marks, 1)) * Math.PI * 2;
      ctx.fillText("−", bx + Math.cos(a) * br * 0.5, by + Math.sin(a) * br * 0.5 + 4);
    }
    if (rubs > 0 && angle > Math.asin(BALLOON.radius / Ltot) + 0.03) arrow(ctx, bx + side * br * 1.05, by, bx + side * (br * 1.05 + 18), by, "#22d3ee", 2);
  }
  ctx.textAlign = "left";
  ctx.font = "600 12px system-ui, sans-serif";
  ctx.fillStyle = rubs > 0 ? "#a3e635" : "rgba(255,255,255,0.75)";
  ctx.fillText(rubs > 0 ? "Like charges: repel" : "Not rubbed", Math.round(w * 0.52), h - 8);
}

function drawBoat(ctx: CanvasRenderingContext2D, w: number, h: number, b: Boat, load: number, launched: boolean, draft: number, sinking: boolean) {
  const surfaceY = Math.round(h * 0.56);
  const BW = Math.min(w * 0.72, 340);
  const HH = BW * (b.id === "ganga" ? 0.13 : b.id === "kerala" ? 0.14 : 0.16);
  const cx = launched ? w * 0.55 : Math.max(BW * 0.55 + 4, w * 0.36);
  // Water and the bank.
  ctx.fillStyle = b.water > 1000 ? "#0e7490" : "#1d4ed8";
  ctx.globalAlpha = 0.25;
  ctx.fillRect(0, surfaceY, w, h - surfaceY);
  ctx.globalAlpha = 1;
  if (!launched) {
    ctx.fillStyle = "#78716c";
    ctx.fillRect(0, surfaceY - 6, w * 0.7, h - surfaceY + 6);
    ctx.fillStyle = "#a8a29e";
    for (let i = 0; i < 4; i++) ctx.fillRect(0, surfaceY - 6 + i * 16, w * 0.7 - i * 10, 2);
  }
  const bottomY = launched ? surfaceY + draft * HH : surfaceY - 6;
  ctx.save();
  if (sinking) {
    ctx.translate(cx, bottomY);
    ctx.rotate(Math.min(0.35, Math.max(0, draft - 1) * 0.25));
    ctx.translate(-cx, -bottomY);
  }
  const x0 = cx - BW / 2;
  const deck = bottomY - HH;
  // Hull.
  ctx.fillStyle = b.id === "ship" ? "#b91c1c" : b.id === "kerala" ? "#78350f" : "#92400e";
  ctx.beginPath();
  ctx.moveTo(x0 - BW * 0.04, deck - HH * 0.15);
  ctx.lineTo(x0 + BW * 1.04, deck - HH * 0.15);
  ctx.quadraticCurveTo(x0 + BW * 0.95, bottomY, x0 + BW * 0.85, bottomY);
  ctx.lineTo(x0 + BW * 0.12, bottomY);
  ctx.quadraticCurveTo(x0 + BW * 0.03, bottomY, x0 - BW * 0.04, deck - HH * 0.15);
  ctx.closePath();
  ctx.fill();
  if (b.id === "ship") {
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(x0, deck - HH * 0.15, BW, HH * 0.55);
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(x0 + BW * 0.82, deck - HH * 1.6, BW * 0.12, HH * 1.5);
  } else if (b.id === "kerala") {
    ctx.strokeStyle = "#d6b370";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, deck - HH * 0.15, BW * 0.36, HH * 1.3, 0, Math.PI, 0);
    ctx.stroke();
  }
  // Cargo.
  const n = Math.round(load / b.step);
  const maxN = Math.round((maxLoad(b) * 1.25) / b.step);
  const cols = Math.max(6, Math.ceil(Math.sqrt(maxN * 2.2)));
  const size = (BW * 0.6) / cols;
  const colors = b.id === "ship" ? ["#22d3ee", "#f472b6", "#a3e635", "#fbbf24"] : ["#e7d3a8", "#d6b370"];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    ctx.fillStyle = colors[(i * 7 + r) % colors.length];
    ctx.beginPath();
    ctx.roundRect(cx - BW * 0.3 + c * size + 1, deck - HH * 0.15 - (r + 1) * size * 0.7, size - 2, size * 0.7 - 1, b.id === "ship" ? 1 : 3);
    ctx.fill();
  }
  ctx.restore();
  // Water drawn over the hull so the part under is tinted.
  if (launched) {
    ctx.fillStyle = b.water > 1000 ? "#0e7490" : "#1d4ed8";
    ctx.globalAlpha = 0.45;
    ctx.fillRect(w * 0.0, surfaceY, w, h - surfaceY);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = "#7dd3fc";
  ctx.fillRect(launched ? 0 : w * 0.7, surfaceY - 1, w, 2);

  ctx.textAlign = "left";
  ctx.font = "600 12px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(`${b.name}, ${b.place}`, 8, 16);
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText(`About ${b.length} m long · ${b.waterLabel}`, 8, 32);
  if (launched) {
    ctx.font = "600 13px system-ui, sans-serif";
    ctx.fillStyle = sinking ? "#fda4af" : loadIsGood(b, load) ? "#a3e635" : "#fcd34d";
    ctx.fillText(sinking ? "Water pours over the edge: it sinks!" : `Afloat: ${Math.round((1 - Math.min(draft, 1)) * 100)}% of the hull above water`, 8, h - 10);
  }
}
