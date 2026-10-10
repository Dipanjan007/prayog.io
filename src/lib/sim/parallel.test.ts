import assert from "node:assert/strict";
import { test } from "node:test";
import { ALIGN_ROUNDS, lesson } from "../../content/lessons/parallel-lines";
import {
  ANGLE_NAMES,
  PAIRS,
  PAIR_KINDS,
  FREE_START,
  ROAD_RANGE,
  SLIDE_RANGE,
  TILT_RANGE,
  alignOk,
  alignSolutions,
  allAngles,
  crossingAngle,
  interiorSums,
  isParallel,
  meetSide,
  roadFromDrag,
  kindHolds,
  kindOf,
  pairHolds,
  targetSee,
} from "./parallel";

test("vertically opposite angles are equal and linear pairs add to 180° for any road and any tilts", () => {
  for (let road = ROAD_RANGE.min; road <= ROAD_RANGE.max; road += 5)
    for (const t1 of [-15, 0, 7])
      for (const t2 of [-9, 0, 15]) {
        assert.ok(kindHolds("vertical", road, t1, t2));
        assert.ok(kindHolds("linear", road, t1, t2));
      }
});

test("every angle stays between 25° and 155° in the sim's ranges, so labels have room", () => {
  for (const road of [ROAD_RANGE.min, ROAD_RANGE.max])
    for (const t of [TILT_RANGE.min, TILT_RANGE.max]) {
      const ang = allAngles(road, t, t);
      for (const n of ANGLE_NAMES) assert.ok(ang[n] >= 25 && ang[n] <= 155, `${road}, ${t}: ${n} = ${ang[n]}`);
    }
});

test("corresponding and alternate angles are equal and co-interior add to 180° exactly when the lines are parallel", () => {
  for (const road of [50, 60, 90, 123])
    for (const t1 of [-10, 0, 4])
      for (const t2 of [-10, 0, 4, 5]) {
        const par = isParallel(t1, t2);
        assert.equal(kindHolds("corresponding", road, t1, t2), par);
        assert.equal(kindHolds("alternate", road, t1, t2), par);
        assert.equal(kindHolds("co-interior", road, t1, t2), par);
      }
});

test("co-interior angles add to less than 180° on the side where the lines meet", () => {
  // Bottom rail turned clockwise (left end up) under a level top rail: the rails close in on the left.
  const ang = allAngles(60, 0, -5);
  assert.ok(ang.d + ang.e < 180);
  assert.ok(ang.c + ang.f > 180);
  assert.equal(ang.d + ang.e + ang.c + ang.f, 360);
  assert.equal(meetSide(0, -5), "left");
  // Check the side against real geometry: the gap between the lines shrinks towards the meeting side.
  for (const [t1, t2] of [[0, -5], [0, 5], [10, 3], [-4, 12]]) {
    const gap = (x: number) => 1 + x * (Math.tan((t1 * Math.PI) / 180) - Math.tan((t2 * Math.PI) / 180));
    const side = gap(5) < gap(-5) ? "right" : "left";
    assert.equal(meetSide(t1, t2), side);
    for (const road of [50, 90, 130]) {
      const s = interiorSums(road, t1, t2);
      assert.ok((side === "left" ? s.left : s.right) < 180);
      assert.ok((side === "left" ? s.right : s.left) > 180);
    }
  }
  assert.equal(meetSide(3, 3), null);
});

test("dragging the road points it at the pointer, kept in range", () => {
  assert.equal(roadFromDrag(0, -10), 90);
  assert.equal(roadFromDrag(10, -10), 45);
  assert.equal(roadFromDrag(-10, 10), 45); // dragging the lower end works too
  assert.equal(roadFromDrag(10, -1), ROAD_RANGE.min);
  assert.equal(roadFromDrag(-10, -1), ROAD_RANGE.max);
});

test("the pair table names each pair once, and kindOf finds it", () => {
  assert.equal(PAIRS.corresponding.length, 4);
  assert.equal(PAIRS.alternate.length, 2);
  assert.equal(PAIRS["co-interior"].length, 2);
  for (const k of PAIR_KINDS) for (const [p, q] of PAIRS[k]) assert.equal(kindOf(q, p), k);
  assert.equal(kindOf("a", "h"), null);
});

test("each challenge round starts crooked and is solvable with the bottom-tilt control", () => {
  assert.equal(ALIGN_ROUNDS.length, 3);
  for (const r of ALIGN_ROUNDS) {
    assert.ok(!isParallel(r.topTilt, r.startTilt), r.name);
    assert.ok(r.startTilt >= TILT_RANGE.min && r.startTilt <= TILT_RANGE.max);
    assert.deepEqual(alignSolutions(r), [r.topTilt], r.name);
    // The known angle and the seen angle are a real pair, and the brief's number is right.
    const kind = kindOf(r.known, r.see);
    assert.ok(kind === "corresponding" || kind === "alternate" || kind === "co-interior", r.name);
    const known = allAngles(r.road, r.topTilt, r.startTilt)[r.known];
    assert.ok(r.brief.includes(`∠${r.known} = ${known}°`), `${r.name}: brief should say ∠${r.known} = ${known}°`);
    assert.ok(pairHolds(kind!, known, targetSee(r)));
    // At the start the seen angle is wrong.
    assert.ok(!pairHolds(kind!, known, allAngles(r.road, r.topTilt, r.startTilt)[r.see]));
  }
  assert.equal(targetSee(ALIGN_ROUNDS[0]), 70);
  assert.equal(targetSee(ALIGN_ROUNDS[1]), 75);
  assert.equal(targetSee(ALIGN_ROUNDS[2]), 80);
});

test("predict and quiz answers", () => {
  assert.equal(allAngles(65, 0, 0).f, 65);
  assert.equal(lesson.predict.options[lesson.predict.answer], "Exactly 65°");
  const [q1, q2, q3, q4, q5] = lesson.quiz;
  assert.equal(q1.options[q1.answer], `${allAngles(70, 0, 0).f}°`);
  // Co-interior partner of 70°: the road at 110° to a level rail makes ∠d = 110°... pick θ so ∠e = 70°.
  const a2 = allAngles(110, 0, 0);
  assert.equal(a2.e, 70);
  assert.equal(q2.options[q2.answer], `${a2.d}°`);
  assert.equal(q3.options[q3.answer], `${180 - 48}°`);
  assert.equal(q4.answer, 1);
  assert.equal(q5.options[q5.answer], `${180 / 3}°`);
  assert.equal(crossingAngle(110, 10), 100);
});

test("free play starts crooked and every task can be finished with the controls", () => {
  assert.ok(!isParallel(FREE_START.topTilt, FREE_START.bottomTilt));
  // Rail m turns in 1° steps, so it can reach the top rail's tilt, and cross past it on both sides.
  assert.ok(FREE_START.topTilt >= TILT_RANGE.min + 1 && FREE_START.topTilt <= TILT_RANGE.max - 1);
  assert.ok(SLIDE_RANGE.min < 0 && SLIDE_RANGE.max > 0);
  // Two different road angles exist for the vertically opposite and linear pair checks.
  assert.ok(ROAD_RANGE.max - ROAD_RANGE.min >= 2);
  for (const r of ALIGN_ROUNDS) assert.ok(alignOk(r, r.topTilt) && !alignOk(r, r.startTilt));
});

test("lesson shape and formula style", () => {
  assert.ok(lesson.tasks.length >= 3 && lesson.tasks.length <= 5);
  assert.equal(lesson.predict.options.length, 3);
  assert.equal(lesson.quiz.length, 5);
  for (const q of lesson.quiz) assert.equal(q.options.length, 4);
  assert.ok(lesson.ideas.length >= 3 && lesson.ideas.length <= 4);
  const risky = /÷\s*[^\s()]+\s*[−+]/u;
  for (const f of [lesson.discovery.formula, ...lesson.ideas.map((i) => i.formula ?? "")]) assert.ok(!risky.test(f), f);
  assert.ok(!JSON.stringify(lesson).includes("—"), "no em-dashes");
});
