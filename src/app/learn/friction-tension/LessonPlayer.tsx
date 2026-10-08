"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import FrictionLab, { type FrictionReading } from "@/components/sim/FrictionLab";
import { lesson } from "@/content/lessons/friction-tension";
import { BLOCK_MASS, ROUNDS, SURFACES, SURFACE_IDS, TOLERANCE, roundPassed, roundTarget } from "@/lib/sim/friction";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  // Steady sliding readings, keyed "surface|mass", and the same for rollers.
  const slides = useRef(new Set<string>());
  const rolls = useRef(new Set<string>());
  const [found, setFound] = useState({ surfaces: [] as string[], masses: [] as number[], setups: [] as string[] });
  const [round, setRound] = useState<number | null>(null);
  const [passed, setPassed] = useState(0);
  const [roundWon, setRoundWon] = useState(false);
  const [lastTry, setLastTry] = useState<string | null>(null);
  const handledRun = useRef(0);

  const lastReading = useRef<FrictionReading | null>(null);
  const onReading = useCallback(
    (r: FrictionReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode !== "string" || r.setup !== "pulley" || r.runId === handledRun.current) return;
        handledRun.current = r.runId;
        const rd = ROUNDS[round];
        const target = roundTarget(rd);
        if (!r.result.moves) {
          setLastTry(`Stuck! ${r.mh.toFixed(2)} kg is not enough to beat static friction. Try a bigger hanging mass.`);
          return;
        }
        const ok = roundPassed(rd, r.result.a);
        setLastTry(
          ok
            ? `${r.mh.toFixed(2)} kg gave ${r.result.a.toFixed(2)} m/s². Spot on!`
            : `${r.mh.toFixed(2)} kg gave ${r.result.a.toFixed(2)} m/s². ${r.result.a > target ? "Too fast: try a smaller hanging mass." : "Too slow: try a bigger hanging mass."}`,
        );
        if (ok) {
          const done = round + 1;
          setPassed((p) => Math.max(p, done));
          setRoundWon(true);
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === ROUNDS.length) badge("pulley-pro");
          }
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "pull") {
        if (r.steady === null) return;
        const key = `${r.surface}|${r.mass}`;
        if (r.rolling) {
          rolls.current.add(key);
        } else {
          slides.current.add(key);
          if (!isDone("task:peak") && r.surface === "wood" && Math.abs(r.mass - BLOCK_MASS) < 1e-9 && r.peak !== null && r.peak > r.steady)
            finishTask("task:peak");
          const surfaces = SURFACE_IDS.filter((s) => slides.current.has(`${s}|${r.mass}`));
          if (!isDone("task:surface") && surfaces.length === SURFACE_IDS.length) finishTask("task:surface");
          const masses = [...slides.current].filter((k) => k.startsWith(`${r.surface}|`)).map((k) => Number(k.split("|")[1]));
          if (!isDone("task:load") && masses.length >= 2) finishTask("task:load");
          setFound((f) => ({ ...f, surfaces: surfaces.map((s) => SURFACES[s].label), masses: masses.sort((a, b) => a - b) }));
        }
        if (!isDone("task:roll") && rolls.current.has(key) && slides.current.has(key)) finishTask("task:roll");
      } else if (r.result.moves) {
        setFound((f) => {
          if (f.setups.includes(r.setup)) return f;
          const setups = [...f.setups, r.setup];
          if (setups.length === 2) queueMicrotask(() => !isDone("task:string") && finishTask("task:string"));
          return { ...f, setups };
        });
      }
    },
    [round, isDone, finishTask, challengeStars, badge],
  );

  // The sim only reports changes, so replay what it shows now once the prediction is locked in
  // and again once the ideas are done, so a measurement made earlier still counts.
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
    handledRun.current = 0;
    setRoundWon(false);
    setLastTry(null);
    setRound(n);
  };

  const current = round !== null ? ROUNDS[round] : null;
  const tick = (b: boolean) => (b ? "✓" : "○");

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={
        <FrictionLab
          key={round ?? "free"}
          onReading={onReading}
          target={current ? { surface: current.surface, load: current.load, a: roundTarget(current) } : null}
        />
      }
      simNote="Friction coefficients are typical values for a wooden block (real ones change with dust, polish and moisture), and g = 9.8 m/s². The pull rises at a steady 4 N each second until the block slips, and then the hand keeps it at 0.15 m/s, like a careful student would. On rollers the reading rises briefly after the start: that extra pull is what speeds the block up. Strings are light and do not stretch, and the pulley has no friction."
      taskExtras={{
        "task:surface": (
          <div className="mt-2 text-xs text-white/50">
            Measured with the last load: {found.surfaces.length ? found.surfaces.join(", ") : "nothing yet"} ({found.surfaces.length} of 3)
          </div>
        ),
        "task:load": (
          <div className="mt-2 text-xs text-white/50">
            Masses measured on the last surface: {found.masses.length ? found.masses.map((m) => `${m} kg`).join(", ") : "none yet"}
          </div>
        ),
        "task:string": (
          <div className="mt-2 text-xs text-white/50">
            {tick(found.setups.includes("pulley"))} Pulley moved · {tick(found.setups.includes("tow"))} Tow moved
          </div>
        ),
      }}
      challengeBody={
        <div className="min-w-0 flex-1 text-sm text-white/60">
          {current ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Round {round! + 1} of {ROUNDS.length}: {current.name}
              </div>
              <div className="mt-1 text-xs">
                M = {(BLOCK_MASS + current.load).toFixed(1)} kg on {SURFACES[current.surface].label.toLowerCase()} (μs = {SURFACES[current.surface].muS}, μk ={" "}
                {SURFACES[current.surface].muK}). Target a = {roundTarget(current).toFixed(2)} m/s², within {TOLERANCE}.
              </div>
              {lastTry && <div className={`mt-2 ${roundWon ? "text-lime-300" : "text-amber-200"}`}>{lastTry}</div>}
              {roundWon && (
                <button className="btn-ghost mt-2 !px-3 !py-1.5 text-sm" onClick={() => startRound(round! + 1 < ROUNDS.length ? round! + 1 : null)}>
                  {round! + 1 < ROUNDS.length ? "Next round" : "Finish"}
                </button>
              )}
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => startRound(0)}>
              {passed ? "Play the puzzles again" : "Start the puzzles"}
            </button>
          )}
          {passed > 0 && (
            <div className="mt-1 text-xs">
              Rounds solved: {passed} of {ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
