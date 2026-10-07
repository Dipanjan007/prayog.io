"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import MassEnergyLab, { type MassEnergyReading } from "@/components/sim/MassEnergyLab";
import { MASS_ROUNDS, MASS_TOLERANCE, lesson } from "@/content/lessons/mass-energy";
import { guessOk, massFromEnergy, sci } from "@/lib/sim/massenergy";
import type { ProcessId } from "@/lib/sim/massenergy";
import { useLesson } from "@/lib/useLesson";

const COMPARE: ProcessId[] = ["chemical", "fission", "full"];
const RICE_KG = 0.02e-3;

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [tried, setTried] = useState<ProcessId[]>([]);
  const [seenEarth, setSeenEarth] = useState(false);
  const [round, setRound] = useState<number | null>(null);
  const [solved, setSolved] = useState(0);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const lastReading = useRef<MassEnergyReading | null>(null);
  const onReading = useCallback(
    (r: MassEnergyReading) => {
      lastReading.current = r;
      if (round !== null || !isDone("predict")) return;
      if (r.mode === "convert") {
        if (!isDone("task:convert") && r.process === "full" && Math.abs(r.massKg - RICE_KG) <= RICE_KG * 0.25) finishTask("task:convert");
        if (!isDone("task:compare") && COMPARE.includes(r.process)) {
          setTried((prev) => {
            if (prev.includes(r.process)) return prev;
            const next = [...prev, r.process];
            if (COMPARE.every((p) => next.includes(p))) queueMicrotask(() => !isDone("task:compare") && finishTask("task:compare"));
            return next;
          });
        }
      }
      if (!isDone("task:sun") && r.mode === "sun" && r.sunRuns > 0) finishTask("task:sun");
      if (r.mode === "space") {
        if (!isDone("task:bend") && r.body === "sun" && r.grid && r.ray && r.rayB <= 1.2 + 1e-9) finishTask("task:bend");
        if (!isDone("task:clock")) {
          if (r.body === "earth") setSeenEarth(true);
          if (r.body === "neutronStar" && (seenEarth || isDone("task:clock"))) finishTask("task:clock");
        }
      }
    },
    [round, isDone, finishTask, seenEarth],
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
  }, [predicted, ideasDone, seenEarth]);

  const startRound = (n: number | null) => {
    setRound(n);
    setGuess("");
    setFeedback(null);
  };

  const job = round !== null ? MASS_ROUNDS[round] : null;

  const check = () => {
    if (round === null || !job) return;
    const truthKg = massFromEnergy(job.energyJ);
    const guessKg = Number(guess) / (job.unit === "g" ? 1000 : 1);
    if (guessOk(guessKg, truthKg, MASS_TOLERANCE)) {
      const done = round + 1;
      setSolved((s) => Math.max(s, done));
      if (isDone("ideas")) {
        challengeStars(done);
        if (done === MASS_ROUNDS.length) badge("star-forger");
      }
      const exact = job.unit === "g" ? `${(truthKg * 1000).toPrecision(3)} g` : `${truthKg.toPrecision(3)} kg`;
      if (done < MASS_ROUNDS.length) {
        startRound(done);
        setFeedback(`Correct! About ${exact} of mass would do it. On to the next job.`);
      } else {
        startRound(null);
        setFeedback(`Correct! About ${exact}. All three jobs done, star forger!`);
      }
    } else {
      setFeedback(`Not quite. Use m = E ÷ c², with c² ≈ 8.99 × 10¹⁶, and give your answer in ${job.unit === "g" ? "grams" : "kilograms"}.`);
    }
  };

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<MassEnergyLab key={round ?? "free"} onReading={onReading} target={job ? { energyJ: job.energyJ, label: job.name } : null} />}
      simNote="Energies, masses, the Sun's power and the clock and bending numbers are real. The pictures are not to scale: the rubber sheet is only an analogy for curved space-time, the dents are made deep enough to see, and the bending of starlight is drawn thousands of times bigger than it really is (1.75 arcseconds at the Sun's edge is about the width of a coin seen from 3 km away). The clocks tick fast so the difference shows."
      taskExtras={{
        "task:compare": (
          <div className="mt-2 text-xs text-white/50">
            {COMPARE.map((p) => `${tried.includes(p) ? "✓" : "○"} ${p === "chemical" ? "Burn coal" : p === "fission" ? "Split uranium" : "All of it"}`).join(" · ")}
          </div>
        ),
        "task:clock": (
          <div className="mt-2 text-xs text-white/50">
            {seenEarth ? "✓" : "○"} Earth and the GPS clock · ○ Neutron star
          </div>
        ),
      }}
      challengeBody={
        <div className="min-w-0 flex-1 text-sm text-white/60">
          {job ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Job {round! + 1} of {MASS_ROUNDS.length}: {job.name}
              </div>
              <div className="mt-1">{job.given}</div>
              <div className="mt-1 tabular-nums">Energy needed: {sci(job.energyJ)} J. How much mass, fully converted?</div>
              <div className="mt-2 flex gap-2">
                <input
                  className="field min-w-0 flex-1 !py-1.5 tabular-nums"
                  inputMode="decimal"
                  placeholder={job.unit === "g" ? "grams" : "kilograms"}
                  aria-label={`Your mass answer in ${job.unit === "g" ? "grams" : "kilograms"}`}
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && check()}
                />
                <button className="btn-primary !px-3 !py-1.5 text-sm" onClick={check} disabled={!guess}>
                  Check
                </button>
              </div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => startRound(0)}>
              {solved ? "Play the jobs again" : "Start the jobs"}
            </button>
          )}
          {feedback && <div className={`mt-2 text-xs ${feedback.startsWith("Not") ? "text-amber-200" : "text-lime-300"}`}>{feedback}</div>}
          {solved > 0 && (
            <div className="mt-1 text-xs">
              Jobs done: {solved} of {MASS_ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
