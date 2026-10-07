/**
 * Class 8 · Curiosity (NCERT 2025) · "Electricity: Magnetic and Heating Effects".
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { LessonDef } from "./types";

export const LESSON_ID = "c8-magnetic-heating";

/** Challenge: scrap yard orders. Each truck needs exactly this many iron pieces, in one trip. One star each. */
export const ORDERS = [2, 5, 7];

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "magnet-maker",
  classNum: 8,
  book: "Curiosity",
  chapter: "Electricity: Magnetic and Heating Effects",
  title: "Lift, glow and stay safe",
  intro: {
    objective:
      "Build an electromagnet crane and a heating wire to see two big effects of electric current: magnetism and heat.",
    learn: [
      "A current in a coil makes a magnet that switches on and off",
      "More turns, more current and an iron core make a stronger electromagnet",
      "Current heats a wire, and some wires get hot enough to glow",
      "How a fuse or MCB protects a home from too much current",
    ],
    realLife:
      "Scrap-yard cranes, electric bells, room heaters, electric irons and the fuse box at home all use these effects.",
    minutes: 25,
  },
  hook: {
    title: "The crane that switches its grip",
    text:
      "At a kabadiwala's yard or the ship-breaking yard at Alang in Gujarat, a crane lowers a big round disc onto a heap of scrap. Iron leaps up and sticks to it. Over the truck the driver flips a switch and the whole load crashes down. That disc is an electromagnet. The same electricity that makes it a magnet also warms your room heater and presses clothes in your iron. Let us build both.",
  },
  predict: {
    question: "The crane's electromagnet swings over a heap of iron scrap, aluminium cans and plastic bottles. What does it pick up?",
    options: ["Everything in the heap", "Only the metal things: iron and aluminium", "Only the iron things"],
    answer: 2,
  },
  tasks: [
    {
      id: "task:drop",
      title: "Grab and drop",
      text: "Over the scrap pile, turn the switch ON. Then swing to the truck and turn it OFF.",
      found:
        "With current in the coil, the iron pieces jump up. The aluminium cans and the plastic bottle stay behind, because a magnet does not attract them. When the switch goes off, the current stops and the load falls at once. An electromagnet is a magnet only while current flows.",
    },
    {
      id: "task:core",
      title: "Take out the core",
      text: "Pick Paper clips, choose No core and switch on. How many clips does the empty coil hold?",
      found:
        "A coil with no core is a weak magnet. It holds only a few paper clips and no iron scrap at all. Putting a soft iron core inside makes it many times stronger. That is why NCERT winds the wire on an iron nail.",
    },
    {
      id: "task:strong",
      title: "Make it stronger",
      text: "With the iron core in, lift 5 or more pieces of iron scrap at once.",
      found:
        "More turns of wire and more cells (more current) both make the electromagnet stronger. Its strength grows with turns × current. Real cranes use thousands of turns and a large current to lift whole car bodies.",
    },
    {
      id: "task:glow",
      title: "Make it glow",
      text: "Open Heating effect. Use the nichrome wire and add cells until the wire glows red.",
      found:
        "Current heats any wire it flows through. Nichrome resists the current a lot, so it gets very hot and glows above about 525 °C. A copper wire of the same size stays only warm. That is why heaters, irons and toasters use nichrome, and connecting wires are made of copper.",
    },
    {
      id: "task:fuse",
      title: "Melt the fuse",
      text: "Make the current bigger than the fuse rating. Try copper wire with a few cells, or a 1 A fuse.",
      found:
        "The fuse wire melts and breaks the circuit, so the current stops. Copper has so little resistance that it is almost a short circuit, and a big current rushes through. A fuse or an MCB stops such a big current before wires overheat and start a fire.",
    },
  ],
  discovery: {
    scientist: "James Prescott Joule",
    years: "1818–1889",
    fact: "Joule, a brewer's son from Manchester, measured heat so carefully that, the story goes, he took a thermometer on his honeymoon to check whether the water at the bottom of a waterfall was warmer than at the top.",
    formula: "H = I² × R × t",
    formulaNote: "Joule's law of heating: the heat made in a wire grows with the square of the current, so doubling the current gives four times the heat. That is why a fuse wire melts.",
  },
  ideas: [
    {
      title: "Magnetic effect of current",
      text: "A wire carrying a current makes a compass needle near it turn. So a current produces a magnetic effect. A coil of insulated wire wound on an iron core becomes an electromagnet while a current flows through it, and stops being a magnet when the current is switched off.",
    },
    {
      title: "Making an electromagnet stronger",
      text: "Use more turns of wire, a larger current (more cells), and a soft iron core. An electromagnet attracts only magnetic materials such as iron, steel, nickel and cobalt. Aluminium, plastic and paper are not attracted. Electromagnets are used in cranes, electric bells, loudspeakers and motors.",
      formula: "Strength ∝ number of turns × current (with an iron core)",
    },
    {
      title: "Heating effect of current",
      text: "When a current flows through a wire, the wire gets hot. A bigger current gives more heat. Nichrome gets much hotter than copper for the same current, so it is used in heaters, electric irons, kettles, geysers and toasters. A filament bulb glows because its thin wire gets white hot, but it wastes most energy as heat. An LED gives the same light using much less electricity.",
    },
    {
      title: "Fuses and MCBs keep us safe",
      text: "A fuse is a short, thin wire that melts when the current is more than its rating. This breaks the circuit. Too much current flows in a short circuit or when too many appliances run on one line. An MCB (miniature circuit breaker) does the same job, but it switches off by itself and can be switched back on. Never replace a fuse wire with a thick copper wire. Buy appliances with the ISI mark.",
    },
  ],
  challenge: {
    title: "Scrap yard orders",
    text: "Three trucks come in. Each needs an exact number of iron pieces, in one trip. Set the turns, cells and core, lift, swing over the truck and switch off. One star per truck.",
  },
  quiz: [
    {
      q: "Which of these will an electromagnet pick up?",
      options: ["An aluminium can", "A plastic spoon", "An iron nail", "A copper coin"],
      answer: 2,
      why: "Only magnetic materials like iron, steel, nickel and cobalt are attracted. Aluminium, copper and plastic are not.",
    },
    {
      q: "The crane is holding scrap over a truck. The operator switches off the current. What happens?",
      options: ["The scrap stays stuck", "The scrap falls into the truck", "The scrap gets hot", "The magnet becomes stronger"],
      answer: 1,
      why: "An electromagnet is a magnet only while current flows through its coil. No current, no magnet, so the load falls.",
    },
    {
      q: "Riya wants her electromagnet to lift more paper clips. Which change will NOT help?",
      options: ["Wind more turns of wire", "Use more cells", "Put an iron nail inside the coil", "Use a plastic straw as the core"],
      answer: 3,
      why: "More turns, more current and a soft iron core all make it stronger. A plastic core does nothing to help.",
    },
    {
      q: "Why is the element of a room heater made of nichrome and not copper?",
      options: [
        "Nichrome is cheaper than copper",
        "Nichrome gets very hot when current flows, but copper stays fairly cool",
        "Copper is magnetic",
        "Nichrome does not let any current through",
      ],
      answer: 1,
      why: "Nichrome resists the current much more, so more heat is produced in it. Copper lets current pass easily and heats very little.",
    },
    {
      q: "A fuse marked 5 A is in a circuit. The current rises to 8 A. What happens?",
      options: ["Nothing happens", "The fuse wire melts and the circuit breaks", "The current becomes 5 A by itself", "The bulb gets brighter forever"],
      answer: 1,
      why: "A fuse melts when the current is more than its rating. The broken fuse stops the current and protects the wiring.",
    },
    {
      q: "How is an MCB better than an ordinary fuse?",
      options: [
        "It never switches off",
        "It makes the current bigger",
        "It switches off by itself and can be switched back on after the fault is fixed",
        "It works only in daytime",
      ],
      answer: 2,
      why: "An MCB trips when the current is too large. Once the fault is fixed, you just push it back on. A fuse wire must be replaced.",
    },
    {
      q: "A filament bulb and an LED give the same light. Why is the LED better?",
      options: [
        "The LED wastes much less electricity as heat",
        "The LED is hotter",
        "The filament bulb uses no electricity",
        "The LED works without a circuit",
      ],
      answer: 0,
      why: "A filament glows because it is white hot, so most of the electricity becomes heat. An LED turns much more of it into light.",
    },
  ],
};
