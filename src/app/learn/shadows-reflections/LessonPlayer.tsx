"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import ShadowLab, { type ShadowReading } from "@/components/sim/ShadowLab";
import { lesson } from "@/content/lessons/shadows-reflections";
import { MAZE_LEVELS, OBJECT_MATERIALS, type MaterialId } from "@/lib/sim/shadows";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [level, setLevel] = useState<number | null>(null);
  const [cleared, setCleared] = useState(0);
  const [tried, setTried] = useState<MaterialId[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const lastReading = useRef<ShadowReading | null>(null);
  const onReading = useCallback(
    (r: ShadowReading) => {
      lastReading.current = r;
      if (r.mode === "maze") {
        if (level === null || r.level !== level || !r.hit) return;
        const done = level + 1;
        setCleared((c) => Math.max(c, done));
        if (isDone("ideas")) {
          challengeStars(done);
          if (done === MAZE_LEVELS.length) badge("laser-ace");
        }
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setLevel(done < MAZE_LEVELS.length ? done : null), 1400);
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "shadow") {
        if (!isDone("task:grow") && r.material === "cardboard" && r.k >= 3) finishTask("task:grow");
        if (!isDone("task:materials"))
          setTried((prev) => {
            if (prev.includes(r.material)) return prev;
            const next = [...prev, r.material];
            if (next.length === 3) queueMicrotask(() => finishTask("task:materials"));
            return next;
          });
        if (!isDone("task:penumbra") && r.lamp === "wide" && r.material !== "glass" && r.hasUmbra && r.penumbraBand >= 2) finishTask("task:penumbra");
      }
      if (!isDone("task:pinhole") && r.mode === "pinhole" && r.imageH > r.candleH && r.sharp) finishTask("task:pinhole");
      if (!isDone("task:periscope") && r.mode === "mirror" && r.periscopeSolved) finishTask("task:periscope");
    },
    [level, isDone, finishTask, challengeStars, badge],
  );

  // The sim only reports changes, so replay what it shows now once the prediction or the ideas step is done.
  const predicted = api.done.has("predict");
  const ideasDone = api.done.has("ideas");
  useEffect(() => {
    if ((predicted || ideasDone) && lastReading.current && lastReading.current.mode !== "maze") onReading(lastReading.current);
  }, [predicted, ideasDone, onReading]);

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<ShadowLab key={level === null ? "free" : `level${level}`} onReading={onReading} level={level} />}
      simNote="The side view squeezes distances along the bench so everything fits; heights are drawn to scale with each other. The shadow on the wall is worked out ray by ray from a round lamp. How much light glass, butter paper and cardboard let through are typical values, not measurements. In the pinhole camera the hole is drawn wider than it really is so you can see it."
      taskExtras={{
        "task:materials": (
          <div className="mt-2 text-xs text-white/45">Tried: {tried.length ? tried.map((m) => OBJECT_MATERIALS[m].label).join(", ") : "nothing yet"}</div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {level !== null ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3" aria-live="polite">
              <div className="text-white">
                Level {level + 1} of {MAZE_LEVELS.length}: {MAZE_LEVELS[level].name}
              </div>
              <div className="mt-1">Turn the mirrors in the picture.</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setLevel(0)}>
              {cleared ? "Play the levels again" : "Start the laser levels"}
            </button>
          )}
          {cleared > 0 && <div className="mt-1 text-xs">Levels cleared: {cleared} of {MAZE_LEVELS.length}</div>}
        </div>
      }
    />
  );
}
