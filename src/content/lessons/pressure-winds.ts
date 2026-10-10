/**
 * Class 8 · Curiosity · "Pressure, Winds, Storms, and Cyclones".
 * Every fact here was checked against standard NCERT physics; recheck the
 * wording against the chapter PDF whenever NCERT revises the book.
 */

import type { LessonDef } from "./types";

export const LESSON_ID = "c8-pressure-winds";

/** Lift-to-drag ratios needed for 1, 2 and 3 stars in the wing challenge. Tuned on both grid sizes. */
export const WING_STARS = [1.0, 1.3, 1.5];

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "wind-whisperer",
  classNum: 8,
  book: "Curiosity",
  chapter: "Pressure, Winds, Storms, and Cyclones",
  title: "Why do storms rip roofs off?",
  intro: {
    objective:
      "Use a wind tunnel to see how moving air creates pressure differences, and how that lifts roofs, planes and race cars.",
    learn: [
      "Air exerts pressure, and fast-moving air has lower pressure",
      "Wind blows from high pressure to low pressure",
      "How cyclones form and why they damage roofs",
      "How a wing makes lift, and how a rear wing makes downforce",
    ],
    realLife:
      "Cyclone warnings on the Odisha coast, aeroplane wings and the rear wing of a sports car all come from the same pressure ideas.",
    minutes: 25,
  },
  hook: {
    title: "The roof puzzle",
    text:
      "In a cyclone the wind blows sideways, past the house. Yet roofs get lifted straight up into the air. Something invisible is pushing them. Let's find it in the wind tunnel.",
  },
  predict: {
    question: "A strong wind blows across a roof. What happens to the air pressure just above the roof?",
    options: ["It goes up, pressing the roof down", "It goes down, so the roof can be pushed up", "It stays the same"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:push",
      title: "Find the push",
      text:
        "Pick the Box, set the wind to 60 km/h or more, and use the Pressure view. Wait until the readings are steady.",
      found: "See the orange patch on the front? Air piles up there and its pressure rises. That is the push you feel when you face a strong wind.",
    },
    {
      id: "task:roof",
      title: "Lift the roof",
      text: "Pick the House and turn the wind up to cyclone speed, 120 km/h or more. Watch the blue Lift arrow once the air settles.",
      found:
        "Above the roof the air rushes fast and its pressure drops (blue). Inside the house the air is still, at normal pressure, so it pushes the roof up.",
    },
    {
      id: "task:shapes",
      title: "Beat the drag",
      text: "At 90 km/h or more, test the Ball, the Box and the Raindrop. Let each one settle so we can record its drag.",
      found: "Smooth, pointed shapes let the air close in behind them, so less low-pressure wake pulls them back.",
    },
    {
      id: "task:car",
      title: "Glue the car to the road",
      text: "Pick the Sports car at 100 km/h or more. Its body lifts a little at speed. Tilt the rear wing's front edge down, a lot, until the blue meter shows Downforce.",
      found:
        "The upside-down wing makes air rush faster underneath it, so the pressure there drops. Higher pressure on top pushes the car onto the road for better grip, but notice the drag went up too.",
    },
  ],
  discovery: {
    scientist: "Daniel Bernoulli",
    years: "1700–1782",
    fact: "Bernoulli trained as a doctor. His 1738 book Hydrodynamica showed that faster-moving fluid has lower pressure, and his trick of putting a thin tube into a flowing pipe was later used to measure blood pressure for about 170 years.",
    formula: "P + (½ × ρ × v²) = constant",
    formulaNote: "Bernoulli's principle: where air (density ρ) moves faster (bigger v), its pressure P drops. That is how wings lift planes and push racing cars down.",
  },
  symbols: [
    { sym: "P", meaning: "pressure of the air, in pascals (Pa)" },
    { sym: "ρ", meaning: "rho, density of the air, about 1.2 kg/m³" },
    { sym: "v", meaning: "speed of the air, in m/s" },
    { sym: "½", meaning: "one half" },
    { sym: "F", meaning: "force, in N" },
    { sym: "A", meaning: "area, in m²" },
  ],
  ideas: [
    {
      title: "Air exerts pressure",
      text: "Pressure is the force acting on each unit of area. Where moving air is stopped, as on the front of the box, its pressure rises.",
      formula: "Pressure = Force ÷ Area   (unit: pascal, Pa = N/m²)",
    },
    {
      title: "Fast air, low pressure",
      text: "Wind speeding over a roof has lower pressure than the still air inside the house. The difference pushes the roof up. That is why storms lift roofs.",
    },
    {
      title: "Wind flows from high to low",
      text: "Air always moves from a region of high pressure to one of low pressure. Uneven heating of land and water makes these differences, and that flow is wind.",
    },
    {
      title: "Cyclones",
      text: "A cyclone is a giant storm of winds spiralling around a calm centre called the eye, where the pressure is very low.",
    },
  ],
  challenge: {
    title: "Wing challenge",
    text: "Pick the Wing, keep the wind at 90 km/h or more, and tilt it until its lift beats its drag. The higher lift ÷ drag, the more stars.",
  },
  quiz: [
    {
      q: "A box weighs 600 N and rests on a face of area 2 m². What pressure does it put on the floor?",
      options: ["1200 Pa", "300 Pa", "602 Pa", "0.003 Pa"],
      answer: 1,
      why: "Pressure = 600 N ÷ 2 m² = 300 Pa.",
    },
    {
      q: "A force of 50 N acts on an area of 0.25 m². What is the pressure?",
      options: ["12.5 Pa", "50.25 Pa", "200 Pa", "0.005 Pa"],
      answer: 2,
      why: "Pressure = 50 N ÷ 0.25 m² = 200 Pa.",
    },
    {
      q: "Why does a sharp knife cut better than a blunt one?",
      options: [
        "Its thin edge has a small area, so the same force makes more pressure",
        "A sharp knife is heavier",
        "Sharp metal is harder than blunt metal",
        "A sharp knife has no friction",
      ],
      answer: 0,
      why: "Smaller area for the same force means higher pressure.",
    },
    {
      q: "Wind blows from…",
      options: ["Low pressure to high pressure", "High pressure to low pressure", "Cold places to the Sun", "Only from the sea"],
      answer: 1,
      why: "Air moves from high pressure towards low pressure.",
    },
    {
      q: "In a storm, why can a tin roof be lifted off?",
      options: [
        "The wind hits the roof from below",
        "Fast wind above the roof lowers the pressure there, and the normal pressure inside pushes it up",
        "The roof gets lighter in the rain",
        "The house shakes it loose",
      ],
      answer: 1,
      why: "High-speed wind has reduced pressure, just like in the wind tunnel.",
    },
    {
      q: "On a sunny day by the sea, land heats up faster than water. Which way does the breeze blow in the daytime?",
      options: ["From the land to the sea", "From the sea to the land", "Straight up", "There is no breeze"],
      answer: 1,
      why: "Warm air over land rises, lowering the pressure there, so cooler air flows in from the sea.",
    },
    {
      q: "What is the calm centre of a cyclone called?",
      options: ["The core", "The eye", "The funnel", "The front"],
      answer: 1,
      why: "The eye is a calm region of very low pressure.",
    },
  ],
};
