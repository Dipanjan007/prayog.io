import assert from "node:assert/strict";
import { test } from "node:test";
import { ORDERS, lesson } from "../../content/lessons/fractions";
import { BAR, FIT, SHARE, cmp, div, equal, fits, fmtFrac, fmtMixed, frac, mul, ofQuantity, simplify, solutions, value } from "./fractions";

test("simplify and format", () => {
  assert.deepEqual(simplify(frac(6, 12)), frac(1, 2));
  assert.equal(fmtFrac(frac(6, 3)), "2");
  assert.equal(fmtMixed(frac(8, 3)), "2 and 2/3");
  assert.equal(fmtMixed(frac(3, 4)), "3/4");
});

test("a fraction of a fraction: multiply tops and bottoms (area model)", () => {
  assert.deepEqual(mul(frac(2, 3), frac(3, 4)), frac(1, 2)); // task:area, 6 of 12 pieces
  assert.equal(2 * 3, 6);
  assert.equal(3 * 4, 12);
  assert.deepEqual(mul(frac(1, 2), frac(1, 3)), frac(1, 6)); // the half roti
});

test("multiplying by a proper fraction makes things smaller, by 1 keeps them, by more than 1 makes them bigger", () => {
  const a = frac(1, 2);
  assert.equal(cmp(mul(a, frac(1, 3)), a), -1); // predict: smaller than 1/2
  for (let d = 2; d <= 10; d++) for (let n = 1; n < d; n++) assert.equal(cmp(mul(frac(5, 7), frac(n, d)), frac(5, 7)), -1);
  assert.ok(equal(mul(a, frac(4, 4)), a));
  assert.equal(cmp(mul(a, frac(3, 2)), a), 1);
});

test("a fraction of a quantity", () => {
  assert.deepEqual(ofQuantity(24, frac(3, 4)), frac(18)); // task:share
  assert.equal((24 / 4) * 3, 18);
});

test("dividing by a fraction counts how many fit", () => {
  assert.deepEqual(div(frac(3), frac(1, 4)), frac(12)); // task:fit
  const f = fits(frac(2), frac(3, 4));
  assert.deepEqual(f.count, frac(8, 3));
  assert.equal(f.full, 2);
  assert.deepEqual(f.rest, frac(2, 3));
});

test("predict answer is right", () => {
  assert.equal(lesson.predict.answer, 2);
  assert.ok(value(mul(frac(1, 2), frac(1, 3))) < 0.5);
});

test("quiz answers are right", () => {
  const q = lesson.quiz;
  assert.deepEqual(mul(frac(2, 3), frac(3, 5)), frac(2, 5));
  assert.match(q[0].options[q[0].answer], /2\/5/);
  assert.equal(q[1].options[q[1].answer], `₹${value(ofQuantity(200, frac(3, 4)))}`);
  assert.equal(q[2].options[q[2].answer], fmtFrac(div(frac(5), frac(1, 4))));
  // Only 5/6 × 7/8 is smaller than 5/6.
  const five6 = frac(5, 6);
  const opts = [mul(five6, frac(1)), mul(five6, frac(3, 2)), div(five6, frac(1, 2)), mul(five6, frac(7, 8))];
  const smaller = opts.map((o, i) => (cmp(o, five6) < 0 ? i : -1)).filter((i) => i >= 0);
  assert.deepEqual(smaller, [q[3].answer]);
  assert.equal(q[4].options[q[4].answer], `${fits(frac(2), frac(3, 4)).full}`);
});

test("every mithai shop order can be solved with the sim's controls", () => {
  assert.equal(ORDERS.length, 3);
  for (const r of ORDERS) assert.ok(solutions(r).length > 0, r.name);
  assert.ok(solutions(ORDERS[0]).includes("1/2 × 3/5"));
  assert.deepEqual(solutions(ORDERS[1]), ["30"]);
  assert.ok(solutions(ORDERS[2]).includes("1/4"));
  // A trivial "whole bar" cut does not count.
  assert.ok(!solutions(ORDERS[0]).some((s) => s.includes("1/1")));
});

test("every task can be done with the sim's controls", () => {
  // task:area and task:smaller use the bar pickers (proper-or-whole, bottom up to BAR.maxDen).
  for (const f of [frac(2, 3), frac(3, 4), frac(4, 4)]) assert.ok(f.d <= BAR.maxDen && f.n <= f.d);
  // task:share: 24 laddoos and 3/4.
  assert.ok(24 <= SHARE.maxN && 4 <= SHARE.maxDen);
  // task:fit: a total of 3 litres and glasses of 1/4 litre.
  assert.ok(3 <= FIT.maxWholeN && 4 <= FIT.maxDen && 1 <= FIT.maxPieceN);
  // The lesson's "found" numbers.
  assert.equal(lesson.tasks.length, 4);
  assert.match(lesson.tasks[0].found, /6 of the 12/);
  assert.match(lesson.tasks[2].found, /18 laddoos/);
  assert.match(lesson.tasks[3].found, /12 glasses/);
});

test("the order rounds use fixed numbers the sim can show", () => {
  const share = ORDERS[1];
  const fit = ORDERS[2];
  assert.ok(share.kind === "share" && share.frac.d <= SHARE.maxDen);
  assert.ok(fit.kind === "fit" && fit.whole.n <= FIT.maxWholeN && fit.whole.d <= FIT.maxDen);
});
