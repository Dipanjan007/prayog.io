import assert from "node:assert/strict";
import { test } from "node:test";
import { DELIVERIES } from "../../content/lessons/coordinates";
import { LIMIT, distance, fmt, midpoint, place, reflect, same, snap } from "./coordinates";

test("quadrants follow the signs of x and y", () => {
  assert.equal(place({ x: 4, y: 5 }), "I");
  assert.equal(place({ x: -3, y: 2 }), "II");
  assert.equal(place({ x: -3, y: -1 }), "III");
  assert.equal(place({ x: 2, y: -6 }), "IV");
  assert.equal(place({ x: 5, y: 0 }), "x-axis");
  assert.equal(place({ x: 0, y: -2 }), "y-axis");
  assert.equal(place({ x: 0, y: 0 }), "origin");
});

test("order matters: (2, 5) and (5, 2) are different points", () => {
  assert.ok(!same({ x: 2, y: 5 }, { x: 5, y: 2 }));
});

test("mirror images in the axes and through the origin", () => {
  assert.deepEqual(reflect({ x: 5, y: -3 }, "x-axis"), { x: 5, y: 3 });
  assert.deepEqual(reflect({ x: 5, y: -3 }, "y-axis"), { x: -5, y: -3 });
  assert.deepEqual(reflect({ x: 5, y: -3 }, "origin"), { x: -5, y: 3 });
  // A point on the axis is its own mirror image, with no "−0".
  assert.ok(Object.is(reflect({ x: 4, y: 0 }, "x-axis").y, 0));
});

test("distance between two points uses Pythagoras", () => {
  assert.equal(distance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
  assert.equal(distance({ x: -2, y: -1 }, { x: 4, y: 7 }), 10);
  assert.equal(distance({ x: 1, y: 1 }, { x: 1, y: 6 }), 5);
});

test("midpoint is the average of the coordinates", () => {
  assert.deepEqual(midpoint({ x: 2, y: -6 }, { x: -4, y: 2 }), { x: -1, y: -2 });
  assert.deepEqual(midpoint({ x: 3, y: 4 }, { x: -3, y: -4 }), { x: 0, y: 0 });
});

test("formatting uses a real minus sign, and dragging snaps to whole numbers on the grid", () => {
  assert.equal(fmt({ x: -3, y: 4 }), "(−3, 4)");
  assert.deepEqual(snap(2.4, -3.6), { x: 2, y: -4 });
  assert.deepEqual(snap(40, -40), { x: LIMIT, y: -LIMIT });
  assert.ok(Object.is(snap(-0.2, 0.3).x, 0));
});

test("every delivery target is on the grid and differs from the landmarks", () => {
  assert.equal(DELIVERIES.length, 3);
  for (const d of DELIVERIES) {
    assert.ok(Math.abs(d.target.x) <= LIMIT && Math.abs(d.target.y) <= LIMIT, d.name);
    assert.ok(Number.isInteger(d.target.x) && Number.isInteger(d.target.y), d.name);
    for (const m of d.marks) assert.ok(!same(m.at, d.target), `${d.name}: target sits on ${m.label}`);
  }
  // The midpoint delivery and the mirror delivery agree with the maths.
  const mid = DELIVERIES[1];
  assert.deepEqual(midpoint(mid.marks[0].at, mid.marks[1].at), mid.target);
  const mirror = DELIVERIES[2];
  assert.deepEqual(reflect(mirror.marks[0].at, "y-axis"), mirror.target);
});
