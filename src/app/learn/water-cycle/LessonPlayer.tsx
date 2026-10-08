"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import WaterCycleLab, { type WaterReading } from "@/components/sim/WaterCycleLab";
import { MONSOON_RAIN, RECHARGE_MAX_RUNOFF, RECHARGE_MM, WATER_ROUNDS, lesson } from "@/content/lessons/water-cycle";
import { useLesson } from "@/lib/useLesson";

/** Each mission's checklist: all its items must be seen in the sim. */
const CHECKS: Record<string, { key: string; label: string }[]> = {
  "task:sun": [
    { key: "low", label: "Weak Sun (20% or less)" },
    { key: "high", label: "Strong Sun (80% or more)" },
    { key: "windy", label: "Wind 5 m/s or more" },
  ],
  "task:soak": [
    { key: "soil", label: "20 mm soaked into soil" },
    { key: "concrete", label: "20 mm ran off concrete" },
  ],
  "task:clothes": [
    { key: "delhi", label: "Delhi, May" },
    { key: "mumbai", label: "Mumbai, July" },
    { key: "fast", label: "Mumbai shirt dry in 8 h or less" },
  ],
  "task:tumbler": [
    { key: "sweat", label: "Ice water: drops form" },
    { key: "dry", label: "Matka water: stays dry" },
  ],
};

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const seenRef = useRef<Record<string, boolean>>({});
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  const [round, setRound] = useState<number | null>(null);
  const [solved, setSolved] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const lastReading = useRef<WaterReading | null>(null);

  const win = useCallback(
    (r: number, message: string) => {
      const done = r + 1;
      setSolved((s) => Math.max(s, done));
      if (isDone("ideas")) {
        challengeStars(done);
        if (done === WATER_ROUNDS.length) badge("weather-maker");
      }
      setFeedback(message);
      setRound(done < WATER_ROUNDS.length ? done : null);
    },
    [isDone, challengeStars, badge],
  );

  const onReading = useCallback(
    (r: WaterReading) => {
      lastReading.current = r;
      if (round !== null) {
        const id = WATER_ROUNDS[round].id;
        if (id === "monsoon" && r.mode === "land" && r.rainHill >= MONSOON_RAIN)
          win(round, `It pours! ${r.rainHill.toFixed(1)} mm an hour is over ${Math.round(r.rainHill * 24)} mm a day. A hot Sun lifts lots of vapour and a strong wind drives it up the Ghats.`);
        if (id === "recharge" && r.mode === "land") {
          if (r.runoff >= RECHARGE_MAX_RUNOFF)
            setFeedback("Too much water is running off. Heavy rain falls faster than the soil can soak it up. Tap Reset totals and try gentler rain.");
          else if (r.soaked >= RECHARGE_MM)
            win(round, "The well is filling! Gentle, steady rain on soil soaks in. A cloudburst, or rain on concrete, mostly runs away.");
        }
        if (id === "dew" && r.mode === "kitchen" && r.drink === "fridge" && !r.sweating)
          win(round, `Dry! The dew point is now ${r.dew.toFixed(1)} °C, below the tumbler's 6 °C, so the air touching it is not cooled enough to drop its water.`);
        return;
      }
      if (!isDone("predict")) return;
      const marks: [string, boolean][] = [
        ["low", r.mode === "land" && r.sun <= 0.2],
        ["high", r.mode === "land" && r.sun >= 0.8],
        ["windy", r.mode === "land" && r.wind >= 5],
        ["soil", r.soakedSoil >= 20],
        ["concrete", r.runoffConcrete >= 20],
        ["delhi", r.mode === "kitchen" && r.city === "delhi"],
        ["mumbai", r.mode === "kitchen" && r.city === "mumbai"],
        ["fast", r.mode === "kitchen" && r.city === "mumbai" && r.dryHours <= 8],
        ["sweat", r.mode === "kitchen" && r.drink === "ice" && r.sweating],
        ["dry", r.mode === "kitchen" && r.drink === "matka" && !r.sweating],
      ];
      let changed = false;
      for (const [k, ok] of marks)
        if (ok && !seenRef.current[k]) {
          seenRef.current = { ...seenRef.current, [k]: true };
          changed = true;
        }
      if (changed) setSeen(seenRef.current);
      for (const [task, items] of Object.entries(CHECKS))
        if (!isDone(task) && items.every((i) => seenRef.current[i.key])) finishTask(task);
      if (!isDone("task:ghats") && r.mode === "land" && r.rainHill >= 2) finishTask("task:ghats");
    },
    [round, isDone, finishTask, win],
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

  const startRound = (n: number) => {
    setRound(n);
    setFeedback(null);
  };

  const current = round !== null ? WATER_ROUNDS[round] : null;
  const checklist = (task: string) => (
    <div className="mt-2 text-xs text-white/50">
      {CHECKS[task].map((i, n) => (
        <span key={i.key}>
          {n > 0 && " · "}
          {seen[i.key] ? "✓" : "○"} {i.label}
        </span>
      ))}
    </div>
  );

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<WaterCycleLab key={round ?? "free"} onReading={onReading} round={current?.id ?? null} />}
      simNote="Evaporation uses Dalton's law with the Penman wind formula, dew points use the Magnus formula, and the cloud base uses Espy's rule of 125 m per °C. The sea air is kept at 80% humidity, and the Sun slider only sets the sea temperature, from 20 °C to 30 °C. Rain on the hills is the vapour the lifted air can no longer hold, all of it falling on the slope; the small clouds over the sea do not rain. The hills are drawn far steeper than the real 30 km slope, the vapour is shown as dots, and the groundwater layer is exaggerated. Time is sped up: 1 second is 1 hour. The shirt dries in the shade at the wet-bulb temperature, and the matka is assumed to get 70% of the way to it."
      taskExtras={{
        "task:sun": checklist("task:sun"),
        "task:soak": checklist("task:soak"),
        "task:clothes": checklist("task:clothes"),
        "task:tumbler": checklist("task:tumbler"),
      }}
      challengeBody={
        <div className="min-w-0 flex-1 text-sm text-white/60">
          {current ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Round {round! + 1} of {WATER_ROUNDS.length}: {current.title}
              </div>
              <div className="mt-1 text-xs">{current.text}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => startRound(0)}>
              {solved ? "Play the rounds again" : "Start the rounds"}
            </button>
          )}
          {feedback && <div className={`mt-2 text-xs ${feedback.startsWith("Too") ? "text-amber-200" : "text-lime-300"}`}>{feedback}</div>}
          {solved > 0 && (
            <div className="mt-1 text-xs">
              Rounds solved: {solved} of {WATER_ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
