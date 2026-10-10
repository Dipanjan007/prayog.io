import assert from "node:assert/strict";
import { test } from "node:test";
import * as K from "./oly-count";

test("count: listings agree with the counting formulas", () => {
  assert.equal(K.orderedPairs(["a", "b", "c", "d", "e", "f"]).length, 6 * 5);
  for (const n of [2, 5, 10]) assert.equal(K.unorderedPairs(n).length, K.choose(n, 2));
  assert.equal(K.gridRoutes(5, 4).length, K.choose(9, 4));
  // Routes through (2, 2): C(4, 2) × C(5, 2) = 60 of them.
  assert.equal(K.gridRoutes(5, 4, [2, 2]).length, 126 - 60);
  assert.ok(K.gridRoutes(3, 2).every((r) => r.path!.length === 5));
  assert.equal(K.rectangles(36, 2).length, 7);
  assert.equal(K.sizeForCount((n) => K.unorderedPairs(n).length, 45), 10);
  assert.ok(Number.isNaN(K.sizeForCount((n) => K.unorderedPairs(n).length, 44, 50)));
});

test("count: outcome grids give the textbook probabilities", () => {
  const even = K.diceGrid((a, b) => (a * b) % 2 === 0);
  assert.equal(K.chanceOf(even.cells).p, 27 / 36);
  const bag = K.drawTwoGrid(["A1", "A2", "B1"], (a, b) => a[0] === b[0]);
  assert.deepEqual([K.chanceOf(bag.cells).fav, K.chanceOf(bag.cells).total], [2, 6]);
  const toss = K.tossGrid(3, 4, (s) => s.includes("WW"));
  assert.equal(toss.cells.length, 8);
  assert.equal(K.chanceOf(toss.cells).fav, 3);
});

test("count: planCount fills slots, and only the exact count passes", () => {
  const items = K.unorderedPairs(4);
  const scene = (slots: number) => ({ kind: "count-list" as const, items, slots, slotsFrom: "answer" as const, word: ["pair", "pairs"] as [string, string], heading: "" });
  assert.equal(K.planCount(scene(6)).outcome.ok, true);
  assert.equal(K.planCount(scene(5)).outcome.ok, false);
  assert.equal(K.planCount(scene(7)).outcome.ok, false);
  assert.equal(K.planCount(scene(6.5)).outcome.ok, false);
  assert.equal(K.planCount({ ...scene(6), invalid: "nope" }).outcome.text, "nope");
  const g = K.diceGrid((a, b) => a === b);
  const chance = (p: number) => ({ kind: "count-chance" as const, ...g, event: "a double", p });
  assert.equal(K.planCount(chance(1 / 6)).outcome.ok, true);
  assert.equal(K.planCount(chance(0.2)).outcome.ok, false);
});
