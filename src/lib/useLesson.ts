"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToasts } from "@/components/Toasts";
import { stepOrder, XP, type LessonDef } from "@/content/lessons/types";
import { BADGES, awardBadge, completeStep, improveBest, progressStore, useProgress, type LessonProgress } from "./progress";

const REPLAY_KEY = "prayog.replay";

/**
 * Ask the lesson to start again from step one after a reload. Saved progress,
 * XP and badges stay; steps done before give no XP a second time.
 */
export function restartLesson(lessonId: string) {
  try {
    sessionStorage.setItem(REPLAY_KEY, lessonId);
  } catch {}
  window.location.reload();
}

/** Shared lesson actions: XP, badges, toasts and the "is this step done" checks. */
export function useLesson(lesson: LessonDef) {
  const progress = useProgress();
  const stored = progress.lessons[lesson.id];
  // Replay mode: the student chose to start over, so steps are tracked fresh for this visit.
  // Read after mount so the server and first client render match.
  const [replay, setReplay] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem(REPLAY_KEY) !== lesson.id) return;
      sessionStorage.removeItem(REPLAY_KEY);
    } catch {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a per-tab flag
    setReplay(true);
  }, [lesson.id]);
  const [replayLp, setReplayLp] = useState<LessonProgress>({ done: [] });
  const replayRef = useRef<LessonProgress>({ done: [] });
  const lp: LessonProgress | undefined = replay ? replayLp : stored;
  const done = new Set(lp?.done ?? []);
  const markReplay = useCallback(
    (stepId: string, patch: Partial<LessonProgress>) => {
      if (!replay || replayRef.current.done.includes(stepId)) return;
      replayRef.current = { ...replayRef.current, ...patch, done: [...replayRef.current.done, stepId] };
      setReplayLp(replayRef.current);
    },
    [replay],
  );
  const { toasts, push } = useToasts();

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
    const now = progressStore.get().lessons[lesson.id];
    if (now && stepOrder(lesson).every((s) => now.done.includes(s))) badge(lesson.completionBadge);
  }, [badge, lesson]);

  const reward = useCallback(
    (stepId: string, xp: number, label: string, patch: Partial<LessonProgress> = {}) => {
      const firstThisVisit = replay && !replayRef.current.done.includes(stepId);
      markReplay(stepId, patch);
      const gained = completeStep(lesson.id, stepId, xp, patch);
      if (gained) push(`+${gained} XP · ${label}`);
      else if (firstThisVisit) push(`✓ ${label}`);
      checkAllDone();
      return gained > 0 || firstThisVisit;
    },
    [push, lesson.id, checkAllDone, replay, markReplay],
  );

  /** Complete a mission (once) and award the "first mission" badge. */
  const finishTask = useCallback(
    (id: string) => {
      const task = lesson.tasks.find((t) => t.id === id);
      if (reward(id, XP.task, task?.title ?? "Mission")) badge("first-gust");
    },
    [lesson.tasks, reward, badge],
  );

  /** Record challenge stars; awards the challenge step on the first star. */
  const challengeStars = useCallback(
    (stars: number) => {
      if (stars <= 0) return;
      reward("challenge", XP.challenge, lesson.challenge.title);
      const gained = improveBest(lesson.id, "challengeStars", stars, XP.perStar);
      if (gained) push(`+${gained} XP · ${"⭐".repeat(stars)}`);
      checkAllDone();
    },
    [reward, push, lesson, checkAllDone],
  );

  /** Fresh read of done steps, for use inside simulation callbacks. */
  const isDone = useCallback(
    (id: string) => (replay ? replayRef.current.done.includes(id) : (progressStore.get().lessons[lesson.id]?.done.includes(id) ?? false)),
    [lesson.id, replay],
  );

  /** True when this student has done any step of the lesson before. */
  const hasProgress = (stored?.done.length ?? 0) > 0;

  return { lp, done, toasts, push, reward, badge, finishTask, challengeStars, isDone, checkAllDone, replay, hasProgress };
}

export type LessonApi = ReturnType<typeof useLesson>;
