"use client";

import { useCallback, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import WindTunnel, { type TunnelReading } from "@/components/sim/WindTunnel";
import { lesson, WING_STARS } from "@/content/lessons/pressure-winds";
import { useLesson } from "@/lib/useLesson";

type ShapeTest = "circle" | "square" | "teardrop";
const SHAPE_NAMES: Record<ShapeTest, string> = { circle: "Ball", square: "Box", teardrop: "Raindrop" };

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [drags, setDrags] = useState<Partial<Record<ShapeTest, number>>>({});
  const [shapeAnswerWrong, setShapeAnswerWrong] = useState(false);
  const [ratio, setRatio] = useState<number | null>(null);

  // Called by the wind tunnel a few times a second.
  const onReading = useCallback(
    (r: TunnelReading) => {
      if (r.painted) badge("shape-shifter");
      if (!isDone("predict") || !r.settled) return;

      if (!isDone("task:push") && r.shape === "square" && r.speedKmh >= 60 && r.view === "pressure") finishTask("task:push");
      if (!isDone("task:roof") && r.shape === "house" && r.speedKmh >= 120 && r.lift > 5) {
        finishTask("task:roof");
        badge("storm-chaser");
      }
      if (!isDone("task:shapes") && r.speedKmh >= 90 && (r.shape === "circle" || r.shape === "square" || r.shape === "teardrop")) {
        const s = r.shape;
        setDrags((d) => (d[s] === r.drag ? d : { ...d, [s]: r.drag }));
      }
      if (!isDone("task:car") && r.shape === "car" && r.speedKmh >= 100 && r.lift < -5) {
        finishTask("task:car");
        badge("downforce");
      }
      if (isDone("ideas") && r.shape === "wing" && r.speedKmh >= 90 && r.drag > 0) {
        const value = r.lift / r.drag;
        setRatio(value);
        const stars = WING_STARS.filter((t) => value >= t).length;
        challengeStars(stars);
        if (stars === 3) badge("first-flight");
      }
    },
    [badge, isDone, finishTask, challengeStars],
  );

  const tested = (Object.keys(SHAPE_NAMES) as ShapeTest[]).filter((s) => drags[s] !== undefined);
  const lowest = tested.length === 3 ? tested.reduce((a, b) => (drags[a]! <= drags[b]! ? a : b)) : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<WindTunnel initialShape="square" initialSpeed={40} onReading={onReading} />}
      simNote="A simplified air model for learning. Speeds are scaled so the patterns match real air, not exact engineering numbers."
      taskExtras={{
        "task:shapes": (
          <div className="mt-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              {(Object.keys(SHAPE_NAMES) as ShapeTest[]).map((s) => (
                <div key={s} className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
                  <div className="text-xs text-white/50">{SHAPE_NAMES[s]}</div>
                  <div className="font-display text-lg text-orange-300">{drags[s] ?? "–"}</div>
                </div>
              ))}
            </div>
            {lowest && (
              <div className="animate-pop mt-3">
                <p className="text-sm">Which shape had the least drag?</p>
                <div className="mt-2 flex gap-2">
                  {(Object.keys(SHAPE_NAMES) as ShapeTest[]).map((s) => (
                    <button
                      key={s}
                      className="btn-ghost !px-3 !py-1.5 text-sm"
                      onClick={() => {
                        setShapeAnswerWrong(s !== lowest);
                        if (s === lowest) finishTask("task:shapes");
                      }}
                    >
                      {SHAPE_NAMES[s]}
                    </button>
                  ))}
                </div>
                {shapeAnswerWrong && <p className="mt-2 text-sm text-rose-300">Look at the drag numbers again.</p>}
              </div>
            )}
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          Lift ÷ drag now: <span className="font-display text-lg text-white">{ratio === null ? "–" : ratio.toFixed(2)}</span>
          <div className="text-xs text-white/40">Stars at {WING_STARS.join(" · ")}</div>
        </div>
      }
    />
  );
}
