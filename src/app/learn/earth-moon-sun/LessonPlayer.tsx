"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import EarthSunLab, { type EarthSunReading } from "@/components/sim/EarthSunLab";
import { SKY_JOBS, lesson } from "@/content/lessons/earth-moon-sun";
import { CITIES, MONTHS, isSolar, longestDay, type CityId } from "@/lib/sim/earthsun";
import { useLesson } from "@/lib/useLesson";

/** Delhi's longest day, to the minute the sim shows. */
const DELHI_BEST_MIN = Math.round(longestDay(CITIES.delhi.lat).hours * 60);
const SEASON_MONTHS = [2, 5, 8, 11];

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [round, setRound] = useState<number | null>(null);
  const [best, setBest] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [sides, setSides] = useState<string[]>([]);
  const [months, setMonths] = useState<number[]>([]);
  const [cities, setCities] = useState<CityId[]>([]);
  const [kinds, setKinds] = useState<string[]>([]);

  const collect = <T,>(set: (f: (p: T[]) => T[]) => void, value: T, need: number, task: string) =>
    set((prev) => {
      if (prev.includes(value)) return prev;
      const next = [...prev, value];
      if (next.length === need) queueMicrotask(() => finishTask(task));
      return next;
    });

  const lastReading = useRef<EarthSunReading | null>(null);
  const onReading = useCallback(
    (r: EarthSunReading) => {
      lastReading.current = r;
      if (round !== null) {
        const won =
          round === 0
            ? r.mode === "seasons" && r.city === "delhi" && Math.round(r.dayLength * 60) >= DELHI_BEST_MIN
            : round === 1
              ? r.mode === "eclipse" && r.tilt && r.eclipse === "total-lunar"
              : r.mode === "eclipse" && r.tilt && r.eclipse === "total-solar";
        if (!won) return;
        const done = round + 1;
        setBest((b) => Math.max(b, done));
        if (isDone("ideas")) {
          challengeStars(done);
          if (done === SKY_JOBS.length) badge("eclipse-hunter");
        }
        setFeedback(`Job ${done} done: ${SKY_JOBS[round].title}.`);
        setRound(done < SKY_JOBS.length ? done : null);
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "seasons") {
        if (!isDone("task:spin") && r.sunAlt > 5) collect(setSides, r.sunAz < 180 ? "east" : "west", 2, "task:spin");
        if (!isDone("task:cities") && r.month === 5) collect(setCities, r.city, 3, "task:cities");
      }
      if (!isDone("task:year") && SEASON_MONTHS.includes(r.month)) collect(setMonths, r.month, 4, "task:year");
      if (r.mode === "eclipse") {
        if (!isDone("task:eclipse") && !r.tilt && r.eclipse !== "none") collect(setKinds, isSolar(r.eclipse) ? "solar" : "lunar", 2, "task:eclipse");
        const lined = r.elong === 0 || r.elong === 180;
        if (!isDone("task:tilt") && r.tilt && lined && r.eclipse === "none") finishTask("task:tilt");
      }
    },
    // collect only uses stable setters and finishTask.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [round, isDone, finishTask, challengeStars, badge],
  );

  // The sim only reports changes, so replay what it shows now once the prediction or the ideas step is done.
  const predicted = api.done.has("predict");
  const ideasDone = api.done.has("ideas");
  useEffect(() => {
    if ((predicted || ideasDone) && lastReading.current) onReading(lastReading.current);
  }, [predicted, ideasDone, onReading]);

  const start = () => {
    setFeedback(null);
    setRound(0);
  };
  const job = round !== null ? SKY_JOBS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<EarthSunLab key={round ?? "free"} onReading={onReading} initialMode={round === null || round === 0 ? "seasons" : "eclipse"} initialTilt={round !== null && round > 0} />}
      simNote="Not to scale: the real Sun is 109 times wider than the Earth and about 390 times farther away than the Moon. In the eclipse views the sizes of the Earth, the Moon and their shadows keep their real ratios, but distances are squeezed. The Moon's orbit is drawn as a circle near its closest point, and the line where it crosses the Earth's orbit is held fixed, so this model's eclipse seasons are late January and late July. Day lengths use the real tilt and count from the first to the last glimpse of the Sun."
      taskExtras={{
        "task:spin": <div className="mt-2 text-xs text-faint">Sun seen in the: {sides.length ? sides.join(" and ") : "nowhere yet"}</div>,
        "task:year": <div className="mt-2 text-xs text-faint">Visited: {months.length ? months.map((m) => MONTHS[m]).join(", ") : "none yet"}</div>,
        "task:cities": <div className="mt-2 text-xs text-faint">Checked in June: {cities.length ? cities.map((c) => CITIES[c].name).join(", ") : "none yet"}</div>,
        "task:eclipse": <div className="mt-2 text-xs text-faint">Eclipses made: {kinds.length ? kinds.join(" and ") : "none yet"}</div>,
      }}
      challengeBody={
        <div className="text-sm text-muted" aria-live="polite">
          {job ? (
            <div className="rounded-xl panel p-3">
              <div className="text-cream">
                Job {round! + 1} of {SKY_JOBS.length}: {job.title}
              </div>
              <div className="mt-1">{job.ask}</div>
              <div className="mt-1 text-xs text-faint">Hint: {job.hint}</div>
              {feedback && <div className="mt-1 text-xs text-sage-200">{feedback}</div>}
            </div>
          ) : (
            <>
              {feedback && <div className="mb-1 text-xs text-sage-200">{feedback}</div>}
              <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={start}>
                {best ? "Plan the sky again" : "Start the jobs"}
              </button>
            </>
          )}
          {best > 0 && <div className="mt-1 text-xs">Jobs done: {best} of {SKY_JOBS.length}</div>}
        </div>
      }
    />
  );
}
