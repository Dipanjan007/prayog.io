/**
 * Class 10 · Mathematics · Chapter 8 "Introduction to Trigonometry".
 * Covers sin θ, cos θ and tan θ as ratios of the sides of a right triangle, why they depend
 * only on the angle and not on the size of the triangle, the values for 30°, 45° and 60°,
 * the identity sin²θ + cos²θ = 1, and building ramps with a given slope.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { RampRound } from "@/lib/sim/trig";
import type { LessonDef } from "./types";

export const LESSON_ID = "c10-trig-ratios";

/** Challenge: three ramps to build from a ratio, one star each. */
export const RAMP_ROUNDS: RampRound[] = [
  {
    name: "Wheelchair ramp",
    brief:
      "The new health centre needs a wheelchair ramp. Accessibility guidelines say it should rise 1 for every 12 along the ground. Build a ramp with tan θ = 1 ÷ 12, then check it.",
    ratio: "tan",
    num: 1,
    den: 12,
  },
  {
    name: "Park slide",
    brief: "The park wants a slide whose height is 3 ÷ 5 of its sloping length. Build a ramp with sin θ = 3 ÷ 5.",
    ratio: "sin",
    num: 3,
    den: 5,
  },
  {
    name: "Tempo loading ramp",
    brief: "A shopkeeper rolls gas cylinders up a plank into a tempo. Build a plank with cos θ = 12 ÷ 13.",
    ratio: "cos",
    num: 12,
    den: 13,
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "trig-trailblazer",
  classNum: 10,
  book: "Mathematics",
  chapter: "Introduction to Trigonometry",
  title: "Slides, ramps and sin θ",
  intro: {
    objective:
      "Tilt a playground slide and stretch it to any length. Watch three side ratios, sin θ, cos θ and tan θ, and find out why they belong to the angle and not to the size. Then build ramps to order, including a wheelchair ramp.",
    learn: [
      "sin θ = opposite ÷ hypotenuse, cos θ = adjacent ÷ hypotenuse, tan θ = opposite ÷ adjacent",
      "Why the ratios stay the same when the triangle is made bigger or smaller",
      "The values of sin, cos and tan for 30°, 45° and 60°",
      "Why sin²θ + cos²θ = 1 for every angle",
    ],
    realLife:
      "Engineers use these ratios for ramps, roads on hills, roofs, staircases and railway gradients. Your phone uses them to know which way it is tilted.",
    minutes: 20,
  },
  hook: {
    title: "Two slides in the park",
    text:
      "Your colony park has a small slide for little kids and a big one for older kids. Both lean at the same angle. The big slide is twice as long, and twice as high. Your friend says the big slide must be steeper. Is she right? Three numbers will settle it.",
  },
  predict: {
    question: "A small slide and a slide twice as long both lean at 30°. How does height ÷ length for the big slide compare with the small one?",
    options: ["It is twice as much", "It is exactly the same", "It is half as much"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:scale",
      title: "Same angle, any size",
      text: "Keep θ fixed and try three different slide lengths. Watch sin θ, cos θ and tan θ.",
      found:
        "The sides grew and shrank, but sin θ, cos θ and tan θ did not change at all. When the slide gets longer, its height and its base grow by the same factor, so their ratios stay fixed. The ratios belong to the angle, not to the size.",
    },
    {
      id: "task:special",
      title: "30°, 45° and 60°",
      text: "Set θ to 30°, then 45°, then 60°. Read sin θ, cos θ and tan θ each time.",
      found:
        "At 30°, sin θ = 0.500 exactly: the height is half the slide. At 45°, the height equals the base, so tan 45° = 1 and sin 45° = cos 45° ≈ 0.707. At 60°, sin θ ≈ 0.866 and cos θ = 0.500: 30° and 60° swap their sin and cos.",
    },
    {
      id: "task:ends",
      title: "Nearly flat, nearly a wall",
      text: "Drag θ all the way down to 5°, then all the way up to 85°.",
      found:
        "At 5°, sin θ ≈ 0.087 and cos θ ≈ 0.996. At 85° they swapped: sin θ ≈ 0.996 and cos θ ≈ 0.087, and tan θ ≈ 11.430. sin θ and cos θ always stay between 0 and 1, because no side is longer than the hypotenuse. tan θ keeps growing as the slide stands up.",
    },
    {
      id: "task:345",
      title: "A 3-4-5 ramp",
      text: "Switch to Build. Make a ramp that rises 0.3 m over a run of 0.4 m (or any rise and run in the ratio 3 : 4). Check sin²θ + cos²θ.",
      found:
        "The sloping side came out exactly 5 parts long, so sin θ = 3 ÷ 5 and cos θ = 4 ÷ 5. Then sin²θ + cos²θ = (9 ÷ 25) + (16 ÷ 25) = 25 ÷ 25 = 1. It is Pythagoras in disguise: 3² + 4² = 5².",
    },
  ],
  discovery: {
    scientist: "Varahamihira",
    years: "c. 505–587 CE",
    fact: "Varahamihira lived in Ujjain and wrote the Pancha-siddhantika, a summary of five schools of astronomy of his time. It has a table of sines, and rules that are the same as sin²θ + cos²θ = 1, worked out about 1,500 years ago to track the Sun, Moon and planets.",
    formula: "sin²θ + cos²θ = 1",
    formulaNote: "For every angle θ: square the sine, square the cosine, add them, and you always get exactly 1.",
  },
  symbols: [
    { sym: "θ", meaning: "theta, a Greek letter used for an angle; here the angle the slide makes with the ground" },
    { sym: "sin θ", meaning: "sine of θ: opposite side ÷ hypotenuse" },
    { sym: "cos θ", meaning: "cosine of θ: adjacent side ÷ hypotenuse" },
    { sym: "tan θ", meaning: "tangent of θ: opposite side ÷ adjacent side" },
    { sym: "sin²θ", meaning: "(sin θ)², the sine multiplied by itself" },
    { sym: "opposite", meaning: "the side facing the angle θ: the height of the slide" },
    { sym: "adjacent", meaning: "the side next to θ that is not the hypotenuse: the ground under the slide" },
    { sym: "hypotenuse", meaning: "the longest side, facing the right angle: the slide itself" },
    { sym: "√", meaning: "square root; √3 is about 1.732 and √2 about 1.414" },
    { sym: "≈", meaning: "is about equal to" },
    { sym: "m", meaning: "metres" },
  ],
  ideas: [
    {
      title: "Three ratios of a right triangle",
      text: "Pick one of the two sharp angles and call it θ. The side facing it is the opposite side, the slanting side is the hypotenuse, and the third side is the adjacent side. Divide them in pairs to get three ratios.",
      formula: "sin θ = opposite ÷ hypotenuse;   cos θ = adjacent ÷ hypotenuse;   tan θ = opposite ÷ adjacent",
    },
    {
      title: "Size does not matter, the angle does",
      text: "Right triangles with the same angle θ are similar: one is just a scaled copy of the other. Every side is multiplied by the same number, so each ratio stays the same. That is why a calculator can have one sin button for each angle.",
      formula: "tan θ = sin θ ÷ cos θ",
    },
    {
      title: "The table to remember",
      text: "Half of a square gives 45°. Half of an equilateral triangle gives 30° and 60°. From these shapes come exact values that NCERT asks you to know.",
      formula: "sin 30° = cos 60° = 1 ÷ 2;   sin 45° = cos 45° = 1 ÷ √2;   tan 30° = 1 ÷ √3;   tan 60° = √3",
    },
    {
      title: "sin²θ + cos²θ = 1",
      text: "Pythagoras says opposite² + adjacent² = hypotenuse². Divide both sides by hypotenuse² and you get (opposite ÷ hypotenuse)² + (adjacent ÷ hypotenuse)² = 1. That is sin²θ + cos²θ = 1. If you know sin θ, you can find cos θ.",
      formula: "sin²θ + cos²θ = 1",
    },
  ],
  challenge: {
    title: "Ramps to order",
    text: "Build three ramps from their ratios: a wheelchair ramp, a park slide and a tempo loading plank. Set the rise and the run, then check. Each ramp earns a star.",
  },
  quiz: [
    {
      q: "In a right triangle, the side opposite θ is 5 cm and the hypotenuse is 13 cm. What is sin θ?",
      options: ["5 ÷ 13", "12 ÷ 13", "5 ÷ 12", "13 ÷ 5"],
      answer: 0,
      why: "sin θ = opposite ÷ hypotenuse = 5 ÷ 13.",
    },
    {
      q: "In the same triangle (opposite 5 cm, hypotenuse 13 cm), what is tan θ?",
      options: ["12 ÷ 5", "5 ÷ 13", "5 ÷ 12", "12 ÷ 13"],
      answer: 2,
      why: "adjacent = √(13² − 5²) = √(169 − 25) = √144 = 12 cm. So tan θ = opposite ÷ adjacent = 5 ÷ 12.",
    },
    {
      q: "What is sin 30° + cos 60°?",
      options: ["1 ÷ 2", "1", "√3", "0"],
      answer: 1,
      why: "sin 30° = 1 ÷ 2 and cos 60° = 1 ÷ 2, so the sum is (1 ÷ 2) + (1 ÷ 2) = 1.",
    },
    {
      q: "θ is an acute angle and sin θ = 0.6. What is cos θ?",
      options: ["0.4", "0.8", "0.64", "1.6"],
      answer: 1,
      why: "cos²θ = 1 − sin²θ = 1 − (0.6 × 0.6) = 1 − 0.36 = 0.64, so cos θ = √0.64 = 0.8.",
    },
    {
      q: "A wheelchair ramp must have tan θ = 1 ÷ 12. The doorstep is 0.5 m high. How far along the ground must the ramp run?",
      options: ["0.5 m", "2.4 m", "6 m", "12 m"],
      answer: 2,
      why: "tan θ = rise ÷ run, so run = rise ÷ tan θ = 0.5 ÷ (1 ÷ 12) = 0.5 × 12 = 6 m.",
    },
  ],
};
