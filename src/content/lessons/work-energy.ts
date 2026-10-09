/**
 * Class 9 · Exploration · "Work, Energy, and Simple Machines".
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { LessonDef } from "./types";

export const LESSON_ID = "c9-work-energy";

/** Challenge track: hill heights (m) are fixed and friction is on. The student picks the start height. */
export const TEST_TRACK = { h0: 9, h1: 7, h2: 9 };
/** Speed over the last hilltop (m/s) needed for 1, 2 and 3 stars. */
export const CREST_STARS = [Infinity, 4, 2];

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "energy-engineer",
  classNum: 9,
  book: "Exploration",
  chapter: "Work, Energy, and Simple Machines",
  title: "Ride the energy, lift with a lever",
  intro: {
    objective:
      "Design a roller coaster and balance a lever to see how energy changes form and how simple machines help us.",
    learn: [
      "Work is done when a force moves something: W = F × s",
      "Kinetic energy and potential energy change into each other",
      "Total energy is conserved, and friction turns some into heat",
      "How levers use the principle of moments to make lifting easier",
    ],
    realLife:
      "Roller coasters, hydroelectric dams, see-saws, scissors and the bottle opener in your kitchen all use these ideas.",
    minutes: 30,
  },
  hook: {
    title: "The coaster with no engine",
    text:
      "At a theme park, a roller coaster is pulled up the first hill by a chain just once. After that it has no engine, yet it races over hill after hill. Where does its speed come from? And how does one person lift a heavy stone with just an iron rod? Build a coaster and a lever to find out.",
  },
  predict: {
    question: "A cart starts at rest at the top of a 10 m slope. There is no friction. Can it roll over a 12 m hill further along?",
    options: ["Yes, if it picks up enough speed going down", "No, it can never get higher than 10 m", "Only if the cart is heavy enough"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:convert",
      title: "Energy changes form",
      text: "Keep friction off and press Release. Watch the potential energy and kinetic energy bars as the cart dives into the first valley.",
      found:
        "Going down, potential energy (mgh) turned into kinetic energy (½mv²). Going up a hill, it turned back. The Total bar did not change at all. Energy only changed its form.",
    },
    {
      id: "task:climb",
      title: "Too tall to climb",
      text: "With friction still off, drag a hill so it is taller than the start. Release the cart and see what happens.",
      found:
        "The cart slowed down, stopped just below the start height, and rolled back. It can never rise above where it started, because it never has more energy than the mgh it began with. That dashed line is its limit.",
    },
    {
      id: "task:friction",
      title: "Where did it go?",
      text: "Switch friction on and release the cart. Watch the Heat bar.",
      found:
        "Friction did work against the cart, so some energy turned into heat in the wheels and rails. The cart's kinetic plus potential energy fell, but kinetic + potential + heat stayed the same. Energy is never lost. It only changes form.",
    },
    {
      id: "task:balance",
      title: "Lift a stone",
      text: "Switch to Lever and keep Class 1. Balance the 600 N stone with an effort smaller than 600 N. Slide the fulcrum and change the effort.",
      found:
        "The lever balanced when load × load arm = effort × effort arm. This is the principle of moments. With the fulcrum close to the load, a small effort on a long arm balances a big load. That is how a crowbar works.",
    },
    {
      id: "task:classes",
      title: "Lever families",
      text: "Now balance a Class 2 lever and a Class 3 lever. Compare the effort with the load each time.",
      found:
        "In Class 2 (wheelbarrow) the load is between the fulcrum and the effort, so the effort is always smaller than the load. In Class 3 (tongs, your forearm) the effort is in the middle, so the effort is always bigger, but the load end moves further and faster.",
    },
  ],
  discovery: {
    scientist: "Archimedes",
    years: "about 287–212 BCE",
    fact: "The Greek inventor worked out the law of the lever and is said to have boasted, \"Give me a place to stand and I will move the Earth.\"",
    formula: "Load × load arm = Effort × effort arm",
    formulaNote: "The law of the lever: a long effort arm lets a small push lift a heavy load.",
  },
  symbols: [
    { sym: "W", meaning: "work done, in joules (J)" },
    { sym: "F", meaning: "force, in newtons (N)" },
    { sym: "s", meaning: "distance moved in the direction of the force, in m" },
    { sym: "P", meaning: "power, in watts (W)" },
    { sym: "t", meaning: "time, in s" },
    { sym: "KE", meaning: "kinetic energy, the energy of motion, in J" },
    { sym: "PE", meaning: "potential energy, the energy of height, in J" },
    { sym: "m", meaning: "mass, in kg" },
    { sym: "v", meaning: "speed, in m/s" },
    { sym: "g", meaning: "pull of gravity, 9.8 m/s²" },
    { sym: "h, h′", meaning: "height at the top, and lower down, in m" },
    { sym: "MA", meaning: "mechanical advantage: how many times a machine multiplies your effort" },
  ],
  ideas: [
    {
      title: "Work and power",
      text: "Work is done when a force moves an object in the direction of the force. No movement means no work, however tired you feel. Power tells how fast work is done. 1 watt is 1 joule of work every second.",
      formula: "W = F × s  (joule, J);   P = W ÷ t  (watt, W)",
    },
    {
      title: "Kinetic and potential energy",
      text: "Energy is the ability to do work. A moving object has kinetic energy. An object raised above the ground has gravitational potential energy. Doubling the speed makes the kinetic energy four times bigger.",
      formula: "KE = ½ m v²;   PE = m g h  (g = 9.8 m/s²)",
    },
    {
      title: "Conservation of energy",
      text: "Energy can neither be created nor destroyed. It only changes from one form to another. Without friction, KE + PE stays constant. With friction, some of it becomes heat, but the total including heat is still the same.",
      formula: "m × g × h (top) = (½ × m × v²) + (m × g × h′) (lower down), with no friction",
    },
    {
      title: "Levers and the principle of moments",
      text: "A lever is a rigid bar that turns about a fixed point called the fulcrum. It balances when the moments on both sides are equal. Mechanical advantage (MA) tells how many times the machine multiplies your effort. Class 1: fulcrum in the middle (see-saw, crowbar). Class 2: load in the middle (wheelbarrow, nutcracker). Class 3: effort in the middle (tongs, forearm).",
      formula: "Load × load arm = Effort × effort arm;   MA = Load ÷ Effort",
    },
  ],
  challenge: {
    title: "Just clear the last hill",
    text:
      "Test run: hill 1 is 7 m, the last hill is 9 m, and friction is on. Choose a start height so the cart just gets over the last hill. One star for getting over. Two stars if it crosses the top slower than 4 m/s. Three stars if slower than 2 m/s. A taller start wastes the chain motor's work.",
  },
  quiz: [
    {
      q: "A force of 20 N pushes a box 3 m along the floor in the direction of the force. How much work is done?",
      options: ["6.7 J", "23 J", "60 J", "0 J"],
      answer: 2,
      why: "W = F × s = 20 N × 3 m = 60 J.",
    },
    {
      q: "Riya holds a heavy bag of rice still for 5 minutes. How much work does she do on the bag?",
      options: ["A lot, because she gets tired", "Zero, because the bag does not move", "It depends on the bag's mass", "Exactly mg joules"],
      answer: 1,
      why: "Work needs a displacement. The bag does not move, so W = F × 0 = 0, even though her muscles get tired.",
    },
    {
      q: "A 50 kg girl runs at 4 m/s. What is her kinetic energy?",
      options: ["100 J", "200 J", "400 J", "800 J"],
      answer: 2,
      why: "KE = ½mv² = ½ × 50 × 4 × 4 = 400 J.",
    },
    {
      q: "If a car's speed doubles, its kinetic energy becomes…",
      options: ["the same", "two times", "four times", "half"],
      answer: 2,
      why: "KE depends on v². Doubling v makes v² four times bigger.",
    },
    {
      q: "A coaster cart starts from rest 20 m up and rolls down with no friction. About how fast is it at the bottom? (g = 9.8 m/s²)",
      options: ["About 10 m/s", "About 20 m/s", "About 196 m/s", "It depends on the cart's mass"],
      answer: 1,
      why: "mgh = ½mv², so v = √(2gh) = √(2 × 9.8 × 20) ≈ 19.8 m/s. The mass cancels out.",
    },
    {
      q: "A motor lifts a lift and does 6000 J of work in 30 s. What is its power?",
      options: ["200 W", "180 kW", "5970 W", "0.005 W"],
      answer: 0,
      why: "P = W ÷ t = 6000 J ÷ 30 s = 200 W.",
    },
    {
      q: "On a see-saw, a 300 N child sits 2 m from the fulcrum. Where must a 400 N child sit on the other side to balance?",
      options: ["1 m", "1.5 m", "2 m", "2.7 m"],
      answer: 1,
      why: "Principle of moments: 300 × 2 = 400 × d, so d = 600 ÷ 400 = 1.5 m.",
    },
  ],
};
