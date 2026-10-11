import assert from "node:assert/strict";
import { test } from "node:test";
import { TARGETS, lesson } from "../../content/lessons/powers";
import {
  BASES,
  BIG_ITEMS,
  EXP,
  FOLDS,
  LANDMARKS,
  SCI_EXP,
  fmtLength,
  foldOk,
  foldsToReach,
  indian,
  isStandard,
  layers,
  mantissa,
  passed,
  powerValue,
  productPower,
  quotientChips,
  standardExponent,
  sup,
  thicknessMm,
} from "./powers";

const close = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);
const lm = (name: string) => LANDMARKS.find((l) => l.name === name)!;

test("each fold doubles the stack", () => {
  assert.equal(layers(0), 1);
  assert.equal(layers(10), 1024);
  close(thicknessMm(0), 0.1);
  close(thicknessMm(10), 102.4);
  for (let n = 0; n < FOLDS.max; n++) close(thicknessMm(n + 1) / thicknessMm(n), 2);
});

test("task:everest: 27 folds is the first to pass Everest", () => {
  const everest = lm("Mount Everest");
  assert.equal(foldsToReach(everest.mm), 27);
  assert.ok(thicknessMm(26) < everest.mm && thicknessMm(27) >= everest.mm);
  close(thicknessMm(26) / 1e6, 6.7108864);
  close(thicknessMm(27) / 1e6, 13.4217728);
  assert.ok(layers(27) > 13e7 && layers(27) < 14e7, "more than 13 crore layers");
  assert.equal(passed(27)?.name, "Mount Everest");
  assert.equal(passed(26)?.name, "the Statue of Unity");
});

test("task:moon and the predict: 42 folds reach the Moon, 41 do not", () => {
  const moon = lm("the Moon");
  assert.equal(foldsToReach(moon.mm), 42);
  assert.equal(Math.round(thicknessMm(42) / 1e6), 439805);
  assert.equal(Math.round(thicknessMm(41) / 1e6), 219902);
  assert.ok(thicknessMm(42) - thicknessMm(41) > moon.mm / 2, "the last fold adds more than half the way");
  assert.ok(42 <= FOLDS.max);
  assert.equal(lesson.predict.options[lesson.predict.answer], "Thick enough to reach the Moon");
});

test("landmarks are in order and far enough apart on the log ruler", () => {
  for (let i = 1; i < LANDMARKS.length; i++) assert.ok(Math.log10(LANDMARKS[i].mm) - Math.log10(LANDMARKS[i - 1].mm) > 1.2);
  assert.equal(foldsToReach(lm("a notebook").mm), 7);
  assert.equal(foldsToReach(lm("you").mm), 14);
  assert.equal(foldsToReach(lm("the Statue of Unity").mm), 21);
  assert.equal(foldsToReach(lm("the Space Station").mm), 32);
});

test("lengths read well", () => {
  assert.equal(fmtLength(0.1), "0.1 mm");
  assert.equal(fmtLength(102.4), "10.2 cm");
  assert.equal(fmtLength(thicknessMm(27)), "13.4 km");
  assert.equal(fmtLength(thicknessMm(42)), "4,39,805 km");
  assert.equal(indian(384400), "3,84,400");
  assert.equal(indian(1_400_000_000), "1,40,00,00,000");
  assert.equal(indian(999), "999");
  assert.equal(sup(10), "¹⁰");
});

test("task:laws: multiplying adds exponents, and 2¹⁰ splits several ways inside the controls", () => {
  assert.ok(BASES.includes(2));
  for (const a of BASES) for (let m = EXP.min; m <= EXP.max; m++) for (let n = EXP.min; n <= EXP.max; n++) assert.equal(a ** m * a ** n, a ** productPower(m, n));
  const ways = [];
  for (let m = EXP.min; m <= EXP.max; m++) for (let n = m; n <= EXP.max; n++) if (productPower(m, n) === 10) ways.push([m, n]);
  assert.ok(ways.length >= 2, "two different ways exist");
  assert.equal(2 ** 3 * 2 ** 7, 1024);
  assert.ok(Number.isSafeInteger(10 ** (2 * EXP.max)) || 10 ** (2 * EXP.max) === 1e16);
});

test("task:zero: dividing subtracts, and equal powers leave 1", () => {
  assert.deepEqual(quotientChips(5, 2), { cancel: 2, top: 3, bottom: 0, power: 3 });
  assert.deepEqual(quotientChips(2, 5), { cancel: 2, top: 0, bottom: 3, power: -3 });
  const q = quotientChips(4, 4);
  assert.equal(q.power, 0);
  assert.deepEqual(powerValue(2, q.power), { top: 1, bottom: 1 });
  assert.deepEqual(powerValue(2, -3), { top: 1, bottom: 8 });
  for (const a of BASES) for (let m = 0; m <= EXP.max; m++) for (let n = 0; n <= EXP.max; n++) {
    const v = powerValue(a, quotientChips(m, n).power);
    close(v.top / v.bottom, a ** m / a ** n, 1e-9 * (a ** m / a ** n));
  }
});

test("task:sci: every big number can be put into standard form with the controls", () => {
  assert.equal(mantissa(384400, 5), "3.844");
  assert.equal(mantissa(384400, 2), "3844");
  assert.equal(mantissa(384400, 0), "384400");
  assert.equal(mantissa(384400, 7), "0.03844");
  assert.equal(mantissa(1_400_000_000, 9), "1.4");
  assert.equal(mantissa(150_000_000, 8), "1.5");
  assert.equal(mantissa(8849, 3), "8.849");
  assert.equal(mantissa(300000, 5), "3");
  assert.ok(BIG_ITEMS.length >= 2);
  for (const it of BIG_ITEMS) {
    const e = standardExponent(it.value);
    assert.ok(e >= SCI_EXP.min && e <= SCI_EXP.max, it.id);
    const m = Number(mantissa(it.value, e));
    assert.ok(m >= 1 && m < 10, it.id);
    close(m * 10 ** e, it.value, 1e-3);
    assert.ok(isStandard(it.value, e) && !isStandard(it.value, e - 1) && !isStandard(it.value, e + 1));
  }
  assert.equal(standardExponent(384400), 5);
  assert.equal(standardExponent(1_400_000_000), 9);
});

test("each challenge target has exactly one right answer within the fold controls", () => {
  assert.equal(TARGETS.length, 3);
  const expected = [20, 29, 39];
  TARGETS.forEach((t, i) => {
    const ok = [];
    for (let n = FOLDS.min; n <= FOLDS.max; n++) if (foldOk(t, n)) ok.push(n);
    assert.deepEqual(ok, [expected[i]], t.name);
    assert.ok(thicknessMm(ok[0]) >= t.mm && thicknessMm(ok[0] - 1) < t.mm);
  });
});

test("quiz answers", () => {
  const q = lesson.quiz;
  assert.equal(q[0].options[q[0].answer], `2${sup(productPower(5, 3))}`);
  assert.equal(2 ** 8, 256);
  assert.equal(q[1].options[q[1].answer], `${mantissa(384400, standardExponent(384400))} × 10${sup(standardExponent(384400))} km`);
  assert.equal(q[2].options[q[2].answer], String(7 ** 0));
  close(thicknessMm(10), 102.4);
  assert.equal(q[3].options[q[3].answer], "About 10 cm");
  assert.ok(2 ** 10 > 10 ** 3);
  assert.equal(q[4].options[q[4].answer], "2¹⁰");
});

test("lesson shape and formula style", () => {
  assert.equal(lesson.subject, "maths");
  assert.ok(lesson.tasks.length >= 3 && lesson.tasks.length <= 5);
  assert.equal(lesson.quiz.length, 5);
  for (const q of lesson.quiz) assert.equal(q.options.length, 4);
  assert.equal(lesson.predict.options.length, 3);
  assert.ok(lesson.symbols.length > 0);
  const risky = /÷\s*[^\s()]+\s*[−+]/u;
  for (const f of [lesson.discovery.formula, ...lesson.ideas.map((i) => i.formula ?? "")]) assert.ok(!risky.test(f), f);
});
