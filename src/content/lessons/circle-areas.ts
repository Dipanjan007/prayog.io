/**
 * Class 10 · Mathematics · Chapter 11 "Areas Related to Circles".
 * Covers sectors as a fraction θ ÷ 360 of a circle, arc length (θ ÷ 360) × 2πr,
 * sector area (θ ÷ 360) × πr², how doubling r changes each, and a minor segment
 * as sector − triangle.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { SliceRound } from "@/lib/sim/sectors";
import type { LessonDef } from "./types";

export const LESSON_ID = "c10-circle-areas";

/** Challenge: three slices to cut to order, one star each. The radius is fixed; you set the angle. */
export const SLICE_ROUNDS: SliceRound[] = [
  {
    name: "Pizza for five",
    brief: "Five friends share a pizza of radius 14 cm equally. Set the angle at the centre for one fair slice, then cut.",
    r: 14,
    unit: "cm",
    kind: "theta",
    target: 72,
    tol: 0,
  },
  {
    name: "The crust lover",
    brief: "Riya only eats the crust. Cut her a slice of the same 14 cm pizza with 22 cm of crust. Use π = 22 ÷ 7 to find the angle.",
    r: 14,
    unit: "cm",
    kind: "arc",
    target: 22,
    tol: 0.2,
  },
  {
    name: "Lawn sprinkler",
    brief: "A sprinkler sprays water 10 m and swings to and fro. The flower bed it must water is a sector of 52.36 m². Through what angle should it swing? Use π = 3.14.",
    r: 10,
    unit: "m",
    kind: "area",
    target: 52.36,
    tol: 0.5,
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "slice-scholar",
  classNum: 10,
  book: "Mathematics",
  chapter: "Areas Related to Circles",
  title: "Pizza slices and sprinklers",
  intro: {
    objective:
      "Cut a pizza with a slider for the angle at the centre and another for the radius. Measure the crust (an arc) and the slice (a sector), then cut a straight chord to make a segment. Finally, cut slices to order and set a garden sprinkler.",
    learn: [
      "A sector is the fraction θ ÷ 360 of the whole circle",
      "Arc length = (θ ÷ 360) × 2πr and sector area = (θ ÷ 360) × πr²",
      "Why doubling the radius doubles the arc but makes the area 4 times as big",
      "A minor segment = sector − triangle",
    ],
    realLife:
      "Pizza and cake slices, the area a windscreen wiper cleans, a sprinkler watering a lawn, the sweep of a clock's minute hand, and the light from a lighthouse all cover sectors.",
    minutes: 20,
  },
  hook: {
    title: "Whose slice is bigger?",
    text:
      "At a birthday party there are two pizzas. Aman takes a 60° slice from the big pizza of radius 14 cm. Bina takes a 120° slice from the small pizza of radius 7 cm. Bina says her slice has twice the angle, so she got more. Is she right?",
  },
  predict: {
    question: "Aman: a 60° slice of a 14 cm radius pizza. Bina: a 120° slice of a 7 cm radius pizza. Who gets more pizza?",
    options: ["Bina, her angle is twice as big", "They get exactly the same", "Aman gets twice as much as Bina"],
    answer: 2,
  },
  tasks: [
    {
      id: "task:quarter",
      title: "A quarter of the pizza",
      text: "In Pizza, set the angle at the centre to 90°. Compare the slice and its crust with the whole pizza.",
      found:
        "At 90°, θ ÷ 360 = 1 ÷ 4. The slice had exactly a quarter of the pizza's area, and its crust was a quarter of the whole crust. Every sector formula is the whole circle's formula multiplied by θ ÷ 360.",
    },
    {
      id: "task:clock",
      title: "The minute hand",
      text: "A clock's minute hand is 7 cm long. Set r = 7 cm and the angle it turns through in 20 minutes.",
      found:
        "In 20 minutes the minute hand turns (20 ÷ 60) × 360° = 120°. It swept (120 ÷ 360) × π × 7² ≈ 51.31 cm², and its tip travelled an arc of (120 ÷ 360) × 2 × π × 7 ≈ 14.66 cm.",
    },
    {
      id: "task:double",
      title: "Double the radius",
      text: "Keep one angle. Try r = 5 cm, then r = 10 cm. Compare the arc and the area.",
      found:
        "Doubling r from 5 cm to 10 cm doubled the crust (arc length) but made the slice 4 times as big. Arc length has r in it once; area has r × r, so it grows 2 × 2 = 4 times.",
    },
    {
      id: "task:segment",
      title: "Cut along a chord",
      text: "Switch to Segment. Set r = 10 cm and θ = 90°. Then push θ up to 180°.",
      found:
        "At 90° with r = 10 cm: sector = (90 ÷ 360) × π × 10² ≈ 78.54 cm², triangle = (1 ÷ 2) × 10 × 10 = 50 cm², so the segment ≈ 78.54 − 50 = 28.54 cm². At 180° the triangle was squashed flat (area 0), so the segment became a whole half circle.",
    },
  ],
  discovery: {
    scientist: "Archimedes",
    years: "c. 287–212 BCE",
    fact: "In his book Measurement of a Circle, Archimedes showed that a circle has the same area as a right triangle whose two short sides are the radius and the circumference. He also trapped π between two polygons with 96 sides each and proved it lies between 3 10/71 and 3 1/7. That 3 1/7 is the 22 ÷ 7 in your textbook.",
    formula: "area = (1 ÷ 2) × r × (2πr) = πr²",
    formulaNote: "Unroll the circle into thin slices and it becomes a triangle: half of base × height, with base 2πr and height r.",
  },
  symbols: [
    { sym: "r", meaning: "radius: the distance from the centre to the edge (cm or m)" },
    { sym: "θ", meaning: "theta: the angle at the centre of the slice, in degrees" },
    { sym: "π", meaning: "pi: circumference ÷ diameter for every circle, about 3.14 or 22 ÷ 7" },
    { sym: "r²", meaning: "r × r" },
    { sym: "2πr", meaning: "the circumference, the whole crust: 2 × π × r" },
    { sym: "πr²", meaning: "the area of the whole circle: π × r × r" },
    { sym: "sin θ", meaning: "the sine of θ from trigonometry; sin 90° = 1, sin 180° = 0" },
    { sym: "cm², m²", meaning: "square centimetres, square metres: units of area" },
    { sym: "≈", meaning: "is about equal to" },
  ],
  ideas: [
    {
      title: "A sector is a fraction of the circle",
      text: "The whole circle turns through 360°. A slice with angle θ at the centre is the fraction θ ÷ 360 of it. So a 90° slice is a quarter and a 72° slice is a fifth.",
      formula: "fraction of the circle = θ ÷ 360",
    },
    {
      title: "Arc length",
      text: "The crust of the whole pizza is the circumference 2πr. The slice gets its fraction of it.",
      formula: "arc length = (θ ÷ 360) × 2πr",
    },
    {
      title: "Sector area",
      text: "The whole pizza has area πr². The slice gets the same fraction. Because r is squared, doubling the radius makes the area 4 times as big, while the arc only doubles.",
      formula: "sector area = (θ ÷ 360) × πr²",
    },
    {
      title: "Segment = sector − triangle",
      text: "Cut straight across a slice along a chord and you get a triangle and a curved piece, the segment. Take the triangle away from the sector. At 90°, the triangle is half of r × r; at 60° it is equilateral.",
      formula: "segment = sector − triangle;   triangle = (1 ÷ 2) × r² × sin θ",
    },
  ],
  challenge: {
    title: "Slices to order",
    text: "Three jobs: a fair slice for five friends, a slice with exactly 22 cm of crust, and a sprinkler that waters 52.36 m². The radius is given; work out the angle, set it and cut. The areas stay hidden until you cut.",
  },
  quiz: [
    {
      q: "What is the area of a 90° sector of a circle of radius 14 cm? (Use π = 22 ÷ 7.)",
      options: ["44 cm²", "154 cm²", "308 cm²", "616 cm²"],
      answer: 1,
      why: "(90 ÷ 360) × (22 ÷ 7) × 14 × 14 = (1 ÷ 4) × 616 = 154 cm².",
    },
    {
      q: "What is the length of the arc of a 60° sector of a circle of radius 21 cm? (Use π = 22 ÷ 7.)",
      options: ["11 cm", "22 cm", "44 cm", "231 cm"],
      answer: 1,
      why: "(60 ÷ 360) × 2 × (22 ÷ 7) × 21 = (1 ÷ 6) × 132 = 22 cm.",
    },
    {
      q: "The radius of a sector is doubled and its angle stays the same. Its area becomes:",
      options: ["the same", "2 times as big", "4 times as big", "8 times as big"],
      answer: 2,
      why: "Area has r²: (2r)² = 4r², so the area is 4 times as big.",
    },
    {
      q: "A sector of a circle of radius 7 cm has area 77 cm². What is its angle? (Use π = 22 ÷ 7.)",
      options: ["90°", "120°", "180°", "270°"],
      answer: 2,
      why: "The whole circle has area (22 ÷ 7) × 7 × 7 = 154 cm². 77 ÷ 154 = 1 ÷ 2, so θ = (1 ÷ 2) × 360° = 180°.",
    },
    {
      q: "A chord of a circle of radius 10 cm makes a right angle at the centre. What is the area of the minor segment? (Use π = 3.14.)",
      options: ["28.5 cm²", "50 cm²", "78.5 cm²", "128.5 cm²"],
      answer: 0,
      why: "Sector = (90 ÷ 360) × 3.14 × 10 × 10 = 78.5 cm². Triangle = (1 ÷ 2) × 10 × 10 = 50 cm². Segment = 78.5 − 50 = 28.5 cm².",
    },
  ],
};
