/**
 * Olympiad track: optics.
 * Original problems. Answers come from src/lib/sim/oly-optics.ts, the same code the sim runs.
 */
import { benchImage, laserReach, realDepth } from "@/lib/sim/oly-optics";
import type { OlyProblem } from "./types";

const CANDLE = { x: 20, h: 3, name: "candle" };
const CANDLE_LENS = [{ x: 50, f: 20 }];

const MARK = { x: 10, h: 0.5, name: "hallmark" };
const MARK_LENSES = [
  { x: 25, f: 10 },
  { x: 65, f: 8 },
];

const RING = { H: 0.9, tiltDeg: 53, apparent: 1.2, n: 1.33 };

export const OPTICS_PROBLEMS: OlyProblem[] = [
  {
    id: "practical-candle",
    set: "optics",
    level: "warm-up",
    title: "Board practical: catch the candle",
    emoji: "🕯️",
    story: [
      "It is the Class 10 practical exam at a school in Bhopal. Riya has a metre-and-a-half optical bench with a scale marked in centimetres.",
      "A convex lens of focal length 20 cm stands at the 50 cm mark. A lit candle, with a flame 3.0 cm tall, stands at the 20 cm mark. The examiner asks her to place the white screen where the flame's picture is perfectly sharp, before she even switches off the lights.",
    ],
    given: ["Convex lens, f = +20 cm, at the 50 cm mark", "Candle at the 20 cm mark", "Flame height: 3.0 cm", "Use the NCERT sign convention"],
    ask: "At which mark on the bench should Riya put the screen?",
    answer: benchImage(CANDLE, CANDLE_LENS).x,
    symbol: "mark =",
    unit: "cm",
    range: [51, 250],
    hints: [
      "Measure every distance from the lens. The candle is 30 cm to the left of the lens, so u = −30 cm in the NCERT convention.",
      "Use the lens formula 1/v − 1/u = 1/f to find v, then add v to the lens position to get the mark on the bench.",
    ],
    solution: [
      { text: "Distances are measured from the lens. Light goes left to right, so the candle on the left has a negative distance.", math: "u = 20 − 50 = −30 cm,   f = +20 cm" },
      { text: "Use the lens formula.", math: "1/v = 1/f + 1/u = 1/20 − 1/30 = (3 − 2)/60 = 1/60  ⇒  v = +60 cm" },
      { text: "v is positive, so the image is real and on the far side of the lens, 60 cm from it.", math: "screen mark = 50 + 60 = 110 cm" },
      { text: "Check the size with the magnification.", math: "m = v/u = 60/(−30) = −2,   image height = −2 × 3.0 = −6.0 cm" },
      { text: "So Riya sees a flame 6.0 cm tall and upside down. The candle sits between f and 2f, so the image is beyond 2f and magnified, just as the ray diagram predicts." },
    ],
    scene: (mark) => ({ kind: "optics-bench", object: CANDLE, lenses: CANDLE_LENS, screen: mark, bench: 150, aperture: 4, tol: 0.03, ask: "mark" }),
    simNote: "Thin lens, rays close to the axis. Heights are stretched compared with distances so the rays are easy to see. The image counts as sharp if the screen is within 3% of the right spot.",
  },
  {
    id: "hallmark-projector",
    set: "optics",
    level: "standard",
    title: "Projecting a hallmark in Jaipur",
    emoji: "💍",
    story: [
      "In a jewellery workshop in Jaipur, Arjun builds a little projector so customers can read the tiny hallmark stamped on a gold ring. The hallmark is 5.0 mm tall.",
      "On his bench the hallmark is at the 10 cm mark. The first convex lens, f = 10 cm, is at the 25 cm mark. A second convex lens, f = 8.0 cm, is at the 65 cm mark. Light from the lamp passes through the hallmark, then through both lenses, and falls on a white card.",
    ],
    given: ["Hallmark at the 10 cm mark, 5.0 mm tall", "Lens 1: f = +10 cm, at the 25 cm mark", "Lens 2: f = +8.0 cm, at the 65 cm mark", "Use the NCERT sign convention"],
    ask: "How far behind the second lens must Arjun hold the card to see a sharp picture of the hallmark?",
    answer: benchImage(MARK, MARK_LENSES).x - MARK_LENSES[1].x,
    symbol: "d =",
    unit: "cm",
    range: [1, 150],
    hints: [
      "Work one lens at a time. First find where lens 1 alone forms the image of the hallmark.",
      "That first image is the object for lens 2. Measure its distance from lens 2, with the sign, and use the lens formula again.",
    ],
    solution: [
      { text: "Lens 1: the hallmark is 15 cm to its left.", math: "u₁ = −15 cm,   1/v₁ = 1/10 − 1/15 = 1/30  ⇒  v₁ = +30 cm" },
      { text: "So lens 1 makes a real image at the 25 + 30 = 55 cm mark. Lens 2 is at 65 cm, so this image is 10 cm to its left and acts as its object.", math: "u₂ = 55 − 65 = −10 cm" },
      { text: "Lens 2.", math: "1/v₂ = 1/8 − 1/10 = (5 − 4)/40 = 1/40  ⇒  v₂ = +40 cm" },
      { text: "The final image is real, 40 cm behind lens 2 (at the 105 cm mark). That is where the card goes.", math: "d = 40 cm" },
      { text: "Total magnification is the product. Two inversions make the picture upright.", math: "m = (30/−15) × (40/−10) = (−2) × (−4) = +8,   height = 8 × 5.0 mm = 4.0 cm" },
    ],
    scene: (d) => ({ kind: "optics-bench", object: MARK, lenses: MARK_LENSES, screen: MARK_LENSES[1].x + d, bench: 150, aperture: 3, tol: 0.03, ask: "behind-last" }),
    simNote: "Thin lenses, rays close to the axis, no light lost. Heights are stretched so the rays are easy to see. The picture counts as sharp if the card is within 3% of the right spot.",
  },
  {
    id: "teppakulam-ring",
    set: "optics",
    level: "olympiad",
    title: "A laser finds the lost ring",
    emoji: "💡",
    story: [
      "During the float festival at the big temple tank in Madurai, a pilgrim's silver ring slips off and sinks. Looking straight down from a boat, a volunteer sees it lying on the flat floor of the tank. It looks 1.20 m deep.",
      "The rescue boat carries a laser marker fixed 0.90 m above the water, pointing forward and down at 53° from the vertical. The crew wants to park the boat so that the red spot lands exactly on the ring, to guide the diver.",
    ],
    given: ["Ring looks 1.20 m deep when seen from straight above", "Refractive index of water: 1.33", "Laser height above the water: 0.90 m", "Laser tilt: 53° from the vertical"],
    ask: "How far, horizontally, from the ring must the laser be?",
    answer: laserReach(RING.H, RING.tiltDeg, realDepth(RING.apparent, RING.n), RING.n),
    symbol: "D =",
    unit: "m",
    range: [0.2, 6],
    hints: [
      "Water makes things look shallower. Seen from straight above, real depth = n × apparent depth.",
      "Split the beam's path into two straight pieces: through the air to the surface, then through the water to the floor. Snell's law, sin i = n sin r, gives the angle in the water. Each piece moves sideways by (height) × tan(angle).",
    ],
    solution: [
      { text: "First the true depth of the tank.", math: "d = n × apparent depth = 1.33 × 1.20 = 1.596 m" },
      { text: "In the air the beam makes 53° with the vertical. It reaches the water this far ahead of the laser.", math: "x₁ = 0.90 × tan 53° = 0.90 × 1.327 = 1.194 m" },
      { text: "At the surface the beam bends towards the normal (the vertical). Use Snell's law.", math: "sin r = sin 53° / 1.33 = 0.7986 / 1.33 = 0.6005  ⇒  r = 36.9°" },
      { text: "In the water it goes down 1.596 m at 36.9° from the vertical.", math: "x₂ = 1.596 × tan 36.9° = 1.596 × 0.751 = 1.198 m" },
      { text: "Add the two pieces.", math: "D = x₁ + x₂ = 1.194 + 1.198 = 2.39 m" },
      { text: "A common trap is to use the apparent depth of 1.20 m. That would give D = 2.10 m, and the spot would land about 30 cm beyond the ring." },
    ],
    scene: (D) => ({ kind: "optics-laser", H: RING.H, tiltDeg: RING.tiltDeg, depth: realDepth(RING.apparent, RING.n), n: RING.n, apparent: RING.apparent, D, hit: 0.05 }),
    simNote: "The water surface is flat and still, and the beam is a thin line. The spot counts as on the ring if it lands within 5 cm of it.",
  },
];
