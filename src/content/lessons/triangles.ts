/**
 * Class 7 · Ganita Prakash (Part 1) · Chapter 7 "A Tale of Three Intersecting Lines".
 * Covers which three lengths make a triangle (the triangle inequality), the angle sum
 * property and naming triangles by their sides and their angles.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { TriangleOrder } from "@/lib/sim/triangle";
import type { LessonDef } from "./types";

export const LESSON_ID = "c7-triangles";

/** Challenge: three triangles to order, built by dragging the corners. */
export const TRIANGLE_ORDERS: TriangleOrder[] = [
  {
    name: "A set square",
    brief: "The carpenter's set square has a right angle and two equal sides. Make its angles: 45°, 45° and 90°.",
    angles: [45, 45, 90],
  },
  {
    name: "A camping tent",
    brief: "The tent's front is isosceles, with a 40° angle at the top. What must the two bottom angles be? Make it.",
    angles: [40, 70, 70],
  },
  {
    name: "The other set square",
    brief: "The second set square in your geometry box has angles of 30°, 60° and 90°. Make it.",
    angles: [30, 60, 90],
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "triangle-maker",
  classNum: 7,
  book: "Ganita Prakash",
  chapter: "A Tale of Three Intersecting Lines",
  title: "Three sticks make a triangle",
  intro: {
    objective:
      "Join sticks end to end to find which lengths make a triangle, then stretch a triangle any way you like and watch its three angles.",
    learn: [
      "Three lengths make a triangle only when each is shorter than the other two put together",
      "The three angles of every triangle add up to 180°",
      "Naming triangles by their sides: equilateral, isosceles and scalene",
      "Naming triangles by their angles: acute, right and obtuse",
    ],
    realLife:
      "Bridges, electricity towers, bicycle frames and roof trusses are built from triangles, because three fixed sticks can only make one shape. The set squares in your geometry box are triangles too.",
    minutes: 15,
  },
  hook: {
    title: "The wobbly cycle stand",
    text:
      "You are building a stand for your cycle from bamboo sticks. A square frame wobbles and folds flat, but a triangle stays stiff. Your friend grabs three sticks: 3 cm, 4 cm and 8 cm long on the plan. \"Any three sticks make a triangle,\" she says. Is she right?",
  },
  predict: {
    question: "You have three sticks: 3 cm, 4 cm and 8 cm. Can you join them end to end to make a triangle?",
    options: ["Yes, any three sticks make a triangle", "No, the two short sticks cannot meet", "Yes, but only a right-angled one"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:gap",
      title: "Sticks that won't meet",
      text: "In Sticks, change the lengths until the two shorter sticks cannot reach each other at all.",
      found:
        "When the two shorter sticks together were shorter than the longest one, they could not meet, however you turned them. 3 + 4 = 7, and 7 is less than 8, so 3, 4 and 8 can never make a triangle.",
    },
    {
      id: "task:flat",
      title: "Just touching",
      text: "Now find three lengths where the two shorter sticks add up exactly to the longest one.",
      found:
        "The sticks met, but only by lying flat along the long stick. There is no space inside, so it is not a triangle. Each side must be shorter than the other two put together.",
    },
    {
      id: "task:equi",
      title: "Three equal sides",
      text: "Make all three sticks the same length. Look at the three angles.",
      found: "That is an equilateral triangle. Every angle came out as 60°, whatever the length, and 60° + 60° + 60° = 180°.",
    },
    {
      id: "task:sum",
      title: "Stretch it any way",
      text: "Switch to Corners. Drag the corners to make a triangle with a right angle (90°), then one with an obtuse angle (more than 90°). Watch the total.",
      found:
        "However you stretched it, ∠A + ∠B + ∠C stayed 180°. That is why a triangle can have only one right angle or one obtuse angle: two of them would already use up 180° or more.",
    },
  ],
  discovery: {
    scientist: "Euclid",
    years: "about 300 BCE",
    fact: "Euclid taught mathematics in Alexandria, Egypt. His book, the Elements, was used to teach geometry for over 2,000 years. In it he proved that any two sides of a triangle together are longer than the third, and that the three angles add up to two right angles.",
    formula: "∠A + ∠B + ∠C = 180°",
    formulaNote: "The three angles inside any triangle always add up to 180°, a straight line.",
  },
  symbols: [
    { sym: "a, b, c", meaning: "the lengths of the three sides, in cm" },
    { sym: "∠A", meaning: "the angle at corner A, in degrees" },
    { sym: "°", meaning: "degrees; a full turn is 360° and a straight line is 180°" },
    { sym: ">", meaning: "is greater than; 7 > 5 means 7 is bigger than 5" },
    { sym: "<", meaning: "is less than; 5 < 7 means 5 is smaller than 7" },
  ],
  ideas: [
    {
      title: "Which lengths make a triangle?",
      text: "Each side of a triangle is shorter than the other two put together. A quick check: add the two shorter lengths. If they come to more than the longest one, the sticks make a triangle. If they are equal, the sticks lie flat. If they are less, they cannot meet.",
      formula: "a + b > c,   b + c > a,   c + a > b",
    },
    {
      title: "The angle sum property",
      text: "Cut a triangle out of paper, tear off its three corners and put them side by side. They always fit exactly along a straight line. So the three angles of a triangle add up to 180°, and if you know two of them you can find the third.",
      formula: "∠A + ∠B + ∠C = 180°;   third angle = 180° − (first + second)",
    },
    {
      title: "Names from the sides",
      text: "Equilateral: all three sides equal, and every angle is 60°. Isosceles: two sides equal, and the two angles opposite them are equal too. Scalene: no two sides are equal.",
    },
    {
      title: "Names from the angles",
      text: "Acute: every angle is less than 90°. Right: one angle is exactly 90°. Obtuse: one angle is more than 90°. A triangle can never have two right angles or two obtuse angles.",
    },
  ],
  challenge: {
    title: "Triangles to order",
    text: "A carpenter needs three triangles. Drag the corners until the angles match each order to within 2°. One star per triangle.",
  },
  quiz: [
    {
      q: "Which three lengths can make a triangle?",
      options: ["2 cm, 3 cm, 6 cm", "4 cm, 5 cm, 9 cm", "5 cm, 6 cm, 10 cm", "1 cm, 7 cm, 9 cm"],
      answer: 2,
      why: "5 + 6 = 11, which is more than 10. In the others the two shorter sides add up to 5, 9 and 8, which are not more than the longest side.",
    },
    {
      q: "Two angles of a triangle are 65° and 45°. What is the third angle?",
      options: ["60°", "70°", "80°", "110°"],
      answer: 1,
      why: "Third angle = 180° − (65° + 45°) = 180° − 110° = 70°.",
    },
    {
      q: "Can a triangle have two right angles?",
      options: ["Yes, if it is big enough", "No, the third angle would have to be 0°", "Only if it is isosceles", "Only if it is equilateral"],
      answer: 1,
      why: "90° + 90° = 180° already, which leaves 0° for the third corner. The two sides would be parallel and never meet.",
    },
    {
      q: "An isosceles triangle has a 40° angle between its two equal sides. What is each of the other two angles?",
      options: ["40°", "50°", "70°", "140°"],
      answer: 2,
      why: "The two other angles are equal and share what is left: (180° − 40°) ÷ 2 = 140° ÷ 2 = 70°.",
    },
    {
      q: "Two sides of a triangle are 5 cm and 8 cm. Which whole number can the third side NOT be?",
      options: ["4 cm", "10 cm", "12 cm", "13 cm"],
      answer: 3,
      why: "The third side must be more than 8 − 5 = 3 cm and less than 5 + 8 = 13 cm. With 13 cm the two short sticks would lie flat.",
    },
  ],
};
