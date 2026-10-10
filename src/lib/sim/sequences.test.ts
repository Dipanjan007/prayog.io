import assert from "node:assert/strict";
import { test } from "node:test";
import { FORECASTS, lesson } from "../../content/lessons/sequences";
import {
  DIFF,
  FIRST,
  START,
  TERMS,
  WEEKS,
  apSum,
  apTerm,
  apTerms,
  differences,
  doubleTerm,
  doubleTerms,
  forecastAnswer,
  isAP,
  jarB,
  overtakeWeek,
  parseAnswer,
  sub,
} from "./sequences";

test("AP terms, nth term and differences", () => {
  assert.deepEqual(apTerms(5, 3, 4), [5, 8, 11, 14]); // task:diff
  assert.deepEqual(differences([5, 8, 11, 14]), [3, 3, 3]);
  assert.equal(apTerm(20, 4, 10), 56); // predict and task:nth
  assert.equal(20 + (10 - 1) * 4, 56);
  assert.equal(sub(12), "₁₂");
});

test("sum by pairing matches adding one by one", () => {
  assert.equal(apSum(1, 1, 10), 55); // task:sum
  for (let a = 1; a <= 10; a++)
    for (let d = 0; d <= 6; d++)
      for (let n = 1; n <= 15; n++) {
        const plain = apTerms(a, d, n).reduce((s, x) => s + x, 0);
        assert.equal(apSum(a, d, n), plain);
        // Aryabhata's rule: the middle term times the number of terms.
        assert.equal(n * (a + ((n - 1) / 2) * d), plain);
      }
});

test("doubling is not an AP and overtakes ₹50 a week in week 10", () => {
  assert.deepEqual(doubleTerms(1, 5), [1, 2, 4, 8, 16]);
  assert.ok(!isAP(doubleTerms(1, 5)));
  assert.ok(isAP(apTerms(3, 4, 6)));
  assert.equal(overtakeWeek(1), 10);
  assert.equal(doubleTerm(1, 9), 256);
  assert.equal(jarB(9), 450);
  assert.equal(doubleTerm(1, 10), 512);
  assert.equal(jarB(10), 500);
  assert.equal(doubleTerm(1, 12), 2048);
});

test("predict answer is right", () => {
  assert.equal(lesson.predict.options[lesson.predict.answer], `${apTerm(20, 4, 10)} seats`);
});

test("quiz answers are right", () => {
  const q = lesson.quiz;
  assert.equal(q[0].options[q[0].answer], `${apTerm(3, 4, 20)}`);
  assert.equal(q[1].options[q[1].answer], `${apSum(1, 1, 100)}`);
  const aps = q[2].options.map((o) => isAP(o.split(", ").map(Number)));
  assert.deepEqual(
    aps.map((v, i) => (v ? i : -1)).filter((i) => i >= 0),
    [q[2].answer],
  );
  assert.equal(q[3].options[q[3].answer], `₹${apTerm(10, 5, 8)}`);
  assert.equal(q[4].options[q[4].answer], `${doubleTerm(1, 11)}`);
});

test("every task can be done with the sim's controls", () => {
  assert.equal(lesson.tasks.length, 4);
  const ok = (a: number, d: number, n: number) => a >= FIRST.min && a <= FIRST.max && d >= DIFF.min && d <= DIFF.max && n >= TERMS.min && n <= TERMS.max;
  assert.ok(ok(5, 3, 4)); // task:diff
  assert.ok(ok(20, 4, 10)); // task:nth
  assert.ok(ok(1, 1, 10)); // task:sum
  assert.ok(1 >= START.min && 10 <= WEEKS.max && 12 <= WEEKS.max); // task:double, up to week 12
  assert.match(lesson.tasks[1].found, /56 seats/);
  assert.match(lesson.tasks[2].found, /55/);
});

test("every forecast can be built in the lab and its answer is right", () => {
  assert.equal(FORECASTS.length, 3);
  for (const f of FORECASTS) {
    assert.equal(forecastAnswer(f), f.answer, f.name);
    if (f.kind === "ap") {
      assert.ok(f.a <= FIRST.max && f.d <= DIFF.max && f.d >= DIFF.min && f.n <= TERMS.max, f.name);
    } else {
      assert.ok(f.a >= START.min && f.a <= START.max && f.n <= WEEKS.max, f.name);
    }
  }
  assert.equal(FORECASTS[0].answer, 45);
  assert.equal(FORECASTS[1].answer, 275);
  assert.equal(FORECASTS[2].answer, 384);
  assert.equal(parseAnswer("₹ 2,75"), 275);
  assert.ok(Number.isNaN(parseAnswer("abc")));
  assert.ok(Number.isNaN(parseAnswer("")));
});
