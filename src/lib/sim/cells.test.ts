import assert from "node:assert/strict";
import { test } from "node:test";
import {
  COIL,
  COMPASS_CURRENT,
  EARTH_BH,
  FRUITS,
  GADGETS,
  coilField,
  coilInsideField,
  coilNorthEnd,
  deflection,
  fewestCells,
  fieldNearWire,
  fruitCell,
  loadWorks,
  needleAngle,
  series,
  solveCircuit,
  wireField,
} from "./cells";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test("field of a straight wire: 1 A at 1 cm gives 20 µT", () => {
  close(fieldNearWire(1, 0.01), 2e-5, 1e-12);
  // Right under the wire the horizontal part is the whole field.
  close(Math.abs(wireField(1, 0, 0.01).x), 2e-5, 1e-12);
  // Further to the side the needle feels much less.
  assert.ok(Math.abs(wireField(1, 0.05).x) < Math.abs(wireField(1, 0).x) / 10);
});

test("a north-flowing current over a compass turns its needle west, and reversing it turns it east", () => {
  const west = deflection(wireField(COMPASS_CURRENT, 0));
  const east = deflection(wireField(-COMPASS_CURRENT, 0));
  assert.ok(west < -15, `west ${west}`);
  close(east, -west, 1e-9);
  // With no current the needle points north.
  close(deflection({ x: 0, y: 0 }), 0);
});

test("Earth's field alone points the needle north, and the angle is measured from north", () => {
  close(needleAngle({ x: 0, y: EARTH_BH }), 0);
  close(needleAngle({ x: 1, y: 1 }), 45);
  close(needleAngle({ x: -1, y: 0 }), -90);
});

test("inside a long coil B = μ0 N I / L", () => {
  // 1000 turns per metre carrying 1 A: about 1.26 mT.
  close(coilInsideField(1000, 1, 1), 4 * Math.PI * 1e-4, 1e-12);
});

test("the coil acts like a bar magnet: the field leaves its north end and enters its south end", () => {
  const half = COIL.length / 2;
  const nearEast = coilField({ x: half + 0.02, y: 0 }, COMPASS_CURRENT);
  const nearWest = coilField({ x: -half - 0.02, y: 0 }, COMPASS_CURRENT);
  assert.equal(coilNorthEnd(COMPASS_CURRENT), "east");
  // At the north (east) end the field points away from the coil (east); at the south (west) end it points into the coil (also east).
  assert.ok(nearEast.x > 0 && nearWest.x > 0);
  // Beside the middle of the coil, the field runs the other way, from N round to S.
  assert.ok(coilField({ x: 0, y: 0.04 }, COMPASS_CURRENT).x < 0);
  // Reversing the current swaps the poles.
  assert.equal(coilNorthEnd(-COMPASS_CURRENT), "west");
  close(coilField({ x: half + 0.02, y: 0 }, -COMPASS_CURRENT).x, -nearEast.x, 1e-15);
  // Near the end the coil's field is comparable to Earth's, so the needle swings a lot.
  assert.ok(Math.abs(deflection(nearEast)) > 30);
});

test("a lemon zinc-copper cell gives about 0.9 V, and two copper strips give 0 V", () => {
  const c = fruitCell("lemon", "zn-cu");
  assert.ok(c.emf > 0.85 && c.emf < 1.0);
  close(fruitCell("lemon", "cu-cu").emf, 0);
  // Iron and copper are closer in the reactivity series, so less voltage.
  assert.ok(fruitCell("lemon", "fe-cu").emf < c.emf && fruitCell("lemon", "fe-cu").emf > 0.3);
  // The current is tiny: shorting a lemon cell gives about 1 mA, not amperes.
  assert.ok(c.emf / c.r < 2e-3);
});

test("n cells in series: V = n × V₁", () => {
  const one = fruitCell("lemon", "zn-cu");
  close(series(3, one).emf, 3 * one.emf);
  close(solveCircuit(series(4, one), "none").volts, 4 * one.emf);
});

test("an LED needs about 1.8 V and lights only the right way round", () => {
  const lemon = fruitCell("lemon", "zn-cu");
  assert.equal(solveCircuit(series(1, lemon), "led").works, false);
  assert.equal(solveCircuit(series(2, lemon), "led").works, false); // 1.84 V barely starts it: too dim to see
  const three = solveCircuit(series(3, lemon), "led");
  assert.ok(three.works && three.glow > 0);
  // Flipped, no current flows at all, so the voltmeter shows the full voltage.
  const flipped = solveCircuit(series(3, lemon), "led", true);
  assert.equal(flipped.works, false);
  close(flipped.current, 0);
  close(flipped.volts, 3 * lemon.emf);
});

test("challenge: fewest fruits for an LED, a 1.5 V clock and a 3 V calculator", () => {
  assert.equal(fewestCells("led"), 3);
  assert.equal(fewestCells("clock"), 2);
  assert.equal(fewestCells("calc"), 4);
  assert.ok(loadWorks("clock", 2, "lemon", "zn-cu"));
  assert.ok(!loadWorks("calc", 3, "lemon", "zn-cu"));
  assert.ok(!loadWorks("led", 5, "lemon", "cu-cu"));
  // The gadget's voltage needs match a real AA cell (1.5 V) and two in series (3 V).
  assert.equal(GADGETS.clock.needV, 1.5);
  assert.equal(GADGETS.calc.needV, 3);
  assert.ok(Object.values(FRUITS).every((f) => f.emf < 1));
});
