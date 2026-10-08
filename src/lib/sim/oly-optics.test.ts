import assert from "node:assert/strict";
import { test } from "node:test";
import * as O from "./oly-optics";

const near = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

test("lens formula: object at 2f gives an image at 2f, same size, inverted", () => {
  assert.ok(near(O.lensImage(-40, 20), 40));
  const img = O.benchImage({ x: 0, h: 2 }, [{ x: 40, f: 20 }]);
  assert.ok(near(img.x, 80) && near(img.h, -2) && img.real);
});

test("lens formula: object inside f gives a virtual image; at f the image is at infinity", () => {
  assert.equal(O.benchImage({ x: 0, h: 1 }, [{ x: 10, f: 20 }]).real, false);
  assert.equal(O.lensImage(-20, 20), Infinity);
});

test("traced rays from the object tip all meet at the image", () => {
  const obj = { x: 10, h: 0.5 };
  const lenses = [
    { x: 25, f: 10 },
    { x: 65, f: 8 },
  ];
  const img = O.benchImage(obj, lenses);
  for (const y of [-2, 0, 1.5, 3]) {
    const pts = O.traceRay(obj, lenses, y, img.x);
    assert.ok(near(pts[pts.length - 1][1], img.h, 1e-6), `${y}`);
  }
});

test("Snell's law and the laser reach", () => {
  assert.ok(near(O.refractAngle(0, 1.33), 0));
  const r = O.refractAngle(53, 1.33);
  assert.ok(near(Math.sin((53 * Math.PI) / 180), 1.33 * Math.sin((r * Math.PI) / 180)));
  // With no water the beam goes straight: H tan i.
  assert.ok(near(O.laserReach(1, 45, 0, 1.33), 1));
});

test("bench outcome: blur when the screen is off, sharp when it is on the image", () => {
  const base: O.BenchScene = { kind: "optics-bench", object: { x: 20, h: 3, name: "candle" }, lenses: [{ x: 50, f: 20 }], screen: 110, bench: 150, aperture: 4, tol: 0.03, ask: "mark" };
  assert.equal(O.planOptics(base).outcome.ok, true);
  assert.equal(O.planOptics({ ...base, screen: 100 }).outcome.ok, false);
  assert.equal(O.planOptics({ ...base, object: { ...base.object, x: 40 } }).outcome.ok, false, "virtual image");
});
