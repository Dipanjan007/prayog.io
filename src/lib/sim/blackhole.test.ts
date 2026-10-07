import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BODIES,
  CAPTURE_B,
  C,
  M_EARTH,
  M_SUN,
  R_EARTH,
  escapeSpeed,
  formatLength,
  isBlackHole,
  lightPath,
  radiusGuessOk,
  remnantFate,
  schwarzschildRadius,
  sizeLike,
  surfaceGravity,
  tidalStretch,
  weakDeflection,
} from "./blackhole";

const near = (a: number, b: number, rel: number) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b), `${a} vs ${b}`);

test("textbook values: g on Earth is about 9.8 m/s² and its escape speed about 11.2 km/s", () => {
  near(surfaceGravity(M_EARTH, R_EARTH), 9.82, 0.01);
  near(escapeSpeed(M_EARTH, R_EARTH), 11186, 0.01);
  // The Sun: about 274 m/s² and 618 km/s.
  near(surfaceGravity(BODIES.sun.mass, BODIES.sun.radius), 274, 0.01);
  near(escapeSpeed(BODIES.sun.mass, BODIES.sun.radius), 617.7e3, 0.01);
});

test("squeezing: half the radius gives 4 times the gravity and √2 times the escape speed", () => {
  const g1 = surfaceGravity(M_EARTH, R_EARTH);
  const g2 = surfaceGravity(M_EARTH, R_EARTH / 2);
  near(g2 / g1, 4, 1e-12);
  near(escapeSpeed(M_EARTH, R_EARTH / 2) / escapeSpeed(M_EARTH, R_EARTH), Math.SQRT2, 1e-12);
});

test("Schwarzschild radius: Earth about 8.9 mm, Sun about 2.95 km, and it grows in step with mass", () => {
  near(schwarzschildRadius(M_EARTH), 8.87e-3, 0.01);
  near(schwarzschildRadius(M_SUN), 2953, 0.005);
  near(schwarzschildRadius(20 * M_SUN), 20 * schwarzschildRadius(M_SUN), 1e-12);
});

test("at the Schwarzschild radius the escape speed is exactly the speed of light", () => {
  for (const m of [M_EARTH, M_SUN, 20 * M_SUN]) near(escapeSpeed(m, schwarzschildRadius(m)), C, 1e-12);
  assert.ok(isBlackHole(M_EARTH, 0.008));
  assert.ok(!isBlackHole(M_EARTH, 0.01));
  assert.ok(!isBlackHole(M_EARTH, R_EARTH));
});

test("dead star cores: under ~1.4 Suns a white dwarf, up to ~3 a neutron star, beyond that a black hole", () => {
  assert.equal(remnantFate(0.6), "white-dwarf");
  assert.equal(remnantFate(1.3), "white-dwarf");
  assert.equal(remnantFate(1.5), "neutron-star");
  assert.equal(remnantFate(2.5), "neutron-star");
  assert.equal(remnantFate(3.5), "black-hole");
  assert.equal(remnantFate(10), "black-hole");
});

test("light: aimed inside 3√3/2 r_s it falls in, just outside it escapes after a big bend", () => {
  near(CAPTURE_B, 2.598, 0.001);
  const inside = lightPath(2.55);
  assert.ok(inside.captured);
  const r = Math.hypot(...inside.points[inside.points.length - 1]);
  near(r, 1, 1e-6);
  const outside = lightPath(2.65);
  assert.ok(!outside.captured);
  assert.ok(outside.deflection > Math.PI / 2, `bend ${outside.deflection}`);
  assert.ok(outside.closest > 1.5 && outside.closest < 2);
  const wide = lightPath(8);
  assert.ok(!wide.captured && wide.deflection < outside.deflection && wide.deflection > 0);
});

test("far from the hole the bend matches 2 r_s / b (Einstein's light bending)", () => {
  const p = lightPath(200);
  near(p.deflection, weakDeflection(200), 0.05);
  near(p.closest, 200, 0.02);
});

test("tidal stretch: deadly near a 10-Sun black hole, unnoticeable at a giant one's horizon", () => {
  const small = 10 * M_SUN;
  const stretchSmall = tidalStretch(small, schwarzschildRadius(small));
  assert.ok(stretchSmall / 9.81 > 1e6);
  const giant = 4.3e6 * M_SUN;
  const stretchGiant = tidalStretch(giant, schwarzschildRadius(giant));
  assert.ok(stretchGiant / 9.81 < 0.01);
  // Standing on Earth, the stretch from Earth's own pull is far too small to feel.
  assert.ok(tidalStretch(M_EARTH, R_EARTH) < 1e-5);
});

test("helpers: guesses, lengths and sizes", () => {
  assert.ok(radiusGuessOk(2.9, 2.95, 0.05));
  assert.ok(!radiusGuessOk(3.2, 2.95, 0.05));
  assert.ok(!radiusGuessOk(NaN, 2.95, 0.05));
  assert.equal(formatLength(0.00887), "8.87 mm");
  assert.equal(formatLength(2953), "2.95 km");
  assert.equal(sizeLike(0.00887), "about a marble");
});
