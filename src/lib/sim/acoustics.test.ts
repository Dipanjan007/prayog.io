import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ALPHA,
  AUDITORIUM,
  AUDITORIUM_START,
  BELL_DB,
  CHALLENGE_HALLS,
  LIMITS,
  P_ATM,
  SABINE_K,
  SEAT,
  SPEECH_RT,
  STEEL_V,
  absorptionFor,
  airDensity,
  bellIsSilent,
  bellLevelDb,
  decayAmplitude,
  decayDb,
  depthFromEcho,
  energyTransmission,
  hallAbsorption,
  hallRT,
  hallVolume,
  hearers,
  impedance,
  onlyHears,
  pressureAfterStrokes,
  reflectorDepth,
  rt60,
  rtOk,
  scanEchoTime,
  speedOfSoundGas,
  type SteelBlock,
} from "./acoustics";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test("air at room temperature: density about 1.2 kg/m³ and sound at about 343 m/s", () => {
  close(airDensity(P_ATM), 1.204, 0.002);
  close(speedOfSoundGas(), 343.2, 0.3);
  // Halving the pressure halves the density but leaves the speed alone (it depends on temperature).
  close(airDensity(P_ATM / 2), airDensity(P_ATM) / 2, 1e-12);
  assert.ok(speedOfSoundGas(273.15) < speedOfSoundGas(303.15));
});

test("thin air carries far less sound energy into glass", () => {
  const zGlass = impedance(2500, 5640);
  const zAir = impedance(airDensity(P_ATM), 343);
  const full = energyTransmission(zAir, zGlass);
  const thin = energyTransmission(impedance(airDensity(P_ATM / 100), 343), zGlass);
  assert.ok(full < 1e-3, "most sound bounces back at an air–glass boundary");
  close(thin / full, 0.01, 1e-4);
  close(energyTransmission(400, 400), 1);
});

test("each pump stroke leaves 5/6 of the air (Boyle's law)", () => {
  close(pressureAfterStrokes(0), 1);
  close(pressureAfterStrokes(1), 5 / 6);
  close(pressureAfterStrokes(2), 25 / 36);
  assert.ok(pressureAfterStrokes(40) < 1e-3);
});

test("the bell fades by 20 dB for every tenfold drop in pressure, down to the leak", () => {
  close(bellLevelDb(1), BELL_DB, 0.01);
  close(bellLevelDb(0.1), BELL_DB - 20, 0.01);
  close(bellLevelDb(0.01), BELL_DB - 40, 0.05);
  assert.equal(bellIsSilent(1), false);
  assert.equal(bellIsSilent(pressureAfterStrokes(40)), true);
  assert.ok(bellLevelDb(0) > 0 && bellLevelDb(0) < 6, "a faint leak remains through the supports");
});

test("Sabine: 0.161 comes from 24 ln 10 / 343, and T = 0.161 V / A", () => {
  close((24 * Math.log(10)) / 343, SABINE_K, 2e-4);
  close(rt60(1000, 161), 1);
  close(rt60(2000, 161), 2);
  close(absorptionFor(1000, 0.5), 322);
  close(decayDb(2, 2), -60);
  close(decayAmplitude(1.5, 1.5), 1e-3, 1e-12);
});

test("the bare auditorium rings for about 8 s, and treatments bring it into the speech range", () => {
  close(hallVolume(AUDITORIUM), 1440);
  const bare = hallRT(AUDITORIUM, AUDITORIUM_START);
  assert.ok(bare > 7 && bare < 10, `bare ${bare}`);
  const full = hallRT(AUDITORIUM, { ...AUDITORIUM_START, people: 200 });
  assert.ok(full > SPEECH_RT.max, "an audience alone is not enough");
  const treated = hallRT(AUDITORIUM, { carpet: true, curtains: 6, panels: 10, people: 200, cushioned: false });
  assert.ok(treated >= SPEECH_RT.min && treated <= SPEECH_RT.max, `treated ${treated}`);
  const everything = hallRT(AUDITORIUM, { carpet: true, curtains: LIMITS.curtains, panels: LIMITS.panels, people: 200, cushioned: true });
  assert.ok(everything < SPEECH_RT.min, "too much absorption makes the hall dead");
});

test("each treatment adds absorption, and curtains cannot cover more wall than there is", () => {
  const base = hallAbsorption(AUDITORIUM, AUDITORIUM_START);
  close(hallAbsorption(AUDITORIUM, { ...AUDITORIUM_START, carpet: true }) - base, 240 * (ALPHA.carpet - ALPHA.concrete));
  close(hallAbsorption(AUDITORIUM, { ...AUDITORIUM_START, panels: 1 }) - base, 2 * (ALPHA.panel - ALPHA.plaster));
  close(hallAbsorption(AUDITORIUM, { ...AUDITORIUM_START, cushioned: true }) - base, 200 * (SEAT.cushioned.empty - SEAT.hard.empty));
  const huge = hallAbsorption(AUDITORIUM, { ...AUDITORIUM_START, curtains: 1000 });
  close(huge, base + 384 * (ALPHA.curtain - ALPHA.plaster) - 0, 1e-9);
});

test("Sabine's cushions: a hall with cushioned seats sounds nearly the same empty or full", () => {
  const s = { ...AUDITORIUM_START, cushioned: true };
  const empty = hallRT(AUDITORIUM, s);
  const full = hallRT(AUDITORIUM, { ...s, people: 200 });
  const hardEmpty = hallRT(AUDITORIUM, AUDITORIUM_START);
  const hardFull = hallRT(AUDITORIUM, { ...AUDITORIUM_START, people: 200 });
  assert.ok(empty / full < 1.5);
  assert.ok(hardEmpty / hardFull > 3);
});

test("every challenge hall starts off target and can be tuned within its panel budget", () => {
  for (const h of CHALLENGE_HALLS) {
    const start = hallRT(h.spec, { carpet: h.fixed.carpet, curtains: 0, panels: 0, people: h.fixed.people, cushioned: h.fixed.cushioned });
    assert.equal(rtOk(start, h.target, h.tolerance), false, `${h.id} solved at the start`);
    let ways = 0;
    for (const carpet of [false, true])
      for (let c = 0; c <= LIMITS.curtains; c++)
        for (let p = 0; p <= h.budget; p++)
          if (rtOk(hallRT(h.spec, { carpet: carpet || h.fixed.carpet, curtains: c, panels: p, people: h.fixed.people, cushioned: h.fixed.cushioned }), h.target, h.tolerance)) ways++;
    assert.ok(ways > 3, `${h.id} has ${ways} ways`);
  }
});

test("ultrasound in steel: echo from a 12 cm block takes about 40 µs, and a crack returns it early", () => {
  const b: SteelBlock = { length: 1, thickness: 0.12, crack: { x0: 0.6, x1: 0.66, depth: 0.05 } };
  close(scanEchoTime(b, 0.2) * 1e6, 40.27, 0.01);
  assert.equal(reflectorDepth(b, 0.63), 0.05);
  assert.ok(scanEchoTime(b, 0.63) < scanEchoTime(b, 0.2));
  close(depthFromEcho(scanEchoTime(b, 0.63)), 0.05);
  close(depthFromEcho(2 / STEEL_V), 1);
});

test("hearing ranges: 20 Hz to 20 kHz for us, infrasound for elephants, ultrasound for bats and dolphins", () => {
  assert.ok(hearers(1000).includes("human"));
  assert.ok(!hearers(25000).includes("human"));
  assert.ok(hearers(25000).includes("dog"));
  assert.ok(onlyHears(18, "elephant"));
  assert.ok(onlyHears(130000, "dolphin"));
  assert.ok(hearers(60000).includes("bat") && hearers(60000).includes("dolphin"));
  assert.deepEqual(hearers(5), []);
});
