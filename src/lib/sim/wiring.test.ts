import assert from "node:assert/strict";
import { test } from "node:test";
import { BUDGETS } from "../../content/lessons/house-wiring";
import {
  APPLIANCES,
  APPLIANCE_IDS,
  CIRCUITS,
  DANGER_AMPS,
  MAINS,
  billRs,
  bodyCurrent,
  budgetResult,
  circuitCurrent,
  currentDrawn,
  defaultHours,
  earthFaultCurrent,
  energyKWh,
  fuseFor,
  kWhToJ,
  minimumBill,
  monthReport,
  monthlyUnits,
  overloaded,
  powerI2R,
  powerV2R,
  powerVI,
  resistanceOf,
  shortCircuitCurrent,
} from "./wiring";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test("Indian mains is 220 V at 50 Hz", () => {
  assert.equal(MAINS.V, 220);
  assert.equal(MAINS.f, 50);
});

test("I = P / V: a 1100 W iron takes 5 A and a 1000 W iron about 4.55 A", () => {
  close(currentDrawn(1100), 5);
  close(currentDrawn(APPLIANCES.iron.watts), 4.545454545, 1e-6);
  close(currentDrawn(APPLIANCES.geyser.watts), 9.090909, 1e-5);
  assert.ok(currentDrawn(APPLIANCES.led.watts) < 0.05);
});

test("P = VI = I²R = V²/R all agree for a heating element", () => {
  const P = 1000;
  const R = resistanceOf(P);
  close(R, 48.4);
  const I = currentDrawn(P);
  close(powerVI(MAINS.V, I), P);
  close(powerI2R(I, R), P);
  close(powerV2R(MAINS.V, R), P);
});

test("parallel appliances: currents add, and the circuit trips only above its rating", () => {
  close(circuitCurrent([1000, 100, 75]), (1000 + 100 + 75) / 220);
  assert.equal(overloaded(circuitCurrent([9, 75, 100]), CIRCUITS.light.rating), false);
  assert.equal(overloaded(circuitCurrent([1200]), CIRCUITS.light.rating), true, "a microwave overloads 5 A");
  assert.equal(overloaded(circuitCurrent([1000, 100, 75]), CIRCUITS.light.rating), true);
  assert.equal(overloaded(circuitCurrent([2000, 1000]), CIRCUITS.power.rating), false);
  assert.equal(overloaded(circuitCurrent([2000, 1500]), CIRCUITS.power.rating), true, "geyser plus AC overloads 15 A");
});

test("fuse rating: a little above the normal current", () => {
  assert.equal(fuseFor(currentDrawn(1000)), 5);
  assert.equal(fuseFor(currentDrawn(2000)), 10);
  assert.equal(fuseFor(currentDrawn(75)), 1);
  assert.equal(fuseFor(100), null);
});

test("kWh and the bill: 1 kWh = 3.6 MJ, and a 1 kW iron for 30 min uses 0.5 unit", () => {
  close(kWhToJ(1), 3.6e6);
  close(energyKWh(1000, 0.5), 0.5);
  close(monthlyUnits(2000, 1.5), 90);
  close(billRs(100), 700);
});

test("default month: the geyser, not the fridge, uses the most units", () => {
  const r = monthReport(defaultHours());
  close(r.units.geyser, 60);
  close(r.units.fridge, 48);
  assert.deepEqual(r.top, ["geyser"]);
  close(r.total, APPLIANCE_IDS.reduce((s, id) => s + monthlyUnits(APPLIANCES[id].watts, APPLIANCES[id].hours), 0));
  close(r.bill, r.total * 7);
  assert.deepEqual(monthReport(Object.fromEntries(APPLIANCE_IDS.map((id) => [id, 0])) as ReturnType<typeof defaultHours>).top, []);
});

test("faults: a short circuit and an earth fault blow a 15 A fuse, but current through a person does not", () => {
  assert.ok(shortCircuitCurrent() > 100);
  close(shortCircuitCurrent(), 440);
  assert.ok(overloaded(earthFaultCurrent(), CIRCUITS.power.rating));
  const body = bodyCurrent();
  close(body, 0.22);
  assert.equal(overloaded(body, CIRCUITS.power.rating), false);
  assert.ok(body > DANGER_AMPS, "yet it is well above the danger level");
});

test("every budget round can be won, and none is won with the starting hours", () => {
  for (const round of BUDGETS) {
    assert.ok(minimumBill(round) < round.budget, `${round.name}: minimum ₹${minimumBill(round)}`);
    const start = { ...defaultHours() };
    for (const [id, h] of Object.entries(round.needs)) start[id as keyof typeof start] = Math.max(start[id as keyof typeof start], h!);
    const r = budgetResult(round, start);
    assert.equal(r.needsMet, true);
    assert.equal(r.ok, false, `${round.name} should need some cutting: ₹${r.bill}`);
    const tooLittle = { ...start, [Object.keys(round.needs)[0]]: 0 };
    assert.equal(budgetResult(round, tooLittle).needsMet, false);
  }
});
