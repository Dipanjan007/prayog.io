import assert from "node:assert/strict";
import { test } from "node:test";
import { REQUESTS, lesson } from "../../content/lessons/data";
import { DATASETS, balanced, clampValue, fmt, mean, median, meetsData, modeCount, modes, outlierPulls, range, sum, summary } from "./data";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test("mean, median, mode and range", () => {
  assert.equal(mean([4, 7, 7, 10, 12]), 8);
  assert.equal(median([12, 5, 9, 20, 7, 15]), 10.5);
  assert.equal(median([3, 1, 2]), 2);
  assert.deepEqual(modes([6, 7, 7, 8, 8, 8, 9]), [8]);
  assert.deepEqual(modes([1, 2, 3]), []);
  assert.deepEqual(modes([1, 1, 2, 2, 3]), [1, 2]);
  assert.equal(range([31, 35, 28, 40, 33]), 12);
  assert.equal(modeCount([5, 5, 5, 2]), 3);
  assert.ok(Number.isNaN(mean([])));
  assert.equal(fmt(159 / 7), "22.71");
  assert.equal(fmt(10.5), "10.5");
  assert.equal(fmt(151), "151");
});

test("the starting data sets match the lesson's numbers", () => {
  const c = DATASETS.cricket.start;
  assert.equal(sum(c), 159);
  assert.equal(fmt(mean(c)), "22.71");
  assert.equal(median(c), 25);
  assert.deepEqual(modes(c), [25]);
  assert.equal(range(c), 32);
  const h = DATASETS.heights.start;
  assert.equal(sum(h), 1359);
  assert.equal(mean(h), 151);
  assert.deepEqual(modes(h), []);
  for (const ds of Object.values(DATASETS)) {
    assert.ok(ds.start.every((v) => v === clampValue(ds, v)));
    assert.ok(ds.start.length >= ds.minN && ds.start.length <= ds.maxN);
  }
});

test("tasks can be finished with the sim's controls", () => {
  const h = DATASETS.heights.start;
  // Balance: one student +4 cm, another −4 cm.
  const moved = h.map((v, i) => (i === 0 ? v + 4 : i === 1 ? v - 4 : v));
  assert.ok(balanced(h, moved));
  assert.equal(mean(moved), 151);
  assert.ok(!balanced(h, h));
  assert.ok(!balanced(h, h.map((v, i) => (i === 0 ? v + 1 : v))));
  // Mode: three students at 150 cm.
  const three = h.map((v, i) => (i === 0 || i === 1 ? 150 : v));
  assert.equal(modeCount(three), 3);
  assert.deepEqual(modes(three), [150]);
  // Century: the 40 dragged to 100, and in fact any one score moved to 100 or more.
  const c = DATASETS.cricket.start;
  const century = c.map((v) => (v === 40 ? 100 : v));
  assert.equal(fmt(mean(century)), "31.29");
  assert.equal(median(century), 25);
  close(mean(century) - mean(c), 60 / 7);
  for (let i = 0; i < c.length; i++)
    for (const big of [100, 150]) assert.ok(outlierPulls(c, c.map((v, j) => (j === i ? big : v))), `${i} → ${big}`);
  assert.ok(!outlierPulls(c, c));
  // Even: adding one innings (at the default value) gives 8 scores and the median is the mean of the middle two.
  const eight = [...c, DATASETS.cricket.addValue];
  assert.equal(eight.length % 2, 0);
  assert.equal(median(eight), (25 + 25) / 2);
});

test("each challenge request is solvable within the limits and not already met", () => {
  const sols = [
    [10, 20, 30, 40, 50],
    [15, 30, 50, 55, 50],
    [140, 145, 150, 154, 155, 156],
  ];
  assert.equal(REQUESTS.length, 3);
  REQUESTS.forEach((r, i) => {
    const ds = DATASETS[r.set];
    assert.ok(!meetsData(r.start, r), r.name);
    assert.ok(meetsData(sols[i], r), r.name);
    assert.equal(sols[i].length, r.start.length);
    assert.ok(sols[i].every((v) => v === clampValue(ds, v)));
    assert.ok(r.start.every((v) => v === clampValue(ds, v)));
  });
  assert.ok(!meetsData([10, 20, 30, 40], REQUESTS[0]));
});

test("predict and quiz answers", () => {
  const before = [10, 12, 15, 18, 20];
  const after = [...before, 100];
  assert.ok(Math.abs(mean(after) - mean(before)) > Math.abs(median(after) - median(before)));
  assert.equal(lesson.predict.answer, 0);
  const q = lesson.quiz;
  assert.equal(q.length, 5);
  for (const x of q) assert.equal(x.options.length, 4);
  assert.equal(Number(q[0].options[q[0].answer]), mean([4, 7, 7, 10, 12]));
  assert.equal(Number(q[1].options[q[1].answer]), median([12, 5, 9, 20, 7, 15]));
  assert.equal(Number(q[2].options[q[2].answer]), modes([6, 7, 7, 8, 8, 8, 9])[0]);
  assert.equal(q[3].options[q[3].answer], `${range([31, 35, 28, 40, 33])} °C`);
  const money = summary([200, 250, 250, 300, 5000]);
  assert.equal(money.mean, 1200);
  assert.equal(money.median, 250);
  assert.equal(q[4].options[q[4].answer], "The median");
});

test("formulas bracket a division before a subtraction or addition", () => {
  const risky = /÷\s*[^\s()]+\s*[−+]/u;
  for (const f of [lesson.discovery.formula, ...lesson.ideas.map((i) => i.formula ?? "")]) assert.ok(!risky.test(f), f);
});
