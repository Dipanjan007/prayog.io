import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BLOCK_MASS,
  G,
  LOADS,
  PULL_SPEED,
  PULL_TRACK,
  ROUNDS,
  SLIDERS,
  SURFACES,
  SURFACE_IDS,
  TOLERANCE,
  createPull,
  friction,
  frictionLimits,
  normalForce,
  pulley,
  roundPassed,
  roundTarget,
  startPull,
  staticFriction,
  stepPull,
  stopPull,
  timeToCover,
  tow,
  weight,
  type PullConfig,
} from "./friction";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

/** Pull until the block reaches a steady speed (or the run ends) and return the state. */
function pullRun(cfg: PullConfig, seconds = 8) {
  const s = createPull(cfg);
  startPull(s);
  for (let i = 0; i < seconds * 60 && !s.ended; i++) stepPull(s, 1 / 60);
  return s;
}

test("g is 9.8 m/s² and a 0.5 kg block presses on the table with 4.9 N", () => {
  close(G, 9.8);
  close(normalForce(BLOCK_MASS), 4.9);
});

test("friction = μ × N, and the coefficients are realistic: static above kinetic, rolling far smaller", () => {
  close(friction(0.3, 4.9), 1.47);
  for (const id of SURFACE_IDS) {
    const s = SURFACES[id];
    assert.ok(s.muS > s.muK, `${id}: static > kinetic`);
    assert.ok(s.muR * 5 < s.muK, `${id}: rolling much smaller`);
    assert.ok(s.muS <= 1 && s.muR > 0);
  }
  assert.ok(SURFACES.glass.muK < SURFACES.wood.muK && SURFACES.wood.muK < SURFACES.sandpaper.muK, "rougher means more friction");
});

test("static friction matches the push up to its limit, then the block slips", () => {
  assert.deepEqual(staticFriction(1, 1.96), { f: 1, slips: false });
  assert.deepEqual(staticFriction(2.5, 1.96), { f: 1.96, slips: true });
});

test("the spring balance peaks at μs N, then reads μk N while the block slides at a steady speed", () => {
  for (const id of SURFACE_IDS) {
    for (const load of LOADS) {
      const m = BLOCK_MASS + load;
      const s = pullRun({ surface: id, mass: m, rolling: false });
      const { fs, fk } = frictionLimits(SURFACES[id], m, false);
      assert.ok(s.peak !== null && s.steady !== null, `${id} ${m} kg measured`);
      close(s.peak!, fs, 1e-9);
      close(s.steady!, fk, 0.011);
      assert.ok(s.peak! > s.steady!);
      assert.ok(Math.abs(s.v - PULL_SPEED) < 0.006 || s.ended);
    }
  }
  // Wooden block on wood: peak 1.96 N, steady 1.47 N.
  const w = pullRun({ surface: "wood", mass: 0.5, rolling: false });
  close(w.peak!, 1.96, 1e-9);
  close(w.steady!, 1.47, 0.011);
});

test("doubling the weight on the block doubles the friction (Amontons' law)", () => {
  const one = frictionLimits(SURFACES.wood, 1, false);
  const two = frictionLimits(SURFACES.wood, 2, false);
  close(two.fk, 2 * one.fk);
  close(two.fs, 2 * one.fs);
  close(one.fk / one.N, SURFACES.wood.muK);
});

test("on rollers the pull needed is many times smaller than for sliding", () => {
  const slide = pullRun({ surface: "wood", mass: 1, rolling: false });
  const roll = pullRun({ surface: "wood", mass: 1, rolling: true });
  assert.ok(roll.steady !== null);
  close(roll.steady!, 0.098, 0.011);
  assert.ok(slide.steady! > 10 * roll.steady!);
});

test("letting go makes friction stop the block, and the block never slides past the end of the table", () => {
  const s = createPull({ surface: "sandpaper", mass: 0.5, rolling: false });
  startPull(s);
  for (let i = 0; i < 180; i++) stepPull(s, 1 / 60);
  assert.equal(s.phase, "sliding");
  stopPull(s);
  for (let i = 0; i < 120; i++) stepPull(s, 1 / 60);
  assert.equal(s.phase, "rest");
  close(s.v, 0);
  const far = pullRun({ surface: "glass", mass: 0.5, rolling: false }, 30);
  assert.ok(far.ended);
  close(far.x, PULL_TRACK);
});

test("hanging mass over a pulley: a = net force ÷ total mass, and the tension is less than the hanging weight", () => {
  // 1 kg block on wood, 0.6 kg hanging: a = (5.88 − 2.94) / 1.6 = 1.8375 m/s².
  const r = pulley(1, 0.6, SURFACES.wood);
  assert.ok(r.moves);
  close(r.a, 1.8375);
  close(r.net, 2.94);
  close(r.total, 1.6);
  close(r.T!, 0.6 * (9.8 - 1.8375));
  assert.ok(r.T! < weight(0.6));
  // The block on its own: T − friction = M a.
  close(r.T! - r.f, 1 * r.a);
  // With no friction, a = mh g / (M + mh).
  close(pulley(1, 1, { ...SURFACES.wood, muS: 0, muK: 0 }).a, 4.9);
});

test("static friction can hold the block still against a small hanging mass", () => {
  const r = pulley(1, 0.3, SURFACES.wood); // 2.94 N pull vs a 3.92 N limit
  assert.equal(r.moves, false);
  close(r.a, 0);
  close(r.T!, 0.3 * 9.8);
});

test("tow: the string tension is F × mB ÷ (mA + mB), whatever the surface", () => {
  for (const id of SURFACE_IDS) {
    const r = tow(30, 1, 1.5, SURFACES[id]);
    assert.ok(r.moves);
    close(r.T!, (30 * 1.5) / 2.5, 1e-9);
    close(r.a, (30 - SURFACES[id].muK * 2.5 * 9.8) / 2.5, 1e-9);
  }
  assert.equal(tow(5, 1, 1.5, SURFACES.sandpaper).moves, false);
});

test("d = ½ a t²: 1 m at 2 m/s² takes 1 s", () => {
  close(timeToCover(1, 2), 1);
  assert.equal(timeToCover(1, 0), Infinity);
});

test("each challenge round has its answer on the slider, the block really moves, and the next steps miss", () => {
  for (const r of ROUNDS) {
    const steps = (r.answer - SLIDERS.hanging.min) / SLIDERS.hanging.step;
    close(steps, Math.round(steps), 1e-9);
    assert.ok(r.answer <= SLIDERS.hanging.max);
    assert.ok(LOADS.includes(r.load));
    const res = pulley(BLOCK_MASS + r.load, r.answer, SURFACES[r.surface]);
    assert.ok(res.moves && res.a > 0.3);
    assert.ok(roundPassed(r, res.a));
    for (const d of [-SLIDERS.hanging.step, SLIDERS.hanging.step]) {
      const near = pulley(BLOCK_MASS + r.load, r.answer + d, SURFACES[r.surface]);
      assert.ok(!roundPassed(r, near.a), `${r.name}: ${r.answer + d} kg should miss`);
    }
    assert.ok(roundTarget(r) > TOLERANCE);
  }
});
