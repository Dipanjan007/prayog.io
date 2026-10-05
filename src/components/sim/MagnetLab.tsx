"use client";

import { useEffect, useRef, useState } from "react";
import { fieldAt, potentialAt, rodForce, solenoidNorthEnd, sources, LOOP_RADIUS_CM, SOLENOID, type FieldMode, type LineCurrent } from "@/lib/sim/magnetism";

export type MagnetMode = FieldMode | "force";

export interface MagnetReading {
  mode: MagnetMode;
  current: number;
  reversed: boolean;
  /** Force mode: north pole on top. */
  fieldDown: boolean;
  /** Solenoid: the end that acts as a north pole. */
  northEnd: "left" | "right";
  /** Force mode: +1 rod pushed right, −1 left, 0 none. */
  forceDir: number;
}

export interface RodRound {
  fieldDown: boolean;
  currentOut: boolean;
}

interface Props {
  onReading?: (r: MagnetReading) => void;
  /** Challenge: a fixed rod setup. The current stays off until the student guesses. */
  round?: RodRound | null;
  onGuess?: (dir: 1 | -1) => void;
}

const VIEW: Record<FieldMode, { x: number; y: number }> = {
  wire: { x: 12, y: 8 },
  loop: { x: 12, y: 8 },
  solenoid: { x: 16, y: 8 },
};
/** Spacing between drawn field lines, in units of μ0/(2π) × amps. Fixed, so more current shows more lines. */
const LINE_STEP: Record<FieldMode, number> = { wire: 0.6, loop: 0.7, solenoid: 1.6 };
const DEFAULT_PROBE: Record<FieldMode, { x: number; y: number }> = {
  wire: { x: 3, y: 0 },
  loop: { x: 0, y: 0 },
  solenoid: { x: 0, y: 0 },
};
const CHALLENGE_AMPS = 4;

export default function MagnetLab({ onReading, round = null, onGuess }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<MagnetMode>("wire");
  const [current, setCurrent] = useState(3);
  const [reversed, setReversed] = useState(false);
  const [fieldDown, setFieldDown] = useState(true);
  const [probe, setProbe] = useState<{ x: number; y: number } | null>(null);
  const [guess, setGuess] = useState<1 | -1 | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  const activeMode: MagnetMode = round ? "force" : mode;
  const amps = round ? (guess ? CHALLENGE_AMPS : 0) : current;
  const activeDown = round ? round.fieldDown : fieldDown;
  const currentOut = round ? round.currentOut : !reversed;
  const rod = rodForce(amps, activeDown, currentOut);
  const northEnd = solenoidNorthEnd(reversed);
  const fieldMode: FieldMode = activeMode === "force" ? "wire" : activeMode;
  const src = sources(fieldMode, reversed);
  const p = probe ?? DEFAULT_PROBE[fieldMode];
  const probeB = fieldAt(src, current, p.x, p.y);

  useEffect(() => {
    onReadingRef.current?.({ mode: activeMode, current: amps, reversed: !currentOut, fieldDown: activeDown, northEnd, forceDir: rod.dir });
  }, [activeMode, amps, currentOut, activeDown, northEnd, rod.dir]);

  useEffect(() => {
    const c = canvasRef.current!;
    const ro = new ResizeObserver(() => setSize({ w: c.clientWidth, h: c.clientHeight }));
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  // Field views: redraw when anything changes.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !size.w || activeMode === "force") return;
    const ctx = setup(c, size.w, size.h);
    drawField(ctx, size.w, size.h, activeMode, src, current, reversed, p);
    // src is derived from mode and reversed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, activeMode, current, reversed, p.x, p.y]);

  // Force view: the rod swings like a damped pendulum towards the angle where tan θ = F / mg.
  const target = useRef({ angle: 0, amps: 0, down: true, out: true, preview: false });
  useEffect(() => {
    target.current = { angle: rod.angleDeg, amps, down: activeDown, out: currentOut, preview: !!round };
  });
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !size.w || activeMode !== "force") return;
    const ctx = setup(c, size.w, size.h);
    let theta = 0;
    let omega = 0;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = target.current;
      omega += (-30 * (theta - t.angle) - 3 * omega) * dt;
      theta += omega * dt;
      const dpr = c.width / size.w;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size.w, size.h);
      drawRod(ctx, size.w, size.h, theta, t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [size, activeMode]);

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeMode === "force") return;
    const r = e.currentTarget.getBoundingClientRect();
    const { k, cx, cy } = frame(size.w, size.h, activeMode);
    setProbe({ x: (e.clientX - r.left - cx) / k, y: (cy - (e.clientY - r.top)) / k });
  };

  const switchMode = (m: MagnetMode) => {
    setMode(m);
    setProbe(null);
  };

  const dirLabel =
    activeMode === "wire"
      ? reversed
        ? "into the page ⊗"
        : "out of the page ⊙"
      : activeMode === "force"
        ? currentOut
          ? "towards you ⊙"
          : "away from you ⊗"
        : reversed
          ? "top ⊗, bottom ⊙"
          : "top ⊙, bottom ⊗";

  const aria =
    activeMode === "force"
      ? `A metal rod hangs between the poles of a magnet, north pole ${activeDown ? "on top" : "below"}. Current flows ${currentOut ? "towards you" : "away from you"} at ${amps} A. ${rod.dir === 0 ? "The rod hangs straight." : `The rod is pushed to the ${rod.dir > 0 ? "right" : "left"}.`}`
      : activeMode === "wire"
        ? `Compass needles and circular field lines around a straight wire carrying ${current} A ${reversed ? "into" : "out of"} the page. The field goes ${reversed ? "clockwise" : "anticlockwise"}.`
        : activeMode === "loop"
          ? `Field lines and compass needles around a circular loop seen edge-on, carrying ${current} A. Inside the loop the field points ${reversed ? "left" : "right"}.`
          : `Field lines and compass needles around a solenoid carrying ${current} A. Inside, the lines are straight and parallel. The ${northEnd} end acts as a north pole, like a bar magnet.`;

  return (
    <div className="flex flex-col gap-3 select-none">
      {!round && (
        <div className="grid grid-cols-4 gap-1 rounded-2xl bg-black/20 p-1 text-sm">
          {(["wire", "loop", "solenoid", "force"] as const).map((m) => (
            <button key={m} onClick={() => switchMode(m)} className={`rounded-xl py-2 ${activeMode === m ? "bg-white/10 text-white" : "text-white/50"}`}>
              {m === "wire" ? "Wire" : m === "loop" ? "Loop" : m === "solenoid" ? "Solenoid" : "Force"}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        onPointerDown={onPointer}
        className={`h-64 w-full touch-none rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80 ${activeMode === "force" ? "" : "cursor-crosshair"}`}
        role="img"
        aria-label={aria}
      />

      {activeMode !== "force" ? (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
              <div className="text-[11px] uppercase tracking-wider text-white/50">Field at the marker</div>
              <div className="font-display text-lg tabular-nums">{fmtField(probeB.b)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
              <div className="text-[11px] uppercase tracking-wider text-white/50">
                {activeMode === "solenoid" ? "North pole" : "Marker distance"}
              </div>
              <div className="font-display text-lg tabular-nums">
                {activeMode === "solenoid" ? `${northEnd} end` : `${distanceToNearest(src, p).toFixed(1)} cm`}
              </div>
            </div>
          </div>
          <p className="-mt-1 text-center text-xs text-white/40">Tap the picture to move the marker. Red needle tips point north.</p>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
            <div className="text-[11px] uppercase tracking-wider text-white/50">Force on rod</div>
            <div className="font-display text-lg tabular-nums">{round && guess === null ? "?" : `${(rod.force * 1000).toFixed(0)} mN`}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-2">
            <div className="text-[11px] uppercase tracking-wider text-white/50">Rod moves</div>
            <div className="font-display text-lg">{rod.dir === 0 ? (round ? "?" : "not at all") : rod.dir > 0 ? "right →" : "← left"}</div>
          </div>
        </div>
      )}

      {round ? (
        guess === null ? (
          <div className="grid grid-cols-2 gap-2">
            {([-1, 1] as const).map((d) => (
              <button
                key={d}
                className="rounded-xl border border-cyan-300/50 bg-cyan-300/10 px-3 py-3 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/20"
                onClick={() => {
                  setGuess(d);
                  onGuess?.(d);
                }}
              >
                {d < 0 ? "← It swings left" : "It swings right →"}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-white/60">Switch closed: {CHALLENGE_AMPS} A flows. Watch the rod.</p>
        )
      ) : (
        <>
          <label className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Current</span>
              <span className="tabular-nums text-white">{current.toFixed(1)} A</span>
            </div>
            <input type="range" className="range mt-2 w-full" min={0} max={5} step={0.5} value={current} onChange={(e) => setCurrent(Number(e.target.value))} />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              className={`flex-1 rounded-xl border px-3 py-2 text-sm whitespace-nowrap ${reversed ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
              onClick={() => setReversed(!reversed)}
            >
              Reverse current ({dirLabel})
            </button>
            {activeMode === "force" && (
              <button
                className={`flex-1 rounded-xl border px-3 py-2 text-sm whitespace-nowrap ${!fieldDown ? "border-cyan-300 bg-cyan-300/15" : "border-white/10 text-white/70"}`}
                onClick={() => setFieldDown(!fieldDown)}
              >
                Flip the magnet ({fieldDown ? "N on top" : "S on top"})
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function fmtField(t: number) {
  const uT = t * 1e6;
  if (uT >= 1000) return `${(uT / 1000).toFixed(2)} mT`;
  return `${uT < 10 ? uT.toFixed(1) : uT.toFixed(0)} µT`;
}

function distanceToNearest(src: LineCurrent[], p: { x: number; y: number }) {
  return Math.min(...src.map((w) => Math.hypot(p.x - w.x, p.y - w.y)));
}

function setup(c: HTMLCanvasElement, w: number, h: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  c.width = Math.round(w * dpr);
  c.height = Math.round(h * dpr);
  const ctx = c.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return ctx;
}

/** Pixels per cm and the centre of the view. */
function frame(w: number, h: number, mode: FieldMode) {
  const k = Math.min(w / VIEW[mode].x, h / VIEW[mode].y);
  return { k, cx: w / 2, cy: h / 2 };
}

function drawField(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  mode: FieldMode,
  src: LineCurrent[],
  amps: number,
  reversed: boolean,
  probe: { x: number; y: number },
) {
  const { k, cx, cy } = frame(w, h, mode);
  const X = (cm: number) => cx + cm * k;
  const Y = (cm: number) => cy - cm * k;
  const toCm = (px: number, py: number) => ({ x: (px - cx) / k, y: (cy - py) / k });
  const nearWire = (x: number, y: number, r: number) => src.some((s) => Math.hypot(x - s.x, y - s.y) < r);

  // Coil outline, drawn faintly behind everything.
  ctx.strokeStyle = "rgba(251,191,36,0.35)";
  ctx.lineWidth = 2;
  if (mode === "loop") {
    ctx.beginPath();
    ctx.ellipse(X(0), Y(0), 0.45 * k, LOOP_RADIUS_CM * k, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (mode === "solenoid") {
    for (let i = 0; i < src.length; i += 2) {
      ctx.beginPath();
      ctx.ellipse(X(src[i].x), Y(0), 0.3 * k, SOLENOID.radiusCm * k, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Field lines: contours of the vector potential, by marching squares.
  if (amps > 0) {
    const cell = 4;
    const nx = Math.ceil(w / cell) + 1;
    const ny = Math.ceil(h / cell) + 1;
    const A = new Float64Array(nx * ny);
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const p = toCm(i * cell, j * cell);
        A[j * nx + i] = potentialAt(src, amps, p.x, p.y);
      }
    const step = LINE_STEP[mode];
    const arrows: { x: number; y: number }[] = [];
    ctx.strokeStyle = "rgba(103,232,249,0.55)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const arrowCandidates: { x: number; y: number }[] = [];
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        const px = i * cell;
        const py = j * cell;
        const c0 = toCm(px + cell / 2, py + cell / 2);
        if (nearWire(c0.x, c0.y, 0.45)) continue;
        const a = A[j * nx + i];
        const b = A[j * nx + i + 1];
        const c = A[(j + 1) * nx + i + 1];
        const d = A[(j + 1) * nx + i];
        const lo = Math.min(a, b, c, d);
        const hi = Math.max(a, b, c, d);
        for (let m = Math.ceil(lo / step - 0.5); (m + 0.5) * step <= hi; m++) {
          const v = (m + 0.5) * step;
          const pts: [number, number][] = [];
          const edge = (v1: number, v2: number, x1: number, y1: number, x2: number, y2: number) => {
            if (v1 < v !== v2 < v) {
              const t = (v - v1) / (v2 - v1);
              pts.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
            }
          };
          edge(a, b, px, py, px + cell, py);
          edge(b, c, px + cell, py, px + cell, py + cell);
          edge(c, d, px + cell, py + cell, px, py + cell);
          edge(d, a, px, py + cell, px, py);
          for (let q = 0; q + 1 < pts.length; q += 2) {
            ctx.moveTo(pts[q][0], pts[q][1]);
            ctx.lineTo(pts[q + 1][0], pts[q + 1][1]);
            if ((i + j) % 7 === 0) arrowCandidates.push({ x: (pts[q][0] + pts[q + 1][0]) / 2, y: (pts[q][1] + pts[q + 1][1]) / 2 });
          }
        }
      }
    ctx.stroke();
    // Arrowheads along the lines, spread out so they do not crowd.
    ctx.fillStyle = "rgba(103,232,249,0.9)";
    for (const p of arrowCandidates) {
      if (p.x < 10 || p.x > w - 10 || p.y < 10 || p.y > h - 10) continue;
      if (arrows.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 46)) continue;
      const cm = toCm(p.x, p.y);
      if (nearWire(cm.x, cm.y, 0.8)) continue;
      arrows.push(p);
      const f = fieldAt(src, amps, cm.x, cm.y);
      const ang = Math.atan2(-f.by, f.bx);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(-4, -4);
      ctx.lineTo(-4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // Compass needles on a grid. With no current they point north (up), along Earth's field.
  const sp = Math.max(32, Math.min(48, w / 11));
  // Needle brightness is compared with the field at the default marker.
  const ref = fieldAt(src, amps || 1, DEFAULT_PROBE[mode].x, DEFAULT_PROBE[mode].y).b;
  for (let py = sp / 2 + 2; py < h; py += sp)
    for (let px = sp / 2 + 2; px < w; px += sp) {
      const cm = toCm(px, py);
      if (nearWire(cm.x, cm.y, 0.7)) continue;
      let ang = -Math.PI / 2;
      let alpha = 0.7;
      if (amps > 0) {
        const f = fieldAt(src, amps, cm.x, cm.y);
        ang = Math.atan2(-f.by, f.bx);
        alpha = Math.max(0.25, Math.min(1, 0.55 + 0.25 * Math.log10(f.b / ref)));
      }
      drawNeedle(ctx, px, py, ang, sp * 0.28, alpha);
    }

  // Wires.
  for (const s of src) drawCurrent(ctx, X(s.x), Y(s.y), 7, s.dir);

  // Marker.
  const mx = X(probe.x);
  const my = Y(probe.y);
  ctx.strokeStyle = "#f0abfc";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(mx, my, 6, 0, Math.PI * 2);
  ctx.moveTo(mx - 10, my);
  ctx.lineTo(mx + 10, my);
  ctx.moveTo(mx, my - 10);
  ctx.lineTo(mx, my + 10);
  ctx.stroke();

  // Labels.
  ctx.font = "11px system-ui, sans-serif";
  ctx.textBaseline = "alphabetic";
  label(ctx, amps === 0 ? "No current: needles point north" : mode === "wire" ? (reversed ? "Current into the page ⊗" : "Current out of the page ⊙") : "⊙ out of page   ⊗ into page", 8, h - 8, "left");
  if (mode === "solenoid" && amps > 0) {
    const north = solenoidNorthEnd(reversed);
    const xr = X(SOLENOID.lengthCm / 2) + 12;
    const xl = X(-SOLENOID.lengthCm / 2) - 12;
    ctx.font = "bold 15px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#f87171";
    ctx.fillText("N", north === "right" ? xr : xl, Y(0) - SOLENOID.radiusCm * k - 8);
    ctx.fillStyle = "#60a5fa";
    ctx.fillText("S", north === "right" ? xl : xr, Y(0) - SOLENOID.radiusCm * k - 8);
    ctx.textAlign = "left";
  }
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, align: CanvasTextAlign) {
  ctx.textAlign = align;
  const m = ctx.measureText(text).width;
  const x0 = align === "left" ? x : align === "right" ? x - m : x - m / 2;
  ctx.fillStyle = "rgba(10,13,28,0.8)";
  ctx.fillRect(x0 - 4, y - 12, m + 8, 16);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(text, x, y);
  ctx.textAlign = "left";
}

function drawNeedle(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, len: number, alpha: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.moveTo(len, 0);
  ctx.lineTo(0, -2.6);
  ctx.lineTo(0, 2.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#e2e8f0";
  ctx.beginPath();
  ctx.moveTo(-len, 0);
  ctx.lineTo(0, -2.6);
  ctx.lineTo(0, 2.6);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** A wire end-on: ⊙ current out of the page (arrow tip), ⊗ into it (arrow tail). */
function drawCurrent(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, dir: number) {
  ctx.fillStyle = "#fbbf24";
  ctx.strokeStyle = "#78350f";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#451a03";
  ctx.fillStyle = "#451a03";
  ctx.lineWidth = 2;
  if (dir > 0) {
    ctx.beginPath();
    ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const d = r * 0.55;
    ctx.beginPath();
    ctx.moveTo(x - d, y - d);
    ctx.lineTo(x + d, y + d);
    ctx.moveTo(x + d, y - d);
    ctx.lineTo(x - d, y + d);
    ctx.stroke();
  }
}

function drawRod(ctx: CanvasRenderingContext2D, w: number, h: number, thetaDeg: number, t: { amps: number; down: boolean; out: boolean; preview: boolean }) {
  const cx = w / 2;
  const pivotY = 14;
  const len = h * 0.56;
  const poleW = Math.min(w * 0.6, 260);
  const topPole = { y0: h * 0.24, y1: h * 0.42 };
  const botPole = { y0: h * 0.8, y1: h * 0.96 };
  const restY = pivotY + len;

  // Stand.
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 60, pivotY);
  ctx.lineTo(cx + 60, pivotY);
  ctx.stroke();

  // Poles. North red, south blue.
  const pole = (y0: number, y1: number, north: boolean) => {
    ctx.fillStyle = north ? "rgba(239,68,68,0.75)" : "rgba(59,130,246,0.75)";
    ctx.fillRect(cx - poleW / 2, y0, poleW, y1 - y0);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(north ? "N" : "S", cx - poleW / 2 + 10, (y0 + y1) / 2);
    ctx.textBaseline = "alphabetic";
  };
  pole(topPole.y0, topPole.y1, t.down);
  pole(botPole.y0, botPole.y1, !t.down);

  // Uniform field lines between the poles, N to S.
  ctx.strokeStyle = "rgba(103,232,249,0.4)";
  ctx.fillStyle = "rgba(103,232,249,0.8)";
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    const x = cx - poleW / 2 + (poleW * (i + 0.5)) / 6;
    ctx.beginPath();
    ctx.moveTo(x, topPole.y1);
    ctx.lineTo(x, botPole.y0);
    ctx.stroke();
    if (Math.abs(x - cx) < 20) continue;
    const ym = (topPole.y1 + botPole.y0) / 2 + (i % 2 ? 18 : -18);
    const s = t.down ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(x, ym + 5 * s);
    ctx.lineTo(x - 4, ym - 4 * s);
    ctx.lineTo(x + 4, ym - 4 * s);
    ctx.closePath();
    ctx.fill();
  }
  ctx.font = "11px system-ui, sans-serif";
  label(ctx, `B ${t.down ? "↓" : "↑"}`, cx + poleW / 2 + 8, (topPole.y1 + botPole.y0) / 2 + 4, "left");

  // Thread and rod (seen end-on). The thread passes in front of the top pole.
  const th = (thetaDeg * Math.PI) / 180;
  const rx = cx + len * Math.sin(th);
  const ry = pivotY + len * Math.cos(th);
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, pivotY);
  ctx.lineTo(rx, ry);
  ctx.stroke();
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.moveTo(cx, restY - 20);
  ctx.lineTo(cx, restY + 20);
  ctx.stroke();
  ctx.setLineDash([]);
  if (t.amps > 0 || t.preview) drawCurrent(ctx, rx, ry, 11, t.out ? 1 : -1);
  else {
    ctx.fillStyle = "#9ca3af";
    ctx.beginPath();
    ctx.arc(rx, ry, 11, 0, Math.PI * 2);
    ctx.fill();
  }

  // Force arrow.
  if (t.amps > 0) {
    const target = rodForce(t.amps, t.down, t.out);
    const L = 18 + target.force * 1200;
    const sx = rx + target.dir * 15;
    ctx.strokeStyle = "#a3e635";
    ctx.fillStyle = "#a3e635";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx, ry);
    ctx.lineTo(sx + target.dir * L, ry);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx + target.dir * (L + 8), ry);
    ctx.lineTo(sx + target.dir * L, ry - 6);
    ctx.lineTo(sx + target.dir * L, ry + 6);
    ctx.closePath();
    ctx.fill();
    ctx.font = "bold 12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("F", sx + target.dir * (L / 2), ry - 9);
    ctx.textAlign = "left";
  }
  ctx.font = "11px system-ui, sans-serif";
  const dirText = t.out ? "towards you ⊙" : "away from you ⊗";
  label(ctx, t.amps > 0 ? `Current ${dirText}` : t.preview ? `Current will flow ${dirText}` : "Switch open: no current", 8, h * 0.17, "left");
}
