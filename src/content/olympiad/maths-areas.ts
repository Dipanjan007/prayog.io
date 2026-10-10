/**
 * Maths Olympiad, set 4: areas and circles. π is taken as 22/7, so every answer is a whole number.
 * Original problems. Answers come from src/lib/sim/oly-fill.ts, the same code the sim runs.
 */
import { regionArea, type Region } from "@/lib/sim/oly-fill";
import type { OlyProblem } from "./types";

const PI = 22 / 7;
const RING: Region = { type: "ring", R: 21, r: 14 };
const LAWN: Region = { type: "square-minus-circle", s: 28 };
const LEAF: Region = { type: "leaf", s: 14 };

export const MATHS_AREA_PROBLEMS: OlyProblem[] = [
  {
    id: "thali-rangoli",
    set: "areas-circles",
    level: "warm-up",
    title: "A ring of rangoli round the thali",
    emoji: "🎨",
    story: [
      "For Diwali, Ananya places a round brass thali of radius 14 cm in the middle of the floor and draws a circle of radius 21 cm around it, with the same centre.",
      "She wants to fill the ring between the thali and the chalk circle with red rangoli powder, edge to edge.",
    ],
    given: ["Thali: radius 14 cm", "Chalk circle: radius 21 cm, same centre", "Take π = 22/7"],
    ask: "What area must the rangoli powder cover?",
    answer: regionArea(RING, PI),
    symbol: "A =",
    unit: "cm²",
    range: [1, 5000],
    hints: ["The ring is the big circle with the small circle taken out.", "Area of the ring = (π × 21²) − (π × 14²) = π × (21² − 14²)."],
    solution: [
      { text: "The ring is what is left of the big circle once the thali's circle is taken out.", math: "A = (π × R²) − (π × r²) = π × (R² − r²)" },
      { text: "Put in the two radii.", math: "R² − r² = 21² − 14² = 441 − 196 = 245" },
      { text: "Multiply by π = 22/7. 245 ÷ 7 = 35, which keeps the numbers whole.", math: "A = (22 ÷ 7) × 245 = 22 × 35 = 770 cm²" },
      { text: "A shortcut: 21² − 14² = (21 − 14) × (21 + 14) = 7 × 35. Spotting a difference of two squares saves work in a contest." },
    ],
    scene: (A) => ({ kind: "fill-pour", region: RING, pi: PI, amount: A, unit: "cm²", stuff: "rangoli powder", colour: "#f43f5e" }),
    simNote: "The sim pours exactly your area of powder into the ring, filling it from the bottom up. Too little leaves a bare band at the top; too much spills out beside it.",
  },
  {
    id: "temple-tank-lawn",
    set: "areas-circles",
    level: "standard",
    title: "Grass round the temple tank",
    emoji: "🛕",
    story: [
      "A temple in Kumbakonam has a square courtyard. Its boundary wall is 112 m long all the way round. In the middle is a round tank that just touches all four walls.",
      "The temple committee wants to plant grass in the four corners of the courtyard, the parts outside the tank.",
    ],
    given: ["Square courtyard, boundary wall 112 m in all", "Round tank touches all four walls", "Take π = 22/7"],
    ask: "What area of grass is needed?",
    answer: regionArea(LAWN, PI),
    symbol: "A =",
    unit: "m²",
    range: [1, 5000],
    hints: [
      "First find the side of the square from the wall's length. A tank that touches all four walls has a diameter equal to that side.",
      "Grass = square − circle. The radius is half the side.",
    ],
    solution: [
      { text: "The square has four equal sides.", math: "side = 112 ÷ 4 = 28 m" },
      { text: "The tank touches all four walls, so its diameter is 28 m and its radius is 14 m.", math: "r = 28 ÷ 2 = 14 m" },
      { text: "Area of the square and of the tank.", math: "square = 28² = 784 m²,   tank = (22 ÷ 7) × 14² = 22 × 28 = 616 m²" },
      { text: "The four corners are what is left.", math: "A = 784 − 616 = 168 m²" },
      { text: "Check: the corners are 168 ÷ 784 = 3/14 of the square, about a fifth, whatever the size of the courtyard." },
    ],
    scene: (A) => ({ kind: "fill-pour", region: LAWN, pi: PI, amount: A, unit: "m²", stuff: "grass", colour: "#4ade80" }),
    simNote: "The sim spreads exactly your area of grass into the four corners, starting from the bottom. The courtyard is drawn to scale.",
  },
  {
    id: "tile-leaf",
    set: "areas-circles",
    level: "olympiad",
    title: "The leaf hidden in a floor tile",
    emoji: "🍃",
    story: [
      "A tile maker in Morbi designs a square tile with an area of 196 cm². From one corner she draws a quarter circle with the compass set to the side of the tile. Then she does the same from the opposite corner.",
      "The two arcs cross and make a leaf shape across the middle of the tile. She wants to paint just the leaf green.",
    ],
    given: ["Square tile, area 196 cm²", "Two quarter circles, radius = side, centred on opposite corners", "Take π = 22/7"],
    ask: "What is the area of the leaf?",
    answer: regionArea(LEAF, PI),
    symbol: "A =",
    unit: "cm²",
    range: [1, 2000],
    hints: [
      "Each quarter circle covers the leaf plus one of the two pieces outside it. Adding both quarter circles counts the leaf twice.",
      "So (quarter circle) + (quarter circle) = square + leaf. The side is √196 = 14 cm.",
    ],
    solution: [
      { text: "Find the side of the tile.", math: "side = √196 = 14 cm" },
      { text: "One quarter circle of radius 14 cm.", math: "quarter = (22 ÷ 7) × 14² ÷ 4 = 616 ÷ 4 = 154 cm²" },
      { text: "The two quarter circles together cover the whole square, and the leaf twice.", math: "154 + 154 = 196 + leaf" },
      { text: "Solve for the leaf.", math: "leaf = 308 − 196 = 112 cm²" },
      { text: "Check: the leaf is 112 ÷ 196 = 4/7 of the tile, a little over half, which matches the picture." },
    ],
    scene: (A) => ({ kind: "fill-pour", region: LEAF, pi: PI, amount: A, unit: "cm²", stuff: "green paint", colour: "#22c55e" }),
    simNote: "The sim pours exactly your area of paint into the leaf, from the bottom corner up. The arcs are drawn to scale on a 14 cm tile.",
  },
];
