import assert from "node:assert/strict";
import { test } from "node:test";
import { emfAndInternal, heaterWireLength, parallel, planHeater, planShunt, ratedResistance, seriesResistorForBulb, shuntCircuit, wireResistance } from "./oly-electricity";

const close = (a: number, b: number, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test("basic relations", () => {
  close(ratedResistance(230, 1000), 52.9);
  close(parallel(6, 3), 2);
  close(wireResistance(1, 1, Math.sqrt(4 / Math.PI)), 1);
});

test("series resistor gives the rated current", () => {
  const R = seriesResistorForBulb(9, 2.5, 0.75);
  close(9 / (R + ratedResistance(2.5, 0.75)), 0.3);
});

test("heater wire length round trip, and the fuse blows when the coil is short", () => {
  const L = heaterWireLength(230, 1500, 1.1e-6, 0.5e-3);
  close(230 ** 2 / wireResistance(1.1e-6, L, 0.5e-3), 1500);
  const s = { kind: "electricity-heater" as const, V: 230, rho: 1.1e-6, d: 0.5e-3, L: 0.9 * L, targetP: 1500, window: 0.04, fuseA: 7 };
  assert.equal(planHeater(s).blows, true);
  assert.equal(planHeater({ ...s, L }).blows, false);
});

test("EMF and internal resistance from two readings", () => {
  const { E, r } = emfAndInternal(5.5, 11, 1.5, 9);
  close(E, 12);
  close(r, 0.5);
});

test("the shunt gives the lamp its rated voltage, and currents add up at the junction", () => {
  const s = { kind: "electricity-shunt" as const, E: 12, r: 0.5, Rs: 2, RL: 6, VL: 6, X: 30 / 7, window: 0.015 };
  const c = shuntCircuit(s);
  close(c.V, 6);
  close(c.IL + c.IX, c.I);
  assert.equal(planShunt(s).outcome.ok, true);
});
