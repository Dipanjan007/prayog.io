import assert from "node:assert/strict";
import { test } from "node:test";
import { SUBJECTS, subjectFor, tabActive } from "./subjects";

test("each page sits under the right subject", () => {
  assert.equal(subjectFor("/learn")?.id, "physics");
  assert.equal(subjectFor("/learn/motion")?.id, "physics");
  assert.equal(subjectFor("/outliers/gravity")?.id, "physics");
  assert.equal(subjectFor("/olympiad/newton/x")?.id, "physics");
  assert.equal(subjectFor("/maths")?.id, "maths");
  assert.equal(subjectFor("/maths/pythagoras")?.id, "maths");
  for (const p of ["/", "/me", "/plans", "/join", "/learning", "/mathsx"]) assert.equal(subjectFor(p), null, p);
});

test("tabs match their own pages only", () => {
  assert.ok(tabActive("/olympiad/optics", "/olympiad"));
  assert.ok(!tabActive("/outliers", "/learn"));
  assert.ok(SUBJECTS.every((s) => s.tabs.length > 0));
});
