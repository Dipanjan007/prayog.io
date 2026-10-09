"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import BlackHoleLab, { type BlackHoleReading } from "@/components/sim/BlackHoleLab";
import { MYSTERY_OBJECTS, RS_TOLERANCE, lesson } from "@/content/lessons/black-holes";
import { radiusGuessOk, schwarzschildRadius, sci } from "@/lib/sim/blackhole";
import { useLesson } from "@/lib/useLesson";

type Seen = { sun: boolean; star20: boolean; wd: boolean; ns: boolean; bh: boolean; trapped: boolean; escaped: boolean };
const NONE: Seen = { sun: false, star20: false, wd: false, ns: false, bh: false, trapped: false, escaped: false };

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [seen, setSeen] = useState<Seen>(NONE);
  const [round, setRound] = useState<number | null>(null);
  const [solved, setSolved] = useState(0);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const lastReading = useRef<BlackHoleReading | null>(null);
  const onReading = useCallback(
    (r: BlackHoleReading) => {
      lastReading.current = r;
      if (round !== null || !isDone("predict")) return;
      if (r.mode === "squeeze") {
        if (!isDone("task:gravity") && r.radius <= r.realRadius / 10 + 1e-9) finishTask("task:gravity");
        if (!isDone("task:earth") && r.body === "earth" && r.blackHole) finishTask("task:earth");
      }
      setSeen((s) => {
        const next: Seen = {
          sun: s.sun || (r.mode === "squeeze" && r.body === "sun" && r.blackHole),
          star20: s.star20 || (r.mode === "squeeze" && r.body === "star20" && r.blackHole),
          wd: s.wd || r.fate?.kind === "white-dwarf",
          ns: s.ns || r.fate?.kind === "neutron-star",
          bh: s.bh || r.fate?.kind === "black-hole",
          trapped: s.trapped || !!r.ray?.captured,
          escaped: s.escaped || (!!r.ray && !r.ray.captured),
        };
        if ((Object.keys(next) as (keyof Seen)[]).every((k) => next[k] === s[k])) return s;
        if (next.sun && next.star20) queueMicrotask(() => !isDone("task:mass") && finishTask("task:mass"));
        if (next.wd && next.ns && next.bh) queueMicrotask(() => !isDone("task:fate") && finishTask("task:fate"));
        if (next.trapped && next.escaped) queueMicrotask(() => !isDone("task:light") && finishTask("task:light"));
        return next;
      });
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
    setGuess("");
    setFeedback(null);
  };

  const check = () => {
    if (round === null) return;
    const obj = MYSTERY_OBJECTS[round];
    const truth = schwarzschildRadius(obj.mass) * obj.perMetre;
    if (radiusGuessOk(Number(guess), truth, RS_TOLERANCE)) {
      const done = round + 1;
      setSolved((s) => Math.max(s, done));
      if (isDone("ideas")) {
        challengeStars(done);
        if (done === MYSTERY_OBJECTS.length) badge("horizon-hunter");
      }
      if (done < MYSTERY_OBJECTS.length) {
        startRound(done);
        setFeedback(`Correct! ${obj.name} becomes a black hole inside ${sci(truth)} ${obj.unit}. Next object.`);
      } else {
        startRound(null);
        setFeedback("All three horizons found. Schwarzschild would be proud!");
      }
    } else {
      setFeedback(`Not quite. Use r_s = (2 × G × M) ÷ c², or squeeze the object in the lab until the horizon forms. Give your answer in ${obj.unit}.`);
    }
  };

  const obj = round !== null ? MYSTERY_OBJECTS[round] : null;
  const tick = (b: boolean) => (b ? "✓" : "○");

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<BlackHoleLab key={round ?? "free"} onReading={onReading} mystery={obj ? { name: obj.name, mass: obj.mass, radius: obj.radius } : null} />}
      simNote="All numbers use the real formulas and constants. Squeeze mode draws sizes on a log scale, since Earth to a marble is a billion-fold shrink. The star collapse is a speeded-up cartoon (real stars take millions of years to use up their fuel, and the final collapse takes under a second). Light paths are traced with Einstein's equations for a non-spinning black hole, but the glow and the drawing are an illustration, not a photo."
      taskExtras={{
        "task:mass": (
          <div className="mt-2 text-xs text-white/50">
            {tick(seen.sun)} Sun · {tick(seen.star20)} Big star (20 Suns)
          </div>
        ),
        "task:fate": (
          <div className="mt-2 text-xs text-white/50">
            {tick(seen.wd)} White dwarf · {tick(seen.ns)} Neutron star · {tick(seen.bh)} Black hole
          </div>
        ),
        "task:light": (
          <div className="mt-2 text-xs text-white/50">
            {tick(seen.escaped)} A ray that escapes · {tick(seen.trapped)} A ray that is trapped
          </div>
        ),
      }}
      challengeBody={
        <div className="min-w-0 flex-1 text-sm text-white/60">
          {obj ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Object {round! + 1} of {MYSTERY_OBJECTS.length}: {obj.name}
              </div>
              <div className="mt-1">Mass: {sci(obj.mass)} kg. At what radius does it become a black hole?</div>
              <div className="mt-2 flex gap-2">
                <input
                  className="field min-w-0 flex-1 !py-1.5 tabular-nums"
                  inputMode="decimal"
                  placeholder={obj.unit}
                  aria-label={`Your answer in ${obj.unit}`}
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && check()}
                />
                <span className="self-center text-xs">{obj.unit}</span>
                <button className="btn-primary !px-3 !py-1.5 text-sm" onClick={check} disabled={!guess}>
                  Check
                </button>
              </div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => startRound(0)}>
              {solved ? "Hunt the horizons again" : "Start the hunt"}
            </button>
          )}
          {feedback && <div className={`mt-2 text-xs ${feedback.startsWith("Not") ? "text-amber-200" : "text-lime-300"}`}>{feedback}</div>}
          {solved > 0 && (
            <div className="mt-1 text-xs">
              Objects solved: {solved} of {MYSTERY_OBJECTS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
