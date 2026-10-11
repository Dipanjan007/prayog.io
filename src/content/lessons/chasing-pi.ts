/**
 * Class 9 level · Outliers (Maths) · "Chasing π".
 * Goes past the NCERT book: Archimedes trapping π between polygons inside and outside a circle
 * (96 sides: 3.1410 < π < 3.1427), Madhava's series π ÷ 4 = 1 − 1/3 + 1/5 − ... and his end
 * correction that makes it fast, and Aryabhata's 3.1416 from the Aryabhatiya (499 CE).
 */
import type { PiRound } from "@/lib/sim/pi";
import type { LessonDef } from "./types";

export const LESSON_ID = "xm-chasing-pi";

/** Challenge: the fewest sides or terms that give π to some decimals. One star each. */
export const PI_ROUNDS: PiRound[] = [
  {
    name: "Archimedes' challenge",
    brief: "Find the fewest sides for which the inside and outside polygons both give π as 3.14 (2 decimal places).",
    kind: "poly",
    decimals: 2,
  },
  {
    name: "Madhava's long road",
    brief: "Without the correction, find the fewest terms of Madhava's series that give π as 3.14 (2 decimal places).",
    kind: "series",
    decimals: 2,
  },
  {
    name: "Madhava's shortcut",
    brief: "With Madhava's end correction, find the fewest terms that give π as 3.141593 (6 decimal places).",
    kind: "series",
    decimals: 6,
    corrected: true,
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "pi-chaser",
  classNum: 9,
  book: "Outliers",
  chapter: "Chasing π",
  title: "Chasing π",
  intro: {
    objective:
      "Trap π between polygons the way Archimedes did, add up Madhava's endless series, and use Madhava's clever end correction to reach Aryabhata's 3.1416 and beyond with only a few terms.",
    learn: [
      "π is the distance round any circle divided by the distance across it",
      "Polygons inside and outside a circle trap π between two numbers, and more sides squeeze it tighter",
      "Madhava's series π ÷ 4 = 1 − 1/3 + 1/5 − ... gets there, but very slowly",
      "Madhava's end correction makes the series fast, and Aryabhata's 3.1416 was right to 4 decimal places",
    ],
    realLife:
      "Every wheel, bangle, pipe, roti and round water tank uses π. Engineers who send spacecraft use π to about 15 decimal places, and computers have found it to trillions of digits as a test of their speed.",
    minutes: 25,
  },
  hook: {
    title: "The bicycle wheel",
    text:
      "Mark a spot on a bicycle wheel and roll it along the ground for one full turn. The distance it travels is a little more than 3 times the wheel's width. A bangle, a roti or a giant water tank gives the same: just over 3. That number is π. But what is it exactly? For over 2,000 years, mathematicians in Greece and India chased its digits. Let's find out how.",
  },
  predict: {
    question: "Archimedes drew a polygon just inside a circle and another just outside it. What happened as he gave them more and more sides?",
    options: ["The polygons stayed far from the circle", "Their perimeters closed in on the circle's from both sides", "The inside polygon grew bigger than the circle"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:poly",
      title: "Trap π with polygons",
      text: "In Polygons, start from the hexagon (6 sides) and double the sides until you reach 96, like Archimedes did.",
      found:
        "The hexagon only trapped π between 3 and 3.464. Each doubling squeezed the gap to about a quarter. With 96 sides the polygons gave 3.1410 and 3.1427, so π is between them. Archimedes did this by hand over 2,200 years ago.",
    },
    {
      id: "task:series",
      title: "Madhava's endless sum",
      text: "Switch to Series. Add terms of 1 − 1/3 + 1/5 − 1/7 + ... and watch 4 × the sum. Go to 100 terms or more.",
      found:
        "4 × the sum went 4, 2.667, 3.467, 2.895, ... swinging above and below π. After 100 terms it was only 3.1316, still wrong in the second decimal place. The series is right, but it is very slow.",
    },
    {
      id: "task:fix",
      title: "Madhava's shortcut",
      text: "Switch on Madhava's end correction. Find how many terms you now need to get 3.1416, Aryabhata's value.",
      found:
        "With the correction, just 6 terms gave 3.14156..., which rounds to 3.1416. Without it, even 100 terms were stuck at 3.13. Madhava's correction makes up for the part of the series you have not added yet.",
    },
  ],
  discovery: {
    scientist: "Aryabhata",
    years: "476–550 CE",
    fact:
      "In the Aryabhatiya, written in 499 CE when he was 23, Aryabhata gave a rule: add 4 to 100, multiply by 8 and add 62,000. That is about the circumference of a circle 20,000 across. It gives π = 3.1416, right to 4 decimal places. He called the value āsanna, which means 'approaching', as if he knew it could never be exact.",
    formula: "π ≈ ((100 + 4) × 8 + 62,000) ÷ 20,000 = 62,832 ÷ 20,000 = 3.1416",
    formulaNote: "Work out the brackets first: 104, then 832, then 62,832. Divide by the diameter, 20,000.",
  },
  symbols: [
    { sym: "π", meaning: "pi, a Greek letter: the circumference of any circle divided by its diameter, about 3.14159" },
    { sym: "n", meaning: "the number of sides of a polygon, or the number of terms added in the series" },
    { sym: "k", meaning: "how many times the sides have been doubled from 6" },
    { sym: "2ᵏ", meaning: "2 multiplied by itself k times; 2⁴ = 16" },
    { sym: "²", meaning: "squared: a number times itself; 4n² = 4 × n × n" },
    { sym: "<, ≈", meaning: "is less than; is about equal to" },
    { sym: "1/3, 1/5, ...", meaning: "fractions: 1 divided by 3, 1 divided by 5, ..." },
    { sym: "+, −, ×, ÷", meaning: "add, take away, multiply, divide" },
  ],
  ideas: [
    {
      title: "Trap π between polygons",
      text: "Take a circle 1 unit across, so its circumference is π. A polygon inside it is a little shorter all the way round, and a polygon outside it is a little longer. So π is trapped between their perimeters.",
      formula: "inside perimeter < π < outside perimeter;   96 sides: 3.1410 < π < 3.1427",
    },
    {
      title: "Double the sides",
      text: "Archimedes went from 6 sides to 12, 24, 48 and 96, using only square roots. Each doubling cut the gap between the two polygons to about a quarter. Working by hand, he showed 3 10/71 < π < 3 1/7, which is where 22/7 comes from.",
      formula: "sides = 6 × 2ᵏ;   6 → 12 → 24 → 48 → 96",
    },
    {
      title: "Madhava's endless sum",
      text: "Madhava of Sangamagrama, in Kerala, found around 1400 that π can be written as a sum that never ends. Europeans found the same series about 270 years later. Every term helps, but it takes hundreds of terms just to get 3.14.",
      formula: "π ÷ 4 = 1 − 1/3 + 1/5 − 1/7 + ...",
    },
    {
      title: "Madhava's end correction",
      text: "Madhava also worked out what the terms you have not added are worth, and added that as a last piece. Stop after n terms, then add n ÷ (4n² + 1) if the last term was taken away, or take it away if the last term was added.",
      formula: "correction = n ÷ (4n² + 1);   6 terms with it: 4 × 0.78539 ≈ 3.1416",
    },
  ],
  challenge: {
    title: "Fewest steps to π",
    text: "Three targets: find the fewest polygon sides or series terms that give π to the decimals asked. One star each.",
  },
  quiz: [
    {
      q: "Aryabhata's rule: add 4 to 100, multiply by 8 and add 62,000. That is the circumference of a circle 20,000 across. What value of π does it give?",
      options: ["3.14", "3.1416", "3.1428", "3.2"],
      answer: 1,
      why: "((100 + 4) × 8 + 62,000) ÷ 20,000 = (832 + 62,000) ÷ 20,000 = 62,832 ÷ 20,000 = 3.1416.",
    },
    {
      q: "A regular hexagon fits just inside a circle 10 cm across. What is the hexagon's perimeter?",
      options: ["30 cm", "31.4 cm", "60 cm", "20 cm"],
      answer: 0,
      why: "Each side of the hexagon equals the radius, 5 cm, so the perimeter is 6 × 5 = 30 cm. The circle is a little longer (about 31.4 cm), so π is more than 3.",
    },
    {
      q: "Work out 4 × (1 − 1/3 + 1/5 − 1/7), the first 4 terms of Madhava's series.",
      options: ["3.142", "2.895", "3.467", "2.667"],
      answer: 1,
      why: "1 − 1/3 + 1/5 − 1/7 = 76/105 ≈ 0.7238. Then 4 × 0.7238 ≈ 2.895. Still far from π: the series is slow.",
    },
    {
      q: "Why did Archimedes draw one polygon inside the circle and another outside it?",
      options: [
        "To make the drawing look neat",
        "Because one polygon gives π exactly",
        "The circle's length is between their perimeters, so π is trapped between two numbers",
        "To find the area of the polygons",
      ],
      answer: 2,
      why: "The inside polygon is shorter than the circle and the outside one is longer. So π is more than one perimeter and less than the other, and more sides close the gap.",
    },
    {
      q: "Archimedes started with a hexagon and doubled the number of sides 4 times. How many sides did he end with?",
      options: ["24", "48", "96", "192"],
      answer: 2,
      why: "6 × 2⁴ = 6 × 16 = 96. That is the 96-sided polygon that gave 3 10/71 < π < 3 1/7.",
    },
  ],
};
