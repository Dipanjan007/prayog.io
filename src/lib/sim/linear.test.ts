import assert from "node:assert/strict";
import { test } from "node:test";
import { FARE_CHARTS, lesson } from "../../content/lessons/linear-polynomials";
import { BASE, COEF_A, COEF_B, KM, RATE, baseFrom, chartSolutions, evalLinear, fare, linearText, matchesChart, num, rangeValues, rateFrom, zeroOf } from "./linear";

test("p(x) = ax + b and its zero −b ÷ a", () => {
  assert.equal(evalLinear(2, -6, 3), 0);
  assert.equal(zeroOf(2, -6), 3);
  assert.equal(zeroOf(3, -12), 4);
  assert.equal(zeroOf(-2, 8), 4);
  assert.equal(zeroOf(1, 2), -2);
  assert.equal(zeroOf(5, 0), 0);
  assert.equal(zeroOf(0, 4), null);
  assert.equal(evalLinear(0, 4, 100), 4); // a = 0 is flat and never 0
});

test("fares: base fare + (rate × km)", () => {
  assert.equal(fare(30, 15, 4), 90);
  assert.equal(fare(30, 15, 8), 150);
  assert.notEqual(fare(30, 15, 8), 2 * fare(30, 15, 4));
  assert.equal(fare(40, 12, 5), 100);
  assert.equal(rateFrom({ km: 2, fare: 50 }, { km: 5, fare: 95 }), 15);
  assert.equal(baseFrom({ km: 2, fare: 50 }, 15), 20);
  assert.equal(rateFrom({ km: 2, fare: 50 }, { km: 4, fare: 80 }), 15);
});

test("text uses real minus signs", () => {
  assert.equal(linearText(2, -6), "2x − 6");
  assert.equal(linearText(-1, 3), "−x + 3");
  assert.equal(linearText(1, 0), "x");
  assert.equal(linearText(0, -4), "−4");
  assert.equal(num(-2.5), "−2.5");
  assert.equal(num(1 / 3), "0.33");
});

test("tasks can be done with the sliders", () => {
  const has = (r: { min: number; max: number; step: number }, v: number) => rangeValues(r).includes(v);
  assert.ok(has(BASE, 30) && has(RATE, 15) && has(KM, 4));
  assert.ok(has(COEF_A, 2) && has(COEF_B, -6) && has(COEF_A, 0) && has(COEF_A, 1) && has(COEF_B, -3));
  // At least two different lines on the sliders cross at x = 3.
  const at3 = rangeValues(COEF_A).flatMap((a) => rangeValues(COEF_B).filter((b) => zeroOf(a, b) === 3));
  assert.ok(at3.length >= 2);
});

test("every fare chart has exactly one meter setting on the sliders", () => {
  assert.equal(FARE_CHARTS.length, 3);
  for (const c of FARE_CHARTS) {
    const s = chartSolutions(c);
    assert.equal(s.length, 1, c.name);
    assert.ok(matchesChart(s[0].rate, s[0].base, c));
    assert.ok(c.points.every((p) => p.km >= KM.min && p.km <= KM.max));
    // The brief quotes every row of the chart.
    for (const p of c.points) assert.ok(c.brief.includes(`₹${p.fare}`) && c.brief.includes(`${p.km} km`), `${c.name}: ${p.km} km`);
  }
  assert.deepEqual(chartSolutions(FARE_CHARTS[0])[0], { rate: 15, base: 20 });
  assert.deepEqual(chartSolutions(FARE_CHARTS[1])[0], { rate: 20, base: 25 });
  assert.deepEqual(chartSolutions(FARE_CHARTS[2])[0], { rate: 7, base: 30 });
});

test("prediction and quiz answers", () => {
  assert.equal(lesson.predict.options[lesson.predict.answer], `₹${fare(30, 15, 8)}`);
  const q = lesson.quiz;
  assert.equal(q[0].options[q[0].answer], `${zeroOf(3, -12)}`);
  assert.equal(q[1].options[q[1].answer], `₹${fare(40, 12, 5)}`);
  assert.equal(q[3].options[q[3].answer], `₹${rateFrom({ km: 2, fare: 50 }, { km: 5, fare: 95 })}`);
  assert.ok(q[4].options[q[4].answer].includes(`x = ${zeroOf(-2, 8)}`));
  for (const x of q) assert.equal(x.options.length, 4);
});
