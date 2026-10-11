import assert from "node:assert/strict";
import { test } from "node:test";
import { GRAIN_ROUNDS, lesson } from "../../content/lessons/chessboard";
import {
  DOUBLING_TIMES,
  POND_FULL_DAY,
  RACE_DAYS,
  SACK_GRAINS,
  SQUARES,
  UNIVERSE_YEARS,
  countingYears,
  firstSquareOver,
  formatIndian,
  formatRupees,
  grainsOn,
  halfDay,
  isFirstOver,
  lakhTotal,
  overtakeDay,
  paisaOn,
  paisaTotal,
  pondCover,
  riceTonnes,
  sci,
  totalTo,
} from "./chessboard";

test("doubling square by square", () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8].map((s) => Number(grainsOn(s))), [1, 2, 4, 8, 16, 32, 64, 128]);
  assert.equal(totalTo(8), BigInt("255"));
  assert.equal(grainsOn(9), BigInt("256"));
  assert.equal(grainsOn(64), BigInt("9223372036854775808"));
  assert.equal(totalTo(64), BigInt("18446744073709551615"));
  for (let s = 1; s <= SQUARES; s++) {
    let sum = BigInt("0");
    for (let k = 1; k <= s; k++) sum += grainsOn(k);
    assert.equal(sum, totalTo(s), `square ${s}`);
    if (s < SQUARES) assert.equal(totalTo(s), grainsOn(s + 1) - BigInt("1"));
  }
});

test("writing big numbers", () => {
  assert.equal(formatIndian(100000), "1,00,000");
  assert.equal(formatIndian(BigInt("10000000")), "1,00,00,000");
  assert.equal(formatIndian(255), "255");
  assert.equal(formatIndian(totalTo(64)), "1,84,46,74,40,73,70,95,51,615");
  assert.equal(sci(grainsOn(64)), "9.2 × 10¹⁸");
  assert.equal(sci(totalTo(64)), "1.8 × 10¹⁹");
  assert.equal(totalTo(64).toString().length, 20);
  assert.equal(formatRupees(BigInt("1073741823")), "₹1,07,37,418.23");
});

test("mass and counting time of the whole board", () => {
  assert.equal(SACK_GRAINS, 1_000_000);
  const crore = riceTonnes(totalTo(64)) / 1e7;
  assert.ok(crore > 45000 && crore < 47000, `${crore} crore tonnes`);
  assert.ok(riceTonnes(totalTo(64)) > 1e11, "hundreds of billions of tonnes");
  const years = countingYears(totalTo(64));
  assert.equal(Math.round(years / 1e9), 585);
  assert.ok(years / UNIVERSE_YEARS > 40);
});

test("₹1 lakh a day against 1 paisa doubled", () => {
  assert.equal(overtakeDay(), 29);
  assert.ok(overtakeDay() <= RACE_DAYS);
  assert.equal(formatRupees(lakhTotal(20)), "₹20,00,000.00");
  assert.equal(formatRupees(paisaTotal(20)), "₹10,485.75");
  assert.equal(formatRupees(paisaTotal(30)), "₹1,07,37,418.23");
  assert.equal(formatRupees(lakhTotal(30)), "₹30,00,000.00");
  assert.equal(paisaOn(1), BigInt("1"));
  assert.ok(paisaTotal(28) < lakhTotal(28) && paisaTotal(29) > lakhTotal(29));
});

test("the pond is half covered one doubling time before it is full", () => {
  for (const T of DOUBLING_TIMES) {
    assert.equal(pondCover(POND_FULL_DAY, T), 1);
    assert.equal(pondCover(halfDay(T), T), 0.5);
    assert.equal(pondCover(halfDay(T) - T, T), 0.25);
  }
  assert.equal(halfDay(1), 29);
  assert.equal(halfDay(2), 28);
  assert.equal(pondCover(25, 1), 1 / 32);
});

test("challenge rounds have one right square on the board", () => {
  assert.equal(GRAIN_ROUNDS.length, 3);
  assert.deepEqual(GRAIN_ROUNDS.map((r) => firstSquareOver(r.amount)), [18, 21, 31]);
  assert.equal(GRAIN_ROUNDS[1].amount, SACK_GRAINS);
  for (const r of GRAIN_ROUNDS) {
    const s = firstSquareOver(r.amount);
    assert.ok(s >= 1 && s <= SQUARES);
    assert.ok(grainsOn(s) > BigInt(r.amount) && grainsOn(s - 1) <= BigInt(r.amount));
    let right = 0;
    for (let k = 1; k <= SQUARES; k++) if (isFirstOver(k, r)) right++;
    assert.equal(right, 1);
  }
});

test("lesson numbers and quiz answers", () => {
  const q = lesson.quiz;
  assert.equal(q.length, 5);
  for (const x of q) assert.equal(x.options.length, 4);
  assert.equal(q[0].options[q[0].answer], formatIndian(grainsOn(11)));
  assert.equal(q[1].options[q[1].answer], formatIndian(totalTo(10)));
  assert.equal(q[2].answer, q[2].options.indexOf(`Day ${halfDay(1) - 1}`));
  assert.equal(formatRupees(paisaTotal(25)), "₹3,35,544.31");
  assert.equal(formatIndian(paisaTotal(25)), "3,35,54,431");
  assert.ok(paisaTotal(25) > BigInt("25000") * BigInt("100"));
  assert.equal(q[3].answer, 1);
  assert.equal(q[4].options[q[4].answer], "2⁶⁴ − 1");
  assert.equal(lesson.predict.answer, 2);
  assert.ok(lesson.discovery.formula.endsWith(formatIndian(totalTo(64))));
  const risky = /÷\s*[^\s()]+\s*[−+]/u;
  for (const f of [lesson.discovery.formula, ...lesson.ideas.map((i) => i.formula ?? "")]) assert.ok(!risky.test(f), f);
});
