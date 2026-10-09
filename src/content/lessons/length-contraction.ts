/**
 * Outliers · Class 10 · "Relativity: Shrinking Lengths and the Cosmic Speed Limit".
 * Special relativity: length contraction and the relativistic addition of velocities.
 */
import type { LessonDef } from "./types";

export const LESSON_ID = "x-length-contraction";

/** Challenge: a rocket of rest length `L0` must measure `L` as it passes. Answer: speed = beta (fraction of c). */
export const SQUEEZE_ROUNDS = [
  { name: "ISRO cargo rocket", L0: 100, L: 60, beta: 0.8 },
  { name: "Space taxi", L0: 50, L: 40, beta: 0.6 },
  { name: "Star liner", L0: 260, L: 100, beta: 12 / 13 },
];

/** A speed answer counts if it is within this fraction of the true speed. */
export const SQUEEZE_TOLERANCE = 0.012;

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "speed-limit-keeper",
  classNum: 10,
  book: "Outliers",
  chapter: "Relativity: Shrinking Lengths and the Cosmic Speed Limit",
  title: "Nothing beats light",
  intro: {
    objective:
      "Watch a fast rocket shrink along its motion, and add speeds the way nature really does to discover that nothing can go faster than light.",
    learn: [
      "A moving object is measured shorter along its motion: L = L₀ ÷ γ",
      "Only the length along the motion shrinks; the height stays the same",
      "Speeds do not simply add near light speed: w = (u + v) ÷ (1 + (u × v ÷ c²))",
      "At everyday speeds the old rule u + v works perfectly well",
    ],
    realLife:
      "Particle accelerators like the LHC push protons to more than 0.999999c, but never to c, and the muons from cosmic rays see the whole atmosphere squashed thin.",
    minutes: 25,
  },
  hook: {
    title: "Faster than light?",
    text:
      "A rocket races away from Earth at 0.9 times the speed of light. It fires a probe forwards at 0.9c. Simple maths says the probe now moves at 1.8c, almost twice as fast as light! But no experiment has ever found anything with mass going faster than light. Something in our everyday maths must break. Let's find out what, and why fast rockets get shorter too.",
  },
  predict: {
    question: "A rocket that is 100 m long when parked zooms past you at 0.8c. What length do you measure?",
    options: ["More than 100 m", "Less than 100 m", "Exactly 100 m"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:half",
      title: "Squash it to half",
      text: "In Shrinking rocket mode, speed up the rocket until you measure it at exactly half its parked length.",
      found:
        "At about 0.866c, γ = 2, so the rocket measures half its length. Look at its height: it did not change at all. Only the length along the motion shrinks.",
    },
    {
      id: "task:beat",
      title: "Try to beat light",
      text: "Switch to Adding speeds mode. Set the rocket to 0.9c or more, and the probe to 0.9c or more. Launch and compare Galileo's answer with Einstein's.",
      found:
        "Galileo's rule gives 1.8c, faster than light. Einstein's rule gives (0.9 + 0.9) ÷ (1 + 0.81) = 0.994c. Close to light, but never past it. Experiments always agree with Einstein.",
    },
    {
      id: "task:light",
      title: "Fire a light beam",
      text: "Still in Space speeds, set the probe to light (1c). Launch it from a rocket at any speed.",
      found:
        "Whatever the rocket's speed, Einstein's rule gives exactly c for the light. That is the same rule you met in the light clock: everyone measures light at the same speed.",
    },
    {
      id: "task:everyday",
      title: "Back on Earth",
      text: "Switch to Everyday speeds. A bowler on a Vande Bharat train bowls a ball forwards. Launch it and compare the two rules.",
      found:
        "At train and cricket speeds the two answers differ by about a millionth of a millionth of a metre per second. That is why u + v works perfectly in daily life, and why nobody noticed relativity before 1905.",
    },
  ],
  discovery: {
    scientist: "Hendrik Lorentz",
    years: "1853–1928",
    fact: "In 1892 Lorentz suggested that objects moving through space shrink along their motion. George FitzGerald had the same idea in 1889. In 1902 Lorentz shared the Nobel Prize in Physics, and in 1905 Einstein showed the shrinking comes straight from the constant speed of light.",
    formula: "L = L₀ ÷ γ",
    formulaNote: "An object of length L₀ at rest measures shorter, L, when it moves past you, by the factor γ.",
  },
  symbols: [
    { sym: "L₀", meaning: "length of the object when it is not moving (rest length)" },
    { sym: "L", meaning: "length measured while it moves past you" },
    { sym: "γ", meaning: "gamma, the stretch factor; it is 1 when still and grows near light speed" },
    { sym: "v", meaning: "speed of the object" },
    { sym: "c", meaning: "speed of light, about 3 × 10⁸ m/s" },
    { sym: "u, w", meaning: "two speeds being added, and their combined speed" },
    { sym: "√( )", meaning: "square root of what is inside the bracket" },
  ],
  ideas: [
    {
      title: "Moving things shrink along their motion",
      text: "If a rocket is L₀ long when parked, you measure it shorter while it flies past. The factor is the same γ as for time. Only the length along the motion shrinks. The height and width stay the same.",
      formula: "L = L₀ ÷ γ = L₀ × √(1 − (v² ÷ c²))",
    },
    {
      title: "Time and length go together",
      text: "A muon falling at 0.9995c sees things differently from us. To the muon, its own clock is normal, but the 15 km of air rushing past is squashed to about 0.5 km. So it reaches the ground in its short life. We say its clock is slow; it says the air is thin. Both give the same answer.",
    },
    {
      title: "Einstein's rule for adding speeds",
      text: "On a rocket at speed u, fire a probe at speed v. Galileo's rule says the probe moves at u + v. Einstein's rule divides by (1 + (u × v ÷ c²)). The answer always stays below c. If the probe is light, the answer is exactly c.",
      formula: "w = (u + v) ÷ (1 + (u × v ÷ c²))",
    },
    {
      title: "The cosmic speed limit",
      text: "As something with mass gets closer to c, γ grows without limit, and it needs more and more energy to speed up. It can get very close to c but never reach it. At everyday speeds, uv/c² is tiny, so u + v is right to many decimal places.",
    },
  ],
  challenge: {
    title: "Rocket squeeze",
    text: "Three rockets must fit through a measuring gate. For each one you know its parked length and the length it must measure. Find the speed, as a fraction of c, and watch the rocket fly at your speed. One star per rocket.",
  },
  quiz: [
    {
      q: "A rocket 50 m long when parked flies past at 0.6c. What length do you measure?",
      options: ["30 m", "40 m", "50 m", "62.5 m"],
      answer: 1,
      why: "γ at 0.6c is 1.25, so L = 50 ÷ 1.25 = 40 m.",
    },
    {
      q: "A fast train passes you. Which of its measurements gets smaller?",
      options: ["Its height", "Its width", "Its length along the track", "All three"],
      answer: 2,
      why: "Length contraction happens only along the direction of motion.",
    },
    {
      q: "A rocket at 0.5c fires a probe forward at 0.5c. How fast does the probe go for someone on Earth?",
      options: ["1.0c", "0.8c", "0.5c", "0.25c"],
      answer: 1,
      why: "w = (0.5 + 0.5) ÷ (1 + 0.25) = 1 ÷ 1.25 = 0.8c.",
    },
    {
      q: "A spaceship at 0.7c shines a torch forwards. How fast is the light for someone on Earth?",
      options: ["1.7c", "0.3c", "Exactly c", "0.7c"],
      answer: 2,
      why: "Put v = c into Einstein's rule: (u + c) ÷ (1 + (u ÷ c)) = c. Light is always at c.",
    },
    {
      q: "Why do we not notice length contraction for a Mumbai local train?",
      options: [
        "It only works in space",
        "At train speeds γ is extremely close to 1",
        "Trains are made of steel",
        "Only light can shrink",
      ],
      answer: 1,
      why: "At everyday speeds v²/c² is tiny, so γ is almost exactly 1 and the shrinking is far too small to measure.",
    },
  ],
};
