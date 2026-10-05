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
  const tasksDone = lesson.tasks.every((t) => done.has(t.id));
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
        <Link href="/learn" className="-ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-sm text-faint hover:text-cream">
          <span aria-hidden>←</span> Class {lesson.classNum} · {lesson.book} · {lesson.chapter}
        </Link>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <h1 className="font-display text-[2rem] leading-tight sm:text-[2.6rem]">{lesson.title}</h1>
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-xs text-faint">
              <span>Lesson progress</span>
              <span className="tabular-nums">{percent}%</span>
            </div>
            <div
              className="mt-2 h-1 overflow-hidden rounded-full bg-cream/10"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Lesson progress"
            >
              <div className="h-full rounded-full bg-saffron-400 transition-[width] duration-500" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>
      </div>

      <LabIntro lesson={lesson} startOpen={!done.has("hook")} key={done.has("hook") ? "seen" : "new"} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="mb-4 border-l-2 border-saffron-400 py-0.5 pl-4" aria-live="polite">
            <div className="eyebrow text-saffron-300">Your mission</div>
            <div className="font-display mt-0.5 text-lg leading-snug">{mission.title}</div>
            <div className="text-[0.95rem] text-muted">{mission.text}</div>
          </div>
          {sim}
          {simNote && <p className="mt-3 text-xs leading-relaxed text-faint">{simNote}</p>}
        </div>

        <ol className="flex flex-col gap-3">
          <Step n={++n} title={lesson.hook.title} done={done.has("hook")} open={isOpen("hook")}>
            <p className="text-cream/85">{lesson.hook.text}</p>
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
                    className={`rounded-xl border px-4 py-3 text-left text-[0.95rem] transition-colors ${
                      chosen ? "chip-on" : "border-line hover:border-line-strong hover:bg-cream/[0.03]"
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
              <p className="mt-3 text-sm text-faint">Locked in. Now test it in the simulation.</p>
            )}
          </Step>

          {lesson.tasks.map((t) => (
            <Step key={t.id} n={++n} title={t.title} done={done.has(t.id)} open={isOpen(t.id)} badge="Mission">
              <p className="text-cream/85">{done.has(t.id) ? t.found : t.text}</p>
              {!done.has(t.id) && taskExtras?.[t.id]}
            </Step>
          ))}

          <Step n={++n} title="What you discovered" done={done.has("ideas")} open={tasksDone && isOpen("ideas")}>
            {predictedRight !== undefined && (
              <p className={`mb-3 rounded-xl px-3 py-2 text-sm ${predictedRight ? "bg-sage-300/10 text-sage-200" : "bg-ochre-300/10 text-ochre-100"}`}>
                {predictedRight
                  ? `Your prediction was right: ${lesson.predict.options[lesson.predict.answer].toLowerCase()}.`
                  : `Surprise! The answer is: ${lesson.predict.options[lesson.predict.answer].toLowerCase()}. Scientists change their minds when experiments show them something new.`}
              </p>
            )}
            <div className="grid gap-2">
              {lesson.ideas.map((idea) => (
                <div key={idea.title} className="rounded-xl panel p-3">
                  <div className="font-semibold">{idea.title}</div>
                  <p className="mt-1 text-sm text-muted">{idea.text}</p>
                  {idea.formula && <div className="mt-2 rounded-lg border border-line bg-well px-3 py-2 font-mono text-sm text-saffron-200">{idea.formula}</div>}
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

          <Step n={++n} title={lesson.challenge.title} done={done.has("challenge")} open={done.has("ideas")} badge="Challenge">
            <p className="text-cream/85">{lesson.challenge.text}</p>
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

          <Step n={++n} title="Master it" done={done.has("quiz")} open={done.has("ideas")} badge="Quiz">
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
            <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-dashed border-heather-300/30 px-3 py-2 text-sm">
              <span className="text-muted">Olympiad-level problems (NSO, NSEJS style)</span>
              <span className="shrink-0 rounded-full bg-heather-300/15 px-2 py-0.5 text-xs text-heather-200">Pro · coming soon</span>
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
    <details open={startOpen} className="group mb-8 border-y border-line">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg py-2 [&::-webkit-details-marker]:hidden">
        <span className="font-display text-lg">About this lab</span>
        <span className="ml-auto text-sm text-faint">
          About {intro.minutes} min <span className="ml-1 inline-block transition-transform group-open:rotate-180" aria-hidden>▾</span>
        </span>
      </summary>
      <div className="grid gap-5 pb-5 pt-2 text-[0.95rem] leading-relaxed sm:grid-cols-3 sm:gap-8">
        <div>
          <h2 className="eyebrow">Objective</h2>
          <p className="mt-1 text-cream/85">{intro.objective}</p>
          <p className="mt-2 text-xs text-faint">
            NCERT Class {lesson.classNum} {lesson.book}: {lesson.chapter}
          </p>
        </div>
        <div>
          <h2 className="eyebrow">You will learn</h2>
          <ul className="mt-1 space-y-1 text-cream/85">
            {intro.learn.map((l) => (
              <li key={l} className="flex gap-2">
                <span className="text-sage-300">✓</span>
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="eyebrow">Where you will see it</h2>
          <p className="mt-1 text-cream/85">{intro.realLife}</p>
        </div>
      </div>
    </details>
  );
}

function Step({ n, title, done, open, badge, children }: { n: number; title: string; done: boolean; open: boolean; badge?: string; children: ReactNode }) {
  return (
    <li className={`rounded-2xl transition-colors ${open ? "glass p-5" : "border border-dashed border-line px-5 py-3 opacity-60"}`}>
      <div className="flex items-center gap-3">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums ${
            done ? "bg-sage-300 text-ink" : open ? "border border-saffron-300 text-saffron-200" : "border border-line text-faint"
          }`}
        >
          {done ? "✓" : n}
        </span>
        <h2 className={`font-display ${open ? "text-xl" : "text-base text-muted"}`}>{title}</h2>
        {open && badge && <span className="eyebrow ml-auto">{badge}</span>}
        {!open && (
          <svg viewBox="0 0 16 16" className="ml-auto h-4 w-4 text-faint" fill="none" stroke="currentColor" strokeWidth="1.4" aria-label="Locked">
            <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
            <path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7" strokeLinecap="round" />
          </svg>
        )}
      </div>
      {open && <div className="mt-3 leading-relaxed">{children}</div>}
    </li>
  );
}
