/**
 * Olympiad track: heat and temperature.
 * Original problems. Answers come from src/lib/sim/oly-heat.ts, the same code the sim runs.
 */
import { C_GLASS, C_STEEL, C_WATER, addedMassForTarget, hotWaterForMix, iceForLeftover, type HeatBody } from "@/lib/sim/oly-heat";
import type { OlyProblem } from "./types";

const chaiBodies: HeatBody[] = [
  { label: "tumbler", m: 0.15, c: C_STEEL, T: 30, role: "vessel" },
  { label: "chai", m: 0.18, c: C_WATER, T: 95, role: "liquid" },
];

const sharbatBodies: HeatBody[] = [
  { label: "glass", m: 0.15, c: C_GLASS, T: 32, role: "vessel" },
  { label: "sharbat", m: 0.3, c: C_WATER, T: 32, role: "liquid" },
];

export const HEAT_PROBLEMS: OlyProblem[] = [
  {
    id: "winter-bath",
    set: "heat",
    level: "warm-up",
    title: "A bucket bath on a Shimla morning",
    emoji: "🛁",
    story: [
      "On a cold morning in Shimla, Ishaan fills a bucket with 15 kg of tap water at 22 °C. The geyser gives water at 65 °C.",
      "He likes his bath at exactly 38 °C. He wants to know how much geyser water to add so he does not have to keep testing it with his hand.",
    ],
    given: ["Cold water: 15 kg at 22 °C", "Geyser water: 65 °C", "Target bath temperature: 38 °C", "Ignore heat taken by the bucket and lost to the air"],
    ask: "How many kilograms of hot water should Ishaan add?",
    answer: hotWaterForMix(15, 22, 65, 38),
    symbol: "m =",
    unit: "kg",
    range: [0.5, 60],
    hints: [
      "When hot and cold water mix with no losses, the heat given out by the hot water equals the heat taken in by the cold water. Use Q = m c ΔT for each.",
      "The cold water warms from 22 °C to 38 °C and the hot water cools from 65 °C to 38 °C. Both are water, so c cancels.",
    ],
    solution: [
      { text: "Heat taken in by the cold water as it warms up to 38 °C.", math: "Q_in = 15 × c × (38 − 22) = 240 c" },
      { text: "Heat given out by m kg of hot water as it cools down to 38 °C.", math: "Q_out = m × c × (65 − 38) = 27 m c" },
      { text: "No heat is lost, so the two are equal. The c cancels.", math: "27 m = 240  ⇒  m = 240 / 27 = 8.89 kg" },
      { text: "That is about 8.9 litres of geyser water. Notice the hot water needs less mass than the cold, because it is further from 38 °C (27 °C away versus 16 °C)." },
    ],
    scene: (m) => ({
      kind: "heat-mix",
      vessel: "bucket",
      bodies: [
        { label: "tap water", m: 15, c: C_WATER, T: 22, role: "liquid" },
        { label: "geyser water", m, c: C_WATER, T: 65, role: "pour" },
      ],
      goal: { type: "temp", T: 38, band: 0.5 },
    }),
    simNote: "The bucket and the air take no heat, and the water mixes perfectly. The target band is 38 ± 0.5 °C.",
  },
  {
    id: "chai-tumbler",
    set: "heat",
    level: "standard",
    title: "Cooling chai in a steel tumbler",
    emoji: "☕",
    story: [
      "At a chai stall outside Chennai Central, the chaiwala pours 180 g of chai at 95 °C into a 150 g steel tumbler that is at the room temperature of 30 °C.",
      "A passenger is in a hurry and wants to drink it at 65 °C. The chaiwala adds cold milk straight from the fridge at 8 °C.",
    ],
    given: [
      "Chai: 180 g at 95 °C, c = 4186 J/kg K",
      "Steel tumbler: 150 g at 30 °C, c = 500 J/kg K",
      "Milk: 8 °C, c = 4186 J/kg K",
      "Final temperature wanted: 65 °C",
      "No heat lost to the air",
    ],
    ask: "How many grams of cold milk should he add?",
    answer: addedMassForTarget(chaiBodies, C_WATER, 8, 65) * 1000,
    symbol: "m =",
    unit: "g",
    range: [1, 1000],
    hints: [
      "Only the final state matters. Everything ends at 65 °C: the chai cools down, while the tumbler and the milk warm up.",
      "Write heat given out by the chai = heat taken in by the tumbler + heat taken in by the milk. Work in kg and J.",
    ],
    solution: [
      { text: "The chai cools from 95 °C to 65 °C and gives out heat.", math: "Q_chai = 0.18 × 4186 × (95 − 65) = 22 604 J" },
      { text: "The tumbler warms from 30 °C to 65 °C and takes in some of it.", math: "Q_tumbler = 0.15 × 500 × (65 − 30) = 2625 J" },
      { text: "The milk must take in the rest as it warms from 8 °C to 65 °C.", math: "m × 4186 × (65 − 8) = 22 604 − 2625 = 19 979 J" },
      { text: "Solve for the mass of milk.", math: "m = 19 979 / 238 602 = 0.0837 kg = 83.7 g" },
      { text: "The tumbler alone takes about 12% of the heat. Forget it and you would add too much milk and get the chai too cold." },
    ],
    scene: (g) => ({
      kind: "heat-mix",
      vessel: "tumbler",
      bodies: [...chaiBodies, { label: "milk", m: g / 1000, c: C_WATER, T: 8, role: "pour" }],
      goal: { type: "temp", T: 65, band: 0.5 },
    }),
    simNote: "The chai and milk are treated as water, and the tumbler, chai and milk all reach one temperature. The target band is 65 ± 0.5 °C.",
  },
  {
    id: "sharbat-ice",
    set: "heat",
    level: "olympiad",
    title: "Just enough ice in the rose sharbat",
    emoji: "🧊",
    story: [
      "On a hot May afternoon in Lucknow, a sharbat seller has 300 g of rose sharbat in a 150 g glass, both at 32 °C. He takes ice cubes out of a freezer at −8 °C.",
      "He has learnt that the drink is coldest when some ice is still floating in it at the end. But too much ice waters the drink down. So he wants exactly 25 g of ice left floating once everything settles.",
    ],
    given: [
      "Sharbat: 300 g at 32 °C, c = 4186 J/kg K",
      "Glass: 150 g at 32 °C, c = 840 J/kg K",
      "Ice: −8 °C, c = 2100 J/kg K",
      "Latent heat of fusion of ice: 334 kJ/kg",
      "Ice left at the end: 25 g. No heat lost to the air",
    ],
    ask: "How many grams of ice should he put in?",
    answer: iceForLeftover(sharbatBodies, -8, 0.025) * 1000,
    symbol: "m =",
    unit: "g",
    range: [10, 800],
    hints: [
      "If some ice is left, the final temperature must be 0 °C. So the sharbat and glass cool all the way to 0 °C, and you know exactly how much heat they give out.",
      "All the ice warms from −8 °C to 0 °C, but only (m − 25 g) of it melts. Set heat given out = m c_ice × 8 + (m − 0.025) × L.",
    ],
    solution: [
      { text: "Ice is still floating at the end, so everything settles at 0 °C. Heat given out by the sharbat and the glass cooling to 0 °C:", math: "Q = (0.30 × 4186 + 0.15 × 840) × 32 = (1255.8 + 126) × 32 = 44 218 J" },
      { text: "All m kg of ice warms from −8 °C to 0 °C.", math: "Q₁ = m × 2100 × 8 = 16 800 m" },
      { text: "Only the ice that melts takes latent heat. That is m − 0.025 kg.", math: "Q₂ = (m − 0.025) × 334 000 = 334 000 m − 8350" },
      { text: "Heat given out equals heat taken in.", math: "44 218 = 16 800 m + 334 000 m − 8350  ⇒  350 800 m = 52 568" },
      { text: "Solve for m.", math: "m = 52 568 / 350 800 = 0.1499 kg ≈ 150 g" },
      { text: "Check: with 150 g of ice, 125 g melts and 25 g floats. Most of the cooling comes from melting, not from warming the ice: latent heat is the big term." },
    ],
    scene: (g) => ({
      kind: "heat-mix",
      vessel: "glass",
      bodies: sharbatBodies,
      ice: { m: g / 1000, T: -8 },
      goal: { type: "ice", left: 0.025, band: 0.006 },
    }),
    simNote: "The sharbat is treated as water and the glass, drink and ice reach one temperature. The sim counts the ice left over; the target is 25 ± 6 g.",
  },
];
