/**
 * Class 7 · Curiosity · "Electricity: Circuits and their Components".
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { Part } from "@/lib/sim/circuit";
import type { LessonDef } from "./types";

export const LESSON_ID = "c7-circuits";

/** Repair challenge: a torch with three faults. Moves allowed for 3, 2 and 1 stars. */
export const BROKEN_TORCH: Part[] = [
  { kind: "cell" },
  { kind: "bulb", fused: true },
  { kind: "switch", on: false },
  { kind: "material", id: "eraser" },
];
export function repairStars(moves: number) {
  return moves <= 3 ? 3 : moves <= 5 ? 2 : 1;
}

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "bright-spark",
  classNum: 7,
  book: "Curiosity",
  chapter: "Electricity: Circuits and their Components",
  title: "Build a torch that works",
  intro: {
    objective:
      "Build a working torch circuit and find out which materials let electricity flow.",
    learn: [
      "What makes a circuit open or closed, and why a switch works",
      "Which everyday materials are conductors and which are insulators",
      "How cells, bulbs and switches are drawn as circuit symbols",
      "How to stay safe around electricity",
    ],
    realLife:
      "Torches, doorbells, the switchboard in your room and every charger at home are circuits like the one you will build.",
    minutes: 20,
  },
  hook: {
    title: "The dead torch",
    text:
      "The power has gone out and the torch won't switch on. Is it the cell? The bulb? The switch? Electricians find faults by understanding circuits. Build your own and become the fixer.",
  },
  predict: {
    question: "A torch has one cell and one bulb. You add a second cell, joined the right way. What happens to the bulb?",
    options: ["It glows brighter", "It glows exactly the same", "It goes out"],
    answer: 0,
  },
  tasks: [
    {
      id: "task:light",
      title: "Light it up",
      text: "Tap each empty slot and add parts (a cell, a bulb and wires) until the bulb glows.",
      found:
        "The bulb glows only when there is a complete, unbroken path from one terminal of the cell, through the bulb, back to the other terminal. That path is a closed circuit.",
    },
    {
      id: "task:switch",
      title: "Use a switch",
      text: "Swap a wire for a switch. Turn it off, then on again, and watch the bulb.",
      found: "A switch opens the circuit (off) or closes it (on). When it is off there is a gap, so no current flows and the bulb goes dark.",
    },
    {
      id: "task:test",
      title: "Conductor or insulator?",
      text: "Keep a cell and a bulb in the loop. Put a material in one slot to test it. Try at least 6 materials.",
      found:
        "Materials that let current pass, like metals and pencil lead (graphite), are conductors. Materials that don't, like rubber, plastic, wood and glass, are insulators.",
    },
  ],
  discovery: {
    scientist: "Alessandro Volta",
    years: "1745–1827",
    fact: "In 1800 Volta built the first battery by stacking discs of zinc and copper with cloth soaked in salt water between them. The unit of voltage, the volt, is named after him.",
    formula: "V total = V₁ + V₂",
    formulaNote: "Cells joined one after another (in series) add their voltages, which is why a torch uses two cells.",
  },
  symbols: [
    { sym: "V total", meaning: "total voltage when cells are joined end to end, in volts (V)" },
    { sym: "V₁, V₂", meaning: "voltage of each cell" },
  ],
  ideas: [
    {
      title: "Closed and open circuits",
      text: "Current flows only around a complete loop. A gap anywhere (a missing wire, a switch turned off, a broken filament) makes an open circuit.",
    },
    {
      title: "Conductors and insulators",
      text: "Conductors let electric current pass through them; insulators do not. That's why wires are copper inside and plastic outside.",
    },
    {
      title: "Cells and batteries",
      text: "Joining cells, the positive terminal of one to the negative of the next, makes a battery. More cells push more current, so the bulb glows brighter, until too much breaks its thin filament and it fuses.",
    },
    {
      title: "Circuit symbols",
      text: "Scientists draw circuits with symbols: a long and short line for a cell, a circle with a cross for a bulb, a gap with a lever for a switch. Turn on Circuit symbols to see them.",
    },
    {
      title: "Stay safe",
      text: "Cells are safe to experiment with. The electricity from wall sockets is dangerous: never experiment with it.",
    },
  ],
  challenge: {
    title: "Fix the torch",
    text: "Load the broken torch. It has three faults. Find and fix them all so the bulb glows. Fix it in 3 moves for 3 stars.",
  },
  quiz: [
    {
      q: "A bulb glows only when…",
      options: ["The circuit is closed", "The switch is off", "There is a gap in the wire", "The cell is removed"],
      answer: 0,
      why: "Current needs a complete path, a closed circuit.",
    },
    {
      q: "Which of these is a conductor?",
      options: ["Eraser", "Plastic scale", "Pencil lead (graphite)", "Wooden spoon"],
      answer: 2,
      why: "Graphite conducts electricity, which is why the bulb glowed with pencil lead.",
    },
    {
      q: "When a switch is in the OFF position, the circuit is…",
      options: ["Closed", "Open", "Short-circuited", "Doubled"],
      answer: 1,
      why: "OFF leaves a gap, so the circuit is open.",
    },
    {
      q: "Why doesn't a fused bulb glow?",
      options: ["Its glass is dirty", "Its filament is broken", "It needs a new switch", "It is too cold"],
      answer: 1,
      why: "A broken filament leaves a gap, so no current flows through the bulb.",
    },
    {
      q: "To make a battery of two cells, the positive terminal of one cell is joined to…",
      options: ["The positive terminal of the other", "The negative terminal of the other", "The bulb only", "Nothing"],
      answer: 1,
      why: "Positive to negative, so the cells push current the same way.",
    },
    {
      q: "Why are an electrician's screwdriver handles covered in plastic or rubber?",
      options: ["To look nice", "They are insulators, so current can't pass to the hand", "To make it heavier", "They are conductors"],
      answer: 1,
      why: "Insulators protect the user from electric shock.",
    },
    {
      q: "Is it safe to experiment with electricity from a wall socket at home?",
      options: ["Yes, if you are careful", "Yes, with a plastic spoon", "No, it is dangerous", "Only with two cells"],
      answer: 2,
      why: "Mains electricity can be fatal. Only experiment with cells.",
    },
  ],
};
