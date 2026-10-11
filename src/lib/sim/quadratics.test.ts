import assert from "node:assert/strict";
import { test } from "node:test";
import { ROOT_ROUNDS, lesson } from "../../content/lessons/quadratics";
import {
  A_VALUES,
  BREADTH,
  B_RANGE,
  C_RANGE,
  TARGETS,
  discriminant,
  evalQ,
  formatQuadratic,
  fromRoots,
  gardenArea,
  gardenBreadths,
  gardenEquation,
  hasRoots,
  meetsRound,
  rootCount,
  roots,
  vertex,
} from "./quadratics";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

const range = (r: { min: number; max: number; step: number }) => {
  const out: number[] = [];
  for (let v = r.min; v <= r.max + 1e-9; v += r.step) out.push(Math.round(v * 1000) / 1000);
  return out;
};

test("roots are where the curve meets the x-axis", () => {
  assert.deepEqual(roots(1, -5, 6), [2, 3]);
  for (const x of roots(1, -5, 6)) close(evalQ(1, -5, 6, x), 0);
  assert.deepEqual(roots(1, -4, 4), [2]);
  assert.deepEqual(roots(1, -4, 5), []);
  close(vertex(1, -4, 4).y, 0);
});

test("the discriminant counts the roots", () => {
  assert.equal(discriminant(1, -4, 4), 0);
  assert.equal(rootCount(1, -4, 3), 2);
  assert.equal(rootCount(1, -4, 4), 1);
  assert.equal(rootCount(1, -4, 5), 0);
  assert.equal(rootCount(-2, 1, 3), 2);
});

test("fromRoots builds (x − p)(x − q) and formatQuadratic writes it with real minus signs", () => {
  assert.deepEqual(fromRoots(2, 3), { a: 1, b: -5, c: 6 });
  assert.equal(formatQuadratic(1, -5, 6), "x² − 5x + 6");
  assert.equal(formatQuadratic(-0.5, 1, 0), "−0.5x² + x");
  assert.equal(formatQuadratic(2, 0, -8), "2x² − 8");
});

test("the slider ranges can show the lesson's curves", () => {
  assert.ok(!A_VALUES.includes(0));
  const bs = range(B_RANGE);
  const cs = range(C_RANGE);
  for (const [a, b, c] of [[1, -5, 6], [1, -4, 4], [1, -4, 5]]) assert.ok(A_VALUES.includes(a) && bs.includes(b) && cs.includes(c));
});

test("garden: 40 m of fence; 96 m² has two breadths, 100 m² one, 110 m² none", () => {
  close(gardenArea(8), 96);
  close(gardenArea(12), 96);
  close(gardenArea(10), 100);
  assert.deepEqual(gardenBreadths(96), [8, 12]);
  assert.deepEqual(gardenBreadths(100), [10]);
  assert.deepEqual(gardenBreadths(110), []);
  const e = gardenEquation(110);
  assert.equal(discriminant(e.a, e.b, e.c), -40);
  // The biggest area on the breadth slider is 100 m².
  assert.equal(Math.max(...range(BREADTH).map(gardenArea)), 100);
  // Every breadth answer for every target is on the slider.
  const xs = range(BREADTH);
  for (const A of TARGETS) for (const x of gardenBreadths(A)) assert.ok(xs.includes(x), `${A}: ${x}`);
});

test("each challenge round can be built with the sliders", () => {
  assert.equal(ROOT_ROUNDS.length, 3);
  const bs = range(B_RANGE);
  const cs = range(C_RANGE);
  for (const r of ROOT_ROUNDS) {
    const ok: string[] = [];
    for (const a of A_VALUES) for (const b of bs) for (const c of cs) if (meetsRound(a, b, c, r)) ok.push(`${a},${b},${c}`);
    assert.ok(ok.length > 0, r.name);
    const { a, b, c } = fromRoots(r.roots[0], r.roots[1], r.a ?? 1);
    assert.ok(meetsRound(a, b, c, r), r.name);
  }
  // The rangoli: x(x + 3) = 18 is x² + 3x − 18 = 0, breadth 3 m.
  assert.ok(hasRoots(1, 3, -18, 3, -6));
  assert.ok(!meetsRound(1, -6, 8, ROOT_ROUNDS[2]));
});

test("predict and quiz answers", () => {
  // Predict: 110 m² is impossible with 40 m of fence.
  assert.equal(gardenBreadths(110).length, 0);
  assert.equal(lesson.predict.answer, 2);
  const q = lesson.quiz;
  assert.equal(rootCount(2, -4, 3), 0);
  assert.equal(q[0].answer, 2);
  assert.deepEqual(roots(1, -7, 12), [3, 4]);
  assert.equal(q[1].options[q[1].answer], "3 and 4");
  assert.equal(discriminant(1, -6, 9), 0);
  assert.equal(q[2].options[q[2].answer], "9");
  assert.deepEqual(roots(1, 5, -84), [-12, 7]);
  assert.equal(q[3].options[q[3].answer], "7 m");
  assert.deepEqual(fromRoots(2, -3), { a: 1, b: 1, c: -6 });
  assert.equal(q[4].options[q[4].answer], `${formatQuadratic(1, 1, -6)} = 0`);
  for (const x of q) assert.equal(x.options.length, 4);
  assert.equal(lesson.quiz.length, 5);
});
