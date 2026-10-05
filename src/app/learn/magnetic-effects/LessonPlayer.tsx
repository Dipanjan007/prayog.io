"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import MagnetLab, { type MagnetReading, type RodRound } from "@/components/sim/MagnetLab";
import { ROD_ROUNDS, lesson } from "@/content/lessons/magnetic-effects";
import { rodForce } from "@/lib/sim/magnetism";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [round, setRound] = useState<number | null>(null);
  const [setup, setSetup] = useState<RodRound>(ROD_ROUNDS[0]);
  const [attempt, setAttempt] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [best, setBest] = useState(0);
  const [wireDirs, setWireDirs] = useState<boolean[]>([]);
  const [northEnds, setNorthEnds] = useState<string[]>([]);
  const [forceDirs, setForceDirs] = useState<number[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const collect = <T,>(set: (f: (p: T[]) => T[]) => void, value: T, task: string) =>
    set((prev) => {
      if (prev.includes(value)) return prev;
      const next = [...prev, value];
      if (next.length === 2) queueMicrotask(() => finishTask(task));
      return next;
    });

  const lastReading = useRef<MagnetReading | null>(null);
  const onReading = useCallback(
    (r: MagnetReading) => {
      lastReading.current = r;
      if (round !== null || !isDone("predict")) return;
      if (r.mode === "wire" && r.current > 0) {
        if (!isDone("task:wire")) collect(setWireDirs, r.reversed, "task:wire");
        if (!isDone("task:strength") && r.current >= 4) finishTask("task:strength");
      }
      if (!isDone("task:loop") && r.mode === "loop" && r.current > 0) finishTask("task:loop");
      if (!isDone("task:solenoid") && r.mode === "solenoid" && r.current > 0) collect(setNorthEnds, r.northEnd, "task:solenoid");
      if (!isDone("task:force") && r.mode === "force" && r.forceDir !== 0) collect(setForceDirs, r.forceDir, "task:force");
    },
    // collect only uses stable setters and finishTask.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [round, isDone, finishTask],
  );

  // The sim only reports changes, so replay what it shows now once the prediction is locked in.
  const predicted = api.done.has("predict");
  useEffect(() => {
    if (predicted && lastReading.current) onReading(lastReading.current);
  }, [predicted, onReading]);

  const start = () => {
    setRound(0);
    setSetup(ROD_ROUNDS[0]);
    setFeedback(null);
    setAttempt((a) => a + 1);
  };

  const onGuess = (dir: 1 | -1) => {
    if (round === null) return;
    const right = rodForce(1, setup.fieldDown, setup.currentOut).dir === dir;
    setFeedback(right ? "Correct! Fleming's left-hand rule wins." : `Not this time. It swings ${dir > 0 ? "left" : "right"}. Try a new setup.`);
    if (right) {
      const done = round + 1;
      setBest((b) => Math.max(b, done));
      if (isDone("ideas")) {
        challengeStars(done);
        if (done === ROD_ROUNDS.length) badge("left-hand-hero");
      }
    }
    timer.current = setTimeout(() => {
      setFeedback(null);
      setAttempt((a) => a + 1);
      if (right) {
        const next = round + 1;
        if (next < ROD_ROUNDS.length) {
          setRound(next);
          setSetup(ROD_ROUNDS[next]);
        } else setRound(null);
      } else {
        // A fresh setup for the same round.
        setSetup({ fieldDown: Math.random() < 0.5, currentOut: Math.random() < 0.5 });
      }
    }, 2200);
  };

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<MagnetLab key={round === null ? "free" : `r${attempt}`} onReading={onReading} round={round === null ? null : setup} onGuess={onGuess} />}
      simNote="Each wire crosses the page and the field is worked out exactly for long straight wires. A loop and a solenoid are shown as a slice through their middle. The compasses show only the field of the current; Earth's weaker field is left out unless the current is off. The rod is 5 cm long, has a mass of 10 g and sits in a 0.1 T field."
      taskExtras={{
        "task:wire": <div className="mt-2 text-xs text-white/50">Directions seen: {wireDirs.length ? wireDirs.map((d) => (d ? "into the page" : "out of the page")).join(" and ") : "none yet"}</div>,
        "task:solenoid": <div className="mt-2 text-xs text-white/50">North pole seen at: {northEnds.length ? northEnds.map((e) => `${e} end`).join(" and ") : "nowhere yet"}</div>,
        "task:force": <div className="mt-2 text-xs text-white/50">Rod pushed: {forceDirs.length ? forceDirs.map((d) => (d > 0 ? "right" : "left")).join(" and ") : "not yet"}</div>,
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {round !== null ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3" aria-live="polite">
              <div className="text-white">
                Round {round + 1} of {ROD_ROUNDS.length}
              </div>
              <div className="mt-1">{feedback ?? "Predict the swing using the buttons under the picture."}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={start}>
              {best ? "Play the rounds again" : "Start the rounds"}
            </button>
          )}
          {best > 0 && <div className="mt-1 text-xs">Rounds won: {best} of {ROD_ROUNDS.length}</div>}
        </div>
      }
    />
  );
}
