import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MATERIALS,
  ROD,
  breeze,
  createRod,
  diffusivity,
  landTemp,
  meltedDrops,
  potFlow,
  seaTemp,
  steadyRod,
  stepRod,
  stepWater,
  sunlight,
  tempAt,
  tinTemps,
  type RodMaterial,
} from "./heat";

const order: RodMaterial[] = ["copper", "steel", "glass", "wood"];

/** Heat a rod for `seconds` and return when each wax drop first melted (null if never). */
function run(m: RodMaterial, seconds: number) {
  const T = createRod();
  const times: (number | null)[] = ROD.drops.map(() => null);
  for (let t = 0; t < seconds; t += 2) {
    stepRod(T, m, 2, true);
    meltedDrops(T).forEach((d, i) => {
      if (d && times[i] === null) times[i] = t + 2;
    });
  }
  return { T, times };
}

test("conductivity and diffusivity go copper > steel > glass > wood", () => {
  for (let i = 0; i < order.length - 1; i++) {
    assert.ok(MATERIALS[order[i]].k > MATERIALS[order[i + 1]].k, `${order[i]} k`);
    assert.ok(diffusivity(order[i]) > diffusivity(order[i + 1]), `${order[i]} alpha`);
  }
});

test("wax drops fall in order from the flame end, fastest on copper", () => {
  const hour = 3600;
  const res = Object.fromEntries(order.map((m) => [m, run(m, hour)])) as Record<RodMaterial, ReturnType<typeof run>>;
  // Copper drops all fall within two minutes, one after another.
  const cu = res.copper.times;
  assert.ok(cu.every((t) => t !== null && t < 120), `copper ${cu}`);
  for (let i = 1; i < cu.length; i++) assert.ok(cu[i]! >= cu[i - 1]!, "copper drops fall in order");
  // Steel melts three drops, glass only the nearest one, wood none.
  const fallen = (m: RodMaterial) => res[m].times.filter((t) => t !== null).length;
  assert.equal(fallen("copper"), 5);
  assert.equal(fallen("steel"), 3);
  assert.equal(fallen("glass"), 1);
  assert.equal(fallen("wood"), 0);
  // The first drop falls later and later down the list.
  assert.ok(res.copper.times[0]! < res.steel.times[0]! && res.steel.times[0]! < res.glass.times[0]!);
});

test("a long heated rod settles to the fin formula", () => {
  for (const m of order) {
    const T = createRod();
    stepRod(T, m, 6 * 3600, true);
    for (const x of [0.05, 0.1, 0.19]) {
      const want = steadyRod(m, x);
      assert.ok(Math.abs(tempAt(T, x) - want) < 1.5, `${m} at ${x}: ${tempAt(T, x).toFixed(1)} vs ${want.toFixed(1)}`);
    }
  }
});

test("temperature never rises above the flame or falls below the air", () => {
  const T = createRod();
  stepRod(T, "copper", 300, true);
  stepRod(T, "copper", 600, false);
  for (const t of T) assert.ok(t >= ROD.airT - 1e-9 && t <= ROD.flameT + 1e-9);
  // With the flame off, the rod cools back towards the air.
  assert.ok(tempAt(T, 0) < 120);
});

test("pot water rises above the flame and sinks at the walls, with no water made or lost", () => {
  const mid = potFlow(0.5, 0.5, 1, "middle");
  assert.ok(mid.v > 0.9, "rises in the middle");
  assert.ok(potFlow(0.02, 0.5, 1, "middle").v < 0, "sinks at the wall");
  const top = potFlow(0.3, 0.98, 1, "middle");
  assert.ok(top.u < 0, "spreads out along the top");
  assert.ok(potFlow(0.98, 0.5, 1, "side").v > 0, "side flame: rises on the hot side");
  assert.ok(potFlow(0.02, 0.5, 1, "side").v < 0, "side flame: sinks on the cold side");
  // Divergence du/dx + dv/dy should be zero everywhere.
  const e = 1e-5;
  for (const pos of ["middle", "side"] as const) {
    for (const [x, y] of [[0.2, 0.3], [0.6, 0.8], [0.45, 0.1]]) {
      const div =
        (potFlow(x + e, y, 1, pos).u - potFlow(x - e, y, 1, pos).u) / (2 * e) + (potFlow(x, y + e, 1, pos).v - potFlow(x, y - e, 1, pos).v) / (2 * e);
      assert.ok(Math.abs(div) < 1e-6, `${pos} div ${div}`);
    }
  }
  // No flow through the walls, floor or surface.
  assert.ok(Math.abs(potFlow(0, 0.5, 1, "middle").u) < 1e-12 && Math.abs(potFlow(0.5, 0, 1, "side").v) < 1e-12);
});

test("water heats towards 100 °C with the flame and cools without it", () => {
  let t = 30;
  t = stepWater(t, true, 60);
  assert.ok(t > 50 && t < 100);
  t = stepWater(t, true, 1e5);
  assert.ok(Math.abs(t - 100) < 0.01);
  assert.ok(stepWater(80, false, 10) < 80);
});

test("land changes temperature much more than the sea", () => {
  const range = (f: (h: number) => number) => {
    const v = Array.from({ length: 48 }, (_, i) => f(i / 2));
    return Math.max(...v) - Math.min(...v);
  };
  assert.ok(range(landTemp) > 5 * range(seaTemp));
});

test("sea breeze at 2 pm, land breeze at 2 am", () => {
  assert.equal(breeze(14).kind, "sea");
  assert.ok(landTemp(14) > seaTemp(14));
  assert.equal(breeze(2).kind, "land");
  assert.ok(landTemp(2) < seaTemp(2));
  // Around the changeover times the air is calm.
  assert.equal(breeze(9).kind, "calm");
  assert.equal(breeze(21).kind, "calm");
});

test("a black tin gets hotter than a white tin in sunshine, not at night", () => {
  const noon = tinTemps(12);
  assert.ok(noon.black - noon.white > 10);
  assert.ok(noon.white > landTemp(12));
  const night = tinTemps(1);
  assert.equal(sunlight(1), 0);
  assert.ok(Math.abs(night.black - night.white) < 1e-9);
});
