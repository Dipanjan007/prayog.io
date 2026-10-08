"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import SoundHall, { type SoundHallReading } from "@/components/sim/SoundHall";
import { HALLS, lesson } from "@/content/lessons/sound-uses";
import { onlyHears, rtOk } from "@/lib/sim/acoustics";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [heard, setHeard] = useState({ elephant: false, dolphin: false });
  const [round, setRound] = useState<number | null>(null);
  const [solved, setSolved] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const lastReading = useRef<SoundHallReading | null>(null);
  const onReading = useCallback(
    (r: SoundHallReading) => {
      lastReading.current = r;
      if (round !== null) return;
      if (!isDone("predict")) return;
      if (r.mode === "bell") {
        if (!isDone("task:silence") && r.silent) finishTask("task:silence");
        else if (isDone("task:silence") && !isDone("task:return") && r.pressure >= 0.9) finishTask("task:return");
      }
      if (!isDone("task:hall") && r.mode === "hall" && r.hall.T < 1.5) finishTask("task:hall");
      if (!isDone("task:crack") && r.mode === "ultra" && r.scan?.crack) finishTask("task:crack");
      if (r.mode === "hearing") {
        const e = onlyHears(r.f, "elephant");
        const d = onlyHears(r.f, "dolphin");
        setHeard((s) => {
          const next = { elephant: s.elephant || e, dolphin: s.dolphin || d };
          if (next.elephant === s.elephant && next.dolphin === s.dolphin) return s;
          if (next.elephant && next.dolphin) queueMicrotask(() => !isDone("task:hearing") && finishTask("task:hearing"));
          return next;
        });
      }
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
    lastReading.current = null;
    setFeedback(null);
  };

  const check = () => {
    const r = lastReading.current;
    if (round === null || !r) return;
    const hall = HALLS[round];
    const T = r.hall.T;
    if (rtOk(T, hall.target, hall.tolerance)) {
      const done = round + 1;
      setSolved((s) => Math.max(s, done));
      if (isDone("ideas")) {
        challengeStars(done);
        if (done === HALLS.length) badge("sabine-ear");
      }
      if (done < HALLS.length) {
        startRound(done);
        setFeedback(`${T.toFixed(2)} s is spot on for the ${hall.spec.name.toLowerCase()}. On to the next hall.`);
      } else {
        startRound(null);
        setFeedback("All three halls tuned. Sabine would be proud!");
      }
    } else {
      setFeedback(
        T > hall.target
          ? `Not yet: ${T.toFixed(2)} s is too long. Add absorption to make A bigger.`
          : `Not yet: ${T.toFixed(2)} s is too short and the hall sounds dead. Take some absorption away.`,
      );
    }
  };

  const hall = round !== null ? HALLS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<SoundHall key={hall?.id ?? "free"} onReading={onReading} challenge={hall} />}
      simNote="The bell's sound uses a simple model: the sound getting out falls with the square of the air pressure (20 dB for every tenfold drop), plus a small leak through the supports. Absorption values are typical ones at 500 Hz. The ultrasound pulse really takes millionths of a second; the animation slows it down a million times. Hearing ranges are approximate."
      taskExtras={{
        "task:hearing": (
          <div className="mt-2 text-xs text-white/50">
            {heard.elephant ? "✓" : "○"} Only the elephant · {heard.dolphin ? "✓" : "○"} Only the dolphin
          </div>
        ),
      }}
      challengeBody={
        <div className="min-w-0 flex-1 text-sm text-white/60">
          {hall ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Hall {round! + 1} of {HALLS.length}: {hall.spec.name}
              </div>
              <div className="mt-1">
                Target {hall.target} s (±{hall.tolerance} s). Up to {hall.budget} panels.
              </div>
              <div className="mt-1 text-xs text-white/50">{hall.why}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button className="btn-primary !px-3 !py-1.5 text-sm" onClick={check}>
                  Check
                </button>
                <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => startRound(null)}>
                  Stop
                </button>
              </div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => startRound(0)}>
              {solved ? "Tune the halls again" : "Start tuning"}
            </button>
          )}
          {feedback && <div className={`mt-2 text-xs ${feedback.startsWith("Not") ? "text-amber-200" : "text-lime-300"}`}>{feedback}</div>}
          {solved > 0 && (
            <div className="mt-1 text-xs">
              Halls tuned: {solved} of {HALLS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
