import { test } from "node:test";
import assert from "node:assert/strict";
import { LESSONS } from "../content/lessons";
import { OLY_SETS } from "../content/olympiad/sets";

test("every lab explains the symbols in its formulas", () => {
  for (const l of LESSONS) {
    assert.ok(l.symbols.length > 0, `${l.id} has no symbol notes`);
    for (const s of l.symbols) assert.ok(s.sym && s.meaning, `${l.id} has an empty symbol note`);
  }
});

test("every Olympiad set explains its symbols", () => {
  for (const s of OLY_SETS) assert.ok(s.symbols.length > 0, `${s.id} has no symbol notes`);
});

test("formulas bracket a division before a subtraction or addition", () => {
  // "a ÷ b − c" reads two ways to a student; write "(a ÷ b) − c".
  const risky = /÷\s*[^\s()]+\s*[−+]/u;
  for (const l of LESSONS) {
    const formulas = [l.discovery.formula, ...l.ideas.map((i) => i.formula ?? "")];
    for (const f of formulas) assert.ok(!risky.test(f), `${l.id}: add brackets to "${f}"`);
  }
});
