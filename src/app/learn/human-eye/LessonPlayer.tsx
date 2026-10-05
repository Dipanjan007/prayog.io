"use client";

import { useCallback, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import EyeBench, { type EyeReading } from "@/components/sim/EyeBench";
import { PATIENTS, lesson } from "@/content/lessons/human-eye";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [round, setRound] = useState<number | null>(null);
  const [cured, setCured] = useState(0);
  const [seen, setSeen] = useState<string[]>([]);

  const onReading = useCallback(
    (r: EyeReading) => {
      if (round !== null) {
        if (r.sharp) {
          const done = round + 1;
          setCured((c) => Math.max(c, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === PATIENTS.length) badge("clear-vision");
          }
          setRound(done < PATIENTS.length ? done : null);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "eye") {
        if (!isDone("task:accommodate") && r.condition === "normal" && r.glasses === 0 && r.sharp && (r.target === "book" || r.target === "stars")) {
          setSeen((prev) => {
            if (prev.includes(r.target)) return prev;
            const next = [...prev, r.target];
            if (next.length === 2) queueMicrotask(() => finishTask("task:accommodate"));
            return next;
          });
        }
        if (!isDone("task:myopia") && r.condition === "myopia" && r.target === "stars" && r.sharp && r.glasses < 0) finishTask("task:myopia");
        if (!isDone("task:hyper") && r.condition === "hypermetropia" && r.target === "book" && r.sharp && r.glasses > 0) finishTask("task:hyper");
      } else {
        if (!isDone("task:prism") && r.prism.incidence !== 50) finishTask("task:prism");
        if (!isDone("task:newton") && r.prism.recombined) finishTask("task:newton");
      }
    },
    [round, isDone, finishTask, challengeStars, badge],
  );

  const patient = round !== null ? PATIENTS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<EyeBench key={round ?? "free"} onReading={onReading} patient={patient} />}
      simNote="The eye is drawn about 2.5 cm across and focuses by changing its lens, just like yours. Prism colours are spread out more than real glass does, so you can see them."
      taskExtras={{
        "task:accommodate": <div className="mt-2 text-xs text-white/50">Seen sharply: {seen.length ? seen.join(" and ") : "nothing yet"}</div>,
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {patient ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Patient {round! + 1} of {PATIENTS.length}: {patient.name}
              </div>
              <div className="mt-1 italic">&ldquo;{patient.complaint}&rdquo;</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {cured ? "See the patients again" : "Open the clinic"}
            </button>
          )}
          {cured > 0 && <div className="mt-1 text-xs">Patients helped: {cured} of {PATIENTS.length}</div>}
        </div>
      }
    />
  );
}
