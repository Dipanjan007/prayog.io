import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CRATE_MASS,
  CRATE_WIDTH,
  G_MOON,
  SURFACES,
  TRACK_LENGTH,
  frictionOn,
  kinetic,
  lifts,
  maxStatic,
  pullRatio,
  slideDistance,
  springStretch,
  stepCrate,
  weight,
  type SurfaceId,
} from "./forces";

const close = (a: number, b: number, tol: number, msg?: string) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ""} ${a} vs ${b}`);

test("weight is m × g", () => {
  close(weight(1), 9.8, 1e-9);
  close(weight(5), 49, 1e-9);
  close(weight(5, G_MOON), 8, 1e-9);
  assert.equal(springStretch(25), 0.5);
  assert.equal(springStretch(200), 1);
});

test("sliding friction is always less than the most static friction can give", () => {
  for (const id of Object.keys(SURFACES) as SurfaceId[]) {
    assert.ok(kinetic(id) < maxStatic(id), id);
  }
  // Rougher floors grip more.
  assert.ok(maxStatic("ice") < maxStatic("wood") && maxStatic("wood") < maxStatic("carpet") && maxStatic("carpet") < maxStatic("sand"));
});

test("static friction matches a small push, so the crate stays still", () => {
  const f = frictionOn(80, 0, "wood");
  assert.equal(f.kind, "static");
  assert.equal(f.friction, 80);
  let s = { x: 0, v: 0 };
  for (let i = 0; i < 100; i++) s = stepCrate(s, 80, "wood", 0.01);
  assert.equal(s.x, 0);
  assert.equal(s.v, 0);
});

test("a push above the static limit moves the crate with a = (push − kinetic friction) ÷ m", () => {
  const push = 150;
  const limit = maxStatic("wood"); // 98 N
  assert.ok(push > limit);
  let s = { x: 0, v: 0 };
  for (let i = 0; i < 100; i++) s = stepCrate(s, push, "wood", 0.01);
  const a = (push - kinetic("wood")) / CRATE_MASS;
  close(s.v, a * 1, 1e-9, "speed after 1 s");
  close(s.x, 0.5 * a, 1e-6, "distance after 1 s");
});

test("once sliding, a push between kinetic and static friction keeps it going", () => {
  const push = 80; // wood: kinetic 58.8 N < 80 N < 98 N static
  let s: { x: number; v: number } = stepCrate({ x: 0, v: 0 }, push, "wood", 0.1);
  assert.equal(s.v, 0, "too weak to start it");
  s = { x: 0, v: 0.5 };
  const before = s.v;
  for (let i = 0; i < 10; i++) s = stepCrate(s, push, "wood", 0.01);
  assert.ok(s.v > before, "speeds up because push beats sliding friction");
});

test("let go and friction stops the crate after v² ÷ (2 μk g), never pushing it backwards", () => {
  for (const id of ["ice", "wood", "carpet", "sand"] as SurfaceId[]) {
    let s = { x: 0, v: 1.5 };
    for (let i = 0; i < 100000 && s.v > 0; i++) {
      s = stepCrate(s, 0, id, 0.016);
      assert.ok(s.v >= 0);
    }
    assert.equal(s.v, 0, id);
    if (slideDistance(1.5, id) < TRACK_LENGTH - CRATE_WIDTH) close(s.x, slideDistance(1.5, id), 1e-6, id);
  }
  assert.ok(slideDistance(1, "ice") > slideDistance(1, "sand"));
});

test("the wall at the end stops the crate", () => {
  let s = { x: 4, v: 5, hitWall: false };
  for (let i = 0; i < 200 && !s.hitWall; i++) s = stepCrate(s, 0, "ice", 0.016);
  assert.equal(s.hitWall, true);
  assert.equal(s.x, TRACK_LENGTH - CRATE_WIDTH);
  assert.equal(s.v, 0);
});

test("a magnet lifts steel pins up close, but not paper", () => {
  assert.equal(lifts("magnet", "pins", 2), true);
  assert.equal(lifts("magnet", "pins", 5), false);
  assert.equal(lifts("magnet", "paper", 0.5), false);
  assert.ok(pullRatio("magnet", "pins", 1) > pullRatio("magnet", "pins", 2), "pull grows as the gap shrinks");
});

test("a rubbed comb lifts paper bits; a plain comb lifts nothing", () => {
  assert.equal(lifts("rubbed", "paper", 1), true);
  assert.equal(lifts("rubbed", "paper", 4), false);
  assert.equal(lifts("rubbed", "pins", 0.5), false);
  assert.equal(lifts("plain", "paper", 0.5), false);
  assert.equal(lifts("plain", "pins", 0.5), false);
});
