"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import SolutionLine, { type LineReading } from "@/components/sim/SolutionLine";
import { PUZZLES, lesson } from "@/content/lessons/two-variables";
import type { Eq } from "@/lib/sim/twovar";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [solutions, setSolutions] = useState<string[]>([]);
  const [axes, setAxes] = useState({ x: false, y: false });
  const [moved, setMoved] = useState({ c: false, a: false });
  const [round, setRound] = useState<number | null>(null);
  const [solved, setSolved] = useState(0);

  const lastReading = useRef<LineReading | null>(null);
  // The equation the tasks saw last, to tell which slider moved.
  const lastEq = useRef<Eq | null>(null);
  const sawOnLine = useRef(false);
  const onReading = useCallback(
    (r: LineReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "check" && r.ok) {
          const done = round + 1;
          setSolved((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === PUZZLES.length) badge("cross-checker");
          }
          // Leave the success on screen for a moment before the next puzzle.
          setTimeout(() => setRound(done < PUZZLES.length ? done : null), 1400);
        }
        return;
      }
      if (!isDone("predict") || r.mode !== "free") return;
      const { eq, p, on } = r;
      if (on && eq.a === 2 && eq.b === 3 && eq.c === 12) {
        const key = `${p.x},${p.y}`;
        setSolutions((prev) => {
          if (prev.includes(key)) return prev;
          const next = [...prev, key];
          if (next.length === 3) queueMicrotask(() => !isDone("task:three") && finishTask("task:three"));
          return next;
        });
      }
      // With the line showing, P must sit on it once and then step off it.
      if (r.showLine && on) sawOnLine.current = true;
      if (!r.showLine) sawOnLine.current = false;
      if (!isDone("task:line") && r.showLine && !on && sawOnLine.current && !(eq.a === 0 && eq.b === 0)) finishTask("task:line");
      // The origin is on both axes, so it does not count as finding an intercept.
      if (on && (p.x === 0) !== (p.y === 0)) {
        const hitX = p.y === 0 && eq.a !== 0;
        const hitY = p.x === 0 && eq.b !== 0;
        setAxes((s) => {
          const next = { x: s.x || hitX, y: s.y || hitY };
          if (next.x === s.x && next.y === s.y) return s;
          if (next.x && next.y) queueMicrotask(() => !isDone("task:intercepts") && finishTask("task:intercepts"));
          return next;
        });
      }
      const prev = lastEq.current;
      lastEq.current = eq;
      if (prev) {
        const c = prev.c !== eq.c && prev.a === eq.a && prev.b === eq.b;
        const a = prev.a !== eq.a && prev.b === eq.b && prev.c === eq.c;
        if (c || a)
          setMoved((m) => {
            const next = { c: m.c || c, a: m.a || a };
            if (next.c === m.c && next.a === m.a) return m;
            if (next.c && next.a) queueMicrotask(() => !isDone("task:slide") && finishTask("task:slide"));
            return next;
          });
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

  const puzzle = round !== null ? PUZZLES[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<SolutionLine key={round ?? "free"} onReading={onReading} puzzle={puzzle} />}
      simNote="The grid runs from −2 to 12 on both axes. The shop story multiplies every number by 10, so 2x + 3y = 12 is the same bill as 20x + 30y = 120."
      taskExtras={{
        "task:three": <div className="mt-2 text-xs text-white/50">Solutions of 2x + 3y = 12 found: {solutions.length} of 3</div>,
        "task:intercepts": (
          <div className="mt-2 text-xs text-white/50">
            {axes.x ? "✓" : "○"} On the x-axis · {axes.y ? "✓" : "○"} On the y-axis
          </div>
        ),
        "task:slide": (
          <div className="mt-2 text-xs text-white/50">
            {moved.c ? "✓" : "○"} Only c changed · {moved.a ? "✓" : "○"} Only a changed
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {puzzle ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Puzzle {round! + 1} of {PUZZLES.length}: {puzzle.name}
              </div>
              <div className="mt-1 text-xs">{puzzle.brief}</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {solved ? "Solve the puzzles again" : "Start the puzzles"}
            </button>
          )}
          {solved > 0 && (
            <div className="mt-1 text-xs">
              Puzzles solved: {solved} of {PUZZLES.length}
            </div>
          )}
        </div>
      }
    />
  );
}
