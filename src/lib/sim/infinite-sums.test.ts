import assert from "node:assert/strict";
import { test } from "node:test";
import { SUM_ROUNDS, lesson } from "../../content/lessons/infinite-sums";
import {
  A_MAX,
  A_MIN,
  MAX_BITES,
  N_STEPS,
  R_CHOICES,
  SERIES,
  checkGuess,
  fracValue,
  geoLimit,
  geoLimitFrac,
  geoPartial,
  fmtUnder,
  halvesGap,
  harmonic,
  reduce,
  harmonicPassing,
  laddooEaten,
  parseAnswer,
  settlesAt,
  squaresSum,
  zenoCatchTime,
  zenoStage,
} from "./infinite-sums";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test("laddoo: after 10 bites 1023/1024 is eaten, and it never passes 1", () => {
  close(laddooEaten(1), 0.5);
  close(laddooEaten(3), 7 / 8);
  close(laddooEaten(10), 1023 / 1024);
  assert.ok(MAX_BITES >= 10);
  for (let n = 0; n <= MAX_BITES; n++) assert.ok(laddooEaten(n) < 1);
});

test("Zeno: stage times 10, 1, 0.1 ... add up to the catch time 100 ÷ 9 s", () => {
  close(zenoStage(1).time, 10);
  close(zenoStage(1).gap, 10);
  close(zenoStage(2).time, 11);
  close(zenoStage(5).time, 11.111, 1e-9);
  close(zenoCatchTime(), 100 / 9);
  close(geoLimit(10, 0.1)!, 100 / 9);
  close(10 * zenoCatchTime(), 1000 / 9); // 111.1 m
  for (let k = 0; k < 12; k++) assert.ok(zenoStage(k).gap > 0);
});

test("harmonic grows past 5 at 83 terms; halves stay under 2", () => {
  assert.equal(harmonicPassing(5), 83);
  assert.ok(harmonic(82) < 5 && harmonic(83) > 5);
  assert.ok(N_STEPS.some((n) => SERIES.harmonic.sum(n) > 5));
  assert.ok(N_STEPS.includes(20));
  assert.ok(SERIES.halves.sum(40) < 2);
  // Past about 53 terms the computer rounds the Halves sum to 2, so the sim shows the gap instead.
  for (const n of N_STEPS) assert.ok(fmtUnder(SERIES.halves.sum(n), 2) !== "2.0000");
  close(SERIES.halves.sum(10) + halvesGap(10), 2);
  close(SERIES.halves.sum(20), 2 - Math.pow(0.5, 19));
  assert.ok(Math.abs(squaresSum(10000) - (Math.PI * Math.PI) / 6) < 1e-3);
  assert.ok(harmonic(10000) > 9);
});

test("geometric sums: a ÷ (1 − r), and r ≥ 1 never settles", () => {
  close(geoPartial(3, 0.5, 50), 6, 1e-9);
  assert.equal(geoLimit(2, 1), null);
  assert.equal(geoLimit(2, 1.5), null);
  assert.equal(geoPartial(2, 1, 5), 10);
  assert.ok(settlesAt(3, { p: 1, q: 2 }, 6));
  assert.ok(!settlesAt(3, { p: 1, q: 3 }, 6));
  assert.deepEqual(reduce({ p: 6, q: 4 }), { p: 3, q: 2 });
  assert.deepEqual(geoLimitFrac(2, { p: 2, q: 3 }), { p: 6, q: 1 });
  // task:geo is reachable with the sim's a and r choices, and r ≥ 1 is offered.
  const ways = R_CHOICES.flatMap((r) => Array.from({ length: A_MAX - A_MIN + 1 }, (_, i) => A_MIN + i).filter((a) => settlesAt(a, r, 6)));
  assert.ok(ways.length > 0);
  assert.ok(R_CHOICES.some((r) => fracValue(r) >= 1));
});

test("every challenge round settles, and the right answer is accepted", () => {
  assert.equal(SUM_ROUNDS.length, 3);
  const want = [16, 9, 10];
  SUM_ROUNDS.forEach((r, i) => {
    const L = geoLimitFrac(r.a, r.r)!;
    close(L.p / L.q, want[i]);
    assert.ok(checkGuess(want[i], r));
    assert.ok(!checkGuess(want[i] + 1, r));
    // The shown terms match a and r.
    const shownFirst = Number(r.shown.split(" + ")[0]);
    assert.equal(shownFirst, r.a);
  });
  assert.equal(parseAnswer("25/2"), 12.5);
  assert.equal(parseAnswer("9,5"), 9.5);
  assert.ok(Number.isNaN(parseAnswer("")));
});

test("quiz answers", () => {
  const q = lesson.quiz;
  close(geoLimit(1 / 3, 1 / 3)!, 0.5);
  assert.equal(q[0].options[q[0].answer], "1/2");
  assert.equal(q[1].answer, 2);
  close(geoLimit(9 / 10, 1 / 10)!, 1);
  assert.equal(q[2].options[q[2].answer], "Exactly 1");
  close(10 + 2 * geoLimit(5, 0.5)!, 30);
  assert.equal(q[3].options[q[3].answer], "30 m");
  close(geoLimit(5, 0.1)!, 50 / 9);
  assert.equal(q[4].answer, 2);
  assert.equal(lesson.predict.answer, 0);
  for (const x of q) assert.equal(x.options.length, 4);
});
