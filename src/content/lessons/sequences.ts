/**
 * Class 9 · Ganita Manjari (Part 1, 2026-27) · Chapter 8
 * "Predicting What Comes Next: Exploring Sequences and Progressions".
 * Covers growing patterns, arithmetic progressions (first term a, common difference d),
 * the nth term a + (n − 1) × d, the sum of an AP by pairing, and a doubling sequence
 * to contrast with adding the same amount each time.
 * Ganita Manjari is new for 2026-27: recheck wording against the NCERT chapter PDF.
 */
import type { Forecast } from "@/lib/sim/sequences";
import type { LessonDef } from "./types";

export const LESSON_ID = "c9-sequences";

/** Challenge: three patterns, three questions about what comes next. One star each. */
export const FORECASTS: Forecast[] = [
  {
    name: "Stand B seats",
    brief: "Stand B has 12 seats in row 1, 15 in row 2, 18 in row 3, and so on. How many seats are in row 12?",
    kind: "ap",
    a: 12,
    d: 3,
    n: 12,
    ask: "term",
    answer: 45,
  },
  {
    name: "Meena's savings",
    brief: "Meena saves ₹5 in week 1, ₹10 in week 2, ₹15 in week 3, and so on. How many rupees has she saved in all after 10 weeks?",
    kind: "ap",
    a: 5,
    d: 5,
    n: 10,
    ask: "sum",
    answer: 275,
  },
  {
    name: "Viral video",
    brief: "A funny video is shared by 3 people on day 1, 6 people on day 2, 12 people on day 3, and so on. How many people share it on day 8?",
    kind: "double",
    a: 3,
    d: 0,
    n: 8,
    ask: "term",
    answer: 384,
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "sequence-seer",
  classNum: 9,
  book: "Ganita Manjari",
  chapter: "Predicting What Comes Next: Exploring Sequences and Progressions",
  title: "Stadium rows and savings jars",
  intro: {
    objective:
      "Build growing patterns block by block, from stadium rows to savings jars. Find any term without counting every step, add up a whole pattern by pairing, and watch a doubling jar race past one that grows by the same amount every week.",
    learn: [
      "An arithmetic progression (AP) adds the same number d every time",
      "Term n of an AP is a + (n − 1) × d",
      "The sum of an AP is (n × (first + last)) ÷ 2, found by pairing",
      "A doubling sequence is not an AP, and it soon overtakes any AP",
    ],
    realLife:
      "Seats in stadium and cinema rows, a recurring deposit that adds the same amount each month, taxi fares per km, the floors of a building, and a video going viral all make sequences.",
    minutes: 20,
  },
  hook: {
    title: "How many seats in row 10?",
    text:
      "At a cricket stadium, the front row of a stand has 20 seats, and every row going back has 4 more seats than the row in front of it. The ground staff want to know how many seats are in row 10, and how many there are in the whole stand, without walking along and counting. Can a pattern tell us?",
  },
  predict: {
    question: "Row 1 has 20 seats, and each row has 4 more seats than the row in front. How many seats are in row 10?",
    options: ["56 seats", "60 seats", "80 seats"],
    answer: 0,
  },
  tasks: [
    {
      id: "task:diff",
      title: "Find the difference",
      text: "In Build, make the pattern 5, 8, 11, 14, ... by setting the first term a and the difference d. Watch the differences row.",
      found:
        "With a = 5 and d = 3 every term was 3 more than the one before, so the differences were all 3. A pattern that adds the same number each time is an arithmetic progression, or AP. Each bar is a, plus d stacked once for every step after the first.",
    },
    {
      id: "task:nth",
      title: "Row 10 of the stand",
      text: "Make the stadium stand: a = 20 seats in row 1, d = 4 more per row, and show 10 rows. How many seats are in row 10?",
      found:
        "Row 10 has 56 seats: 20 + (10 − 1) × 4 = 20 + 36 = 56. You add d only 9 times, not 10, because row 1 already has its 20 seats. That is why the rule is a + (n − 1) × d.",
    },
    {
      id: "task:sum",
      title: "Add by pairing",
      text: "Turn on Pair up. Show 1, 2, 3, ..., 10 (a = 1, d = 1, 10 terms) and look at the two copies stacked together.",
      found:
        "The second copy runs backwards, so every column held 1 + 10 = 11. Ten columns of 11 make 110, and that is two copies of the sum, so 1 + 2 + ... + 10 = 110 ÷ 2 = 55. The same pairing works for any AP: (n × (a + l)) ÷ 2.",
    },
    {
      id: "task:double",
      title: "The doubling jar",
      text: "Switch to Doubling. Jar A starts with ₹1 and doubles every week. Jar B gets ₹50 every week. Show at least 10 weeks. When does Jar A pull ahead?",
      found:
        "Jar B was ahead for 9 weeks: in week 9 it had ₹450 and Jar A only ₹256. In week 10 Jar A had ₹512 and Jar B ₹500, and after that Jar A raced away, reaching ₹2048 in week 12. Jar A's differences (1, 2, 4, 8, ...) keep growing, so doubling is not an AP.",
    },
  ],
  discovery: {
    scientist: "Aryabhata",
    years: "476–550 CE",
    fact: "Aryabhata wrote the Aryabhatiya in 499 CE, when he was just 23. One verse gives a rule for adding up an arithmetic progression: find the middle term, then multiply it by the number of terms. The same book also gives the value of π as 3.1416 and explains that the Earth spins on its axis.",
    formula: "Sₙ = n × (a + ((n − 1) ÷ 2) × d)",
    formulaNote: "Aryabhata's rule: the middle term, a + ((n − 1) ÷ 2) × d, times the number of terms n. It gives the same answer as pairing.",
  },
  symbols: [
    { sym: "a", meaning: "the first term, like the 20 seats in row 1" },
    { sym: "d", meaning: "the common difference: how much is added each time" },
    { sym: "n", meaning: "which term you want, or how many terms you are adding" },
    { sym: "tₙ", meaning: "term number n; t₁₀ is the 10th term" },
    { sym: "l", meaning: "the last term you are adding, l = a + (n − 1) × d" },
    { sym: "Sₙ", meaning: "the sum of the first n terms" },
    { sym: "2ⁿ⁻¹", meaning: "2 multiplied by itself (n − 1) times; 2³ = 2 × 2 × 2 = 8" },
    { sym: "...", meaning: "and so on, following the same pattern" },
    { sym: "₹", meaning: "rupees" },
  ],
  ideas: [
    {
      title: "Arithmetic progressions",
      text: "A sequence is a list of numbers in order. If you add the same number d each time, it is an arithmetic progression (AP). 5, 8, 11, 14, ... is an AP with a = 5 and d = 3. The differences between neighbours are all equal, and the bars make a straight staircase.",
      formula: "a,   a + d,   a + 2d,   a + 3d,   ...",
    },
    {
      title: "Jump straight to term n",
      text: "To reach term n, start at a and add d once for each step after the first. That is n − 1 steps, so do the bracket first. Row 10 of the stand: 20 + (10 − 1) × 4 = 20 + 36 = 56.",
      formula: "tₙ = a + (n − 1) × d",
    },
    {
      title: "Add by pairing",
      text: "Write the AP forwards, then backwards under it. Each pair adds to first + last, and there are n pairs. That is two copies of the sum, so halve it. For 1 + 2 + ... + 10: (10 × (1 + 10)) ÷ 2 = 110 ÷ 2 = 55.",
      formula: "Sₙ = (n × (a + l)) ÷ 2",
    },
    {
      title: "Doubling is different",
      text: "In 1, 2, 4, 8, 16, ... each term is 2 times the one before. The differences 1, 2, 4, 8, ... keep growing, so it is not an AP. It starts slowly, but it soon beats any AP: a jar that starts at ₹1 and doubles overtakes ₹50 a week in week 10.",
      formula: "tₙ = a × 2ⁿ⁻¹",
    },
  ],
  challenge: {
    title: "Predict what comes next",
    text: "Three patterns from real life. Spot whether each one adds the same amount or doubles, build it in the lab, and type your answer. One star per correct forecast.",
  },
  quiz: [
    {
      q: "What is the 20th term of 3, 7, 11, 15, ...?",
      options: ["79", "83", "80", "76"],
      answer: 0,
      why: "a = 3 and d = 4, so t₂₀ = 3 + (20 − 1) × 4 = 3 + 76 = 79.",
    },
    {
      q: "What is 1 + 2 + 3 + ... + 100?",
      options: ["5050", "10100", "5000", "5100"],
      answer: 0,
      why: "Pair the first and last: each pair makes 1 + 100 = 101, and there are 100 terms. (100 × 101) ÷ 2 = 10100 ÷ 2 = 5050.",
    },
    {
      q: "Which of these is an arithmetic progression?",
      options: ["2, 4, 8, 16", "5, 9, 13, 17", "1, 4, 9, 16", "3, 5, 8, 12"],
      answer: 1,
      why: "5, 9, 13, 17 goes up by 4 every time. The others have differences 2, 4, 8 and 3, 5, 7 and 2, 3, 4, which are not equal.",
    },
    {
      q: "Kabir saves ₹10 in week 1, ₹15 in week 2, ₹20 in week 3, and so on. How much does he save in week 8?",
      options: ["₹45", "₹50", "₹40", "₹80"],
      answer: 0,
      why: "a = 10 and d = 5, so t₈ = 10 + (8 − 1) × 5 = 10 + 35 = ₹45.",
    },
    {
      q: "The chessboard story: 1 grain of rice on square 1, 2 on square 2, 4 on square 3, doubling each time. How many grains are on square 11?",
      options: ["1024", "2048", "22", "512"],
      answer: 0,
      why: "t₁₁ = 1 × 2¹⁰ = 1024. Square 11 doubles 10 times after square 1: 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024.",
    },
  ],
};
