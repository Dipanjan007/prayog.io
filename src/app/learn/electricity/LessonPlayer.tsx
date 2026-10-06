"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import CircuitLab, { type CircuitReading } from "@/components/sim/CircuitLab";
import { TARGETS, lesson } from "@/content/lessons/electricity";
import { hitsTarget } from "@/lib/sim/ohm";
import { useLesson } from "@/lib/useLesson";

type Wire = CircuitReading["wire"];

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [round, setRound] = useState<number | null>(null);
  const [solved, setSolved] = useState(0);
  const [lastHit, setLastHit] = useState<string | null>(null);
  const [ohmPoints, setOhmPoints] = useState(0);
  const [lengthSeen, setLengthSeen] = useState({ length: false, area: false });

  const prevWire = useRef<Wire | null>(null);
  const flags = useRef({ length: false, area: false });
  const materials = useRef(new Map<string, Set<string>>());
  const joins = useRef(new Map<string, Set<string>>());
  const heats = useRef(new Map<string, Set<number>>());

  const lastReading = useRef<CircuitReading | null>(null);
  const onReading = useCallback(
    (r: CircuitReading) => {
      lastReading.current = r;
      if (round !== null) {
        const t = TARGETS[round];
        if (hitsTarget(r.i, t.amps)) {
          const done = round + 1;
          setSolved((s) => Math.max(s, done));
          setLastHit(`Round ${done}: ${t.amps} A with ${r.pair.how} and ${r.cells} ${r.cells === 1 ? "cell" : "cells"}.`);
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === TARGETS.length) badge("on-target");
          }
          setRound(done < TARGETS.length ? done : null);
        }
        return;
      }
      if (!isDone("predict")) return;

      if (r.mode === "wire") {
        setOhmPoints(r.points);
        if (!isDone("task:ohm") && r.points >= 4) finishTask("task:ohm");

        const w = r.wire;
        const p = prevWire.current;
        if (p && p.material === w.material) {
          if (p.area === w.area && p.length !== w.length) flags.current.length = true;
          if (p.length === w.length && p.area !== w.area) flags.current.area = true;
          setLengthSeen({ ...flags.current });
          if (!isDone("task:length") && flags.current.length && flags.current.area) finishTask("task:length");
        }
        prevWire.current = w;

        const size = `${w.length}|${w.area}`;
        const set = materials.current.get(size) ?? new Set<string>();
        set.add(w.material);
        materials.current.set(size, set);
        if (!isDone("task:material") && set.has("copper") && set.has("nichrome")) finishTask("task:material");
      } else if (r.mode === "pair") {
        const key = `${r.pair.r1}|${r.pair.r2}`;
        const set = joins.current.get(key) ?? new Set<string>();
        set.add(r.pair.how);
        joins.current.set(key, set);
        if (!isDone("task:combo") && set.size === 2) finishTask("task:combo");
      } else {
        const w = r.wire;
        const key = `${w.material}|${w.length}|${w.area}|${r.heat.t}`;
        const set = heats.current.get(key) ?? new Set<number>();
        set.add(r.cells);
        heats.current.set(key, set);
        if (!isDone("task:heat") && [...set].some((c) => set.has(2 * c))) finishTask("task:heat");
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

  const target = round !== null ? TARGETS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<CircuitLab key={round ?? "free"} onReading={onReading} puzzle={target ? { r1: target.r1, r2: target.r2, amps: target.amps } : null} />}
      simNote="Cells and meters are ideal, and the wire's resistance does not change as it warms up. The dots show conventional current, from + to −. Real electrons drift the other way and far more slowly. The heating glow is exaggerated so you can see it."
      taskExtras={{
        "task:ohm": <div className="mt-2 text-xs text-white/50">Points on the graph for this wire: {Math.min(ohmPoints, 4)} of 4</div>,
        "task:length": (
          <div className="mt-2 text-xs text-white/50">
            Changed only the length: {lengthSeen.length ? "yes" : "not yet"}. Changed only the area: {lengthSeen.area ? "yes" : "not yet"}.
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {target ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Round {round! + 1} of {TARGETS.length}: make {target.amps} A from {target.r1} Ω and {target.r2} Ω
              </div>
              <div className="mt-1 text-xs italic">Hint: {target.hint}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {solved ? "Play the rounds again" : "Start the challenge"}
            </button>
          )}
          {lastHit && <div className="mt-1 text-xs text-lime-300">Hit! {lastHit}</div>}
          {solved > 0 && (
            <div className="mt-1 text-xs">
              Targets hit: {solved} of {TARGETS.length}
            </div>
          )}
        </div>
      }
    />
  );
}
