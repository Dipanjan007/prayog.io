import assert from "node:assert/strict";
import { test } from "node:test";
import * as T from "./oly-triangle";

const near = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

test("triangle: Pythagoras and map distance", () => {
  assert.ok(near(T.hypot2(5, 12), 13));
  assert.ok(near(T.distance([-2, 3], [10, -2]), 13));
});

test("triangle: a snapped pole lands where its break height says", () => {
  const x = T.breakHeight(16, 8);
  assert.ok(near(x, 6));
  assert.ok(near(T.landingDistance(16, x), 8));
  assert.ok(Number.isNaN(T.landingDistance(16, 9)), "top part too short to reach the ground");
});

test("triangle: crossing wires meet at (h1 × h2) ÷ (h1 + h2), whatever the gap", () => {
  // Check with the two straight lines for two different gaps.
  for (const gap of [4, 10, 25]) {
    // Line 1 from (0, 12) to (gap, 0); line 2 from (0, 0) to (gap, 18).
    const x = gap / (1 + 18 / 12);
    const y = (18 * x) / gap;
    assert.ok(near(y, T.crossHeight(12, 18)));
  }
});

test("triangle: tower heights from angles", () => {
  assert.ok(near(T.towerHeight(10, 45, 1.5), 11.5));
  const h = T.towerFromTwoAngles(30, 60, 60);
  assert.ok(near(h, 30 * Math.sqrt(3)));
  assert.ok(near(T.distanceForAngle(h, 30) - T.distanceForAngle(h, 60), 60));
});

test("triangle: planTriangle passes only the right value", () => {
  const ok = (s: T.TriangleScene) => T.planTriangle(s).outcome.ok;
  assert.ok(ok({ kind: "tri-ladder", foot: 2.5, target: 6, L: 6.5 }));
  assert.ok(!ok({ kind: "tri-ladder", foot: 2.5, target: 6, L: 7 }));
  assert.ok(!ok({ kind: "tri-ladder", foot: 2.5, target: 6, L: 2 }));
  assert.ok(ok({ kind: "tri-bamboo", total: 16, mark: 8, x: 6 }));
  assert.ok(!ok({ kind: "tri-bamboo", total: 16, mark: 8, x: 10 }));
  assert.ok(ok({ kind: "tri-cross", h1: 12, h2: 18, gap: 10, y: 7.2 }));
  assert.ok(!ok({ kind: "tri-cross", h1: 12, h2: 18, gap: 10, y: 7.5 }));
  const map = { kind: "tri-map" as const, from: { name: "A", at: [0, 0] as [number, number] }, to: { name: "B", at: [3, 4] as [number, number] }, unit: "km" };
  assert.ok(ok({ ...map, L: 5 }));
  assert.ok(!ok({ ...map, L: 7 }));
  assert.ok(ok({ kind: "tri-tower", dist: 10, eye: 1.5, angle: 45, h: 11.5, what: "tower" }));
  assert.ok(ok({ kind: "tri-tower2", a1: 30, a2: 60, gap: 60, h: 30 * Math.sqrt(3), what: "tower" }));
  assert.ok(!ok({ kind: "tri-tower2", a1: 30, a2: 60, gap: 60, h: 50, what: "tower" }));
});
