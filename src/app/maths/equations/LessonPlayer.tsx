"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import BalanceLab, { type BalanceReading } from "@/components/sim/BalanceLab";
import { PUZZLES, ROUNDS, WRITE_PICS, lesson } from "@/content/lessons/equations";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [written, setWritten] = useState<number[]>([]);
  const [round, setRound] = useState<number | null>(null);
  const [solvedRounds, setSolvedRounds] = useState(0);

  const lastReading = useRef<BalanceReading | null>(null);
  const onReading = useCallback(
    (r: BalanceReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "round" && r.ok) {
          const done = round + 1;
          setSolvedRounds((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === ROUNDS.length) badge("mandi-master");
          }
          // Leave the solved balance on screen for a moment before the next customer.
          setTimeout(() => setRound(done < ROUNDS.length ? done : null), 1600);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "solve") {
        if (!isDone("task:tilt") && !r.level) finishTask("task:tilt");
        if (r.solved !== null && r.solved === PUZZLES[r.puzzle].x) {
          if (r.puzzle === 0 && !isDone("task:level")) finishTask("task:level");
          if (r.puzzle === 1 && !isDone("task:share")) finishTask("task:share");
          if (r.puzzle === 2 && !isDone("task:both")) finishTask("task:both");
        }
      } else if (r.mode === "write" && r.ok) {
        setWritten((prev) => {
          if (prev.includes(r.pic)) return prev;
          const next = [...prev, r.pic];
          if (next.length === 2) queueMicrotask(() => !isDone("task:write") && finishTask("task:write"));
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

  const current = round !== null ? ROUNDS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<BalanceLab key={round ?? "free"} onReading={onReading} puzzles={PUZZLES} pictures={WRITE_PICS} round={current} />}
      simNote="Every bag on a balance holds the same number of marbles, x. Bags are weightless cloth, so only the marbles count. The bags show their number once you have found it."
      taskExtras={{
        "task:write": <div className="mt-2 text-xs text-white/50">Equations written: {written.length} of 2</div>,
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {current ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Customer {round! + 1} of {ROUNDS.length}: {current.name}
              </div>
              <div className="mt-1 text-xs">{current.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {solvedRounds ? "Play the mandi rush again" : "Open the mandi"}
            </button>
          )}
          {solvedRounds > 0 && (
            <div className="mt-1 text-xs">
              Balances solved at par: {solvedRounds} of {ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
