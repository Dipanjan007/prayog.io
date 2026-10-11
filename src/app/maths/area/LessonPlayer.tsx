"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import AreaLab, { type AreaReading } from "@/components/sim/AreaLab";
import { PLOTS, lesson } from "@/content/lessons/area";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [corners, setCorners] = useState<number[]>([]);
  const [round, setRound] = useState<number | null>(null);
  const [marked, setMarked] = useState(0);

  const lastReading = useRef<AreaReading | null>(null);
  const onReading = useCallback(
    (r: AreaReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "plot" && r.ok) {
          const done = round + 1;
          setMarked((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === PLOTS.length) badge("land-surveyor");
          }
          // Leave the approved plot on screen for a moment before the next one.
          setTimeout(() => setRound(done < PLOTS.length ? done : null), 1400);
        }
        return;
      }
      if (!isDone("predict") || r.mode === "plot") return;
      const sh = r.shape;
      if (sh.kind === "shear" && sh.b === 6 && sh.h === 4) {
        if (!isDone("task:count") && sh.s === 0) finishTask("task:count");
        if (!isDone("task:shear") && Math.abs(sh.s) >= 2) finishTask("task:shear");
      } else if (sh.kind === "triangle" && sh.b === 6 && sh.h === 4) {
        if (!isDone("task:triangle") && r.copy) finishTask("task:triangle");
        const p = sh.p;
        setCorners((prev) => {
          if (prev.includes(p)) return prev;
          const next = [...prev, p];
          if (next.length === 3) queueMicrotask(() => !isDone("task:apex") && finishTask("task:apex"));
          return next;
        });
      } else if (sh.kind === "trapezium" && sh.a === 7 && sh.c === 3 && sh.h === 4 && r.copy) {
        if (!isDone("task:trap")) finishTask("task:trap");
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

  const plot = round !== null ? PLOTS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<AreaLab key={round ?? "free"} onReading={onReading} plot={plot} />}
      simNote="Every corner sits on a peg, one unit apart. Cyan squares are whole; violet squares are cut pieces. The dashed yellow line is the height, always at a right angle to the base."
      taskExtras={{
        "task:apex": <div className="mt-2 text-xs text-white/50">Top corner places tried: {Math.min(corners.length, 3)} of 3</div>,
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {plot ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Plot {round! + 1} of {PLOTS.length}: {plot.name}
              </div>
              <div className="mt-1 text-xs">{plot.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {marked ? "Survey the plots again" : "Meet the surveyor"}
            </button>
          )}
          {marked > 0 && (
            <div className="mt-1 text-xs">
              Plots approved: {marked} of {PLOTS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
