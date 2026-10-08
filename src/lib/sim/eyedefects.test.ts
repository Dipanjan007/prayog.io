import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RELAXED_D,
  amplitudeAtAge,
  bifocalHalf,
  distanceGlassesPower,
  eyeAtAge,
  eyeWithAmplitude,
  farPoint,
  focalFromPower,
  lensImage,
  nearPoint,
  neededPower,
  powerFromFocal,
  readingGlassesPower,
  viewThrough,
} from "./eyedefects";

const close = (a: number, b: number, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} vs ${b}`);

test("P = 1/f: a 25 cm convex lens is +4 D and a −50 cm concave lens is −2 D", () => {
  close(powerFromFocal(0.25), 4);
  close(powerFromFocal(-0.5), -2);
  close(focalFromPower(3), 1 / 3);
});

test("the relaxed eye is 40 D, so parallel light focuses 2.5 cm behind the lens", () => {
  close(RELAXED_D, 40);
  close(lensImage(-Infinity, RELAXED_D), 0.025);
  // To focus a book at 25 cm on the retina the eye needs 44 D.
  close(neededPower(0.25), 44);
  close(lensImage(-0.25, 44), 0.025);
});

test("a young eye sees from 25 cm to infinity", () => {
  const eye = eyeAtAge(15);
  close(nearPoint(eye), 0.25);
  assert.equal(farPoint(eye), Infinity);
  for (const d of [0.25, 0.5, 2, Infinity]) assert.equal(viewThrough(eye, d, 0).sharp, true, `d=${d}`);
  const tooClose = viewThrough(eye, 0.2, 0);
  assert.equal(tooClose.sharp, false);
  assert.equal(tooClose.focus, "behind");
});

test("the near point moves away with age: 25 cm at 15, about 50 cm at 45, 1 m at 60", () => {
  close(nearPoint(eyeAtAge(15)), 0.25);
  close(nearPoint(eyeAtAge(45)), 0.5);
  close(nearPoint(eyeAtAge(60)), 1);
  let last = 0;
  for (let age = 15; age <= 80; age += 5) {
    const np = nearPoint(eyeAtAge(age));
    assert.ok(np >= last, `age ${age}: ${np}`);
    last = np;
  }
  close(amplitudeAtAge(80), 0.5);
});

test("a 60-year-old needs +3 D reading glasses (near point 1 m)", () => {
  const eye = eyeAtAge(60);
  close(readingGlassesPower(1), 3);
  // Without glasses the newspaper at 25 cm blurs, image behind the retina.
  assert.equal(viewThrough(eye, 0.25, 0).focus, "behind");
  // A +3 D lens makes a virtual image of the newspaper exactly at the near point, 1 m away.
  close(lensImage(-0.25, 3), -1);
  const v = viewThrough(eye, 0.25, 3);
  assert.equal(v.sharp, true);
  close(v.imageDistance, 1);
  // +2 D is too weak.
  assert.equal(viewThrough(eye, 0.25, 2).sharp, false);
});

test("reading glasses power for other near points", () => {
  close(readingGlassesPower(0.5), 2);
  close(readingGlassesPower(2), 3.5);
  close(readingGlassesPower(0.25), 0);
  for (const amp of [2, 1.5, 0.5]) {
    const eye = eyeWithAmplitude(amp);
    assert.equal(viewThrough(eye, 0.25, readingGlassesPower(nearPoint(eye))).sharp, true, `amp ${amp}`);
  }
});

test("a short-sighted grandparent needs a bifocal: −0.5 D on top and about +3 D below", () => {
  const eye = eyeAtAge(60, true);
  close(farPoint(eye), 2);
  close(distanceGlassesPower(2), -0.5);
  assert.equal(viewThrough(eye, Infinity, 0).focus, "front");
  assert.equal(viewThrough(eye, Infinity, -0.5).sharp, true);
  assert.equal(viewThrough(eye, 0.25, -0.5).sharp, false);
  assert.equal(viewThrough(eye, 0.25, 3).sharp, true);
  // The reading half alone would blur the far bus.
  assert.equal(viewThrough(eye, Infinity, 3).sharp, false);
  assert.equal(bifocalHalf(Infinity), "top");
  assert.equal(bifocalHalf(0.3), "bottom");
});
