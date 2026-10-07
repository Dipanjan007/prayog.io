import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BALLOON,
  BOATS,
  CHARGE_PER_RUB,
  G,
  LIQUIDS,
  OBJECTS,
  RING,
  balloonAngle,
  balloonSeparation,
  boatDraft,
  boatSinks,
  coulomb,
  density,
  floatDepth,
  floatSpacing,
  floats,
  getObject,
  loadIsGood,
  maxLoad,
  objectHeight,
  overflowAfter,
  ringForce,
  ringGaps,
  ringStack,
  ringsRepel,
  submergedVolume,
  tankState,
  upthrust,
  weight,
} from "./buoyancy";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test("a 0.5 kg stone weighs 4.9 N and reads less in water by the weight of water it pushes aside", () => {
  const stone = getObject("stone");
  close(weight(stone.mass), 4.9, 1e-9);
  close(density(stone), 2500, 1e-6);
  const s = tankState(stone, LIQUIDS.water.density, 1, false);
  assert.ok(s.fullyUnder);
  // 200 cm³ of water has a mass of 0.2 kg and a weight of 1.96 N.
  close(s.vSub, 2e-4, 1e-12);
  close(s.upthrust, 1.96, 1e-9);
  close(s.reading, 4.9 - 1.96, 1e-9);
  // The drop in the reading equals the weight of the overflow.
  close(s.weight - s.reading, upthrust(1000, overflowAfter(0, s.vSub)), 1e-9);
});

test("the reading drops step by step as more of the stone goes under, then stays put once it is fully under", () => {
  const stone = getObject("stone");
  const H = objectHeight(stone);
  let prev = Infinity;
  for (let i = 0; i <= 10; i++) {
    const r = tankState(stone, 1000, (H * i) / 10, false).reading;
    assert.ok(r < prev || i === 0);
    prev = r;
  }
  close(tankState(stone, 1000, H + 0.03, false).reading, tankState(stone, 1000, H, false).reading, 1e-9);
  close(submergedVolume(stone, H / 2), stone.volume / 2, 1e-12);
});

test("upthrust depends on the liquid: more in salt water, less in oil", () => {
  const iron = getObject("iron");
  const inWater = tankState(iron, LIQUIDS.water.density, 1, false).reading;
  const inSalt = tankState(iron, LIQUIDS.salt.density, 1, false).reading;
  const inOil = tankState(iron, LIQUIDS.oil.density, 1, false).reading;
  assert.ok(inSalt < inWater && inWater < inOil);
  // Same mass as the stone but much smaller, so it loses much less weight in water.
  const stone = getObject("stone");
  assert.ok(tankState(stone, 1000, 1, false).upthrust > 3 * tankState(iron, 1000, 1, false).upthrust);
});

test("float or sink: less dense than the liquid floats", () => {
  const w = LIQUIDS.water.density;
  const out = Object.fromEntries(OBJECTS.map((o) => [o.id, floats(o, w)]));
  assert.deepEqual(out, { stone: false, iron: false, wood: true, ice: true, bottle: true, apple: true, egg: false, bowl: true, steelball: false });
  // An egg sinks in fresh water but floats in salt water.
  const egg = getObject("egg");
  assert.equal(floats(egg, LIQUIDS.water.density), false);
  assert.equal(floats(egg, LIQUIDS.salt.density), true);
});

test("a floating object sinks until the upthrust equals its weight, and the string goes slack", () => {
  const w = LIQUIDS.water.density;
  const ice = getObject("ice");
  const d = floatDepth(ice, w)!;
  // Ice is 917 kg/m³, so about 92% of it is under water.
  close(d / objectHeight(ice), 0.917, 1e-6);
  const s = tankState(ice, w, 1, false);
  assert.ok(s.floating && !s.fullyUnder);
  close(s.upthrust, s.weight, 1e-6);
  assert.equal(s.reading, 0);
  // The overflow weighs the same as the floating object.
  close(upthrust(w, s.vSub), weight(ice.mass), 1e-6);
  // A floating sphere settles too.
  const apple = getObject("apple");
  const a = tankState(apple, w, 1, true);
  close(a.upthrust, weight(apple.mass), 1e-6);
});

test("same steel, same mass: the bowl floats and the ball sinks", () => {
  const bowl = getObject("bowl");
  const ball = getObject("steelball");
  close(bowl.mass, ball.mass);
  close(density(ball), 7850, 1e-6);
  assert.ok(density(bowl) < 1000);
  assert.ok(tankState(bowl, 1000, 0, true).floating);
  assert.ok(tankState(ball, 1000, 0, true).onBottom);
});

test("the beaker keeps the most water ever pushed aside", () => {
  assert.equal(overflowAfter(0, 1e-4), 1e-4);
  assert.equal(overflowAfter(2e-4, 1e-4), 2e-4);
});

test("two ring magnets: like poles facing repel, and the top one floats where the push equals its weight", () => {
  assert.equal(ringsRepel(true, false), true);
  assert.equal(ringsRepel(true, true), false);
  const d = floatSpacing();
  close(ringForce(d), weight(RING.mass), 1e-9);
  const z = ringStack([true, false]);
  close(z[1] - z[0], d, 1e-5);
  const gap = ringGaps(z)[0];
  assert.ok(gap > 0.01 && gap < 0.03, `gap ${gap}`);
  // Flip one: unlike poles face each other, so they snap together.
  assert.deepEqual(ringGaps(ringStack([true, true])), [0]);
});

test("three rings, alternating: both upper rings float, the lower gap smaller as it holds up more", () => {
  const gaps = ringGaps(ringStack([true, false, true]));
  assert.ok(gaps[0] > 0.005 && gaps[1] > 0.005, `${gaps}`);
  assert.ok(gaps[0] < gaps[1]);
  // N up, N up, S up: the bottom two stick, the top one floats.
  const g2 = ringGaps(ringStack([true, true, false]));
  assert.equal(g2[0], 0);
  assert.ok(g2[1] > 0.005);
});

test("rubbed balloons push apart: tan θ = F / mg", () => {
  close(coulomb(1e-6, 1e-6, 1), 8.99e-3, 1e-12);
  const L = BALLOON.thread + BALLOON.radius;
  const touching = Math.asin(BALLOON.radius / L);
  close(balloonAngle(0), touching);
  const q = 10 * CHARGE_PER_RUB;
  const th = balloonAngle(q);
  assert.ok(th > touching + 0.1);
  const F = coulomb(q, q, balloonSeparation(th));
  close(Math.tan(th), F / (BALLOON.mass * G), 1e-6);
  // More charge, wider apart.
  assert.ok(balloonAngle(5 * CHARGE_PER_RUB) < th);
});

test("boats: the most cargo is ρV minus the boat's own mass", () => {
  const [ganga, kerala, ship] = BOATS;
  close(maxLoad(ganga), 1400);
  close(maxLoad(kerala), 22000);
  close(maxLoad(ship), 9_300_000);
  close(boatDraft(ganga, 1400), 1);
  assert.equal(boatSinks(ganga, 1400), false);
  assert.equal(boatSinks(ganga, 1450), true);
  assert.equal(loadIsGood(ganga, 1300), true);
  assert.equal(loadIsGood(ganga, 1200), false);
  assert.equal(loadIsGood(ganga, 1450), false);
  // Every boat's max load is a whole number of slider steps, so a perfect answer is reachable.
  for (const b of BOATS) close((maxLoad(b) / b.step) % 1, 0, 1e-9);
  // The same ship carries more in sea water than it could in a river.
  assert.ok(maxLoad(ship) > 1000 * ship.hull - ship.mass);
});
