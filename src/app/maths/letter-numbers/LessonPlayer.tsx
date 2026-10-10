"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import PatternLab, { type PatternReading } from "@/components/sim/PatternLab";
import { PATTERN_ROUNDS, lesson } from "@/content/lessons/letter-numbers";
import { useLesson } from "@/lib/useLesson";

/** A step at least this big counts as "a big step" for the mission. */
const BIG_STEP = 50;

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [steps, setSteps] = useState<number[]>([]);
  const [rules, setRules] = useState<string[]>([]);
  const [round, setRound] = useState<number | null>(null);
  const [cracked, setCracked] = useState(0);

  const lastReading = useRef<PatternReading | null>(null);
  const onReading = useCallback(
    (r: PatternReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "round" && r.ok) {
          const done = round + 1;
          setCracked((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === PATTERN_ROUNDS.length) badge("rule-maker");
          }
          // Leave "Yes!" on screen for a moment before the next pattern.
          setTimeout(() => setRound(done < PATTERN_ROUNDS.length ? done : null), 1600);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "build") {
        if (r.pattern === "squares" && r.n <= 4)
          setSteps((prev) => {
            if (prev.includes(r.n)) return prev;
            const next = [...prev, r.n];
            if (next.length === 4) queueMicrotask(() => !isDone("task:grow") && finishTask("task:grow"));
            return next;
          });
      } else if (r.mode === "rule" && r.ok) {
        setRules((prev) => {
          if (prev.includes(r.pattern)) return prev;
          const next = [...prev, r.pattern];
          if (next.length === 2) queueMicrotask(() => !isDone("task:rule") && finishTask("task:rule"));
          return next;
        });
        if (!isDone("task:big") && r.bigN !== null && r.bigN >= BIG_STEP) finishTask("task:big");
      } else if (r.mode === "same" && r.allRight) {
        if (!isDone("task:same")) finishTask("task:same");
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

  const current = round !== null ? PATTERN_ROUNDS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<PatternLab key={round ?? "free"} onReading={onReading} round={current} />}
      simNote="Counts come straight from the drawing. New matchsticks in each step glow blue. Next-door squares, houses and fence sections share their sticks."
      taskExtras={{
        "task:grow": (
          <div className="mt-2 text-xs text-white/50">
            Steps seen: {[1, 2, 3, 4].map((s) => `${steps.includes(s) ? "✓" : "○"} ${s}`).join(" · ")}
          </div>
        ),
        "task:rule": <div className="mt-2 text-xs text-white/50">Rules found: {rules.length} of 2</div>,
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {current ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Pattern {round! + 1} of {PATTERN_ROUNDS.length}: {current.name}
              </div>
              <div className="mt-1 text-xs">{current.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {cracked ? "Crack the patterns again" : "Start the case"}
            </button>
          )}
          {cracked > 0 && (
            <div className="mt-1 text-xs">
              Rules cracked: {cracked} of {PATTERN_ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
