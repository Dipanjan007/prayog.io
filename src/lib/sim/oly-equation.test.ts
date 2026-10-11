import assert from "node:assert/strict";
import { test } from "node:test";
import * as E from "./oly-equation";

const near = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

test("equation: the balance solution levels the beam", () => {
  const left = { x: 3, k: 2 };
  const right = { x: 1, k: 9 };
  const w = E.solveBalance(left, right);
  assert.ok(near(w, 3.5));
  assert.ok(near(E.balanceTilt({ kind: "eq-balance", left, right, w, thing: "" }), 0));
  assert.ok(E.balanceTilt({ kind: "eq-balance", left, right, w: 4, thing: "" }) > 0, "heavier cabbages tip it left");
});

test("equation: trains meet where both positions agree", () => {
  const t = E.meetTime(330, 60, 75, 1);
  assert.ok(near(t, 3));
  const { x1, x2 } = E.trainPositions(330, 60, 75, 1, t);
  assert.ok(near(x1, 180) && near(x2, 180));
  // Before the second train leaves, it waits at the far station.
  assert.equal(E.trainPositions(330, 60, 75, 1, 0.5).x2, 330);
  assert.equal(E.clock(6 + t), "9:00");
  assert.equal(E.clock(6.75), "6:45");
});

test("equation: the train length fits both passing times", () => {
  const L = E.trainLength(5, 14, 1, 10);
  assert.ok(near(L, 210));
  const { v, tWalk } = E.overtakeTimes({ kind: "eq-overtake", vc: 5, tc: 14, vw: 1, tw: 10, L });
  assert.ok(near(v, 20));
  assert.ok(near(tWalk, 10));
});

test("equation: planEquation passes only the right value", () => {
  const ok = (s: E.EquationScene) => E.planEquation(s).outcome.ok;
  assert.ok(ok({ kind: "eq-balance", left: { x: 3, k: 2 }, right: { x: 1, k: 9 }, w: 3.5, thing: "" }));
  assert.ok(!ok({ kind: "eq-balance", left: { x: 3, k: 2 }, right: { x: 1, k: 9 }, w: 3, thing: "" }));
  const line = { kind: "eq-trains" as const, D: 330, v1: 60, v2: 75, delay2: 1, from: "A", to: "B", start: 6 };
  assert.ok(ok({ ...line, t: 3 }));
  assert.match(E.planEquation({ ...line, t: 2.5 }).outcome.text, /still/);
  assert.match(E.planEquation({ ...line, t: 3.5 }).outcome.text, /passed/);
  assert.ok(ok({ kind: "eq-overtake", vc: 5, tc: 14, vw: 1, tw: 10, L: 210 }));
  assert.ok(!ok({ kind: "eq-overtake", vc: 5, tc: 14, vw: 1, tw: 10, L: 180 }));
});
