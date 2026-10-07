import assert from "node:assert/strict";
import { test } from "node:test";
import {
  C,
  FALLERS,
  G,
  SUN,
  WORLDS,
  cannonOutcome,
  circularSpeed,
  closestWorld,
  dragK,
  escapeSpeed,
  fallDistance,
  fallSpeed,
  fallTime,
  gFromDrop,
  gravForce,
  orbitPeriod,
  orbitStep,
  schwarzschildRadius,
  specificEnergy,
  surfaceG,
  terminalSpeed,
  weight,
  worldG,
  type OrbitState,
} from "./gravity";

const near = (a: number, b: number, eps: number) => assert.ok(Math.abs(a - b) <= eps, `${a} vs ${b} (±${eps})`);
const EARTH = WORLDS.earth;

test("g = GM/R² gives the textbook values for Earth, Moon, Mars and Jupiter", () => {
  near(worldG("earth"), 9.8, 0.05);
  near(worldG("moon"), 1.62, 0.01);
  near(worldG("mars"), 3.72, 0.02);
  near(worldG("jupiter"), 24.8, 0.1);
  // The Moon's g is about one sixth of Earth's.
  near(worldG("earth") / worldG("moon"), 6, 0.1);
});

test("Newton's law: doubling a mass doubles F, doubling the distance quarters it", () => {
  const F = gravForce(6e24, 7e22, 4e8);
  near(gravForce(12e24, 7e22, 4e8) / F, 2, 1e-12);
  near(gravForce(6e24, 7e22, 8e8) / F, 0.25, 1e-12);
  near(gravForce(1, 1, 1), G, 0);
  // Earth and Moon pull each other with about 2 × 10²⁰ N.
  near(gravForce(EARTH.M, WORLDS.moon.M, 3.844e8) / 1e20, 1.98, 0.02);
});

test("weight W = mg changes from world to world, mass does not", () => {
  near(weight(45, 9.8), 441, 1e-9);
  near(weight(45, worldG("moon")), 73, 0.5);
  // A 1 kg mass weighs about 9.8 N on Earth.
  near(weight(1, worldG("earth")), 9.8, 0.05);
});

test("with no air every object falls 2 m in the same time; on Earth that is about 0.64 s", () => {
  const g = worldG("earth");
  near(fallTime(2, g, 0), 0.638, 0.002);
  near(fallTime(2, worldG("moon"), 0), 1.57, 0.01);
  near(gFromDrop(2, fallTime(2, g, 0)), g, 1e-9);
  near(fallDistance(fallTime(2, g, 0), g, 0), 2, 1e-12);
});

test("air drag: a feather drifts down slowly on Earth but falls with the ball on the Moon", () => {
  const g = worldG("earth");
  const kF = dragK(WORLDS.earth.air, FALLERS.feather.dragPerDensity);
  const kB = dragK(WORLDS.earth.air, FALLERS.ball.dragPerDensity);
  near(terminalSpeed(g, kF), 0.6, 0.05);
  assert.ok(terminalSpeed(g, kB) > 30);
  assert.ok(fallTime(2, g, kF) > 3);
  near(fallTime(2, g, kB), fallTime(2, g, 0), 0.005);
  // The exact drag solution lands exactly where it should.
  near(fallDistance(fallTime(2, g, kF), g, kF), 2, 1e-9);
  assert.ok(fallSpeed(10, g, kF) <= terminalSpeed(g, kF));
  const moonK = dragK(WORLDS.moon.air, FALLERS.feather.dragPerDensity);
  near(fallTime(2, worldG("moon"), moonK), fallTime(2, worldG("moon"), 0), 0);
});

test("orbit speed near Earth is about 7.9 km/s and escape speed about 11.2 km/s", () => {
  near(circularSpeed(EARTH.M, EARTH.R) / 1000, 7.9, 0.02);
  near(escapeSpeed(EARTH.M, EARTH.R) / 1000, 11.2, 0.02);
  near(escapeSpeed(EARTH.M, EARTH.R) / circularSpeed(EARTH.M, EARTH.R), Math.SQRT2, 1e-12);
  near(escapeSpeed(WORLDS.moon.M, WORLDS.moon.R) / 1000, 2.38, 0.01);
});

test("Newton's cannon from 100 km up: slow shots fall, 7.9 km/s orbits, 11.2 km/s escapes", () => {
  const h = 100e3;
  assert.equal(cannonOutcome(3000, EARTH.M, EARTH.R, h), "fell");
  assert.equal(cannonOutcome(7800, EARTH.M, EARTH.R, h), "fell");
  assert.equal(cannonOutcome(7900, EARTH.M, EARTH.R, h), "orbit");
  assert.equal(cannonOutcome(10000, EARTH.M, EARTH.R, h), "orbit");
  assert.equal(cannonOutcome(11200, EARTH.M, EARTH.R, h), "escape");
  // A low orbit takes about an hour and a half.
  near(orbitPeriod(EARTH.M, EARTH.R + h) / 60, 87, 1);
});

test("the step-by-step orbit stays circular and keeps its energy", () => {
  const r0 = EARTH.R + 100e3;
  const v = circularSpeed(EARTH.M, r0);
  let s: OrbitState = { x: 0, y: r0, vx: v, vy: 0 };
  const e0 = specificEnergy(s, EARTH.M);
  const T = orbitPeriod(EARTH.M, r0);
  const n = 2000;
  for (let i = 0; i < n; i++) s = orbitStep(s, EARTH.M, T / n);
  near(Math.hypot(s.x, s.y) / r0, 1, 1e-3);
  near(specificEnergy(s, EARTH.M) / e0, 1, 1e-4);
  near(s.x / r0, 0, 0.01);
});

test("squeezing a mass raises its escape speed; Earth becomes a black hole at about 9 mm, the Sun at about 3 km", () => {
  near(schwarzschildRadius(EARTH.M) * 1000, 8.87, 0.01);
  near(schwarzschildRadius(SUN.M) / 1000, 2.95, 0.01);
  near(escapeSpeed(EARTH.M, schwarzschildRadius(EARTH.M)), C, 1e-3);
  assert.ok(escapeSpeed(EARTH.M, EARTH.R / 4) > 2 * escapeSpeed(EARTH.M, EARTH.R) - 1e-6);
  near(surfaceG(EARTH.M, EARTH.R), worldG("earth"), 0);
});

test("a measured g points to the right world", () => {
  assert.equal(closestWorld(9.8), "earth");
  assert.equal(closestWorld(1.6), "moon");
  assert.equal(closestWorld(3.7), "mars");
  assert.equal(closestWorld(25), "jupiter");
});
