import assert from "node:assert/strict";
import { test } from "node:test";
import { FRACTAL_ROUNDS, lesson } from "../../content/lessons/fractals";
import {
  DRAW_MAX,
  KOCH_SIDE,
  STEPS,
  checkCount,
  countAt,
  koch,
  kochArea,
  kochAreaLimit,
  kochPerimeter,
  kochSide,
  kochSides,
  kochStepOver,
  parseCount,
  polygonArea,
  polygonPerimeter,
  shapeOf,
  sierArea,
  sierHoles,
  sierPerimeter,
  sierTriangles,
  sierpinski,
  triArea,
} from "./fractals";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test("Sierpinski counts match the drawn shape", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(sierTriangles), [1, 3, 9, 27, 81, 243]);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(sierHoles), [0, 1, 4, 13, 40, 121]);
  for (let n = 0; n <= DRAW_MAX.sier; n++) {
    const tris = sierpinski(n);
    assert.equal(tris.length, sierTriangles(n));
    const area = tris.reduce((s, [a, b, c]) => s + Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2, 0);
    close(area, triArea(1) * sierArea(n));
    const edge = tris.reduce((s, [a, b]) => s + 3 * Math.hypot(b[0] - a[0], b[1] - a[1]), 0);
    close(edge, sierPerimeter(n));
    // Holes are 1 + 3 + 9 + ...
    let sum = 0;
    for (let k = 0; k < n; k++) sum += 3 ** k;
    assert.equal(sierHoles(n), sum);
  }
  close(sierArea(5), 0.2373046875);
  assert.equal(Math.round(sierArea(5) * 100), 24);
});

test("Koch counts, perimeter and area match the drawn shape", () => {
  assert.deepEqual([0, 1, 2, 3, 4].map(kochSides), [3, 12, 48, 192, 768]);
  assert.deepEqual([0, 1, 2, 3, 4].map((n) => kochPerimeter(n)), [81, 108, 144, 192, 256]);
  assert.equal(kochSide(3), 1);
  for (let n = 0; n <= DRAW_MAX.koch; n++) {
    const pts = koch(n);
    assert.equal(pts.length, kochSides(n));
    close(polygonPerimeter(pts) * KOCH_SIDE, kochPerimeter(n));
    close(polygonArea(pts) * KOCH_SIDE * KOCH_SIDE, kochArea(n));
  }
});

test("the perimeter grows without limit but the area stays under 8/5 of the start", () => {
  assert.equal(kochStepOver(1000), 9);
  assert.ok(kochStepOver(1000) <= STEPS.max);
  assert.equal(Math.round(kochPerimeter(9)), 1079);
  assert.equal(Math.round(kochArea(3)), 488);
  assert.equal(Math.round(kochArea(9)), 505);
  assert.equal(kochAreaLimit().toFixed(2), "505.07");
  assert.equal(triArea(KOCH_SIDE).toFixed(2), "315.67");
  for (let n = 0; n <= 60; n++) {
    assert.ok(kochArea(n) <= kochAreaLimit());
    if (n <= 20) assert.ok(kochArea(n) < kochAreaLimit());
    assert.ok(kochPerimeter(n + 1) > kochPerimeter(n));
  }
  // Past the distance to the Moon, 3,84,400 km, in cm.
  assert.ok(kochPerimeter(70) > 384400 * 1e5);
  // Fits in the circle round the starting triangle.
  const R = 1 / Math.sqrt(3);
  for (const [x, y] of koch(5)) assert.ok(Math.hypot(x - 0.5, y - R / 2) <= R + 1e-9);
});

test("challenge rounds ask for steps beyond the hint and accept typed answers", () => {
  assert.equal(FRACTAL_ROUNDS.length, 3);
  assert.deepEqual(FRACTAL_ROUNDS.map((r) => countAt(r.kind, r.step)), [729, 3072, 121]);
  for (const r of FRACTAL_ROUNDS) {
    assert.ok(r.step > 2 && r.step <= STEPS.max);
    assert.ok(r.step <= DRAW_MAX[shapeOf(r.kind)], "the answer gets drawn");
    const ans = countAt(r.kind, r.step);
    assert.ok(checkCount(String(ans), r));
    assert.ok(!checkCount(String(ans + 1), r));
  }
  assert.ok(checkCount("3,072", FRACTAL_ROUNDS[1]));
  assert.ok(Number.isNaN(parseCount("12.5")));
  assert.ok(Number.isNaN(parseCount("")));
});

test("lesson numbers and quiz answers", () => {
  const q = lesson.quiz;
  assert.equal(q.length, 5);
  for (const x of q) assert.equal(x.options.length, 4);
  assert.equal(q[0].options[q[0].answer], String(sierTriangles(3)));
  assert.equal(q[1].options[q[1].answer], String(kochSides(2)));
  assert.equal(q[2].options[q[2].answer], `${kochPerimeter(1, 9)} cm`);
  assert.equal(q[3].options[q[3].answer], "9/16");
  close(sierArea(2), 9 / 16);
  assert.equal(q[4].answer, 1);
  assert.equal(lesson.predict.answer, 1);
  const risky = /÷\s*[^\s()]+\s*[−+]/u;
  for (const f of [lesson.discovery.formula, ...lesson.ideas.map((i) => i.formula ?? "")]) assert.ok(!risky.test(f), f);
});
