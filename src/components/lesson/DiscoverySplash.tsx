"use client";

import { useEffect, useState } from "react";
import type { LessonDef } from "@/content/lessons/types";

/** Reading pace for the bar: about 3 words a second, between 6 and 15 seconds. */
function readingMs(text: string) {
  const words = text.trim().split(/\s+/).length;
  return Math.min(15000, Math.max(6000, Math.round((words / 3) * 1000)));
}

/**
 * Shown as a lab opens: the scientist behind it, a fact and their formula.
 * The bar fills at reading pace, and the splash stays until the student taps
 * "Enter the lab" (or starts the lab again from the beginning).
 */
export default function DiscoverySplash({
  lesson,
  canRestart,
  onRestart,
}: {
  lesson: LessonDef;
  /** Show "Start from the beginning" when the student has done part of the lab before. */
  canRestart: boolean;
  onRestart: () => void;
}) {
  const d = lesson.discovery;
  const readMs = readingMs(`${d.fact} ${d.formulaNote}`);
  const [open, setOpen] = useState(true);
  const [ready, setReady] = useState(false);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const fill = requestAnimationFrame(() => setFilled(true));
    const read = setTimeout(() => setReady(true), readMs);
    return () => {
      cancelAnimationFrame(fill);
      clearTimeout(read);
    };
  }, [readMs]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Meet ${d.scientist}`}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#070a14]/90 px-4 py-6 backdrop-blur-md"
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
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
            style={{ width: filled ? "100%" : "0%", transition: `width ${readMs}ms linear` }}
          />
        </div>
        <div className="mt-2 text-xs text-white/50">{ready ? "Lab ready" : `Read the fact while ${lesson.title} gets ready…`}</div>
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          {canRestart && (
            <button className="btn-ghost !px-4 !py-2 text-sm" disabled={!ready} onClick={onRestart}>
              ↺ Start from the beginning
            </button>
          )}
          <button className="btn-primary !px-4 !py-2 text-sm" disabled={!ready} onClick={() => setOpen(false)}>
            Enter the lab →
          </button>
        </div>
      </div>
    </div>
  );
}
