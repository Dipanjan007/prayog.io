"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import SpinLab, { type SpinReading } from "@/components/sim/SpinLab";
import { CAR_TOLERANCE, ORBIT_TOLERANCE, ROUNDS, lesson } from "@/content/lessons/circular-motion";
import { GM_EARTH, R_EARTH, carRoundOk, circularSpeed, withinTolerance } from "@/lib/sim/circular";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [speeds, setSpeeds] = useState<{ key: string; min: number; max: number } | null>(null);
  const [places, setPlaces] = useState({ equator: false, pole: false });
  const [round, setRound] = useState<number | null>(null);
  const [solved, setSolved] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const handled = useRef(0);
  // Each round remounts the sim and its result ids start again from 1, so forget the last one seen.
  useEffect(() => {
    handled.current = 0;
  }, [round]);

  const lastReading = useRef<SpinReading | null>(null);
  const onReading = useCallback(
    (r: SpinReading) => {
      lastReading.current = r;
      if (round !== null) {
        const target = ROUNDS[round];
        const res = target.kind === "car" ? r.drive : r.launch;
        if (!res || !res.challenge || res.id === handled.current) return;
        handled.current = res.id;
        let ok: boolean;
        let miss: string;
        if (target.kind === "car") {
          ok = carRoundOk(r.drive!.v, target.mu, target.r, CAR_TOLERANCE);
          miss = r.drive?.skid ? "Skidded! Too fast for the tyres. Use μ m g = m v² ÷ r." : "Safe, but you can go faster. Find the limit v = √(μ g r).";
        } else {
          const vc = circularSpeed(GM_EARTH, R_EARTH + target.altKm * 1000);
          ok = r.launch?.fate === "orbit" && withinTolerance(r.launch.v, vc, ORBIT_TOLERANCE);
          miss =
            r.launch?.fate === "orbit"
              ? "It stays up, but the path is an oval, not a circle. Make gravity per kg equal v² ÷ r."
              : "Not a circle. For a circle, v = √(GM ÷ r) with r measured from the centre of the Earth.";
        }
        if (ok) {
          const done = round + 1;
          setSolved((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === ROUNDS.length) badge("orbit-ace");
          }
          if (done < ROUNDS.length) {
            setRound(done);
            setFeedback(`Star ${done}! ${target.title}: done. On to the next job.`);
          } else {
            setRound(null);
            setFeedback("All three jobs done. Mission control is proud of you!");
          }
        } else setFeedback(`Not quite. ${miss}`);
        return;
      }

      if (!isDone("predict")) return;
      if (r.mode === "whirl" && r.scene === "ball") {
        if (!r.released && !isDone("task:force")) {
          const key = `${r.m}|${r.r}`;
          setSpeeds((s) => {
            const next = s && s.key === key ? { key, min: Math.min(s.min, r.v), max: Math.max(s.max, r.v) } : { key, min: r.v, max: r.v };
            if (s && next.min === s.min && next.max === s.max && next.key === s.key) return s;
            if (next.min <= 3 && next.max >= 2 * next.min) queueMicrotask(() => !isDone("task:force") && finishTask("task:force"));
            return next;
          });
        }
        if (!isDone("task:cut") && r.released && r.view === "outside") finishTask("task:cut");
      }
      if (!isDone("task:ride") && r.mode === "whirl" && r.view === "riding" && !r.released) finishTask("task:ride");
      if (r.mode === "earth") {
        setPlaces((p) => {
          const next = { equator: p.equator || r.lat <= 0.5, pole: p.pole || r.lat >= 89.5 };
          if (next.equator === p.equator && next.pole === p.pole) return p;
          if (next.equator && next.pole) queueMicrotask(() => !isDone("task:earth") && finishTask("task:earth"));
          return next;
        });
      }
      if (!isDone("task:orbit") && r.mode === "orbit" && r.launch && !r.launch.challenge && r.launch.fate === "orbit") finishTask("task:orbit");
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
    setRound(n);
    setFeedback(null);
  };

  const target = round !== null ? ROUNDS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<SpinLab key={round ?? "free"} onReading={onReading} target={target} />}
      simNote="The ball plays at one third of its real speed and the car at twice its real speed so you can follow them. Force arrows grow with the force but are shortened when they get too long. The skidding car is drawn with its tyres giving all their grip sideways. Satellite orbits are to scale and calculated step by step with Newton's law of gravity; the Earth is drawn as a perfect sphere and its axis upright."
      taskExtras={{
        "task:force": (
          <div className="mt-2 text-xs text-white/50 tabular-nums">
            {speeds ? `Same mass and string: slowest ${speeds.min} m/s, fastest ${speeds.max} m/s` : "Change only the speed slider."}
          </div>
        ),
        "task:earth": (
          <div className="mt-2 text-xs text-white/50">
            {places.equator ? "✓" : "○"} Equator · {places.pole ? "✓" : "○"} North Pole
          </div>
        ),
      }}
      challengeBody={
        <div className="min-w-0 flex-1 text-sm text-white/60">
          {target ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Job {round! + 1} of {ROUNDS.length}: {target.title}
              </div>
              <div className="mt-1 text-xs">
                {target.kind === "car"
                  ? `Set the fastest speed that does not skid (within ${CAR_TOLERANCE * 100}% of the limit), then drive.`
                  : `Launch at the speed for a circular orbit (within ${ORBIT_TOLERANCE * 100}%).`}
              </div>
              <button className="btn-ghost mt-2 !px-3 !py-1 text-xs" onClick={() => startRound(null)}>
                Stop the challenge
              </button>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => startRound(0)}>
              {solved ? "Play the jobs again" : "Start the jobs"}
            </button>
          )}
          {feedback && <div className={`mt-2 text-xs ${feedback.startsWith("Not") ? "text-amber-200" : "text-lime-300"}`}>{feedback}</div>}
          {solved > 0 && (
            <div className="mt-1 text-xs">
              Jobs done: {solved} of {ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
