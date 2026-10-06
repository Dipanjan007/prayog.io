import assert from "node:assert/strict";
import { test } from "node:test";
import { OLY_PROBLEMS, OLY_SETS, problemsInSet } from "@/content/olympiad";
import { planOutcome, simFamily } from "./scene";
import { fmt, isCorrect, parseAnswer, simValue, starsFor, xpFor } from "./score";

/** Hand-worked answers (see each problem's solution). The code must agree to 0.5%. */
const HAND: Record<string, number> = {
  "hooghly-ferry": 36.87,
  "boundary-fielder": 26.6,
  "holi-tram": 14.89,
  "site-hoist": 4.289,
  "tea-ramp": 0.4861,
  "dock-crate": 7.648,
  "ghat-hairpin": 14.31,
  "coaster-loop": 16.5,
  "spring-loop": 12.32,
  "gaganyaan-drift": 4.0,
  "air-rifle-pendulum": 195.5,
  "crossing-crash": 8.083,
};

test("there are at least 12 problems in at least 4 sets, each set with all three levels", () => {
  assert.ok(OLY_PROBLEMS.length >= 12);
  assert.ok(OLY_SETS.length >= 4);
  for (const s of OLY_SETS) {
    const levels = problemsInSet(s.id).map((p) => p.level);
    assert.deepEqual(levels, ["warm-up", "standard", "olympiad"], s.id);
  }
  assert.equal(new Set(OLY_PROBLEMS.map((p) => p.id)).size, OLY_PROBLEMS.length, "ids are unique");
});

test("all four sims are used", () => {
  const fams = new Set(OLY_PROBLEMS.map((p) => simFamily(p.scene(p.answer))));
  assert.deepEqual([...fams].sort(), ["collision", "incline", "projectile", "track"]);
});

for (const p of OLY_PROBLEMS) {
  test(`${p.id}: answer matches the hand-worked value`, () => {
    assert.ok(Number.isFinite(p.answer), "finite");
    assert.ok(HAND[p.id] !== undefined, "hand value listed");
    assert.ok(Math.abs(p.answer - HAND[p.id]) <= 0.005 * HAND[p.id], `${p.answer} vs ${HAND[p.id]}`);
    assert.ok(p.answer > p.range[0] && p.answer < p.range[1], "answer is inside the allowed range");
    assert.equal(p.hints.length, 2);
    assert.ok(p.solution.length >= 3);
  });

  test(`${p.id}: the sim shows success for the right answer and failure 10% either side`, () => {
    assert.equal(planOutcome(p.scene(p.answer)).outcome.ok, true, planOutcome(p.scene(p.answer)).outcome.text);
    for (const k of [0.9, 1.1]) {
      const o = planOutcome(p.scene(p.answer * k)).outcome;
      assert.equal(o.ok, false, `×${k}: ${o.text}`);
    }
  });

  test(`${p.id}: any answer within ±2% plays the exact answer in the sim`, () => {
    for (const k of [0.981, 1.019]) {
      const typed = p.answer * k;
      assert.equal(isCorrect(typed, p.answer), true);
      assert.equal(planOutcome(p.scene(simValue(typed, p.answer))).outcome.ok, true);
    }
    assert.equal(isCorrect(p.answer * 1.03, p.answer), false);
  });

  test(`${p.id}: student text has no em-dashes`, () => {
    const text = [p.title, ...p.story, ...p.given, p.ask, ...p.hints, p.simNote, ...p.solution.flatMap((s) => [s.text, s.math ?? ""])].join(" ");
    assert.ok(!text.includes("—"), "em-dash found");
  });
}

test("scoring: parse, stars and XP", () => {
  assert.equal(parseAnswer(" 14,9 "), 14.9);
  assert.equal(parseAnswer("+0.486"), 0.486);
  assert.equal(parseAnswer(".5"), 0.5);
  assert.equal(parseAnswer("12 m"), null);
  assert.equal(parseAnswer(""), null);
  assert.equal(starsFor(0, false), 3);
  assert.equal(starsFor(1, false), 2);
  assert.equal(starsFor(2, false), 1);
  assert.equal(starsFor(0, true), 0);
  assert.equal(xpFor("olympiad", 3), 105);
  assert.equal(fmt(14.8924), "14.9");
});
