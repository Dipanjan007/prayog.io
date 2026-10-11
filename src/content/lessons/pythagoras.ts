/**
 * Class 8 · Ganita Prakash (Part 2) · Chapter 2 "The Baudhayana-Pythagoras Theorem".
 * Covers squares on the sides of a right triangle, finding a missing side,
 * whole-number (Baudhayana) triples and a ladder leaning on a wall.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { Rescue } from "@/lib/sim/pythagoras";
import type { LessonDef } from "./types";

export const LESSON_ID = "c8-pythagoras";

/** Challenge: three fire-brigade rescues, one star each. */
export const RESCUES: Rescue[] = [
  {
    name: "Cat on a balcony",
    brief: "A kitten is stuck on a balcony 8 m up. A flower bed keeps the ladder's foot 6 m from the wall. Pick the ladder whose top rests exactly on the railing.",
    h: 8,
    d: 6,
  },
  {
    name: "Fourth-floor window",
    brief: "A family waits at a window 12 m up. A parked car keeps the ladder's foot 5 m from the wall. Which ladder rests exactly on the sill?",
    h: 12,
    d: 5,
  },
  {
    name: "Top-floor smoke",
    brief: "Smoke on the top floor! The window sill is 15 m up and an open drain keeps the ladder's foot 8 m from the wall.",
    h: 15,
    d: 8,
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "square-sage",
  classNum: 8,
  book: "Ganita Prakash Part 2",
  chapter: "The Baudhayana-Pythagoras Theorem",
  title: "Squares on a right triangle",
  intro: {
    objective:
      "Grow squares on the sides of a triangle, open and close its corner, and find out why a right angle makes two squares add up exactly to the third. Then use it to send fire ladders to the right windows.",
    learn: [
      "In a right triangle, the square on the longest side equals the other two squares together: c² = a² + b²",
      "Find a missing side with a square root",
      "Whole-number right triangles like 3, 4, 5 and 5, 12, 13",
      "How long a ladder must be to reach a window",
    ],
    realLife:
      "Phone and TV sizes are measured along the diagonal of the screen. Masons check that a wall corner is square with a 3-4-5 string, and fire engines pick ladders the same way.",
    minutes: 20,
  },
  hook: {
    title: "The 32-inch puzzle",
    text:
      "Your family is buying a new TV. The box says 32 inches, but the TV is much less than 32 inches wide. Where does the 32 come from? It is measured corner to corner, across the diagonal. Ancient Indian altar builders knew how to work out a diagonal from the length and breadth. Let's find their trick.",
  },
  predict: {
    question: "A 5 m ladder leans on a wall with its foot 3 m from the wall. How high up the wall does it reach?",
    options: ["2 m", "4 m", "8 m"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:right",
      title: "Squares on a right triangle",
      text: "In Squares, keep the corner at 90°. Compare a² + b² with c², then change a and b and compare again.",
      found:
        "Both times the two smaller squares together had exactly the same area as the big square on the long side. With a 90° corner, c² = a² + b² every time.",
    },
    {
      id: "task:corner",
      title: "Open and close the corner",
      text: "Now make the corner smaller than 90°, then bigger than 90°. Watch c² and a² + b².",
      found:
        "A sharp corner (less than 90°) made c² smaller than a² + b². A wide corner (more than 90°) made c² bigger. They are equal only at exactly 90°.",
    },
    {
      id: "task:whole",
      title: "Whole numbers only",
      text: "With a 90° corner, find whole-number sides a and b that make c a whole number too.",
      found:
        "You found a Baudhayana triple: three whole numbers with a² + b² = c², like 3, 4, 5 or 6, 8, 10 or 5, 12, 13. Most pairs give a c with a never-ending decimal, so these are special.",
    },
    {
      id: "task:ladder",
      title: "Ladder against the wall",
      text: "Switch to Ladder. Make a 10 m ladder reach exactly 8 m up the wall by moving its foot.",
      found:
        "The foot had to stand 6 m from the wall, because 6² + 8² = 36 + 64 = 100 = 10². The ladder is the hypotenuse, and the ground and the wall make the right angle.",
    },
  ],
  discovery: {
    scientist: "Baudhayana",
    years: "about 800 BCE",
    fact: "Baudhayana wrote one of the Sulba Sutras, rules with ropes and pegs for building fire altars with exact shapes. It says the rope along the diagonal of a rectangle makes as much area as the ropes along its length and breadth together. Pythagoras in Greece is linked with the same idea centuries later.",
    formula: "c² = a² + b²",
    formulaNote: "In a right triangle, the square on the longest side (the hypotenuse) equals the other two squares together.",
  },
  symbols: [
    { sym: "a, b", meaning: "the two shorter sides, which meet at the right angle" },
    { sym: "c", meaning: "the hypotenuse: the longest side, opposite the right angle" },
    { sym: "²", meaning: "squared: a number times itself; 5² = 5 × 5 = 25" },
    { sym: "√", meaning: "square root: the number that times itself gives this one; √25 = 5" },
    { sym: "L", meaning: "length of the ladder, in m" },
    { sym: "d", meaning: "distance of the ladder's foot from the wall, in m" },
    { sym: "h", meaning: "height the ladder reaches up the wall, in m" },
  ],
  ideas: [
    {
      title: "The Baudhayana-Pythagoras theorem",
      text: "In a triangle with a right angle, draw a square on each side. The area of the square on the hypotenuse equals the areas of the other two squares added together. The hypotenuse is always the side opposite the right angle, and it is always the longest side.",
      formula: "c² = a² + b²",
    },
    {
      title: "Finding a missing side",
      text: "Know the two short sides? Square them, add, then take the square root. Know the hypotenuse and one side? Square both, subtract, then take the square root. That is how the ladder problems work: L² = d² + h².",
      formula: "c = √(a² + b²);   a = √(c² − b²)",
    },
    {
      title: "Only for right angles",
      text: "If the corner between a and b is sharper than 90°, the third side is shorter, so c² is less than a² + b². If the corner is wider than 90°, c² is more. This gives a test: if c² = a² + b², the triangle has a right angle.",
      formula: "corner < 90°: c² < a² + b²;   corner > 90°: c² > a² + b²",
    },
    {
      title: "Baudhayana triples",
      text: "Some right triangles have whole-number sides: 3, 4, 5 and 5, 12, 13 and 8, 15, 17. Multiply all three numbers by the same number and you get another one: 6, 8, 10 or 9, 12, 15. Masons use a 3-4-5 string to check that a corner is square.",
      formula: "3² + 4² = 5²   (9 + 16 = 25)",
    },
  ],
  challenge: {
    title: "Fire brigade rescues",
    text: "Three windows, three tricky spots for the ladder's foot. Pick the ladder from the fire engine whose top rests exactly on each sill. One star per rescue.",
  },
  quiz: [
    {
      q: "A right triangle has shorter sides 6 cm and 8 cm. How long is the hypotenuse?",
      options: ["10 cm", "12 cm", "14 cm", "48 cm"],
      answer: 0,
      why: "c² = 6² + 8² = 36 + 64 = 100, so c = √100 = 10 cm.",
    },
    {
      q: "A phone screen is 9 cm wide and 12 cm tall. How long is its diagonal?",
      options: ["13 cm", "15 cm", "18 cm", "21 cm"],
      answer: 1,
      why: "9² + 12² = 81 + 144 = 225, and √225 = 15 cm. Screen sizes are measured along this diagonal.",
    },
    {
      q: "Which three lengths make a right triangle?",
      options: ["4, 5, 6", "5, 12, 13", "6, 7, 8", "2, 3, 4"],
      answer: 1,
      why: "5² + 12² = 25 + 144 = 169 = 13². For the others, the two smaller squares do not add up to the biggest one.",
    },
    {
      q: "A 13 m ladder reaches a window 12 m up a wall. How far is its foot from the wall?",
      options: ["1 m", "5 m", "7 m", "25 m"],
      answer: 1,
      why: "d = √(13² − 12²) = √(169 − 144) = √25 = 5 m.",
    },
    {
      q: "A triangle has sides 7 cm, 8 cm and 12 cm. The angle opposite the 12 cm side is:",
      options: ["Acute (less than 90°)", "A right angle", "Obtuse (more than 90°)", "Impossible to tell"],
      answer: 2,
      why: "12² = 144 is more than 7² + 8² = 49 + 64 = 113, so the corner opposite 12 cm is wider than 90°.",
    },
  ],
};
