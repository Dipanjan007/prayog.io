import assert from "node:assert/strict";
import { test } from "node:test";
import { TRIPS, lesson } from "../../content/lessons/integers";
import {
  N_MAX,
  RANGE,
  TIMES_MAX,
  TOKEN_MAX,
  apply,
  asAddition,
  br,
  cancel,
  fmtInt,
  inRange,
  jumps,
  pattern,
  place,
  sentence,
  signRule,
  solutions,
  tokenValue,
  tokenWays,
  zeroPairs,
} from "./integers";

test("formatting uses a real minus sign and brackets negatives mid-sum", () => {
  assert.equal(fmtInt(-3), "−3");
  assert.equal(fmtInt(0), "0");
  assert.equal(br(-3), "(−3)");
  assert.equal(br(4), "4");
  assert.equal(sentence(2, "−", -3), "2 − (−3) = 5");
  assert.equal(place("lift", -2), "basement −2");
  assert.equal(place("lift", 0), "the ground floor");
  assert.equal(place("temp", -9), "−9 °C");
});

test("adding a negative moves down; subtracting a negative moves up", () => {
  assert.equal(apply(3, "+", -5), -2); // task:down
  assert.equal(apply(3, "−", 5), -2);
  assert.equal(apply(2, "−", -3), 5); // predict and task:subneg
  assert.equal(apply(2, "+", 3), 5);
  for (let s = -5; s <= 5; s++)
    for (let n = -5; n <= 5; n++) {
      const t = asAddition(s, "−", n);
      assert.equal(apply(t.s, "+", t.n), apply(s, "−", n));
    }
});

test("tokens: zero pairs cancel", () => {
  assert.equal(tokenValue(7, 10), -3);
  assert.equal(zeroPairs(7, 10), 7);
  assert.deepEqual(cancel(7, 10), { plus: 0, minus: 3 });
  const ways = tokenWays(-2);
  assert.ok(ways.length >= 2); // task:tokens needs two boards
  assert.ok(ways.some((w) => w.plus === 0 && w.minus === 2));
  assert.ok(ways.some((w) => w.plus === 1 && w.minus === 3));
  for (const w of ways) assert.ok(w.plus <= TOKEN_MAX && w.minus <= TOKEN_MAX);
});

test("multiplication as jumps and the sign rules", () => {
  assert.deepEqual(jumps(3, -2), [0, -2, -4, -6]);
  assert.deepEqual(jumps(-3, 2), [0, -2, -4, -6]);
  assert.deepEqual(jumps(-3, -2), [0, 2, 4, 6]);
  for (let a = -TIMES_MAX; a <= TIMES_MAX; a++)
    for (let b = -TIMES_MAX; b <= TIMES_MAX; b++) {
      const j = jumps(a, b);
      assert.equal(j[j.length - 1], a * b || 0);
      const s = signRule(a, b);
      assert.equal(s, a * b === 0 ? "0" : a * b > 0 ? "+" : "−");
    }
  assert.deepEqual(
    pattern(-2).map((r) => r.p),
    [-6, -4, -2, 0, 2, 4, 6],
  );
});

test("predict answer is right", () => {
  assert.equal(lesson.predict.options[lesson.predict.answer], fmtInt(apply(2, "−", -3)));
});

test("quiz answers are right", () => {
  const q = lesson.quiz;
  assert.equal(q[0].options[q[0].answer], `${fmtInt(apply(-7, "+", 12))} °C`);
  assert.equal(q[1].options[q[1].answer], fmtInt(-4 * -6));
  assert.equal(q[2].options[q[2].answer], fmtInt(apply(5, "−", -2)));
  assert.equal(q[3].options[q[3].answer], fmtInt(apply(-8, "−", -3)));
  assert.equal(q[4].options[q[4].answer], fmtInt(tokenValue(7, 10)));
});

test("every task can be done with the sim's controls", () => {
  assert.equal(lesson.tasks.length, 4);
  // task:down: floor 3, add −5, lands in the building.
  assert.ok(inRange("lift", 3) && inRange("lift", apply(3, "+", -5)) && 5 <= N_MAX);
  // task:subneg: both trips from floor 2 end on floor 5.
  assert.ok(inRange("lift", 2) && inRange("lift", 5));
  // task:signs: (−3) × 2 and (−3) × (−2) are on the Times pickers.
  assert.ok(3 <= TIMES_MAX && 2 <= TIMES_MAX);
  assert.match(lesson.tasks[0].found, /3 \+ \(−5\) = −2/);
  assert.match(lesson.tasks[3].found, /\(−3\) × 2 = −6/);
  assert.equal(-3 * 2, -6);
  assert.equal(-3 * -2, 6);
});

test("every control-room job can be solved with the sim's controls", () => {
  assert.equal(TRIPS.length, 3);
  for (const r of TRIPS) assert.ok(solutions(r).length > 0, r.name);
  assert.deepEqual(solutions(TRIPS[0]), [-10]);
  assert.deepEqual(solutions(TRIPS[1]), [-13]);
  assert.deepEqual(solutions(TRIPS[2]), [-2]);
  for (const r of TRIPS) if (r.kind === "move") assert.ok(inRange(r.scene, r.start) && inRange(r.scene, r.target));
  assert.ok(RANGE.temp.min <= -9);
});
