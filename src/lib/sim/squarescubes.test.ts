import assert from "node:assert/strict";
import { test } from "node:test";
import { ORDERS, lesson } from "../../content/lessons/squares-cubes";
import {
  CUBE_EDGE,
  ORDER_SIDE,
  SUM_SIDE,
  TILES,
  cubeFit,
  cubeSumWays,
  icbrt,
  isPerfectCube,
  isPerfectSquare,
  isqrt,
  oddLayers,
  orderOk,
  orderSide,
  piecesFor,
  smallestTaxicab,
  sqrtBetween,
  squareEndings,
  squareFit,
  sumOfOdds,
} from "./squarescubes";

test("whole-number roots", () => {
  assert.equal(isqrt(50), 7);
  assert.equal(isqrt(49), 7);
  assert.equal(isqrt(0), 0);
  assert.equal(icbrt(64), 4);
  assert.equal(icbrt(63), 3);
  assert.equal(icbrt(1000), 10);
  for (let n = 0; n <= 400; n++) {
    assert.equal(isqrt(n * n), n);
    assert.equal(icbrt(n ** 3), n);
  }
});

test("fitting tiles: perfect squares leave nothing over", () => {
  const perfect = [];
  for (let N = TILES.min; N <= TILES.max; N++) if (squareFit(N).left === 0) perfect.push(N);
  assert.deepEqual(perfect, [1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144]);
  assert.ok(perfect.filter((N) => N > 1).length >= 3, "task:perfect is doable");
  assert.ok(isPerfectSquare(196) && !isPerfectSquare(200));
});

test("task:root — 50 tiles make a 7 × 7 square with 1 left, so 7 < √50 < 8", () => {
  assert.deepEqual(squareFit(50), { side: 7, used: 49, left: 1, toNext: 14 });
  assert.deepEqual(sqrtBetween(50), [7, 8]);
  assert.ok(Math.abs(Math.sqrt(50) - 7.07) < 0.005);
  assert.ok(50 <= TILES.max);
});

test("task:odd — odd layers of a square add up to n²", () => {
  assert.deepEqual(oddLayers(5), [1, 3, 5, 7, 9]);
  assert.equal(sumOfOdds(5), 25);
  for (let n = 1; n <= 30; n++) assert.equal(sumOfOdds(n), n * n);
  assert.equal(sumOfOdds(10), 100); // predict
  assert.equal(lesson.predict.options[lesson.predict.answer], String(sumOfOdds(10)));
});

test("task:cube — a 4-edge cube has 64 unit cubes, and 64 is a square too", () => {
  assert.equal(piecesFor("cube", 4), 64);
  assert.ok(isPerfectCube(64) && isPerfectSquare(64));
  assert.ok(4 >= CUBE_EDGE.min && 4 <= CUBE_EDGE.max);
});

test("task:taxi — 1729 is the smallest sum of two cubes in two ways, and both pairs fit the sliders", () => {
  assert.deepEqual(cubeSumWays(1729), [
    [1, 12],
    [9, 10],
  ]);
  assert.equal(smallestTaxicab(), 1729);
  for (const [a, b] of cubeSumWays(1729)) assert.ok(a >= SUM_SIDE.min && b <= SUM_SIDE.max);
});

test("squares only end in 0, 1, 4, 5, 6 or 9", () => {
  assert.deepEqual(squareEndings(), [0, 1, 4, 5, 6, 9]);
});

test("every build order is solvable with the challenge controls and has one right side", () => {
  assert.equal(ORDERS.length, 3);
  const expected = [9, 14, 7];
  ORDERS.forEach((o, i) => {
    const ok = [];
    for (let n = ORDER_SIDE.min; n <= ORDER_SIDE.max; n++) if (orderOk(o, n)) ok.push(n);
    assert.deepEqual(ok, [expected[i]], o.name);
    assert.equal(orderSide(o), expected[i]);
    assert.ok(piecesFor(o.kind, ok[0]) <= o.total && piecesFor(o.kind, ok[0] + 1) > o.total);
  });
  assert.deepEqual(cubeFit(500), { side: 7, used: 343, left: 157, toNext: 12 });
});

test("quiz answers", () => {
  const q = lesson.quiz;
  assert.equal(q[0].options[q[0].answer], String(isqrt(196)));
  assert.equal(isqrt(196) ** 2, 196);
  const notSquare = q[1].options.filter((o) => !isPerfectSquare(Number(o.replace(/,/g, ""))));
  assert.deepEqual(notSquare, [q[1].options[q[1].answer]]);
  assert.equal(q[2].options[q[2].answer], String(sumOfOdds(12)));
  assert.equal(oddLayers(12).at(-1), 23);
  assert.equal(q[3].options[q[3].answer], String(piecesFor("cube", 6)));
  assert.equal(q[4].options[q[4].answer], String(squareFit(90).toNext));
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
  const [, x, y] = lesson.discovery.formula.match(/1³ \+ (\d+)³ = 9³ \+ (\d+)³/)!;
  assert.equal(1 + Number(x) ** 3, 9 ** 3 + Number(y) ** 3);
});
