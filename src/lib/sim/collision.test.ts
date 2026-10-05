import assert from "node:assert/strict";
import { test } from "node:test";
import { G, MU, ROUNDS, SLIDERS, TOLERANCE, collide, netForce, runToEnd, type Settings } from "./collision";

const base: Settings = { mode: "collide", kind: "elastic", air: true, mA: 1, mB: 1, F: 2, pushTime: 0.3 };
const near = (a: number, b: number, tol = 1e-3) => Math.abs(a - b) <= tol;
const range = (r: { min: number; max: number; step: number }) => {
  const out: number[] = [];
  for (let v = r.min; v <= r.max + 1e-9; v += r.step) out.push(Math.round(v * 100) / 100);
  return out;
};

test("equal masses in an elastic collision swap velocities", () => {
  const [v1, v2] = collide(1, 2, 1, 0, 1);
  assert.ok(near(v1, 0) && near(v2, 2));
});

test("elastic collisions keep momentum and kinetic energy", () => {
  for (const [m1, u1, m2, u2] of [
    [0.5, 3, 2, 0],
    [3, 1, 0.5, -1],
    [1.25, 2.2, 1.75, 0.4],
  ]) {
    const [v1, v2] = collide(m1, u1, m2, u2, 1);
    assert.ok(near(m1 * u1 + m2 * u2, m1 * v1 + m2 * v2), "momentum");
    assert.ok(near(m1 * u1 ** 2 + m2 * u2 ** 2, m1 * v1 ** 2 + m2 * v2 ** 2), "kinetic energy");
  }
});

test("sticky collisions keep momentum, share one velocity and lose kinetic energy", () => {
  const [v1, v2] = collide(1, 3, 2, 0, 0);
  assert.ok(near(v1, 1) && near(v2, 1));
  assert.ok(1 * 3 ** 2 > 3 * 1 ** 2);
});

test("F = ma: a push gives v = Ft/m, then the cart glides at constant speed (first law)", () => {
  for (const m of [0.5, 1, 1.5]) {
    const w = runToEnd({ ...base, mA: m, mB: 3, F: 1, pushTime: 0.2 });
    // Impulse F × t = change in momentum.
    assert.ok(near(w.hits[0].before[0], 1 * 0.2), `m=${m}: p before hit ${w.hits[0].before[0]}`);
    assert.ok(w.glide > 0.5, `m=${m}: glide ${w.glide}`);
    assert.ok(w.glideDrift < 1e-9, `m=${m}: speed changed while gliding by ${w.glideDrift}`);
  }
});

test("with friction, a push smaller than μmg is balanced and nothing moves", () => {
  assert.equal(netForce(1, 1, 0, false), 0);
  assert.ok(near(netForce(4, 1, 0, false), 4 - MU * G));
  const still = runToEnd({ ...base, air: false, F: 1.5, mA: 1 });
  assert.equal(still.moved, false);
  const moves = runToEnd({ ...base, air: false, F: 5, mA: 1, mB: 3 });
  assert.equal(moves.moved, true);
  // Friction then stops it: it does not glide on.
  assert.equal(moves.exitB, null);
});

test("total momentum is the same just before and just after every collision", () => {
  for (const kind of ["elastic", "sticky"] as const) {
    for (const [mA, mB] of [
      [0.5, 3],
      [2, 1],
      [1, 1],
    ]) {
      const w = runToEnd({ ...base, kind, mA, mB, F: 3, pushTime: 0.25 });
      assert.ok(w.hits.length >= 1, `${kind} ${mA}/${mB}: no collision`);
      const h = w.hits[0];
      assert.ok(near(h.before[0] + h.before[1], h.after[0] + h.after[1]), `${kind} ${mA}/${mB}`);
      assert.ok(near(h.before[0] + h.before[1], 3 * 0.25), "equals the impulse F × t");
    }
  }
});

test("recoil: equal and opposite momentum, the lighter cart moves faster (third law)", () => {
  const w = runToEnd({ ...base, mode: "recoil", mA: 2, mB: 0.5, F: 2, pushTime: 0.2 });
  const [pA, pB] = w.afterPush!;
  assert.ok(near(pA + pB, 0), `total ${pA + pB}`);
  assert.ok(near(pB, 0.4));
  assert.ok(near(pB / 0.5, -4 * (pA / 2)), "speed ratio is mA/mB");
});

test("every challenge round can be hit with the sliders", () => {
  for (const r of ROUNDS) {
    let found: Settings | null = null;
    for (const mA of range(SLIDERS.mass))
      for (const F of range(SLIDERS.force))
        for (const pushTime of range(SLIDERS.time)) {
          if (found) break;
          const expect = r.kind === "elastic" ? (2 * F * pushTime) / (mA + r.mB) : (F * pushTime) / (mA + r.mB);
          if (Math.abs(expect - r.v) <= TOLERANCE / 2) found = { mode: "collide", kind: r.kind, air: true, mA, mB: r.mB, F, pushTime };
        }
    assert.ok(found, `round ${r.label} has no solution`);
    const w = runToEnd(found);
    assert.ok(w.exitB !== null && Math.abs(w.exitB - r.v) <= TOLERANCE, `${r.label}: B left at ${w.exitB}`);
  }
});
