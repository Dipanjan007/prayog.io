"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import PathLab, { type PathReading } from "@/components/sim/PathLab";
import { MAP_PUZZLES, lesson } from "@/content/lessons/paths-circles";
import { LANDMARKS, answerOk, averageSpeed, averageVelocity, pathVisits, streetDistance, type Pt } from "@/lib/sim/paths";
import { useLesson } from "@/lib/useLesson";

const HOME: Pt = { x: LANDMARKS.home.x, y: LANDMARKS.home.y };
const EPS = 1e-6;

type Walk = PathReading["walk"];
type Verdict = { ok: boolean; msg: string | null };

/** Has the walk met the puzzle's route rules? A message explains a near miss. */
function judgeWalk(n: number, walk: Walk): Verdict {
  const p = MAP_PUZZLES[n];
  const end = walk.points[walk.points.length - 1];
  if (walk.points.length < 2) return { ok: false, msg: null };
  if (p.kind === "reach500") {
    if (Math.abs(walk.mag - 500) > EPS) return { ok: false, msg: null };
    if (!(walk.dx > 0 && walk.dy > 0)) return { ok: false, msg: "That spot is 500 m away, but not between north and east. Try a spot off Home's own streets." };
    if (Math.abs(walk.distance - streetDistance(HOME, end)) > EPS)
      return { ok: false, msg: `Right spot, but you walked ${Math.round(walk.distance)} m. The shortest street route is ${streetDistance(HOME, end)} m. Press Reset walk and try again.` };
    return { ok: true, msg: null };
  }
  const stops = p.stops.map((id) => LANDMARKS[id]);
  const last = stops[stops.length - 1];
  if (end.x !== last.x || end.y !== last.y) return { ok: false, msg: null };
  let best = 0;
  let from: Pt = HOME;
  for (const s of stops) {
    best += streetDistance(from, s);
    from = s;
  }
  if (!stops.every((s) => pathVisits(walk.points, s)))
    return { ok: false, msg: `You reached the ${last.label}, but missed a stop. Press Reset walk and try again.` };
  if (Math.abs(walk.distance - best) > EPS)
    return { ok: false, msg: `You got there, but walked ${Math.round(walk.distance)} m. The shortest street route is ${best} m. Press Reset walk and try again.` };
  return { ok: true, msg: null };
}

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [round, setRound] = useState<number | null>(null);
  const [solved, setSolved] = useState(0);
  const [walk, setWalk] = useState<Walk | null>(null);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const solve = useCallback(
    (n: number) => {
      const done = n + 1;
      setSolved((s) => Math.max(s, done));
      if (isDone("ideas")) {
        challengeStars(done);
        if (done === MAP_PUZZLES.length) badge("route-master");
      }
      setRound(done < MAP_PUZZLES.length ? done : null);
      setWalk(null);
      setGuess("");
      setFeedback(done < MAP_PUZZLES.length ? `Puzzle ${done} solved! On to the next one.` : "All three routes solved. You know your way round Kolkata!");
    },
    [isDone, challengeStars, badge],
  );

  const lastReading = useRef<PathReading | null>(null);
  const onReading = useCallback(
    (r: PathReading) => {
      lastReading.current = r;
      if (round !== null) {
        setWalk(r.walk);
        const v = judgeWalk(round, r.walk);
        if (v.ok && MAP_PUZZLES[round].kind === "reach500") solve(round);
        return;
      }
      if (!isDone("predict")) return;
      const w = r.walk;
      if (r.mode === "map" && !isDone("task:straight") && w.distance >= 300 - EPS && Math.abs(w.distance - w.mag) < EPS) finishTask("task:straight");
      if (r.mode === "map" && !isDone("task:round") && w.distance >= 400 - EPS && w.mag < EPS) finishTask("task:round");
      if (!isDone("task:throw") && r.caught) finishTask("task:throw");
      if (!isDone("task:tangent") && r.ring.kind === "marble" && r.ring.released) finishTask("task:tangent");
      if (!isDone("task:lap") && r.ring.laps >= 1) finishTask("task:lap");
    },
    [round, isDone, finishTask, solve],
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
    setWalk(null);
    setGuess("");
    setFeedback(null);
  };

  const puzzle = round !== null ? MAP_PUZZLES[round] : null;
  const verdict = round !== null && walk ? judgeWalk(round, walk) : null;
  const routeOk = !!verdict?.ok;

  const check = () => {
    if (round === null || !walk || !routeOk) return;
    const truth = averageVelocity(walk.mag, walk.time);
    const tol = puzzle?.kind === "answer" ? puzzle.tolerance : 0.03;
    const g = Number(guess);
    if (answerOk(g, truth, tol)) solve(round);
    else if (answerOk(g, averageSpeed(walk.distance, walk.time), tol))
      setFeedback("That is your average speed. Average velocity uses the displacement, the straight arrow from Home, not the distance walked.");
    else setFeedback("Not quite. Average velocity = displacement ÷ time. Read both from the sim.");
  };

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={
        <PathLab
          key={round ?? "free"}
          onReading={onReading}
          puzzle={puzzle ? { highlight: puzzle.kind === "answer" ? puzzle.stops : [] } : null}
        />
      }
      simNote="The map walk is drawn to scale and the clock uses a steady walking pace of 1.4 m/s, but the walker moves much faster on screen. The ball and the marble move in real time. The 400 m track is drawn as a circle with the same lap length, and the race plays 10 times faster than real time while the clock shows the real race time."
      challengeBody={
        <div className="min-w-0 flex-1 text-sm text-white/60">
          {puzzle ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Puzzle {round! + 1} of {MAP_PUZZLES.length}: {puzzle.title}
              </div>
              <div className="mt-1">{puzzle.text}</div>
              {verdict?.msg && <div className="mt-2 text-xs text-amber-200">{verdict.msg}</div>}
              {puzzle.kind === "answer" && (
                <>
                  <div className="mt-2 text-xs">
                    {routeOk && walk
                      ? `Route done: ${Math.round(walk.distance)} m walked in ${Math.round(walk.time)} s. Displacement ${Math.round(walk.mag)} m. Average velocity?`
                      : "Walk the route on the map first. Pink rings mark the stops."}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      className="field min-w-0 flex-1 !py-1.5 tabular-nums"
                      inputMode="decimal"
                      placeholder="m/s"
                      aria-label="Your average velocity answer in metres per second"
                      value={guess}
                      onChange={(e) => setGuess(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && check()}
                      disabled={!routeOk}
                    />
                    <button className="btn-primary !px-3 !py-1.5 text-sm" onClick={check} disabled={!routeOk || !guess}>
                      Check
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => startRound(0)}>
              {solved ? "Play the puzzles again" : "Start the puzzles"}
            </button>
          )}
          {feedback && <div className={`mt-2 text-xs ${feedback.startsWith("Not") || feedback.startsWith("That") ? "text-amber-200" : "text-lime-300"}`}>{feedback}</div>}
          {solved > 0 && (
            <div className="mt-1 text-xs">
              Puzzles solved: {solved} of {MAP_PUZZLES.length}
            </div>
          )}
        </div>
      }
    />
  );
}
