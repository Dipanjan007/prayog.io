"use client";

import Link from "next/link";
import { useCallback, useRef, useState, type ReactNode } from "react";
import WindTunnel, { type TunnelReading } from "@/components/sim/WindTunnel";
import Quiz from "@/components/Quiz";
import { ToastStack, useToasts } from "@/components/Toasts";
import { lesson, LESSON_ID, XP } from "@/content/lessons/pressure-winds";
import { BADGES, awardBadge, completeStep, improveBest, progressStore, useProgress } from "@/lib/progress";

type ShapeTest = "circle" | "square" | "teardrop";
const SHAPE_NAMES: Record<ShapeTest, string> = { circle: "Ball", square: "Box", teardrop: "Raindrop" };

const STEP_ORDER = ["hook", "predict", ...lesson.tasks.map((t) => t.id), "ideas", "challenge", "quiz"];

export default function LessonPlayer() {
  const progress = useProgress();
  const done = new Set(progress.lessons[LESSON_ID]?.done ?? []);
  const { toasts, push } = useToasts();

  const [prediction, setPrediction] = useState<number | null>(null);
  const [drags, setDrags] = useState<Partial<Record<ShapeTest, number>>>({});
  const [shapeAnswerWrong, setShapeAnswerWrong] = useState(false);
  const [ratio, setRatio] = useState<number | null>(null);

  const reward = useCallback(
    (stepId: string, xp: number, label: string, patch = {}) => {
      const gained = completeStep(LESSON_ID, stepId, xp, patch);
      if (gained) push(`+${gained} XP · ${label}`);
      return gained > 0;
    },
    [push],
  );

  const badge = useCallback(
    (id: string) => {
      if (awardBadge(id)) {
        const b = BADGES.find((x) => x.id === id);
        if (b) push(`${b.emoji} Badge unlocked: ${b.name}`, true);
      }
    },
    [push],
  );

  const checkAllDone = useCallback(() => {
    const lp = progressStore.get().lessons[LESSON_ID];
    if (lp && STEP_ORDER.every((s) => lp.done.includes(s))) badge("wind-whisperer");
  }, [badge]);

  // Called by the wind tunnel a few times a second.
  const latest = useRef<TunnelReading | null>(null);
  const onReading = useCallback(
    (r: TunnelReading) => {
      latest.current = r;
      const doneNow = new Set(progressStore.get().lessons[LESSON_ID]?.done ?? []);
      if (r.painted) badge("shape-shifter");
      if (!doneNow.has("predict")) return;

      const finishTask = (id: string, title: string) => {
        if (reward(id, XP.task, title)) {
          badge("first-gust");
          checkAllDone();
        }
      };

      if (!r.settled) return;

      if (!doneNow.has("task:push") && r.shape === "square" && r.speedKmh >= 60 && r.view === "pressure") {
        finishTask("task:push", "Found the push");
      }
      if (!doneNow.has("task:roof") && r.shape === "house" && r.speedKmh >= 120 && r.lift > 5) {
        finishTask("task:roof", "Lifted the roof");
        badge("storm-chaser");
      }
      if (!doneNow.has("task:shapes") && r.speedKmh >= 90 && (r.shape === "circle" || r.shape === "square" || r.shape === "teardrop")) {
        const s = r.shape;
        setDrags((d) => (d[s] === r.drag ? d : { ...d, [s]: r.drag }));
      }
      if (doneNow.has("ideas") && r.shape === "wing" && r.speedKmh >= 90 && r.drag > 0) {
        const value = r.lift / r.drag;
        setRatio(value);
        const stars = lesson.challenge.stars.filter((t) => value >= t).length;
        if (stars > 0) {
          reward("challenge", XP.challenge, "Wing challenge");
          const gained = improveBest(LESSON_ID, "challengeStars", stars, XP.perStar);
          if (gained) push(`+${gained} XP · ${"⭐".repeat(stars)}`);
          if (stars === 3) badge("first-flight");
          checkAllDone();
        }
      }
    },
    [badge, reward, push, checkAllDone],
  );

  const tested = (Object.keys(SHAPE_NAMES) as ShapeTest[]).filter((s) => drags[s] !== undefined);
  const lowest = tested.length === 3 ? tested.reduce((a, b) => (drags[a]! <= drags[b]! ? a : b)) : null;

  const currentIndex = STEP_ORDER.findIndex((s) => !done.has(s));
  const percent = Math.round((STEP_ORDER.filter((s) => done.has(s)).length / STEP_ORDER.length) * 100);
  const lp = progress.lessons[LESSON_ID];
  const isOpen = (id: string) => {
    const i = STEP_ORDER.indexOf(id);
    // Tasks open together once the prediction is in.
    if (id.startsWith("task:")) return done.has("predict");
    return currentIndex === -1 || i <= currentIndex;
  };
  const tasksDone = lesson.tasks.every((t) => done.has(t.id));
  const nextTask = lesson.tasks.find((t) => !done.has(t.id));
  const mission = !done.has("hook")
    ? { title: "Start here", text: "Read the roof puzzle below." }
    : !done.has("predict")
      ? { title: "Predict first", text: "Lock in your guess below, then test it here." }
      : nextTask
        ? { title: nextTask.title, text: nextTask.text }
        : !done.has("ideas")
          ? { title: "Missions complete", text: "See what you discovered below." }
          : !done.has("challenge")
            ? { title: lesson.challenge.title, text: lesson.challenge.text }
            : !done.has("quiz")
              ? { title: "Master it", text: "Take the quiz below. Keep playing with the wing to earn more stars." }
              : { title: "Lesson complete", text: "Free play: try drawing your own shape." };

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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="mb-3 flex items-start gap-3 rounded-2xl border border-cyan-300/30 bg-cyan-300/[0.07] px-4 py-3" aria-live="polite">
            <span className="mt-0.5 text-lg">🎯</span>
            <div>
              <div className="text-sm font-semibold text-cyan-100">{mission.title}</div>
              <div className="text-sm text-white/70">{mission.text}</div>
            </div>
          </div>
          <WindTunnel initialShape="square" initialSpeed={40} onReading={onReading} />
          <p className="mt-2 text-xs text-white/40">
            A simplified air model for learning. Speeds are scaled so the patterns match real air, not exact engineering numbers.
          </p>
        </div>

        <ol className="flex flex-col gap-3">
          <Step n={1} title={lesson.hook.title} done={done.has("hook")} open={isOpen("hook")}>
            <p className="text-white/75">{lesson.hook.text}</p>
            {!done.has("hook") && (
              <button className="btn-primary mt-4" onClick={() => reward("hook", XP.hook, "Curious mind")}>
                Let&apos;s find out
              </button>
            )}
          </Step>

          <Step n={2} title="Predict first" done={done.has("predict")} open={isOpen("predict")}>
            <p className="font-medium">{lesson.predict.question}</p>
            <div className="mt-3 grid gap-2">
              {lesson.predict.options.map((o, i) => {
                const chosen = (prediction ?? (done.has("predict") ? predictionFrom(lp?.predictionCorrect) : null)) === i;
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
                onClick={() =>
                  reward("predict", XP.predict, "Made a prediction", { predictionCorrect: prediction === lesson.predict.answer })
                }
              >
                Lock it in
              </button>
            ) : (
              <p className="mt-3 text-sm text-white/50">Locked in. Now test it in the wind tunnel.</p>
            )}
          </Step>

          {lesson.tasks.map((t, i) => (
            <Step key={t.id} n={3 + i} title={t.title} done={done.has(t.id)} open={isOpen(t.id)} badge="Mission">
              <p className="text-white/75">{done.has(t.id) ? t.found : t.text}</p>
              {t.id === "task:shapes" && !done.has(t.id) && (
                <div className="mt-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {(Object.keys(SHAPE_NAMES) as ShapeTest[]).map((s) => (
                      <div key={s} className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
                        <div className="text-xs text-white/50">{SHAPE_NAMES[s]}</div>
                        <div className="font-display text-lg text-orange-300">{drags[s] ?? "–"}</div>
                      </div>
                    ))}
                  </div>
                  {lowest && (
                    <div className="animate-pop mt-3">
                      <p className="text-sm">Which shape had the least drag?</p>
                      <div className="mt-2 flex gap-2">
                        {(Object.keys(SHAPE_NAMES) as ShapeTest[]).map((s) => (
                          <button
                            key={s}
                            className="btn-ghost !px-3 !py-1.5 text-sm"
                            onClick={() => {
                              if (s === lowest) {
                                setShapeAnswerWrong(false);
                                if (reward("task:shapes", XP.task, "Beat the drag")) {
                                  badge("first-gust");
                                  checkAllDone();
                                }
                              } else setShapeAnswerWrong(true);
                            }}
                          >
                            {SHAPE_NAMES[s]}
                          </button>
                        ))}
                      </div>
                      {shapeAnswerWrong && <p className="mt-2 text-sm text-rose-300">Look at the drag numbers again.</p>}
                    </div>
                  )}
                </div>
              )}
            </Step>
          ))}

          <Step n={6} title="What you discovered" done={done.has("ideas")} open={tasksDone && isOpen("ideas")}>
            {lp?.predictionCorrect !== undefined && (
              <p className={`mb-3 rounded-xl px-3 py-2 text-sm ${lp.predictionCorrect ? "bg-lime-300/10 text-lime-200" : "bg-amber-300/10 text-amber-100"}`}>
                {lp.predictionCorrect
                  ? `Your prediction was right: ${lesson.predict.options[lesson.predict.answer].toLowerCase()}.`
                  : `Surprise! The answer is: ${lesson.predict.options[lesson.predict.answer].toLowerCase()}. Scientists change their minds when experiments show them something new.`}
              </p>
            )}
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
                  if (reward("ideas", XP.ideas, "Big ideas")) {
                    const gained = lp?.predictionCorrect ? completeStep(LESSON_ID, "predict-bonus", XP.predictCorrect) : 0;
                    if (gained) push(`+${gained} XP · Great prediction`);
                  }
                }}
              >
                Got it
              </button>
            )}
          </Step>

          <Step n={7} title={lesson.challenge.title} done={done.has("challenge")} open={done.has("ideas")} badge="Challenge">
            <p className="text-white/75">{lesson.challenge.text}</p>
            <div className="mt-3 flex items-center gap-4">
              <div className="text-3xl tracking-widest">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={i < (lp?.challengeStars ?? 0) ? "" : "opacity-20 grayscale"}>
                    ⭐
                  </span>
                ))}
              </div>
              <div className="text-sm text-white/60">
                Lift ÷ drag now: <span className="font-display text-lg text-white">{ratio === null ? "–" : ratio.toFixed(2)}</span>
                <div className="text-xs text-white/40">Stars at {lesson.challenge.stars.join(" · ")}</div>
              </div>
            </div>
          </Step>

          <Step n={8} title="Master it" done={done.has("quiz")} open={done.has("ideas")} badge="Quiz">
            <Quiz
              questions={lesson.quiz}
              onFinish={(score) => {
                reward("quiz", 0, "Quiz done");
                const gained = improveBest(LESSON_ID, "quizBest", score, XP.perQuizPoint);
                if (gained) push(`+${gained} XP · Quiz best ${score}/${lesson.quiz.length}`);
                if (score === lesson.quiz.length) badge("sharp-mind");
                checkAllDone();
              }}
            />
            <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-violet-300/30 px-3 py-2 text-sm">
              <span className="text-white/60">Olympiad-level problems (NSO, NSEJS style)</span>
              <span className="rounded-full bg-violet-300/15 px-2 py-0.5 text-xs text-violet-200">Pro · coming soon</span>
            </div>
          </Step>
        </ol>
      </div>
      <ToastStack toasts={toasts} />
    </>
  );
}

/** After a reload we only know whether the prediction was right. */
function predictionFrom(correct: boolean | undefined) {
  return correct ? lesson.predict.answer : null;
}

function Step({
  n,
  title,
  done,
  open,
  badge,
  children,
}: {
  n: number;
  title: string;
  done: boolean;
  open: boolean;
  badge?: string;
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
    </li>
  );
}
