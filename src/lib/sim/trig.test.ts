import assert from "node:assert/strict";
import { test } from "node:test";
import { RAMP_ROUNDS, lesson } from "../../content/lessons/trig-ratios";
import { ANGLE, LEN, RISE, RUN, TABLE, buildRamp, identity, is345, meetsRampRound, rampSolutions, ratios, sideRatios, slideSides } from "./trig";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);
const range = (r: { min: number; max: number; step: number }) => {
  const out: number[] = [];
  for (let v = r.min; v <= r.max + 1e-9; v += r.step) out.push(Math.round(v * 1000) / 1000);
  return out;
};

test("the ratios measured from the sides do not depend on the slide's length", () => {
  for (const th of range(ANGLE)) {
    const want = ratios(th);
    for (const L of range(LEN)) {
      const s = slideSides(th, L);
      const got = sideRatios(s.opp, s.adj, s.hyp);
      close(got.sin, want.sin);
      close(got.cos, want.cos);
      close(got.tan, want.tan, 1e-9 * want.tan);
    }
  }
});

test("the slider reaches 30°, 45°, 60° and both ends; three lengths fit on the slider", () => {
  const angles = range(ANGLE);
  for (const a of [5, 30, 45, 60, 85]) assert.ok(angles.includes(a), `${a}°`);
  assert.ok(range(LEN).length >= 3);
});

test("the table of exact values matches the sliders' numbers", () => {
  for (const row of TABLE) {
    const r = ratios(row.deg);
    close(r.sin, row.sin[1]);
    close(r.cos, row.cos[1]);
    close(r.tan, row.tan[1]);
  }
  // Numbers quoted in the "found" text, to 3 places.
  assert.equal(ratios(30).sin.toFixed(3), "0.500");
  assert.equal(ratios(45).sin.toFixed(3), "0.707");
  assert.equal(ratios(45).cos.toFixed(3), "0.707");
  assert.equal(ratios(60).sin.toFixed(3), "0.866");
  assert.equal(ratios(60).cos.toFixed(3), "0.500");
  assert.equal(ratios(5).sin.toFixed(3), "0.087");
  assert.equal(ratios(5).cos.toFixed(3), "0.996");
  assert.equal(ratios(85).sin.toFixed(3), "0.996");
  assert.equal(ratios(85).cos.toFixed(3), "0.087");
  assert.equal(ratios(85).tan.toFixed(3), "11.430");
});

test("sin²θ + cos²θ = 1 at every angle", () => {
  for (const th of range(ANGLE)) close(identity(th), 1);
});

test("a 3-4-5 ramp", () => {
  const r = buildRamp(3, 4);
  close(r.hyp, 0.5);
  close(r.sin, 3 / 5);
  close(r.cos, 4 / 5);
  close(r.sin ** 2 + r.cos ** 2, 1);
  assert.ok(is345(3, 4) && is345(6, 8) && is345(9, 12) && !is345(4, 3));
  // The task's rise 0.3 m and run 0.4 m are on the sliders.
  assert.ok(range(RISE).includes(3) && range(RUN).includes(4));
});

test("every challenge ramp can be built with the sliders, and the start position solves none", () => {
  for (const round of RAMP_ROUNDS) {
    const sols = rampSolutions(round);
    assert.ok(sols.length > 0, round.name);
    assert.ok(!meetsRampRound(2, 5, round), `start solves ${round.name}`);
  }
  assert.ok(meetsRampRound(1, 12, RAMP_ROUNDS[0]));
  assert.ok(meetsRampRound(3, 36, RAMP_ROUNDS[0]));
  assert.ok(meetsRampRound(3, 4, RAMP_ROUNDS[1]));
  assert.ok(meetsRampRound(5, 12, RAMP_ROUNDS[2]));
  assert.ok(!meetsRampRound(12, 5, RAMP_ROUNDS[2]));
});

test("quiz answers", () => {
  const q = lesson.quiz;
  // 1: sin θ = 5 ÷ 13.
  assert.equal(q[0].options[q[0].answer], "5 ÷ 13");
  // 2: adjacent 12, tan = 5 ÷ 12.
  close(Math.sqrt(13 ** 2 - 5 ** 2), 12);
  assert.equal(q[1].options[q[1].answer], "5 ÷ 12");
  // 3: sin 30° + cos 60° = 1.
  close(ratios(30).sin + ratios(60).cos, 1);
  assert.equal(q[2].options[q[2].answer], "1");
  // 4: cos θ when sin θ = 0.6.
  const th = (Math.asin(0.6) * 180) / Math.PI;
  close(ratios(th).cos, 0.8);
  assert.equal(q[3].options[q[3].answer], "0.8");
  // 5: run = 0.5 × 12.
  close(0.5 / (1 / 12), 6);
  assert.equal(q[4].options[q[4].answer], "6 m");
  // Predict: same ratio.
  close(slideSides(30, 1).opp / 1, slideSides(30, 2).opp / 2);
  assert.equal(lesson.predict.answer, 1);
});
