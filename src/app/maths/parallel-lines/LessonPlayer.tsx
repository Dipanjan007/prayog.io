"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import RailCrossing, { type RailReading } from "@/components/sim/RailCrossing";
import { ALIGN_ROUNDS, lesson } from "@/content/lessons/parallel-lines";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [roads, setRoads] = useState<{ vertical: number[]; linear: number[] }>({ vertical: [], linear: [] });
  const [zc, setZc] = useState({ slid: false, alternate: false, cointerior: false });
  const [round, setRound] = useState<number | null>(null);
  const [laidCount, setLaidCount] = useState(0);

  const lastReading = useRef<RailReading | null>(null);
  const onReading = useCallback(
    (r: RailReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "align" && r.ok) {
          const done = round + 1;
          setLaidCount((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === ALIGN_ROUNDS.length) badge("track-layer");
          }
          // Leave the success on screen for a moment before the next line.
          setTimeout(() => setRound(done < ALIGN_ROUNDS.length ? done : null), 1400);
        }
        return;
      }
      if (!isDone("predict") || r.mode !== "free") return;
      if (r.kind === "vertical" || r.kind === "linear") {
        const k = r.kind;
        setRoads((prev) => {
          if (prev[k].includes(r.road)) return prev;
          const next = { ...prev, [k]: [...prev[k], r.road] };
          if (next.vertical.length >= 2 && next.linear.length >= 2) queueMicrotask(() => !isDone("task:cross") && finishTask("task:cross"));
          return next;
        });
      }
      if (!isDone("task:corr") && r.kind === "corresponding" && r.parallel) finishTask("task:corr");
      if (r.parallel)
        setZc((z) => {
          const next = {
            slid: z.slid || r.offset !== 0,
            alternate: z.alternate || r.kind === "alternate",
            cointerior: z.cointerior || r.kind === "co-interior",
          };
          if (next.slid === z.slid && next.alternate === z.alternate && next.cointerior === z.cointerior) return z;
          if (next.slid && next.alternate && next.cointerior) queueMicrotask(() => !isDone("task:zc") && finishTask("task:zc"));
          return next;
        });
      // Spotting a crooked rail counts once the rails have been lined up at least once.
      if (!isDone("task:meet") && isDone("task:corr") && r.kind === "co-interior" && !r.parallel) finishTask("task:meet");
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

  const align = round !== null ? ALIGN_ROUNDS[round] : null;
  const tick = (b: boolean) => (b ? "✓" : "○");

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<RailCrossing key={round ?? "free"} onReading={onReading} round={align} />}
      simNote="Angles are in whole degrees. Rail l stays level; you turn the road and rail m. Real rails are much longer than the picture, so a tilt of 1° matters."
      taskExtras={{
        "task:cross": (
          <div className="mt-2 text-xs text-white/50">
            Vertically opposite: {Math.min(roads.vertical.length, 2)} of 2 road angles · Linear pair: {Math.min(roads.linear.length, 2)} of 2 road angles
          </div>
        ),
        "task:zc": (
          <div className="mt-2 text-xs text-white/50">
            {tick(zc.slid)} Slid rail m · {tick(zc.alternate)} Alternate · {tick(zc.cointerior)} Co-interior
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {align ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Line {round! + 1} of {ALIGN_ROUNDS.length}: {align.name}
              </div>
              <div className="mt-1 text-xs">{align.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {laidCount ? "Lay the lines again" : "Start laying lines"}
            </button>
          )}
          {laidCount > 0 && (
            <div className="mt-1 text-xs">
              Lines laid parallel: {laidCount} of {ALIGN_ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
