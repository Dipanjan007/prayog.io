"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import GravityLab, { type GravityReading } from "@/components/sim/GravityLab";
import { ASTRONAUT_KG, MYSTERY_WORLDS, lesson } from "@/content/lessons/gravity";
import { WORLDS, WORLD_IDS, worldG, type WorldId } from "@/lib/sim/gravity";
import { useLesson } from "@/lib/useLesson";

type PullPoint = { m1: number; m2: number; r: number };

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [law, setLaw] = useState({ mass: false, dist: false });
  const [worlds, setWorlds] = useState<WorldId[]>([]);
  const [fall, setFall] = useState({ apart: false, together: false });
  const [cannon, setCannon] = useState({ orbit: false, escape: false });
  const [round, setRound] = useState<number | null>(null);
  const [solved, setSolved] = useState(0);
  const [scaleN, setScaleN] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const pulls = useRef<PullPoint[]>([]);

  const lastReading = useRef<GravityReading | null>(null);
  const onReading = useCallback(
    (r: GravityReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "drop" && r.mystery) setScaleN(r.weight);
        return;
      }
      if (!isDone("predict")) return;

      if (r.mode === "pull" && !isDone("task:law")) {
        const prev = pulls.current;
        const twice = (a: number, b: number) => a === 2 * b || b === 2 * a;
        const mass = prev.some((p) => p.r === r.r && ((p.m2 === r.m2 && twice(p.m1, r.m1)) || (p.m1 === r.m1 && twice(p.m2, r.m2))));
        const dist = prev.some((p) => p.m1 === r.m1 && p.m2 === r.m2 && twice(p.r, r.r));
        pulls.current = [...prev.filter((p) => !(p.m1 === r.m1 && p.m2 === r.m2 && p.r === r.r)), { m1: r.m1, m2: r.m2, r: r.r }].slice(-60);
        setLaw((s) => {
          const next = { mass: s.mass || mass, dist: s.dist || dist };
          if (next.mass === s.mass && next.dist === s.dist) return s;
          if (next.mass && next.dist) queueMicrotask(() => !isDone("task:law") && finishTask("task:law"));
          return next;
        });
      }

      if (r.mode === "drop" && !r.mystery) {
        if (!isDone("task:weight")) {
          setWorlds((s) => {
            if (s.includes(r.world)) return s;
            const next = [...s, r.world];
            if (next.length >= 3) queueMicrotask(() => !isDone("task:weight") && finishTask("task:weight"));
            return next;
          });
        }
        const d = r.drop;
        if (d && !isDone("task:feather")) {
          setFall((s) => {
            const next = { apart: s.apart || (!d.together && d.air && d.world === "earth"), together: s.together || d.together };
            if (next.apart === s.apart && next.together === s.together) return s;
            if (next.apart && next.together) queueMicrotask(() => !isDone("task:feather") && finishTask("task:feather"));
            return next;
          });
        }
      }

      if (r.mode === "cannon" && r.shot && !isDone("task:cannon")) {
        const o = r.shot.outcome;
        setCannon((s) => {
          const next = { orbit: s.orbit || o === "orbit", escape: s.escape || o === "escape" };
          if (next.orbit === s.orbit && next.escape === s.escape) return s;
          if (next.orbit && next.escape) queueMicrotask(() => !isDone("task:cannon") && finishTask("task:cannon"));
          return next;
        });
      }

      if (r.mode === "squeeze" && r.blackHole && !isDone("task:squeeze")) finishTask("task:squeeze");
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
    setScaleN(null);
    setFeedback(null);
  };

  const guess = (id: WorldId) => {
    if (round === null) return;
    const answer = MYSTERY_WORLDS[round];
    if (id === answer) {
      const done = round + 1;
      setSolved((s) => Math.max(s, done));
      if (isDone("ideas")) {
        challengeStars(done);
        if (done === MYSTERY_WORLDS.length) badge("planet-detective");
      }
      const msg = `Yes! g = ${worldG(answer).toFixed(1)} m/s², so this is ${WORLDS[answer].label}.`;
      if (done < MYSTERY_WORLDS.length) {
        startRound(done);
        setFeedback(`${msg} On to the next world.`);
      } else {
        startRound(null);
        setFeedback(`${msg} All three worlds found. Great detective work!`);
      }
    } else {
      setFeedback(`Not ${WORLDS[id].label}. Work out g = W ÷ ${ASTRONAUT_KG} kg and compare it with g on each world.`);
    }
  };

  const mysteryWorld = round !== null ? MYSTERY_WORLDS[round] : null;
  const tick = (b: boolean) => (b ? "✓" : "○");

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<GravityLab key={round ?? "free"} onReading={onReading} mystery={mysteryWorld ? { world: mysteryWorld, mass: ASTRONAUT_KG } : null} />}
      simNote="Masses, radii and G are real. In Pull mode the bodies are drawn far bigger than real. Drops play in real time (or 4× slower). The cannon sits on an imaginary 100 km mountain above the air, drawn far taller, and its flight is sped up 900 times (more when the ball is far away). Jupiter has no solid ground, so we stand at its cloud tops. Squeeze mode uses Newton's escape speed formula; close to light speed Einstein's relativity takes over, but it gives the same black hole radius, 2GM ÷ c²."
      taskExtras={{
        "task:law": (
          <div className="mt-2 text-xs text-white/50">
            {tick(law.mass)} Doubled a mass · {tick(law.dist)} Doubled the distance
          </div>
        ),
        "task:weight": (
          <div className="mt-2 text-xs text-white/50">
            Worlds visited: {worlds.length ? worlds.map((w) => WORLDS[w].label).join(", ") : "none yet"} ({Math.min(worlds.length, 3)} of 3)
          </div>
        ),
        "task:feather": (
          <div className="mt-2 text-xs text-white/50">
            {tick(fall.apart)} Feather slower in Earth&apos;s air · {tick(fall.together)} Landed together
          </div>
        ),
        "task:cannon": (
          <div className="mt-2 text-xs text-white/50">
            {tick(cannon.orbit)} Orbit · {tick(cannon.escape)} Escape
          </div>
        ),
      }}
      challengeBody={
        <div className="min-w-0 flex-1 text-sm text-white/60">
          {mysteryWorld ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                World {round! + 1} of {MYSTERY_WORLDS.length}
              </div>
              <div className="mt-1">
                {scaleN === null ? "Look at the scale in the lab." : `The scale reads ${Math.round(scaleN)} N for a ${ASTRONAUT_KG} kg astronaut. Which world is this?`}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {WORLD_IDS.map((id) => (
                  <button key={id} className="btn-ghost !px-2 !py-1.5 text-sm" onClick={() => guess(id)}>
                    {WORLDS[id].label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => startRound(0)}>
              {solved ? "Play detective again" : "Start the mystery"}
            </button>
          )}
          {feedback && <div className={`mt-2 text-xs ${feedback.startsWith("Not") ? "text-amber-200" : "text-lime-300"}`}>{feedback}</div>}
          {solved > 0 && (
            <div className="mt-1 text-xs">
              Worlds found: {solved} of {MYSTERY_WORLDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
