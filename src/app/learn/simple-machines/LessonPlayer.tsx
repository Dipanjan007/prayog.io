"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import MachineBench, { type MachineReading } from "@/components/sim/MachineBench";
import { LOADING_JOBS, lesson } from "@/content/lessons/simple-machines";
import { kgf, liftTime } from "@/lib/sim/machines";
import { useLesson } from "@/lib/useLesson";

type RampRun = { id: number; m: number; L: number; F: number; FL: number; mgh: number };

/** Two frictionless runs with the same cart where one force is (about) half the other. */
function halvedPair(runs: RampRun[]) {
  for (const a of runs)
    for (const b of runs) if (a.m === b.m && b.F <= 0.52 * a.F) return [a, b] as const;
  return null;
}

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [signs, setSigns] = useState({ pos: false, neg: false, zero: false });
  const [mas, setMas] = useState({ two: false, four: false });
  const [rampRuns, setRampRuns] = useState<RampRun[]>([]);
  const [round, setRound] = useState<number | null>(null);
  const [solved, setSolved] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const lastReading = useRef<MachineReading | null>(null);
  const onReading = useCallback(
    (r: MachineReading) => {
      lastReading.current = r;

      if (round !== null) {
        const job = LOADING_JOBS[round];
        let ok = false;
        let text = "";
        if (job.kind === "ramp" && r.mode === "ramp") {
          ok = r.F <= job.maxF;
          text = ok
            ? `Loaded! The pull was only ${r.F.toFixed(0)} N on a ${r.L.toFixed(2)} m ramp.`
            : `The spring balance read ${r.F.toFixed(0)} N. That is more than ${job.maxF} N. Try a longer ramp.`;
        } else if (job.kind === "pulley" && r.mode === "pulley") {
          const limit = kgf(job.maxEffortKg);
          ok = r.effort <= limit;
          text = ok
            ? `Lifted! The effort was ${r.effort.toFixed(0)} N with ${r.n} strands holding the crate.`
            : `The effort was ${r.effort.toFixed(0)} N, more than the ${limit.toFixed(0)} N the worker can pull. Try more strands.`;
        } else if (job.kind === "motor" && r.mode === "motor") {
          const smallest = Math.min(...job.motors.filter((P) => liftTime(job.m, job.h, P) <= job.maxT));
          ok = r.P === smallest;
          text = ok
            ? `Done in ${r.t.toFixed(1)} s with the ${r.P} W motor, the smallest one that works.`
            : r.t > job.maxT
              ? `The ${r.P} W motor took ${r.t.toFixed(1)} s. That misses the ${job.maxT} s deadline.`
              : `It works in ${r.t.toFixed(1)} s, but a smaller motor would also do the job. Try again.`;
        } else return;
        setFeedback({ ok, text });
        if (ok) {
          const done = round + 1;
          setSolved((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === LOADING_JOBS.length) badge("load-master");
          }
          setRound(done < LOADING_JOBS.length ? done : null);
          if (done === LOADING_JOBS.length) setFeedback({ ok: true, text: "All three jobs done. The loading crew is impressed!" });
        }
        return;
      }

      if (!isDone("predict")) return;
      if (r.mode === "work") {
        const W = r.run.W;
        setSigns((s) => {
          const next = { pos: s.pos || W > 1e-9, neg: s.neg || W < -1e-9, zero: s.zero || Math.abs(W) <= 1e-9 };
          if (next.pos === s.pos && next.neg === s.neg && next.zero === s.zero) return s;
          if (next.pos && next.neg && next.zero) queueMicrotask(() => !isDone("task:signs") && finishTask("task:signs"));
          return next;
        });
      } else if (r.mode === "pulley") {
        setMas((s) => {
          const next = { two: s.two || r.n === 2, four: s.four || r.n === 4 };
          if (next.two === s.two && next.four === s.four) return s;
          if (next.two && next.four) queueMicrotask(() => !isDone("task:ma") && finishTask("task:ma"));
          return next;
        });
        if (!isDone("task:friction") && r.friction && r.k >= 2) finishTask("task:friction");
      } else if (r.mode === "ramp" && !r.friction) {
        setRampRuns((prev) => {
          if (prev.some((p) => p.id === r.runId)) return prev;
          const next = [...prev, { id: r.runId, m: r.m, L: r.L, F: r.F, FL: r.FL, mgh: r.mgh }].slice(-6);
          if (halvedPair(next)) queueMicrotask(() => !isDone("task:ramp") && finishTask("task:ramp"));
          return next;
        });
      } else if (r.mode === "power" && !isDone("task:power") && Math.abs(r.tA - r.tB) >= 1) finishTask("task:power");
    },
    [round, isDone, finishTask, challengeStars, badge],
  );

  // The sim only reports finished runs, so replay the last one once the prediction is locked in
  // and again once the ideas are done, so a run made earlier still counts.
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
    setRound(n);
    setFeedback(null);
  };

  const job = round !== null ? LOADING_JOBS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<MachineBench key={round ?? "free"} onReading={onReading} job={job} />}
      simNote="Loads move slowly at a steady speed, so the force you apply just balances the weight or the friction. Ropes and pulleys are light. With small friction each pulley wastes about 3% of the rope force, and the cart's wheels have a friction coefficient of 0.05. The pulley drawing is not to scale, and Power races are sped up when they are long, while the clocks show real time."
      taskExtras={{
        "task:signs": (
          <div className="mt-2 text-xs text-white/50">
            {signs.pos ? "✓" : "○"} Positive · {signs.neg ? "✓" : "○"} Negative · {signs.zero ? "✓" : "○"} Zero
          </div>
        ),
        "task:ma": (
          <div className="mt-2 text-xs text-white/50">
            {mas.two ? "✓" : "○"} MA 2 · {mas.four ? "✓" : "○"} MA 4
          </div>
        ),
        "task:ramp": rampRuns.length > 0 && (
          <div className="mt-2 space-y-0.5 text-xs text-white/55 tabular-nums">
            {rampRuns.map((p) => (
              <div key={p.id}>
                {p.m} kg, L = {p.L.toFixed(2)} m: F = {p.F.toFixed(0)} N, F × L = {p.FL.toFixed(0)} J, m × g × h = {p.mgh.toFixed(0)} J
              </div>
            ))}
          </div>
        ),
      }}
      challengeBody={
        <div className="min-w-0 flex-1 text-sm text-white/60">
          {job ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Job {round! + 1} of {LOADING_JOBS.length}: {job.name}
              </div>
              <div className="mt-1 text-xs">{job.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => startRound(0)}>
              {solved ? "Do the jobs again" : "Start the loading jobs"}
            </button>
          )}
          {feedback && <div className={`mt-2 text-xs ${feedback.ok ? "text-lime-300" : "text-amber-200"}`}>{feedback.text}</div>}
          {solved > 0 && (
            <div className="mt-1 text-xs">
              Jobs done: {solved} of {LOADING_JOBS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
