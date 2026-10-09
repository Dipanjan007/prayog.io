/**
 * Class 9 · Exploration · "Work, Energy, and Simple Machines" (second lab).
 * Covers §7.1 work (positive, negative and zero work), §7.5 power (P = W ÷ t),
 * §7.6.1 pulleys (fixed, movable, block and tackle; MA = load ÷ effort) and
 * §7.6.2 the inclined plane (Activity 7.3: pull a load up planks of different slopes with a spring balance).
 * The first lab for this chapter (work-energy.ts) covers the energy coaster and levers.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { LessonDef } from "./types";

export const LESSON_ID = "c9-simple-machines";

/** Height of the tempo / truck bed at the top of the ramp (m). */
export const TRUCK_BED_H = 1;

/** Challenge: three loading jobs, one star each, played in order. */
export type LoadingJob =
  | { kind: "ramp"; name: string; brief: string; m: number; h: number; maxF: number }
  | { kind: "pulley"; name: string; brief: string; m: number; maxEffortKg: number }
  | { kind: "motor"; name: string; brief: string; m: number; h: number; maxT: number; motors: number[] };

export const LOADING_JOBS: LoadingJob[] = [
  {
    kind: "ramp",
    name: "Motorbike onto a tempo",
    brief: "Push a 120 kg motorbike up a plank onto a tempo bed 1 m high. The wheels have a little friction, and you can pull at most 400 N.",
    m: 120,
    h: TRUCK_BED_H,
    maxF: 400,
  },
  {
    kind: "pulley",
    name: "Crate to the first floor",
    brief: "Lift a 200 kg crate of tiles with a pulley system. The pulleys have a little friction, and the worker can pull at most 60 kg-force (588 N).",
    m: 200,
    maxEffortKg: 60,
  },
  {
    kind: "motor",
    name: "Bricks to the roof",
    brief: "A 50 kg load of bricks must reach a 10 m roof in 20 s or less. The shop sells 150 W, 250 W, 400 W and 750 W motors. Pick the smallest motor that does the job.",
    m: 50,
    h: 10,
    maxT: 20,
    motors: [150, 250, 400, 750],
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "machine-builder",
  classNum: 9,
  book: "Exploration",
  chapter: "Work, Energy, and Simple Machines",
  title: "Pulleys, ramps and the work meter",
  intro: {
    objective:
      "Measure work with a work meter, build pulley systems, pull a cart up ramps with a spring balance and race two lifters to see how machines and power really work.",
    learn: [
      "Work W = F × d × cos θ can be positive, negative or zero",
      "Power is the rate of doing work: P = W ÷ t, in watts",
      "Pulleys: mechanical advantage = load ÷ effort, and you pull more rope",
      "A longer ramp needs a smaller force, but the work is the same mgh",
    ],
    realLife:
      "Pulling a bucket from a well, masons lifting cement on a building site, loading a motorbike onto a tempo, wheelchair ramps and the lift in your building all use these ideas.",
    minutes: 25,
  },
  hook: {
    title: "Loading day",
    text:
      "Outside a shop in your lane, two people push a heavy motorbike up a long plank into a tempo. Next door, a mason lifts a whole bag of cement to the roof by pulling a rope through a few pulleys. Neither is a superhero. Do machines give us free work, or is there a catch? Let's measure it.",
  },
  predict: {
    question: "You pull a cart onto a truck using a long, gentle ramp instead of a short, steep one. There is no friction. How does the work you do compare?",
    options: ["More work on the long ramp", "Less work on the long ramp", "The same work on both"],
    answer: 2,
  },
  tasks: [
    {
      id: "task:signs",
      title: "Plus, minus, zero",
      text: "In Work meter, try the actions and press Go each time. Get the meter to show positive work, negative work and zero work done by you.",
      found:
        "Lifting: your force and the motion are both up (θ = 0°), so W is positive. Lowering slowly: you still hold up, but the bag moves down (θ = 180°), so W is negative. Carrying level: your force is up and the motion is sideways (θ = 90°), so W = 0, even though your arms get tired.",
    },
    {
      id: "task:ma",
      title: "Two and four strands",
      text: "Switch to Pulleys. Lift a load with a system that has mechanical advantage 2, then with one that has mechanical advantage 4. Watch the effort and the rope you pull.",
      found:
        "With 2 strands holding the load, the effort was half the load, but you pulled 2 m of rope for each metre the load rose. With 4 strands, a quarter of the effort, but 4 times the rope. Effort × effort distance = load × load distance. The machine trades force for distance.",
    },
    {
      id: "task:friction",
      title: "Real pulleys",
      text: "Turn on small friction in Pulleys and lift the load again with any system of 2 or more pulleys. Compare the real MA with the ideal MA.",
      found:
        "With friction the effort went up a little, so the real MA (load ÷ effort) came out smaller than the number of strands. Effort × rope pulled was now a bit more than load × height. The extra work turned into heat in the pulleys.",
    },
    {
      id: "task:ramp",
      title: "Half the force, same work",
      text: "Switch to Ramp and keep friction off. Pull the cart up one ramp, then pull the same cart up a ramp long enough to halve the spring balance reading. Compare F × L each time.",
      found:
        "Doubling the ramp length halved the force, but the cart moved twice as far. F × L stayed equal to m g h each time. An inclined plane lets you use a smaller force over a longer distance. It does not reduce the work.",
    },
    {
      id: "task:power",
      title: "Who is more powerful?",
      text: "Switch to Power. Give the two lifters different times for the same load and press Race.",
      found:
        "Both lifters did the same work, m g h. The one who finished sooner did it at a faster rate, so its power P = W ÷ t was larger. 1 watt is 1 joule every second.",
    },
  ],
  discovery: {
    scientist: "Hero of Alexandria",
    years: "about 10–70 CE",
    fact: "This Greek engineer in Egypt wrote about the five simple machines: the lever, the wheel and axle, the pulley, the wedge and the screw. He also built the aeolipile, a ball spun by jets of steam, more than 1,600 years before steam engines.",
    formula: "MA = Load ÷ Effort",
    formulaNote: "Mechanical advantage: how many times a machine multiplies the force you put in.",
  },
  symbols: [
    { sym: "MA", meaning: "mechanical advantage: load ÷ effort" },
    { sym: "W", meaning: "work done, in joules (J)" },
    { sym: "F", meaning: "force, in newtons (N)" },
    { sym: "d", meaning: "distance moved, in m" },
    { sym: "θ", meaning: "theta, angle between the force and the motion" },
    { sym: "cos", meaning: "cosine of the angle, a calculator button; cos 0° = 1" },
    { sym: "P", meaning: "power, in watts (W)" },
    { sym: "t", meaning: "time, in s" },
    { sym: "m", meaning: "mass, in kg" },
    { sym: "g", meaning: "pull of gravity, 9.8 m/s²" },
    { sym: "h", meaning: "height raised, in m" },
    { sym: "L", meaning: "length of the ramp, in m" },
  ],
  ideas: [
    {
      title: "Work can be positive, negative or zero",
      text: "Work is done when a force moves an object. Only the part of the force along the motion counts. If the force and the motion point the same way, the work is positive. If they point opposite ways, it is negative (gravity on a rising ball, friction on a sliding box). If the force is at right angles to the motion, no work is done.",
      formula: "W = F × d × cos θ   (1 J = 1 N × 1 m)",
    },
    {
      title: "Power",
      text: "Power tells how fast work is done. A lift motor and a person on the stairs can do the same work, but the motor does it in less time, so it has more power. 1 kilowatt is 1000 W.",
      formula: "P = W ÷ t   (1 W = 1 J/s)",
    },
    {
      title: "Pulleys",
      text: "A single fixed pulley only changes the direction of the force (MA = 1). A movable pulley moves with the load and is held by 2 strands (MA = 2). A block and tackle joins fixed and movable pulleys, and the ideal MA equals the number of strands holding the load. You pull more rope for a smaller force. Friction makes the real MA a little less.",
      formula: "MA = Load ÷ Effort;   Effort × effort distance = Load × load distance (ideal)",
    },
    {
      title: "Inclined plane",
      text: "A ramp lets you raise a load with a force smaller than its weight. With no friction, the force along a ramp of length L up to height h is (m × g × h) ÷ L. A longer ramp means a gentler slope and a smaller force, but the work F × L is always m g h. Machines make work easier, not smaller.",
      formula: "F × L = m g h  (no friction);   MA = L ÷ h",
    },
  ],
  challenge: {
    title: "Three loading jobs",
    text: "Load a motorbike onto a tempo, lift a heavy crate with pulleys and pick a motor for the roof. Find a setup that works for each job. One star per job.",
  },
  quiz: [
    {
      q: "A porter at a railway station walks along the level platform with a suitcase on his head. How much work does he do on the suitcase against gravity?",
      options: ["Zero", "m × g × distance walked", "Negative work", "It depends on how fast he walks"],
      answer: 0,
      why: "His force on the suitcase is upward and the motion is level. The angle is 90°, and cos 90° = 0, so W = 0.",
    },
    {
      q: "You slowly lower a 10 kg bag through 1 m onto the floor. How much work do you do on the bag? (g = 9.8 m/s²)",
      options: ["+98 J", "−98 J", "0 J", "+9.8 J"],
      answer: 1,
      why: "You hold up with 98 N while the bag moves down 1 m. Force and motion are opposite (θ = 180°), so W = 98 × 1 × (−1) = −98 J.",
    },
    {
      q: "An ideal block and tackle has 4 strands holding an 800 N load. How much rope must you pull to lift the load by 0.5 m?",
      options: ["0.5 m", "1 m", "2 m", "4 m"],
      answer: 2,
      why: "Each of the 4 strands shortens by 0.5 m, so you pull 4 × 0.5 = 2 m. The effort is only 200 N, and 200 × 2 = 800 × 0.5 = 400 J.",
    },
    {
      q: "A 60 kg box is pulled up a smooth ramp 4 m long onto a platform 1.2 m high. What force is needed along the ramp? (g = 9.8 m/s²)",
      options: ["About 147 N", "About 176 N", "About 588 N", "About 706 N"],
      answer: 1,
      why: "F × L = m g h, so F = (60 × 9.8 × 1.2) ÷ 4 ≈ 176 N. That is much less than the 588 N weight.",
    },
    {
      q: "A 50 kg student runs up stairs 3 m high in 5 s. What is her power? (g = 9.8 m/s²)",
      options: ["30 W", "150 W", "294 W", "1470 W"],
      answer: 2,
      why: "W = m g h = 50 × 9.8 × 3 = 1470 J. P = W ÷ t = 1470 ÷ 5 = 294 W.",
    },
  ],
};
