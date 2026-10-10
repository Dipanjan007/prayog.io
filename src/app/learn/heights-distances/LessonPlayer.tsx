"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import Clinometer, { type ClinoReading } from "@/components/sim/Clinometer";
import { lesson } from "@/content/lessons/heights-distances";
import { MYSTERIES } from "@/lib/sim/heights";
import { useLesson } from "@/lib/useLesson";

/** How close (degrees) the clinometer must be to a target angle. */
const NEAR = 0.5;

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [spots, setSpots] = useState({ s60: false, s30: false });
  const [round, setRound] = useState<number | null>(null);
  const [found, setFound] = useState(0);

  const lastReading = useRef<ClinoReading | null>(null);
  const onReading = useCallback(
    (r: ClinoReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "guess" && r.ok) {
          const done = round + 1;
          setFound((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === MYSTERIES.length) badge("mystery-measurer");
          }
          // Leave "Spot on!" on screen for a moment before the next mystery.
          setTimeout(() => setRound(done < MYSTERIES.length ? done : null), 1600);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "tower") {
        if (!isDone("task:45") && r.id === "tree" && Math.abs(r.theta - 45) <= NEAR) finishTask("task:45");
        if (r.id === "flood") {
          const s60 = Math.abs(r.theta - 60) <= NEAR;
          const s30 = Math.abs(r.theta - 30) <= NEAR;
          if (s60 || s30)
            setSpots((s) => {
              const next = { s60: s.s60 || s60, s30: s.s30 || s30 };
              if (next.s60 === s.s60 && next.s30 === s.s30) return s;
              if (next.s60 && next.s30) queueMicrotask(() => !isDone("task:3060") && finishTask("task:3060"));
              return next;
            });
        }
      } else if (r.mode === "sea") {
        if (!isDone("task:depression") && Math.abs(r.dep - 45) <= NEAR) finishTask("task:depression");
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

  const mystery = round !== null ? MYSTERIES[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<Clinometer key={round ?? "free"} onReading={onReading} mystery={mystery} />}
      simNote="The clinometer reads to 0.1° and is held at eye height, 1.5 m above the ground. The person is drawn taller than to scale so you can see them next to a 72 m tower."
      taskExtras={{
        "task:3060": (
          <div className="mt-2 text-xs text-white/50">
            {spots.s60 ? "✓" : "○"} 60° spot · {spots.s30 ? "✓" : "○"} 30° spot
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {mystery ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Mystery {round! + 1} of {MYSTERIES.length}: {mystery.emoji} {mystery.label}
              </div>
              <div className="mt-1 text-xs">Walk to any spot, read θ and tan θ, then work out the height and type it in.</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {found ? "Measure the mysteries again" : "Measure the mysteries"}
            </button>
          )}
          {found > 0 && (
            <div className="mt-1 text-xs">
              Heights found: {found} of {MYSTERIES.length}
            </div>
          )}
        </div>
      }
    />
  );
}
