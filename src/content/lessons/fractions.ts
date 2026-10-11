/**
 * Class 7 · Ganita Prakash (Part I) · Chapter 8 "Working with Fractions".
 * Covers a fraction of a fraction with the area model (cutting a bar both ways),
 * why multiplying by a proper fraction makes things smaller, a fraction of a
 * number of things, and dividing by a fraction as "how many pieces fit".
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import { frac, type FracRound } from "@/lib/sim/fractions";
import type { LessonDef } from "./types";

export const LESSON_ID = "c7-fractions";

/** Challenge: three orders at the mithai shop, one star each. */
export const ORDERS: FracRound[] = [
  {
    kind: "bar",
    name: "Chocolate order",
    brief: "A customer wants exactly 3/10 of a chocolate bar. The shop cuts bars both ways, along and across. Choose two cuts, each less than a whole bar, that leave exactly 3/10.",
    target: frac(3, 10),
  },
  {
    kind: "share",
    name: "The laddoo box",
    brief: "Meena's family ate 2/5 of a box of laddoos, and that was 12 laddoos. How many laddoos were in the full box? Set the box size.",
    frac: frac(2, 5),
    part: 12,
  },
  {
    kind: "fit",
    name: "Lassi glasses",
    brief: "The shop has 5/2 litres (two and a half litres) of lassi. It must fill exactly 10 glasses with nothing left over. Pick the glass size.",
    whole: frac(5, 2),
    count: 10,
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "fraction-chef",
  classNum: 7,
  book: "Ganita Prakash",
  chapter: "Working with Fractions",
  title: "Cut, share and fit fractions",
  intro: {
    objective:
      "Cut a chocolate bar both ways to see what a fraction of a fraction really is, share laddoos into equal groups, and count how many small glasses a jug can fill. Then use it to run the orders at a mithai shop.",
    learn: [
      "A fraction of a fraction: (a/b) × (c/d) = (a × c)/(b × d)",
      "Why multiplying by a fraction less than 1 makes a number smaller",
      "How to find a fraction of a number of things, like 3/4 of 24",
      "Dividing by a fraction means asking how many pieces fit",
    ],
    realLife:
      "Recipes for half a batch, sharing a pizza or a box of sweets, cutting ribbon into short pieces, and pouring a jug of nimbu pani into glasses all use these ideas.",
    minutes: 20,
  },
  hook: {
    title: "Half of a half",
    text:
      "Amma makes a big roti and gives you half of it. Your little brother wants one third of your half. How much of the whole roti does he get? And if you pour 3 litres of nimbu pani into glasses that hold a quarter litre each, will you fill fewer than 3 glasses or more? Fractions do surprising things when you multiply and divide them. Let's cut some chocolate and find out.",
  },
  predict: {
    question: "Your brother gets 1/3 of your half roti, which is 1/2 × 1/3 of the roti. Compared with 1/2, his share is:",
    options: ["Bigger than 1/2", "Exactly 1/2", "Smaller than 1/2"],
    answer: 2,
  },
  tasks: [
    {
      id: "task:area",
      title: "A fraction of a fraction",
      text: "In Bar, shade 2/3 of the chocolate bar, then take 3/4 of that piece. Count the small pieces that are shaded twice.",
      found:
        "6 of the 12 small pieces were shaded twice, so 3/4 of 2/3 is 6/12, which is 1/2 of the bar. Multiply the tops (2 × 3 = 6) and multiply the bottoms (3 × 4 = 12).",
    },
    {
      id: "task:smaller",
      title: "Why does it shrink?",
      text: "Keep a first fraction and change only the second one. Try a second fraction less than 1, then make the second fraction a whole one, like 4/4.",
      found:
        "With a second fraction less than 1, the twice-shaded part was always smaller than the first fraction. With a whole (4/4 = 1) it stayed exactly the same. Multiplying by a proper fraction keeps only a part, so the answer shrinks.",
    },
    {
      id: "task:share",
      title: "3/4 of the laddoos",
      text: "Switch to Share. Find 3/4 of a box of 24 laddoos.",
      found:
        "The 24 laddoos made 4 equal groups of 6, and 3 of those groups held 18 laddoos. So 3/4 of 24 = (24 ÷ 4) × 3 = 18.",
    },
    {
      id: "task:fit",
      title: "How many glasses fit?",
      text: "Switch to Fit. How many 1/4 litre glasses can 3 litres of nimbu pani fill? Set the total to 3 and each glass to 1/4.",
      found:
        "12 glasses fitted. Each litre fills 4 quarter-litre glasses, so 3 ÷ (1/4) = 3 × 4 = 12. Dividing by a fraction less than 1 gave a bigger number than you started with.",
    },
  ],
  discovery: {
    scientist: "Mahavira",
    years: "9th century CE",
    fact: "Mahavira was a Jain mathematician in Karnataka at the court of King Amoghavarsha. Around 850 CE he wrote the Ganita Sara Sangraha, a maths textbook used in South India for centuries. It gives the rule for dividing fractions that we still use: swap the top and bottom of the divisor, then multiply.",
    formula: "(a/b) ÷ (c/d) = (a/b) × (d/c)",
    formulaNote: "To divide by a fraction, turn it upside down and multiply. It counts how many pieces of size c/d fit into a/b.",
  },
  symbols: [
    { sym: "a/b", meaning: "a fraction: the whole is cut into b equal parts and we take a of them" },
    { sym: "a, c", meaning: "numerators: the top numbers, how many parts we take" },
    { sym: "b, d", meaning: "denominators: the bottom numbers, how many equal parts make a whole" },
    { sym: "×", meaning: "times; a fraction 'of' something means multiply: 3/4 of 24 = 3/4 × 24" },
    { sym: "÷", meaning: "divided by; with fractions, 'how many of these fit into that'" },
    { sym: "d/c", meaning: "the reciprocal of c/d: the same fraction turned upside down" },
    { sym: "N", meaning: "the number of things being shared, like laddoos in a box" },
    { sym: "1/2, 1/3 ...", meaning: "one half, one third: 1 part out of 2 or 3 equal parts" },
  ],
  ideas: [
    {
      title: "A fraction of a fraction",
      text: "Cut a bar into b strips one way and shade a of them. Then cut it into d strips the other way and shade c. The part shaded twice is c/d of a/b. There are b × d small pieces in all, and a × c of them are shaded twice.",
      formula: "(a/b) × (c/d) = (a × c)/(b × d);   (2/3) × (3/4) = 6/12 = 1/2",
    },
    {
      title: "Multiplying can make things smaller",
      text: "Taking 3/4 of something keeps only part of it, so the answer is smaller than what you started with. Multiplying by 1 (like 4/4) leaves it the same, and multiplying by a number bigger than 1 makes it bigger.",
      formula: "(1/2) × (1/3) = 1/6, which is less than 1/2",
    },
    {
      title: "A fraction of a number of things",
      text: "To find 3/4 of 24 laddoos, make 4 equal groups (24 ÷ 4 = 6 each) and take 3 of the groups. Work out the bracket first.",
      formula: "3/4 of 24 = (24 ÷ 4) × 3 = 18",
    },
    {
      title: "Dividing by a fraction",
      text: "3 ÷ (1/4) asks: how many quarters fit into 3? Each whole holds 4 quarters, so the answer is 3 × 4 = 12. When the pieces do not fit exactly, the answer has a fraction part: 2 ÷ (3/4) = 8/3 = 2 and 2/3, so 2 full pieces fit and 2/3 of a piece is left.",
      formula: "3 ÷ (1/4) = 3 × 4 = 12;   2 ÷ (3/4) = 2 × (4/3) = 8/3",
    },
  ],
  challenge: {
    title: "Mithai shop orders",
    text: "Three tricky orders at the mithai shop: a chocolate cut both ways, a laddoo box to work out backwards, and lassi glasses that must come out exact. One star per order.",
  },
  quiz: [
    {
      q: "What is 2/3 × 3/5?",
      options: ["6/15, which is 2/5", "5/8", "6/8", "10/9"],
      answer: 0,
      why: "Multiply the tops and the bottoms: (2 × 3)/(3 × 5) = 6/15. Divide both by 3 to get 2/5.",
    },
    {
      q: "Riya spends 3/4 of her ₹200 pocket money on a cricket ball. How much does the ball cost?",
      options: ["₹50", "₹150", "₹160", "₹175"],
      answer: 1,
      why: "3/4 of 200 = (200 ÷ 4) × 3 = 50 × 3 = ₹150.",
    },
    {
      q: "How many 1/4 kg packets can be filled from 5 kg of sugar?",
      options: ["5/4", "9", "20", "25"],
      answer: 2,
      why: "5 ÷ (1/4) = 5 × 4 = 20. Each kilogram fills 4 quarter-kilogram packets.",
    },
    {
      q: "Which of these is smaller than 5/6?",
      options: ["5/6 × 1", "5/6 × 3/2", "5/6 ÷ 1/2", "5/6 × 7/8"],
      answer: 3,
      why: "Multiplying by 7/8, which is less than 1, keeps only part: 35/48 is less than 5/6 (which is 40/48). The others give 5/6, 5/4 and 5/3.",
    },
    {
      q: "A 2 litre bottle of juice is poured into glasses that hold 3/4 litre. How many glasses are filled right to the top?",
      options: ["2", "3", "1 and 1/2", "8"],
      answer: 0,
      why: "2 ÷ (3/4) = 2 × (4/3) = 8/3 = 2 and 2/3. So 2 glasses are full and the third is only 2/3 full.",
    },
  ],
};
