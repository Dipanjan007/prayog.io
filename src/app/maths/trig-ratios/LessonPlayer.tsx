"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import RampLab, { type RampReading } from "@/components/sim/RampLab";
import { RAMP_ROUNDS, lesson } from "@/content/lessons/trig-ratios";
import { ANGLE, is345 } from "@/lib/sim/trig";
import { useLesson } from "@/lib/useLesson";

/** Different slide lengths to try at one angle. */
const LENGTHS_NEEDED = 3;

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [scale, setScale] = useState<{ theta: number; lens: number[] }>({ theta: -1, lens: [] });
  const [special, setSpecial] = useState({ a30: false, a45: false, a60: false });
  const [ends, setEnds] = useState({ lo: false, hi: false });
  const [round, setRound] = useState<number | null>(null);
  const [built, setBuilt] = useState(0);

  const lastReading = useRef<RampReading | null>(null);
  const onReading = useCallback(
    (r: RampReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "round" && r.ok) {
          const done = round + 1;
          setBuilt((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === RAMP_ROUNDS.length) badge("ramp-architect");
          }
          // Leave the success on screen for a moment before the next ramp.
          setTimeout(() => setRound(done < RAMP_ROUNDS.length ? done : null), 1400);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "slide") {
        setScale((s) => {
          if (s.theta !== r.theta) return { theta: r.theta, lens: [r.L] };
          if (s.lens.includes(r.L)) return s;
          const next = { theta: s.theta, lens: [...s.lens, r.L] };
          if (next.lens.length >= LENGTHS_NEEDED) queueMicrotask(() => !isDone("task:scale") && finishTask("task:scale"));
          return next;
        });
        const a30 = r.theta === 30;
        const a45 = r.theta === 45;
        const a60 = r.theta === 60;
        if (a30 || a45 || a60)
          setSpecial((s) => {
            const next = { a30: s.a30 || a30, a45: s.a45 || a45, a60: s.a60 || a60 };
            if (next.a30 === s.a30 && next.a45 === s.a45 && next.a60 === s.a60) return s;
            if (next.a30 && next.a45 && next.a60) queueMicrotask(() => !isDone("task:special") && finishTask("task:special"));
            return next;
          });
        const lo = r.theta === ANGLE.min;
        const hi = r.theta === ANGLE.max;
        if (lo || hi)
          setEnds((s) => {
            const next = { lo: s.lo || lo, hi: s.hi || hi };
            if (next.lo === s.lo && next.hi === s.hi) return s;
            if (next.lo && next.hi) queueMicrotask(() => !isDone("task:ends") && finishTask("task:ends"));
            return next;
          });
      } else if (r.mode === "build") {
        if (!isDone("task:345") && is345(r.rise, r.run)) finishTask("task:345");
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

  const rr = round !== null ? RAMP_ROUNDS[round] : null;
  const tick = (v: boolean) => (v ? "✓" : "○");

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<RampLab key={round ?? "free"} onReading={onReading} round={rr} />}
      simNote="In Slide, the drawing is to scale: a longer slide is drawn bigger, and the dashed lines show smaller slides at the same angle. In Build, each ramp is zoomed to fit the screen."
      taskExtras={{
        "task:scale": (
          <div className="mt-2 text-xs text-white/50">
            Lengths tried at one angle: {Math.min(scale.lens.length, LENGTHS_NEEDED)} of {LENGTHS_NEEDED}
          </div>
        ),
        "task:special": (
          <div className="mt-2 text-xs text-white/50">
            {tick(special.a30)} 30° · {tick(special.a45)} 45° · {tick(special.a60)} 60°
          </div>
        ),
        "task:ends": (
          <div className="mt-2 text-xs text-white/50">
            {tick(ends.lo)} 5° · {tick(ends.hi)} 85°
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {rr ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Ramp {round! + 1} of {RAMP_ROUNDS.length}: {rr.name}
              </div>
              <div className="mt-1 text-xs">{rr.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {built ? "Build the ramps again" : "Start building ramps"}
            </button>
          )}
          {built > 0 && (
            <div className="mt-1 text-xs">
              Ramps built: {built} of {RAMP_ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
