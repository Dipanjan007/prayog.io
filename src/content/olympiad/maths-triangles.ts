/**
 * Maths Olympiad, set 3: triangles and Pythagoras.
 * Original problems. Answers come from src/lib/sim/oly-triangle.ts, the same code the sim runs.
 */
import { breakHeight, crossHeight, hypot2 } from "@/lib/sim/oly-triangle";
import type { OlyProblem } from "./types";

export const MATHS_TRIANGLE_PROBLEMS: OlyProblem[] = [
  {
    id: "temple-ladder",
    set: "triangles",
    level: "warm-up",
    title: "A ladder to the temple window",
    emoji: "🪜",
    story: [
      "Before Navratri, the pujari of a village temple near Nashik wants to hang a brass lamp at a window. The window sill is 6 m above the ground.",
      "A bed of marigolds runs along the wall, so the foot of the ladder must stand 2.5 m out from the wall. The ladder's top must rest exactly at the sill.",
    ],
    given: ["Window sill: 6 m up the wall", "Foot of the ladder: 2.5 m from the wall", "Wall and ground meet at a right angle"],
    ask: "How long must the ladder be?",
    answer: hypot2(2.5, 6),
    symbol: "L =",
    unit: "m",
    range: [0.5, 30],
    hints: [
      "The wall, the ground and the ladder make a right triangle. The ladder is the longest side, opposite the right angle.",
      "Use Pythagoras: L² = 2.5² + 6².",
    ],
    solution: [
      { text: "The ladder is the hypotenuse of a right triangle with sides 2.5 m and 6 m.", math: "L² = 2.5² + 6²" },
      { text: "Square and add.", math: "L² = 6.25 + 36 = 42.25" },
      { text: "Take the square root.", math: "L = √42.25 = 6.5 m" },
      { text: "Check: 2.5, 6 and 6.5 are 5, 12 and 13 halved, a famous right triangle.", math: "(5 ÷ 2)² + (12 ÷ 2)² = (13 ÷ 2)²" },
    ],
    scene: (L) => ({ kind: "tri-ladder", foot: 2.5, target: 6, L }),
    simNote: "The foot of your ladder is fixed 2.5 m from the wall and the ladder leans until its top touches the wall. The sill is at 6 m.",
  },
  {
    id: "monsoon-bamboo",
    set: "triangles",
    level: "standard",
    title: "The bamboo and the monsoon wind",
    emoji: "🎋",
    story: [
      "In a bamboo grove in Assam, a straight bamboo stood 16 m tall. A monsoon gust snapped it partway up, but the two parts stayed joined at the break.",
      "The top tipped over and now touches the ground 8 m from the foot of the bamboo. The standing part is still upright.",
    ],
    given: ["Full height: 16 m", "Top touches the ground 8 m from the foot", "The standing part is vertical"],
    ask: "At what height did the bamboo snap?",
    answer: breakHeight(16, 8),
    symbol: "x =",
    unit: "m",
    range: [0.1, 15.9],
    hints: [
      "Call the break height x. Then the fallen top part is (16 − x) m long, and it is the slanting side of a right triangle.",
      "Pythagoras: x² + 8² = (16 − x)². Expand the bracket; the x² terms cancel.",
    ],
    solution: [
      { text: "The standing part, the ground and the fallen part make a right triangle. The fallen part is the hypotenuse.", math: "x² + 8² = (16 − x)²" },
      { text: "Expand the right side.", math: "x² + 64 = 256 − (32 × x) + x²" },
      { text: "The x² terms cancel.", math: "32 × x = 256 − 64 = 192  ⇒  x = 192 ÷ 32 = 6 m" },
      { text: "Check: the fallen part is 10 m and 6² + 8² = 36 + 64 = 100 = 10².", math: "6² + 8² = 10²" },
    ],
    scene: (x) => ({ kind: "tri-bamboo", total: 16, mark: 8, x }),
    simNote: "The sim snaps a 16 m bamboo at your height and swings the top down. It lands where Pythagoras says it must; the flag is at 8 m.",
  },
  {
    id: "mela-wires",
    set: "triangles",
    level: "olympiad",
    title: "The prop under the mela wires",
    emoji: "🎡",
    story: [
      "At the Pushkar mela, two bamboo poles stand upright 10 m apart: one 12 m tall and one 18 m tall. A string of lights runs from the top of each pole to the foot of the other, so the two strings cross.",
      "The organiser wants a third, upright pole placed right under the crossing so that its top just touches the point where the strings cross.",
    ],
    given: ["Poles: 12 m and 18 m, upright", "Gap between the poles: 10 m", "Each string runs from the top of one pole to the foot of the other"],
    ask: "How tall must the third pole be?",
    answer: crossHeight(12, 18),
    symbol: "h =",
    unit: "m",
    range: [0.1, 30],
    hints: [
      "Say the third pole stands p m from the 12 m pole and q m from the 18 m pole, with p + q = 10. Each string makes a pair of similar triangles.",
      "One string gives h ÷ 18 = p ÷ 10, the other gives h ÷ 12 = q ÷ 10. Add the two equations.",
    ],
    solution: [
      { text: "The string from the top of the 18 m pole down to the foot of the 12 m pole: the third pole and the 18 m pole make similar triangles.", math: "h ÷ 18 = p ÷ 10" },
      { text: "The other string, from the top of the 12 m pole to the foot of the 18 m pole, gives the same kind of pair.", math: "h ÷ 12 = q ÷ 10" },
      { text: "Add them. Since p + q = 10, the right side becomes 1.", math: "h × [(1 ÷ 18) + (1 ÷ 12)] = (p + q) ÷ 10 = 1" },
      { text: "Solve for h.", math: "h = (12 × 18) ÷ (12 + 18) = 216 ÷ 30 = 7.2 m" },
      { text: "The 10 m gap cancelled out. Move the poles closer or further apart and the strings still cross 7.2 m up." },
    ],
    scene: (y) => ({ kind: "tri-cross", h1: 12, h2: 18, gap: 10, y }),
    simNote: "The sim stretches the two strings and stands your pole right under their crossing point.",
  },
];
