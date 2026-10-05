import assert from "node:assert/strict";
import { test } from "node:test";
import {
  G,
  HILL_X,
  KEY_X,
  MASS,
  MU,
  TRACK_END,
  energies,
  frictionHeightLoss,
  leverMoments,
  predictRun,
  simulate,
  trackHeight,
  trackSlope,
  type Track,
} from "./energy";

const T: Track = { h0: 10, h1: 6, h2: 8 };

test("the track passes through its keypoints and is flat on the hilltops", () => {
  const k = [10, 0, 6, 0, 8, 0, 0];
  KEY_X.forEach((x, i) => assert.ok(Math.abs(trackHeight(T, x) - k[i]) < 1e-9, `x=${x}`));
  for (const x of HILL_X) assert.ok(Math.abs(trackSlope(T, x)) < 1e-9);
  assert.ok(trackSlope(T, 0) < -1, "the first drop is steep so the cart rolls off");
  // Slope matches a numerical derivative.
  for (const x of [3, 12, 20, 30, 38, 45]) {
    const num = (trackHeight(T, x + 1e-5) - trackHeight(T, x - 1e-5)) / 2e-5;
    assert.ok(Math.abs(num - trackSlope(T, x)) < 1e-4, `x=${x}`);
  }
});

test("without friction, total energy stays the same for the whole ride", () => {
  const { cart, worstDrift } = simulate(T, false);
  assert.equal(cart.finished, true);
  assert.ok(worstDrift < 1e-3, `drift ${worstDrift}`);
  // PE at the top turns fully into KE on flat ground: v = √(2gh).
  const e = energies(T, { ...cart, x: 45, v: Math.sqrt(2 * G * 10) });
  assert.ok(Math.abs(e.total - MASS * G * 10) < 1e-6);
});

test("speed over the last hill is √(2g(h0 − h2)) without friction", () => {
  const run = simulate(T, false).cart;
  const expected = Math.sqrt(2 * G * (10 - 8));
  assert.ok(Math.abs(run.crestSpeed! - expected) < 0.05, `${run.crestSpeed} vs ${expected}`);
  assert.ok(Math.abs(predictRun(T, false).lastCrestSpeed! - expected) < 1e-9);
});

test("a cart never climbs higher than it started: a taller hill turns it back", () => {
  const tall: Track = { h0: 7, h1: 9, h2: 5 };
  const { cart, maxH } = simulate(tall, false, 20);
  assert.equal(cart.turnedBack, true);
  assert.equal(cart.finished, false);
  assert.ok(maxH <= 7 + 1e-6, `maxH ${maxH}`);
  assert.equal(predictRun(tall, false).cleared, false);
});

test("with friction, heat = μ m g × distance and PE + KE + heat stays constant", () => {
  const { cart, worstDrift } = simulate(T, true);
  assert.ok(worstDrift < 1e-3, `drift ${worstDrift}`);
  // 10 m start, last hill 8 m, friction costs 0.05 × 34 = 1.7 m before its top: it just clears.
  assert.equal(cart.finished, true);
  assert.ok(Math.abs(cart.heat - MU * MASS * G * TRACK_END) < 1, `heat ${cart.heat}`);
  const expected = Math.sqrt(2 * G * (10 - 8 - 1.7));
  assert.ok(Math.abs(cart.crestSpeed! - expected) < 0.05, `${cart.crestSpeed} vs ${expected}`);
});

test("challenge track: with friction the start must be more than 1.7 m above the last hill", () => {
  assert.ok(Math.abs(frictionHeightLoss(true) - 1.7) < 1e-9);
  const fail = simulate({ h0: 10.6, h1: 7, h2: 9 }, true, 300);
  assert.equal(fail.cart.finished, false);
  assert.equal(fail.cart.turnedBack, true);
  assert.equal(fail.cart.settled, true, "friction brings a stuck cart to rest");
  const pass = simulate({ h0: 10.8, h1: 7, h2: 9 }, true);
  assert.equal(pass.cart.finished, true);
  assert.ok(pass.cart.crestSpeed! < 2, `crest ${pass.cart.crestSpeed}`);
  assert.equal(predictRun({ h0: 10.8, h1: 7, h2: 9 }, true).cleared, true);
  assert.equal(predictRun({ h0: 10.6, h1: 7, h2: 9 }, true).cleared, false);
});

test("a lever balances when the moments are equal", () => {
  // See-saw: 600 N load 1 m from the fulcrum, effort 3 m away: 200 N balances, MA = 3.
  const m = leverMoments(1, 1, 600, 200);
  assert.equal(m.balanced, true);
  assert.equal(m.loadMoment, 600);
  assert.ok(Math.abs(m.ma - 3) < 1e-9);
  assert.equal(leverMoments(1, 1, 600, 150).winner, "load");
  assert.equal(leverMoments(1, 1, 600, 300).winner, "effort");
  // Class 2 always has MA > 1, class 3 always MA < 1.
  for (const pos of [0.5, 1.5, 3.5]) {
    const two = leverMoments(2, pos, 600, 0);
    assert.ok(two.effortNeeded < 600);
    const three = leverMoments(3, pos, 600, 0);
    assert.ok(three.effortNeeded > 600);
  }
});
