"use client";

import { useEffect, useRef, useState } from "react";
import {
  COIL,
  COMPASS_CURRENT,
  FRUITS,
  GADGETS,
  LED,
  MAX_CELLS,
  PAIRS,
  coilField,
  coilNorthEnd,
  deflection,
  fruitCell,
  series,
  solveCircuit,
  wireField,
  type FruitId,
  type Gadget,
  type LoadId,
  type PairId,
  type Vec,
} from "@/lib/sim/cells";
import { fitCanvas } from "./canvas";

export type BenchMode = "compass" | "fruit";
export type Setup = "wire" | "coil";
export type End = "east" | "west";

export interface CellReading {
  mode: BenchMode;
  setup: Setup;
  on: boolean;
  /** +1: current flows the normal way; -1: the cell is turned round. */
  polarity: 1 | -1;
  /** Signed swing (degrees, + east) of the compass that swings the most. */
  maxDefl: number;
  /** Which end the student labelled as north, and which end really is north (null when off or not a coil). */
  northLabel: End | null;
  coilNorth: End | null;
  fruit: FruitId;
  pair: PairId;
  cells: number;
  load: LoadId;
  ledFlipped: boolean;
  /** Open-circuit voltage of the fruit battery, n × V₁. */
  emf: number;
  /** What the voltmeter shows with the load connected. */
  volts: number;
  current: number;
  works: boolean;
}

interface Props {
  onReading?: (r: CellReading) => void;
  /** Challenge: power this gadget. Locks the bench to fruit cells and starts from a weak set-up. */
  gadget?: Gadget | null;
}

/** A compass on the table, in metres from the centre (x east, y north). */
type Compass = { x: number; y: number };

const COMPASS_R = 0.011;
const DEFAULT_COMPASSES: Record<Setup, Compass[]> = {
  wire: [
    { x: 0, y: 0.02 },
    { x: -0.045, y: -0.025 },
    { x: 0.075, y: 0.03 },
  ],
  coil: [
    { x: 0.058, y: 0 },
    { x: -0.058, y: 0 },
    { x: 0, y: 0.045 },
  ],
};

const FRUIT_LOOK: Record<FruitId, { fill: string; edge: string }> = {
  lemon: { fill: "#facc15", edge: "#fde047" },
  orange: { fill: "#f97316", edge: "#fdba74" },
  tomato: { fill: "#dc2626", edge: "#f87171" },
  potato: { fill: "#a16207", edge: "#ca8a04" },
};
const METAL_COL: Record<string, string> = { zinc: "#cbd5e1", copper: "#f59e0b", iron: "#64748b" };

/** Field from whatever is on the table, at one compass. */
function fieldAt(setup: Setup, current: number, c: Compass): Vec {
  return setup === "wire" ? wireField(current, c.x) : coilField(c, current);
}

/** World frame for the compass table: pixels per metre and the centre. */
function frame(w: number, h: number) {
  const k = Math.min(w / 0.26, (h - 20) / 0.17);
  return { k, cx: w / 2, cy: (h - 14) / 2 };
}

/** Keep a compass on the table and out of the coil. */
function place(setup: Setup, c: Compass, w: number, h: number): Compass {
  const { k } = frame(w, h);
  const xm = w / 2 / k - COMPASS_R - 0.003;
  const ym = (h - 14) / 2 / k - COMPASS_R - 0.003;
  let x = Math.max(-xm, Math.min(xm, c.x));
  let y = Math.max(-ym + 0.012, Math.min(ym, c.y));
  if (setup === "coil") {
    const hx = COIL.length / 2 + COMPASS_R;
    const hy = COIL.radius + COMPASS_R + 0.002;
    if (Math.abs(x) < hx && Math.abs(y) < hy) {
      // Push it out the nearest way.
      if (hx - Math.abs(x) < hy - Math.abs(y)) x = Math.sign(x || 1) * hx;
      else y = Math.sign(y || 1) * hy;
    }
  }
  if (!Number.isFinite(x)) x = 0;
  if (!Number.isFinite(y)) y = 0;
  return { x, y };
}

export default function CellBench({ onReading, gadget = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<BenchMode>("compass");
  const [setup, setSetup] = useState<Setup>("wire");
  const [on, setOn] = useState(false);
  const [polarity, setPolarity] = useState<1 | -1>(1);
  const [compasses, setCompasses] = useState<Compass[]>(DEFAULT_COMPASSES.wire);
  const [selected, setSelected] = useState(0);
  const [northLabel, setNorthLabel] = useState<End | null>(null);
  const [fruit, setFruit] = useState<FruitId>(gadget ? "potato" : "lemon");
  const [pair, setPair] = useState<PairId>(gadget ? "fe-cu" : "zn-cu");
  const [cells, setCells] = useState(1);
  const [load, setLoad] = useState<LoadId>(gadget ?? "none");
  const [ledFlipped, setLedFlipped] = useState(false);
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: BenchMode = gadget ? "fruit" : mode;
  const activeLoad: LoadId = gadget ?? load;
  const current = on ? polarity * COMPASS_CURRENT : 0;
  const targets = compasses.map((c) => deflection(fieldAt(setup, current, c)));
  const maxDefl = targets.reduce((m, d) => (Math.abs(d) > Math.abs(m) ? d : m), 0);
  const coilNorth = setup === "coil" ? coilNorthEnd(current) : null;
  const battery = series(cells, fruitCell(fruit, pair));
  const result = solveCircuit(battery, activeLoad, ledFlipped);
  const { volts: outVolts, current: outAmps, works } = result;

  const live = useRef({ activeMode, setup, on, polarity, compasses, targets, selected, northLabel, fruit, pair, cells, activeLoad, ledFlipped, result });
  useEffect(() => {
    live.current = { activeMode, setup, on, polarity, compasses, targets, selected, northLabel, fruit, pair, cells, activeLoad, ledFlipped, result };
  });
  const anim = useRef({ w: 0, h: 0, needles: compasses.map(() => ({ th: 0, om: 0 })), phase: 0, drag: -1 });

  useEffect(() => {
    onReadingRef.current?.({
      mode: activeMode,
      setup,
      on,
      polarity,
      maxDefl,
      northLabel: setup === "coil" ? northLabel : null,
      coilNorth,
      fruit,
      pair,
      cells,
      load: activeLoad,
      ledFlipped,
      emf: battery.emf,
      volts: outVolts,
      current: outAmps,
      works,
    });
  }, [activeMode, setup, on, polarity, maxDefl, northLabel, coilNorth, fruit, pair, cells, activeLoad, ledFlipped, battery.emf, outVolts, outAmps, works]);

  useEffect(() => {
    const c = canvasRef.current!;
    const ro = new ResizeObserver(() => {
      anim.current.w = c.clientWidth;
      anim.current.h = c.clientHeight;
    });
    ro.observe(c);
    let raf = 0;
    let last = performance.now();
    const frameFn = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const a = anim.current;
      const L = live.current;
      a.phase += dt;
      // Needles swing like real ones: a springy, damped turn towards the field.
      L.targets.forEach((t, i) => {
        const n = a.needles[i] ?? (a.needles[i] = { th: 0, om: 0 });
        let d = n.th - (t * Math.PI) / 180;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        n.om += (-38 * d - 3.2 * n.om) * dt;
        n.th += n.om * dt;
      });
      if (a.w) {
        const ctx = fitCanvas(c, a.w, a.h);
        ctx.clearRect(0, 0, a.w, a.h);
        if (L.activeMode === "compass") drawCompassTable(ctx, a.w, a.h, L, a.needles.map((n) => n.th), a.phase);
        else drawFruitBench(ctx, a.w, a.h, L, a.phase);
      }
      raf = requestAnimationFrame(frameFn);
    };
    raf = requestAnimationFrame(frameFn);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  // ---- dragging compasses
  const toWorld = (e: React.PointerEvent<HTMLCanvasElement>): Compass => {
    const r = e.currentTarget.getBoundingClientRect();
    const { k, cx, cy } = frame(r.width, r.height);
    return { x: (e.clientX - r.left - cx) / k, y: (cy - (e.clientY - r.top)) / k };
  };
  const moveTo = (i: number, p: Compass, el: HTMLCanvasElement) => {
    const q = place(setup, p, el.clientWidth, el.clientHeight);
    setCompasses((cs) => cs.map((c, j) => (j === i ? q : c)));
  };
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeMode !== "compass") return;
    const p = toWorld(e);
    let best = -1;
    let bestD = COMPASS_R * 1.8;
    compasses.forEach((c, i) => {
      const d = Math.hypot(c.x - p.x, c.y - p.y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    const el = e.currentTarget;
    if (best >= 0) {
      setSelected(best);
      anim.current.drag = best;
      el.setPointerCapture(e.pointerId);
    } else moveTo(selected, p, el); // tap the table to move the chosen compass there
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const i = anim.current.drag;
    if (i >= 0) moveTo(i, toWorld(e), e.currentTarget);
  };
  const onUp = () => {
    anim.current.drag = -1;
  };

  const chooseSetup = (s: Setup) => {
    setSetup(s);
    const el = canvasRef.current;
    setCompasses(DEFAULT_COMPASSES[s].map((c) => (el && el.clientWidth ? place(s, c, el.clientWidth, el.clientHeight) : c)));
    setNorthLabel(null);
  };

  const swingWord = (d: number) => (Math.abs(d) < 0.5 ? "0°" : `${Math.abs(d).toFixed(0)}° ${d > 0 ? "E" : "W"}`);
  const fmtAmps = (i: number) => (i <= 0 ? "0" : i < 1e-3 ? `${(i * 1e6).toFixed(0)} µA` : `${(i * 1e3).toFixed(2)} mA`);

  const loadStatus =
    activeLoad === "none"
      ? "Nothing"
      : activeLoad === "led"
        ? result.works
          ? "LED on"
          : "LED off"
        : result.works
          ? "Working"
          : "Dead";

  const aria =
    activeMode === "compass"
      ? `${setup === "wire" ? "A straight wire runs north to south above the table" : "A coil of wire lies on the table, its ends to the west and east"}, with three compasses. The switch is ${on ? "on" : "off"} and the cell is ${polarity > 0 ? "the normal way" : "reversed"}. The biggest swing is ${swingWord(maxDefl)}.`
      : `${cells} ${FRUITS[fruit].label.toLowerCase()} cell${cells > 1 ? "s" : ""} in series with ${PAIRS[pair].label.toLowerCase()} strips. The voltmeter reads ${result.volts.toFixed(2)} V. ${activeLoad === "none" ? "Nothing is connected." : `${activeLoad === "led" ? `The LED is ${ledFlipped ? "flipped" : "the right way round"} and` : `The ${GADGETS[activeLoad].label.toLowerCase()} is`} ${result.works ? "working" : "not working"}.`}`;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!gadget && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["compass", "fruit"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${activeMode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m === "compass" ? "Compass" : "Fruit cell"}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className={`h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80 ${activeMode === "compass" ? "touch-none cursor-grab" : ""}`}
        role="img"
        aria-label={aria}
      />

      {activeMode === "compass" ? (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Current" value={`${Math.abs(current).toFixed(1)} A`} />
            <Stat label="Biggest swing" value={swingWord(maxDefl)} />
            <Stat label="Cell" value={polarity > 0 ? "Normal" : "Reversed"} warn={polarity < 0} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setOn(!on)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${on ? "border-lime-300 bg-lime-300/15 text-lime-200" : "border-white/20 text-white/80"}`}
            >
              Switch: {on ? "ON" : "OFF"}
            </button>
            <button onClick={() => setPolarity(polarity > 0 ? -1 : 1)} className="rounded-xl border border-cyan-300/60 px-3 py-2.5 text-sm text-cyan-200">
              ⇄ Reverse the cell
            </button>
          </div>
          <Choice
            options={[
              { id: "wire", label: "Straight wire" },
              { id: "coil", label: "Coil" },
            ]}
            value={setup}
            onChange={(v) => chooseSetup(v)}
          />
          {setup === "coil" && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
              <div className="text-sm text-white/60">Which end of the coil is its north pole?</div>
              <div className="mt-2">
                <Choice
                  options={[
                    { id: "west", label: "Left end is N" },
                    { id: "east", label: "Right end is N" },
                  ]}
                  value={northLabel ?? ("" as End)}
                  onChange={(v) => setNorthLabel(v)}
                />
              </div>
              {northLabel && (
                <div className={`mt-2 text-xs ${!on ? "text-white/50" : northLabel === coilNorth ? "text-lime-300" : "text-amber-200"}`}>
                  {!on
                    ? "Switch on first. With no current the coil is not a magnet."
                    : northLabel === coilNorth
                      ? "Yes! The needle's north end points away from the coil's north end."
                      : "Not quite. Put a compass right next to that end: does the red tip point away from it or towards it?"}
                </div>
              )}
            </div>
          )}
          <p className="text-center text-xs text-white/40">
            Drag a compass, or tap the table to move the chosen one. The red tip of a needle is its north end. Switch off soon: a cell runs down fast like this.
          </p>
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Voltmeter" value={`${result.volts.toFixed(2)} V`} />
            <Stat label="Current" value={fmtAmps(result.current)} />
            <Stat label={activeLoad === "none" ? "Load" : "Result"} value={loadStatus} warn={activeLoad !== "none" && !result.works} />
          </div>
          <Choice options={(Object.keys(FRUITS) as FruitId[]).map((id) => ({ id, label: FRUITS[id].label }))} value={fruit} onChange={setFruit} />
          <Choice options={(Object.keys(PAIRS) as PairId[]).map((id) => ({ id, label: PAIRS[id].label }))} value={pair} onChange={setPair} />
          <Slider label="Fruit cells in series" value={cells} shown={`${cells} (${battery.emf.toFixed(2)} V)`} min={1} max={MAX_CELLS} onChange={setCells} />
          {!gadget && (
            <Choice
              options={[
                { id: "none", label: "Nothing" },
                { id: "led", label: "LED" },
                { id: "clock", label: "Clock" },
                { id: "calc", label: "Calculator" },
              ]}
              value={load}
              onChange={setLoad}
            />
          )}
          {activeLoad === "led" && (
            <button onClick={() => setLedFlipped(!ledFlipped)} className="rounded-xl border border-cyan-300/60 px-3 py-2.5 text-sm text-cyan-200">
              ⇄ Flip the LED ({ledFlipped ? "long leg to −" : "long leg to +"})
            </button>
          )}
          <p className="text-center text-xs text-white/40">
            Copper is the + strip. {activeLoad === "led" ? `The LED needs about ${LED.vf} V, with its longer leg on the + side.` : activeLoad === "none" ? "The voltmeter barely draws any current." : `The ${GADGETS[activeLoad].label.toLowerCase()} needs ${GADGETS[activeLoad].needV} V.`}{" "}
            Values are typical: real fruits vary.
          </p>
          {!gadget && (
            <div className="grid gap-2 text-xs text-white/60 sm:grid-cols-3">
              <Use icon="🔋" title="Dry cell">A zinc can (−) around a carbon rod (+), packed with a damp paste. About 1.5 V.</Use>
              <Use icon="🔁" title="Rechargeable">Phone and laptop batteries can be charged again hundreds of times.</Use>
              <Use icon="♻️" title="E-waste">Never burn or bin used cells. Drop them at an e-waste collection point.</Use>
            </div>
          )}
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

function Slider(props: { label: string; value: number; shown: string; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
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
        step={1}
        value={props.value}
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

// ---------------------------------------------------------------- compass table

type Live = {
  setup: Setup;
  on: boolean;
  polarity: 1 | -1;
  compasses: Compass[];
  selected: number;
  northLabel: End | null;
  fruit: FruitId;
  pair: PairId;
  cells: number;
  activeLoad: LoadId;
  ledFlipped: boolean;
  result: { volts: number; current: number; works: boolean; glow: number };
};

function drawBattery(ctx: CanvasRenderingContext2D, x: number, y: number, leftPlus: boolean) {
  // A 1.5 V cell lying on its side, centred at (x, y).
  ctx.fillStyle = "#334155";
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x - 20, y - 8, 40, 16, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(leftPlus ? x - 23 : x + 20, y - 4, 3, 8);
  ctx.font = "bold 11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#fda4af";
  ctx.fillText("+", leftPlus ? x - 13 : x + 13, y + 4);
  ctx.fillStyle = "#93c5fd";
  ctx.fillText("−", leftPlus ? x + 13 : x - 13, y + 4);
  ctx.font = "11px system-ui, sans-serif";
}

function drawCompass(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, th: number, chosen: boolean) {
  ctx.fillStyle = "#111827";
  ctx.strokeStyle = chosen ? "#67e8f9" : "rgba(255,255,255,0.55)";
  ctx.lineWidth = chosen ? 2 : 1.2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Tick marks for N, E, S, W.
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.sin(a) * r * 0.78, y - Math.cos(a) * r * 0.78);
    ctx.lineTo(x + Math.sin(a) * r * 0.95, y - Math.cos(a) * r * 0.95);
    ctx.stroke();
  }
  // The needle: red north half, white south half. th is measured from north towards east.
  const len = r * 0.8;
  const ux = Math.sin(th);
  const uy = -Math.cos(th);
  const px = -uy * r * 0.18;
  const py = ux * r * 0.18;
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.moveTo(x + ux * len, y + uy * len);
  ctx.lineTo(x + px, y + py);
  ctx.lineTo(x - px, y - py);
  ctx.fill();
  ctx.fillStyle = "#e5e7eb";
  ctx.beginPath();
  ctx.moveTo(x - ux * len, y - uy * len);
  ctx.lineTo(x + px, y + py);
  ctx.lineTo(x - px, y - py);
  ctx.fill();
  ctx.fillStyle = "#0a0d1c";
  ctx.beginPath();
  ctx.arc(x, y, 1.6, 0, Math.PI * 2);
  ctx.fill();
}

/** Dots that move along a line from (x1, y1) to (x2, y2) to show the current. */
function currentDots(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, phase: number, gap = 16) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1) return;
  ctx.fillStyle = "rgba(253,224,71,0.95)";
  const off = (phase * 40) % gap;
  for (let s = off; s < len; s += gap) {
    ctx.beginPath();
    ctx.arc(x1 + ((x2 - x1) * s) / len, y1 + ((y2 - y1) * s) / len, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCompassTable(ctx: CanvasRenderingContext2D, w: number, h: number, L: Live, needles: number[], phase: number) {
  const { k, cx, cy } = frame(w, h);
  const P = (p: Compass) => ({ x: cx + p.x * k, y: cy - p.y * k });
  ctx.font = "11px system-ui, sans-serif";

  // A faint table grid, 2 cm squares.
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  const g = 0.02 * k;
  for (let x = cx % g; x < w; x += g) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = cy % g; y < h; y += g) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // North arrow.
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(16, 40);
  ctx.lineTo(16, 18);
  ctx.moveTo(11, 24);
  ctx.lineTo(16, 17);
  ctx.lineTo(21, 24);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillText("N", 16, 13);

  const live = L.on;
  const wireCol = live ? "#fb923c" : "#b45309";
  const leadCol = live ? "rgba(253,224,71,0.6)" : "rgba(255,255,255,0.3)";
  // Current flows north in the wire (or round the coil's top southwards) when polarity is +1.
  const dir = L.polarity;

  if (L.setup === "wire") {
    const bx = w - 40;
    const by = h - 16;
    // Leads to the cell, round the right-hand edge, far from the compasses.
    ctx.strokeStyle = leadCol;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, 6);
    ctx.lineTo(w - 6, 6);
    ctx.lineTo(w - 6, by);
    ctx.lineTo(bx + 23, by);
    ctx.moveTo(cx, h - 4);
    ctx.lineTo(bx - 30, h - 4);
    ctx.lineTo(bx - 30, by);
    ctx.lineTo(bx - 23, by);
    ctx.stroke();
    // Switch on the top lead.
    const sx = cx + (w - cx) * 0.55;
    ctx.fillStyle = "#0a0d1c";
    ctx.fillRect(sx - 2, 2, 24, 8);
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, 6);
    ctx.lineTo(live ? sx + 20 : sx + 17, live ? 6 : 18);
    ctx.stroke();
    // The wire's shadow shows it is held above the table.
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx + 6, 6);
    ctx.lineTo(cx + 6, h - 4);
    ctx.stroke();
    ctx.strokeStyle = wireCol;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, 6);
    ctx.lineTo(cx, h - 4);
    ctx.stroke();
    drawBattery(ctx, bx, by, dir > 0);
    if (live) {
      if (dir > 0) currentDots(ctx, cx, h - 4, cx, 6, phase);
      else currentDots(ctx, cx, 6, cx, h - 4, phase);
      ctx.fillStyle = "#fde047";
      ctx.textAlign = "left";
      ctx.fillText(dir > 0 ? "current ↑ (to north)" : "current ↓ (to south)", cx + 10, 26);
    }
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.textAlign = "left";
    ctx.fillText("wire 1 cm above", cx + 10, h - 10);
  } else {
    const hl = (COIL.length / 2) * k;
    const rp = COIL.radius * k;
    const by = h - 14;
    const lx = cx - hl;
    const rx = cx + hl;
    ctx.strokeStyle = leadCol;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(lx, cy + rp);
    ctx.lineTo(lx, by);
    ctx.lineTo(cx - 23, by);
    ctx.moveTo(rx, cy + rp);
    ctx.lineTo(rx, by);
    ctx.lineTo(cx + 23, by);
    ctx.stroke();
    // A cardboard tube with the wire wound on it.
    ctx.fillStyle = "rgba(180,140,90,0.22)";
    ctx.beginPath();
    ctx.roundRect(lx, cy - rp, hl * 2, rp * 2, 4);
    ctx.fill();
    const turns = 14;
    ctx.strokeStyle = wireCol;
    ctx.lineWidth = 2;
    for (let i = 0; i < turns; i++) {
      const x = lx + 3 + ((hl * 2 - 10) * i) / (turns - 1);
      ctx.beginPath();
      ctx.moveTo(x, cy - rp);
      ctx.lineTo(x + 4, cy + rp);
      ctx.stroke();
      // Current over the top of each turn runs south when the east end is north.
      if (live && i % 2 === 0) {
        if (dir > 0) currentDots(ctx, x, cy - rp, x + 4, cy + rp, phase, 10);
        else currentDots(ctx, x + 4, cy + rp, x, cy - rp, phase, 10);
      }
    }
    drawBattery(ctx, cx, by, dir > 0);
    // End labels: the student's guess, or question marks.
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    const lab = (x: number, end: End) => {
      const t = L.northLabel === null ? "?" : L.northLabel === end ? "N" : "S";
      ctx.fillStyle = t === "N" ? "#f87171" : t === "S" ? "#93c5fd" : "rgba(255,255,255,0.6)";
      ctx.fillText(t, x, cy - rp - 6);
    };
    lab(lx, "west");
    lab(rx, "east");
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(`${COIL.turns} turns`, cx, cy + rp + 13);
  }

  // Compasses.
  const r = Math.max(14, COMPASS_R * k);
  L.compasses.forEach((c, i) => {
    const p = P(c);
    drawCompass(ctx, p.x, p.y, r, needles[i] ?? 0, i === L.selected);
  });
  // The straight wire is held above the compasses, so draw it again on top, see-through.
  if (L.setup === "wire") {
    ctx.strokeStyle = L.on ? "rgba(251,146,60,0.55)" : "rgba(180,83,9,0.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, 6);
    ctx.lineTo(cx, h - 4);
    ctx.stroke();
    if (L.on) {
      if (L.polarity > 0) currentDots(ctx, cx, h - 4, cx, 6, phase);
      else currentDots(ctx, cx, 6, cx, h - 4, phase);
    }
  }
  if (!L.on) {
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.textAlign = "right";
    ctx.fillText("Switch off: needles point north", w - 8, 26);
  }
}

// ---------------------------------------------------------------- fruit bench

function drawFruitBench(ctx: CanvasRenderingContext2D, w: number, h: number, L: Live, phase: number) {
  const n = L.cells;
  const look = FRUIT_LOOK[L.fruit];
  const pr = PAIRS[L.pair];
  ctx.font = "11px system-ui, sans-serif";
  const sc = Math.min(1.25, Math.max(0.8, w / 400));
  const fw = Math.min(64 * sc, (w - 40) / n - 8);
  const fh = 46 * sc;
  const gap = Math.min(22, (w - 40 - n * fw) / Math.max(1, n));
  const total = n * fw + (n - 1) * gap;
  const x0 = (w - total) / 2;
  const fy = h - fh / 2 - 22;
  const stripTop = fy - fh / 2 - 14;
  const live = L.result.current > 0;
  const wireCol = live ? "rgba(253,224,71,0.8)" : "rgba(255,255,255,0.5)";

  // Fruits with their two strips: the negative metal on the left, copper (+) on the right.
  const negX: number[] = [];
  const posX: number[] = [];
  for (let i = 0; i < n; i++) {
    const cxF = x0 + i * (fw + gap) + fw / 2;
    ctx.fillStyle = look.fill;
    ctx.strokeStyle = look.edge;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (L.fruit === "potato") ctx.ellipse(cxF, fy, fw / 2, fh / 2.3, 0.08, 0, Math.PI * 2);
    else ctx.ellipse(cxF, fy, fw / 2, fh / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (L.fruit === "lemon") {
      ctx.beginPath();
      ctx.ellipse(cxF + fw / 2, fy, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (L.fruit === "tomato" || L.fruit === "orange") {
      ctx.fillStyle = "#16a34a";
      ctx.beginPath();
      ctx.ellipse(cxF, fy - fh / 2 + 2, 7, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const nx = cxF - fw * 0.22;
    const px = cxF + fw * 0.22;
    negX.push(nx);
    posX.push(px);
    ctx.fillStyle = METAL_COL[pr.neg];
    ctx.fillRect(nx - 3, stripTop, 6, fy - stripTop + 4);
    ctx.fillStyle = METAL_COL[pr.pos];
    ctx.fillRect(px - 3, stripTop, 6, fy - stripTop + 4);
    if (i === 0 || n <= 3) {
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.textAlign = "center";
      ctx.font = "9px system-ui, sans-serif";
      ctx.fillText(pr.neg === "zinc" ? "Zn" : pr.neg === "iron" ? "Fe" : "Cu", nx, fy + fh / 2 + 12);
      ctx.fillText("Cu", px, fy + fh / 2 + 12);
      ctx.font = "11px system-ui, sans-serif";
    }
  }

  // Links: copper of one fruit to the negative strip of the next.
  ctx.strokeStyle = wireCol;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < n - 1; i++) {
    ctx.beginPath();
    ctx.moveTo(posX[i], stripTop);
    ctx.quadraticCurveTo((posX[i] + negX[i + 1]) / 2, stripTop - 18, negX[i + 1], stripTop);
    ctx.stroke();
  }

  // Battery ends: − at the first fruit, + at the last. Two rails: + on top, − below,
  // with the voltmeter and the load standing between them.
  const minusX = negX[0];
  const plusX = posX[n - 1];
  const rTop = 30;
  const rBot = Math.max(rTop + 70, stripTop - 30);
  const vmX = Math.round(w * 0.27);
  const ldX = Math.round(w * (w < 500 ? 0.6 : 0.7));
  const xR = w - 14;
  const hasLoad = L.activeLoad !== "none";
  const midY = (rTop + rBot) / 2;

  ctx.lineWidth = 1.5;
  // − rail.
  ctx.strokeStyle = "rgba(147,197,253,0.8)";
  ctx.beginPath();
  ctx.moveTo(minusX, stripTop);
  ctx.lineTo(minusX, rBot);
  ctx.moveTo(Math.min(vmX, minusX), rBot);
  ctx.lineTo(hasLoad ? ldX : Math.max(vmX, minusX), rBot);
  ctx.stroke();
  // + rail, brought round the right-hand side so it crosses nothing.
  ctx.strokeStyle = "rgba(252,165,165,0.8)";
  ctx.beginPath();
  ctx.moveTo(plusX, stripTop);
  ctx.lineTo(plusX, stripTop - 8);
  ctx.lineTo(xR, stripTop - 8);
  ctx.lineTo(xR, rTop);
  ctx.lineTo(vmX, rTop);
  ctx.stroke();
  ctx.font = "bold 11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#fda4af";
  ctx.fillText("+", xR, rTop - 6);
  ctx.fillStyle = "#93c5fd";
  ctx.fillText("−", minusX - 9, rBot - 4);
  ctx.font = "11px system-ui, sans-serif";

  // Voltmeter between the rails.
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.beginPath();
  ctx.moveTo(vmX, rTop);
  ctx.lineTo(vmX, rBot);
  ctx.stroke();
  ctx.fillStyle = "#1e293b";
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(vmX - 36, midY - 17, 72, 34, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#a7f3d0";
  ctx.font = "bold 15px ui-monospace, monospace";
  ctx.fillText(`${L.result.volts.toFixed(2)} V`, vmX, midY + 5);
  ctx.font = "10px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("voltmeter", vmX, midY + 29);
  ctx.font = "11px system-ui, sans-serif";

  if (L.activeLoad !== "none") {
    ctx.strokeStyle = wireCol;
    ctx.lineWidth = 1.5;
    if (L.activeLoad === "led") {
      // The LED stands between the rails. The longer leg is its + side.
      const top = midY - 14;
      const bot = midY + 12;
      ctx.beginPath();
      ctx.moveTo(ldX, rTop);
      ctx.lineTo(ldX, top - 4);
      ctx.moveTo(ldX, bot + 4);
      ctx.lineTo(ldX, rBot);
      ctx.stroke();
      const glow = L.result.glow;
      if (glow > 0) {
        ctx.shadowColor = "#f87171";
        ctx.shadowBlur = 10 + glow * 26;
      }
      ctx.fillStyle = glow > 0 ? `rgba(248,113,113,${0.6 + 0.4 * glow})` : "rgba(127,29,29,0.8)";
      ctx.beginPath();
      ctx.roundRect(ldX - 9, top, 18, bot - top, [9, 9, 2, 2]);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(L.ledFlipped ? "long leg ↓ to −" : "long leg ↑ to +", ldX + 14, L.ledFlipped ? bot + 2 : top + 8);
      ctx.fillStyle = glow > 0 ? "#fca5a5" : "rgba(255,255,255,0.5)";
      ctx.fillText(glow > 0 ? "LED on" : "LED off", ldX + 14, midY + (L.ledFlipped ? -6 : 14));
    } else {
      const gd = GADGETS[L.activeLoad];
      ctx.beginPath();
      ctx.moveTo(ldX, rTop);
      ctx.lineTo(ldX, rBot);
      ctx.stroke();
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(ldX - 34, midY - 17, 68, 34, 6);
      ctx.fill();
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.font = "bold 14px ui-monospace, monospace";
      ctx.fillStyle = L.result.works ? "#a7f3d0" : "rgba(255,255,255,0.18)";
      if (L.activeLoad === "clock") {
        const s = Math.floor(phase) % 60;
        ctx.fillText(L.result.works ? `10:${String(s).padStart(2, "0")}` : "--:--", ldX, midY + 5);
      } else ctx.fillText(L.result.works ? "3.1416" : "", ldX, midY + 5);
      ctx.font = "10px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText(`${gd.label.toLowerCase()}, needs ${gd.needV} V`, ldX, midY + 29);
      ctx.font = "11px system-ui, sans-serif";
    }
    if (live) currentDots(ctx, xR, rTop, ldX, rTop, phase, 14);
  }
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.textAlign = "center";
  ctx.fillText(`${n} ${FRUITS[L.fruit].label.toLowerCase()}${n > 1 ? (L.fruit === "potato" || L.fruit === "tomato" ? "es" : "s") : ""} in series`, w / 2, 16);
}
