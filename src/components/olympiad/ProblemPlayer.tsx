"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getProblem, getSet, problemsInSet } from "@/content/olympiad";
import { planOutcome, type Outcome } from "@/lib/olympiad/scene";
import { LEVEL_LABEL, MAX_HINTS, TOLERANCE, fmt, isCorrect, parseAnswer, simValue, starsFor, xpFor } from "@/lib/olympiad/score";
import { olyStore, recordSolve, recordTry } from "@/lib/olympiad/store";
import OlySim from "./OlySim";
import { Stars } from "./Stars";

interface Result {
  value: number;
  correct: boolean;
  outcome: Outcome;
  stars: number;
  xp: number;
  /** First correct solve in this visit. */
  fresh: boolean;
}

export default function ProblemPlayer({ setId, problemId }: { setId: string; problemId: string }) {
  const p = getProblem(setId, problemId)!;
  const set = getSet(setId)!;
  const siblings = problemsInSet(setId);
  const idx = siblings.findIndex((q) => q.id === p.id);
  const next = siblings[idx + 1];

  const state = olyStore.use();
  const best = state.problems[p.id];

  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hints, setHints] = useState(0);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [confirmSolution, setConfirmSolution] = useState(false);
  const [solvedNow, setSolvedNow] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [runValue, setRunValue] = useState<number | null>(null);
  const [pending, setPending] = useState<Result | null>(null);
  const [shown, setShown] = useState<Result | null>(null);
  const [running, setRunning] = useState(false);

  const scene = useMemo(() => p.scene(runValue ?? p.range[0] + (p.range[1] - p.range[0]) * 0.37), [p, runValue]);
  const worth = solvedNow ? (shown?.stars ?? 0) : starsFor(hints, solutionOpen);

  function test() {
    const v = parseAnswer(input);
    if (v === null) {
      setError("Type a number, like 12.5. Use digits only; the unit is already shown.");
      return;
    }
    if (v < p.range[0] || v > p.range[1]) {
      setError(`That is far outside what makes sense here. Try a value between ${p.range[0]} and ${p.range[1]} ${p.unit === "(no unit)" ? "" : p.unit}.`);
      return;
    }
    setError(null);
    const correct = isCorrect(v, p.answer);
    const sv = simValue(v, p.answer);
    const { outcome } = planOutcome(p.scene(sv));
    recordTry(p.id);
    let stars = 0;
    let xp = 0;
    let fresh = false;
    if (correct && !solvedNow) {
      stars = starsFor(hints, solutionOpen);
      xp = xpFor(p.level, stars);
      fresh = true;
      setSolvedNow(true);
      recordSolve(p.id, stars, xp);
    } else if (correct) {
      stars = shown?.stars ?? 0;
    }
    setShown(null);
    setPending({ value: v, correct, outcome, stars, xp, fresh });
    setRunValue(sv);
    setRunning(true);
    setRunKey((k) => k + 1);
  }

  function done() {
    setRunning(false);
    setShown(pending);
  }

  function openSolution() {
    if (!solvedNow && !confirmSolution) {
      setConfirmSolution(true);
      return;
    }
    setSolutionOpen(true);
    setConfirmSolution(false);
  }

  const unit = p.unit === "(no unit)" ? "" : p.unit;

  return (
    <div className="pt-2">
      <nav className="text-sm text-faint" aria-label="Breadcrumb">
        <Link href="/olympiad" className="hover:text-cream">
          Olympiad
        </Link>
        {" › "}
        <Link href={`/olympiad/${set.id}`} className="hover:text-cream">
          {set.title}
        </Link>
      </nav>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] uppercase tracking-wider" style={{ color: set.colour }}>
          {LEVEL_LABEL[p.level]}
        </span>
        {best?.solved && (
          <span className="text-xs text-faint">
            Best: <Stars n={best.stars} /> · {best.xp} XP
          </span>
        )}
      </div>
      <h1 className="font-display mt-1 text-3xl font-bold sm:text-4xl">
        {p.emoji} {p.title}
      </h1>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* The problem */}
        <section className="glass min-w-0 rounded-3xl p-4 sm:p-5">
          <div className="space-y-2 text-cream/85">
            {p.story.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <h2 className="mt-4 text-[11px] uppercase tracking-wider text-saffron-200/80">Given</h2>
          <ul className="mt-1 space-y-1 text-sm text-cream/85">
            {p.given.map((g) => (
              <li key={g}>• {g}</li>
            ))}
          </ul>
          <div className="mt-4 rounded-2xl border border-saffron-300/30 bg-saffron-300/10 p-3">
            <h2 className="text-[11px] uppercase tracking-wider text-saffron-200/80">Find</h2>
            <p className="mt-1 font-semibold">{p.ask}</p>
          </div>
          <p className="mt-3 text-xs text-faint">✏️ Work it out with pencil and paper first. A calculator is fine. Answers within ±{TOLERANCE * 100}% count.</p>
        </section>

        {/* Sim + answer */}
        <section className="flex min-w-0 flex-col gap-3">
          <OlySim key={p.id} scene={scene} idle={runKey === 0} runKey={runKey} onDone={done} />

          <form
            className="glass rounded-3xl p-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!running) test();
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="oly-answer" className="text-sm text-muted">
                Your answer
              </label>
              <span className="text-xs text-faint">
                Worth now: <Stars n={worth} />
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="font-display shrink-0 text-lg">{p.symbol}</span>
              <input
                id="oly-answer"
                className="field min-w-0 flex-1 text-lg tabular-nums"
                inputMode="decimal"
                enterKeyHint="go"
                autoComplete="off"
                placeholder="0.0"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                aria-describedby="oly-unit"
              />
              <span id="oly-unit" className="shrink-0 text-muted">
                {p.unit}
              </span>
            </div>
            {error && (
              <p className="mt-2 text-sm text-brick-300" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="btn-primary mt-3 w-full" disabled={running || !input.trim()}>
              {running ? "Running the sim…" : "▶ Test it in the sim"}
            </button>

            {shown && (
              <div
                className={`mt-3 rounded-2xl border p-3 text-sm ${shown.correct ? "border-sage-300/40 bg-sage-300/10" : "border-brick-300/40 bg-brick-300/10"}`}
                role="status"
                data-testid="verdict"
              >
                <div className="font-semibold">
                  {shown.correct ? (
                    <>
                      ✅ Correct!{" "}
                      {shown.fresh && (
                        <span>
                          <Stars n={shown.stars} /> +{shown.xp} XP
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      ❌ Not quite. You entered {p.symbol} {fmt(shown.value, 4)} {unit}.
                    </>
                  )}
                </div>
                <p className="mt-1 text-cream/85">The sim: {shown.outcome.text}</p>
                {shown.correct && Math.abs(shown.value - p.answer) > 1e-9 * Math.abs(p.answer) && (
                  <p className="mt-1 text-xs text-faint">
                    Within 2%, so the sim ran the exact value, {p.symbol} {fmt(p.answer, 4)} {unit}.
                  </p>
                )}
                {!shown.correct && <p className="mt-1 text-xs text-faint">Check your free-body diagram and your units, then try again.</p>}
              </div>
            )}
          </form>

          {/* Hints and solution */}
          <div className="glass rounded-3xl p-4">
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: MAX_HINTS }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={hints > i || hints < i}
                  onClick={() => setHints(i + 1)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm whitespace-nowrap ${hints > i ? "chip-on" : "border-line text-muted"} disabled:cursor-not-allowed`}
                >
                  💡 Hint {i + 1}
                  {!solvedNow && hints <= i ? " (−1 ★)" : ""}
                </button>
              ))}
              <button
                type="button"
                onClick={openSolution}
                disabled={solutionOpen}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm whitespace-nowrap ${solutionOpen ? "chip-on" : "border-line text-muted"}`}
              >
                📘 Worked solution
              </button>
            </div>
            {confirmSolution && (
              <div className="mt-3 rounded-2xl border border-ochre-300/40 bg-ochre-300/10 p-3 text-sm">
                <p>If you open the solution before solving, this problem gives no stars. You can still enter the answer afterwards to see it in the sim.</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" className="rounded-xl border border-line-strong px-3 py-1.5" onClick={openSolution}>
                    Show it anyway
                  </button>
                  <button type="button" className="rounded-xl px-3 py-1.5 text-muted" onClick={() => setConfirmSolution(false)}>
                    Keep trying
                  </button>
                </div>
              </div>
            )}
            {hints > 0 && (
              <ol className="mt-3 space-y-2 text-sm text-cream/85">
                {p.hints.slice(0, hints).map((h, i) => (
                  <li key={i} className="rounded-2xl bg-cream/[0.04] p-3">
                    <span className="text-saffron-200">Hint {i + 1}.</span> {h}
                  </li>
                ))}
              </ol>
            )}
            {solutionOpen && (
              <div className="mt-3" data-testid="solution">
                <h2 className="font-display text-lg font-semibold">Worked solution</h2>
                <ol className="mt-2 space-y-3">
                  {p.solution.map((st, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-saffron-300/15 text-xs text-saffron-200">{i + 1}</span>
                      <div className="min-w-0">
                        <p className="text-sm text-cream/85">{st.text}</p>
                        {st.math && <p className="mt-1 rounded-xl bg-ink/30 px-3 py-2 font-mono text-[13px] break-words text-saffron-100">{st.math}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
                <p className="mt-3 text-sm">
                  Answer:{" "}
                  <span className="font-semibold text-sage-300">
                    {p.symbol} {fmt(p.answer, 3)} {unit}
                  </span>
                </p>
              </div>
            )}
          </div>

          <p className="text-xs text-faint">About the sim: {p.simNote}</p>

          <div className="flex flex-wrap gap-2">
            {next ? (
              <Link href={`/olympiad/${set.id}/${next.id}`} className="btn-ghost">
                Next: {next.title} →
              </Link>
            ) : (
              <Link href="/olympiad" className="btn-ghost">
                Back to all sets →
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
