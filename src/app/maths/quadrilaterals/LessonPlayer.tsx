"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import QuadLab, { type QuadReading } from "@/components/sim/QuadLab";
import { ORDERS, lesson } from "@/content/lessons/quadrilaterals";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [shapes, setShapes] = useState<string[]>([]);
  const [round, setRound] = useState<number | null>(null);
  const [made, setMade] = useState(0);

  const lastReading = useRef<QuadReading | null>(null);
  const onReading = useCallback(
    (r: QuadReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "check" && r.ok) {
          const done = round + 1;
          setMade((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === ORDERS.length) badge("frame-fixer");
          }
          // Leave the finished shape on screen for a moment before the next order.
          setTimeout(() => setRound(done < ORDERS.length ? done : null), 1400);
        }
        return;
      }
      if (!isDone("predict") || r.mode !== "free" || !r.angles) return;
      // Three different sets of angles count as three different quadrilaterals.
      const sig = r.angles.join(",");
      setShapes((prev) => {
        if (prev.includes(sig)) return prev;
        const next = [...prev, sig];
        if (next.length === 3) queueMicrotask(() => !isDone("task:sum") && finishTask("task:sum"));
        return next;
      });
      if (!isDone("task:diag") && r.diagonals && r.name !== "concave") finishTask("task:diag");
      if (!isDone("task:rect") && r.name === "rectangle") finishTask("task:rect");
      if (!isDone("task:rhombus") && r.name === "rhombus") finishTask("task:rhombus");
      if (!isDone("task:kite") && r.name === "kite") finishTask("task:kite");
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

  const order = round !== null ? ORDERS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<QuadLab key={round ?? "free"} onReading={onReading} order={order} />}
      simNote="Corners snap to pegs one unit apart, so equal sides and parallel sides are exact. Yellow ticks mark equal sides, pink arrows mark parallel sides. Angles are rounded to the nearest degree."
      taskExtras={{
        "task:sum": <div className="mt-2 text-xs text-white/50">Different quadrilaterals made: {Math.min(shapes.length, 3)} of 3</div>,
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {order ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Order {round! + 1} of {ORDERS.length}: {order.name}
              </div>
              <div className="mt-1 text-xs">{order.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {made ? "Take the orders again" : "Open the order book"}
            </button>
          )}
          {made > 0 && (
            <div className="mt-1 text-xs">
              Shapes delivered: {made} of {ORDERS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
