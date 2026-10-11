"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import TilingLab, { type TilingReading } from "@/components/sim/TilingLab";
import { TILE_ROUNDS, lesson } from "@/content/lessons/tilings";
import { SHAPE_NAME, isMixed, vertexKey, type Sides } from "@/lib/sim/tiling";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [alone, setAlone] = useState<number[]>([]);
  const [mixes, setMixes] = useState<string[]>([]);
  const [floors, setFloors] = useState<string[]>([]);
  const [round, setRound] = useState<number | null>(null);
  const [finished, setFinished] = useState(0);

  const lastReading = useRef<TilingReading | null>(null);
  const onReading = useCallback(
    (r: TilingReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "round" && r.ok) {
          const done = round + 1;
          setFinished((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === TILE_ROUNDS.length) badge("corner-fitter");
          }
          // Leave the success on screen for a moment before the next corner.
          setTimeout(() => setRound(done < TILE_ROUNDS.length ? done : null), 1400);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "corner") {
        if (r.fit === "fits" && r.tiles.length && !isMixed(r.tiles)) {
          const n = r.tiles[0];
          setAlone((prev) => {
            if (prev.includes(n)) return prev;
            const next = [...prev, n].sort((a, b) => a - b);
            if (next.length === 3) queueMicrotask(() => !isDone("task:alone") && finishTask("task:alone"));
            return next;
          });
        }
        if (!isDone("task:pentagon") && r.fit === "overlap" && r.tiles.length === 4 && r.tiles.every((n) => n === 5)) finishTask("task:pentagon");
        if (r.fit === "fits" && isMixed(r.tiles)) {
          const key = vertexKey(r.tiles);
          setMixes((prev) => {
            if (prev.includes(key)) return prev;
            const next = [...prev, key];
            if (next.length === 2) queueMicrotask(() => !isDone("task:mix") && finishTask("task:mix"));
            return next;
          });
        }
      } else if (r.mode === "floor" && r.mixed) {
        setFloors((prev) => {
          if (prev.includes(r.floor)) return prev;
          const next = [...prev, r.floor];
          if (next.length === 2) queueMicrotask(() => !isDone("task:floor") && finishTask("task:floor"));
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

  const tileRound = round !== null ? TILE_ROUNDS[round] : null;
  const names = (ns: number[]) => ns.map((n) => `${SHAPE_NAME[n as Sides].toLowerCase()}s`).join(", ");

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<TilingLab key={round ?? "free"} onReading={onReading} round={tileRound} />}
      simNote="Every tile is a regular polygon with sides of the same length, so any two tiles can share a whole edge. Angles are exact."
      taskExtras={{
        "task:alone": (
          <div className="mt-2 text-xs text-white/50">
            Shapes that fill the corner alone: {alone.length} of 3{alone.length ? ` (${names(alone)})` : ""}
          </div>
        ),
        "task:mix": <div className="mt-2 text-xs text-white/50">Different mixes that fit: {Math.min(mixes.length, 2)} of 2</div>,
        "task:floor": <div className="mt-2 text-xs text-white/50">Mixed floors looked at: {Math.min(floors.length, 2)} of 2</div>,
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {tileRound ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Corner {round! + 1} of {TILE_ROUNDS.length}: {tileRound.name}
              </div>
              <div className="mt-1 text-xs">{tileRound.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {finished ? "Tile the corners again" : "Start tiling"}
            </button>
          )}
          {finished > 0 && (
            <div className="mt-1 text-xs">
              Corners finished: {finished} of {TILE_ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
