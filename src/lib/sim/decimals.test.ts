import assert from "node:assert/strict";
import { test } from "node:test";
import { JOBS, lesson } from "../../content/lessons/decimals";
import {
  ITEMS,
  LINE,
  NOTES,
  STARTS,
  billTotal,
  changeFrom,
  compareDec,
  dec,
  decEqual,
  digitAt,
  exactBaskets,
  fitsChart,
  fmtDec,
  fmtRupees,
  fmtThou,
  placeMoves,
  places,
  shift,
  shiftMoves,
  snapTo,
  stepBy,
  thou,
  windowAt,
} from "./decimals";

const price = (id: string) => ITEMS.find((i) => i.id === id)!.price;

test("thousandths and formatting", () => {
  assert.equal(thou("2.35"), 2350);
  assert.equal(fmtThou(2350), "2.35");
  assert.equal(fmtThou(500), "0.5");
  assert.equal(fmtThou(12470), "12.47");
  assert.equal(fmtThou(3000), "3");
  assert.equal(fmtRupees(3475), "₹34.75");
  assert.equal(fmtRupees(5), "₹0.05");
  assert.deepEqual(places(2350), { whole: 2, tenths: 3, hundredths: 5, thousandths: 0 });
});

test("zooming: each level cuts one step of the level above into 10", () => {
  assert.deepEqual(windowAt(2350, 0), { lo: 0, hi: 20000, step: 1000 });
  assert.deepEqual(windowAt(2350, 1), { lo: 2000, hi: 3000, step: 100 });
  assert.deepEqual(windowAt(2350, 2), { lo: 2300, hi: 2400, step: 10 });
  assert.deepEqual(windowAt(2350, 3), { lo: 2350, hi: 2360, step: 1 });
  assert.deepEqual(windowAt(LINE.max, 1), { lo: 19000, hi: 20000, step: 100 });
  assert.equal(stepBy(1000, 0, 1), 2000);
  assert.equal(stepBy(2000, 1, 3), 2300);
  assert.equal(stepBy(0, 0, -1), 0);
  assert.equal(snapTo(2347, 2, 2300), 2350);
});

test("task:zoom and task:compare can be reached from the sim's start (1 at the ones zoom)", () => {
  // 1 → 2, zoom, 3 tenths, zoom, 5 hundredths = 11 presses.
  assert.equal(placeMoves(2350), 11);
  assert.ok(placeMoves(450) > 0);
  assert.ok(placeMoves(500) > 0);
  // The predict answer: 0.5 is bigger than 0.45.
  assert.equal(compareDec("0.5", "0.45"), 1);
  assert.equal(lesson.predict.answer, 1);
});

test("task:bill: one samosa and one lassi, paid with ₹50", () => {
  const total = billTotal({ samosa: 1, lassi: 1 });
  assert.equal(total, 3475);
  assert.ok(NOTES.includes(5000));
  assert.equal(changeFrom(5000, total), 1525);
  assert.equal(changeFrom(2000, total), null);
  assert.equal(price("samosa"), 1250);
  assert.equal(price("lassi"), 2225);
  assert.match(lesson.tasks[2].found, /₹12\.50 \+ ₹22\.25 = ₹34\.75/);
  assert.match(lesson.tasks[2].found, /₹50\.00 − ₹34\.75 = ₹15\.25/);
});

test("task:shift: 3.75 × 100 = 375 and 3.75 ÷ 100 = 0.0375, both on the chart", () => {
  assert.ok(STARTS.includes("3.75"));
  const a = shift(dec("3.75"), 2);
  const b = shift(dec("3.75"), -2);
  assert.equal(fmtDec(a), "375");
  assert.equal(fmtDec(b), "0.0375");
  assert.ok(fitsChart(a) && fitsChart(b));
  assert.equal(digitAt(b, -2), 3);
  assert.equal(digitAt(dec("2450"), 0), 0);
  assert.equal(fmtDec(shift(dec("2.45"), 3)), "2450");
  assert.ok(!fitsChart(shift(dec("1.205"), -2))); // 0.01205 needs a fifth place
});

test("every sports-day job can be done with the sim's controls", () => {
  assert.equal(JOBS.length, 3);
  const [place, bill, badge] = JOBS;
  assert.ok(place.kind === "place");
  // The winner has the smallest time.
  const times = ["12.5", "12.47", "12.52"];
  const fastest = times.reduce((m, t) => (compareDec(t, m) < 0 ? t : m));
  assert.equal(thou(fastest), place.target);
  // The pin starts at 12 for this round.
  assert.ok(placeMoves(place.target, 12000) > 0);
  assert.ok(bill.kind === "bill");
  const baskets = exactBaskets(bill.target);
  assert.ok(baskets.length > 0);
  for (const b of baskets) assert.equal(billTotal(b), bill.target);
  assert.ok(badge.kind === "shift");
  assert.equal(shiftMoves(badge.start, badge.target), 2);
  assert.ok(decEqual(shift(dec(badge.start), 3), dec(badge.target)));
});

test("quiz answers are right", () => {
  const q = lesson.quiz;
  // Q1: smallest time.
  const t = q[0].options.map((o) => o.match(/[\d.]+(?= s)/)![0]);
  const best = t.reduce((m, x) => (compareDec(x, m) < 0 ? x : m));
  assert.equal(q[0].answer, t.indexOf(best));
  // Q2 and Q3: money in paise.
  assert.equal(q[1].options[q[1].answer], fmtRupees(4550 + 2775));
  assert.equal(q[2].options[q[2].answer], fmtRupees(5000 - 3640));
  // Q4: 0.072 × 100.
  assert.equal(q[3].options[q[3].answer], fmtDec(shift(dec("0.072"), 2)));
  // Q5: only 2.35 lies strictly between 2.3 and 2.4.
  const between = q[4].options.filter((o) => compareDec(o, "2.3") > 0 && compareDec(o, "2.4") < 0);
  assert.deepEqual(between, [q[4].options[q[4].answer]]);
});
