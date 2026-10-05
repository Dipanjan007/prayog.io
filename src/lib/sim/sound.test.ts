import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MEDIA,
  band,
  depthGuessOk,
  displacement,
  distanceFromEcho,
  echoDelay,
  echoIsDistinct,
  excessPressure,
  minEchoDistance,
  period,
  waveNumber,
  wavelength,
} from "./sound";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test("v = f λ: 343 Hz in air has a 1 m wavelength, and higher pitch means shorter waves", () => {
  close(wavelength(343, 343), 1);
  close(wavelength(343, 686), 0.5);
  assert.ok(wavelength(343, 800) < wavelength(343, 200));
  close(period(500), 0.002);
});

test("the same note has a longer wavelength in water and steel because sound is faster there", () => {
  assert.ok(MEDIA.air.v < MEDIA.water.v && MEDIA.water.v < MEDIA.steel.v);
  const f = 500;
  assert.ok(wavelength(MEDIA.water.v, f) > 4 * wavelength(MEDIA.air.v, f));
});

test("echo time is 2d/v and the distance comes back as vt/2", () => {
  close(echoDelay(34.3, 343), 0.2);
  close(distanceFromEcho(2, 1500), 1500);
  for (const d of [5, 17.2, 80, 2730]) close(distanceFromEcho(echoDelay(d, 1500), 1500), d, 1e-9);
});

test("the minimum distance for a distinct echo is about 17.2 m", () => {
  close(minEchoDistance(344), 17.2, 1e-9);
  close(minEchoDistance(343), 17.15, 1e-9);
  assert.equal(echoIsDistinct(17, 343), false);
  assert.equal(echoIsDistinct(18, 343), true);
  assert.equal(echoIsDistinct(17.15, 343), true);
});

test("hearing bands: 20 Hz to 20 kHz is audible, above is ultrasound", () => {
  assert.equal(band(10), "infrasound");
  assert.equal(band(20), "audible");
  assert.equal(band(1000), "audible");
  assert.equal(band(20000), "audible");
  assert.equal(band(50000), "ultrasound");
});

test("pressure is highest where particles crowd together (compressions)", () => {
  const k = waveNumber(343, 500);
  const s0 = 0.5 / k; // small enough that particles never overtake each other
  const phase = 0.7;
  const dx = 1e-4;
  const gap = (x: number) => dx + displacement(x + dx, phase, s0, k) - displacement(x, phase, s0, k);
  const lambda = wavelength(343, 500);
  let best = { x: 0, p: -Infinity };
  let tightest = { x: 0, g: Infinity };
  for (let i = 0; i < 2000; i++) {
    const x = (i / 2000) * lambda;
    const p = excessPressure(x, phase, k);
    if (p > best.p) best = { x, p };
    const g = gap(x);
    if (g < tightest.g) tightest = { x, g };
  }
  assert.ok(Math.abs(best.x - tightest.x) < lambda / 100, `max pressure at ${best.x}, tightest at ${tightest.x}`);
  assert.ok(tightest.g < dx, "particles closer than normal at a compression");
});

test("the pattern moves at speed v while each particle only vibrates about its place", () => {
  const f = 400;
  const v = 343;
  const k = waveNumber(v, f);
  const w = 2 * Math.PI * f;
  const t = 0.0013;
  for (const x of [0.1, 0.37, 1.2]) close(excessPressure(x + v * t, w * t, k), excessPressure(x, 0, k), 1e-9);
  const s0 = 0.01;
  for (let i = 0; i < 50; i++) assert.ok(Math.abs(displacement(0.5, (w * i) / 400, s0, k)) <= s0 + 1e-12);
});

test("SONAR depth guesses are checked within a tolerance", () => {
  assert.equal(depthGuessOk(1350, 1350, 0.03), true);
  assert.equal(depthGuessOk(1380, 1350, 0.03), true);
  assert.equal(depthGuessOk(2700, 1350, 0.03), false);
  assert.equal(depthGuessOk(NaN, 1350, 0.03), false);
});
