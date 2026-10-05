"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import AirTrack, { type AirTrackResult } from "@/components/sim/AirTrack";
import { ROUNDS, TOLERANCE, lesson } from "@/content/lessons/forces-motion";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [round, setRound] = useState<number | null>(null);
  const [cleared, setCleared] = useState(0);
  const [miss, setMiss] = useState<number | null>(null);
  const [pushes, setPushes] = useState<{ F: number; m: number; a: number }[]>([]);
  const [kinds, setKinds] = useState<string[]>([]);
  const handled = useRef(0);
  // Each round remounts the track, and its run ids start again from 1, so forget the last one seen.
  // Without this the first push of a round could share an id with the last judged run and be ignored.
  useEffect(() => {
    handled.current = 0;
  }, [round]);

  const onReading = useCallback(
    (r: AirTrackResult) => {
      if (r.runId === handled.current) return;
      handled.current = r.runId;
      const s = r.settings;

      if (round !== null) {
        const target = ROUNDS[round];
        if (r.exitB !== null && Math.abs(r.exitB - target.v) <= TOLERANCE) {
          const done = round + 1;
          setCleared((c) => Math.max(c, done));
          setMiss(null);
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === ROUNDS.length) badge("perfect-knock");
          }
          setRound(done < ROUNDS.length ? done : null);
        } else setMiss(r.exitB ?? (r.hit ? r.hit.after[1] / s.mB : 0));
        return;
      }

      if (!isDone("predict")) return;
      if (s.mode === "collide") {
        if (!isDone("task:inertia") && s.air && r.glide >= 0.5 && r.glideDrift < 1e-6) finishTask("task:inertia");
        if (!isDone("task:balanced") && !s.air && !r.moved) finishTask("task:balanced");
        if (!isDone("task:fma") && s.air && r.moved) {
          const entry = { F: s.F, m: s.mA, a: r.pushAcc };
          setPushes((prev) => {
            const next = [...prev.filter((p) => !(p.F === entry.F && p.m === entry.m)), entry].slice(-6);
            if (next.some((p) => p.F === entry.F && p.m !== entry.m)) queueMicrotask(() => finishTask("task:fma"));
            return next;
          });
        }
        if (!isDone("task:collide") && r.hit) {
          setKinds((prev) => {
            if (prev.includes(r.hit!.kind)) return prev;
            const next = [...prev, r.hit!.kind];
            if (next.length === 2) queueMicrotask(() => finishTask("task:collide"));
            return next;
          });
        }
      } else if (!isDone("task:recoil") && s.mA !== s.mB && r.afterPush) finishTask("task:recoil");
    },
    [round, isDone, finishTask, challengeStars, badge],
  );

  const target = round !== null ? ROUNDS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<AirTrack key={round ?? "free"} onReading={onReading} target={target} />}
      simNote="An ideal air track: with the air on there is no friction at all. Slow motion plays the run at 0.4 × real speed. Collisions happen in an instant, and the carts are drawn taller when they are heavier."
      taskExtras={{
        "task:fma": pushes.length > 0 && (
          <div className="mt-2 space-y-0.5 text-xs text-white/55">
            {pushes.map((p) => (
              <div key={`${p.F}-${p.m}`}>
                F = {p.F} N on {p.m} kg gives a = {p.a.toFixed(2)} m/s² (F ÷ m = {(p.F / p.m).toFixed(2)})
              </div>
            ))}
          </div>
        ),
        "task:collide": <div className="mt-2 text-xs text-white/50">Collisions tried: {kinds.length ? kinds.join(" and ") : "none yet"}</div>,
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {target ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Round {round! + 1} of {ROUNDS.length}: {target.label}
              </div>
              <div className="mt-1 text-xs">
                Cart B is {target.mB} kg, the collision is {target.kind}, and the air is on. Set cart A&apos;s mass, the force and the push time.
              </div>
              {miss !== null && (
                <div className="mt-1 text-xs text-amber-200">
                  Cart B left at {miss.toFixed(2)} m/s. The target is {target.v.toFixed(2)} m/s. Adjust and push again.
                </div>
              )}
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {cleared ? "Play the rounds again" : "Start target practice"}
            </button>
          )}
          {cleared > 0 && (
            <div className="mt-1 text-xs">
              Rounds cleared: {cleared} of {ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
