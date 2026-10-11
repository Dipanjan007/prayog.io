"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import ChanceLab, { type ChanceReading } from "@/components/sim/ChanceLab";
import { STALLS, lesson } from "@/content/lessons/probability";
import { leads } from "@/lib/sim/probability";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [coin, setCoin] = useState({ few: false, many: false });
  const [unequal, setUnequal] = useState({ spinner: false, bag: false });
  const [round, setRound] = useState<number | null>(null);
  const [built, setBuilt] = useState(0);

  const lastReading = useRef<ChanceReading | null>(null);
  const onReading = useCallback(
    (r: ChanceReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "build" && r.ok) {
          const done = round + 1;
          setBuilt((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === STALLS.length) badge("mela-maker");
          }
          // Leave the success on screen for a moment before the next stall.
          setTimeout(() => setRound(done < STALLS.length ? done : null), 1400);
        }
        return;
      }
      if (!isDone("predict") || r.mode !== "run") return;
      if (r.exp === "coin") {
        const few = r.n >= 10 && r.n <= 100;
        const many = r.n >= 1000;
        if (few || many)
          setCoin((c) => {
            // A thousand tosses only count once the student has looked at a short run first.
            const next = { few: c.few || few, many: c.many || (many && (c.few || few)) };
            if (next.few === c.few && next.many === c.many) return c;
            if (next.few && next.many) queueMicrotask(() => !isDone("task:coin") && finishTask("task:coin"));
            return next;
          });
      } else if (r.exp === "die") {
        if (!isDone("task:die") && r.n >= 600) finishTask("task:die");
      } else if (r.exp === "spinner" || r.exp === "bag") {
        if (r.n >= 500)
          setUnequal((u) => {
            if (u[r.exp as "spinner" | "bag"]) return u;
            const next = { ...u, [r.exp]: true };
            if (next.spinner && next.bag) queueMicrotask(() => !isDone("task:unequal") && finishTask("task:unequal"));
            return next;
          });
      } else if (r.exp === "sum") {
        if (!isDone("task:sum") && r.n >= 1000 && leads(r.counts, 5)) finishTask("task:sum");
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

  const stall = round !== null ? STALLS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<ChanceLab key={round ?? "free"} onReading={onReading} stall={stall} />}
      simNote="Every toss, roll, spin and draw is random, so your numbers will differ from a friend's. Marbles go back in the bag after each draw. The trace uses a stretched scale (1, 10, 100, 1000) so you can see both the first few tries and the thousands."
      taskExtras={{
        "task:coin": (
          <div className="mt-2 text-xs text-white/50">
            {coin.few ? "✓" : "○"} Looked at 10 to 100 tosses · {coin.many ? "✓" : "○"} Passed 1000 tosses
            {!coin.few && <span> (press Reset on Coin to start a short run)</span>}
          </div>
        ),
        "task:unequal": (
          <div className="mt-2 text-xs text-white/50">
            {unequal.spinner ? "✓" : "○"} Spinner 500 spins · {unequal.bag ? "✓" : "○"} Bag 500 draws
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {stall ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Stall {round! + 1} of {STALLS.length}: {stall.name}
              </div>
              <div className="mt-1 text-xs">{stall.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {built ? "Build the stalls again" : "Visit the mela"}
            </button>
          )}
          {built > 0 && (
            <div className="mt-1 text-xs">
              Stalls built: {built} of {STALLS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
