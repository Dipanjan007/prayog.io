import assert from "node:assert/strict";
import { test } from "node:test";
import {
  C,
  MUON_START_HEIGHT,
  additionGap,
  answerOk,
  betaForGamma,
  betaForLength,
  clockRate,
  contractedLength,
  dilatedTime,
  einsteinAdd,
  einsteinAddSI,
  galileoAdd,
  gamma,
  gpsDrift,
  kmhToMs,
  lightClockTick,
  movingLightClock,
  muonRange,
  muonSurvival,
  orbitalSpeed,
  rangeError,
  twinTrip,
} from "./relativity";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test("γ is 1 at rest, 1.25 at 0.6c, 5/3 at 0.8c and blows up at c", () => {
  close(gamma(0), 1);
  close(gamma(0.6), 1.25);
  close(gamma(0.8), 5 / 3);
  assert.equal(gamma(1), Infinity);
  close(dilatedTime(8, 0.6), 10);
  close(clockRate(0.8), 0.6);
});

test("time runs at half rate at about 0.866c", () => {
  close(betaForGamma(2), Math.sqrt(3) / 2);
  close(betaForGamma(2), 0.866, 1e-3);
  close(clockRate(0.866), 0.5, 1e-3);
  close(betaForGamma(1), 0);
});

test("a moving light clock's photon takes a slanted path γ times longer, so it ticks γ times slower", () => {
  const gap = 1.5;
  close(lightClockTick(gap), 3 / C);
  const m = movingLightClock(gap, 0.6);
  close(m.path, 1.875);
  close(m.sideways, 1.125);
  close(Math.hypot(gap, m.sideways), m.path); // Pythagoras: same light speed, longer path
  close(m.tick, 1.25 * lightClockTick(gap));
});

test("muons: about 660 m without time dilation, but kilometres with it", () => {
  close(muonRange(1, false), 659.56, 0.01);
  assert.ok(muonRange(0.9995, false) < 660);
  assert.ok(muonRange(0.9995) > MUON_START_HEIGHT);
  assert.ok(muonRange(0.99) < MUON_START_HEIGHT);
  assert.ok(muonSurvival(MUON_START_HEIGHT, 0.9995, false) < 1e-9);
  assert.ok(muonSurvival(MUON_START_HEIGHT, 0.9995) > 0.4);
});

test("GPS: speed slows the clocks ~7 μs a day, gravity speeds them ~45 μs, net ~38 μs, ~10 km of error", () => {
  close(orbitalSpeed(2.656e7), 3874, 5);
  const d = gpsDrift();
  close(d.speed * 1e6, -7.2, 0.1);
  close(d.gravity * 1e6, 45.7, 0.3);
  close(d.net * 1e6, 38.5, 0.4);
  close(rangeError(d.net) / 1000, 11.5, 0.3);
});

test("twin paradox: at 0.8c to a star 8 light years away, Earth ages 20 years and the astronaut 12", () => {
  const t = twinTrip(8, 0.8);
  close(t.earthYears, 20);
  close(t.shipYears, 12);
});

test("adding speeds: Einstein never goes past c", () => {
  close(galileoAdd(0.9, 0.9), 1.8);
  close(einsteinAdd(0.9, 0.9), 1.8 / 1.81);
  close(einsteinAdd(0.9, 0.9), 0.9945, 1e-4);
  close(einsteinAdd(0.5, 1), 1);
  close(einsteinAdd(0.99, 0.99), 0.99995, 1e-5);
  for (const u of [0.1, 0.5, 0.9, 0.999]) for (const v of [0.1, 0.7, 0.999]) assert.ok(einsteinAdd(u, v) < 1);
  close(einsteinAddSI(0.5 * C, 0.5 * C) / C, 0.8);
});

test("at everyday speeds the Einstein correction is far too small to notice", () => {
  const train = kmhToMs(160);
  const ball = kmhToMs(140);
  const gap = additionGap(train, ball);
  assert.ok(gap > 0 && gap < 1e-11, `gap ${gap}`);
  close(gap, galileoAdd(train, ball) - einsteinAddSI(train, ball), 1e-9);
});

test("length contraction: 100 m at 0.8c measures 60 m, half length at 0.866c", () => {
  close(contractedLength(100, 0.8), 60);
  close(contractedLength(100, 0), 100);
  close(betaForLength(100, 60), 0.8);
  close(betaForLength(100, 50), 0.866, 1e-3);
  close(betaForLength(260, 100), 12 / 13);
  assert.throws(() => betaForLength(100, 120));
});

test("answer checks use a relative tolerance", () => {
  assert.ok(answerOk(20.4, 20, 0.03));
  assert.ok(!answerOk(21, 20, 0.03));
  assert.ok(!answerOk(NaN, 20, 0.03));
});
