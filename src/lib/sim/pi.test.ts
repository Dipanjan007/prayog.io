import assert from "node:assert/strict";
import { test } from "node:test";
import { PI_ROUNDS, lesson } from "../../content/lessons/chasing-pi";
import {
  ARYABHATA,
  SIDES,
  TERMS,
  agrees,
  archimedes,
  correction,
  fewestSides,
  fewestTerms,
  fixed,
  inner,
  madhavaPi,
  madhavaSum,
  outer,
  polyPins,
  roundAnswer,
  roundWorks,
} from "./pi";

const close = (a: number, b: number, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test("polygons trap π, and Archimedes' doubling gives the same perimeters", () => {
  close(inner(6), 3);
  close(outer(6), 2 * Math.sqrt(3));
  for (let n = SIDES.min; n <= SIDES.max; n++) assert.ok(inner(n) < Math.PI && Math.PI < outer(n), `${n}`);
  for (let k = 0; k <= 6; k++) {
    const a = archimedes(k);
    close(a.inner, inner(a.n), 1e-9);
    close(a.outer, outer(a.n), 1e-9);
  }
  assert.equal(archimedes(4).n, 96);
  assert.equal(fixed(inner(96), 4), "3.1410");
  assert.equal(fixed(outer(96), 4), "3.1427");
  assert.equal(fixed(outer(6), 3), "3.464");
  // Each doubling cuts the gap to about a quarter.
  for (let k = 0; k < 6; k++) {
    const r = (outer(6 * 2 ** (k + 1)) - inner(6 * 2 ** (k + 1))) / (outer(6 * 2 ** k) - inner(6 * 2 ** k));
    assert.ok(r > 0.2 && r < 0.27, `${r}`);
  }
  // Archimedes' published bounds hold.
  assert.ok(3 + 10 / 71 < inner(96) && outer(96) < 3 + 1 / 7);
});

test("Madhava's series and his end correction", () => {
  assert.deepEqual([1, 2, 3, 4].map((n) => fixed(madhavaPi(n), 3)), ["4.000", "2.667", "3.467", "2.895"]);
  close(madhavaSum(4), 76 / 105);
  assert.equal(fixed(madhavaPi(100), 4), "3.1316");
  assert.equal(correction(6), 6 / 145);
  assert.ok(correction(5) < 0);
  assert.equal(fixed(madhavaPi(6, true), 5), "3.14156");
  assert.equal(fixed((madhavaSum(6) + correction(6)), 5), "0.78539");
  assert.equal(fewestTerms(4, true), 6);
  for (let n = 6; n <= TERMS.max; n++) assert.ok(agrees(madhavaPi(n, true), 4), `${n}`);
  for (let n = 1; n <= 100; n++) assert.ok(!agrees(madhavaPi(n), 2), `${n}`);
  for (let n = 1; n <= 30; n++) assert.ok(Math.abs(madhavaPi(n, true) - Math.PI) < Math.abs(madhavaPi(n) - Math.PI));
});

test("Aryabhata's 3.1416", () => {
  assert.equal(ARYABHATA, 3.1416);
  assert.equal((100 + 4) * 8 + 62000, 62832);
  assert.ok(agrees(ARYABHATA, 4));
  assert.equal(fixed(Math.PI, 4), "3.1416");
});

test("challenge rounds have one fewest answer the sim can reach", () => {
  assert.equal(PI_ROUNDS.length, 3);
  assert.deepEqual(PI_ROUNDS.map(roundAnswer), [56, 152, 13]);
  for (const r of PI_ROUNDS) {
    const n = roundAnswer(r);
    const lim = r.kind === "poly" ? SIDES : TERMS;
    assert.ok(n >= lim.min && n <= lim.max, r.name);
    assert.ok(roundWorks(n, r));
    for (let m = lim.min; m < n; m++) assert.ok(!roundWorks(m, r), `${r.name}: ${m}`);
  }
  assert.ok(polyPins(56, 2) && !polyPins(55, 2));
  assert.equal(fewestSides(2), 56);
  // The third round really needs the correction to fit in the sim.
  assert.ok(fewestTerms(6, false) > TERMS.max);
});

test("lesson numbers and quiz answers", () => {
  const q = lesson.quiz;
  assert.equal(q.length, 5);
  for (const x of q) assert.equal(x.options.length, 4);
  assert.equal(q[0].options[q[0].answer], String(ARYABHATA));
  close(inner(6) * 10, 30, 1e-9);
  assert.equal(q[1].options[q[1].answer], "30 cm");
  assert.equal(q[2].options[q[2].answer], fixed(madhavaPi(4), 3));
  assert.equal(q[4].options[q[4].answer], String(archimedes(4).n));
  assert.equal(lesson.predict.answer, 1);
  const risky = /÷\s*[^\s()]+\s*[−+]/u;
  for (const f of [lesson.discovery.formula, ...lesson.ideas.map((i) => i.formula ?? "")]) assert.ok(!risky.test(f), f);
});
