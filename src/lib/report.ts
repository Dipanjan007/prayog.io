/**
 * The weekly parent report: what a child did this week, compared with where
 * they were on Monday, and where they could use a hand. Pure, so the page,
 * the email and the tests all build it the same way.
 */
import { LESSON_HREF, LESSONS } from "../content/lessons";
import { stepOrder, type LessonDef } from "../content/lessons/types";
import type { LessonProgress, Progress } from "./progress";

export interface LessonRef {
  id: string;
  title: string;
  /** The NCERT chapter, which parents know better than the lab's name. */
  chapter: string;
  href: string;
}

export interface ChildReport {
  xpWeek: number;
  xpTotal: number;
  streak: number;
  /** Lessons finished this week. */
  finished: LessonRef[];
  /** Lessons worked on this week but not finished, with how far along. */
  working: (LessonRef & { percent: number })[];
  /** Where a hand would help: a low quiz score, or a lesson left half done. */
  stuck: (LessonRef & { why: string })[];
  /** Questions to ask at dinner: predictions the child got wrong at first this week. */
  talk: { title: string; question: string }[];
  /** A good next lesson in the child's class. */
  next: LessonRef | null;
}

/** Below this share of quiz answers right, the report suggests another look. */
const QUIZ_PASS = 0.6;

const ref = (l: LessonDef): LessonRef => ({ id: l.id, title: l.title, chapter: l.chapter, href: LESSON_HREF[l.id] ?? "/learn" });
const isDone = (l: LessonDef, lp?: LessonProgress) => !!lp && stepOrder(l).every((s) => lp.done.includes(s));
const percent = (l: LessonDef, lp?: LessonProgress) => {
  const steps = stepOrder(l);
  return lp ? Math.round((100 * steps.filter((s) => lp.done.includes(s)).length) / steps.length) : 0;
};

export function buildReport(now: Progress, monday: Progress, classNum: number, lessons: LessonDef[] = LESSONS): ChildReport {
  const finished: LessonRef[] = [];
  const working: ChildReport["working"] = [];
  const stuck: ChildReport["stuck"] = [];
  const talk: ChildReport["talk"] = [];

  for (const l of lessons) {
    const lp = now.lessons[l.id];
    if (!lp) continue;
    const before = monday.lessons[l.id];
    const newSteps = lp.done.filter((s) => !before?.done.includes(s));
    const done = isDone(l, lp);
    if (done && !isDone(l, before)) finished.push(ref(l));
    else if (!done && newSteps.length) working.push({ ...ref(l), percent: percent(l, lp) });

    if (lp.quizBest !== undefined && lp.quizBest < Math.ceil(l.quiz.length * QUIZ_PASS))
      stuck.push({ ...ref(l), why: `${lp.quizBest} of ${l.quiz.length} right in the quiz` });
    else if (!done && !newSteps.length && lp.done.length)
      stuck.push({ ...ref(l), why: `left at ${percent(l, lp)}%` });

    if (newSteps.includes("predict") && lp.predictionCorrect === false) talk.push({ title: l.title, question: l.predict.question });
  }

  // Next: the first lesson in their class they haven't started, then the class above.
  const ncert = lessons.filter((l) => !l.id.startsWith("x-"));
  const next =
    ncert.find((l) => l.classNum === classNum && !now.lessons[l.id]) ??
    ncert.find((l) => l.classNum > classNum && !now.lessons[l.id]) ??
    null;

  return {
    xpWeek: Math.max(0, now.xp - monday.xp),
    xpTotal: now.xp,
    streak: now.streak.count,
    finished,
    working,
    stuck: stuck.slice(0, 3),
    talk: talk.slice(0, 2),
    next: next ? ref(next) : null,
  };
}

/** The free view: the headline numbers only. */
export function teaser(r: ChildReport) {
  return { xpWeek: r.xpWeek, xpTotal: r.xpTotal, streak: r.streak, finishedCount: r.finished.length, workingCount: r.working.length };
}

/** The report as plain text, for the weekly email. */
export function reportText(nickname: string, r: ChildReport) {
  const lines = [`${nickname}: ${r.xpWeek} XP this week (${r.xpTotal} in all), ${r.streak}-day streak.`];
  if (!r.finished.length && !r.working.length) lines.push("No lessons played this week.");
  const name = (l: LessonRef) => `${l.title} (${l.chapter})`;
  if (r.finished.length) lines.push(`Finished: ${r.finished.map(name).join(", ")}.`);
  if (r.working.length) lines.push(`Working on: ${r.working.map((l) => `${name(l)}, ${l.percent}% done`).join(", ")}.`);
  if (r.stuck.length) lines.push(`Could use a hand: ${r.stuck.map((l) => `${name(l)}, ${l.why}`).join("; ")}.`);
  for (const t of r.talk) lines.push(`Ask them: "${t.question}" (from ${t.title})`);
  if (r.next) lines.push(`Up next: ${name(r.next)}.`);
  return lines.join("\n");
}
