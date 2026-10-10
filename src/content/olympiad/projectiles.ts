/**
 * Olympiad track, set 1: kinematics and projectiles.
 * Original problems in the style of multi-step textbook sample problems. Answers come from
 * src/lib/sim/oly-projectile.ts, the same code the sim runs.
 */
import { headingForLanding, speedForMovingTarget, speedThroughPoint } from "@/lib/sim/oly-projectile";
import type { OlyProblem } from "./types";

const TRAM_ANGLE = (Math.atan(4 / 3) * 180) / Math.PI;

export const PROJECTILE_PROBLEMS: OlyProblem[] = [
  {
    id: "hooghly-ferry",
    set: "projectiles",
    level: "warm-up",
    title: "Ferry across the Hooghly",
    emoji: "⛴️",
    story: [
      "A ferry carries office-goers from Howrah to the ghat directly opposite on the Kolkata side of the Hooghly.",
      "The river here is 400 m wide and the water flows downstream at 1.2 m/s. The ferry's engine drives it at 2.0 m/s through the water.",
      "If the pilot points the ferry straight across, the current carries it downstream and it misses the ghat.",
    ],
    given: ["River width: 400 m", "Current: 1.2 m/s", "Ferry speed through the water: 2.0 m/s", "The ghat is directly opposite the start"],
    ask: "At what angle upstream from straight across must the pilot point the ferry so it lands exactly at the ghat?",
    answer: headingForLanding(2.0, 1.2, 400, 0),
    symbol: "θ =",
    unit: "°",
    range: [-80, 85],
    hints: [
      "Draw a velocity triangle. The ferry's velocity over the ground is its velocity through the water plus the velocity of the water. For a straight-across trip, the ground velocity has no downstream part.",
      "Only the upstream part of the ferry's own velocity can cancel the current. So 2.0 sinθ = 1.2.",
    ],
    solution: [
      { text: "Turn the ferry an angle θ upstream. Split its velocity through the water into two parts.", math: "upstream part = u sinθ,  across part = u cosθ" },
      { text: "To land directly opposite, the upstream part must cancel the current exactly.", math: "u sinθ = c  ⇒  sinθ = 1.2 / 2.0 = 0.60" },
      { text: "So the pilot points the ferry 36.9° upstream of straight across.", math: "θ = sin⁻¹(0.60) = 36.9°" },
      {
        text: "Check the time. The across speed is only 1.6 m/s, so the trip takes 250 s. In still water it would take 200 s. Fighting the current costs time.",
        math: "t = 400 / (2.0 × cos 36.9°) = 400 / 1.6 = 250 s",
      },
    ],
    scene: (deg) => ({ kind: "river", W: 400, u: 2.0, c: 1.2, headingDeg: deg, ghat: 0, half: 8 }),
    simNote: "Top view. The current is taken as the same everywhere. In a real river the water flows faster in the middle than near the banks.",
  },
  {
    id: "boundary-fielder",
    set: "projectiles",
    level: "standard",
    title: "Over the fielder's fingertips",
    emoji: "🏏",
    story: [
      "Last over, last ball, six runs needed. The batter swings and the ball leaves the bat 1.0 m above the ground at 40° above the horizontal.",
      "A fielder waits on the boundary rope, 68 m away along the ball's line. With a full jump, the fielder can catch anything up to 3.5 m above the ground.",
    ],
    given: ["Launch height: 1.0 m", "Launch angle: 40°", "Fielder distance: 68 m", "Fielder's highest reach: 3.5 m", "g = 9.8 m/s², ignore air drag"],
    ask: "What is the smallest speed off the bat that just carries the ball over the fielder's fingertips?",
    answer: speedThroughPoint(40, 1.0, 68, 3.5),
    symbol: "v =",
    unit: "m/s",
    range: [5, 60],
    hints: [
      "Write the path equation y(x) for a launch from height h₀. It links height and distance without time.",
      "Put x = 68 m and y = 3.5 m into y = h₀ + (x tanθ) − [(g x²) / (2 v² cos²θ)], then solve for v².",
    ],
    solution: [
      { text: "Put the bat at x = 0. Remove time from x = v cosθ t and y = h₀ + v sinθ t − ½ g t² to get the path.", math: "y = h₀ + (x tanθ) − [(g x²) / (2 v² cos²θ)]" },
      { text: "The path must pass through the fingertips at x = 68 m, y = 3.5 m. Rearrange for v².", math: "v² = (g x²) / [2 cos²θ (h₀ − y + x tanθ)]" },
      { text: "Use tan 40° = 0.839 and cos² 40° = 0.587.", math: "h₀ − y + (x tanθ) = 1.0 − 3.5 + (68 × 0.839) = 54.56 m" },
      { text: "Now find v.", math: "v² = (9.8 × 68²) / (2 × 0.587 × 54.56) = 707.7  ⇒  v = 26.6 m/s" },
      { text: "That is about 96 km/h. In a real match air drag slows the ball a lot, so the batter must hit it much harder than this." },
    ],
    scene: (v) => ({ kind: "arc", v, angleDeg: 40, h0: 1.0, barrier: { x: 68, h: 3.5, type: "fielder" }, justMargin: 0.25 }),
    simNote: "Side view, no air drag. The fielder and ball are drawn larger than scale so you can see them.",
  },
  {
    id: "holi-tram",
    set: "projectiles",
    level: "olympiad",
    title: "A Holi balloon onto a moving tram",
    emoji: "🎈",
    story: [
      "On Holi, a slow Kolkata tram pulls an open trolley with a big basket on it. A girl on the pavement wants to throw a colour balloon into the basket.",
      "A 3.0 m garden wall stands 6.0 m in front of her. Her hand is 1.2 m above the ground, the same height as the basket's rim.",
      "At the moment she throws, the basket is 12.0 m ahead of her hand and moving straight away from her at a steady 4.0 m/s. She throws at an angle θ where tanθ = 4/3, so sinθ = 0.8 and cosθ = 0.6.",
    ],
    given: [
      "Throw angle: tanθ = 4/3 (sinθ = 0.8, cosθ = 0.6)",
      "Basket: 12.0 m away at the throw, moving away at 4.0 m/s",
      "Hand and basket rim: 1.2 m above the ground",
      "Wall: 3.0 m high, 6.0 m from her",
      "g = 9.8 m/s², ignore air drag",
    ],
    ask: "With what speed must she throw the balloon so it lands in the basket? Check that it clears the wall.",
    answer: speedForMovingTarget(TRAM_ANGLE, 12.0, 4.0),
    symbol: "v =",
    unit: "m/s",
    range: [3, 40],
    hints: [
      "The balloon comes back to hand height after T = 2v sinθ / g. In that time the basket moves a further 4.0 T away.",
      "Set the balloon's distance v cosθ · T equal to 12.0 + 4.0 T. After putting in T, you get 0.96 v² − 6.4 v − 117.6 = 0.",
    ],
    solution: [
      { text: "Time for the balloon to come back down to the height of her hand.", math: "T = (2 v sinθ) / g = (1.6 v) / 9.8" },
      { text: "When it lands, the balloon and the basket must be at the same place.", math: "v cosθ · T = 12.0 + 4.0 T" },
      { text: "Put in T and multiply through by g.", math: "2 v² sinθ cosθ = (12.0 g) + (2 × 4.0 × v sinθ)  ⇒  0.96 v² − 6.4 v − 117.6 = 0" },
      { text: "Only the positive root makes sense.", math: "v = [6.4 + √(6.4² + (4 × 0.96 × 117.6))] / 1.92 = (6.4 + 22.19) / 1.92 = 14.9 m/s" },
      {
        text: "Check the wall. At x = 6.0 m the balloon is 5.8 m above her hand, so 7.0 m above the ground. It clears the 3.0 m wall easily.",
        math: "y = [6.0 × (4/3)] − [(9.8 × 6.0²) / (2 × 14.9² × 0.6²)] = 8.0 − 2.2 = 5.8 m",
      },
      { text: "The flight takes 2.43 s, and the basket moves on by 9.7 m. Always check every condition the problem gives you." },
    ],
    scene: (v) => ({ kind: "arc", v, angleDeg: TRAM_ANGLE, h0: 1.2, barrier: { x: 6.0, h: 3.0, type: "wall" }, target: { x0: 12.0, u: 4.0, w: 1.0 } }),
    simNote: "Side view, no air drag. The basket is 1.0 m wide; the balloon must come down inside it.",
  },
];
