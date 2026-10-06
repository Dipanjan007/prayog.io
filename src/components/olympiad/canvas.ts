"use client";

import { useEffect, useRef, useState } from "react";

export type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void;

/** Longest a run plays on screen; longer runs are sped up to fit. */
export const MAX_SHOW_S = 5;

export function speedFor(duration: number) {
  return Math.max(1, duration / MAX_SHOW_S);
}

/**
 * Canvas with ResizeObserver + DPR scaling and a play-once animation.
 * Changing `runKey` (to a value above 0) plays from t = 0 to `duration`, then calls onDone.
 * When not playing, the canvas shows t = 0 (before any run) or the final frame.
 */
export function useSimCanvas(draw: Draw, duration: number, runKey: number, onDone?: () => void) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [t, setT] = useState(0);
  const drawRef = useRef(draw);
  const doneRef = useRef(onDone);
  useEffect(() => {
    drawRef.current = draw;
    doneRef.current = onDone;
  });

  useEffect(() => {
    const c = ref.current!;
    const ro = new ResizeObserver(() => setSize({ w: c.clientWidth, h: c.clientHeight }));
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  // Play a run whenever runKey changes.
  useEffect(() => {
    if (runKey <= 0) return;
    const speed = speedFor(duration);
    let raf = 0;
    let start = 0;
    const frame = (now: number) => {
      if (!start) start = now;
      const tt = ((now - start) / 1000) * speed;
      if (tt >= duration) {
        setT(duration);
        doneRef.current?.();
        return;
      }
      setT(tt);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [runKey, duration]);

  const shownT = runKey > 0 ? t : 0;

  // Paint on every render (cheap): new size, new time or new scene.
  useEffect(() => {
    const c = ref.current;
    if (!c || !size.w) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.round(size.w * dpr);
    const H = Math.round(size.h * dpr);
    if (c.width !== W || c.height !== H) {
      c.width = W;
      c.height = H;
    }
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);
    drawRef.current(ctx, size.w, size.h, shownT);
  });

  return { ref, t: shownT, speed: speedFor(duration) };
}

/** Maps a world box (metres, y up) into the canvas with equal scale on both axes and padding. */
export function fitWorld(w: number, h: number, box: { x0: number; x1: number; y0: number; y1: number }, pad = { l: 16, r: 16, t: 16, b: 24 }) {
  const k = Math.min((w - pad.l - pad.r) / (box.x1 - box.x0), (h - pad.t - pad.b) / (box.y1 - box.y0));
  const ox = pad.l + (w - pad.l - pad.r - k * (box.x1 - box.x0)) / 2;
  // Anchored to the bottom so spare height goes to the sky, not under the ground.
  const oy = h - pad.b;
  return { k, X: (x: number) => ox + (x - box.x0) * k, Y: (y: number) => oy - (y - box.y0) * k };
}

/** Text kept inside the canvas. align: where x sits relative to the text. */
export function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  w: number,
  opts: { color?: string; size?: number; align?: "left" | "center" | "right"; bold?: boolean } = {},
) {
  ctx.font = `${opts.bold ? "600 " : ""}${opts.size ?? 11}px ui-sans-serif, system-ui, sans-serif`;
  const tw = ctx.measureText(text).width;
  let left = opts.align === "center" ? x - tw / 2 : opts.align === "right" ? x - tw : x;
  left = Math.max(4, Math.min(w - tw - 4, left));
  ctx.fillStyle = opts.color ?? "rgba(255,255,255,0.75)";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, left, y);
}

export function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width = 2) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 2) return;
  const head = Math.min(8, len * 0.4);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - head * 0.6 * Math.cos(a), y2 - head * 0.6 * Math.sin(a));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(a - 0.45), y2 - head * Math.sin(a - 0.45));
  ctx.lineTo(x2 - head * Math.cos(a + 0.45), y2 - head * Math.sin(a + 0.45));
  ctx.closePath();
  ctx.fill();
}

export function dashed(ctx: CanvasRenderingContext2D, pts: [number, number][], color: string, width = 1.5) {
  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.restore();
}

export function stopwatch(ctx: CanvasRenderingContext2D, w: number, t: number, goal?: number, speed = 1) {
  const sp = speed > 1.05 ? `  ×${speed < 10 ? speed.toFixed(1) : Math.round(speed)}` : "";
  const s = `t = ${t.toFixed(2)} s${goal !== undefined ? ` / goal ${goal} s` : ""}${sp}`;
  // On narrow canvases the clock sits on a second line so it never covers the left readout.
  label(ctx, s, w - 8, w < 480 ? 32 : 14, w, { align: "right", color: "rgba(165,243,252,0.9)", size: 12, bold: true });
}

export const C = {
  ground: "rgba(255,255,255,0.35)",
  grass: "rgba(163,230,53,0.12)",
  track: "rgba(255,255,255,0.7)",
  ball: "#facc15",
  cyan: "#67e8f9",
  pink: "#f472b6",
  violet: "#a78bfa",
  orange: "#fb923c",
  lime: "#a3e635",
  rose: "#fb7185",
  dim: "rgba(255,255,255,0.45)",
  faint: "rgba(255,255,255,0.15)",
};
