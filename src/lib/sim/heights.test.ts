import assert from "node:assert/strict";
import { test } from "node:test";
import { DIST, EYE, MYSTERIES, TAN, TOWERS, closeEnough, depression, distanceFor, heightFrom, topElevation } from "./heights";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test("tan table: tan 30° = 1 ÷ √3, tan 45° = 1, tan 60° = √3", () => {
  close(TAN[30], Math.tan(Math.PI / 6));
  close(TAN[45], 1);
  close(TAN[60], Math.tan(Math.PI / 3));
});

test("at 45° the height above your eye equals your distance", () => {
  close(topElevation(21.5, 20), 45);
  close(heightFrom(20, 45), 21.5);
  close(distanceFor(21.5, 45), 20);
});

test("walking closer makes the angle of elevation bigger", () => {
  assert.ok(topElevation(41.5, 20) > topElevation(41.5, 40));
  // 60° is nearer than 30°: d(60°) = d(30°) ÷ 3.
  close(distanceFor(41.5, 30) / distanceFor(41.5, 60), 3, 1e-9);
});

test("height from distance and angle undoes the angle from height and distance", () => {
  for (const H of [10, 41.5, 72.5])
    for (const d of [5, 33.5, 100]) close(heightFrom(d, topElevation(H, d)), H, 1e-9);
});

test("angle of depression from a lighthouse equals the boat's angle of elevation", () => {
  close(depression(50, 50), 45);
  close(depression(30, 30 * Math.sqrt(3)), 30, 1e-9);
});

test("every tower can be seen at 30°, 45° and 60° from somewhere on the slider", () => {
  for (const t of [...TOWERS, ...MYSTERIES])
    for (const a of [30, 45, 60]) {
      const d = distanceFor(t.H, a, EYE);
      assert.ok(d >= DIST.min && d <= DIST.max, `${t.label} at ${a}°: ${d} m`);
    }
});

test("guesses count when within a metre", () => {
  assert.ok(closeEnough(36.8, 36));
  assert.ok(!closeEnough(37.5, 36));
  assert.ok(!closeEnough(NaN, 36));
});
