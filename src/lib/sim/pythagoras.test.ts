import assert from "node:assert/strict";
import { test } from "node:test";
import { RESCUES } from "../../content/lessons/pythagoras";
import { LADDERS, compareSquares, hypotenuse, isTriple, ladderAngle, ladderTop, leg, reachesSill, thirdSide, wholeHypotenuse } from "./pythagoras";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test("with a 90° corner the square on the long side equals the other two squares together", () => {
  close(thirdSide(3, 4, 90), 5);
  close(hypotenuse(5, 12), 13);
  close(leg(10, 6), 8);
  assert.ok(Number.isNaN(leg(5, 5)));
  for (const [a, b] of [[1, 1], [2, 7], [6, 6.5]]) assert.equal(compareSquares(a, b, thirdSide(a, b, 90)), "equal");
});

test("a sharper corner makes c² smaller than a² + b², a wider one makes it bigger", () => {
  assert.equal(compareSquares(3, 4, thirdSide(3, 4, 70)), "less");
  assert.equal(compareSquares(3, 4, thirdSide(3, 4, 110)), "more");
  close(thirdSide(5, 5, 60), 5); // equilateral
});

test("Baudhayana triples", () => {
  assert.ok(isTriple(3, 4, 5));
  assert.ok(isTriple(5, 12, 13));
  assert.ok(isTriple(8, 15, 17));
  assert.ok(!isTriple(4, 5, 6));
  assert.ok(wholeHypotenuse(6, 8));
  assert.ok(!wholeHypotenuse(2, 3));
});

test("ladder: a 10 m ladder with its foot 6 m out reaches 8 m up, and moving the foot out lowers the top", () => {
  close(ladderTop(10, 6), 8);
  close(ladderTop(5, 3), 4);
  assert.ok(ladderTop(10, 7) < ladderTop(10, 6));
  assert.equal(ladderTop(5, 6), 0);
  close(ladderAngle(2, 1), 60, 1e-9);
});

test("each rescue has exactly one ladder on the fire engine that rests on the sill", () => {
  assert.equal(RESCUES.length, 3);
  for (const r of RESCUES) {
    const ok = LADDERS.filter((L) => reachesSill(L, r));
    assert.equal(ok.length, 1, r.name);
    assert.ok(isTriple(r.d, r.h, ok[0]), `${r.name}: ${r.d}, ${r.h}, ${ok[0]}`);
  }
});
