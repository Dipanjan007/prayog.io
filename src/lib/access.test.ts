import assert from "node:assert/strict";
import { test } from "node:test";
import { bestTier, contentKey, FREE_OPEN, needs, VISITOR_OPEN } from "./access";

test("free lists have the promised sizes", () => {
  const count = (list: string[], prefix: string) => list.filter((k) => k.startsWith(prefix)).length;
  assert.equal(count(VISITOR_OPEN, "/learn/"), 4);
  assert.equal(count(VISITOR_OPEN, "/olympiad/"), 1);
  assert.equal(count(VISITOR_OPEN, "/outliers/"), 1);
  assert.equal(count(FREE_OPEN, "/olympiad/"), 2);
  assert.equal(count(FREE_OPEN, "/outliers/"), 2);
});

test("hub pages and other routes are always open", () => {
  for (const p of ["/", "/learn", "/olympiad", "/outliers", "/plans", "/join", "/privacy"]) assert.equal(contentKey(p), null);
});

test("problems and second labs follow their set or chapter", () => {
  assert.equal(contentKey("/olympiad/newton/some-problem"), "/olympiad/newton");
  assert.equal(contentKey("/learn/float-sink"), "/learn/forces");
  assert.equal(needs("visitor", "/learn/float-sink"), null);
  assert.equal(needs("visitor", "/learn/paths-circles"), "register");
});

test("each tier sees the right prompt", () => {
  assert.equal(needs("visitor", "/learn/earth-moon-sun"), null);
  assert.equal(needs("visitor", "/learn/motion"), "register");
  assert.equal(needs("visitor", "/learn/sound"), "register");
  assert.equal(needs("visitor", "/olympiad/optics"), "upgrade");
  assert.equal(needs("visitor", "/outliers/mass-energy"), "upgrade");
  assert.equal(needs("free", "/learn/sound"), null);
  assert.equal(needs("free", "/learn/eye-defects"), null);
  assert.equal(needs("free", "/outliers/mass-energy"), "upgrade");
  assert.equal(needs("free", "/learn/motion"), null);
  assert.equal(needs("free", "/olympiad/optics/x"), "upgrade");
  assert.equal(needs("family", "/outliers/mass-energy"), null);
  assert.equal(needs("school", "/learn/sound"), null);
});

test("best tier wins", () => {
  assert.equal(bestTier("free", "family"), "family");
  assert.equal(bestTier("school", "visitor"), "school");
  assert.equal(bestTier("visitor", "free"), "free");
});
