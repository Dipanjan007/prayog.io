"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PlaneMirror, Vec } from "@/lib/sim/optics";
import {
  CANDLE_CM,
  LAMPS,
  LAMP_RANGE,
  MAZE_HALF,
  MAZE_LEVELS,
  MAZE_MIRROR_HALF,
  MIN_GAP,
  OBJECT_MATERIALS,
  PERISCOPE,
  PINHOLE,
  SCREEN_X,
  SHAPES,
  TARGET_R,
  TORCH_MIRROR,
  discSamples,
  halfHeight,
  mazeBeam,
  periscope,
  pinhole,
  screenBrightness,
  shadowEdges,
  torchBeam,
  type Bounce,
  type LampId,
  type MaterialId,
  type ShapeId,
  type Wall,
} from "@/lib/sim/shadows";

export type ShadowMode = "shadow" | "pinhole" | "mirror";
type MirrorView = "torch" | "periscope";

export type ShadowReading =
  | { mode: "shadow"; lamp: LampId; material: MaterialId; shape: ShapeId; k: number; hasUmbra: boolean; penumbraBand: number }
  | { mode: "pinhole"; imageH: number; candleH: number; sharp: boolean }
  | { mode: "mirror"; view: MirrorView; incidence: number; periscopeSolved: boolean }
  | { mode: "maze"; level: number; hit: boolean };

interface Props {
  onReading?: (r: ShadowReading) => void;
  /** Challenge: show laser level `level` (0, 1 or 2) instead of the free lab. */
  level?: number | null;
}

const MODE_LABEL: Record<ShadowMode, string> = { shadow: "Shadow stage", pinhole: "Pinhole camera", mirror: "Mirror" };
const WORDS = ["AMBULANCE", "PRAYOG", "CLASS 7"] as const;
/** The screen window drawn in the "On the wall" panel: 60 cm × 60 cm. */
const WALL_HALF = 30;

export default function ShadowLab({ onReading, level = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [mode, setMode] = useState<ShadowMode>("shadow");
  // Shadow stage.
  const [lampX, setLampX] = useState(20);
  const [objX, setObjX] = useState(60);
  const [lamp, setLamp] = useState<LampId>("small");
  const [material, setMaterial] = useState<MaterialId>("cardboard");
  const [shape, setShape] = useState<ShapeId>("card");
  // Pinhole camera.
  const [dist, setDist] = useState(60);
  const [box, setBox] = useState(20);
  const [hole, setHole] = useState(1);
  // Mirror.
  const [view, setView] = useState<MirrorView>("torch");
  const [incidence, setIncidence] = useState(40);
  const [word, setWord] = useState<(typeof WORDS)[number]>("AMBULANCE");
  const [top, setTop] = useState(90);
  const [bottom, setBottom] = useState(0);
  // Laser challenge.
  const lv = level !== null ? MAZE_LEVELS[level] : null;
  const [angles, setAngles] = useState<number[]>(() => (lv ? lv.mirrors.map((m) => m.start) : []));
  const [picked, setPicked] = useState(0);
  const dragging = useRef<null | "lamp" | "obj" | "torch" | "maze">(null);
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: ShadowMode | "maze" = lv ? "maze" : mode;

  // ----- Physics for whatever is on screen -----
  const h = halfHeight(shape);
  const edges = shadowEdges(lampX, LAMPS[lamp].radius, objX, h);
  const grid = useMemo(() => {
    // A point bulb needs one ray per spot on the wall; a wide lamp needs many, so it gets a coarser grid.
    const n = lamp === "small" ? 120 : 72;
    const samples = lamp === "small" ? [{ x: 0, y: 0 }] : discSamples(LAMPS.wide.radius, 120);
    const obj = { x: objX, points: SHAPES[shape].points, transmit: OBJECT_MATERIALS[material].transmit };
    const g = new Float32Array(n * n);
    for (let j = 0; j < n; j++) {
      const z = WALL_HALF - ((j + 0.5) / n) * 2 * WALL_HALF;
      for (let i = 0; i < n; i++) {
        const y = -WALL_HALF + ((i + 0.5) / n) * 2 * WALL_HALF;
        g[j * n + i] = screenBrightness(y, z, { x: lampX, samples }, obj);
      }
    }
    return { n, g };
  }, [lampX, objX, lamp, material, shape]);
  const cam = pinhole(dist, box, hole);
  const torch = torchBeam(incidence);
  const peri = periscope(top, bottom);
  const maze = lv ? mazeBeam(lv, angles) : null;

  const reading: ShadowReading =
    activeMode === "maze"
      ? { mode: "maze", level: level ?? 0, hit: !!maze?.hit }
      : activeMode === "shadow"
        ? {
            mode: "shadow",
            lamp,
            material,
            shape,
            k: Math.round(edges.k * 100) / 100,
            hasUmbra: edges.hasUmbra,
            penumbraBand: Math.round(edges.penumbraBand * 10) / 10,
          }
        : activeMode === "pinhole"
          ? { mode: "pinhole", imageH: Math.round(cam.imageH * 100) / 100, candleH: CANDLE_CM, sharp: cam.sharp }
          : { mode: "mirror", view, incidence, periscopeSolved: peri.solved };
  const readingKey = JSON.stringify(reading);
  useEffect(() => {
    onReadingRef.current?.(JSON.parse(readingKey) as ShadowReading);
  }, [readingKey]);

  useEffect(() => {
    const c = canvasRef.current!;
    const ro = new ResizeObserver(() => setSize({ w: c.clientWidth, h: c.clientHeight }));
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  // ----- Drawing -----
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !size.w) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(size.w * dpr);
    c.height = Math.round(size.h * dpr);
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);
    ctx.font = "11px system-ui, sans-serif";
    if (!offRef.current) offRef.current = document.createElement("canvas");
    const off = offRef.current;
    const { w, h: H } = size;
    if (activeMode === "shadow") drawShadow(ctx, off, w, H, { lampX, objX, lamp, material, shape, grid, edges });
    else if (activeMode === "pinhole") drawPinhole(ctx, off, w, H, dist, box, hole, cam);
    else if (activeMode === "mirror") {
      if (view === "torch") drawTorch(ctx, w, H, torch);
      else drawPeriscope(ctx, w, H, peri);
    } else if (lv && maze) drawMaze(ctx, w, H, lv, maze, picked);
  }, [size, activeMode, lampX, objX, lamp, material, shape, grid, edges, dist, box, hole, cam, view, torch, peri, lv, maze, picked]);

  // ----- Dragging on the canvas -----
  const toLocal = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toLocal(e);
    if (activeMode === "shadow") {
      const L = shadowLayout(size.w, size.h);
      if (p.x > L.sideRight + 4) return;
      const cm = L.toCm(p.x);
      dragging.current = Math.abs(cm - lampX) <= Math.abs(cm - objX) ? "lamp" : "obj";
    } else if (activeMode === "mirror" && view === "torch") dragging.current = "torch";
    else if (activeMode === "maze" && lv) {
      const M = mazeLayout(size.w, size.h);
      const q = M.toCm(p);
      let best = -1;
      let bestD = 12;
      lv.mirrors.forEach((m, k) => {
        const d = Math.hypot(m.c.x - q.x, m.c.y - q.y);
        if (d < bestD) {
          bestD = d;
          best = k;
        }
      });
      if (best >= 0) setPicked(best);
      dragging.current = "maze";
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    } else return;
    e.currentTarget.setPointerCapture(e.pointerId);
    onMove(e);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const what = dragging.current;
    if (!what) return;
    const p = toLocal(e);
    if (what === "lamp" || what === "obj") {
      const cm = Math.round(shadowLayout(size.w, size.h).toCm(p.x));
      if (what === "lamp") setLampX(Math.max(LAMP_RANGE.min, Math.min(objX - MIN_GAP, LAMP_RANGE.max, cm)));
      else setObjX(Math.max(lampX + MIN_GAP, Math.min(SCREEN_X - MIN_GAP, cm)));
    } else if (what === "torch") {
      const T = torchLayout(size.w, size.h);
      const x = (p.x - T.ox) / T.k;
      const y = (T.oy - p.y) / T.k;
      setIncidence(Math.round(Math.min(80, Math.max(0, (Math.atan2(Math.abs(x), Math.max(y, 0.01)) * 180) / Math.PI))));
    } else if (what === "maze" && lv) {
      const q = mazeLayout(size.w, size.h).toCm(p);
      const c = lv.mirrors[picked].c;
      if (Math.hypot(q.x - c.x, q.y - c.y) < 2) return;
      const t = Math.round((((Math.atan2(q.y - c.y, q.x - c.x) * 180) / Math.PI) % 180 + 180) % 180) % 180;
      setAngles((a) => a.map((v, k) => (k === picked ? t : v)));
    }
  };
  const onUp = () => (dragging.current = null);

  const ariaLabel =
    activeMode === "shadow"
      ? `Side view of a ${LAMPS[lamp].label.toLowerCase()} ${SCREEN_X - lampX} cm from the wall and a ${OBJECT_MATERIALS[material].label.toLowerCase()} ${SHAPES[shape].label.toLowerCase()} ${SCREEN_X - objX} cm from the wall. The shadow is ${edges.k.toFixed(1)} times as tall as the object${lamp === "wide" ? (edges.hasUmbra ? ", with a dark umbra and a lighter penumbra" : ", with only a penumbra") : ""}.`
      : activeMode === "pinhole"
        ? `Pinhole camera: a candle ${dist} cm from the hole makes an upside-down image ${cam.imageH.toFixed(1)} cm tall on a screen ${box} cm behind the hole. The image is ${cam.clarity}.`
        : activeMode === "mirror"
          ? view === "torch"
            ? `A torch beam hits a plane mirror at an angle of incidence of ${incidence} degrees and reflects at ${torch.r.toFixed(0)} degrees.`
            : `A periscope with mirrors tilted ${top} and ${bottom} degrees. ${peri.solved ? "Light from the match reaches the eye." : "The light does not reach the eye yet."}`
          : `Laser level ${(level ?? 0) + 1}: ${maze?.hit ? "the beam hits the target" : "the beam misses the target"}.`;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!lv && (
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(Object.keys(MODE_LABEL) as ShadowMode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${mode === m ? "bg-white/10 text-white" : "text-white/45"}`}>
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>
      )}
      {activeMode === "mirror" && (
        <Choice
          options={[
            { id: "torch", label: "Torch and mirror" },
            { id: "periscope", label: "Periscope puzzle" },
          ]}
          value={view}
          onChange={setView}
        />
      )}

      <canvas
        ref={canvasRef}
        className="h-64 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80"
        style={{ touchAction: activeMode === "pinhole" || (activeMode === "mirror" && view === "periscope") ? "auto" : "pan-y" }}
        role="img"
        aria-label={ariaLabel}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />

      {activeMode === "shadow" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Shadow ÷ object" value={`${edges.k.toFixed(1)} ×`} />
            <Readout label="Full shadow" value={edges.hasUmbra && material !== "glass" ? "Yes" : material === "glass" ? "Hardly any" : "No"} />
            <Readout label="Light through" value={`${Math.round(OBJECT_MATERIALS[material].transmit * 100)}%`} />
          </div>
          <p className="text-center text-xs text-white/45">Drag the lamp or the object along the bench.</p>
          <Slider label="Lamp distance from the wall" value={SCREEN_X - lampX} min={SCREEN_X - Math.min(objX - MIN_GAP, LAMP_RANGE.max)} max={SCREEN_X - LAMP_RANGE.min} step={1} unit=" cm" onChange={(v) => setLampX(SCREEN_X - v)} />
          <Slider label="Object distance from the wall" value={SCREEN_X - objX} min={MIN_GAP} max={SCREEN_X - lampX - MIN_GAP} step={1} unit=" cm" onChange={(v) => setObjX(SCREEN_X - v)} />
          <Choice options={(Object.keys(LAMPS) as LampId[]).map((id) => ({ id, label: LAMPS[id].label }))} value={lamp} onChange={setLamp} />
          <Choice
            options={(Object.keys(OBJECT_MATERIALS) as MaterialId[]).map((id) => ({ id, label: OBJECT_MATERIALS[id].label }))}
            value={material}
            onChange={setMaterial}
          />
          <Choice options={(Object.keys(SHAPES) as ShapeId[]).map((id) => ({ id, label: SHAPES[id].label }))} value={shape} onChange={setShape} />
          <p className="text-center text-xs text-white/45">
            {OBJECT_MATERIALS[material].label} is {OBJECT_MATERIALS[material].kind.toLowerCase()}.{" "}
            {material === "glass"
              ? "Almost all light passes through it."
              : material === "butter"
                ? "Some light passes through, so its shadow is pale."
                : "No light passes through, so its shadow is dark."}
          </p>
        </>
      )}

      {activeMode === "pinhole" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Image height" value={`${cam.imageH.toFixed(1)} cm`} />
            <Readout label="Candle height" value={`${CANDLE_CM} cm`} />
            <Readout label="Image is" value={cam.clarity === "slightly blurred" ? "A bit blurred" : cam.clarity === "sharp" ? "Sharp" : "Blurred"} />
          </div>
          <Slider label="Candle distance from the hole" value={dist} min={PINHOLE.distance.min} max={PINHOLE.distance.max} step={1} unit=" cm" onChange={setDist} />
          <Slider label="Hole to screen (box length)" value={box} min={PINHOLE.box.min} max={PINHOLE.box.max} step={1} unit=" cm" onChange={setBox} />
          <Slider label="Size of the hole" value={hole} min={PINHOLE.holeMm.min} max={PINHOLE.holeMm.max} step={0.5} unit=" mm" onChange={setHole} />
        </>
      )}

      {activeMode === "mirror" && view === "torch" && (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Readout label="Angle of incidence ∠i" value={`${incidence}°`} />
            <Readout label="Angle of reflection ∠r" value={`${torch.r.toFixed(0)}°`} />
          </div>
          <Slider label="Angle of incidence" value={incidence} min={0} max={80} step={1} unit="°" onChange={setIncidence} />
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs text-white/45">Hold a card up to a plane mirror</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-center">
              <div>
                <div className="rounded-lg bg-white/90 px-1 py-2 font-bold tracking-wide text-black">{word}</div>
                <div className="mt-1 text-[11px] text-white/45">Your card</div>
              </div>
              <div>
                <div className="rounded-lg border border-cyan-300/40 bg-cyan-300/10 px-1 py-2 font-bold tracking-wide text-cyan-100" style={{ transform: "scaleX(-1)" }}>
                  {word}
                </div>
                <div className="mt-1 text-[11px] text-white/45">Its image in the mirror</div>
              </div>
            </div>
            <div className="mt-2">
              <Choice options={WORDS.map((x) => ({ id: x, label: x }))} value={word} onChange={setWord} />
            </div>
            <p className="mt-2 text-xs text-white/45">
              Left and right swap in the image. This is lateral inversion. That is why AMBULANCE is painted the other way round on the front of an ambulance.
            </p>
          </div>
        </>
      )}

      {activeMode === "mirror" && view === "periscope" && (
        <>
          <p className={`rounded-2xl border px-3 py-2 text-center text-sm ${peri.solved ? "border-lime-300/40 bg-lime-300/10 text-lime-200" : "border-white/10 bg-white/[0.03] text-white/60"}`}>
            {peri.solved ? "You can see the match over the wall!" : "Tilt both mirrors so light from the match reaches your eye."}
          </p>
          <Angles bounces={peri.rays[1].bounces} names={["Top mirror", "Bottom mirror"]} />
          <Slider label="Top mirror tilt" value={top} min={0} max={175} step={5} unit="°" onChange={setTop} />
          <Slider label="Bottom mirror tilt" value={bottom} min={0} max={175} step={5} unit="°" onChange={setBottom} />
        </>
      )}

      {activeMode === "maze" && lv && (
        <>
          <div className={`rounded-2xl border px-3 py-2 text-center text-sm ${maze?.hit ? "border-lime-300/40 bg-lime-300/10 text-lime-200" : "border-white/10 bg-white/[0.03] text-white/60"}`} aria-live="polite">
            {maze?.hit ? "Target hit!" : `Level ${(level ?? 0) + 1}: ${lv.name}. Turn the mirrors to guide the laser to the target.`}
          </div>
          {lv.mirrors.length > 1 && (
            <Choice options={lv.mirrors.map((_, k) => ({ id: String(k), label: `Mirror ${k + 1}` }))} value={String(picked)} onChange={(v) => setPicked(Number(v))} />
          )}
          <div className="flex items-center gap-2">
            <button className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/60" aria-label="Turn mirror 1 degree back" onClick={() => setAngles((a) => a.map((v, k) => (k === picked ? (v + 179) % 180 : v)))}>
              −1°
            </button>
            <div className="flex-1">
              <Slider
                label={`Mirror ${picked + 1} tilt`}
                value={angles[picked]}
                min={0}
                max={179}
                step={1}
                unit="°"
                onChange={(v) => setAngles((a) => a.map((x, k) => (k === picked ? v : x)))}
              />
            </div>
            <button className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/60" aria-label="Turn mirror 1 degree on" onClick={() => setAngles((a) => a.map((v, k) => (k === picked ? (v + 1) % 180 : v)))}>
              +1°
            </button>
          </div>
          <Angles bounces={maze?.bounces ?? []} names={lv.mirrors.map((_, k) => `M${k + 1}`)} />
          <p className="text-center text-xs text-white/45">Tap a mirror and drag to turn it. The dashed line is the normal.</p>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small UI pieces.                                                     */
/* ------------------------------------------------------------------ */

function Choice<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`flex-1 rounded-xl border px-3 py-2 text-sm whitespace-nowrap ${value === o.id ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/60"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** The angles at each mirror the beam reached, in order. */
function Angles({ bounces, names }: { bounces: Bounce[]; names: string[] }) {
  if (!bounces.length) return <p className="text-center text-xs text-white/45">The beam has not reached a mirror yet.</p>;
  return (
    <div className="flex flex-wrap justify-center gap-2 text-xs">
      {bounces.map((b, k) => (
        <span key={k} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 tabular-nums text-white/60">
          {names[b.mirror] ?? `Mirror ${b.mirror + 1}`}: ∠i = {b.i.toFixed(0)}°, ∠r = {b.r.toFixed(0)}°
        </span>
      ))}
    </div>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
      <div className="text-[11px] uppercase tracking-wider text-white/45">{label}</div>
      <div className="font-display text-lg tabular-nums">{value}</div>
    </div>
  );
}

function Slider({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex justify-between text-sm">
        <span className="text-white/60">{label}</span>
        <span className="tabular-nums text-white">
          {value}
          {unit}
        </span>
      </div>
      <input type="range" className="range mt-2 w-full" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Drawing.                                                             */
/* ------------------------------------------------------------------ */

/** Write text, nudged so it never spills out of the canvas. */
function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, w: number, align: CanvasTextAlign = "center", color = "rgba(255,255,255,0.7)") {
  const tw = ctx.measureText(text).width;
  let left = align === "center" ? x - tw / 2 : align === "right" ? x - tw : x;
  left = Math.max(4, Math.min(w - 4 - tw, left));
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.fillText(text, left, y);
}

function shadowLayout(w: number, h: number) {
  const S = Math.min(h - 28, w * 0.38);
  const insetX = w - S - 8;
  const insetY = (h - S) / 2 + 6;
  const sideLeft = 10;
  const sideRight = insetX - 14;
  const kx = (sideRight - sideLeft) / (SCREEN_X + 2);
  const ky = (h - 44) / (2 * WALL_HALF);
  const oy = h / 2 + 8;
  return {
    S,
    insetX,
    insetY,
    sideRight,
    X: (cm: number) => sideLeft + cm * kx,
    Y: (cm: number) => oy - cm * ky,
    toCm: (px: number) => (px - sideLeft) / kx,
    ky,
  };
}

const MATERIAL_COLOR: Record<MaterialId, string> = {
  glass: "rgba(165,243,252,0.35)",
  butter: "rgba(254,243,199,0.6)",
  cardboard: "#a16207",
};

function drawShadow(
  ctx: CanvasRenderingContext2D,
  off: HTMLCanvasElement,
  w: number,
  h: number,
  s: { lampX: number; objX: number; lamp: LampId; material: MaterialId; shape: ShapeId; grid: { n: number; g: Float32Array }; edges: ReturnType<typeof shadowEdges> },
) {
  const L = shadowLayout(w, h);
  const { X, Y } = L;
  const a = LAMPS[s.lamp].radius;
  const hh = halfHeight(s.shape);
  const top = Y(WALL_HALF);
  const bot = Y(-WALL_HALF);

  // Light filling the room from the lamp (straight lines out to the wall).
  const glow = ctx.createRadialGradient(X(s.lampX), Y(0), 2, X(s.lampX), Y(0), X(SCREEN_X) - X(s.lampX));
  glow.addColorStop(0, "rgba(253,224,71,0.22)");
  glow.addColorStop(1, "rgba(253,224,71,0.03)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.moveTo(X(s.lampX), Y(a));
  ctx.lineTo(X(SCREEN_X), top);
  ctx.lineTo(X(SCREEN_X), bot);
  ctx.lineTo(X(s.lampX), Y(-a));
  ctx.closePath();
  ctx.fill();

  // Shadow behind the object, as dark as the material makes it.
  const block = 1 - OBJECT_MATERIALS[s.material].transmit;
  const clampY = (cm: number) => Math.max(-WALL_HALF, Math.min(WALL_HALF, cm));
  if (block > 0.05) {
    ctx.fillStyle = `rgba(10,13,28,${0.85 * block})`;
    ctx.beginPath();
    ctx.moveTo(X(s.objX), Y(hh));
    ctx.lineTo(X(SCREEN_X), Y(clampY(s.edges.outer)));
    ctx.lineTo(X(SCREEN_X), Y(clampY(-s.edges.outer)));
    ctx.lineTo(X(s.objX), Y(-hh));
    ctx.closePath();
    ctx.fill();
    if (s.edges.hasUmbra) {
      ctx.fillStyle = `rgba(0,0,0,${0.75 * block})`;
      ctx.beginPath();
      ctx.moveTo(X(s.objX), Y(hh));
      ctx.lineTo(X(SCREEN_X), Y(clampY(s.edges.umbra)));
      ctx.lineTo(X(SCREEN_X), Y(clampY(-s.edges.umbra)));
      ctx.lineTo(X(s.objX), Y(-hh));
      ctx.closePath();
      ctx.fill();
    }
  }

  // Edge rays: from each side of the lamp past the edges of the object.
  const ray = (y0: number, y1: number, color: string, dash: number[]) => {
    const kk = (SCREEN_X - s.lampX) / (s.objX - s.lampX);
    const yEnd = y0 + (y1 - y0) * kk;
    ctx.strokeStyle = color;
    ctx.setLineDash(dash);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(X(s.lampX), Y(y0));
    // Clip to the wall's height.
    const t = Math.abs(yEnd) > WALL_HALF ? (Math.sign(yEnd) * WALL_HALF - y0) / (yEnd - y0) : 1;
    ctx.lineTo(X(s.lampX + (SCREEN_X - s.lampX) * t), Y(y0 + (yEnd - y0) * t));
    ctx.stroke();
  };
  ray(-a, hh, "rgba(253,224,71,0.85)", []);
  ray(a, -hh, "rgba(253,224,71,0.85)", []);
  if (s.lamp === "wide") {
    ray(a, hh, "rgba(253,224,71,0.5)", [4, 3]);
    ray(-a, -hh, "rgba(253,224,71,0.5)", [4, 3]);
  }
  ctx.setLineDash([]);

  // The wall, coloured by how much light reaches it along the middle line.
  const GRID = s.grid.n;
  const col = Math.floor(GRID / 2);
  const cell = (bot - top) / GRID;
  for (let j = 0; j < GRID; j++) {
    const b = s.grid.g[j * GRID + col];
    ctx.fillStyle = wallColour(b);
    ctx.fillRect(X(SCREEN_X), top + j * cell, 6, cell + 0.6);
  }
  label(ctx, "wall", X(SCREEN_X) + 3, bot + 12, L.sideRight + 6);

  // Lamp: a luminous object.
  ctx.shadowColor = "#fde047";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "#fde047";
  const lh = Math.max(4, a * L.ky);
  ctx.fillRect(X(s.lampX) - 3, Y(0) - lh, 6, 2 * lh);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(X(s.lampX) - 1, Y(0) + lh, 2, bot - Y(0) - lh);
  label(ctx, "lamp", X(s.lampX), Y(0) - lh - 6, L.sideRight + 6, "center", "#fde047");

  // Object: a non-luminous object, seen side-on.
  ctx.fillStyle = MATERIAL_COLOR[s.material];
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1;
  ctx.fillRect(X(s.objX) - 2, Y(hh), 4, Y(-hh) - Y(hh));
  ctx.strokeRect(X(s.objX) - 2, Y(hh), 4, Y(-hh) - Y(hh));
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(X(s.objX) - 1, Y(-hh), 2, bot - Y(-hh));
  label(ctx, "object", X(s.objX), Y(-hh) + 14, L.sideRight + 6);

  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(X(0), bot, X(SCREEN_X) - X(0), 1);
  label(ctx, "Side view", 10, 14, w, "left", "rgba(255,255,255,0.5)");

  // "On the wall": the shadow as you would see it, worked out ray by ray.
  off.width = GRID;
  off.height = GRID;
  const octx = off.getContext("2d")!;
  const img = octx.createImageData(GRID, GRID);
  for (let k = 0; k < GRID * GRID; k++) {
    const [r, g, bb] = wallRGB(s.grid.g[k]);
    img.data[k * 4] = r;
    img.data[k * 4 + 1] = g;
    img.data[k * 4 + 2] = bb;
    img.data[k * 4 + 3] = 255;
  }
  octx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, L.insetX, L.insetY, L.S, L.S);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.strokeRect(L.insetX, L.insetY, L.S, L.S);
  // The object's real size, for comparison.
  const k = L.S / (2 * WALL_HALF);
  const cx = L.insetX + L.S / 2;
  const cy = L.insetY + L.S / 2;
  ctx.strokeStyle = "rgba(34,211,238,0.9)";
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  SHAPES[s.shape].points.forEach((p, i) => (i ? ctx.lineTo(cx + p.x * k, cy - p.y * k) : ctx.moveTo(cx + p.x * k, cy - p.y * k)));
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
  label(ctx, "On the wall", cx, L.insetY - 6, w, "center", "rgba(255,255,255,0.6)");
  ctx.font = "10px system-ui, sans-serif";
  label(ctx, "dashed: object size", cx, L.insetY + L.S + 12, w, "center", "rgba(34,211,238,0.85)");
  ctx.font = "11px system-ui, sans-serif";
}

function wallRGB(b: number): [number, number, number] {
  const lit = [255, 241, 200];
  const dark = [22, 24, 40];
  return [0, 1, 2].map((i) => Math.round(dark[i] + (lit[i] - dark[i]) * b)) as [number, number, number];
}
const wallColour = (b: number) => {
  const [r, g, bb] = wallRGB(b);
  return `rgb(${r},${g},${bb})`;
};

function drawPinhole(ctx: CanvasRenderingContext2D, off: HTMLCanvasElement, w: number, h: number, d: number, b: number, holeMm: number, cam: ReturnType<typeof pinhole>) {
  const S = Math.min(h - 28, w * 0.38);
  const insetX = w - S - 8;
  const insetY = (h - S) / 2 + 6;
  // Side view. Lengths along the bench are squeezed more than heights so a
  // 1 m bench fits; straight rays stay straight under this stretch.
  const left = 14;
  const right = insetX - 16;
  const span = PINHOLE.distance.max + PINHOLE.box.max;
  const kx = (right - left) / span;
  const ky = (h - 60) / 28;
  const holeX = left + PINHOLE.distance.max * kx;
  const oy = h / 2 + 6;
  const X = (cm: number) => holeX + cm * kx;
  const Y = (cm: number) => oy - cm * ky;
  const half = CANDLE_CM / 2;
  const D = holeMm / 10;

  // Rays from the flame tip and the candle base cross at the hole.
  const imgEnd = (y: number) => -y * (b / d);
  ctx.globalCompositeOperation = "lighter";
  for (const [y, c] of [
    [half, "rgba(253,186,116,"],
    [-half, "rgba(253,224,71,"],
  ] as const) {
    ctx.fillStyle = `${c}0.25)`;
    ctx.beginPath();
    ctx.moveTo(X(-d), Y(y));
    ctx.lineTo(X(0), Y(D / 2));
    ctx.lineTo(X(b), Y(imgEnd(y) + (D / 2) * ((d + b) / d)));
    ctx.lineTo(X(b), Y(imgEnd(y) - (D / 2) * ((d + b) / d)));
    ctx.lineTo(X(0), Y(-D / 2));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `${c}0.9)`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(X(-d), Y(y));
    ctx.lineTo(X(b), Y(imgEnd(y)));
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";

  // Candle.
  ctx.fillStyle = "#f5f5f4";
  ctx.fillRect(X(-d) - 3, Y(half * 0.4), 6, Y(-half) - Y(half * 0.4));
  drawFlame(ctx, X(-d), Y(half * 0.4), Y(half) - Y(half * 0.4));
  label(ctx, "candle", X(-d), Y(-half) + 14, right);

  // Box with the hole at the front and tracing paper at the back.
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2;
  const boxH = 12;
  const gap = Math.max(1.5, (D / 2) * ky);
  ctx.beginPath();
  ctx.moveTo(X(0), Y(boxH));
  ctx.lineTo(X(0), oy - gap);
  ctx.moveTo(X(0), oy + gap);
  ctx.lineTo(X(0), Y(-boxH));
  ctx.lineTo(X(PINHOLE.box.max) + 2, Y(-boxH));
  ctx.moveTo(X(0), Y(boxH));
  ctx.lineTo(X(PINHOLE.box.max) + 2, Y(boxH));
  ctx.stroke();
  ctx.strokeStyle = "rgba(254,243,199,0.8)";
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.moveTo(X(b), Y(boxH));
  ctx.lineTo(X(b), Y(-boxH));
  ctx.stroke();
  ctx.setLineDash([]);
  label(ctx, "hole", X(0), Y(boxH) - 6, right);
  label(ctx, "screen", X(b), Y(-boxH) + 13, right + 8);
  label(ctx, "Side view", 10, 14, w, "left", "rgba(255,255,255,0.5)");

  // What appears on the tracing paper: the candle, upside down, blurred by the hole.
  ctx.fillStyle = "#07080f";
  ctx.fillRect(insetX, insetY, S, S);
  const k = S / 24; // the inset shows a 24 cm tall patch of the screen
  off.width = Math.round(S);
  off.height = Math.round(S);
  const octx = off.getContext("2d")!;
  octx.clearRect(0, 0, off.width, off.height);
  const ih = cam.imageH * k;
  const cx = S / 2;
  const cy = S / 2;
  // Upside down: the flame is at the bottom.
  octx.fillStyle = "rgba(245,245,244,0.4)";
  octx.fillRect(cx - Math.max(2, ih * 0.12), cy - ih / 2, Math.max(4, ih * 0.24), ih * 0.7);
  drawFlame(octx, cx, cy - ih / 2 + ih * 0.7, -ih * 0.3);
  // Blur: add copies spread over a disc as wide as the blur spot.
  const r = (cam.blurCm / 2) * k;
  const N = r < 0.6 ? 1 : 24;
  ctx.save();
  ctx.beginPath();
  ctx.rect(insetX, insetY, S, S);
  ctx.clip();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 1 / N;
  for (const p of N === 1 ? [{ x: 0, y: 0 }] : discSamples(r, N)) ctx.drawImage(off, insetX + p.x, insetY + p.y);
  ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(insetX, insetY, S, S);
  label(ctx, "On the screen", insetX + S / 2, insetY - 6, w, "center", "rgba(255,255,255,0.6)");
  ctx.font = "10px system-ui, sans-serif";
  label(ctx, "upside down", insetX + S / 2, insetY + S + 12, w, "center", "rgba(253,186,116,0.9)");
  ctx.font = "11px system-ui, sans-serif";
}

/** A candle flame with its base at (x, y) and height hgt (negative points down). */
function drawFlame(ctx: CanvasRenderingContext2D, x: number, y: number, hgt: number) {
  const wdt = Math.max(2.5, Math.abs(hgt) * 0.32);
  const g = ctx.createLinearGradient(x, y, x, y - hgt);
  g.addColorStop(0, "#f97316");
  g.addColorStop(0.5, "#fde047");
  g.addColorStop(1, "#fff7cc");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x, y - hgt);
  ctx.quadraticCurveTo(x + wdt, y - hgt * 0.35, x, y);
  ctx.quadraticCurveTo(x - wdt, y - hgt * 0.35, x, y - hgt);
  ctx.fill();
}

function torchLayout(w: number, h: number) {
  const k = Math.min((w - 20) / 70, (h - 34) / 34);
  return { k, ox: w / 2, oy: h - 22 };
}

function drawTorch(ctx: CanvasRenderingContext2D, w: number, h: number, t: ReturnType<typeof torchBeam>) {
  const { k, ox, oy } = torchLayout(w, h);
  const P = (p: Vec) => ({ x: ox + p.x * k, y: oy - p.y * k });
  // Mirror with its silvered back.
  drawMirror(ctx, P, TORCH_MIRROR, true);
  label(ctx, "plane mirror", P({ x: 30, y: 0 }).x, oy + 14, w, "right", "rgba(255,255,255,0.55)");
  // Normal.
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox, oy - 30 * k);
  ctx.stroke();
  ctx.setLineDash([]);
  label(ctx, "normal", ox, oy - 30 * k - 4, w);
  // Beam.
  drawBeam(ctx, t.points.map(P), "#fde047");
  // Angles.
  const R = 9 * k;
  const up = -Math.PI / 2;
  const iRad = (t.i * Math.PI) / 180;
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#f472b6";
  ctx.beginPath();
  ctx.arc(ox, oy, R, up - iRad, up);
  ctx.stroke();
  ctx.strokeStyle = "#22d3ee";
  ctx.beginPath();
  ctx.arc(ox, oy, R * 1.15, up, up + (t.r * Math.PI) / 180);
  ctx.stroke();
  // Small letters on the arcs; the values sit in the top corners, away from the beams.
  const lab = (deg: number, sideSign: number) => {
    const a = up + (sideSign * (deg * Math.PI)) / 360;
    return { x: ox + Math.cos(a) * (R * 1.15 + 9), y: oy + Math.sin(a) * (R * 1.15 + 9) + 4 };
  };
  if (t.i >= 8) {
    const li = lab(t.i, -1);
    const lr = lab(t.r, 1);
    label(ctx, "i", li.x, li.y, w, "center", "#f9a8d4");
    label(ctx, "r", lr.x, lr.y, w, "center", "#a5f3fc");
  }
  ctx.font = "13px system-ui, sans-serif";
  label(ctx, `∠i = ${t.i.toFixed(0)}°`, 10, 20, w, "left", "#f9a8d4");
  label(ctx, `∠r = ${t.r.toFixed(0)}°`, w - 10, 20, w, "right", "#a5f3fc");
  ctx.font = "11px system-ui, sans-serif";
  // Torch body at the start of the beam.
  const f = P(t.from);
  const ang = Math.atan2(oy - f.y, ox - f.x);
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.rotate(ang);
  ctx.fillStyle = "#64748b";
  ctx.fillRect(-22, -5, 22, 10);
  ctx.fillStyle = "#fde047";
  ctx.fillRect(-2, -6, 4, 12);
  ctx.restore();
  if (t.i > 55) label(ctx, "torch (drag me)", f.x + 10, f.y - 14, w, "center", "rgba(255,255,255,0.6)");
  else label(ctx, "torch (drag me)", f.x - 6, f.y + 24, w, "right", "rgba(255,255,255,0.6)");
}

function drawMirror(ctx: CanvasRenderingContext2D, P: (p: Vec) => Vec, m: PlaneMirror, hatch: boolean, color = "#e2e8f0", width = 3) {
  const a = P(m.a);
  const b = P(m.b);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  if (!hatch) return;
  ctx.strokeStyle = "rgba(148,163,184,0.6)";
  ctx.lineWidth = 1;
  const n = 18;
  for (let i = 0; i <= n; i++) {
    const x = a.x + ((b.x - a.x) * i) / n;
    const y = a.y + ((b.y - a.y) * i) / n;
    ctx.beginPath();
    ctx.moveTo(x, y + 1);
    ctx.lineTo(x - 5, y + 7);
    ctx.stroke();
  }
}

function drawBeam(ctx: CanvasRenderingContext2D, pts: Vec[], color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawWalls(ctx: CanvasRenderingContext2D, P: (p: Vec) => Vec, walls: Wall[], color: string, width: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  for (const wl of walls) {
    const a = P(wl.a);
    const b = P(wl.b);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.lineCap = "butt";
}

/** Dashed normals where the beam meets each mirror. */
function drawNormals(ctx: CanvasRenderingContext2D, P: (p: Vec) => Vec, bounces: Bounce[], mirrors: PlaneMirror[], k: number) {
  for (const b of bounces) {
    const m = mirrors[b.mirror];
    const ex = m.b.x - m.a.x;
    const ey = m.b.y - m.a.y;
    const l = Math.hypot(ex, ey);
    const n = { x: -ey / l, y: ex / l };
    const p = P(b.p);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x - n.x * 7 * k, p.y + n.y * 7 * k);
    ctx.lineTo(p.x + n.x * 7 * k, p.y - n.y * 7 * k);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawPeriscope(ctx: CanvasRenderingContext2D, w: number, h: number, peri: ReturnType<typeof periscope>) {
  const k = Math.min((w - 12) / 90, (h - 16) / 62);
  const ox = w / 2 - 4 * k;
  const oy = h / 2;
  const P = (p: Vec) => ({ x: ox + p.x * k, y: oy - p.y * k });
  const Pe = PERISCOPE;
  // Brick wall.
  const wa = P(Pe.wall.a);
  const wb = P(Pe.wall.b);
  ctx.fillStyle = "#7c2d12";
  ctx.fillRect(wa.x - 2.5 * k, wb.y, 5 * k, wa.y - wb.y);
  label(ctx, "high wall", wa.x + 2.5 * k + 4, wb.y + 12, w, "left", "rgba(253,186,116,0.9)");
  // Tube.
  ctx.fillStyle = "rgba(148,163,184,0.08)";
  const tl = P({ x: -16, y: 28 });
  ctx.fillRect(tl.x, tl.y, 12 * k, 56 * k);
  drawWalls(ctx, P, Pe.tube, "rgba(203,213,225,0.7)", 2);
  // Rays.
  for (const r of peri.rays) drawBeam(ctx, r.points.map(P), "rgba(253,186,116,0.9)");
  // Mirrors.
  for (const m of peri.mirrors) drawMirror(ctx, P, m, false, "#e2e8f0", 3);
  drawNormals(ctx, P, peri.rays[1].bounces, peri.mirrors, k);
  // Cricket match and the eye.
  const sc = P(Pe.scene);
  drawStumps(ctx, sc.x, sc.y, k);
  label(ctx, "cricket match", sc.x - 6, sc.y + 5 * k + 4, w);
  const ey = P(Pe.eye.c);
  drawEye(ctx, ey.x, ey.y, k, peri.solved);
  label(ctx, peri.solved ? "I can see it!" : "your eye", ey.x, ey.y + 4 * k + 6, w, "center", peri.solved ? "#bef264" : "rgba(255,255,255,0.7)");
  label(ctx, "periscope", P({ x: -10, y: 28 }).x, P({ x: 0, y: 28 }).y - 6, w);
}

/** Three stumps with bails and a red ball, about 6 cm tall. */
function drawStumps(ctx: CanvasRenderingContext2D, x: number, y: number, k: number) {
  const hgt = 6 * k;
  ctx.strokeStyle = "#fde68a";
  ctx.lineWidth = 2;
  for (const dx of [-0.9, 0, 0.9]) {
    ctx.beginPath();
    ctx.moveTo(x + dx * k, y - hgt / 2);
    ctx.lineTo(x + dx * k, y + hgt / 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(x - 1.1 * k, y - hgt / 2 - 1);
  ctx.lineTo(x + 1.1 * k, y - hgt / 2 - 1);
  ctx.stroke();
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(x - 3.2 * k, y + hgt / 2 - 1.2 * k, Math.max(2.5, 0.8 * k), 0, Math.PI * 2);
  ctx.fill();
}

/** A simple eye looking right. */
function drawEye(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, happy: boolean) {
  const rx = 3.4 * k;
  const ry = 2 * k;
  ctx.fillStyle = "#f8fafc";
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = happy ? "#65a30d" : "#0ea5e9";
  ctx.beginPath();
  ctx.arc(x + rx * 0.35, y, ry * 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0a0d1c";
  ctx.beginPath();
  ctx.arc(x + rx * 0.35, y, ry * 0.38, 0, Math.PI * 2);
  ctx.fill();
}

function mazeLayout(w: number, h: number) {
  const k = Math.min((w - 12) / (2 * MAZE_HALF.x), (h - 12) / (2 * MAZE_HALF.y));
  const ox = w / 2;
  const oy = h / 2;
  return {
    k,
    P: (p: Vec) => ({ x: ox + p.x * k, y: oy - p.y * k }),
    toCm: (p: Vec) => ({ x: (p.x - ox) / k, y: (oy - p.y) / k }),
  };
}

function drawMaze(ctx: CanvasRenderingContext2D, w: number, h: number, lv: (typeof MAZE_LEVELS)[number], maze: ReturnType<typeof mazeBeam>, picked: number) {
  const { k, P } = mazeLayout(w, h);
  const tl = P({ x: -MAZE_HALF.x, y: MAZE_HALF.y });
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.strokeRect(tl.x, tl.y, 2 * MAZE_HALF.x * k, 2 * MAZE_HALF.y * k);
  drawWalls(ctx, P, lv.walls, "#64748b", 5);
  // Target.
  const t = P(lv.target);
  for (const [rr, c] of [
    [TARGET_R, maze.hit ? "#a3e635" : "#f43f5e"],
    [TARGET_R * 0.6, "#0a0d1c"],
    [TARGET_R * 0.3, maze.hit ? "#a3e635" : "#f43f5e"],
  ] as const) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(t.x, t.y, rr * k, 0, Math.PI * 2);
    ctx.fill();
  }
  if (maze.hit) {
    ctx.shadowColor = "#a3e635";
    ctx.shadowBlur = 16;
    ctx.strokeStyle = "#a3e635";
    ctx.beginPath();
    ctx.arc(t.x, t.y, TARGET_R * k + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  // Beam, clipped to the box.
  ctx.save();
  ctx.beginPath();
  ctx.rect(tl.x, tl.y, 2 * MAZE_HALF.x * k, 2 * MAZE_HALF.y * k);
  ctx.clip();
  drawBeam(ctx, maze.points.map(P), "#f87171");
  ctx.restore();
  // Mirrors.
  maze.mirrors.forEach((m, i) => {
    const c = P(lv.mirrors[i].c);
    if (i === picked && lv.mirrors.length > 1) {
      ctx.strokeStyle = "rgba(103,232,249,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(c.x, c.y, (MAZE_MIRROR_HALF + 1.5) * k, 0, Math.PI * 2);
      ctx.stroke();
    }
    drawMirror(ctx, P, m, false, i === picked ? "#67e8f9" : "#e2e8f0", 3.5);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath();
    ctx.arc(c.x, c.y, 2, 0, Math.PI * 2);
    ctx.fill();
    if (lv.mirrors.length > 1) {
      ctx.font = "10px system-ui, sans-serif";
      label(ctx, `M${i + 1}`, c.x + 8 * k, c.y + 4, w, "left", "rgba(255,255,255,0.6)");
      ctx.font = "11px system-ui, sans-serif";
    }
  });
  drawNormals(ctx, P, maze.bounces, maze.mirrors, k);
  // Laser box.
  const L = P(lv.laser);
  ctx.save();
  ctx.translate(L.x, L.y);
  ctx.rotate(Math.atan2(-lv.dir.y, lv.dir.x));
  ctx.fillStyle = "#475569";
  ctx.fillRect(-10, -5, 14, 10);
  ctx.fillStyle = "#f87171";
  ctx.fillRect(3, -2, 3, 4);
  ctx.restore();
  ctx.font = "10px system-ui, sans-serif";
  label(ctx, "laser", L.x, L.y + 18, w, "center", "rgba(255,255,255,0.6)");
  label(ctx, "target", t.x, t.y - TARGET_R * k - 5, w, "center", "rgba(255,255,255,0.6)");
  ctx.font = "11px system-ui, sans-serif";
}

