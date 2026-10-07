"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import PressureLab, { type PressureReading } from "@/components/sim/PressureLab";
import { FOOTPRINT_BAND, FOOTPRINT_ROUNDS, lesson } from "@/content/lessons/pressure-lab";
import { formatPa, isDoubled } from "@/lib/sim/pressure";
import { useLesson } from "@/lib/useLesson";

/** The top hole is 0.7 m above the bottom of the pipe. */
const TOP_HOLE = 0.7;
const MIN_PULL = 30;

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [faces, setFaces] = useState<Record<number, Partial<Record<string, number>>>>({});
  const [cutLog, setCutLog] = useState<Record<string, { sharp?: boolean; blunt?: boolean }>>({});
  const [depths, setDepths] = useState<number[]>([]);
  const [round, setRound] = useState<number | null>(null);
  const [solved, setSolved] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const handledTest = useRef(0);
  const handledFall = useRef(0);

  const lastReading = useRef<PressureReading | null>(null);
  const onReading = useCallback(
    (r: PressureReading) => {
      lastReading.current = r;
      if (round !== null) {
        const t = r.test;
        if (!t || t.id === handledTest.current) return;
        handledTest.current = t.id;
        const spot = FOOTPRINT_ROUNDS[round];
        if (t.verdict === "safe") {
          const done = round + 1;
          setSolved((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === FOOTPRINT_ROUNDS.length) badge("light-footed");
          }
          if (done < FOOTPRINT_ROUNDS.length) {
            setRound(done);
            setFeedback(`Just right! ${t.area.toFixed(2)} m² keeps the ${spot.name.toLowerCase()} at ${formatPa(t.pressure)}. Next one.`);
          } else {
            setRound(null);
            setFeedback("All three crossed safely. Great designing!");
          }
        } else if (t.verdict === "sinks") {
          setFeedback(`It sank! ${formatPa(t.pressure)} is more than the ground can hold. Spread the weight over a bigger area.`);
        } else {
          setFeedback(`Safe, but ${formatPa(t.pressure)} is far below the limit. That footprint is bigger than needed. Try a smaller one.`);
        }
        return;
      }
      if (!isDone("predict")) return;

      if (r.mode === "squash") {
        if (r.object === "brick" && !isDone("task:brick")) {
          setFaces((f) => {
            const forCount = f[r.count] ?? {};
            if (forCount[r.contact] === r.pressure) return f;
            const next = { ...f, [r.count]: { ...forCount, [r.contact]: r.pressure } };
            if (next[r.count].flat !== undefined && next[r.count].end !== undefined) queueMicrotask(() => !isDone("task:brick") && finishTask("task:brick"));
            return next;
          });
        }
        if ((r.object === "knife" || r.object === "pin") && r.cut !== null && !isDone("task:sharp")) {
          const key = `${r.object}:${r.force}`;
          setCutLog((log) => {
            const entry = { ...log[key], [r.contact]: r.cut! };
            if (log[key]?.[r.contact as "sharp" | "blunt"] === r.cut) return log;
            if (entry.sharp === true && entry.blunt === false) queueMicrotask(() => !isDone("task:sharp") && finishTask("task:sharp"));
            return { ...log, [key]: entry };
          });
        }
      }

      if (r.mode === "water") {
        if (!isDone("task:jets") && r.open.every(Boolean) && r.level > TOP_HOLE + 0.02) finishTask("task:jets");
        // Only steady columns count: no hole open, so the depth is the one you set.
        if (!isDone("task:double") && !r.open.some(Boolean) && r.level >= 0.1) {
          const d = r.level;
          setDepths((prev) => {
            if (prev.some((x) => Math.abs(x - d) < 0.005)) return prev;
            if (prev.some((x) => isDoubled(x, d, 0.01))) queueMicrotask(() => !isDone("task:double") && finishTask("task:double"));
            return [...prev, d].slice(-12);
          });
        }
      }

      if (r.mode === "air" && r.fall && r.fall.id !== handledFall.current) {
        handledFall.current = r.fall.id;
        if (!isDone("task:sucker") && r.fall.heldPull >= MIN_PULL) finishTask("task:sucker");
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

  const startRound = (n: number | null) => {
    handledTest.current = 0;
    setRound(n);
    setFeedback(null);
  };

  const spot = round !== null ? FOOTPRINT_ROUNDS[round] : null;
  const brickSeen = faces[1] ?? {};
  const brickSeen2 = faces[2] ?? {};
  const sameCount = Object.keys(brickSeen2).length > Object.keys(brickSeen).length ? brickSeen2 : brickSeen;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<PressureLab key={round ?? "free"} onReading={onReading} target={spot} band={FOOTPRINT_BAND} />}
      simNote="Forces, areas and pressures use real values. Dents in the sand are drawn 3 times deeper than real, and the sand is treated as sinking in step with the pressure, which real sand only roughly does. The jets follow v = √(2gh) and fall under gravity in real time. Each strap is taken to press on 12 cm of shoulder."
      taskExtras={{
        "task:brick": (
          <div className="mt-2 text-xs text-white/50">
            {sameCount.flat !== undefined ? "✓" : "○"} Flat face{sameCount.flat !== undefined && ` (${formatPa(sameCount.flat)})`} · {sameCount.end !== undefined ? "✓" : "○"} End
            {sameCount.end !== undefined && ` (${formatPa(sameCount.end)})`}
          </div>
        ),
        "task:sharp": Object.keys(cutLog).length > 0 && (
          <div className="mt-2 space-y-0.5 text-xs text-white/50">
            {Object.entries(cutLog)
              .slice(-3)
              .map(([key, e]) => {
                const [obj, f] = key.split(":");
                const word = (v?: boolean) => (v === undefined ? "not tried" : v ? "goes in" : "does not");
                return (
                  <div key={key}>
                    {obj === "knife" ? "Knife" : "Pin"} at {f} N: sharp {word(e.sharp)} · blunt {word(e.blunt)}
                  </div>
                );
              })}
          </div>
        ),
        "task:double": depths.length > 0 && (
          <div className="mt-2 text-xs text-white/50">Depths tried: {depths.map((d) => `${d.toFixed(2)} m`).join(", ")}</div>
        ),
      }}
      challengeBody={
        <div className="min-w-0 flex-1 text-sm text-white/60">
          {spot ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                {spot.emoji} Round {round! + 1} of {FOOTPRINT_ROUNDS.length}: {spot.name}, {spot.massKg.toLocaleString("en-IN")} kg
              </div>
              <div className="mt-1">
                Ground: {spot.ground}, holds up to {formatPa(spot.limitPa)}. Set the footprint, then step onto the ground.
              </div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => startRound(0)}>
              {solved ? "Play again" : "Start the challenge"}
            </button>
          )}
          {feedback && <div className={`mt-2 text-xs ${feedback.startsWith("Just") || feedback.startsWith("All") ? "text-lime-300" : "text-amber-200"}`}>{feedback}</div>}
          {solved > 0 && (
            <div className="mt-1 text-xs">
              Crossed safely: {solved} of {FOOTPRINT_ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
