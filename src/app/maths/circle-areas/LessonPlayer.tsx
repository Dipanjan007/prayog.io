"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import SectorLab, { type SectorReading } from "@/components/sim/SectorLab";
import { SLICE_ROUNDS, lesson } from "@/content/lessons/circle-areas";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [radii, setRadii] = useState({ theta: -1, r5: false, r10: false });
  const [cuts, setCuts] = useState({ right: false, flat: false });
  const [round, setRound] = useState<number | null>(null);
  const [cut, setCut] = useState(0);

  const lastReading = useRef<SectorReading | null>(null);
  const onReading = useCallback(
    (r: SectorReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "round" && r.ok) {
          const done = round + 1;
          setCut((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === SLICE_ROUNDS.length) badge("fair-slicer");
          }
          // Leave the success on screen for a moment before the next job.
          setTimeout(() => setRound(done < SLICE_ROUNDS.length ? done : null), 1400);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "pizza") {
        if (!isDone("task:quarter") && r.theta === 90) finishTask("task:quarter");
        if (!isDone("task:clock") && r.r === 7 && r.theta === 120) finishTask("task:clock");
        setRadii((s) => {
          const base = s.theta === r.theta ? s : { theta: r.theta, r5: false, r10: false };
          const next = { theta: r.theta, r5: base.r5 || r.r === 5, r10: base.r10 || r.r === 10 };
          if (next.theta === s.theta && next.r5 === s.r5 && next.r10 === s.r10) return s;
          if (next.r5 && next.r10) queueMicrotask(() => !isDone("task:double") && finishTask("task:double"));
          return next;
        });
      } else if (r.mode === "segment") {
        const right = r.r === 10 && r.theta === 90;
        const flat = r.theta === 180;
        if (right || flat)
          setCuts((s) => {
            const next = { right: s.right || right, flat: s.flat || flat };
            if (next.right === s.right && next.flat === s.flat) return s;
            if (next.right && next.flat) queueMicrotask(() => !isDone("task:segment") && finishTask("task:segment"));
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

  const sr = round !== null ? SLICE_ROUNDS[round] : null;
  const tick = (v: boolean) => (v ? "✓" : "○");

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<SectorLab key={round ?? "free"} onReading={onReading} round={sr} />}
      simNote="The sim uses π ≈ 3.14159 and rounds to 2 decimal places, so answers worked with π = 22 ÷ 7 or 3.14 can differ a little. The angle is measured clockwise from 12 o'clock, like a clock hand."
      taskExtras={{
        "task:double": (
          <div className="mt-2 text-xs text-white/50">
            At one angle: {tick(radii.r5)} r = 5 cm · {tick(radii.r10)} r = 10 cm
          </div>
        ),
        "task:segment": (
          <div className="mt-2 text-xs text-white/50">
            {tick(cuts.right)} 90° with r = 10 cm · {tick(cuts.flat)} 180°
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {sr ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Job {round! + 1} of {SLICE_ROUNDS.length}: {sr.name}
              </div>
              <div className="mt-1 text-xs">{sr.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {cut ? "Cut the slices again" : "Start cutting"}
            </button>
          )}
          {cut > 0 && (
            <div className="mt-1 text-xs">
              Jobs done: {cut} of {SLICE_ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
