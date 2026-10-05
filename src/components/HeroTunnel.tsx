"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { InkArrow } from "@/components/Ink";

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
    const N = 380;
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
      ctx.fillStyle = "rgba(19,17,15,0.08)";
      ctx.fillRect(0, 0, w, h);
      ctx.lineWidth = 1.6;
      for (const p of ps) {
        const { u, v } = vel(p.x, p.y);
        const nx = p.x + u * 0.003;
        const ny = p.y + v * 0.003 * (w / h);
        const speed = Math.hypot(u, v);
        ctx.strokeStyle = speed > 1.3 ? "rgba(236,182,119,0.9)" : speed < 0.6 ? "rgba(139,163,199,0.85)" : "rgba(240,233,221,0.5)";
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
      ctx.fillStyle = "#f0e9dd";
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
    <Link href="/learn/pressure-winds" className="group block">
      <figure>
      <div className="relative overflow-hidden rounded-[1.75rem] border border-line bg-well">
        <canvas ref={ref} className="block aspect-[4/3] w-full" aria-label="Air flowing around a ball" role="img" />
        <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-1 text-sm sm:left-5 sm:top-5">
          <span className="flex items-center gap-2 font-display italic text-saffron-300">
            <span className="h-0.5 w-5 rounded-full bg-saffron-300" aria-hidden /> fast air
          </span>
          <span className="flex items-center gap-2 font-display italic text-[#a9bcd8]">
            <span className="h-0.5 w-5 rounded-full bg-[#8ba3c7]" aria-hidden /> slow air
          </span>
        </div>
        <div className="pointer-events-none absolute right-[8%] top-[9%] hidden items-start gap-1 text-cream/80 sm:flex">
          <span className="font-display mt-0.5 text-sm italic">air speeds up over the top</span>
          <InkArrow className="mt-3 h-8 w-12 -scale-x-100 rotate-[20deg]" />
        </div>
      </div>
      <figcaption className="mt-4 flex items-center justify-between gap-4 px-1">
        <div>
          <div className="eyebrow">Class 8 · Pressure, Winds, Storms, and Cyclones</div>
          <div className="font-display mt-1 text-xl">Why do storms rip roofs off?</div>
        </div>
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line-strong text-saffron-300 transition-transform group-hover:translate-x-1"
          aria-hidden
        >
          →
        </span>
      </figcaption>
      </figure>
    </Link>
  );
}
