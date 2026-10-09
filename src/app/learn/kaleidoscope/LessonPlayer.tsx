"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import KaleidoLab, { type KaleidoReading } from "@/components/sim/KaleidoLab";
import { lesson } from "@/content/lessons/kaleidoscope";
import { ROUNDS, formulaCount } from "@/lib/sim/kaleidoscope";
import { useLesson } from "@/lib/useLesson";

/** How many other angles (not 90° or 60°, which the earlier missions use) "Find the rule" needs. */
const RULE_ANGLES_NEEDED = 3;

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const tried = useRef(new Set<number>());
  const [triedList, setTriedList] = useState<number[]>([]);
  const [round, setRound] = useState<number | null>(null);
  const [solved, setSolved] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const lastReading = useRef<KaleidoReading | null>(null);
  const onReading = useCallback(
    (r: KaleidoReading) => {
      lastReading.current = r;
      if (r.challenge || !isDone("predict")) return;
      if (r.mode === "hinge") {
        if (r.angle === 90 && !isDone("task:corner")) finishTask("task:corner");
        if (r.angle === 60 && !isDone("task:kaleido")) finishTask("task:kaleido");
        if (r.angle !== 90 && r.angle !== 60 && !tried.current.has(r.angle)) {
          tried.current.add(r.angle);
          setTriedList([...tried.current].sort((a, b) => b - a));
          if (tried.current.size >= RULE_ANGLES_NEEDED && !isDone("task:formula")) finishTask("task:formula");
        }
      }
      if (r.mode === "parallel" && !isDone("task:parallel")) finishTask("task:parallel");
      if (r.mode === "sun" && r.charred) {
        if (r.focuser === "lens" && !isDone("task:burn")) finishTask("task:burn");
        if (r.focuser === "dish" && !isDone("task:dish")) finishTask("task:dish");
      }
    },
    [isDone, finishTask],
  );

  // The sim only reports changes, so replay what it shows now once the prediction is locked in
  // and again once the ideas are done, so a setup made earlier still counts.
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
    setFeedback(null);
    setRound(n);
  };

  const check = () => {
    const r = lastReading.current;
    if (round === null || !r || !r.challenge) return;
    const rd = ROUNDS[round];
    if (r.count === rd.target) {
      const done = round + 1;
      setSolved((s) => Math.max(s, done));
      if (isDone("ideas")) {
        challengeStars(done);
        if (done === ROUNDS.length) badge("image-counter");
      }
      setFeedback({ ok: true, text: `${r.count} images at ${r.angle}°. Spot on!` });
      setRound(done < ROUNDS.length ? done : null);
    } else {
      setFeedback({
        ok: false,
        text: `${r.count} image${r.count === 1 ? "" : "s"} at ${r.angle}°. Rule: (360° ÷ ${r.angle}°) − 1 = ${formulaCount(r.angle)}. ${formulaCount(r.angle) === rd.target ? "Right angle: now move the bangle." : r.count < rd.target ? "You need more: close the mirrors." : "Too many: open the mirrors wider."} ${rd.hint}`,
      });
    }
  };

  const current = round !== null ? ROUNDS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<KaleidoLab key={round ?? "free"} onReading={onReading} target={current ? current.target : null} />}
      simNote="The mirrors are drawn from above, and the images are placed by reflecting the bangle in one mirror, then the other, in turn. In real mirrors each bounce loses a few percent of the light, which the parallel mirrors show by fading. In Sunlight, the Sun is treated as a disc half a degree across, so even at the focus the spot is a small image of the Sun, not a point. The lens lets 90% of the light through and the dish reflects 80%. The card's warming is a simple model: paper chars at about 230 °C, and a spot needs to be roughly 30 times brighter than sunlight to get there."
      taskExtras={{
        "task:formula": (
          <div className="mt-2 text-xs text-white/50">
            Other angles tried: {triedList.length ? triedList.map((a) => `${a}°`).join(", ") : "none yet"} ({Math.min(triedList.length, RULE_ANGLES_NEEDED)} of {RULE_ANGLES_NEEDED})
          </div>
        ),
      }}
      challengeBody={
        <div className="min-w-0 flex-1 text-sm text-white/60">
          {current ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Round {round! + 1} of {ROUNDS.length}: {current.name}
              </div>
              <div className="mt-1 text-xs">Make exactly {current.target} images of the bangle.</div>
              <button className="btn-primary mt-2 !px-3 !py-1.5 text-sm" onClick={check}>
                Check
              </button>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => startRound(0)}>
              {solved ? "Play the rounds again" : "Start the rounds"}
            </button>
          )}
          {feedback && <div className={`mt-2 text-xs ${feedback.ok ? "text-lime-300" : "text-amber-200"}`}>{feedback.text}</div>}
          {solved > 0 && (
            <div className="mt-1 text-xs">
              Rounds solved: {solved} of {ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
