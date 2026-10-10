"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import ChessboardLab, { type ChessReading } from "@/components/sim/ChessboardLab";
import { GRAIN_ROUNDS, lesson } from "@/content/lessons/chessboard";
import { RACE_DAYS, SQUARES, formatIndian, halfDay } from "@/lib/sim/chessboard";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  // Doubling times for which the half-covered day has been found.
  const [halves, setHalves] = useState<number[]>([]);
  const [round, setRound] = useState<number | null>(null);
  const [found, setFound] = useState(0);

  const lastReading = useRef<ChessReading | null>(null);
  const onReading = useCallback(
    (r: ChessReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "round" && r.ok) {
          const done = round + 1;
          setFound((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === GRAIN_ROUNDS.length) badge("sissa-square");
          }
          // Leave the answer on screen for a moment before the next amount.
          setTimeout(() => setRound(done < GRAIN_ROUNDS.length ? done : null), 2000);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "board") {
        if (r.square === 8 && !isDone("task:row")) finishTask("task:row");
        if (r.square === SQUARES && !isDone("task:board")) finishTask("task:board");
      } else if (r.mode === "race") {
        if (r.day === RACE_DAYS && !isDone("task:race")) finishTask("task:race");
      } else if (r.mode === "pond") {
        if (r.day !== halfDay(r.T)) return;
        setHalves((s) => {
          if (s.includes(r.T)) return s;
          const next = [...s, r.T];
          if (next.length >= 2) queueMicrotask(() => !isDone("task:pond") && finishTask("task:pond"));
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

  const amount = round !== null ? GRAIN_ROUNDS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<ChessboardLab key={round ?? "free"} onReading={onReading} round={amount} />}
      simNote="Square 1 is top left and the squares run along each row. Masses use about 25 mg for one grain of raw rice (1,000 grains weigh about 20 to 30 g), so they are rough. Offer B's money is shown in rupees and paise."
      taskExtras={{
        "task:pond": (
          <div className="mt-2 text-xs text-white/50">
            {halves.length >= 1 ? "✓" : "○"} Half day for one doubling time · {halves.length >= 2 ? "✓" : "○"} for another
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {amount ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Amount {round! + 1} of {GRAIN_ROUNDS.length}: {amount.name}
              </div>
              <div className="mt-1 text-xs">{amount.brief}</div>
              <div className="mt-1 text-xs text-white/40">More than {formatIndian(amount.amount)} grains on one square.</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {found ? "Pick the squares again" : "Pick the squares"}
            </button>
          )}
          {found > 0 && (
            <div className="mt-1 text-xs">
              Squares found: {found} of {GRAIN_ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
