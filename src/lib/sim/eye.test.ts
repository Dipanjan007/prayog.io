import assert from "node:assert/strict";
import { test } from "node:test";
import { CONDITIONS, eyeFocus, prismScene } from "./eye";

test("a normal eye focuses from 25 cm to infinity without glasses", () => {
  for (const d of [0.25, 1, 5, Infinity]) assert.equal(eyeFocus(CONDITIONS.normal, d, 0).sharp, true, `d=${d}`);
  assert.equal(eyeFocus(CONDITIONS.normal, 0.1, 0).focus, "behind");
});

test("myopia blurs far objects and a −0.5 D concave lens fixes it", () => {
  const far = eyeFocus(CONDITIONS.myopia, Infinity, 0);
  assert.equal(far.focus, "front");
  assert.equal(eyeFocus(CONDITIONS.myopia, Infinity, -0.5).sharp, true);
  assert.equal(eyeFocus(CONDITIONS.myopia, 0.25, 0).sharp, true);
});

test("hypermetropia blurs near objects and a +3 D convex lens fixes it", () => {
  assert.equal(eyeFocus(CONDITIONS.hypermetropia, 0.25, 0).focus, "behind");
  assert.equal(eyeFocus(CONDITIONS.hypermetropia, 0.25, 3).sharp, true);
  assert.equal(eyeFocus(CONDITIONS.hypermetropia, 1, 0).sharp, true);
});

test("a prism bends violet more than red", () => {
  for (const i of [40, 55, 70]) {
    const s = prismScene(i, false);
    const ang = (k: number) => Math.atan2(s.rays[k].path.dir.y, s.rays[k].path.dir.x);
    assert.ok(ang(6) < ang(0), `i=${i}: violet should be deviated further down`);
    assert.ok(s.spread > 0.5, `i=${i}: spread ${s.spread}`);
    // Every colour enters and leaves the prism: start, two faces, exit.
    for (const r of s.rays) assert.ok(r.path.points.length >= 3, `i=${i} ${r.name} points ${r.path.points.length}`);
  }
});

test("an upside-down second prism recombines the colours", () => {
  for (const i of [40, 55, 70]) {
    const s = prismScene(i, true);
    for (const r of s.rays) assert.ok(r.path.points.length >= 5, `i=${i} ${r.name} should pass through both prisms (${r.path.points.length})`);
    assert.ok(s.spread < 0.05, `i=${i}: spread ${s.spread}`);
  }
});
