import assert from "node:assert/strict";
import { test } from "node:test";
import { LOADING_JOBS, TRUCK_BED_H } from "../../content/lessons/simple-machines";
import {
  G,
  PULLEYS,
  RAMP_MU,
  efficiency,
  kgf,
  liftTime,
  mechanicalAdvantage,
  power,
  pulleyEffort,
  rampAngle,
  rampForce,
  ropePulled,
  shortestRamp,
  weight,
  work,
  workMeterRun,
  workSign,
} from "./machines";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test("g is 9.8 m/s² and a 1 kg mass weighs 9.8 N", () => {
  close(G, 9.8);
  close(weight(1), 9.8);
  close(kgf(60), 588);
});

test("W = F d cos θ: positive at 0°, zero at 90°, negative at 180°", () => {
  close(work(20, 3, 0), 60);
  assert.equal(work(20, 3, 90), 0);
  close(work(20, 3, 180), -60);
  close(work(10, 2, 60), 10);
  assert.equal(workSign(work(5, 1, 0)), "positive");
  assert.equal(workSign(work(5, 1, 90)), "zero");
  assert.equal(workSign(work(5, 1, 180)), "negative");
});

test("work meter: lifting, lowering, carrying level and pushing a box", () => {
  const lift = workMeterRun("lift", 10, 2);
  close(lift.W, 196);
  close(lift.Wg, -196);
  const lower = workMeterRun("lower", 10, 1);
  close(lower.W, -98);
  close(lower.Wg, 98);
  const carry = workMeterRun("carry", 10, 5);
  assert.equal(carry.W, 0);
  assert.equal(carry.Wg, 0);
  const push = workMeterRun("push", 10, 2, 0.3);
  close(push.F, 29.4);
  close(push.W, 58.8);
  close(push.Wf, -58.8);
  close(push.W + push.Wf + push.Wg, 0);
});

test("ideal pulleys: MA equals the number of strands, and effort × rope = load × height", () => {
  const load = weight(100);
  for (const p of PULLEYS) {
    const E = pulleyEffort(load, p.n, p.k, false);
    close(mechanicalAdvantage(load, E), p.n);
    close(E * ropePulled(3, p.n), load * 3, 1e-6);
    close(efficiency(load, 3, E, ropePulled(3, p.n)), 1);
  }
  close(pulleyEffort(800, 4, 4, false), 200);
  close(ropePulled(0.5, 4), 2);
});

test("a single fixed pulley gives no force advantage; a movable one halves the effort", () => {
  close(pulleyEffort(147, 1, 1, false), 147);
  close(pulleyEffort(147, 2, 1, false), 73.5);
});

test("with friction the real MA is below the ideal MA and work in exceeds work out", () => {
  const load = weight(200);
  for (const p of PULLEYS) {
    const E = pulleyEffort(load, p.n, p.k, true);
    const ma = mechanicalAdvantage(load, E);
    assert.ok(ma < p.n && ma > 0.85 * p.n, `${p.id}: MA ${ma}`);
    assert.ok(E * ropePulled(2, p.n) > load * 2);
  }
});

test("inclined plane: F × L = m g h with no friction, and a ramp twice as long halves the force", () => {
  const m = 50;
  const h = 1;
  for (const L of [1.5, 2, 3, 4.5, 6]) close(rampForce(m, h, L) * L, m * G * h, 1e-9);
  close(rampForce(m, h, 4) / rampForce(m, h, 2), 0.5);
  close(rampForce(60, 1.2, 4), 176.4, 1e-9);
  close(rampAngle(1, 2), 30, 1e-9);
  close(rampForce(m, h, h), m * G, 1e-9); // a vertical "ramp" is a straight lift
  // With friction the pull is bigger and F × L is more than m g h.
  assert.ok(rampForce(m, h, 3, RAMP_MU) * 3 > m * G * h);
});

test("power: P = W / t, and a motor's lift time is m g h / P", () => {
  close(power(6000, 30), 200);
  close(power(50 * G * 3, 5), 294);
  close(liftTime(50, 10, 250), 19.6);
});

test("challenge job 1: the motorbike needs a ramp of about 3.4 m, and the planks reach 6 m", () => {
  const job = LOADING_JOBS[0];
  assert.equal(job.kind, "ramp");
  if (job.kind !== "ramp") return;
  assert.equal(job.h, TRUCK_BED_H);
  const L = shortestRamp(job.m, job.h, job.maxF, RAMP_MU)!;
  assert.ok(L > 3 && L < 3.6, `shortest ramp ${L}`);
  assert.ok(rampForce(job.m, job.h, 6, RAMP_MU) <= job.maxF);
  assert.ok(rampForce(job.m, job.h, 3, RAMP_MU) > job.maxF);
});

test("challenge job 2: only the 4-strand block and tackle lifts 200 kg within 60 kg-force", () => {
  const job = LOADING_JOBS[1];
  assert.equal(job.kind, "pulley");
  if (job.kind !== "pulley") return;
  const ok = PULLEYS.filter((p) => pulleyEffort(weight(job.m), p.n, p.k, true) <= kgf(job.maxEffortKg)).map((p) => p.id);
  assert.deepEqual(ok, ["tackle4"]);
});

test("challenge job 3: 250 W is the smallest motor that lifts the bricks in 20 s", () => {
  const job = LOADING_JOBS[2];
  assert.equal(job.kind, "motor");
  if (job.kind !== "motor") return;
  const ok = job.motors.filter((P) => liftTime(job.m, job.h, P) <= job.maxT);
  assert.equal(Math.min(...ok), 250);
});
