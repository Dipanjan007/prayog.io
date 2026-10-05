"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import TimeLab, { type PendulumRun, type TimeReading } from "@/components/sim/TimeLab";
import { CLOCK_ROUNDS, PERIOD_TOLERANCE, lesson } from "@/content/lessons/time-motion";
import { useLesson } from "@/lib/useLesson";

/** Two runs that differ only in the bob's mass. */
const massPair = (runs: PendulumRun[]) =>
  runs.some((a) => runs.some((b) => a.lengthCm === b.lengthCm && a.angle === b.angle && a.massG !== b.massG));
/** Two runs whose lengths differ by at least 20 cm. */
const lengthPair = (runs: PendulumRun[]) => runs.length > 1 && Math.max(...runs.map((r) => r.lengthCm)) - Math.min(...runs.map((r) => r.lengthCm)) >= 20;

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [round, setRound] = useState<number | null>(null);
  const [built, setBuilt] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [runs, setRuns] = useState<PendulumRun[]>([]);
  const [raced, setRaced] = useState<string[]>([]);
  const lastReading = useRef<TimeReading | null>(null);
  /** Id of the last pendulum run already judged in this round. */
  const judged = useRef(0);

  const judge = useCallback(
    (run: PendulumRun) => {
      if (round === null || run.id <= judged.current) return;
      judged.current = run.id;
      const want = CLOCK_ROUNDS[round].period;
      const gap = run.period - want;
      if (Math.abs(gap) <= PERIOD_TOLERANCE) {
        const done = round + 1;
        setBuilt((b) => Math.max(b, done));
        if (isDone("ideas")) {
          challengeStars(done);
          if (done === CLOCK_ROUNDS.length) badge("clock-maker");
        }
        setFeedback(
          done < CLOCK_ROUNDS.length
            ? `Perfect! ${run.period.toFixed(2)} s with a ${run.lengthCm} cm thread. Here is the next clock.`
            : `All three clocks keep perfect time. The last one: ${run.lengthCm} cm.`,
        );
        setRound(done < CLOCK_ROUNDS.length ? done : null);
        judged.current = 0;
      } else {
        setFeedback(
          `Your period was ${run.period.toFixed(2)} s. ${gap > 0 ? "Too slow: make the thread shorter." : "Too fast: make the thread longer."}`,
        );
      }
    },
    [round, isDone, challengeStars, badge],
  );

  const onReading = useCallback(
    (r: TimeReading) => {
      lastReading.current = r;
      if (round !== null) {
        const run = r.runs.at(-1);
        if (run) judge(run);
        return;
      }
      setRuns(r.runs);
      setRaced(r.raced);
      if (!isDone("predict")) return;
      if (!isDone("task:period") && r.runs.length > 0) finishTask("task:period");
      if (!isDone("task:mass") && massPair(r.runs)) finishTask("task:mass");
      if (!isDone("task:length") && lengthPair(r.runs)) finishTask("task:length");
      if (!isDone("task:speed") && r.speedsFound.length > 0) finishTask("task:speed");
      if (!isDone("task:uniform") && r.raced.includes("cycle") && r.raced.includes("auto")) finishTask("task:uniform");
    },
    [round, isDone, finishTask, judge],
  );

  // The sim only reports changes, so replay what it shows now once the prediction or the ideas step is done.
  const predicted = api.done.has("predict");
  const ideasDone = api.done.has("ideas");
  useEffect(() => {
    if (predicted && lastReading.current) onReading(lastReading.current);
  }, [predicted, ideasDone, onReading]);

  const start = () => {
    judged.current = 0;
    setFeedback(null);
    setRound(0);
  };

  const target = round !== null ? CLOCK_ROUNDS[round] : null;
  const lengths = [...new Set(runs.map((r) => r.lengthCm))];

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<TimeLab key={round === null ? "free" : `r${round}`} onReading={onReading} target={target ? target.period : null} />}
      simNote="The pendulum is ideal: a point bob on a thread that does not stretch, with no air drag, so it never slows down. Its period is worked out exactly, including the small extra time for big swings. g = 9.8 m/s². The animation can run 5 times faster, but the stopwatch always shows real seconds. Racers are not drawn to scale."
      taskExtras={{
        "task:mass": (
          <div className="mt-2 text-xs text-faint">
            Masses timed: {runs.length ? [...new Set(runs.map((r) => `${r.massG} g`))].join(", ") : "none yet"}
          </div>
        ),
        "task:length": <div className="mt-2 text-xs text-faint">Lengths timed: {lengths.length ? lengths.map((l) => `${l} cm`).join(", ") : "none yet"}</div>,
        "task:uniform": (
          <div className="mt-2 text-xs text-faint">
            Raced so far: {[raced.includes("cycle") && "cycle", raced.includes("auto") && "auto-rickshaw"].filter(Boolean).join(" and ") || "neither yet"}
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-muted">
          {target ? (
            <div className="rounded-xl panel p-3" aria-live="polite">
              <div className="text-cream">
                Clock {round! + 1} of {CLOCK_ROUNDS.length}: {target.who}
              </div>
              <div className="mt-1 italic">{target.hint}</div>
              <div className="mt-1">{feedback ?? "Set the length, then press Release under the picture."}</div>
            </div>
          ) : (
            <>
              <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={start}>
                {built ? "Build the clocks again" : "Start building clocks"}
              </button>
              {feedback && <div className="mt-1 text-xs">{feedback}</div>}
            </>
          )}
          {built > 0 && (
            <div className="mt-1 text-xs">
              Clocks built: {built} of {CLOCK_ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
