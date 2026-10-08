"use client";

import { useEffect, useRef, useState } from "react";
import {
  CELL,
  CELLS,
  FUSE_RATINGS,
  GLOW_C,
  ROOM_C,
  TURNS,
  WIRES,
  craneUpdate,
  electromagnet,
  fuseMelts,
  glowOf,
  heating,
  newCrane,
  type CraneState,
  type LoadId,
  type WireId,
} from "@/lib/sim/electromagnet";
import { fitCanvas } from "./canvas";

export type LabMode = "crane" | "heat";

export interface CraneReading {
  mode: LabMode;
  cells: number;
  turns: number;
  core: boolean;
  on: boolean;
  load: LoadId;
  current: number;
  holdGrams: number;
  pos: "pile" | "truck";
  held: number;
  truck: number;
  drops: number;
  heat: { wire: WireId; rating: number; on: boolean; current: number; tempC: number; glow: boolean; fuseBlown: boolean };
}

interface Props {
  onReading?: (r: CraneReading) => void;
  /** Challenge: the truck needs exactly this many iron pieces. Locks the lab to the crane and scrap. */
  order?: number | null;
}

type Faller = { kind: "iron" | "clip"; x: number; y: number; vy: number; dest: "pile" | "truck"; i: number };

export default function CraneLab({ onReading, order = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<LabMode>("crane");
  const [crane, setCrane] = useState<CraneState>(() => newCrane("scrap"));
  const [travelling, setTravelling] = useState(false);
  const [wire, setWire] = useState<WireId>("nichrome");
  const [rating, setRating] = useState<number>(3);
  const [heatOn, setHeatOn] = useState(false);
  const [fuseBlown, setFuseBlown] = useState(false);
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: LabMode = order !== null ? "crane" : mode;
  const em = electromagnet(crane.cells, crane.turns, crane.core, crane.on);
  const emCurrent = em.current;
  const emHold = em.holdGrams;
  const steady = heating(wire, crane.cells);
  const closed = heatOn && !fuseBlown;
  const heatCurrent = closed ? steady.current : 0;
  const heatTemp = closed ? steady.tempC : ROOM_C;
  const glow = glowOf(heatTemp);

  // Everything the animation loop needs, kept fresh without restarting it.
  const live = useRef({ activeMode, crane, em, wire, rating, heatOn, closed, heatCurrent, heatTemp, fuseBlown, order });
  useEffect(() => {
    live.current = { activeMode, crane, em, wire, rating, heatOn, closed, heatCurrent, heatTemp, fuseBlown, order };
  });
  const anim = useRef({ x: 0, target: 0, fallers: [] as Faller[], temp: ROOM_C, fuseTimer: 0, w: 0, h: 0 });

  useEffect(() => {
    onReadingRef.current?.({
      mode: activeMode,
      cells: crane.cells,
      turns: crane.turns,
      core: crane.core,
      on: crane.on,
      load: crane.load,
      current: emCurrent,
      holdGrams: emHold,
      pos: crane.pos,
      held: crane.held,
      truck: crane.truck,
      drops: crane.drops,
      heat: { wire, rating, on: heatOn, current: heatCurrent, tempC: heatTemp, glow: heatTemp >= GLOW_C, fuseBlown },
    });
  }, [activeMode, crane, emCurrent, emHold, wire, rating, heatOn, heatCurrent, heatTemp, fuseBlown]);

  /** Change crane settings; anything that falls off the magnet is animated. */
  const update = (patch: Parameters<typeof craneUpdate>[1]) => {
    const n = craneUpdate(crane, patch);
    if (n.held < crane.held && n.load === crane.load) {
      const a = anim.current;
      const k = craneScale(a.w, a.h);
      const geo = craneGeo(a.w / k, a.h / k);
      const mx = geo.pileX + (geo.truckX - geo.pileX) * a.x;
      const kind = n.load === "scrap" ? "iron" : "clip";
      const destCount = n.pos === "pile" ? n.pile : n.truck;
      // The dropped items take the top spots at their destination.
      for (let i = n.held; i < crane.held; i++) {
        const p = heldSpot(kind, i, mx, geo.magY);
        a.fallers.push({ kind, x: p.x, y: p.y, vy: 0, dest: n.pos, i: destCount - crane.held + i });
      }
    }
    setCrane(n);
  };

  const swing = () => {
    const to = crane.pos === "pile" ? "truck" : "pile";
    anim.current.target = to === "truck" ? 1 : 0;
    setTravelling(true);
  };

  useEffect(() => {
    const c = canvasRef.current!;
    const ro = new ResizeObserver(() => {
      anim.current.w = c.clientWidth;
      anim.current.h = c.clientHeight;
    });
    ro.observe(c);
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const a = anim.current;
      const L = live.current;
      // Swing the magnet.
      if (a.x !== a.target) {
        const step = 1.3 * dt;
        a.x = Math.abs(a.target - a.x) <= step ? a.target : a.x + Math.sign(a.target - a.x) * step;
        if (a.x === a.target) {
          const pos = a.target === 1 ? "truck" : "pile";
          setCrane((s) => craneUpdate(s, { pos }));
          setTravelling(false);
        }
      }
      // The wire warms up or cools down over about a second (a real thin wire is a little quicker).
      a.temp += (L.heatTemp - a.temp) * Math.min(1, dt / 0.8);
      if (L.closed && fuseMelts(L.heatCurrent, L.rating)) {
        a.fuseTimer += dt;
        if (a.fuseTimer > 0.7) {
          a.fuseTimer = 0;
          setFuseBlown(true);
        }
      } else a.fuseTimer = 0;

      if (a.w) {
        const ctx = fitCanvas(c, a.w, a.h);
        ctx.clearRect(0, 0, a.w, a.h);
        if (L.activeMode === "crane") drawCrane(ctx, a.w, a.h, L.crane, L.em.holdGrams, a, dt, L.order);
        else drawHeat(ctx, a.w, a.h, L.wire, L.crane.cells, L.rating, L.heatOn, L.closed, L.heatCurrent, a.temp, L.fuseBlown, a.fuseTimer);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const volts = (crane.cells * CELL.volts).toFixed(1);
  const kindWord = crane.load === "scrap" ? "pieces of iron" : "paper clips";

  return (
    <div className="flex flex-col gap-3 select-none">
      {order === null && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["crane", "heat"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${activeMode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m === "crane" ? "Electromagnet crane" : "Heating effect"}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        role="img"
        aria-label={
          activeMode === "crane"
            ? `Crane electromagnet with ${crane.turns} turns, ${crane.cells} cells, ${crane.core ? "iron core in" : "no core"}, switch ${crane.on ? "on" : "off"}. It is over the ${crane.pos} holding ${crane.held} ${kindWord}. The truck has ${crane.truck}.`
            : `A ${WIRES[wire].label.toLowerCase()} wire and a ${rating} A fuse connected to ${crane.cells} cells. ${fuseBlown ? "The fuse has melted, so no current flows." : `Current ${heatCurrent.toFixed(2)} A, wire at ${Math.round(heatTemp)} °C, ${glow.name}.`}`
        }
      />

      {activeMode === "crane" ? (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Current" value={`${em.current.toFixed(2)} A`} />
            <Stat label="Can hold" value={`${Math.round(em.holdGrams)} g`} />
            <Stat label="On magnet" value={`${crane.held}`} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={travelling}
              onClick={() => update({ on: !crane.on })}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold disabled:opacity-40 ${crane.on ? "border-lime-300 bg-lime-300/15 text-lime-200" : "border-white/20 text-white/80"}`}
            >
              Switch: {crane.on ? "ON" : "OFF"}
            </button>
            <button disabled={travelling} onClick={swing} className="rounded-xl border border-cyan-300/60 px-3 py-2.5 text-sm text-cyan-200 disabled:opacity-40">
              {crane.pos === "pile" ? "Swing to truck ▶" : "◀ Swing to pile"}
            </button>
          </div>
          <Slider label="Turns of wire in the coil" value={crane.turns} shown={`${crane.turns} turns`} min={TURNS.min} max={TURNS.max} step={TURNS.step} disabled={travelling} onChange={(v) => update({ turns: v })} />
          <Slider label="Cells in series" value={crane.cells} shown={`${crane.cells} (${volts} V)`} min={CELLS.min} max={CELLS.max} step={1} disabled={travelling} onChange={(v) => update({ cells: v })} />
          <Choice
            options={[
              { id: "in", label: "Iron core in" },
              { id: "out", label: "No core" },
            ]}
            value={crane.core ? "in" : "out"}
            onChange={(v) => !travelling && update({ core: v === "in" })}
          />
          {order === null && (
            <Choice
              options={[
                { id: "scrap", label: "Scrap yard" },
                { id: "clips", label: "Paper clips" },
              ]}
              value={crane.load}
              onChange={(v) => !travelling && update({ load: v as LoadId })}
            />
          )}
          <p className="text-center text-xs text-white/40">
            {crane.load === "scrap"
              ? "Each iron piece is 50 g. The aluminium cans and the plastic bottle are in the pile too."
              : "Each paper clip is about 1 g."}{" "}
            The magnet works only while the switch is on.
          </p>
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Current" value={`${heatCurrent.toFixed(2)} A`} />
            <Stat label="Wire" value={`${Math.round(heatTemp)} °C`} />
            <Stat label="Fuse" value={fuseBlown ? "Melted" : `${rating} A ok`} warn={fuseBlown} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setHeatOn(!heatOn)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${heatOn ? "border-lime-300 bg-lime-300/15 text-lime-200" : "border-white/20 text-white/80"}`}
            >
              Switch: {heatOn ? "ON" : "OFF"}
            </button>
            <button
              disabled={!fuseBlown}
              onClick={() => setFuseBlown(false)}
              className="rounded-xl border border-amber-300/60 px-3 py-2.5 text-sm text-amber-200 disabled:opacity-30"
            >
              Fit a new fuse
            </button>
          </div>
          <Choice
            options={(Object.keys(WIRES) as WireId[]).map((id) => ({ id, label: `${WIRES[id].label} wire` }))}
            value={wire}
            onChange={(v) => setWire(v as WireId)}
          />
          <Choice
            options={FUSE_RATINGS.map((r) => ({ id: String(r), label: `${r} A fuse` }))}
            value={String(rating)}
            onChange={(v) => {
              setRating(Number(v));
              setFuseBlown(false);
            }}
          />
          <Slider label="Cells in series" value={crane.cells} shown={`${crane.cells} (${volts} V)`} min={CELLS.min} max={CELLS.max} step={1} onChange={(v) => update({ cells: v })} />
          <div className="grid gap-2 text-xs text-white/60 sm:grid-cols-3">
            <Use icon="🔥" title="Room heater">A long coil of nichrome glows red hot.</Use>
            <Use icon="👕" title="Electric iron">A nichrome element hidden inside heats the base.</Use>
            <Use icon="🔌" title="MCB">A switch that turns off by itself when the current is too big. Push it back up after fixing the fault.</Use>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] uppercase tracking-wider text-white/50">{label}</div>
      <div className={`font-display text-lg tabular-nums ${warn ? "text-rose-300" : ""}`}>{value}</div>
    </div>
  );
}

function Use({ icon, title, children }: { icon: string; title: string; children: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="text-white/80">
        {icon} {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Slider(props: { label: string; value: number; shown: string; min: number; max: number; step: number; disabled?: boolean; onChange: (v: number) => void }) {
  return (
    <label className={`block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 ${props.disabled ? "opacity-50" : ""}`}>
      <div className="flex justify-between text-sm">
        <span className="text-white/60">{props.label}</span>
        <span className="tabular-nums text-white">{props.shown}</span>
      </div>
      <input
        type="range"
        className="range mt-2 w-full"
        aria-label={props.label}
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        disabled={props.disabled}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
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
          className={`flex-1 rounded-xl border px-3 py-2 text-sm whitespace-nowrap ${value === o.id ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- crane drawing

/** The crane scene is drawn in a virtual space about 340 × 230 px, scaled up on big screens. */
function craneScale(w: number, h: number) {
  return Math.max(1, Math.min(h / 230, w / 340));
}

function craneGeo(w: number, h: number) {
  const ground = h - 26;
  return { ground, pileX: w * 0.25, truckX: w * 0.72, railY: 18, magY: ground - 82 };
}

/** Where the i-th held item hangs under a magnet centred at mx with its bottom at magY. */
function heldSpot(kind: "iron" | "clip", i: number, mx: number, magY: number) {
  if (kind === "iron") {
    const row = Math.floor(i / 4);
    const col = i % 4;
    const inRow = Math.min(4, 8 - row * 4);
    return { x: mx + (col - (inRow - 1) / 2) * 16, y: magY + 8 + row * 12 };
  }
  const row = Math.floor(i / 7);
  const col = i % 7;
  return { x: mx + (col - 3) * 9, y: magY + 5 + row * 7 };
}

/** Spots in the pile, bottom row first. */
function pileSpot(kind: "iron" | "clip", i: number, cx: number, ground: number) {
  if (kind === "iron") {
    const rows = [5, 4, 1];
    let r = 0;
    let k = i;
    while (r < rows.length - 1 && k >= rows[r]) k -= rows[r++];
    return { x: cx + (k - (rows[r] - 1) / 2) * 15 + (r % 2) * 2, y: ground - 6 - r * 10 };
  }
  const row = Math.floor(i / 9);
  const col = i % 9;
  return { x: cx + (col - 4) * 9 + (row % 2) * 4, y: ground - 4 - row * 6 };
}

function truckSpot(kind: "iron" | "clip", i: number, tx: number, bedY: number) {
  if (kind === "iron") {
    const row = Math.floor(i / 5);
    const col = i % 5;
    return { x: tx - 32 + col * 15 + (row % 2) * 4, y: bedY - 6 - row * 10 };
  }
  const row = Math.floor(i / 8);
  const col = i % 8;
  return { x: tx - 34 + col * 9, y: bedY - 4 - row * 6 };
}

function drawIron(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(((seed * 37) % 7) * 0.12 - 0.35);
  ctx.fillStyle = seed % 3 === 0 ? "#6b7280" : seed % 3 === 1 ? "#78716c" : "#57534e";
  ctx.strokeStyle = "#a8a29e";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-7, -4);
  ctx.lineTo(5, -5);
  ctx.lineTo(7, 2);
  ctx.lineTo(-1, 5);
  ctx.lineTo(-7, 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#b45309";
  ctx.fillRect(-3, -1, 3, 2); // a rust spot
  ctx.restore();
}

function drawClip(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 2, 8, 4, 2);
  ctx.moveTo(x - 2, y);
  ctx.lineTo(x + 3, y);
  ctx.stroke();
}

function drawCrane(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  s: CraneState,
  holdGrams: number,
  a: { x: number; fallers: Faller[] },
  dt: number,
  order: number | null,
) {
  const sc = craneScale(w, h);
  ctx.scale(sc, sc);
  w /= sc;
  h /= sc;
  const g = craneGeo(w, h);
  const kind = s.load === "scrap" ? "iron" : "clip";
  const mx = g.pileX + (g.truckX - g.pileX) * a.x;
  ctx.font = "11px system-ui, sans-serif";

  // Ground and rail.
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(0, g.ground, w, h - g.ground);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, g.ground + 0.5);
  ctx.lineTo(w, g.ground + 0.5);
  ctx.stroke();
  ctx.fillStyle = "#facc15";
  ctx.fillRect(8, g.railY - 3, w - 16, 6);
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  for (let x = 14; x < w - 14; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x, g.railY - 3);
    ctx.lineTo(x + 7, g.railY + 3);
    ctx.lineTo(x + 3, g.railY + 3);
    ctx.lineTo(x - 4, g.railY - 3);
    ctx.fill();
  }

  // Pending fallers are drawn falling, not yet at their destination.
  const pending = { pile: 0, truck: 0 };
  for (const f of a.fallers) pending[f.dest]++;

  // Pile: magnetic items, then non-magnetic items in front.
  const pileShow = Math.max(0, s.pile - pending.pile);
  for (let i = 0; i < pileShow; i++) {
    const p = pileSpot(kind, i, g.pileX, g.ground);
    if (kind === "iron") drawIron(ctx, p.x, p.y, i);
    else drawClip(ctx, p.x, p.y);
  }
  if (s.load === "scrap") {
    drawCan(ctx, g.pileX - 46, g.ground);
    drawCan(ctx, g.pileX + 40, g.ground);
    drawBottle(ctx, g.pileX + 52, g.ground);
  }
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.textAlign = "center";
  ctx.fillText(s.load === "scrap" ? "Scrap pile" : "Paper clips", g.pileX, h - 9);

  // Truck.
  const bedY = g.ground - 22;
  const tx = g.truckX;
  ctx.fillStyle = "#1d4ed8";
  ctx.fillRect(tx - 40, bedY, 80, 12);
  ctx.fillStyle = "#2563eb";
  ctx.fillRect(tx - 40, bedY - 16, 4, 16);
  ctx.fillRect(tx + 36, bedY - 16, 4, 16);
  ctx.fillStyle = "#3b82f6";
  ctx.beginPath();
  ctx.roundRect(tx + 42, bedY - 14, 22, 26, 3);
  ctx.fill();
  ctx.fillStyle = "#bae6fd";
  ctx.fillRect(tx + 50, bedY - 10, 11, 9);
  ctx.fillStyle = "#111827";
  for (const wx of [tx - 24, tx + 18, tx + 52]) {
    ctx.beginPath();
    ctx.arc(wx, g.ground - 6, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  const truckShow = Math.max(0, s.truck - pending.truck);
  for (let i = 0; i < truckShow; i++) {
    const p = truckSpot(kind, i, tx, bedY);
    if (kind === "iron") drawIron(ctx, p.x, p.y, i + 3);
    else drawClip(ctx, p.x, p.y);
  }
  ctx.fillStyle = order !== null && s.truck > order ? "#fda4af" : "rgba(255,255,255,0.75)";
  ctx.textAlign = "center";
  ctx.fillText(order !== null ? `Truck: ${s.truck} of ${order}` : `Truck: ${s.truck}`, tx + 8, h - 9);

  // Cable, trolley and electromagnet.
  ctx.fillStyle = "#e5e7eb";
  ctx.fillRect(mx - 12, g.railY + 2, 24, 8);
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(mx, g.railY + 10);
  ctx.lineTo(mx, g.magY - 30);
  ctx.stroke();
  const mw = 64;
  const top = g.magY - 30;
  // Field glow below the magnet when the current flows (brightness grows with strength).
  if (s.on && holdGrams > 0) {
    const alpha = Math.min(0.45, 0.06 + holdGrams / 900);
    ctx.strokeStyle = `rgba(103,232,249,${alpha})`;
    ctx.lineWidth = 1.2;
    for (let k = 1; k <= 3; k++) {
      ctx.beginPath();
      ctx.ellipse(mx, g.magY, (mw / 2) * (0.4 + k * 0.25), 6 + k * 7, 0, 0, Math.PI);
      ctx.stroke();
    }
  }
  // Core (soft iron) inside the coil, or an empty tube.
  if (s.core) {
    ctx.fillStyle = "#9ca3af";
    ctx.fillRect(mx - 10, top - 4, 20, 34);
  } else {
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(mx - 10, top - 4, 20, 34);
    ctx.setLineDash([]);
  }
  // Coil: one copper band per 10 turns, wound on both sides of the core.
  const bands = Math.round(s.turns / 10);
  ctx.strokeStyle = s.on ? "#fb923c" : "#b45309";
  ctx.lineWidth = 2;
  for (let b = 0; b < bands; b++) {
    const y = top + 2 + (b * 24) / Math.max(1, bands - 1);
    ctx.beginPath();
    ctx.moveTo(mx - mw / 2 + 4, y);
    ctx.lineTo(mx - 11, y + 1);
    ctx.moveTo(mx + 11, y + 1);
    ctx.lineTo(mx + mw / 2 - 4, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(mx - mw / 2, top, mw, 30);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.textAlign = "center";
  ctx.fillText(s.on ? "ON" : "OFF", mx + 24, top - 10);

  // Held items.
  for (let i = 0; i < s.held; i++) {
    const p = heldSpot(kind, i, mx, g.magY);
    if (kind === "iron") drawIron(ctx, p.x, p.y, i + 1);
    else drawClip(ctx, p.x, p.y);
  }

  // Falling items.
  for (const f of a.fallers) {
    const dest =
      f.dest === "pile"
        ? pileSpot(f.kind, Math.min(f.i, 30), g.pileX, g.ground)
        : truckSpot(f.kind, Math.min(f.i, 30), tx, bedY);
    f.vy += 900 * dt;
    f.y += f.vy * dt;
    f.x += (dest.x - f.x) * Math.min(1, dt * 6);
    if (f.kind === "iron") drawIron(ctx, f.x, f.y, f.i);
    else drawClip(ctx, f.x, f.y);
    if (f.y >= dest.y) f.vy = -1; // landed
  }
  a.fallers = a.fallers.filter((f) => f.vy !== -1);
}

function drawCan(ctx: CanvasRenderingContext2D, x: number, ground: number) {
  ctx.fillStyle = "#d1d5db";
  ctx.fillRect(x - 6, ground - 18, 12, 18);
  ctx.fillStyle = "#ef4444";
  ctx.fillRect(x - 6, ground - 13, 12, 6);
  ctx.fillStyle = "#111827";
  ctx.font = "bold 7px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Al", x, ground - 8);
  ctx.font = "11px system-ui, sans-serif";
}

function drawBottle(ctx: CanvasRenderingContext2D, x: number, ground: number) {
  ctx.fillStyle = "rgba(96,165,250,0.45)";
  ctx.strokeStyle = "rgba(147,197,253,0.9)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x - 5, ground - 22, 10, 22, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#22c55e";
  ctx.fillRect(x - 2.5, ground - 26, 5, 4);
}

// ---------------------------------------------------------------- heating drawing

function drawHeat(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  wire: WireId,
  cells: number,
  rating: number,
  switchOn: boolean,
  closed: boolean,
  current: number,
  temp: number,
  blown: boolean,
  fuseTimer: number,
) {
  const L = 22;
  const R = w - 22;
  const T = 46;
  const B = h - 44;
  const midX = w / 2;
  ctx.font = "11px system-ui, sans-serif";
  const wireCol = closed ? "rgba(253,224,71,0.85)" : "rgba(255,255,255,0.45)";

  // Connecting wires around the loop, with gaps for the parts.
  const wireLeft = midX - Math.min(90, w * 0.24);
  const wireRight = midX + Math.min(90, w * 0.24);
  const fuseTop = T + (B - T) * 0.2;
  const fuseBot = T + (B - T) * 0.65;
  const cellW = 14;
  const batW = cells * cellW;
  const batL = midX - batW / 2 - 30;
  const swL = R - 70;
  const swR = R - 34;
  ctx.strokeStyle = wireCol;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(wireLeft, T);
  ctx.lineTo(L, T);
  ctx.lineTo(L, B);
  ctx.lineTo(batL, B);
  ctx.moveTo(batL + batW, B);
  ctx.lineTo(swL, B);
  ctx.moveTo(swR, B);
  ctx.lineTo(R, B);
  ctx.lineTo(R, fuseBot);
  ctx.moveTo(R, fuseTop);
  ctx.lineTo(R, T);
  ctx.lineTo(wireRight, T);
  ctx.stroke();

  // Cells.
  for (let i = 0; i < cells; i++) {
    const x = batL + i * cellW;
    ctx.fillStyle = "#334155";
    ctx.fillRect(x + 1, B - 9, cellW - 2, 18);
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(x + cellW - 3, B - 4, 3, 8);
  }
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.textAlign = "center";
  ctx.fillText(`${cells} cell${cells > 1 ? "s" : ""} (${(cells * CELL.volts).toFixed(1)} V)`, batL + batW / 2, B + 24);

  // Switch.
  ctx.fillStyle = "#e5e7eb";
  ctx.beginPath();
  ctx.arc(swL, B, 3, 0, Math.PI * 2);
  ctx.arc(swR, B, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(swL, B);
  ctx.lineTo(switchOn ? swR : swL + 30, switchOn ? B : B - 16);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("switch", (swL + swR) / 2, B + 24);

  // Fuse holder with the thin fuse wire.
  const fx = R;
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(fx - 9, fuseTop - 4, 18, fuseBot - fuseTop + 8, 4);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = blown ? "#94a3b8" : fuseTimer > 0 ? "#f97316" : "#cbd5e1";
  ctx.lineWidth = 1.2;
  if (blown) {
    const mid = (fuseTop + fuseBot) / 2;
    ctx.beginPath();
    ctx.moveTo(fx, fuseTop);
    ctx.lineTo(fx, mid - 9);
    ctx.moveTo(fx, mid + 9);
    ctx.lineTo(fx, fuseBot);
    ctx.stroke();
    ctx.fillStyle = "#94a3b8";
    ctx.beginPath();
    ctx.arc(fx, mid - 9, 2.2, 0, Math.PI * 2);
    ctx.arc(fx, mid + 9, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // A melting fuse sags.
    const sag = Math.min(1, fuseTimer / 0.7) * 5;
    ctx.beginPath();
    ctx.moveTo(fx, fuseTop);
    ctx.quadraticCurveTo(fx - sag, (fuseTop + fuseBot) / 2, fx, fuseBot);
    ctx.stroke();
  }
  ctx.textAlign = "right";
  ctx.fillStyle = blown ? "#fda4af" : "rgba(255,255,255,0.65)";
  ctx.fillText(`${rating} A fuse`, fx - 14, (fuseTop + fuseBot) / 2 - 2);
  ctx.fillText(blown ? "melted!" : current > 0 ? `${current.toFixed(2)} A` : "", fx - 14, (fuseTop + fuseBot) / 2 + 12);

  // The test wire between two posts.
  ctx.fillStyle = "#e5e7eb";
  for (const x of [wireLeft, wireRight]) {
    ctx.beginPath();
    ctx.arc(x, T, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  const g = glowOf(temp);
  const base = wire === "nichrome" ? [156, 163, 175] : [217, 119, 6];
  // Below glowing, darken the metal slightly as it heats (a tint; it is not shown at real colour).
  const heatFrac = Math.min(1, Math.max(0, (temp - ROOM_C) / (GLOW_C - ROOM_C)));
  ctx.strokeStyle = g.color ?? `rgb(${base.map((v) => Math.round(v * (1 - 0.35 * heatFrac))).join(",")})`;
  ctx.lineWidth = 3;
  if (g.color) {
    ctx.shadowColor = g.color;
    ctx.shadowBlur = temp > 900 ? 22 : 14;
  }
  ctx.beginPath();
  ctx.moveTo(wireLeft, T);
  ctx.lineTo(wireRight, T);
  ctx.stroke();
  ctx.shadowBlur = 0;
  // Heat shimmer above a hot wire.
  if (temp > 120) {
    const t = performance.now() / 400;
    ctx.strokeStyle = `rgba(253,186,116,${Math.min(0.5, (temp - 120) / 800)})`;
    ctx.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      const x = wireLeft + ((k + 0.5) * (wireRight - wireLeft)) / 4;
      ctx.beginPath();
      for (let y = 0; y < 22; y += 2) {
        const px = x + Math.sin(t + y / 4 + k) * 2.5;
        if (y === 0) ctx.moveTo(px, T - 8 - y);
        else ctx.lineTo(px, T - 8 - y);
      }
      ctx.stroke();
    }
  }
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(`${WIRES[wire].label} wire, 10 cm`, midX, T + 18);
  ctx.fillStyle = g.color ?? "rgba(255,255,255,0.55)";
  ctx.fillText(`${Math.round(temp)} °C, ${g.name}`, midX, T + 33);
}
