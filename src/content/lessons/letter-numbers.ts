/**
 * Class 7 · Ganita Prakash (Part 1) · Chapter 4 "Expressions using Letter-Numbers".
 * Second lab under "Finding the Unknown". Covers growing matchstick and tile patterns,
 * finding a rule like 3n + 1 with a letter-number n, using the rule for a big n without
 * drawing, and equivalent expressions such as 4n + 4 = 4(n + 1) for a rangoli border.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { PatternRound } from "@/lib/sim/patterns";
import type { LessonDef } from "./types";

export const LESSON_ID = "c7-letter-numbers";

/** Challenge: three new patterns, find each rule. One star each. */
export const PATTERN_ROUNDS: PatternRound[] = [
  {
    pattern: "houses",
    name: "Diwali houses",
    brief: "Your little brother builds a row of matchstick houses for a Diwali display. Next-door houses share a wall. Find the rule for n houses.",
  },
  {
    pattern: "fence",
    name: "Bamboo fence",
    brief: "A farmer builds a bamboo fence around her vegetable patch: posts, two rails and a slanting brace in every section. Find the rule for n sections.",
  },
  {
    pattern: "path",
    name: "Garden path",
    brief: "The school garden gets a path of n grey tiles, with white tiles laid all around it. Find the rule for the white tiles.",
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "pattern-spotter",
  classNum: 7,
  book: "Ganita Prakash",
  chapter: "Expressions using Letter-Numbers",
  title: "Matchstick rules",
  intro: {
    objective:
      "Build growing patterns of matchsticks and tiles, spot how they grow, and write the rule with a letter-number n. Then use the rule for step 100 without drawing it, and find out why different-looking rules can count the same thing.",
    learn: [
      "A letter like n can stand for any number: step 1, step 2, step 100",
      "How to find a rule like 3n + 1 from the way a pattern grows",
      "Using a rule to work out a huge step without drawing it",
      "Why 4n + 4 and 4(n + 1) are the same expression",
    ],
    realLife:
      "Tiling a floor, laying a rangoli border, working out an auto fare (a fixed charge plus so much per km) or the cost of n cups of chai are all letter-number rules.",
    minutes: 20,
  },
  hook: {
    title: "The matchstick puzzle",
    text:
      "Your cousin makes a row of squares with matchsticks on the floor. One square takes 4 matchsticks. She wants a row of 50 squares for a school display. Does she need 200 matchsticks? Before you buy a box, let's find out how the pattern really grows.",
  },
  predict: {
    question: "One square takes 4 matchsticks. A row of 10 squares, where next-door squares share a side, takes how many?",
    options: ["40", "31", "30"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:grow",
      title: "Watch it grow",
      text: "In Build, pick Squares in a row. Step through n = 1, 2, 3 and 4 and watch the count. The new matchsticks in each step light up.",
      found:
        "The counts were 4, 7, 10, 13. Each new square needs only 3 more matchsticks, because it shares a side with the square before it.",
    },
    {
      id: "task:rule",
      title: "Write the rule",
      text: "Switch to Rule. Set the rule with the + and − buttons and press Check. Find the rule for two different patterns.",
      found:
        "Squares in a row grow by 3 each step, so the rule has 3n in it. Step 1 has 4 matchsticks, which is 3 + 1, so the rule is 3n + 1. The jump tells you the number in front of n, and step 1 tells you what to add.",
    },
    {
      id: "task:big",
      title: "Step 100 without drawing",
      text: "With a correct rule in Rule, type a big step like 100 and see the count.",
      found:
        "For 100 squares, (3 × 100) + 1 = 301 matchsticks. Nobody wants to draw 100 squares, but the rule gives the answer in one line. That is the power of a letter-number.",
    },
    {
      id: "task:same",
      title: "Same border, different rules",
      text: "Switch to Same? and look at the rangoli border. Tap each expression to see how it groups the tiles, mark it Same or Different from 4n + 4, then press Check my sorting.",
      found:
        "4(n + 1), 2(n + 2) + 2n and (4 × (n + 2)) − 4 all count every tile exactly once, so they always equal 4n + 4. 4n misses the 4 corners and 4(n + 2) counts them twice, so those are different.",
    },
  ],
  discovery: {
    scientist: "François Viète",
    years: "1540–1603",
    fact: "Viète was a French lawyer who did mathematics in his spare time and even cracked secret codes for his king. In 1591 he began using letters for numbers in general, not just for one unknown: vowels for numbers to be found and consonants for numbers that are given. That made it possible to write one rule that works for every number, like the rules you just found.",
    formula: "count = (a × n) + b",
    formulaNote: "a is how much the pattern grows each step; b is what you add on so that step 1 comes out right.",
  },
  symbols: [
    { sym: "n", meaning: "a letter-number: the step number, which can be any counting number" },
    { sym: "3n", meaning: "3 × n: three times the step number" },
    { sym: "a, b", meaning: "in a rule (a × n) + b: a is the growth each step, b is the extra amount added" },
    { sym: "( )", meaning: "brackets: work out what is inside first; 4(n + 1) means 4 × (n + 1)" },
    { sym: "=", meaning: "equals: both sides give the same number" },
    { sym: "+, −, ×", meaning: "add, subtract and multiply" },
  ],
  ideas: [
    {
      title: "A letter-number stands for any number",
      text: "Instead of saying '4 for one square, 7 for two, 10 for three, and so on', we say 'for n squares you need 3n + 1 matchsticks'. The letter n can be 1, 2, 50 or 1000, and the rule works every time.",
      formula: "matchsticks = 3n + 1",
    },
    {
      title: "Find the rule from the jump",
      text: "Write the counts in a row and look at the jump from one step to the next. If it always grows by 3, the rule starts with 3n. Then check step 1: 3 × 1 = 3, but there are 4 matchsticks, so add 1.",
      formula: "4, 7, 10, 13: the jump is 3  →  3n + 1",
    },
    {
      title: "Big steps in one line",
      text: "Put the number in place of n and work it out, multiplying first. You can find step 100 or step 1000 without drawing a single matchstick.",
      formula: "n = 100:  (3 × 100) + 1 = 301",
    },
    {
      title: "Same value, different look",
      text: "Different ways of counting the same tiles give expressions that look different but are always equal. 4(n + 1) means four lots of (n + 1), which is 4n + 4. To test two expressions, try a few values of n: if even one gives a different answer, they are not the same.",
      formula: "4(n + 1) = 4n + 4;   2(n + 2) + 2n = 4n + 4",
    },
  ],
  challenge: {
    title: "Rule detectives",
    text: "Three new patterns you have not seen before. Step through each one, spot the jump, and write its rule. One star for each rule you crack.",
  },
  quiz: [
    {
      q: "A row of n squares uses 3n + 1 matchsticks. How many for 50 squares?",
      options: ["150", "151", "153", "200"],
      answer: 1,
      why: "(3 × 50) + 1 = 150 + 1 = 151. Not 200, because next-door squares share a side.",
    },
    {
      q: "A pattern has 5, 8, 11, 14 tiles in steps 1, 2, 3, 4. What is its rule?",
      options: ["n + 3", "3n + 5", "3n + 2", "5n"],
      answer: 2,
      why: "It grows by 3 each step, so 3n. Step 1 has 5 = 3 + 2, so the rule is 3n + 2. Check step 4: (3 × 4) + 2 = 14.",
    },
    {
      q: "An auto charges ₹25 to start and ₹15 for every km. Which expression gives the fare in rupees for k km?",
      options: ["25k + 15", "15k + 25", "40k", "15 + 25 + k"],
      answer: 1,
      why: "Each km adds ₹15, so 15k, and the ₹25 start charge is added once: 15k + 25. For 6 km: (15 × 6) + 25 = ₹115.",
    },
    {
      q: "Which expression is always equal to 4(n + 1)?",
      options: ["4n + 1", "n + 4", "4n + 4", "5n"],
      answer: 2,
      why: "4(n + 1) is four lots of n + 1: n + 1 + n + 1 + n + 1 + n + 1 = 4n + 4. Try n = 2: 4 × 3 = 12, and (4 × 2) + 4 = 12.",
    },
    {
      q: "Riya says 2(n + 3) and 2n + 3 are the same. What is true?",
      options: ["They are always the same", "2(n + 3) is always 3 more", "They are the same only when n = 3", "2n + 3 is always bigger"],
      answer: 1,
      why: "2(n + 3) = 2n + 6, which is 3 more than 2n + 3 for every n. Try n = 1: 2 × 4 = 8, but (2 × 1) + 3 = 5.",
    },
  ],
};
