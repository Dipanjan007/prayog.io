import assert from "node:assert/strict";
import { test } from "node:test";
import { STALLS, lesson } from "../../content/lessons/probability";
import {
  EXPERIMENTS,
  EXP_ORDER,
  allowed,
  fracText,
  freqs,
  leads,
  makeRng,
  maxGap,
  meetsTarget,
  pick,
  runTrials,
  runTraced,
  builtChances,
  MAX_TRIALS,
  settled,
  solutions,
  startCounts,
  sumWays,
  theory,
} from "./probability";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test("the seeded random source repeats exactly and stays in [0, 1)", () => {
  const a = makeRng(42);
  const b = makeRng(42);
  for (let i = 0; i < 1000; i++) {
    const x = a();
    assert.equal(x, b());
    assert.ok(x >= 0 && x < 1);
  }
  assert.notEqual(makeRng(1)(), makeRng(2)());
});

test("theoretical probabilities: coin 1/2, die 1/6, spinner and bag red 1/2, two dice", () => {
  close(theory(EXPERIMENTS.coin.ways)[0], 1 / 2);
  for (const p of theory(EXPERIMENTS.die.ways)) close(p, 1 / 6);
  close(theory(EXPERIMENTS.spinner.ways)[0], 1 / 2);
  close(theory(EXPERIMENTS.bag.ways)[0], 1 / 2);
  close(theory(EXPERIMENTS.bag.ways)[1], 3 / 10);
  const sum = theory(EXPERIMENTS.sum.ways);
  close(sum[5], 6 / 36);
  close(sum[0], 1 / 36);
  close(sum[10], 1 / 36);
  for (let s = 2; s <= 12; s++) assert.equal(EXPERIMENTS.sum.ways[s - 2], sumWays(s));
  assert.equal(EXPERIMENTS.sum.ways.reduce((a, b) => a + b, 0), 36);
  // 7 is the single most likely total.
  assert.ok(leads(EXPERIMENTS.sum.ways, 5));
});

test("pick follows the weights", () => {
  const rng = makeRng(7);
  const c = [0, 0, 0];
  for (let i = 0; i < 30000; i++) c[pick([5, 3, 2], rng)]++;
  close(c[0] / 30000, 0.5, 0.02);
  close(c[1] / 30000, 0.3, 0.02);
  close(c[2] / 30000, 0.2, 0.02);
});

test("10 tosses wobble, 1000 tosses settle near 1/2 but are rarely exactly 500", () => {
  let wobbly = 0;
  let settledRuns = 0;
  let exact500 = 0;
  const probs = theory(EXPERIMENTS.coin.ways);
  for (let seed = 1; seed <= 300; seed++) {
    const rng = makeRng(seed);
    const ten = runTrials(EXPERIMENTS.coin, 10, rng);
    if (maxGap(ten.counts, probs) >= 0.2) wobbly++;
    const all = runTrials(EXPERIMENTS.coin, 990, rng, ten.counts);
    if (settled(all.counts, probs, 1000)) settledRuns++;
    if (all.counts[0] === 500) exact500++;
  }
  assert.ok(wobbly > 60, `${wobbly} of 300 ten-toss runs were 0.3 or 0.7 or further out`);
  assert.ok(settledRuns >= 297, `${settledRuns} of 300 settled within 0.05`);
  assert.ok(exact500 < 15, `${exact500} of 300 got exactly 500`);
});

test("tasks: die, spinner, bag and two dice settle when the student keeps going", () => {
  for (const id of EXP_ORDER) {
    const exp = EXPERIMENTS[id];
    const probs = theory(exp.ways);
    for (let seed = 1; seed <= 50; seed++) {
      const rng = makeRng(seed * 31 + id.length);
      let { counts } = runTrials(exp, 1000, rng);
      // Clicking "1000" again until it settles always finishes well within the trial cap.
      let n = 1000;
      while (!(settled(counts, probs, 1000) && (id !== "sum" || leads(counts, 5)))) {
        counts = runTrials(exp, 1000, rng, counts).counts;
        n += 1000;
        assert.ok(n <= 20000, `${id} seed ${seed} never settled`);
      }
      close(freqs(counts).reduce((a, b) => a + b, 0), 1);
    }
  }
});

test("two dice: 7 usually leads after 1000 rolls", () => {
  let lead = 0;
  for (let seed = 1; seed <= 200; seed++) if (leads(runTrials(EXPERIMENTS.sum, 1000, makeRng(seed)).counts, 5)) lead++;
  assert.ok(lead > 120, `7 led in ${lead} of 200 runs`);
});

test("each mela stall can be built with the builder's controls, and the starting bag is not already right", () => {
  assert.equal(STALLS.length, 3);
  for (const s of STALLS) {
    const total = s.target.reduce((a, [n, d]) => a + n / d, 0);
    close(total, 1);
    const sols = solutions(s);
    assert.ok(sols.length >= 1, s.name);
    assert.ok(!meetsTarget(startCounts(s.kind), s.target), s.name);
    assert.ok(allowed(s.kind, startCounts(s.kind)));
  }
  assert.deepEqual(solutions(STALLS[0])[0], [1, 1, 2]);
  assert.deepEqual(solutions(STALLS[1])[0], [3, 2, 1]);
  assert.deepEqual(solutions(STALLS[2]), [[3, 2, 7]]);
  assert.ok(!allowed("spinner", [6, 4, 3]));
  assert.ok(!allowed("bag", [11, 0, 0]));
  assert.ok(!allowed("bag", [0, 0, 0]));
});

test("fractions in lowest terms", () => {
  assert.equal(fracText(2, 4), "1/2");
  assert.equal(fracText(6, 36), "1/6");
  assert.equal(fracText(0, 5), "0");
  assert.equal(fracText(4, 4), "1");
  assert.equal(fracText(7, 12), "7/12");
});

test("quiz answers", () => {
  const q = lesson.quiz;
  assert.equal(q[0].options[q[0].answer], fracText(3, 8));
  assert.equal(q[1].options[q[1].answer], fracText(EXPERIMENTS.die.ways.filter((_, i) => i + 1 > 4).length, 6));
  assert.equal(q[2].options[q[2].answer], fracText(sumWays(7), 36));
  assert.equal(Number(q[3].options[q[3].answer]), Math.round((1 - 0.7) * 10) / 10);
  assert.equal(lesson.predict.answer, 1);
  assert.equal(lesson.quiz.length, 5);
  for (const x of lesson.quiz) assert.equal(x.options.length, 4);
});

test("formulas bracket a division before a subtraction or addition", () => {
  const risky = /÷\s*[^\s()]+\s*[−+]/u;
  for (const f of [lesson.discovery.formula, ...lesson.ideas.map((i) => i.formula ?? "")]) assert.ok(!risky.test(f), f);
});

test("the traced run matches the plain run, stops at the trial cap and ends on the true frequency", () => {
  const a = runTrials(EXPERIMENTS.coin, 1500, makeRng(9));
  const b = runTraced(EXPERIMENTS.coin, 1500, makeRng(9));
  assert.deepEqual(a.counts, b.counts);
  const [n, f] = b.trace[b.trace.length - 1];
  assert.equal(n, 1500);
  close(f, b.counts[0] / 1500);
  assert.equal(b.trace.filter(([t]) => t <= 100).length, 100);
  const capped = runTraced(EXPERIMENTS.die, 5000, makeRng(3), [MAX_TRIALS - 6, 1, 1, 1, 1, 1]);
  assert.equal(capped.counts.reduce((x, y) => x + y, 0), MAX_TRIALS);
});

test("tasks at their trial counts: 600 die rolls and 500 spins or draws land near the theory", () => {
  // The task found texts say "about": each face within 0.05 of 1/6, red within 0.07 of 1/2.
  let dieOk = 0;
  let redOk = 0;
  for (let seed = 1; seed <= 200; seed++) {
    if (maxGap(runTrials(EXPERIMENTS.die, 600, makeRng(seed)).counts, theory(EXPERIMENTS.die.ways)) <= 0.05) dieOk++;
    for (const id of ["spinner", "bag"] as const) {
      const c = runTrials(EXPERIMENTS[id], 500, makeRng(seed * 7 + id.length)).counts;
      if (Math.abs(c[0] / 500 - 0.5) <= 0.07) redOk++;
    }
  }
  assert.ok(dieOk >= 196, `${dieOk} of 200`);
  assert.ok(redOk >= 396, `${redOk} of 400`);
});

test("the built bag shows its chances, and only the right counts pass", () => {
  assert.deepEqual(builtChances([1, 1, 2]), [
    [1, 4],
    [1, 4],
    [2, 4],
  ]);
  assert.ok(meetsTarget([2, 2, 4], STALLS[0].target));
  assert.ok(!meetsTarget([2, 2, 3], STALLS[0].target));
  assert.ok(meetsTarget([6, 4, 2], STALLS[1].target));
});

test("predict: 1000 fair tosses give close to 500 heads, and hardly ever exactly 500", () => {
  let near = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const h = runTrials(EXPERIMENTS.coin, 1000, makeRng(seed + 1000)).counts[0];
    if (Math.abs(h - 500) <= 60) near++;
  }
  assert.ok(near >= 198);
  assert.equal(lesson.predict.options[lesson.predict.answer], "Close to 500, but rarely exactly 500");
});
