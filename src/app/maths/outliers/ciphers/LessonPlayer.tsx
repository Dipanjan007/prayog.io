"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import CipherLab, { type CipherReading } from "@/components/sim/CipherLab";
import { SECRETS, lesson } from "@/content/lessons/ciphers";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [round, setRound] = useState<number | null>(null);
  const [cracked, setCracked] = useState(0);
  // Clock task: for each clock, start and landing place, the first amount added that got there.
  const landings = useRef(new Map<string, number>());

  const lastReading = useRef<CipherReading | null>(null);
  const onReading = useCallback(
    (r: CipherReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "secret" && r.ok) {
          const done = round + 1;
          setCracked((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === SECRETS.length) badge("kindi-codebreaker");
          }
          // Leave "Cracked!" on screen for a moment before the next message.
          setTimeout(() => setRound(done < SECRETS.length ? done : null), 1600);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "wheel") {
        if (!isDone("task:wheel") && r.k === 3 && r.wraps) finishTask("task:wheel");
      } else if (r.mode === "clock") {
        const key = `${r.n}|${r.start}|${r.result}`;
        const before = landings.current.get(key);
        if (before === undefined) landings.current.set(key, r.add);
        else if (before !== r.add && !isDone("task:clock")) finishTask("task:clock");
      } else if (r.mode === "crack") {
        if (!isDone("task:crack") && r.ok) finishTask("task:crack");
      } else if (r.mode === "primes") {
        if (!isDone("task:primes") && r.split && r.n > 10000) finishTask("task:primes");
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

  const secret = round !== null ? SECRETS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<CipherLab key={round ?? "free"} onReading={onReading} secret={secret} />}
      simNote="Letters are numbered A = 0 to Z = 25. Spaces and punctuation are left as they are. Real public-key codes use primes hundreds of digits long; the ones here are small enough to split by hand."
      challengeBody={
        <div className="text-sm text-white/60">
          {secret ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Message {round! + 1} of {SECRETS.length}: {secret.name}
              </div>
              <div className="mt-1 text-xs">{secret.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {cracked ? "Decode the messages again" : "Decode the messages"}
            </button>
          )}
          {cracked > 0 && (
            <div className="mt-1 text-xs">
              Messages cracked: {cracked} of {SECRETS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
