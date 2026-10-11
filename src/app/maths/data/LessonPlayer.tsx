"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import DotPlotLab, { type DataReading } from "@/components/sim/DotPlotLab";
import { REQUESTS, lesson } from "@/content/lessons/data";
import { DATASETS, balanced, modeCount, modes, outlierPulls } from "@/lib/sim/data";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [round, setRound] = useState<number | null>(null);
  const [met, setMet] = useState(0);

  const lastReading = useRef<DataReading | null>(null);
  const onReading = useCallback(
    (r: DataReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "check" && r.ok) {
          const done = round + 1;
          setMet((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === REQUESTS.length) badge("selectors-choice");
          }
          // Leave the success on screen for a moment before the next request.
          setTimeout(() => setRound(done < REQUESTS.length ? done : null), 1400);
        }
        return;
      }
      if (!isDone("predict") || r.mode !== "data") return;
      if (r.set === "heights") {
        if (!isDone("task:balance") && balanced(DATASETS.heights.start, r.values)) finishTask("task:balance");
        if (!isDone("task:mode") && modeCount(r.values) >= 3 && modes(r.values).length === 1) finishTask("task:mode");
      } else {
        if (!isDone("task:century") && outlierPulls(DATASETS.cricket.start, r.values)) finishTask("task:century");
        if (!isDone("task:even") && r.values.length % 2 === 0) finishTask("task:even");
      }
    },
    [round, isDone, finishTask, challengeStars, badge],
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

  const request = round !== null ? REQUESTS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<DotPlotLab key={round ?? "free"} onReading={onReading} request={request} />}
      simNote="Drag a dot along the line, or pick a value below and use the slider or the +/− buttons. Scores are whole runs and heights are whole centimetres. Reset data puts back the starting values."
      challengeBody={
        <div className="text-sm text-white/60">
          {request ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Request {round! + 1} of {REQUESTS.length}: {request.name}
              </div>
              <div className="mt-1 text-xs">{request.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {met ? "Take the requests again" : "Meet the selectors"}
            </button>
          )}
          {met > 0 && (
            <div className="mt-1 text-xs">
              Requests met: {met} of {REQUESTS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
