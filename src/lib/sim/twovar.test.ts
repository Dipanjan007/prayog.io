import assert from "node:assert/strict";
import { test } from "node:test";
import { PUZZLES, lesson } from "../../content/lessons/two-variables";
import { COEF, GRID, TOTAL, countingSolutions, crossing, eqText, gridSolutions, isSolution, lhs, onGrid, ptText, snap, workText, xIntercept, yAt, yIntercept, type Eq } from "./twovar";

const shop: Eq = { a: 2, b: 3, c: 12 };

test("solutions of 2x + 3y = 12 and the line through them", () => {
  assert.ok(isSolution(shop, { x: 3, y: 2 }));
  assert.ok(!isSolution(shop, { x: 2, y: 3 }));
  assert.equal(lhs(shop, { x: 2, y: 3 }), 13);
  assert.ok(isSolution(shop, { x: 1.5, y: 3 }));
  assert.ok(isSolution(shop, { x: 9, y: -2 }));
  assert.ok(isSolution(shop, { x: 0.75, y: 3.5 }));
  assert.equal(yAt(shop, 3), 2);
  assert.equal(yAt({ a: 1, b: 0, c: 4 }, 1), null);
  // Every whole-number point on the grid that solves it lies on y = (c − ax) ÷ b.
  for (const p of gridSolutions(shop)) assert.equal(yAt(shop, p.x), p.y);
  assert.deepEqual(gridSolutions(shop), [
    { x: 0, y: 4 },
    { x: 3, y: 2 },
    { x: 6, y: 0 },
    { x: 9, y: -2 },
  ]);
});

test("intercepts", () => {
  assert.deepEqual(xIntercept(shop), { x: 6, y: 0 });
  assert.deepEqual(yIntercept(shop), { x: 0, y: 4 });
  assert.deepEqual(xIntercept({ a: 3, b: 4, c: 24 }), { x: 8, y: 0 });
  assert.deepEqual(yIntercept({ a: 3, b: 4, c: 24 }), { x: 0, y: 6 });
  assert.equal(xIntercept({ a: 0, b: 3, c: 12 }), null);
});

test("text uses real minus signs and brackets", () => {
  assert.equal(eqText(shop), "2x + 3y = 12");
  assert.equal(eqText({ a: 1, b: -1, c: 2 }), "x − y = 2");
  assert.equal(eqText({ a: 0, b: 3, c: 12 }), "3y = 12");
  assert.equal(eqText({ a: 20, b: 30, c: 120 }), "20x + 30y = 120");
  assert.equal(workText(shop, { x: 9, y: -2 }), "(2 × 9) + (3 × (−2))");
  assert.equal(ptText({ x: -1, y: 6 }), "(−1, 6)");
  assert.deepEqual(snap(2.6, -7), { x: 3, y: GRID.min });
});

test("two lines cross at one point", () => {
  assert.deepEqual(crossing({ a: 20, b: 30, c: 120 }, { a: 1, b: 1, c: 5 }), { x: 3, y: 2 });
  assert.equal(crossing(shop, { a: 4, b: 6, c: 12 }), null); // parallel
});

test("tasks can be done in the sim", () => {
  const vals = (r: { min: number; max: number }) => Array.from({ length: r.max - r.min + 1 }, (_, i) => r.min + i);
  assert.ok(vals(COEF).includes(2) && vals(COEF).includes(3) && vals(TOTAL).includes(12));
  // Three different solutions on the grid, and both intercepts are whole grid points.
  assert.ok(gridSolutions(shop).length >= 3);
  assert.ok(onGrid(xIntercept(shop)!) && onGrid(yIntercept(shop)!));
  // There is a point off the line.
  assert.ok(!isSolution(shop, { x: 0, y: 0 }));
});

test("each puzzle has exactly one grid point on both lines, and each line alone has others", () => {
  assert.equal(PUZZLES.length, 3);
  const answers = [
    { x: 3, y: 2 },
    { x: 4, y: 2 },
    { x: 4, y: 4 },
  ];
  PUZZLES.forEach((pz, i) => {
    const [e1, e2] = pz.eqs;
    const both = gridSolutions(e1).filter((p) => isSolution(e2, p));
    assert.deepEqual(both, [answers[i]], pz.name);
    assert.deepEqual(crossing(e1, e2), answers[i]);
    // Cross-checking matters: each condition alone allows another whole-number answer.
    assert.ok(countingSolutions(e1).length >= 2 && countingSolutions(e2).length >= 2, pz.name);
    // The brief quotes the numbers in the first equation.
    for (const n of [e1.a, e1.b, e1.c]) assert.ok(pz.brief.includes(`₹${n}`) || pz.brief.includes(`${n} runs`) || pz.brief.includes(n === 4 ? "fours" : "sixes"), `${pz.name}: ${n}`);
  });
});

test("prediction and quiz answers", () => {
  assert.equal(countingSolutions({ a: 20, b: 30, c: 120 }).length, 3);
  assert.equal(lesson.predict.options[lesson.predict.answer], "3 ways");
  const q = lesson.quiz;
  assert.equal(q[0].options[q[0].answer], ptText(gridSolutions(shop).find((p) => q[0].options.includes(ptText(p)))!));
  for (const o of q[0].options.filter((_, i) => i !== q[0].answer)) {
    const [x, y] = o.slice(1, -1).split(", ").map(Number);
    assert.ok(!isSolution(shop, { x, y }), o);
  }
  assert.equal(q[1].options[q[1].answer], ptText(xIntercept({ a: 3, b: 4, c: 24 })!));
  // 4x + 6y = 30 with y = 3.
  assert.equal(q[2].options[q[2].answer], `${(30 - 6 * 3) / 4}`);
  const notOn = q[3].options.filter((o) => {
    const [x, y] = o.slice(1, -1).replace("−", "-").split(", ").map(Number);
    return !isSolution({ a: 1, b: 1, c: 5 }, { x, y });
  });
  assert.deepEqual(notOn, [q[3].options[q[3].answer]]);
  assert.equal(q[4].options[q[4].answer], "Infinitely many");
  for (const x of q) assert.equal(x.options.length, 4);
});
