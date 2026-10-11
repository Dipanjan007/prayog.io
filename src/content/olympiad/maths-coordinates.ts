/**
 * Maths Olympiad, set 9: coordinates and heights.
 * Original problems. Answers come from src/lib/sim/oly-triangle.ts, the same code the sim runs.
 */
import { distance, towerFromTwoAngles, towerHeight } from "@/lib/sim/oly-triangle";
import type { OlyProblem } from "./types";

const SCHOOL: [number, number] = [-2, 3];
const STATION: [number, number] = [10, -2];
const GOPURAM = { dist: 30, angle: 60, eye: 1.6 };
const LIGHT = { a1: 30, a2: 60, gap: 60 };

export const MATHS_COORDINATE_PROBLEMS: OlyProblem[] = [
  {
    id: "town-map",
    set: "coordinates-heights",
    level: "warm-up",
    title: "As the crow flies across Mysuru",
    emoji: "🗺️",
    story: [
      "Ravi's town map of Mysuru has a square grid with the clock tower at the origin (0, 0). One square is 1 km. East is the positive x direction and north is the positive y direction.",
      "His school is at (−2, 3) and the railway station is at (10, −2). A drone delivering exam papers flies in a straight line from the school to the station.",
    ],
    given: ["School: (−2, 3)", "Railway station: (10, −2)", "1 unit = 1 km"],
    ask: "How far does the drone fly?",
    answer: distance(SCHOOL, STATION),
    symbol: "d =",
    unit: "km",
    range: [0.1, 100],
    hints: ["Find how far east and how far south the station is from the school. Careful with the minus signs.", "Those two distances are the legs of a right triangle. Use d = √[(x₂ − x₁)² + (y₂ − y₁)²]."],
    solution: [
      { text: "Across: from x = −2 to x = 10.", math: "x₂ − x₁ = 10 − (−2) = 12 km" },
      { text: "Up and down: from y = 3 to y = −2.", math: "y₂ − y₁ = (−2) − 3 = −5 km" },
      { text: "Pythagoras. Squaring removes the minus sign.", math: "d = √[12² + (−5)²] = √(144 + 25) = √169" },
      { text: "Take the root.", math: "d = 13 km" },
      { text: "5, 12, 13 is a famous whole-number right triangle, like 3, 4, 5." },
    ],
    scene: (L) => ({ kind: "tri-map", from: { name: "School", at: SCHOOL }, to: { name: "Station", at: STATION }, L, unit: "km" }),
    simNote: "The sim lays a line of your length from the school towards the station. The dashed lines show the right triangle under it.",
  },
  {
    id: "gopuram-height",
    set: "coordinates-heights",
    level: "standard",
    title: "How tall is the gopuram?",
    emoji: "🛕",
    story: [
      "Divya is on a school trip to a temple town in Tamil Nadu. She stands on level ground 30 m from the foot of the tall gateway tower, the gopuram, and looks up at its very top.",
      "Her clinometer, a protractor with a thread and a weight, shows the angle of elevation is 60°. Her eyes are 1.6 m above the ground.",
    ],
    given: ["Distance to the foot of the gopuram: 30 m", "Angle of elevation of the top: 60°", "Eye height: 1.6 m", "tan 60° = √3 ≈ 1.732"],
    ask: "How tall is the gopuram?",
    answer: towerHeight(GOPURAM.dist, GOPURAM.angle, GOPURAM.eye),
    symbol: "h =",
    unit: "m",
    range: [1, 500],
    hints: [
      "Draw a level line from Divya's eye to the gopuram. The right triangle has its right angle there, 1.6 m above the ground.",
      "tan 60° = (height above eye level) ÷ 30. Then add the 1.6 m back on.",
    ],
    solution: [
      { text: "In the right triangle from her eye, the side opposite 60° is the height above eye level.", math: "tan 60° = (h − 1.6) ÷ 30" },
      { text: "Multiply by 30.", math: "h − 1.6 = 30 × tan 60° = 30 × √3 ≈ 30 × 1.732 = 51.96 m" },
      { text: "Add her eye height.", math: "h = 51.96 + 1.6 = 53.56 m" },
      { text: "Forgetting the 1.6 m gives 51.96 m, about 3% short, which the sim will show as a tower that is too short." },
    ],
    scene: (h) => ({ kind: "tri-tower", ...GOPURAM, h, what: "gopuram" }),
    simNote: "The sim draws the 60° sight line from Divya's eye and a gopuram of your height. If you are right, the line grazes the very top.",
  },
  {
    id: "lighthouse-boat",
    set: "coordinates-heights",
    level: "olympiad",
    title: "The lighthouse from a fishing boat",
    emoji: "🚤",
    story: [
      "A fishing boat off the coast near Mahabalipuram heads straight for the lighthouse. From the boat, the angle of elevation of the top of the lighthouse is 30°.",
      "After the boat goes 60 m closer, still in a straight line towards the lighthouse, the angle of elevation is 60°. Take the boat to be at sea level and the lighthouse to stand straight up from it.",
    ],
    given: ["First angle of elevation: 30°", "Boat moves 60 m straight towards the lighthouse", "Second angle of elevation: 60°"],
    ask: "How tall is the lighthouse?",
    answer: towerFromTwoAngles(LIGHT.a1, LIGHT.a2, LIGHT.gap),
    symbol: "h =",
    unit: "m",
    range: [1, 500],
    hints: [
      "Call the second distance to the foot y. Then tan 60° = h ÷ y and tan 30° = h ÷ (y + 60).",
      "Or look at the triangle made by the two boat spots and the top. Its angles are 30°, 120° and 30°, so two of its sides are equal.",
    ],
    solution: [
      { text: "The sight line from the second spot makes 60° with the sea, so the angle inside the triangle at that spot is 180° − 60° = 120°.", math: "angle at the top = 180° − (30° + 120°) = 30°" },
      { text: "Two 30° angles: the triangle is isosceles, so the second spot is 60 m from the top of the lighthouse too.", math: "distance from second spot to the top = 60 m" },
      { text: "In the right triangle at the second spot, the height is opposite 60°.", math: "h = 60 × sin 60° = 60 × (√3 ÷ 2) = 30 × √3" },
      { text: "Work it out.", math: "h ≈ 30 × 1.732 = 51.96 m" },
      { text: "Check with tangents: the spots are h ÷ tan 30° = 90 m and h ÷ tan 60° = 30 m from the foot, and 90 − 30 = 60 m." },
    ],
    scene: (h) => ({ kind: "tri-tower2", ...LIGHT, h, what: "lighthouse" }),
    simNote: "The sim puts the boat where a lighthouse of your height is seen at 30°, sails it 60 m in, and measures the angle again.",
  },
];
