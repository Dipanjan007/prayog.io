import assert from "node:assert/strict";
import { test } from "node:test";
import { PUZZLES, ROUNDS, WRITE_PICS, lesson } from "../../content/lessons/equations";
import {
  MAX_AMOUNT,
  apply,
  balanced,
  canApply,
  checkText,
  equationText,
  legalMoves,
  minMoves,
  sameEquation,
  sideText,
  solveLinear,
  solvedValue,
  takeOne,
  tilt,
  unknownOf,
  type Scale,
} from "./balance";

const sc = (lb: number, lm: number, rb: number, rm: number): Scale => ({ left: { bags: lb, marbles: lm }, right: { bags: rb, marbles: rm } });

test("equation text reads like the book", () => {
  assert.equal(equationText(sc(3, 2, 0, 14)), "3x + 2 = 14");
  assert.equal(equationText(sc(1, 0, 0, 7)), "x = 7");
  assert.equal(equationText(sc(5, 1, 2, 10)), "5x + 1 = 2x + 10");
  assert.equal(sideText({ bags: 0, marbles: 0 }), "0");
});

test("doing the same thing to both pans keeps the beam level", () => {
  const s = sc(5, 1, 2, 10);
  assert.ok(balanced(s, 3));
  const a = apply(s, { kind: "bags", k: 2 });
  assert.equal(equationText(a), "3x + 1 = 10");
  const b = apply(a, { kind: "marbles", k: 1 });
  assert.equal(equationText(b), "3x = 9");
  const c = apply(b, { kind: "share", k: 3 });
  assert.equal(equationText(c), "x = 3");
  for (const t of [a, b, c]) assert.ok(balanced(t, 3));
  assert.equal(solvedValue(c), 3);
  assert.equal(solvedValue(b), null);
});

test("one pan only tips the scale", () => {
  const s = takeOne(sc(1, 5, 0, 12), "left")!;
  assert.ok(tilt(s, 7) < 0);
  assert.equal(takeOne(sc(1, 0, 0, 7), "left"), null);
});

test("moves that cannot be done with real marbles are refused", () => {
  assert.ok(!canApply(sc(3, 2, 0, 14), { kind: "share", k: 3 })); // 2 and 14 do not split into 3
  assert.ok(!canApply(sc(3, 2, 0, 14), { kind: "bags", k: 1 })); // right pan has no bag
  assert.ok(!canApply(sc(3, 2, 0, 14), { kind: "marbles", k: 3 }));
  assert.ok(!canApply(sc(2, 4, 0, 10), { kind: "share", k: 1 }));
  assert.ok(canApply(sc(3, 0, 0, 12), { kind: "share", k: 3 }));
});

test("solveLinear is Brahmagupta's rule x = (d − b) ÷ (a − c)", () => {
  assert.equal(solveLinear(5, 1, 2, 10), 3);
  assert.equal(solveLinear(2, 9, 4, 3), 3);
  assert.ok(Number.isNaN(solveLinear(2, 1, 2, 5)));
});

test("every free puzzle and picture is level at its x and can be solved", () => {
  for (const p of [...PUZZLES, ...WRITE_PICS]) {
    assert.ok(balanced(p.scale, p.x), p.name);
    assert.equal(unknownOf(p.scale), p.x, p.name);
    assert.ok(Number.isFinite(minMoves(p.scale)), p.name);
  }
  // Mission puzzles: Balance 1 needs only marbles off, Balance 2 needs a share, Balance 3 has bags on both pans.
  assert.equal(minMoves(PUZZLES[0].scale), 1);
  assert.ok(legalMoves(apply(PUZZLES[1].scale, { kind: "marbles", k: 2 })).some((m) => m.kind === "share" && m.k === 3));
  assert.ok(PUZZLES[2].scale.left.bags > 0 && PUZZLES[2].scale.right.bags > 0);
});

test("solving a puzzle always reveals its x", () => {
  // Walk every reachable state; wherever a lone bag is left, its marbles equal x.
  for (const p of [...PUZZLES, ...ROUNDS]) {
    const stack = [p.scale];
    const seen = new Set<string>();
    while (stack.length) {
      const s = stack.pop()!;
      const k = JSON.stringify(s);
      if (seen.has(k)) continue;
      seen.add(k);
      const v = solvedValue(s);
      if (v !== null) assert.equal(v, p.x, p.name);
      for (const m of legalMoves(s)) stack.push(apply(s, m));
    }
  }
});

test("every challenge round is level, solvable within the amount control, and its par is the true minimum", () => {
  assert.equal(ROUNDS.length, 3);
  for (const r of ROUNDS) {
    assert.ok(balanced(r.scale, r.x), r.name);
    assert.equal(minMoves(r.scale), r.par, r.name);
    assert.ok(Math.max(r.scale.left.marbles, r.scale.right.marbles, r.scale.left.bags, r.scale.right.bags) <= MAX_AMOUNT);
    assert.ok(r.brief.includes(`Par: ${r.par} moves`), r.name);
  }
  // A par solution for each, step by step.
  const s1 = apply(apply(ROUNDS[0].scale, { kind: "marbles", k: 4 }), { kind: "share", k: 3 });
  assert.equal(solvedValue(s1), 5);
  const s2 = apply(apply(apply(ROUNDS[1].scale, { kind: "bags", k: 2 }), { kind: "marbles", k: 6 }), { kind: "share", k: 2 });
  assert.equal(solvedValue(s2), 4);
  const s3 = apply(apply(apply(ROUNDS[2].scale, { kind: "share", k: 3 }), { kind: "bags", k: 1 }), { kind: "marbles", k: 3 });
  assert.equal(solvedValue(s3), 4);
});

test("written equations count either way round", () => {
  const s = WRITE_PICS[0].scale;
  assert.ok(sameEquation(s, sc(2, 3, 0, 11)));
  assert.ok(sameEquation(s, sc(0, 11, 2, 3)));
  assert.ok(!sameEquation(s, sc(2, 3, 0, 12)));
});

test("predict and quiz answers are right", () => {
  // Predict: x + 3 = 10. Taking 3 off both pans keeps it level and leaves x = 7.
  const p = apply(sc(1, 3, 0, 10), { kind: "marbles", k: 3 });
  assert.equal(solvedValue(p), 7);
  assert.equal(lesson.predict.answer, 1);
  const q = lesson.quiz;
  assert.equal(q[0].options[q[0].answer], `${solveLinear(1, 9, 0, 23)}`);
  assert.equal(q[1].options[q[1].answer], `${solveLinear(4, 0, 0, 28)}`);
  assert.equal(q[2].options[q[2].answer], `x = ${solveLinear(3, 5, 0, 20)}`);
  assert.equal(q[3].options[q[3].answer], "3x + 10 = 46");
  assert.equal(solveLinear(3, 10, 0, 46), 12);
  assert.equal(q[4].options[q[4].answer], `x = ${solveLinear(5, 2, 2, 17)}`);
  assert.equal(5 * 5 + 2, 2 * 5 + 17);
});

test("the check puts x back with the multiplication done first", () => {
  assert.equal(checkText(sc(3, 2, 0, 14), 4), "(3 × 4) + 2 = 14");
  assert.equal(checkText(sc(5, 1, 2, 10), 3), "(5 × 3) + 1 = 16 and (2 × 3) + 10 = 16");
  assert.equal(checkText(sc(1, 5, 0, 12), 7), "7 + 5 = 12");
  assert.equal(checkText(sc(3, 2, 0, 14), 5), "(3 × 5) + 2 = 17, not 14");
});

test("lesson shape and formula style follow the house rules", () => {
  assert.equal(lesson.subject, "maths");
  assert.ok(lesson.tasks.length >= 3 && lesson.tasks.length <= 5);
  assert.equal(lesson.predict.options.length, 3);
  assert.equal(lesson.quiz.length, 5);
  for (const q of lesson.quiz) assert.equal(q.options.length, 4, q.q);
  assert.ok(lesson.symbols.length > 0);
  const risky = /÷\s*[^\s()]+\s*[−+]/u;
  for (const f of [lesson.discovery.formula, ...lesson.ideas.map((i) => i.formula ?? "")]) assert.ok(!risky.test(f), f);
  // Real minus signs only in student-facing text.
  assert.ok(!/\d\s-\s\d/.test(JSON.stringify(lesson)));
});
