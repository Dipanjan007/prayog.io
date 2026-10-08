/**
 * Class 10 · Science · "Magnetic Effects of Electric Current" (second lab).
 * Covers §12.4 Domestic electric circuits (live, neutral and earth wires; 220 V, 50 Hz AC;
 * fuse and MCB; separate 5 A and 15 A circuits; appliances in parallel; short circuit;
 * overloading; earthing) and, from "Electricity", §11.8 Electric power
 * (P = VI = I²R = V²/R, the kilowatt hour and the electricity bill).
 * Recheck wording against the NCERT chapter PDFs whenever the books are revised.
 */
import type { BudgetRound } from "@/lib/sim/wiring";
import type { LessonDef } from "./types";

export const LESSON_ID = "c10-house-wiring";

/** Challenge: three households, one star each. Bills use the example tariff of ₹7 per unit. */
export const BUDGETS: BudgetRound[] = [
  {
    name: "Summer in Delhi",
    story: "It is 45 °C outside. The family needs the AC for at least 4 hours a day, the fridge 8 hours, the fan 10 hours and the LED bulb 6 hours.",
    budget: 2000,
    needs: { ac: 4, fridge: 8, fan: 10, led: 6 },
  },
  {
    name: "Winter in Shimla",
    story: "Snow on the hills. The family needs hot water from the geyser for 1.5 hours a day, the fridge 6 hours, the LED bulb 8 hours and the TV 3 hours.",
    budget: 1100,
    needs: { geyser: 1.5, fridge: 6, led: 8, tv: 3 },
  },
  {
    name: "Hostel room in Chennai",
    story: "A student on a tight budget. The fan must run 12 hours a day for sleep and the LED bulb 6 hours for study.",
    budget: 300,
    needs: { fan: 12, led: 6 },
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "safe-sparky",
  classNum: 10,
  book: "Science",
  chapter: "Magnetic Effects of Electric Current",
  title: "Wire a safe home",
  intro: {
    objective:
      "Plug appliances into a model house, trip an MCB, blow a fuse with a short circuit, make a faulty iron safe with the earth wire, and read a month's electricity bill.",
    learn: [
      "Live, neutral and earth wires, and the 220 V, 50 Hz supply",
      "Why homes have a 5 A lighting circuit and a 15 A power circuit, with appliances in parallel",
      "How fuses and MCBs stop short circuits and overloading, and why earthing saves lives",
      "Power P = VI, units (kWh) and how an electricity bill is worked out",
    ],
    realLife:
      "The MCB box near your front door, the three-pin plug on your iron, the meter outside and the bill that comes every month.",
    minutes: 25,
  },
  hook: {
    title: "Click! The lights went out",
    text:
      "Diwali night. Mummy switches on the geyser, the iron and the microwave together, and click, half the house goes dark. Someone walks to the MCB box and flips a switch back up. What just happened, and why is that little switch there at all? Wire up a house and find out.",
  },
  predict: {
    question:
      "An iron is faulty: its live wire touches the metal body. It has no earth wire. You touch it. What happens?",
    options: [
      "The fuse blows at once, so you are safe",
      "Current flows through you, and the fuse does not blow",
      "Nothing, because the iron is switched on normally",
    ],
    answer: 1,
  },
  tasks: [
    {
      id: "task:overload",
      title: "Overload the 5 A circuit",
      text: "In House mode, plug appliances into the three sockets on the 5 A lighting circuit until its MCB trips.",
      found:
        "Each appliance takes I = P/V and the currents add, because the sockets are in parallel. More than 5 A on this circuit and the MCB trips. This is overloading. Heavy appliances like the iron, geyser and microwave belong on the 15 A power circuit.",
    },
    {
      id: "task:short",
      title: "Short circuit, then fix it",
      text: "Open Faults and pick Short circuit. Damage the lamp's cord so live touches neutral. Then replace the cord and put in a new fuse so the lamp glows again.",
      found:
        "With live touching neutral, only the tiny resistance of the wires limits the current, so it jumps to hundreds of amperes. The fuse wire melts in a flash and breaks the circuit. A new fuse alone would blow again: first fix the fault.",
    },
    {
      id: "task:earth",
      title: "Make the faulty iron safe",
      text: "In Faults, pick Faulty iron. Try touching it without the earth wire. Then connect the earth wire and see what the fuse does.",
      found:
        "Without earth, the leaked current goes through the person, about 0.2 A. That is far too small to blow a 15 A fuse but enough to be very dangerous. With earth, the metal body is joined to the ground by a low-resistance wire. A huge current flows, the fuse blows and the iron is switched off safely.",
    },
    {
      id: "task:month",
      title: "Run a month",
      text: "Open Bill. Set how many hours a day each appliance runs, then run a 30-day month and read the meter and the bill.",
      found:
        "The meter counts energy in kilowatt hours, called units. Units = power in kW × hours. Your bill is units × tariff. At the example rate of ₹7 a unit, every unit counts.",
    },
    {
      id: "task:top",
      title: "Find the biggest user",
      text: "After running a month, tap the appliance that used the most units.",
      found:
        "Units depend on power and time together. A 2000 W geyser on for just 1 hour a day uses 60 units a month, more than a fridge running 8 hours a day. High-power heating appliances are the big ones on any bill.",
    },
  ],
  discovery: {
    scientist: "Thomas Edison",
    years: "1847–1931",
    fact: "On 4 September 1882, Edison's Pearl Street Station in New York began supplying electricity to homes and offices nearby, one of the first power stations in the world. Edison also built an early electricity meter, so each customer paid for the energy they used.",
    formula: "P = V × I",
    formulaNote: "Power in watts equals the voltage times the current. Energy is power times time, so a bill counts kilowatt hours.",
  },
  ideas: [
    {
      title: "Live, neutral and earth",
      text: "Electricity reaches a house through a main fuse and an electricity meter. The live wire (red insulation) is at 220 V. The neutral wire (black) is at 0 V. In India the supply is AC at 220 V and 50 Hz. The earth wire (green) is joined to a metal plate or pipe buried deep in the ground near the house.",
    },
    {
      title: "Two circuits, all in parallel",
      text: "Homes use a 5 A circuit for bulbs and fans and a 15 A circuit for geysers, irons, ACs and other heavy appliances. Every appliance is connected in parallel across live and neutral, so each gets the full 220 V and has its own switch. Their currents add up in the main wire.",
      formula: "I = P / V    I(total) = I₁ + I₂ + I₃ + …",
    },
    {
      title: "Short circuit, overloading and fuses",
      text: "In a short circuit, live touches neutral and the current becomes huge. In overloading, too many appliances are on one socket or circuit, or the supply voltage rises suddenly. Either way, the fuse wire heats up, melts and breaks the circuit. An MCB does the same job with a switch that trips and can be reset. A fuse is chosen just above the normal current: a 1000 W iron takes 4.5 A, so it needs a 5 A fuse.",
    },
    {
      title: "Earthing saves lives",
      text: "Metal-bodied appliances such as irons, toasters, fridges and geysers are joined to the earth wire. If live touches the body, a big current flows to the earth, the fuse blows and the body stays at 0 V. Without earth, the current would take the path through your body instead.",
    },
    {
      title: "Power and the bill",
      text: "Power is the rate of using electrical energy. The unit of energy on your bill is the kilowatt hour (kWh), also called a unit: 1 kW used for 1 hour.",
      formula: "P = VI = I²R = V²/R    1 kWh = 3.6 × 10⁶ J    Bill = units × tariff",
    },
  ],
  challenge: {
    title: "Beat the budget",
    text: "Three households, each with needs and a monthly budget. Set the hours, run the month and keep the bill within budget at ₹7 a unit. One star per household.",
  },
  quiz: [
    {
      q: "What is the colour of the insulation on the live wire in Indian homes?",
      options: ["Black", "Green", "Red", "Blue"],
      answer: 2,
      why: "Live is red, neutral is black and earth is green.",
    },
    {
      q: "An electric iron is rated 1100 W, 220 V. What current does it take?",
      options: ["0.2 A", "5 A", "11 A", "242 A"],
      answer: 1,
      why: "I = P / V = 1100 ÷ 220 = 5 A.",
    },
    {
      q: "Why are household appliances connected in parallel?",
      options: [
        "So the same current flows through all of them",
        "So each one gets the full 220 V and can be switched on or off on its own",
        "So the total current is as small as possible",
        "So the fuse never blows",
      ],
      answer: 1,
      why: "In parallel every appliance is connected across live and neutral, so each gets 220 V and works independently.",
    },
    {
      q: "A 2000 W geyser runs for 1.5 hours every day. How many units does it use in a 30-day month?",
      options: ["3 units", "60 units", "90 units", "3000 units"],
      answer: 2,
      why: "Units = kW × hours = 2 × 1.5 × 30 = 90 kWh.",
    },
    {
      q: "What does the earth wire do when the live wire touches the metal body of an appliance?",
      options: [
        "It makes the appliance work faster",
        "It gives a low-resistance path to the ground, so a big current flows and the fuse blows",
        "It stops all current from flowing",
        "It raises the voltage of the body to 220 V",
      ],
      answer: 1,
      why: "The earth wire keeps the metal body at 0 V. The large current it carries blows the fuse and cuts the supply.",
    },
  ],
};
