import assert from "node:assert/strict";
import { test } from "node:test";
import * as P from "./oly-polygon";

const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

test("polygon: interior angles and their inverse", () => {
  assert.ok(near(P.interiorAngle(3), 60));
  assert.ok(near(P.interiorAngle(6), 120));
  for (const n of [5, 9, 12, 20]) assert.ok(near(P.sidesForInterior(P.interiorAngle(n)), n));
});

test("polygon: closing tiles at a point", () => {
  assert.ok(near(P.closingTile([12, 4]), 6));
  assert.ok(near(P.closingTile([4, 8]), 8));
  assert.ok(near(P.closingTile([3, 3, 3, 3]), 6));
});

test("polygon: the 2n-gon beats the n-gon by 180 ÷ n degrees", () => {
  for (const n of [3, 10, 15]) assert.ok(near(P.interiorAngle(2 * n) - P.interiorAngle(n), 180 / n));
  assert.ok(near(P.doublingSides(12), 15));
});

test("polygon: planPolygon", () => {
  assert.equal(P.planPolygon({ kind: "poly-regular", n: 9, target: 140, thing: "" }).outcome.ok, true);
  assert.equal(P.planPolygon({ kind: "poly-regular", n: 8, target: 140, thing: "" }).outcome.ok, false);
  assert.equal(P.planPolygon({ kind: "poly-regular", n: 2, target: 0, thing: "" }).outcome.ok, false);
  assert.equal(P.planPolygon({ kind: "poly-vertex", fixed: [12, 4], n: 6 }).outcome.ok, true);
  assert.match(P.planPolygon({ kind: "poly-vertex", fixed: [12, 4], n: 5 }).outcome.text, /gap/);
  assert.match(P.planPolygon({ kind: "poly-vertex", fixed: [12, 4], n: 8 }).outcome.text, /overlap/);
  assert.equal(P.planPolygon({ kind: "poly-pair", n: 15, diff: 12 }).outcome.ok, true);
  assert.equal(P.planPolygon({ kind: "poly-pair", n: 15.5, diff: 12 }).outcome.ok, false);
});
