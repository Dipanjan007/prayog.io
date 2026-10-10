"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import SequenceLab, { type SeqReading } from "@/components/sim/SequenceLab";
import { FORECASTS, lesson } from "@/content/lessons/sequences";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [round, setRound] = useState<number | null>(null);
  const [solved, setSolved] = useState(0);

  const lastReading = useRef<SeqReading | null>(null);
  const onReading = useCallback(
    (r: SeqReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "forecast" && r.ok) {
          const done = round + 1;
          setSolved((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === FORECASTS.length) badge("fortune-teller");
          }
          // Leave the success on screen for a moment before the next pattern.
          setTimeout(() => setRound(done < FORECASTS.length ? done : null), 1600);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "build") {
        if (!isDone("task:diff") && r.a === 5 && r.d === 3 && r.n >= 4) finishTask("task:diff");
        if (!isDone("task:nth") && r.a === 20 && r.d === 4 && r.n === 10) finishTask("task:nth");
        if (!isDone("task:sum") && r.pair && r.a === 1 && r.d === 1 && r.n === 10) finishTask("task:sum");
      } else if (r.mode === "double") {
        if (!isDone("task:double") && r.s === 1 && r.weeks >= 10) finishTask("task:double");
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

  const forecast = round !== null ? FORECASTS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<SequenceLab key={round ?? "free"} onReading={onReading} forecast={forecast} />}
      simNote="Each bar is one term: the cyan part is the first term a, and each violet block adds the difference d once. Pair up stacks a backwards copy on top."
      challengeBody={
        <div className="text-sm text-white/60">
          {forecast ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Forecast {round! + 1} of {FORECASTS.length}: {forecast.name}
              </div>
              <div className="mt-1 text-xs">{forecast.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {solved ? "Make the forecasts again" : "Start forecasting"}
            </button>
          )}
          {solved > 0 && (
            <div className="mt-1 text-xs">
              Forecasts right: {solved} of {FORECASTS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
