import assert from "node:assert/strict";
import { test } from "node:test";
import {
  INDIA_LAT,
  LUNAR_YEAR_DAYS,
  SYNODIC_DAYS,
  YEAR_DAYS,
  compass,
  indiaInDaylight,
  litSpan,
  moonPhase,
  orbitAngles,
  stickShadow,
  sunDeclination,
  sunPosition,
  sunTimes,
} from "./sky";

const near = (a: number, b: number, tol: number, msg?: string) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ""} ${a} vs ${b}`);

test("phases follow the 29.5 day cycle", () => {
  const n = moonPhase(0);
  near(n.lit, 0, 1e-9);
  assert.equal(n.paksha, "Shukla");
  const q = moonPhase(SYNODIC_DAYS / 4);
  near(q.lit, 0.5, 1e-9);
  assert.equal(q.name, "First quarter");
  const f = moonPhase(SYNODIC_DAYS / 2 - 0.01);
  near(f.lit, 1, 1e-4);
  assert.equal(f.name, "Full moon (Purnima)");
  assert.equal(f.tithi, 15);
  const lq = moonPhase((3 * SYNODIC_DAYS) / 4 + 0.01);
  assert.equal(lq.waxing, false);
  assert.equal(lq.paksha, "Krishna");
  assert.equal(lq.name, "Last quarter");
  near(moonPhase(SYNODIC_DAYS - 0.01).lit, 0, 1e-4);
  assert.equal(moonPhase(SYNODIC_DAYS - 0.01).tithi, 15);
  assert.equal(moonPhase(SYNODIC_DAYS + 1).lunarMonths, 1);
});

test("the drawn disc is lit by exactly the right fraction, on the right side", () => {
  for (const e of [10, 45, 90, 135, 180, 225, 270, 315, 350]) {
    let area = 0;
    const N = 4000;
    for (let i = 0; i < N; i++) {
      const y = -1 + (2 * (i + 0.5)) / N;
      const [x0, x1] = litSpan(y, e);
      assert.ok(x1 >= x0 - 1e-12, `e=${e}`);
      area += (x1 - x0) * (2 / N);
    }
    const expected = (1 - Math.cos((e * Math.PI) / 180)) / 2;
    near(area / Math.PI, expected, 2e-3, `e=${e}`);
  }
  // Waxing crescent: lit at the right edge. Waning crescent: at the left edge.
  assert.ok(litSpan(0, 40)[1] === 1 && litSpan(0, 40)[0] > 0.5);
  assert.ok(litSpan(0, 320)[0] === -1 && litSpan(0, 320)[1] < -0.5);
});

test("in the top-down view the full Moon is opposite the Sun and the new Moon between", () => {
  const f = orbitAngles(SYNODIC_DAYS / 2);
  near(Math.cos(f.moonRad - f.sunFromEarthRad), -1, 1e-9);
  const n = orbitAngles(0);
  near(Math.cos(n.moonRad - n.sunFromEarthRad), 1, 1e-9);
  // India faces the Sun at noon and faces away at midnight.
  const noon = orbitAngles(3.5);
  near(Math.cos(noon.indiaRad - noon.sunFromEarthRad), 1, 1e-9);
  const midnight = orbitAngles(3);
  near(Math.cos(midnight.indiaRad - midnight.sunFromEarthRad), -1, 1e-9);
  assert.equal(indiaInDaylight(9), true);
  assert.equal(indiaInDaylight(21), false);
});

test("12 lunar months fall about 11 days short of a year, so an adhik maas comes about every 2.7 years", () => {
  near(LUNAR_YEAR_DAYS, 354.4, 0.1);
  near(YEAR_DAYS - LUNAR_YEAR_DAYS, 10.9, 0.1);
  near(SYNODIC_DAYS / (YEAR_DAYS - LUNAR_YEAR_DAYS), 2.7, 0.05);
  // 19 years hold almost exactly 235 lunar months: 7 extra months every 19 years.
  near(235 * SYNODIC_DAYS, 19 * YEAR_DAYS, 1);
});

test("the Sun at 23° N: equinox, June and December", () => {
  near(sunDeclination(2), 0, 0.01);
  near(sunDeclination(5), 23.44, 0.05);
  near(sunDeclination(11), -23.44, 0.05);
  // Equinox noon: altitude 90 - latitude, Sun due south.
  const eq = sunPosition(INDIA_LAT, 0, 12);
  near(eq.alt, 67, 1e-6);
  near(eq.az, 180, 1e-6);
  // June noon: almost overhead, so almost no shadow.
  const jun = sunPosition(INDIA_LAT, sunDeclination(5), 12);
  assert.ok(jun.alt > 89);
  assert.ok(stickShadow(jun.alt, jun.az)!.length < 0.02);
  // December noon: low Sun in the south, long shadow pointing north.
  const dec = sunPosition(INDIA_LAT, sunDeclination(11), 12);
  near(dec.alt, 43.56, 0.1);
  const s = stickShadow(dec.alt, dec.az)!;
  near(s.az, 0, 1e-6);
  near(s.length, 1 / Math.tan((dec.alt * Math.PI) / 180), 1e-12);
  assert.ok(s.length > 1);
});

test("morning Sun in the east casts shadows to the west, and shadows shrink towards noon", () => {
  const sunrise = sunPosition(INDIA_LAT, 0, 6);
  near(sunrise.alt, 0, 1e-6);
  near(sunrise.az, 90, 1e-6);
  const m = sunPosition(INDIA_LAT, 0, 8);
  assert.equal(compass(stickShadow(m.alt, m.az)!.az), "W");
  const a = sunPosition(INDIA_LAT, 0, 16);
  assert.equal(compass(stickShadow(a.alt, a.az)!.az), "E");
  let last = Infinity;
  for (const h of [7, 8, 9, 10, 11, 12]) {
    const p = sunPosition(INDIA_LAT, sunDeclination(0), h);
    const len = stickShadow(p.alt, p.az)!.length;
    assert.ok(len < last, `h=${h}`);
    last = len;
  }
  assert.equal(stickShadow(-5, 90), null);
});

test("days are longer in June than in December at 23° N", () => {
  const eq = sunTimes(INDIA_LAT, 0);
  near(eq.rise, 6, 1e-9);
  near(eq.length, 12, 1e-9);
  const jun = sunTimes(INDIA_LAT, sunDeclination(5));
  const dec = sunTimes(INDIA_LAT, sunDeclination(11));
  near(jun.length, 13.4, 0.1);
  near(dec.length, 10.6, 0.1);
});
