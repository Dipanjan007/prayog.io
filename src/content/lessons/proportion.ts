/**
 * Class 8 · Ganita Prakash (Part 1) · Chapter 7 "Proportional Reasoning-1".
 * Covers ratios and equal ratios (proportion), why multiplying keeps a ratio but
 * adding does not, scaling a recipe, map scales, and equal ratios lying on a
 * straight line through (0, 0).
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { PaintOrder } from "@/lib/sim/proportion";
import type { LessonDef } from "./types";

export const LESSON_ID = "c8-proportion";

/** Challenge: three Holi colour orders, one star each. */
export const ORDERS: PaintOrder[] = [
  {
    name: "Rangoli green",
    brief: "Meena's rangoli needs the sample green: 1 cup blue to 2 cups yellow. She wants exactly 9 cups of it.",
    blue: 1,
    yellow: 2,
    total: 9,
  },
  {
    name: "Holi stall",
    brief: "The Holi stall sells a green made from 2 cups blue to 3 cups yellow. Fill a big drum with exactly 15 cups.",
    blue: 2,
    yellow: 3,
    total: 15,
  },
  {
    name: "School mural",
    brief: "The art teacher's leaf green is 3 cups blue to 5 cups yellow. The mural needs exactly 16 cups.",
    blue: 3,
    yellow: 5,
    total: 16,
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "ratio-raja",
  classNum: 8,
  book: "Ganita Prakash",
  chapter: "Proportional Reasoning-1",
  title: "Same ratio, same taste",
  intro: {
    objective:
      "Mix paint, scale a nimbu-paani recipe and read a town map. Find out why multiplying both parts keeps a ratio the same, while adding the same amount to both parts does not.",
    learn: [
      "A ratio a : b compares two amounts; equal ratios form a proportion",
      "Check equal ratios with cross products: a × d = b × c",
      "Scale a recipe up or down without changing its taste",
      "Use a map scale to find real distances",
      "Equal ratios sit on a straight line through (0, 0)",
    ],
    realLife:
      "Cooks scale recipes for weddings, painters mix the same shade in big drums, and every map and building plan uses a scale. Chai, cement mortar and ORS all follow a ratio.",
    minutes: 20,
  },
  hook: {
    title: "Nimbu-paani for the whole team",
    text:
      "Grandma's nimbu-paani recipe makes 4 glasses. Today the whole cricket team is thirsty. Do you add a few extra lemons? Pour in more water? Get it wrong and it is too sour or too sweet. Paint is the same: mix it wrong and your green turns blue. The secret is keeping the ratio.",
  },
  predict: {
    question: "2 cups of blue and 3 cups of yellow make a green. You add 2 more cups of each colour, so now it is 4 : 5. The new green is:",
    options: ["Exactly the same shade", "A bluer green", "A more yellow green"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:add",
      title: "Add one of each",
      text: "In Paint, the bucket starts at the sample, 2 cups blue and 3 cups yellow. Add one cup of each colour to make 3 : 4. Is it still the same green?",
      found:
        "3 : 4 is a bluer green than 2 : 3. In 2 : 3, yellow is 3 of the 5 cups (60%). In 3 : 4, yellow is only 4 of the 7 cups (about 57%). Adding the same amount to both parts changes the ratio.",
    },
    {
      id: "task:line",
      title: "Same green, three buckets",
      text: "Make three different buckets that all match the sample's green exactly. Watch where their dots land on the graph.",
      found:
        "Mixes like 2 : 3, 4 : 6, 6 : 9 and 8 : 12 all give exactly the same green, because both parts were multiplied by the same number. On the graph their dots lie on one straight line through (0, 0).",
    },
    {
      id: "task:recipe",
      title: "Nimbu-paani for 12",
      text: "Switch to Recipe. The card is for 4 glasses. Make nimbu-paani for 12 glasses that tastes exactly the same.",
      found:
        "12 glasses is 3 times 4 glasses, so everything was multiplied by 3: 6 lemons and 18 spoons of sugar. Each glass still gets ½ a lemon and 1½ spoons of sugar.",
    },
    {
      id: "task:map",
      title: "Read the town map",
      text: "Switch to Map. On this map 1 cm stands for 500 m. Pick a place, work out how far it really is from Home, and check your answer. Do it for two places.",
      found:
        "Every map centimetre is 500 m on the ground. For example, the school is 5 cm from Home on the map, so it is really 5 × 500 m = 2500 m = 2.5 km away. Real distance = map distance × scale.",
    },
  ],
  discovery: {
    scientist: "Aryabhata",
    years: "476–550 CE",
    fact: "In 499 CE, when he was just 23, Aryabhata wrote the Aryabhatiya. One short verse in it gives the rule of three (trairashika): multiply the fruit by the wish and divide by the measure. Indian traders used this rule for prices and amounts for over a thousand years.",
    formula: "x = (fruit × wish) ÷ measure",
    formulaNote: "If 4 glasses (the measure) need 2 lemons (the fruit), then 12 glasses (the wish) need (2 × 12) ÷ 4 = 6 lemons.",
  },
  symbols: [
    { sym: ":", meaning: "ratio, read as \"is to\": 2 : 3 means 2 parts of one thing for every 3 parts of the other" },
    { sym: "a, b, c, d", meaning: "the four numbers in two ratios a : b and c : d" },
    { sym: "×", meaning: "times (multiply)" },
    { sym: "÷", meaning: "divided by" },
    { sym: "½", meaning: "one half, 0.5" },
    { sym: "x, y", meaning: "two amounts that change together, like cups of blue (x) and cups of yellow (y)" },
    { sym: "cm, m, km", meaning: "centimetre, metre, kilometre; 1 km = 1000 m" },
    { sym: "%", meaning: "per cent: out of 100" },
  ],
  ideas: [
    {
      title: "Equal ratios make a proportion",
      text: "A ratio a : b compares two amounts. Two ratios are equal when the cross products match. Then we say a, b, c and d are in proportion. This works even when the numbers are big: 6 : 9 and 8 : 12 are equal because 6 × 12 = 9 × 8 = 72.",
      formula: "a : b = c : d when a × d = b × c;  2 : 3 = 4 : 6 because 2 × 6 = 3 × 4",
    },
    {
      title: "Multiply, don't add",
      text: "Multiplying (or dividing) both parts by the same number keeps the ratio, so the paint stays the same green. Adding the same number to both parts gives a new ratio, and the colour changes.",
      formula: "(2 × 2) : (3 × 2) = 4 : 6, same green;  (2 + 1) : (3 + 1) = 3 : 4, a new green",
    },
    {
      title: "Scaling recipes and maps",
      text: "Find the amount for one glass, then multiply by the number of glasses. A map works the same way: each centimetre on the map stands for a fixed real distance, so real distance = map distance × scale.",
      formula: "lemons = (2 ÷ 4) × glasses;  real distance = map cm × 500 m",
    },
    {
      title: "Proportion on a graph",
      text: "Plot equal-ratio mixes with blue cups across and yellow cups up. The dots fall on one straight line that passes through (0, 0). If y ÷ x is the same for every point, the points are in proportion.",
      formula: "yellow = (3 ÷ 2) × blue",
    },
  ],
  challenge: {
    title: "Holi colour orders",
    text: "Three customers want their sample's exact shade, and exactly the number of cups they asked for. Mix it and deliver. One star per order.",
  },
  quiz: [
    {
      q: "A biryani recipe uses 3 cups of rice for 6 people. How much rice for 10 people?",
      options: ["5 cups", "7 cups", "6 cups", "4 cups"],
      answer: 0,
      why: "Each person needs 3 ÷ 6 = ½ cup, so 10 people need ½ × 10 = 5 cups.",
    },
    {
      q: "Which ratio is equal to 4 : 6?",
      options: ["6 : 8", "10 : 15", "5 : 7", "8 : 10"],
      answer: 1,
      why: "Cross products: 4 × 15 = 60 and 6 × 10 = 60, so 4 : 6 = 10 : 15. Both are 2 : 3 in simplest form.",
    },
    {
      q: "On a map, 1 cm stands for 5 km. Two towns are 7 cm apart on the map. How far apart are they really?",
      options: ["12 km", "35 km", "70 km", "1.4 km"],
      answer: 1,
      why: "Real distance = map distance × scale = 7 × 5 km = 35 km.",
    },
    {
      q: "Riya mixes 2 cups of red with 5 cups of white to make pink. Then she adds 1 more cup of each. Her pink is now:",
      options: ["Exactly the same", "Darker (more red)", "Lighter (more white)", "Impossible to tell"],
      answer: 1,
      why: "Before, red was 2 of 7 cups (about 29%). After, 3 : 6, red is 3 of 9 cups (about 33%). More red, so a darker pink.",
    },
    {
      q: "Which set of points (x, y) lies on a straight line through (0, 0)?",
      options: ["(1, 3), (2, 6), (4, 12)", "(1, 3), (2, 5), (3, 7)", "(1, 2), (2, 3), (3, 4)", "(2, 1), (3, 3), (4, 5)"],
      answer: 0,
      why: "Only in the first set is y ÷ x the same for every point: 3 ÷ 1 = 6 ÷ 2 = 12 ÷ 4 = 3. Equal ratios lie on a line through (0, 0).",
    },
  ],
};
