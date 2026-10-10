"use client";

import { useEffect, useRef, useState } from "react";
import { fitCanvas } from "./canvas";
import {
  ANGLES,
  AMBIENT_C,
  CHAR_C,
  FOCUSERS,
  POSITIONS,
  applyChain,
  concentration,
  formulaCount,
  hingeImages,
  parallelImages,
  spotRadius,
  warm,
  type FocuserId,
  type Vec,
} from "@/lib/sim/kaleidoscope";

export type KaleidoMode = "hinge" | "parallel" | "sun";

export interface KaleidoReading {
  mode: KaleidoMode;
  angle: number;
  position: number;
  /** Images seen in the hinged mirrors. */
  count: number;
  focuser: FocuserId;
  /** Card distance from the lens or mirror, in metres. */
  distance: number;
  /** How many times brighter than sunlight the spot is. */
  conc: number;
  charred: boolean;
  /** True while a challenge round is running. */
  challenge: boolean;
}

interface Props {
  onReading?: (r: KaleidoReading) => void;
  /** Challenge: only the hinged mirrors, and the student must make this many images. */
  target?: number | null;
}

const MODES: { id: KaleidoMode; label: string }[] = [
  { id: "hinge", label: "Hinged mirrors" },
  { id: "parallel", label: "Parallel mirrors" },
  { id: "sun", label: "Sunlight" },
];

/** A bangle with a bead on one side, so you can see that each reflection flips it. Offsets from the object, in hinge units. */
const BANGLE: Vec[] = Array.from({ length: 24 }, (_, i) => ({ x: 0.13 * Math.cos((i / 24) * 2 * Math.PI), y: 0.13 * Math.sin((i / 24) * 2 * Math.PI) }));
const BEAD: Vec = { x: 0.09, y: 0.09 };

export default function KaleidoLab({ onReading, target = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<KaleidoMode>("hinge");
  const [angle, setAngle] = useState<number>(90);
  const [position, setPosition] = useState<number>(0.3);
  const [focuser, setFocuser] = useState<FocuserId>("lens");
  const [distance, setDistance] = useState<number>(0.3);
  const [temp, setTemp] = useState(AMBIENT_C);
  const [charred, setCharred] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: KaleidoMode = target !== null ? "hinge" : mode;
  const images = hingeImages(angle, angle * position);
  const fo = FOCUSERS[focuser];
  const conc = concentration(focuser, distance);

  useEffect(() => {
    onReadingRef.current?.({
      mode: activeMode,
      angle,
      position,
      count: images.length,
      focuser,
      distance,
      conc,
      charred,
      challenge: target !== null,
    });
  }, [activeMode, angle, position, images.length, focuser, distance, conc, charred, target]);

  // Warm the card in the sunlight spot, frame by frame.
  const concRef = useRef(conc);
  const tempRef = useRef(AMBIENT_C);
  useEffect(() => {
    concRef.current = conc;
  }, [conc]);
  useEffect(() => {
    if (activeMode !== "sun" || charred) return;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const t = (tempRef.current = warm(tempRef.current, concRef.current, dt));
      if (t >= CHAR_C) {
        setTemp(CHAR_C);
        setCharred(true);
        return;
      }
      setTemp(t);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [activeMode, charred]);

  const newCard = () => {
    tempRef.current = AMBIENT_C;
    setCharred(false);
    setTemp(AMBIENT_C);
  };
  const pickFocuser = (id: FocuserId) => {
    setFocuser(id);
    setDistance(FOCUSERS[id].f * 2);
    newCard();
  };

  useEffect(() => {
    const c = canvasRef.current!;
    const ro = new ResizeObserver(() => setSize({ w: c.clientWidth, h: c.clientHeight }));
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !size.w) return;
    const ctx = fitCanvas(c, size.w, size.h);
    ctx.clearRect(0, 0, size.w, size.h);
    if (activeMode === "hinge") drawHinge(ctx, size.w, size.h, angle, position);
    else if (activeMode === "parallel") drawParallel(ctx, size.w, size.h, position);
    else drawSun(ctx, size.w, size.h, focuser, distance, temp, charred);
  }, [size, activeMode, angle, position, focuser, distance, temp, charred]);

  const spotMm = spotRadius(fo.f, fo.aperture, distance) * 2000;
  const label =
    activeMode === "hinge"
      ? `Two mirrors hinged at ${angle} degrees with a bangle between them: ${images.length} images`
      : activeMode === "parallel"
        ? "A bangle between two parallel mirrors: its images go on and on, each one dimmer"
        : `Sunlight through a ${fo.kind} onto a card ${Math.round(distance * 100)} cm away${charred ? ": the card is burning" : ""}`;

  return (
    <div className="flex flex-col gap-3 select-none">
      {target === null && (
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)} className={`rounded-xl py-2 ${activeMode === m.id ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m.label}
            </button>
          ))}
        </div>
      )}

      <canvas ref={canvasRef} className="h-60 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-72" role="img" aria-label={label} />

      {activeMode === "hinge" && (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Stat label="Images you see" value={String(images.length)} />
            <Stat label="(360° ÷ θ) − 1" value={String(formulaCount(angle))} />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="text-sm text-white/60">Angle between the mirrors, θ</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ANGLES.map((a) => (
                <button
                  key={a}
                  onClick={() => setAngle(a)}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-sm tabular-nums ${angle === a ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
                >
                  {a}°
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {activeMode !== "sun" && (
        <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Move the bangle</span>
            <span className="text-white">{position === 0.5 ? "exactly in the middle" : position < 0.5 ? "nearer mirror 1" : "nearer mirror 2"}</span>
          </div>
          <input
            type="range"
            className="range mt-2 w-full"
            min={0}
            max={POSITIONS.length - 1}
            step={1}
            value={POSITIONS.indexOf(position as (typeof POSITIONS)[number])}
            onChange={(e) => setPosition(POSITIONS[Number(e.target.value)])}
          />
        </label>
      )}

      {activeMode === "parallel" && (
        <p className="text-center text-xs text-white/40">Like the mirrors facing each other in a barber shop or a lift. Light loses a little at every bounce.</p>
      )}

      {activeMode === "sun" && (
        <>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(FOCUSERS) as FocuserId[]).map((id) => (
              <button
                key={id}
                onClick={() => pickFocuser(id)}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm whitespace-nowrap ${focuser === id ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
              >
                {FOCUSERS[id].label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Spot size" value={spotMm >= 10 ? `${(spotMm / 10).toFixed(1)} cm` : `${spotMm.toFixed(1)} mm`} />
            <Stat label="× sunlight" value={conc >= 100 ? String(Math.round(conc)) : conc.toFixed(1)} />
            <Stat label="Card" value={charred ? "Burning!" : `${Math.round(temp)} °C`} warn={charred} />
          </div>
          <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Card distance from the {fo.kind}</span>
              <span className="tabular-nums text-white">{(distance * 100).toFixed(1)} cm</span>
            </div>
            <input
              type="range"
              className="range mt-2 w-full"
              min={fo.min}
              max={fo.max}
              step={fo.step}
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
            />
          </label>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-white/40">Never look at the Sun through a lens, and burn paper only with a grown-up, away from anything that can catch fire.</p>
            <button className="btn-ghost shrink-0 !px-3 !py-1.5 text-sm" onClick={newCard}>
              New card
            </button>
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
      <div className={`font-display text-lg tabular-nums ${warn ? "text-orange-300" : ""}`}>{value}</div>
    </div>
  );
}

const BANGLE_COLOURS = ["#f472b6", "#a3e635", "#fde047"];

function drawBangle(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], bead: { x: number; y: number }, colour: string, alpha: number) {
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 3;
  ctx.shadowColor = colour;
  ctx.shadowBlur = alpha > 0.9 ? 8 : 0;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#22d3ee";
  ctx.beginPath();
  ctx.arc(bead.x, bead.y, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawHinge(ctx: CanvasRenderingContext2D, w: number, h: number, theta: number, position: number) {
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.32;
  // Turn the scene so the wedge opens straight up.
  const turn = ((90 - theta / 2) * Math.PI) / 180;
  const S = (p: Vec) => ({ x: cx + R * (p.x * Math.cos(turn) - p.y * Math.sin(turn)), y: cy - R * (p.x * Math.sin(turn) + p.y * Math.cos(turn)) });

  // The wedge between the mirrors, where the real bangle sits.
  ctx.fillStyle = "rgba(34,211,238,0.06)";
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  for (let a = 0; a <= theta; a += 2) {
    const p = S({ x: 1.45 * Math.cos((a * Math.PI) / 180), y: 1.45 * Math.sin((a * Math.PI) / 180) });
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.fill();

  // Faint ring the images sit on: every image is as far from the hinge as the bangle.
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const phi = (theta * position * Math.PI) / 180;
  const obj = { x: Math.cos(phi), y: Math.sin(phi) };
  const shape = BANGLE.map((v) => ({ x: obj.x + v.x, y: obj.y + v.y }));
  const bead = { x: obj.x + BEAD.x, y: obj.y + BEAD.y };
  const images = hingeImages(theta, theta * position);
  images.forEach((img) => {
    const pts = shape.map((p) => S(applyChain(p, img.chain, theta)));
    drawBangle(ctx, pts, S(applyChain(bead, img.chain, theta)), BANGLE_COLOURS[(img.chain.length - 1) % 3], Math.max(0.3, 0.75 - 0.08 * img.chain.length));
  });
  drawBangle(ctx, shape.map(S), S(bead), BANGLE_COLOURS[0], 1);

  // The two mirrors, shiny side in.
  for (const [deg, name] of [
    [0, "mirror 1"],
    [theta, "mirror 2"],
  ] as const) {
    const end = S({ x: 1.5 * Math.cos((deg * Math.PI) / 180), y: 1.5 * Math.sin((deg * Math.PI) / 180) });
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#7dd3fc";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "center";
    const lab = S({ x: 1.62 * Math.cos((deg * Math.PI) / 180), y: 1.62 * Math.sin((deg * Math.PI) / 180) });
    ctx.fillText(name, Math.min(w - 30, Math.max(30, lab.x)), Math.min(h - 6, Math.max(12, lab.y)));
  }
  ctx.fillStyle = "#e2e8f0";
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText(`θ = ${theta}°  ·  ${images.length} image${images.length === 1 ? "" : "s"}`, 10, h - 10);
}

function drawParallel(ctx: CanvasRenderingContext2D, w: number, h: number, position: number) {
  const gap = 1;
  const x0 = position * gap;
  const k = w / 7.5;
  const left = w / 2 - k / 2;
  const X = (x: number) => left + x * k;
  const cy = h / 2;
  const r = Math.min(18, k * 0.22);
  const ring = (x: number, alpha: number, flipped: boolean) => {
    const pts = BANGLE.map((v) => ({ x: X(x) + (v.x / 0.13) * r, y: cy + (v.y / 0.13) * r }));
    drawBangle(ctx, pts, { x: X(x) + ((flipped ? -1 : 1) * BEAD.x * r) / 0.13, y: cy - (BEAD.y * r) / 0.13 }, BANGLE_COLOURS[0], alpha);
  };
  for (const img of parallelImages(gap, x0, 8)) {
    if (X(img.x) < -r || X(img.x) > w + r) continue;
    ring(img.x, Math.max(0.12, 0.85 ** img.bounces * 0.8), img.bounces % 2 === 1);
  }
  ring(x0, 1, false);
  for (const x of [0, gap]) {
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#7dd3fc";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(X(x), cy - h * 0.35);
    ctx.lineTo(X(x), cy + h * 0.35);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("…on and on", 40, cy + h * 0.32);
  ctx.fillText("on and on…", w - 40, cy + h * 0.32);
  ctx.textAlign = "left";
  ctx.fillText("Parallel mirrors: images without end", 10, 18);
}

function drawSun(ctx: CanvasRenderingContext2D, w: number, h: number, id: FocuserId, d: number, temp: number, charred: boolean) {
  const fo = FOCUSERS[id];
  const cy = h / 2;
  const half = Math.min(h * 0.32, 70);
  // Fit the full slider range across the canvas.
  const k = (w * 0.78) / fo.max;
  const lens = id === "lens";
  // Lens on the left with the card to its right; the dish on the right with the card to its left.
  const opticX = lens ? w * 0.12 : w * 0.9;
  const dir = lens ? 1 : -1;
  const cardX = opticX + dir * d * k;
  const focusX = opticX + dir * fo.f * k;
  const rays = [-1, -0.6, -0.2, 0.2, 0.6, 1];

  ctx.strokeStyle = "rgba(253,224,71,0.8)";
  ctx.lineWidth = 1.4;
  ctx.shadowColor = "#fde047";
  ctx.shadowBlur = 4;
  for (const y of rays) {
    const y0 = cy + y * half;
    // In from the Sun, from the left.
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.lineTo(opticX, y0);
    // Then towards the focus, stopping at the card.
    const t = Math.abs(cardX - opticX) / Math.abs(focusX - opticX);
    ctx.lineTo(opticX + (focusX - opticX) * t, y0 + (cy - y0) * t);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // The lens or dish.
  ctx.fillStyle = "rgba(125,211,252,0.2)";
  ctx.strokeStyle = "rgba(125,211,252,0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (lens) {
    ctx.ellipse(opticX, cy, 7, half + 8, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.moveTo(opticX - 14, cy - half - 8);
    ctx.quadraticCurveTo(opticX + 14, cy, opticX - 14, cy + half + 8);
  }
  ctx.stroke();

  // Focus marker.
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.beginPath();
  ctx.arc(focusX, cy, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillText("F", focusX, cy + half + 22);

  // The card, browning as it warms, with the bright spot on it.
  const heat = Math.min(1, Math.max(0, (temp - AMBIENT_C) / (CHAR_C - AMBIENT_C)));
  const shade = Math.round(235 - heat * 120);
  ctx.fillStyle = `rgb(${shade + 10},${shade},${Math.round(shade - heat * 60)})`;
  ctx.fillRect(cardX - 3, cy - half - 14, 6, 2 * half + 28);
  const spotPx = Math.max(2, spotRadius(fo.f, fo.aperture, d) * k);
  const glow = ctx.createRadialGradient(cardX, cy, 0, cardX, cy, spotPx + 6);
  glow.addColorStop(0, "rgba(255,255,220,1)");
  glow.addColorStop(1, "rgba(253,224,71,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cardX, cy, spotPx + 6, 0, Math.PI * 2);
  ctx.fill();
  if (charred) {
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(cardX, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "20px system-ui, sans-serif";
    ctx.fillText("🔥", cardX, cy - 12);
  }
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("card", cardX, cy - half - 20);
  ctx.textAlign = "left";
  ctx.fillText(lens ? "Sunlight →" : "Sunlight →  (the dish reflects it back)", 10, 18);
}
