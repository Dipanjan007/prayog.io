"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import LightClockLab, { type LightClockReading } from "@/components/sim/LightClockLab";
import { TWIN_ROUNDS, TWIN_TOLERANCE, lesson } from "@/content/lessons/time-dilation";
import { answerOk, gamma } from "@/lib/sim/relativity";
import { useLesson } from "@/lib/useLesson";

/** Each challenge trip: the star sits where the numbers come out round. */
const TRIPS = TWIN_ROUNDS.map((r) => {
  const earthYears = gamma(r.beta) * r.shipYears;
  return { ...r, earthYears, distanceLy: Math.round(((earthYears * r.beta) / 2) * 1000) / 1000 };
});

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [round, setRound] = useState<number | null>(null);
  const [solved, setSolved] = useState(0);
  const [shipYears, setShipYears] = useState<number | null>(null);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [fired, setFired] = useState({ ball: false, light: false });

  const lastReading = useRef<LightClockReading | null>(null);
  const onReading = useCallback(
    (r: LightClockReading) => {
      lastReading.current = r;
      setFired((f) => (f.ball === r.fired.ball && f.light === r.fired.light ? f : r.fired));
      if (round !== null) {
        if (r.trip?.mystery) setShipYears(r.trip.shipYears);
        return;
      }
      if (!isDone("predict")) return;
      if (!isDone("task:lightspeed") && r.fired.ball && r.fired.light) finishTask("task:lightspeed");
      if (!isDone("task:half") && r.mode === "clock" && Math.abs(r.gamma - 2) <= 0.04) finishTask("task:half");
      if (!isDone("task:muon") && r.mode === "muon" && r.muon?.reached) finishTask("task:muon");
      if (!isDone("task:gps") && r.mode === "gps" && r.gps.days >= 1 && r.gps.speed && r.gps.gravity && !r.gps.fixed) finishTask("task:gps");
      if (!isDone("task:twins") && r.trip && !r.trip.mystery && r.trip.earthYears - r.trip.shipYears >= 5) finishTask("task:twins");
    },
    [round, isDone, finishTask],
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
    setShipYears(null);
    setGuess("");
    setFeedback(null);
  };

  const check = () => {
    if (round === null || shipYears === null) return;
    const trip = TRIPS[round];
    if (answerOk(Number(guess), trip.earthYears, TWIN_TOLERANCE)) {
      const done = round + 1;
      setSolved((s) => Math.max(s, done));
      if (isDone("ideas")) {
        challengeStars(done);
        if (done === TRIPS.length) badge("twin-tracker");
      }
      if (done < TRIPS.length) {
        startRound(done);
        setFeedback(`Correct! ${Math.round(trip.earthYears)} years passed on Earth. Next trip.`);
      } else {
        startRound(null);
        setFeedback("All three trips solved. You have mastered time dilation!");
      }
    } else {
      setFeedback("Not quite. Find γ = 1 ÷ √(1 − (v² ÷ c²)) for this speed, then Earth years = γ × astronaut years.");
    }
  };

  const trip = round !== null ? TRIPS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={
        <LightClockLab
          key={round ?? "free"}
          onReading={onReading}
          mystery={trip ? { beta: trip.beta, distanceLy: trip.distanceLy, star: trip.star.toLowerCase() } : null}
        />
      }
      simNote="Everything here is slowed down enormously so you can see it: real light crosses a light clock in a few billionths of a second, and the light pulse from the train would cross the screen in far less than a blink. The muon heights, GPS numbers and twin ages are real values. The GPS orbit is not drawn to scale, and the twin trip ignores the short time spent speeding up and turning round."
      taskExtras={{
        "task:lightspeed": (
          <div className="mt-2 text-xs text-white/50">
            {fired.ball ? "✓" : "○"} Bowl a ball · {fired.light ? "✓" : "○"} Flash the torch
          </div>
        ),
      }}
      challengeBody={
        <div className="min-w-0 flex-1 text-sm text-white/60">
          {trip ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Trip {round! + 1} of {TRIPS.length}: {trip.star}
              </div>
              <div className="mt-1">
                {shipYears === null
                  ? "Launch the trip first."
                  : `At ${trip.beta}c the astronaut aged ${shipYears.toFixed(1)} years. How many years passed on Earth?`}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  className="field min-w-0 flex-1 !py-1.5 tabular-nums"
                  inputMode="decimal"
                  placeholder="years"
                  aria-label="Your answer in Earth years"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && check()}
                  disabled={shipYears === null}
                />
                <button className="btn-primary !px-3 !py-1.5 text-sm" onClick={check} disabled={shipYears === null || !guess}>
                  Check
                </button>
              </div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => startRound(0)}>
              {solved ? "Fly the trips again" : "Start the trips"}
            </button>
          )}
          {feedback && <div className={`mt-2 text-xs ${feedback.startsWith("Not") ? "text-amber-200" : "text-lime-300"}`}>{feedback}</div>}
          {solved > 0 && (
            <div className="mt-1 text-xs">
              Trips solved: {solved} of {TRIPS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
