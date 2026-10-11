/**
 * Class 9 · Ganita Manjari (Part 1, 2026-27) · Chapter 1 "Orienting Yourself: The Use of Coordinates".
 * Covers ordered pairs, the four quadrants, points on the axes, mirror images in the
 * axes, the distance between two points and the midpoint.
 * Ganita Manjari is new for 2026-27: recheck wording against the NCERT chapter PDF.
 */
import type { Delivery } from "@/lib/sim/coordinates";
import type { LessonDef } from "./types";

export const LESSON_ID = "c9-coordinates";

/** Challenge: three drone deliveries, each target given a different way. */
export const DELIVERIES: Delivery[] = [
  {
    name: "Medicine for Dadi",
    brief: "Dadi's house is at (−3, 4). Fly the drone there and drop the parcel.",
    marks: [{ label: "Base", at: { x: 0, y: 0 } }],
    target: { x: -3, y: 4 },
  },
  {
    name: "Halfway handover",
    brief: "Your friends at the school and the park want to meet exactly halfway between them. Drop the cricket kit at the midpoint.",
    marks: [
      { label: "School", at: { x: 2, y: -6 } },
      { label: "Park", at: { x: -4, y: 2 } },
    ],
    target: { x: -1, y: -2 },
  },
  {
    name: "Mirror temple",
    brief: "A new temple is being built as the mirror image of the old one in the y-axis. Drop the flowers where the new temple will stand.",
    marks: [{ label: "Old temple", at: { x: 5, y: -3 } }],
    target: { x: -5, y: -3 },
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "grid-pilot",
  classNum: 9,
  book: "Ganita Manjari",
  chapter: "Orienting Yourself: The Use of Coordinates",
  title: "Drone over the grid",
  intro: {
    objective:
      "Fly a delivery drone over a city grid using only two numbers. Explore the four quadrants, mirror images, and how far apart two points are.",
    learn: [
      "A point is an ordered pair (x, y), and the order matters",
      "The signs of x and y tell you the quadrant",
      "Mirror images in the x-axis and the y-axis",
      "Distance between two points, using Baudhayana-Pythagoras",
      "The midpoint of two points",
    ],
    realLife:
      "Maps, GPS on a phone, seat numbers in a cinema, chess squares like e4, and the pixels on every screen are found with coordinates.",
    minutes: 20,
  },
  hook: {
    title: "Drone delivery",
    text:
      "A drone delivers medicines in your colony. Its controller has no map, no street names and no landmarks. It only understands two numbers: how far across from the base, and how far up or down. Can two numbers really find any house in the city?",
  },
  predict: {
    question: "The drone is sent to (2, 5). Another time it is sent to (5, 2). Is that the same place?",
    options: ["Yes, the same point", "No, two different points", "It depends on the scale of the map"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:quadrants",
      title: "Visit all four quadrants",
      text: "In Plot, drag the drone into each of the four quadrants. Watch the signs of x and y.",
      found:
        "Quadrant I is (+, +), II is (−, +), III is (−, −) and IV is (+, −). Just by looking at the signs, you know which quarter of the map a point is in.",
    },
    {
      id: "task:axes",
      title: "Land on the axes",
      text: "Land the drone on the x-axis, then on the y-axis, away from the base.",
      found: "Every point on the x-axis has y = 0, like (5, 0). Every point on the y-axis has x = 0, like (0, −3). The base, (0, 0), is the origin.",
    },
    {
      id: "task:mirror",
      title: "Mirror, mirror",
      text: "Fly the drone off the axes and tap Mirror in x-axis. Then try the y-axis.",
      found:
        "In the x-axis mirror, x stayed the same and y changed sign. In the y-axis mirror, y stayed the same and x changed sign. A point and its mirror image are the same distance from the mirror line.",
    },
    {
      id: "task:distance",
      title: "Five units, slantwise",
      text: "Switch to Distance. Place A and B exactly 5 units apart, but not on the same grid line.",
      found:
        "The line AB is the hypotenuse of a right triangle whose sides are 3 across and 4 up (or 4 and 3). √(3² + 4²) = √25 = 5. That is the distance formula: Baudhayana-Pythagoras on a grid.",
    },
    {
      id: "task:midpoint",
      title: "Meet in the middle",
      text: "Place A and B so that their midpoint M lands exactly on the origin.",
      found: "A and B had opposite coordinates, like (3, 4) and (−3, −4). The midpoint is the average of the x values and the average of the y values.",
    },
  ],
  discovery: {
    scientist: "René Descartes",
    years: "1596–1650",
    fact: "A famous story says Descartes, lying in bed, watched a fly on the ceiling and realised he could pin down where it was with two distances from the walls. His 1637 book joined algebra and geometry, which is why x-y coordinates are called Cartesian coordinates.",
    formula: "P = (x, y)",
    formulaNote: "Every point is a pair of numbers: first how far across (x), then how far up or down (y).",
  },
  symbols: [
    { sym: "x", meaning: "the x-coordinate (abscissa): how far right (+) or left (−) of the origin" },
    { sym: "y", meaning: "the y-coordinate (ordinate): how far up (+) or down (−) from the origin" },
    { sym: "(x, y)", meaning: "an ordered pair: always x first, then y" },
    { sym: "O", meaning: "the origin, (0, 0), where the two axes cross" },
    { sym: "x₁, y₁", meaning: "the coordinates of the first point, A; x₂, y₂ are those of B" },
    { sym: "²", meaning: "squared: a number times itself; (−3)² = 9" },
    { sym: "√", meaning: "square root: √25 = 5" },
    { sym: "→", meaning: "becomes" },
    { sym: "M", meaning: "the midpoint of AB" },
  ],
  ideas: [
    {
      title: "Ordered pairs",
      text: "Two number lines at right angles make a grid: the x-axis across and the y-axis up. They cross at the origin. Every point gets two numbers, written (x, y): first the distance across, then the distance up or down. Swap them and you get a different point.",
      formula: "P = (x, y)",
    },
    {
      title: "The four quadrants",
      text: "The axes cut the plane into four quadrants, numbered anticlockwise from the top right. Points on the axes are in no quadrant: on the x-axis y = 0, on the y-axis x = 0.",
      formula: "I (+, +)   II (−, +)   III (−, −)   IV (+, −)",
    },
    {
      title: "Mirror images",
      text: "Reflecting in the x-axis keeps x and changes the sign of y. Reflecting in the y-axis keeps y and changes the sign of x. Reflecting through the origin changes both.",
      formula: "in x-axis: (x, y) → (x, −y);   in y-axis: (x, y) → (−x, y)",
    },
    {
      title: "Distance between two points",
      text: "Go across from A, then up to B: you have drawn a right triangle. The across side is (x₂ − x₁), the up side is (y₂ − y₁), and AB is the hypotenuse.",
      formula: "AB = √((x₂ − x₁)² + (y₂ − y₁)²)",
    },
    {
      title: "The midpoint",
      text: "The point exactly halfway between A and B has the average of their x values and the average of their y values.",
      formula: "M = ((x₁ + x₂) ÷ 2, (y₁ + y₂) ÷ 2)",
    },
  ],
  challenge: {
    title: "Three deliveries",
    text: "Each delivery gives the address a different way: plain coordinates, a midpoint and a mirror image. Fly the drone to the right point and drop the parcel. One star per delivery.",
  },
  quiz: [
    {
      q: "In which quadrant is the point (−4, 7)?",
      options: ["I", "II", "III", "IV"],
      answer: 1,
      why: "x is negative and y is positive: (−, +) is Quadrant II, the top left.",
    },
    {
      q: "Where is the point (0, −5)?",
      options: ["In Quadrant IV", "On the x-axis", "On the y-axis, below the origin", "On the y-axis, above the origin"],
      answer: 2,
      why: "x = 0, so it is on the y-axis. y = −5, so it is 5 units below the origin.",
    },
    {
      q: "What is the mirror image of (3, −2) in the x-axis?",
      options: ["(−3, −2)", "(3, 2)", "(−3, 2)", "(−2, 3)"],
      answer: 1,
      why: "In the x-axis mirror, x stays 3 and y changes sign: −2 becomes 2.",
    },
    {
      q: "How far apart are the points (1, 2) and (7, 10)?",
      options: ["8 units", "10 units", "14 units", "100 units"],
      answer: 1,
      why: "√((7 − 1)² + (10 − 2)²) = √(6² + 8²) = √(36 + 64) = √100 = 10.",
    },
    {
      q: "What is the midpoint of (−2, 6) and (8, −4)?",
      options: ["(3, 1)", "(5, 1)", "(3, 5)", "(6, 2)"],
      answer: 0,
      why: "M = ((−2 + 8) ÷ 2, (6 + (−4)) ÷ 2) = (6 ÷ 2, 2 ÷ 2) = (3, 1).",
    },
  ],
};
