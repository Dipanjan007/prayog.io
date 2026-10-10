"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import TwinLab, { type TwinReading } from "@/components/sim/TwinLab";
import { TWIN_ROUNDS, lesson } from "@/content/lessons/twin-triangles";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [sure, setSure] = useState({ SAS: false, ASA: false, RHS: false });
  const [round, setRound] = useState<number | null>(null);
  const [sent, setSent] = useState(0);

  const lastReading = useRef<TwinReading | null>(null);
  const onReading = useCallback(
    (r: TwinReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "round" && r.ok) {
          const done = round + 1;
          setSent((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === TWIN_ROUNDS.length) badge("clue-master");
          }
          // Leave the success on screen for a moment before the next triangle.
          setTimeout(() => setRound(done < TWIN_ROUNDS.length ? done : null), 1600);
        }
        return;
      }
      if (!isDone("predict") || r.mode !== "build") return;
      if (!isDone("task:sss") && r.clue === "SSS" && r.kind === "one") finishTask("task:sss");
      if (!isDone("task:ssa") && r.clue === "SSA" && r.kind === "two") finishTask("task:ssa");
      if (!isDone("task:aaa") && r.clue === "AAA" && r.kind === "many") finishTask("task:aaa");
      if ((r.clue === "SAS" || r.clue === "ASA" || r.clue === "RHS") && r.kind === "one") {
        const key = r.clue;
        setSure((s) => {
          if (s[key]) return s;
          const next = { ...s, [key]: true };
          if (next.SAS && next.ASA && next.RHS) queueMicrotask(() => !isDone("task:three") && finishTask("task:three"));
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

  const tr = round !== null ? TWIN_ROUNDS[round] : null;
  const tick = (v: boolean) => (v ? "✓" : "○");

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<TwinLab key={round ?? "free"} onReading={onReading} round={tr} />}
      simNote="Each picture is zoomed to fit the screen, so compare the lengths written on it rather than the size on screen. Sides go up in 1 cm steps and angles in 5° steps."
      taskExtras={{
        "task:three": (
          <div className="mt-2 text-xs text-white/50">
            {tick(sure.SAS)} SAS · {tick(sure.ASA)} ASA · {tick(sure.RHS)} RHS
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {tr ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Triangle {round! + 1} of {TWIN_ROUNDS.length}: {tr.name}
              </div>
              <div className="mt-1 text-xs">{tr.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {sent ? "Send the clues again" : "Start sending clues"}
            </button>
          )}
          {sent > 0 && (
            <div className="mt-1 text-xs">
              Clues that worked: {sent} of {TWIN_ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
