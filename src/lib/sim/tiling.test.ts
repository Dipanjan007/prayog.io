import assert from "node:assert/strict";
import { test } from "node:test";
import { TILE_ROUNDS, lesson } from "../../content/lessons/tilings";
import {
  FLOORS,
  SHAPES,
  angleSum,
  canAdd,
  copiesRoundPoint,
  fillsFor,
  floorTiles,
  gapLeft,
  interiorAngle,
  isMixed,
  nearestCorner,
  roundSolved,
  tilesAlone,
  tilesAtCorner,
  vertexFit,
  vertexKey,
} from "./tiling";

test("interior angle = 180° − (360° ÷ n)", () => {
  assert.deepEqual(
    SHAPES.map((n) => interiorAngle(n)),
    [60, 90, 108, 120, 135, 144, 150],
  );
  assert.equal(interiorAngle(9), 140);
});

test("only triangles, squares and hexagons tile on their own", () => {
  assert.deepEqual(
    SHAPES.filter((n) => tilesAlone(n)),
    [3, 4, 6],
  );
  assert.equal(copiesRoundPoint(3), 6);
  assert.equal(copiesRoundPoint(4), 4);
  assert.equal(copiesRoundPoint(6), 3);
  assert.ok(!Number.isInteger(copiesRoundPoint(5)));
  // Shapes with more than six sides: between two and three fit, so two leave a gap.
  for (const n of [8, 10, 12, 20]) assert.ok(copiesRoundPoint(n) > 2 && copiesRoundPoint(n) < 3);
});

test("pentagons: three leave a 36° gap and a fourth overlaps by 72°", () => {
  assert.equal(vertexFit([5, 5, 5]), "gap");
  assert.equal(gapLeft([5, 5, 5]), 36);
  assert.ok(canAdd([5, 5, 5]));
  assert.equal(vertexFit([5, 5, 5, 5]), "overlap");
  assert.equal(gapLeft([5, 5, 5, 5]), -72);
  assert.ok(!canAdd([5, 5, 5, 5]));
});

test("mixed corners that fit exactly", () => {
  for (const t of [
    [4, 8, 8],
    [3, 3, 3, 4, 4],
    [3, 6, 3, 6],
    [3, 12, 12],
    [4, 6, 12],
    [5, 5, 10],
    [3, 3, 4, 12],
    [3, 4, 4, 6],
    [3, 3, 3, 3, 6],
  ])
    assert.equal(vertexFit(t), "fits", t.join("."));
  assert.ok(isMixed([4, 8, 8]));
  assert.ok(!isMixed([4, 4, 4, 4]));
  assert.equal(vertexKey([8, 4, 8]), "4.8.8");
  // There are at least two different mixes, so the "find a second mix" task can be done.
  const mixes = fillsFor(360).filter(isMixed);
  assert.ok(mixes.length >= 2);
  // With only one shape, exactly the three regular floors fill the point.
  assert.deepEqual(
    fillsFor(360)
      .filter((f) => !isMixed(f))
      .map((f) => f[0]),
    [3, 4, 6],
  );
});

test("every floor pattern has the same tiles at every inside corner, adding up to 360°", () => {
  for (const f of FLOORS) {
    const tiles = floorTiles(f.id, 4, 3);
    assert.equal(angleSum(f.vertex), 360, f.id);
    // No tile is drawn twice.
    const centres = new Set(tiles.map((t) => t.pts.reduce((s, p) => `${s}${Math.round(p.x * 1000)},${Math.round(p.y * 1000)};`, "")));
    assert.equal(centres.size, tiles.length, `${f.id} has a repeated tile`);
    let checked = 0;
    for (const t of tiles)
      for (const p of t.pts) {
        if (Math.abs(p.x) > 3 || Math.abs(p.y) > 2) continue;
        const at = tilesAtCorner(tiles, p);
        assert.equal(
          at.reduce((s, x) => s + x.angle, 0),
          360,
          `${f.id} at ${p.x.toFixed(2)}, ${p.y.toFixed(2)}`,
        );
        assert.equal(vertexKey(at.map((x) => x.n)), vertexKey(f.vertex), f.id);
        checked++;
      }
    assert.ok(checked > 10, f.id);
    // Every side is 1 long.
    for (const t of tiles)
      for (let i = 0; i < t.pts.length; i++) {
        const a = t.pts[i];
        const b = t.pts[(i + 1) % t.pts.length];
        assert.ok(Math.abs(Math.hypot(a.x - b.x, a.y - b.y) - 1) < 1e-9, f.id);
      }
    // The marked corner the sim reads is a real corner of the pattern.
    const c = nearestCorner(tiles, { x: 0, y: 0 });
    assert.equal(vertexKey(tilesAtCorner(tiles, c).map((x) => x.n)), vertexKey(f.vertex));
  }
});

test("each challenge corner can be finished from the box, and starts with a gap", () => {
  assert.equal(TILE_ROUNDS.length, 3);
  for (const r of TILE_ROUNDS) {
    assert.equal(vertexFit(r.fixed), "gap", r.name);
    const fills = fillsFor(gapLeft(r.fixed));
    assert.ok(fills.length >= 1, r.name);
    for (const f of fills) assert.ok(roundSolved(r, f));
    assert.ok(!roundSolved(r, []));
  }
  assert.deepEqual(fillsFor(gapLeft(TILE_ROUNDS[0].fixed)), [[8]]);
  assert.deepEqual(fillsFor(gapLeft(TILE_ROUNDS[1].fixed)), [[3, 4], [12]]);
  // "Only one shape in the box fills the rest" for the diya round.
  assert.deepEqual(fillsFor(gapLeft(TILE_ROUNDS[2].fixed)), [[10]]);
});

test("predict and quiz answers", () => {
  assert.equal(lesson.predict.answer, 1);
  assert.ok(!tilesAlone(5));
  const [q1, q2, q3, q4, q5] = lesson.quiz;
  assert.equal(q1.options[q1.answer], `${interiorAngle(6)}°`);
  assert.equal(gapLeft([8, 8]), 90);
  assert.equal(vertexFit([8, 8, 8]), "overlap");
  assert.ok(q2.options[q2.answer].includes(`${gapLeft([8, 8])}° gap`));
  assert.deepEqual(fillsFor(gapLeft([12, 12])), [[3]]);
  assert.equal(q3.options[q3.answer], "A triangle");
  assert.equal(q4.options[q4.answer], `${interiorAngle(9)}°`);
  assert.equal(q5.options[q5.answer], `${(360 - 3 * interiorAngle(3)) / interiorAngle(4)}`);
});

test("lesson shape and formula style", () => {
  assert.ok(lesson.tasks.length >= 3 && lesson.tasks.length <= 5);
  assert.equal(lesson.predict.options.length, 3);
  assert.equal(lesson.quiz.length, 5);
  for (const q of lesson.quiz) assert.equal(q.options.length, 4);
  const risky = /÷\s*[^\s()]+\s*[−+]/u;
  for (const f of [lesson.discovery.formula, ...lesson.ideas.map((i) => i.formula ?? "")]) assert.ok(!risky.test(f), f);
  assert.ok(!JSON.stringify(lesson).includes("—"), "no em-dashes");
});
