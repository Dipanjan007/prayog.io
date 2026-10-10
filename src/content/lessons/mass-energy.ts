/**
 * Outliers · Class 10 · "Relativity: E = mc² and Curved Space-time".
 * Physics lives in src/lib/sim/massenergy.ts; numbers here are checked by its tests.
 */
import type { LessonDef } from "./types";
import { J_PER_KWH, SECONDS_PER_YEAR, STATION_W } from "@/lib/sim/massenergy";

export const LESSON_ID = "x-mass-energy";

/**
 * Challenge: how much mass, turned completely into energy, would do each job?
 * The energy of each job is given (our stated assumptions). The answer is m = E / c².
 */
export const MASS_ROUNDS: { name: string; given: string; energyJ: number; unit: "g" | "kg" }[] = [
  {
    name: "Power Mumbai for a day",
    given: "Assume Mumbai uses about 84 million kWh of electricity in a day.",
    energyJ: 84e6 * J_PER_KWH,
    unit: "g",
  },
  {
    name: "Run a 1 GW power station for a year",
    given: "1 GW is 10⁹ joules every second, for 365 days.",
    energyJ: STATION_W * SECONDS_PER_YEAR,
    unit: "g",
  },
  {
    name: "All of India's electricity for a year",
    given: "Assume India uses about 1,700 billion kWh of electricity in a year.",
    energyJ: 1.7e12 * J_PER_KWH,
    unit: "kg",
  },
];

/** An answer counts if it is within this fraction of the true mass. */
export const MASS_TOLERANCE = 0.05;

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "frozen-energy",
  classNum: 10,
  book: "Outliers",
  chapter: "Relativity: E = mc² and Curved Space-time",
  title: "E = mc²: mass is frozen energy",
  intro: {
    objective:
      "Turn mass into energy with E = mc², see how the Sun and India's nuclear reactors do it, and watch a mass curve space-time so light bends and clocks slow down.",
    learn: [
      "A tiny mass holds a huge energy because c² is enormous",
      "The Sun shines by fusing hydrogen into helium and loses about 4.26 million tonnes a second",
      "Why nuclear fuel gives millions of times more energy than burning coal",
      "Mass curves space-time: light bends near the Sun and clocks run slower in strong gravity",
    ],
    realLife:
      "Sunlight, the electricity from Tarapur and Kudankulam, and the GPS on your phone all depend on Einstein's relativity.",
    minutes: 30,
  },
  hook: {
    title: "The energy in a grain of rice",
    text:
      "Every second, the Sun pours out more energy than humans have used in all of history. At Kudankulam in Tamil Nadu, a few kilograms of uranium a day keep a whole city's lights on. Where does all this energy come from? In 1905 Albert Einstein found the answer hiding in a short formula: mass itself is a kind of frozen energy. Let's unfreeze some.",
  },
  predict: {
    question:
      "Imagine turning one grain of rice (0.02 g) completely into energy. Roughly how many Indian homes could it power for a whole year?",
    options: ["About 1 home", "About 50 homes", "About 450 homes", "About 1 crore homes"],
    answer: 2,
  },
  tasks: [
    {
      id: "task:convert",
      title: "Unfreeze a grain of rice",
      text: "In the E = mc² tab, choose All of it, tap Grain of rice and read the energy. Compare it with homes, coal and a power station.",
      found:
        "0.02 g of mass holds about 1.8 × 10¹² J, or about 5 lakh kWh. That could power about 450 Indian homes for a year, the same as burning about 75 tonnes of coal. The secret is c²: 9 × 10¹⁶, a gigantic number.",
    },
    {
      id: "task:compare",
      title: "Burn, split or convert it all",
      text: "Keep the same mass and try Burn coal, Split uranium and All of it. How much of the mass actually becomes energy each time?",
      found:
        "Burning coal turns only about 3 parts in ten billion of its mass into energy. Splitting uranium-235 turns about 0.1% into energy, millions of times more. Converting all the mass is about 1,000 times more again. Nuclear fuel is so strong because nuclear forces are far stronger than chemical bonds.",
    },
    {
      id: "task:sun",
      title: "Weigh the Sun's sunshine",
      text: "In The Sun tab, tap the button to measure one second of sunshine and see how much mass the Sun loses.",
      found:
        "The Sun gives out 3.828 × 10²⁶ W. Dividing by c² gives about 4.26 × 10⁹ kg: the Sun loses about 4.26 million tonnes of mass every second, by fusing hydrogen into helium. It is so huge that this is nothing to it.",
    },
    {
      id: "task:bend",
      title: "Eddington's eclipse check",
      text: "In the Curved space tab, choose the Sun, turn on the grid and shine starlight so it just grazes the Sun's edge (1.2 radii or less).",
      found:
        "The Sun dents space-time, so starlight passing its edge bends by about 1.75 arcseconds. The star then appears shifted outward. In 1919 Eddington photographed stars near the eclipsed Sun and found this shift, about twice what a Newton-style guess predicts.",
    },
    {
      id: "task:clock",
      title: "Clocks in strong gravity",
      text: "Still in Curved space, pick Earth and read the GPS clock line, then pick the neutron star and compare its surface clock with the clock far away.",
      found:
        "Clocks deeper in gravity tick slower. On a neutron star a surface clock runs about 19% slow, losing over 4 hours a day. Even on Earth the effect is real: GPS satellite clocks, in weaker gravity, gain about 45 μs a day and must be corrected.",
    },
  ],
  discovery: {
    scientist: "Arthur Eddington",
    years: "1882–1944",
    fact: "In 1919 Eddington led an expedition to the island of Príncipe, off West Africa, to photograph stars beside the Sun during a total solar eclipse. The starlight was bent by close to Einstein's prediction, and Einstein became world-famous. In 1920 Eddington also suggested that stars shine by turning hydrogen into helium, using E = mc².",
    formula: "E = m × c²",
    formulaNote: "Energy equals mass times the speed of light squared, so a tiny mass holds a huge energy.",
  },
  symbols: [
    { sym: "E", meaning: "energy, in joules (J)" },
    { sym: "m", meaning: "mass, in kg" },
    { sym: "c", meaning: "speed of light, about 3 × 10⁸ m/s" },
    { sym: "c²", meaning: "c × c, about 9 × 10¹⁶" },
    { sym: "L", meaning: "the Sun's power output, 3.828 × 10²⁶ watts" },
    { sym: "G", meaning: "the gravitational constant" },
    { sym: "M", meaning: "mass of the star or planet, in kg" },
    { sym: "b", meaning: "how close the light passes to the centre, in m" },
    { sym: "r", meaning: "distance from the centre, in m" },
  ],
  ideas: [
    {
      title: "Mass is frozen energy",
      text: "Albert Einstein published E = mc² in 1905, when he was just 26 and working in a patent office. Mass and energy are two forms of the same thing. Since c = 3 × 10⁸ m/s, c² is 9 × 10¹⁶, so 1 kg of mass holds about 9 × 10¹⁶ J. That would run a 1 GW power station for almost 3 years.",
      formula: "E = m × c²   (c ≈ 3 × 10⁸ m/s)",
    },
    {
      title: "How the Sun shines",
      text: "Deep in the Sun's core, 4 hydrogen nuclei fuse into 1 helium nucleus. The helium has about 0.7% less mass than the 4 hydrogens, and that missing mass comes out as energy. The Sun's power is 3.828 × 10²⁶ W, so it loses about 4.26 million tonnes of mass every second. Even so, in 4.6 billion years it has lost less than 0.1% of its mass.",
      formula: "Mass lost per second = L ÷ c² = (3.828 × 10²⁶) ÷ (3 × 10⁸)² ≈ 4.26 × 10⁹ kg",
    },
    {
      title: "Nuclear power in India",
      text: "Reactors at Tarapur (Maharashtra, India's first, 1969) and Kudankulam (Tamil Nadu) split uranium-235 nuclei. Each split turns only about 0.1% of the uranium's mass into energy, yet that is millions of times more than burning the same mass of coal, which turns only a few parts in ten billion into heat.",
      formula: "Energy released = (fraction converted) × m × c²",
    },
    {
      title: "Mass curves space-time",
      text: "Einstein's general relativity (1915) says mass curves space and time around it, and things moving freely follow the curves. A rubber sheet dented by a ball is only an analogy: real space-time is not a sheet and nothing pulls it downward. Starlight passing the Sun's edge bends by 1.75 arcseconds, twice the Newton-style guess. Very compact stars curve space-time far more, which leads to black holes.",
      formula: "Bending angle = (4 × G × M) ÷ (c² × b)",
    },
    {
      title: "Gravity slows clocks",
      text: "A clock deeper in gravity ticks slower than one higher up. GPS satellites orbit 20,200 km up, in weaker gravity, so their clocks gain about 45 μs a day. Their speed slows them by about 7 μs a day, so the net gain is about 38 μs a day. Without correcting this, GPS positions would drift by about 10 km every day.",
      formula: "Clock rate = √(1 − ((2 × G × M) ÷ (r × c²)))",
    },
  ],
  challenge: {
    title: "Mass for the job",
    text: "Three jobs, each with a known energy. How much mass would you need to turn completely into energy to do each one? Use the slider to match the target or work out m = E ÷ c². One star per job.",
  },
  quiz: [
    {
      q: "Why does a tiny mass hold such a huge amount of energy?",
      options: [
        "Because mass is very heavy",
        "Because c² is an enormous number, about 9 × 10¹⁶",
        "Because energy is measured in kWh",
        "Because atoms move very fast",
      ],
      answer: 1,
      why: "In E = mc², the mass is multiplied by c² = (3 × 10⁸)² = 9 × 10¹⁶, so even 1 g gives about 9 × 10¹³ J.",
    },
    {
      q: "In the Sun, 4 hydrogen nuclei fuse into 1 helium nucleus. What happens to about 0.7% of the mass?",
      options: ["It escapes as hydrogen gas", "It becomes energy", "It turns into iron", "It is stored for later"],
      answer: 1,
      why: "The helium is lighter than the 4 hydrogens. The missing mass is released as energy, E = mc². This is how the Sun shines.",
    },
    {
      q: "Roughly how much mass does the Sun turn into energy every second?",
      options: ["4.26 kg", "4.26 tonnes", "4.26 million tonnes", "All of Earth's mass"],
      answer: 2,
      why: "Mass lost = L ÷ c² = (3.828 × 10²⁶) ÷ (9 × 10¹⁶) ≈ 4.26 × 10⁹ kg, which is 4.26 million tonnes each second.",
    },
    {
      q: "Why does 1 kg of uranium in a reactor give millions of times more energy than 1 kg of coal?",
      options: [
        "Uranium burns at a higher temperature",
        "Fission turns about 0.1% of the mass into energy, far more than chemical burning does",
        "Uranium is heavier than coal",
        "Reactors use bigger furnaces",
      ],
      answer: 1,
      why: "Nuclear forces are far stronger than chemical bonds. Fission converts about 0.1% of the mass, while burning converts only a few parts in ten billion.",
    },
    {
      q: "GPS satellite clocks gain about 45 μs a day because of gravity. Why?",
      options: [
        "They are in weaker gravity, and clocks in weaker gravity tick faster",
        "They are colder in space",
        "They move very slowly",
        "Sunlight speeds them up",
      ],
      answer: 0,
      why: "Clocks deeper in gravity run slower. High above Earth, gravity is weaker, so the satellite clocks run faster and must be corrected.",
    },
  ],
};
