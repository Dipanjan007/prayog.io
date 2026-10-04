"use client";

import { useCallback, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import MotionTrack, { STOP_ZONE, type MotionReading } from "@/components/sim/MotionTrack";
import { lesson, STOP_STARS } from "@/content/lessons/motion";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [stop, setStop] = useState<MotionReading["lastStop"]>(null);
  const [lastRun, setLastRun] = useState<{ time: number; inZone: boolean; bumper: number } | null>(null);

  const onReading = useCallback(
    (r: MotionReading) => {
      if (r.lastStop) setStop((s) => (s?.time === r.lastStop!.time ? s : r.lastStop));
      if (!isDone("predict")) return;
      if (!isDone("task:cruise") && r.cruiseFor >= 4) finishTask("task:cruise");
      if (!isDone("task:accel") && r.accelFor >= 3 && r.accelFromV < 1) finishTask("task:accel");
      if (!isDone("task:stop") && r.lastStop && r.lastStop.fromV >= 15) finishTask("task:stop");
      if (isDone("ideas") && r.finish) {
        const inZone = r.finish.bumper >= STOP_ZONE[0] && r.finish.bumper <= STOP_ZONE[1];
        setLastRun((p) => (p?.time === r.finish!.time ? p : { time: r.finish!.time, inZone, bumper: r.finish!.bumper }));
        if (inZone) {
          const stars = STOP_STARS.filter((limit) => r.finish!.time <= limit).length;
          challengeStars(stars);
          if (stars === 3) badge("perfect-stop");
        }
      }
    },
    [isDone, finishTask, challengeStars, badge],
  );

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<MotionTrack onReading={onReading} />}
      simNote="An ideal road with no friction or air drag, so the car only speeds up or slows down when you press a pedal."
      taskExtras={{
        "task:stop": stop && (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
            Last stop: from <b>{stop.fromV.toFixed(1)} m/s</b> in <b>{stop.time.toFixed(1)} s</b>, over{" "}
            <b>{stop.distance.toFixed(1)} m</b>. Check: ½ × {stop.fromV.toFixed(1)} × {stop.time.toFixed(1)} ={" "}
            <b>{((stop.fromV * stop.time) / 2).toFixed(1)} m</b>
            {stop.fromV < 15 && <div className="mt-1 text-amber-200">Go faster than 15 m/s before braking.</div>}
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {lastRun ? (
            lastRun.inZone ? (
              <>
                Stopped in the zone in <span className="font-display text-lg text-white">{lastRun.time.toFixed(1)} s</span>
              </>
            ) : (
              <>Stopped at {lastRun.bumper.toFixed(1)} m: missed the zone. Reset and try again.</>
            )
          ) : (
            "No run yet"
          )}
          <div className="text-xs text-white/40">Stars at {STOP_STARS.join(" s · ")} s</div>
        </div>
      }
    />
  );
}
