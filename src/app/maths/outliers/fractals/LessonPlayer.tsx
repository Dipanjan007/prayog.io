"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import FractalLab, { type FractalReading } from "@/components/sim/FractalLab";
import { FRACTAL_ROUNDS, lesson } from "@/content/lessons/fractals";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [round, setRound] = useState<number | null>(null);
  const [counted, setCounted] = useState(0);

  const lastReading = useRef<FractalReading | null>(null);
  const onReading = useCallback(
    (r: FractalReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "round" && r.ok) {
          const done = round + 1;
          setCounted((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === FRACTAL_ROUNDS.length) badge("koch-counter");
          }
          // Leave the drawn answer on screen for a moment before the next count.
          setTimeout(() => setRound(done < FRACTAL_ROUNDS.length ? done : null), 2200);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "sier") {
        if (r.step >= 5 && !isDone("task:sier")) finishTask("task:sier");
      } else if (r.mode === "koch") {
        if (r.step >= 4 && !isDone("task:koch")) finishTask("task:koch");
        if (r.perimeter > 1000 && !isDone("task:limit")) finishTask("task:limit");
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

  const count = round !== null ? FRACTAL_ROUNDS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<FractalLab key={round ?? "free"} onReading={onReading} round={count} />}
      simNote="The numbers are exact for every step up to 10. The pictures stop at step 7 (Sierpinski) and step 6 (Koch), because finer pieces are smaller than a pixel. The dashed circle goes round the starting triangle; the snowflake never leaves it."
      challengeBody={
        <div className="text-sm text-white/60">
          {count ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Count {round! + 1} of {FRACTAL_ROUNDS.length}: {count.name}
              </div>
              <div className="mt-1 text-xs">{count.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {counted ? "Count them again" : "Start counting"}
            </button>
          )}
          {counted > 0 && (
            <div className="mt-1 text-xs">
              Counts right: {counted} of {FRACTAL_ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
