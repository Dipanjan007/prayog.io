import assert from "node:assert/strict";
import { test } from "node:test";
import { ORDERS, lesson } from "../../content/lessons/proportion";
import {
  CUPS,
  GLASSES,
  LEMONS_MAX,
  PLACES,
  RECIPE,
  SAMPLE,
  SUGAR_MAX,
  fillsOrder,
  isProportionalTable,
  kmOk,
  mapCm,
  mixColour,
  orderSolutions,
  realKm,
  recipeFor,
  sameRatio,
  scaleAmount,
  simplest,
  taste,
  yellowShare,
} from "./proportion";

test("equal ratios by cross products, and simplest form", () => {
  assert.ok(sameRatio(2, 3, 4, 6));
  assert.ok(sameRatio(6, 9, 8, 12));
  assert.ok(!sameRatio(2, 3, 3, 4));
  assert.ok(!sameRatio(0, 3, 0, 6));
  assert.deepEqual(simplest(8, 12), [2, 3]);
  assert.deepEqual(simplest(5, 7), [5, 7]);
});

test("multiplying keeps the shade, adding one of each makes it bluer", () => {
  assert.equal(mixColour(4, 6), mixColour(2, 3));
  assert.equal(mixColour(8, 12), mixColour(2, 3));
  assert.notEqual(mixColour(3, 4), mixColour(2, 3));
  assert.ok(yellowShare(3, 4) < yellowShare(2, 3));
  assert.equal(yellowShare(2, 3), 0.6);
});

test("prediction: 4 : 5 is a bluer green than 2 : 3", () => {
  assert.ok(yellowShare(4, 5) < yellowShare(SAMPLE.blue, SAMPLE.yellow));
  assert.equal(lesson.predict.answer, 1);
});

test("the sample green can be matched by at least three buckets within the cups", () => {
  const matches: string[] = [];
  for (let b = CUPS.min; b <= CUPS.max; b++) for (let y = CUPS.min; y <= CUPS.max; y++) if (sameRatio(b, y, SAMPLE.blue, SAMPLE.yellow)) matches.push(`${b}:${y}`);
  assert.deepEqual(matches, ["2:3", "4:6", "6:9", "8:12"]);
  assert.ok(isProportionalTable([[2, 3], [4, 6], [6, 9], [8, 12]]));
});

test("nimbu-paani for 12 glasses: 6 lemons and 18 spoons, within the controls", () => {
  assert.deepEqual(recipeFor(12), { lemons: 6, sugar: 18 });
  assert.ok(taste(12, 6, 18).right);
  assert.deepEqual(taste(12, 7, 18), { lemon: 1, sweet: 0, right: false });
  assert.deepEqual(taste(12, 6, 15), { lemon: 0, sweet: -1, right: false });
  // Every glass count on the slider has a whole-number recipe the controls can reach.
  for (let n = GLASSES.min; n <= GLASSES.max; n += GLASSES.step) {
    const r = recipeFor(n);
    assert.ok(Number.isInteger(r.lemons) && r.lemons <= LEMONS_MAX, `${n}`);
    assert.ok(Number.isInteger(r.sugar) && r.sugar <= SUGAR_MAX, `${n}`);
  }
  assert.equal(RECIPE.glasses, 4);
});

test("map: 1 cm is 500 m, and each place has a neat distance", () => {
  const byId = Object.fromEntries(PLACES.map((p) => [p.id, mapCm(p)]));
  assert.deepEqual(byId, { school: 5, temple: 6, fort: 6.5, station: 10 });
  assert.equal(realKm(5), 2.5);
  assert.ok(kmOk(2.5, PLACES[0]));
  assert.ok(!kmOk(5, PLACES[0]));
  assert.ok(!kmOk(NaN, PLACES[0]));
});

test("each Holi order has exactly one mix the cups allow", () => {
  assert.equal(ORDERS.length, 3);
  const expected = [[3, 6], [6, 9], [6, 10]];
  ORDERS.forEach((o, i) => {
    assert.deepEqual(orderSolutions(o), [expected[i]], o.name);
    assert.ok(fillsOrder(expected[i][0], expected[i][1], o));
  });
});

test("quiz answers", () => {
  const q = lesson.quiz;
  assert.equal(scaleAmount(3, 6, 10), 5);
  assert.equal(q[0].options[q[0].answer], "5 cups");
  const pick = q[1].options.map((o) => o.split(" : ").map(Number)).findIndex(([a, b]) => sameRatio(4, 6, a, b));
  assert.equal(pick, q[1].answer);
  assert.equal(q[2].options[q[2].answer], `${realKm(7, 5000)} km`);
  // Pink: red share before 2/7, after 3/9: more red.
  assert.ok(3 / 9 > 2 / 7);
  assert.equal(q[3].answer, 1);
  const tables: [number, number][][] = [
    [[1, 3], [2, 6], [4, 12]],
    [[1, 3], [2, 5], [3, 7]],
    [[1, 2], [2, 3], [3, 4]],
    [[2, 1], [3, 3], [4, 5]],
  ];
  assert.deepEqual(tables.map(isProportionalTable), [true, false, false, false]);
  assert.equal(q[4].answer, 0);
  for (const x of q) {
    assert.equal(x.options.length, 4);
    assert.ok(x.answer >= 0 && x.answer < 4);
  }
});

test("lesson shape", () => {
  assert.equal(lesson.predict.options.length, 3);
  assert.ok(lesson.tasks.length >= 3 && lesson.tasks.length <= 5);
  assert.equal(lesson.quiz.length, 5);
  assert.ok(lesson.symbols.length > 0);
});
