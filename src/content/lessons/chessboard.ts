/**
 * Class 8 level · Outliers (Maths) · "Doubling".
 * Goes past the NCERT exponents chapter: the chessboard and rice legend, doubling square by
 * square to 2⁶³ grains on square 64 and 2⁶⁴ − 1 on the whole board, adding the same amount
 * (₹1 lakh a day) against doubling (1 paisa doubled), and a lotus pond that is half covered
 * just one doubling before it is full. Masses use a rough 25 mg a grain; no harvest figures.
 */
import type { GrainRound } from "@/lib/sim/chessboard";
import type { LessonDef } from "./types";

export const LESSON_ID = "xm-chessboard";

/** Challenge: name the first square that holds more grains than each amount. One star each. */
export const GRAIN_ROUNDS: GrainRound[] = [
  {
    name: "The kirana shop",
    brief: "A shopkeeper says no single square will ever hold more than 1,00,000 grains. Which is the first square that holds more than 1 lakh grains?",
    amount: 100_000,
  },
  {
    name: "The rice sack",
    brief: "A 25 kg sack holds about 10 lakh grains (about 25 mg each). Which is the first square with more than a whole sack, 10,00,000 grains?",
    amount: 1_000_000,
  },
  {
    name: "The hundred crore",
    brief: "Which is the first square that holds more than 100 crore grains (1,00,00,00,000) on its own?",
    amount: 1_000_000_000,
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "grain-doubler",
  classNum: 8,
  book: "Outliers",
  chapter: "Doubling",
  title: "The chessboard and the rice",
  intro: {
    objective:
      "Put rice on a chessboard, doubling on every square, and see why the king could never pay. Race ₹1 lakh a day against 1 paisa doubled, and watch a lotus pond fill up in a rush at the very end.",
    learn: [
      "Square s of the board holds 2ˢ⁻¹ grains, so square 64 holds 2⁶³",
      "Adding up the doubles always gives one less than the next double: the board holds 2⁶⁴ − 1 grains",
      "Adding the same amount every day (linear growth) against doubling (exponential growth)",
      "Why something that doubles is half done only one step before the end",
    ],
    realLife:
      "Doubling is everywhere: a rumour forwarded on WhatsApp, bacteria growing in milk that is left out, money that keeps earning interest. Knowing how fast doubling runs away helps you spot it early.",
    minutes: 20,
  },
  hook: {
    title: "The king who lost at chess",
    text:
      "A legend from the Ambalappuzha temple in Kerala tells of a king who loved chess. A wandering sage beat him and asked for a simple prize: 1 grain of rice on the first square of the board, 2 on the second, 4 on the third, doubling on every square. The king laughed at such a small prize and called for a bag of rice. Long before the last square, his granaries were empty. How much rice did the sage really ask for? Let's find out.",
  },
  predict: {
    question: "The sage wants 1 grain on square 1 and double the grains on every next square, up to square 64. About how much rice is that?",
    options: ["About one sack", "About one truckload", "Hundreds of billions of tonnes"],
    answer: 2,
  },
  tasks: [
    {
      id: "task:row",
      title: "The first row",
      text: "In Board, step along the first row, from square 1 to square 8. Watch the grains on each square and the total so far.",
      found:
        "The squares went 1, 2, 4, 8, 16, 32, 64, 128. The whole first row held 255 grains, just one less than the 256 waiting on square 9. Small so far!",
    },
    {
      id: "task:board",
      title: "All 64 squares",
      text: "Keep going, a square or a whole row at a time, to the last square, square 64.",
      found:
        "Square 64 alone holds 2⁶³ ≈ 9.2 × 10¹⁸ grains, and the whole board holds 2⁶⁴ − 1 ≈ 1.8 × 10¹⁹. At about 25 mg a grain that is about 46,000 crore tonnes of rice. Counting it at one grain a second would take about 585 billion years.",
    },
    {
      id: "task:race",
      title: "₹1 lakh or 1 paisa?",
      text: "Switch to Race. Offer A gives ₹1 lakh every day. Offer B gives 1 paisa on day 1, then doubles each day. Move through the days to day 30.",
      found:
        "Offer A was far ahead for weeks: on day 20 it had ₹20 lakh and Offer B only ₹10,485.75. Offer B overtook on day 29, and by day 30 it had ₹1,07,37,418.23 against ₹30 lakh.",
    },
    {
      id: "task:pond",
      title: "The lotus pond",
      text: "Switch to Pond. The leaves cover the whole pond on day 30. Find the day it is exactly half covered. Then change how often the leaves double and find the half day again.",
      found:
        "Doubling every day, the pond was half covered on day 29, only one day before it was full. Doubling every 2 days, it was half covered on day 28. Whatever the doubling time, half full comes just one doubling before full.",
    },
  ],
  discovery: {
    scientist: "Al-Biruni",
    years: "973–1048",
    fact:
      "Al-Biruni was a scholar from Khwarazm in Central Asia who lived in India for years, learnt Sanskrit and wrote a famous book about India and its science, around 1030. He also worked out the chessboard total exactly, all twenty digits of it, about a thousand years ago.",
    formula: "1 + 2 + 4 + ... + 2⁶³ = 2⁶⁴ − 1 = 1,84,46,74,40,73,70,95,51,615",
    formulaNote: "The grains on all 64 squares add up to one less than 2⁶⁴: more than 1.8 × 10¹⁹ grains.",
  },
  symbols: [
    { sym: "s", meaning: "the square number, from 1 to 64" },
    { sym: "2ˢ⁻¹", meaning: "2 to the power (s − 1): (s − 1) twos multiplied together; 2³ = 2 × 2 × 2 = 8" },
    { sym: "2⁰", meaning: "2 to the power 0, which is 1: the single grain on square 1" },
    { sym: "× 10¹⁹", meaning: "times 10 to the power 19: a 1 followed by 19 zeros" },
    { sym: "≈", meaning: "is about equal to" },
    { sym: "₹, paise", meaning: "rupees and paise; ₹1 = 100 paise" },
    { sym: "lakh, crore", meaning: "1 lakh = 1,00,000 and 1 crore = 1,00,00,000 (100 lakh)" },
    { sym: "T", meaning: "the doubling time: how many days the lotus leaves take to double" },
    { sym: "+, −, ×", meaning: "add, take away, multiply" },
  ],
  ideas: [
    {
      title: "Doubling on every square",
      text: "Square 1 has 1 grain, which is 2⁰. Each square doubles the one before, so square s holds (s − 1) twos multiplied together. By square 64 that is 2⁶³, a 19-digit number.",
      formula: "grains on square s = 2ˢ⁻¹;   square 64: 2⁶³ ≈ 9.2 × 10¹⁸",
    },
    {
      title: "One less than the next square",
      text: "Add up the doubles: 1 + 2 = 3, 1 + 2 + 4 = 7, 1 + 2 + 4 + 8 = 15. The total is always one less than the next square. So the whole board holds one less than 2⁶⁴ grains.",
      formula: "1 + 2 + 4 + ... + 2ˢ⁻¹ = 2ˢ − 1;   whole board: 2⁶⁴ − 1 ≈ 1.8 × 10¹⁹",
    },
    {
      title: "Adding or doubling?",
      text: "₹1 lakh a day adds the same amount each day: that is linear growth, a straight line. 1 paisa doubled multiplies by 2 each day: that is exponential growth. Adding wins at the start, but doubling always overtakes in the end.",
      formula: "₹1 lakh × 30 = ₹30 lakh;   (2³⁰ − 1) paise = ₹1,07,37,418.23",
    },
    {
      title: "Half full, one step from the end",
      text: "Anything that doubles does half of all its growth in the very last doubling. A pond that doubles its leaves every T days is half covered just T days before it is full, and only a quarter covered T days before that.",
      formula: "half-covered day = 30 − T;   doubling every day: 30 − 1 = 29",
    },
  ],
  challenge: {
    title: "Which square?",
    text: "For each amount, pick the first square on the board that holds more grains than that on its own, then put the grains down. One star per amount.",
  },
  quiz: [
    {
      q: "How many grains are on square 11 of the board?",
      options: ["22", "512", "1,024", "2,048"],
      answer: 2,
      why: "Square s holds 2ˢ⁻¹ grains. Square 11 holds 2¹⁰ = 1,024.",
    },
    {
      q: "How many grains are on the first 10 squares together?",
      options: ["1,023", "1,024", "512", "2,047"],
      answer: 0,
      why: "1 + 2 + 4 + ... + 2⁹ = 2¹⁰ − 1 = 1,024 − 1 = 1,023. It is one less than the 1,024 on square 11.",
    },
    {
      q: "Lotus leaves double every day and cover the pond on day 30. On which day do they cover a quarter of it?",
      options: ["Day 7", "Day 15", "Day 28", "Day 29"],
      answer: 2,
      why: "Go back one doubling at a time: full on day 30, half on day 29, a quarter on day 28.",
    },
    {
      q: "Offer A gives ₹1,000 every day. Offer B gives 1 paisa on day 1 and doubles it every day. After 25 days, which offer has given more?",
      options: ["Offer A, with ₹25,000", "Offer B, with about ₹3.4 lakh", "They have given the same", "Offer B, with about ₹25"],
      answer: 1,
      why: "Offer A: ₹1,000 × 25 = ₹25,000. Offer B: (2²⁵ − 1) paise = 3,35,54,431 paise = ₹3,35,544.31, which is about ₹3.4 lakh.",
    },
    {
      q: "Square 64 holds 2⁶³ grains. How many grains are on the whole board?",
      options: ["2⁶⁴", "2⁶⁴ − 1", "64 × 2⁶³", "2⁶³ + 64"],
      answer: 1,
      why: "The total of the doubles is always one less than the next double. The next double after 2⁶³ is 2⁶⁴, so the board holds 2⁶⁴ − 1 grains.",
    },
  ],
};
