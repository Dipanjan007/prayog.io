import { test } from "node:test";
import assert from "node:assert/strict";
import { EMPTY_PROGRESS, canonical, mergeProgress, parseProgress, xpFor } from "./progress-merge";
import type { Progress } from "./progress";

const phone: Progress = {
  xp: 40,
  badges: ["first-gust"],
  lessons: { "c8-pressure-winds": { done: ["hook", "predict", "task:roof"], predictionCorrect: true } },
  streak: { count: 3, lastDay: "2026-10-04", freezes: 1 },
};

const laptop: Progress = {
  xp: 0,
  badges: ["bright-spark"],
  lessons: {
    "c8-pressure-winds": { done: ["hook", "challenge"], challengeStars: 2 },
    "c7-circuits": { done: ["hook"], quizBest: 3 },
  },
  streak: { count: 1, lastDay: "2026-10-05", freezes: 0 },
};

test("XP counts each step once, plus stars and quiz points", () => {
  // hook 10 + predict 10 + task 20 = 40
  assert.equal(xpFor(phone.lessons), 40);
});

test("merging keeps everything from both devices without double counting", () => {
  const m = mergeProgress(phone, laptop);
  assert.deepEqual(m.lessons["c8-pressure-winds"].done.sort(), ["challenge", "hook", "predict", "task:roof"]);
  assert.equal(m.lessons["c8-pressure-winds"].challengeStars, 2);
  assert.equal(m.lessons["c8-pressure-winds"].predictionCorrect, true);
  assert.deepEqual(m.badges.sort(), ["bright-spark", "first-gust"]);
  // pressure: 10 + 10 + 20 + 30 + 2 stars × 10 = 90; circuits: 10 + 3 × 10 = 40
  assert.equal(m.xp, 130);
  assert.equal(m.streak.lastDay, "2026-10-05");
});

test("merge is the same whichever device syncs first", () => {
  assert.deepEqual(mergeProgress(phone, laptop).xp, mergeProgress(laptop, phone).xp);
  assert.deepEqual(mergeProgress(EMPTY_PROGRESS, phone), mergeProgress(phone, EMPTY_PROGRESS));
});

test("parseProgress recomputes XP and rejects junk", () => {
  const forged = { ...phone, xp: 999_999 };
  assert.equal(parseProgress(forged)?.xp, 40);
  assert.equal(parseProgress(null), null);
  assert.equal(parseProgress({ badges: "x", lessons: {} }), null);
  assert.equal(parseProgress({ badges: [], lessons: { "<script>": { done: [] } } }), null);
  assert.equal(parseProgress({ badges: [], lessons: { a: { done: ["hook"], challengeStars: 9 } } })?.lessons.a.challengeStars, undefined);
});

test("canonical ignores key order", () => {
  assert.equal(canonical({ b: 1, a: { d: [2, 1], c: null } }), canonical({ a: { c: null, d: [2, 1] }, b: 1 }));
});
