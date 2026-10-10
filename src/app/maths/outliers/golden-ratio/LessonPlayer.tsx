"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import SunflowerLab, { type GoldenReading } from "@/components/sim/SunflowerLab";
import { GOLDEN_ROUNDS, lesson } from "@/content/lessons/golden-ratio";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [ratio, setRatio] = useState({ ones: false, own: false });
  const [counted, setCounted] = useState<number[]>([]);
  const [angle, setAngle] = useState({ spokes: false, golden: false });
  const [round, setRound] = useState<number | null>(null);
  const [grown, setGrown] = useState(0);

  const lastReading = useRef<GoldenReading | null>(null);
  const onReading = useCallback(
    (r: GoldenReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "round" && r.ok) {
          const done = round + 1;
          setGrown((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === GOLDEN_ROUNDS.length) badge("golden-gardener");
          }
          // Leave the answer on screen for a moment before the next job.
          setTimeout(() => setRound(done < GOLDEN_ROUNDS.length ? done : null), 1800);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "numbers") {
        if (!r.phi) return;
        const ones = r.a === 1 && r.b === 1;
        setRatio((s) => {
          const next = { ones: s.ones || ones, own: s.own || !ones };
          if (next.ones === s.ones && next.own === s.own) return s;
          if (next.ones && next.own) queueMicrotask(() => !isDone("task:ratio") && finishTask("task:ratio"));
          return next;
        });
      } else if (r.mode === "rhythms") {
        if (r.beats < 4 || r.beats > 6) return;
        setCounted((s) => {
          if (s.includes(r.beats)) return s;
          const next = [...s, r.beats];
          if (next.length === 3) queueMicrotask(() => !isDone("task:rhythm") && finishTask("task:rhythm"));
          return next;
        });
      } else if (r.mode === "sunflower") {
        if (r.golden && r.smooth && !isDone("task:arms")) finishTask("task:arms");
        const spokes = r.spokes !== null;
        if (spokes || r.golden)
          setAngle((s) => {
            // The golden angle only counts once the spokes have been seen.
            const next = { spokes: s.spokes || spokes, golden: s.golden || (s.spokes && r.golden) };
            if (next.spokes === s.spokes && next.golden === s.golden) return s;
            if (next.spokes && next.golden) queueMicrotask(() => !isDone("task:angle") && finishTask("task:angle"));
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

  const job = round !== null ? GOLDEN_ROUNDS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<SunflowerLab key={round ?? "free"} onReading={onReading} round={job} />}
      simNote="Seeds are placed by Vogel's sunflower model: each seed turns by the same angle and sits a little further out, so every seed gets the same space. Packing compares the closest two seeds with a perfect honeycomb. The dial moves in steps of 0.1°; 137.5° on it is the exact golden angle, 137.507...°."
      taskExtras={{
        "task:ratio": (
          <div className="mt-2 text-xs text-white/50">
            {ratio.ones ? "✓" : "○"} 1.618 from 1 and 1 · {ratio.own ? "✓" : "○"} 1.618 from your own start
          </div>
        ),
        "task:rhythm": (
          <div className="mt-2 text-xs text-white/50">
            {[4, 5, 6].map((n) => `${counted.includes(n) ? "✓" : "○"} ${n} beats`).join(" · ")}
          </div>
        ),
        "task:angle": (
          <div className="mt-2 text-xs text-white/50">
            {angle.spokes ? "✓" : "○"} Seen spokes · {angle.golden ? "✓" : "○"} Found the best packing
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {job ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Job {round! + 1} of {GOLDEN_ROUNDS.length}: {job.name}
              </div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {grown ? "Tend the garden again" : "Tend the golden garden"}
            </button>
          )}
          {grown > 0 && (
            <div className="mt-1 text-xs">
              Jobs done: {grown} of {GOLDEN_ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
