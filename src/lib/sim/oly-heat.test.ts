import assert from "node:assert/strict";
import { test } from "node:test";
import * as H from "./oly-heat";

const near = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const water = (m: number, T: number): H.HeatBody => ({ label: "w", m, c: H.C_WATER, T, role: "liquid" });

test("heat: equal masses of water at 20 and 60 °C end at 40 °C", () => {
  assert.ok(near(H.equilibrium([water(1, 20), water(1, 60)]).T, 40));
});

test("heat: hotWaterForMix and addedMassForTarget agree and hit the target", () => {
  const m = H.hotWaterForMix(10, 20, 80, 45);
  assert.ok(near(m, H.addedMassForTarget([water(10, 20)], H.C_WATER, 80, 45)));
  assert.ok(near(H.equilibrium([water(10, 20), water(m, 80)]).T, 45));
});

test("heat: enough warm water melts all the ice", () => {
  // 1 kg at 50 °C has 209 300 J above 0 °C; 0.2 kg ice at 0 °C needs 66 800 J to melt.
  const eq = H.equilibrium([water(1, 50)], { m: 0.2, T: 0 });
  assert.equal(eq.iceLeft, 0);
  assert.ok(near(eq.T, (209300 - 66800) / (1.2 * H.C_WATER)));
});

test("heat: too much ice leaves some floating at 0 °C, and iceForLeftover is consistent", () => {
  const bodies = [water(0.2, 20)];
  const m = H.iceForLeftover(bodies, -10, 0.03);
  const eq = H.equilibrium(bodies, { m, T: -10 });
  assert.equal(eq.T, 0);
  assert.ok(near(eq.iceLeft, 0.03));
});

test("heat: a huge amount of very cold ice ends below 0 °C with no melting", () => {
  const eq = H.equilibrium([water(0.01, 1)], { m: 1, T: -20 });
  assert.ok(eq.T < 0);
  assert.equal(eq.iceLeft, 1);
});

test("heat: settle fraction runs from 0 to 1", () => {
  assert.equal(H.settleFraction(0), 0);
  assert.equal(H.settleFraction(H.POUR_S + H.SETTLE_S), 1);
});
