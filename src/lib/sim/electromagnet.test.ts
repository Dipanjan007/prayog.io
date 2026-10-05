import assert from "node:assert/strict";
import { test } from "node:test";
import { CELLS, ITEMS, TURNS, canLift, craneUpdate, newCrane, electromagnet, fuseMelts, glowOf, heating, seriesCurrent, wireResistance, type ItemKind } from "./electromagnet";

test("no current means no magnet: switching off drops everything", () => {
  const e = electromagnet(6, 100, true, false);
  assert.equal(e.current, 0);
  assert.equal(e.holdGrams, 0);
  assert.equal(canLift("iron", e.holdGrams, 10), 0);
  assert.equal(canLift("clip", e.holdGrams, 25), 0);
});

test("current follows V / (r + R) for cells in series", () => {
  // 2 cells: 3 V over 0.8 + 0.3 + 1.5 = 2.6 ohm.
  assert.ok(Math.abs(seriesCurrent(2, 1.5) - 3 / 2.6) < 1e-12);
});

test("strength is proportional to turns × current", () => {
  for (let c = CELLS.min; c <= CELLS.max; c++)
    for (let t = TURNS.min; t <= TURNS.max; t += TURNS.step) {
      const e = electromagnet(c, t, true, true);
      assert.ok(Math.abs(e.holdGrams / (t * e.current) - electromagnet(1, 10, true, true).holdGrams / (10 * electromagnet(1, 10, true, true).current)) < 1e-9);
    }
});

test("more turns and more cells always lift at least as much", () => {
  for (let c = CELLS.min; c <= CELLS.max; c++)
    for (let t = TURNS.min; t < TURNS.max; t += TURNS.step) {
      const a = electromagnet(c, t, true, true);
      // More turns add a little resistance, so current drops a bit, but turns × current still rises.
      assert.ok(electromagnet(c, t + TURNS.step, true, true).current < a.current);
      assert.ok(electromagnet(c, t + TURNS.step, true, true).ampTurns > a.ampTurns, `c=${c} t=${t}`);
      if (c < CELLS.max) assert.ok(electromagnet(c + 1, t, true, true).ampTurns > a.ampTurns);
    }
});

test("the iron core is needed for strong lifting", () => {
  for (let c = CELLS.min; c <= CELLS.max; c++)
    for (let t = TURNS.min; t <= TURNS.max; t += TURNS.step) {
      const air = electromagnet(c, t, false, true);
      assert.equal(canLift("iron", air.holdGrams, 10), 0, `no scrap without a core at c=${c} t=${t}`);
      assert.ok(electromagnet(c, t, true, true).holdGrams > 20 * air.holdGrams);
    }
  assert.ok(canLift("iron", electromagnet(6, 100, true, true).holdGrams, 10) >= 7);
});

test("aluminium and plastic are never lifted, however strong the magnet", () => {
  for (const kind of ["aluminium", "plastic"] as ItemKind[]) {
    assert.equal(ITEMS[kind].magnetic, false);
    assert.equal(canLift(kind, 1e9, 5), 0);
  }
  assert.equal(canLift("iron", 1e9, 4), 4, "cannot lift more than there is");
});

test("every challenge order (2, 5 and 7 pieces) can be met exactly", () => {
  for (const n of [2, 5, 7]) {
    let ok = false;
    for (let c = CELLS.min; c <= CELLS.max; c++)
      for (let t = TURNS.min; t <= TURNS.max; t += TURNS.step) if (canLift("iron", electromagnet(c, t, true, true).holdGrams, 10) === n) ok = true;
    assert.ok(ok, `order ${n}`);
  }
});

test("nichrome has far more resistance than copper of the same size", () => {
  // rho L / A with L = 10 cm, d = 0.3 mm: nichrome about 1.56 ohm, copper about 0.024 ohm.
  assert.ok(Math.abs(wireResistance("nichrome") - 1.556) < 0.01);
  assert.ok(Math.abs(wireResistance("copper") - 0.024) < 0.001);
});

test("nichrome glows with enough cells; copper only gets warm", () => {
  assert.equal(glowOf(heating("nichrome", 1).tempC).color, null);
  assert.ok(heating("nichrome", 4).tempC > 525);
  assert.ok(heating("nichrome", 6).tempC > heating("nichrome", 5).tempC);
  for (let c = CELLS.min; c <= CELLS.max; c++) assert.equal(glowOf(heating("copper", c).tempC).color, null);
  // But copper lets a much bigger current flow.
  assert.ok(heating("copper", 3).current > heating("nichrome", 6).current);
});

test("a fuse melts only above its rating", () => {
  assert.equal(fuseMelts(0.99, 1), false);
  assert.equal(fuseMelts(1.01, 1), true);
  // Nichrome with 6 cells (about 2.1 A) melts a 2 A fuse but not a 3 A fuse.
  const i = heating("nichrome", 6).current;
  assert.equal(fuseMelts(i, 2), true);
  assert.equal(fuseMelts(i, 3), false);
  // Copper is nearly a short circuit: 4 cells melt even the 3 A fuse.
  assert.equal(fuseMelts(heating("copper", 4).current, 3), true);
});

test("crane: lift over the pile, swing, switch off over the truck", () => {
  let s = craneUpdate(newCrane("scrap"), { cells: 4, turns: 100, core: true });
  assert.equal(s.held, 0, "switch is still off");
  s = craneUpdate(s, { on: true });
  assert.equal(s.held, 6);
  assert.equal(s.pile, 4);
  s = craneUpdate(s, { pos: "truck" });
  assert.equal(s.held, 6);
  // Fewer cells while over the truck: the extra pieces fall into the truck.
  s = craneUpdate(s, { cells: 3 });
  assert.equal(s.held, 5);
  assert.equal(s.truck, 1);
  s = craneUpdate(s, { on: false });
  assert.equal(s.held, 0);
  assert.equal(s.truck, 6);
  assert.equal(s.drops, 2);
  assert.equal(s.pile + s.held + s.truck, 10, "no scrap made or lost");
});

test("crane: pulling the core out over the pile drops the scrap back", () => {
  let s = craneUpdate(newCrane("scrap"), { cells: 6, turns: 100, on: true });
  assert.ok(s.held > 0);
  s = craneUpdate(s, { core: false });
  assert.equal(s.held, 0);
  assert.equal(s.pile, 10);
  s = craneUpdate(s, { load: "clips", core: false });
  assert.ok(s.held > 0 && s.held < 25, `a coil with no core lifts a few clips (${s.held})`);
});
