"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import Quiz from "@/components/Quiz";
import { ToastStack } from "@/components/Toasts";
import { stepOrder, XP, type LessonDef } from "@/content/lessons/types";
import { completeStep, improveBest } from "@/lib/progress";
import type { LessonApi } from "@/lib/useLesson";

interface Props {
  lesson: LessonDef;
  api: LessonApi;
  /** The simulation, shown beside the steps. */
  sim: ReactNode;
  simNote?: string;
  /** Extra content under a mission, keyed by task id (e.g. a results table). */
  taskExtras?: Record<string, ReactNode>;
  /** Live score display for the challenge. */
  challengeBody?: ReactNode;
}

/**
 * The shared lesson layout: a mission banner and simulation on one side, and
 * the Hook → Predict → Missions → Discover → Challenge → Quiz steps on the other.
 */
export default function LessonShell({ lesson, api, sim, simNote, taskExtras, challengeBody }: Props) {
  const { done, lp, reward, push, badge, checkAllDone, toasts } = api;
  const [prediction, setPrediction] = useState<number | null>(null);
  const order = stepOrder(lesson);
  const currentIndex = order.findIndex((s) => !done.has(s));
  const percent = Math.round((order.filter((s) => done.has(s)).length / order.length) * 100);
  const isOpen = (id: string) => {
    if (id.startsWith("task:")) return done.has("predict");
    return currentIndex === -1 || order.indexOf(id) <= currentIndex;
  };
  const nextTask = lesson.tasks.find((t) => !done.has(t.id));
  const mission = !done.has("hook")
    ? { title: "Start here", text: `Read "${lesson.hook.title}" to begin.` }
    : !done.has("predict")
      ? { title: "Predict first", text: "Lock in your guess, then test it in the simulation." }
      : nextTask
        ? { title: nextTask.title, text: nextTask.text }
        : !done.has("ideas")
          ? { title: "Missions complete", text: "See what you discovered." }
          : !done.has("challenge")
            ? { title: lesson.challenge.title, text: lesson.challenge.text }
            : !done.has("quiz")
              ? { title: "Master it", text: "Take the quiz. You can keep playing the challenge for more stars." }
              : { title: "Lesson complete", text: "Free play: experiment as much as you like." };
  const predictedRight = lp?.predictionCorrect;

  let n = 0;
  return (
    <>
      <div className="mb-6">
        <Link href="/learn" className="text-sm text-white/50 hover:text-white">
          ← Class {lesson.classNum} · {lesson.book} · {lesson.chapter}
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">{lesson.title}</h1>
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-xs text-white/50">
              <span>Lesson progress</span>
              <span>{percent}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-all" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>
      </div>

      <LabIntro lesson={lesson} startOpen={!done.has("hook")} key={done.has("hook") ? "seen" : "new"} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="mb-3 flex items-start gap-3 rounded-2xl border border-cyan-300/30 bg-cyan-300/[0.07] px-4 py-3" aria-live="polite">
            <span className="mt-0.5 text-lg">🎯</span>
            <div>
              <div className="text-sm font-semibold text-cyan-100">{mission.title}</div>
              <div className="text-sm text-white/70">{mission.text}</div>
            </div>
          </div>
          {sim}
          {simNote && <p className="mt-2 text-xs text-white/40">{simNote}</p>}
        </div>

        <ol className="flex flex-col gap-3">
          <Step n={++n} title={lesson.hook.title} done={done.has("hook")} open={isOpen("hook")}>
            <p className="text-white/75">{lesson.hook.text}</p>
            {!done.has("hook") && (
              <button className="btn-primary mt-4" onClick={() => reward("hook", XP.hook, "Curious mind")}>
                Let&apos;s find out
              </button>
            )}
          </Step>

          <Step n={++n} title="Predict first" done={done.has("predict")} open={isOpen("predict")}>
            <p className="font-medium">{lesson.predict.question}</p>
            <div className="mt-3 grid gap-2">
              {lesson.predict.options.map((o, i) => {
                const chosen = (prediction ?? (done.has("predict") && predictedRight ? lesson.predict.answer : null)) === i;
                return (
                  <button
                    key={o}
                    disabled={done.has("predict")}
                    onClick={() => setPrediction(i)}
                    className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                      chosen ? "border-violet-300 bg-violet-300/15" : "border-white/10 hover:border-white/40"
                    } disabled:cursor-default`}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
            {!done.has("predict") ? (
              <button
                className="btn-primary mt-4"
                disabled={prediction === null}
                onClick={() => reward("predict", XP.predict, "Made a prediction", { predictionCorrect: prediction === lesson.predict.answer })}
              >
                Lock it in
              </button>
            ) : (
              <p className="mt-3 text-sm text-white/50">Locked in. Now test it in the simulation.</p>
            )}
          </Step>

          {lesson.tasks.map((t) => (
            <Step key={t.id} n={++n} title={t.title} done={done.has(t.id)} open={isOpen(t.id)} badge="Mission">
              <p className="text-white/75">{done.has(t.id) ? t.found : t.text}</p>
              {!done.has(t.id) && taskExtras?.[t.id]}
            </Step>
          ))}

          <Step n={++n} title="What you discovered" done={done.has("ideas")} open={done.has("predict")} lockedHint="Make your prediction to unlock this.">
            {predictedRight !== undefined && (
              <p className={`mb-3 rounded-xl px-3 py-2 text-sm ${predictedRight ? "bg-lime-300/10 text-lime-200" : "bg-amber-300/10 text-amber-100"}`}>
                {predictedRight
                  ? `Your prediction was right: ${lesson.predict.options[lesson.predict.answer].toLowerCase()}.`
                  : `Surprise! The answer is: ${lesson.predict.options[lesson.predict.answer].toLowerCase()}. Scientists change their minds when experiments show them something new.`}
              </p>
            )}
            <div className="mb-2 rounded-xl border border-violet-300/30 bg-violet-300/[0.07] p-3">
              <div className="text-[11px] uppercase tracking-wider text-violet-200/80">Meet the discoverer</div>
              <div className="mt-1 font-semibold">
                {lesson.discovery.scientist} <span className="font-normal text-white/50">· {lesson.discovery.years}</span>
              </div>
              <p className="mt-1 text-sm text-white/70">{lesson.discovery.fact}</p>
              <div className="mt-2 rounded-lg bg-black/30 px-3 py-2 font-mono text-sm text-cyan-200">{lesson.discovery.formula}</div>
              <p className="mt-1 text-xs text-white/60">{lesson.discovery.formulaNote}</p>
            </div>
            <div className="grid gap-2">
              {lesson.ideas.map((idea) => (
                <div key={idea.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="font-semibold">{idea.title}</div>
                  <p className="mt-1 text-sm text-white/70">{idea.text}</p>
                  {idea.formula && <div className="mt-2 rounded-lg bg-black/30 px-3 py-2 font-mono text-sm text-cyan-200">{idea.formula}</div>}
                </div>
              ))}
            </div>
            {!done.has("ideas") && (
              <button
                className="btn-primary mt-4"
                onClick={() => {
                  if (reward("ideas", XP.ideas, "Big ideas") && predictedRight) {
                    const gained = completeStep(lesson.id, "predict-bonus", XP.predictCorrect);
                    if (gained) push(`+${gained} XP · Great prediction`);
                  }
                }}
              >
                Got it
              </button>
            )}
          </Step>

          <Step n={++n} title={lesson.challenge.title} done={done.has("challenge")} open={done.has("ideas")} badge="Challenge" lockedHint={'Read "What you discovered" to unlock this.'}>
            <p className="text-white/75">{lesson.challenge.text}</p>
            <div className="mt-3 flex items-center gap-4">
              <div className="text-3xl tracking-widest" aria-label={`${lp?.challengeStars ?? 0} of 3 stars`}>
                {[0, 1, 2].map((i) => (
                  <span key={i} className={i < (lp?.challengeStars ?? 0) ? "" : "opacity-20 grayscale"}>
                    ⭐
                  </span>
                ))}
              </div>
              {challengeBody}
            </div>
          </Step>

          <Step n={++n} title="Master it" done={done.has("quiz")} open={done.has("ideas")} badge="Quiz" lockedHint={'Read "What you discovered" to unlock this.'}>
            <Quiz
              questions={lesson.quiz}
              onFinish={(score) => {
                reward("quiz", 0, "Quiz done");
                const gained = improveBest(lesson.id, "quizBest", score, XP.perQuizPoint);
                if (gained) push(`+${gained} XP · Quiz best ${score}/${lesson.quiz.length}`);
                if (score === lesson.quiz.length) badge("sharp-mind");
                checkAllDone();
              }}
            />
            <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-dashed border-violet-300/30 px-3 py-2 text-sm">
              <span className="text-white/60">Ready for harder problems? Try the Olympiad track.</span>
              <Link href="/olympiad" className="shrink-0 rounded-full bg-violet-300/15 px-2 py-0.5 text-xs text-violet-200 hover:bg-violet-300/25">
                Olympiad →
              </Link>
            </div>
          </Step>
        </ol>
      </div>
      <ToastStack toasts={toasts} />
    </>
  );
}

/** "About this lab": objective, learning outcomes and real-life links. Open until the student starts. */
function LabIntro({ lesson, startOpen }: { lesson: LessonDef; startOpen: boolean }) {
  const { intro } = lesson;
  return (
    <details open={startOpen} className="glass group mb-6 rounded-2xl px-4 py-3">
      <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
        <span className="text-lg">🧭</span>
        <span className="font-display font-semibold">About this lab</span>
        <span className="ml-auto text-xs text-white/50">
          About {intro.minutes} min <span className="inline-block transition group-open:rotate-180">▾</span>
        </span>
      </summary>
      <div className="mt-3 grid gap-4 text-sm sm:grid-cols-3">
        <div>
          <h2 className="text-[11px] uppercase tracking-wider text-cyan-200/80">Objective</h2>
          <p className="mt-1 text-white/80">{intro.objective}</p>
          <p className="mt-2 text-xs text-white/50">
            NCERT Class {lesson.classNum} {lesson.book}: {lesson.chapter}
          </p>
        </div>
        <div>
          <h2 className="text-[11px] uppercase tracking-wider text-cyan-200/80">You will learn</h2>
          <ul className="mt-1 space-y-1 text-white/80">
            {intro.learn.map((l) => (
              <li key={l} className="flex gap-2">
                <span className="text-lime-300">✓</span>
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-[11px] uppercase tracking-wider text-cyan-200/80">Where you will see it</h2>
          <p className="mt-1 text-white/80">{intro.realLife}</p>
        </div>
      </div>
    </details>
  );
}

function Step({
  n,
  title,
  done,
  open,
  badge,
  lockedHint,
  children,
}: {
  n: number;
  title: string;
  done: boolean;
  open: boolean;
  badge?: string;
  /** Shown on a locked step so it is clear what opens it. */
  lockedHint?: string;
  children: ReactNode;
}) {
  return (
    <li className={`glass rounded-2xl p-4 transition ${open ? "" : "opacity-40"}`}>
      <div className="flex items-center gap-3">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            done ? "bg-lime-300 text-black" : open ? "bg-white text-black" : "bg-white/10 text-white/60"
          }`}
        >
          {done ? "✓" : n}
        </span>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {open && badge && <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[11px] uppercase tracking-wider text-white/60">{badge}</span>}
        {!open && <span className="ml-auto text-xs text-white/40">🔒</span>}
      </div>
      {open && <div className="mt-3">{children}</div>}
      {!open && lockedHint && <p className="mt-2 text-xs text-white/60">{lockedHint}</p>}
    </li>
  );
}
