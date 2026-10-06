import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AXIAL_TILT,
  CITIES,
  EQUINOX_DAY,
  MOON_FAR_KM,
  NODE_LON,
  dateOf,
  dayLength,
  dayOf,
  earthShadowAtMoon,
  eclipse,
  longestDay,
  moonPlace,
  noonAltitude,
  sunAltAz,
  sunDeclination,
  sunLongitude,
} from "./earthsun";

const near = (a: number, b: number, tol: number, msg?: string) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ""} ${a} vs ${b}`);
const JUN21 = dayOf(5, 21);
const DEC21 = dayOf(11, 21);

test("dates and days round trip", () => {
  assert.equal(dayOf(0, 1), 0);
  assert.equal(EQUINOX_DAY, 79);
  assert.equal(dateOf(JUN21).label, "21 Jun");
  assert.equal(dateOf(364).label, "31 Dec");
});

test("the Sun is overhead at 23.4° N in June and 23.4° S in December", () => {
  near(sunLongitude(EQUINOX_DAY), 0, 1e-9);
  near(sunDeclination(EQUINOX_DAY), 0, 1e-9);
  near(sunDeclination(JUN21), AXIAL_TILT, 0.05);
  near(sunDeclination(DEC21), -AXIAL_TILT, 0.05);
});

test("day lengths match almanac values for Indian cities", () => {
  const delhi = CITIES.delhi.lat;
  // Almanac: Delhi about 13 h 58 min on 21 June (sunrise 5:23 am, sunset 7:22 pm IST) and 10 h 19 min on 21 December.
  near(dayLength(delhi, sunDeclination(JUN21)), 13 + 58 / 60, 4 / 60);
  near(dayLength(delhi, sunDeclination(DEC21)), 10 + 19 / 60, 4 / 60);
  // At the equinox the day is a few minutes longer than 12 h because of the Sun's size and air bending light.
  const eq = dayLength(delhi, 0);
  assert.ok(eq > 12 && eq < 12.2);
  // With no tilt allowance, the equator always has 12 h.
  near(dayLength(0, 0) - dayLength(0, AXIAL_TILT), 0, 0.02);
});

test("in June the farther north, the longer the day; in December the reverse", () => {
  const j = (c: keyof typeof CITIES) => dayLength(CITIES[c].lat, sunDeclination(JUN21));
  const d = (c: keyof typeof CITIES) => dayLength(CITIES[c].lat, sunDeclination(DEC21));
  assert.ok(j("leh") > j("delhi") && j("delhi") > j("chennai"));
  assert.ok(d("leh") < d("delhi") && d("delhi") < d("chennai"));
});

test("the longest day in Delhi falls around 21 June", () => {
  const best = longestDay(CITIES.delhi.lat);
  assert.ok(Math.abs(best.day - JUN21) <= 2, `day ${best.day}`);
});

test("noon Sun height", () => {
  near(noonAltitude(CITIES.delhi.lat, sunDeclination(JUN21)), 90 - 28.61 + 23.44, 0.1);
  near(noonAltitude(CITIES.delhi.lat, sunDeclination(DEC21)), 90 - 28.61 - 23.44, 0.1);
  // Chennai in June: the noon Sun is 10° north of overhead.
  near(noonAltitude(CITIES.chennai.lat, AXIAL_TILT), 79.6, 0.1);
  // sunAltAz agrees at noon.
  near(sunAltAz(CITIES.delhi.lat, 10, 12).alt, noonAltitude(CITIES.delhi.lat, 10), 1e-6);
});

test("the Sun rises in the east and sets in the west", () => {
  const morning = sunAltAz(28.61, 0, 8);
  const evening = sunAltAz(28.61, 0, 16);
  assert.ok(morning.alt > 0 && morning.az > 45 && morning.az < 135, `morning az ${morning.az}`);
  assert.ok(evening.alt > 0 && evening.az > 225 && evening.az < 315, `evening az ${evening.az}`);
  near(morning.alt, evening.alt, 1e-9);
  // Earth turns 15° every hour.
  near(sunAltAz(0, 0, 7).alt, 15, 1e-6);
});

test("with no orbit tilt, every new moon and full moon gives an eclipse", () => {
  for (let d = 0; d < 365; d += 30) {
    assert.equal(eclipse(d, 0, false).kind, "total-solar", `day ${d}`);
    assert.equal(eclipse(d, 180, false).kind, "total-lunar", `day ${d}`);
    assert.equal(eclipse(d, 90, false).kind, "none");
  }
});

test("with the real 5° tilt, most new and full moons miss", () => {
  let solar = 0;
  let lunar = 0;
  for (let d = 0; d < 365; d++) {
    if (eclipse(d, 0, true).kind !== "none") solar++;
    if (eclipse(d, 180, true).kind !== "none") lunar++;
  }
  // Only two eclipse seasons, each roughly a month wide.
  assert.ok(solar > 40 && solar < 90, `solar days ${solar}`);
  assert.ok(lunar > 30 && lunar < 80, `lunar days ${lunar}`);
  // Away from the node line (March) the new moon passes well above or below the Sun.
  const mar = eclipse(EQUINOX_DAY, 0, true);
  assert.equal(mar.kind, "none");
  assert.ok(Math.abs(mar.beta) > 4);
});

test("eclipses happen when the Sun is on the node line", () => {
  // Sun at the ascending node: about 26 July.
  const day = Math.round(EQUINOX_DAY + (NODE_LON * 365.24) / 360);
  assert.equal(dateOf(day).month, 6);
  const s = eclipse(day, 0, true);
  assert.equal(s.kind, "total-solar");
  near(s.beta, 0, 0.05);
  assert.equal(eclipse(day, 180, true).kind, "total-lunar");
  // Ten days away, the full moon only clips the shadow.
  const k = eclipse(day + 10, 180, true).kind;
  assert.ok(k === "partial-lunar" || k === "penumbral-lunar", k);
});

test("the Moon's tilt sets its height above Earth's orbit plane", () => {
  let max = 0;
  for (let e = 0; e < 360; e += 1) max = Math.max(max, Math.abs(moonPlace(EQUINOX_DAY, e, true).beta));
  near(max, 5.14, 0.02);
  assert.equal(moonPlace(EQUINOX_DAY, 45, false).beta, 0);
});

test("a far Moon is too small to cover the Sun: ring eclipse", () => {
  assert.equal(eclipse(0, 0, false, MOON_FAR_KM).kind, "annular-solar");
});

test("Earth's shadow at the Moon is wider than the Moon", () => {
  const { umbra, penumbra } = earthShadowAtMoon();
  // About 4700 km and 8100 km across-radius; the Moon's radius is 0.27 Earth radii.
  near(umbra, 0.74, 0.02);
  near(penumbra, 1.27, 0.02);
});
