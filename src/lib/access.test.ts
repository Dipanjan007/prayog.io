import assert from "node:assert/strict";
import { test } from "node:test";
import { bestTier, contentKey, needs, OPENS, plural, rupees } from "./access";

test("free lists have the promised sizes, and the copy reads naturally", () => {
  assert.deepEqual(OPENS, { visitor: { lessons: 4, sets: 1, outliers: 1 }, free: { sets: 2, outliers: 2 } });
  assert.equal(plural(1, "Olympiad set"), "1 Olympiad set");
  assert.equal(plural(2, "Outliers lab"), "2 Outliers labs");
  assert.equal(rupees(99900), "₹999");
});

test("hub pages and other routes are always open", () => {
  for (const p of ["/", "/learn", "/maths", "/olympiad", "/outliers", "/plans", "/join", "/privacy"]) assert.equal(contentKey(p), null);
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

test("Maths lessons open with a free account, like every NCERT lesson", () => {
  assert.equal(contentKey("/maths/triangles"), "/maths/triangles");
  assert.equal(needs("visitor", "/maths/pythagoras"), "register");
  assert.equal(needs("free", "/maths/pythagoras"), null);
  assert.equal(needs("school", "/maths/coordinates"), null);
});

test("best tier wins", () => {
  assert.equal(bestTier("free", "family"), "family");
  assert.equal(bestTier("school", "visitor"), "school");
  assert.equal(bestTier("visitor", "free"), "free");
});
