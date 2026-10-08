"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import EyeAgeLab, { fmtD, fmtDist, type EyeAgeReading } from "@/components/sim/EyeAgeLab";
import { CUSTOMERS, POWER_TOLERANCE_D, lesson } from "@/content/lessons/eye-defects";
import { readingGlassesPower } from "@/lib/sim/eyedefects";
import { useLesson } from "@/lib/useLesson";

type SeenKey = "npSharp" | "npBlur" | "oldBlur" | "oldSharp" | "farTop" | "nearBottom";
const NO_SEEN: Record<SeenKey, boolean> = { npSharp: false, npBlur: false, oldBlur: false, oldSharp: false, farTop: false, nearBottom: false };

/** Which pairs of sightings finish which mission. */
const PAIRS: [string, SeenKey, SeenKey][] = [
  ["task:nearpoint", "npSharp", "npBlur"],
  ["task:age", "oldBlur", "oldSharp"],
  ["task:bifocal", "farTop", "nearBottom"],
];

const near = (r: EyeAgeReading) => r.scene !== "bus";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [seen, setSeen] = useState(NO_SEEN);
  const seenRef = useRef(NO_SEEN);
  const [round, setRound] = useState<number | null>(null);
  const [solved, setSolved] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const lastReading = useRef<EyeAgeReading | null>(null);

  const mark = useCallback(
    (keys: SeenKey[]) => {
      const fresh = keys.filter((k) => !seenRef.current[k]);
      if (!fresh.length) return;
      const next = { ...seenRef.current };
      for (const k of fresh) next[k] = true;
      seenRef.current = next;
      setSeen(next);
      for (const [task, a, b] of PAIRS) if (next[a] && next[b] && !isDone(task)) finishTask(task);
    },
    [isDone, finishTask],
  );

  const onReading = useCallback(
    (r: EyeAgeReading) => {
      lastReading.current = r;
      if (r.challenge || !isDone("predict")) return;
      const plain = r.lens === "none" && !r.cataract;
      const keys: SeenKey[] = [];
      if (plain && !r.myopic && r.age <= 15 && near(r)) {
        if (r.sharp && r.d <= r.nearPoint + 0.02) keys.push("npSharp");
        if (!r.sharp && r.d < r.nearPoint) keys.push("npBlur");
      }
      if (plain && !r.myopic && r.age >= 60 && near(r)) {
        if (!r.sharp && r.d <= 0.4) keys.push("oldBlur");
        if (r.sharp) keys.push("oldSharp");
      }
      if (r.lens === "bifocal" && r.myopic && !r.cataract && r.age >= 55) {
        if (r.scene === "bus" && r.half === "top" && r.sharp && r.top < 0) keys.push("farTop");
        if (near(r) && r.half === "bottom" && r.d <= 0.3 && r.sharp && r.bottom > 0) keys.push("nearBottom");
      }
      mark(keys);
      if (
        !isDone("task:reading") &&
        r.lens === "single" &&
        !r.myopic &&
        !r.cataract &&
        r.age >= 55 &&
        near(r) &&
        r.d >= 0.22 &&
        r.d <= 0.3 &&
        r.sharp &&
        r.power > 0
      )
        finishTask("task:reading");
      if (!isDone("task:cataract") && r.cataract && r.lens !== "none") finishTask("task:cataract");
    },
    [isDone, finishTask, mark],
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

  const handOver = () => {
    const r = lastReading.current;
    if (round === null || !r || !r.challenge) return;
    const c = CUSTOMERS[round];
    const right = readingGlassesPower(1 / c.amp);
    if (r.lens !== "single" || r.power === 0) {
      setFeedback({ ok: false, text: "Choose Reading glasses and set a lens power first." });
      return;
    }
    if (Math.abs(r.power - right) <= POWER_TOLERANCE_D + 1e-9) {
      const done = round + 1;
      setSolved((s) => Math.max(s, done));
      if (isDone("ideas")) {
        challengeStars(done);
        if (done === CUSTOMERS.length) badge("spectacle-shop-star");
      }
      setFeedback({
        ok: true,
        text: `${c.name.split(",")[0]} is happy! Near point ${fmtDist(1 / c.amp)}, so P = 1/0.25 − 1/${(1 / c.amp).toFixed(2)} = ${fmtD(right)}.`,
      });
      setRound(done < CUSTOMERS.length ? done : null);
    } else if (r.power < right)
      setFeedback({ ok: false, text: "Too weak. Hold the object at 25 cm with these glasses: it is still blurred. Measure the near point again with no glasses." });
    else
      setFeedback({
        ok: false,
        text: "Too strong. It works at 25 cm, but the eye can now only see things very close up. Opticians pick the power that brings the near point to exactly 25 cm.",
      });
  };

  const customer = round !== null ? CUSTOMERS[round] : null;
  const pair = (a: SeenKey, b: SeenKey, la: string, lb: string) => (
    <div className="mt-2 text-xs text-white/50">
      {seen[a] ? "✓" : "○"} {la} · {seen[b] ? "✓" : "○"} {lb}
    </div>
  );

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<EyeAgeLab key={round ?? "free"} onReading={onReading} customer={customer} />}
      simNote="The eye is the NCERT 'reduced eye': a lens 2.5 cm from the retina, with spectacles treated as thin lenses touching the eye. Distances in front of the eye are squeezed onto a log scale and focus errors are drawn about 15 times bigger than real. The age curve is a simple straight line through NCERT's numbers (near point 25 cm at 15, 1 m at 60). Real children and teenagers can usually focus even closer than 25 cm."
      taskExtras={{
        "task:nearpoint": pair("npSharp", "npBlur", "Sharp at the near point", "Blurred closer than it"),
        "task:age": pair("oldBlur", "oldSharp", "Blurred at reading distance", "Sharp further away"),
        "task:bifocal": pair("farTop", "nearBottom", "Bus sharp through a concave top", "Paper sharp through a convex bottom"),
      }}
      challengeBody={
        <div className="min-w-0 flex-1 text-sm text-white/60">
          {customer ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Customer {round! + 1} of {CUSTOMERS.length}: {customer.name}
              </div>
              <div className="mt-1 text-xs">&ldquo;{customer.complaint}&rdquo;</div>
              <button className="btn-primary mt-2 !px-3 !py-1.5 text-sm" onClick={handOver}>
                Hand over these glasses
              </button>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => startRound(0)}>
              {solved ? "Open the shop again" : "Open the shop"}
            </button>
          )}
          {feedback && <div className={`mt-2 text-xs ${feedback.ok ? "text-lime-300" : "text-amber-200"}`}>{feedback.text}</div>}
          {solved > 0 && (
            <div className="mt-1 text-xs">
              Customers helped: {solved} of {CUSTOMERS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
