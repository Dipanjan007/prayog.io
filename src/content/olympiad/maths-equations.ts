/**
 * Maths Olympiad, set 7: equations and word problems.
 * Original problems. Answers come from src/lib/sim/oly-equation.ts, the same code the sim runs.
 */
import { meetTime, solveBalance, trainLength, type Pan } from "@/lib/sim/oly-equation";
import type { OlyProblem } from "./types";

const LEFT: Pan = { x: 3, k: 2 };
const RIGHT: Pan = { x: 1, k: 9 };
const LINE = { D: 330, v1: 60, v2: 75, delay2: 1, from: "Anandpur", to: "Bhimgarh", start: 6 };
/** Cyclist 18 km/h = 5 m/s, walker 3.6 km/h = 1 m/s. */
const PASS = { vc: 5, tc: 14, vw: 1, tw: 10 };

export const MATHS_EQUATION_PROBLEMS: OlyProblem[] = [
  {
    id: "mandi-balance",
    set: "equations",
    level: "warm-up",
    title: "Cabbages on the mandi balance",
    emoji: "⚖️",
    story: [
      "At the sabzi mandi in Indore, Ramesh bhaiya has lost most of his weights. He has only one 5 kg weight, three 2 kg weights and a pile of cabbages that all weigh the same.",
      "He puts 3 cabbages and the 2 kg weight on the left pan. On the right pan he puts 1 cabbage and 9 kg of weights. The beam stays perfectly level.",
    ],
    given: ["Left pan: 3 cabbages + 2 kg", "Right pan: 1 cabbage + 9 kg (5 + 2 + 2)", "All cabbages weigh the same; the beam is level"],
    ask: "How much does one cabbage weigh?",
    answer: solveBalance(LEFT, RIGHT),
    symbol: "w =",
    unit: "kg",
    range: [0.01, 50],
    hints: ["Write the balance as an equation: (3 × w) + 2 = w + 9.", "Take one cabbage off each pan and 2 kg off each side. The beam stays level."],
    solution: [
      { text: "A level beam means both pans hold the same weight.", math: "(3 × w) + 2 = w + 9" },
      { text: "Take one cabbage off each pan.", math: "(2 × w) + 2 = 9" },
      { text: "Take 2 kg off each side.", math: "2 × w = 7" },
      { text: "Halve both sides.", math: "w = 7 ÷ 2 = 3.5 kg" },
      { text: "Check: left (3 × 3.5) + 2 = 12.5 kg, right 3.5 + 9 = 12.5 kg." },
    ],
    scene: (w) => ({ kind: "eq-balance", left: LEFT, right: RIGHT, w, thing: "cabbage" }),
    simNote: "The sim loads both pans with cabbages of your weight. The beam tips towards the heavier side.",
  },
  {
    id: "single-line-trains",
    set: "equations",
    level: "standard",
    title: "Two trains on a single line",
    emoji: "🚆",
    story: [
      "Anandpur and Bhimgarh are 330 km apart on a single railway line with a passing loop at every station. A goods train leaves Anandpur at 6:00 a.m. towards Bhimgarh at a steady 60 km/h.",
      "At 7:00 a.m. an express leaves Bhimgarh towards Anandpur at a steady 75 km/h. The station master must switch one of them into a loop at exactly the point where they meet.",
    ],
    given: ["Distance: 330 km", "Goods train: from Anandpur at 6:00, 60 km/h", "Express: from Bhimgarh at 7:00, 75 km/h"],
    ask: "How far from Anandpur do the two trains meet?",
    answer: LINE.v1 * meetTime(LINE.D, LINE.v1, LINE.v2, LINE.delay2),
    symbol: "x =",
    unit: "km",
    range: [1, 330],
    hints: [
      "By 7:00 the goods train has already covered 60 km. How far apart are the trains then?",
      "After 7:00 they close the gap together at 60 + 75 = 135 km/h. Time to meet = gap ÷ 135.",
    ],
    solution: [
      { text: "In the first hour only the goods train moves.", math: "at 7:00, gap = 330 − 60 = 270 km" },
      { text: "Moving towards each other, the gap shrinks by both speeds added.", math: "closing speed = 60 + 75 = 135 km/h" },
      { text: "Time from 7:00 until they meet.", math: "270 ÷ 135 = 2 h  ⇒  they meet at 9:00" },
      { text: "The goods train has then run for 3 hours.", math: "x = 60 × 3 = 180 km" },
      { text: "Check from the other side: the express runs 2 hours, 75 × 2 = 150 km, and 180 + 150 = 330 km." },
    ],
    scene: (x) => ({ kind: "eq-trains", ...LINE, t: x / LINE.v1 }),
    simNote: "The sim runs the goods train until it reaches your distance, and the express by the timetable. If your point is right, they arrive together.",
  },
  {
    id: "train-length",
    set: "equations",
    level: "olympiad",
    title: "The train, the cyclist and the walker",
    emoji: "🚄",
    story: [
      "A train runs at a steady speed along a straight track near Nashik. A road runs right beside it. A cyclist rides at 18 km/h in the same direction as the train, and the train takes 14 s to pass her completely.",
      "A little further on, a farmer walks at 3.6 km/h towards the train. The train takes 10 s to pass him completely.",
    ],
    given: ["Cyclist: 18 km/h, same direction, passed in 14 s", "Walker: 3.6 km/h, opposite direction, passed in 10 s", "The train's speed and length do not change"],
    ask: "How long is the train?",
    answer: trainLength(PASS.vc, PASS.tc, PASS.vw, PASS.tw),
    symbol: "L =",
    unit: "m",
    range: [1, 2000],
    hints: [
      "Change the speeds to m/s first: 18 km/h = 5 m/s and 3.6 km/h = 1 m/s. Call the train's speed v m/s.",
      "Passing someone, the train must slide its whole length past them at the relative speed: L = (v − 5) × 14 and L = (v + 1) × 10.",
    ],
    solution: [
      { text: "Convert to m/s by multiplying by 5/18.", math: "18 km/h = 5 m/s,   3.6 km/h = 1 m/s" },
      { text: "Same direction: the train gains on the cyclist at v − 5. Opposite direction: it closes on the walker at v + 1.", math: "L = (v − 5) × 14 = (v + 1) × 10" },
      { text: "Solve for v.", math: "(14 × v) − 70 = (10 × v) + 10  ⇒  4 × v = 80  ⇒  v = 20 m/s" },
      { text: "Put v back in.", math: "L = (20 − 5) × 14 = 15 × 14 = 210 m" },
      { text: "Check with the walker: (20 + 1) × 10 = 210 m. The train runs at 20 m/s, which is 72 km/h." },
    ],
    scene: (L) => ({ kind: "eq-overtake", ...PASS, L }),
    simNote: "The sim gives the train your length and the speed that makes it pass the cyclist in exactly 14 s. Then it times the pass of the walker.",
  },
];
