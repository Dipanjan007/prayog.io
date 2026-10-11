/**
 * Class 7 level · Outliers (Maths) · "The golden ratio".
 * Goes past the NCERT book: the Virahanka-Fibonacci numbers (counted first by
 * Indian poets as rhythms of short and long beats), the ratio of neighbours
 * heading to φ ≈ 1.618, and a sunflower grown by turning each seed by the
 * golden angle ≈ 137.5°, whose spirals come in Virahanka numbers.
 */
import type { GoldenRound } from "@/lib/sim/golden";
import type { LessonDef } from "./types";

export const LESSON_ID = "xm-golden-ratio";

/** Challenge: a tabla rhythm, a seed farm and a giant sunflower. One star each. */
export const GOLDEN_ROUNDS: GoldenRound[] = [
  {
    kind: "rhythm",
    name: "The tabla player",
    brief:
      "A tabla player makes rhythms from short strokes (1 beat) and long strokes (2 beats). The drum below shows rhythms up to 6 beats only. How many different rhythms last exactly 7 beats?",
    beats: 7,
    options: [13, 14, 21, 28],
  },
  {
    kind: "pack",
    name: "The seed farm",
    brief:
      "A seed farm wants as many seeds as possible in every sunflower head, with no spokes and no gaps. Set the turn between seeds, then grow the head.",
    seeds: 300,
  },
  {
    kind: "arms",
    name: "The giant sunflower",
    brief:
      "This giant head was grown with the golden angle. Somewhere between 25 and 40 colours, every colour becomes one smooth spiral arm. Find that number of spirals.",
    seeds: 400,
    min: 25,
    max: 40,
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "golden-grower",
  classNum: 7,
  book: "Outliers",
  chapter: "The golden ratio",
  title: "Sunflowers and the golden ratio",
  intro: {
    objective:
      "Build the number pattern 1, 1, 2, 3, 5, 8, ... that Indian poets found by counting rhythms, watch the ratio of neighbours settle on 1.618, then grow a sunflower seed by seed and find the one turn that packs it perfectly.",
    learn: [
      "Each Virahanka-Fibonacci number is the sum of the two before it",
      "Indian poets counted rhythms with these numbers centuries before Fibonacci",
      "The ratio of neighbours heads to the golden ratio φ ≈ 1.618, whatever two numbers you start with",
      "Turning each seed by the golden angle ≈ 137.5° packs a sunflower with no gaps",
      "Sunflower and pineapple spirals come in Virahanka numbers like 8, 13, 21 and 34",
    ],
    realLife:
      "Count the spirals on a pineapple at the fruit stall, a pine cone, or a sunflower in a field in Karnataka: you get numbers like 8, 13, 21 and 34. Tabla players and poets use the same counting for rhythms.",
    minutes: 25,
  },
  hook: {
    title: "The pineapple puzzle",
    text:
      "Next time you see a pineapple at the fruit stall, count its bumpy spirals. One way you will usually count 8, the other way 13. A sunflower head shows 34 and 55, or 21 and 34. Why these numbers, and not 10 or 12? The answer starts with Indian poets counting rhythms more than a thousand years ago, and ends with one very strange angle.",
  },
  predict: {
    question: "A sunflower adds its seeds one at a time, turning by the same angle before each new seed. Which turn packs the seeds with no gaps?",
    options: ["A simple turn, like 120° (one third of a turn)", "An awkward turn of about 137.5°", "Exactly 180° (half a turn)"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:ratio",
      title: "Neighbours settle down",
      text:
        "In Numbers, start from 1 and 1 and keep adding terms until the ratio of the last two rounds to 1.618. Then pick your own two start numbers and do it again.",
      found:
        "From 1 and 1 the ratio jumped about (1, 2, 1.5, 1.667, 1.6, ...) and then settled at 1.618 once you reached 55 ÷ 34. Your own start numbers settled on the same 1.618. That number is the golden ratio φ.",
    },
    {
      id: "task:rhythm",
      title: "Virahanka's rhythms",
      text: "Switch to Rhythms. Each rhythm is made of short beats (1) and long beats (2). Step through 4, 5 and 6 beats and count the rhythms each time.",
      found:
        "4 beats gave 5 rhythms, 5 beats gave 8 and 6 beats gave 13. Each count is the two before it added together: a rhythm ends in a short beat or a long beat, so you add the rhythms one beat shorter and two beats shorter.",
    },
    {
      id: "task:angle",
      title: "Find the sunflower's turn",
      text:
        "Switch to Sunflower. First try a simple fraction of a turn, like 120°, 135° or 144°, and watch the seeds. Then hunt for the turn that gives the best packing score.",
      found:
        "A simple fraction of a turn lines the seeds up in straight spokes with empty gaps between them. The best packing came at 137.5°, the golden angle, where the seeds fill the head with no spokes and no gaps.",
    },
    {
      id: "task:arms",
      title: "Count the spirals",
      text: "Keep the golden angle. Paint the seeds in different numbers of colours. Find a number that turns every colour into one smooth spiral arm.",
      found:
        "Smooth spiral arms appeared for 13, 21 and 34 colours: Virahanka numbers again. Seeds 13, 21 or 34 apart sit almost on the same line out from the centre, so they line up into the spirals you see on a real sunflower.",
    },
  ],
  discovery: {
    scientist: "Virahanka",
    years: "lived between about 600 and 800 CE",
    fact:
      "Virahanka was a poet and scholar of poetry metres (the rhythms of verses). He asked how many rhythms of a given length can be made from short and long syllables, and gave the rule: add the counts for the two lengths before. Pingala's much older book on metres hints at it, Gopala (before 1135) and Hemachandra (about 1150) wrote it again, and Fibonacci's famous rabbit puzzle came in 1202.",
    formula: "F(n) = F(n − 1) + F(n − 2)",
    formulaNote: "Each number in the pattern is the sum of the two before it: 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, ...",
  },
  symbols: [
    { sym: "F(n)", meaning: "the nth Virahanka-Fibonacci number; F(1) = 1, F(2) = 1, F(3) = 2" },
    { sym: "n", meaning: "the position of a number in the pattern: 1st, 2nd, 3rd, ..." },
    { sym: "φ", meaning: "phi, a Greek letter: the golden ratio, about 1.618" },
    { sym: "√", meaning: "square root: the number that times itself gives this one; √5 ≈ 2.236" },
    { sym: "²", meaning: "squared: a number times itself; φ² = φ × φ ≈ 2.618" },
    { sym: "÷", meaning: "divided by; a ratio like 34 ÷ 21 compares two numbers" },
    { sym: "≈", meaning: "is about equal to" },
    { sym: "°", meaning: "degrees: a full turn is 360°" },
  ],
  ideas: [
    {
      title: "Add the two before",
      text: "Start with 1 and 1. Each new number is the last two added: 1 + 1 = 2, 1 + 2 = 3, 2 + 3 = 5, and so on. Indian poets found this by counting rhythms of short and long beats, so we call them Virahanka-Fibonacci numbers.",
      formula: "F(n) = F(n − 1) + F(n − 2);   1, 1, 2, 3, 5, 8, 13, 21, 34, 55",
    },
    {
      title: "The golden ratio",
      text: "Divide each number by the one before it: 2, 1.5, 1.667, 1.6, 1.625, 1.615, 1.619, 1.618 ... The ratios swing above and below one number and close in on it. It is the golden ratio φ, and you reach it from any two start numbers.",
      formula: "φ = (1 + √5) ÷ 2 ≈ 1.618;   55 ÷ 34 ≈ 1.618",
    },
    {
      title: "The golden angle",
      text: "Cut a full turn into two parts whose sizes are in the golden ratio. The smaller part is the golden angle. A simple turn like 120° sends every third seed the same way, so the seeds make spokes with gaps. The golden angle never repeats a direction, so every new seed lands in a gap.",
      formula: "golden angle = 360° ÷ φ² ≈ 360° ÷ 2.618 ≈ 137.5°",
    },
    {
      title: "Spirals come in Virahanka numbers",
      text: "On a head grown with the golden angle, seeds that are 13, 21 or 34 apart sit almost in a line, so your eye joins them into spirals. That is why a sunflower shows 21 and 34 spirals, or 34 and 55, and a pineapple 8 and 13. Two neighbouring Virahanka numbers, one each way round.",
      formula: "34 ÷ 21 ≈ 1.619;   21 ÷ 13 ≈ 1.615",
    },
  ],
  challenge: {
    title: "The golden garden",
    text: "Three jobs: count a tabla player's rhythms, grow the best-packed sunflower for a seed farm, and find the spiral count of a giant head. One star each.",
  },
  quiz: [
    {
      q: "What comes next in 1, 1, 2, 3, 5, 8, 13, 21, 34, ...?",
      options: ["42", "55", "68", "89"],
      answer: 1,
      why: "Add the last two numbers: 21 + 34 = 55.",
    },
    {
      q: "Work out 89 ÷ 55 to 3 decimal places.",
      options: ["1.600", "1.618", "1.625", "1.667"],
      answer: 1,
      why: "89 ÷ 55 = 1.6181..., which rounds to 1.618, the golden ratio. Neighbouring Virahanka numbers this big are already very close to φ.",
    },
    {
      q: "There are 13 rhythms of 6 beats and 21 rhythms of 7 beats, made from short beats (1) and long beats (2). How many rhythms of 8 beats are there?",
      options: ["21", "26", "34", "55"],
      answer: 2,
      why: "An 8-beat rhythm ends in a short beat (then 7 beats come before it: 21 ways) or a long beat (6 beats before it: 13 ways). So 21 + 13 = 34.",
    },
    {
      q: "A plant turns by exactly 90° before each new seed. What does its head look like?",
      options: ["4 straight spokes with gaps between them", "Smooth spirals with no gaps", "One big circle", "13 spirals one way and 21 the other"],
      answer: 0,
      why: "90° is a quarter of a turn, so every 4th seed points the same way again. The seeds stack up along 4 spokes and the space between them is wasted.",
    },
    {
      q: "You count 34 spirals going clockwise on a sunflower. How many are you most likely to count going the other way?",
      options: ["21", "30", "35", "40"],
      answer: 0,
      why: "The two spiral counts are neighbouring Virahanka numbers. Next to 34 are 21 and 55, so 21 is the likely answer.",
    },
  ],
};
