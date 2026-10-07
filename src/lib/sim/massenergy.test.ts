import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BODIES,
  C,
  EARTH,
  GPS_ORBIT_RADIUS,
  PROCESSES,
  RAD_TO_ARCSEC,
  SUN,
  chemicalFraction,
  clockLossPerDay,
  clockRate,
  coalTonnes,
  duration,
  energyFrom,
  fissionFraction,
  fusionFraction,
  fusionMeV,
  gravityClockGainPerDay,
  guessOk,
  homesForYear,
  indianCount,
  lightBend,
  massFromEnergy,
  newtonBend,
  rayHeight,
  restEnergy,
  sci,
  stationSeconds,
  sunMassLossPerSecond,
  toKWh,
} from "./massenergy";

const near = (a: number, b: number, rel: number) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b), `${a} vs ${b}`);

test("E = mc²: 1 kg holds about 9 × 10¹⁶ J and the mass comes back from the energy", () => {
  near(restEnergy(1), 8.988e16, 1e-3);
  near(massFromEnergy(restEnergy(0.35)), 0.35, 1e-12);
});

test("a 0.02 g grain of rice fully converted: about 1.8 × 10¹² J, 5 lakh kWh, about 450 homes for a year", () => {
  const E = restEnergy(0.02e-3);
  near(E, 1.798e12, 1e-3);
  near(toKWh(E), 4.99e5, 2e-3);
  near(homesForYear(E), 454, 0.01);
  near(coalTonnes(E), 74.9, 0.01);
  near(stationSeconds(E), 1798, 0.01);
});

test("the Sun loses about 4.26 million tonnes of mass every second", () => {
  near(sunMassLossPerSecond(), 4.26e9, 0.005);
  // Over 4.6 billion years at today's rate, that is still well under 0.1% of the Sun.
  assert.ok((sunMassLossPerSecond() * 4.6e9 * 3.156e7) / SUN.mass < 0.001);
});

test("fusion of 4 H into He turns about 0.7% of the mass into about 26.7 MeV", () => {
  near(fusionFraction(), 0.00712, 0.01);
  near(fusionMeV(), 26.7, 0.01);
});

test("fission turns about 0.1% of the uranium into energy, millions of times more than burning coal", () => {
  near(fissionFraction(), 0.00091, 0.02);
  assert.ok(fissionFraction() > 0.0008 && fissionFraction() < 0.0011);
  const ratio = fissionFraction() / chemicalFraction();
  assert.ok(ratio > 1e6 && ratio < 1e7, `ratio ${ratio}`);
  // Order: burn < split < fuse < all.
  assert.ok(energyFrom("chemical", 1) < energyFrom("fission", 1));
  assert.ok(energyFrom("fission", 1) < energyFrom("fusion", 1));
  assert.ok(energyFrom("fusion", 1) < energyFrom("full", 1));
  assert.equal(PROCESSES.full.fraction, 1);
  near(energyFrom("chemical", 1), 24e6, 1e-9);
});

test("starlight grazing the Sun bends by 1.75 arcseconds, twice the Newton-style guess", () => {
  near(lightBend(SUN.mass, SUN.radius) * RAD_TO_ARCSEC, 1.75, 0.01);
  near(newtonBend(SUN.mass, SUN.radius) * RAD_TO_ARCSEC, 0.875, 0.01);
  // Twice as far from the Sun, half the bending.
  near(lightBend(SUN.mass, 2 * SUN.radius), lightBend(SUN.mass, SUN.radius) / 2, 1e-12);
});

test("the ray path starts straight at height b and ends bent by alpha", () => {
  const b = 1;
  const a = 0.1;
  near(rayHeight(-1e6, b, a), b, 1e-6);
  const slope = rayHeight(1e6 + 1, b, a) - rayHeight(1e6, b, a);
  near(slope, -a, 1e-6);
});

test("GPS clocks gain about 45 μs a day from weaker gravity", () => {
  const gain = gravityClockGainPerDay(EARTH.mass, EARTH.radius, GPS_ORBIT_RADIUS);
  near(gain * 1e6, 45.7, 0.02);
});

test("clocks run slower deeper in gravity: Sun surface loses about 0.18 s a day, a neutron star far more", () => {
  near(clockLossPerDay(SUN.mass, SUN.radius), 0.183, 0.02);
  assert.ok(clockRate(EARTH.mass, EARTH.radius) < 1);
  const ns = BODIES.neutronStar;
  const rate = clockRate(ns.mass, ns.radius);
  assert.ok(rate > 0.75 && rate < 0.85, `rate ${rate}`);
  assert.ok(clockRate(BODIES.whiteDwarf.mass, BODIES.whiteDwarf.radius) > rate);
});

test("helpers: guess tolerance, number formatting and durations", () => {
  assert.equal(guessOk(3.4, 3.364, 0.05), true);
  assert.equal(guessOk(4, 3.364, 0.05), false);
  assert.equal(guessOk(NaN, 3, 0.05), false);
  assert.equal(sci(1.798e12), "1.8 × 10¹²");
  assert.equal(sci(9.996e5), "1 × 10⁶");
  assert.equal(sci(3.6e-6), "3.6 × 10⁻⁶");
  assert.equal(sci(454.2), "454");
  assert.equal(indianCount(454.4), "454");
  assert.equal(indianCount(4.5e5), "4.5 lakh");
  assert.equal(indianCount(3e7), "3 crore");
  assert.equal(duration(30), "30 s");
  assert.equal(duration(1798), "30 min");
  assert.equal(duration(5 * 3600), "5 hours");
  assert.equal(duration(0.183), "183 ms");
  assert.equal(duration(166 * 86400), "166 days");
  assert.equal(duration(4.57e-5), "46 μs");
  assert.ok(C > 2.99e8 && C < 3e8);
});
