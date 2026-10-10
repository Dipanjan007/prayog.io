import assert from "node:assert/strict";
import { test } from "node:test";
import { TWIN_ROUNDS, lesson } from "../../content/lessons/twin-triangles";
import { ANG, CLUES, SIDE, START, clueFrom, congruent, judge, measure, ruleAllows, solve, triFromSAS, type Clue } from "./congruence";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);
const range = (r: { min: number; max: number; step: number }) => {
  const out: number[] = [];
  for (let v = r.min; v <= r.max + 1e-9; v += r.step) out.push(Math.round(v * 1000) / 1000);
  return out;
};

test("every triangle a clue builds really has the clue's parts", () => {
  const check = (clue: Clue, v: Record<string, number>) => {
    for (const t of solve(clue, v).tris) {
      const m = measure(t);
      for (const [k, want] of Object.entries(v)) close(m[k as keyof typeof m], want, 1e-6);
      if (clue === "RHS") close(m.C, 90, 1e-6);
    }
  };
  for (const a of range(SIDE)) for (const b of range(SIDE)) for (const c of range(SIDE)) check("SSS", { AB: c, BC: a, CA: b });
  for (const s of range(SIDE)) for (const ang of range(ANG)) check("SAS", { AB: s, A: ang, CA: 13 - s });
  for (const B of range(ANG)) for (const C of range(ANG)) check("ASA", { B, BC: 7, C });
  for (const h of range(SIDE)) for (const a of range(SIDE)) check("RHS", { AB: h, BC: a });
  for (const c of range(SIDE)) for (const a of range(SIDE)) for (const A of range(ANG)) check("SSA", { AB: c, BC: a, A });
  for (const A of range(ANG)) for (const B of range(ANG)) check("AAA", { A, B });
});

test("SSS, SAS, ASA and RHS never give two different triangles", () => {
  for (const a of range(SIDE)) for (const b of range(SIDE)) for (const c of range(SIDE)) assert.ok(solve("SSS", { AB: c, BC: a, CA: b }).tris.length <= 1);
  for (const B of range(ANG)) for (const C of range(ANG)) assert.ok(solve("ASA", { B, BC: 5, C }).tris.length <= 1);
});

test("SSS fails when two sides are not longer than the third", () => {
  assert.equal(solve("SSS", START.SSS).kind, "none");
  assert.equal(solve("SSS", { AB: 7, BC: 3, CA: 4 }).kind, "none");
  assert.equal(solve("SSS", { AB: 6, BC: 3, CA: 4 }).kind, "one");
});

test("the starting values: SSS has no triangle, the others fit as expected", () => {
  assert.equal(solve("SAS", START.SAS).kind, "one");
  assert.equal(solve("ASA", START.ASA).kind, "one");
  assert.equal(solve("RHS", START.RHS).kind, "one");
  assert.equal(solve("SSA", START.SSA).kind, "one");
  assert.equal(solve("AAA", START.AAA).kind, "many");
});

test("SSA: none, one or two triangles", () => {
  assert.equal(solve("SSA", { AB: 10, A: 30, BC: 4 }).kind, "none");
  assert.equal(solve("SSA", { AB: 10, A: 30, BC: 5 }).kind, "one");
  const two = solve("SSA", { AB: 10, A: 30, BC: 6 });
  assert.equal(two.kind, "two");
  assert.ok(!congruent(two.tris[0], two.tris[1]));
  // Quiz 4: about 5.3 cm and 12 cm from A.
  assert.equal(measure(two.tris[0]).CA.toFixed(1), "5.3");
  assert.equal(Math.round(measure(two.tris[1]).CA), 12);
  // Two triangles can be reached on the sliders: AB = 10, ∠A = 30°, BC from 6 to 9.
  for (const a of [6, 7, 8, 9]) assert.equal(solve("SSA", { AB: 10, A: 30, BC: a }).kind, "two");
  assert.ok(range(ANG).includes(30));
});

test("AAA gives the same shape in many sizes; the third angle is fixed", () => {
  const f = solve("AAA", { A: 50, B: 60 });
  assert.equal(f.kind, "many");
  for (const t of f.tris) close(measure(t).C, 70, 1e-6);
  assert.ok(!congruent(f.tris[0], f.tris[1]));
  assert.equal(solve("AAA", { A: 100, B: 80 }).kind, "none");
});

test("a clue taken from a triangle rebuilds a twin of it", () => {
  const t = triFromSAS(9, 70, 6);
  for (const c of CLUES) {
    const v = clueFrom(t, c.id);
    if (c.id === "RHS") {
      assert.equal(v, null);
      continue;
    }
    const f = solve(c.id, v!);
    if (c.id === "AAA") {
      // Same angles, but none of the drawn sizes is this triangle: AAA is not enough.
      for (const s of f.tris) close(measure(s).B, measure(t).B, 1e-6);
      assert.ok(!f.tris.some((s) => congruent(s, t)));
      continue;
    }
    assert.ok(f.tris.some((s) => congruent(s, t)), c.id);
  }
});

test("each challenge round has exactly one clue that works", () => {
  const want: Clue[] = ["ASA", "SSS", "SAS"];
  TWIN_ROUNDS.forEach((round, i) => {
    const ok = CLUES.filter((c) => judge(round, c.id).verdict === "ok").map((c) => c.id);
    assert.deepEqual(ok, [want[i]], round.name);
  });
  // The traps behave as the briefs say.
  assert.equal(judge(TWIN_ROUNDS[0], "AAA").verdict, "many");
  assert.equal(judge(TWIN_ROUNDS[1], "RHS").verdict, "rule");
  close(measure(TWIN_ROUNDS[1].target).C, 90);
  assert.equal(judge(TWIN_ROUNDS[2], "SSA").verdict, "two");
  assert.equal(judge(TWIN_ROUNDS[2], "RHS").verdict, "unusable");
  assert.ok(ruleAllows("twoSidesOneAngle", "RHS"));
});

test("predict and quiz answers", () => {
  // Predict: the angles 50°, 60°, 70° fit many sizes.
  assert.equal(solve("AAA", { A: 50, B: 60 }).kind, "many");
  assert.equal(lesson.predict.answer, 1);
  const q = lesson.quiz;
  assert.equal(q[0].options[q[0].answer], "SSS");
  assert.equal(q[1].options[q[1].answer], "SAS");
  assert.equal(q[3].options[q[3].answer], "Two");
  assert.equal(solve("SSA", { AB: 10, A: 30, BC: 6 }).kind, "two");
  assert.equal(q[4].options[q[4].answer], "Yes, by RHS");
  assert.equal(solve("RHS", { AB: 30, BC: 18 }).kind, "one");
});
