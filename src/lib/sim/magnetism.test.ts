import assert from "node:assert/strict";
import { test } from "node:test";
import { fieldAt, forceDirection, potentialAt, rodForce, solenoidNorthEnd, sources } from "./magnetism";

const close = (a: number, b: number, rel = 1e-6) => Math.abs(a - b) <= rel * Math.max(Math.abs(a), Math.abs(b));

test("a straight wire: B = μ0 I / 2πr, so 1 A at 1 cm gives 20 µT", () => {
  const w = sources("wire", false);
  assert.ok(close(fieldAt(w, 1, 1, 0).b, 2e-5));
  assert.ok(close(fieldAt(w, 1, 2, 0).b, 1e-5), "twice as far, half the field");
  assert.ok(close(fieldAt(w, 3, 1, 0).b, 6e-5), "three times the current, three times the field");
});

test("field lines round a wire are circles, anticlockwise for current out of the page", () => {
  const w = sources("wire", false);
  for (const [x, y] of [[1, 0], [0, 2], [-1.5, 0.7], [0.4, -3]]) {
    const { bx, by } = fieldAt(w, 2, x, y);
    assert.ok(Math.abs(bx * x + by * y) < 1e-12, "B is at right angles to the radius");
    assert.ok(x * by - y * bx > 0, "anticlockwise");
  }
  const r = fieldAt(sources("wire", true), 2, 1, 0);
  assert.ok(r.by < 0, "reversing the current reverses the field");
});

test("a loop: both sides add up at the centre, along the axis", () => {
  const c = fieldAt(sources("loop", false), 1, 0, 0);
  const one = fieldAt(sources("wire", false), 1, 0, 2).b;
  assert.ok(close(c.b, 2 * one));
  assert.ok(c.bx > 0 && Math.abs(c.by) < 1e-15);
  assert.ok(fieldAt(sources("loop", true), 1, 0, 0).bx < 0);
});

test("a solenoid: strong, nearly uniform field inside, weak reversed field outside, like a bar magnet", () => {
  const s = sources("solenoid", false);
  const mid = fieldAt(s, 1, 0, 0);
  for (const x of [-2, -1, 1, 2]) {
    const f = fieldAt(s, 1, x, 0);
    assert.ok(Math.abs(f.b - mid.b) / mid.b < 0.15, `x=${x}: ${f.b} vs ${mid.b}`);
    assert.ok(f.bx > 0 && Math.abs(f.by) < 0.05 * f.b);
  }
  const outside = fieldAt(s, 1, 0, 3.5);
  assert.ok(outside.bx < 0, "field outside runs back from north to south");
  assert.ok(outside.b < 0.3 * mid.b);
  assert.equal(solenoidNorthEnd(false), "right");
  assert.equal(solenoidNorthEnd(true), "left");
});

test("field lines follow contours of the vector potential", () => {
  for (const mode of ["wire", "loop", "solenoid"] as const) {
    const s = sources(mode, false);
    for (const [x, y] of [[1.3, 0.4], [-2.2, 2.9], [3.1, -0.6]]) {
      const h = 1e-5;
      const dAx = (potentialAt(s, 1, x + h, y) - potentialAt(s, 1, x - h, y)) / (2 * h);
      const dAy = (potentialAt(s, 1, x, y + h) - potentialAt(s, 1, x, y - h)) / (2 * h);
      const { bx, by } = fieldAt(s, 1, x, y);
      // B = (∂A/∂y, −∂A/∂x) up to the constant μ0/2π and the cm-to-m factor.
      const scale = 2e-5; // μ0/(2π) per cm → per m
      assert.ok(Math.abs(bx - scale * dAy) < 1e-4 * Math.abs(scale * dAy) + 1e-12, `${mode} bx`);
      assert.ok(Math.abs(by + scale * dAx) < 1e-4 * Math.abs(scale * dAx) + 1e-12, `${mode} by`);
    }
  }
});

test("Fleming's left-hand rule: F = I L × B", () => {
  // Current into the page, field to the right: force downwards.
  const f = forceDirection(-1, 1, 0);
  assert.equal(f.fx, 0);
  assert.ok(f.fy < 0);
  // Current out of the page, north pole on top (field down): rod moves right.
  assert.equal(rodForce(3, true, true).dir, 1);
  assert.equal(rodForce(3, true, false).dir, -1, "reverse the current");
  assert.equal(rodForce(3, false, true).dir, -1, "flip the magnet");
  assert.equal(rodForce(3, false, false).dir, 1, "flip both");
  assert.equal(rodForce(0, true, true).dir, 0);
});

test("the rod's force and swing grow with current", () => {
  const r = rodForce(4, true, true);
  assert.ok(close(r.force, 0.02), "F = BIL = 0.1 × 4 × 0.05");
  assert.ok(close(Math.tan((r.angleDeg * Math.PI) / 180), 0.02 / (0.01 * 9.8)));
  assert.ok(rodForce(5, true, true).angleDeg > rodForce(2, true, true).angleDeg);
});
