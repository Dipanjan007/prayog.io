/**
 * Olympiad track, set 3: circular motion and energy.
 * Original problems. Answers come from src/lib/sim/oly-track.ts, the same code the sim runs.
 */
import { bankAngle, loopHeightForTopNormal, springCompressionForLoop } from "@/lib/sim/oly-track";
import type { OlyProblem } from "./types";

export const CIRCULAR_PROBLEMS: OlyProblem[] = [
  {
    id: "ghat-hairpin",
    set: "circular-energy",
    level: "warm-up",
    title: "Banking a hairpin bend",
    emoji: "🛣️",
    story: [
      "A hairpin bend on the ghat road to Mahabaleshwar has a radius of 40 m. After rain the road is slippery, so friction cannot be trusted.",
      "The engineers decide to tilt (bank) the road so that a car going at 36 km/h needs no friction at all to take the bend.",
    ],
    given: ["Radius of the bend: 40 m", "Design speed: 36 km/h", "No friction", "g = 9.8 m/s²"],
    ask: "At what angle should the road be banked?",
    answer: bankAngle(10, 40),
    symbol: "θ =",
    unit: "°",
    range: [0, 70],
    hints: [
      "Convert 36 km/h to m/s first. Then draw the forces on the car. Without friction there are only two: its weight, and the normal force from the road, which tilts with the bank.",
      "The vertical part of the normal force balances mg. Its horizontal part provides mv²/r. Divide one by the other: tanθ = v² / (r g).",
    ],
    solution: [
      { text: "Convert the speed.", math: "36 km/h = (36 × 1000) / 3600 = 10 m/s" },
      { text: "Up and down, the forces balance. Towards the centre, the normal force provides the centripetal force.", math: "N cosθ = m g,   N sinθ = m v² / r" },
      { text: "Divide the second equation by the first.", math: "tanθ = v² / (r g) = 10² / (40 × 9.8) = 0.255" },
      { text: "So the bank angle is about 14°.", math: "θ = tan⁻¹(0.255) = 14.3°" },
      { text: "The mass cancels, so a loaded truck needs the same bank as a small car at the same speed." },
    ],
    scene: (deg) => ({ kind: "bank", r: 40, v: 10, thetaDeg: deg, lane: 1.5, watch: 6 }),
    simNote: "Top view of the bend with a side view of the road. The road is treated as perfectly slippery, so any wrong angle shows up as the car sliding across its lane.",
  },
  {
    id: "coaster-loop",
    set: "circular-energy",
    level: "standard",
    title: "A comfortable roller coaster loop",
    emoji: "🎢",
    story: [
      "A new roller coaster at an amusement park near Mumbai has a vertical loop of radius 6.0 m. The cars roll down a smooth slope from rest and enter the loop at its lowest point.",
      "For comfort and safety, the designer wants riders at the very top of the loop, upside down, to press on their seats with a force equal to half their weight.",
    ],
    given: ["Loop radius: 6.0 m", "Smooth track, start from rest", "At the top: seat force = ½ × weight", "g = 9.8 m/s²"],
    ask: "From what height above the bottom of the loop must the cars start?",
    answer: loopHeightForTopNormal(6.0, 0.5),
    symbol: "h =",
    unit: "m",
    range: [1, 60],
    hints: [
      "At the top, upside down, gravity and the seat's push both point down, towards the centre. Together they give the centripetal force: mg + ½ mg = mv²/R.",
      "Use conservation of energy from the start to the top of the loop, which is 2R above the bottom: mgh = mg(2R) + ½mv².",
    ],
    solution: [
      { text: "At the top, gravity and the normal force both point towards the centre.", math: "m g + (½ m g) = (m v²) / R  ⇒  v² = 1.5 g R" },
      { text: "The track is smooth, so mechanical energy is conserved. The top of the loop is 2R above the bottom.", math: "m g h = m g (2R) + (½ m v²)" },
      { text: "Put in v² and simplify.", math: "h = 2R + 0.75 R = 2.75 R = 2.75 × 6.0 = 16.5 m" },
      { text: "Compare with the famous 'only just' case, where the seat force at the top is zero. That needs h = 2.5R = 15 m. The extra 1.5 m gives the riders a firm push into their seats." },
    ],
    scene: (h) => ({ kind: "loop", R: 6.0, m: 1, start: { type: "height", h }, mu: 0, patch: 0, topTarget: 0.5, window: 0.15 }),
    simNote: "The car is treated as a point on a smooth track. The slope is drawn straight; only its height matters for the energy.",
  },
  {
    id: "spring-loop",
    set: "circular-energy",
    level: "olympiad",
    title: "Spring launcher at the science fair",
    emoji: "🌀",
    story: [
      "At a school science fair in Kota, students build a toy coaster. A 0.50 kg cart is pushed back against a spring of spring constant 800 N/m and then let go.",
      "It first crosses a 1.2 m strip of rough cardboard, where μₖ = 0.20. Then it enters a smooth vertical loop of radius 0.40 m. The rest of the track is smooth.",
    ],
    given: ["Cart: 0.50 kg", "Spring constant: 800 N/m", "Rough strip: 1.2 m, μₖ = 0.20", "Loop radius: 0.40 m", "g = 9.8 m/s²"],
    ask: "What is the smallest spring compression that gets the cart all the way round the loop? Give your answer in centimetres.",
    answer: springCompressionForLoop(800, 0.5, 0.2, 1.2, 0.4) * 100,
    symbol: "x =",
    unit: "cm",
    range: [0.5, 40],
    hints: [
      "Only just making it round means the track pushes with zero force at the top, so mg = mv²/R there. That gives v² = gR at the top and v² = 5gR at the bottom.",
      "Do the energy accounts: ½kx² = (work done against friction, μₖ m g L) + ½ m v² at the bottom of the loop.",
    ],
    solution: [
      { text: "Only just making it means N = 0 at the top. Gravity alone provides the centripetal force.", math: "v_top² = g R" },
      { text: "From the bottom to the top the cart rises 2R.", math: "v_bottom² = v_top² + 4 g R = 5 g R = 5 × 9.8 × 0.40 = 19.6 m²/s²" },
      { text: "Friction on the rough strip takes away some energy.", math: "W_f = μₖ m g L = 0.20 × 0.50 × 9.8 × 1.2 = 1.176 J" },
      { text: "The spring must supply both.", math: "½ k x² = W_f + (½ m v_bottom²) = 1.176 + 4.90 = 6.076 J" },
      { text: "Solve for x.", math: "x = √((2 × 6.076) / 800) = 0.1232 m = 12.3 cm" },
      { text: "The rough strip eats about a fifth of the spring's energy. Olympiad problems often hide one such loss." },
    ],
    scene: (cm) => ({ kind: "loop", R: 0.4, m: 0.5, start: { type: "spring", k: 800, x: cm / 100 }, mu: 0.2, patch: 1.2, topTarget: 0, window: 0.15 }),
    simNote: "The cart is a point mass and the spring is light. The rough strip is shaded on the track.",
  },
];
