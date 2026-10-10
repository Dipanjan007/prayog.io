"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import SquareCubeLab, { type SquareCubeReading } from "@/components/sim/SquareCubeLab";
import { ORDERS, lesson } from "@/content/lessons/squares-cubes";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [perfects, setPerfects] = useState<number[]>([]);
  const [pairs, setPairs] = useState<string[]>([]);
  const [round, setRound] = useState<number | null>(null);
  const [built, setBuilt] = useState(0);

  const lastReading = useRef<SquareCubeReading | null>(null);
  const onReading = useCallback(
    (r: SquareCubeReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "order" && r.ok) {
          const done = round + 1;
          setBuilt((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === ORDERS.length) badge("block-builder");
          }
          // Leave the finished build on screen for a moment before the next order.
          setTimeout(() => setRound(done < ORDERS.length ? done : null), 1400);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "tiles") {
        if (r.left === 0 && r.N > 1)
          setPerfects((prev) => {
            if (prev.includes(r.N)) return prev;
            const next = [...prev, r.N];
            if (next.length === 3) queueMicrotask(() => !isDone("task:perfect") && finishTask("task:perfect"));
            return next;
          });
        if (!isDone("task:odd") && r.odd && r.side === 5 && r.left === 0) finishTask("task:odd");
        if (!isDone("task:root") && r.N === 50) finishTask("task:root");
      } else if (r.mode === "cubes") {
        if (!isDone("task:cube") && r.n === 4) finishTask("task:cube");
      } else if (r.mode === "sums" && r.total === 1729) {
        const key = `${Math.min(r.a, r.b)}-${Math.max(r.a, r.b)}`;
        setPairs((prev) => {
          if (prev.includes(key)) return prev;
          const next = [...prev, key];
          if (next.length === 2) queueMicrotask(() => !isDone("task:taxi") && finishTask("task:taxi"));
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
      sim={<SquareCubeLab key={round ?? "free"} onReading={onReading} order={order} />}
      simNote="Each tile is 1 × 1 and each block is a 1 × 1 × 1 unit cube, so you can count them. Yellow tiles are the ones left over, waiting for the next layer."
      taskExtras={{
        "task:perfect": (
          <div className="mt-2 text-xs text-white/50">
            Perfect squares found: {perfects.length} of 3{perfects.length ? ` (${[...perfects].sort((x, y) => x - y).join(", ")})` : ""}
          </div>
        ),
        "task:taxi": <div className="mt-2 text-xs text-white/50">Pairs that make 1729: {pairs.length} of 2</div>,
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
              {built ? "Take the orders again" : "Take the first order"}
            </button>
          )}
          {built > 0 && (
            <div className="mt-1 text-xs">
              Orders built: {built} of {ORDERS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
