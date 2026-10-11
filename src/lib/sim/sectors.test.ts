import assert from "node:assert/strict";
import { test } from "node:test";
import { SLICE_ROUNDS, lesson } from "../../content/lessons/circle-areas";
import {
  RADIUS,
  SEG_THETA,
  THETA,
  arcLength,
  chordLength,
  meetsSliceRound,
  sectorArea,
  segmentArea,
  sliceSolutions,
  to2,
  triangleArea,
} from "./sectors";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);
const range = (r: { min: number; max: number; step: number }) => {
  const out: number[] = [];
  for (let v = r.min; v <= r.max + 1e-9; v += r.step) out.push(Math.round(v * 1000) / 1000);
  return out;
};
const PI7 = 22 / 7;

test("a full turn gives the whole circle", () => {
  close(arcLength(360, 7), 2 * Math.PI * 7);
  close(sectorArea(360, 7), Math.PI * 49);
});

test("a 90° slice is a quarter of the area and of the crust", () => {
  for (const r of range(RADIUS)) {
    close(sectorArea(90, r), sectorArea(360, r) / 4);
    close(arcLength(90, r), arcLength(360, r) / 4);
  }
});

test("the minute hand: 20 minutes is 120°, sweeping 51.31 cm² with a 14.66 cm arc", () => {
  close((20 / 60) * 360, 120);
  assert.equal(to2(sectorArea(120, 7)), 51.31);
  assert.equal(to2(arcLength(120, 7)), 14.66);
});

test("doubling r doubles the arc and makes the area 4 times as big", () => {
  for (const t of [30, 72, 200]) {
    close(arcLength(t, 10) / arcLength(t, 5), 2);
    close(sectorArea(t, 10) / sectorArea(t, 5), 4);
  }
});

test("segment = sector − triangle", () => {
  assert.equal(to2(sectorArea(90, 10)), 78.54);
  close(triangleArea(90, 10), 50);
  assert.equal(to2(segmentArea(90, 10)), 28.54);
  // At 180° the triangle is flat and the segment is a half circle.
  close(triangleArea(180, 10), 0, 1e-9);
  close(segmentArea(180, 10), (Math.PI * 100) / 2, 1e-9);
  // At 60° the triangle is equilateral: the chord equals r.
  close(chordLength(60, 10), 10);
  close(triangleArea(60, 10), (Math.sqrt(3) / 4) * 100);
  for (const t of range(SEG_THETA)) assert.ok(segmentArea(t, 10) >= 0);
});

test("task values are on the sliders", () => {
  for (const t of [90, 120, 180]) assert.ok(range(THETA).includes(t));
  assert.ok(range(SEG_THETA).includes(180));
  for (const r of [5, 7, 10, 14]) assert.ok(range(RADIUS).includes(r));
});

test("each challenge slice has exactly one answer on the slider, and the start angle is not it", () => {
  const want = [72, 90, 60];
  SLICE_ROUNDS.forEach((round, i) => {
    assert.deepEqual(sliceSolutions(round), [want[i]], round.name);
    assert.ok(range(RADIUS).includes(round.r));
    assert.ok(!meetsSliceRound(45, round), `start solves ${round.name}`);
  });
  // The textbook π values give the same angles.
  close((22 / (2 * PI7 * 14)) * 360, 90);
  assert.equal(Math.round((52.36 / (3.14 * 100)) * 360), 60);
  // The hidden areas the student will see after cutting.
  assert.equal(to2(sectorArea(60, 10)), 52.36);
});

test("hook and quiz answers", () => {
  // Aman's 60° of r = 14 is twice Bina's 120° of r = 7.
  close(sectorArea(60, 14) / sectorArea(120, 7), 2);
  assert.equal(lesson.predict.answer, 2);
  const q = lesson.quiz;
  close((90 / 360) * PI7 * 14 * 14, 154);
  assert.equal(q[0].options[q[0].answer], "154 cm²");
  close((60 / 360) * 2 * PI7 * 21, 22);
  assert.equal(q[1].options[q[1].answer], "22 cm");
  close(sectorArea(50, 6) / sectorArea(50, 3), 4);
  assert.equal(q[2].options[q[2].answer], "4 times as big");
  close((77 / (PI7 * 49)) * 360, 180);
  assert.equal(q[3].options[q[3].answer], "180°");
  close((90 / 360) * 3.14 * 100 - 50, 28.5);
  assert.equal(q[4].options[q[4].answer], "28.5 cm²");
});
