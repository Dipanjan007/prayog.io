import type { LessonProgress, Progress } from "./progress";
import { XP } from "../content/lessons/types";

/** XP for one completed step. Lesson tasks have their own ids and all earn XP.task. */
const STEP_XP: Record<string, number> = {
  hook: XP.hook,
  predict: XP.predict,
  "predict-bonus": XP.predictCorrect,
  ideas: XP.ideas,
  challenge: XP.challenge,
  quiz: 0,
};

/**
 * XP is fully determined by lesson progress, so it is recomputed after a merge
 * rather than added up: the same step done on two devices counts once.
 */
export function xpFor(lessons: Progress["lessons"]) {
  let xp = 0;
  for (const lp of Object.values(lessons)) {
    for (const step of new Set(lp.done)) xp += STEP_XP[step] ?? XP.task;
    xp += (lp.challengeStars ?? 0) * XP.perStar;
    xp += (lp.quizBest ?? 0) * XP.perQuizPoint;
  }
  return xp;
}

function maxDefined(a?: number, b?: number) {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return Math.max(a, b);
}

function mergeLesson(a: LessonProgress | undefined, b: LessonProgress | undefined): LessonProgress {
  if (!a) return b!;
  if (!b) return a;
  const merged: LessonProgress = { done: [...new Set([...a.done, ...b.done])] };
  const prediction = a.predictionCorrect ?? b.predictionCorrect;
  if (prediction !== undefined) merged.predictionCorrect = prediction;
  const stars = maxDefined(a.challengeStars, b.challengeStars);
  if (stars !== undefined) merged.challengeStars = stars;
  const quiz = maxDefined(a.quizBest, b.quizBest);
  if (quiz !== undefined) merged.quizBest = quiz;
  return merged;
}

function mergeStreak(a: Progress["streak"], b: Progress["streak"]): Progress["streak"] {
  if (!a.lastDay) return b;
  if (!b.lastDay) return a;
  if (a.lastDay !== b.lastDay) return a.lastDay > b.lastDay ? a : b;
  return a.count >= b.count ? a : b;
}

/** Combine progress from two devices without losing anything either has. */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const lessons: Progress["lessons"] = {};
  for (const id of new Set([...Object.keys(a.lessons), ...Object.keys(b.lessons)])) {
    lessons[id] = mergeLesson(a.lessons[id], b.lessons[id]);
  }
  return {
    xp: xpFor(lessons),
    badges: [...new Set([...a.badges, ...b.badges])],
    lessons,
    streak: mergeStreak(a.streak, b.streak),
  };
}

export const EMPTY_PROGRESS: Progress = {
  xp: 0,
  badges: [],
  lessons: {},
  streak: { count: 0, lastDay: null, freezes: 1 },
};

/**
 * Check untrusted progress from a client. Returns a clean copy or null.
 * Limits keep one child's row small.
 */
export function parseProgress(input: unknown): Progress | null {
  if (!input || typeof input !== "object") return null;
  const p = input as Record<string, unknown>;
  const isId = (s: unknown): s is string => typeof s === "string" && /^[a-z0-9:_-]{1,40}$/i.test(s);
  const smallInt = (n: unknown, max: number) => (typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= max ? n : undefined);

  if (!Array.isArray(p.badges) || !p.badges.every(isId) || p.badges.length > 200) return null;
  if (!p.lessons || typeof p.lessons !== "object") return null;
  const entries = Object.entries(p.lessons as Record<string, unknown>);
  if (entries.length > 300) return null;

  const lessons: Progress["lessons"] = {};
  for (const [id, raw] of entries) {
    if (!isId(id) || !raw || typeof raw !== "object") return null;
    const l = raw as Record<string, unknown>;
    if (!Array.isArray(l.done) || !l.done.every(isId) || l.done.length > 50) return null;
    const lp: LessonProgress = { done: [...new Set(l.done as string[])] };
    if (typeof l.predictionCorrect === "boolean") lp.predictionCorrect = l.predictionCorrect;
    const stars = smallInt(l.challengeStars, 3);
    if (stars !== undefined) lp.challengeStars = stars;
    const quiz = smallInt(l.quizBest, 50);
    if (quiz !== undefined) lp.quizBest = quiz;
    lessons[id] = lp;
  }

  const s = (p.streak ?? {}) as Record<string, unknown>;
  const lastDay = typeof s.lastDay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.lastDay) ? s.lastDay : null;
  const streak = { count: smallInt(s.count, 10_000) ?? 0, lastDay, freezes: smallInt(s.freezes, 5) ?? 0 };

  return { xp: xpFor(lessons), badges: [...new Set(p.badges as string[])], lessons, streak };
}

/** JSON with sorted keys, so two copies compare equal whatever their key order. */
export function canonical(value: unknown): string {
  return JSON.stringify(value, (_k, v) =>
    v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v,
  );
}
