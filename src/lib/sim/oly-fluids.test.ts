import assert from "node:assert/strict";
import { test } from "node:test";
import { cargoToLine, cubeRest, planBarge, planCube, planLift, liftForce, uTubeDensity, type BargeScene, type CubeScene, type LiftScene } from "./oly-fluids";

const lift: LiftScene = { kind: "fluids-lift", mass: 1440, dBig: 0.3, dSmall: 0.025, force: 98, height: 1.8, headroom: 0.4, tol: 0.03, watch: 4 };
const barge: BargeScene = { kind: "fluids-barge", L: 20, B: 5, emptyDraft: 0.3, rhoEmpty: 1000, rho: 1025, line: 1.2, hull: 1.6, cargo: 93, tol: 0.02 };
const cube: CubeScene = { kind: "fluids-cube", a: 5, rho: 872, rhoLow: 1000, uWater: 10.4, uOil: 13, low: 12, high: 10, seenInLow: 1.8, tol: 0.25 };

test("Pascal: force scales with the area ratio", () => {
  assert.ok(Math.abs(liftForce(1440, 0.3, 0.025) - 98) < 1e-9);
  assert.ok(Math.abs(planLift(lift).at(4) - 1.8) < 1e-9);
  assert.equal(planLift({ ...lift, force: 80 }).at(4), 0, "too little: lands on the floor");
  assert.equal(planLift({ ...lift, force: 120 }).at(4), 2.2, "too much: hits the stop");
});

test("Archimedes: barge cargo in sea water beats river water", () => {
  assert.ok(Math.abs(cargoToLine(20, 5, 0.3, 1000, 1.2, 1025) - 93) < 1e-9);
  assert.ok(Math.abs(cargoToLine(20, 5, 0.3, 1000, 1.2, 1000) - 90) < 1e-9);
  assert.equal(planBarge({ ...barge, cargo: 90 }).outcome.ok, false, "the river-water slip fails");
  assert.equal(planBarge({ ...barge, cargo: 150 }).sinks, true);
  assert.ok(Math.abs(planBarge(barge).at(4.5) - 1.2) < 0.01, "settles at the line");
});

test("U-tube and the cube at the boundary", () => {
  assert.equal(uTubeDensity(10.4, 13), 800);
  const r = cubeRest(872, 5, 1000, 800);
  assert.equal(r.where, "boundary");
  assert.ok(r.where === "boundary" && Math.abs(r.inLow - 1.8) < 1e-9);
  assert.equal(cubeRest(1100, 5, 1000, 800).where, "floor");
  assert.equal(cubeRest(700, 5, 1000, 800).where, "surface");
  assert.ok(Math.abs(planCube(cube).at(4) - 10.2) < 0.05, "settles near its resting place");
});
