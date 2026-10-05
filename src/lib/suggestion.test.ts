import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSuggestion, redact, toIssue } from "./suggestion";

test("redact removes contact details but keeps physics", () => {
  const out = redact("Mail me at riya.k@gmail.com or call +91 98765 43210, see www.x.com, insta @riya_k. Speed is 20 m/s for 10 s.");
  assert.ok(!out.includes("riya.k@gmail.com"));
  assert.ok(!out.includes("98765"));
  assert.ok(!out.includes("www.x.com"));
  assert.ok(!out.includes("@riya_k"));
  assert.ok(out.includes("20 m/s for 10 s"));
  assert.equal(redact("A year like 2026 and 3.14159 stay."), "A year like 2026 and 3.14159 stay.");
});

test("parseSuggestion validates and cleans", () => {
  assert.deepEqual(parseSuggestion({ role: "hacker", area: "sim", text: "x".repeat(20) }), {
    error: "Tell us if you're a student, parent or teacher.",
  });
  assert.ok("error" in parseSuggestion({ role: "student", area: "sim", text: "short" }));
  const s = parseSuggestion({ role: "student", area: "sim", classNum: 8, page: "/learn/motion", text: "  A cricket ball   bowling sim please!  " });
  assert.deepEqual(s, { role: "student", area: "sim", classNum: 8, page: "/learn/motion", text: "A cricket ball bowling sim please!" });
  const bad = parseSuggestion({ role: "teacher", area: "other", classNum: 12, page: "https://evil", text: "y".repeat(5000) });
  assert.ok(!("error" in bad));
  if (!("error" in bad)) {
    assert.equal(bad.classNum, null);
    assert.equal(bad.page, null);
    assert.equal(bad.text.length, 1000);
  }
});

test("toIssue quotes every line and labels by role and area", () => {
  const issue = toIssue({ role: "teacher", area: "lesson", classNum: 9, page: null, text: "Add sound waves" });
  assert.equal(issue.title, "[lesson] Add sound waves");
  assert.ok(issue.body.includes("> Add sound waves"));
  assert.deepEqual(issue.labels, ["suggestion", "needs-triage", "from:teacher", "area:lesson"]);
});
