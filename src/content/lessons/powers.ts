/**
 * Class 8 · Ganita Prakash (Part I) · Chapter 2 "Power Play".
 * A second lab under "A Square and A Cube". Covers doubling and 2ⁿ by folding a sheet of
 * paper (to Everest and the Moon), the laws of exponents with chips (multiplying adds the
 * powers, dividing subtracts them, a⁰ = 1), and powers of 10 and scientific notation with
 * big Indian numbers.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { FoldTarget } from "@/lib/sim/powers";
import type { LessonDef } from "./types";

export const LESSON_ID = "c8-powers";

const M = 1000;
const KM = 1000 * M;

/** Challenge: fold just enough to pass each target, with the thickness hidden until you fold. One star each. */
export const TARGETS: FoldTarget[] = [
  {
    name: "Qutub Minar",
    brief: "Delhi's Qutub Minar is about 73 m tall. Fold the fewest times so the stack is taller than the minar.",
    mm: 73 * M,
    label: "73 m",
  },
  {
    name: "Weather balloon",
    brief: "A weather balloon floats about 30 km up, measuring the monsoon winds. Fold just enough to pass it.",
    mm: 30 * KM,
    label: "30 km",
  },
  {
    name: "GSAT satellite",
    brief: "ISRO's GSAT satellites sit about 36,000 km above the equator. How few folds take the stack past them?",
    mm: 36000 * KM,
    label: "36,000 km",
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "power-player",
  classNum: 8,
  book: "Ganita Prakash",
  chapter: "Power Play",
  title: "Fold to the Moon",
  intro: {
    objective:
      "Fold a sheet of paper again and again and watch its thickness double each time, until it passes Everest and reaches the Moon. Then use chips to discover the laws of exponents, and write huge Indian numbers in scientific notation.",
    learn: [
      "Doubling n times multiplies by 2ⁿ, and that grows astonishingly fast",
      "Multiplying powers of the same number adds the exponents: aᵐ × aⁿ = aᵐ⁺ⁿ",
      "Dividing subtracts the exponents, and a⁰ = 1",
      "Writing big numbers like 3,84,400 as 3.844 × 10⁵",
    ],
    realLife:
      "News reports write India's population and the distance to the Moon with powers of 10. Phone memory doubles: 64 GB, 128 GB, 256 GB. A rumour that each person forwards to two friends spreads by powers of 2.",
    minutes: 20,
  },
  hook: {
    title: "Fold a sheet of paper",
    text:
      "Take a sheet of notebook paper. It is only about 0.1 mm thick. Fold it in half and it is 2 sheets thick. Fold again: 4 sheets. Again: 8. Each fold doubles it. Your friend says that if you could keep folding, the stack would reach the Moon. Is your friend joking? Let's find out.",
  },
  predict: {
    question: "A sheet of paper 0.1 mm thick is folded in half 42 times (pretend that is possible). How thick is the stack?",
    options: ["About as tall as a house", "About as tall as Mount Everest", "Thick enough to reach the Moon"],
    answer: 2,
  },
  tasks: [
    {
      id: "task:everest",
      title: "Past Mount Everest",
      text: "In Fold, find the very first fold that makes the stack taller than Mount Everest (8,849 m).",
      found:
        "It took just 27 folds. After 26 folds the stack is about 6.7 km tall, and the 27th fold doubles it to about 13.4 km, higher than Everest. That is 2²⁷, more than 13 crore layers of paper.",
    },
    {
      id: "task:moon",
      title: "To the Moon",
      text: "Keep folding. Find the first fold that makes the stack reach the Moon, 3,84,400 km away.",
      found:
        "42 folds! 0.1 mm × 2⁴² is about 4,39,805 km, past the Moon. 41 folds gives only about 2,19,902 km. Each fold doubles, so the last fold alone added more than half the way to the Moon.",
    },
    {
      id: "task:laws",
      title: "Multiply by adding",
      text: "Switch to Laws. With base 2 and ×, find two different ways to make 2¹⁰ as 2ᵐ × 2ⁿ.",
      found:
        "Like 2³ × 2⁷ and 2⁵ × 2⁵: the chips just join into one row of 10 twos. Multiplying powers of the same base adds the exponents, so 2ᵐ × 2ⁿ = 2ᵐ⁺ⁿ.",
    },
    {
      id: "task:zero",
      title: "Divide to nothing?",
      text: "Now pick ÷ and make the top and bottom powers the same, like 2⁴ ÷ 2⁴. What is left?",
      found:
        "Every chip on top cancelled one on the bottom, and nothing was left but 1. Dividing subtracts the exponents: 2⁴ ÷ 2⁴ = 2⁽⁴⁻⁴⁾ = 2⁰, and the answer is 1. So any number (except 0) to the power 0 is 1.",
    },
    {
      id: "task:sci",
      title: "Big numbers, short",
      text: "Switch to Big numbers. Move the decimal point to write two different numbers in scientific notation.",
      found:
        "You moved the point left until only one digit (not 0) was in front of it. Each hop divides by 10, so you multiply by 10 once for each hop to keep the number the same: 3,84,400 = 3.844 × 10⁵.",
    },
  ],
  discovery: {
    scientist: "Pingala",
    years: "about 3rd–2nd century BCE",
    fact: "Pingala studied the rhythm of Sanskrit verse, made of short (laghu) and long (guru) syllables. In his Chandaḥśāstra he counted the patterns: with every extra syllable the number of patterns doubles, so n syllables give 2ⁿ patterns. He also gave a quick rule for working out such powers of 2 by halving the exponent and squaring.",
    formula: "patterns with n syllables = 2ⁿ",
    formulaNote: "1 syllable: 2 patterns, 2 syllables: 4, 3 syllables: 8. Each extra syllable doubles the count, just like each fold of the paper.",
  },
  symbols: [
    { sym: "aⁿ", meaning: "a to the power n: n copies of a multiplied together; 2⁵ = 2 × 2 × 2 × 2 × 2 = 32" },
    { sym: "a", meaning: "the base: the number being multiplied again and again" },
    { sym: "m, n", meaning: "exponents (powers): how many copies of the base are multiplied" },
    { sym: "⁰ ¹ ² … ⁹", meaning: "small raised numbers are exponents; 10⁵ means five 10s multiplied" },
    { sym: "×, ÷", meaning: "multiply, divide" },
    { sym: "mm, km", meaning: "millimetre and kilometre; 1 km = 10⁶ mm (10 lakh mm)" },
    { sym: "≈", meaning: "is about equal to; 2¹⁰ ≈ 1000" },
  ],
  ideas: [
    {
      title: "Doubling is powerful",
      text: "Each fold doubles the number of layers, so after n folds there are 2 × 2 × … × 2 = 2ⁿ layers. Ten folds multiply by 2¹⁰ = 1024, about a thousand. So every 10 folds make the stack about 1000 times thicker. That is why 42 folds reach the Moon.",
      formula: "thickness = 0.1 mm × 2ⁿ;   2¹⁰ = 1024 ≈ 1000",
    },
    {
      title: "Multiplying adds the powers",
      text: "aᵐ is m copies of a and aⁿ is n more copies. Multiply them and you have (m + n) copies in one long row. The base must be the same: 2³ × 3⁴ cannot be joined this way.",
      formula: "aᵐ × aⁿ = aᵐ⁺ⁿ;   2³ × 2⁷ = 2¹⁰ = 1024",
    },
    {
      title: "Dividing subtracts the powers",
      text: "In aᵐ ÷ aⁿ, each copy on the bottom cancels one on top, so (m − n) copies are left. When m = n everything cancels and the answer is 1. That is why a⁰ = 1 for any number a that is not 0.",
      formula: "aᵐ ÷ aⁿ = aᵐ⁻ⁿ;   2⁴ ÷ 2⁴ = 2⁰ = 1",
    },
    {
      title: "Scientific notation",
      text: "Write a big number as (a number from 1 up to, but not including, 10) × (a power of 10). The power of 10 counts how many places the decimal point hopped. India has about 1,40,00,00,000 people, which is 1.4 × 10⁹. The Sun is about 1.5 × 10⁸ km away.",
      formula: "3,84,400 = 3.844 × 10⁵;   1,40,00,00,000 = 1.4 × 10⁹",
    },
  ],
  challenge: {
    title: "Fold just enough",
    text: "Three targets in the sky. The stack's height stays hidden until you fold, so think in powers of 2 (10 folds ≈ × 1000). Pick the fewest folds that pass each target. One star per target.",
  },
  quiz: [
    {
      q: "What is 2⁵ × 2³?",
      options: ["2⁸", "2¹⁵", "4⁸", "2²"],
      answer: 0,
      why: "Same base, so add the exponents: 2⁵ × 2³ = 2⁽⁵⁺³⁾ = 2⁸ = 256.",
    },
    {
      q: "Which is the distance to the Moon, 3,84,400 km, in scientific notation?",
      options: ["38.44 × 10⁴ km", "3.844 × 10⁵ km", "3.844 × 10⁶ km", "3844 × 10² km"],
      answer: 1,
      why: "Hop the decimal point 5 places left to get 3.844, a number from 1 to 10. So 3,84,400 = 3.844 × 10⁵. (38.44 × 10⁴ is the same size, but 38.44 is not less than 10.)",
    },
    {
      q: "What is 7⁰?",
      options: ["0", "1", "7", "70"],
      answer: 1,
      why: "7⁰ = 7³ ÷ 7³ (or any matching pair), and anything divided by itself is 1. Any number (except 0) to the power 0 is 1.",
    },
    {
      q: "A sheet of paper 0.1 mm thick is folded 10 times. About how thick is it?",
      options: ["1 mm", "2 mm", "About 10 cm", "About 1 m"],
      answer: 2,
      why: "10 folds make 2¹⁰ = 1024 layers. 1024 × 0.1 mm = 102.4 mm, about 10 cm.",
    },
    {
      q: "Which is bigger, 2¹⁰ or 10³?",
      options: ["2¹⁰", "10³", "They are equal", "You cannot tell"],
      answer: 0,
      why: "2¹⁰ = 1024 and 10³ = 1000, so 2¹⁰ is a little bigger. That is why 10 doublings are about × 1000.",
    },
  ],
};
