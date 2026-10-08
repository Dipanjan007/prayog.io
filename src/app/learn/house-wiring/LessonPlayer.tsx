"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import HouseWiring, { type WiringReading } from "@/components/sim/HouseWiring";
import { BUDGETS, lesson } from "@/content/lessons/house-wiring";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [round, setRound] = useState<number | null>(null);
  const [cleared, setCleared] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [shocked, setShocked] = useState(false);
  const [shortSteps, setShortSteps] = useState({ blown: false, fixed: false });
  const handledMonth = useRef(0);
  // Each round remounts the sim and its month ids start again from 1.
  useEffect(() => {
    handledMonth.current = 0;
  }, [round]);

  const lastReading = useRef<WiringReading | null>(null);
  const onReading = useCallback(
    (r: WiringReading) => {
      lastReading.current = r;
      if (round !== null) {
        const m = r.month;
        if (!m || !m.budget || m.id === handledMonth.current) return;
        handledMonth.current = m.id;
        if (m.budget.ok) {
          const done = round + 1;
          setCleared((c) => Math.max(c, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === BUDGETS.length) badge("budget-boss");
          }
          if (done < BUDGETS.length) {
            setRound(done);
            setFeedback(`Within budget! ${BUDGETS[round].name} is sorted. On to the next household.`);
          } else {
            setRound(null);
            setFeedback("All three households are within budget. Great planning!");
          }
        } else setFeedback(null);
        return;
      }
      if (!isDone("predict")) return;
      if (!isDone("task:overload") && r.trips.light > 0) finishTask("task:overload");
      if (r.short.happened) {
        setShortSteps((s) => (s.blown && s.fixed === r.short.lampOn ? s : { blown: true, fixed: r.short.lampOn }));
        if (!isDone("task:short") && r.short.lampOn) finishTask("task:short");
      }
      if (r.earth.shocks > 0) setShocked(true);
      if (!isDone("task:earth") && r.earth.savedByEarth > 0) finishTask("task:earth");
      if (!isDone("task:month") && r.month) finishTask("task:month");
      if (!isDone("task:top") && r.pick?.correct) finishTask("task:top");
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

  const start = (n: number | null) => {
    setRound(n);
    setFeedback(null);
  };
  const target = round !== null ? BUDGETS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<HouseWiring key={round ?? "free"} onReading={onReading} budget={target} />}
      simNote="Currents, fuse ratings and bills use real values at 220 V. The moving dots only show more or less current; real charges drift far more slowly. A real fuse melts in a split second, so the sim slows that down. The MCB here trips the moment the load passes its rating, while real MCBs allow a small overload for a short time. The fault bench uses typical resistances: wiring 0.5 Ω, earth path 2 Ω and a person about 1000 Ω. The shock is a cartoon."
      taskExtras={{
        "task:short": (
          <div className="mt-2 text-xs text-white/50">
            {shortSteps.blown ? "✓" : "○"} Fuse blown by a short circuit · {shortSteps.fixed ? "✓" : "○"} Cord replaced and lamp glowing
          </div>
        ),
        "task:earth": (
          <div className="mt-2 text-xs text-white/50">
            {shocked ? "✓" : "○"} Touched it without earth · ○ Fuse blown through the earth wire
          </div>
        ),
      }}
      challengeBody={
        <div className="min-w-0 flex-1 text-sm text-white/60">
          {target ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Household {round! + 1} of {BUDGETS.length}: {target.name}
              </div>
              <div className="mt-1 text-xs">{target.story}</div>
              <div className="mt-1 text-xs">
                Budget: ₹{target.budget.toLocaleString("en-IN")} a month. Set the hours in the Bill panel and run the month.
              </div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => start(0)}>
              {cleared ? "Plan the budgets again" : "Start budget planning"}
            </button>
          )}
          {feedback && <div className="mt-2 text-xs text-lime-300">{feedback}</div>}
          {cleared > 0 && (
            <div className="mt-1 text-xs">
              Households within budget: {cleared} of {BUDGETS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
