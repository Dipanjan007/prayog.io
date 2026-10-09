"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import SoundLab, { type SoundReading } from "@/components/sim/SoundLab";
import { DEPTH_TOLERANCE, SEA_SPOTS, lesson } from "@/content/lessons/sound";
import { depthGuessOk } from "@/lib/sim/sound";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [seen, setSeen] = useState({ high: false, low: false, loud: false, soft: false });
  const [round, setRound] = useState<number | null>(null);
  const [solved, setSolved] = useState(0);
  const [pingTime, setPingTime] = useState<number | null>(null);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const lastReading = useRef<SoundReading | null>(null);
  const onReading = useCallback(
    (r: SoundReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.ping?.mystery) setPingTime(r.ping.delay);
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "wave") {
        setSeen((s) => {
          const next = { high: s.high || r.f >= 800, low: s.low || r.f <= 200, loud: s.loud || r.amp >= 0.95, soft: s.soft || r.amp <= 0.2 };
          if (next.high === s.high && next.low === s.low && next.loud === s.loud && next.soft === s.soft) return s;
          if (next.high && next.low) queueMicrotask(() => !isDone("task:pitch") && finishTask("task:pitch"));
          if (next.loud && next.soft) queueMicrotask(() => !isDone("task:loud") && finishTask("task:loud"));
          return next;
        });
        if (!isDone("task:medium") && r.medium !== "air") finishTask("task:medium");
      }
      if (!isDone("task:echo") && r.mode === "echo" && r.clap?.distinct) finishTask("task:echo");
      if (!isDone("task:sonar") && r.mode === "sonar" && r.ping && !r.ping.mystery) finishTask("task:sonar");
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
    setPingTime(null);
    setGuess("");
    setFeedback(null);
  };

  const check = () => {
    if (round === null || pingTime === null) return;
    const spot = SEA_SPOTS[round];
    if (depthGuessOk(Number(guess), spot.depth, DEPTH_TOLERANCE)) {
      const done = round + 1;
      setSolved((s) => Math.max(s, done));
      if (isDone("ideas")) {
        challengeStars(done);
        if (done === SEA_SPOTS.length) badge("sonar-captain");
      }
      if (done < SEA_SPOTS.length) {
        startRound(done);
        setFeedback(`Correct! The sea there is ${spot.depth} m deep. On to the next spot.`);
      } else {
        startRound(null);
        setFeedback("All three spots mapped. Well done, captain!");
      }
    } else {
      setFeedback("Not quite. Remember the sound goes down and back up: depth = (1500 × t) ÷ 2.");
    }
  };

  const spot = round !== null ? SEA_SPOTS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<SoundLab key={round ?? "free"} onReading={onReading} mystery={spot ? { depth: spot.depth } : null} />}
      simNote="Distances in the sound wave are to scale, but time is slowed 500 times and the particle swings are hugely enlarged so you can see them. Real air particles move less than a millimetre. Echo and SONAR pulses also play in slow motion, while the timer shows the real time."
      taskExtras={{
        "task:pitch": (
          <div className="mt-2 text-xs text-white/50">
            {seen.high ? "✓" : "○"} 800 Hz or more · {seen.low ? "✓" : "○"} 200 Hz or less
          </div>
        ),
        "task:loud": (
          <div className="mt-2 text-xs text-white/50">
            {seen.loud ? "✓" : "○"} Full amplitude · {seen.soft ? "✓" : "○"} Small amplitude
          </div>
        ),
      }}
      challengeBody={
        <div className="min-w-0 flex-1 text-sm text-white/60">
          {spot ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Spot {round! + 1} of {SEA_SPOTS.length}: {spot.name}
              </div>
              <div className="mt-1">
                {pingTime === null ? "Send a ping from the ship first." : `Echo time: ${pingTime.toFixed(3)} s. How deep is the sea?`}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  className="field min-w-0 flex-1 !py-1.5 tabular-nums"
                  inputMode="decimal"
                  placeholder="metres"
                  aria-label="Your depth answer in metres"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && check()}
                  disabled={pingTime === null}
                />
                <button className="btn-primary !px-3 !py-1.5 text-sm" onClick={check} disabled={pingTime === null || !guess}>
                  Check
                </button>
              </div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => startRound(0)}>
              {solved ? "Survey the sea again" : "Start the survey"}
            </button>
          )}
          {feedback && <div className={`mt-2 text-xs ${feedback.startsWith("Not") ? "text-amber-200" : "text-lime-300"}`}>{feedback}</div>}
          {solved > 0 && (
            <div className="mt-1 text-xs">
              Spots mapped: {solved} of {SEA_SPOTS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
