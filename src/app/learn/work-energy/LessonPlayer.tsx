"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import EnergyLab, { type EnergyReading } from "@/components/sim/EnergyLab";
import { CREST_STARS, TEST_TRACK, lesson } from "@/content/lessons/work-energy";
import { useLesson } from "@/lib/useLesson";

type Run = { h0: number; cleared: boolean; crestSpeed: number | null };

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [testing, setTesting] = useState(false);
  const [lastRun, setLastRun] = useState<Run | null>(null);
  const [classes, setClasses] = useState<number[]>([]);
  const judged = useRef(false);

  const lastReading = useRef<EnergyReading | null>(null);
  const onReading = useCallback(
    (r: EnergyReading) => {
      lastReading.current = r;
      if (testing) {
        if (!r.running) {
          judged.current = false;
          return;
        }
        if (judged.current) return;
        if (r.crestSpeed !== null) {
          judged.current = true;
          setLastRun({ h0: r.track.h0, cleared: true, crestSpeed: r.crestSpeed });
          const stars = CREST_STARS.filter((limit) => r.crestSpeed! < limit).length;
          if (isDone("ideas")) {
            challengeStars(stars);
            if (stars === 3) badge("just-clear");
          }
        } else if (r.turnedBack) {
          judged.current = true;
          setLastRun({ h0: r.track.h0, cleared: false, crestSpeed: null });
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "coaster") {
        if (!isDone("task:convert") && !r.friction && r.running && r.x > 5 && r.ke > r.pe) finishTask("task:convert");
        if (!isDone("task:climb") && !r.friction && r.turnedBack) finishTask("task:climb");
        if (!isDone("task:friction") && r.friction && r.heat > 0 && (r.finished || r.turnedBack || r.settled)) finishTask("task:friction");
      } else {
        const L = r.lever;
        if (!L.balanced || L.effort <= 0) return;
        if (!isDone("task:balance") && L.cls === 1 && L.effort < L.load) finishTask("task:balance");
        if (!isDone("task:classes") && L.cls !== 1) {
          setClasses((prev) => {
            if (prev.includes(L.cls)) return prev;
            const next = [...prev, L.cls];
            if (next.length === 2) queueMicrotask(() => finishTask("task:classes"));
            return next;
          });
        }
      }
    },
    [testing, isDone, finishTask, challengeStars, badge],
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
      sim={<EnergyLab key={testing ? "test" : "free"} onReading={onReading} challenge={testing ? TEST_TRACK : null} />}
      simNote="The cart is a 100 kg point on the track. Friction (μ = 0.05) is taken as μmg cos θ, ignoring the extra push from curves, and there is no air drag. On narrow screens the hills are drawn up to twice as steep as they really are, to fit. The lever bar's own weight is ignored."
      taskExtras={{
        "task:classes": <div className="mt-2 text-xs text-white/50">Balanced so far: {classes.length ? [...classes].sort().map((c) => `Class ${c}`).join(" and ") : "none yet"}</div>,
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {testing ? (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setTesting(false)}>
              Back to free play
            </button>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setTesting(true)}>
              {lastRun ? "Open the test track again" : "Open the test track"}
            </button>
          )}
          {lastRun && (
            <div className="mt-1 text-xs">
              {lastRun.cleared
                ? `Start ${lastRun.h0.toFixed(1)} m: over the top at ${lastRun.crestSpeed!.toFixed(1)} m/s.`
                : `Start ${lastRun.h0.toFixed(1)} m: it rolled back. Friction needs more height.`}
            </div>
          )}
          <div className="text-xs text-white/40">Stars below 4 m/s and 2 m/s over the top</div>
        </div>
      }
    />
  );
}
