/**
 * Class 10 · Mathematics · Chapter 4 "Quadratic Equations".
 * Covers the curve y = ax² + bx + c and its roots, the discriminant b² − 4ac
 * (two, one or no real roots), Sridharacharya's quadratic formula, and area
 * problems such as a fenced garden and a rangoli rectangle.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { RootRound } from "@/lib/sim/quadratics";
import type { LessonDef } from "./types";

export const LESSON_ID = "c10-quadratics";

/** Challenge: three curves to build from their roots, one star each. */
export const ROOT_ROUNDS: RootRound[] = [
  {
    name: "Two bounce marks",
    brief: "Build a curve that crosses the x-axis at x = 2 and at x = 5. Set a, b and c, then check.",
    roots: [2, 5],
  },
  {
    name: "Rangoli rectangle",
    brief: "A rangoli rectangle is 3 m longer than it is wide, and covers 18 m². If its breadth is x, then x(x + 3) = 18. Build the curve whose roots solve it, and read off the breadth.",
    roots: [3, -6],
  },
  {
    name: "Just touching",
    brief: "Build a curve that touches the x-axis at x = 3 and nowhere else. Hint: b² − 4ac must be 0.",
    roots: [3, 3],
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "root-ranger",
  classNum: 10,
  book: "Mathematics",
  chapter: "Quadratic Equations",
  title: "Where the curve meets the ground",
  intro: {
    objective:
      "Bend the curve y = ax² + bx + c with three sliders and find where it meets the x-axis. Then fence a garden with 40 m of wire and find out why some areas are possible and others are not.",
    learn: [
      "The roots of ax² + bx + c = 0 are where the curve y = ax² + bx + c meets the x-axis",
      "The discriminant b² − 4ac tells you if there are two, one or no real roots",
      "Sridharacharya's formula x = (−b ± √(b² − 4ac)) ÷ (2a)",
      "Turning an area problem into a quadratic equation",
    ],
    realLife:
      "Builders and farmers use quadratics to plan plots of a given area. The path of a cricket ball, the curve of a fountain jet and the arch of many bridges are parabolas too.",
    minutes: 25,
  },
  hook: {
    title: "40 metres of wire",
    text:
      "Your grandmother wants a rectangular vegetable garden behind the house. She has exactly 40 m of fencing wire. She asks you to make the garden 110 m² so it fits all her tomato plants. You try 10 by 10, then 12 by 8, then 15 by 5. Can it be done? One equation will tell you before you even pick up the wire.",
  },
  predict: {
    question: "With exactly 40 m of fence around a rectangle, can you enclose 110 m²?",
    options: ["Yes, with a long thin rectangle", "Yes, with a square", "No, it is impossible"],
    answer: 2,
  },
  tasks: [
    {
      id: "task:roots",
      title: "Find the roots",
      text: "In Curve, set a = 1, b = −5 and c = 6. Where does the curve meet the x-axis?",
      found:
        "It met the x-axis at x = 2 and x = 3. Check: 2² − (5 × 2) + 6 = 4 − 10 + 6 = 0, and 3² − (5 × 3) + 6 = 9 − 15 + 6 = 0. These are the roots of x² − 5x + 6 = 0.",
    },
    {
      id: "task:disc",
      title: "Two, one or none",
      text: "Change c (and b if you like) to make the curve cross the x-axis twice, just touch it once, and miss it completely. Watch b² − 4ac each time.",
      found:
        "When b² − 4ac was positive the curve crossed twice, when it was 0 it just touched, and when it was negative it missed the x-axis. For example, with a = 1 and b = −4 it touches at c = 4, because (−4)² − (4 × 1 × 4) = 16 − 16 = 0.",
    },
    {
      id: "task:garden",
      title: "A 96 m² garden",
      text: "Switch to Garden. The fence is 40 m, so breadth + length = 20 m. Find both breadths that give an area of 96 m².",
      found:
        "Breadth 8 m (length 12 m) and breadth 12 m (length 8 m) both give 96 m². They are the two roots of x(20 − x) = 96, which is x² − 20x + 96 = 0. It is the same garden turned round.",
    },
    {
      id: "task:square",
      title: "Too big to fence",
      text: "Pick the 100 m² target and find the breadth that gives it. Then pick 110 m² and watch b² − 4ac.",
      found:
        "Only a 10 m × 10 m square gives 100 m²: x² − 20x + 100 = 0 has b² − 4ac = 400 − 400 = 0, so just one root. For 110 m², b² − 4ac = 400 − 440 = −40 is negative: no rectangle can do it. Grandmother needs more wire.",
    },
  ],
  discovery: {
    scientist: "Sridharacharya (Sridhara)",
    years: "about 870–930 CE",
    fact: "Sridhara wrote the Patiganita and the Trishatika, books of practical arithmetic. He solved quadratic equations by completing the square. His own algebra book is lost, but we know his rule because Bhaskara II quoted it in his Bijaganita more than 200 years later. That is why NCERT calls the quadratic formula Sridharacharya's formula.",
    formula: "x = (−b ± √(b² − 4ac)) ÷ (2a)",
    formulaNote: "Put in a, b and c from ax² + bx + c = 0. The + sign gives one root and the − sign gives the other.",
  },
  symbols: [
    { sym: "x", meaning: "the unknown number; on the graph, the position along the horizontal axis" },
    { sym: "y", meaning: "the height of the curve above (or below) the x-axis" },
    { sym: "a, b, c", meaning: "the fixed numbers (coefficients) in ax² + bx + c; a cannot be 0" },
    { sym: "ax²", meaning: "a × x × x" },
    { sym: "²", meaning: "squared: a number times itself; 5² = 5 × 5 = 25" },
    { sym: "√", meaning: "square root: the number that times itself gives this one; √16 = 4" },
    { sym: "±", meaning: "plus or minus: do the sum once with + and once with − to get two answers" },
    { sym: "b² − 4ac", meaning: "the discriminant: tells you how many real roots there are" },
    { sym: "root", meaning: "a value of x that makes ax² + bx + c equal to 0" },
    { sym: "m, m²", meaning: "metres for lengths, square metres for areas" },
  ],
  ideas: [
    {
      title: "Roots are where the curve meets the x-axis",
      text: "The graph of y = ax² + bx + c is a U-shaped curve called a parabola (upside down when a is negative). On the x-axis y = 0, so the x-values where the curve meets the axis are exactly the solutions of ax² + bx + c = 0.",
      formula: "y = ax² + bx + c;   root: ax² + bx + c = 0",
    },
    {
      title: "Sridharacharya's formula",
      text: "Any quadratic equation can be solved with one formula. Work out b² − 4ac first (brackets first!), take its square root, then add it to −b for one root and take it away for the other. Divide each by 2a.",
      formula: "x = (−b ± √(b² − 4ac)) ÷ (2a)",
    },
    {
      title: "The discriminant decides",
      text: "The number under the square root sign, b² − 4ac, is called the discriminant. If it is positive there are two different roots. If it is 0, the two roots are equal and the curve just touches the axis. If it is negative there is no real square root, so there are no real roots.",
      formula: "b² − 4ac > 0: two roots;   b² − 4ac = 0: two equal roots;   b² − 4ac < 0: no real roots",
    },
    {
      title: "Area problems become quadratics",
      text: "With 40 m of fence, breadth + length = 20 m, so length = 20 − x. Area = x(20 − x). Asking for an area A gives x² − 20x + A = 0. Its discriminant 400 − 4A is negative when A is more than 100, so 100 m² (a square) is the most you can fence. If you know the roots p and q, the equation is (x − p)(x − q) = 0.",
      formula: "x(20 − x) = A  →  x² − 20x + A = 0;   (x − p)(x − q) = x² − (p + q)x + pq",
    },
  ],
  challenge: {
    title: "Root makers",
    text: "Three curves to build from their roots: two bounce marks, a rangoli rectangle and a curve that only just touches. Set a, b and c and check. One star each.",
  },
  quiz: [
    {
      q: "How many real roots does 2x² − 4x + 3 = 0 have?",
      options: ["Two", "One", "None", "Three"],
      answer: 2,
      why: "b² − 4ac = (−4)² − (4 × 2 × 3) = 16 − 24 = −8. It is negative, so there are no real roots.",
    },
    {
      q: "What are the roots of x² − 7x + 12 = 0?",
      options: ["3 and 4", "−3 and −4", "2 and 6", "1 and 12"],
      answer: 0,
      why: "b² − 4ac = 49 − 48 = 1. x = (7 ± √1) ÷ 2 = (7 ± 1) ÷ 2, so x = 4 or x = 3. Check: 3 + 4 = 7 and 3 × 4 = 12.",
    },
    {
      q: "For which value of k does x² − 6x + k = 0 have two equal roots?",
      options: ["3", "6", "9", "36"],
      answer: 2,
      why: "Equal roots need b² − 4ac = 0: (−6)² − (4 × 1 × k) = 36 − 4k = 0, so k = 9. Then x² − 6x + 9 = (x − 3)².",
    },
    {
      q: "A rectangular park is 5 m longer than it is wide, and its area is 84 m². How wide is it?",
      options: ["6 m", "7 m", "12 m", "14 m"],
      answer: 1,
      why: "x(x + 5) = 84 gives x² + 5x − 84 = 0. b² − 4ac = 25 + 336 = 361 = 19². x = (−5 + 19) ÷ 2 = 7. The other root, −12, cannot be a length. Check: 7 × 12 = 84.",
    },
    {
      q: "Which equation has roots 2 and −3?",
      options: ["x² − x − 6 = 0", "x² + x − 6 = 0", "x² + 5x + 6 = 0", "x² − 5x − 6 = 0"],
      answer: 1,
      why: "(x − 2)(x + 3) = x² + 3x − 2x − 6 = x² + x − 6. Check: 2² + 2 − 6 = 0 and (−3)² + (−3) − 6 = 9 − 3 − 6 = 0.",
    },
  ],
};
