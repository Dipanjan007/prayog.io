/**
 * Class 8 · Ganita Prakash (Part I) · Chapter 1 "A Square and A Cube".
 * Covers perfect squares as tiles that fill a square, the odd-number pattern
 * 1 + 3 + 5 + … = n², square roots by fitting tiles (and √N between two whole numbers),
 * perfect cubes as stacks of unit cubes, and Ramanujan's taxi number 1729.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { Order } from "@/lib/sim/squarescubes";
import type { LessonDef } from "./types";

export const LESSON_ID = "c8-squares-cubes";

/** Challenge: three build orders, one star each. Pick the side of the biggest square or cube that fits. */
export const ORDERS: Order[] = [
  {
    name: "Annual Day stage",
    brief: "The school has 90 square tiles for a square stage. Lay the biggest full square you can. How many tiles long is each side?",
    kind: "square",
    total: 90,
  },
  {
    name: "Rangoli courtyard",
    brief: "A housing society bought 200 tiles for a square courtyard with a rangoli in the middle. Lay the biggest full square you can.",
    kind: "square",
    total: 200,
  },
  {
    name: "Toy shop tower",
    brief: "A toy shop has 500 wooden blocks, each a unit cube. Build the biggest solid cube you can for the shop window.",
    kind: "cube",
    total: 500,
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "tile-master",
  classNum: 8,
  book: "Ganita Prakash",
  chapter: "A Square and A Cube",
  title: "Tiles, cubes and 1729",
  intro: {
    objective:
      "Lay square tiles and stack unit cubes to find out which numbers make perfect squares and cubes. Spot the odd-number pattern hiding inside every square, find square roots by fitting tiles, and hunt down Ramanujan's famous taxi number.",
    learn: [
      "Perfect squares: numbers of tiles that fill a square exactly, like 25 = 5²",
      "The first n odd numbers always add up to n²",
      "Finding a square root, and which two whole numbers it lies between",
      "Perfect cubes like 64 = 4³, and why 1729 is special",
    ],
    realLife:
      "Tiling a floor, packing boxes into a cube-shaped carton, a chessboard of 8 × 8 = 64 squares, and a Rubik's cube that looks like 3 × 3 × 3 = 27 small cubes all use squares and cubes.",
    minutes: 20,
  },
  hook: {
    title: "The Annual Day stage",
    text:
      "Your school is laying square tiles to make a square stage for Annual Day. The shop delivers 50 tiles. Can you make one big square with all of them? If not, how big a square can you make, and how many tiles are left? Some numbers of tiles fit perfectly and some never do. Let's find out which.",
  },
  predict: {
    question: "Without a calculator: what is 1 + 3 + 5 + 7 + 9 + 11 + 13 + 15 + 17 + 19 (the first ten odd numbers)?",
    options: ["90", "100", "110"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:perfect",
      title: "Squares with nothing left over",
      text: "In Tiles, change the number of tiles. Find three different numbers (more than 1) that make a full square with no tiles left over.",
      found:
        "Only some numbers worked, like 4, 9, 16, 25, 36 and 49. These are the perfect squares: n × n tiles make an n × n square. Every other number leaves some tiles over.",
    },
    {
      id: "task:odd",
      title: "Odd layers",
      text: "Turn on Odd layers and make a full 5 × 5 square. Count the tiles in each L-shaped layer.",
      found:
        "The layers had 1, 3, 5, 7 and 9 tiles. Each new layer wraps round two sides and a corner of the old square, so it is always the next odd number. Together, 1 + 3 + 5 + 7 + 9 = 25 = 5².",
    },
    {
      id: "task:root",
      title: "Square root by fitting tiles",
      text: "Put down exactly 50 tiles. How big a square can you make, and how many tiles are left?",
      found:
        "50 tiles make a 7 × 7 square with 1 tile left over, and an 8 × 8 square would need 64. So √50 is more than 7 but less than 8. (It is about 7.07.)",
    },
    {
      id: "task:cube",
      title: "Stack a cube",
      text: "Switch to Cubes. Build a cube whose edge is 4 unit cubes long.",
      found:
        "4 layers of 4 × 4 = 16 cubes make 4 × 4 × 4 = 64 = 4³ unit cubes. 64 is also 8 × 8, so it is both a perfect square and a perfect cube.",
    },
    {
      id: "task:taxi",
      title: "The taxi number",
      text: "Switch to Cube sums. Find two different pairs of cubes that add up to 1729.",
      found:
        "1³ + 12³ = 1 + 1728 = 1729, and 9³ + 10³ = 729 + 1000 = 1729. No smaller number can be split into two cubes in two different ways.",
    },
  ],
  discovery: {
    scientist: "Srinivasa Ramanujan",
    years: "1887–1920",
    fact: "When Ramanujan was ill in a nursing home in England, the mathematician G. H. Hardy came to visit in taxi number 1729. Hardy said it seemed a rather dull number. Ramanujan at once replied that it was very interesting: it is the smallest number that can be written as the sum of two cubes in two different ways.",
    formula: "1729 = 1³ + 12³ = 9³ + 10³",
    formulaNote: "Numbers like this are now called taxicab numbers, after Hardy's taxi.",
  },
  symbols: [
    { sym: "N", meaning: "the number of tiles or unit cubes you have" },
    { sym: "n", meaning: "the side of the square, or the edge of the cube, counted in tiles or cubes" },
    { sym: "²", meaning: "squared: a number times itself; 5² = 5 × 5 = 25" },
    { sym: "³", meaning: "cubed: a number times itself three times; 4³ = 4 × 4 × 4 = 64" },
    { sym: "√", meaning: "square root: the number that times itself gives this one; √25 = 5" },
    { sym: "∛", meaning: "cube root: the number that, used three times in a product, gives this one; ∛64 = 4" },
    { sym: "…", meaning: "and so on, following the same pattern" },
    { sym: "<", meaning: "is less than; 7 < 8" },
  ],
  ideas: [
    {
      title: "Perfect squares",
      text: "N tiles fill a square with nothing left over only when N = n × n for some whole number n. These numbers, 1, 4, 9, 16, 25, 36, …, are the perfect squares. The side of the square is the square root.",
      formula: "n² = n × n;   √(n²) = n",
    },
    {
      title: "Odd numbers build squares",
      text: "Grow a square one size bigger by wrapping an L-shaped layer round it. The layers have 1, 3, 5, 7, … tiles, so adding the first n odd numbers always gives n². That is why the first ten odd numbers add up to 10² = 100.",
      formula: "1 + 3 + 5 + … + (2n − 1) = n²",
    },
    {
      title: "Square roots between squares",
      text: "If N is not a perfect square, fit the biggest square you can. Its side is the whole number just below √N, and one more than that is just above √N. Perfect squares only ever end in 0, 1, 4, 5, 6 or 9, so a number ending in 2, 3, 7 or 8 is never a perfect square.",
      formula: "7² = 49 < 50 < 64 = 8², so 7 < √50 < 8",
    },
    {
      title: "Perfect cubes",
      text: "Stack n layers of n × n unit cubes and you get a solid cube of n × n × n = n³ cubes: 1, 8, 27, 64, 125, …. The edge of the cube is the cube root.",
      formula: "n³ = n × n × n;   ∛(n³) = n;   64 = 8² = 4³",
    },
  ],
  challenge: {
    title: "Build to order",
    text: "Three customers, three piles of tiles and blocks. Pick the side of the biggest full square or solid cube that the pile can make, then build it. One star per order.",
  },
  quiz: [
    {
      q: "A square floor uses exactly 196 tiles. How many tiles long is each side?",
      options: ["13", "14", "16", "98"],
      answer: 1,
      why: "√196 = 14, because 14 × 14 = 196. (13 × 13 = 169 and 16 × 16 = 256.)",
    },
    {
      q: "Which of these numbers is not a perfect square?",
      options: ["4,096", "3,969", "2,187", "1,764"],
      answer: 2,
      why: "Perfect squares end in 0, 1, 4, 5, 6 or 9. 2,187 ends in 7, so it cannot be a square. The others are 64², 63² and 42².",
    },
    {
      q: "What is the sum of the first 12 odd numbers, 1 + 3 + 5 + … + 23?",
      options: ["121", "132", "144", "156"],
      answer: 2,
      why: "The first n odd numbers add up to n², so the first 12 add up to 12² = 144.",
    },
    {
      q: "A wooden cube with 6 cm edges is cut into 1 cm cubes. How many small cubes do you get?",
      options: ["18", "36", "108", "216"],
      answer: 3,
      why: "6 layers of 6 × 6 = 36 cubes: 6³ = 6 × 6 × 6 = 216.",
    },
    {
      q: "You have 90 tiles. How many more tiles do you need to make the next full square?",
      options: ["1", "9", "10", "19"],
      answer: 2,
      why: "90 tiles make a 9 × 9 square (81 tiles) with 9 left. The next square is 10 × 10 = 100, so you need 100 − 90 = 10 more.",
    },
  ],
};
