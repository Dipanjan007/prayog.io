"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/** A lightweight decorative flow around a wing for the home page (not the real solver). */
export default function HeroTunnel() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Potential flow around a cylinder, mapped to look like air bending over a shape.
    const N = 520;
    const ps = Array.from({ length: N }, () => ({ x: Math.random(), y: Math.random() }));
    const vel = (x: number, y: number) => {
      const cx = 0.42;
      const cy = 0.5;
      const R = 0.12;
      const dx = (x - cx) * (w / h);
      const dy = y - cy;
      const r2 = dx * dx + dy * dy;
      if (r2 < R * R) return { u: 0, v: 0 };
      const k = (R * R) / (r2 * r2);
      return { u: 1 - k * (dx * dx - dy * dy), v: -2 * k * dx * dy };
    };
    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      ctx.fillStyle = "rgba(8,10,22,0.07)";
      ctx.fillRect(0, 0, w, h);
      ctx.lineWidth = 1.6;
      for (const p of ps) {
        const { u, v } = vel(p.x, p.y);
        const nx = p.x + u * 0.003;
        const ny = p.y + v * 0.003 * (w / h);
        const speed = Math.hypot(u, v);
        ctx.strokeStyle = speed > 1.3 ? "rgba(34,211,238,0.9)" : speed < 0.6 ? "rgba(251,146,60,0.9)" : "rgba(167,139,250,0.7)";
        ctx.beginPath();
        ctx.moveTo(p.x * w, p.y * h);
        ctx.lineTo(nx * w, ny * h);
        ctx.stroke();
        p.x = nx;
        p.y = ny;
        if (p.x > 1 || speed === 0) {
          p.x = Math.random() * 0.05;
          p.y = Math.random();
        }
      }
      const R = 0.12 * h;
      ctx.fillStyle = "#eef1ff";
      ctx.beginPath();
      ctx.arc(0.42 * w, 0.5 * h, R - 2, 0, Math.PI * 2);
      ctx.fill();
      if (reduce) cancelAnimationFrame(raf);
    };
    frame();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <Link href="/learn/pressure-winds" className="group relative block overflow-hidden rounded-[2rem] border border-white/10">
      <canvas ref={ref} className="block aspect-[4/3] w-full bg-[#080a16]" aria-label="Air flowing around a ball" role="img" />
      <div className="glass absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl px-4 py-3">
        <div>
          <div className="text-xs text-white/50">Class 8 · Pressure, Winds, Storms, and Cyclones</div>
          <div className="font-display font-semibold">Why do storms rip roofs off?</div>
        </div>
        <span className="text-cyan-300 transition group-hover:translate-x-1">→</span>
      </div>
      <div className="animate-floaty glass absolute right-4 top-4 rounded-full px-3 py-1 text-xs">
        <span className="text-cyan-300">fast air</span> · <span className="text-orange-300">slow air</span>
      </div>
    </Link>
  );
}
