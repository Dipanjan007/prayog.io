/**
 * Maths Olympiad, set 2: angles and polygons.
 * Original problems. Answers come from src/lib/sim/oly-polygon.ts, the same code the sim runs.
 */
import { closingTile, doublingSides, sidesForInterior } from "@/lib/sim/oly-polygon";
import type { OlyProblem } from "./types";

export const MATHS_POLYGON_PROBLEMS: OlyProblem[] = [
  {
    id: "jali-window",
    set: "angles-polygons",
    level: "warm-up",
    title: "The stone jali window",
    emoji: "🪟",
    story: [
      "A stone carver in Jaipur is cutting a new jali window for a haveli. The frame must be a regular polygon: all sides equal and all corners equal.",
      "The architect's drawing gives only one number: every inside corner of the frame is 140°.",
    ],
    given: ["Regular polygon", "Each inside angle: 140°"],
    ask: "How many sides does the window frame have?",
    answer: sidesForInterior(140),
    symbol: "n =",
    unit: "sides",
    range: [3, 100],
    hints: [
      "At each corner, the inside angle and the outside angle make a straight line, 180°. Find the outside angle first.",
      "The outside angles of any polygon add up to 360°. In a regular polygon they are all equal, so n = 360° ÷ (one outside angle).",
    ],
    solution: [
      { text: "The inside and outside angles at a corner add up to 180°.", math: "outside angle = 180° − 140° = 40°" },
      { text: "Walking once round any polygon you turn through 360° in total, one outside angle at each corner.", math: "n × 40° = 360°" },
      { text: "Solve for n.", math: "n = 360° ÷ (180° − 140°) = 360° ÷ 40° = 9" },
      { text: "Check with the inside-angle formula.", math: "180° − (360° ÷ 9) = 180° − 40° = 140°" },
    ],
    scene: (n) => ({ kind: "poly-regular", n, target: 140, thing: "jali window" }),
    simNote: "The sim draws a regular polygon with your number of sides and measures one inside angle against the 140° on the drawing.",
  },
  {
    id: "courtyard-tiles",
    set: "angles-polygons",
    level: "standard",
    title: "Three tiles at every corner",
    emoji: "🛕",
    story: [
      "The floor of a new temple courtyard in Madurai is laid with three kinds of regular tiles: a 12-sided tile, a square tile and a third regular tile.",
      "At every point where tiles meet, there is exactly one of each kind. There must be no gap and no overlap, or water will collect in the cracks.",
    ],
    given: ["One regular 12-gon, one square and one more regular polygon at each meeting point", "No gap, no overlap"],
    ask: "How many sides does the third tile have?",
    answer: closingTile([12, 4]),
    symbol: "n =",
    unit: "sides",
    range: [3, 100],
    hints: [
      "The three corners that meet at a point must fill a full turn: 360°.",
      "Find the inside angle of a regular 12-gon with 180° − (360° ÷ 12). The square gives 90°. What is left for the third tile?",
    ],
    solution: [
      { text: "Inside angle of the regular 12-gon.", math: "180° − (360° ÷ 12) = 180° − 30° = 150°" },
      { text: "The square's corner is 90°. Together the corners must make 360°.", math: "third angle = 360° − (150° + 90°) = 120°" },
      { text: "Which regular polygon has 120° corners?", math: "n = 360° ÷ (180° − 120°) = 360° ÷ 60° = 6" },
      { text: "It is a hexagon. This 12-gon, square and hexagon pattern is a real floor tiling, and you can see it in old mosaic floors." },
    ],
    scene: (n) => ({ kind: "poly-vertex", fixed: [12, 4], n }),
    simNote: "The sim lays the three tiles round one point, corner to corner. A wrong tile leaves a dark gap or overlaps the first tile.",
  },
  {
    id: "rangoli-frames",
    set: "angles-polygons",
    level: "olympiad",
    title: "Two rangoli frames",
    emoji: "🌸",
    story: [
      "For a Pongal rangoli contest, Lakshmi draws two regular polygon frames in chalk. The big frame has exactly twice as many sides as the small one.",
      "With a protractor she finds that each corner of the big frame is 12° wider than each corner of the small frame.",
    ],
    given: ["Small frame: regular, n sides", "Big frame: regular, 2n sides", "Big corner − small corner = 12°"],
    ask: "How many sides does the small frame have?",
    answer: doublingSides(12),
    symbol: "n =",
    unit: "sides",
    range: [3, 100],
    hints: [
      "Write both inside angles with 180° − (360° ÷ sides): one with n sides, one with 2n sides.",
      "Subtract. The 180° parts cancel and you are left with (360° ÷ n) − (360° ÷ 2n).",
    ],
    solution: [
      { text: "Inside angles of the two frames.", math: "small = 180° − (360° ÷ n),   big = 180° − (360° ÷ 2n) = 180° − (180° ÷ n)" },
      { text: "Subtract. The 180° parts cancel.", math: "big − small = (360° ÷ n) − (180° ÷ n) = 180° ÷ n" },
      { text: "This difference is 12°.", math: "180° ÷ n = 12°  ⇒  n = 180° ÷ 12° = 15" },
      { text: "Check: a 15-gon has corners of 180° − (360° ÷ 15) = 156°, and a 30-gon has 180° − (360° ÷ 30) = 168°. The difference is 12°.", math: "168° − 156° = 12°" },
    ],
    scene: (n) => ({ kind: "poly-pair", n, diff: 12 }),
    simNote: "The sim draws both regular frames for your n and measures one corner of each.",
  },
];
