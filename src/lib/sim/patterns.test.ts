import assert from "node:assert/strict";
import { test } from "node:test";
import { PATTERN_ROUNDS, lesson } from "../../content/lessons/letter-numbers";
import {
  BORDER_EXPRS,
  FREE_PATTERNS,
  MAX_COEFF,
  MAX_STEP,
  PATTERNS,
  countOf,
  groupTotal,
  newSticks,
  ruleFits,
  ruleText,
  ruleValue,
  ruleWorking,
  sameAsBorder,
  tileCounts,
  type PatternId,
} from "./patterns";

const ALL = Object.keys(PATTERNS) as PatternId[];

test("the count read off every drawing follows the pattern's rule", () => {
  for (const id of ALL) {
    const { a, b } = PATTERNS[id];
    for (let n = 1; n <= MAX_STEP; n++) assert.equal(countOf(id, n), ruleValue(a, b, n), `${id} step ${n}`);
    assert.ok(ruleFits(id, a, b), id);
  }
  // Counts as students see them.
  assert.deepEqual([1, 2, 3, 4].map((n) => countOf("squares", n)), [4, 7, 10, 13]);
  assert.deepEqual([1, 2, 3].map((n) => countOf("triangles", n)), [3, 5, 7]);
  assert.deepEqual([1, 2, 3].map((n) => countOf("stairs", n)), [4, 8, 12]);
  assert.deepEqual([1, 2, 3].map((n) => countOf("border", n)), [8, 12, 16]);
  assert.deepEqual([1, 2].map((n) => countOf("houses", n)), [6, 11]);
  assert.deepEqual([1, 2].map((n) => countOf("fence", n)), [5, 9]);
  assert.deepEqual([1, 2].map((n) => countOf("path", n)), [8, 10]);
});

test("only the true rule fits; a rule right for step 1 alone is refused", () => {
  assert.ok(!ruleFits("squares", 4, 0)); // 4 at step 1, but 8 at step 2
  assert.ok(!ruleFits("squares", 3, 0));
  assert.ok(!ruleFits("border", 4, 0));
  assert.ok(!ruleFits("border", 8, 0));
});

test("rules are written and worked the book's way, multiplication first", () => {
  assert.equal(ruleText(3, 1), "3n + 1");
  assert.equal(ruleText(4, 0), "4n");
  assert.equal(ruleText(1, 2), "n + 2");
  assert.equal(ruleText(0, 6), "6");
  assert.equal(ruleWorking(3, 1, 100), "(3 × 100) + 1 = 301");
  assert.equal(ruleWorking(4, 0, 100), "4 × 100 = 400");
  assert.equal(ruleWorking(1, 2, 100), "100 + 2 = 102");
});

test("new matchsticks in each squares step are exactly 3", () => {
  for (let n = 2; n <= MAX_STEP; n++) assert.equal(newSticks("squares", n).size, 3);
  for (let n = 2; n <= MAX_STEP; n++) assert.equal(newSticks("triangles", n).size, 2);
  for (let n = 2; n <= MAX_STEP; n++) assert.equal(newSticks("houses", n).size, 5);
});

test("each border expression's groups add up to its value, and same means same for every n", () => {
  const same = BORDER_EXPRS.map(sameAsBorder);
  assert.deepEqual(same, [true, true, true, true, false, false]);
  for (const e of BORDER_EXPRS)
    for (let n = 1; n <= MAX_STEP; n++) {
      assert.equal(groupTotal(e, n), e.value(n), `${e.text} at ${n}`);
      // Groups stay on the border.
      for (const k of tileCounts(e, n).keys()) {
        const [c, r] = k.split(",").map(Number);
        assert.ok(c === 0 || r === 0 || c === n + 1 || r === n + 1, `${e.text} tile ${k}`);
      }
    }
  // The equal ones count every tile exactly once (or twice with the 4 taken off); 4n misses the corners.
  for (let n = 1; n <= MAX_STEP; n++) {
    const once = (i: number) => [...tileCounts(BORDER_EXPRS[i], n).values()].every((t) => t === 1) && tileCounts(BORDER_EXPRS[i], n).size === 4 * n + 4;
    assert.ok(once(0) && once(1) && once(2));
    assert.equal(tileCounts(BORDER_EXPRS[4], n).size, 4 * n);
  }
});

test("free patterns and challenge rounds can be solved with the rule controls", () => {
  assert.equal(PATTERN_ROUNDS.length, 3);
  for (const id of [...FREE_PATTERNS, ...PATTERN_ROUNDS.map((r) => r.pattern)]) {
    const { a, b } = PATTERNS[id];
    assert.ok(a >= 0 && a <= MAX_COEFF && b >= 0 && b <= MAX_COEFF, id);
    // Exactly one rule on the controls fits.
    let fits = 0;
    for (let x = 0; x <= MAX_COEFF; x++) for (let y = 0; y <= MAX_COEFF; y++) if (ruleFits(id, x, y)) fits++;
    assert.equal(fits, 1, id);
  }
  // The challenge uses patterns not in free play.
  for (const r of PATTERN_ROUNDS) assert.ok(!FREE_PATTERNS.includes(r.pattern), r.name);
  assert.equal(new Set(PATTERN_ROUNDS.map((r) => r.pattern)).size, 3);
});

test("predict, missions and quiz answers are right", () => {
  assert.equal(lesson.predict.options[lesson.predict.answer], `${countOf("squares", 10)}`);
  assert.equal(countOf("squares", 1), 4);
  assert.equal(ruleWorking(3, 1, 100), "(3 × 100) + 1 = 301");
  const q = lesson.quiz;
  assert.equal(q[0].options[q[0].answer], `${ruleValue(3, 1, 50)}`);
  // 5, 8, 11, 14 → 3n + 2
  assert.deepEqual([1, 2, 3, 4].map((n) => ruleValue(3, 2, n)), [5, 8, 11, 14]);
  assert.equal(q[1].options[q[1].answer], ruleText(3, 2));
  assert.equal(q[2].options[q[2].answer], "15k + 25");
  assert.equal(15 * 6 + 25, 115);
  assert.equal(q[3].options[q[3].answer], "4n + 4");
  for (let n = 0; n <= 20; n++) {
    assert.equal(4 * (n + 1), 4 * n + 4);
    assert.equal(2 * (n + 3) - (2 * n + 3), 3);
  }
  assert.equal(q[4].answer, 1);
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
  assert.ok(!/\d\s-\s\d/.test(JSON.stringify(lesson)));
});
