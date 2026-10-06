"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import HeatLab, { type HeatReading } from "@/components/sim/HeatLab";
import { CHALLENGE_ROUNDS, lesson } from "@/content/lessons/heat-transfer";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [breezes, setBreezes] = useState<string[]>([]);
  const [round, setRound] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [best, setBest] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const panelRef = useRef<HTMLDivElement>(null);
  const started = round !== null;
  useEffect(() => {
    if (started) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [started]);

  const lastReading = useRef<HeatReading | null>(null);
  const onReading = useCallback(
    (r: HeatReading) => {
      lastReading.current = r;
      if (!isDone("predict")) return;
      if (!isDone("task:copper") && r.mode === "rod" && r.material === "copper" && r.drops === 5) finishTask("task:copper");
      if (!isDone("task:poor") && r.mode === "rod" && (r.material === "glass" || r.material === "wood") && r.minutes >= 10) finishTask("task:poor");
      if (!isDone("task:convect") && r.mode === "pot" && r.flame && r.dye && r.risen) finishTask("task:convect");
      if (!isDone("task:breeze") && r.mode === "coast" && r.breeze !== "calm")
        setBreezes((prev) => {
          if (prev.includes(r.breeze)) return prev;
          const next = [...prev, r.breeze];
          if (next.length === 2) queueMicrotask(() => finishTask("task:breeze"));
          return next;
        });
      if (!isDone("task:radiate") && r.mode === "coast" && r.hour >= 11 && r.hour <= 14 && r.tinDiff >= 10) finishTask("task:radiate");
    },
    [isDone, finishTask],
  );

  // The sim only reports changes, so replay what it shows now once the prediction is locked in.
  const predicted = api.done.has("predict");
  useEffect(() => {
    if (predicted && lastReading.current) onReading(lastReading.current);
  }, [predicted, onReading]);

  const answer = (i: number) => {
    if (round === null || feedback) return;
    const R = CHALLENGE_ROUNDS[round];
    const right = i === R.answer;
    setFeedback({ ok: right, text: right ? R.right : `Not quite. ${R.hint}` });
    if (right) {
      const done = round + 1;
      setBest((b) => Math.max(b, done));
      if (isDone("ideas")) {
        challengeStars(done);
        if (done === CHALLENGE_ROUNDS.length) badge("heat-detective");
      }
    }
    timer.current = setTimeout(
      () => {
        setFeedback(null);
        if (right) setRound(round + 1 < CHALLENGE_ROUNDS.length ? round + 1 : null);
      },
      right ? 2200 : 2600,
    );
  };

  const R = round !== null ? CHALLENGE_ROUNDS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={
        <>
          <HeatLab onReading={onReading} />
          {R && (
            <div className="mt-3" ref={panelRef}>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3" aria-live="polite">
                <div className="text-xs text-white/45">
                  Heat detective: question {round! + 1} of {CHALLENGE_ROUNDS.length}
                </div>
                <div className="mt-1 text-white">{R.q}</div>
                <div className="mt-2 grid gap-1.5">
                  {R.options.map((o, i) => (
                    <button
                      key={o}
                      disabled={!!feedback}
                      onClick={() => answer(i)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-left text-sm text-white/80 hover:border-white/20 disabled:opacity-60"
                    >
                      {o}
                    </button>
                  ))}
                </div>
                {feedback && <div className={`mt-2 text-sm ${feedback.ok ? "text-lime-300" : "text-amber-200"}`}>{feedback.text}</div>}
              </div>
            </div>
          )}
        </>
      }
      simNote="The rod is 20 cm long and 6 mm thick. Heat spreads along it by the heat equation, using real values for each material, and the rod loses heat to the air. Time runs 10 or 100 times faster than real life. The particle wobble is hugely exaggerated so you can see it. The pot shows a simple picture of the convection currents, not a full water simulation. The seaside temperatures are typical values for a sunny day, not a forecast."
      taskExtras={{
        "task:breeze": <div className="mt-2 text-xs text-white/45">Breezes seen: {breezes.length ? breezes.map((b) => `${b} breeze`).join(" and ") : "none yet"}</div>,
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {R ? (
            <div>Answer the question under the lab. Use the lab to check first.</div>
          ) : (
            <button
              className="btn-ghost !px-3 !py-1.5 text-sm"
              onClick={() => {
                setRound(0);
                setFeedback(null);
              }}
            >
              {best ? "Play again" : "Start the questions"}
            </button>
          )}
          {best > 0 && <div className="mt-1 text-xs">Solved: {best} of {CHALLENGE_ROUNDS.length}</div>}
        </div>
      }
    />
  );
}
