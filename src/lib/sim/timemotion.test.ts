import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BUMP,
  RACERS,
  TRACK_M,
  advanceSwing,
  averageSpeed,
  finishTime,
  gapsPerSecond,
  lengthForPeriod,
  pendulumPeriod,
  positionAt,
  release,
  smallAnglePeriod,
  speedAnswerOk,
  timeOscillations,
  toKmh,
} from "./timemotion";

const near = (a: number, b: number, tol: number, msg?: string) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ""} ${a} vs ${b}`);

test("a 1 m pendulum has a time period of about 2 s", () => {
  near(smallAnglePeriod(1), 2.007, 0.001);
  near(lengthForPeriod(1), 0.248, 0.001);
  near(lengthForPeriod(2), 0.993, 0.001);
});

test("the exact period matches the known large-swing values", () => {
  // T/T0 for an ideal pendulum: 1.0019 at 10°, 1.0174 at 30°, 1.0400 at 45°, 1.1803 at 90°.
  for (const [deg, ratio] of [[10, 1.0019], [30, 1.0174], [45, 1.04], [90, 1.1803]]) {
    near(pendulumPeriod(1, deg) / smallAnglePeriod(1), ratio, 0.0002, `${deg}°`);
  }
});

test("swinging the pendulum gives the same period as the formula", () => {
  for (const [L, deg] of [[0.25, 10], [1, 30], [1.5, 45], [0.1, 5]]) {
    near(timeOscillations(L, deg, 10) / 10, pendulumPeriod(L, deg), 0.001, `L=${L} θ=${deg}`);
  }
});

test("the period depends on length, not on mass, and only slightly on angle", () => {
  // Mass is not even an input: the equation of motion has no mass in it.
  assert.ok(pendulumPeriod(1, 10) > 1.9 * pendulumPeriod(0.25, 10));
  near(pendulumPeriod(0.5, 5), pendulumPeriod(0.5, 20), 0.02);
});

test("half swings and full oscillations are counted at the turning points", () => {
  let s = release(10);
  const T = pendulumPeriod(0.5, 10);
  s = advanceSwing(s, 0.5, T * 0.75);
  assert.equal(s.halves, 1);
  s = advanceSwing(s, 0.5, T * 0.5);
  assert.equal(s.halves, 2);
  near(s.lastFull, T, 0.001);
  near(s.theta, ((10 * Math.PI) / 180) * Math.cos(2 * Math.PI * 0.25), 0.02); // a quarter swing later: near the middle
});

test("the cycle is uniform: equal distance every second, 100 m in 20 s", () => {
  near(finishTime("cycle"), 20, 0.01);
  for (const g of gapsPerSecond("cycle")) near(g, 5, 1e-6);
});

test("the auto-rickshaw is non-uniform and slows down at the speed breaker", () => {
  const gaps = gapsPerSecond("auto");
  assert.ok(Math.max(...gaps) - Math.min(...gaps) > 5, gaps.join(","));
  // Crawls over the speed breaker.
  let t = 0;
  while (positionAt("auto", t) < BUMP[0] + 1) t += 0.01;
  const v = (positionAt("auto", t + 0.1) - positionAt("auto", t)) / 0.1;
  near(v, 2.5, 0.05);
});

test("every racer finishes, and the finish line is reached exactly once", () => {
  for (const r of RACERS) {
    const T = finishTime(r.id);
    assert.ok(T > 4 && T < 25, `${r.id} ${T}`);
    near(positionAt(r.id, T - 0.02), TRACK_M, 0.6);
    assert.equal(positionAt(r.id, T + 1), TRACK_M);
  }
  // Ranking by speed: cheetah, auto-rickshaw, runner, cycle.
  const order = [...RACERS].sort((a, b) => finishTime(a.id) - finishTime(b.id)).map((r) => r.id);
  assert.deepEqual(order, ["cheetah", "auto", "runner", "cycle"]);
});

test("speed = distance ÷ time, with km/h conversion", () => {
  assert.equal(averageSpeed(100, 20), 5);
  near(toKmh(5), 18, 1e-9);
  assert.ok(speedAnswerOk(5, 100, 20));
  assert.ok(speedAnswerOk(5.4, 100, 18.4)); // 5.43 rounded
  assert.ok(!speedAnswerOk(0.05, 100, 5)); // time ÷ distance is not speed
  assert.ok(!speedAnswerOk(15, 100, 5));
  assert.ok(!speedAnswerOk(NaN, 100, 20));
});
