import assert from "node:assert/strict";
import { test } from "node:test";
import * as P from "./oly-pattern";

test("pattern: building stage by stage agrees with the formulas", () => {
  const seats = { kind: "pat-seats" as const, first: 20, step: 4 };
  for (let n = 1; n <= 30; n++) {
    assert.equal(P.countByBuilding({ kind: "pat-sticks" }, n), P.sticks(n));
    assert.equal(P.countByBuilding(seats, n), P.seatsTotal(n, 20, 4));
    assert.equal(P.countByBuilding({ kind: "pat-hex" }, n), P.hexDots(n));
  }
  assert.deepEqual([1, 2, 3, 4].map(P.hexDots), [1, 7, 19, 37]);
});

test("pattern: stageFor finds the stage, or NaN when no stage fits", () => {
  assert.equal(P.stageFor({ kind: "pat-sticks" }, 100), 33);
  assert.ok(Number.isNaN(P.stageFor({ kind: "pat-sticks" }, 101)));
  assert.equal(P.stageFor({ kind: "pat-seats", first: 20, step: 4 }, 720), 15);
  assert.equal(P.stageFor({ kind: "pat-hex" }, 397), 12);
});

test("pattern: planPattern passes only the exact stage", () => {
  assert.equal(P.planPattern({ kind: "pat-sticks", n: 33, target: 100 }).outcome.ok, true);
  assert.match(P.planPattern({ kind: "pat-sticks", n: 32, target: 100 }).outcome.text, /unused/);
  assert.match(P.planPattern({ kind: "pat-sticks", n: 34, target: 100 }).outcome.text, /more than/);
  assert.equal(P.planPattern({ kind: "pat-hex", n: 12.5, target: 397 }).outcome.ok, false);
  assert.equal(P.planPattern({ kind: "pat-hex", n: 0, target: 397 }).outcome.ok, false);
});
