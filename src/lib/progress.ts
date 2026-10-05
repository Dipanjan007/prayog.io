"use client";

import { createLocalStore } from "./store";

export interface LessonProgress {
  /** Step ids completed, e.g. "hook", "predict", "task:roof". */
  done: string[];
  predictionCorrect?: boolean;
  challengeStars?: number;
  quizBest?: number;
}

export interface Progress {
  xp: number;
  badges: string[];
  lessons: Record<string, LessonProgress>;
  streak: { count: number; lastDay: string | null; freezes: number };
}

const initial: Progress = {
  xp: 0,
  badges: [],
  lessons: {},
  streak: { count: 0, lastDay: null, freezes: 1 },
};

export const progressStore = createLocalStore<Progress>("prayog.progress.v1", initial);
export const useProgress = progressStore.use;

export interface BadgeInfo {
  id: string;
  name: string;
  how: string;
  emoji: string;
}

export const BADGES: BadgeInfo[] = [
  { id: "first-gust", name: "First Gust", how: "Finish your first wind tunnel task", emoji: "💨" },
  { id: "storm-chaser", name: "Storm Chaser", how: "Lift a roof in a cyclone-speed wind", emoji: "🌀" },
  { id: "shape-shifter", name: "Shape Shifter", how: "Draw your own shape in the wind tunnel", emoji: "✏️" },
  { id: "downforce", name: "Downforce", how: "Push a sports car onto the road with its rear wing", emoji: "🏎️" },
  { id: "wind-whisperer", name: "Wind Whisperer", how: "Finish every step of the pressure lesson", emoji: "🌬️" },
  { id: "first-flight", name: "First Flight", how: "Get 3 stars in the wing challenge", emoji: "🛩️" },
  { id: "speed-demon", name: "Speed Demon", how: "Finish every step of the motion lesson", emoji: "🏁" },
  { id: "perfect-stop", name: "Perfect Stop", how: "Get 3 stars in the stopping challenge", emoji: "🛑" },
  { id: "bright-spark", name: "Bright Spark", how: "Finish every step of the circuits lesson", emoji: "💡" },
  { id: "torch-fixer", name: "Torch Fixer", how: "Repair the torch in 3 moves", emoji: "🔦" },
  { id: "mirror-maze", name: "Mirror Maze", how: "Finish every step of the Class 8 mirrors lesson", emoji: "🪞" },
  { id: "image-matcher", name: "Image Matcher", how: "Make all three images in Image match", emoji: "🖼️" },
  { id: "lens-crafter", name: "Lens Crafter", how: "Finish every step of the Class 10 light lesson", emoji: "🔍" },
  { id: "sharp-focus", name: "Sharp Focus", how: "Focus all three projector screens", emoji: "📽️" },
  { id: "eye-doctor", name: "Eye Doctor", how: "Finish every step of the human eye lesson", emoji: "👓" },
  { id: "clear-vision", name: "Clear Vision", how: "Help all three patients in the eye clinic", emoji: "🌈" },
  { id: "ohm-master", name: "Ohm Master", how: "Finish every step of the electricity lesson", emoji: "⚡" },
  { id: "on-target", name: "On Target", how: "Hit all three target currents in the electricity challenge", emoji: "🔋" },
  { id: "field-finder", name: "Field Finder", how: "Finish every step of the magnetism lesson", emoji: "🧭" },
  { id: "left-hand-hero", name: "Left-Hand Hero", how: "Predict the rod's swing in all three rounds", emoji: "🫲" },
  { id: "magnet-maker", name: "Magnet Maker", how: "Finish every step of the magnetic and heating effects lesson", emoji: "🧲" },
  { id: "crane-master", name: "Crane Master", how: "Fill all three scrap trucks with exactly the right load", emoji: "🏗️" },
  { id: "force-finder", name: "Force Finder", how: "Finish every step of the forces lesson", emoji: "💪" },
  { id: "crate-master", name: "Crate Master", how: "Slide the crate into the target on wood, sand and ice", emoji: "📦" },
  { id: "newtons-apprentice", name: "Newton's Apprentice", how: "Finish every step of the forces and motion lesson", emoji: "🍎" },
  { id: "perfect-knock", name: "Perfect Knock", how: "Knock all three target carts to their exact speeds", emoji: "🎱" },
  { id: "energy-engineer", name: "Energy Engineer", how: "Finish every step of the work and energy lesson", emoji: "🎡" },
  { id: "just-clear", name: "Just Clear", how: "Get the coaster over the last hill slower than 2 m/s", emoji: "🎢" },
  { id: "sound-explorer", name: "Sound Explorer", how: "Finish every step of the sound lesson", emoji: "🔊" },
  { id: "sonar-captain", name: "SONAR Captain", how: "Find the sea depth at all three spots with SONAR", emoji: "🚢" },
  { id: "sky-keeper", name: "Sky Keeper", how: "Finish every step of the Class 8 sky clock lesson", emoji: "🌓" },
  { id: "moon-watcher", name: "Moon Watcher", how: "Match all three Moons in Moon match", emoji: "🌙" },
  { id: "sharp-mind", name: "Sharp Mind", how: "Score full marks in a Master quiz", emoji: "🎯" },
];

/** XP needed to reach each level: 0, 100, 300, 600, 1000, ... */
export function levelFor(xp: number) {
  let level = 1;
  while (xp >= (100 * level * (level + 1)) / 2) level++;
  const start = (100 * (level - 1) * level) / 2;
  const next = (100 * level * (level + 1)) / 2;
  return { level, start, next, fraction: (xp - start) / (next - start) };
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/** Count today towards the streak. A missed day uses a freeze if there is one. */
function touchStreak(s: Progress["streak"]): Progress["streak"] {
  const t = today();
  if (s.lastDay === t) return s;
  if (!s.lastDay) return { ...s, count: 1, lastDay: t };
  const gap = daysBetween(s.lastDay, t);
  if (gap === 1) return { ...s, count: s.count + 1, lastDay: t };
  if (gap === 2 && s.freezes > 0) return { count: s.count + 1, lastDay: t, freezes: s.freezes - 1 };
  return { ...s, count: 1, lastDay: t };
}

/**
 * Mark a lesson step done and award XP once. Returns the XP gained (0 if the
 * step was already done).
 */
export function completeStep(lessonId: string, stepId: string, xp: number, patch: Partial<LessonProgress> = {}) {
  let gained = 0;
  progressStore.update((p) => {
    const lesson = p.lessons[lessonId] ?? { done: [] };
    const already = lesson.done.includes(stepId);
    gained = already ? 0 : xp;
    return {
      ...p,
      xp: p.xp + gained,
      streak: touchStreak(p.streak),
      lessons: {
        ...p.lessons,
        [lessonId]: { ...lesson, ...patch, done: already ? lesson.done : [...lesson.done, stepId] },
      },
    };
  });
  return gained;
}

/** Award XP for improving a best score, e.g. more challenge stars. */
export function improveBest(lessonId: string, field: "challengeStars" | "quizBest", value: number, xpPerPoint: number) {
  let gained = 0;
  progressStore.update((p) => {
    const lesson = p.lessons[lessonId] ?? { done: [] };
    const prev = lesson[field] ?? 0;
    if (value <= prev) return p;
    gained = (value - prev) * xpPerPoint;
    return {
      ...p,
      xp: p.xp + gained,
      streak: touchStreak(p.streak),
      lessons: { ...p.lessons, [lessonId]: { ...lesson, [field]: value } },
    };
  });
  return gained;
}

/** Returns true if the badge is new. */
export function awardBadge(id: string) {
  let isNew = false;
  progressStore.update((p) => {
    if (p.badges.includes(id)) return p;
    isNew = true;
    return { ...p, badges: [...p.badges, id] };
  });
  return isNew;
}
