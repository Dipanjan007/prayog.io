import assert from "node:assert/strict";
import { test } from "node:test";
import { TARGETS } from "../../content/lessons/electricity";
import {
  MATERIALS,
  batteryVolts,
  current,
  heat,
  parallel,
  power,
  resistivityFrom,
  series,
  solutions,
  solvePair,
  toKWh,
  wireResistance,
} from "./ohm";

const close = (a: number, b: number, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);

test("Ohm's law: V/I stays constant for one wire, so the V–I graph is a straight line", () => {
  const r = wireResistance(MATERIALS.nichrome.rho, 1, 0.1);
  close(r, 10);
  for (let cells = 1; cells <= 6; cells++) {
    const v = batteryVolts(cells);
    close(v / current(v, r), r);
  }
  close(current(12, 4), 3);
});

test("R = ρL/A: doubling L doubles R, halving A doubles R", () => {
  const rho = MATERIALS.constantan.rho;
  close(wireResistance(rho, 2, 0.1), 2 * wireResistance(rho, 1, 0.1));
  close(wireResistance(rho, 1, 0.05), 2 * wireResistance(rho, 1, 0.1));
  // 1 m of copper with 1 mm² cross-section: 0.0162 Ω.
  close(wireResistance(MATERIALS.copper.rho, 1, 1), 0.0162);
  // Nichrome is about 60 times copper of the same size.
  const ratio = wireResistance(MATERIALS.nichrome.rho, 1, 0.1) / wireResistance(MATERIALS.copper.rho, 1, 0.1);
  assert.ok(ratio > 55 && ratio < 65, `ratio ${ratio}`);
});

test("NCERT worked example: 1 m wire, 26 Ω, 0.3 mm diameter has ρ ≈ 1.84 × 10⁻⁶ Ω m", () => {
  close(resistivityFrom(26, 1, 0.3e-3), 1.84e-6, 0.005);
});

test("series adds; parallel adds reciprocals (NCERT: 5, 10, 30 Ω in parallel on 12 V gives 4 A)", () => {
  close(series(5, 10, 15), 30);
  close(parallel(5, 10, 30), 3);
  close(current(12, parallel(5, 10, 30)), 4);
  close(parallel(6, 6), 3);
  assert.ok(parallel(2, 20) < 2);
});

test("solvePair: series shares voltage, parallel shares current", () => {
  const s = solvePair(6, 10, 5, "series");
  close(s.r, 15);
  close(s.i, 0.4);
  close(s.v1 + s.v2, 6);
  const p = solvePair(3, 6, 3, "parallel");
  close(p.r, 2);
  close(p.i, 1.5);
  close(p.i1 + p.i2, p.i);
  close(p.v1, 3);
});

test("power and heat: P = VI = I²R, H = I²Rt, 1 kWh = 3.6 × 10⁶ J", () => {
  const r = 10;
  const v = 6;
  const i = current(v, r);
  close(power(v, i), i * i * r);
  close(power(v, i), (v * v) / r);
  close(heat(i, r, 60), power(v, i) * 60);
  close(heat(2 * i, r, 60), 4 * heat(i, r, 60));
  close(toKWh(3.6e6), 1);
  close(power(220, 0.5), 110);
  close(toKWh(1000 * 1800), 0.5);
});

test("every challenge round has exactly one solution with up to 6 cells", () => {
  for (const t of TARGETS) {
    const s = solutions(t.r1, t.r2, t.amps);
    assert.equal(s.length, 1, `${t.r1} Ω and ${t.r2} Ω for ${t.amps} A: ${JSON.stringify(s)}`);
  }
  // Both ways of joining appear across the three rounds.
  const hows = new Set(TARGETS.map((t) => solutions(t.r1, t.r2, t.amps)[0].how));
  assert.equal(hows.size, 2);
});
