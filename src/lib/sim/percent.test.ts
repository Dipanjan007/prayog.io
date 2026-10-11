import assert from "node:assert/strict";
import { test } from "node:test";
import { GOALS, lesson } from "../../content/lessons/percentages";
import {
  DISCOUNT,
  GST_RATES,
  ITEMS,
  UPDOWN,
  bill,
  exactTotalScaled,
  goalItem,
  goalOk,
  indian,
  percentChange,
  percentDecimal,
  percentFraction,
  percentOf,
  rupees,
  tidy,
  undoDecrease,
  upDown,
} from "./percent";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);
const discounts = () => {
  const out: number[] = [];
  for (let d = DISCOUNT.min; d <= DISCOUNT.max; d += DISCOUNT.step) out.push(d);
  return out;
};

test("task:grid: 25%, 50% and 75% are quarter, half and three quarters", () => {
  assert.deepEqual(percentFraction(25), { num: 1, den: 4 });
  assert.deepEqual(percentFraction(50), { num: 1, den: 2 });
  assert.deepEqual(percentFraction(75), { num: 3, den: 4 });
  assert.deepEqual(percentFraction(20), { num: 1, den: 5 });
  assert.deepEqual(percentFraction(10), { num: 1, den: 10 });
  assert.deepEqual(percentFraction(100), { num: 1, den: 1 });
  assert.deepEqual(percentFraction(0), { num: 0, den: 1 });
  assert.equal(percentDecimal(25), "0.25");
  assert.equal(percentDecimal(5), "0.05");
  assert.equal(percentDecimal(50), "0.5");
  assert.equal(percentDecimal(100), "1");
  for (let p = 0; p <= 100; p++) close(Number(percentDecimal(p)), p / 100);
});

test("money formats in Indian style", () => {
  assert.equal(rupees(212400), "₹2,124");
  assert.equal(rupees(9650), "₹96.50");
  assert.equal(rupees(-20000), "−₹200");
  assert.equal(indian(123456), "1,23,456");
});

test("task:sale: 25% off the ₹800 bag makes ₹600, and it is the only discount that does", () => {
  const bag = ITEMS.find((i) => i.id === "bag")!;
  assert.equal(bag.price, 800);
  const ok = discounts().filter((d) => bill(bag.price, d, 0).total === 60000);
  assert.deepEqual(ok, [25]);
  assert.equal(percentOf(25, 800), 200);
  assert.ok(GST_RATES.includes(0));
});

test("task:order: discount-then-GST equals GST-then-discount for every setting in the sim", () => {
  for (const it of ITEMS)
    for (const d of discounts())
      for (const g of GST_RATES) {
        const a = bill(it.price, d, g, "discount-first");
        const b = bill(it.price, d, g, "gst-first");
        assert.equal(a.total, b.total, `${it.id} ${d} ${g}`);
        // No rounding needed: every line is a whole number of paise.
        assert.equal(a.total * 10000, exactTotalScaled(it.price, d, g));
      }
  assert.equal(bill(2000, 10, 18).total, 212400);
});

test("task:updown and the predict: +20% then −20% gives 96", () => {
  const r = upDown(UPDOWN.start, 20, 20);
  close(r.afterUp, 120);
  close(r.end, 96);
  close(r.change, -4);
  assert.equal(lesson.predict.options[lesson.predict.answer], `₹${tidy(r.end)}`);
  close(percentOf(20, 100), 20);
  close(percentOf(20, 120), 24);
  for (const p of [20, 25]) assert.ok(p >= UPDOWN.min && p <= UPDOWN.max && p % UPDOWN.step === 0);
});

test("task:undo: after +25%, a 20% decrease brings ₹100 back, and it is the only one on the slider", () => {
  close(undoDecrease(25), 20);
  const ok: number[] = [];
  for (let d = UPDOWN.min; d <= UPDOWN.max; d += UPDOWN.step) if (Math.abs(upDown(100, 25, d).end - 100) < 1e-9) ok.push(d);
  assert.deepEqual(ok, [20]);
  close(percentOf(20, 125), 25);
});

test("each challenge bill has exactly one discount that hits it", () => {
  assert.equal(GOALS.length, 3);
  const expected = [15, 10, 25];
  GOALS.forEach((g, i) => {
    assert.ok(GST_RATES.includes(g.gst as (typeof GST_RATES)[number]));
    assert.ok(goalItem(g));
    const ok = discounts().filter((d) => goalOk(g, d));
    assert.deepEqual(ok, [expected[i]], g.name);
    assert.equal(bill(goalItem(g).price, ok[0], g.gst).total, g.target * 100);
  });
});

test("ideas and discovery numbers", () => {
  close(2000 * 0.9 * 1.18, 2124, 1e-6);
  close(100 * 1.2 * 0.8, 96, 1e-9);
  close(percentChange(40, 50), 25);
  close(percentChange(50, 40), -20);
  close(percentOf(18, 2000), 360);
});

test("quiz answers", () => {
  const q = lesson.quiz;
  const f = percentFraction(35);
  assert.equal(q[0].options[q[0].answer], `${f.num}/${f.den}`);
  assert.equal(q[1].options[q[1].answer], rupees(bill(1500, 20, 0).total));
  assert.equal(q[2].options[q[2].answer], rupees(bill(500, 0, 5).total));
  close(upDown(100, 10, 10).end, 99);
  assert.equal(q[3].options[q[3].answer], "1% less than before");
  assert.equal(q[4].options[q[4].answer], `${percentChange(40, 50)}%`);
});

test("lesson shape and formula style", () => {
  assert.equal(lesson.subject, "maths");
  assert.ok(lesson.tasks.length >= 3 && lesson.tasks.length <= 5);
  assert.equal(lesson.quiz.length, 5);
  for (const q of lesson.quiz) assert.equal(q.options.length, 4);
  assert.equal(lesson.predict.options.length, 3);
  assert.ok(lesson.symbols.length > 0);
  const risky = /÷\s*[^\s()]+\s*[−+]/u;
  for (const fm of [lesson.discovery.formula, ...lesson.ideas.map((i) => i.formula ?? "")]) assert.ok(!risky.test(fm), fm);
});
