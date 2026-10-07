"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import SpeedLimitLab, { type SpeedLimitReading } from "@/components/sim/SpeedLimitLab";
import { SQUEEZE_ROUNDS, SQUEEZE_TOLERANCE, lesson } from "@/content/lessons/length-contraction";
import { answerOk, contractedLength } from "@/lib/sim/relativity";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [round, setRound] = useState<number | null>(null);
  const [solved, setSolved] = useState(0);
  const [passed, setPassed] = useState(false);
  const [tryBeta, setTryBeta] = useState<number | null>(null);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const lastReading = useRef<SpeedLimitReading | null>(null);
  const onReading = useCallback(
    (r: SpeedLimitReading) => {
      lastReading.current = r;
      if (round !== null || !isDone("predict")) return;
      if (!isDone("task:half") && r.mode === "shrink" && r.beta > 0 && Math.abs(r.length / r.L0 - 0.5) <= 0.01) finishTask("task:half");
      const l = r.launch;
      if (!l || r.mode !== "add") return;
      if (!isDone("task:beat") && l.units === "space" && l.u >= 0.9 && l.v >= 0.9 && l.v < 1) finishTask("task:beat");
      if (!isDone("task:light") && l.units === "space" && l.v >= 1) finishTask("task:light");
      if (!isDone("task:everyday") && l.units === "everyday" && l.u > 0 && l.v > 0) finishTask("task:everyday");
    },
    [round, isDone, finishTask],
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

  const startRound = (n: number | null) => {
    setRound(n);
    setPassed(false);
    setTryBeta(null);
    setGuess("");
    setFeedback(null);
  };

  const check = () => {
    if (round === null) return;
    const r = SQUEEZE_ROUNDS[round];
    const b = Number(guess);
    if (!Number.isFinite(b) || b < 0 || b >= 1) {
      setFeedback("Not a possible speed. Give it as a fraction of c, between 0 and 1 (for example 0.5).");
      return;
    }
    setTryBeta(b);
    const L = contractedLength(r.L0, b);
    if (answerOk(b, r.beta, SQUEEZE_TOLERANCE)) {
      const done = round + 1;
      setSolved((s) => Math.max(s, done));
      setPassed(true);
      if (isDone("ideas")) {
        challengeStars(done);
        if (done === SQUEEZE_ROUNDS.length) badge("rocket-squeezer");
      }
      setFeedback(
        done < SQUEEZE_ROUNDS.length
          ? `Correct! At ${r.beta.toFixed(3)}c the rocket measures ${r.L} m.`
          : `Correct! All three rockets fit the gate. You have mastered length contraction!`,
      );
    } else {
      setFeedback(
        `Not quite. At ${b}c it measures ${L.toFixed(1)} m, ${L > r.L ? "too long: go faster" : "too short: go slower"}. Use L ÷ L₀ = √(1 − v²/c²).`,
      );
    }
  };

  const r = round !== null ? SQUEEZE_ROUNDS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<SpeedLimitLab key={round ?? "free"} onReading={onReading} mystery={r ? { L0: r.L0, target: r.L, tryBeta } : null} />}
      simNote="Lengths along the ruler are to scale, but the rockets are drawn taller than their true shape so you can see them, and the streaming dust only hints at the motion. In Adding speeds, everything is slowed down enormously (real light would cross this screen in about a billionth of a second), but the dots keep the right speeds compared with each other."
      challengeBody={
        <div className="min-w-0 flex-1 text-sm text-white/60">
          {r ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Rocket {round! + 1} of {SQUEEZE_ROUNDS.length}: {r.name}
              </div>
              <div className="mt-1">
                Parked it is {r.L0} m long. It must measure {r.L} m. At what speed, as a fraction of c?
              </div>
              {passed ? (
                <button className="btn-primary mt-2 !px-3 !py-1.5 text-sm" onClick={() => startRound(round! + 1 < SQUEEZE_ROUNDS.length ? round! + 1 : null)}>
                  {round! + 1 < SQUEEZE_ROUNDS.length ? "Next rocket →" : "Finish"}
                </button>
              ) : (
                <div className="mt-2 flex gap-2">
                  <input
                    className="field min-w-0 flex-1 !py-1.5 tabular-nums"
                    inputMode="decimal"
                    placeholder="e.g. 0.5"
                    aria-label="Your speed answer as a fraction of the speed of light"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && check()}
                  />
                  <button className="btn-primary !px-3 !py-1.5 text-sm" onClick={check} disabled={!guess}>
                    Fly it
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => startRound(0)}>
              {solved ? "Squeeze the rockets again" : "Start the squeeze"}
            </button>
          )}
          {feedback && <div className={`mt-2 text-xs ${feedback.startsWith("Not") ? "text-amber-200" : "text-lime-300"}`}>{feedback}</div>}
          {solved > 0 && (
            <div className="mt-1 text-xs">
              Rockets squeezed: {solved} of {SQUEEZE_ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
