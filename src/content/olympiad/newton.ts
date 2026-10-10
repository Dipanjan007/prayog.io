/**
 * Olympiad track, set 2: Newton's laws with pulleys, slopes and friction.
 * Original problems. Answers come from src/lib/sim/oly-incline.ts, the same code the sim runs.
 */
import { atwoodMassForTime, muToStopAfter, pulleyMassForTime } from "@/lib/sim/oly-incline";
import type { OlyProblem } from "./types";

export const NEWTON_PROBLEMS: OlyProblem[] = [
  {
    id: "site-hoist",
    set: "newton",
    level: "warm-up",
    title: "The building-site counterweight",
    emoji: "🏗️",
    story: [
      "On a building site in Pune, a 5.0 kg bucket of wet cement hangs from a rope that runs over a light, smooth pulley. A counterweight hangs on the other end of the rope.",
      "The bucket is let go from rest 1.5 m above the ground. The foreman wants it to come down gently and reach the ground in exactly 2.0 s.",
    ],
    given: ["Bucket: 5.0 kg", "Drop: 1.5 m from rest", "Time wanted: 2.0 s", "Light rope, smooth pulley, g = 9.8 m/s²"],
    ask: "What mass should the counterweight have?",
    answer: atwoodMassForTime(5.0, 1.5, 2.0),
    symbol: "m =",
    unit: "kg",
    range: [0.1, 20],
    hints: [
      "Use s = ½ a t² to find the acceleration the bucket needs.",
      "For two masses over a pulley, a = [(M − m) × g] / (M + m). Solve this for m.",
    ],
    solution: [
      { text: "Find the acceleration needed.", math: "1.5 = ½ a (2.0)²  ⇒  a = 0.75 m/s²" },
      { text: "Newton's second law for each mass. The bucket goes down and the counterweight goes up, with the same a.", math: "M g − T = M a,   T − m g = m a" },
      { text: "Add the two equations to remove the tension.", math: "(M − m) g = (M + m) a" },
      { text: "Solve for m.", math: "m = [M (g − a)] / (g + a) = (5.0 × 9.05) / 10.55 = 4.29 kg" },
      { text: "The rope tension is 45.3 N, a little less than the bucket's 49 N weight. That small difference is what makes it speed up gently.", math: "T = M (g − a) = 5.0 × 9.05 = 45.3 N" },
    ],
    scene: (m) => ({ kind: "atwood", m1: 5.0, m2: m, d: 1.5, targetT: 2.0 }),
    simNote: "The rope and pulley have no mass and no friction. The stopwatch starts when the bucket is let go.",
  },
  {
    id: "tea-ramp",
    set: "newton",
    level: "standard",
    title: "Tea crates on a ghat-road ramp",
    emoji: "📦",
    story: [
      "At a tea godown on a ghat road near Munnar, crates slide down a wooden ramp to a loading bay. The ramp is 4.0 m long and slopes at 20° to the horizontal. Past its lower end there is a drop.",
      "A worker gives each crate a push so it starts down the ramp at 3.0 m/s. The owner wants every crate to come to rest exactly at the lower end of the ramp.",
    ],
    given: ["Ramp: 4.0 m long, 20° slope", "Starting speed: 3.0 m/s down the ramp", "Static friction μₛ = 0.60", "g = 9.8 m/s²"],
    ask: "What coefficient of kinetic friction μₖ should the ramp surface have?",
    answer: muToStopAfter(3.0, 4.0, 20),
    symbol: "μₖ =",
    unit: "(no unit)",
    range: [0, 2],
    hints: [
      "Draw the forces. Gravity's part along the slope is mg sinθ, down the slope. Kinetic friction is μₖ mg cosθ, up the slope, against the motion.",
      "The crate slows from 3.0 m/s to 0 in 4.0 m. Use v² = u² − 2as to find its deceleration, then set a = g(μₖ cosθ − sinθ).",
    ],
    solution: [
      { text: "Find the deceleration needed.", math: "0 = 3.0² − 2 a × 4.0  ⇒  a = 1.125 m/s²" },
      { text: "Along the slope, friction acts up and gravity's part acts down. Their difference causes the deceleration.", math: "m a = μₖ m g cosθ − m g sinθ" },
      { text: "Solve for μₖ. The mass cancels.", math: "μₖ = [(a/g) + sinθ] / cosθ = (0.1148 + 0.3420) / 0.9397 = 0.486" },
      { text: "Check that the crate stays put once it stops. It will not slip if μₛ ≥ tanθ = 0.364. The ramp has μₛ = 0.60, so it stays." },
    ],
    scene: (mu) => ({ kind: "slide", thetaDeg: 20, L: 4.0, v0: 3.0, muK: mu, muS: 0.6 }),
    simNote: "The crate is treated as a point that slides without tipping. Friction does not depend on speed.",
  },
  {
    id: "dock-crate",
    set: "newton",
    level: "olympiad",
    title: "Hauling a crate up a dock ramp",
    emoji: "⚓",
    story: [
      "At Haldia dock, an 8.0 kg crate sits at the bottom of a ramp that slopes at 30°. A rope tied to it runs up the ramp, parallel to the slope, over a light smooth pulley at the top, and down to a hanging counterweight.",
      "Between the crate and the ramp, μₛ = 0.30 and μₖ = 0.25. When the counterweight is let go, the crate must reach the pulley, 2.4 m up the ramp, in exactly 2.0 s.",
    ],
    given: ["Crate: 8.0 kg on a 30° ramp", "μₛ = 0.30, μₖ = 0.25", "Distance to the pulley: 2.4 m", "Time wanted: 2.0 s from rest", "g = 9.8 m/s²"],
    ask: "What counterweight mass is needed?",
    answer: pulleyMassForTime(8.0, 30, 0.25, 2.4, 2.0),
    symbol: "M =",
    unit: "kg",
    range: [0.1, 40],
    hints: [
      "First find the acceleration from s = ½ a t². Then draw two free-body diagrams. The crate moves up, so kinetic friction on it points down the slope.",
      "Crate: T − mg sinθ − μₖ mg cosθ = ma. Counterweight: Mg − T = Ma. Add them to remove T.",
    ],
    solution: [
      { text: "Find the acceleration needed.", math: "2.4 = ½ a (2.0)²  ⇒  a = 1.2 m/s²" },
      { text: "Crate, taking up the slope as positive. Friction is kinetic and points down the slope.", math: "T − m g (sinθ + μₖ cosθ) = m a" },
      { text: "Counterweight, taking down as positive.", math: "M g − T = M a" },
      { text: "Add and solve for M.", math: "M = {m [a + g (sinθ + μₖ cosθ)]} / (g − a) = [8.0 × (1.2 + (9.8 × 0.7165))] / 8.6 = 7.65 kg" },
      {
        text: "Check that it starts at all. Static friction can hold back up to 20.4 N. The pull Mg = 75 N beats mg sinθ + 20.4 N = 59.6 N, so the crate moves. The tension while it moves is 65.8 N.",
        math: "μₛ m g cosθ = 0.30 × 8.0 × 9.8 × 0.866 = 20.4 N,   T = M (g − a) = 65.8 N",
      },
    ],
    scene: (M) => ({ kind: "pulley", m1: 8.0, m2: M, thetaDeg: 30, muK: 0.25, muS: 0.3, d: 2.4, targetT: 2.0 }),
    simNote: "The crate slides without tipping. The rope and pulley are light and smooth. The stopwatch starts when the counterweight is let go.",
  },
];
