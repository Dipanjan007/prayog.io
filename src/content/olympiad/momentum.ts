/**
 * Olympiad track, set 4: momentum.
 * Original problems. Answers come from src/lib/sim/oly-momentum.ts, the same code the sim runs.
 */
import { bulletSpeedForAngle, eastSpeedFromSkid, northSpeedFromSkid, throwSpeedForDrift } from "@/lib/sim/oly-momentum";
import type { OlyProblem } from "./types";

/** The autorickshaw's real speed, reconstructed from the skid marks. The sim uses it. */
const AUTO_SPEED = northSpeedFromSkid(1200, 400, 30, 5.0, 0.5);

export const MOMENTUM_PROBLEMS: OlyProblem[] = [
  {
    id: "gaganyaan-drift",
    set: "momentum",
    level: "warm-up",
    title: "Drifting home in Gaganyaan",
    emoji: "🚀",
    story: [
      "Inside a Gaganyaan orbital module, a 60 kg astronaut floats at rest, 3.0 m in front of the hatch behind her. Nothing is close enough to push against.",
      "She decides to throw her 3.0 kg tool bag forward, away from the hatch, so that she drifts backwards to it.",
    ],
    given: ["Astronaut: 60 kg, at rest", "Tool bag: 3.0 kg", "Distance to the hatch: 3.0 m", "Time wanted: 15 s"],
    ask: "How fast must she throw the bag so that she reaches the hatch in exactly 15 s?",
    answer: throwSpeedForDrift(60, 3.0, 3.0, 15),
    symbol: "u =",
    unit: "m/s",
    range: [0.05, 40],
    hints: [
      "She must drift 3.0 m in 15 s at a steady speed. What speed is that?",
      "Total momentum starts at zero and stays zero, because no outside force acts: 60 × V = 3.0 × u.",
    ],
    solution: [
      { text: "Her drift speed.", math: "V = 3.0 m / 15 s = 0.20 m/s" },
      { text: "No outside force acts on her and the bag together, so their total momentum stays zero.", math: "0 = m u − M V  ⇒  u = M V / m" },
      { text: "Put in the numbers.", math: "u = 60 × 0.20 / 3.0 = 4.0 m/s" },
      { text: "The bag is 20 times lighter, so it moves 20 times faster. The kinetic energy is shared very unequally: the bag gets 24 J and she gets only 1.2 J." },
    ],
    scene: (u) => ({ kind: "recoil", M: 60, m: 3.0, u, d: 3.0, targetT: 15 }),
    simNote: "Side view of the module. Time runs fast so you do not wait the full 15 s. Air in the cabin is ignored.",
  },
  {
    id: "air-rifle-pendulum",
    set: "momentum",
    level: "standard",
    title: "Clocking an air rifle pellet",
    emoji: "🎯",
    story: [
      "A shooting coach in Pune wants to measure the speed of an air rifle pellet without a chronograph. She hangs a 200 g wooden block from two light strings 0.80 m long.",
      "A 1.0 g pellet is fired horizontally into the block and stays inside it. The block swings up until the strings make 20° with the vertical.",
    ],
    given: ["Pellet: 1.0 g", "Block: 200 g", "String length: 0.80 m", "Highest swing: 20° from the vertical", "g = 9.8 m/s²"],
    ask: "What was the speed of the pellet?",
    answer: bulletSpeedForAngle(0.001, 0.2, 0.8, 20),
    symbol: "v =",
    unit: "m/s",
    range: [5, 2000],
    hints: [
      "Split the event in two. The impact is very quick: momentum is conserved, but kinetic energy is not. The swing is slow: mechanical energy is conserved.",
      "The block rises h = L(1 − cos 20°). Just after impact its speed is V = √(2gh). Then v = (m + M)V / m.",
    ],
    solution: [
      { text: "Height the block rises.", math: "h = L (1 − cos 20°) = 0.80 × (1 − 0.9397) = 0.0482 m" },
      { text: "During the swing, energy is conserved from just after impact to the highest point.", math: "V = √(2 g h) = √(2 × 9.8 × 0.0482) = 0.972 m/s" },
      { text: "During the impact, momentum is conserved. The strings are vertical then, so they give no sideways push.", math: "m v = (m + M) V" },
      { text: "Solve for v.", math: "v = (0.001 + 0.200) × 0.972 / 0.001 = 195 m/s" },
      { text: "Only 0.5% of the pellet's kinetic energy survives the impact. The rest becomes heat, sound and a dent in the wood. Using energy conservation for the impact is the classic mistake here." },
    ],
    scene: (v) => ({ kind: "pendulum", mb: 0.001, M: 0.2, v, L: 0.8, targetDeg: 20, window: 0.8 }),
    simNote: "The pellet is shown in slow motion. The swing after impact uses the exact height from energy; its timing is drawn as a simple pendulum.",
  },
  {
    id: "crossing-crash",
    set: "momentum",
    level: "olympiad",
    title: "Who was speeding at the crossing?",
    emoji: "🚗",
    story: [
      "At an unmarked crossing in Lucknow, a 1200 kg car going east crashes into a 400 kg loaded autorickshaw going north. The two lock together and skid.",
      "The police find straight skid marks 5.0 m long, pointing 30° north of east from the point of impact. The coefficient of kinetic friction between the tyres and the road is 0.50.",
    ],
    given: ["Car: 1200 kg, going east", "Autorickshaw: 400 kg, going north", "Skid: 5.0 m at 30° north of east", "μₖ = 0.50, g = 9.8 m/s²"],
    ask: "How fast was the car going just before the crash?",
    answer: eastSpeedFromSkid(1200, 400, 30, 5.0, 0.5),
    symbol: "v =",
    unit: "m/s",
    range: [0.5, 40],
    hints: [
      "Work backwards. From the skid length and the friction, find the speed of the wreck just after the crash: V² = 2μgd.",
      "Momentum is conserved separately along east and along north. Along east: 1200 v = 1600 V cos 30°.",
    ],
    solution: [
      { text: "Friction does work on the wreck until it stops.", math: "½ M V² = μ M g d  ⇒  V = √(2 × 0.50 × 9.8 × 5.0) = 7.0 m/s" },
      { text: "The crash is so quick that friction cannot change the momentum during it. Along east:", math: "1200 v = 1600 × 7.0 × cos 30°" },
      { text: "Solve for v.", math: "v = 1600 × 7.0 × 0.866 / 1200 = 8.08 m/s ≈ 29 km/h" },
      {
        text: "The same idea along north gives the autorickshaw's speed. It was going at 50 km/h, so the car was not the one speeding.",
        math: "400 u = 1600 × 7.0 × sin 30°  ⇒  u = 14 m/s ≈ 50 km/h",
      },
    ],
    scene: (v) => ({ kind: "crash", m1: 1200, v1: v, m2: 400, v2: AUTO_SPEED, mu: 0.5, skidDeg: 30, skidD: 5.0, window: 0.4 }),
    simNote: "Top view. The two vehicles are treated as points that lock together. The autorickshaw's speed in the sim is the true one, worked out from the skid marks.",
  },
];
