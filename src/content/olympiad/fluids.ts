/**
 * Olympiad track: fluids and buoyancy.
 * Original problems. Answers come from src/lib/sim/oly-fluids.ts, the same code the sim runs.
 */
import { RHO_SEA, RHO_WATER, cargoToLine, cubeDensity, liftForce, uTubeDensity } from "@/lib/sim/oly-fluids";
import type { OlyProblem } from "./types";

const LIFT = { mass: 1440, dBig: 0.3, dSmall: 0.025 };
const BARGE = { L: 20, B: 5, emptyDraft: 0.3, line: 1.2 };
const CUBE = { a: 5, seenInLow: 1.8, uWater: 10.4, uOil: 13 };

export const FLUIDS_PROBLEMS: OlyProblem[] = [
  {
    id: "service-lift",
    set: "fluids",
    level: "warm-up",
    title: "Holding up a car at the service station",
    emoji: "🚗",
    story: [
      "At a car service station in Pune, a hatchback of mass 1180 kg sits on a hydraulic lift. The lift's platform has a mass of 260 kg and rests on a big piston of diameter 30 cm.",
      "Oil connects the big piston to a small piston of diameter 2.5 cm. The mechanic has raised the car to 1.8 m and now wants the small piston to push with just the right force so the car stays still while she works underneath.",
    ],
    given: ["Car: 1180 kg, platform: 260 kg", "Big piston diameter: 30 cm", "Small piston diameter: 2.5 cm", "Both pistons at the same level, g = 9.8 m/s²"],
    ask: "What force must the small piston push with to hold the car and platform still?",
    answer: liftForce(LIFT.mass, LIFT.dBig, LIFT.dSmall),
    symbol: "F =",
    unit: "N",
    range: [1, 2000],
    hints: [
      "Pascal's law: the oil passes on the same pressure everywhere. So force divided by area is the same at both pistons.",
      "The area of a circle goes as the square of its diameter. If one diameter is 12 times the other, its area is 12² = 144 times bigger.",
    ],
    solution: [
      { text: "The big piston must hold up the car and the platform together.", math: "W = (1180 + 260) × 9.8 = 1440 × 9.8 = 14 112 N" },
      { text: "Pascal's law: the pressure is the same at both pistons.", math: "F / A_small = W / A_big  ⇒  F = W × (A_small / A_big)" },
      { text: "Areas go as diameter squared, so the ratio is (2.5 / 30)².", math: "A_small / A_big = (2.5 / 30)² = (1 / 12)² = 1 / 144" },
      { text: "So the push needed is small.", math: "F = 14 112 / 144 = 98.0 N" },
      { text: "That is about the weight of a 10 kg bag of rice holding up a whole car. The catch: to raise the car by 1 cm, the small piston must move 144 cm." },
    ],
    scene: (F) => ({ kind: "fluids-lift", ...LIFT, force: F, height: 1.8, headroom: 0.4, tol: 0.03, watch: 4 }),
    simNote: "The oil is incompressible and the pistons are frictionless and at the same level. The sim holds your force steady and shows whether the car stays at 1.8 m, sinks or shoots up.",
  },
  {
    id: "paradip-barge",
    set: "fluids",
    level: "standard",
    title: "Loading a barge to its line",
    emoji: "🚢",
    story: [
      "A steel barge is built at a yard on the Hooghly in Kolkata. Its hull is a box 20 m long and 5.0 m wide. Floating empty in the river (fresh water), it sinks 30 cm into the water.",
      "A load line is painted on its side 1.20 m above the bottom of the hull. The barge is towed to Paradip port on the sea and loaded with iron ore there until the sea water reaches the line exactly.",
    ],
    given: ["Hull: box, 20 m × 5.0 m", "Empty draft in river water: 0.30 m", "Load line: 1.20 m above the bottom", "River water: 1000 kg/m³, sea water: 1025 kg/m³"],
    ask: "How many tonnes of iron ore can be loaded at Paradip? (1 tonne = 1000 kg)",
    answer: cargoToLine(BARGE.L, BARGE.B, BARGE.emptyDraft, RHO_WATER, BARGE.line, RHO_SEA),
    symbol: "m =",
    unit: "t",
    range: [1, 200],
    hints: [
      "A floating object displaces its own weight of water. Use the river data to find the mass of the empty barge.",
      "At the line, the barge displaces 20 × 5.0 × 1.20 m³ of sea water. The mass of that water is the barge plus the cargo. Remember sea water is denser.",
    ],
    solution: [
      { text: "Empty in the river, the barge displaces its own mass of fresh water.", math: "m_barge = 1000 × (20 × 5.0 × 0.30) = 1000 × 30 = 30 000 kg" },
      { text: "Loaded to the line at sea, it displaces this volume of sea water.", math: "V = 20 × 5.0 × 1.20 = 120 m³" },
      { text: "That water's mass equals barge plus cargo.", math: "m_barge + m_cargo = 1025 × 120 = 123 000 kg" },
      { text: "Subtract the barge.", math: "m_cargo = 123 000 − 30 000 = 93 000 kg = 93.0 t" },
      { text: "Using river water by mistake gives 90 t. The denser sea water lifts 3 tonnes more, so the same barge carries more at sea." },
    ],
    scene: (t) => ({ kind: "fluids-barge", ...BARGE, rhoEmpty: RHO_WATER, rho: RHO_SEA, hull: 1.6, cargo: t, tol: 0.02 }),
    simNote: "The hull is a perfect box with straight sides, and the cargo is spread evenly so the barge stays level. Heights are stretched three times in the picture so the line is easy to see.",
  },
  {
    id: "kerosene-cube",
    set: "fluids",
    level: "olympiad",
    title: "A cube caught between two liquids",
    emoji: "🧊",
    story: [
      "In a school lab in Bhubaneswar, students pour water into a U-tube and then pour kerosene into one arm. When everything is still, the kerosene column stands 13.0 cm above the boundary between the liquids, while the water in the other arm stands 10.4 cm above that same boundary.",
      "Next they fill a tall jar with water and gently pour a deep layer of the same kerosene on top. They drop in a plastic cube of side 5.0 cm. It sinks through the kerosene and comes to rest with its bottom 1.8 cm below the boundary, in the water, and its top still covered by kerosene.",
    ],
    given: ["U-tube: kerosene 13.0 cm, water 10.4 cm above the boundary", "Cube side: 5.0 cm", "Cube in water: 1.8 cm, rest in kerosene", "Water: 1000 kg/m³"],
    ask: "What is the density of the plastic?",
    answer: cubeDensity(CUBE.a, CUBE.seenInLow, RHO_WATER, uTubeDensity(CUBE.uWater, CUBE.uOil)),
    symbol: "ρ =",
    unit: "kg/m³",
    range: [100, 3000],
    hints: [
      "In the U-tube, take the level of the boundary. The pressure there is the same in both arms, so ρ_k g (13.0 cm) = ρ_w g (10.4 cm). That gives the kerosene's density.",
      "The cube is pushed up by both liquids. The buoyant force is the weight of water it displaces plus the weight of kerosene it displaces. Set that equal to its own weight.",
    ],
    solution: [
      { text: "At the level of the boundary, the pressure is the same in both arms of the U-tube.", math: "ρ_k × 13.0 = 1000 × 10.4  ⇒  ρ_k = 10 400 / 13.0 = 800 kg/m³" },
      { text: "Let the cube's face area be A. It has 1.8 cm in water and 5.0 − 1.8 = 3.2 cm in kerosene.", math: "Buoyant force = (1000 × 1.8 + 800 × 3.2) × A × g  (heights in cm, a common factor)" },
      { text: "The cube floats, so its weight equals the buoyant force.", math: "ρ × 5.0 × A × g = (1800 + 2560) × A × g" },
      { text: "Cancel A and g and solve.", math: "ρ = 4360 / 5.0 = 872 kg/m³" },
      { text: "Check: 872 lies between 800 and 1000, so the cube must sink through kerosene but float on water. Anything outside that range could never rest at the boundary." },
    ],
    scene: (rho) => ({ kind: "fluids-cube", ...CUBE, rho, rhoLow: RHO_WATER, low: 12, high: 10, tol: 0.25 }),
    simNote: "The jar is wide, so the levels hardly change when the cube goes in. The cube is dropped from the top and settles with some made-up damping; only its resting place is physics.",
  },
];
