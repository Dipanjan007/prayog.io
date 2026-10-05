/**
 * Class 10 · Science · "Magnetic Effects of Electric Current".
 * Follows the rationalised syllabus: the electric motor, electromagnetic induction
 * and the generator are left out.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { RodRound } from "@/components/sim/MagnetLab";
import type { LessonDef } from "./types";

export const LESSON_ID = "c10-magnetic";

/** Challenge: predict the rod's swing. One star per round. A wrong guess brings a new setup for the same round. */
export const ROD_ROUNDS: RodRound[] = [
  { fieldDown: true, currentOut: true },
  { fieldDown: false, currentOut: true },
  { fieldDown: false, currentOut: false },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "field-finder",
  classNum: 10,
  book: "Science",
  chapter: "Magnetic Effects of Electric Current",
  title: "Currents make magnets",
  hook: {
    title: "The hidden magnet in every wire",
    text:
      "The school bell, the big speakers at a Ganpati pandal and the cranes that lift scrap iron at a railway yard all use one trick. A wire carrying current acts like a magnet. In 1820, Hans Christian Oersted saw a compass needle jump when current flowed in a nearby wire. Grab a set of compasses and see the invisible field for yourself.",
  },
  predict: {
    question: "A long straight wire carries current straight up through a table. Small compasses sit on the table around it. How do the needles line up?",
    options: ["They all point at the wire", "They make a circle around the wire", "They all keep pointing north"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:wire",
      title: "Circles round a wire",
      text: "In Wire mode, look at the compass needles around the wire. Then reverse the current and watch them again.",
      found:
        "The field lines are circles centred on the wire. When the current reverses, every needle turns round, so the field reverses too. The right-hand thumb rule gives the direction: point your right thumb along the current and your curled fingers show the field.",
    },
    {
      id: "task:strength",
      title: "Stronger field",
      text: "Turn the current up to 4 A or more. Tap near the wire and then far from it to read the field at the marker.",
      found:
        "More current gives more field lines, packed closer together. Near the wire the field is strong, and it gets weaker as you move away. Twice as far away, the field is half as strong.",
    },
    {
      id: "task:loop",
      title: "Bend it into a loop",
      text: "Switch to Loop. This is a circular loop seen edge-on, so it cuts the page in two places.",
      found:
        "Near each side of the loop the lines are circles. At the centre, both sides push the field the same way, so the lines become nearly straight and the field is stronger. More turns of wire would make it stronger still.",
    },
    {
      id: "task:solenoid",
      title: "Make a bar magnet",
      text: "Switch to Solenoid. Find its north pole, then reverse the current and find it again.",
      found:
        "Inside a solenoid the field lines are straight and parallel, so the field is uniform. Outside, the pattern looks just like a bar magnet. Reversing the current swaps the north and south ends. A soft iron core inside makes it an electromagnet.",
    },
    {
      id: "task:force",
      title: "The rod that jumps",
      text: "Switch to Force. Turn on the current and watch the rod. Then reverse the current or flip the magnet so the rod moves the other way.",
      found:
        "A magnet pushes on a current-carrying conductor. The push is at right angles to both the current and the field. Reversing either the current or the field reverses the push. Reverse both and the rod moves the same way as before.",
    },
  ],
  ideas: [
    {
      title: "Magnetic field and field lines",
      text: "A magnetic field has both size and direction. Field lines go from the north pole to the south pole outside a magnet and from south to north inside it, so they are closed loops. Where lines are closer, the field is stronger. Two field lines never cross, because a compass cannot point two ways at once.",
    },
    {
      title: "Field due to a current",
      text: "Around a straight wire the field lines are concentric circles. Use the right-hand thumb rule to find their direction. The field grows with the current and falls as you move away from the wire. A circular loop gives straight lines at its centre. A solenoid gives a uniform field inside, like a bar magnet.",
      formula: "Straight wire: B ∝ I / r",
    },
    {
      title: "Force on a conductor",
      text: "A current-carrying conductor in a magnetic field feels a force. It is largest when the current is at right angles to the field. Fleming's left-hand rule gives its direction: stretch the thumb, forefinger and middle finger of your left hand at right angles to each other.",
      formula: "Forefinger: Field   Middle finger: Current   Thumb: Motion (force)",
    },
    {
      title: "Domestic electric circuits",
      text: "Homes in India get 220 V at 50 Hz. The live wire has red insulation, the neutral wire black and the earth wire green. A fuse melts and breaks the circuit when too much current flows, during a short circuit or overloading. Earthing gives leaked current an easy path to the ground, so a metal appliance does not give you a severe shock.",
    },
  ],
  challenge: {
    title: "Which way will it swing?",
    text: "Three setups, one at a time. Read the magnet's poles and the current's direction, then use Fleming's left-hand rule to predict the rod's swing before the switch closes. One star per round.",
  },
  quiz: [
    {
      q: "What do the magnetic field lines inside a long solenoid look like?",
      options: ["Concentric circles", "Straight, parallel lines", "Lines that meet at the centre", "There is no field inside"],
      answer: 1,
      why: "Inside a solenoid the field is uniform, so the lines are straight, parallel and evenly spaced.",
    },
    {
      q: "Current flows straight up a vertical wire. Looking down from above, the field lines around it go…",
      options: ["Clockwise", "Anticlockwise", "Straight up", "Straight down"],
      answer: 1,
      why: "Point your right thumb up, towards your eye. Your fingers curl anticlockwise as you look down.",
    },
    {
      q: "Why do two magnetic field lines never cross?",
      options: [
        "They repel each other",
        "A compass at the crossing would have to point two ways at once",
        "They are always parallel",
        "Field lines are drawn only near magnets",
      ],
      answer: 1,
      why: "The field at a point has one direction only. A crossing would mean two directions at the same point.",
    },
    {
      q: "The field 2 cm from a long straight wire is 40 µT. What is it 4 cm from the wire, with the same current?",
      options: ["80 µT", "40 µT", "20 µT", "10 µT"],
      answer: 2,
      why: "The field falls as 1/r. Twice as far away gives half the field, so 20 µT.",
    },
    {
      q: "A wire between two magnet poles carries current into the page. The field points from left to right. Which way is the force on the wire?",
      options: ["Up the page", "Down the page", "To the left", "To the right"],
      answer: 1,
      why: "Left hand: forefinger to the right, middle finger into the page. Your thumb points down the page.",
    },
    {
      q: "A fuse in a house circuit protects it by…",
      options: [
        "Raising the voltage",
        "Melting and breaking the circuit when the current gets too large",
        "Storing extra charge",
        "Connecting the appliance to the earth",
      ],
      answer: 1,
      why: "During a short circuit or overloading the current rises. The fuse wire heats up, melts and stops the current.",
    },
    {
      q: "Why is the metal body of an electric iron connected to the earth wire?",
      options: [
        "To make it heat faster",
        "So any leaked current flows to the ground and the user does not get a severe shock",
        "To save electricity",
        "To stop the fuse from melting",
      ],
      answer: 1,
      why: "The earth wire is a low-resistance path to the ground. Leaked current takes that path and keeps the body near zero potential.",
    },
  ],
};
