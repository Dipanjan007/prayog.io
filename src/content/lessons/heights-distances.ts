/**
 * Class 10 · Mathematics · Chapter 9 "Some Applications of Trigonometry".
 * Covers the angle of elevation, the angle of depression, the tan values of 30°, 45° and 60°,
 * and finding a height from a distance and an angle.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { LessonDef } from "./types";

export const LESSON_ID = "c10-heights-distances";

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "height-hunter",
  classNum: 10,
  book: "Mathematics",
  chapter: "Some Applications of Trigonometry",
  title: "Measure the Qutub Minar",
  intro: {
    objective:
      "Use a clinometer to measure things far too tall for a measuring tape: a coconut tree, a stadium floodlight and the Qutub Minar. Then look down from a lighthouse at a boat.",
    learn: [
      "The angle of elevation and the angle of depression",
      "tan θ = height ÷ distance, and how to turn it round to find a height",
      "The special values tan 30°, tan 45° and tan 60°",
      "Why the angle of depression equals the angle of elevation",
    ],
    realLife:
      "Surveyors, architects, ship navigators and the Survey of India measure heights and distances this way. It is how Mount Everest's height was first worked out, from the plains far away.",
    minutes: 20,
  },
  hook: {
    title: "A school trip to Delhi",
    text:
      "Your class is at the Qutub Minar. Your teacher asks how tall it is. Nobody can climb it with a measuring tape. But you have a clinometer: a protractor with a straw to look through and a thread with a bead hanging down. Can an angle and a few steps tell you the height?",
  },
  predict: {
    question: "From 30 m away, you see the top of a building at 45° above your eye. How high is the top above your eye?",
    options: ["15 m", "30 m", "45 m"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:45",
      title: "The 45° spot",
      text: "Pick the coconut tree. Walk until the clinometer reads 45°. Compare your distance with the tree's height.",
      found:
        "At 45°, you stood 15 m away and the top was 15 m above your eye. tan 45° = 1, so height above the eye = distance. Add your 1.5 m eye height: the tree is 16.5 m tall.",
    },
    {
      id: "task:3060",
      title: "60° and 30°",
      text: "Pick the stadium floodlight. Find the spot where the top is at 60°, then the spot where it is at 30°.",
      found:
        "At 60° you stood about 23 m away. At 30° you stood about 69 m away, three times as far. That is because tan 60° = √3 is three times tan 30° = 1 ÷ √3.",
    },
    {
      id: "task:depression",
      title: "Look down from the lighthouse",
      text: "Switch to Lighthouse. Move the boat until the keeper sees it at an angle of depression of 45°.",
      found:
        "The boat was 50 m from the foot, the same as the lamp's height. The keeper's angle of depression is the same as the boat's angle of elevation of the lamp: they are alternate angles between two parallel horizontal lines.",
    },
  ],
  discovery: {
    scientist: "Aryabhata",
    years: "476–550 CE",
    fact: "At just 23, Aryabhata wrote the Aryabhatiya in Kusumapura, near today's Patna. It has one of the oldest tables of jya, the half-chord of a circle. Through Arabic and Latin translations, jya became the word sine. India's first satellite, launched in 1975, was named after him.",
    formula: "sin θ = opposite ÷ hypotenuse",
    formulaNote: "Aryabhata's jya gave this ratio for many angles. tan θ, used for heights, is sin θ ÷ cos θ, which is opposite ÷ adjacent.",
  },
  symbols: [
    { sym: "θ", meaning: "theta, a Greek letter used for an angle" },
    { sym: "tan θ", meaning: "tangent of θ: opposite side ÷ adjacent side in a right triangle; a calculator button" },
    { sym: "sin θ", meaning: "sine of θ: opposite side ÷ hypotenuse" },
    { sym: "cos θ", meaning: "cosine of θ: adjacent side ÷ hypotenuse" },
    { sym: "d", meaning: "distance along the ground to the foot of the object, in m" },
    { sym: "h", meaning: "height, in m" },
    { sym: "√3", meaning: "square root of 3, about 1.732" },
    { sym: "≈", meaning: "is about equal to" },
  ],
  ideas: [
    {
      title: "Angle of elevation",
      text: "Look straight ahead: that is the horizontal line from your eye. Now tilt up to see the top of a tower. The angle you tilted through is the angle of elevation. Your eye, the point straight across on the tower and the top make a right triangle.",
      formula: "tan θ = height above eye ÷ distance",
    },
    {
      title: "Finding the height",
      text: "Measure your distance from the foot and the angle of elevation. Multiply the distance by tan θ to get the height above your eye, then add your eye height.",
      formula: "h = (d × tan θ) + eye height",
    },
    {
      title: "Three angles worth remembering",
      text: "At 45° the height above your eye equals your distance. At 60° it is about 1.7 times your distance, and at 30° about 0.58 times. Walking closer makes the angle bigger.",
      formula: "tan 30° = 1 ÷ √3 ≈ 0.577;   tan 45° = 1;   tan 60° = √3 ≈ 1.732",
    },
    {
      title: "Angle of depression",
      text: "Looking down from a lighthouse at a boat, the angle between the horizontal line and your line of sight is the angle of depression. It equals the boat's angle of elevation of the lamp, because the two horizontal lines are parallel.",
      formula: "angle of depression = angle of elevation   (alternate angles)",
    },
  ],
  challenge: {
    title: "Mystery heights",
    text: "Three things with no height label: a water tank, a mobile tower and a giant statue. Walk, read the clinometer, work out each height and type it in. Within 1 m earns a star.",
  },
  quiz: [
    {
      q: "From a point on the ground 20 m from the foot of a tower, the angle of elevation of the top is 45°. How tall is the tower?",
      options: ["10 m", "20 m", "about 35 m", "40 m"],
      answer: 1,
      why: "h = 20 × tan 45° = 20 × 1 = 20 m.",
    },
    {
      q: "A kite string is 60 m long and makes 30° with the ground. How high is the kite? (sin 30° = 1 ÷ 2)",
      options: ["30 m", "about 35 m", "about 52 m", "60 m"],
      answer: 0,
      why: "The string is the hypotenuse, so h = 60 × sin 30° = 60 × (1 ÷ 2) = 30 m.",
    },
    {
      q: "From a point on the ground 30 m from a tower, the angle of elevation of the top is 60°. How tall is the tower?",
      options: ["about 17 m", "30 m", "about 52 m", "60 m"],
      answer: 2,
      why: "h = 30 × tan 60° = 30 × √3 ≈ 30 × 1.732 ≈ 52 m.",
    },
    {
      q: "You walk away from a building. The angle of elevation of its top:",
      options: ["gets bigger", "gets smaller", "stays the same", "becomes 90°"],
      answer: 1,
      why: "The height stays the same but the distance grows, so tan θ = height ÷ distance gets smaller, and so does θ.",
    },
    {
      q: "From the top of a 75 m lighthouse, the angle of depression of a boat is 45°. How far is the boat from the foot of the lighthouse?",
      options: ["37.5 m", "75 m", "about 106 m", "150 m"],
      answer: 1,
      why: "The boat's angle of elevation of the top is also 45°, and tan 45° = 1, so the distance equals the height: 75 m.",
    },
  ],
};
