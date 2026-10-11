/**
 * Secret codes (Maths Outliers, Class 8 level).
 * Pure functions for the CipherLab sim: the Caesar shift, clock (modular) arithmetic,
 * cracking a shift by counting letters, and why multiplying primes is easy but splitting is slow.
 */

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** a mod n, always between 0 and n − 1 (JavaScript's % can give negatives). */
export function mod(a: number, n: number) {
  return ((a % n) + n) % n;
}

/** Letter to number: A = 0, B = 1, ..., Z = 25. −1 for anything that is not a letter. */
export function letterIndex(ch: string) {
  return ALPHABET.indexOf(ch.toUpperCase());
}

/** Move one letter k places along the wheel; anything else (spaces, digits) stays as it is. */
export function shiftLetter(ch: string, k: number) {
  const i = letterIndex(ch);
  return i < 0 ? ch : ALPHABET[mod(i + k, 26)];
}

/** Caesar code: secret = (plain + k) mod 26 for every letter. Output is in capitals. */
export function encode(text: string, k: number) {
  return [...text.toUpperCase()].map((c) => shiftLetter(c, k)).join("");
}

/** Undo a Caesar code: plain = (secret − k) mod 26. */
export function decode(text: string, k: number) {
  return encode(text, -k);
}

/** True when some letter goes past Z and round to the start with this shift. */
export function wrapsRound(text: string, k: number) {
  const s = mod(k, 26);
  return [...text.toUpperCase()].some((c) => {
    const i = letterIndex(c);
    return i >= 0 && i + s >= 26;
  });
}

/** Clock arithmetic: start at `start` on a clock of `n` hours and add `add`. A 12-hour clock shows 12, not 0. */
export function clockAdd(start: number, add: number, n = 12) {
  const r = mod(start + add, n);
  return n === 12 && r === 0 ? 12 : r;
}

/** How many times each letter A to Z appears. */
export function letterCounts(text: string) {
  const counts = new Array<number>(26).fill(0);
  for (const c of text.toUpperCase()) {
    const i = letterIndex(c);
    if (i >= 0) counts[i]++;
  }
  return counts;
}

/** The most common letter (index), or −1 for no letters. The first one wins a tie. */
export function mostCommon(text: string) {
  const counts = letterCounts(text);
  let best = -1;
  counts.forEach((v, i) => {
    if (v > 0 && (best < 0 || v > counts[best])) best = i;
  });
  return best;
}

/** E is the most common letter in English. */
export const E = 4;

/** Al-Kindi's guess: the shift that would turn E into the most common secret letter, k = (top − E) mod 26. */
export function guessShift(secret: string) {
  const top = mostCommon(secret);
  return top < 0 ? 0 : mod(top - E, 26);
}

/** Small primes for the Primes mode. */
export const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199];

export function isPrime(n: number) {
  if (n < 2 || !Number.isInteger(n)) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

/**
 * Split n the slow way: try 2, 3, 4, 5, ... until one divides n.
 * Returns the factor found and how many divisions were tried.
 */
export function trialSplit(n: number) {
  let tries = 0;
  for (let d = 2; d * d <= n; d++) {
    tries++;
    if (n % d === 0) return { factor: d, other: n / d, tries };
  }
  return { factor: n, other: 1, tries };
}

/** Challenge: a secret message made with an unknown shift. */
export interface SecretRound {
  name: string;
  brief: string;
  plain: string;
  k: number;
}

export const secretOf = (r: SecretRound) => encode(r.plain, r.k);

/** Only the right shift decodes the message. */
export function decodes(r: SecretRound, k: number) {
  return decode(secretOf(r), k) === r.plain.toUpperCase();
}
