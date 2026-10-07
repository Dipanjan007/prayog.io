import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AU,
  GEO_ALT_KM,
  GM_EARTH,
  GM_SUN,
  MOON_DIST,
  MOON_PERIOD,
  OMEGA_EARTH,
  R_EARTH,
  SIDEREAL_DAY,
  YEAR_S,
  carRoundOk,
  centripetalAcc,
  centripetalForce,
  circularSpeed,
  escapeSpeed,
  gAtLatitude,
  gravityAcc,
  launchFate,
  maxCurveSpeed,
  maxFriction,
  orbitPeriod,
  periodOf,
  radiusForPeriod,
  releasedPosition,
  skidRadius,
  skids,
  spinAcc,
  spinSpeed,
  spinWeightAcc,
  toRotatingFrame,
  weightAt,
  withinTolerance,
} from "./circular";

const close = (a: number, b: number, eps: number) => assert.ok(Math.abs(a - b) <= eps, `${a} vs ${b}`);

test("F = m v² / r: double the speed, four times the force; double the radius, half the force", () => {
  close(centripetalForce(0.5, 4, 1), 8, 1e-12);
  close(centripetalForce(0.5, 8, 1), 4 * centripetalForce(0.5, 4, 1), 1e-12);
  close(centripetalForce(0.5, 4, 2), centripetalForce(0.5, 4, 1) / 2, 1e-12);
  close(centripetalForce(1, 4, 1), 2 * centripetalForce(0.5, 4, 1), 1e-12);
  close(centripetalAcc(10, 50), 2, 1e-12);
  close(periodOf(2 * Math.PI, 1), 1, 1e-12);
});

test("cut the string: the ball leaves along the tangent, not straight outward", () => {
  const theta = 0.7;
  const r = 1.2;
  const p = releasedPosition(theta, r, 3, 0);
  // Velocity is at right angles to the radius at the moment of release.
  close(p.x * p.vx + p.y * p.vy, 0, 1e-12);
  // Later it is farther from the centre, as √(r² + (vt)²), because it goes straight on.
  const later = releasedPosition(theta, r, 3, 0.5);
  close(Math.hypot(later.x, later.y), Math.hypot(r, 1.5), 1e-12);
  // In the riding-along frame, a point still on the circle stays put.
  const omega = 2;
  const t = 0.3;
  const onCircle = toRotatingFrame(r * Math.cos(theta + omega * t), r * Math.sin(theta + omega * t), omega, t);
  close(onCircle.x, r * Math.cos(theta), 1e-12);
  close(onCircle.y, r * Math.sin(theta), 1e-12);
});

test("car on a flat curve: v max = √(μ g r) and mass does not matter", () => {
  close(maxCurveSpeed(0.7, 40), Math.sqrt(0.7 * 9.8 * 40), 1e-12);
  close(maxCurveSpeed(0.7, 40), 16.57, 0.01);
  close(maxFriction(1000, 0.7), 6860, 1e-9);
  assert.equal(skids(1000, 16, 40, 0.7), false);
  assert.equal(skids(1000, 17, 40, 0.7), true);
  assert.equal(skids(2000, 17, 40, 0.7), true);
  assert.ok(skidRadius(17, 0.7) > 40);
  assert.ok(carRoundOk(16.5, 0.7, 40, 0.05));
  assert.ok(!carRoundOk(16.7, 0.7, 40, 0.05));
  assert.ok(!carRoundOk(14, 0.7, 40, 0.05));
});

test("the spinning Earth: 465 m/s and 0.034 m/s² at the equator, nothing at the pole", () => {
  close(OMEGA_EARTH, (2 * Math.PI) / SIDEREAL_DAY, 1e-9);
  close(spinSpeed(0), 465.1, 0.2);
  close(spinAcc(0), 0.0339, 0.0002);
  close(spinSpeed(90), 0, 1e-9);
  close(spinSpeed(28.61), 408, 2); // Delhi
  assert.ok(spinSpeed(13.08) > spinSpeed(34.15)); // Chennai spins faster than Leh
  // A 50 kg student weighs about 0.3% less at the equator from the spin alone.
  const pole = weightAt(50, 90);
  close((50 * spinWeightAcc(0)) / pole, 0.0034, 0.0002);
});

test("g is 9.780 m/s² at the equator and 9.832 m/s² at the poles (spin plus bulge)", () => {
  close(gAtLatitude(0), 9.7803, 0.0001);
  close(gAtLatitude(90), 9.8322, 0.0001);
  close(gAtLatitude(45), 9.806, 0.001);
  // The spin explains most of the 0.5% difference; the bulge does the rest.
  const total = (gAtLatitude(90) - gAtLatitude(0)) / gAtLatitude(90);
  close(total, 0.0053, 0.0002);
  assert.ok(spinWeightAcc(0) < gAtLatitude(90) - gAtLatitude(0));
});

test("surface gravity and orbits around the Earth", () => {
  close(gravityAcc(GM_EARTH, R_EARTH), 9.82, 0.02);
  close(circularSpeed(GM_EARTH, R_EARTH + 400e3), 7670, 15); // ISS
  close(orbitPeriod(GM_EARTH, R_EARTH + 400e3) / 60, 92.4, 0.5);
  close(escapeSpeed(GM_EARTH, R_EARTH), 11_186, 20);
  // Geostationary: one orbit per sidereal day, about 35,786 km up and about 3.07 km/s.
  const rGeo = radiusForPeriod(GM_EARTH, SIDEREAL_DAY);
  close(rGeo / 1000 - 6378.137, GEO_ALT_KM, 2);
  close(circularSpeed(GM_EARTH, rGeo), 3075, 3);
});

test("the Moon and the Earth: gravity is exactly the centripetal force", () => {
  const vMoon = (2 * Math.PI * MOON_DIST) / MOON_PERIOD;
  close(vMoon, 1023, 3);
  close(centripetalAcc(vMoon, MOON_DIST), gravityAcc(GM_EARTH, MOON_DIST), 0.0001);
  const vEarth = (2 * Math.PI * AU) / YEAR_S;
  close(vEarth / 1000, 29.8, 0.1);
  close(circularSpeed(GM_SUN, AU) / 1000, 29.8, 0.1);
  close(centripetalAcc(vEarth, AU), gravityAcc(GM_SUN, AU), 0.00005);
});

test("launch fate: too slow crashes, circular speed orbits, escape speed leaves", () => {
  const r0 = R_EARTH + 500e3;
  const vc = circularSpeed(GM_EARTH, r0);
  assert.equal(launchFate(GM_EARTH, r0, vc, R_EARTH).fate, "orbit");
  close(launchFate(GM_EARTH, r0, vc, R_EARTH).otherApsis, r0, 1e-3);
  assert.equal(launchFate(GM_EARTH, r0, vc * 0.9, R_EARTH).fate, "crash");
  assert.equal(launchFate(GM_EARTH, r0, vc * 1.1, R_EARTH).fate, "orbit");
  assert.equal(launchFate(GM_EARTH, r0, escapeSpeed(GM_EARTH, r0), R_EARTH).fate, "escape");
  assert.ok(withinTolerance(vc * 1.019, vc, 0.02));
  assert.ok(!withinTolerance(vc * 1.03, vc, 0.02));
  assert.ok(!withinTolerance(NaN, vc, 0.02));
});
