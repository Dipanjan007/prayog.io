"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import FareLab, { type FareReading } from "@/components/sim/FareLab";
import { FARE_CHARTS, lesson } from "@/content/lessons/linear-polynomials";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [knobs, setKnobs] = useState({ rate: false, base: false });
  const [zeroLines, setZeroLines] = useState<string[]>([]);
  const [round, setRound] = useState<number | null>(null);
  const [matched, setMatched] = useState(0);

  const lastReading = useRef<FareReading | null>(null);
  // The last fare reading the tasks saw, to tell which knob moved.
  const lastFare = useRef<{ rate: number; base: number } | null>(null);
  const onReading = useCallback(
    (r: FareReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "chart" && r.ok) {
          const done = round + 1;
          setMatched((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === FARE_CHARTS.length) badge("meter-master");
          }
          // Leave the match on screen for a moment before the next chart.
          setTimeout(() => setRound(done < FARE_CHARTS.length ? done : null), 1400);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "fare") {
        const prev = lastFare.current;
        lastFare.current = { rate: r.rate, base: r.base };
        if (prev) {
          const rate = prev.rate !== r.rate && prev.base === r.base;
          const base = prev.base !== r.base && prev.rate === r.rate;
          if (rate || base)
            setKnobs((k) => {
              const next = { rate: k.rate || rate, base: k.base || base };
              if (next.rate === k.rate && next.base === k.base) return k;
              if (next.rate && next.base) queueMicrotask(() => !isDone("task:knobs") && finishTask("task:knobs"));
              return next;
            });
        }
        if (!isDone("task:fare") && r.base === 30 && r.rate === 15 && r.km === 4 && r.fare === 90) finishTask("task:fare");
      } else if (r.mode === "graph") {
        if (r.zero === 3) {
          const key = `${r.a},${r.b}`;
          setZeroLines((prev) => {
            if (prev.includes(key)) return prev;
            const next = [...prev, key];
            if (next.length === 2) queueMicrotask(() => !isDone("task:zero") && finishTask("task:zero"));
            return next;
          });
        }
        if (!isDone("task:flat") && r.a === 0 && r.b !== 0) finishTask("task:flat");
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

  const chart = round !== null ? FARE_CHARTS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<FareLab key={round ?? "free"} onReading={onReading} chart={chart} />}
      simNote="Fare draws the meter's fare against km. Graph draws any p(x) = ax + b on a grid from −10 to 10."
      taskExtras={{
        "task:knobs": (
          <div className="mt-2 text-xs text-white/50">
            {knobs.rate ? "✓" : "○"} Only the rate moved · {knobs.base ? "✓" : "○"} Only the base fare moved
          </div>
        ),
        "task:zero": <div className="mt-2 text-xs text-white/50">Lines through x = 3: {zeroLines.length} of 2</div>,
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {chart ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Chart {round! + 1} of {FARE_CHARTS.length}: {chart.name}
              </div>
              <div className="mt-1 text-xs">{chart.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {matched ? "Match the charts again" : "Match the fare charts"}
            </button>
          )}
          {matched > 0 && (
            <div className="mt-1 text-xs">
              Charts matched: {matched} of {FARE_CHARTS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
