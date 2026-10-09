/**
 * Outliers · Class 10 · "Relativity: Moving Clocks Run Slow".
 * Special relativity: the constant speed of light, the light clock and time dilation.
 */
import type { LessonDef } from "./types";

export const LESSON_ID = "x-time-dilation";

/**
 * Challenge: an astronaut twin flies to a star and back at `beta` and ages `shipYears`.
 * The star sits at distance γ × shipYears × beta ÷ 2 light years so the numbers come out round.
 * Answer: Earth years = γ × shipYears.
 */
export const TWIN_ROUNDS = [
  { star: "A nearby red dwarf", beta: 0.6, shipYears: 8 },
  { star: "A bright white star", beta: 0.8, shipYears: 12 },
  { star: "A blue giant far away", beta: 0.96, shipYears: 7 },
];

/** An Earth-years answer counts if it is within this fraction of the true value. */
export const TWIN_TOLERANCE = 0.03;

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "clock-bender",
  classNum: 10,
  book: "Outliers",
  chapter: "Relativity: Moving Clocks Run Slow",
  title: "The light clock",
  intro: {
    objective:
      "Discover that light has the same speed for everyone, and use a light clock to see why a fast-moving clock must tick slower.",
    learn: [
      "The speed of light is the same for every observer, however fast they move",
      "A moving light clock ticks slower by the factor γ = 1 ÷ √(1 − (v² ÷ c²))",
      "Time dilation lets cosmic-ray muons reach the ground",
      "GPS satellites must correct their clocks for relativity",
    ],
    realLife:
      "The maps app on your phone uses GPS, and GPS only works because engineers correct the satellite clocks for relativity every day.",
    minutes: 30,
  },
  hook: {
    title: "A clock that rides on light",
    text:
      "Imagine a clock made of two mirrors with a flash of light bouncing between them. Each bounce is one tick. Now put this clock on a rocket and fly it past a friend on a railway platform. Your friend sees the light take a longer, slanted path. But light cannot go faster just because the rocket moves. So what happens to the ticks? The answer is so strange that it took Einstein to see it.",
  },
  predict: {
    question: "A light clock on a very fast rocket flies past you. Compared with the same clock next to you, how does it tick?",
    options: ["Faster", "Slower", "At exactly the same rate"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:lightspeed",
      title: "Ball or light?",
      text: "In Light speed mode, a Vande Bharat train races past the platform. Bowl a ball forwards on the train, then flash a torch forwards. Compare the speeds seen from the platform.",
      found:
        "The ball's speed adds to the train's speed: 140 + 160 = 300 km/h for someone on the platform. But the light still moves at c, about 3 lakh km every second, for both people. Light does not add the train's speed. That one fact changes everything.",
    },
    {
      id: "task:half",
      title: "Half-speed time",
      text: "Switch to Light clock mode. Speed up the train until its clock ticks at exactly half the rate of the platform clock (γ = 2).",
      found:
        "At about 0.866c the photon's slanted path is twice as long as the straight up-and-down path, so each tick takes twice as long. For every 2 seconds on the platform clock, the train clock shows only 1.",
    },
    {
      id: "task:muon",
      title: "Muons reach the ground",
      text: "Switch to Muons mode. A cosmic ray makes a muon 15 km up. Find a speed at which the real-world muon reaches the ground, and compare it with the muon that has no time dilation.",
      found:
        "A muon lives only about 2.2 μs. Even at light speed that is only about 660 m. But its clock runs slow by γ, so near light speed it lives γ times longer as seen from Earth and can cross 15 km of air. Scientists really do detect these muons at the ground.",
    },
    {
      id: "task:gps",
      title: "Fix the GPS",
      text: "Switch to GPS mode. Keep both relativity effects on and let at least one day pass without correcting the satellite clock. Watch where your map dot ends up.",
      found:
        "Moving at about 3.9 km/s makes the satellite clock lose about 7 μs a day. Being higher up, in weaker gravity, makes it gain about 45 μs a day. Together it gains about 38 μs a day, and since light goes about 11 km in that time, your position would be off by about 10 km after one day.",
    },
    {
      id: "task:twins",
      title: "The twin paradox",
      text: "Switch to Twins mode. Send the astronaut twin to a star and back fast enough that she comes home at least 5 years younger than her twin.",
      found:
        "The twin who travels near light speed ages less. Both twins agree on this when she lands, because she is the one who turned around and changed speed. Fast travel is a one-way ticket into the future.",
    },
  ],
  discovery: {
    scientist: "Albert Einstein",
    years: "1879–1955",
    fact: "In 1905 Einstein was working as a clerk at the Swiss patent office in Bern. That year he published special relativity, and a few months later E = mc².",
    formula: "Δt = γ Δt₀,  γ = 1 ÷ √(1 − (v² ÷ c²))",
    formulaNote: "A clock moving at speed v shows time Δt₀ while γ times more time, Δt, passes for you.",
  },
  symbols: [
    { sym: "Δt₀", meaning: "time on the moving clock (the astronaut's time)" },
    { sym: "Δt", meaning: "time on the clock that stays behind (Earth's time)" },
    { sym: "γ", meaning: "gamma, the factor clocks slow down by" },
    { sym: "v", meaning: "speed of the spaceship" },
    { sym: "c", meaning: "speed of light, 2.998 × 10⁸ m/s" },
    { sym: "√( )", meaning: "square root of what is inside the bracket" },
  ],
  ideas: [
    {
      title: "Light speed is the same for everyone",
      text: "A ball thrown from a moving train goes faster for someone on the platform, because the speeds add. Light does not do this. Every observer, moving or not, measures light in a vacuum at c = 3 × 10⁸ m/s. This is the main rule of special relativity.",
      formula: "c = 2.998 × 10⁸ m/s for every observer",
    },
    {
      title: "Why moving clocks run slow",
      text: "In a light clock, light goes up and down a distance L. On a moving train, the platform sees the light travel a slanted path that is longer. Light cannot speed up, so each tick must take longer. Using Pythagoras on the slanted path gives the factor γ.",
      formula: "γ = 1 ÷ √(1 − (v² ÷ c²))",
    },
    {
      title: "Small at everyday speeds, huge near c",
      text: "At 0.1c, γ is only 1.005. At 0.6c it is 1.25, at 0.866c it is 2 and at 0.99c it is about 7. At the speed of a train or even a rocket like Chandrayaan, γ is so close to 1 that we never notice it. Only atomic clocks can measure the tiny difference.",
      formula: "Δt = γ × Δt₀",
    },
    {
      title: "Real proof: muons and GPS",
      text: "Muons made high in the air live only 2.2 μs, yet they reach the ground because their clocks run slow. GPS satellites carry atomic clocks that would drift by about 38 μs a day from special and general relativity together. Engineers set the satellite clocks to tick slightly slower before launch to cancel this.",
    },
  ],
  challenge: {
    title: "Twin time machine",
    text: "Three trips, and the Earth calendar is hidden. Launch each trip, read the speed and how many years the astronaut ages, and work out how many years pass on Earth. One star per trip.",
  },
  quiz: [
    {
      q: "A train moves at 100 km/h. A passenger shines a torch forwards. How fast does someone on the platform see the light go?",
      options: ["c + 100 km/h", "c − 100 km/h", "Exactly c", "100 km/h"],
      answer: 2,
      why: "Light travels at c for every observer. It does not pick up the speed of the train.",
    },
    {
      q: "What is γ for a rocket moving at 0.6c?",
      options: ["0.8", "1.25", "1.6", "2"],
      answer: 1,
      why: "γ = 1 ÷ √(1 − 0.36) = 1 ÷ √0.64 = 1 ÷ 0.8 = 1.25.",
    },
    {
      q: "An astronaut's clock shows 1 hour. She is moving at 0.866c, where γ = 2. How much time passes on Earth?",
      options: ["30 minutes", "1 hour", "2 hours", "4 hours"],
      answer: 2,
      why: "Δt = γ × Δt₀ = 2 × 1 hour = 2 hours.",
    },
    {
      q: "Why do so many muons reach the ground from 15 km up, though they live only 2.2 μs?",
      options: [
        "They travel faster than light",
        "Their clocks run slow because they move near light speed",
        "The air pushes them down",
        "They live forever once they leave the clouds",
      ],
      answer: 1,
      why: "Near light speed γ is large, so from Earth's view the muon lives γ times longer and can travel many kilometres.",
    },
    {
      q: "Without relativity corrections, by about how much would GPS positions drift in one day?",
      options: ["1 cm", "10 m", "About 10 km", "1000 km"],
      answer: 2,
      why: "The satellite clocks gain about 38 μs a day. Light travels about 11 km in that time, so positions drift by roughly 10 km a day.",
    },
  ],
};
