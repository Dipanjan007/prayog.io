"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import TriangleLab, { type TriangleReading } from "@/components/sim/TriangleLab";
import { TRIANGLE_ORDERS, lesson } from "@/content/lessons/triangles";
import { matchesOrder } from "@/lib/sim/triangle";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [made, setMade] = useState({ right: false, obtuse: false });
  const [round, setRound] = useState<number | null>(null);
  const [solved, setSolved] = useState(0);

  const lastReading = useRef<TriangleReading | null>(null);
  const onReading = useCallback(
    (r: TriangleReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "corners" && matchesOrder(r.angles, TRIANGLE_ORDERS[round])) {
          const done = round + 1;
          setSolved((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === TRIANGLE_ORDERS.length) badge("set-square");
          }
          setRound(done < TRIANGLE_ORDERS.length ? done : null);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "sticks") {
        if (!isDone("task:gap") && r.result === "gap") finishTask("task:gap");
        if (!isDone("task:flat") && r.result === "flat") finishTask("task:flat");
        if (!isDone("task:equi") && r.sides === "equilateral") finishTask("task:equi");
      } else {
        setMade((m) => {
          const next = { right: m.right || r.kind === "right", obtuse: m.obtuse || r.kind === "obtuse" };
          if (next.right === m.right && next.obtuse === m.obtuse) return m;
          if (next.right && next.obtuse) queueMicrotask(() => !isDone("task:sum") && finishTask("task:sum"));
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

  const order = round !== null ? TRIANGLE_ORDERS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<TriangleLab key={round ?? "free"} onReading={onReading} order={order} />}
      simNote="Stick lengths are whole centimetres. Angles are shown to the nearest degree, rounded so the three still add up to exactly 180°, as the true angles do."
      taskExtras={{
        "task:sum": (
          <div className="mt-2 text-xs text-white/50">
            {made.right ? "✓" : "○"} Right angle · {made.obtuse ? "✓" : "○"} Obtuse angle
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {order ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Order {round! + 1} of {TRIANGLE_ORDERS.length}: {order.name}
              </div>
              <div className="mt-1 text-xs">{order.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {solved ? "Take the orders again" : "Take the carpenter's orders"}
            </button>
          )}
          {solved > 0 && (
            <div className="mt-1 text-xs">
              Triangles made: {solved} of {TRIANGLE_ORDERS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
