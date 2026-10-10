import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ANGLES,
  CHAR_C,
  FOCUSERS,
  POSITIONS,
  ROUNDS,
  SUN_HALF_ANGLE,
  applyChain,
  concentration,
  formulaCount,
  hingeImages,
  imageCount,
  parallelImages,
  reflect,
  solutions,
  spotRadius,
  timeToChar,
  warm,
} from "./kaleidoscope";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test("reflecting in a mirror line flips the point across it", () => {
  const p = reflect({ x: 1, y: 2 }, 0);
  close(p.x, 1);
  close(p.y, -2);
  const q = reflect({ x: 1, y: 0 }, 90);
  close(q.x, -1);
  close(q.y, 0);
  const r = reflect({ x: 1, y: 0 }, 45);
  close(r.x, 0);
  close(r.y, 1);
});

test("mirrors at 90° make 3 images wherever the object is", () => {
  for (const p of POSITIONS) assert.equal(imageCount(90, p), 3);
  const angles = hingeImages(90, 30)
    .map((i) => i.angle)
    .sort((a, b) => a - b);
  // Object at 30°: images at 150° (in mirror 2), 210° (both) and 330° (in mirror 1).
  [150, 210, 330].forEach((a, i) => close(angles[i], a, 1e-6));
});

test("a kaleidoscope at 60° makes 5 images", () => {
  for (const p of POSITIONS) assert.equal(imageCount(60, p), 5);
});

test("n = 360 ÷ θ − 1 when 360 ÷ θ is even, or when the object is in the middle", () => {
  for (const a of ANGLES) {
    const n = 360 / a;
    assert.equal(imageCount(a, 0.5), formulaCount(a), `${a}° centred`);
    if (n % 2 === 0) for (const p of POSITIONS) assert.equal(imageCount(a, p), n - 1, `${a}° at ${p}`);
    else for (const p of POSITIONS.filter((x) => x !== 0.5)) assert.equal(imageCount(a, p), n, `${a}° at ${p}`);
  }
});

test("two mirrors laid flat (180°) act as one mirror: 1 image", () => {
  assert.equal(imageCount(180, 0.3), 1);
});

test("every image sits as far from the hinge as the object, and outside the wedge", () => {
  for (const a of ANGLES)
    for (const img of hingeImages(a, a * 0.3)) {
      const p = applyChain({ x: 2, y: 0 }, img.chain, a);
      close(Math.hypot(p.x, p.y), 2);
      assert.ok(!(img.angle > 1e-6 && img.angle < a - 1e-6), `${a}°: image at ${img.angle}° is inside the wedge`);
    }
});

test("bounce chains alternate between the two mirrors", () => {
  for (const img of hingeImages(30, 12)) for (let i = 1; i < img.chain.length; i++) assert.notEqual(img.chain[i], img.chain[i - 1]);
});

test("parallel mirrors: images at 2 × gap steps, nearest first, on and on", () => {
  const imgs = parallelImages(10, 3, 3);
  assert.deepEqual(
    imgs.map((i) => i.x),
    [-3, 17, 23, -17, -23, 37],
  );
  assert.equal(imgs.length, 6);
  assert.deepEqual(
    imgs.map((i) => i.bounces),
    [1, 1, 2, 2, 3, 3],
  );
});

test("the sunlight spot is smallest at the focus, where it is the Sun's own image", () => {
  const { f, aperture } = FOCUSERS.lens;
  close(spotRadius(f, aperture, f), f * SUN_HALF_ANGLE);
  assert.ok(spotRadius(f, aperture, f * 0.8) > spotRadius(f, aperture, f));
  assert.ok(spotRadius(f, aperture, f * 1.2) > spotRadius(f, aperture, f));
  // At the focus a 6 cm magnifier makes a spot about 1.4 mm across, over 1600 times brighter than sunlight.
  close(2 * spotRadius(f, aperture, f) * 1000, 1.395, 1e-3);
  assert.ok(concentration("lens", f) > 1600);
});

test("the card only chars near the focus", () => {
  for (const id of ["lens", "dish"] as const) {
    const fo = FOCUSERS[id];
    assert.ok(timeToChar(concentration(id, fo.f)) < 0.1, `${id} at focus`);
    assert.equal(timeToChar(concentration(id, fo.min)), Infinity, `${id} close up`);
    assert.equal(timeToChar(concentration(id, fo.max)), Infinity, `${id} far away`);
    // It chars somewhere within 20% of the focal length either side, and nowhere beyond.
    assert.equal(timeToChar(concentration(id, fo.f * 0.8)), Infinity);
    assert.equal(timeToChar(concentration(id, fo.f * 1.2)), Infinity);
    assert.ok(timeToChar(concentration(id, fo.f * 0.9)) < 10);
  }
});

test("warming the card step by step reaches charring at the predicted time", () => {
  const conc = concentration("lens", 0.14);
  const t = timeToChar(conc);
  assert.ok(Number.isFinite(t) && t > 0);
  let temp = 30;
  let s = 0;
  const dt = 1 / 600;
  while (temp < CHAR_C && s < 20) {
    temp = warm(temp, conc, dt);
    s += dt;
  }
  close(s, t, 0.01);
});

test("every challenge round can be solved, and only with the intended setups", () => {
  assert.deepEqual(
    solutions(ROUNDS[0].target).map((s) => s.angle),
    POSITIONS.map(() => 45),
  );
  assert.deepEqual(
    [...new Set(solutions(ROUNDS[1].target).map((s) => s.angle))],
    [30],
  );
  assert.deepEqual(solutions(ROUNDS[2].target), [{ angle: 72, position: 0.5 }]);
});
