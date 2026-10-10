"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import RatioLab, { type RatioReading } from "@/components/sim/RatioLab";
import { ORDERS, lesson } from "@/content/lessons/proportion";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [mixes, setMixes] = useState<string[]>([]);
  const [places, setPlaces] = useState<string[]>([]);
  const [round, setRound] = useState<number | null>(null);
  const [filled, setFilled] = useState(0);

  const lastReading = useRef<RatioReading | null>(null);
  const onReading = useCallback(
    (r: RatioReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "order" && r.ok) {
          const done = round + 1;
          setFilled((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === ORDERS.length) badge("holi-mixer");
          }
          // Leave the success on screen for a moment before the next order.
          setTimeout(() => setRound(done < ORDERS.length ? done : null), 1400);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "paint") {
        if (!isDone("task:add") && r.blue === 3 && r.yellow === 4) finishTask("task:add");
        if (r.same) {
          const key = `${r.blue}:${r.yellow}`;
          setMixes((prev) => {
            if (prev.includes(key)) return prev;
            const next = [...prev, key];
            if (next.length === 3) queueMicrotask(() => !isDone("task:line") && finishTask("task:line"));
            return next;
          });
        }
      } else if (r.mode === "recipe") {
        if (!isDone("task:recipe") && r.glasses === 12 && r.right) finishTask("task:recipe");
      } else if (r.mode === "map" && r.ok) {
        setPlaces((prev) => {
          if (prev.includes(r.place)) return prev;
          const next = [...prev, r.place];
          if (next.length === 2) queueMicrotask(() => !isDone("task:map") && finishTask("task:map"));
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

  const order = round !== null ? ORDERS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<RatioLab key={round ?? "free"} onReading={onReading} order={order} />}
      simNote="Paint is measured in whole cups, up to 12 of each colour. Mixes with the same ratio get exactly the same colour. The map is drawn on a 1 cm grid."
      taskExtras={{
        "task:line": <div className="mt-2 text-xs text-white/50">Matching buckets made: {mixes.length} of 3</div>,
        "task:map": <div className="mt-2 text-xs text-white/50">Places worked out: {places.length} of 2</div>,
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
              {filled ? "Take the orders again" : "Open the colour shop"}
            </button>
          )}
          {filled > 0 && (
            <div className="mt-1 text-xs">
              Orders delivered: {filled} of {ORDERS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
