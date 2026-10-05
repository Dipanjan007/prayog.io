"use client";

import { useCallback, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import CraneLab, { type CraneReading } from "@/components/sim/CraneLab";
import { ORDERS, lesson } from "@/content/lessons/magnetic-heating";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [round, setRound] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [filled, setFilled] = useState(0);
  const [miss, setMiss] = useState<number | null>(null);

  const onReading = useCallback(
    (r: CraneReading) => {
      if (round !== null) {
        // Judge the order once the magnet is empty and something has reached the truck.
        if (r.truck > 0 && r.held === 0 && miss === null) {
          if (r.truck === ORDERS[round]) {
            const done = round + 1;
            setFilled((f) => Math.max(f, done));
            if (isDone("ideas")) {
              challengeStars(done);
              if (done === ORDERS.length) badge("crane-master");
            }
            setRound(done < ORDERS.length ? done : null);
          } else setMiss(r.truck);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "crane") {
        if (!isDone("task:drop") && r.load === "scrap" && r.drops > 0) finishTask("task:drop");
        if (!isDone("task:core") && r.load === "clips" && r.on && !r.core) finishTask("task:core");
        if (!isDone("task:strong") && r.load === "scrap" && r.core && r.held >= 5) finishTask("task:strong");
      } else {
        if (!isDone("task:glow") && r.heat.wire === "nichrome" && r.heat.glow) finishTask("task:glow");
        if (!isDone("task:fuse") && r.heat.fuseBlown) finishTask("task:fuse");
      }
    },
    [round, miss, isDone, finishTask, challengeStars, badge],
  );

  const retry = () => {
    setMiss(null);
    setAttempt((a) => a + 1);
  };

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<CraneLab key={round === null ? "free" : `order-${round}-${attempt}`} onReading={onReading} order={round !== null ? ORDERS[round] : null} />}
      simNote="Strength is drawn as growing in step with turns × current. A real electromagnet's pull grows faster at first and then levels off when the iron is full. The iron core is taken as 30 times stronger than air here. Wire temperatures come from a simple heat-loss rule, so treat them as rough values."
      challengeBody={
        <div className="text-sm text-white/60">
          {round !== null ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Truck {round + 1} of {ORDERS.length}: needs exactly {ORDERS[round]} iron pieces
              </div>
              {miss !== null ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-rose-300">
                    The truck got {miss}, not {ORDERS[round]}. Change the turns or cells and try again.
                  </span>
                  <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={retry}>
                    Try again
                  </button>
                </div>
              ) : (
                <div className="mt-1 text-xs">One trip only. Tip: lift first, count what is on the magnet, then swing.</div>
              )}
            </div>
          ) : (
            <button
              className="btn-ghost !px-3 !py-1.5 text-sm"
              onClick={() => {
                setMiss(null);
                setRound(0);
              }}
            >
              {filled ? "Load the trucks again" : "Open the scrap yard"}
            </button>
          )}
          {filled > 0 && (
            <div className="mt-1 text-xs">
              Trucks filled: {filled} of {ORDERS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
