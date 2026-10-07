import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JUPITER_ARCSEC,
  RED_BOW_DEG,
  SIRIUS_ARCSEC,
  VIOLET_BOW_DEG,
  airMass,
  airPathKm,
  apparentAltitude,
  colourExponent,
  flickerAmplitude,
  hueOf,
  normalise,
  primaryDeviation,
  rainbowAngle,
  rainbowView,
  rayleighDepth,
  rayleighRatio,
  refractionArcmin,
  skyLight,
  sunLight,
  sunSquash,
  sunriseAdvanceMinutes,
  tankEndLight,
  tankSideLight,
  traceDrop,
  trueAltitudeAtHorizon,
  waterIndex,
} from "./sky-optics";

const near = (a: number, b: number, eps: number) => assert.ok(Math.abs(a - b) <= eps, `${a} vs ${b}`);

test("Rayleigh's law: blue (450 nm) is scattered about 5.9 times more than red (700 nm)", () => {
  near(rayleighRatio(450, 700), 5.86, 0.01);
  near(rayleighRatio(400, 800), 16, 1e-9);
});

test("tiny particles follow 1/λ⁴, big drops scatter all colours alike", () => {
  near(colourExponent(5), 4, 0.01);
  assert.ok(colourExponent(2000) < 0.01);
  assert.ok(colourExponent(40) > colourExponent(150));
});

test("tank: tiny particles give a blue side glow and an orange-red end; big ones look white", () => {
  assert.equal(hueOf(tankSideLight(40, 0)), "blue");
  assert.equal(hueOf(tankEndLight(40, 1.5)), "red");
  assert.notEqual(hueOf(tankEndLight(40, 0.3)), "red");
  assert.equal(hueOf(tankSideLight(2000, 0)), "white");
  assert.equal(hueOf(tankEndLight(2000, 1.5)), "white");
});

test("the atmosphere's optical depth at 550 nm is about 0.097", () => {
  near(rayleighDepth(550), 0.097, 0.003);
  assert.ok(rayleighDepth(450) > 2 * rayleighDepth(650) * 2);
});

test("air mass is 1 overhead, 2 at 30° and about 38 at the horizon", () => {
  near(airMass(90), 1, 1e-3);
  near(airMass(30), 2, 0.01);
  near(airMass(0), 38, 0.5);
  near(airPathKm(0) / airPathKm(90), 38, 0.5);
});

test("noon sky is blue, the setting Sun is red, and with no air the sky is black", () => {
  assert.equal(hueOf(skyLight(70, 90)), "blue");
  assert.equal(hueOf(sunLight(70)), "white");
  assert.equal(hueOf(sunLight(0)), "red");
  const s = skyLight(70, 90, 0);
  assert.deepEqual(s, [0, 0, 0]);
  assert.deepEqual(normalise(sunLight(0, 0)), [1, 1, 1]);
});

test("refraction lifts an object on the horizon by about 34 arcminutes", () => {
  near(refractionArcmin(-0.57), 34.5, 1);
  assert.ok(refractionArcmin(45) < 1.1);
  near(trueAltitudeAtHorizon(), -0.575, 0.02);
  near(apparentAltitude(trueAltitudeAtHorizon()), 0, 1e-6);
});

test("the Sun is seen about 2 minutes before it really rises", () => {
  const mumbai = sunriseAdvanceMinutes(19.08);
  assert.ok(mumbai > 2 && mumbai < 2.6, `${mumbai}`);
  assert.ok(sunriseAdvanceMinutes(0) < mumbai);
});

test("the Sun looks flattened at the horizon but round high up", () => {
  const squash = sunSquash(trueAltitudeAtHorizon() + 0.2665);
  assert.ok(squash > 0.8 && squash < 0.9, `${squash}`);
  near(sunSquash(45), 1, 0.001);
  near(sunSquash(0, 0), 1, 1e-9);
});

test("stars twinkle, planets hardly do", () => {
  assert.ok(flickerAmplitude(SIRIUS_ARCSEC) > 0.99);
  assert.ok(flickerAmplitude(JUPITER_ARCSEC) < 0.05);
});

test("water bends violet more than red", () => {
  near(waterIndex(700), 1.331, 0.001);
  near(waterIndex(400), 1.343, 0.001);
});

test("rainbow: red at about 42°, violet at about 40.6°", () => {
  near(RED_BOW_DEG, 42.3, 0.3);
  near(VIOLET_BOW_DEG, 40.6, 0.4);
  assert.ok(RED_BOW_DEG > VIOLET_BOW_DEG);
});

test("the ray tracer agrees with the deviation formula, and no ray comes out above the rainbow angle", () => {
  const n = waterIndex(700);
  let maxElev = -Infinity;
  for (let k = 1; k < 200; k++) {
    const b = k / 200;
    const t = traceDrop(b, n);
    const i = (Math.asin(b) * 180) / Math.PI;
    near(t.elevation, 180 - primaryDeviation(i, n), 1e-6);
    near(Math.hypot(t.p3.x, t.p3.y), 1, 1e-9);
    maxElev = Math.max(maxElev, t.elevation);
  }
  near(maxElev, rainbowAngle(n), 0.02);
});

test("a rainbow needs the Sun behind you, low enough, and rain in front", () => {
  const rain = { x0: 58, x1: 80, top: 30 };
  assert.equal(rainbowView({ sunAlt: 20, sunOnLeft: true, observerX: 30, rain }).visible, true);
  assert.equal(rainbowView({ sunAlt: 20, sunOnLeft: false, observerX: 30, rain }).reason, "sun-in-front");
  assert.equal(rainbowView({ sunAlt: 50, sunOnLeft: true, observerX: 30, rain }).reason, "sun-too-high");
  assert.equal(rainbowView({ sunAlt: 5, sunOnLeft: true, observerX: 2, rain }).reason, "above-cloud");
  assert.equal(rainbowView({ sunAlt: 20, sunOnLeft: true, observerX: 90, rain }).reason, "sun-in-front");
  assert.equal(rainbowView({ sunAlt: 20, sunOnLeft: true, observerX: 70, rain }).visible, true);
});
