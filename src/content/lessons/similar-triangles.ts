/**
 * Class 10 · Mathematics · Chapter 6 "Triangles".
 * Covers similar triangles (equal angles, sides in the same ratio) by scaling a triangle, the Basic
 * Proportionality Theorem with a line parallel to one side and its converse, and Thales' shadow
 * trick for finding a height. Challenge: find three heights from shadows, ending with the pyramid.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { ShadowMystery } from "@/lib/sim/similar";
import type { LessonDef } from "./types";

export const LESSON_ID = "c10-similar-triangles";

/** Challenge: three heights to find from shadows, one star each. */
export const MYSTERIES: ShadowMystery[] = [
  {
    id: "flagpole",
    label: "School flagpole",
    emoji: "🚩",
    brief: "On Independence Day morning, a 1 m stick casts a 0.8 m shadow and the flagpole casts an 8 m shadow. How tall is the flagpole?",
    h: 1,
    s: 0.8,
    S: 8,
    H: 10,
  },
  {
    id: "tank",
    label: "Water tank",
    emoji: "🛢️",
    brief: "Later in the day, a 1.5 m stick casts a 2 m shadow. The colony water tank casts a 24 m shadow. How tall is the tank?",
    h: 1.5,
    s: 2,
    S: 24,
    H: 18,
  },
  {
    id: "pyramid",
    label: "Great Pyramid",
    emoji: "🔺",
    brief: "Thales' own puzzle. A 2 m stick casts a 3 m shadow. The pyramid's shadow sticks out 104 m beyond its base, and its base is 230 m wide. Measure from the centre, under the top: add half the base.",
    h: 2,
    s: 3,
    S: 219,
    halfBase: 115,
    H: 146,
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "shape-scaler",
  classNum: 10,
  book: "Mathematics",
  chapter: "Triangles",
  title: "Similar triangles and the pyramid's shadow",
  intro: {
    objective:
      "Enlarge and shrink a triangle and watch its angles stay put while every side grows by the same factor. Slide a line parallel to one side and see it cut the other two sides in the same ratio. Then do what Thales did in Egypt: measure a height with nothing but shadows.",
    learn: [
      "Similar triangles: equal angles, and sides in the same ratio",
      "The Basic Proportionality Theorem: a line parallel to one side divides the other two sides in the same ratio",
      "Its converse: equal ratios mean the line is parallel",
      "How shadows and similar triangles give the height of a building",
    ],
    realLife:
      "Maps and house plans are drawn to scale, so they are similar to the real thing. A photo enlarged on your phone keeps its shape for the same reason. Surveyors and architects still use similar triangles to find heights they cannot reach.",
    minutes: 20,
  },
  hook: {
    title: "A tape too short",
    text:
      "Your school wants to know how tall the water tank is, but nobody can climb it with a measuring tape. Over 2500 years ago, a traveller named Thales stood in front of the Great Pyramid of Egypt with the same problem. All he used was the Sun and a stick. Let's find his trick.",
  },
  predict: {
    question: "At 4 pm, a 1 m stick casts a 2 m shadow. At the same moment, the school building casts a 30 m shadow. How tall is the building?",
    options: ["15 m", "30 m", "60 m"],
    answer: 0,
  },
  tasks: [
    {
      id: "task:scale",
      title: "Enlarge and shrink",
      text: "In Scale, make the copy twice as big (k = 2). Then make it half the size (k = 0.5). Watch the angles and the side ratios.",
      found:
        "Every side of PQR was k times the matching side of ABC, so PQ ÷ AB = QR ÷ BC = RP ÷ CA = k, and the angles did not change at all. Same shape, different size: the triangles are similar.",
    },
    {
      id: "task:bpt",
      title: "A line parallel to BC",
      text: "Switch to Parallel line. Keep DE parallel to BC (tilt 0°) and slide D to two different places on AB. Compare AD ÷ DB with AE ÷ EC.",
      found:
        "Wherever D was, AD ÷ DB came out equal to AE ÷ EC. A line parallel to one side of a triangle divides the other two sides in the same ratio: the Basic Proportionality Theorem.",
    },
    {
      id: "task:converse",
      title: "Tilt the line",
      text: "Now tilt DE away from parallel and compare the two ratios again.",
      found:
        "As soon as DE was not parallel to BC, the two ratios were different. So it works the other way too: if AD ÷ DB = AE ÷ EC, then DE must be parallel to BC. That is the converse of the theorem.",
    },
    {
      id: "task:shadow",
      title: "Shadow as long as the stick",
      text: "Switch to Shadows. Move the Sun until the 1 m stick casts a shadow exactly 1 m long. How long is the building's shadow now?",
      found:
        "With the Sun 45° up, the stick's shadow equalled its height, and so did the building's: 12 m. The Sun's rays are parallel, so the stick, the building and their shadows make similar triangles.",
    },
  ],
  discovery: {
    scientist: "Thales of Miletus",
    years: "about 624–546 BCE",
    fact: "Stories from ancient Greece say Thales measured the height of the Great Pyramid of Egypt with shadows. He waited for the moment when his own shadow was as long as he was tall; then the pyramid's shadow, measured from the centre of its base, was as long as the pyramid was tall. The Basic Proportionality Theorem is also called Thales' theorem.",
    formula: "DE ∥ BC  ⇒  AD ÷ DB = AE ÷ EC",
    formulaNote: "A line parallel to one side of a triangle cuts the other two sides in the same ratio.",
  },
  symbols: [
    { sym: "△ABC", meaning: "the triangle with corners A, B and C" },
    { sym: "AB", meaning: "the side from A to B, or its length" },
    { sym: "∠A", meaning: "the angle at corner A" },
    { sym: "~", meaning: "is similar to: same shape, maybe a different size" },
    { sym: "∥", meaning: "is parallel to" },
    { sym: "⇒", meaning: "means that, so" },
    { sym: "k", meaning: "scale factor: how many times bigger the copy is" },
    { sym: "÷", meaning: "divided by; AD ÷ DB is the ratio AD : DB" },
    { sym: "×", meaning: "times" },
    { sym: "−", meaning: "minus" },
    { sym: "h, s", meaning: "the stick's height and its shadow, in m" },
    { sym: "H, S", meaning: "the building's height and its shadow, in m" },
    { sym: "°", meaning: "degrees, for angles" },
    { sym: "m, cm", meaning: "metres and centimetres" },
  ],
  ideas: [
    {
      title: "Similar triangles",
      text: "Two triangles are similar when their matching angles are equal and their matching sides are in the same ratio. Multiply every side by the same k and you get a similar copy. If two angles of one triangle equal two angles of another, the third angles are equal too, and the triangles are similar (the AA test).",
      formula: "△ABC ~ △PQR:  PQ ÷ AB = QR ÷ BC = RP ÷ CA = k",
    },
    {
      title: "The Basic Proportionality Theorem",
      text: "Draw DE parallel to BC, with D on AB and E on AC. Then AD ÷ DB = AE ÷ EC. For example, if AD = 2 cm, DB = 3 cm and AE = 4 cm, then EC = 6 cm, because 2 ÷ 3 = 4 ÷ 6.",
      formula: "DE ∥ BC  ⇒  AD ÷ DB = AE ÷ EC",
    },
    {
      title: "The converse",
      text: "If a line cuts two sides of a triangle in the same ratio, it is parallel to the third side. Tilt the line even a little and the ratios stop matching.",
      formula: "AD ÷ DB = AE ÷ EC  ⇒  DE ∥ BC",
    },
    {
      title: "Heights from shadows",
      text: "At one moment the Sun's rays are parallel, so the Sun is at the same angle for a stick and for a building. Both make a right angle with the ground, so the two triangles of object, shadow and ray are similar. Measure the stick h, its shadow s and the building's shadow S.",
      formula: "H ÷ S = h ÷ s,  so  H = h × (S ÷ s)",
    },
  ],
  challenge: {
    title: "Measure with shadows",
    text: "A flagpole, a water tank, and finally the Great Pyramid, just like Thales. Read the shadows, work out each height and type it in. One star per height.",
  },
  quiz: [
    {
      q: "A triangle has sides 3 cm, 4 cm and 5 cm. A similar triangle has its longest side 15 cm. How long is its shortest side?",
      options: ["6 cm", "9 cm", "12 cm", "15 cm"],
      answer: 1,
      why: "The scale factor is k = 15 ÷ 5 = 3, so the shortest side is 3 × 3 = 9 cm.",
    },
    {
      q: "In △ABC, DE ∥ BC with D on AB and E on AC. AD = 2 cm, DB = 3 cm and AE = 4 cm. What is EC?",
      options: ["5 cm", "6 cm", "8 cm", "2.67 cm"],
      answer: 1,
      why: "By the Basic Proportionality Theorem AD ÷ DB = AE ÷ EC, so 2 ÷ 3 = 4 ÷ EC and EC = 4 × (3 ÷ 2) = 6 cm.",
    },
    {
      q: "A girl 1.5 m tall casts a 2 m shadow. At the same time a tree casts a 12 m shadow. How tall is the tree?",
      options: ["8 m", "9 m", "16 m", "18 m"],
      answer: 1,
      why: "H = h × (S ÷ s) = 1.5 × (12 ÷ 2) = 1.5 × 6 = 9 m.",
    },
    {
      q: "△ABC ~ △PQR with ∠A = 50° and ∠B = 60°. What is ∠R?",
      options: ["50°", "60°", "70°", "80°"],
      answer: 2,
      why: "Similar triangles have equal matching angles, so ∠R = ∠C = 180° − (50° + 60°) = 70°.",
    },
    {
      q: "Which two triangles are always similar?",
      options: ["Any two isosceles triangles", "Any two right triangles", "Any two equilateral triangles", "Any two triangles with the same perimeter"],
      answer: 2,
      why: "Every angle of an equilateral triangle is 60°, so any two have equal angles and are similar. Isosceles or right triangles can have different angles.",
    },
  ],
};
