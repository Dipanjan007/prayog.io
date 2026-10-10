/**
 * Class 9 · Ganita Manjari Part 2 (2026-27) · Chapter 13 "Two Variables, One Line".
 * A second lab under "Introduction to Linear Polynomials".
 * Covers linear equations in two variables ax + by = c, solution pairs (x, y),
 * why every solution lies on one straight line, the x- and y-intercepts,
 * whole-number solutions for counting problems, and two conditions met at the point
 * where two lines cross.
 * Ganita Manjari is new for 2026-27: recheck wording against the NCERT chapter PDF.
 */
import type { Puzzle } from "@/lib/sim/twovar";
import type { LessonDef } from "./types";

export const LESSON_ID = "c9-two-variables";

/** Challenge: three puzzles with two conditions each. Find the point on both lines, one star each. */
export const PUZZLES: Puzzle[] = [
  {
    name: "Stationery run",
    brief: "Riya spends exactly ₹120 on pens at ₹20 each and notebooks at ₹30 each. She brings home 5 things in all. How many pens (x) and notebooks (y) did she buy?",
    xName: "pens",
    yName: "notebooks",
    eqs: [
      { a: 20, b: 30, c: 120 },
      { a: 1, b: 1, c: 5 },
    ],
  },
  {
    name: "Canteen bill",
    brief: "The canteen bill is ₹70 for chai at ₹10 a cup and samosas at ₹15 each. There were 2 more cups of chai than samosas. How many cups of chai (x) and samosas (y)?",
    xName: "chai",
    yName: "samosas",
    eqs: [
      { a: 10, b: 15, c: 70 },
      { a: 1, b: -1, c: 2 },
    ],
  },
  {
    name: "Boundary hitter",
    brief: "A batter scored 40 runs only in fours and sixes, from 8 boundaries in all. How many fours (x) and sixes (y) did she hit?",
    xName: "fours",
    yName: "sixes",
    eqs: [
      { a: 4, b: 6, c: 40 },
      { a: 1, b: 1, c: 8 },
    ],
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "line-walker",
  classNum: 9,
  book: "Ganita Manjari Part 2",
  chapter: "Two Variables, One Line",
  title: "Pens, notebooks and one line",
  intro: {
    objective:
      "Hunt for pairs of numbers that make 2x + 3y = 12 true, and discover that every one of them sits on a single straight line. Then use two lines at once to crack shop bills and cricket scores.",
    learn: [
      "A linear equation in two variables looks like ax + by = c",
      "A solution is a pair (x, y), and there are infinitely many of them",
      "All the solutions lie on one straight line, and every point on the line is a solution",
      "Where the line meets the axes: (c ÷ a, 0) and (0, c ÷ b)",
      "When two conditions must both be true, the answer is where two lines cross",
    ],
    realLife:
      "Shopping with a fixed budget, splitting runs into fours and sixes, mixing two kinds of tickets at a fixed total, and planning a diet with two foods all give equations in two variables.",
    minutes: 20,
  },
  hook: {
    title: "₹120 at the stationery shop",
    text:
      "School reopens tomorrow. Pens cost ₹20 each and notebooks ₹30 each, and you have exactly ₹120. You could buy 6 pens. Or 4 notebooks. Or a mix. How many different mixes spend every rupee? Let's hunt for them on a grid.",
  },
  predict: {
    question:
      "Pens cost ₹20 and notebooks ₹30. In how many different ways can you spend exactly ₹120 on them? (Whole pens and notebooks only, and buying none of one kind is allowed.)",
    options: ["Only 1 way", "3 ways", "As many ways as you like"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:three",
      title: "Find three solutions",
      text: "The equation 2x + 3y = 12 is the ₹120 shop bill with every price divided by 10. Drag P, or use the buttons, to three different points that make it true.",
      found:
        "Points like (0, 4), (3, 2) and (6, 0) all worked. For (3, 2): (2 × 3) + (3 × 2) = 6 + 6 = 12, so 3 pens and 2 notebooks cost ₹120. (9, −2) fits the equation too, but not the shop: nobody can buy −2 notebooks.",
    },
    {
      id: "task:line",
      title: "Join the dots",
      text: "Tap Show the line. Do your solutions sit on it? Put P on the line, then move it to a point off the line and read ax + by.",
      found:
        "All the solutions sat on one straight line. Off the line, ax + by came out to some other number, not c. Every solution is a point on the line, and every point on the line is a solution, even ones with fractions like (1.5, 3).",
    },
    {
      id: "task:intercepts",
      title: "Where it meets the axes",
      text: "Put P where the line meets the x-axis. Then put it where the line meets the y-axis.",
      found:
        "On the x-axis y = 0, so for 2x + 3y = 12 we get 2x = 12 and x = 12 ÷ 2 = 6: the point (6, 0), all pens. On the y-axis x = 0, so 3y = 12 and y = 4: the point (0, 4), all notebooks. Two intercepts are the quickest way to draw the line.",
    },
    {
      id: "task:slide",
      title: "Change the bill",
      text: "Change only c, the total, and watch the line. Then change only a.",
      found:
        "Changing c slid the line without turning it, so the new line was parallel to the old one. Changing a turned the line about the point where it meets the y-axis, (0, c ÷ b), because only the x-intercept c ÷ a moved.",
    },
  ],
  discovery: {
    scientist: "René Descartes",
    years: "1596–1650",
    fact: "In his book La Géométrie (1637), Descartes showed that an equation in two unknowns can be drawn as a line or a curve on a grid, and a line can be written as an equation. He also started the habit of using x, y and z for unknown numbers and a, b and c for known ones, which is why our equation looks the way it does. The x-y grid is called the Cartesian plane after him.",
    formula: "ax + by = c",
    formulaNote: "A linear equation in two variables: every pair (x, y) that makes it true is a point on one straight line.",
  },
  symbols: [
    { sym: "x, y", meaning: "the two variables: here, how many pens and how many notebooks" },
    { sym: "a, b", meaning: "the numbers multiplying x and y, like the prices; a and b are not both 0" },
    { sym: "c", meaning: "the number on the other side, like the total bill" },
    { sym: "(x, y)", meaning: "a solution pair, and also the point x across and y up on the grid" },
    { sym: "(c ÷ a, 0)", meaning: "the x-intercept: where the line meets the x-axis" },
    { sym: "(0, c ÷ b)", meaning: "the y-intercept: where the line meets the y-axis" },
    { sym: "⇒", meaning: "so, or which gives" },
    { sym: "₹", meaning: "rupees" },
  ],
  ideas: [
    {
      title: "Equations in two variables",
      text: "An equation like 2x + 3y = 12 has two unknowns. A solution is a pair of numbers, one for x and one for y, that makes it true. (3, 2) is a solution because (2 × 3) + (3 × 2) = 12. (2, 3) is not: (2 × 2) + (3 × 3) = 13. The order in the pair matters.",
      formula: "ax + by = c   (a and b not both 0)",
    },
    {
      title: "Two variables, one line",
      text: "Pick any x and you can work out the y that goes with it, so there are infinitely many solutions. Plot them all and they make one straight line. Points on the line are solutions; points off it are not.",
      formula: "y = (c − ax) ÷ b",
    },
    {
      title: "The intercepts",
      text: "To draw the line fast, find where it meets the axes. Put y = 0 to get the x-intercept, and x = 0 to get the y-intercept, then join them. For 2x + 3y = 12 they are (6, 0) and (0, 4).",
      formula: "x-intercept (c ÷ a, 0);   y-intercept (0, c ÷ b)",
    },
    {
      title: "Counting things, and two conditions",
      text: "When x and y count pens or sixes, only whole numbers that are not negative make sense, so just a few points on the line work. If a second condition is given, like 5 things in all, it is a second line. The answer must be on both lines, so it is where they cross.",
      formula: "20x + 30y = 120  and  x + y = 5   ⇒   (x, y) = (3, 2)",
    },
  ],
  challenge: {
    title: "Two lines, one answer",
    text: "Each puzzle gives two conditions, so the grid shows two lines. Move P to the point that makes both equations true, then check it. One star per puzzle.",
  },
  quiz: [
    {
      q: "Which pair is a solution of 2x + 3y = 12?",
      options: ["(1, 3)", "(3, 2)", "(2, 3)", "(4, 1)"],
      answer: 1,
      why: "(2 × 3) + (3 × 2) = 6 + 6 = 12. The others give (2 × 1) + (3 × 3) = 11, (2 × 2) + (3 × 3) = 13 and (2 × 4) + (3 × 1) = 11.",
    },
    {
      q: "Where does the line 3x + 4y = 24 meet the x-axis?",
      options: ["(8, 0)", "(0, 6)", "(6, 0)", "(0, 8)"],
      answer: 0,
      why: "On the x-axis y = 0, so 3x = 24 and x = 24 ÷ 3 = 8. The line meets the y-axis at (0, 6), because 4y = 24 gives y = 6.",
    },
    {
      q: "A batter scores 30 runs only in fours and sixes, with 3 sixes. How many fours did she hit?",
      options: ["2", "3", "4", "6"],
      answer: 1,
      why: "4x + 6y = 30 with y = 3 gives 4x + 18 = 30, so 4x = 12 and x = 12 ÷ 4 = 3 fours.",
    },
    {
      q: "Which point is NOT on the line x + y = 5?",
      options: ["(2, 3)", "(5, 0)", "(−1, 6)", "(4, 2)"],
      answer: 3,
      why: "4 + 2 = 6, not 5. The others all add up to 5: 2 + 3, 5 + 0 and −1 + 6.",
    },
    {
      q: "How many solutions does 2x + 3y = 12 have?",
      options: ["Exactly one", "Exactly three", "Infinitely many", "None"],
      answer: 2,
      why: "Every point on its line is a solution, like (1.5, 3), (9, −2) or (0.75, 3.5). Only three of them, (0, 4), (3, 2) and (6, 0), use whole numbers that are not negative.",
    },
  ],
};
