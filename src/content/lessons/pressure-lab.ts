/**
 * Class 8 · Curiosity · "Pressure, Winds, Storms, and Cyclones" (second lab).
 * Covers §6.1 pressure = force ÷ area (brick on sand, sharp and blunt knife,
 * wide school-bag straps), liquid pressure rising with depth and pushing on
 * walls (Activity 6.1 balloon on a pipe, Activity 6.2 bottle with holes),
 * §6.2 atmospheric pressure (Activity 6.3 paper plate, Activity 6.4 rubber
 * sucker) and §6.3 air moving from high to low pressure. The wind tunnel lab
 * (pressure-winds.ts) covers moving air, storms and cyclones.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { LessonDef } from "./types";

export const LESSON_ID = "c8-pressure-lab";

/** Challenge: give each one the smallest footprint that keeps it above the line. One star each. */
export const FOOTPRINT_ROUNDS = [
  { name: "Camel", emoji: "🐪", massKg: 600, ground: "desert sand", limitPa: 50000 },
  { name: "Elephant", emoji: "🐘", massKg: 4000, ground: "a soft river bank", limitPa: 100000 },
  { name: "Tractor", emoji: "🚜", massKg: 2500, ground: "a wet paddy field", limitPa: 40000 },
];

/** "Just right" means the pressure is between this fraction of the limit and the limit. */
export const FOOTPRINT_BAND = 0.85;

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "pressure-pro",
  classNum: 8,
  book: "Curiosity",
  chapter: "Pressure, Winds, Storms, and Cyclones",
  title: "Press, pour and pump",
  intro: {
    objective:
      "Squash sand with a brick, make water jets spurt from a pipe and stick a rubber sucker to a wall, to see what pressure is in solids, liquids and air.",
    learn: [
      "Pressure is force ÷ area, so a smaller area gives a bigger pressure",
      "Water pressure grows with depth and pushes on the walls of its container",
      "The air around us presses with about 101,000 Pa on everything",
      "Air moves from high pressure to low pressure",
    ],
    realLife:
      "Sharp knives, wide school-bag straps, a camel's big soft feet, water tanks on rooftops and the hooks that stick to bathroom tiles all depend on pressure.",
    minutes: 25,
  },
  hook: {
    title: "The camel and the stiletto",
    text:
      "A 600 kg camel walks across the Thar desert without sinking. A person in thin high heels sinks into the same sand at every step. A kitchen knife slices a tomato only when it is sharp. The force is not the whole story. Let's find out what else matters.",
  },
  predict: {
    question: "A brick rests on sand, first on its big flat face and then standing on its small end. Where does it sink deeper?",
    options: ["On its big flat face", "Standing on its small end", "The same, because the brick weighs the same"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:brick",
      title: "Same brick, new face",
      text: "In Squash mode, pick the Brick. Rest it on its big Flat face, then stand it on its small End. Keep the same number of bricks. Compare the pressure and the dent.",
      found:
        "The weight is the same, but the end has about one third of the area. So the pressure is about 3 times bigger and the brick sinks about 3 times deeper. Pressure = force ÷ area.",
    },
    {
      id: "task:sharp",
      title: "Sharp beats blunt",
      text: "Pick the Knife or the Pin. Press with one force using the sharp edge (or point), then switch to the blunt edge (or head) with the same force.",
      found:
        "The sharp edge has a tiny area, so the same push gives an enormous pressure and it cuts in. The blunt edge spreads the push over a bigger area and does not. That is why we sharpen knives and why pins have points.",
    },
    {
      id: "task:jets",
      title: "Three jets",
      text: "Switch to Water mode. Fill the pipe above the top hole, then tap all three holes to open them. Which jet is fastest?",
      found:
        "The lowest hole has the most water above it, so the pressure there is biggest and its jet is fastest. Water pressure grows with depth and pushes sideways on the walls too.",
    },
    {
      id: "task:double",
      title: "Double the depth",
      text: "Watch the pressure at the balloon at the bottom of the pipe. Set one water depth, then make the depth exactly twice as big (for example 0.3 m and 0.6 m).",
      found:
        "Twice the depth gives twice the pressure, and the balloon bulges more. Liquid pressure p = h × ρ × g, so it grows in step with the height h of the water above.",
    },
    {
      id: "task:sucker",
      title: "Hold, then let go",
      text: "Switch to Air mode. Press the sucker on the wall and pull with the spring balance to 30 N or more. It holds! Now make it come off: pull harder, or let air leak in.",
      found:
        "Pressing pushes air out of the cup. The air outside then presses the sucker to the wall much harder than the little air inside pushes it off. Let air in, or pull harder than that difference, and it comes off. Air moves from high pressure outside to low pressure inside.",
    },
  ],
  discovery: {
    scientist: "Blaise Pascal",
    years: "1623–1662",
    fact: "In 1648 Pascal asked his brother-in-law, Florin Périer, to carry a mercury barometer up the Puy de Dôme mountain in France. About 1 km higher up, the mercury column was about 8 cm shorter. This proved that air pressure falls as you go higher. The SI unit of pressure, the pascal, is named after him.",
    formula: "P = F ÷ A",
    formulaNote: "Pressure is the force acting on each square metre of area. 1 pascal (Pa) = 1 N/m².",
  },
  symbols: [
    { sym: "P, p", meaning: "pressure, in pascals (Pa)" },
    { sym: "F", meaning: "force, in newtons (N)" },
    { sym: "A", meaning: "area the force presses on, in m²" },
    { sym: "h", meaning: "depth below the water surface, in m" },
    { sym: "ρ", meaning: "rho, density of the liquid, in kg/m³" },
    { sym: "g", meaning: "pull of gravity, about 9.8 m/s²" },
  ],
  ideas: [
    {
      title: "Pressure is force on each unit area",
      text: "The same force can press gently or hard. Spread over a big area, as with wide bag straps or a camel's broad feet, the pressure is small. Squeezed onto a tiny area, as with a knife edge or a pin point, it is huge.",
      formula: "Pressure = Force ÷ Area   (1 Pa = 1 N/m²)",
    },
    {
      title: "Liquids press down and sideways",
      text: "Water presses on the bottom and on the walls of its container. The deeper you go, the more water is above you, so the pressure rises. That is why a dam is thicker at the bottom and why the lowest hole in a bottle spurts fastest.",
      formula: "p = h × ρ × g",
    },
    {
      title: "The air presses on everything",
      text: "Air has weight, so it presses on us from all sides with about 101,000 Pa. On a 1 m² table top that is about 101,000 N, the weight of about 10 tonnes! The table does not break because air presses up from below just as hard. A paper plate stuck to a table, or a rubber sucker on a wall, shows this push.",
      formula: "1 atmosphere ≈ 101 kPa",
    },
    {
      title: "Torricelli's tube",
      text: "In 1643 Evangelista Torricelli, a student of Galileo, filled a glass tube with mercury and turned it upside down in a dish. The mercury stayed about 76 cm high, held up by the push of the air on the dish. This was the first barometer. Weather offices still watch the air pressure to forecast storms.",
    },
    {
      title: "Air moves from high to low pressure",
      text: "Whenever two places have different air pressure, air flows from the high-pressure place to the low-pressure place. Air rushing into the sucker's cup is a tiny wind. Winds over the whole country, including the monsoon, are this same flow on a giant scale.",
    },
  ],
  challenge: {
    title: "Don't sink!",
    text: "A camel, an elephant and a tractor must cross soft ground. Choose the smallest footprint that keeps each one above the red line. Too small and it sinks; far too big wastes material. One star each.",
  },
  quiz: [
    {
      q: "Why do school bags have wide straps?",
      options: [
        "Wide straps make the bag lighter",
        "They spread the weight over a bigger area, so the pressure on the shoulders is smaller",
        "They make the force on the shoulders bigger",
        "They stop air pressure acting on the bag",
      ],
      answer: 1,
      why: "The weight is the same, but a bigger area gives a smaller pressure, so it hurts less.",
    },
    {
      q: "A water tank has taps at three heights. Which tap gives the fastest stream?",
      options: ["The top tap", "The middle tap", "The bottom tap", "All the same"],
      answer: 2,
      why: "The bottom tap has the deepest water above it, so the pressure there is highest.",
    },
    {
      q: "The pressure at the bottom of a pipe with 0.5 m of water is about 4900 Pa. What is it with 1 m of water?",
      options: ["2450 Pa", "4900 Pa", "9800 Pa", "19600 Pa"],
      answer: 2,
      why: "p = h ρ g grows in step with depth, so twice the depth gives twice the pressure: 9800 Pa.",
    },
    {
      q: "A rubber sucker is pressed onto a smooth tile. What holds it there?",
      options: [
        "Glue in the rubber",
        "The air outside presses harder than the little air left inside the cup",
        "The sucker pulls the wall towards it",
        "Gravity",
      ],
      answer: 1,
      why: "Pressing pushes air out of the cup. The higher pressure outside then pushes the sucker against the tile.",
    },
    {
      q: "Pascal's brother-in-law carried a barometer up a mountain in 1648. What did the mercury do near the top?",
      options: ["It rose", "It fell, because air pressure is lower higher up", "It froze", "It stayed the same"],
      answer: 1,
      why: "There is less air above you on a mountain, so the air pressure is lower and holds up a shorter mercury column.",
    },
  ],
};
