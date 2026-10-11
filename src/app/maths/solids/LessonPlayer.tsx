"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import SolidsLab, { type SolidsReading } from "@/components/sim/SolidsLab";
import { SOLID_ROUNDS, lesson } from "@/content/lessons/solids";
import { isDoubled, type SolidDims, type SolidId } from "@/lib/sim/solids";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [round, setRound] = useState<number | null>(null);
  const [solved, setSolved] = useState(0);
  /** Every size of each solid built since the prediction, to spot a doubled copy. */
  const seen = useRef<Partial<Record<SolidId, SolidDims[]>>>({});

  const lastReading = useRef<SolidsReading | null>(null);
  const onReading = useCallback(
    (r: SolidsReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "answer" && r.ok) {
          const done = round + 1;
          setSolved((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === SOLID_ROUNDS.length) badge("shop-estimator");
          }
          // Leave "Spot on!" on screen for a moment before the next order.
          setTimeout(() => setRound(done < SOLID_ROUNDS.length ? done : null), 1600);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "pour") {
        if (!isDone("task:cone3") && r.src === "cone" && r.pours === 3) finishTask("task:cone3");
        if (!isDone("task:ball") && r.src === "ball" && r.pours === 1) finishTask("task:ball");
      } else if (r.mode === "build") {
        if (!isDone("task:icecream") && r.solid === "icecream" && r.r === 3.5 && r.h === 12) finishTask("task:icecream");
        const dims: SolidDims = { r: r.r, h: r.h, H: r.H };
        const list = seen.current[r.solid] ?? [];
        if (!isDone("task:double") && list.some((small) => isDoubled(r.solid, small, dims))) finishTask("task:double");
        if (list.length < 200) seen.current[r.solid] = [...list, dims];
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

  const rd = round !== null ? SOLID_ROUNDS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<SolidsLab key={round ?? "free"} onReading={onReading} round={rd} />}
      simNote="This lab uses π = 22/7, as most NCERT examples do. Readouts are rounded to 2 decimal places. The ice-cream cone and capsule are in cm; the tent is in m."
      challengeBody={
        <div className="text-sm text-white/60">
          {rd ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Order {round! + 1} of {SOLID_ROUNDS.length}: {rd.name}
              </div>
              <div className="mt-1 text-xs">{rd.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {solved ? "Take the orders again" : "Take the shop orders"}
            </button>
          )}
          {solved > 0 && (
            <div className="mt-1 text-xs">
              Orders done: {solved} of {SOLID_ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
