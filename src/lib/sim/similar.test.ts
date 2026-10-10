import assert from "node:assert/strict";
import { test } from "node:test";
import { MYSTERIES, lesson } from "../../content/lessons/similar-triangles";
import {
  BASE,
  BUILDING,
  K,
  STICK,
  SUN,
  T,
  TILT,
  angleOpposite,
  angles,
  bptCut,
  bptRatios,
  closeEnough,
  corners,
  heightFromShadow,
  ratiosMatch,
  scaled,
  shadowLen,
  sunFor,
} from "./similar";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);
const steps = (r: { min: number; max: number; step: number }) => {
  const out: number[] = [];
  for (let v = r.min; v <= r.max + 1e-9; v += r.step) out.push(Math.round(v * 1000) / 1000);
  return out;
};

test("scaling multiplies every side by k and keeps every angle", () => {
  const a = angles(BASE);
  close(a.A + a.B + a.C, 180);
  for (const k of steps(K)) {
    const c = scaled(k);
    close(c.PQ / BASE.AB, k);
    close(c.QR / BASE.BC, k);
    close(c.RP / BASE.CA, k);
    const b = angles({ AB: c.PQ, BC: c.QR, CA: c.RP });
    close(b.A, a.A);
    close(b.B, a.B);
    close(b.C, a.C);
  }
  assert.ok(steps(K).includes(2) && steps(K).includes(0.5));
  const { A, B, C } = corners(BASE.AB, BASE.BC, BASE.CA);
  close(Math.hypot(A.x - B.x, A.y - B.y), BASE.AB);
  close(Math.hypot(A.x - C.x, A.y - C.y), BASE.CA);
  close(angleOpposite(5, 3, 4), 90);
});

test("BPT: with DE parallel to BC the ratios match at every slider position", () => {
  for (const t of steps(T)) {
    const c = bptCut(t, 0);
    assert.ok(c.onSide, `t = ${t}`);
    assert.ok(ratiosMatch(c), `t = ${t}`);
    close(c.AD + c.DB, 6.5);
    close(c.AE + c.EC, 7.5);
    close(c.E.y, c.D.y);
  }
  // The triangle's sides really are 6.5, 7 and 7.5 cm.
  const half = bptCut(0.5, 0);
  close(half.AE, 3.75);
});

test("converse: any tilt that still cuts AC gives different ratios", () => {
  let cuts = 0;
  for (const t of steps(T))
    for (const tilt of steps(TILT)) {
      if (tilt === 0) continue;
      const c = bptCut(t, tilt);
      if (!c.onSide) continue;
      cuts++;
      assert.ok(!ratiosMatch(c), `t = ${t}, tilt = ${tilt}`);
      const { left, right } = bptRatios(c);
      assert.ok(Math.abs(left - right) >= 0.001, `t = ${t}, tilt = ${tilt}: ${left} vs ${right}`);
    }
  assert.ok(cuts > 100);
  // The task's starting spot (D halfway, tilt 5°) is a real cut.
  assert.ok(bptCut(0.5, 5).onSide);
});

test("shadows: at 45° the stick's shadow equals its height, and so does the building's", () => {
  assert.ok(45 >= SUN.min && 45 <= SUN.max);
  close(shadowLen(STICK, 45), 1);
  close(shadowLen(BUILDING, 45), 12);
  for (const e of steps(SUN)) close(heightFromShadow(STICK, shadowLen(STICK, e), shadowLen(BUILDING, e)), BUILDING);
  close(sunFor(1, 1), 45);
});

test("each mystery height follows from its shadows and is checked to within 0.5 m", () => {
  assert.equal(MYSTERIES.length, 3);
  for (const m of MYSTERIES) {
    close(heightFromShadow(m.h, m.s, m.S), m.H);
    assert.ok(closeEnough(m.H, m.H) && closeEnough(m.H + 0.4, m.H) && !closeEnough(m.H + 1, m.H));
    const e = sunFor(m.h, m.s);
    assert.ok(e > 10 && e < 80, `${m.id}: sun at ${e}°`);
  }
  const p = MYSTERIES[2];
  assert.equal(p.S, 104 + p.halfBase!);
  // Forgetting half the base gives a wrong answer.
  assert.ok(!closeEnough(heightFromShadow(p.h, p.s, 104), p.H));
  // The pyramid's faces are steeper than the Sun, so its shadow does stick out past the base.
  assert.ok(Math.atan(p.H / p.halfBase!) > Math.atan(p.h / p.s));
  assert.ok(!closeEnough(Number(""), 10));
});

test("predict and quiz answers", () => {
  close(heightFromShadow(1, 2, 30), 15);
  assert.equal(lesson.predict.options[lesson.predict.answer], "15 m");
  const q = lesson.quiz;
  assert.equal(q.length, 5);
  for (const x of q) assert.equal(x.options.length, 4);
  assert.equal(q[0].options[q[0].answer], `${3 * (15 / 5)} cm`);
  assert.equal(q[1].options[q[1].answer], `${4 * (3 / 2)} cm`);
  assert.equal(q[2].options[q[2].answer], `${heightFromShadow(1.5, 2, 12)} m`);
  assert.equal(q[3].options[q[3].answer], `${180 - (50 + 60)}°`);
  // Equilateral triangles of any size share their angles.
  const eq = angles({ AB: 2, BC: 2, CA: 2 });
  close(eq.A, 60);
  assert.equal(q[4].answer, 2);
});

test("formulas bracket a division before a subtraction or addition", () => {
  const risky = /÷\s*[^\s()]+\s*[−+]/u;
  for (const f of [lesson.discovery.formula, ...lesson.ideas.map((i) => i.formula ?? "")]) assert.ok(!risky.test(f), f);
});
