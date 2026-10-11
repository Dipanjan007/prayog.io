import assert from "node:assert/strict";
import { test } from "node:test";
import { PLOTS, lesson } from "../../content/lessons/area";
import { CONTROLS, START, allShapes, area, copyPolygon, doubled, fits, plotHint, plotOk, polyArea, polygon, range, setValue, squares, working, type Shape } from "./area";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test("the formula always matches the shoelace area of the drawn shape", () => {
  for (const kind of ["shear", "triangle", "trapezium"] as const)
    for (const sh of allShapes(kind)) close(area(sh), polyArea(polygon(sh)));
});

test("shape and copy make the parallelogram, with exactly twice the area", () => {
  for (const kind of ["triangle", "trapezium"] as const)
    for (const sh of allShapes(kind)) {
      const cp = copyPolygon(sh)!;
      close(polyArea(cp), area(sh));
      close(polyArea(doubled(sh)), 2 * area(sh));
      // Every corner of the copy is a corner of, or on an edge of, the parallelogram's bounding strip.
      for (const v of cp) assert.ok(v.y === 0 || v.y === sh.h);
    }
  const tri: Shape = { kind: "triangle", b: 6, h: 4, p: 2 };
  assert.deepEqual(copyPolygon(tri), [{ x: 8, y: 4 }, { x: 2, y: 4 }, { x: 6, y: 0 }]);
});

test("counting squares: whole squares plus pieces is the area", () => {
  const rect: Shape = { kind: "shear", b: 6, h: 4, s: 0 };
  const r = squares(polygon(rect));
  assert.equal(r.whole, 24);
  assert.equal(r.parts, 0);
  for (const s of [-6, -3, -2, 2, 3, 5]) {
    const q = squares(polygon({ kind: "shear", b: 6, h: 4, s }));
    assert.ok(q.whole < 24 && q.parts > 0, `s = ${s}`);
    close(q.whole + q.pieceArea, 24);
  }
  for (const kind of ["shear", "triangle", "trapezium"] as const)
    for (const sh of allShapes(kind).filter((_, i) => i % 7 === 0)) {
      const q = squares(polygon(sh));
      close(q.whole + q.pieceArea, area(sh));
    }
});

test("the board holds every shape, and controls clamp to fit", () => {
  for (const kind of ["shear", "triangle", "trapezium"] as const) assert.ok(fits(START[kind]));
  const wide: Shape = { kind: "shear", b: 12, h: 3, s: 0 };
  assert.deepEqual(range(wide, "s"), [-2, 2]);
  assert.deepEqual(setValue(wide, "s", 6), { ...wide, s: 2 });
  // Task shapes fit.
  assert.ok(fits({ kind: "shear", b: 6, h: 4, s: 2 }));
  assert.ok(fits({ kind: "triangle", b: 6, h: 4, p: -3 }));
  assert.ok(fits({ kind: "trapezium", a: 7, c: 3, h: 4, o: 1 }));
  for (const c of CONTROLS.trapezium) assert.ok(c.min <= c.max);
});

test("task numbers", () => {
  assert.equal(area({ kind: "shear", b: 6, h: 4, s: 0 }), 24);
  assert.equal(area({ kind: "triangle", b: 6, h: 4, p: 0 }), 12);
  assert.equal(area({ kind: "triangle", b: 6, h: 4, p: 9 }), 12);
  const trap: Shape = { kind: "trapezium", a: 7, c: 3, h: 4, o: 1 };
  assert.equal(area(trap), 20);
  assert.equal(polyArea(doubled(trap)), 40);
  assert.equal(working(trap), "((7 + 3) × 4) ÷ 2 = 20");
  assert.equal(working({ kind: "triangle", b: 6, h: 4, p: 1 }), "(6 × 4) ÷ 2 = 12");
  assert.equal(lesson.predict.options[lesson.predict.answer], `Stays ${area({ kind: "shear", b: 6, h: 4, s: 3 })} square units`);
});

test("each plot can be marked out with the controls, and has one height", () => {
  assert.equal(PLOTS.length, 3);
  const heights = PLOTS.map((p) => [...new Set(allShapes(p.kind).filter((sh) => plotOk(p, sh)).map((sh) => sh.h))]);
  assert.deepEqual(heights, [[4], [5], [5]]);
  assert.ok(plotOk(PLOTS[0], { kind: "shear", b: 7, h: 4, s: 2 }));
  assert.ok(!plotOk(PLOTS[0], { kind: "shear", b: 7, h: 4, s: 0 }));
  assert.match(plotHint(PLOTS[0], { kind: "shear", b: 7, h: 4, s: 0 }), /rectangle/);
  assert.ok(plotOk(PLOTS[1], { kind: "triangle", b: 8, h: 5, p: 3 }));
  assert.ok(plotOk(PLOTS[2], { kind: "trapezium", a: 6, c: 4, h: 5, o: 1 }));
  assert.match(plotHint(PLOTS[2], { kind: "trapezium", a: 6, c: 4, h: 4, o: 1 }), /20 square units, too small/);
  // Rounds start from the free-play shapes, which do not already solve them.
  for (const p of PLOTS) assert.ok(!plotOk(p, START[p.kind]));
});

test("quiz answers", () => {
  const q = lesson.quiz;
  assert.equal(q[0].options[q[0].answer], `${area({ kind: "shear", b: 9, h: 5, s: 2 })} cm²`);
  assert.equal(q[1].options[q[1].answer], `${area({ kind: "triangle", b: 10, h: 7, p: 3 })} m²`);
  assert.equal(q[2].options[q[2].answer], `${area({ kind: "trapezium", a: 12, c: 8, h: 5, o: 0 })} m²`);
  assert.match(q[3].options[q[3].answer], new RegExp(`${area({ kind: "shear", b: 8, h: 3, s: 1 })} square units`));
  assert.equal(q[4].options[q[4].answer], `${(2 * 30) / 12} cm`);
  for (const x of q) assert.equal(x.options.length, 4);
});

test("lesson shape", () => {
  assert.equal(lesson.predict.options.length, 3);
  assert.ok(lesson.tasks.length >= 3 && lesson.tasks.length <= 5);
  assert.equal(lesson.quiz.length, 5);
  assert.ok(lesson.symbols.length > 0);
  const risky = /÷\s*[^\s()]+\s*[−+]/u;
  for (const f of [lesson.discovery.formula, ...lesson.ideas.map((i) => i.formula ?? "")]) assert.ok(!risky.test(f), f);
});
