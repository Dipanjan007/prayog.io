"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import SquareLab, { type SquareReading } from "@/components/sim/SquareLab";
import { RESCUES, lesson } from "@/content/lessons/pythagoras";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [rightPairs, setRightPairs] = useState<string[]>([]);
  const [corners, setCorners] = useState({ less: false, more: false });
  const [round, setRound] = useState<number | null>(null);
  const [rescued, setRescued] = useState(0);

  const lastReading = useRef<SquareReading | null>(null);
  const onReading = useCallback(
    (r: SquareReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "rescue" && r.ok) {
          const done = round + 1;
          setRescued((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === RESCUES.length) badge("ladder-ace");
          }
          // Leave the success on screen for a moment before the next window.
          setTimeout(() => setRound(done < RESCUES.length ? done : null), 1400);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "squares") {
        if (r.angle === 90 && r.cmp === "equal") {
          const key = `${Math.min(r.a, r.b)}-${Math.max(r.a, r.b)}`;
          setRightPairs((prev) => {
            if (prev.includes(key)) return prev;
            const next = [...prev, key];
            if (next.length === 2) queueMicrotask(() => !isDone("task:right") && finishTask("task:right"));
            return next;
          });
        }
        if (r.cmp !== "equal")
          setCorners((cs) => {
            const next = { less: cs.less || r.cmp === "less", more: cs.more || r.cmp === "more" };
            if (next.less === cs.less && next.more === cs.more) return cs;
            if (next.less && next.more) queueMicrotask(() => !isDone("task:corner") && finishTask("task:corner"));
            return next;
          });
        if (!isDone("task:whole") && r.whole) finishTask("task:whole");
      } else if (r.mode === "ladder") {
        if (!isDone("task:ladder") && r.L === 10 && Math.abs(r.top - 8) < 1e-9) finishTask("task:ladder");
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

  const rescue = round !== null ? RESCUES[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<SquareLab key={round ?? "free"} onReading={onReading} rescue={rescue} />}
      simNote="Squares are drawn to scale with a 1 × 1 grid, so you can count their area. Lengths have no units in Squares; the ladder is in metres."
      taskExtras={{
        "task:right": <div className="mt-2 text-xs text-white/50">Right triangles checked: {rightPairs.length} of 2</div>,
        "task:corner": (
          <div className="mt-2 text-xs text-white/50">
            {corners.less ? "✓" : "○"} Sharper than 90° · {corners.more ? "✓" : "○"} Wider than 90°
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {rescue ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Rescue {round! + 1} of {RESCUES.length}: {rescue.name}
              </div>
              <div className="mt-1 text-xs">{rescue.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {rescued ? "Do the rescues again" : "Answer the fire call"}
            </button>
          )}
          {rescued > 0 && (
            <div className="mt-1 text-xs">
              Rescues done: {rescued} of {RESCUES.length}
            </div>
          )}
        </div>
      }
    />
  );
}
