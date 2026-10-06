import assert from "node:assert/strict";
import { test } from "node:test";
import { deg, norm, type Vec } from "./optics";
import {
  LAMPS,
  MAZE_LEVELS,
  OBJECT_MATERIALS,
  SCREEN_X,
  SHAPES,
  discSamples,
  mazeBeam,
  periscope,
  pinhole,
  screenBrightness,
  shadowEdges,
  torchBeam,
} from "./shadows";

const near = (a: number, b: number, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

test("a point lamp gives a sharp shadow, bigger when the lamp comes closer", () => {
  // Lamp at 0, object at 50, screen at 110: shadow is 110/50 = 2.2 times taller.
  const far = shadowEdges(0, 0, 50, 4);
  near(far.k, 2.2);
  near(far.umbra, 8.8);
  near(far.outer, 8.8);
  const close = shadowEdges(40, 0, 50, 4);
  near(close.k, 7);
  assert.ok(close.umbra > far.umbra);
});

test("a wide lamp makes an umbra and a penumbra, and the umbra can vanish", () => {
  const s = shadowEdges(20, 5, 60, 4);
  near(s.k, 2.25);
  near(s.umbra, 4 * 2.25 - 5 * 1.25);
  near(s.outer, 4 * 2.25 + 5 * 1.25);
  assert.ok(s.hasUmbra);
  // Object close to the screen and a big lamp close to it: no full shadow left.
  const t = shadowEdges(60, 5, 70, 4);
  assert.equal(t.hasUmbra, false);
});

test("screen brightness matches the edges worked out with similar triangles", () => {
  const lamp = { x: 20, samples: discSamples(LAMPS.wide.radius, 400) };
  const obj = { x: 60, points: SHAPES.ball.points, transmit: 0 };
  const s = shadowEdges(20, 5, 60, 4);
  // Inside the umbra: dark. Outside the penumbra: fully lit. In between: partly lit.
  near(screenBrightness(0, 0, lamp, obj), 0);
  near(screenBrightness(0, s.umbra * 0.8, lamp, obj), 0);
  near(screenBrightness(0, s.outer + 0.5, lamp, obj), 1);
  const mid = screenBrightness(0, (s.umbra + s.outer) / 2, lamp, obj);
  assert.ok(mid > 0.2 && mid < 0.8, `mid ${mid}`);
});

test("transparent, translucent and opaque objects let different amounts of light through", () => {
  const lamp = { x: 20, samples: discSamples(LAMPS.small.radius, 20) };
  const at = (id: keyof typeof OBJECT_MATERIALS) =>
    screenBrightness(0, 0, lamp, { x: 60, points: SHAPES.card.points, transmit: OBJECT_MATERIALS[id].transmit });
  assert.ok(at("glass") > 0.9);
  assert.ok(at("butter") > 0.1 && at("butter") < 0.9);
  near(at("cardboard"), 0);
});

test("the shadow keeps the outline of the object (shadow puppets)", () => {
  const lamp = { x: 10, samples: [{ x: 0, y: 0 }] };
  const obj = { x: 60, points: SHAPES.bird.points, transmit: 0 };
  // (110 − 10) ÷ (60 − 10) = 2, so every point of the outline lands twice as far from the centre.
  near((SCREEN_X - 10) / (60 - 10), 2);
  // A point inside the right wing at (2.8, 1.6) on the hand lands at (5.6, 3.2) on the screen.
  assert.equal(screenBrightness(5.6, 3.2, lamp, obj), 0);
  assert.equal(screenBrightness(5.6 * 1.6, 3.2 * 1.6, lamp, obj), 1);
  // Between the wings above the head is light.
  assert.equal(screenBrightness(0, 3.6 * 2, lamp, obj), 1);
});

test("a pinhole camera image is upside down and image ÷ candle = b ÷ d", () => {
  const p = pinhole(40, 20, 1);
  near(p.m, 0.5);
  near(p.imageH, 5);
  assert.equal(p.inverted, true);
  // Bring the candle closer than the box length: the image is bigger than the candle.
  const close = pinhole(15, 25, 1);
  assert.ok(close.imageH > 10);
  assert.equal(close.sharp, true);
  // A bigger hole blurs the same image.
  const big = pinhole(15, 25, 8);
  near(big.imageH, close.imageH);
  assert.ok(big.blurCm > close.blurCm);
  assert.equal(big.sharp, false);
  // Blur spot = D (d + b) / d.
  near(pinhole(20, 20, 5).blurCm, 0.5 * 2);
});

test("a plane mirror reflects with angle of reflection = angle of incidence", () => {
  for (const i of [0, 15, 30, 45, 60, 75]) {
    const b = torchBeam(i);
    near(b.i, i, 1e-6);
    near(b.r, i, 1e-6);
    // Reflected beam goes up on the other side of the normal.
    const last = b.points[b.points.length - 1];
    if (i > 0) assert.ok(last.x > 0 && last.y > 0);
  }
});

test("the periscope only works with both mirrors at 45°", () => {
  assert.equal(periscope(45, 45).solved, true);
  const right: string[] = [];
  for (let t = 0; t < 180; t += 5) for (let b = 0; b < 180; b += 5) if (periscope(t, b).solved) right.push(`${t},${b}`);
  assert.deepEqual(right, ["45,45"]);
  // The beam bends by 90° at each mirror: i = r = 45°.
  const ray = periscope(45, 45).rays[1];
  assert.equal(ray.bounces.length, 2);
  for (const bb of ray.bounces) {
    near(bb.i, 45, 1e-6);
    near(bb.r, 45, 1e-6);
  }
});

/** Mirror tilt that turns the beam from a to b at m to c: the mirror lies along the sum of the two directions. */
function tilt(a: Vec, m: Vec, c: Vec) {
  const din = norm({ x: m.x - a.x, y: m.y - a.y });
  const dout = norm({ x: c.x - m.x, y: c.y - m.y });
  const t = deg(Math.atan2(din.y + dout.y, din.x + dout.x));
  return ((t % 180) + 180) % 180;
}

test("every laser level can be solved with whole-degree tilts, and none starts solved", () => {
  for (const level of MAZE_LEVELS) {
    assert.equal(mazeBeam(level, level.mirrors.map((m) => m.start)).hit, false, `${level.name} starts solved`);
    const stops = [level.laser, ...level.mirrors.map((m) => m.c), level.target];
    const angles = level.mirrors.map((m, k) => Math.round(tilt(stops[k], m.c, stops[k + 2])));
    const res = mazeBeam(level, angles);
    assert.ok(res.hit, `${level.name} with ${angles}`);
    assert.equal(res.bounces.length, level.mirrors.length);
    for (const b of res.bounces) near(b.i, b.r, 1e-6);
  }
  assert.deepEqual(
    MAZE_LEVELS.slice(0, 2).map((l) => l.mirrors.map((m, k) => Math.round(tilt([l.laser, ...l.mirrors.map((x) => x.c), l.target][k], m.c, [l.laser, ...l.mirrors.map((x) => x.c), l.target][k + 2])))),
    [[45], [45, 135]],
  );
});

test("the wall blocks the straight route in level 2", () => {
  const l = MAZE_LEVELS[1];
  // Mirror 1 sends the beam up; with mirror 2 left upright it reflects back down onto mirror 1's side, never to the target.
  const res = mazeBeam(l, [45, 90]);
  assert.equal(res.hit, false);
});

test("no laser level has a shortcut: every winning beam uses every mirror", () => {
  for (const level of MAZE_LEVELS) {
    const n = level.mirrors.length;
    const step = n === 3 ? 3 : 1;
    const grid = Array.from({ length: Math.ceil(180 / step) }, (_, k) => k * step);
    const combos: number[][] = n === 1 ? grid.map((a) => [a]) : n === 2 ? grid.flatMap((a) => grid.map((b) => [a, b])) : grid.flatMap((a) => grid.flatMap((b) => grid.map((c) => [a, b, c])));
    for (const angles of combos) {
      const res = mazeBeam(level, angles);
      if (res.hit) assert.equal(res.bounces.length, n, `${level.name} ${angles}`);
    }
  }
});
