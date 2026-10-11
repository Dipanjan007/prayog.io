"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import DecimalLab, { type DecReading } from "@/components/sim/DecimalLab";
import { JOBS, lesson } from "@/content/lessons/decimals";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [compared, setCompared] = useState({ a: false, b: false });
  const [shifted, setShifted] = useState({ up: false, down: false });
  const [round, setRound] = useState<number | null>(null);
  const [jobsDone, setJobsDone] = useState(0);

  const lastReading = useRef<DecReading | null>(null);
  const onReading = useCallback(
    (r: DecReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "round" && r.ok) {
          const done = round + 1;
          setJobsDone((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === JOBS.length) badge("photo-finish");
          }
          // Leave the success on screen for a moment before the next job.
          setTimeout(() => setRound(done < JOBS.length ? done : null), 1400);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "zoom") {
        if (!isDone("task:zoom") && r.v === 2350) finishTask("task:zoom");
        if (r.v === 450 || r.v === 500)
          setCompared((c) => {
            const next = { a: c.a || r.v === 450, b: c.b || r.v === 500 };
            if (next.a === c.a && next.b === c.b) return c;
            if (next.a && next.b) queueMicrotask(() => !isDone("task:compare") && finishTask("task:compare"));
            return next;
          });
      } else if (r.mode === "shop") {
        const items = Object.entries(r.basket).filter(([, n]) => n > 0);
        const right = items.length === 2 && r.basket.samosa === 1 && r.basket.lassi === 1;
        if (!isDone("task:bill") && right && r.paid === 5000 && r.change !== null) finishTask("task:bill");
      } else if (r.mode === "chart" && r.start === "3.75") {
        if (r.value === "375" || r.value === "0.0375")
          setShifted((s) => {
            const next = { up: s.up || r.value === "375", down: s.down || r.value === "0.0375" };
            if (next.up === s.up && next.down === s.down) return s;
            if (next.up && next.down) queueMicrotask(() => !isDone("task:shift") && finishTask("task:shift"));
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

  const job = round !== null ? JOBS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<DecimalLab key={round ?? "free"} onReading={onReading} job={job} />}
      simNote="The number line is exact: every step is a whole number of thousandths, and money is counted in paise, so nothing gets rounded."
      taskExtras={{
        "task:compare": (
          <div className="mt-2 text-xs text-white/50">
            {compared.a ? "✓" : "○"} Pin on 0.45 · {compared.b ? "✓" : "○"} Pin on 0.5
          </div>
        ),
        "task:shift": (
          <div className="mt-2 text-xs text-white/50">
            {shifted.up ? "✓" : "○"} 3.75 → 375 · {shifted.down ? "✓" : "○"} 3.75 → 0.0375
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {job ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Job {round! + 1} of {JOBS.length}: {job.name}
              </div>
              <div className="mt-1 text-xs">{job.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {jobsDone ? "Run sports day again" : "Run sports day"}
            </button>
          )}
          {jobsDone > 0 && (
            <div className="mt-1 text-xs">
              Jobs done: {jobsDone} of {JOBS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
