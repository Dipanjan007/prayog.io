"use client";

import { useCallback, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import ForceLab, { type ForceReading } from "@/components/sim/ForceLab";
import { lesson, ROUNDS } from "@/content/lessons/forces";
import { CRATE_WIDTH, SURFACES, type SurfaceId } from "@/lib/sim/forces";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [round, setRound] = useState<number | null>(null);
  const [passed, setPassed] = useState(0);
  const [roundWon, setRoundWon] = useState(false);
  const [lastTry, setLastTry] = useState<string | null>(null);
  const [slid, setSlid] = useState<SurfaceId[]>([]);
  const [weighed, setWeighed] = useState<string[]>([]);
  const [lifted, setLifted] = useState<string[]>([]);
  const sawHeld = useRef(false);
  const handledStop = useRef(0);

  const onReading = useCallback(
    (r: ForceReading) => {
      if (round !== null) {
        if (r.mode !== "push" || !r.stop || r.stop.id === handledStop.current) return;
        handledStop.current = r.stop.id;
        const [a, b] = ROUNDS[round].zone;
        const inZone = !r.stop.hitWall && r.stop.x >= a && r.stop.x + CRATE_WIDTH <= b;
        setLastTry(
          inZone
            ? `Stopped at ${r.stop.x.toFixed(2)} m: inside the target!`
            : r.stop.hitWall
              ? "Too hard: the crate hit the wall. Press Reset and try a softer or shorter push."
              : r.stop.x < a
                ? `Stopped at ${r.stop.x.toFixed(2)} m: short of the target. Press Reset and push a little longer.`
                : `Stopped at ${r.stop.x.toFixed(2)} m: past the target. Press Reset and push a little less.`,
        );
        if (inZone) {
          const done = round + 1;
          setPassed((p) => Math.max(p, done));
          setRoundWon(true);
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === ROUNDS.length) badge("crate-master");
          }
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "push") {
        if (r.heldStill && r.push >= 10) sawHeld.current = true;
        if (r.v > 0) {
          if (!isDone("task:static") && sawHeld.current) finishTask("task:static");
          if (!isDone("task:surface") && (r.surface === "ice" || r.surface === "sand")) {
            setSlid((prev) => {
              if (prev.includes(r.surface)) return prev;
              const next = [...prev, r.surface];
              if (next.includes("ice") && next.includes("sand")) queueMicrotask(() => finishTask("task:surface"));
              return next;
            });
          }
        }
        if (r.stop && r.stop.id !== handledStop.current) {
          handledStop.current = r.stop.id;
          if (!isDone("task:stop") && r.stop.coasted && !r.stop.hitWall) finishTask("task:stop");
        }
      } else if (r.mode === "spring") {
        if (!isDone("task:weigh")) {
          setWeighed((prev) => {
            if (prev.includes(r.item)) return prev;
            const next = [...prev, r.item];
            if (next.length === 3) queueMicrotask(() => finishTask("task:weigh"));
            return next;
          });
        }
      } else if (r.lifted && !isDone("task:field") && r.source !== "plain") {
        setLifted((prev) => {
          if (prev.includes(r.source)) return prev;
          const next = [...prev, r.source];
          if (next.includes("magnet") && next.includes("rubbed")) queueMicrotask(() => finishTask("task:field"));
          return next;
        });
      }
    },
    [round, isDone, finishTask, challengeStars, badge],
  );

  const startRound = (n: number | null) => {
    handledStop.current = 0;
    setRoundWon(false);
    setLastTry(null);
    setRound(n);
  };

  const current = round !== null ? ROUNDS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<ForceLab key={round ?? "free"} onReading={onReading} challenge={current} />}
      simNote="Crate: 20 kg, 0.6 m wide, with typical friction values for each floor. Force arrows are drawn to scale with each other. In No touch mode the pull sizes are made up to show the idea, not measured."
      taskExtras={{
        "task:surface": <div className="mt-2 text-xs text-white/50">Slid on: {slid.length ? slid.map((s) => SURFACES[s].label).join(" and ") : "nothing yet"}</div>,
        "task:weigh": <div className="mt-2 text-xs text-white/50">Weighed: {weighed.length} of 3</div>,
        "task:field": (
          <div className="mt-2 text-xs text-white/50">
            Lifted with: {lifted.length ? lifted.map((s) => (s === "magnet" ? "bar magnet" : "rubbed comb")).join(" and ") : "nothing yet"}
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {current ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Floor {round! + 1} of {ROUNDS.length}: {SURFACES[current.surface].label}
              </div>
              <div className="mt-1 text-xs">
                Target zone: {current.zone[0]} m to {current.zone[1]} m. The whole crate must stop inside it.
              </div>
              {lastTry && <div className={`mt-2 ${roundWon ? "text-lime-300" : "text-amber-200"}`}>{lastTry}</div>}
              {roundWon && (
                <button className="btn-ghost mt-2 !px-3 !py-1.5 text-sm" onClick={() => startRound(round! + 1 < ROUNDS.length ? round! + 1 : null)}>
                  {round! + 1 < ROUNDS.length ? "Next floor" : "Finish"}
                </button>
              )}
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => startRound(0)}>
              {passed ? "Play the floors again" : "Start the challenge"}
            </button>
          )}
          {passed > 0 && (
            <div className="mt-1 text-xs">
              Floors cleared: {passed} of {ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
