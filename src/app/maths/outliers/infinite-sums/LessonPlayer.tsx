"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import InfiniteSumsLab, { type SumsReading } from "@/components/sim/InfiniteSumsLab";
import { SUM_ROUNDS, lesson } from "@/content/lessons/infinite-sums";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [grow, setGrow] = useState({ harmonic: false, halves: false });
  const [geo, setGeo] = useState({ six: false, grows: false });
  const [round, setRound] = useState<number | null>(null);
  const [settled, setSettled] = useState(0);

  const lastReading = useRef<SumsReading | null>(null);
  const onReading = useCallback(
    (r: SumsReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "round" && r.ok) {
          const done = round + 1;
          setSettled((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === SUM_ROUNDS.length) badge("series-seer");
          }
          // Leave the running total on screen for a moment before the next sum.
          setTimeout(() => setRound(done < SUM_ROUNDS.length ? done : null), 2200);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "laddoo") {
        if (!isDone("task:laddoo") && r.bites >= 10) finishTask("task:laddoo");
      } else if (r.mode === "zeno") {
        if (!isDone("task:zeno") && r.stage >= 5) finishTask("task:zeno");
      } else if (r.mode === "grow") {
        const harmonic = r.series === "harmonic" && r.sum > 5;
        const halves = r.series === "halves" && r.n >= 20;
        if (harmonic || halves)
          setGrow((s) => {
            const next = { harmonic: s.harmonic || harmonic, halves: s.halves || halves };
            if (next.harmonic === s.harmonic && next.halves === s.halves) return s;
            if (next.harmonic && next.halves) queueMicrotask(() => !isDone("task:grow") && finishTask("task:grow"));
            return next;
          });
      } else if (r.mode === "geo") {
        if (r.at6 || r.grows)
          setGeo((s) => {
            const next = { six: s.six || r.at6, grows: s.grows || r.grows };
            if (next.six === s.six && next.grows === s.grows) return s;
            if (next.six && next.grows) queueMicrotask(() => !isDone("task:geo") && finishTask("task:geo"));
            return next;
          });
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

  const sum = round !== null ? SUM_ROUNDS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<InfiniteSumsLab key={round ?? "free"} onReading={onReading} round={sum} />}
      simNote="Answers can be whole numbers, decimals or fractions like 25/2. In Grow or settle, each press of + adds a bigger jump of terms, so you can reach 10,000 terms quickly."
      taskExtras={{
        "task:grow": (
          <div className="mt-2 text-xs text-white/50">
            {grow.harmonic ? "✓" : "○"} Harmonic past 5 · {grow.halves ? "✓" : "○"} Halves with 20 or more terms
          </div>
        ),
        "task:geo": (
          <div className="mt-2 text-xs text-white/50">
            {geo.six ? "✓" : "○"} Settles at exactly 6 · {geo.grows ? "✓" : "○"} r of 1 or more
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {sum ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Sum {round! + 1} of {SUM_ROUNDS.length}: {sum.name}
              </div>
              <div className="mt-1 text-xs">{sum.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {settled ? "Predict the sums again" : "Predict the sums"}
            </button>
          )}
          {settled > 0 && (
            <div className="mt-1 text-xs">
              Sums settled: {settled} of {SUM_ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
