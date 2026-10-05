import { test } from "node:test";
import assert from "node:assert/strict";
import { block, deg, lensImage, mirrorImage, snell, trace } from "./optics";

const close = (a: number, b: number, tol = 1e-3) => assert.ok(Math.abs(a - b) < tol, `${a} ≈ ${b}`);

test("Snell's law: air to glass bends towards the normal", () => {
  close(snell(30, 1, 1.5)!, deg(Math.asin(0.5 / 1.5)));
  assert.equal(snell(60, 1.5, 1), null); // total internal reflection
});

test("a glass block shifts a ray sideways but keeps its direction", () => {
  const scene = { media: [block(-20, -5, 40, 10, 1.5)] };
  // Ray coming down-right at 45° to the normal of the top face.
  const dir = { x: 1, y: -1 };
  const path = trace({ x: -10, y: 10 }, dir, scene);
  const out = path.dir;
  close(out.x, Math.SQRT1_2);
  close(out.y, -Math.SQRT1_2);
  assert.ok(path.points.length >= 4);
});

test("lens formula matches NCERT example: f = +10 cm, u = −15 cm gives v = +30 cm, m = −2", () => {
  const img = lensImage(-15, 10);
  close(img.v, 30);
  close(img.m, -2);
  assert.equal(img.nature, "Real, inverted, enlarged");
});

test("convex lens as a magnifying glass: object inside F", () => {
  const img = lensImage(-5, 10);
  close(img.v, -10);
  assert.equal(img.nature, "Virtual, erect, enlarged");
});

test("concave lens always gives a virtual, erect, diminished image", () => {
  assert.equal(lensImage(-30, -15).nature, "Virtual, erect, diminished");
});

test("mirror formula: concave f = −10, object at C (u = −20) gives image at C, same size", () => {
  const img = mirrorImage(-20, -10);
  close(img.v, -20);
  close(img.m, -1);
  assert.equal(img.nature, "Real, inverted, same size");
});

test("convex mirror (rear-view): virtual, erect, diminished", () => {
  assert.equal(mirrorImage(-30, 15).nature, "Virtual, erect, diminished");
});

test("traced rays through a thin lens meet where the lens formula says", () => {
  const scene = { elements: [{ kind: "lens" as const, x: 0, halfHeight: 20, f: 10 }] };
  const tip = { x: -15, y: 3 };
  const a = trace(tip, { x: 1, y: 0 }, scene);
  const b = trace(tip, { x: 15, y: -3 }, scene); // through the optical centre
  // Each emergent ray: y = y0 + (x − x0)·slope. Find where they cross.
  const line = (p: typeof a) => {
    const q = p.points[1];
    return { x0: q.x, y0: q.y, s: p.dir.y / p.dir.x };
  };
  const A = line(a);
  const B = line(b);
  const x = (B.y0 - A.y0 + A.s * A.x0 - B.s * B.x0) / (A.s - B.s);
  close(x, 30, 1e-6);
  close(A.y0 + (x - A.x0) * A.s, -6, 1e-6);
});

test("traced rays off a concave mirror meet at the mirror-formula image", () => {
  const scene = { elements: [{ kind: "mirror" as const, x: 0, halfHeight: 20, f: -10 }] };
  const tip = { x: -30, y: 2 };
  const a = trace(tip, { x: 1, y: 0 }, scene);
  const b = trace(tip, { x: 30, y: -2 }, scene); // to the pole
  const line = (p: typeof a) => ({ x0: p.points[1].x, y0: p.points[1].y, s: p.dir.y / p.dir.x });
  const A = line(a);
  const B = line(b);
  const x = (B.y0 - A.y0 + A.s * A.x0 - B.s * B.x0) / (A.s - B.s);
  close(x, -15, 1e-6);
  close(A.y0 + (x - A.x0) * A.s, -1, 1e-6);
});

test("plane mirror: image as far behind as the object is in front, same size", () => {
  const img = mirrorImage(-12, Infinity);
  close(img.v, 12);
  close(img.m, 1);
  assert.equal(img.nature, "Virtual, erect, same size");
});
