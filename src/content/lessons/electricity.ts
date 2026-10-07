/**
 * Class 10 · Science · "Electricity".
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { LessonDef } from "./types";

export const LESSON_ID = "c10-electricity";

/** Challenge: hit a target current with two given resistors. One star per round. */
export const TARGETS: { r1: number; r2: number; amps: number; hint: string }[] = [
  { r1: 6, r2: 3, amps: 1.5, hint: "You need more current than either resistor gives on its own with a few cells." },
  { r1: 10, r2: 5, amps: 0.4, hint: "This one needs a small current. Which way of joining gives the bigger resistance?" },
  { r1: 20, r2: 5, amps: 0.75, hint: "Work out the total resistance first, then the voltage you need." },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "ohm-master",
  classNum: 10,
  book: "Science",
  chapter: "Electricity",
  title: "Push, flow and heat",
  intro: {
    objective:
      "Run a virtual circuit lab with meters to discover Ohm's law, resistance, series and parallel circuits, and electric power.",
    learn: [
      "Ohm's law: V = IR, and how to read a V–I graph",
      "How a wire's length, thickness and material set its resistance",
      "How resistors combine in series and in parallel",
      "How current heats a wire, and how power and energy are calculated",
    ],
    realLife:
      "Your home's wiring is in parallel, heater coils are made of nichrome, and the electricity bill counts kilowatt-hours.",
    minutes: 30,
  },
  hook: {
    title: "Why does only the coil glow?",
    text:
      "On a cold winter morning the room heater's coil glows bright orange. The same current flows through the cable to the plug, yet the cable stays cool. Your phone charger, the kitchen mixer and the geyser all follow the same few rules. Build circuits on the bench and find them.",
  },
  predict: {
    question: "You double the battery voltage across the same nichrome wire. What happens to the current?",
    options: ["It halves", "It stays the same", "It doubles", "It becomes four times"],
    answer: 2,
  },
  tasks: [
    {
      id: "task:ohm",
      title: "Ohm's law",
      text: "On the wire bench, keep the same wire and change the number of cells. Collect at least 4 points on the V–I graph.",
      found:
        "The points lie on a straight line through the origin. V/I stays the same, so V is proportional to I. This is Ohm's law, V = IR, and the constant V/I is the resistance R of the wire.",
    },
    {
      id: "task:length",
      title: "Longer or thinner",
      text: "Keep the material the same. Change only the length of the wire, then change only its thickness (area). Watch R.",
      found:
        "Double the length and R doubles. Halve the area of cross-section and R doubles too. So R is proportional to L and inversely proportional to A.",
    },
    {
      id: "task:material",
      title: "Why copper wires?",
      text: "Make a copper wire and a nichrome wire of exactly the same length and area. Compare their resistance.",
      found:
        "Nichrome has about 60 times the resistance of copper of the same size. The material sets the resistivity ρ, so R = ρL/A. Copper has a tiny ρ, so we use it for connecting wires.",
    },
    {
      id: "task:combo",
      title: "Series or parallel",
      text: "Open Series and parallel. Keep R₁ and R₂ the same and try both ways of joining them. Watch the total R and the current.",
      found:
        "In series the resistances add, so the total is bigger than either one and the current is smaller. In parallel the total is smaller than the smallest one, so more current flows. Each branch also gets the full battery voltage.",
    },
    {
      id: "task:heat",
      title: "Double the current",
      text: "Open Heating. Keep the wire and the time the same, and double the current by doubling the number of cells. Compare the heat H.",
      found:
        "Twice the current gives four times the heat, because H = I²Rt. The current is squared. That is why the high-resistance heater coil glows while the low-resistance copper cable stays cool.",
    },
  ],
  discovery: {
    scientist: "Georg Simon Ohm",
    years: "1789–1854",
    fact: "When Ohm published his law in 1827, many German scientists dismissed it and he left his school teaching job. Fourteen years later Britain's Royal Society gave him its top prize, the Copley Medal.",
    formula: "V = I × R",
    formulaNote: "Ohm's law: the voltage across a wire equals the current through it times its resistance.",
  },
  ideas: [
    {
      title: "Ohm's law",
      text: "At a fixed temperature, the potential difference V across a metal wire is proportional to the current I through it. The V–I graph is a straight line through the origin. The ammeter goes in series and the voltmeter goes in parallel across the part.",
      formula: "V = IR    1 Ω = 1 V / 1 A",
    },
    {
      title: "Resistivity",
      text: "The resistance of a wire is proportional to its length and inversely proportional to its area of cross-section. Resistivity ρ depends only on the material and its temperature. Its SI unit is Ω m. Alloys such as nichrome have a high ρ, so they are used in heaters, irons and toasters.",
      formula: "R = ρ L / A",
    },
    {
      title: "Resistors in series and parallel",
      text: "In series the same current flows through every resistor and the voltages add up. In parallel every resistor gets the same voltage and the currents add up. Our homes are wired in parallel, so each appliance gets the full voltage and can be switched on or off on its own.",
      formula: "Series: Rs = R₁ + R₂ + R₃    Parallel: 1/Rp = 1/R₁ + 1/R₂ + 1/R₃",
    },
    {
      title: "Heating effect and power",
      text: "A current through a resistor turns electrical energy into heat. Power is the rate of using energy, measured in watts (1 W = 1 V × 1 A). Electricity bills count energy in kilowatt hours, also called units.",
      formula: "P = VI = I²R = V²/R    H = I²Rt    1 kWh = 3.6 × 10⁶ J",
    },
  ],
  challenge: {
    title: "Hit the target current",
    text: "Each round gives you two resistors and a target current. Join them in series or parallel and pick the number of cells to make the ammeter read exactly the target. One star per round.",
  },
  quiz: [
    {
      q: "A 4 Ω resistor is connected to a 12 V battery. What current flows?",
      options: ["48 A", "3 A", "0.33 A", "16 A"],
      answer: 1,
      why: "I = V/R = 12 V ÷ 4 Ω = 3 A.",
    },
    {
      q: "A wire of resistance 10 Ω is cut into two equal halves. What is the resistance of each half?",
      options: ["20 Ω", "10 Ω", "5 Ω", "2.5 Ω"],
      answer: 2,
      why: "R = ρL/A. Halving the length with the same material and area halves R, so each half is 5 Ω.",
    },
    {
      q: "Why are heater coils made of nichrome and not copper?",
      options: [
        "Nichrome is cheaper than copper",
        "Nichrome has a high resistivity and does not burn easily when red hot",
        "Nichrome has a lower resistivity than copper",
        "Copper does not conduct electricity",
      ],
      answer: 1,
      why: "A high ρ gives a big resistance, so a lot of heat is produced. The alloy also does not oxidise quickly at high temperature.",
    },
    {
      q: "Two 6 Ω resistors are connected in parallel. What is the total resistance?",
      options: ["12 Ω", "6 Ω", "3 Ω", "36 Ω"],
      answer: 2,
      why: "1/Rp = 1/6 + 1/6 = 2/6, so Rp = 3 Ω. In parallel the total is smaller than the smallest resistor.",
    },
    {
      q: "Why are the lights and fans in a house connected in parallel?",
      options: [
        "So that the same current flows through all of them",
        "So that each one gets the full voltage and can be switched on its own",
        "To make the total resistance as large as possible",
        "Because parallel wiring uses less wire",
      ],
      answer: 1,
      why: "In parallel each appliance has the full mains voltage across it, and one can be switched off without the others going off.",
    },
    {
      q: "A 1000 W electric iron is used for 30 minutes. How much energy does it use?",
      options: ["0.5 kWh", "30 kWh", "500 kWh", "2 kWh"],
      answer: 0,
      why: "Energy = P × t = 1 kW × 0.5 h = 0.5 kWh. That is 0.5 × 3.6 × 10⁶ J = 1.8 × 10⁶ J.",
    },
    {
      q: "The current through a resistor is doubled. In the same time, the heat produced becomes…",
      options: ["the same", "two times", "four times", "half"],
      answer: 2,
      why: "H = I²Rt. Doubling I multiplies I² by 4, so the heat becomes four times.",
    },
  ],
};
