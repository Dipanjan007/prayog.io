import assert from "node:assert/strict";
import { test } from "node:test";
import { GOLDEN_ROUNDS, lesson } from "../../content/lessons/golden-ratio";
import {
  ARMS,
  BEATS,
  GOLDEN_ANGLE,
  GOLDEN_SETTING,
  MAX_TERMS,
  PHI,
  SEEDS,
  START,
  agreesWithPhi,
  armAnswers,
  armTwist,
  fib,
  isFib,
  isGoldenSetting,
  lastRatio,
  listRhythms,
  packing,
  rhythms,
  roundAnswer,
  sequence,
  sliderAngles,
  smoothArms,
  spokes,
  termsToPhi,
  turnFor,
} from "./golden";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test("φ and the golden angle", () => {
  close(PHI, 1.6180339887, 1e-9);
  close(PHI * PHI, PHI + 1);
  close(GOLDEN_ANGLE, 137.5077640500, 1e-9);
  close(360 - 360 / PHI, GOLDEN_ANGLE);
  assert.equal(GOLDEN_SETTING, 137.5);
  assert.ok(isGoldenSetting(137.5));
  assert.ok(!isGoldenSetting(137.4));
});

test("Virahanka-Fibonacci numbers add the two before", () => {
  assert.deepEqual(fib(11), [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89]);
  assert.deepEqual(sequence(2, 7, 5), [2, 7, 9, 16, 25]);
  for (const n of [1, 2, 3, 5, 8, 13, 21, 34, 55]) assert.ok(isFib(n), `${n}`);
  for (const n of [4, 6, 10, 12, 30, 35]) assert.ok(!isFib(n), `${n}`);
});

test("ratios of neighbours settle on 1.618 from 1, 1 at 55 ÷ 34, and stay there", () => {
  assert.equal(termsToPhi(1, 1), 10);
  assert.equal(fib(10).slice(-2).join(","), "34,55");
  assert.ok(!agreesWithPhi(lastRatio(fib(9))));
  for (let n = 10; n <= MAX_TERMS; n++) assert.ok(agreesWithPhi(lastRatio(fib(n))), `${n}`);
  close(lastRatio(fib(3)), 2);
  close(lastRatio(fib(4)), 1.5);
});

test("every pair of start numbers the sim allows reaches 1.618 within the term limit", () => {
  for (let a = START.min; a <= START.max; a++)
    for (let b = START.min; b <= START.max; b++) {
      const n = termsToPhi(a, b);
      assert.ok(n <= MAX_TERMS, `${a}, ${b} needs ${n}`);
      for (let m = n; m <= MAX_TERMS; m++) assert.ok(agreesWithPhi(lastRatio(sequence(a, b, m))), `${a}, ${b} at ${m}`);
    }
});

test("rhythms of short and long beats are counted by the same numbers", () => {
  assert.deepEqual(listRhythms(3).sort(), ["LS", "SL", "SSS"].sort());
  for (let n = BEATS.min; n <= BEATS.max; n++) assert.equal(rhythms(n), fib(n + 1)[n], `${n} beats`);
  assert.deepEqual([4, 5, 6, 7].map(rhythms), [5, 8, 13, 21]);
  for (const r of listRhythms(6)) assert.equal([...r].reduce((s, c) => s + (c === "S" ? 1 : 2), 0), 6);
});

test("simple fractions of a turn make spokes; the golden angle does not", () => {
  assert.equal(spokes(90), 4);
  assert.equal(spokes(120), 3);
  assert.equal(spokes(144), 5);
  assert.equal(spokes(180), 2);
  assert.equal(spokes(135), 8);
  assert.equal(spokes(137.5), null);
  assert.equal(spokes(130), null);
});

test("137.5° on the dial gives the best packing score of any dial angle", () => {
  const angles = sliderAngles();
  assert.equal(angles.length, 401);
  assert.equal(turnFor(137.5), GOLDEN_ANGLE);
  assert.equal(turnFor(137.4), 137.4);
  for (const n of [SEEDS.min, 200, 300, 400, SEEDS.max]) {
    const best = packing(n, turnFor(GOLDEN_SETTING));
    for (const a of angles) if (!isGoldenSetting(a)) assert.ok(packing(n, turnFor(a)) < best, `${n} seeds: ${a}° packs ${packing(n, a)} vs ${best}`);
  }
  for (const a of [120, 135, 144, 150]) assert.ok(packing(300, a) < 30, `${a}°`);
});

test("smooth spiral arms at the golden angle come in Virahanka numbers", () => {
  const smooth: number[] = [];
  for (let k = ARMS.min; k <= ARMS.max; k++) if (smoothArms(k, turnFor(GOLDEN_SETTING))) smooth.push(k);
  assert.deepEqual(smooth, [13, 21, 34]);
  assert.ok(smoothArms(3, 120) && smoothArms(12, 120), "spokes count as straight arms");
  assert.ok(!smoothArms(4, 120) && !smoothArms(1, 137.5));
  close(armTwist(21, 137.5), 7.5);
  close(armTwist(13, 137.5), -12.5);
});

test("challenge rounds are solvable with the sim's controls, with exactly one answer", () => {
  assert.equal(GOLDEN_ROUNDS.length, 3);
  for (const r of GOLDEN_ROUNDS) {
    if (r.kind === "rhythm") {
      assert.ok(r.options.includes(roundAnswer(r)));
      assert.equal(new Set(r.options).size, r.options.length);
      assert.ok(r.beats > 6, "the drum shows up to 6 beats, so the answer must be worked out");
      assert.equal(roundAnswer(r), rhythms(r.beats - 1) + rhythms(r.beats - 2));
    } else if (r.kind === "pack") {
      assert.ok(r.seeds >= SEEDS.min && r.seeds <= SEEDS.max);
      assert.ok(sliderAngles().includes(roundAnswer(r)));
    } else {
      assert.ok(r.min >= ARMS.min && r.max <= ARMS.max);
      assert.equal(armAnswers(r).length, 1, r.name);
      assert.ok(isFib(roundAnswer(r)));
    }
  }
});

test("formulas bracket a division before + or −, and every quiz has 4 options", () => {
  const risky = /÷\s*[^\s()]+\s*[−+]/u;
  for (const f of [lesson.discovery.formula, ...lesson.ideas.map((i) => i.formula ?? "")]) assert.ok(!risky.test(f), f);
  for (const q of lesson.quiz) assert.equal(q.options.length, 4);
  assert.equal(lesson.predict.options.length, 3);
});

test("lesson numbers and quiz answers", () => {
  const q = lesson.quiz;
  assert.equal(q.length, 5);
  assert.equal(q[0].options[q[0].answer], String(21 + 34));
  assert.equal(q[1].options[q[1].answer], (89 / 55).toFixed(3));
  assert.equal(q[2].options[q[2].answer], String(rhythms(8)));
  assert.equal(rhythms(8), rhythms(7) + rhythms(6));
  assert.ok(q[3].options[q[3].answer].startsWith(`${spokes(90)} straight spokes`));
  assert.equal(q[4].options[q[4].answer], "21");
  assert.equal(lesson.predict.answer, 1);
  assert.equal((360 / 2.618).toFixed(1), "137.5");
  assert.equal((34 / 21).toFixed(3), "1.619");
  assert.equal((21 / 13).toFixed(3), "1.615");
  assert.equal((55 / 34).toFixed(3), "1.618");
});
