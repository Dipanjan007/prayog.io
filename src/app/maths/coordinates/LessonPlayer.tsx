"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import DroneGrid, { type GridReading } from "@/components/sim/DroneGrid";
import { DELIVERIES, lesson } from "@/content/lessons/coordinates";
import { useLesson } from "@/lib/useLesson";

const QUADS = ["I", "II", "III", "IV"] as const;

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [quads, setQuads] = useState<string[]>([]);
  const [axes, setAxes] = useState({ x: false, y: false });
  const [round, setRound] = useState<number | null>(null);
  const [delivered, setDelivered] = useState(0);

  const lastReading = useRef<GridReading | null>(null);
  const onReading = useCallback(
    (r: GridReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "drop" && r.ok) {
          const done = round + 1;
          setDelivered((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === DELIVERIES.length) badge("drone-courier");
          }
          // Leave "Delivered!" on screen for a moment before the next address.
          setTimeout(() => setRound(done < DELIVERIES.length ? done : null), 1400);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "plot") {
        const pl = r.place;
        if ((QUADS as readonly string[]).includes(pl))
          setQuads((prev) => {
            if (prev.includes(pl)) return prev;
            const next = [...prev, pl];
            if (next.length === 4) queueMicrotask(() => !isDone("task:quadrants") && finishTask("task:quadrants"));
            return next;
          });
        if (pl === "x-axis" || pl === "y-axis")
          setAxes((a) => {
            const next = { x: a.x || pl === "x-axis", y: a.y || pl === "y-axis" };
            if (next.x === a.x && next.y === a.y) return a;
            if (next.x && next.y) queueMicrotask(() => !isDone("task:axes") && finishTask("task:axes"));
            return next;
          });
        if (!isDone("task:mirror") && r.mirror === "x-axis" && r.p.x !== 0 && r.p.y !== 0) finishTask("task:mirror");
      } else if (r.mode === "distance") {
        const across = r.a.x !== r.b.x && r.a.y !== r.b.y;
        if (!isDone("task:distance") && across && r.dist === 5) finishTask("task:distance");
        if (!isDone("task:midpoint") && r.mid.x === 0 && r.mid.y === 0 && (r.a.x !== 0 || r.a.y !== 0)) finishTask("task:midpoint");
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

  const delivery = round !== null ? DELIVERIES[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<DroneGrid key={round ?? "free"} onReading={onReading} delivery={delivery} />}
      simNote="The drone moves in whole steps on the grid. Distances are in grid units; on this map 1 unit is 100 m."
      taskExtras={{
        "task:quadrants": (
          <div className="mt-2 text-xs text-white/50">
            {QUADS.map((q) => `${quads.includes(q) ? "✓" : "○"} ${q}`).join(" · ")}
          </div>
        ),
        "task:axes": (
          <div className="mt-2 text-xs text-white/50">
            {axes.x ? "✓" : "○"} x-axis · {axes.y ? "✓" : "○"} y-axis
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {delivery ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Delivery {round! + 1} of {DELIVERIES.length}: {delivery.name}
              </div>
              <div className="mt-1 text-xs">{delivery.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {delivered ? "Fly the deliveries again" : "Start the deliveries"}
            </button>
          )}
          {delivered > 0 && (
            <div className="mt-1 text-xs">
              Deliveries made: {delivered} of {DELIVERIES.length}
            </div>
          )}
        </div>
      }
    />
  );
}
