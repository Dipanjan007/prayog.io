import assert from "node:assert/strict";
import { test } from "node:test";
import * as P from "./oly-projectile";
import * as I from "./oly-incline";
import * as T from "./oly-track";
import * as M from "./oly-momentum";

const near = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

test("projectile: 45° from the ground gives the textbook range v² / g", () => {
  const v = 20;
  const t = P.timeToHeight(v, 45, 0, 0);
  assert.ok(near(P.projectileAt(v, 45, 0, t).x, (v * v) / P.G));
});

test("projectile: speedThroughPoint really passes through the point", () => {
  for (const [ang, h0, x, y] of [
    [30, 0, 40, 5],
    [55, 2, 25, 10],
    [40, 1, 68, 3.5],
  ]) {
    const v = P.speedThroughPoint(ang, h0, x, y);
    assert.ok(near(P.heightAtX(v, ang, h0, x), y), `${ang} ${x} ${y}`);
  }
  assert.ok(Number.isNaN(P.speedThroughPoint(10, 0, 10, 50)), "too steep a target is impossible");
});

test("projectile: moving-target speed lands on the moving target", () => {
  for (const [ang, x0, u] of [
    [45, 10, 0],
    [53.13, 12, 4],
    [60, 5, -1],
  ]) {
    const v = P.speedForMovingTarget(ang, x0, u);
    const t = P.timeToHeight(v, ang, 0, 0);
    assert.ok(near(P.projectileAt(v, ang, 0, t).x, x0 + u * t), `${ang} ${x0} ${u}`);
  }
});

test("river: the heading lands on the chosen spot, and zero heading drifts by c·W/u", () => {
  for (const drift of [0, 120, -50]) {
    const h = P.headingForLanding(3, 1.5, 300, drift);
    const plan = P.planRiver({ kind: "river", W: 300, u: 3, c: 1.5, headingDeg: h, ghat: drift, half: 1 });
    assert.ok(near(plan.end.down, drift, 1e-6), `drift ${drift}: got ${plan.end.down}`);
    assert.equal(plan.outcome.ok, true);
  }
  const straight = P.planRiver({ kind: "river", W: 300, u: 3, c: 1.5, headingDeg: 0, ghat: 0, half: 1 });
  assert.ok(near(straight.end.down, 150));
});

test("incline: Atwood acceleration and time agree", () => {
  assert.ok(near(I.atwoodAccel(3, 1), 4.9));
  const m = I.atwoodMassForTime(5, 1.5, 2);
  const a = I.atwoodAccel(5, m);
  assert.ok(near(Math.sqrt((2 * 1.5) / a), 2));
});

test("incline: frictionless slope accelerates at g sinθ, and a block on a gentle slope with enough static friction stays put", () => {
  const plan = I.planIncline({ kind: "slide", thetaDeg: 30, L: 100, v0: 0.0001, muK: 0, muS: 0 });
  assert.ok(near(plan.at(1).v - 0.0001, I.G * 0.5, 1e-6));
  const stuck = I.planIncline({ kind: "slide", thetaDeg: 10, L: 4, v0: 1, muK: 0.4, muS: 0.5 });
  const stopT = stuck.duration;
  assert.ok(near(stuck.at(stopT + 5).s, stuck.at(stopT).s), "stays stopped");
});

test("incline: μ found for stopping makes the crate stop at the edge", () => {
  const mu = I.muToStopAfter(3, 4, 20);
  const plan = I.planIncline({ kind: "slide", thetaDeg: 20, L: 4, v0: 3, muK: mu, muS: 0.6 });
  assert.ok(near(plan.at(plan.duration).s, 4, 1e-6));
});

test("incline: pulley tension is consistent with both free-body diagrams", () => {
  const m1 = 8,
    th = 30,
    mu = 0.25;
  const m2 = I.pulleyMassForTime(m1, th, mu, 2.4, 2);
  const a = I.pulleyAccelUp(m1, m2, th, mu);
  assert.ok(near(a, 1.2));
  const Tn = I.pulleyTension(m2, a);
  const r = Math.PI / 180;
  assert.ok(near(Tn - m1 * I.G * (Math.sin(th * r) + mu * Math.cos(th * r)), m1 * a));
});

test("incline: a counterweight too light to beat static friction leaves the crate still", () => {
  const plan = I.planIncline({ kind: "pulley", m1: 8, m2: 5, thetaDeg: 30, muK: 0.25, muS: 0.3, d: 2.4, targetT: 2 });
  assert.equal(plan.outcome.ok, false);
  assert.ok(near(plan.at(1).s, 0));
});

test("track: bank angle needs no friction, wrong angles slip the right way", () => {
  const th = T.bankAngle(10, 40);
  assert.ok(Math.abs(T.bankSlip(10, 40, th)) < 1e-9);
  assert.ok(T.bankSlip(10, 40, th + 5) > 0, "too steep: slides inward");
  assert.ok(T.bankSlip(10, 40, th - 5) < 0, "too flat: slides outward");
});

test("track: release from 2.5R just clears the loop, and the normal force at the top matches", () => {
  const R = 2;
  assert.equal(T.loopFate(5 * T.G * R, R).kind, "clear");
  assert.ok(near(T.loopNormal(5 * T.G * R, R, Math.PI), 0, 1e-9));
  assert.ok(near(T.loopNormal(5 * T.G * R, R, 0), 6), "six times the weight at the bottom when only just clearing");
  const h = T.loopHeightForTopNormal(R, 1);
  assert.ok(near(T.loopNormal(2 * T.G * h, R, Math.PI), 1));
  assert.equal(T.loopFate(1.5 * T.G * R, R).kind, "slideBack");
  const leave = T.loopFate(4 * T.G * R, R);
  assert.equal(leave.kind, "leave");
  if (leave.kind === "leave") {
    assert.ok(leave.phi > Math.PI / 2 && leave.phi < Math.PI);
    assert.ok(near(T.loopNormal(4 * T.G * R, R, leave.phi), 0, 1e-9));
  }
});

test("track: spring compression gives exactly 5gR at the loop bottom after the rough patch", () => {
  const x = T.springCompressionForLoop(800, 0.5, 0.2, 1.2, 0.4);
  const v2 = T.bottomSpeed2({ kind: "loop", R: 0.4, m: 0.5, start: { type: "spring", k: 800, x }, mu: 0.2, patch: 1.2, topTarget: 0, window: 0.1 });
  assert.ok(near(v2, 5 * T.G * 0.4));
});

test("momentum: recoil and ballistic pendulum keep momentum", () => {
  assert.ok(near(M.recoilSpeed(60, 3, 4) * 60, 12));
  const v = M.bulletSpeedForAngle(0.001, 0.2, 0.8, 20);
  const sw = M.pendulumSwing(0.001, 0.2, v, 0.8);
  assert.ok(near(sw.angleDeg, 20));
  assert.ok(near(0.001 * v, 0.201 * sw.V));
});

test("momentum: 2D lock-together crash keeps both momentum components", () => {
  const V = M.lockTogether(1200, { x: 8, y: 0 }, 400, { x: 0, y: 14 });
  assert.ok(near(1600 * V.x, 1200 * 8));
  assert.ok(near(1600 * V.y, 400 * 14));
  const v1 = M.eastSpeedFromSkid(1200, 400, 30, 5, 0.5);
  const v2 = M.northSpeedFromSkid(1200, 400, 30, 5, 0.5);
  const W = M.lockTogether(1200, { x: v1, y: 0 }, 400, { x: 0, y: v2 });
  assert.ok(near(Math.atan2(W.y, W.x) * (180 / Math.PI), 30));
  assert.ok(near(M.skidDistance(Math.hypot(W.x, W.y), 0.5), 5));
});
