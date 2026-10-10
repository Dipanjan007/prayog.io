"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import PiLab, { type PiReading } from "@/components/sim/PiLab";
import { PI_ROUNDS, lesson } from "@/content/lessons/chasing-pi";
import { agrees } from "@/lib/sim/pi";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [round, setRound] = useState<number | null>(null);
  const [hit, setHit] = useState(0);

  const lastReading = useRef<PiReading | null>(null);
  const onReading = useCallback(
    (r: PiReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "round" && r.ok) {
          const done = round + 1;
          setHit((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === PI_ROUNDS.length) badge("madhava-sprinter");
          }
          // Leave the answer on screen for a moment before the next target.
          setTimeout(() => setRound(done < PI_ROUNDS.length ? done : null), 2000);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "poly") {
        if (r.n === 96 && !isDone("task:poly")) finishTask("task:poly");
      } else if (r.mode === "series") {
        if (!r.corrected && r.n >= 100 && !isDone("task:series")) finishTask("task:series");
        if (r.corrected && agrees(r.value, 4) && !isDone("task:fix")) finishTask("task:fix");
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

  const target = round !== null ? PI_ROUNDS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<PiLab key={round ?? "free"} onReading={onReading} round={target} />}
      simNote="The circle is 1 unit across, so its circumference is exactly π. The sim works out the polygons with a computer; Archimedes used square roots by hand. In the challenge, → shows a number rounded to the decimals asked for."
      challengeBody={
        <div className="text-sm text-white/60">
          {target ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Target {round! + 1} of {PI_ROUNDS.length}: {target.name}
              </div>
              <div className="mt-1 text-xs">{target.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {hit ? "Chase π again" : "Chase π"}
            </button>
          )}
          {hit > 0 && (
            <div className="mt-1 text-xs">
              Targets hit: {hit} of {PI_ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
