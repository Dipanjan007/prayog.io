"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import PowerLab, { type PowerReading } from "@/components/sim/PowerLab";
import { TARGETS, lesson } from "@/content/lessons/powers";
import { BIG_ITEMS } from "@/lib/sim/powers";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [splits, setSplits] = useState<string[]>([]);
  const [written, setWritten] = useState<string[]>([]);
  const [round, setRound] = useState<number | null>(null);
  const [hit, setHit] = useState(0);

  const lastReading = useRef<PowerReading | null>(null);
  const onReading = useCallback(
    (r: PowerReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "target" && r.ok) {
          const done = round + 1;
          setHit((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === TARGETS.length) badge("fold-master");
          }
          // Leave the result on screen for a moment before the next target.
          setTimeout(() => setRound(done < TARGETS.length ? done : null), 1400);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "fold") {
        if (!isDone("task:everest") && r.n === 27) finishTask("task:everest");
        if (!isDone("task:moon") && r.n === 42) finishTask("task:moon");
      } else if (r.mode === "laws") {
        if (r.op === "mul" && r.base === 2 && r.m + r.n === 10) {
          const key = `${Math.min(r.m, r.n)}-${Math.max(r.m, r.n)}`;
          setSplits((prev) => {
            if (prev.includes(key)) return prev;
            const next = [...prev, key];
            if (next.length === 2) queueMicrotask(() => !isDone("task:laws") && finishTask("task:laws"));
            return next;
          });
        }
        if (!isDone("task:zero") && r.op === "div" && r.m === r.n && r.m > 0) finishTask("task:zero");
      } else if (r.mode === "sci" && r.ok) {
        setWritten((prev) => {
          if (prev.includes(r.item)) return prev;
          const next = [...prev, r.item];
          if (next.length === 2) queueMicrotask(() => !isDone("task:sci") && finishTask("task:sci"));
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

  const target = round !== null ? TARGETS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<PowerLab key={round ?? "free"} onReading={onReading} target={target} />}
      simNote="The paper is 0.1 mm thick, about one page of a notebook. The ruler beside it is a power-of-10 ruler: each step up is 10 times taller than the one below."
      taskExtras={{
        "task:laws": (
          <div className="mt-2 text-xs text-white/50">
            Ways to make 2¹⁰ found: {splits.length} of 2
          </div>
        ),
        "task:sci": (
          <div className="mt-2 text-xs text-white/50">
            Numbers written: {written.length} of 2
            {written.length ? ` (${written.map((id) => BIG_ITEMS.find((x) => x.id === id)?.name).join(", ")})` : ""}
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {target ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Target {round! + 1} of {TARGETS.length}: {target.name}
              </div>
              <div className="mt-1 text-xs">{target.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {hit ? "Fold for the targets again" : "Start folding for targets"}
            </button>
          )}
          {hit > 0 && (
            <div className="mt-1 text-xs">
              Targets passed: {hit} of {TARGETS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
