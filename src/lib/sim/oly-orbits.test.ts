import assert from "node:assert/strict";
import { test } from "node:test";
import * as O from "./oly-orbits";

const near = (a: number, b: number, tol = 1e-3) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

test("orbits: surface gravity of Earth is about 9.8 m/s² and Mars about 3.7 m/s²", () => {
  assert.ok(near(O.surfaceG(O.EARTH), 9.82, 2e-3));
  assert.ok(near(O.surfaceG(O.MARS), 3.73, 2e-3));
});

test("orbits: the jump animation peaks at the predicted height and lands", () => {
  const plan = O.planJump({ kind: "orbits-jump", hEarth: 0.4, on: O.MARS, mark: 1, window: 0.04 });
  assert.ok(near(plan.at(plan.flight / 2), O.jumpHeightOn(0.4, O.MARS), 1e-9));
  assert.equal(plan.at(plan.flight), 0);
});

test("orbits: the geostationary height gives a one sidereal day period", () => {
  const h = O.heightForPeriod(O.EARTH, O.SIDEREAL_DAY);
  assert.ok(near(O.orbitPeriod(O.EARTH, O.EARTH.R + h), O.SIDEREAL_DAY, 1e-9));
  assert.ok(near(h / 1000, 35790, 1e-3));
  // Lower orbits run ahead (east), higher ones lag (west).
  const low = O.planGeo({ kind: "orbits-geo", hKm: 30000, day: O.SIDEREAL_DAY, maxDrift: 2, station: "Hassan" });
  const high = O.planGeo({ kind: "orbits-geo", hKm: 40000, day: O.SIDEREAL_DAY, maxDrift: 2, station: "Hassan" });
  assert.ok(low.lead > 0 && high.lead < 0);
});

test("orbits: the stepped throw climbs to the same peak as the energy formula", () => {
  const v = 0.95 * O.throwSpeedToHeight(O.PHOBOS, 8000);
  const plan = O.planThrow({ kind: "orbits-throw", body: O.PHOBOS, H: 8000, v, catchSpeed: 1.5 });
  const top = Math.max(...plan.path.map((p) => p.y));
  assert.ok(near(top, O.throwPeak(O.PHOBOS, v), 2e-3), `${top} vs ${O.throwPeak(O.PHOBOS, v)}`);
  assert.equal(plan.path[plan.path.length - 1].y, 0, "falls back to the surface");
  assert.equal(O.throwPeak(O.PHOBOS, 1.01 * O.escapeSpeed(O.PHOBOS)), Infinity);
});
