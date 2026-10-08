"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import BuoyancyTank, { formatLoad, type TankReading } from "@/components/sim/BuoyancyTank";
import { lesson } from "@/content/lessons/float-sink";
import { BOATS, GOOD_LOAD, getObject, maxLoad, type ObjectId } from "@/lib/sim/buoyancy";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [weighed, setWeighed] = useState<ObjectId[]>([]);
  const [shape, setShape] = useState({ bowl: false, ball: false });
  const [repel, setRepel] = useState({ rings: false, balloons: false });
  const outcomes = useRef(new Map<ObjectId, Set<string>>());
  const [round, setRound] = useState<number | null>(null);
  const [passed, setPassed] = useState(0);
  const [roundWon, setRoundWon] = useState(false);
  const [lastTry, setLastTry] = useState<string | null>(null);
  const handledLaunch = useRef(0);

  const lastReading = useRef<TankReading | null>(null);
  const onReading = useCallback(
    (r: TankReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode !== "boat" || !r.launched || r.launchId === handledLaunch.current) return;
        handledLaunch.current = r.launchId;
        const b = BOATS[round];
        const room = maxLoad(b) - r.load;
        setLastTry(
          r.sank
            ? `Too much! ${formatLoad(b, r.load)} sank it. Press Unload and try a smaller load.`
            : r.good
              ? `${formatLoad(b, r.load)} and still afloat. Well loaded!`
              : `It floats, but it could carry ${formatLoad(b, room)} more. Press Unload and add more.`,
        );
        if (r.good) {
          const done = round + 1;
          setPassed((p) => Math.max(p, done));
          setRoundWon(true);
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === BOATS.length) badge("cargo-captain");
          }
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "tank") {
        const settled = r.fullyUnder || r.floating;
        if (!isDone("task:drop") && r.object === "stone" && !r.released && r.fullyUnder && r.reading < r.weight) finishTask("task:drop");
        if (!isDone("task:overflow") && settled && r.overflow > 0 && Math.abs(r.overflow - r.upthrust) < 1e-6) {
          setWeighed((prev) => {
            if (prev.includes(r.object)) return prev;
            const next = [...prev, r.object];
            if (next.length >= 2) queueMicrotask(() => !isDone("task:overflow") && finishTask("task:overflow"));
            return next;
          });
        }
        if (r.outcome) {
          const set = outcomes.current.get(r.object) ?? new Set<string>();
          set.add(r.outcome);
          outcomes.current.set(r.object, set);
          if (!isDone("task:liquid") && set.size === 2) finishTask("task:liquid");
          if (!isDone("task:shape") && ((r.object === "bowl" && r.outcome === "floats") || (r.object === "steelball" && r.outcome === "sinks"))) {
            setShape((s) => {
              const next = { bowl: s.bowl || r.object === "bowl", ball: s.ball || r.object === "steelball" };
              if (next.bowl === s.bowl && next.ball === s.ball) return s;
              if (next.bowl && next.ball) queueMicrotask(() => !isDone("task:shape") && finishTask("task:shape"));
              return next;
            });
          }
        }
      } else if (r.mode === "repel" && !isDone("task:repel")) {
        setRepel((s) => {
          const next = { rings: s.rings || r.ringsFloat, balloons: s.balloons || r.balloonsApart };
          if (next.rings === s.rings && next.balloons === s.balloons) return s;
          if (next.rings && next.balloons) queueMicrotask(() => !isDone("task:repel") && finishTask("task:repel"));
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

  const startRound = (n: number | null) => {
    handledLaunch.current = 0;
    setRoundWon(false);
    setLastTry(null);
    setRound(n);
  };

  const current = round !== null ? BOATS[round] : null;
  const tick = (b: boolean) => (b ? "✓" : "○");

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<BuoyancyTank key={round ?? "free"} onReading={onReading} boat={current} />}
      simNote="Masses, volumes and densities are typical real values, and the upthrust and overflow are worked out exactly from them with g = 9.8 m/s². Objects are drawn to scale with the tank. The ring magnet gaps use a simple point-magnet model and the balloon charge per rub is a rough estimate, so treat those sizes as close, not exact. Boat hulls are simplified to straight-sided boxes."
      taskExtras={{
        "task:overflow": (
          <div className="mt-2 text-xs text-white/50">
            Weighed: {weighed.length ? weighed.map((id) => getObject(id).label).join(" and ") : "nothing yet"} ({Math.min(weighed.length, 2)} of 2)
          </div>
        ),
        "task:shape": (
          <div className="mt-2 text-xs text-white/50">
            {tick(shape.bowl)} Bowl floats · {tick(shape.ball)} Ball sinks
          </div>
        ),
        "task:repel": (
          <div className="mt-2 text-xs text-white/50">
            {tick(repel.rings)} A ring floats · {tick(repel.balloons)} Balloons pushed apart
          </div>
        ),
      }}
      challengeBody={
        <div className="min-w-0 flex-1 text-sm text-white/60">
          {current ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Boat {round! + 1} of {BOATS.length}: {current.name}
              </div>
              <div className="mt-1 text-xs">
                Most cargo = water density × hull volume − boat mass. Load at least {Math.round(GOOD_LOAD * 100)}% of that, but not more.
              </div>
              {lastTry && <div className={`mt-2 ${roundWon ? "text-lime-300" : "text-amber-200"}`}>{lastTry}</div>}
              {roundWon && (
                <button className="btn-ghost mt-2 !px-3 !py-1.5 text-sm" onClick={() => startRound(round! + 1 < BOATS.length ? round! + 1 : null)}>
                  {round! + 1 < BOATS.length ? "Next boat" : "Finish"}
                </button>
              )}
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => startRound(0)}>
              {passed ? "Load the boats again" : "Start loading"}
            </button>
          )}
          {passed > 0 && (
            <div className="mt-1 text-xs">
              Boats loaded: {passed} of {BOATS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
