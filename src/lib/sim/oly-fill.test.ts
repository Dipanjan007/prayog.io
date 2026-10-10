import assert from "node:assert/strict";
import { test } from "node:test";
import * as F from "./oly-fill";

const REGIONS: F.Region[] = [
  { type: "ring", R: 21, r: 14 },
  { type: "square-minus-circle", s: 28 },
  { type: "leaf", s: 14 },
];

test("fill: formula areas match a grid count of the actual shape", () => {
  for (const r of REGIONS) {
    const exact = F.regionArea(r);
    assert.ok(Math.abs(F.gridArea(r) - exact) <= 0.005 * exact, `${r.type}: ${F.gridArea(r)} vs ${exact}`);
  }
});

test("fill: with π = 22/7 the textbook answers are whole numbers", () => {
  assert.equal(Math.round(F.regionArea(REGIONS[0], 22 / 7) * 1e9) / 1e9, 770);
  assert.equal(Math.round(F.regionArea(REGIONS[1], 22 / 7) * 1e9) / 1e9, 168);
  assert.equal(Math.round(F.regionArea(REGIONS[2], 22 / 7) * 1e9) / 1e9, 112);
});

test("fill: fill levels rise with the fraction poured", () => {
  const lv = F.fillLevels(REGIONS[0], 60);
  assert.ok(F.levelFor(lv, 0.25) < F.levelFor(lv, 0.75));
  assert.equal(F.levelFor(lv, 0), -Infinity);
  assert.equal(F.levelFor(lv, 1), Infinity);
});

test("fill: planFill passes only the exact area", () => {
  const scene = (amount: number): F.FillScene => ({ kind: "fill-pour", region: REGIONS[0], pi: 22 / 7, amount, unit: "cm²", stuff: "powder", colour: "red" });
  assert.equal(F.planFill(scene(770)).outcome.ok, true);
  assert.match(F.planFill(scene(700)).outcome.text, /bare/);
  assert.match(F.planFill(scene(800)).outcome.text, /spills/);
});
