import assert from "node:assert/strict";
import { test } from "node:test";
import { PRACTICE, SECRETS, lesson } from "../../content/lessons/ciphers";
import {
  ALPHABET,
  E,
  PRIMES,
  clockAdd,
  decode,
  decodes,
  encode,
  guessShift,
  isPrime,
  letterCounts,
  letterIndex,
  mod,
  mostCommon,
  secretOf,
  trialSplit,
  wrapsRound,
} from "./ciphers";

test("Caesar shift: encode and decode undo each other, and letters wrap past Z", () => {
  assert.equal(encode("MEET AFTER SCHOOL", 3), "PHHW DIWHU VFKRRO");
  assert.equal(decode("PHHW DIWHU VFKRRO", 3), "MEET AFTER SCHOOL");
  assert.equal(encode("ZEBRA", 3), "CHEUD");
  assert.equal(encode("Y", 3), "B");
  assert.ok(wrapsRound("ZEBRA", 3));
  assert.ok(!wrapsRound("CHAI AT FOUR", 3));
  for (let k = 0; k < 26; k++) assert.equal(decode(encode("Hello, World 42", k), k), "HELLO, WORLD 42");
  assert.equal(encode("ABC", 26), "ABC");
  assert.equal(letterIndex("e"), E);
});

test("clock arithmetic", () => {
  assert.equal(mod(-1, 26), 25);
  assert.equal(mod(37, 12), 1);
  assert.equal(clockAdd(9, 5), 2);
  assert.equal(clockAdd(9, 17), 2);
  assert.equal(clockAdd(9, 15), 12);
  assert.equal(clockAdd(25, 3, 26), 2);
  // task:clock is reachable: two different adds from the same start land on the same hour.
  assert.equal(clockAdd(3, 4), clockAdd(3, 16));
});

test("frequency analysis finds the shift of the practice message and the last two challenge messages", () => {
  for (const r of [PRACTICE, SECRETS[1], SECRETS[2]]) {
    assert.equal(mostCommon(r.plain), E, r.name);
    assert.equal(guessShift(secretOf(r)), r.k, r.name);
  }
  assert.equal(letterCounts("aAb")[0], 2);
  assert.equal(mostCommon("123"), -1);
  assert.equal(ALPHABET.length, 26);
});

test("each challenge message is decoded by exactly one shift on the dial (0 to 25)", () => {
  assert.equal(SECRETS.length, 3);
  for (const r of [PRACTICE, ...SECRETS]) {
    const ok = Array.from({ length: 26 }, (_, k) => k).filter((k) => decodes(r, k));
    assert.deepEqual(ok, [r.k], r.name);
    assert.ok(r.k > 0 && r.k < 26);
  }
  assert.equal(SECRETS[0].k, 3);
});

test("primes: multiplying is one step, splitting takes many tries", () => {
  for (const p of PRIMES) assert.ok(isPrime(p), `${p}`);
  assert.ok(!isPrime(1) && !isPrime(91));
  assert.deepEqual(trialSplit(101 * 103), { factor: 101, other: 103, tries: 100 });
  assert.equal(trialSplit(13).tries, 2); // 2 and 3 tried; 4 × 4 > 13 so 13 is prime
  // task:primes is reachable: some pair from the list gives n > 10,000.
  const big = PRIMES[PRIMES.length - 1] * PRIMES[PRIMES.length - 2];
  assert.ok(big > 10000);
});

test("predict and quiz answers", () => {
  assert.equal(lesson.predict.options[lesson.predict.answer].slice(0, 1), encode("Y", 3));
  const q = lesson.quiz;
  assert.equal(q[0].options[q[0].answer], encode("CAT", 3));
  assert.equal(q[1].options[q[1].answer], `${clockAdd(10, 27)} o'clock`);
  assert.equal(q[2].options[q[2].answer], `${mod(letterIndex("H") - E, 26)}`);
  assert.equal(q[3].options[q[3].answer], decode("KHOOR", 3));
  assert.equal(q[4].answer, 3);
  for (const x of q) assert.equal(x.options.length, 4);
});
