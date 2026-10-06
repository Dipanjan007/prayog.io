"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import CircuitBoard, { type CircuitReading } from "@/components/sim/CircuitBoard";
import { BROKEN_TORCH, lesson, repairStars } from "@/content/lessons/circuits";
import { MATERIALS, type MaterialId } from "@/lib/sim/circuit";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [preset, setPreset] = useState<{ name: string; slots: typeof BROKEN_TORCH } | null>(null);
  const [tested, setTested] = useState<Partial<Record<MaterialId, boolean>>>({});
  const [repair, setRepair] = useState<{ moves: number; fixed: boolean } | null>(null);

  const lastReading = useRef<CircuitReading | null>(null);
  const onReading = useCallback(
    (r: CircuitReading) => {
      lastReading.current = r;
      setTested(r.tested);
      const glowing = r.state.closed && r.state.brightness > 0;
      if (r.preset === "torch") {
        setRepair((p) => (p?.moves === r.moves && p.fixed === glowing ? p : { moves: r.moves, fixed: glowing }));
        if (glowing && isDone("ideas")) {
          const stars = repairStars(r.moves);
          challengeStars(stars);
          if (stars === 3) badge("torch-fixer");
        }
      }
      if (!isDone("predict")) return;
      if (!isDone("task:light") && glowing) finishTask("task:light");
      if (!isDone("task:switch") && r.switchCycled && glowing) finishTask("task:switch");
      const results = Object.values(r.tested);
      if (!isDone("task:test") && results.length >= 6 && results.includes(true) && results.includes(false)) finishTask("task:test");
    },
    [isDone, finishTask, challengeStars, badge],
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

  const entries = Object.entries(tested) as [MaterialId, boolean][];

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<CircuitBoard onReading={onReading} preset={preset} />}
      simNote="Each cell gives 1.5 V and each torch bulb is rated 3 V. Parts are joined in one loop (in series)."
      taskExtras={{
        "task:test": (
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl border border-lime-300/30 bg-lime-300/5 p-2">
              <div className="text-xs uppercase tracking-wider text-lime-200">Conductors</div>
              {entries.filter(([, c]) => c).map(([id]) => <div key={id}>{MATERIALS[id].label}</div>)}
            </div>
            <div className="rounded-xl border border-rose-300/30 bg-rose-300/5 p-2">
              <div className="text-xs uppercase tracking-wider text-rose-200">Insulators</div>
              {entries.filter(([, c]) => !c).map(([id]) => <div key={id}>{MATERIALS[id].label}</div>)}
            </div>
            <div className="col-span-2 text-xs text-white/50">{entries.length} of 6 tested</div>
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setPreset({ name: "torch", slots: BROKEN_TORCH })}>
            {repair ? "Reload broken torch" : "Load broken torch"}
          </button>
          {repair && (
            <div className="mt-1 text-xs">
              {repair.fixed ? `Fixed in ${repair.moves} moves!` : `Moves: ${repair.moves}`}
            </div>
          )}
        </div>
      }
    />
  );
}
