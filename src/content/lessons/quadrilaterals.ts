/**
 * Class 8 · Ganita Prakash · Chapter "Quadrilaterals".
 * Second lab beside Area. Drag four corners on a pegboard and watch the sides,
 * angles and diagonals live. Covers the angle sum of 360° (two triangles), the
 * properties of parallelograms, rectangles, rhombuses, squares, kites and
 * trapeziums, and naming a shape by its properties. Challenge: make shapes to order.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { Order } from "@/lib/sim/quad";
import type { LessonDef } from "./types";

export const LESSON_ID = "c8-quadrilaterals";

/** Challenge: three shapes to make, one star each. */
export const ORDERS: Order[] = [
  {
    name: "Floor tile",
    brief: "The tile shop wants a slanting tile: a parallelogram that is not a rectangle or a rhombus, with one side exactly 5 units long.",
    shape: "parallelogram",
    side: 5,
  },
  {
    name: "Uttarayan kite",
    brief: "For the Makar Sankranti kite festival, make a kite (patang) whose two cross-sticks, the diagonals, are exactly 4 and 6 units long.",
    shape: "kite",
    diagonals: [4, 6],
  },
  {
    name: "Window frame",
    brief: "The carpenter's window must be a rectangle (not a square). A brace fixed corner to corner, along each diagonal, must be exactly 5 units long.",
    shape: "rectangle",
    diagonals: [5, 5],
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "corner-puller",
  classNum: 8,
  book: "Ganita Prakash",
  chapter: "Quadrilaterals",
  title: "Four corners, many names",
  intro: {
    objective:
      "Drag four corners on a pegboard and watch the sides, angles and diagonals change. Find the one total that never changes, and learn to name a shape from its properties.",
    learn: [
      "The four angles of any quadrilateral add up to 360°",
      "A parallelogram has opposite sides parallel and equal, and its diagonals cut each other in half",
      "Rectangles, rhombuses and squares are special parallelograms",
      "Kites and trapeziums, and how their diagonals and sides behave",
    ],
    realLife:
      "Doors, windows, tiles, kites at Uttarayan, a cricket pitch, the folding gate of a shop and the scissor lift of a truck are all quadrilaterals. Carpenters check a frame is a true rectangle by measuring its two diagonals.",
    minutes: 20,
  },
  hook: {
    title: "The carpenter's trick",
    text:
      "A carpenter has made a door frame. All four sides look right, but is it a true rectangle, or slightly slanted? She does not use a protractor. She just measures from corner to corner, both ways, with a tape. How can that tell her? Pull some corners and find out.",
  },
  predict: {
    question: "Draw any four-sided shape: a square, a kite or a lopsided one. Add up its four inside angles. The total:",
    options: ["Depends on the shape", "Is always 360°", "Is always 180°"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:sum",
      title: "The total that never changes",
      text: "Drag the corners (or pick a corner and use Across and Up) to make three quite different quadrilaterals. Watch the angle sum.",
      found:
        "The angles changed every time, but they always added up to exactly 360°. If you pushed a corner inwards to make a dent, one angle went past 180° and the total was still 360°.",
    },
    {
      id: "task:diag",
      title: "Why 360°?",
      text: "Turn on Show diagonals, with a shape that has no dent.",
      found:
        "One diagonal cuts the quadrilateral into two triangles. The angles of each triangle add up to 180°, and together they make up the four corners, so the total is 180° + 180° = 360°.",
    },
    {
      id: "task:rect",
      title: "A rectangle",
      text: "Make a rectangle that is not a square.",
      found:
        "All four angles are 90°, and opposite sides are parallel and equal. Its two diagonals are equal and cut each other in half. That is the carpenter's trick: equal diagonals in a parallelogram mean a true rectangle.",
    },
    {
      id: "task:rhombus",
      title: "A rhombus",
      text: "Make a rhombus that is not a square: all four sides equal, but no right angles. (Tip: put its diagonals across and up.)",
      found:
        "All four sides are equal and opposite sides are parallel, so it is a parallelogram too. Its diagonals are not equal, but they cut each other in half at 90°.",
    },
    {
      id: "task:kite",
      title: "A kite",
      text: "Make a kite: two pairs of equal sides next to each other, but not a rhombus.",
      found:
        "Two neighbouring sides are equal, and the other two are equal. One diagonal cuts the other in half at 90°, just like the two sticks of a paper kite.",
    },
  ],
  discovery: {
    scientist: "Brahmagupta",
    years: "598–668",
    fact: "In 628 CE Brahmagupta found the area of any quadrilateral whose four corners lie on one circle, using only its four sides. Every rectangle is such a shape. Shrink one side to zero and his rule turns into the rule for the area of a triangle from its three sides.",
    formula: "A = √((s − a) × (s − b) × (s − c) × (s − d))",
    formulaNote: "Here s is half the perimeter, s = (a + b + c + d) ÷ 2. For a 3 × 4 rectangle, s = 7 and A = √(4 × 3 × 4 × 3) = √144 = 12.",
  },
  symbols: [
    { sym: "A, B, C, D", meaning: "the four corners (vertices), named in order around the shape" },
    { sym: "AB", meaning: "the side from corner A to corner B (AC and BD are the diagonals)" },
    { sym: "∠A", meaning: "the inside angle at corner A" },
    { sym: "°", meaning: "degrees: a full turn is 360°, a right angle is 90°" },
    { sym: "∥", meaning: "is parallel to: the two lines never meet" },
    { sym: "x", meaning: "an unknown angle, in degrees" },
    { sym: "a, b, c, d", meaning: "in Brahmagupta's rule: the four side lengths" },
    { sym: "s", meaning: "half the perimeter: (a + b + c + d) ÷ 2" },
    { sym: "√", meaning: "square root: the number that, multiplied by itself, gives what is under the sign" },
    { sym: "×, ÷", meaning: "times, divided by" },
  ],
  ideas: [
    {
      title: "Angle sum: 360°",
      text: "A diagonal splits any quadrilateral into two triangles. Each triangle's angles add to 180°, so the four angles of a quadrilateral always add to 360°.",
      formula: "∠A + ∠B + ∠C + ∠D = 180° + 180° = 360°",
    },
    {
      title: "Parallelogram",
      text: "Both pairs of opposite sides are parallel. Then opposite sides are equal, opposite angles are equal, neighbouring angles add to 180°, and the diagonals cut each other in half.",
      formula: "AB ∥ DC, AD ∥ BC;  ∠A + ∠B = 180°;  ∠A = ∠C",
    },
    {
      title: "Rectangle, rhombus, square",
      text: "A rectangle is a parallelogram with a right angle: all its angles are 90° and its diagonals are equal. A rhombus is a parallelogram with all sides equal: its diagonals cross at 90°. A square is both, so it has every one of these properties.",
    },
    {
      title: "Kite and trapezium",
      text: "A kite has two pairs of equal sides next to each other; one diagonal cuts the other in half at 90°. A trapezium has a pair of parallel sides. Name a shape by its most exact name, and remember it may have other names too: a square is also a rectangle and a rhombus.",
    },
  ],
  challenge: {
    title: "Shapes to order",
    text: "A tile shop, a kite maker and a carpenter each need a shape. The name stays hidden until you check the shape. One star per order.",
  },
  quiz: [
    {
      q: "Three angles of a quadrilateral are 75°, 90° and 110°. What is the fourth angle?",
      options: ["85°", "95°", "105°", "75°"],
      answer: 0,
      why: "The four angles add to 360°. So the fourth is 360° − (75° + 90° + 110°) = 360° − 275° = 85°.",
    },
    {
      q: "Which of these is always true for a rhombus?",
      options: ["Its diagonals are equal", "All its angles are 90°", "Its diagonals cross at right angles", "It has only one pair of parallel sides"],
      answer: 2,
      why: "A rhombus has all four sides equal, and its diagonals cut each other in half at 90°. Its diagonals are equal and its angles are 90° only when it is a square.",
    },
    {
      q: "The diagonals of a quadrilateral are equal and cut each other in half. The quadrilateral must be a:",
      options: ["Rhombus", "Rectangle", "Kite", "Trapezium"],
      answer: 1,
      why: "Diagonals that cut each other in half make a parallelogram. A parallelogram with equal diagonals is a rectangle. (A square is a rectangle too.)",
    },
    {
      q: "The angles of a quadrilateral are x, 2x, 3x and 4x. What is the largest angle?",
      options: ["120°", "144°", "160°", "36°"],
      answer: 1,
      why: "x + 2x + 3x + 4x = 10x = 360°, so x = 360° ÷ 10 = 36°. The largest is 4x = 4 × 36° = 144°.",
    },
    {
      q: "In a parallelogram ABCD, ∠A = 70°. What is ∠B?",
      options: ["70°", "110°", "90°", "290°"],
      answer: 1,
      why: "Neighbouring angles of a parallelogram add to 180°, so ∠B = 180° − 70° = 110°. Then ∠C = 70° and ∠D = 110°, and all four add to 360°.",
    },
  ],
};
