"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import QuadraticLab, { type QuadReading } from "@/components/sim/QuadraticLab";
import { ROOT_ROUNDS, lesson } from "@/content/lessons/quadratics";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [counts, setCounts] = useState({ two: false, one: false, none: false });
  const [breadths, setBreadths] = useState({ b8: false, b12: false });
  const [limits, setLimits] = useState({ hit100: false, saw110: false });
  const [round, setRound] = useState<number | null>(null);
  const [built, setBuilt] = useState(0);

  const lastReading = useRef<QuadReading | null>(null);
  const onReading = useCallback(
    (r: QuadReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "round" && r.ok) {
          const done = round + 1;
          setBuilt((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === ROOT_ROUNDS.length) badge("sridhara-solver");
          }
          // Leave the success on screen for a moment before the next curve.
          setTimeout(() => setRound(done < ROOT_ROUNDS.length ? done : null), 1400);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "curve") {
        if (!isDone("task:roots") && r.a === 1 && r.b === -5 && r.c === 6) finishTask("task:roots");
        setCounts((s) => {
          const next = { two: s.two || r.count === 2, one: s.one || r.count === 1, none: s.none || r.count === 0 };
          if (next.two === s.two && next.one === s.one && next.none === s.none) return s;
          if (next.two && next.one && next.none) queueMicrotask(() => !isDone("task:disc") && finishTask("task:disc"));
          return next;
        });
      } else if (r.mode === "garden") {
        const b8 = r.x === 8;
        const b12 = r.x === 12;
        if (b8 || b12)
          setBreadths((s) => {
            const next = { b8: s.b8 || b8, b12: s.b12 || b12 };
            if (next.b8 === s.b8 && next.b12 === s.b12) return s;
            if (next.b8 && next.b12) queueMicrotask(() => !isDone("task:garden") && finishTask("task:garden"));
            return next;
          });
        const hit100 = r.target === 100 && r.x === 10;
        const saw110 = r.target === 110;
        if (hit100 || saw110)
          setLimits((s) => {
            const next = { hit100: s.hit100 || hit100, saw110: s.saw110 || saw110 };
            if (next.hit100 === s.hit100 && next.saw110 === s.saw110) return s;
            if (next.hit100 && next.saw110) queueMicrotask(() => !isDone("task:square") && finishTask("task:square"));
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

  const rr = round !== null ? ROOT_ROUNDS[round] : null;
  const tick = (v: boolean) => (v ? "✓" : "○");

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<QuadraticLab key={round ?? "free"} onReading={onReading} round={rr} />}
      simNote="The graph shows x from −10 to 10 and y from −20 to 20; roots outside it still show in the readout. In Garden, the 40 m fence means breadth + length = 20 m."
      taskExtras={{
        "task:disc": (
          <div className="mt-2 text-xs text-white/50">
            {tick(counts.two)} Two roots · {tick(counts.one)} One root · {tick(counts.none)} No real roots
          </div>
        ),
        "task:garden": (
          <div className="mt-2 text-xs text-white/50">
            {tick(breadths.b8)} First breadth · {tick(breadths.b12)} Second breadth
          </div>
        ),
        "task:square": (
          <div className="mt-2 text-xs text-white/50">
            {tick(limits.hit100)} 100 m² garden made · {tick(limits.saw110)} 110 m² tried
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {rr ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Curve {round! + 1} of {ROOT_ROUNDS.length}: {rr.name}
              </div>
              <div className="mt-1 text-xs">{rr.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {built ? "Build the curves again" : "Start building curves"}
            </button>
          )}
          {built > 0 && (
            <div className="mt-1 text-xs">
              Curves built: {built} of {ROOT_ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
