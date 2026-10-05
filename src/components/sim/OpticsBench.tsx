"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MATERIALS,
  block,
  lensImage,
  mirrorImage,
  power,
  rad,
  snell,
  trace,
  type ImageInfo,
  type MaterialId,
  type Scene,
  type Vec,
} from "@/lib/sim/optics";

export type OpticsMode = "block" | "lens" | "mirror";
export type MirrorKind = "plane" | "concave" | "convex";

export interface OpticsReading {
  mode: OpticsMode;
  block: { i: number; r: number; n: number; material: MaterialId; ratio: number; tried: number[] };
  lens: { kind: "convex" | "concave"; u: number; f: number; image: ImageInfo };
  mirror: { kind: MirrorKind; u: number; f: number; image: ImageInfo };
  /** In lens mode with a screen: the real image falls on the screen. */
  sharp: boolean;
}

interface Props {
  onReading?: (r: OpticsReading) => void;
  modes?: OpticsMode[];
  /** Puts a screen this many cm right of the lens (the challenge). */
  screen?: number | null;
  /** Mirrors offered on the mirror bench. */
  mirrors?: MirrorKind[];
}

const MODE_LABEL: Record<OpticsMode, string> = { block: "Glass block", lens: "Lens", mirror: "Mirror" };
const OBJECT_H = 5; // cm
const HALF_HEIGHT = 15; // cm, of lenses and mirrors
const SHARP_WITHIN = 0.5; // cm

const C = {
  axis: "rgba(240,233,221,0.25)",
  label: "rgba(240,233,221,0.6)",
  glass: "rgba(125,211,252,0.14)",
  glassEdge: "rgba(125,211,252,0.6)",
  object: "#fbbf24",
  image: "#f472b6",
  rays: ["#fde047", "#22d3ee", "#a78bfa"],
  normal: "rgba(240,233,221,0.45)",
};

export default function OpticsBench({ onReading, modes = ["block", "lens", "mirror"], screen = null, mirrors = ["plane", "concave", "convex"] }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<OpticsMode>(modes[0]);
  const [iDeg, setIDeg] = useState(40);
  const [material, setMaterial] = useState<MaterialId>("glass");
  const [tried, setTried] = useState<number[]>([]);
  const [lensKind, setLensKind] = useState<"convex" | "concave">("convex");
  const [lensU, setLensU] = useState(30);
  const [lensF, setLensF] = useState(10);
  const [mirrorKind, setMirrorKind] = useState<MirrorKind>(mirrors.includes("concave") ? "concave" : mirrors[0]);
  const [mirrorU, setMirrorU] = useState(30);
  const [mirrorF, setMirrorF] = useState(10);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode = modes.includes(mode) ? mode : modes[0];
  const n = MATERIALS[material].n;
  const r = snell(iDeg, 1, n) ?? 0;
  const ratio = iDeg > 0 ? Math.sin(rad(iDeg)) / Math.sin(rad(r)) : n;
  const lf = lensKind === "convex" ? lensF : -lensF;
  const lensImg = lensImage(-lensU, lf);
  const mf = mirrorKind === "plane" ? Infinity : mirrorKind === "concave" ? -mirrorF : mirrorF;
  const mirrorImg = mirrorImage(-mirrorU, mf);
  const sharp = activeMode === "lens" && screen !== null && lensImg.real && Math.abs(lensImg.v - screen) <= SHARP_WITHIN;

  // Remember angles tried (rounded to 5°) for the "is the ratio constant?" mission.
  useEffect(() => {
    if (activeMode !== "block" || iDeg < 10) return;
    const a = Math.round(iDeg / 5) * 5;
    // Record a new angle once the slider settles on it.
    const t = setTimeout(() => setTried((p) => (p.includes(a) ? p : [...p, a])), 400);
    return () => clearTimeout(t);
  }, [iDeg, activeMode]);

  useEffect(() => {
    onReadingRef.current?.({
      mode: activeMode,
      block: { i: iDeg, r, n, material, ratio, tried },
      lens: { kind: lensKind, u: -lensU, f: lf, image: lensImg },
      mirror: { kind: mirrorKind, u: -mirrorU, f: mf, image: mirrorImg },
      sharp,
    });
  }, [activeMode, iDeg, r, n, material, ratio, tried, lensKind, lensU, lf, lensImg, mirrorKind, mirrorU, mf, mirrorImg, sharp]);

  // Keep the canvas sized to its box.
  useEffect(() => {
    const c = canvasRef.current!;
    const ro = new ResizeObserver(() => setSize({ w: c.clientWidth, h: c.clientHeight }));
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !size.w) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(size.w * dpr);
    c.height = Math.round(size.h * dpr);
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);
    if (activeMode === "block") drawBlock(ctx, size.w, size.h, iDeg, n);
    else if (activeMode === "lens") drawLens(ctx, size.w, size.h, -lensU, lf, lensImg, screen, sharp);
    else drawMirror(ctx, size.w, size.h, -mirrorU, mf, mirrorImg);
  }, [size, activeMode, iDeg, n, lensU, lf, lensImg, screen, sharp, mirrorU, mf, mirrorImg]);

  // Drag the object along the axis (lens and mirror modes).
  const dragging = useRef(false);
  const dragTo = useCallback(
    (clientX: number) => {
      const c = canvasRef.current;
      if (!c || activeMode === "block") return;
      const rect = c.getBoundingClientRect();
      const view = activeMode === "lens" ? lensView(rect.width, rect.height) : mirrorView(rect.width, rect.height);
      const xCm = (clientX - rect.left - view.ox) / view.k;
      const u = Math.min(50, Math.max(3, Math.round(-xCm * 2) / 2));
      if (activeMode === "lens") setLensU(u);
      else setMirrorU(u);
    },
    [activeMode],
  );

  const imageLine = (img: ImageInfo) =>
    Number.isFinite(img.v) ? `v = ${fmt(img.v)} cm · m = ${fmt(img.m)}` : "Rays come out parallel: image at infinity";

  return (
    <div className="flex flex-col gap-3 select-none">
      {modes.length > 1 && (
        <div className="grid gap-1 rounded-2xl bg-ink/20 p-1 text-sm" style={{ gridTemplateColumns: `repeat(${modes.length}, 1fr)` }}>
          {modes.map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2 ${activeMode === m ? "bg-cream/10 text-cream" : "text-faint"}`}>
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="h-64 w-full rounded-2xl border border-line bg-well sm:h-80"
        style={{ touchAction: "pan-y" }}
        role="img"
        aria-label={
          activeMode === "block"
            ? `Light enters ${MATERIALS[material].label.toLowerCase()} at ${iDeg} degrees and bends to ${r.toFixed(1)} degrees`
            : activeMode === "lens"
              ? `${lensKind} lens, object ${lensU} cm away. Image: ${lensImg.nature}`
              : `${mirrorKind} mirror, object ${mirrorU} cm away. Image: ${mirrorImg.nature}`
        }
        onPointerDown={(e) => {
          if (activeMode === "block") return;
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          dragTo(e.clientX);
        }}
        onPointerMove={(e) => dragging.current && dragTo(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      />

      {activeMode === "block" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Readout label="Angle i" value={`${iDeg}°`} />
            <Readout label="Angle r" value={`${r.toFixed(1)}°`} />
            <Readout label="sin i ÷ sin r" value={ratio.toFixed(2)} />
          </div>
          <Slider label="Angle of incidence" value={iDeg} min={0} max={80} step={1} unit="°" onChange={setIDeg} />
          <Choice
            options={(Object.keys(MATERIALS) as MaterialId[]).map((id) => ({ id, label: `${MATERIALS[id].label} (n ${MATERIALS[id].n})` }))}
            value={material}
            onChange={(id) => {
              setMaterial(id);
              setTried([]);
            }}
          />
        </>
      )}

      {activeMode === "lens" && (
        <>
          <div className="rounded-2xl panel px-4 py-2 text-sm">
            <div className="font-semibold text-blush-200">{lensImg.nature}</div>
            <div className="tabular-nums text-muted">
              u = −{lensU} cm · f = {fmt(lf)} cm · {imageLine(lensImg)} · P = {fmt(power(lf))} D
            </div>
          </div>
          <Choice
            options={[
              { id: "convex", label: "Convex lens" },
              { id: "concave", label: "Concave lens" },
            ]}
            value={lensKind}
            onChange={setLensKind}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Slider label="Object distance" value={lensU} min={3} max={50} step={0.5} unit=" cm" onChange={setLensU} />
            <Slider label="Focal length" value={lensF} min={5} max={25} step={0.5} unit=" cm" onChange={setLensF} />
          </div>
        </>
      )}

      {activeMode === "mirror" && (
        <>
          <div className="rounded-2xl panel px-4 py-2 text-sm">
            <div className="font-semibold text-blush-200">{mirrorImg.nature}</div>
            <div className="tabular-nums text-muted">
              u = −{mirrorU} cm · {mirrorKind === "plane" ? "plane mirror" : `f = ${fmt(mf)} cm`} · {imageLine(mirrorImg)}
            </div>
          </div>
          {mirrors.length > 1 && (
            <Choice
              options={mirrors.map((id) => ({ id, label: `${id[0].toUpperCase()}${id.slice(1)} mirror` }))}
              value={mirrorKind}
              onChange={setMirrorKind}
            />
          )}
          <div className={`grid gap-2 ${mirrorKind === "plane" ? "" : "sm:grid-cols-2"}`}>
            <Slider label="Object distance" value={mirrorU} min={3} max={50} step={0.5} unit=" cm" onChange={setMirrorU} />
            {mirrorKind !== "plane" && (
              <Slider label="Focal length" value={mirrorF} min={5} max={20} step={0.5} unit=" cm" onChange={setMirrorF} />
            )}
          </div>
        </>
      )}
      {activeMode !== "block" && <p className="text-center text-xs text-faint">Drag across the picture to move the object.</p>}
    </div>
  );
}

const fmt = (x: number) => (Number.isFinite(x) ? (Math.round(x * 10) / 10).toString().replace("-", "−") : "∞");

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl panel px-1 py-2">
      <div className="text-[11px] uppercase tracking-wider text-faint">{label}</div>
      <div className="font-display text-lg tabular-nums">{value}</div>
    </div>
  );
}

function Slider(props: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }) {
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

function Choice<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`flex-1 rounded-xl border px-3 py-2 text-sm ${value === o.id ? "chip-on" : "border-line text-muted"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Drawing ----------

interface View {
  /** Pixels per cm, and the pixel position of world (0, 0). */
  k: number;
  ox: number;
  oy: number;
}

const lensView = (w: number, h: number): View => {
  const k = Math.min(w / 112, h / 38);
  return { k, ox: w / 2, oy: h / 2 };
};
const mirrorView = (w: number, h: number): View => {
  const k = Math.min(w / 72, h / 38);
  return { k, ox: w - 16 * k, oy: h / 2 };
};

function px(v: View, p: Vec) {
  return { x: v.ox + p.x * v.k, y: v.oy - p.y * v.k };
}

function polyline(ctx: CanvasRenderingContext2D, v: View, pts: Vec[], colour: string, dashed = false, width = 2) {
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  if (dashed) ctx.setLineDash([5, 5]);
  else {
    ctx.shadowColor = colour;
    ctx.shadowBlur = 6;
  }
  ctx.beginPath();
  pts.forEach((p, i) => {
    const q = px(v, p);
    if (i) ctx.lineTo(q.x, q.y);
    else ctx.moveTo(q.x, q.y);
  });
  ctx.stroke();
  ctx.restore();
}

function label(ctx: CanvasRenderingContext2D, v: View, p: Vec, text: string, colour = C.label, dy = 14) {
  const q = px(v, p);
  ctx.fillStyle = colour;
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "center";
  // Keep labels inside the picture.
  const half = ctx.measureText(text).width / 2 + 4;
  const x = Math.min(Math.max(q.x, half), ctx.canvas.clientWidth - half);
  ctx.fillText(text, x, q.y + dy);
  ctx.textAlign = "start";
}

function arrowUp(ctx: CanvasRenderingContext2D, v: View, x: number, height: number, colour: string, dashed = false) {
  const base = px(v, { x, y: 0 });
  const tip = px(v, { x, y: height });
  const dir = Math.sign(tip.y - base.y) || -1;
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineWidth = 3;
  if (dashed) ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(base.x, base.y);
  ctx.lineTo(tip.x, tip.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(tip.x - 6, tip.y - dir * 9);
  ctx.lineTo(tip.x + 6, tip.y - dir * 9);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function axis(ctx: CanvasRenderingContext2D, w: number, v: View) {
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, v.oy);
  ctx.lineTo(w, v.oy);
  ctx.stroke();
}

function mark(ctx: CanvasRenderingContext2D, v: View, x: number, text: string) {
  const q = px(v, { x, y: 0 });
  ctx.fillStyle = C.label;
  ctx.beginPath();
  ctx.arc(q.x, q.y, 3, 0, Math.PI * 2);
  ctx.fill();
  label(ctx, v, { x, y: 0 }, text, C.label, 16);
}

/** Rays from the object's tip: parallel to the axis, through the centre, and through (or towards) a focus. */
function principalRays(tip: Vec, aims: Vec[]) {
  const dirs: Vec[] = [{ x: 1, y: 0 }];
  for (const target of aims) {
    const d = { x: target.x - tip.x, y: target.y - tip.y };
    if (Math.abs(d.x) < 0.2) continue;
    dirs.push(d.x > 0 ? d : { x: -d.x, y: -d.y });
  }
  return dirs;
}

function drawBlock(ctx: CanvasRenderingContext2D, w: number, h: number, iDeg: number, n: number) {
  const k = Math.min(w / 60, h / 36);
  const v: View = { k, ox: w / 2, oy: h / 2 };
  const glass = block(-24, -6, 48, 12, n);
  const scene: Scene = { media: [glass] };

  const q0 = px(v, { x: -24, y: 6 });
  ctx.fillStyle = C.glass;
  ctx.strokeStyle = C.glassEdge;
  ctx.lineWidth = 1.5;
  ctx.fillRect(q0.x, q0.y, 48 * k, 12 * k);
  ctx.strokeRect(q0.x, q0.y, 48 * k, 12 * k);

  const entry = { x: -6, y: 6 };
  const d = { x: Math.sin(rad(iDeg)), y: -Math.cos(rad(iDeg)) };
  const start = { x: entry.x - d.x * 14, y: entry.y - d.y * 14 };
  const path = trace(start, d, scene, 40);
  polyline(ctx, v, path.points, C.rays[0], false, 3);

  // Incident ray carried straight on, to show the sideways shift.
  polyline(ctx, v, [entry, { x: entry.x + d.x * 30, y: entry.y + d.y * 30 }], "rgba(253,224,71,0.35)", true, 1.5);

  // Normals at entry and exit.
  const exit = path.points[2];
  for (const p of [entry, exit]) {
    if (!p) continue;
    polyline(ctx, v, [{ x: p.x, y: p.y + 7 }, { x: p.x, y: p.y - 7 }], C.normal, true, 1);
  }

  // Angle arcs.
  const e = px(v, entry);
  const rDeg = snell(iDeg, 1, n) ?? 0;
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = C.rays[0];
  ctx.beginPath();
  ctx.arc(e.x, e.y, 28, -Math.PI / 2 - rad(iDeg), -Math.PI / 2);
  ctx.stroke();
  ctx.strokeStyle = C.rays[1];
  ctx.beginPath();
  ctx.arc(e.x, e.y, 34, Math.PI / 2 - rad(rDeg), Math.PI / 2);
  ctx.stroke();
  ctx.font = "600 12px system-ui, sans-serif";
  ctx.fillStyle = C.rays[0];
  ctx.fillText("i", e.x - 12 - 30 * Math.sin(rad(iDeg / 2)), e.y - 30 * Math.cos(rad(iDeg / 2)));
  ctx.fillStyle = C.rays[1];
  ctx.fillText("r", e.x + 4 + 40 * Math.sin(rad(rDeg / 2)), e.y + 4 + 40 * Math.cos(rad(rDeg / 2)));

  label(ctx, v, { x: -20, y: 6 }, "Air", C.label, -8);
  label(ctx, v, { x: -18, y: -6 }, `Glass block, n = ${n}`, "rgba(125,211,252,0.85)", -8);
  label(ctx, v, { x: entry.x, y: 6 }, "normal", C.normal, -64);
}

function drawLens(ctx: CanvasRenderingContext2D, w: number, h: number, u: number, f: number, img: ImageInfo, screen: number | null, sharp: boolean) {
  const v = lensView(w, h);
  axis(ctx, w, v);
  const scene: Scene = { elements: [{ kind: "lens", x: 0, halfHeight: HALF_HEIGHT, f }] };

  // The lens.
  const top = px(v, { x: 0, y: HALF_HEIGHT });
  const bottom = px(v, { x: 0, y: -HALF_HEIGHT });
  const bulge = (f > 0 ? 1 : -1) * Math.max(6, 8 * v.k * 0.4);
  ctx.fillStyle = C.glass;
  ctx.strokeStyle = C.glassEdge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (f > 0) {
    ctx.moveTo(top.x, top.y);
    ctx.quadraticCurveTo(top.x + bulge * 2, v.oy, bottom.x, bottom.y);
    ctx.quadraticCurveTo(top.x - bulge * 2, v.oy, top.x, top.y);
  } else {
    const t = 6;
    ctx.moveTo(top.x - t, top.y);
    ctx.lineTo(top.x + t, top.y);
    ctx.quadraticCurveTo(top.x + t + bulge * 1.2, v.oy, bottom.x + t, bottom.y);
    ctx.lineTo(bottom.x - t, bottom.y);
    ctx.quadraticCurveTo(top.x - t - bulge * 1.2, v.oy, top.x - t, top.y);
  }
  ctx.fill();
  ctx.stroke();

  const F = Math.abs(f);
  mark(ctx, v, -F, "F₁");
  mark(ctx, v, F, "F₂");
  mark(ctx, v, -2 * F, "2F₁");
  mark(ctx, v, 2 * F, "2F₂");
  label(ctx, v, { x: 0, y: 0 }, "O", C.label, 16);

  if (screen !== null) {
    const s0 = px(v, { x: screen, y: 13 });
    ctx.fillStyle = sharp ? "rgba(163,230,53,0.35)" : "rgba(240,233,221,0.12)";
    ctx.fillRect(s0.x - 3, s0.y, 6, 26 * v.k);
    label(ctx, v, { x: screen, y: 13 }, sharp ? "Sharp!" : "Screen", sharp ? "#a3e635" : C.label, -6);
  }

  const tip = { x: u, y: OBJECT_H };
  const dirs = principalRays(tip, [{ x: 0, y: 0 }, { x: -f, y: 0 }]);
  dirs.forEach((d, i) => {
    const path = trace(tip, d, scene, 80);
    polyline(ctx, v, path.points, C.rays[i]);
    // Virtual image: trace the emergent ray backwards to where it seems to come from.
    if (!img.real && Number.isFinite(img.v) && path.points.length > 2) {
      const hit = path.points[1];
      const back = { x: img.v, y: hit.y + ((img.v - hit.x) * path.dir.y) / path.dir.x };
      polyline(ctx, v, [hit, back], C.rays[i], true, 1.2);
    }
  });

  arrowUp(ctx, v, u, OBJECT_H, C.object);
  label(ctx, v, { x: u, y: OBJECT_H }, "Object", C.object, -8);
  if (Number.isFinite(img.v) && Math.abs(img.v) < 60 && Math.abs(img.m * OBJECT_H) < 18) {
    arrowUp(ctx, v, img.v, img.m * OBJECT_H, C.image, !img.real);
    label(ctx, v, { x: img.v, y: img.m * OBJECT_H }, img.real ? "Image" : "Virtual image", C.image, img.m > 0 ? -8 : 16);
  }
}

function drawMirror(ctx: CanvasRenderingContext2D, w: number, h: number, u: number, f: number, img: ImageInfo) {
  const v = mirrorView(w, h);
  axis(ctx, w, v);
  const scene: Scene = { elements: [{ kind: "mirror", x: 0, halfHeight: HALF_HEIGHT, f }] };

  // The mirror, its curve exaggerated so concave and convex are easy to tell apart.
  const top = px(v, { x: 0, y: HALF_HEIGHT });
  const bottom = px(v, { x: 0, y: -HALF_HEIGHT });
  const curve = !Number.isFinite(f) ? 0 : (f < 0 ? -1 : 1) * 14;
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(top.x + curve, top.y);
  ctx.quadraticCurveTo(top.x - curve, v.oy, bottom.x + curve, bottom.y);
  ctx.stroke();
  // Silvered back.
  ctx.strokeStyle = "rgba(203,213,225,0.35)";
  ctx.lineWidth = 1;
  for (let y = top.y + 6; y < bottom.y; y += 8) {
    const t = (y - top.y) / (bottom.y - top.y);
    const x = (1 - t) * (1 - t) * (top.x + curve) + 2 * t * (1 - t) * (top.x - curve) + t * t * (bottom.x + curve);
    ctx.beginPath();
    ctx.moveTo(x + 2, y);
    ctx.lineTo(x + 8, y - 5);
    ctx.stroke();
  }

  if (Number.isFinite(f)) {
    mark(ctx, v, f, "F");
    mark(ctx, v, 2 * f, "C");
  }
  label(ctx, v, { x: 0, y: 0 }, "P", C.label, 16);

  const tip = { x: u, y: OBJECT_H };
  const dirs = principalRays(tip, Number.isFinite(f) ? [{ x: 0, y: 0 }, { x: 2 * f, y: 0 }] : [{ x: 0, y: 0 }, { x: 0, y: -OBJECT_H }]);
  dirs.forEach((d, i) => {
    const path = trace(tip, d, scene, 80);
    polyline(ctx, v, path.points, C.rays[i]);
    if (!img.real && Number.isFinite(img.v) && path.points.length > 2) {
      const hit = path.points[1];
      const back = { x: img.v, y: hit.y + ((img.v - hit.x) * path.dir.y) / path.dir.x };
      polyline(ctx, v, [hit, back], C.rays[i], true, 1.2);
    }
  });

  arrowUp(ctx, v, u, OBJECT_H, C.object);
  label(ctx, v, { x: u, y: OBJECT_H }, "Object", C.object, -8);
  if (Number.isFinite(img.v) && img.v > -60 && img.v < 16 && Math.abs(img.m * OBJECT_H) < 18) {
    arrowUp(ctx, v, img.v, img.m * OBJECT_H, C.image, !img.real);
    label(ctx, v, { x: img.v, y: img.m * OBJECT_H }, img.real ? "Image" : "Virtual image", C.image, img.m > 0 ? -8 : 16);
  }
}

