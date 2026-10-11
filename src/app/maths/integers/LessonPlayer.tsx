"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import IntegerLab, { type IntReading } from "@/components/sim/IntegerLab";
import { TRIPS, lesson } from "@/content/lessons/integers";
import { fmtInt, place } from "@/lib/sim/integers";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  // task:subneg needs both trips from floor 2; task:tokens two boards worth −2; task:signs two products.
  const [trips, setTrips] = useState({ sub: false, add: false });
  const [boards, setBoards] = useState<number[]>([]);
  const [signs, setSigns] = useState({ negPos: false, negNeg: false });
  const [round, setRound] = useState<number | null>(null);
  const [solved, setSolved] = useState(0);

  const lastReading = useRef<IntReading | null>(null);
  const onReading = useCallback(
    (r: IntReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "round" && r.ok) {
          const done = round + 1;
          setSolved((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === TRIPS.length) badge("lift-operator");
          }
          // Leave the success on screen for a moment before the next job.
          setTimeout(() => setRound(done < TRIPS.length ? done : null), 1600);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "move") {
        if (r.scene !== "lift") return;
        if (!isDone("task:down") && r.start === 3 && r.op === "+" && r.n === -5) finishTask("task:down");
        if (r.start === 2 && r.end === 5) {
          const sub = r.op === "−" && r.n === -3;
          const add = r.op === "+" && r.n === 3;
          if (sub || add)
            setTrips((t) => {
              const next = { sub: t.sub || sub, add: t.add || add };
              if (next.sub && next.add) queueMicrotask(() => !isDone("task:subneg") && finishTask("task:subneg"));
              return next;
            });
        }
      } else if (r.mode === "tokens") {
        if (r.value === -2)
          setBoards((b) => {
            if (b.includes(r.plus)) return b;
            const next = [...b, r.plus];
            if (next.length >= 2) queueMicrotask(() => !isDone("task:tokens") && finishTask("task:tokens"));
            return next;
          });
      } else if (r.mode === "times") {
        const negPos = r.a === -3 && r.b === 2;
        const negNeg = r.a === -3 && r.b === -2;
        if (negPos || negNeg)
          setSigns((s) => {
            const next = { negPos: s.negPos || negPos, negNeg: s.negNeg || negNeg };
            if (next.negPos === s.negPos && next.negNeg === s.negNeg) return s;
            if (next.negPos && next.negNeg) queueMicrotask(() => !isDone("task:signs") && finishTask("task:signs"));
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

  const trip = round !== null ? TRIPS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<IntegerLab key={round ?? "free"} onReading={onReading} trip={trip} />}
      simNote="Floor 0 is the ground floor and basements have negative numbers. In Times, a counts the jumps and b is the size of each jump; a negative count jumps the other way."
      taskExtras={{
        "task:subneg": (
          <div className="mt-2 text-xs text-white/50">
            {trips.sub ? "✓" : "○"} 2 − (−3) · {trips.add ? "✓" : "○"} 2 + 3
          </div>
        ),
        "task:tokens": (
          <div className="mt-2 text-xs text-white/50">
            Boards worth −2 found: {boards.length} of 2{boards.length ? ` (with ${boards.join(" and ")} + tokens)` : ""}
          </div>
        ),
        "task:signs": (
          <div className="mt-2 text-xs text-white/50">
            {signs.negPos ? "✓" : "○"} (−3) × 2 · {signs.negNeg ? "✓" : "○"} (−3) × (−2)
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {trip ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Job {round! + 1} of {TRIPS.length}: {trip.name}
              </div>
              <div className="mt-1 text-xs">{trip.brief}</div>
              <div className="mt-1 text-xs text-lime-200">
                Target: {trip.kind === "move" ? place(trip.scene, trip.target) : `a × (${fmtInt(trip.b)}) = ${fmtInt(trip.target)}`}
              </div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {solved ? "Run the control room again" : "Open the control room"}
            </button>
          )}
          {solved > 0 && (
            <div className="mt-1 text-xs">
              Jobs done: {solved} of {TRIPS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
