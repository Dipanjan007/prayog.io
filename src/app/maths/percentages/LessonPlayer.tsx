"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import PercentLab, { type PercentReading } from "@/components/sim/PercentLab";
import { GOALS, lesson } from "@/content/lessons/percentages";
import { useLesson } from "@/lib/useLesson";

const GRID_TARGETS = [25, 50, 75];

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [shaded, setShaded] = useState<number[]>([]);
  const [orders, setOrders] = useState<Record<string, string[]>>({});
  const [round, setRound] = useState<number | null>(null);
  const [paid, setPaid] = useState(0);

  const lastReading = useRef<PercentReading | null>(null);
  const onReading = useCallback(
    (r: PercentReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "goal" && r.ok) {
          const done = round + 1;
          setPaid((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === GOALS.length) badge("bill-buster");
          }
          // Leave the bill on screen for a moment before the next customer.
          setTimeout(() => setRound(done < GOALS.length ? done : null), 1400);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "grid") {
        if (GRID_TARGETS.includes(r.p))
          setShaded((prev) => {
            if (prev.includes(r.p)) return prev;
            const next = [...prev, r.p];
            if (next.length === GRID_TARGETS.length) queueMicrotask(() => !isDone("task:grid") && finishTask("task:grid"));
            return next;
          });
      } else if (r.mode === "shop") {
        if (!isDone("task:sale") && r.item === "bag" && r.g === 0 && r.total === 60000) finishTask("task:sale");
        if (r.d > 0 && r.g > 0) {
          const key = `${r.item}-${r.d}-${r.g}`;
          setOrders((prev) => {
            const seen = prev[key] ?? [];
            if (seen.includes(r.order)) return prev;
            const next = { ...prev, [key]: [...seen, r.order] };
            if (next[key].length === 2) queueMicrotask(() => !isDone("task:order") && finishTask("task:order"));
            return next;
          });
        }
      } else if (r.mode === "updown") {
        if (!isDone("task:updown") && r.up === 20 && r.down === 20) finishTask("task:updown");
        if (!isDone("task:undo") && r.up === 25 && Math.abs(r.end - 100) < 1e-9) finishTask("task:undo");
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

  const goal = round !== null ? GOALS[round] : null;
  const orderSeen = Object.values(orders).reduce((best, v) => Math.max(best, v.length), 0);

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<PercentLab key={round ?? "free"} onReading={onReading} goal={goal} />}
      simNote="Tap the grid to shade up to a square. In Shop, the bill is worked out line by line, just like a real tax bill. Up & down always starts from ₹100."
      taskExtras={{
        "task:grid": (
          <div className="mt-2 text-xs text-white/50">
            {GRID_TARGETS.map((t) => `${shaded.includes(t) ? "✓" : "○"} ${t}%`).join(" · ")}
          </div>
        ),
        "task:order": (
          <div className="mt-2 text-xs text-white/50">
            Orders compared for the same bill: {orderSeen} of 2
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {goal ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Customer {round! + 1} of {GOALS.length}: {goal.name}
              </div>
              <div className="mt-1 text-xs">{goal.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {paid ? "Serve the customers again" : "Open the shop counter"}
            </button>
          )}
          {paid > 0 && (
            <div className="mt-1 text-xs">
              Bills matched: {paid} of {GOALS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
