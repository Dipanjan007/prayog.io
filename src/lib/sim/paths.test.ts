import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LANDMARKS,
  MAP,
  TRACK_LENGTH,
  WALK_SPEED,
  answerOk,
  arcDistance,
  averageSpeed,
  averageVelocity,
  chordDisplacement,
  circlePoint,
  circleSpeed,
  directionText,
  displacementOf,
  flightTime,
  g,
  heightAt,
  maxHeight,
  pathLength,
  pathUpTo,
  pathVisits,
  pointAtDistance,
  radiusForCircumference,
  releasedPosition,
  snapToCrossing,
  streetDistance,
  streetRoute,
  tangentDir,
  throwDistanceAt,
  type Pt,
} from "./paths";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);
const O: Pt = { x: 0, y: 0 };

test("a straight walk in one direction: distance equals the size of the displacement", () => {
  const pts = [O, { x: 0, y: 500 }];
  close(pathLength(pts), 500);
  close(displacementOf(pts).mag, 500);
  assert.equal(directionText(0, 500), "due north");
});

test("300 m east then 400 m north: distance 700 m, displacement 500 m at 53° north of east", () => {
  const pts = [O, { x: 300, y: 0 }, { x: 300, y: 400 }];
  close(pathLength(pts), 700);
  const d = displacementOf(pts);
  close(d.mag, 500);
  assert.equal(directionText(d.dx, d.dy), "53° north of east");
  assert.equal(directionText(-100, -100), "south-west");
  assert.equal(directionText(0, 0), "no direction");
});

test("a round trip has zero displacement but a non-zero distance", () => {
  const pts = [O, { x: 0, y: 300 }, { x: -200, y: 300 }, { x: -200, y: 0 }, O];
  close(pathLength(pts), 1000);
  close(displacementOf(pts).mag, 0);
  close(averageVelocity(displacementOf(pts).mag, 600), 0);
  assert.ok(averageSpeed(1000, 600) > 0);
});

test("distance is never less than the size of the displacement", () => {
  const pts = [O, { x: 100, y: 0 }, { x: 100, y: -300 }, { x: 400, y: -300 }, { x: 400, y: 200 }];
  assert.ok(pathLength(pts) >= displacementOf(pts).mag);
});

test("street routes go east–west first, then north–south, and are the shortest street walk", () => {
  assert.deepEqual(streetRoute(O, { x: 300, y: 400 }), [
    { x: 300, y: 0 },
    { x: 300, y: 400 },
  ]);
  assert.deepEqual(streetRoute(O, { x: 0, y: 200 }), [{ x: 0, y: 200 }]);
  const route = [O, ...streetRoute(O, LANDMARKS.school)];
  close(pathLength(route), streetDistance(O, LANDMARKS.school));
  close(streetDistance(O, LANDMARKS.school), 1400);
  close(displacementOf(route).mag, 1000);
});

test("taps snap to street crossings inside the map", () => {
  assert.deepEqual(snapToCrossing({ x: 149, y: -51 }), { x: 100, y: -100 });
  assert.deepEqual(snapToCrossing({ x: 5000, y: -5000 }), { x: MAP.xMax, y: MAP.yMin });
});

test("walking along a path: position and the part walked so far", () => {
  const pts = [O, { x: 300, y: 0 }, { x: 300, y: 400 }];
  assert.deepEqual(pointAtDistance(pts, 500), { x: 300, y: 200 });
  assert.deepEqual(pointAtDistance(pts, 9999), { x: 300, y: 400 });
  const part = pathUpTo(pts, 500);
  close(pathLength(part), 500);
});

test("Activity 4.1 style: average speed and average velocity of a trip", () => {
  // Home to school by the streets: 1400 m walked, 1000 m displacement, at a walking pace.
  const t = 1400 / WALK_SPEED;
  close(t, 1000);
  close(averageSpeed(1400, t), 1.4);
  close(averageVelocity(1000, t), 1);
  assert.ok(answerOk(0.98, 1, 0.03));
  assert.ok(!answerOk(1.4, 1, 0.03));
  assert.ok(!answerOk(NaN, 1, 0.03));
});

test("a ball thrown up at 9.8 m/s rises 4.9 m, lands back after 2 s, distance 2h and displacement 0", () => {
  close(g, 9.8);
  close(maxHeight(9.8), 4.9);
  close(flightTime(9.8), 2);
  close(heightAt(9.8, 1), 4.9);
  close(heightAt(9.8, 2), 0);
  close(throwDistanceAt(9.8, 2), 9.8);
  close(throwDistanceAt(9.8, 0.5), heightAt(9.8, 0.5));
  // Going down after the top, the distance keeps growing while the height falls.
  assert.ok(throwDistanceAt(9.8, 1.5) > throwDistanceAt(9.8, 1));
  assert.ok(heightAt(9.8, 1.5) < heightAt(9.8, 1));
});

test("uniform circular motion: v = 2πr/T, and the velocity is along the tangent", () => {
  close(circleSpeed(1, 2 * Math.PI), 1);
  for (const th of [0, 0.7, 2, 4.5]) {
    const p = circlePoint(1, th);
    const d = tangentDir(th);
    close(p.x * d.x + p.y * d.y, 0); // at right angles to the radius
    close(Math.hypot(d.x, d.y), 1);
  }
  // At the east side, moving anticlockwise, the marble heads due north.
  assert.equal(directionText(tangentDir(0).x, tangentDir(0).y), "due north");
});

test("a released marble moves in a straight line along the tangent", () => {
  const th = 1.1;
  const r = 0.1;
  const a = releasedPosition(r, th, 0.5, 0.2);
  const b = releasedPosition(r, th, 0.5, 0.4);
  const p = circlePoint(r, th);
  const d = tangentDir(th);
  // Both points lie on the tangent line through p.
  close((a.x - p.x) * d.y - (a.y - p.y) * d.x, 0);
  close((b.x - p.x) * d.y - (b.y - p.y) * d.x, 0);
  close(segmentDist(a, b), 0.1);
});

function segmentDist(a: Pt, b: Pt) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

test("a 400 m lap: average velocity is zero; half a lap gives a displacement of one diameter", () => {
  const r = radiusForCircumference(TRACK_LENGTH);
  close(r, 63.66, 0.01);
  close(arcDistance(r, 2 * Math.PI), 400);
  close(chordDisplacement(r, 2 * Math.PI), 0);
  close(chordDisplacement(r, Math.PI), 2 * r);
  close(chordDisplacement(r, Math.PI), 127.3, 0.05);
  // A 50 s lap: average speed 8 m/s, average velocity 0.
  close(averageSpeed(400, 50), 8);
  close(averageVelocity(chordDisplacement(r, 2 * Math.PI), 50), 0);
});

test("pathVisits finds a landmark at a corner or part-way along a street", () => {
  const pts = [O, { x: -400, y: 0 }, { x: -400, y: 500 }];
  assert.ok(pathVisits(pts, LANDMARKS.park));
  assert.ok(pathVisits(pts, { x: -400, y: 0 }));
  assert.ok(!pathVisits(pts, LANDMARKS.metro));
});
