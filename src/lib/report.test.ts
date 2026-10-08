import assert from "node:assert/strict";
import { test } from "node:test";
import { LESSON_HREF, LESSONS } from "../content/lessons";
import { stepOrder } from "../content/lessons/types";
import type { Progress } from "./progress";
import { EMPTY_PROGRESS } from "./progress-merge";
import { buildReport, reportText, teaser } from "./report";

const emms = LESSONS.find((l) => l.id === "c7-earth-moon-sun")!;
const circuits = LESSONS.find((l) => l.id === "c7-circuits")!;
const prog = (lessons: Progress["lessons"], xp = 0): Progress => ({ ...EMPTY_PROGRESS, xp, lessons });

test("every lesson has a route", () => {
  for (const l of LESSONS) assert.ok(LESSON_HREF[l.id], l.id);
  assert.equal(LESSON_HREF["c10-light"], "/learn/light-refraction");
  assert.equal(LESSON_HREF["x-gravity"], "/outliers/gravity");
});

test("finished, working, stuck and talk are this week's", () => {
  const monday = prog({ [circuits.id]: { done: ["hook"] } }, 10);
  const now = prog(
    {
      [emms.id]: { done: stepOrder(emms), quizBest: emms.quiz.length },
      [circuits.id]: { done: ["hook"] },
      "c7-time-motion": { done: ["hook", "predict"], predictionCorrect: false },
    },
    300,
  );
  const r = buildReport(now, monday, 7);
  assert.equal(r.xpWeek, 290);
  assert.deepEqual(r.finished.map((l) => l.id), [emms.id]);
  assert.deepEqual(r.working.map((l) => l.id), ["c7-time-motion"]);
  assert.deepEqual(r.stuck.map((l) => l.id), [circuits.id]);
  assert.equal(r.talk.length, 1);
  assert.ok(r.next?.id.startsWith("c7-"));
  assert.match(reportText("Asha", r), /Finished: .*Earth, Moon/);
  assert.deepEqual(teaser(r), { xpWeek: 290, xpTotal: 300, streak: 0, finishedCount: 1, workingCount: 1 });
});

test("a low quiz score counts as stuck", () => {
  const now = prog({ [circuits.id]: { done: stepOrder(circuits), quizBest: 1 } });
  const r = buildReport(now, EMPTY_PROGRESS, 7);
  assert.match(r.stuck[0].why, /^1 of \d+ right/);
});

test("a quiet week says so", () => {
  const r = buildReport(EMPTY_PROGRESS, EMPTY_PROGRESS, 8);
  assert.match(reportText("Ravi", r), /No lessons played this week/);
  assert.ok(r.next?.id.startsWith("c8-"));
});
