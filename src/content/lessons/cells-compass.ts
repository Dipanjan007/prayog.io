/**
 * Class 8 · Curiosity (NCERT 2025) · "Electricity: Magnetic and Heating Effects", second lab.
 * Covers Activities 4.1, 4.3 and 4.4 (a compass needle turns near a current-carrying wire or
 * coil, reversing the cell reverses the turn, finding the N and S ends of an electromagnet with
 * a compass) and Section 4.3 with Activity 4.6 (how cells work: Volta's pile, a lemon or potato
 * cell with zinc and copper, cells in series, the dry cell, rechargeable and disposable cells,
 * e-waste). It also adds LEDs (current flows only one way, longer leg to +), since the Class 7
 * circuit lab uses only bulbs. The companion lab magnetic-heating.ts covers the electromagnet
 * crane, heating and fuses.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { LessonDef } from "./types";
import type { Gadget } from "@/lib/sim/cells";

export const LESSON_ID = "c8-cells-compass";

/** Challenge: power each gadget with the fewest fruits. One star each. */
export const GADGET_ORDERS: { id: Gadget; name: string; need: string }[] = [
  { id: "led", name: "a red LED", need: "about 1.8 V" },
  { id: "clock", name: "a small wall clock", need: "1.5 V" },
  { id: "calc", name: "a calculator", need: "3 V" },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "lemon-volta",
  classNum: 8,
  book: "Curiosity",
  chapter: "Electricity: Magnetic and Heating Effects",
  title: "Lemon batteries and nervous compasses",
  intro: {
    objective:
      "Make a compass needle jump with a current, find the north pole of a coil, and build a battery from lemons strong enough to light an LED.",
    learn: [
      "A current in a wire or coil turns a nearby compass needle",
      "Reversing the cell reverses the needle's swing and swaps the coil's poles",
      "Two different metals in fruit juice make a cell, and cells in series add up",
      "An LED lets current through only one way, and used cells are e-waste",
    ],
    realLife:
      "TV remotes, wall clocks, torches, phones and the science-fair lemon clock all run on cells, and every electric motor and doorbell uses the magnetic effect of current.",
    minutes: 25,
  },
  hook: {
    title: "A clock that runs on lemons",
    text:
      "At a school science fair, Aarav pushes a zinc-coated nail and a copper coin into a lemon, then joins two lemons with wires. A small wall clock starts ticking. No shop battery at all! Next to him, Meera holds a wire from a torch cell over a compass, and the needle jumps the moment she closes the switch. Fruit makes electricity, and electricity makes a magnet. Let's try both.",
  },
  predict: {
    question: "You push two strips of the same metal, copper and copper, into a lemon. What does the voltmeter read?",
    options: ["About 0.9 V, the lemon juice makes it", "0 V", "About 1.8 V, double because there are two strips"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:swing",
      title: "Swing and reverse",
      text: "In Compass mode, switch on the wire and make a needle swing by 15° or more. Then press Reverse the cell and make it swing the other way.",
      found:
        "With no current every needle points north. Switch on, and the compass under the wire swings: the current makes a magnetic effect. Reverse the cell, and the current flows the other way, so the needle swings the other way. Compasses far from the wire hardly move, because the effect gets weaker with distance.",
    },
    {
      id: "task:north",
      title: "Find the coil's north",
      text: "Choose Coil and switch on. Use the compasses near each end to find the coil's north pole, then label it.",
      found:
        "A coil carrying current acts like a bar magnet with a north end and a south end. The red north tip of a needle points away from the coil's north end and towards its south end. Reverse the cell and the poles swap. This is how NCERT finds the poles of an electromagnet.",
    },
    {
      id: "task:zero",
      title: "Same metals, no volts",
      text: "Open Fruit cell. Use two copper strips in a lemon and read the voltmeter.",
      found:
        "Zero! A cell needs two different metals. Zinc gives up electrons more easily than copper, and that difference pushes the current. Two copper strips are equal, so there is no push. Zinc and copper give about 0.9 V, iron and copper about 0.5 V.",
    },
    {
      id: "task:led",
      title: "Light an LED with lemons",
      text: "Use zinc and copper strips in lemons, connect the LED, and add lemons in series until it glows.",
      found:
        "One lemon gives only about 0.9 V, but a red LED needs about 1.8 V. Lemons joined copper to zinc are in series, so their voltages add: three lemons give about 2.8 V and the LED glows. The current is less than 1 mA, so it glows only faintly.",
    },
    {
      id: "task:flip",
      title: "Flip the LED",
      text: "Keep the lemons that lit the LED, then press Flip the LED.",
      found:
        "The LED goes dark even though the voltmeter shows plenty of volts. An LED lets current pass only one way: its longer leg must go to the + side (copper here). A filament bulb glows either way round, but an LED does not.",
    },
  ],
  discovery: {
    scientist: "Luigi Galvani",
    years: "1737–1798",
    fact: "In the 1780s, in Bologna, Galvani saw a dead frog's leg twitch when it was touched by two different metals at once. He thought the frog made 'animal electricity'. Volta disagreed and showed the two metals were the source, which led him to build the first battery in 1800.",
    formula: "V = n × V₁",
    formulaNote: "n identical cells joined in series give n times the voltage of one cell: three lemon cells of about 0.9 V give about 2.8 V.",
  },
  symbols: [
    { sym: "V", meaning: "total voltage of the battery, in volts (V)" },
    { sym: "n", meaning: "number of cells joined in series" },
    { sym: "V₁", meaning: "voltage of one cell, such as 1.5 V" },
  ],
  ideas: [
    {
      title: "Current makes a magnet",
      text: "A wire carrying a current turns a compass needle near it, so a current has a magnetic effect. Reverse the current and the needle turns the other way. A coil of wire carrying a current behaves like a bar magnet, with a north end and a south end. Find them with a compass: the needle's north tip points away from the north end. Reversing the cell swaps the poles.",
    },
    {
      title: "How a cell works",
      text: "A cell has two different metals (electrodes) in a liquid or paste that conducts (an electrolyte). A chemical reaction pushes current from one metal round the circuit to the other. Volta stacked discs of zinc and copper with salty cloth between them to build the first battery, the voltaic pile. Lemon, orange, tomato and potato juice work as the electrolyte too. The voltage depends on the two metals, not on the size of the fruit.",
    },
    {
      title: "Cells in series and LEDs",
      text: "Joining cells + to −, one after another, is called series. The voltages add up. That is why a TV remote holds two 1.5 V cells to get 3 V. A fruit cell can push only a tiny current, so it can run an LED or a clock, but not a bulb or a fan. An LED (light emitting diode) lets current through only one way: the longer leg goes to +. It also needs a certain voltage, about 1.8 V for a red LED, before it glows.",
      formula: "V = n × V₁ (n identical cells in series)",
    },
    {
      title: "Dry cells, rechargeables and e-waste",
      text: "A dry cell has a zinc can as its − terminal and a carbon rod with a metal cap as its + terminal, packed in a moist paste. It gives about 1.5 V. Ordinary cells are thrown away when used up. Rechargeable cells, like the lithium-ion batteries in phones, can be charged again many times. Used cells contain harmful chemicals, so never burn them or throw them in the dustbin. Give them to an e-waste collection point.",
    },
  ],
  challenge: {
    title: "Fruit power station",
    text: "Power three gadgets with fruit cells: an LED, a small clock that needs 1.5 V and a calculator that needs 3 V. Each starts on one potato with iron and copper strips. Change the fruit, the metals and the number of fruits, and use the fewest fruits you can. One star per gadget.",
  },
  quiz: [
    {
      q: "A compass needle swings east when a current flows in a wire above it. You reverse the cell. What happens?",
      options: ["It swings east even more", "It swings west", "It stops pointing anywhere", "Nothing changes"],
      answer: 1,
      why: "Reversing the cell reverses the current, and that reverses the magnetic effect, so the needle swings the other way.",
    },
    {
      q: "A compass placed at one end of a coil carrying current has its north tip pointing away from the coil. What is that end?",
      options: ["The north pole of the coil", "The south pole of the coil", "It has no pole", "You cannot tell with a compass"],
      answer: 0,
      why: "Like poles repel, so the needle's north tip is pushed away from the coil's north end.",
    },
    {
      q: "Which pair of strips in a lemon gives no voltage at all?",
      options: ["Zinc and copper", "Iron and copper", "Copper and copper", "Zinc and iron"],
      answer: 2,
      why: "A cell needs two different metals. Two strips of the same metal push equally, so the voltage is 0 V.",
    },
    {
      q: "One lemon cell gives about 0.9 V. About how much do four lemon cells give in series?",
      options: ["0.9 V", "1.8 V", "3.6 V", "9 V"],
      answer: 2,
      why: "In series, V = n × V₁ = 4 × 0.9 V = 3.6 V.",
    },
    {
      q: "Riya's LED stays dark with three lemons in series, even though the voltmeter shows 2.8 V. What should she try first?",
      options: ["Add a hundred more lemons", "Turn the LED round so the longer leg goes to +", "Use copper strips only", "Put the lemons in the fridge"],
      answer: 1,
      why: "An LED lets current through only one way. With its longer leg on the + side, 2.8 V is enough to light it.",
    },
    {
      q: "What is the right way to get rid of used cells?",
      options: ["Burn them", "Throw them in the dustbin", "Bury them in the garden", "Give them to an e-waste collection point"],
      answer: 3,
      why: "Cells contain harmful chemicals. Burning or dumping them can poison soil and water, so they go to e-waste collection.",
    },
  ],
};
