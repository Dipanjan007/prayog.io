/**
 * Class 8 · Ganita Prakash Part 2 · Chapter "Area".
 * A geoboard lab: counting squares, shearing a rectangle into a parallelogram
 * with the same base and height (same area), a triangle as half a
 * parallelogram, and a trapezium as half of a parallelogram made from two
 * copies. Challenge: mark out land plots of a given area.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { Plot } from "@/lib/sim/area";
import type { LessonDef } from "./types";

export const LESSON_ID = "c8-area";

/** Challenge: three plots to mark out, one star each. */
export const PLOTS: Plot[] = [
  {
    name: "Ramu's leaning field",
    brief: "Ramu's field lies between two straight canals 4 units apart, so its height is 4. It must be a leaning parallelogram (not a rectangle) with an area of exactly 28 square units.",
    kind: "shear",
    area: 28,
    fixed: { h: 4 },
    lean: true,
  },
  {
    name: "Corner plot by the road",
    brief: "A triangular plot has 8 units of frontage along the road (its base). The panchayat says it must be exactly 20 square units. How far back must the top corner go?",
    kind: "triangle",
    area: 20,
    fixed: { b: 8 },
  },
  {
    name: "Paddy field between two canals",
    brief: "Grandma's paddy field is a trapezium. Its sides along the two parallel canals are 6 units (bottom) and 4 units (top). It must be exactly 25 square units. How far apart are the canals?",
    kind: "trapezium",
    area: 25,
    fixed: { a: 6, c: 4 },
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "plot-planner",
  classNum: 8,
  book: "Ganita Prakash Part 2",
  chapter: "Area",
  title: "Push it over, keep the land",
  intro: {
    objective:
      "Stretch rubber bands on a geoboard. Push a rectangle over into a parallelogram, cut a parallelogram into two triangles and build a trapezium, and see why base and height are all you need to find the area.",
    learn: [
      "Area is the number of unit squares a shape covers",
      "A parallelogram has the same area as a rectangle with the same base and height: b × h",
      "A triangle is half of a parallelogram: (b × h) ÷ 2",
      "A trapezium is half of a parallelogram made from two copies: ((p + q) × h) ÷ 2",
    ],
    realLife:
      "Land in villages and cities is bought and sold by area, and plots are rarely perfect rectangles. Tiling a floor, painting a wall, or planning a rangoli all start with finding an area.",
    minutes: 20,
  },
  hook: {
    title: "Whose plot is bigger?",
    text:
      "Meena and Raju each get a plot beside the same canal. Meena's is a rectangle, 6 units long and 4 units wide. Raju's leans over like a pushed stack of books, with the same base and the same height. Raju says, \"My plot is bigger, look how long its slanting sides are!\" Is he right?",
  },
  predict: {
    question: "Push a 6 × 4 rectangle over into a leaning parallelogram. The base stays 6 and the height stays 4. Its area:",
    options: ["Gets bigger", "Stays 24 square units", "Gets smaller"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:count",
      title: "Count the squares",
      text: "In Shear, make a rectangle with base 6 and height 4. Keep Slide top at 0. Count the squares inside.",
      found: "The rectangle covers 24 whole squares: 4 rows of 6. So the area of a rectangle is base × height = 6 × 4 = 24 square units.",
    },
    {
      id: "task:shear",
      title: "Push it over",
      text: "Keep base 6 and height 4. Drag the top edge (or use Slide top) 2 or more squares to one side.",
      found:
        "Now some squares are cut into pieces, and there are fewer whole squares. But the pieces add up to exactly the squares you lost, so the area is still 6 × 4 = 24. The triangle that slid off one end fills the gap at the other end.",
    },
    {
      id: "task:triangle",
      title: "Half a parallelogram",
      text: "Switch to Triangle. Make base 6 and height 4, then tap Add a copy.",
      found:
        "The copy, turned half a turn, fits the triangle exactly to make a parallelogram with base 6 and height 4. Its area is 24, so one triangle is half of it: (6 × 4) ÷ 2 = 12 square units.",
    },
    {
      id: "task:apex",
      title: "Move the top corner",
      text: "Keep base 6 and height 4. Put the top corner in three different places (drag it, or use Top corner).",
      found:
        "The triangle changed shape, but its area stayed (6 × 4) ÷ 2 = 12 every time. The top corner can even go past the end of the base. Only the base and the height matter.",
    },
    {
      id: "task:trap",
      title: "Two trapeziums make a parallelogram",
      text: "Switch to Trapezium. Make the bottom side 7, the top side 3 and the height 4. Tap Add a copy.",
      found:
        "The flipped copy makes a parallelogram with base 7 + 3 = 10 and height 4, so its area is 40. The trapezium is half of it: ((7 + 3) × 4) ÷ 2 = 20 square units.",
    },
  ],
  discovery: {
    scientist: "Aryabhata",
    years: "476–550",
    fact: "Aryabhata packed all the maths of his Aryabhatiya (499 CE) into just 33 short verses. One verse says the area of a triangle is half the base times the height. Another gives the area of a trapezium as half the sum of its two parallel sides times the height, the very rule you just built.",
    formula: "A = ((p + q) × h) ÷ 2",
    formulaNote: "Add the two parallel sides, multiply by the height, then halve it. With p = 7, q = 3 and h = 4 that is (10 × 4) ÷ 2 = 20.",
  },
  symbols: [
    { sym: "A", meaning: "area: how many unit squares the shape covers" },
    { sym: "b", meaning: "base: the side the shape stands on" },
    { sym: "h", meaning: "height: the straight up-and-down distance from the base to the top, at a right angle (90°) to the base" },
    { sym: "p, q", meaning: "the two parallel sides of a trapezium" },
    { sym: "×", meaning: "times (multiply)" },
    { sym: "÷", meaning: "divided by" },
    { sym: "( )", meaning: "brackets: work out what is inside first" },
    { sym: "square units", meaning: "the number of 1 × 1 squares; with cm it is written cm², with metres m²" },
    { sym: "cm², m²", meaning: "square centimetres, square metres: area of a square 1 cm or 1 m on each side" },
  ],
  ideas: [
    {
      title: "Area means counting squares",
      text: "The area of a shape is how many unit squares it covers. A rectangle has rows of equal squares, so you multiply instead of counting one by one.",
      formula: "A = b × h",
    },
    {
      title: "Parallelogram: same base, same height, same area",
      text: "Slide the top of a rectangle sideways. The triangle cut off one end fits exactly into the gap at the other end, so nothing is lost or gained. Use the height, not the slanting side.",
      formula: "A = b × h",
    },
    {
      title: "Triangle: half a parallelogram",
      text: "Two copies of any triangle fit together into a parallelogram with the same base and height. So a triangle is half of b × h, wherever its top corner is.",
      formula: "A = (b × h) ÷ 2",
    },
    {
      title: "Trapezium: two make a parallelogram",
      text: "Turn a copy of a trapezium half a turn and join it on. You get a parallelogram whose base is the two parallel sides added together. The trapezium is half of it.",
      formula: "A = ((p + q) × h) ÷ 2",
    },
  ],
  challenge: {
    title: "Mark out the plots",
    text: "The village surveyor needs three plots marked out on the geoboard: a leaning field, a corner plot and a paddy field. The area stays hidden until you mark the plot. One star per plot.",
  },
  quiz: [
    {
      q: "A parallelogram has base 9 cm and height 5 cm. Its slanting side is 6 cm. What is its area?",
      options: ["45 cm²", "54 cm²", "30 cm²", "22.5 cm²"],
      answer: 0,
      why: "Area = base × height = 9 × 5 = 45 cm². The slanting side (6 cm) is not the height, so it is not used.",
    },
    {
      q: "A triangular flower bed has base 10 m and height 7 m. What is its area?",
      options: ["70 m²", "35 m²", "17 m²", "140 m²"],
      answer: 1,
      why: "Area = (base × height) ÷ 2 = (10 × 7) ÷ 2 = 70 ÷ 2 = 35 m².",
    },
    {
      q: "A field is a trapezium. Its parallel sides are 12 m and 8 m, and they are 5 m apart. What is its area?",
      options: ["100 m²", "480 m²", "50 m²", "25 m²"],
      answer: 2,
      why: "Area = ((12 + 8) × 5) ÷ 2 = (20 × 5) ÷ 2 = 100 ÷ 2 = 50 m².",
    },
    {
      q: "A rectangle and a leaning parallelogram have the same base, 8 units, and the same height, 3 units. Which is true?",
      options: [
        "The parallelogram has more area because its slanting sides are longer",
        "The rectangle has more area",
        "They have the same area, 24 square units",
        "You cannot tell without counting every square",
      ],
      answer: 2,
      why: "Both have area base × height = 8 × 3 = 24 square units. The triangle cut off one end of the parallelogram fits the gap at the other end.",
    },
    {
      q: "A triangular rangoli has area 30 cm² and base 12 cm. What is its height?",
      options: ["2.5 cm", "5 cm", "10 cm", "18 cm"],
      answer: 1,
      why: "(12 × h) ÷ 2 = 30, so 12 × h = 60 and h = 60 ÷ 12 = 5 cm.",
    },
  ],
};
