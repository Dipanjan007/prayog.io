import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BAG,
  BRICK,
  CUTTERS,
  G,
  P_ATM,
  SUCKER,
  SUCKER_AREA,
  airForce,
  brickFaceArea,
  cuts,
  dentDepth,
  depthForPressure,
  drainRate,
  flowDirection,
  footprintVerdict,
  formatArea,
  formatPa,
  isDoubled,
  jetRange,
  jetSpeed,
  leakStep,
  liquidPressure,
  massForForce,
  minFootprint,
  pressure,
  strapPressure,
  suckerHold,
  weight,
} from "./pressure";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test("pressure = force ÷ area, in pascals", () => {
  close(pressure(600, 2), 300);
  close(pressure(50, 0.25), 200);
  close(weight(1), 9.8);
  assert.equal(pressure(10, 0), Infinity);
});

test("the same brick presses harder on its small end than on its big flat face", () => {
  const W = weight(BRICK.massKg);
  close(W, 29.4, 1e-9);
  const flat = pressure(W, brickFaceArea("flat"));
  const end = pressure(W, brickFaceArea("end"));
  const side = pressure(W, brickFaceArea("side"));
  assert.ok(flat < side && side < end);
  // Area ratio 253 cm² ÷ 82.5 cm² ≈ 3.07, so the end presses about 3 times harder.
  close(end / flat, 0.23 / 0.075, 1e-9);
  assert.ok(Math.abs(flat - 1162) < 1);
  assert.ok(dentDepth(end) > 3 * dentDepth(flat) - 1e-12);
  // Two bricks stacked: double force, double pressure.
  close(pressure(2 * W, brickFaceArea("flat")), 2 * flat);
});

test("a sharp edge or point cuts with a force a blunt one cannot", () => {
  for (const c of Object.values(CUTTERS)) {
    assert.ok(cuts(10, c.sharp, c.breaks));
    assert.ok(!cuts(50, c.blunt, c.breaks));
  }
});

test("wide straps press less on the shoulder than thin ones", () => {
  const wide = strapPressure(BAG.wide);
  const thin = strapPressure(BAG.thin);
  close(wide, (6 * 9.8) / 2 / (0.05 * 0.12), 1e-9);
  assert.ok(wide < BAG.hurtsAbovePa && thin > BAG.hurtsAbovePa);
});

test("liquid pressure p = h ρ g grows in step with depth", () => {
  close(liquidPressure(1), 9800);
  close(liquidPressure(0.4), 2 * liquidPressure(0.2), 1e-9);
  // About 10 m of water presses as hard as the whole atmosphere.
  assert.ok(Math.abs(liquidPressure(10) - P_ATM) / P_ATM < 0.04);
  close(depthForPressure(4900), 0.5, 1e-12);
});

test("deeper holes give faster jets: v = √(2gh)", () => {
  close(jetSpeed(0.2), Math.sqrt(2 * 9.8 * 0.2));
  assert.ok(Math.abs(jetSpeed(0.2) - 1.98) < 0.01);
  assert.ok(jetSpeed(0.9) > jetSpeed(0.6) && jetSpeed(0.6) > jetSpeed(0.3));
  close(jetRange(0.25, 1), 1);
});

test("with the pipe on a stand at least as tall as the water, lower holes always land further", () => {
  const stand = 1;
  const holes = [0.1, 0.4, 0.7];
  for (let level = 0.75; level <= 1.0001; level += 0.05) {
    const r = holes.map((y) => jetRange(level - y, stand + y));
    assert.ok(r[0] > r[1] && r[1] > r[2], `level ${level}: ${r}`);
  }
  assert.ok(drainRate([0.5, 0.2], 0.002) > drainRate([0.5], 0.002));
});

test("isDoubled spots a depth twice another", () => {
  assert.ok(isDoubled(0.3, 0.6));
  assert.ok(isDoubled(0.6, 0.3));
  assert.ok(isDoubled(0.25, 0.51));
  assert.ok(!isDoubled(0.3, 0.5));
  assert.ok(!isDoubled(0, 0));
});

test("air presses on a 1 m² table top with about 101 kN, the weight of about 10 tonnes", () => {
  close(airForce(1), 101325);
  const tonnes = massForForce(airForce(1), G) / 1000;
  assert.ok(tonnes > 10 && tonnes < 10.5);
});

test("a pressed sucker is held by the air outside, and lets go when air leaks in", () => {
  const held = suckerHold(SUCKER.pressedInside);
  close(held, 0.75 * P_ATM * SUCKER_AREA, 1e-9);
  assert.ok(held > 100 && held < 200);
  close(suckerHold(P_ATM), 0);
  let p = SUCKER.pressedInside;
  for (let i = 0; i < 100; i++) p = leakStep(p, 0.1);
  assert.ok(suckerHold(p) < weight(SUCKER.massKg));
  assert.ok(leakStep(SUCKER.pressedInside, 0.5) > SUCKER.pressedInside);
});

test("air flows from high pressure to low pressure", () => {
  assert.equal(flowDirection(P_ATM, 0.5 * P_ATM), 1);
  assert.equal(flowDirection(0.5 * P_ATM, P_ATM), -1);
  assert.equal(flowDirection(1, 1), 0);
});

test("footprint challenge: the smallest safe footprint is just right", () => {
  // A 600 kg camel on sand that holds 50 kPa needs about 0.12 m² of foot.
  close(minFootprint(600, 50000), 0.1176, 1e-9);
  assert.equal(footprintVerdict(600, 0.1, 50000), "sinks");
  assert.equal(footprintVerdict(600, 0.12, 50000), "safe");
  assert.equal(footprintVerdict(600, 0.5, 50000), "oversized");
});

test("formatPa picks a friendly unit", () => {
  assert.equal(formatPa(300), "300 Pa");
  assert.equal(formatPa(29400), "29.4 kPa");
  assert.equal(formatPa(2.5e6), "2.5 MPa");
});

test("formatArea shows brick faces in cm²", () => {
  assert.equal(formatArea(brickFaceArea("end")), "82.5 cm²");
  assert.equal(formatArea(brickFaceArea("flat")), "253 cm²");
  assert.equal(formatArea(0.12), "0.12 m²");
});
