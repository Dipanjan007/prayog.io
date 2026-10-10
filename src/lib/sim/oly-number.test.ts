import assert from "node:assert/strict";
import { test } from "node:test";
import * as N from "./oly-number";

test("number: gcd, lcm, remainders and divisors", () => {
  assert.equal(N.gcd(84, 36), 12);
  assert.equal(N.lcm(4, 6, 9), 36);
  assert.equal(N.lcm(3, 5, 7), 105);
  assert.equal(N.mod(-1, 7), 6);
  assert.deepEqual(N.divisors(12), [1, 2, 3, 4, 6, 12]);
  assert.equal(N.divisors(120).length, 16);
});

test("number: smallestFitting agrees with the Chinese-remainder answer", () => {
  const rules = [
    { size: 3, rem: 2 },
    { size: 5, rem: 4 },
    { size: 7, rem: 1 },
  ];
  const n = N.smallestFitting(rules, 0);
  assert.equal(n, 29);
  assert.equal(N.smallestFitting(rules, n), n + N.lcm(3, 5, 7));
  assert.ok(N.fitsAll(29, rules));
  assert.ok(!N.fitsAll(29.5, rules));
});

test("number: planNumber passes only the smallest pile that fits", () => {
  const rules = [
    { size: 4, rem: 1 },
    { size: 6, rem: 1 },
  ];
  const base = { kind: "num-pack" as const, item: ["x", "xs"] as [string, string], group: "box", rules, min: 10 };
  assert.equal(N.planNumber({ ...base, n: 13 }).outcome.ok, true);
  const later = N.planNumber({ ...base, n: 25 });
  assert.equal(later.outcome.ok, false);
  assert.equal(later.smaller, 13);
  assert.equal(N.planNumber({ ...base, n: 1 }).outcome.ok, false, "not above the minimum");
  assert.equal(N.planNumber({ ...base, n: 14 }).outcome.ok, false);
  assert.equal(N.planNumber({ ...base, n: 13.4 }).outcome.ok, false);
  const rows = N.planNumber({ ...base, n: 14 }).rows;
  assert.deepEqual(rows.map((r) => [r.full, r.left]), [[3, 2], [2, 2]]);
});
