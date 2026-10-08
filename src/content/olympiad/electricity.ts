/**
 * Olympiad track: electricity.
 * Original problems. Answers come from src/lib/sim/oly-electricity.ts, the same code the sim runs.
 */
import { emfAndInternal, heaterWireLength, seriesResistorForBulb, shuntForLampVoltage } from "@/lib/sim/oly-electricity";
import type { OlyProblem } from "./types";

const NICHROME = 1.1e-6; // Ω m
const BATTERY = emfAndInternal(5.5, 11.0, 1.5, 9.0);

export const ELECTRICITY_PROBLEMS: OlyProblem[] = [
  {
    id: "rangoli-bulb",
    set: "electricity",
    level: "warm-up",
    title: "A tiny bulb for the rangoli",
    emoji: "💡",
    story: [
      "Meera wants a small bulb to light up the centre of her Diwali rangoli. She has a torch bulb marked 2.5 V, 0.75 W and a 9 V battery.",
      "Connected straight to the battery, the bulb would get far too much current and burn out in a flash. So she puts a resistor in series with it.",
    ],
    given: ["Bulb rating: 2.5 V, 0.75 W", "Battery: 9.0 V (treat it as ideal, with no internal resistance)", "The bulb and the resistor are in series"],
    ask: "What resistance must the series resistor have so the bulb runs exactly at its rating?",
    answer: seriesResistorForBulb(9.0, 2.5, 0.75),
    symbol: "R =",
    unit: "Ω",
    range: [0.5, 200],
    hints: [
      "Find the bulb's rated current first. Power is voltage times current, so I = P / V.",
      "In a series circuit the same current flows through both parts, and their voltages add up to 9.0 V. So the resistor must take the leftover voltage.",
    ],
    solution: [
      { text: "The rated current of the bulb comes from P = V I.", math: "I = P / V = 0.75 / 2.5 = 0.30 A" },
      { text: "The bulb takes 2.5 V, so the resistor must take the rest of the battery's 9.0 V.", math: "V_R = 9.0 − 2.5 = 6.5 V" },
      { text: "The same 0.30 A flows through the resistor. Use Ohm's law.", math: "R = V_R / I = 6.5 / 0.30 = 21.7 Ω" },
      {
        text: "Check with resistances. The bulb's resistance is V² / P, and the total must be 9.0 / 0.30 = 30 Ω.",
        math: "R_bulb = 2.5² / 0.75 = 8.33 Ω,  R = 30 − 8.33 = 21.7 Ω",
      },
      { text: "The resistor wastes 6.5 × 0.30 = 1.95 W as heat, more than the bulb uses. That is the price of running a small bulb on a big battery." },
    ],
    scene: (R) => ({ kind: "electricity-bulb", E: 9.0, ratedV: 2.5, ratedP: 0.75, R, window: 0.04 }),
    simNote: "The battery is ideal and the bulb's resistance is taken as fixed. A real filament has less resistance when cold, so it gets a short surge of current at switch-on.",
  },
  {
    id: "chai-kettle-coil",
    set: "electricity",
    level: "standard",
    title: "A kettle coil for the chai stall",
    emoji: "🫖",
    story: [
      "Raju runs a chai stall on platform 4 at Pune station. His electric kettle must boil a fresh batch between two trains, and for that its heating coil must give 1500 W on the 230 V supply.",
      "The old coil has burnt out. Raju buys nichrome wire 0.50 mm thick to wind a new one. The kettle has a built-in 7 A fuse.",
      "If the coil is too short, it draws too much current. If it is too long, the water heats too slowly.",
    ],
    given: [
      "Supply: 230 V",
      "Power wanted: 1500 W",
      "Nichrome wire diameter: 0.50 mm",
      "Resistivity of nichrome: 1.10 × 10⁻⁶ Ω m",
      "Fuse: 7 A",
    ],
    ask: "What length of nichrome wire should Raju use for the coil?",
    answer: heaterWireLength(230, 1500, NICHROME, 0.5e-3),
    symbol: "L =",
    unit: "m",
    range: [0.2, 40],
    hints: [
      "First find the resistance the coil needs. With the voltage fixed, P = V² / R.",
      "Then use R = ρ L / A, where A is the area of the wire's round cross-section, π d² / 4. Remember to turn millimetres into metres.",
    ],
    solution: [
      { text: "The supply voltage is fixed, so use P = V² / R to find the coil's resistance.", math: "R = V² / P = 230² / 1500 = 52900 / 1500 = 35.27 Ω" },
      { text: "Find the cross-section area of the wire. The diameter is 0.50 mm = 5.0 × 10⁻⁴ m.", math: "A = π d² / 4 = 3.1416 × (5.0 × 10⁻⁴)² / 4 = 1.963 × 10⁻⁷ m²" },
      { text: "Now R = ρ L / A gives the length.", math: "L = R A / ρ = 35.27 × 1.963 × 10⁻⁷ / 1.10 × 10⁻⁶ = 6.30 m" },
      { text: "Check the fuse. The current is below 7 A, so the fuse holds.", math: "I = P / V = 1500 / 230 = 6.52 A" },
      { text: "A coil 10% shorter has 10% less resistance and draws 7.25 A, which blows the fuse. Shorter wire means more power, not less." },
    ],
    scene: (L) => ({ kind: "electricity-heater", V: 230, rho: NICHROME, d: 0.5e-3, L, targetP: 1500, window: 0.04, fuseA: 7 }),
    simNote: "The coil's resistance is taken as fixed. Real nichrome gains a few percent of resistance when red hot. Mains is AC; 230 V is its effective (rms) value, so P = V² / R still works.",
  },
  {
    id: "solar-lamp-shunt",
    set: "electricity",
    level: "olympiad",
    title: "Taming a solar street lamp",
    emoji: "🔋",
    story: [
      "A village near Jaisalmer has a solar street lamp. Its battery has an EMF E and an internal resistance r that nobody wrote down.",
      "The technician, Farida, measures them. With a 5.5 Ω resistor across the battery, her voltmeter reads 11.0 V. With a 1.5 Ω resistor instead, it reads 9.0 V.",
      "The lamp is rated 6.0 V, 6.0 W. It is fed from the battery through a 2.0 Ω resistor in series, but on its own it gets too much voltage and glares. Farida fixes this by connecting a resistor X across the lamp, in parallel with it.",
    ],
    given: [
      "Reading 1: 11.0 V across a 5.5 Ω load",
      "Reading 2: 9.0 V across a 1.5 Ω load",
      "Lamp: 6.0 V, 6.0 W (take its resistance as fixed)",
      "Series resistor: 2.0 Ω",
      "X is in parallel with the lamp",
    ],
    ask: "What resistance X makes the lamp get exactly its rated 6.0 V?",
    answer: shuntForLampVoltage(BATTERY.E, BATTERY.r, 2.0, 6.0, 6.0),
    symbol: "X =",
    unit: "Ω",
    range: [0.1, 100],
    hints: [
      "Use each reading to find the current, I = V / R. Then the terminal voltage is V = E − I r. Two readings give two equations for E and r.",
      "The lamp gets 6.0 V, so r and the 2.0 Ω resistor together drop E − 6.0 V. That fixes the total current. The lamp takes 1.0 A of it, and X takes the rest.",
    ],
    solution: [
      { text: "Find the current in each test.", math: "I₁ = 11.0 / 5.5 = 2.0 A,   I₂ = 9.0 / 1.5 = 6.0 A" },
      { text: "The terminal voltage is the EMF minus the drop inside the battery. Subtract the two equations.", math: "E − 2.0 r = 11.0,  E − 6.0 r = 9.0  ⇒  4.0 r = 2.0  ⇒  r = 0.50 Ω,  E = 12.0 V" },
      { text: "With 6.0 V on the lamp, the remaining 6.0 V is dropped across r and the 2.0 Ω resistor in series.", math: "I = (12.0 − 6.0) / (0.50 + 2.0) = 2.4 A" },
      { text: "The lamp's resistance is V² / P = 6.0 Ω, so at 6.0 V it takes 1.0 A. The rest flows through X.", math: "I_X = 2.4 − 1.0 = 1.4 A" },
      { text: "X has the same 6.0 V across it.", math: "X = 6.0 / 1.4 = 4.29 Ω" },
      { text: "Check: 6.0 Ω in parallel with 4.29 Ω is 2.5 Ω, and 2.5 Ω out of the total 5.0 Ω gets half of 12 V. Without X the lamp would get 8.5 V." },
    ],
    scene: (X) => ({ kind: "electricity-shunt", E: BATTERY.E, r: BATTERY.r, Rs: 2.0, RL: 6.0, VL: 6.0, X, window: 0.015 }),
    simNote: "The battery is an ideal 12 V source with a 0.5 Ω resistor inside it. The lamp's resistance is taken as fixed, and the voltmeter draws no current.",
  },
];
