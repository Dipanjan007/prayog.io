/**
 * Class 7 · Curiosity (NCERT 2024) · "Heat Transfer in Nature".
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { LessonDef } from "./types";

export const LESSON_ID = "c7-heat-transfer";

/** Challenge: the heat detective. One star per question, answered in order. */
export const CHALLENGE_ROUNDS: { q: string; options: string[]; answer: number; hint: string; right: string }[] = [
  {
    q: "Job 1: The base of a frying pan must spread the flame's heat quickly. Which material is best?",
    options: ["Copper", "Steel", "Glass", "Wood"],
    answer: 0,
    hint: "Heat each rod and watch which one drops all its wax first.",
    right: "Yes! Copper is the best conductor here. Many steel pans have a copper base for this reason.",
  },
  {
    q: "Job 2: You are on the beach at 2 pm on a sunny day. Which way does the breeze blow?",
    options: ["From the sea to the land", "From the land to the sea", "There is no breeze at all"],
    answer: 0,
    hint: "Set the Seaside time to 2 pm and compare the land and the sea.",
    right: "Right! The land is hotter, warm air rises over it and cool air from the sea flows in. That is a sea breeze.",
  },
  {
    q: "Job 3: Now it is 2 am. Which way does the breeze blow?",
    options: ["From the sea to the land", "From the land to the sea", "Straight up into the sky"],
    answer: 1,
    hint: "Set the Seaside time to 2 am. Which side is warmer now?",
    right: "Correct! At night the land cools faster than the sea, so the breeze blows from the land to the sea. That is a land breeze.",
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "heat-explorer",
  classNum: 7,
  book: "Curiosity",
  chapter: "Heat Transfer in Nature",
  title: "How heat moves",
  intro: {
    objective:
      "Watch heat travel along a rod, swirl through a pot of water and drive the breeze at the beach, and see why dark things get hotter in the Sun.",
    learn: [
      "Conduction, and why metals are good conductors while wood and glass are poor conductors",
      "Convection currents in water and in air",
      "Why a sea breeze blows in the day and a land breeze at night",
      "Radiation from the Sun, and how it drives the water cycle",
    ],
    realLife:
      "Plastic handles on pressure cookers, wooden spoons for stirring kheer, the cool evening breeze at the beach and the clouds of the monsoon all come from this chapter.",
    minutes: 25,
  },
  hook: {
    title: "The hot spoon mystery",
    text:
      "Dadi is stirring halwa in a kadhai. She leaves a steel spoon in it to answer the door, and when she comes back its handle is too hot to touch. The wooden spoon beside it is still cool. How did the heat climb all the way up the steel? And why does the breeze at Marine Drive change direction at night? Let's follow the heat.",
  },
  predict: {
    question: "Wax drops are stuck along a copper rod and a wooden rod. One end of each rod is heated. What happens?",
    options: [
      "Drops fall from both rods at the same time",
      "Drops on the copper rod fall first, one by one, starting near the flame",
      "Drops on the wooden rod fall first",
      "Drops at the far end fall first",
    ],
    answer: 1,
  },
  tasks: [
    {
      id: "task:copper",
      title: "Heat races along copper",
      text: "Pick the copper rod and light the flame. Watch the particles shake harder and the wax drops fall. Wait until all 5 have fallen.",
      found:
        "The particles near the flame vibrate faster and pass the heat to their neighbours, one after another, all along the rod. This is conduction. The drop nearest the flame falls first and the farthest one falls last.",
    },
    {
      id: "task:poor",
      title: "Wood and glass hold back",
      text: "Now heat a glass rod or a wooden rod for at least 10 minutes. Use the Fast button to save time. How many drops fall?",
      found:
        "Only the part near the flame gets hot. Glass and wood are poor conductors (insulators), so heat moves through them very slowly. This is why cooking pots have plastic or wooden handles and why we stir with wooden spoons.",
    },
    {
      id: "task:convect",
      title: "Purple currents",
      text: "Open the pot of water. Drop a crystal of potassium permanganate and light the flame. Watch where the purple colour goes.",
      found:
        "Water above the flame gets warm, becomes lighter and rises. Cooler water from the sides sinks to take its place. This loop is a convection current. In liquids and gases, heat moves mostly by convection.",
    },
    {
      id: "task:breeze",
      title: "Breeze by day and night",
      text: "Go to the Seaside. Move the time to the afternoon and then to the night. Find a sea breeze and a land breeze.",
      found:
        "In the day the land heats up faster than the sea. Warm air above the land rises, and cooler air from the sea moves in: a sea breeze. At night the land cools faster, so the air flows from the land to the sea: a land breeze.",
    },
    {
      id: "task:radiate",
      title: "Black and white in the Sun",
      text: "At the Seaside, set a time around noon. Compare the thermometers in the black tin and the white tin.",
      found:
        "The Sun's heat reaches us by radiation, even across empty space. Dark surfaces absorb more of it and get hotter. Light surfaces reflect more and stay cooler. That is why we wear light-coloured clothes in summer.",
    },
  ],
  discovery: {
    scientist: "Joseph Fourier",
    years: "1768–1830",
    fact: "Fourier worked out the maths of how heat flows through solids. In 1824 he was also the first to suggest that the air around Earth traps heat and keeps the planet warm, the greenhouse effect.",
    formula: "Heat flow per second = (k × A × ΔT) ÷ L",
    formulaNote: "Fourier's law: heat flows faster through a good conductor (big k), a wider rod (A), a bigger temperature difference (ΔT) and a shorter rod (L).",
  },
  symbols: [
    { sym: "k", meaning: "how well the material conducts heat" },
    { sym: "A", meaning: "area heat flows through, in m²" },
    { sym: "ΔT", meaning: "delta T, the temperature difference between the two ends, in °C" },
    { sym: "L", meaning: "thickness the heat must cross, in m" },
    { sym: ">", meaning: "conducts better than" },
  ],
  ideas: [
    {
      title: "Conduction",
      text: "In a solid, heat passes from hotter particles to their cooler neighbours, which start to vibrate more. Heat always flows from a hotter object to a colder one. Materials that let heat pass easily are good conductors (copper, aluminium, steel). Those that do not are poor conductors or insulators (wood, plastic, glass, air).",
      formula: "Best to worst here: copper > steel > glass > wood",
    },
    {
      title: "Convection",
      text: "In liquids and gases, the warm part becomes lighter and rises, and the cooler part sinks to take its place. The moving liquid or gas carries the heat with it. This is convection.",
    },
    {
      title: "Sea breeze and land breeze",
      text: "Land heats up and cools down much faster than water. In the day, warm air rises over the land and a sea breeze blows from the sea to the land. At night it is the other way round, and a land breeze blows from the land to the sea.",
      formula: "Breeze near the ground: from the cooler side → to the warmer side",
    },
    {
      title: "Radiation and the water cycle",
      text: "Radiation carries heat without any material in between. This is how the Sun heats the Earth. Dark surfaces absorb more radiation than light ones. The Sun's heat evaporates water from seas and lakes. The vapour rises, cools and forms clouds, and the rain falls back. Some rainwater soaks into the soil and is stored underground as groundwater.",
    },
  ],
  challenge: {
    title: "Heat detective",
    text: "Answer three questions about heat. Use the lab to check before you answer. Get one star for each question you get right.",
  },
  quiz: [
    {
      q: "Why do cooking pots usually have plastic or wooden handles?",
      options: ["They look nicer", "Plastic and wood are poor conductors of heat", "They make the pot cook faster", "Metal handles would melt"],
      answer: 1,
      why: "Plastic and wood do not let heat pass easily, so the handle stays cool enough to hold.",
    },
    {
      q: "A steel spoon kept in hot milk gets hot at the top. How did the heat reach there?",
      options: ["Convection", "Radiation", "Conduction", "Evaporation"],
      answer: 2,
      why: "Heat passed from particle to particle along the solid spoon. That is conduction.",
    },
    {
      q: "Water in a pot is heated from below. Why does it all get hot, even at the top?",
      options: [
        "Warm water rises and cooler water sinks, making convection currents",
        "Heat is conducted quickly through water",
        "The steel pot radiates heat into the water at the top",
        "Steam pushes heat down",
      ],
      answer: 0,
      why: "Water is a poor conductor. It heats mostly by convection: warm water rises and cool water comes down to be heated.",
    },
    {
      q: "During the day at the seaside, the breeze usually blows…",
      options: ["from the land to the sea", "from the sea to the land", "straight down from the sky", "only along the coast"],
      answer: 1,
      why: "The land is warmer in the day. Warm air rises over it and cooler air from the sea moves in: a sea breeze.",
    },
    {
      q: "Why is it better to wear light-coloured clothes in summer?",
      options: [
        "Light colours absorb more heat",
        "Light colours reflect more of the Sun's heat",
        "Light colours are thicker",
        "Dark clothes conduct heat away",
      ],
      answer: 1,
      why: "Light surfaces reflect most of the Sun's radiation, so they stay cooler than dark surfaces.",
    },
    {
      q: "How does heat from the Sun reach the Earth?",
      options: ["By conduction through the air", "By convection in space", "By radiation", "By the wind"],
      answer: 2,
      why: "Space between the Sun and the Earth has almost no matter. Only radiation can carry heat across it.",
    },
    {
      q: "Which step of the water cycle needs heat from the Sun?",
      options: ["Rain falling", "Water soaking into the ground", "Evaporation of water from the sea", "Rivers flowing downhill"],
      answer: 2,
      why: "The Sun's heat turns water from seas, lakes and soil into water vapour. That vapour later forms clouds and rain.",
    },
  ],
};
