/**
 * Class 9 level · Outliers (Maths) · "Fractals".
 * Goes past the NCERT book: the Sierpinski triangle (3ⁿ pieces, shaded area (3/4)ⁿ, holes
 * (3ⁿ − 1) ÷ 2) and the Koch snowflake (3 × 4ⁿ sides, a perimeter of 81 × (4/3)ⁿ cm that grows
 * without limit, and an area that never passes 8/5 of the starting triangle).
 */
import type { FractalRound } from "@/lib/sim/fractals";
import type { LessonDef } from "./types";

export const LESSON_ID = "xm-fractals";

/** Challenge: predict a count at a step before it is drawn. One star each. */
export const FRACTAL_ROUNDS: FractalRound[] = [
  {
    name: "The rangoli triangle",
    brief: "Meera is drawing a Sierpinski rangoli. How many shaded triangles will it have at step 6?",
    kind: "sier-triangles",
    step: 6,
  },
  {
    name: "The paper snowflake",
    brief: "Arjun cuts a Koch snowflake for the school window. How many sides will it have at step 5?",
    kind: "koch-sides",
    step: 5,
  },
  {
    name: "Holes in the rangoli",
    brief: "Each step cuts a hole out of every shaded triangle. How many holes are there altogether at step 5?",
    kind: "sier-holes",
    step: 5,
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "fractal-finder",
  classNum: 9,
  book: "Outliers",
  chapter: "Fractals",
  title: "Shapes that never end",
  intro: {
    objective:
      "Cut holes in a triangle again and again, and grow a snowflake bump by bump. Count the pieces at each step, and find a shape whose edge grows without limit while its area stays small.",
    learn: [
      "A fractal is made of smaller copies of itself",
      "The Sierpinski triangle has 3ⁿ shaded pieces at step n, and its shaded area shrinks towards 0",
      "The Koch snowflake has 3 × 4ⁿ sides, and its perimeter grows by 4/3 every step",
      "A shape can have an edge longer than any length you name, yet an area that never passes a fixed size",
    ],
    realLife:
      "Fern leaves, cauliflower and broccoli, river networks, lightning and coastlines all repeat smaller copies of themselves. Some Indian temples, like the Kandariya Mahadeva temple at Khajuraho, build a big tower out of many smaller copies of the same tower.",
    minutes: 20,
  },
  hook: {
    title: "The rangoli that never ends",
    text:
      "Meera draws a triangle for her Diwali rangoli, then cuts out the middle to leave 3 smaller triangles. She does the same to each of those, and again, and again. Her friend Arjun starts with a triangle too, but he adds a little triangle bump to the middle of every side. If they could carry on forever, what would happen to their shapes? Let's find out.",
  },
  predict: {
    question: "Arjun adds a bump to every side of his snowflake, step after step, forever. What happens to the length of its edge?",
    options: ["It settles at about twice the start", "It grows without limit", "It shrinks to zero"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:sier",
      title: "Triangles inside triangles",
      text: "In Sierpinski, take the triangle step by step to step 5. Watch the number of shaded triangles and the shaded area.",
      found:
        "Each step turned every triangle into 3, so the count went 1, 3, 9, 27, 81, 243. But each step also kept only 3/4 of the shaded area, so at step 5 only about 24% of the triangle was still shaded.",
    },
    {
      id: "task:koch",
      title: "Grow a snowflake",
      text: "Switch to Koch. The starting triangle has sides of 27 cm. Take it to step 4 and watch the sides and the perimeter.",
      found:
        "Every step turned each side into 4 sides, each one third as long. So the sides went 3, 12, 48, 192, 768, and the perimeter went 81, 108, 144, 192, 256 cm: 4/3 times bigger every step.",
    },
    {
      id: "task:limit",
      title: "A fence with no end",
      text: "Keep going in Koch until the perimeter is more than 10 m (1,000 cm). Keep an eye on the area as well.",
      found:
        "At step 9 the edge was about 1,079 cm, more than 10 m, and it keeps growing without limit. But the area only crept from about 488 cm² to about 505 cm². It never passes 505.07 cm², 8/5 of the starting triangle.",
    },
  ],
  discovery: {
    scientist: "Helge von Koch",
    years: "1870–1924",
    fact:
      "Helge von Koch was a Swedish mathematician. In 1904 he described his snowflake curve to show something that surprised mathematicians: an unbroken curve with no gaps that is so crinkly that at no point on it can you say which way it is heading. The name fractal came much later, from Benoit Mandelbrot in 1975.",
    formula: "perimeter at step n = 3s × (4/3)ⁿ",
    formulaNote: "Every step multiplies the edge by 4/3, so it grows without limit. With s = 27 cm, it passes 10 m at step 9.",
  },
  symbols: [
    { sym: "n", meaning: "the step number: 0 is the starting triangle" },
    { sym: "3ⁿ, 4ⁿ", meaning: "3 or 4 multiplied by itself n times; 3⁴ = 3 × 3 × 3 × 3 = 81" },
    { sym: "(3/4)ⁿ, (4/3)ⁿ", meaning: "a fraction multiplied by itself n times; (3/4)² = 9/16" },
    { sym: "s", meaning: "the side of the starting triangle (27 cm for the snowflake)" },
    { sym: "A", meaning: "the area of the starting triangle, about 315.67 cm² for a side of 27 cm" },
    { sym: "cm, cm²", meaning: "centimetres for lengths, square centimetres for areas" },
    { sym: "≈", meaning: "is about equal to" },
    { sym: "+, −, ×, ÷", meaning: "add, take away, multiply, divide" },
  ],
  ideas: [
    {
      title: "Copies of copies",
      text: "A fractal is built from smaller copies of itself. In the Sierpinski triangle each step swaps every shaded triangle for 3 half-size copies. So the count is multiplied by 3 every step.",
      formula: "triangles at step n = 3ⁿ;   step 4: 3⁴ = 81",
    },
    {
      title: "The area drains away",
      text: "Each step cuts out the middle quarter of every shaded triangle, so 3/4 of the shading is left. Do that again and again and the shaded area heads to 0, even though the triangle never falls apart. The holes add up: 1 + 3 + 9 + ... after n steps.",
      formula: "shaded area = (3/4)ⁿ of the start;   holes = (3ⁿ − 1) ÷ 2",
    },
    {
      title: "An edge with no end",
      text: "In the Koch snowflake, every side becomes 4 sides that are each 1/3 as long. The edge gets 4/3 times longer at every step, so it grows past any length you can name: 10 m, 1 km, the distance to the Moon.",
      formula: "sides = 3 × 4ⁿ;   perimeter = 81 × (4/3)ⁿ cm;   step 4: 81 × (256/81) = 256 cm",
    },
    {
      title: "A field that stays small",
      text: "Each step adds new little triangles, but each batch of new area is only 4/9 of the batch before. Like the endless sums 1/2 + 1/4 + 1/8 + ..., these shrinking extras add up to a fixed amount. The snowflake always fits inside a circle round the starting triangle.",
      formula: "area → (8/5) × A ≈ 1.6 × 315.67 ≈ 505.07 cm²",
    },
  ],
  challenge: {
    title: "Count before you draw",
    text: "Predict three counts at steps you have not drawn yet. Type your answer and check it. One star per count.",
  },
  quiz: [
    {
      q: "How many shaded triangles does the Sierpinski triangle have at step 3?",
      options: ["9", "12", "27", "81"],
      answer: 2,
      why: "Each step multiplies the count by 3: 3³ = 3 × 3 × 3 = 27.",
    },
    {
      q: "How many sides does the Koch snowflake have at step 2?",
      options: ["24", "48", "36", "64"],
      answer: 1,
      why: "Each side becomes 4 sides every step: 3 × 4² = 3 × 16 = 48.",
    },
    {
      q: "A Koch snowflake starts as a triangle with sides of 9 cm. What is its perimeter after step 1?",
      options: ["27 cm", "36 cm", "45 cm", "54 cm"],
      answer: 1,
      why: "The start is 3 × 9 = 27 cm. Each step multiplies the perimeter by 4/3: 27 × (4/3) = 36 cm. (12 sides of 3 cm each.)",
    },
    {
      q: "What fraction of the starting Sierpinski triangle is still shaded after step 2?",
      options: ["1/2", "3/4", "9/16", "1/4"],
      answer: 2,
      why: "Each step keeps 3/4 of the shading: (3/4)² = 3/4 × 3/4 = 9/16.",
    },
    {
      q: "You keep growing the Koch snowflake forever. Which is true?",
      options: [
        "Its edge and its area both grow without limit",
        "Its edge grows without limit, but its area never passes 8/5 of the starting triangle",
        "Its edge settles at 4/3 of the start",
        "Its area shrinks to 0",
      ],
      answer: 1,
      why: "The perimeter is multiplied by 4/3 every step, so it never stops growing. The new area added each step is only 4/9 of the last batch, so the area settles at (8/5) × A.",
    },
  ],
};
