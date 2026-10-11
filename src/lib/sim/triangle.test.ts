import assert from "node:assert/strict";
import { test } from "node:test";
import { TRIANGLE_ORDERS } from "../../content/lessons/triangles";
import { anglesFromSides, angleAt, angleKind, matchesOrder, sideKind, stickGap, sticks, triangleAngles, wholeAngles } from "./triangle";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test("angle at a corner: a right angle and a straight line", () => {
  close(angleAt({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }), 90);
  close(angleAt({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 0 }), 180);
  close(angleAt({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }), 45);
});

test("the three angles of any triangle add up to 180°", () => {
  const shapes = [
    [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 3 }],
    [{ x: -2, y: 1 }, { x: 5, y: 0.3 }, { x: 1, y: 7 }],
    [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 9, y: 0.5 }],
  ];
  for (const [a, b, c] of shapes) {
    const [A, B, C] = triangleAngles(a, b, c);
    close(A + B + C, 180, 1e-9);
  }
});

test("triangle inequality: sticks make a triangle only when the two short ones are longer than the long one", () => {
  assert.equal(sticks(3, 4, 5), "triangle");
  assert.equal(sticks(3, 4, 7), "flat");
  assert.equal(sticks(3, 4, 8), "gap");
  assert.equal(sticks(8, 3, 4), "gap");
  close(stickGap(3, 4, 8), 1);
  close(stickGap(3, 4, 5), 0);
});

test("angles from sides: 3-4-5 has a right angle, an equilateral triangle has 60° corners", () => {
  const [A, B, C] = anglesFromSides(3, 4, 5);
  close(C, 90, 1e-9);
  close(A + B + C, 180);
  for (const x of anglesFromSides(6, 6, 6)) close(x, 60, 1e-9);
});

test("naming triangles by sides and by angles", () => {
  assert.equal(sideKind(5, 5, 5), "equilateral");
  assert.equal(sideKind(5, 5, 8), "isosceles");
  assert.equal(sideKind(4, 5, 6), "scalene");
  assert.equal(angleKind([30, 60, 90]), "right");
  assert.equal(angleKind([20, 40, 120]), "obtuse");
  assert.equal(angleKind([50, 60, 70]), "acute");
});

test("every challenge order is a real triangle whose angles add to 180°", () => {
  assert.equal(TRIANGLE_ORDERS.length, 3);
  for (const o of TRIANGLE_ORDERS) {
    close(o.angles[0] + o.angles[1] + o.angles[2], 180);
    assert.ok(o.angles[0] <= o.angles[1] && o.angles[1] <= o.angles[2], o.name);
    assert.ok(matchesOrder([...o.angles].reverse(), o));
    assert.ok(!matchesOrder([o.angles[0] + 5, o.angles[1], o.angles[2] - 5], o));
  }
});

test("whole-degree display angles always add up to 180°", () => {
  assert.deepEqual(wholeAngles([59.6, 60.2, 60.2]), [60, 60, 60]);
  assert.deepEqual(wholeAngles([33.4, 33.3, 113.3]), [34, 33, 113]);
  for (const [a, b] of [[10.5, 20.5], [44.9, 45.2], [0.3, 1.1]]) {
    const w = wholeAngles([a, b, 180 - a - b]);
    assert.equal(w[0] + w[1] + w[2], 180);
  }
});
