"use client";

import { useCallback } from "react";
import { useToasts } from "@/components/Toasts";
import { stepOrder, XP, type LessonDef } from "@/content/lessons/types";
import { BADGES, awardBadge, completeStep, improveBest, progressStore, useProgress, type LessonProgress } from "./progress";

/** Shared lesson actions: XP, badges, toasts and the "is this step done" checks. */
export function useLesson(lesson: LessonDef) {
  const progress = useProgress();
  const lp = progress.lessons[lesson.id];
  const done = new Set(lp?.done ?? []);
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
      const gained = completeStep(lesson.id, stepId, xp, patch);
      if (gained) push(`+${gained} XP · ${label}`);
      checkAllDone();
      return gained > 0;
    },
    [push, lesson.id, checkAllDone],
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
  const isDone = useCallback((id: string) => progressStore.get().lessons[lesson.id]?.done.includes(id) ?? false, [lesson.id]);

  return { lp, done, toasts, push, reward, badge, finishTask, challengeStars, isDone, checkAllDone };
}

export type LessonApi = ReturnType<typeof useLesson>;
