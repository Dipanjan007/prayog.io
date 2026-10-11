import assert from "node:assert/strict";
import { test } from "node:test";
import { SOLID_ROUNDS, lesson } from "../../content/lessons/solids";
import {
  CAP_RANGE,
  GLASS,
  H_RANGE,
  PI,
  R_RANGE,
  closeEnough,
  conesFromTub,
  cone,
  cylinder,
  fillAfter,
  glassVolume,
  hemisphere,
  isDoubled,
  pourVolume,
  round2,
  slant,
  solidSurface,
  solidVolume,
  sphere,
  type SolidDims,
} from "./solids";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);
const onSlider = (v: number, r: { min: number; max: number; step: number }) =>
  v >= r.min - 1e-9 && v <= r.max + 1e-9 && Math.abs(Math.round((v - r.min) / r.step) * r.step - (v - r.min)) < 1e-9;

test("π is 22/7 and the basic formulas", () => {
  close(PI, 22 / 7);
  close(cylinder.volume(7, 12), 1848);
  close(cone.volume(7, 12), 616);
  close(slant(3.5, 12), 12.5);
  close(hemisphere.volume(3.5) * 2, sphere.volume(3.5));
  close(sphere.surface(7), 616);
});

test("pouring: three cones fill the glass, one ball fills two thirds", () => {
  close(glassVolume(), 269.5);
  close(GLASS.h, 2 * GLASS.r);
  close(round2(pourVolume("cone")), 89.83);
  close(round2(pourVolume("ball")), 179.67);
  close(fillAfter("cone", 3), 1);
  assert.ok(fillAfter("cone", 2) < 1);
  close(fillAfter("ball", 1), 2 / 3);
  assert.ok(fillAfter("ball", 2) > 1);
});

test("ice-cream cone with r = 3.5 cm and h = 12 cm", () => {
  const d: SolidDims = { r: 3.5, h: 12, H: 1 };
  close(cone.volume(3.5, 12), 154);
  close(round2(hemisphere.volume(3.5)), 89.83);
  close(round2(solidVolume("icecream", d)), 243.83);
  close(cone.curved(3.5, 12), 137.5);
  close(hemisphere.curved(3.5), 77);
  close(solidSurface("icecream", d), 214.5);
  assert.ok(onSlider(3.5, R_RANGE) && onSlider(12, H_RANGE));
});

test("doubling every length: area × 4, volume × 8", () => {
  const small: SolidDims = { r: 2, h: 5, H: 1.5 };
  const big: SolidDims = { r: 4, h: 10, H: 3 };
  assert.ok(isDoubled("tent", small, big));
  assert.ok(!isDoubled("tent", small, { ...big, H: 1.5 }));
  assert.ok(isDoubled("capsule", small, { ...big, H: 7 }));
  for (const id of ["icecream", "capsule", "tent", "cylinder"] as const) {
    close(solidVolume(id, big) / solidVolume(id, small), 8, 1e-9);
    close(solidSurface(id, big) / solidSurface(id, small), 4, 1e-9);
  }
  // Every slider can be doubled from somewhere.
  assert.ok(R_RANGE.max >= 2 * R_RANGE.min && H_RANGE.max >= 2 * H_RANGE.min && CAP_RANGE.max >= 2 * CAP_RANGE.min);
});

test("each challenge round is solvable with the lab's sliders and its answer is right", () => {
  assert.equal(SOLID_ROUNDS.length, 3);
  // Ice-cream parlour: tub r 6, h 15; cones r 3, h 12.
  const tub = { r: 6, h: 15, H: 1 };
  const scoop = { r: 3, h: 12, H: 1 };
  close(conesFromTub(tub, scoop), 10);
  close(SOLID_ROUNDS[0].answer, 10);
  // Camp canvas: r 3.5, wall 2, cone 1.2: l = 3.7, canvas = 44 + 40.7.
  const tent = { r: 3.5, h: 2, H: 1.2 };
  close(slant(3.5, 1.2), 3.7);
  close(solidSurface("tent", tent), 84.7);
  close(SOLID_ROUNDS[1].answer, 84.7);
  // Gulab jamun: r 1.4, cylinder 5 − 2.8 = 2.2 long; 30% of 45 of them.
  const jamun = { r: 1.4, h: 2.2, H: 1 };
  close(round2(solidVolume("capsule", jamun) * 45 * 0.3), SOLID_ROUNDS[2].answer);
  for (const d of [tub, scoop, tent, jamun]) assert.ok(onSlider(d.r, R_RANGE) && onSlider(d.h, H_RANGE), JSON.stringify(d));
  assert.ok(onSlider(tent.H, CAP_RANGE));
  for (const r of SOLID_ROUNDS) {
    assert.ok(closeEnough(r.answer, r));
    assert.ok(!closeEnough(r.answer * 1.1, r));
    assert.ok(!closeEnough(NaN, r));
  }
  assert.ok(closeEnough(338, SOLID_ROUNDS[2]));
  assert.ok(!closeEnough(11, SOLID_ROUNDS[0]));
});

test("predict and quiz answers", () => {
  assert.equal(lesson.predict.options[lesson.predict.answer], String(Math.round(1 / fillAfter("cone", 1))));
  const q = lesson.quiz;
  assert.equal(q[0].options[q[0].answer], `${cone.volume(7, 12)} cm³`);
  close(cone.volume(7, 12) * 3, 1848);
  const toy = { r: 3.5, h: 15.5 - 3.5, H: 1 };
  assert.equal(q[1].options[q[1].answer], `${solidSurface("icecream", toy)} cm²`);
  close(solidSurface("icecream", toy) + 2 * PI * 3.5 * 3.5, 291.5);
  assert.equal(q[3].options[q[3].answer], `${sphere.volume(2) / sphere.volume(1)} times as big`);
  assert.equal(q[4].options[q[4].answer], String(Math.round(sphere.volume(3) / sphere.volume(1))));
  for (const x of q) assert.equal(x.options.length, 4);
});
