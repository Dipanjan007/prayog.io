import assert from "node:assert/strict";
import { test } from "node:test";
import { ORDERS, lesson } from "../../content/lessons/quadrilaterals";
import { START, alsoNames, angles, brahmagupta, classify, diagonals2, isConvex, lenText, onBoard, orderHint, orderOk, properties, roundAngles, type Pt } from "./quad";

const Q = (...xy: number[]): Pt[] => [0, 2, 4, 6].map((i) => ({ x: xy[i], y: xy[i + 1] }));
const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);
const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

const SQUARE = Q(2, 2, 6, 2, 6, 6, 2, 6);
const RECT = Q(1, 1, 8, 1, 8, 4, 1, 4);
const RHOMBUS = Q(4, 1, 6, 4, 4, 7, 2, 4);
const PARA = Q(1, 1, 6, 1, 8, 4, 3, 4);
const KITE = Q(3, 0, 5, 4, 3, 6, 1, 4);
const TRAP = Q(1, 1, 9, 1, 6, 5, 3, 5);
const DART = Q(1, 1, 5, 3, 9, 1, 5, 7);

test("names come from the properties", () => {
  assert.equal(classify(SQUARE), "square");
  assert.equal(classify(Q(5, 0, 8, 4, 4, 7, 1, 3)), "square"); // tilted square
  assert.equal(classify(RECT), "rectangle");
  assert.equal(classify(Q(2, 1, 3, 3, 7, 1, 6, -1)), "rectangle"); // tilted: sides (1,2) and (4,−2)
  assert.equal(classify(RHOMBUS), "rhombus");
  assert.equal(classify(PARA), "parallelogram");
  assert.equal(classify(KITE), "kite");
  assert.equal(classify(TRAP), "trapezium");
  assert.equal(classify(START), "quadrilateral");
  assert.equal(classify(DART), "concave");
  assert.equal(classify(Q(1, 1, 5, 5, 5, 1, 1, 5)), "crossed");
  assert.equal(classify(Q(1, 1, 3, 1, 5, 1, 3, 4)), "flat");
  assert.deepEqual(alsoNames("square"), ["rectangle", "rhombus", "parallelogram", "kite"]);
});

test("the four angles always add to 360°, and the rounded ones do too", () => {
  for (const q of [SQUARE, RECT, RHOMBUS, PARA, KITE, TRAP, DART, START]) {
    close(sum(angles(q)), 360);
    assert.equal(sum(roundAngles(angles(q))), 360);
  }
  // Every proper quadrilateral on a small board.
  let n = 0;
  for (let i = 0; i < 3000; i++) {
    const r = Q(...Array.from({ length: 8 }, (_, k) => (i * 7 + k * 13 + ((i * k) % 11)) % 9));
    if (classify(r) === "crossed" || classify(r) === "flat") continue;
    close(sum(angles(r)), 360, 1e-6);
    assert.equal(sum(roundAngles(angles(r))), 360);
    n++;
  }
  assert.ok(n > 100);
  // A dart has one angle over 180°.
  assert.ok(angles(DART).some((a) => a > 180));
  assert.deepEqual(roundAngles([89.6, 90.3, 90.3, 89.8]), [90, 90, 90, 90]);
});

test("properties of the special shapes", () => {
  const r = properties(RECT);
  assert.ok(r.diagonalsEqual && r.diagonalsBisect && !r.diagonalsPerpendicular && r.rightAngles === 4);
  const h = properties(RHOMBUS);
  assert.ok(h.allSidesEqual && h.diagonalsPerpendicular && h.diagonalsBisect && !h.diagonalsEqual && h.rightAngles === 0);
  const p = properties(PARA);
  assert.ok(p.oppositeSidesEqual && p.diagonalsBisect && !p.diagonalsEqual && p.parallelPairs === 2);
  const k = properties(KITE);
  assert.ok(k.kiteSides && k.diagonalsPerpendicular && !k.diagonalsBisect);
  assert.equal(properties(TRAP).parallelPairs, 1);
  assert.ok(isConvex(TRAP) && !isConvex(DART));
  // Parallelogram: neighbouring angles add to 180°, opposite angles are equal.
  const a = angles(PARA);
  close(a[0] + a[1], 180);
  close(a[0], a[2]);
});

test("every challenge order can be made on the board", () => {
  const answers = [Q(1, 1, 6, 1, 8, 4, 3, 4), Q(3, 0, 5, 4, 3, 6, 1, 4), Q(1, 1, 5, 1, 5, 4, 1, 4)];
  assert.equal(ORDERS.length, 3);
  ORDERS.forEach((o, i) => {
    assert.ok(answers[i].every(onBoard));
    assert.ok(orderOk(o, answers[i]), o.name);
    assert.ok(!orderOk(o, START));
  });
  // A tilted rectangle on the pegs also fits the window.
  const tilted = Q(2, 2, 3, 4, 7, 2, 6, 0);
  assert.ok(tilted.every(onBoard) && orderOk(ORDERS[2], tilted));
  // A rhombus with 4 and 6 diagonals is not what the kite maker asked for.
  assert.ok(!orderOk(ORDERS[1], Q(3, 0, 5, 3, 3, 6, 1, 3)));
  assert.match(orderHint(ORDERS[0], RECT), /rectangle, not a parallelogram/);
  assert.match(orderHint(ORDERS[2], Q(1, 1, 7, 1, 7, 4, 1, 4)), /diagonals are 6.71 and 6.71/);
});

test("lengths and Brahmagupta's rule", () => {
  assert.equal(lenText(25), "5");
  assert.equal(lenText(13), "3.61");
  assert.deepEqual(diagonals2(RECT), [58, 58]);
  close(brahmagupta(3, 4, 3, 4), 12);
  close(brahmagupta(3, 4, 5, 0), 6); // one side zero: the 3-4-5 triangle
});

test("quiz answers", () => {
  const q = lesson.quiz;
  assert.equal(q[0].options[q[0].answer], `${360 - (75 + 90 + 110)}°`);
  assert.equal(q[1].answer, 2);
  assert.equal(q[2].options[q[2].answer], "Rectangle");
  assert.equal(q[3].options[q[3].answer], `${4 * (360 / 10)}°`);
  assert.equal(q[4].options[q[4].answer], `${180 - 70}°`);
  for (const x of q) assert.equal(x.options.length, 4);
  assert.equal(lesson.predict.options[lesson.predict.answer], "Is always 360°");
});

test("lesson shape", () => {
  assert.equal(lesson.predict.options.length, 3);
  assert.ok(lesson.tasks.length >= 3 && lesson.tasks.length <= 5);
  assert.equal(lesson.quiz.length, 5);
  assert.ok(lesson.symbols.length > 0);
  const risky = /÷\s*[^\s()]+\s*[−+]/u;
  for (const f of [lesson.discovery.formula, ...lesson.ideas.map((i) => i.formula ?? "")]) assert.ok(!risky.test(f), f);
});
