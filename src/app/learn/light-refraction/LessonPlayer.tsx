"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import OpticsBench, { type OpticsReading } from "@/components/sim/OpticsBench";
import { SCREEN_ROUNDS, lesson } from "@/content/lessons/light-refraction";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [round, setRound] = useState<number | null>(null);
  const [focused, setFocused] = useState(0);
  const [tried, setTried] = useState<number[]>([]);

  const lastReading = useRef<OpticsReading | null>(null);
  const onReading = useCallback(
    (r: OpticsReading) => {
      lastReading.current = r;
      setTried(r.block.tried);
      if (round !== null && r.sharp) {
        const done = round + 1;
        setFocused((f) => Math.max(f, done));
        if (isDone("ideas")) {
          challengeStars(done);
          if (done === SCREEN_ROUNDS.length) badge("sharp-focus");
        }
        setRound(done < SCREEN_ROUNDS.length ? done : null);
      }
      if (!isDone("predict")) return;
      if (!isDone("task:bend") && r.mode === "block" && r.block.i >= 30) finishTask("task:bend");
      if (!isDone("task:snell") && r.mode === "block") {
        const t = r.block.tried;
        if (t.length >= 3 && Math.max(...t) - Math.min(...t) >= 20) finishTask("task:snell");
      }
      const L = r.lens;
      if (r.mode === "lens" && L.kind === "convex") {
        if (!isDone("task:camera") && L.u < 2 * -L.f) finishTask("task:camera");
        if (!isDone("task:magnifier") && L.u > -L.f) finishTask("task:magnifier");
      }
      if (!isDone("task:mirror") && r.mode === "mirror" && r.mirror.kind === "convex") finishTask("task:mirror");
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

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<OpticsBench onReading={onReading} screen={round !== null ? SCREEN_ROUNDS[round] : null} />}
      simNote="Lenses and mirrors here are ideal and thin, so images land exactly where the formulas say. Distances use the NCERT sign convention."
      taskExtras={{
        "task:snell": <div className="mt-2 text-xs text-white/50">Angles tried: {tried.length ? tried.map((a) => `${a}°`).join(", ") : "none yet"}</div>,
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
            {round === null ? (focused ? "Play again" : "Put up the screen") : `Screen ${round + 1} of ${SCREEN_ROUNDS.length}: ${SCREEN_ROUNDS[round]} cm`}
          </button>
          {round !== null && <div className="mt-1 text-xs">Use the Lens bench with a convex lens.</div>}
          {focused > 0 && <div className="mt-1 text-xs">Screens focused: {focused} of {SCREEN_ROUNDS.length}</div>}
        </div>
      }
    />
  );
}
