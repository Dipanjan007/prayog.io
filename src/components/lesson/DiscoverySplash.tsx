"use client";

import { useEffect, useState } from "react";
import type { LessonDef } from "@/content/lessons/types";

/** How long the lab "loads" before it can be entered, and when it opens by itself. */
const LOAD_MS = 1000;
const AUTO_ENTER_MS = 10000;

/**
 * Shown for a moment as a lab opens: the scientist behind it, a fact and their
 * formula, so the wait teaches something.
 */
export default function DiscoverySplash({ lesson }: { lesson: LessonDef }) {
  const [open, setOpen] = useState(true);
  const [ready, setReady] = useState(false);
  const [filled, setFilled] = useState(false);
  const d = lesson.discovery;

  useEffect(() => {
    const fill = requestAnimationFrame(() => setFilled(true));
    const load = setTimeout(() => setReady(true), LOAD_MS);
    const auto = setTimeout(() => setOpen(false), AUTO_ENTER_MS);
    return () => {
      cancelAnimationFrame(fill);
      clearTimeout(load);
      clearTimeout(auto);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const onKey = (e: KeyboardEvent) => (e.key === "Escape" || e.key === "Enter") && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Meet ${d.scientist}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#070a14]/90 px-4 backdrop-blur-md"
    >
      <div className="glass w-full max-w-lg rounded-3xl p-6">
        <div className="text-[11px] uppercase tracking-wider text-violet-200/80">Meet the discoverer</div>
        <div className="font-display mt-2 text-2xl font-bold">{d.scientist}</div>
        <div className="text-sm text-white/50">{d.years}</div>
        <p className="mt-3 text-white/75">{d.fact}</p>
        <div className="mt-4 rounded-xl bg-black/30 px-4 py-3 font-mono text-lg text-cyan-200">{d.formula}</div>
        <p className="mt-2 text-sm text-white/60">{d.formulaNote}</p>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 ease-linear"
            style={{ width: filled ? "100%" : "0%", transition: `width ${LOAD_MS}ms linear` }}
          />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xs text-white/50">{ready ? "Lab ready" : `Loading ${lesson.title}…`}</span>
          <button className="btn-primary !px-4 !py-2 text-sm" disabled={!ready} onClick={() => setOpen(false)}>
            Enter the lab →
          </button>
        </div>
      </div>
    </div>
  );
}
