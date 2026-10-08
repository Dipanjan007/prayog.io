import assert from "node:assert/strict";
import { test } from "node:test";
import {
  INFILTRATION,
  LAND,
  WEATHER,
  cloudBase,
  dewPoint,
  drinkTemp,
  dryingHours,
  evaporationRate,
  infiltration,
  landscape,
  leeAirTemp,
  matkaTemp,
  satVapourPressure,
  tumblerSweats,
  vapourDensity,
  wetBulb,
} from "./water-cycle";

const near = (a: number, b: number, eps: number) => assert.ok(Math.abs(a - b) <= eps, `${a} vs ${b}`);

test("saturation vapour pressure matches steam tables", () => {
  near(satVapourPressure(20), 2.339, 0.01);
  near(satVapourPressure(30), 4.246, 0.02);
  // Water boils at 100 °C because its vapour pressure reaches about 1 atmosphere (101.3 kPa).
  near(satVapourPressure(100), 101.3, 2);
  // Saturated air at 30 °C holds about 30 g of water vapour per cubic metre.
  near(vapourDensity(30), 30.4, 0.3);
  near(vapourDensity(20), 17.3, 0.2);
});

test("dew point: saturated air is at its dew point; 30 °C at 80% has a dew point near 26 °C", () => {
  near(dewPoint(25, 1), 25, 1e-9);
  near(dewPoint(30, 0.8), 26.2, 0.1);
  assert.ok(dewPoint(30, 0.3) < dewPoint(30, 0.8));
});

test("Espy's rule: cloud base is about 125 m per °C of spread between temperature and dew point", () => {
  near(cloudBase(30, 0.8), 125 * (30 - dewPoint(30, 0.8)), 1e-9);
  near(cloudBase(30, 0.8), 480, 15);
  assert.ok(cloudBase(30, 0.4) > cloudBase(30, 0.8));
  near(cloudBase(20, 1), 0, 1e-9);
});

test("Stull's wet-bulb formula gives 13.7 °C at 20 °C and 50% humidity", () => {
  near(wetBulb(20, 0.5), 13.7, 0.1);
  near(wetBulb(30, 1), 30, 1e-9);
  assert.ok(wetBulb(40, 0.2) < 25);
});

test("evaporation grows with heat and wind, falls with humidity, and stops in saturated air", () => {
  assert.ok(evaporationRate(30, 30, 0.6, 1) > evaporationRate(20, 20, 0.6, 1));
  assert.ok(evaporationRate(25, 25, 0.6, 5) > evaporationRate(25, 25, 0.6, 0));
  assert.ok(evaporationRate(25, 25, 0.3, 1) > evaporationRate(25, 25, 0.9, 1));
  near(evaporationRate(25, 25, 1, 3), 0, 1e-9);
  // An open water surface in a hot, dry Indian summer loses about 10 mm a day.
  const delhiPan = evaporationRate(35, 35, 0.3, 2);
  assert.ok(delhiPan > 6 && delhiPan < 30, `${delhiPan}`);
});

test("landscape: the Sun drives evaporation and the rain; the wind brings it to the hills", () => {
  const weak = landscape(0, 0);
  const strong = landscape(1, 0);
  assert.ok(strong.evaporation > 1.5 * weak.evaporation);
  assert.ok(landscape(1, 8).evaporation > strong.evaporation);
  // No wind: nothing pushes the sea air up the hills.
  assert.equal(strong.rainHill, 0);
  assert.equal(strong.hillCloud, false);
  // Wind: the air is forced above the cloud base and it rains on the slope.
  const monsoon = landscape(1, 10);
  assert.ok(monsoon.cloudBase < LAND.hillTop && monsoon.hillCloud);
  assert.ok(monsoon.rainHill > landscape(0, 10).rainHill);
  assert.ok(monsoon.rainHill > landscape(1, 4).rainHill);
  // A heavy monsoon day on the Western Ghats brings well over 100 mm of rain.
  assert.ok(monsoon.rainHill * 24 > 100 && monsoon.rainHill < 15, `${monsoon.rainHill}`);
  assert.equal(monsoon.rainLee, 0);
});

test("air coming down the far side of the hills is warmer than air climbing the near side", () => {
  // On the near side, at plateau height the air is still cooling at the dry rate.
  const windwardAtPlateau = landscape(1, 5).seaT - (9.8 * LAND.plateau) / 1000;
  assert.ok(leeAirTemp(1) > windwardAtPlateau + 2);
});

test("infiltration: soil soaks gentle rain, heavy rain runs off, concrete lets nothing in", () => {
  assert.deepEqual(infiltration(2, "soil"), { soak: 2, runoff: 0 });
  const heavy = infiltration(10, "soil");
  near(heavy.soak, INFILTRATION.soil, 1e-9);
  near(heavy.soak + heavy.runoff, 10, 1e-9);
  assert.deepEqual(infiltration(3, "concrete"), { soak: 0, runoff: 3 });
});

test("a shirt dries much faster in Delhi's dry heat than in Mumbai's monsoon, and faster spread out", () => {
  const m = WEATHER.mumbai;
  const d = WEATHER.delhi;
  const mumbai = dryingHours(m.T, m.rh, 0, "spread");
  const delhi = dryingHours(d.T, d.rh, 0, "spread");
  assert.ok(mumbai > 5 * delhi, `${mumbai} vs ${delhi}`);
  assert.ok(delhi < 3 && mumbai > 12);
  assert.ok(dryingHours(m.T, m.rh, 4, "spread") < mumbai);
  assert.ok(dryingHours(d.T, d.rh, 0, "folded") > 3 * delhi);
  assert.equal(dryingHours(30, 1, 5, "spread"), Infinity);
});

test("a matka cools water a lot in dry air and hardly at all in humid air", () => {
  const d = WEATHER.delhi;
  const m = WEATHER.mumbai;
  assert.ok(d.T - matkaTemp(d.T, d.rh) > 8);
  assert.ok(m.T - matkaTemp(m.T, m.rh) < 2);
});

test("a steel tumbler sweats only when it is colder than the dew point", () => {
  const m = WEATHER.mumbai;
  assert.ok(tumblerSweats(drinkTemp("ice", m.T, m.rh), m.T, m.rh));
  assert.ok(tumblerSweats(drinkTemp("fridge", m.T, m.rh), m.T, m.rh));
  assert.ok(!tumblerSweats(drinkTemp("matka", m.T, m.rh), m.T, m.rh));
  // Very dry air: even fridge water stays dry.
  assert.ok(!tumblerSweats(drinkTemp("fridge", 29, 0.15), 29, 0.15));
});
