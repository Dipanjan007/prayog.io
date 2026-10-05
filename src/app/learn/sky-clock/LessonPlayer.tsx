"use client";

import { useCallback, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import SkyClock, { type SkyReading } from "@/components/sim/SkyClock";
import { MOON_ROUNDS, MOON_TOLERANCE, lesson } from "@/content/lessons/sky-clock";
import { useLesson } from "@/lib/useLesson";

/** Smallest angle between two elongations, in degrees. */
const angleGap = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [round, setRound] = useState<number | null>(null);
  const [matched, setMatched] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [seen, setSeen] = useState<{ day: boolean; night: boolean; jun: boolean; dec: boolean }>({ day: false, night: false, jun: false, dec: false });
  const last = useRef<SkyReading | null>(null);
  const sawMorning = useRef(false);

  const onReading = useCallback(
    (r: SkyReading) => {
      last.current = r;
      if (round !== null || !isDone("predict")) return;
      if (r.mode === "orbit") {
        if (!isDone("task:daynight")) {
          setSeen((prev) => {
            const next = { ...prev, [r.indiaDay ? "day" : "night"]: true };
            if (next.day && next.night && !(prev.day && prev.night)) queueMicrotask(() => finishTask("task:daynight"));
            return next;
          });
        }
        if (!isDone("task:full") && r.lit >= 0.985) finishTask("task:full");
        if (!isDone("task:year") && r.day >= 353 && r.day <= 356) finishTask("task:year");
      } else {
        const { hour, month, alt } = r.shadow;
        if (hour <= 9 && alt > 0) sawMorning.current = true;
        const noon = Math.abs(hour - 12) < 0.01;
        if (!isDone("task:noon") && noon && sawMorning.current) finishTask("task:noon");
        if (noon && (month === 5 || month === 11)) {
          setSeen((prev) => {
            const key = month === 5 ? "jun" : "dec";
            if (prev[key]) return prev;
            const next = { ...prev, [key]: true };
            if (next.jun && next.dec && !isDone("task:seasons")) queueMicrotask(() => finishTask("task:seasons"));
            return next;
          });
        }
      }
    },
    [round, isDone, finishTask],
  );

  const lockIn = () => {
    const r = last.current;
    if (round === null || !r) return;
    const gap = angleGap(r.elong, MOON_ROUNDS[round].elong);
    if (gap <= MOON_TOLERANCE) {
      const done = round + 1;
      setMatched((m) => Math.max(m, done));
      if (isDone("ideas")) {
        challengeStars(done);
        if (done === MOON_ROUNDS.length) badge("moon-watcher");
      }
      setFeedback(done < MOON_ROUNDS.length ? "A match! Here is the next Moon." : "All three Moons matched.");
      setRound(done < MOON_ROUNDS.length ? done : null);
    } else {
      const sideWrong = r.elong < 180 !== MOON_ROUNDS[round].elong < 180;
      setFeedback(sideWrong ? "Not yet. Check which side of the Moon is lit." : "Close, but not the same shape yet. Try a day or two either way.");
    }
  };

  const target = round !== null ? MOON_ROUNDS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<SkyClock key={round ?? "free"} onReading={onReading} target={target ? { elong: target.elong } : null} />}
      simNote="Sizes and distances are not to scale: the Moon's orbit is drawn hugely bigger so you can see it. The Moon is drawn as seen from India; its tilt in the real sky changes through the night. Shadows use local Sun time on the 21st of each month at 23° N."
      taskExtras={{
        "task:daynight": (
          <div className="mt-2 text-xs text-white/50">
            India seen in: {seen.day ? "day" : ""}
            {seen.day && seen.night ? " and " : ""}
            {seen.night ? "night" : ""}
            {!seen.day && !seen.night ? "nothing yet" : ""}
          </div>
        ),
        "task:seasons": (
          <div className="mt-2 text-xs text-white/50">
            Noon shadows seen: {[seen.jun && "June", seen.dec && "December"].filter(Boolean).join(" and ") || "none yet"}
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {target ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Moon {round! + 1} of {MOON_ROUNDS.length}: {target.who}
              </div>
              <div className="mt-1 italic">{target.hint}</div>
              <button className="btn-ghost mt-2 !px-3 !py-1.5 text-sm" onClick={lockIn}>
                Lock in this day
              </button>
            </div>
          ) : (
            <button
              className="btn-ghost !px-3 !py-1.5 text-sm"
              onClick={() => {
                setFeedback(null);
                setRound(0);
              }}
            >
              {matched ? "Play Moon match again" : "Start Moon match"}
            </button>
          )}
          {feedback && <div className="mt-1 text-xs">{feedback}</div>}
          {matched > 0 && (
            <div className="mt-1 text-xs">
              Moons matched: {matched} of {MOON_ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
