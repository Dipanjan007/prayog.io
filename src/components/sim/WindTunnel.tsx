"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { FluidSim, MAX_LATTICE_SPEED } from "@/lib/sim/lbm";
import { SHAPES, measuredPart, rasterise, type ShapeId } from "@/lib/sim/shapes";

export type ViewMode = "pressure" | "speed" | "smoke";

export interface TunnelReading {
  shape: ShapeId;
  angle: number;
  speedKmh: number;
  view: ViewMode;
  /** Drag and lift in friendly units (0 to ~300). Lift is positive upwards. */
  drag: number;
  lift: number;
  /** True once the air has had time to settle after the last change. */
  settled: boolean;
  /** True if the student has painted at least a few cells. */
  painted: boolean;
}

interface Props {
  initialShape?: ShapeId;
  initialSpeed?: number;
  initialView?: ViewMode;
  initialAngle?: number;
  /** Limit which shapes can be picked. */
  shapes?: ShapeId[];
  onReading?: (r: TunnelReading) => void;
}

const MAX_KMH = 150;
const SETTLE_STEPS = 3000;

const kmhToLattice = (kmh: number) => (kmh / MAX_KMH) * MAX_LATTICE_SPEED;

/** Wind names, using IMD cyclone categories above 62 km/h. */
function windLabel(kmh: number) {
  if (kmh < 1) return "Still air";
  if (kmh < 20) return "Light breeze";
  if (kmh < 40) return "Strong breeze";
  if (kmh < 62) return "Gale";
  if (kmh < 89) return "Cyclonic storm";
  if (kmh < 118) return "Severe cyclonic storm";
  return "Very severe cyclone";
}

/** Diverging map: blue (low pressure) → warm dark → orange (high pressure). */
function pressureColour(v: number, out: Uint8ClampedArray, o: number) {
  const t = Math.max(-1, Math.min(1, v));
  if (t >= 0) {
    out[o] = 20 + t * 215;
    out[o + 1] = 18 + t * 107;
    out[o + 2] = 16 + t * 44;
  } else {
    const a = -t;
    out[o] = 20 + a * 60;
    out[o + 1] = 18 + a * 152;
    out[o + 2] = 16 + a * 199;
  }
}

/** Sequential map for air speed: still air is dark, fast air glows pale blue. */
const SPEED_STOPS: [number, number, number, number][] = [
  [0, 20, 18, 16],
  [0.3, 56, 48, 78],
  [0.55, 58, 102, 140],
  [0.8, 110, 192, 214],
  [1, 245, 240, 228],
];
function speedColour(v: number, out: Uint8ClampedArray, o: number) {
  const t = Math.max(0, Math.min(1, v));
  let i = 1;
  while (i < SPEED_STOPS.length - 1 && t > SPEED_STOPS[i][0]) i++;
  const [t0, r0, g0, b0] = SPEED_STOPS[i - 1];
  const [t1, r1, g1, b1] = SPEED_STOPS[i];
  const a = (t - t0) / (t1 - t0);
  out[o] = r0 + (r1 - r0) * a;
  out[o + 1] = g0 + (g1 - g0) * a;
  out[o + 2] = b0 + (b1 - b0) * a;
}

/** Draws the obstacle at a finer resolution than the air grid, so edges look smooth. */
const SHAPE_DETAIL = 4;

export default function WindTunnel({
  initialShape = "square",
  initialSpeed = 60,
  initialView = "pressure",
  initialAngle = 0,
  shapes,
  onReading,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<HTMLCanvasElement>(null);
  const uiRef = useRef<HTMLCanvasElement>(null);

  const [shape, setShape] = useState<ShapeId>(initialShape);
  const [angle, setAngle] = useState(initialAngle);
  const [speed, setSpeed] = useState(initialSpeed);
  const [view, setView] = useState<ViewMode>(initialView);
  const [running, setRunning] = useState(true);
  const [erase, setErase] = useState(false);
  const [readout, setReadout] = useState({ drag: 0, lift: 0, settled: false });

  const [hasPainting, setHasPainting] = useState(false);
  const [aspect, setAspect] = useState("12 / 5");

  // Mutable simulation state lives in refs so the animation loop never re-renders React.
  const simRef = useRef<FluidSim | null>(null);
  const paintedRef = useRef<Uint8Array | null>(null);
  const paintedCountRef = useRef(0);
  const shapeImageRef = useRef<HTMLCanvasElement | null>(null);
  const lastChangeRef = useRef(0);
  const stateRef = useRef({ shape, angle, speed, view, running, erase });
  const onReadingRef = useRef(onReading);
  useLayoutEffect(() => {
    stateRef.current = { shape, angle, speed, view, running, erase };
    onReadingRef.current = onReading;
  });

  /** Create the simulation on first use, sized for the device. */
  const getSim = useCallback(() => {
    if (!simRef.current) {
      const small = window.innerWidth < 700 || (navigator.hardwareConcurrency ?? 4) < 4;
      // Phones get a smaller, taller grid: cheaper to run and easier to see.
      const nx = small ? 150 : 240;
      const ny = small ? 75 : 100;
      simRef.current = new FluidSim(nx, ny, kmhToLattice(initialSpeed));
      paintedRef.current = new Uint8Array(nx * ny);
    }
    return simRef.current;
  }, [initialSpeed]);

  const applyShape = useCallback(() => {
    const sim = getSim();
    const p = { shape: stateRef.current.shape, angle: stateRef.current.angle };
    const mask = rasterise(sim.nx, sim.ny, p, paintedRef.current ?? undefined);
    sim.setSolid(mask, measuredPart(sim.nx, sim.ny, p, mask));
    lastChangeRef.current = sim.steps;
    sim.restartAverage();

    // A sharper copy of the shape for drawing.
    const d = p.shape === "custom" ? 1 : SHAPE_DETAIL;
    const w = sim.nx * d;
    const h = sim.ny * d;
    const fine = d === 1 ? mask : rasterise(w, h, p);
    const canvas = shapeImageRef.current ?? document.createElement("canvas");
    shapeImageRef.current = canvas;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    const img = ctx.createImageData(w, h);
    for (let k = 0; k < w * h; k++) {
      if (!fine[k]) continue;
      img.data[k * 4] = 238;
      img.data[k * 4 + 1] = 242;
      img.data[k * 4 + 2] = 255;
      img.data[k * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [getSim]);

  useEffect(() => {
    stateRef.current = { ...stateRef.current, shape, angle };
    applyShape();
  }, [shape, angle, applyShape]);

  useEffect(() => {
    const sim = getSim();
    sim.inflow = kmhToLattice(speed);
    lastChangeRef.current = sim.steps;
    sim.restartAverage();
  }, [speed, getSim]);

  useEffect(() => {
    if (view === "smoke") {
      const ctx = trailRef.current?.getContext("2d");
      ctx?.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
  }, [view]);

  // Animation loop.
  useEffect(() => {
    const sim = getSim();
    const field = fieldRef.current!;
    const trail = trailRef.current!;
    const ui = uiRef.current!;
    const wrap = wrapRef.current!;
    const fctx = field.getContext("2d")!;
    const tctx = trail.getContext("2d")!;
    const uctx = ui.getContext("2d")!;
    field.width = sim.nx;
    field.height = sim.ny;
    setAspect(`${sim.nx} / ${sim.ny}`);
    const image = fctx.createImageData(sim.nx, sim.ny);
    const colRef = new Float32Array(sim.nx);

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      width = wrap.clientWidth;
      height = (width * sim.ny) / sim.nx;
      for (const c of [trail, ui]) {
        c.width = Math.round(width * dpr);
        c.height = Math.round(height * dpr);
      }
      tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      uctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // Tracer particles, in grid coordinates.
    const count = sim.nx > 200 ? 1400 : 700;
    const px = new Float32Array(count);
    const py = new Float32Array(count);
    const age = new Float32Array(count);
    const spawn = (i: number, anywhere: boolean) => {
      px[i] = anywhere ? Math.random() * sim.nx : Math.random() * 2;
      py[i] = Math.random() * sim.ny;
      age[i] = Math.random() * 200;
    };
    for (let i = 0; i < count; i++) spawn(i, true);

    let stepsPerFrame = 3;
    let raf = 0;
    let lastReport = 0;
    const scale = 100 / sim.ny; // makes forces independent of grid size

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const st = stateRef.current;

      if (st.running) {
        const t0 = performance.now();
        sim.step(stepsPerFrame);
        const spent = performance.now() - t0;
        // Keep the frame smooth on slow phones and use spare time on fast laptops.
        if (spent > 12 && stepsPerFrame > 1) stepsPerFrame--;
        else if (spent < 6 && stepsPerFrame < 8) stepsPerFrame++;
        if (sim.isUnstable()) {
          sim.reset();
          lastChangeRef.current = 0;
        }
      }

      // Field colours.
      const data = image.data;
      const u0 = Math.max(sim.inflow, 0.01);
      const pScale = 1 / (1.5 * u0 * u0);
      // With a ground, the floor's friction makes pressure fall steadily from the inlet to the outlet.
      // Colour against that straight-line fall, so the colours show the shape's own effect.
      const grounded = SHAPES.find((s) => s.id === st.shape)?.grounded ?? false;
      if (grounded && st.view === "pressure") {
        for (let x = 0; x < sim.nx; x++) colRef[x] = sim.rhoRef + ((1 - sim.rhoRef) * x) / (sim.nx - 1);
      }
      for (let k = 0; k < sim.n; k++) {
        const o = k * 4;
        data[o + 3] = 255;
        if (sim.solid[k]) {
          data[o] = 200;
          data[o + 1] = 206;
          data[o + 2] = 230;
          continue;
        }
        if (st.view === "pressure") pressureColour((sim.rho[k] - (grounded ? colRef[k % sim.nx] : sim.rhoRef)) * pScale, data, o);
        else if (st.view === "speed") {
          const s = Math.hypot(sim.ux[k], sim.uy[k]);
          speedColour(s / (1.8 * u0), data, o);
        } else {
          data[o] = 8;
          data[o + 1] = 10;
          data[o + 2] = 22;
        }
      }
      fctx.putImageData(image, 0, 0);

      // Smoke trails.
      const sx = width / sim.nx;
      const sy = height / sim.ny;
      tctx.globalCompositeOperation = "destination-out";
      tctx.fillStyle = st.view === "smoke" ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.18)";
      tctx.fillRect(0, 0, width, height);
      tctx.globalCompositeOperation = "source-over";
      tctx.lineWidth = st.view === "smoke" ? 1.4 : 1;
      tctx.strokeStyle = st.view === "smoke" ? "rgba(200,240,255,0.55)" : "rgba(240,233,221,0.35)";
      tctx.beginPath();
      const adv = st.running ? stepsPerFrame * 2.5 : 0;
      for (let i = 0; i < count; i++) {
        const xi = px[i] | 0;
        const yi = py[i] | 0;
        const k = yi * sim.nx + xi;
        if (xi < 0 || xi >= sim.nx - 1 || yi < 0 || yi >= sim.ny || sim.solid[k] || age[i] > 600) {
          spawn(i, false);
          continue;
        }
        const nxp = px[i] + sim.ux[k] * adv;
        let nyp = py[i] + sim.uy[k] * adv;
        if (nyp < 0) nyp += sim.ny;
        if (nyp >= sim.ny) nyp -= sim.ny;
        if (Math.abs(nyp - py[i]) < sim.ny / 2) {
          tctx.moveTo(px[i] * sx, py[i] * sy);
          tctx.lineTo(nxp * sx, nyp * sy);
        }
        px[i] = nxp;
        py[i] = nyp;
        age[i] += st.running ? 1 : 0;
      }
      tctx.stroke();

      // Crisp shape, then force arrows from its middle.
      uctx.clearRect(0, 0, width, height);
      if (shapeImageRef.current) {
        uctx.imageSmoothingEnabled = true;
        uctx.drawImage(shapeImageRef.current, 0, 0, width, height);
      }
      const drag = sim.avgForceX * 1000 * scale;
      const lift = -sim.avgForceY * 1000 * scale;
      const settled = sim.steps - lastChangeRef.current > SETTLE_STEPS;
      let cx = 0;
      let cy = 0;
      let cells = 0;
      for (let k = 0; k < sim.n; k++) {
        if (sim.measured[k]) {
          cx += k % sim.nx;
          cy += Math.floor(k / sim.nx);
          cells++;
        }
      }
      if (cells > 0 && st.speed > 0) {
        cx = (cx / cells) * sx;
        cy = (cy / cells) * sy;
        const len = (f: number) => Math.sign(f) * Math.min(Math.sqrt(Math.abs(f)) * 9, height * 0.45);
        arrow(uctx, cx, cy, cx + len(drag), cy, "#fb923c");
        arrow(uctx, cx, cy, cx, cy - len(lift), "#22d3ee");
      }

      if (now - lastReport > 250) {
        lastReport = now;
        const r = { drag: Math.round(drag), lift: Math.round(lift), settled };
        setReadout(r);
        onReadingRef.current?.({
          shape: st.shape,
          angle: st.angle,
          speedKmh: st.speed,
          view: st.view,
          painted: paintedCountRef.current > 20,
          ...r,
        });
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [getSim]);

  // Painting your own shape.
  const painting = useRef(false);
  const paintAt = (e: React.PointerEvent) => {
    const sim = simRef.current;
    const mask = paintedRef.current;
    if (!sim || !mask || stateRef.current.shape !== "custom") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const gx = ((e.clientX - rect.left) / rect.width) * sim.nx;
    const gy = ((e.clientY - rect.top) / rect.height) * sim.ny;
    const r = sim.ny / 30;
    const value = stateRef.current.erase ? 0 : 1;
    for (let y = Math.floor(gy - r); y <= gy + r; y++) {
      for (let x = Math.floor(gx - r); x <= gx + r; x++) {
        if (x < 4 || x >= sim.nx - 2 || y < 0 || y >= sim.ny) continue;
        if ((x - gx) ** 2 + (y - gy) ** 2 > r * r) continue;
        const k = y * sim.nx + x;
        if (mask[k] !== value) {
          mask[k] = value;
          paintedCountRef.current += value ? 1 : -1;
        }
      }
    }
    setHasPainting(paintedCountRef.current > 20);
    applyShape();
  };

  const shapeList = SHAPES.filter((s) => !shapes || shapes.includes(s.id));
  const current = SHAPES.find((s) => s.id === shape)!;

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={wrapRef}
        className="relative w-full overflow-hidden rounded-2xl border border-line bg-well touch-none"
        style={{ aspectRatio: aspect }}
        onPointerDown={(e) => {
          if (shape !== "custom") return;
          painting.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          paintAt(e);
        }}
        onPointerMove={(e) => painting.current && paintAt(e)}
        onPointerUp={() => (painting.current = false)}
        onPointerCancel={() => (painting.current = false)}
      >
        <canvas ref={fieldRef} className="absolute inset-0 h-full w-full" aria-hidden />
        <canvas ref={trailRef} className="absolute inset-0 h-full w-full" aria-hidden />
        <canvas
          ref={uiRef}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={`Wind tunnel: ${current.label} in a ${speed} km/h wind. Drag ${readout.drag}, lift ${readout.lift}.`}
        />
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full bg-ink/40 px-3 py-1 text-xs font-medium backdrop-blur">
          <span className="text-cream/85">{speed} km/h</span>
          <span className="text-faint">{windLabel(speed)}</span>
          <span className="text-faint">→</span>
        </div>
        {shape === "custom" && !hasPainting && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted">
            Draw a shape with your finger or mouse
          </div>
        )}
        {view === "pressure" && (
          <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-ink/40 px-3 py-1 text-[11px] backdrop-blur">
            <span className="text-[#8cc6e6]">Low</span>
            <span className="h-2 w-16 rounded-full bg-gradient-to-r from-[#50aad7] via-[#141210] to-[#eb7d3c]" />
            <span className="text-[#f0a070]">High pressure</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Meter label="Drag" value={readout.drag} colour="#fb923c" hint="pushes it back" />
        <Meter
          label={readout.lift < 0 ? "Downforce" : "Lift"}
          value={readout.lift}
          colour="#22d3ee"
          hint={readout.lift < 0 ? "pushes it down" : "pushes it up"}
        />
        <div className="col-span-2 flex items-center gap-1 rounded-2xl panel p-1">
          {(["pressure", "speed", "smoke"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 rounded-xl px-2 py-2 text-sm capitalize transition ${
                view === v ? "bg-cream text-ink" : "text-muted hover:bg-cream/10"
              }`}
            >
              {v === "pressure" ? "Pressure" : v === "speed" ? "Air speed" : "Smoke"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {shapeList.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setShape(s.id);
              const [lo, hi] = s.angleRange ?? [-20, 25];
              setAngle((a) => Math.min(hi, Math.max(lo, a)));
            }}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              shape === s.id ? "chip-on text-saffron-100" : "border-line text-muted hover:border-line-strong"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Slider label="Wind speed" value={speed} min={0} max={MAX_KMH} step={5} unit=" km/h" onChange={setSpeed} />
        {current.rotates ? (
          <Slider
            label={current.angleLabel ?? "Tilt"}
            value={angle}
            min={(current.angleRange ?? [-20, 25])[0]}
            max={(current.angleRange ?? [-20, 25])[1]}
            step={1}
            unit="°"
            onChange={setAngle}
          />
        ) : shape === "custom" ? (
          <div className="flex items-end gap-2">
            <button onClick={() => setErase(false)} className={chip(!erase)}>Draw</button>
            <button onClick={() => setErase(true)} className={chip(erase)}>Erase</button>
            <button
              onClick={() => {
                paintedRef.current?.fill(0);
                paintedCountRef.current = 0;
                setHasPainting(false);
                applyShape();
              }}
              className={chip(false)}
            >
              Clear
            </button>
          </div>
        ) : (
          <div />
        )}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setRunning((r) => !r)} className={chip(false)}>
          {running ? "Pause" : "Play"}
        </button>
        <button
          onClick={() => {
            simRef.current?.reset();
            lastChangeRef.current = 0;
          }}
          className={chip(false)}
        >
          Restart air
        </button>
        <span className="ml-auto text-xs text-faint">
          {readout.settled ? "Readings steady" : "Air settling…"}
        </span>
      </div>
    </div>
  );
}

function chip(active: boolean) {
  return `rounded-full border px-3 py-1.5 text-sm transition ${
    active ? "border-cream bg-cream text-ink" : "border-line text-cream/85 hover:border-line-strong"
  }`;
}

function Meter({ label, value, colour, hint }: { label: string; value: number; colour: string; hint: string }) {
  const pct = Math.min(Math.abs(value) / 300, 1) * 100;
  return (
    <div className="rounded-2xl panel p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wider text-faint">{label}</span>
        <span className="font-display text-xl tabular-nums" style={{ color: colour }}>
          {value}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream/10">
        <div className="h-full rounded-full transition-[width]" style={{ width: `${pct}%`, background: colour }} />
      </div>
      <div className="mt-1 text-[11px] text-faint">{hint}</div>
    </div>
  );
}

function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block rounded-2xl panel px-4 py-3">
      <div className="flex justify-between text-sm">
        <span className="text-muted">{props.label}</span>
        <span className="tabular-nums text-cream">
          {props.value}
          {props.unit}
        </span>
      </div>
      <input
        type="range"
        className="range mt-2 w-full"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
    </label>
  );
}

function arrow(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, colour: string) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const l = Math.hypot(dx, dy);
  if (l < 4) return;
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.shadowColor = colour;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const ux = dx / l;
  const uy = dy / l;
  ctx.beginPath();
  ctx.moveTo(x1 + ux * 6, y1 + uy * 6);
  ctx.lineTo(x1 - uy * 6 - ux * 4, y1 + ux * 6 - uy * 4);
  ctx.lineTo(x1 + uy * 6 - ux * 4, y1 - ux * 6 - uy * 4);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
}
