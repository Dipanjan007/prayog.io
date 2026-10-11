import assert from "node:assert/strict";
import { test } from "node:test";
import { ROUNDS, lesson } from "../../content/lessons/inverse-proportion";
import { SPEED, TRIP, WALL, WORKERS, daysText, directValue, hoursText, inverseValue, jobDays, roundAnswers, roundOk, tripTime } from "./inverse";

test("doubling the speed halves the time; speed × time is always the trip length", () => {
  assert.equal(tripTime(TRIP.km, 40), 6);
  assert.equal(tripTime(TRIP.km, 80), 3);
  assert.equal(tripTime(TRIP.km, 60), 4);
  for (let s = SPEED.min; s <= SPEED.max; s += SPEED.step) assert.ok(Math.abs(s * tripTime(TRIP.km, s) - TRIP.km) < 1e-9);
  assert.equal(lesson.predict.options[lesson.predict.answer], `${tripTime(TRIP.km, 120)} hours`);
});

test("times read as hours and minutes", () => {
  assert.equal(hoursText(4), "4 h");
  assert.equal(hoursText(4.8), "4 h 48 min");
  assert.equal(hoursText(240 / 70), "3 h 26 min");
  assert.equal(hoursText(12), "12 h");
});

test("the wall: 24 worker-days, so 6 workers take 4 days; bricks per day grow directly", () => {
  assert.equal(jobDays(WALL, 6), 4);
  assert.equal(jobDays(WALL, 2), 12);
  assert.equal(WALL.perPerson!.amount * 2, 100);
  assert.equal(WALL.perPerson!.amount * 6, 300);
  assert.equal(WALL.total * WALL.perPerson!.amount, 1200);
  assert.equal(daysText(jobDays(WALL, 5)), "4.8");
  assert.ok(6 <= WORKERS.max && 2 >= WORKERS.min);
  // 40 and 80 km/h are on the speed slider.
  assert.equal((40 - SPEED.min) % SPEED.step, 0);
  assert.equal((80 - SPEED.min) % SPEED.step, 0);
});

test("inverse and direct values", () => {
  assert.equal(inverseValue(4, 9, 6), 6);
  assert.equal(directValue(4, 9, 6), 13.5);
});

test("each challenge round has exactly one answer on the slider", () => {
  assert.equal(ROUNDS.length, 3);
  assert.deepEqual(ROUNDS.map(roundAnswers), [[80], [9], [12]]);
  assert.ok(roundOk(ROUNDS[0], 80));
  assert.ok(!roundOk(ROUNDS[0], 70));
  // The rice store: 8 students for 30 days.
  const rice = ROUNDS[2];
  assert.ok(rice.kind === "job" && rice.job.total === 8 * 30);
});

test("quiz answers", () => {
  const q = lesson.quiz;
  assert.equal(q[0].options[q[0].answer], `${inverseValue(6, 10, 15)} days`);
  assert.equal(q[1].answer, 1);
  assert.equal(q[2].options[q[2].answer], `${inverseValue(60, 5, 75)} hours`);
  assert.equal(q[3].options[q[3].answer], `${inverseValue(40, 15, 50)} days`);
  assert.equal(q[4].options[q[4].answer], `${inverseValue(4, 9, 6)}`);
  for (const x of q) assert.equal(x.options.length, 4);
});

test("lesson shape", () => {
  assert.equal(lesson.predict.options.length, 3);
  assert.ok(lesson.tasks.length >= 3 && lesson.tasks.length <= 5);
  assert.equal(lesson.quiz.length, 5);
  assert.ok(lesson.symbols.length > 0);
});
