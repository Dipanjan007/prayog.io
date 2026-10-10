"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import InverseLab, { type InverseReading } from "@/components/sim/InverseLab";
import { ROUNDS, lesson } from "@/content/lessons/inverse-proportion";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [speeds, setSpeeds] = useState<number[]>([]);
  const [crews, setCrews] = useState<number[]>([]);
  const [round, setRound] = useState<number | null>(null);
  const [met, setMet] = useState(0);

  const lastReading = useRef<InverseReading | null>(null);
  const onReading = useCallback(
    (r: InverseReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "round" && r.ok) {
          const done = round + 1;
          setMet((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === ROUNDS.length) badge("deadline-beater");
          }
          // Leave the success on screen for a moment before the next deadline.
          setTimeout(() => setRound(done < ROUNDS.length ? done : null), 1400);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "trip" && r.arrived) {
        setSpeeds((prev) => {
          if (prev.includes(r.speed)) return prev;
          const next = [...prev, r.speed];
          if (next.includes(40) && next.includes(80)) queueMicrotask(() => !isDone("task:double") && finishTask("task:double"));
          if (next.length >= 3) queueMicrotask(() => !isDone("task:product") && finishTask("task:product"));
          return next;
        });
      } else if (r.mode === "work") {
        if (!isDone("task:wall") && r.workers === 6 && r.days === 4) finishTask("task:wall");
        if (r.workers === 2 || r.workers === 6)
          setCrews((prev) => {
            if (prev.includes(r.workers)) return prev;
            const next = [...prev, r.workers];
            if (next.length === 2) queueMicrotask(() => !isDone("task:contrast") && finishTask("task:contrast"));
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

  const r = round !== null ? ROUNDS[round] : null;
  const driven = speeds.filter((s) => s === 40 || s === 80).length;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<InverseLab key={round ?? "free"} onReading={onReading} round={r} />}
      simNote="The car drives at one steady speed the whole way, with no stops. The road from Delhi to Agra is taken as 240 km. Every worker builds at the same rate."
      taskExtras={{
        "task:double": <div className="mt-2 text-xs text-white/50">{`${speeds.includes(40) ? "✓" : "○"} 40 km/h · ${speeds.includes(80) ? "✓" : "○"} 80 km/h`} ({driven} of 2)</div>,
        "task:product": <div className="mt-2 text-xs text-white/50">Speeds driven: {Math.min(speeds.length, 3)} of 3</div>,
        "task:contrast": (
          <div className="mt-2 text-xs text-white/50">
            {`${crews.includes(2) ? "✓" : "○"} 2 workers · ${crews.includes(6) ? "✓" : "○"} 6 workers`}
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {r ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Deadline {round! + 1} of {ROUNDS.length}: {r.name}
              </div>
              <div className="mt-1 text-xs">{r.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {met ? "Race the deadlines again" : "Take on the deadlines"}
            </button>
          )}
          {met > 0 && (
            <div className="mt-1 text-xs">
              Deadlines met: {met} of {ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
