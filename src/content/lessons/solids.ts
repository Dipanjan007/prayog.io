/**
 * Class 10 · Mathematics · Chapter 12 "Surface Areas and Volumes".
 * Covers solids made by joining a cylinder, cone and hemisphere (an ice-cream cone, a capsule,
 * a tent), adding volumes, counting only the outside surface, a cone holding one third of
 * a cylinder, a ball holding two thirds of the cylinder around it, and scaling.
 * This lab uses π = 22/7 everywhere.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { SolidRound } from "@/lib/sim/solids";
import type { LessonDef } from "./types";

export const LESSON_ID = "c10-solids";

/** Challenge: three shop-floor estimates, one star each. */
export const SOLID_ROUNDS: SolidRound[] = [
  {
    name: "Ice-cream parlour",
    brief:
      "A full cylinder tub of ice cream has radius 6 cm and height 15 cm. Each cone has radius 3 cm and height 12 cm, with a hemisphere of ice cream on top. How many cones can be filled? Build both solids to read their volumes.",
    start: "cylinder",
    unit: "cones",
    answer: 10,
    tol: 0.04,
  },
  {
    name: "Camp canvas",
    brief:
      "A camping tent has a cylinder wall 2 m high with radius 3.5 m, and a cone 1.2 m high on top. There is no floor. How many m² of canvas does it need? Within 1% earns the star.",
    start: "tent",
    unit: "m²",
    answer: 84.7,
    tol: 0.01,
  },
  {
    name: "Gulab jamun syrup",
    brief:
      "A gulab jamun is a capsule 5 cm long and 2.8 cm across: a cylinder with a hemisphere at each end. Syrup fills 30% of it. How many cm³ of syrup are in 45 gulab jamuns? Within 2% earns the star.",
    start: "capsule",
    unit: "cm³",
    answer: 338.18,
    tol: 0.02,
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "solid-sculptor",
  classNum: 10,
  book: "Mathematics",
  chapter: "Surface Areas and Volumes",
  title: "Ice creams, capsules and tents",
  intro: {
    objective:
      "Join cones, cylinders and hemispheres into an ice-cream cone, a capsule and a tent, and watch their volume and surface area change as you stretch them. Pour water from a cone and a ball into a glass to see where the one third and two thirds in the formulas come from.",
    learn: [
      "The volume of a joined solid is the sum of the volumes of its parts",
      "Its surface area counts only the outside you can see",
      "A cone holds one third of a cylinder with the same base and height",
      "A ball holds two thirds of the cylinder that just fits around it",
      "Doubling every length makes the area 4 times and the volume 8 times",
    ],
    realLife:
      "Ice-cream shops, tent makers, medicine factories and water-tank builders all need these numbers: how much fits inside, and how much material covers the outside.",
    minutes: 25,
  },
  hook: {
    title: "The ice-cream question",
    text:
      "At the ice-cream cart, the cone comes with a round scoop on top. Your friend says a cone holds almost as much as a cup of the same width and height. Is she right? Before you argue, let's pour some water.",
  },
  predict: {
    question: "A cone and a cylinder glass have the same radius and the same height. How many full cones of water fill the glass?",
    options: ["2", "3", "4"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:cone3",
      title: "Cones into a glass",
      text: "In Pour, pick the cone. Pour cones of water into the glass until it is full.",
      found:
        "Exactly 3 cones filled the glass. Each cone held 89.83 cm³ and the glass holds 269.5 cm³. A cone holds one third of the cylinder with the same base and height: V = (1 ÷ 3)πr²h.",
    },
    {
      id: "task:ball",
      title: "A ball in the glass",
      text: "Now pick the ball, which just fits inside the glass. Pour one ball of water in. How full is the glass?",
      found:
        "One ball filled two thirds of the glass: 179.67 cm³ out of 269.5 cm³. The glass is as tall as the ball (h = 2r), so V(ball) = (2 ÷ 3) × πr² × 2r = (4 ÷ 3)πr³.",
    },
    {
      id: "task:icecream",
      title: "Build an ice-cream cone",
      text: "Switch to Build and pick the ice-cream cone. Set r = 3.5 cm and h = 12 cm. Read its volume and surface area.",
      found:
        "The slant height was l = √(3.5² + 12²) = 12.5 cm. Volume = 154 + 89.83 = 243.83 cm³ (cone + hemisphere). Outside surface = 137.5 + 77 = 214.5 cm². The circle where the scoop sits on the cone is hidden, so it is not counted.",
    },
    {
      id: "task:double",
      title: "Double every length",
      text: "Pick any solid and note its volume and surface area. Then double r and h (and the tent's cone height) and compare.",
      found:
        "Doubling every length made the surface area 4 times bigger (2 × 2) and the volume 8 times bigger (2 × 2 × 2). Area grows with the square of the size and volume with the cube.",
    },
  ],
  discovery: {
    scientist: "Bhaskara II (Bhaskaracharya)",
    years: "1114–1185 CE",
    fact: "In his book Lilavati, Bhaskara II gave rules for the surface and volume of a ball: the surface is four times the area of its biggest circle, and the volume is that surface times the diameter, divided by 6. Legend says he named the book after his daughter, Lilavati.",
    formula: "V(ball) = (S × d) ÷ 6 = (4 ÷ 3)πr³",
    formulaNote: "With S = 4πr² and d = 2r, (4πr² × 2r) ÷ 6 = (4 ÷ 3)πr³: two thirds of the cylinder around the ball.",
  },
  symbols: [
    { sym: "r", meaning: "radius of the round parts, in cm (or m for the tent)" },
    { sym: "h", meaning: "height of the cone or cylinder part" },
    { sym: "H", meaning: "height of the cone on top of the tent" },
    { sym: "l", meaning: "slant height of a cone: from the tip to the edge of the base" },
    { sym: "d", meaning: "diameter of the ball: 2r" },
    { sym: "π", meaning: "pi, the circumference of any circle ÷ its diameter; this lab uses π = 22/7" },
    { sym: "V", meaning: "volume: how much space is inside, in cm³ or m³" },
    { sym: "S", meaning: "surface area: how much outside there is to paint or cover, in cm² or m²" },
    { sym: "², ³", meaning: "squared (× itself) and cubed (× itself × itself); r³ = r × r × r" },
    { sym: "√", meaning: "square root: √25 = 5" },
    { sym: "cm², cm³", meaning: "square centimetres (area) and cubic centimetres (volume); 1000 cm³ = 1 litre" },
  ],
  ideas: [
    {
      title: "Volumes add up",
      text: "To find the volume of a joined solid, find the volume of each part and add them. An ice-cream cone with a scoop is a cone plus a hemisphere. A capsule is a cylinder plus two hemispheres (one ball).",
      formula: "V(ice cream) = (1 ÷ 3)πr²h + (2 ÷ 3)πr³;   V(capsule) = πr²h + (4 ÷ 3)πr³",
    },
    {
      title: "Surfaces: only what you can see",
      text: "When two parts join, the faces where they touch are hidden inside. So the surface area of a joined solid is not the sum of the parts' total surface areas. Add only the outer curved parts. A tent has no floor, so its canvas is the cylinder's side plus the cone.",
      formula: "S(ice cream) = πrl + 2πr²;   S(tent) = 2πrh + πrl",
    },
    {
      title: "One third and two thirds",
      text: "Three cones fill a cylinder with the same base and height. One ball fills two thirds of the cylinder that just fits around it. These pouring facts give the cone and sphere volume formulas.",
      formula: "V(cone) = (1 ÷ 3)πr²h;   V(ball) = (4 ÷ 3)πr³",
    },
    {
      title: "Slant height and scaling",
      text: "A cone's curved surface uses its slant height l, which comes from the Baudhayana-Pythagoras theorem. If you double every length, areas become 4 times and volumes 8 times as big. That is why a big watermelon has much more inside compared with its skin.",
      formula: "l = √(r² + h²);   π = 22/7 in this lab",
    },
  ],
  challenge: {
    title: "Shop-floor estimates",
    text: "An ice-cream parlour, a tent maker and a sweet shop each need a number. Build the solids in the lab, read their volumes or surface areas, and type the answer. One star each.",
  },
  quiz: [
    {
      q: "What is the volume of a cone with radius 7 cm and height 12 cm? (π = 22/7)",
      options: ["616 cm³", "1848 cm³", "308 cm³", "924 cm³"],
      answer: 0,
      why: "V = (1 ÷ 3) × (22 ÷ 7) × 7 × 7 × 12 = (1 ÷ 3) × 1848 = 616 cm³. A cylinder of the same size holds three times as much, 1848 cm³.",
    },
    {
      q: "A toy is a cone of radius 3.5 cm on a hemisphere of the same radius. The whole toy is 15.5 cm tall. What is its surface area? (π = 22/7)",
      options: ["137.5 cm²", "214.5 cm²", "243.83 cm²", "291.5 cm²"],
      answer: 1,
      why: "Cone height = 15.5 − 3.5 = 12 cm, so l = √(3.5² + 12²) = 12.5 cm. S = πrl + 2πr² = 137.5 + 77 = 214.5 cm². Adding the two hidden flat circles (38.5 cm² each) would wrongly give 291.5 cm².",
    },
    {
      q: "Why don't you just add the total surface areas of a cone and a hemisphere to get the toy's surface area?",
      options: [
        "The faces where they join are hidden inside, so they are not on the outside",
        "Surface areas can never be added",
        "You must multiply them instead",
        "The volume changes when you join them",
      ],
      answer: 0,
      why: "The flat circle of the cone and the flat circle of the hemisphere are glued together. Neither is on the outside, so neither is counted.",
    },
    {
      q: "If you double the radius of a ball, its volume becomes:",
      options: ["2 times as big", "4 times as big", "8 times as big", "6 times as big"],
      answer: 2,
      why: "V = (4 ÷ 3)πr³. With 2r instead of r, r³ becomes (2r)³ = 8r³, so the volume is 8 times as big.",
    },
    {
      q: "A metal ball of radius 3 cm is melted and made into small balls of radius 1 cm. How many small balls can be made?",
      options: ["3", "9", "27", "81"],
      answer: 2,
      why: "Volumes compare as 3³ : 1³ = 27 : 1, because both are (4 ÷ 3)π × r³. So 27 small balls.",
    },
  ],
};
