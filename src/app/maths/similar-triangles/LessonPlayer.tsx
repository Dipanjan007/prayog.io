"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import SimilarLab, { type SimilarReading } from "@/components/sim/SimilarLab";
import { MYSTERIES, lesson } from "@/content/lessons/similar-triangles";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [scales, setScales] = useState({ k2: false, kHalf: false });
  const [spots, setSpots] = useState<number[]>([]);
  const [round, setRound] = useState<number | null>(null);
  const [found, setFound] = useState(0);

  const lastReading = useRef<SimilarReading | null>(null);
  const onReading = useCallback(
    (r: SimilarReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "guess" && r.ok) {
          const done = round + 1;
          setFound((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === MYSTERIES.length) badge("thales-shadow");
          }
          // Leave "Spot on!" on screen for a moment before the next height.
          setTimeout(() => setRound(done < MYSTERIES.length ? done : null), 1600);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "scale") {
        const k2 = r.k === 2;
        const kHalf = r.k === 0.5;
        if (k2 || kHalf)
          setScales((s) => {
            const next = { k2: s.k2 || k2, kHalf: s.kHalf || kHalf };
            if (next.k2 === s.k2 && next.kHalf === s.kHalf) return s;
            if (next.k2 && next.kHalf) queueMicrotask(() => !isDone("task:scale") && finishTask("task:scale"));
            return next;
          });
      } else if (r.mode === "bpt") {
        if (r.tilt === 0 && r.match)
          setSpots((s) => {
            if (s.includes(r.t) || s.length >= 2) return s;
            const next = [...s, r.t];
            if (next.length >= 2) queueMicrotask(() => !isDone("task:bpt") && finishTask("task:bpt"));
            return next;
          });
        if (!isDone("task:converse") && r.tilt !== 0 && r.onSide && !r.match) finishTask("task:converse");
      } else if (r.mode === "shadow") {
        if (!isDone("task:shadow") && r.sun === 45) finishTask("task:shadow");
      }
    },
    [round, isDone, finishTask, challengeStars, badge],
  );

  // The sim only reports changes, so replay what it shows now once the prediction is locked in
  // and again once the ideas are done, so a state set earlier still counts.
  const replay = useRef(onReading);
  useEffect(() => {
    replay.current = onReading;
  }, [onReading]);
  const predicted = api.done.has("predict");
  const ideasDone = api.done.has("ideas");
  useEffect(() => {
    if (predicted && lastReading.current) replay.current(lastReading.current);
  }, [predicted, ideasDone]);

  const mystery = round !== null ? MYSTERIES[round] : null;
  const tick = (v: boolean) => (v ? "✓" : "○");

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<SimilarLab key={round ?? "free"} onReading={onReading} mystery={mystery} />}
      simNote="Lengths in Scale and Parallel line are in cm, rounded to 2 decimal places; ratios are shown to 3. In Shadows the stick is drawn bigger than the building so you can see its triangle."
      taskExtras={{
        "task:scale": (
          <div className="mt-2 text-xs text-white/50">
            {tick(scales.k2)} k = 2 · {tick(scales.kHalf)} k = 0.5
          </div>
        ),
        "task:bpt": (
          <div className="mt-2 text-xs text-white/50">
            {tick(spots.length >= 1)} First place for D · {tick(spots.length >= 2)} Second place for D
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {mystery ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Height {round! + 1} of {MYSTERIES.length}: {mystery.emoji} {mystery.label}
              </div>
              <div className="mt-1 text-xs">{mystery.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {found ? "Measure with shadows again" : "Measure with shadows"}
            </button>
          )}
          {found > 0 && (
            <div className="mt-1 text-xs">
              Heights found: {found} of {MYSTERIES.length}
            </div>
          )}
        </div>
      }
    />
  );
}
