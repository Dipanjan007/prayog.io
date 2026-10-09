/**
 * Class 9 · Exploration · "How Forces Affect Motion", second lab.
 * Covers the chapter's friction part (static friction up to a limit, kinetic friction while sliding,
 * rough and smooth surfaces, the effect of the weight pressing the surfaces together, rolling versus
 * sliding) measured with a spring balance, and uses Newton's second law on connected objects joined by
 * a string (a block pulled by a hanging mass over a pulley, and one block towing another): a = net force
 * ÷ total mass, and the string tension.
 * The first lab for this chapter (forces-motion.ts) covers inertia, F = ma on an air track, collisions
 * and recoil.
 * Recheck wording and section numbers against the NCERT chapter PDF whenever the book is revised.
 */
import type { LessonDef } from "./types";

export const LESSON_ID = "c9-friction-tension";

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "friction-fighter",
  classNum: 9,
  book: "Exploration",
  chapter: "How Forces Affect Motion",
  title: "Grip, slip and pull",
  intro: {
    objective:
      "Pull a wooden block across glass, wood and sandpaper with a spring balance, then join blocks with a string, to measure friction and tension and find the acceleration of connected objects.",
    learn: [
      "Static friction grows to match a push, up to a limit, and sliding friction is a little smaller",
      "Rough surfaces and more weight give more friction: friction = μ × N",
      "Rolling friction is much smaller than sliding friction",
      "Connected objects share one acceleration: a = net force ÷ total mass, and the string carries a tension",
    ],
    realLife:
      "Pushing a heavy almirah, bike brakes and tyres, wheels and ball bearings, a tractor towing a trolley and a tug of war all depend on friction and tension.",
    minutes: 30,
  },
  hook: {
    title: "The almirah that will not budge",
    text:
      "Try pushing a heavy steel almirah across the floor. At first nothing happens, however hard you push. Then suddenly it jerks forward, and keeping it moving feels a bit easier. A tractor towing a loaded trolley, a tug of war and the brakes on your bike all depend on the same two forces: friction, and the pull of a rope or string. Measure both with a spring balance.",
  },
  predict: {
    question:
      "A spring balance pulls a wooden block along a table. You pull harder and harder until the block slides, then keep it sliding at a steady speed. When is the reading biggest?",
    options: ["Just before the block starts to move", "While it slides at a steady speed", "It is the same all the time"],
    answer: 0,
  },
  tasks: [
    {
      id: "task:peak",
      title: "Stuck, then slipping",
      text: "In Pull mode, keep the bare block (no extra mass) on Wood, sliding (not on rollers). Tap Start pulling and watch the spring balance until the block slides at a steady speed.",
      found:
        "The reading climbed to 1.96 N while the block stayed still. Static friction grew to match your pull, up to a limit. Once the block slipped, the reading fell to about 1.47 N and stayed there while it slid at a steady speed. Steady speed means balanced forces, so that reading equals the sliding (kinetic) friction. The limit of static friction is bigger than sliding friction.",
    },
    {
      id: "task:surface",
      title: "Rough and smooth",
      text: "Keep the same load on the block and measure the steady sliding reading on Glass, Wood and Sandpaper.",
      found:
        "Glass gave the smallest reading and sandpaper the biggest, for the same block. Sliding friction was about 0.16, 0.30 and 0.65 times the block's weight. Rough surfaces have bigger bumps that catch on each other, so they give more friction.",
    },
    {
      id: "task:load",
      title: "Pile on the weight",
      text: "Pick one surface. Measure the steady sliding reading with one load, then stack a different mass on the block and measure again.",
      found:
        "More weight pressed the surfaces together harder, so friction grew. Double the total weight and the friction doubled. Friction ÷ weight stayed the same: that number is μ, the coefficient of friction. This is why a loaded almirah is much harder to push than an empty one.",
    },
    {
      id: "task:roll",
      title: "Put it on rollers",
      text: "Measure the sliding reading on a surface. Then tap Rollers (round pencils under the block) and pull again on the same surface with the same load.",
      found:
        "On rollers the pull needed was more than ten times smaller. Rolling friction is much smaller than sliding friction. That is why wheels, ball bearings and rollers under heavy machines make moving things so much easier.",
    },
    {
      id: "task:string",
      title: "Joined by a string",
      text: "Switch to String mode. Run the Pulley setup with a hanging mass big enough to move the block. Then run the Tow setup, where you pull one block and it tows another.",
      found:
        "Each time the whole system had one acceleration: a = net force ÷ total mass. In the pulley setup the tension was less than the hanging weight, because part of that weight was used to speed up the hanging mass itself. In the tow, the string pulled the back block just hard enough to give it the same acceleration as the front one, like a tractor towing a trolley.",
    },
  ],
  discovery: {
    scientist: "Guillaume Amontons",
    years: "1663–1705",
    fact: "Amontons lost most of his hearing as a teenager and became a French instrument maker. In 1699 he told the French Academy of Sciences that friction grows in step with the load pressing two surfaces together, and does not depend on how big the area of contact is. Leonardo da Vinci had noted similar rules in his notebooks about 200 years earlier, but never published them.",
    formula: "Friction = μ × N",
    formulaNote: "Friction equals the coefficient of friction μ (set by the two surfaces) times the normal force N pressing them together.",
  },
  symbols: [
    { sym: "μ", meaning: "mu, coefficient of friction: how grippy two surfaces are" },
    { sym: "μs, μk", meaning: "μ for when it is still (static), and when it slides (kinetic)" },
    { sym: "N", meaning: "normal force: how hard the surfaces press together, in newtons" },
    { sym: "m", meaning: "mass, in kg" },
    { sym: "g", meaning: "pull of gravity, 9.8 m/s²" },
    { sym: "a", meaning: "acceleration, in m/s²" },
    { sym: "T", meaning: "tension in the string, in N" },
    { sym: "mh", meaning: "the hanging mass, in kg" },
    { sym: "M", meaning: "the mass on the table, in kg" },
    { sym: "≤", meaning: "is less than or equal to" },
  ],
  ideas: [
    {
      title: "Static and sliding friction",
      text: "When you push something that is not moving, static friction pushes back just as hard, so nothing happens. It can only grow up to a limit. Push harder than that and the object slips. Once it slides, the friction is a little smaller. That is why an almirah is hardest to get started. If an object slides at a steady speed, the forces are balanced, so the pull equals the sliding friction.",
      formula: "Static friction ≤ μs × N    Sliding friction = μk × N",
    },
    {
      title: "What friction depends on",
      text: "Friction comes from tiny bumps on the two surfaces catching on each other. Rough surfaces like sandpaper give more friction than smooth ones like glass. Pressing the surfaces together harder, for example by stacking weight on top, also gives more friction. On a level table the normal force N equals the weight, m × g.",
      formula: "μ = friction ÷ N    N = m × g",
    },
    {
      title: "Rolling, and friction we need",
      text: "Rolling friction is much smaller than sliding friction, so we put heavy things on wheels and rollers. But friction is not always a nuisance. Bike brakes work by pressing rubber pads on the wheel so friction slows it down, and tyres need friction to grip the road. On a wet road there is less friction, so stopping takes longer.",
    },
    {
      title: "Tension and connected objects",
      text: "A tight string pulls on the objects at both ends with the same force, called tension. Objects joined by a tight string move together with one acceleration. Treat them as one body: add the forces along the motion to get the net force, and add the masses. To find the tension, look at just one object and use F = m × a on it. In a tug of war the rope pulls both teams equally hard. The team that wins pushes harder on the ground, getting more friction from it.",
      formula: "a = net force ÷ total mass    Hanging mass: T = mh × (g − a)",
    },
  ],
  challenge: {
    title: "Pulley puzzles",
    text: "Each round puts a block on a surface, joined over a pulley to a hanging mass. Pick the hanging mass that gives the target acceleration, within 0.1 m/s², then release. Use a = ((mh × g) − (μk × M × g)) ÷ (M + mh). One star per round.",
  },
  quiz: [
    {
      q: "A 60 kg almirah stands on a floor where μs = 0.5. What push is needed to just start it moving? (g = 9.8 m/s²)",
      options: ["30 N", "294 N", "588 N", "120 N"],
      answer: 1,
      why: "N = m × g = 60 × 9.8 = 588 N. The limit of static friction is μs × N = 0.5 × 588 = 294 N, so you must push a little more than that.",
    },
    {
      q: "A spring balance pulls a block so that it slides at a steady speed. The balance reads 3 N. What is the sliding friction?",
      options: ["Less than 3 N", "Exactly 3 N", "More than 3 N", "Zero"],
      answer: 1,
      why: "Steady speed means no acceleration, so the forces are balanced. The pull and the friction are equal: 3 N.",
    },
    {
      q: "A 2 kg block on a table (μk = 0.2) is joined over a pulley to a 1 kg hanging mass. What is the acceleration? (g = 9.8 m/s²)",
      options: ["0.98 m/s²", "1.96 m/s²", "2.94 m/s²", "3.27 m/s²"],
      answer: 1,
      why: "Net force = (1 × 9.8) − (0.2 × 2 × 9.8) = 9.8 − 3.92 = 5.88 N. Total mass = 3 kg, so a = 5.88 ÷ 3 = 1.96 m/s².",
    },
    {
      q: "A tractor tows a 1500 kg trolley with an acceleration of 0.5 m/s². Road friction on the trolley is 1500 N. What is the tension in the tow bar?",
      options: ["750 N", "1500 N", "2250 N", "4500 N"],
      answer: 2,
      why: "On the trolley alone: T − friction = m × a, so T = 1500 + 1500 × 0.5 = 1500 + 750 = 2250 N.",
    },
    {
      q: "In a tug of war the rope pulls both teams with the same tension. What decides which team wins?",
      options: [
        "The team with the longer piece of rope",
        "The team that pushes harder on the ground and gets more friction from it",
        "The team that pulls the rope harder, because tension is bigger at their end",
        "Nothing, it always ends in a draw",
      ],
      answer: 1,
      why: "A light rope has the same tension all along it. The winners are the team whose feet push harder on the ground, so the ground's friction on them is bigger than the rope's pull.",
    },
  ],
};
